import { cache } from "react";

import { getPublicProjects } from "@/lib/projects";
import { source } from "@/lib/source";
import { toTimestamp } from "@/lib/date";

export type SearchEntry = {
    title: string;
    description: string;
    url: string;
    keywords: string;
};

export type SearchIndex = {
    posts: SearchEntry[];
    projects: SearchEntry[];
};

/**
 * Small, build-time-ish index for the command palette. Posts come from MDX
 * (English duplicates hidden), projects from the database. Never throws: a
 * missing database just yields an empty project list.
 */
export const getSearchIndex = cache(async (): Promise<SearchIndex> => {
    const posts = source
        .getPages()
        .filter((page) => page.data.lang !== "en")
        .sort((a, b) => toTimestamp(b.data.date) - toTimestamp(a.data.date))
        .map((page) => ({
            title: page.data.title,
            description: page.data.description ?? "",
            url: page.url,
            keywords: [page.data.category ?? "", ...(page.data.tags ?? [])]
                .filter(Boolean)
                .join(" "),
        }));

    let projects: SearchEntry[] = [];
    try {
        projects = (await getPublicProjects()).map((project) => ({
            title: project.title,
            description: project.description,
            url: `/projects/${project.slug}`,
            keywords: project.highlights.join(" "),
        }));
    } catch {
        projects = [];
    }

    return { posts, projects };
});
