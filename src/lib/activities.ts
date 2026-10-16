import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { activities, projects, syncProjects } from "@/lib/schema";
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

export interface SyncProject {
    name: string;
    url: string | null;
    description: string | null;
    activityCount: number;
    lastActivityAt: string | null;
}

export async function getSyncProjects(): Promise<SyncProject[]> {
    return safeQuery("getSyncProjects", async () => {
        const rows = await db
            .select({
                name: syncProjects.name,
                url: syncProjects.url,
                description: syncProjects.description,
                lastActivityAt: syncProjects.lastActivityAt,
                activityCount: sql<number>`count(${activities.id})::int`,
            })
            .from(syncProjects)
            .leftJoin(
                activities,
                and(
                    eq(activities.projectKey, syncProjects.key),
                    eq(activities.projectName, syncProjects.name),
                ),
            )
            .groupBy(syncProjects.id)
            .orderBy(desc(syncProjects.lastActivityAt));
        return rows.map((r) => ({
            name: r.name,
            url: r.url,
            description: r.description,
            activityCount: r.activityCount,
            lastActivityAt: r.lastActivityAt?.toISOString() ?? null,
        }));
    }, []);
}

export interface IngestResult {
    id: number;
    project: string;
    createdProject: boolean;
    updated: boolean;
}

/**
 * Kunci valid bila ada di registry env ATAU sudah tercatat di database
 * (dibuat dari admin). Artinya menambah proyek tidak butuh ubah env/rebuild.
 */
export async function isValidProjectKey(key: string): Promise<boolean> {
    const { resolveProjectName } = await import("./activities-schema");
    if (resolveProjectName(process.env.ACTIVITY_PROJECT_KEYS, key)) return true;
    try {
        const [sync] = await db
            .select({ id: syncProjects.id })
            .from(syncProjects)
            .where(eq(syncProjects.key, key))
            .limit(1);
        if (sync) return true;
        const [proj] = await db
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.syncKey, key))
            .limit(1);
        return !!proj;
    } catch {
        return false;
    }
}

/**
 * Terima kegiatan: daftarkan proyek bila belum ada (cek by kunci + nama,
 * sehingga SATU kunci bisa menaungi banyak proyek tanpa ubah env/rebuild),
 * update progres + konten bila source sudah pernah dikirim.
 */
export async function ingestActivity(
    projectKey: string,
    fallbackName: string | null,
    input: ActivityIngest,
): Promise<IngestResult> {
    const payloadName = input.project?.name?.trim() || null;
    const conditions = payloadName
        ? sql`${syncProjects.key} = ${projectKey} AND ${syncProjects.name} = ${payloadName}`
        : eq(syncProjects.key, projectKey);
    const [existing] = await db
        .select({ id: syncProjects.id, name: syncProjects.name })
        .from(syncProjects)
        .where(conditions)
        .limit(1);
    let projectName: string;
    let createdProject = false;
    if (!existing) {
        projectName = payloadName ?? fallbackName ?? projectKey;
        await db.insert(syncProjects).values({
            key: projectKey,
            name: projectName,
            url: input.project?.url || null,
            description: input.project?.description || null,
            lastActivityAt: new Date(),
        });
        createdProject = true;
    } else {
        projectName = existing.name;
        await db
            .update(syncProjects)
            .set({
                ...(input.project?.url !== undefined
                    ? { url: input.project.url || null }
                    : {}),
                ...(input.project?.description !== undefined
                    ? { description: input.project.description || null }
                    : {}),
                lastActivityAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(syncProjects.id, existing.id));
    }

    const occurredAt = input.occurred_at ? new Date(input.occurred_at) : new Date();
    const values = {
        projectKey,
        projectName,
        kind: input.kind ?? "update",
        titleId: input.title.id,
        titleEn: input.title.en,
        bodyId: input.body?.id || null,
        bodyEn: input.body?.en || null,
        url: input.url || null,
        occurredAt,
    };

    if (input.source) {
        const [row] = await db
            .select({ id: activities.id })
            .from(activities)
            .where(sql`${activities.projectKey} = ${projectKey} AND ${activities.externalId} = ${input.source}`)
            .limit(1);
        if (row) {
            await db.update(activities).set(values).where(eq(activities.id, row.id));
            return { id: row.id, project: projectName, createdProject, updated: true };
        }
        const [inserted] = await db
            .insert(activities)
            .values({ ...values, externalId: input.source })
            .returning({ id: activities.id });
        if (!inserted) throw new Error("Insert failed");
        return { id: inserted.id, project: projectName, createdProject, updated: false };
    }

    const [inserted] = await db
        .insert(activities)
        .values(values)
        .returning({ id: activities.id });
    if (!inserted) throw new Error("Insert failed");
    return { id: inserted.id, project: projectName, createdProject, updated: false };
}

export async function insertActivity(
    projectKey: string,
    projectName: string,
    input: ActivityIngest,
): Promise<number> {
    const result = await ingestActivity(projectKey, projectName, input);
    return result.id;
}

export async function deleteActivity(id: number): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
}
