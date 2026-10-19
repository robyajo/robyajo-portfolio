import { siteConfig } from "@/lib/config";
import { source } from "@/lib/source";
import { getPublicProjects } from "@/lib/projects";
import type { MetadataRoute } from "next";
import { toISOString } from "@/lib/date";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const blogPages = source.getPages().map((page) => {
        const sibling = page.data.translation
            ? source.getPage([page.data.translation])
            : undefined;
        const languages: Record<string, string> = {};

        if (page.data.lang && sibling?.data.lang) {
            languages[page.data.lang] = `${siteConfig.baseUrl}${page.url}`;
            languages[sibling.data.lang] = `${siteConfig.baseUrl}${sibling.url}`;
            languages["x-default"] = languages.id ?? languages.en;
        }

        return {
            url: `${siteConfig.baseUrl}${page.url}`,
            lastModified: page.data.lastModified
                ? toISOString(page.data.lastModified)
                : page.data.date
                    ? toISOString(page.data.date)
                    : now,
            changeFrequency: "monthly" as const,
            priority: 0.7,
            ...(Object.keys(languages).length > 0
                ? { alternates: { languages } }
                : {}),
        };
    });

    let projectPages: MetadataRoute.Sitemap = [];
    try {
        const projects = await getPublicProjects();
        projectPages = projects.map((p) => ({
            url: `${siteConfig.baseUrl}/projects/${p.slug}`,
            lastModified: toISOString(p.updatedAt),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));
    } catch {
        /* sitemap tetap tayang tanpa detail proyek */
    }

    return [
        { url: siteConfig.baseUrl, lastModified: now, changeFrequency: "monthly", priority: 1 },
        { url: `${siteConfig.baseUrl}/blogs`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
        { url: `${siteConfig.baseUrl}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
        ...projectPages,
        { url: `${siteConfig.baseUrl}/resume`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
        { url: `${siteConfig.baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
        { url: `${siteConfig.baseUrl}/now`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
        { url: `${siteConfig.baseUrl}/uses`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
        { url: `${siteConfig.baseUrl}/activity`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
        { url: `${siteConfig.baseUrl}/guestbook`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
        { url: `${siteConfig.baseUrl}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
        { url: `${siteConfig.baseUrl}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
        ...blogPages,
    ];
}
