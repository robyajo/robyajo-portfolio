import { db } from "@/lib/db";
import { aiModels, aiProviders, aiSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { AiModelRow, AiProviderRow, AiSettingRow } from "@/lib/ai-schema";

export interface ResolvedAiConfig {
  task: "chat" | "blog";
  providerId: string;
  providerName: string;
  modelId: string;
  endpointUrl: string;
  apiKey: string;
  enableThinking: boolean;
  reasoningEffort: string;
  temperature: number;
  maxTokens: number;
  isDbDriven: boolean;
}

/**
 * Resolves the active AI configuration for a given task ('chat' or 'blog').
 * Priority: Database (ai_settings + ai_providers) -> Environment variables fallback.
 */
export async function getActiveAiConfig(
  task: "chat" | "blog",
): Promise<ResolvedAiConfig> {
  if (process.env.DATABASE_URL) {
    try {
      const [setting] = await db
        .select()
        .from(aiSettings)
        .where(eq(aiSettings.task, task))
        .limit(1);

      if (setting) {
        const [provider] = await db
          .select()
          .from(aiProviders)
          .where(eq(aiProviders.id, setting.providerId))
          .limit(1);

        if (provider && provider.enabled) {
          return resolveEndpoint(task, setting, provider);
        }
      }
    } catch (err) {
      console.warn(
        `[ai-config] Gagal membaca konfigurasi AI dari DB untuk task '${task}':`,
        (err as Error).message,
      );
    }
  }

  // Fallback to process.env
  return getEnvFallback(task);
}

/**
 * Resolves a secondary/fallback provider config when the primary provider encounters
 * network outages or 502/503 errors.
 */
export async function getFallbackAiConfig(
  primaryConfig: ResolvedAiConfig,
): Promise<ResolvedAiConfig | null> {
  const targetProviderId =
    primaryConfig.providerId === "cloudflare" ? "er-ai-rest" : "cloudflare";

  if (process.env.DATABASE_URL) {
    try {
      const [provider] = await db
        .select()
        .from(aiProviders)
        .where(eq(aiProviders.id, targetProviderId))
        .limit(1);

      if (provider && provider.enabled) {
        const [model] = await db
          .select()
          .from(aiModels)
          .where(eq(aiModels.providerId, targetProviderId))
          .limit(1);

        const modelId =
          model?.modelId ||
          (targetProviderId === "cloudflare"
            ? "@cf/zai-org/glm-4.7-flash"
            : "gemini-3.8-flash-medium");

        const mockSetting = {
          task: primaryConfig.task,
          providerId: targetProviderId,
          modelId,
          enableThinking: false,
          reasoningEffort: "medium",
          temperature: primaryConfig.temperature.toString(),
          maxTokens: primaryConfig.maxTokens,
          systemPrompt: null,
          updatedAt: new Date(),
        };

        return resolveEndpoint(primaryConfig.task, mockSetting, provider);
      }
    } catch {
      // Ignore DB error, proceed to env fallback
    }
  }

  if (targetProviderId === "cloudflare") {
    const cf = getEnvFallback("chat");
    return {
      ...cf,
      task: primaryConfig.task,
      temperature: primaryConfig.temperature,
      maxTokens: primaryConfig.maxTokens,
    };
  } else {
    const er = getEnvFallback("blog");
    return {
      ...er,
      task: primaryConfig.task,
      temperature: primaryConfig.temperature,
      maxTokens: primaryConfig.maxTokens,
    };
  }
}

function resolveEndpoint(
  task: "chat" | "blog",
  setting: typeof aiSettings.$inferSelect,
  provider: typeof aiProviders.$inferSelect,
): ResolvedAiConfig {
  const cleanBase = provider.baseUrl.trim().replace(/\/+$/, "");
  let endpointUrl = "";
  let apiKey = provider.apiKey?.trim() || "";

  if (provider.id === "cloudflare") {
    // Cloudflare AI Gateway OpenAI-compatible endpoint
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
    // AI Gateway Bersama (er-ai-rest)
    // Cek jenis model untuk routing prefix /agy atau /llama bila diperlukan
    const modelLower = setting.modelId.toLowerCase();
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
      // Local llama.cpp model
      endpointUrl = `${cleanBase}/llama/v1/chat/completions`;
      if (!apiKey) {
        apiKey =
          process.env.LLAMA_API_KEY ||
          process.env.LLM_API_KEY ||
          "sk-llama-local-token-8060";
      }
    }
  } else {
    // Generic OpenAI compatible
    endpointUrl = cleanBase.endsWith("/chat/completions")
      ? cleanBase
      : `${cleanBase}/v1/chat/completions`;
  }

  return {
    task,
    providerId: provider.id,
    providerName: provider.name,
    modelId: setting.modelId,
    endpointUrl,
    apiKey,
    enableThinking: setting.enableThinking,
    reasoningEffort: setting.reasoningEffort || "medium",
    temperature:
      Number.parseFloat(setting.temperature) || (task === "blog" ? 0.95 : 0.7),
    maxTokens: setting.maxTokens || (task === "blog" ? 8192 : 1024),
    isDbDriven: true,
  };
}

function getEnvFallback(task: "chat" | "blog"): ResolvedAiConfig {
  if (task === "chat") {
    const cfUrl =
      process.env.CF_GATEWAY_URL ||
      process.env.LLM_API_URL ||
      "https://er-ai-gateway.duckdns.org/v1/chat/completions";

    const apiKey =
      process.env.CF_GATEWAY_API_KEY ||
      process.env.CHAT_LLM_API_KEY ||
      process.env.LLAMA_API_KEY ||
      "er_live_dev_user_7b24ca112399adfa4388eac1";

    const modelId =
      process.env.CF_GATEWAY_MODEL ||
      process.env.CHAT_LLM_MODEL ||
      process.env.LLM_MODEL ||
      "@cf/zai-org/glm-4.7-flash";

    const enableThinking = process.env.CF_GATEWAY_ENABLE_THINKING === "true";
    const reasoningEffort = process.env.CF_GATEWAY_REASONING_EFFORT || "medium";

    return {
      task: "chat",
      providerId: "cloudflare",
      providerName: "Cloudflare AI Gateway (Fallback)",
      modelId,
      endpointUrl: cfUrl,
      apiKey,
      enableThinking,
      reasoningEffort,
      temperature: 0.7,
      maxTokens: 1024,
      isDbDriven: false,
    };
  }

  // Task: blog
  const rawBase =
    process.env.AGY_BASE_URL ||
    process.env.LLM_BASE_URL ||
    "https://er-ai-api.mooo.com";
  const cleaned = rawBase.trim().replace(/\/+$/, "");
  const endpointUrl = cleaned.endsWith("/agy/v1")
    ? `${cleaned}/chat/completions`
    : `${cleaned}/agy/v1/chat/completions`;

  const apiKey =
    process.env.AGY_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.GEMINI_API_KEY ||
    "sk-agy-cloud-only-token-8060";

  const modelId =
    process.env.BLOG_LLM_MODEL ||
    process.env.LLM_MODELS?.split(",")[0]?.trim() ||
    "gemini-3.8-flash-medium";

  return {
    task: "blog",
    providerId: "er-ai-rest",
    providerName: "AI Gateway Bersama (Fallback)",
    modelId,
    endpointUrl,
    apiKey,
    enableThinking: false,
    reasoningEffort: "medium",
    temperature: 0.95,
    maxTokens: 8192,
    isDbDriven: false,
  };
}

export interface ConfiguredMarkasAgent {
  id: string;
  name: string;
  role: string;
  badge: string;
  icon: string;
  model: string;
  provider: string;
  specialty: string;
  defaultTask: string;
}

const DEFAULT_AGENTS_LIST: ConfiguredMarkasAgent[] = [
  {
    id: "roby",
    name: "Roby Karti S.",
    role: "Pimpinan & Lead Architect",
    badge: "PIMPINAN",
    icon: "👨‍💻",
    model: "@cf/zai-org/glm-4.7-flash",
    provider: "Cloudflare AI Gateway",
    specialty: "Fullstack, Cloud Architecture & Direction",
    defaultTask: "Pimpinan Roby mengarahkan koordinasi arsitektur sistem",
  },
  {
    id: "buruang",
    name: "Buruang",
    role: "Kepala Proyek",
    badge: "PROJECT LEAD",
    icon: "📋",
    model: "@cf/qwen/qwen3-30b-a3b-fp8",
    provider: "Cloudflare AI Gateway",
    specialty: "Quality Control, Audit 25+ Proyek & Milestones",
    defaultTask: "Buruang memeriksa seluruh kelaikan proyek portofolio",
  },
  {
    id: "koncek",
    name: "Koncek",
    role: "Backend Specialist",
    badge: "BACKEND",
    icon: "🐹",
    model: "@cf/zai-org/glm-4.7-flash",
    provider: "Cloudflare AI Gateway",
    specialty: "Golang, PostgreSQL, Redis, REST & gRPC",
    defaultTask: "Koncek mengoptimalkan backend API & database pool",
  },
  {
    id: "biawak",
    name: "Biawak",
    role: "Frontend Specialist",
    badge: "FRONTEND",
    icon: "🦎",
    model: "@cf/zai-org/glm-4.7-flash",
    provider: "Cloudflare AI Gateway",
    specialty: "Next.js, React, Tailwind CSS, 3D WebGL",
    defaultTask: "Biawak memoles tampilan UI responsif dan animasi 3D",
  },
  {
    id: "bonta",
    name: "Bonta",
    role: "Security Specialist",
    badge: "SECURITY",
    icon: "🛡️",
    model: "@cf/qwen/qwen3-30b-a3b-fp8",
    provider: "Cloudflare AI Gateway",
    specialty: "WAF, OWASP Hardening, Anti-DDoS, SSL",
    defaultTask: "Bonta mengaudit keamanan WAF dan rate limiting",
  },
  {
    id: "bala",
    name: "Bala",
    role: "Support Specialist",
    badge: "SUPPORT",
    icon: "🎧",
    model: "@cf/zai-org/glm-4.7-flash",
    provider: "Cloudflare AI Gateway",
    specialty: "Customer Care, Uptime VPS, Ticketing Inbox",
    defaultTask: "Bala memantau uptime dan menangani tiket bantuan",
  },
];

export async function getMarkasAgentsConfig(): Promise<ConfiguredMarkasAgent[]> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_AGENTS_LIST;
  }

  try {
    const settings = await db.select().from(aiSettings);
    const settingsMap = new Map<string, typeof settings[0]>();
    settings.forEach((s) => settingsMap.set(s.task, s));

    return DEFAULT_AGENTS_LIST.map((agent) => {
      const dbSetting = settingsMap.get("markas_" + agent.id);
      if (!dbSetting) return agent;

      let meta: any = {};
      if (dbSetting.systemPrompt) {
        try {
          if (dbSetting.systemPrompt.startsWith("{")) {
            meta = JSON.parse(dbSetting.systemPrompt);
          }
        } catch {}
      }

      return {
        ...agent,
        name: meta.name || agent.name,
        role: meta.role || agent.role,
        badge: meta.badge || agent.badge,
        specialty: meta.specialty || agent.specialty,
        defaultTask: meta.defaultTask || agent.defaultTask,
        model: dbSetting.modelId || agent.model,
        provider: dbSetting.providerId || agent.provider,
      };
    });
  } catch (err) {
    console.warn("[ai-config] Gagal membaca konfigurasi agen markas:", (err as Error).message);
    return DEFAULT_AGENTS_LIST;
  }
}
