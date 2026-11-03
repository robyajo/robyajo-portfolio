import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiProviders, aiModels } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { assertAdmin } from "@/lib/assert-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await assertAdmin();

    const body = await req.json();
    const {
      providerId,
      modelId,
      message = "Halo! Perkenalkan dirimu secara singkat dan sebutkan model apa yang sedang kamu jalankan.",
      temperature = 0.7,
      maxTokens = 1024,
      enableThinking = false,
      reasoningEffort = "medium",
    } = body;

    if (!providerId || !modelId) {
      return NextResponse.json(
        { error: "providerId dan modelId wajib diisi." },
        { status: 400 },
      );
    }

    const [provider] = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, providerId))
      .limit(1);

    if (!provider) {
      return NextResponse.json(
        { error: `Provider '${providerId}' tidak ditemukan.` },
        { status: 404 },
      );
    }

    const cleanBase = provider.baseUrl.trim().replace(/\/+$/, "");
    let endpointUrl = "";
    let apiKey = provider.apiKey?.trim() || "";

    if (provider.id === "cloudflare") {
      endpointUrl = cleanBase.endsWith("/chat/completions")
        ? cleanBase
        : cleanBase.endsWith("/v1")
          ? `${cleanBase}/chat/completions`
          : `${cleanBase}/v1/chat/completions`;

      if (!apiKey) {
        apiKey =
          process.env.CF_GATEWAY_API_KEY ||
          process.env.CHAT_LLM_API_KEY ||
          "er_live_dev_user_7b24ca112399adfa4388eac1";
      }
    } else if (provider.id === "er-ai-rest") {
      const modelLower = modelId.toLowerCase();
      const isCloudModel =
        modelLower.startsWith("gemini") ||
        modelLower.startsWith("claude") ||
        modelLower.startsWith("gpt-oss");

      if (isCloudModel) {
        endpointUrl = `${cleanBase}/agy/v1/chat/completions`;
        if (!apiKey) {
          apiKey =
            process.env.AGY_API_KEY ||
            process.env.LLM_API_KEY ||
            process.env.CHAT_LLM_API_KEY ||
            "sk-agy-cloud-only-token-8060";
        }
      } else {
        endpointUrl = `${cleanBase}/llama/v1/chat/completions`;
        if (!apiKey) {
          apiKey =
            process.env.LLAMA_API_KEY ||
            process.env.LLM_API_KEY ||
            "sk-llama-local-token-8060";
        }
      }
    } else {
      endpointUrl = cleanBase.endsWith("/chat/completions")
        ? cleanBase
        : `${cleanBase}/v1/chat/completions`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const startTime = Date.now();
    const upstreamRes = await fetch(endpointUrl, {
      method: "POST",
      headers,
      signal: req.signal,
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: message }],
        stream: true,
        temperature: Number(temperature) || 0.7,
        max_tokens: Number(maxTokens) || 1024,
        enable_thinking: Boolean(enableThinking),
        thinking: Boolean(enableThinking),
        reasoning_effort: reasoningEffort || "medium",
      }),
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      const errorText = await upstreamRes.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          error: `HTTP ${upstreamRes.status}: Gagal memanggil endpoint model gateway.`,
          status: upstreamRes.status,
          detail: errorText,
          endpointUrl,
          modelId,
        },
        { status: upstreamRes.status || 502 },
      );
    }

    const reader = upstreamRes.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;

              if (trimmed.startsWith("data: ")) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  if (data.error) {
                    controller.enqueue(
                      encoder.encode(
                        `\n[Error dari upstream: ${data.error.message || JSON.stringify(data.error)}]`,
                      ),
                    );
                    continue;
                  }

                  const textDelta =
                    data.choices?.[0]?.delta?.content ||
                    data.choices?.[0]?.delta?.reasoning_content;

                  if (textDelta) {
                    controller.enqueue(encoder.encode(textDelta));
                  }
                } catch {
                  // lewati chunk tidak valid
                }
              }
            }
          }
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            controller.enqueue(
              encoder.encode(
                `\n[Stream terputus: ${(err as Error).message}]`,
              ),
            );
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Response-Time-Ms": `${Date.now() - startTime}`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
