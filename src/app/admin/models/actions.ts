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
 * Sinkronkan model dari API provider secara live dan simpan ke database.
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

    let syncedCount = 0;
    const cleanBase = provider.baseUrl.trim().replace(/\/+$/, "");

    if (provider.id === "cloudflare") {
      const apiKey =
        provider.apiKey ||
        process.env.CF_GATEWAY_API_KEY ||
        "er_live_dev_user_7b24ca112399adfa4388eac1";

      const modelsUrl = cleanBase.endsWith("/v1")
        ? `${cleanBase}/models`
        : `${cleanBase}/v1/models`;

      const response = await fetch(modelsUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(
          `Gagal menghubungi Cloudflare Gateway (${response.status}: ${response.statusText})`,
        );
      }

      const data = (await response.json()) as {
        data?: Array<{
          id: string;
          owned_by?: string;
          description?: string;
          pricing?: Record<string, unknown>;
          features?: string[];
        }>;
      };

      for (const m of data.data || []) {
        const isThinking = (m.features || []).some(
          (f) =>
            f.toLowerCase().includes("reasoning") ||
            f.toLowerCase().includes("thinking"),
        );
        const name = m.id.split("/").pop() || m.id;

        await db
          .insert(aiModels)
          .values({
            providerId: "cloudflare",
            modelId: m.id,
            name,
            family: m.owned_by || null,
            description: m.description || null,
            isThinkingSupported: isThinking,
            reasoningEffort: "medium",
            pricing: m.pricing || null,
            features: m.features || null,
            enabled: true,
            sortOrder: 0,
          })
          .onConflictDoUpdate({
            target: [aiModels.providerId, aiModels.modelId],
            set: {
              name,
              family: m.owned_by || null,
              description: m.description || null,
              isThinkingSupported: isThinking,
              pricing: m.pricing || null,
              features: m.features || null,
              updatedAt: new Date(),
            },
          });
        syncedCount += 1;
      }
    } else if (provider.id === "er-ai-rest") {
      // 1. Ambil model Antigravity Cloud
      const agyApiKey =
        provider.apiKey ||
        process.env.AGY_API_KEY ||
        process.env.LLM_API_KEY ||
        "sk-agy-cloud-only-token-8060";

      const agyRes = await fetch(`${cleanBase}/agy/v1/models`, {
        headers: { Authorization: `Bearer ${agyApiKey}` },
        signal: AbortSignal.timeout(10_000),
      }).catch((e) => {
        console.warn("Sync agy error:", e.message);
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

      // 2. Ambil model llama.cpp Local GGUF
      const llamaApiKey =
        process.env.LLAMA_API_KEY || "sk-llama-local-token-8060";

      const llamaRes = await fetch(`${cleanBase}/llama/v1/models`, {
        headers: { Authorization: `Bearer ${llamaApiKey}` },
        signal: AbortSignal.timeout(10_000),
      }).catch((e) => {
        console.warn("Sync llama error:", e.message);
        return null;
      });

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
      // Generic OpenAI provider
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
        error: parsed.error.issues[0]?.message || "Input tidak valid.",
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
      error: (err as Error).message || "Gagal membuat model.",
    };
  }
}

/**
 * Perbarui model yang ada (Update Model).
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
 * Simpan penugasan AI (Chat Bot / Blog Autopilot).
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
        error: parsed.error.issues[0]?.message || "Input tidak valid.",
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
