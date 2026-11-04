import { db } from "@/lib/db";
import { aiChatLogs, type NewAiChatLog } from "@/lib/schema";
import { getClientIp } from "@/lib/ip";
import { parseDevice } from "@/lib/visitors";

export interface LogChatParams {
  channel?: "assistant" | "markas";
  headers: Headers;
  userPrompt: string;
  aiResponse?: string;
  path?: string | null;
  modelId?: string | null;
}

/**
 * Mencatat log percakapan dari Asisten AI atau Markas 3D ke database.
 * Menyimpan informasi IP pengunjung, detail perangkat (browser, OS, form factor),
 * geolokasi Vercel (negara, wilayah, kota), isi pesan prompt, dan respons model AI.
 */
export async function logChatMessage({
  channel = "assistant",
  headers,
  userPrompt,
  aiResponse,
  path,
  modelId,
}: LogChatParams): Promise<void> {
  try {
    const ip = getClientIp(headers);
    const ua = headers.get("user-agent") ?? "";
    const parsed = parseDevice(ua);

    const country =
      headers.get("x-vercel-ip-country") ??
      process.env.GEO_FALLBACK_COUNTRY ??
      null;
    const region = headers.get("x-vercel-ip-country-region") ?? null;
    const cityHeader = headers.get("x-vercel-ip-city");
    const city = cityHeader ? decodeURIComponent(cityHeader) : null;

    const newLog: NewAiChatLog = {
      channel,
      ip,
      device: parsed.device || "Desktop",
      browser: parsed.browser || "Unknown",
      os: parsed.os || "Unknown",
      formFactor: parsed.formFactor || "Desktop",
      country,
      region,
      city,
      userAgent: ua,
      userPrompt: userPrompt.trim(),
      aiResponse: aiResponse?.trim() || null,
      path: path || null,
      modelId: modelId || null,
    };

    await db.insert(aiChatLogs).values(newLog);
  } catch (error) {
    console.error("[chat-logger] Gagal mencatat log percakapan AI:", error);
  }
}
