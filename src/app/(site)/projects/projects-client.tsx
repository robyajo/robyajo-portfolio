"use client";

import { useDeferredValue, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { parseAsString, useQueryStates } from "nuqs";
import { useDictionary, useLocale } from "@/lib/i18n/provider";
import { dayAgoLabel } from "@/lib/date";
import { padIndex } from "@/lib/text";
import { stackSlug } from "@/lib/project-stacks-schema";
import type { ProjectWithActivity } from "@/lib/projects";
import { CardGrid, CardGridItem } from "@/components/layouts/page";
import { Reveal } from "@/components/shared/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Heading, SectionLabel, TypographyMuted } from "@/components/ui/typography";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import {
    MagnifyingGlassIcon,
    XIcon,
    ArrowUpRightIcon,
    GithubLogoIcon,
    FolderOpenIcon,
    ArrowCounterClockwiseIcon,
} from "@/components/shared/icons";

interface ProjectsClientProps {
    projects: ProjectWithActivity[];
    initialStack?: string;
}

const searchParsers = {
    q: parseAsString.withDefault(""),
    stack: parseAsString.withDefault(""),
};

export function ProjectsClient({ projects, initialStack }: ProjectsClientProps) {
    const [params, setParams] = useQueryStates(searchParsers);
    const q = params.q;
    const currentStack = params.stack || initialStack || "";

    const dict = useDictionary();
    const locale = useLocale();
    const content = dict.home.projects;
    const page = dict.projectsPage;
    const detail = dict.projectsDetail;

    const deferredQuery = useDeferredValue(q);
    const isFiltering = q !== deferredQuery;

    const availableStacks = useMemo(() => {
        return Array.from(
            new Set(projects.flatMap((p) => p.highlights)),
        ).sort((a, b) => a.localeCompare(b));
    }, [projects]);

    const filtered = useMemo(() => {
        let result = projects;
        if (currentStack) {
            result = result.filter((p) =>
                p.highlights.some(
                    (h) =>
                        stackSlug(h) === currentStack ||
                        h.toLowerCase() === currentStack.toLowerCase(),
                ),
            );
        }
        if (deferredQuery.trim()) {
            const query = deferredQuery.toLowerCase().trim();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query) ||
                    p.highlights.some((h) => h.toLowerCase().includes(query)),
            );
        }
        return result;
    }, [projects, currentStack, deferredQuery]);

    const hasActiveFilter = Boolean(q.trim() || currentStack);

    function handleReset() {
        setParams({ q: "", stack: "" });
    }

    return (
        <div className="flex flex-col gap-8">
            <div
                role="search"
                aria-label={page.searchAria}
                className="flex flex-col gap-4"
            >
                <div className="max-w-md">
                    <InputGroup data-pending={isFiltering || undefined}>
                        <InputGroupAddon align="inline-start">
                            <MagnifyingGlassIcon aria-hidden="true" />
                        </InputGroupAddon>
                        <InputGroupInput
                            autoComplete="off"
                            placeholder={page.searchPlaceholder}
                            value={q}
                            aria-label={page.searchAria}
                            onChange={(e) => setParams({ q: e.target.value })}
                        />
                        {q && (
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                    onClick={() => setParams({ q: "" })}
                                    aria-label={page.clearSearch}
                                >
                                    <XIcon className="size-4" aria-hidden="true" />
                                </InputGroupButton>
                            </InputGroupAddon>
                        )}
                    </InputGroup>
                </div>

                {availableStacks.length > 0 && (
                    <nav
                        aria-label={page.filterAria}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <Button
                            size="sm"
                            variant={currentStack === "" ? "default" : "outline"}
                            onClick={() => setParams({ stack: "" })}
                        >
                            {page.filterAll}
                        </Button>
                        {availableStacks.map((name) => {
                            const slug = stackSlug(name);
                            const isActive =
                                currentStack === slug ||
                                currentStack.toLowerCase() === name.toLowerCase();
                            return (
                                <Button
                                    key={name}
                                    size="sm"
                                    variant={isActive ? "default" : "outline"}
                                    onClick={() =>
                                        setParams({
                                            stack: isActive ? "" : slug,
                                        })
                                    }
                                >
                                    {name}
                                </Button>
                            );
                        })}
                        {hasActiveFilter && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleReset}
                            >
                                <ArrowCounterClockwiseIcon
                                    data-icon="inline-start"
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                {page.resetFilters}
                            </Button>
                        )}
                    </nav>
                )}
            </div>

            {filtered.length === 0 ? (
                <Empty bordered>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <FolderOpenIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>{page.noResults}</EmptyTitle>
                        <EmptyDescription>{page.filterEmpty}</EmptyDescription>
                    </EmptyHeader>
                    {hasActiveFilter && (
                        <EmptyContent>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleReset}
                            >
                                <ArrowCounterClockwiseIcon
                                    data-icon="inline-start"
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                {page.resetFilters}
                            </Button>
                        </EmptyContent>
                    )}
                </Empty>
            ) : (
                <CardGrid>
                    {filtered.map((project, index) => (
                        <CardGridItem key={project.title}>
                            <SectionLabel
                                pixel
                                className="absolute top-4 right-4 @sm:top-6 @sm:right-6"
                            >
                                No.{padIndex(index + 1)}
                            </SectionLabel>
                            <Reveal delay={index * 90}>
                                <article
                                    className="space-y-4"
                                    aria-label={project.title}
                                >
                                    <div className="pr-14">
                                        <Heading
                                            as="h2"
                                            level="h2"
                                        >
                                            {project.title}
                                        </Heading>
                                    </div>
                                    <TypographyMuted>
                                        {project.description}
                                    </TypographyMuted>
                                    <p className="font-mono text-xs tracking-wide opacity-60 text-muted-foreground">
                                        {project.lastActivityAt
                                            ? `Updated ${dayAgoLabel(new Date(project.lastActivityAt).toISOString(), locale)}`
                                            : "No activity yet"}
                                        {" · "}
                                        {project.viewCount}{" "}
                                        {project.viewCount === 1
                                            ? content.visitorOne
                                            : content.visitorMany}
                                    </p>
                                    <ul
                                        role="list"
                                        aria-label={content.techAria}
                                        className="flex flex-wrap gap-2 pt-2"
                                    >
                                        {project.highlights.map((tag) => (
                                            <li key={tag}>
                                                <Badge variant="outline">
                                                    {tag}
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                    <nav
                                        aria-label={`${content.linksFor} ${project.title}`}
                                        className="pt-4"
                                    >
                                        <ButtonGroup>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="default"
                                            >
                                                <Link
                                                    href={
                                                        `/projects/${project.slug}` as Route
                                                    }
                                                    aria-label={detail.detailAria.replace(
                                                        "{title}",
                                                        project.title,
                                                    )}
                                                >
                                                    <ArrowUpRightIcon
                                                        data-icon="inline-start"
                                                        className="size-4"
                                                        aria-hidden="true"
                                                    />
                                                    <span>{detail.detail}</span>
                                                </Link>
                                            </Button>
                                            <ButtonGroupSeparator />
                                            {project.liveVisibility !== "private" &&
                                                project.live && (
                                                    <>
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="default"
                                                        >
                                                            <Link
                                                                href={
                                                                    project.live as Route
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                aria-label={`${content.liveAria} ${project.title}`}
                                                            >
                                                                <ArrowUpRightIcon
                                                                    data-icon="inline-start"
                                                                    className="size-4"
                                                                    aria-hidden="true"
                                                                />
                                                                <span>
                                                                    {content.live}
                                                                </span>
                                                            </Link>
                                                        </Button>
                                                        <ButtonGroupSeparator />
                                                    </>
                                                )}
                                            {project.repoVisibility !== "private" &&
                                                project.github && (
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <Link
                                                            href={
                                                                project.github as Route
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label={`${content.githubAria} ${project.title}`}
                                                        >
                                                            <GithubLogoIcon
                                                                data-icon="inline-start"
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
                                                            <span aria-hidden="true">
                                                                GitHub
                                                            </span>
                                                        </Link>
                                                    </Button>
                                                )}
                                        </ButtonGroup>
                                    </nav>
                                </article>
                            </Reveal>
                        </CardGridItem>
                    ))}
                </CardGrid>
            )}
        </div>
    );
}
