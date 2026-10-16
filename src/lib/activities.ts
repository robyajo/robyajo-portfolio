import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { activities } from "@/lib/schema";
import { safeQuery } from "@/lib/safe-query";
import type { ActivityIngest } from "@/lib/activities-schema";

export interface Activity {
    id: number;
    projectKey: string;
    projectName: string;
    kind: string;
    titleId: string;
    titleEn: string;
    bodyId: string | null;
    bodyEn: string | null;
    url: string | null;
    occurredAt: string;
}

function toActivity(row: typeof activities.$inferSelect): Activity {
    return {
        id: row.id,
        projectKey: row.projectKey,
        projectName: row.projectName,
        kind: row.kind,
        titleId: row.titleId,
        titleEn: row.titleEn,
        bodyId: row.bodyId,
        bodyEn: row.bodyEn,
        url: row.url,
        occurredAt: row.occurredAt.toISOString(),
    };
}

export async function getRecentActivities(limit = 6, projectKey?: string): Promise<Activity[]> {
    return safeQuery("getRecentActivities", async () => {
        const rows = await db
            .select()
            .from(activities)
            .where(projectKey ? eq(activities.projectKey, projectKey) : sql`TRUE`)
            .orderBy(desc(activities.occurredAt), desc(activities.id))
            .limit(Math.min(Math.max(limit, 1), 50));
        return rows.map(toActivity);
    }, []);
}

export async function getActivityCount(projectKey?: string): Promise<number> {
    return safeQuery("getActivityCount", async () => {
        const [row] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(activities)
            .where(projectKey ? eq(activities.projectKey, projectKey) : sql`TRUE`);
        return row?.count ?? 0;
    }, 0);
}

export async function insertActivity(
    projectKey: string,
    projectName: string,
    input: ActivityIngest,
): Promise<number> {
    const [row] = await db
        .insert(activities)
        .values({
            projectKey,
            projectName,
            kind: input.kind ?? "update",
            titleId: input.title.id,
            titleEn: input.title.en,
            bodyId: input.body?.id || null,
            bodyEn: input.body?.en || null,
            url: input.url || null,
            occurredAt: input.occurred_at ? new Date(input.occurred_at) : new Date(),
        })
        .returning({ id: activities.id });
    if (!row) throw new Error("Insert failed");
    return row.id;
}

export async function deleteActivity(id: number): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
}
