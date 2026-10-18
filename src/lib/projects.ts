import { db } from "@/lib/db";
import { activities, projects as projectsTable } from "@/lib/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const PROJECTS_CACHE_TAG = "public-projects";

export type Project = {
    id: number;
    title: string;
    slug: string;
    syncKey: string | null;
    description: string;
    highlights: string[];
    live: string | null;
    github: string | null;
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
                live: projectsTable.live,
                github: projectsTable.github,
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

export type ProjectWithActivity = Project & { lastActivityAt: Date | null };

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
                live: projectsTable.live,
                github: projectsTable.github,
                enabled: projectsTable.enabled,
                sortOrder: projectsTable.sortOrder,
                updatedAt: projectsTable.updatedAt,
                lastActivityAt: sql<Date | null>`max(${activities.occurredAt})`,
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

export async function getProjectBySlug(slug: string): Promise<Project | null> {
    const [row] = await db
        .select({
            id: projectsTable.id,
            title: projectsTable.title,
            slug: projectsTable.slug,
            syncKey: projectsTable.syncKey,
            description: projectsTable.description,
            highlights: projectsTable.highlights,
            live: projectsTable.live,
            github: projectsTable.github,
            enabled: projectsTable.enabled,
            sortOrder: projectsTable.sortOrder,
            updatedAt: projectsTable.updatedAt,
        })
        .from(projectsTable)
        .where(eq(projectsTable.slug, slug))
        .limit(1);
    return row ?? null;
}
