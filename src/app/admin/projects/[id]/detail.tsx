"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectRow } from "@/app/admin/actions";
import { ProjectActivities } from "@/app/admin/projects/activities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeftIcon,
    ArrowUpRightIcon,
    GithubLogoIcon,
    EyeIcon,
    CopyIcon,
    CheckIcon,
} from "@/components/shared/icons";
import { useDictionary } from "@/lib/i18n/provider";
import { TypographyMuted } from "@/components/ui/typography";

function hostOrUrl(raw: string): string {
    try {
        return new URL(raw).hostname;
    } catch {
        return raw;
    }
}

export function ProjectDetail({ project }: { project: ProjectRow }) {
    const t = useDictionary().admin.projects;
    const [keyVisible, setKeyVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    async function copyKey() {
        try {
            await navigator.clipboard.writeText(project.syncKey ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard unavailable */
        }
    }

    return (
        <div className="flex max-w-full flex-col gap-6">
            <Link
                href="/admin/projects"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
                {t.backToProjects}
            </Link>

            <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold leading-tight">
                        {project.title}
                    </h2>
                    {!project.enabled && (
                        <Badge variant="outline" size="tiny">
                            {t.hidden}
                        </Badge>
                    )}
                    {project.syncKey ? (
                        <Badge variant="secondary" size="tiny">
                            {t.syncOn} · {project.activityCount}{" "}
                            {t.activityLabel.toLowerCase()}
                        </Badge>
                    ) : (
                        <Badge variant="outline" size="tiny">
                            {t.syncOff}
                        </Badge>
                    )}
                </div>
                {project.description && (
                    <TypographyMuted>{project.description}</TypographyMuted>
                )}
            </div>

            <div className="rounded-lg border p-4">
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3 text-sm">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                            {t.slugLabel}
                        </span>
                        <span className="font-mono text-xs">
                            {project.slug}
                        </span>

                        {project.highlights.length > 0 && (
                            <>
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                    {t.highlightsLabel}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {project.highlights.map((h) => (
                                        <span
                                            key={h}
                                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-3xs text-muted-foreground"
                                        >
                                            {h}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {(project.live || project.github) && (
                        <div className="flex flex-wrap gap-2">
                            {project.live && (
                                <Button asChild size="sm" variant="outline">
                                    <a
                                        href={project.live}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ArrowUpRightIcon
                                            data-icon="inline-start"
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        {hostOrUrl(project.live)}
                                    </a>
                                </Button>
                            )}
                            {project.github && (
                                <Button asChild size="sm" variant="outline">
                                    <a
                                        href={project.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <GithubLogoIcon
                                            data-icon="inline-start"
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        {hostOrUrl(project.github)}
                                    </a>
                                </Button>
                            )}
                        </div>
                    )}

                    {project.syncKey ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                                {t.syncKeyLabel}
                            </span>
                            <code
                                aria-label={t.syncKeyLabel}
                                className="min-w-0 max-w-full truncate text-xs text-muted-foreground"
                            >
                                {keyVisible
                                    ? project.syncKey
                                    : "•".repeat(
                                          (project.syncKey ?? "").length,
                                      )}
                            </code>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                className="size-7"
                                onClick={() => setKeyVisible((v) => !v)}
                                aria-label={keyVisible ? t.keyHide : t.keyShow}
                            >
                                <EyeIcon
                                    size={14}
                                    className={keyVisible ? "" : "opacity-50"}
                                />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                className="size-7"
                                onClick={copyKey}
                                aria-label={t.keyCopy}
                            >
                                {copied ? (
                                    <CheckIcon size={14} />
                                ) : (
                                    <CopyIcon size={14} />
                                )}
                            </Button>
                        </div>
                    ) : (
                        <p className="font-mono text-xs text-muted-foreground">
                            {t.noSyncKey}
                        </p>
                    )}
                </div>
            </div>

            {project.syncKey ? (
                <ProjectActivities key={project.id} syncKey={project.syncKey} />
            ) : null}
        </div>
    );
}
