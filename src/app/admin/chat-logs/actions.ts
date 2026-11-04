"use server";

import { db } from "@/lib/db";
import { aiChatLogs, type AiChatLog } from "@/lib/schema";
import { assertAdmin } from "@/lib/assert-admin";
import { desc, eq, sql, and, or, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ChatLogsFilter {
  page?: number;
  limit?: number;
  channel?: "all" | "assistant" | "markas";
  search?: string;
}

export interface ChatLogsResult {
  logs: AiChatLog[];
  total: number;
  totalPages: number;
  currentPage: number;
  stats: {
    total: number;
    uniqueIps: number;
    assistantCount: number;
    markasCount: number;
    todayCount: number;
  };
}

export async function getChatLogsAction(
  filter: ChatLogsFilter = {},
): Promise<ChatLogsResult> {
  await assertAdmin();

  const page = Math.max(1, filter.page ?? 1);
  const limit = Math.max(1, Math.min(100, filter.limit ?? 25));
  const offset = (page - 1) * limit;

  // Filter conditions
  const conditions = [];

  if (filter.channel && filter.channel !== "all") {
    conditions.push(eq(aiChatLogs.channel, filter.channel));
  }

  if (filter.search && filter.search.trim()) {
    const q = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(aiChatLogs.ip, q),
        ilike(aiChatLogs.userPrompt, q),
        ilike(aiChatLogs.aiResponse, q),
        ilike(aiChatLogs.provider, q),
        ilike(aiChatLogs.modelId, q),
        ilike(aiChatLogs.device, q),
        ilike(aiChatLogs.browser, q),
        ilike(aiChatLogs.os, q),
        ilike(aiChatLogs.city, q),
        ilike(aiChatLogs.country, q),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch paginated logs
  const logsQuery = db
    .select()
    .from(aiChatLogs)
    .where(whereClause)
    .orderBy(desc(aiChatLogs.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch total count for current filter
  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiChatLogs)
    .where(whereClause);

  // Fetch general stats
  const statsQuery = db
    .select({
      total: sql<number>`count(*)::int`,
      uniqueIps: sql<number>`count(distinct ${aiChatLogs.ip})::int`,
      assistantCount: sql<number>`count(*) filter (where ${aiChatLogs.channel} = 'assistant')::int`,
      markasCount: sql<number>`count(*) filter (where ${aiChatLogs.channel} = 'markas')::int`,
      todayCount: sql<number>`count(*) filter (where ${aiChatLogs.createdAt} >= date_trunc('day', now()))::int`,
    })
    .from(aiChatLogs);

  const [logs, countRes, statsRes] = await Promise.all([
    logsQuery,
    countQuery,
    statsQuery,
  ]);

  const total = countRes[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;
  const stats = statsRes[0] ?? {
    total: 0,
    uniqueIps: 0,
    assistantCount: 0,
    markasCount: 0,
    todayCount: 0,
  };

  return {
    logs,
    total,
    totalPages,
    currentPage: page,
    stats,
  };
}

export async function deleteChatLogAction(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    await db.delete(aiChatLogs).where(eq(aiChatLogs.id, id));
    revalidatePath("/admin/chat-logs");
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function clearAllChatLogsAction(): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
    await db.delete(aiChatLogs);
    revalidatePath("/admin/chat-logs");
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
