"use server";

import { db } from "@/lib/db";
import {
    activities,
    blogCommentLikes,
    blogComments,
    blogPosts,
    blogReactions,
    blogReads,
    guestbookEntries,
    guestbookLikes,
    projectStacks,
    projects,
    syncProjects,
} from "@/lib/schema";
import { adminMutation } from "@/lib/admin-action";
import type { ActionResult } from "@/lib/action-result";
import { assertAdmin } from "@/lib/assert-admin";
import { slugifyTitle } from "@/lib/sync-keys";
import { resolveUser } from "@/lib/users";
import { PROJECTS_CACHE_TAG } from "@/lib/projects";
import { safeQuery } from "@/lib/safe-query";
import { projectInputSchema, type ProjectInput } from "@/lib/projects-schema";
import { stackInputSchema, stackSlug } from "@/lib/project-stacks-schema";
import { RESUME_CACHE_TAG } from "@/lib/resume";
import {
  getVisitorDetail as getVisitorDetailValue,
  getVisitorOverview as getVisitorOverviewValue,
  getVisitorRows as getVisitorRowsValue,
  getVisitorStats as getVisitorStatsValue,
  type VisitorDetail,
  type VisitorOverview,
  type VisitorRow,
  type VisitorStats,
} from "@/lib/visitors";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { GuestbookEntryWithMeta } from "@/app/(site)/guestbook/actions";
import type { CommentUser } from "@/app/(site)/blogs/[slug]/actions";

export interface AdminCommentRow {
    id: number;
    postSlug: string;
    parentId: number | null;
    body: string;
    isPinned: boolean;
    createdAt: string;
    likeCount: number;
    user: CommentUser;
}

const EMPTY_STATS = {
    guestbook: { total: 0, active: 0 },
    comments: { total: 0, active: 0 },
    reads: 0,
    reactions: 0,
};

export async function getAdminStats() {
    await assertAdmin();
    return safeQuery("getAdminStats", loadAdminStats, EMPTY_STATS);
}

async function loadAdminStats() {
    const [
        [guestbookTotal],
        [guestbookActive],
        [commentsTotal],
        [commentsActive],
        [reads],
        [reactions],
    ] = await Promise.all([
        db.select({ count: count() }).from(guestbookEntries),
        db.select({ count: count() }).from(guestbookEntries).where(eq(guestbookEntries.isDeleted, false)),
        db.select({ count: count() }).from(blogComments),
        db.select({ count: count() }).from(blogComments).where(eq(blogComments.isDeleted, false)),
        db.select({ count: count() }).from(blogReads),
        db.select({ count: count() }).from(blogReactions),
    ]);

    return {
        guestbook: { total: guestbookTotal?.count ?? 0, active: guestbookActive?.count ?? 0 },
        comments: { total: commentsTotal?.count ?? 0, active: commentsActive?.count ?? 0 },
        reads: reads?.count ?? 0,
        reactions: reactions?.count ?? 0,
    };
}

export async function refreshResume(): Promise<ActionResult> {
    return adminMutation("refresh resume", async () => {
        updateTag(RESUME_CACHE_TAG);
    });
}

export async function getAllAdminGuestbookEntries(): Promise<GuestbookEntryWithMeta[]> {
    await assertAdmin();
    return safeQuery("getAllAdminGuestbookEntries", loadAdminGuestbookEntries, []);
}

async function loadAdminGuestbookEntries(): Promise<GuestbookEntryWithMeta[]> {
    const rows = await db
        .select({
            id: guestbookEntries.id,
            userId: guestbookEntries.userId,
            authorName: guestbookEntries.authorName,
            authorImage: guestbookEntries.authorImage,
            message: guestbookEntries.message,
            isPinned: guestbookEntries.isPinned,
            createdAt: guestbookEntries.createdAt,
            likeCount: sql<number>`count(${guestbookLikes.entryId})::int`,
        })
        .from(guestbookEntries)
        .leftJoin(guestbookLikes, eq(guestbookEntries.id, guestbookLikes.entryId))
        .where(eq(guestbookEntries.isDeleted, false))
        .groupBy(guestbookEntries.id)
        .orderBy(desc(guestbookEntries.isPinned), desc(guestbookEntries.createdAt));

    if (rows.length === 0) return [];

    return rows.map((row) => ({
        id: row.id,
        message: row.message,
        isPinned: row.isPinned,
        createdAt: row.createdAt.toISOString(),
        likeCount: row.likeCount,
        likedByMe: false,
        user: resolveUser(row),
    }));
}

export async function getAllAdminComments(): Promise<AdminCommentRow[]> {
    await assertAdmin();
    return safeQuery("getAllAdminComments", loadAdminComments, []);
}

async function loadAdminComments(): Promise<AdminCommentRow[]> {
    const rows = await db
        .select({
            id: blogComments.id,
            postSlug: blogPosts.slug,
            parentId: blogComments.parentId,
            userId: blogComments.userId,
            authorName: blogComments.authorName,
            authorImage: blogComments.authorImage,
            body: blogComments.body,
            isPinned: blogComments.isPinned,
            createdAt: blogComments.createdAt,
            likeCount: sql<number>`count(${blogCommentLikes.commentId})::int`,
        })
        .from(blogComments)
        .leftJoin(blogPosts, eq(blogComments.postId, blogPosts.id))
        .leftJoin(blogCommentLikes, eq(blogComments.id, blogCommentLikes.commentId))
        .where(eq(blogComments.isDeleted, false))
        .groupBy(blogComments.id, blogPosts.slug)
        .orderBy(desc(blogComments.createdAt));

    if (rows.length === 0) return [];

    return rows.map((row) => ({
        id: row.id,
        postSlug: row.postSlug ?? "unknown",
        parentId: row.parentId,
        body: row.body,
        isPinned: row.isPinned,
        createdAt: row.createdAt.toISOString(),
        likeCount: row.likeCount,
        user: resolveUser(row),
    }));
}

export type { ProjectInput };

function revalidateProjects() {
    revalidatePath("/projects");
    revalidatePath("/");
    revalidatePath("/admin/projects");
    updateTag(PROJECTS_CACHE_TAG);
}

export type ProjectRow = {
    id: number;
    title: string;
    slug: string;
    syncKey: string | null;
    description: string;
    highlights: string[];
    live: string | null;
    liveVisibility: string;
    github: string | null;
    repoVisibility: string;
    enabled: boolean;
    sortOrder: number;
    activityCount: number;
    lastActivityAt: Date | null;
    viewCount: number;
};

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
    const clean = slugifyTitle(base) || "project";
    let candidate = clean;
    let n = 2;
    for (;;) {
        const [row] = await db
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.slug, candidate))
            .limit(1);
        if (!row || row.id === excludeId) return candidate;
        candidate = `${clean}-${n++}`;
    }
}

export async function getAdminProjects(): Promise<ProjectRow[]> {
    await assertAdmin();
    return safeQuery("getAdminProjects", loadAdminProjects, []);
}

export async function getAdminProject(id: number): Promise<ProjectRow | null> {
    await assertAdmin();
    const adminProjects = await safeQuery(
        "getAdminProject",
        loadAdminProjects,
        [],
    );
    return adminProjects.find((p) => p.id === id) ?? null;
}

async function loadAdminProjects(): Promise<ProjectRow[]> {
    const rows = await db
        .select({
            id: projects.id,
            title: projects.title,
            slug: projects.slug,
            syncKey: projects.syncKey,
            description: projects.description,
            highlights: projects.highlights,
            live: projects.live,
            liveVisibility: projects.liveVisibility,
            github: projects.github,
            repoVisibility: projects.repoVisibility,
            enabled: projects.enabled,
            sortOrder: projects.sortOrder,
            activityCount: sql<number>`count(${activities.id})::int`,
            viewCount: sql<number>`(select count(*)::int from project_views pv where pv.project_id = ${projects.id})`,
            lastActivityAt: sql<Date | null>`max(${activities.occurredAt})`,
        })
        .from(projects)
        .leftJoin(
            activities,
            sql`${activities.projectKey} = ${projects.syncKey}`,
        )
        .groupBy(projects.id)
        .orderBy(asc(projects.sortOrder), asc(projects.id));
    return rows;
}

export interface VisitorMonitor {
    stats: VisitorStats;
    rows: VisitorRow[];
}

async function loadVisitorMonitor(): Promise<VisitorMonitor> {
    const [stats, rows] = await Promise.all([
        getVisitorStatsValue(),
        getVisitorRowsValue(200),
    ]);
    return { stats, rows };
}

export async function getVisitorMonitor(): Promise<VisitorMonitor> {
    await assertAdmin();
    return safeQuery(
        "getVisitorMonitor",
        loadVisitorMonitor,
        { stats: { total: 0, today: 0, online: 0, views: 0, countries: 0 }, rows: [] },
    );
}

export async function getVisitor(id: string): Promise<VisitorDetail | null> {
    await assertAdmin();
    return safeQuery("getVisitorDetail", () => getVisitorDetailValue(id), null);
}

export async function getVisitorOverview(): Promise<VisitorOverview> {
    await assertAdmin();
    return safeQuery(
        "getVisitorOverview",
        getVisitorOverviewValue,
        {
            week: [],
            month: [],
            year: [],
            rankings: { countries: [], browsers: [], systems: [], forms: [] },
        },
    );
}

export async function createProject(raw: unknown): Promise<ActionResult> {
    return adminMutation("create project", async () => {
        const parsed = projectInputSchema.safeParse(raw);
        if (!parsed.success) {
            return parsed.error.issues[0]?.message ?? "Invalid project input.";
        }

        const [last] = await db
            .select({ max: sql<number>`coalesce(max(${projects.sortOrder}), -1)` })
            .from(projects);
        await db.insert(projects).values({
            ...parsed.data,
            slug: await uniqueSlug(parsed.data.slug || parsed.data.title),
            sortOrder: (last?.max ?? -1) + 1,
            enabled: true,
        });
    }, revalidateProjects);
}

export async function updateProject(
    id: number,
    raw: unknown,
): Promise<ActionResult> {
    return adminMutation("update project", async () => {
        const parsed = projectInputSchema.safeParse(raw);
        if (!parsed.success) {
            return parsed.error.issues[0]?.message ?? "Invalid project input.";
        }

        const slug = await uniqueSlug(parsed.data.slug || parsed.data.title, id);
        await db
            .update(projects)
            .set({ ...parsed.data, slug, updatedAt: new Date() })
            .where(eq(projects.id, id));
        revalidatePath(`/projects/${slug}`);
    }, revalidateProjects);
}

export async function toggleProjectEnabled(id: number): Promise<ActionResult> {
    return adminMutation("toggle project visibility", async () => {
        await db
            .update(projects)
            .set({ enabled: sql`NOT ${projects.enabled}`, updatedAt: new Date() })
            .where(eq(projects.id, id));
    }, revalidateProjects);
}

export async function deleteProject(id: number): Promise<ActionResult> {
    return adminMutation("delete project", async () => {
        await db.delete(projects).where(eq(projects.id, id));
    }, revalidateProjects);
}

export async function moveProject(
    id: number,
    direction: "up" | "down",
): Promise<ActionResult> {
    return adminMutation("reorder projects", async () => {
        const all = await db
            .select({ id: projects.id, sortOrder: projects.sortOrder })
            .from(projects)
            .orderBy(asc(projects.sortOrder), asc(projects.id));

        const index = all.findIndex((p) => p.id === id);
        if (index === -1) return "Project not found.";

        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= all.length) return;

        const current = all[index]!;
        const swap = all[swapIndex]!;
        await db
            .update(projects)
            .set({ sortOrder: swap.sortOrder, updatedAt: new Date() })
            .where(eq(projects.id, current.id));
        await db
            .update(projects)
            .set({ sortOrder: current.sortOrder, updatedAt: new Date() })
            .where(eq(projects.id, swap.id));
    }, revalidateProjects);
}

export async function getProjectActivities(
    syncKey: string,
): Promise<import("@/lib/activities").Activity[]> {
    await assertAdmin();
    const { getRecentActivities } = await import("@/lib/activities");
    return getRecentActivities(50, syncKey);
}

const manualActivitySchema = z.object({
    syncKey: z.string().min(1),
    kind: z.enum(["deploy", "feature", "fix", "update"]).optional().default("update"),
    titleId: z.string().trim().min(1).max(300),
    titleEn: z.string().trim().min(1).max(300),
    bodyId: z.string().trim().max(2000).optional().or(z.literal("")),
    bodyEn: z.string().trim().max(2000).optional().or(z.literal("")),
    url: z.string().trim().max(2048).optional().or(z.literal("")),
});

async function projectSlugForKey(
    syncKey: string,
): Promise<{ slug: string; name: string } | null> {
    const [proj] = await db
        .select({ slug: projects.slug, name: projects.title })
        .from(projects)
        .where(eq(projects.syncKey, syncKey))
        .limit(1);
    if (proj) return proj;
    const [sync] = await db
        .select({ name: syncProjects.name })
        .from(syncProjects)
        .where(eq(syncProjects.key, syncKey))
        .limit(1);
    if (sync) return { slug: "", name: sync.name };
    return null;
}

export async function createManualActivity(raw: unknown): Promise<ActionResult> {
    return adminMutation("create activity", async () => {
        const parsed = manualActivitySchema.safeParse(raw);
        if (!parsed.success) {
            return parsed.error.issues[0]?.message ?? "Invalid activity input.";
        }
        const target = await projectSlugForKey(parsed.data.syncKey);
        const { insertActivity } = await import("@/lib/activities");
        await insertActivity(parsed.data.syncKey, target?.name ?? parsed.data.syncKey, {
            kind: parsed.data.kind,
            title: { id: parsed.data.titleId, en: parsed.data.titleEn },
            body: { id: parsed.data.bodyId || "", en: parsed.data.bodyEn || "" },
            url: parsed.data.url || "",
        });
        if (target?.slug) revalidatePath(`/projects/${target.slug}`);
        revalidatePath("/projects");
    }, revalidateProjects);
}

export async function updateActivity(
    id: number,
    raw: unknown,
): Promise<ActionResult> {
    return adminMutation("update activity", async () => {
        const parsed = manualActivitySchema.omit({ syncKey: true }).safeParse(raw);
        if (!parsed.success) {
            return parsed.error.issues[0]?.message ?? "Invalid activity input.";
        }
        const [row] = await db
            .select({ projectKey: activities.projectKey })
            .from(activities)
            .where(eq(activities.id, id))
            .limit(1);
        if (!row) return "Activity not found.";
        await db
            .update(activities)
            .set({
                kind: parsed.data.kind ?? "update",
                titleId: parsed.data.titleId,
                titleEn: parsed.data.titleEn,
                bodyId: parsed.data.bodyId || null,
                bodyEn: parsed.data.bodyEn || null,
                url: parsed.data.url || null,
            })
            .where(eq(activities.id, id));
        const [proj] = await db
            .select({ slug: projects.slug })
            .from(projects)
            .where(eq(projects.syncKey, row.projectKey))
            .limit(1);
        if (proj) revalidatePath(`/projects/${proj.slug}`);
        revalidatePath("/projects");
    }, revalidateProjects);
}

export async function deleteActivityAction(id: number): Promise<ActionResult> {
    return adminMutation("delete activity", async () => {
        const [row] = await db
            .select({ projectKey: activities.projectKey })
            .from(activities)
            .where(eq(activities.id, id))
            .limit(1);
        if (!row) return "Activity not found.";
        const { deleteActivity } = await import("@/lib/activities");
        await deleteActivity(id);
        const [proj] = await db
            .select({ slug: projects.slug })
            .from(projects)
            .where(eq(projects.syncKey, row.projectKey))
            .limit(1);
        if (proj) revalidatePath(`/projects/${proj.slug}`);
        revalidatePath("/projects");
    }, revalidateProjects);
}

/* ================= Stack (teknologi kuasai) CRUD ================= */

export interface AdminStackRow {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    visible: boolean;
    /** Jumlah proyek yang memakai stack ini sebagai highlight. */
    usage: number;
}

function loadAdminStacks(): Promise<AdminStackRow[]> {
    return db
        .select({
            id: projectStacks.id,
            name: projectStacks.name,
            slug: projectStacks.slug,
            description: projectStacks.description,
            sortOrder: projectStacks.sortOrder,
            visible: projectStacks.visible,
            usage: sql<number>`(
                select count(*)
                from projects p
                where p.highlights @> array[${projectStacks.name}]::text[]
            )::int`,
        })
        .from(projectStacks)
        .orderBy(asc(projectStacks.sortOrder), asc(projectStacks.id));
}

export async function getAdminProjectStacks(): Promise<AdminStackRow[]> {
    await assertAdmin();
    return safeQuery("getAdminProjectStacks", loadAdminStacks, []);
}

export async function createProjectStack(
    raw: unknown,
): Promise<ActionResult> {
    return adminMutation("create stack", async () => {
        const parsed = stackInputSchema.safeParse(raw);
        if (!parsed.success) {
            return parsed.error.issues[0]?.message ?? "Invalid stack input.";
        }
        const data = parsed.data;
        const slug = stackSlug(data.name);
        const taken =
            (await db
                .select({ id: projectStacks.id })
                .from(projectStacks)
                .where(eq(projectStacks.name, data.name))
                .limit(1)).length > 0 ||
            (await db
                .select({ id: projectStacks.id })
                .from(projectStacks)
                .where(eq(projectStacks.slug, slug))
                .limit(1)).length > 0;
        if (taken) return `Stack "${data.name}" sudah ada.`;
        await db.insert(projectStacks).values({
            name: data.name,
            slug,
            description: data.description || null,
            sortOrder: data.sortOrder,
            visible: data.visible,
        });
    }, revalidateProjects);
}

export async function updateProjectStack(
    id: number,
    raw: unknown,
): Promise<ActionResult> {
    return adminMutation("update stack", async () => {
        const parsed = stackInputSchema.safeParse(raw);
        if (!parsed.success) {
            return parsed.error.issues[0]?.message ?? "Invalid stack input.";
        }
        const data = parsed.data;
        const slug = stackSlug(data.name);
        const clash = await db
            .select({ id: projectStacks.id })
            .from(projectStacks)
            .where(eq(projectStacks.slug, slug))
            .limit(1);
        if (clash[0] && clash[0].id !== id) {
            return `Stack "${data.name}" sudah ada.`;
        }
        await db
            .update(projectStacks)
            .set({
                name: data.name,
                slug,
                description: data.description || null,
                sortOrder: data.sortOrder,
                visible: data.visible,
                updatedAt: new Date(),
            })
            .where(eq(projectStacks.id, id));
    }, revalidateProjects);
}

export async function deleteProjectStack(id: number): Promise<ActionResult> {
    return adminMutation("delete stack", async () => {
        await db.delete(projectStacks).where(eq(projectStacks.id, id));
    }, revalidateProjects);
}
