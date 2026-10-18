"use server";

import { getProjectActivities, type Activity } from "@/lib/activities";
import { assertAdmin } from "@/lib/assert-admin";
import { siteConfig } from "@/lib/config";
import { getProjectBySlug } from "@/lib/projects";

export interface WorkReportData {
    projectTitle: string;
    url: string;
    activities: Activity[];
}

export async function fetchWorkReportActivities(
    slug: string,
): Promise<WorkReportData | null> {
    await assertAdmin();

    const project = await getProjectBySlug(slug);
    if (!project?.syncKey) return null;

    const activities = await getProjectActivities(project.syncKey);
    return {
        projectTitle: project.title,
        url: `${siteConfig.baseUrl}/projects/${project.slug}`,
        activities,
    };
}
