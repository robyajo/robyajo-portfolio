import { getPublicProjectsByActivity } from "@/lib/projects";
import { stackSlug } from "@/lib/project-stacks-schema";

export type StackUsage = {
    name: string;
    slug: string;
    count: number;
};

/** Technologies recorded on public projects, most used first. */
export async function getStackUsage(): Promise<StackUsage[]> {
    let projects: Awaited<ReturnType<typeof getPublicProjectsByActivity>> = [];
    try {
        projects = await getPublicProjectsByActivity();
    } catch {
        return [];
    }

    const usage = new Map<string, StackUsage>();
    for (const project of projects) {
        for (const highlight of project.highlights) {
            const slug = stackSlug(highlight);
            if (!slug) continue;
            const current = usage.get(slug);
            if (current) {
                current.count += 1;
            } else {
                usage.set(slug, { name: highlight, slug, count: 1 });
            }
        }
    }

    return [...usage.values()].sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    );
}
