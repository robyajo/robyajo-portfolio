import { db } from "@/lib/db";
import { activities, projectViews, projects as projectsTable } from "@/lib/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export const PROJECTS_CACHE_TAG = "public-projects";

export type Project = {
    id: number;
    title: string;
    slug: string;
    syncKey: string | null;
    description: string;
    highlights: string[];
    problem: string | null;
    role: string | null;
    outcome: string | null;
    period: string | null;
    metrics: { label: string; value: string }[];
    gallery: string[];
    live: string | null;
    liveVisibility: string;
    github: string | null;
    repoVisibility: string;
    enabled: boolean;
    sortOrder: number;
    updatedAt: Date;
};

export const getPublicProjects = unstable_cache(
    async (): Promise<Project[]> => {
        return db
            .select({
                id: projectsTable.id,
                title: projectsTable.title,
                slug: projectsTable.slug,
                syncKey: projectsTable.syncKey,
                description: projectsTable.description,
                highlights: projectsTable.highlights,
                problem: projectsTable.problem,
                role: projectsTable.role,
                outcome: projectsTable.outcome,
                period: projectsTable.period,
                metrics: projectsTable.metrics,
                gallery: projectsTable.gallery,
                live: projectsTable.live,
                liveVisibility: projectsTable.liveVisibility,
                github: projectsTable.github,
                repoVisibility: projectsTable.repoVisibility,
                enabled: projectsTable.enabled,
                sortOrder: projectsTable.sortOrder,
                updatedAt: projectsTable.updatedAt,
            })
            .from(projectsTable)
            .where(eq(projectsTable.enabled, true))
            .orderBy(
                desc(projectsTable.updatedAt),
                asc(projectsTable.sortOrder),
                asc(projectsTable.id),
            );
    },
    ["public-projects"],
    { revalidate: 3600, tags: [PROJECTS_CACHE_TAG] },
);

export type ProjectWithActivity = Project & {
    lastActivityAt: Date | null;
    viewCount: number;
};

export const getPublicProjectsByActivity = unstable_cache(
    async (): Promise<ProjectWithActivity[]> => {
        const rows = await db
            .select({
                id: projectsTable.id,
                title: projectsTable.title,
                slug: projectsTable.slug,
                syncKey: projectsTable.syncKey,
                description: projectsTable.description,
                highlights: projectsTable.highlights,
                problem: projectsTable.problem,
                role: projectsTable.role,
                outcome: projectsTable.outcome,
                period: projectsTable.period,
                metrics: projectsTable.metrics,
                gallery: projectsTable.gallery,
                live: projectsTable.live,
                liveVisibility: projectsTable.liveVisibility,
                github: projectsTable.github,
                repoVisibility: projectsTable.repoVisibility,
                enabled: projectsTable.enabled,
                sortOrder: projectsTable.sortOrder,
                updatedAt: projectsTable.updatedAt,
                lastActivityAt: sql<Date | null>`max(${activities.occurredAt})`,
                viewCount: sql<number>`(select count(*)::int from ${projectViews} where ${projectViews.projectId} = ${projectsTable.id})`,
            })
            .from(projectsTable)
            .leftJoin(activities, eq(activities.projectKey, projectsTable.syncKey))
            .where(eq(projectsTable.enabled, true))
            .groupBy(projectsTable.id)
            .orderBy(
                desc(sql`max(${activities.occurredAt})`),
                asc(projectsTable.sortOrder),
                asc(projectsTable.id),
            );
        return rows;
    },
    ["public-projects-by-activity"],
    { revalidate: 3600, tags: [PROJECTS_CACHE_TAG] },
);

export const getProjectBySlug = cache(
    async (slug: string): Promise<Project | null> => {
    const [row] = await db
        .select({
            id: projectsTable.id,
            title: projectsTable.title,
            slug: projectsTable.slug,
            syncKey: projectsTable.syncKey,
            description: projectsTable.description,
            highlights: projectsTable.highlights,
            problem: projectsTable.problem,
            role: projectsTable.role,
            outcome: projectsTable.outcome,
            period: projectsTable.period,
            metrics: projectsTable.metrics,
            gallery: projectsTable.gallery,
            live: projectsTable.live,
            liveVisibility: projectsTable.liveVisibility,
            github: projectsTable.github,
                repoVisibility: projectsTable.repoVisibility,
            enabled: projectsTable.enabled,
            sortOrder: projectsTable.sortOrder,
            updatedAt: projectsTable.updatedAt,
        })
        .from(projectsTable)
        .where(eq(projectsTable.slug, slug))
        .limit(1);
    return row ?? null;
});
