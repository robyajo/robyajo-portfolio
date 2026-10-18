"use server";

import { getProjectActivities } from "@/lib/activities";
import { splitActivityBody } from "@/lib/activities-schema";
import { assertAdmin } from "@/lib/assert-admin";
import { siteConfig } from "@/lib/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getProjectBySlug } from "@/lib/projects";

export interface WorkReportFile {
    filename: string;
    content: string;
}

function dayOfDay(iso: string): string {
    return new Date(iso).toISOString().slice(0, 10);
}

export async function generateWorkReport(
    slug: string,
): Promise<WorkReportFile | null> {
    await assertAdmin();

    const project = await getProjectBySlug(slug);
    if (!project?.syncKey) return null;

    const locale = await getLocale();
    const dict = await getDictionary(locale);
    const isId = locale === "id";
    const dateLocale = isId ? "id-ID" : "en-US";

    const kindLabel = (kind: string): string =>
        dict.activity.kinds[kind as keyof typeof dict.activity.kinds] ?? kind;
    const bulletKindLabel = (kind: string): string =>
        dict.activity.itemKinds[
            kind as keyof typeof dict.activity.itemKinds
        ] ?? kind;

    const items = await getProjectActivities(project.syncKey);
    if (items.length === 0) return null;

    const today = new Intl.DateTimeFormat(dateLocale, {
        timeZone: "Asia/Jakarta",
        dateStyle: "long",
    }).format(new Date());

    const url = `${siteConfig.baseUrl}/projects/${project.slug}`;
    const lines: string[] = [
        `# ${isId ? "Laporan Kerja" : "Work Report"} — ${project.title}`,
        "",
        `- ${isId ? "Dibuat" : "Created"}: ${today}`,
        `- ${isId ? "Tautan" : "Link"}: ${url}`,
        `- ${isId ? "Jumlah kegiatan" : "Activities"}: ${items.length}`,
        "",
    ];

    let currentDay = "";
    for (const item of items) {
        const day = dayOfDay(item.occurredAt);
        if (day !== currentDay) {
            currentDay = day;
            const pretty = new Intl.DateTimeFormat(dateLocale, {
                timeZone: "Asia/Jakarta",
                dateStyle: "full",
            }).format(new Date(item.occurredAt));
            const intro = (
                splitActivityBody(isId ? item.bodyId : item.bodyEn).lead
            ).trim();
            lines.push(
                `## ${pretty}`,
                "",
                intro || "",
            );
        }

        const title = (isId ? item.titleId : item.titleEn) || "";
        const { bullets } = splitActivityBody(
            isId ? item.bodyId : item.bodyEn,
        );
        lines.push(
            `### ${item.kind ? `[${kindLabel(item.kind)}]` : ""} ${title}`.trim(),
            "",
        );
        for (const bullet of bullets) {
            const label = bullet.kind ? bulletKindLabel(bullet.kind) : null;
            lines.push(
                `- ${label ? `**${label}** — ` : ""}${bullet.text}`,
            );
        }
        lines.push("");
    }

    const filename = `${isId ? "laporan-kerja" : "work-report"}-${slug}-${dayOfDay(
        new Date().toISOString(),
    )}.md`;

    return { filename, content: lines.join("\n").replace(/\n{3,}/g, "\n\n") };
}
