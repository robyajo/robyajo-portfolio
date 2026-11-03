"use server";

import { db } from "@/lib/db";
import { aiModels, aiProviders, aiSettings } from "@/lib/schema";
import { assertAdmin } from "@/lib/assert-admin";
import {
  aiModelSchema,
  aiSettingSchema,
  type AiModelInput,
  type AiModelRow,
  type AiProviderInput,
  type AiProviderRow,
  type AiSettingInput,
  type AiSettingRow,
} from "@/lib/ai-schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface AiDashboardData {
  providers: AiProviderRow[];
  models: AiModelRow[];
  settings: Record<string, AiSettingRow>;
}

export interface RemoteModelItem {
  modelId: string;
  name: string;
  family?: string;
  description?: string;
  isThinkingSupported?: boolean;
  reasoningEffort?: "low" | "medium" | "high";
}

export async function getAiDashboardData(): Promise<AiDashboardData> {
  await assertAdmin();

  // Pastikan data awal provider terisi jika tabel masih kosong
  const existingProviders = await db.select().from(aiProviders);
  if (existingProviders.length === 0) {
    await seedDefaultProviders();
  }

  const providers = (await db
    .select()
    .from(aiProviders)
    .orderBy(asc(aiProviders.name))) as AiProviderRow[];

  const models = (await db
    .select()
    .from(aiModels)
    .orderBy(asc(aiModels.providerId), asc(aiModels.name))) as AiModelRow[];

  const settingsRows = (await db
    .select()
    .from(aiSettings)) as AiSettingRow[];

  const settings: Record<string, AiSettingRow> = {};
  for (const row of settingsRows) {
    settings[row.task] = row;
  }

  return { providers, models, settings };
}

async function seedDefaultProviders() {
  await db
    .insert(aiProviders)
    .values([
      {
        id: "cloudflare",
        name: "Cloudflare AI Gateway",
        baseUrl: "https://er-ai-gateway.duckdns.org/v1",
        apiKey:
          process.env.CF_GATEWAY_API_KEY ||
          "er_live_dev_user_7b24ca112399adfa4388eac1",
        description:
          "Cloudflare AI Gateway produksi dengan model GLM-4.7 Flash, Qwen 30B, GPT-OSS 20B, dan Gemma 26B.",
        enabled: true,
      },
      {
        id: "er-ai-rest",
        name: "AI Gateway Bersama (er-ai-rest)",
        baseUrl: "https://er-ai-api.mooo.com",
        apiKey:
          process.env.AGY_API_KEY ||
          process.env.LLM_API_KEY ||
          "sk-agy-cloud-only-token-8060",
        description:
          "Gateway Antigravity CLI (Cloud) & llama.cpp (Local GGUF) dengan model Gemini 3.8 Flash, Claude Sonnet 4.6, GPT-OSS 120B, dan Qwen 3.5.",
        enabled: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(aiSettings)
    .values([
      {
        task: "chat",
        providerId: "cloudflare",
        modelId: "@cf/zai-org/glm-4.7-flash",
        enableThinking: false,
        reasoningEffort: "medium",
        temperature: "0.7",
        maxTokens: 1024,
      },
      {
        task: "blog",
        providerId: "er-ai-rest",
        modelId: "gemini-3.8-flash-medium",
        enableThinking: false,
        reasoningEffort: "medium",
        temperature: "0.95",
        maxTokens: 8192,
      },
    ])
    .onConflictDoNothing();
}

/**
 * Sinkronkan seluruh model dari endpoint live provider (/models).
 */
export async function syncProviderModelsAction(
  providerId: string,
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    await assertAdmin();

    const [provider] = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, providerId))
      .limit(1);

    if (!provider) {
      return { success: false, error: "Provider tidak ditemukan." };
    }

    const cleanBase = provider.baseUrl.trim().replace(/\/+$/, "");
    let syncedCount = 0;

    if (provider.id === "cloudflare") {
      const modelsUrl = cleanBase.endsWith("/v1")
        ? `${cleanBase}/models`
        : cleanBase.endsWith("/chat/completions")
          ? cleanBase.replace(/\/chat\/completions$/, "/models")
          : `${cleanBase}/v1/models`;

      const apiKey =
        provider.apiKey ||
        process.env.CF_GATEWAY_API_KEY ||
        process.env.CHAT_LLM_API_KEY ||
        "er_live_dev_user_7b24ca112399adfa4388eac1";

      const res = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      }).catch((e) => {
        console.warn("Sync cloudflare error:", (e as Error).message);
        return null;
      });

      if (res && res.ok) {
        const json = (await res.json()) as {
          data?: Array<{
            id: string;
            name?: string;
            description?: string;
          }>;
        };

        for (const m of json.data || []) {
          const parts = m.id.split("/");
          const shortName = m.name || parts[parts.length - 1] || m.id;
          const family = parts.length > 2 ? parts[1] : "cloudflare";
          const isThinking =
            m.id.includes("qwen") || m.id.includes("thinking");

          await db
            .insert(aiModels)
            .values({
              providerId: "cloudflare",
              modelId: m.id,
              name: shortName,
              family,
              description:
                m.description || `Model ${shortName} dari Cloudflare AI Gateway`,
              isThinkingSupported: isThinking,
              reasoningEffort: "medium",
              enabled: true,
            })
            .onConflictDoUpdate({
              target: [aiModels.providerId, aiModels.modelId],
              set: {
                name: shortName,
                family,
                description:
                  m.description || `Model ${shortName} dari Cloudflare AI Gateway`,
                isThinkingSupported: isThinking,
                updatedAt: new Date(),
              },
            });
          syncedCount += 1;
        }
      }

      const fallbackCf = [
        {
          id: "@cf/zai-org/glm-4.7-flash",
          name: "GLM-4.7 Flash",
          family: "zai-org",
          description: "Model multibahasa dan coding berkecepatan tinggi.",
          isThinking: false,
        },
        {
          id: "@cf/qwen/qwen3-30b-a3b-fp8",
          name: "Qwen3 30B (A3B FP8)",
          family: "qwen",
          description: "MoE 30B, hanya 3B aktif/token. Mendukung reasoning dan function calling.",
          isThinking: true,
        },
        {
          id: "@cf/openai/gpt-oss-20b",
          name: "GPT-OSS 20B",
          family: "openai",
          description: "Model open-weights OpenAI untuk penalaran umum dan agen.",
          isThinking: false,
        },
        {
          id: "@cf/google/gemma-4-26b-a4b-it",
          name: "Gemma 4 26B IT",
          family: "google",
          description: "Model instruksi multimodal efisien dari Google.",
          isThinking: false,
        },
      ];

      for (const m of fallbackCf) {
        await db
          .insert(aiModels)
          .values({
            providerId: "cloudflare",
            modelId: m.id,
            name: m.name,
            family: m.family,
            description: m.description,
            isThinkingSupported: m.isThinking,
            reasoningEffort: "medium",
            enabled: true,
          })
          .onConflictDoUpdate({
            target: [aiModels.providerId, aiModels.modelId],
            set: {
              name: m.name,
              family: m.family,
              description: m.description,
              isThinkingSupported: m.isThinking,
              updatedAt: new Date(),
            },
          });
        syncedCount += 1;
      }
    } else if (provider.id === "er-ai-rest") {
      const agyApiKey =
        provider.apiKey ||
        process.env.AGY_API_KEY ||
        process.env.LLM_API_KEY ||
        "sk-agy-cloud-only-token-8060";

      const agyRes = await fetch(`${cleanBase}/agy/v1/models`, {
        headers: { Authorization: `Bearer ${agyApiKey}` },
        signal: AbortSignal.timeout(10_000),
      }).catch((e) => {
        console.warn("Sync agy error:", (e as Error).message);
        return null;
      });

      if (agyRes && agyRes.ok) {
        const agyData = (await agyRes.json()) as {
          data?: Array<{
            id: string;
            name?: string;
            description?: string;
          }>;
        };

        for (const m of agyData.data || []) {
          const isThinking =
            m.id.includes("thinking") ||
            m.id.includes("high") ||
            m.id.includes("medium");
          const family = m.id.startsWith("gemini")
            ? "gemini"
            : m.id.startsWith("claude")
              ? "claude"
              : "gpt-oss";

          await db
            .insert(aiModels)
            .values({
              providerId: "er-ai-rest",
              modelId: m.id,
              name: m.name || m.id,
              family,
              description: m.description || null,
              isThinkingSupported: isThinking,
              reasoningEffort: "medium",
              enabled: true,
            })
            .onConflictDoUpdate({
              target: [aiModels.providerId, aiModels.modelId],
              set: {
                name: m.name || m.id,
                family,
                description: m.description || null,
                isThinkingSupported: isThinking,
                updatedAt: new Date(),
              },
            });
          syncedCount += 1;
        }
      }

      const llamaApiKey =
        process.env.LLAMA_API_KEY ||
        process.env.LLM_API_KEY ||
        "sk-llama-local-token-8060";

      const llamaRes = await fetch(`${cleanBase}/llama/v1/models`, {
        headers: { Authorization: `Bearer ${llamaApiKey}` },
        signal: AbortSignal.timeout(5_000),
      }).catch(() => null);

      if (llamaRes && llamaRes.ok) {
        const llamaData = (await llamaRes.json()) as {
          data?: Array<{
            id: string;
            name?: string;
            description?: string;
          }>;
        };

        for (const m of llamaData.data || []) {
          await db
            .insert(aiModels)
            .values({
              providerId: "er-ai-rest",
              modelId: m.id,
              name: m.name || m.id,
              family: "llama.cpp",
              description: m.description || null,
              isThinkingSupported: false,
              reasoningEffort: "medium",
              enabled: true,
            })
            .onConflictDoUpdate({
              target: [aiModels.providerId, aiModels.modelId],
              set: {
                name: m.name || m.id,
                family: "llama.cpp",
                description: m.description || null,
                updatedAt: new Date(),
              },
            });
          syncedCount += 1;
        }
      }
    } else {
      const response = await fetch(`${cleanBase}/v1/models`, {
        headers: provider.apiKey
          ? { Authorization: `Bearer ${provider.apiKey}` }
          : {},
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          data?: Array<{ id: string; name?: string; description?: string }>;
        };
        for (const m of data.data || []) {
          await db
            .insert(aiModels)
            .values({
              providerId: provider.id,
              modelId: m.id,
              name: m.name || m.id,
              description: m.description || null,
              isThinkingSupported: false,
              reasoningEffort: "medium",
              enabled: true,
            })
            .onConflictDoUpdate({
              target: [aiModels.providerId, aiModels.modelId],
              set: {
                name: m.name || m.id,
                description: m.description || null,
                updatedAt: new Date(),
              },
            });
          syncedCount += 1;
        }
      }
    }

    revalidatePath("/admin/models");
    return { success: true, count: syncedCount };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Gagal menyinkronkan model.",
    };
  }
}

/**
 * Mengambil daftar model langsung dari API Gateway provider (live check),
 * untuk ditampilkan saat menambah model baru di admin panel.
 */
export async function getProviderRemoteModelsAction(
  providerId: string,
): Promise<{ success: boolean; data?: RemoteModelItem[]; error?: string }> {
  try {
    await assertAdmin();

    const [provider] = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.id, providerId))
      .limit(1);

    if (!provider) {
      return { success: false, error: "Provider tidak ditemukan." };
    }

    const cleanBase = provider.baseUrl.trim().replace(/\/+$/, "");
    const remoteModels: RemoteModelItem[] = [];

    if (provider.id === "cloudflare") {
      const modelsUrl = cleanBase.endsWith("/v1")
        ? `${cleanBase}/models`
        : cleanBase.endsWith("/chat/completions")
          ? cleanBase.replace(/\/chat\/completions$/, "/models")
          : `${cleanBase}/v1/models`;

      const apiKey =
        provider.apiKey ||
        process.env.CF_GATEWAY_API_KEY ||
        process.env.CHAT_LLM_API_KEY ||
        "er_live_dev_user_7b24ca112399adfa4388eac1";

      const res = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8_000),
      }).catch((e) => {
        console.warn("[Cloudflare models check error]:", (e as Error).message);
        return null;
      });

      if (res && res.ok) {
        const json = (await res.json()) as {
          data?: Array<{ id: string; name?: string; description?: string }>;
        };
        for (const m of json.data || []) {
          const parts = m.id.split("/");
          const shortName = m.name || parts[parts.length - 1] || m.id;
          const family = parts.length > 2 ? parts[1] : "cloudflare";
          const isThinking =
            m.id.includes("qwen") || m.id.includes("thinking");

          remoteModels.push({
            modelId: m.id,
            name: shortName,
            family,
            description:
              m.description || `Model ${shortName} dari Cloudflare AI Gateway`,
            isThinkingSupported: isThinking,
            reasoningEffort: "medium",
          });
        }
      }

      const fallbackCf: RemoteModelItem[] = [
        {
          modelId: "@cf/zai-org/glm-4.7-flash",
          name: "GLM-4.7 Flash",
          family: "zai-org",
          description: "Model multibahasa dan coding berkecepatan tinggi.",
          isThinkingSupported: false,
          reasoningEffort: "medium",
        },
        {
          modelId: "@cf/qwen/qwen3-30b-a3b-fp8",
          name: "Qwen3 30B (A3B FP8)",
          family: "qwen",
          description:
            "MoE 30B, hanya 3B aktif/token. Mendukung reasoning dan function calling.",
          isThinkingSupported: true,
          reasoningEffort: "medium",
        },
        {
          modelId: "@cf/openai/gpt-oss-20b",
          name: "GPT-OSS 20B",
          family: "openai",
          description:
            "Model open-weights OpenAI untuk penalaran umum dan agen.",
          isThinkingSupported: false,
          reasoningEffort: "medium",
        },
        {
          modelId: "@cf/google/gemma-4-26b-a4b-it",
          name: "Gemma 4 26B IT",
          family: "google",
          description: "Model instruksi multimodal efisien dari Google.",
          isThinkingSupported: false,
          reasoningEffort: "medium",
        },
      ];

      for (const fb of fallbackCf) {
        if (!remoteModels.some((m) => m.modelId === fb.modelId)) {
          remoteModels.push(fb);
        }
      }
    } else if (provider.id === "er-ai-rest") {
      const agyApiKey =
        provider.apiKey ||
        process.env.AGY_API_KEY ||
        process.env.LLM_API_KEY ||
        "sk-agy-cloud-only-token-8060";

      const agyRes = await fetch(`${cleanBase}/agy/v1/models`, {
        headers: { Authorization: `Bearer ${agyApiKey}` },
        signal: AbortSignal.timeout(8_000),
      }).catch((e) => {
        console.warn("[er-ai-rest agy check error]:", (e as Error).message);
        return null;
      });

      if (agyRes && agyRes.ok) {
        const agyData = (await agyRes.json()) as {
          data?: Array<{
            id: string;
            name?: string;
            description?: string;
          }>;
        };

        for (const m of agyData.data || []) {
          const isThinking =
            m.id.includes("thinking") ||
            m.id.includes("high") ||
            m.id.includes("medium");
          const family = m.id.startsWith("gemini")
            ? "gemini"
            : m.id.startsWith("claude")
              ? "claude"
              : "gpt-oss";

          remoteModels.push({
            modelId: m.id,
            name: m.name || m.id,
            family,
            description:
              m.description || `Model Antigravity Cloud: ${m.name || m.id}`,
            isThinkingSupported: isThinking,
            reasoningEffort: "medium",
          });
        }
      }

      const llamaApiKey =
        process.env.LLAMA_API_KEY ||
        process.env.LLM_API_KEY ||
        "sk-llama-local-token-8060";

      const llamaRes = await fetch(`${cleanBase}/llama/v1/models`, {
        headers: { Authorization: `Bearer ${llamaApiKey}` },
        signal: AbortSignal.timeout(5_000),
      }).catch(() => null);

      if (llamaRes && llamaRes.ok) {
        const llamaData = (await llamaRes.json()) as {
          data?: Array<{
            id: string;
            name?: string;
            description?: string;
          }>;
        };

        for (const m of llamaData.data || []) {
          if (!remoteModels.some((rm) => rm.modelId === m.id)) {
            remoteModels.push({
              modelId: m.id,
              name: m.name || m.id,
              family: "llama.cpp",
              description:
                m.description || `Model GGUF Lokal: ${m.name || m.id}`,
              isThinkingSupported: false,
              reasoningEffort: "medium",
            });
          }
        }
      }

      const fallbackEr: RemoteModelItem[] = [
        {
          modelId: "gemini-3.8-flash-high",
          name: "Gemini 3.8 Flash (High)",
          family: "gemini",
          description:
            "Google Gemini 3.8 Flash penalaran mendalam via Antigravity Cloud",
          isThinkingSupported: true,
          reasoningEffort: "high",
        },
        {
          modelId: "gemini-3.8-flash-medium",
          name: "Gemini 3.8 Flash (Medium)",
          family: "gemini",
          description:
            "Google Gemini 3.8 Flash penalaran seimbang untuk artikel harian",
          isThinkingSupported: true,
          reasoningEffort: "medium",
        },
        {
          modelId: "gemini-3.8-flash-low",
          name: "Gemini 3.8 Flash (Low)",
          family: "gemini",
          description: "Google Gemini 3.8 Flash cepat dan responsif",
          isThinkingSupported: false,
          reasoningEffort: "low",
        },
        {
          modelId: "claude-sonnet-4-6",
          name: "Claude Sonnet 4.6 (Thinking)",
          family: "claude",
          description:
            "Anthropic Claude Sonnet 4.6 dengan penalaran arsitektural",
          isThinkingSupported: true,
          reasoningEffort: "medium",
        },
        {
          modelId: "claude-opus-4-6-thinking",
          name: "Claude Opus 4.6 (Thinking)",
          family: "claude",
          description: "Anthropic Claude Opus 4.6 penalaran maksimal",
          isThinkingSupported: true,
          reasoningEffort: "high",
        },
        {
          modelId: "gpt-oss-120b-medium",
          name: "GPT-OSS 120B (Medium)",
          family: "gpt-oss",
          description: "Open-weight 120B instruction model",
          isThinkingSupported: false,
          reasoningEffort: "medium",
        },
        {
          modelId: "qwen3.5-0.8b",
          name: "Qwen 3.5 0.8B",
          family: "llama.cpp",
          description: "Model ringan lokal untuk percakapan dasar",
          isThinkingSupported: false,
          reasoningEffort: "low",
        },
      ];

      for (const fb of fallbackEr) {
        if (!remoteModels.some((m) => m.modelId === fb.modelId)) {
          remoteModels.push(fb);
        }
      }
    } else {
      const res = await fetch(`${cleanBase}/models`, {
        headers: provider.apiKey
          ? { Authorization: `Bearer ${provider.apiKey}` }
          : {},
        signal: AbortSignal.timeout(8_000),
      }).catch(() => null);

      if (res && res.ok) {
        const json = (await res.json()) as {
          data?: Array<{ id: string; name?: string; description?: string }>;
        };
        for (const m of json.data || []) {
          remoteModels.push({
            modelId: m.id,
            name: m.name || m.id,
            description: m.description,
            isThinkingSupported: false,
            reasoningEffort: "medium",
          });
        }
      }
    }

    return { success: true, data: remoteModels };
  } catch (err) {
    return {
      success: false,
      error:
        (err as Error).message ||
        "Gagal mengambil daftar model dari provider.",
    };
  }
}

/**
 * Buat model baru secara manual (Create Model).
 */
export async function createModelAction(
  data: AiModelInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    const parsed = aiModelSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Data model tidak valid.",
      };
    }

    await db.insert(aiModels).values({
      providerId: parsed.data.providerId,
      modelId: parsed.data.modelId,
      name: parsed.data.name,
      family: parsed.data.family || null,
      description: parsed.data.description || null,
      isThinkingSupported: parsed.data.isThinkingSupported,
      reasoningEffort: parsed.data.reasoningEffort,
      enabled: parsed.data.enabled,
    });

    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Gagal membuat model baru.",
    };
  }
}

/**
 * Perbarui model yang sudah ada (Update Model).
 */
export async function updateModelAction(
  id: number,
  data: Partial<AiModelInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    await db
      .update(aiModels)
      .set({
        name: data.name,
        modelId: data.modelId,
        providerId: data.providerId,
        family: data.family,
        description: data.description,
        isThinkingSupported: data.isThinkingSupported,
        reasoningEffort: data.reasoningEffort,
        enabled: data.enabled,
        updatedAt: new Date(),
      })
      .where(eq(aiModels.id, id));

    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Gagal memperbarui model.",
    };
  }
}

/**
 * Hapus model (Delete Model).
 */
export async function deleteModelAction(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    await db.delete(aiModels).where(eq(aiModels.id, id));

    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Gagal menghapus model.",
    };
  }
}

/**
 * Simpan penugasan model untuk tugas Chatbot atau Blog Autopilot.
 */
export async function saveTaskAssignmentAction(
  data: AiSettingInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    const parsed = aiSettingSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ||
          "Data pengaturan tugas tidak valid.",
      };
    }

    await db
      .insert(aiSettings)
      .values({
        task: parsed.data.task,
        providerId: parsed.data.providerId,
        modelId: parsed.data.modelId,
        enableThinking: parsed.data.enableThinking,
        reasoningEffort: parsed.data.reasoningEffort,
        temperature: parsed.data.temperature,
        maxTokens: parsed.data.maxTokens,
        systemPrompt: parsed.data.systemPrompt || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [aiSettings.task],
        set: {
          providerId: parsed.data.providerId,
          modelId: parsed.data.modelId,
          enableThinking: parsed.data.enableThinking,
          reasoningEffort: parsed.data.reasoningEffort,
          temperature: parsed.data.temperature,
          maxTokens: parsed.data.maxTokens,
          systemPrompt: parsed.data.systemPrompt || null,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Gagal menyimpan penugasan AI.",
    };
  }
}

/**
 * Perbarui konfigurasi provider.
 */
export async function updateProviderAction(
  id: string,
  data: Partial<AiProviderInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    await db
      .update(aiProviders)
      .set({
        name: data.name,
        baseUrl: data.baseUrl,
        apiKey: data.apiKey,
        description: data.description,
        enabled: data.enabled,
        updatedAt: new Date(),
      })
      .where(eq(aiProviders.id, id));

    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Gagal memperbarui provider.",
    };
  }
}
