import { db } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/ip";
import { safeQuery } from "@/lib/safe-query";
import { projectViews } from "@/lib/schema";
import { inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

async function getVisitorHash(): Promise<string> {
    const hdrs = await headers();
    return hashIp(getClientIp(hdrs));
}

export async function trackProjectView(projectId: number): Promise<void> {
    return safeQuery("trackProjectView", () => recordProjectView(projectId), undefined);
}

async function recordProjectView(projectId: number): Promise<void> {
    const ipHash = await getVisitorHash();
    await db.insert(projectViews).values({ projectId, ipHash }).onConflictDoNothing();
}

export async function getProjectViewCount(projectId: number): Promise<number> {
    return safeQuery("getProjectViewCount", () => loadProjectViewCount(projectId), 0);
}

async function loadProjectViewCount(projectId: number): Promise<number> {
    const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projectViews)
        .where(sql`${projectViews.projectId} = ${projectId}`);
    return row?.count ?? 0;
}

export async function getProjectViewCounts(
    projectIds: number[],
): Promise<Record<number, number>> {
    return safeQuery(
        "getProjectViewCounts",
        () => loadProjectViewCounts(projectIds),
        {},
    );
}

async function loadProjectViewCounts(
    projectIds: number[],
): Promise<Record<number, number>> {
    if (projectIds.length === 0) return {};
    const rows = await db
        .select({
            projectId: projectViews.projectId,
            count: sql<number>`count(*)::int`,
        })
        .from(projectViews)
        .where(inArray(projectViews.projectId, projectIds))
        .groupBy(projectViews.projectId);
    return Object.fromEntries(rows.map((row) => [row.projectId, row.count]));
}
