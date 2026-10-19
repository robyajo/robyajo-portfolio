import { Section, CardGrid, CardGridItem } from "@/components/layouts/page";
import { ProjectsSkeleton } from "@/app/(site)/projects/projects-skeleton";
import { Reveal } from "@/components/shared/reveal";
import { GitChaos } from "@/components/diagrams/git-chaos";
import { IsoStage } from "@/components/diagrams/iso-stage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  Heading,
  TypographyH2,
  TypographyLead,
  TypographyMark,
  TypographyMuted,
  SectionLabel,
} from "@/components/ui/typography";
import { GithubLogoIcon, ArrowUpRightIcon } from "@/components/shared/icons";
import Link from "next/link";
import { padIndex } from "@/lib/text";
import type { Route } from "next";
import { Suspense } from "react";
import { getPublicProjectsByActivity } from "@/lib/projects";
import { stackSlug } from "@/lib/project-stacks-schema";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { dayAgoLabel } from "@/lib/date";
import { unstable_rethrow } from "next/navigation";

export async function ProjectGrid({
    headingLevel = "h2",
    showFilters = false,
    activeStack,
}: {
    headingLevel?: "h2" | "h3";
    showFilters?: boolean;
    activeStack?: string;
}) {
    const dict = await getDictionary();
    const content = dict.home.projects;
    const page = dict.projectsPage;
    const detail = dict.projectsDetail;
    const locale = await getLocale();
    let projects: Awaited<ReturnType<typeof getPublicProjectsByActivity>>;
    try {
        projects = await getPublicProjectsByActivity();
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load public projects:", error);
    projects = [];
  }

  const stackNames = Array.from(
    new Set(projects.flatMap((project) => project.highlights)),
  ).sort((a, b) => a.localeCompare(b));
  const activeSlug = showFilters && activeStack ? activeStack : null;
  const visible = activeSlug
    ? projects.filter((project) =>
        project.highlights.some((highlight) => stackSlug(highlight) === activeSlug),
      )
    : projects;

  const filters = showFilters && stackNames.length > 0 && (
    <nav aria-label={page.filterAria} className="mb-8 flex flex-wrap gap-2">
      <Button asChild size="sm" variant={activeSlug ? "outline" : "default"}>
        <Link href="/projects">{page.filterAll}</Link>
      </Button>
      {stackNames.map((name) => (
        <Button
          key={name}
          asChild
          size="sm"
          variant={activeSlug === stackSlug(name) ? "default" : "outline"}
        >
          <Link href={`/projects?stack=${stackSlug(name)}`}>{name}</Link>
        </Button>
      ))}
    </nav>
  );

  if (projects.length === 0) {
    return (
      <TypographyMuted className="py-12 text-center font-mono text-sm">
        {content.empty}
      </TypographyMuted>
    );
  }

  if (visible.length === 0) {
    return (
      <>
        {filters}
        <TypographyMuted className="py-12 text-center font-mono text-sm">
          {page.filterEmpty}
        </TypographyMuted>
      </>
    );
  }

  return (
    <>
      {filters}
      <CardGrid>
      {visible.map((project, index) => (
        <CardGridItem key={project.title}>
          <SectionLabel pixel className="absolute top-4 right-4 @sm:top-6 @sm:right-6">
            No.{padIndex(index + 1)}
          </SectionLabel>
          <Reveal delay={index * 90}>
            <article className="space-y-4" aria-label={project.title}>
              <Heading as={headingLevel} level="h2" className="pr-14 text-xl">
                {project.title}
              </Heading>
              <TypographyMuted className="leading-relaxed">
                {project.description}
              </TypographyMuted>
              <TypographyMuted className="font-mono text-xs tracking-wide opacity-60">
                {project.lastActivityAt
                  ? `Updated ${dayAgoLabel(new Date(project.lastActivityAt).toISOString(), locale)}`
                  : "No activity yet"}
                {" · "}
                {project.viewCount}{" "}
                {project.viewCount === 1
                  ? content.visitorOne
                  : content.visitorMany}
              </TypographyMuted>
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
              <nav aria-label={`${content.linksFor} ${project.title}`} className="pt-4">
                <ButtonGroup>
                  <Button asChild size="sm" variant="default">
                    <Link
                      href={`/projects/${project.slug}` as Route}
                      aria-label={detail.detailAria.replace("{title}", project.title)}
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
                  {project.liveVisibility !== "private" && project.live && (
                    <>
                      <Button asChild size="sm" variant="default">
                        <Link
                          href={project.live as Route}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${content.liveAria} ${project.title}`}
                        >
                          <ArrowUpRightIcon
                            data-icon="inline-start"
                            className="size-4"
                            aria-hidden="true"
                          />

                          <span>{content.live}</span>
                        </Link>
                      </Button>
                      <ButtonGroupSeparator />
                    </>
                  )}
                  {project.repoVisibility !== "private" && project.github && (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={project.github as Route}
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
    </>
  );
}

export async function BuiltThings() {
  const dict = await getDictionary();
  const content = dict.home.projects;
  return (
    <Section aria-label={content.heading}>
      <TypographyH2 className="sr-only">{content.heading}</TypographyH2>
      <Reveal>
        <div className="mb-12 max-w-3xl">
          <TypographyLead>
            {content.leadPrefix}{" "}
            <TypographyMark>
              {content.leadHighlight}
            </TypographyMark>
            {content.leadSuffix}
          </TypographyLead>
        </div>
      </Reveal>
      <Suspense fallback={<ProjectsSkeleton count={4} />}>
        <ProjectGrid headingLevel="h3" />
      </Suspense>
      <Reveal className="group/iso mt-16 flex flex-col items-center gap-6 text-center">
        <IsoStage className="w-full max-w-xl">
          <GitChaos />
        </IsoStage>
        <TypographyLead className="max-w-2xl">
          {content.morePrefix}{" "}
          <TypographyMark>
            {content.moreHighlight}
          </TypographyMark>{" "}
          {content.moreSuffix}
        </TypographyLead>
        <Button asChild size="lg" className="rounded-lg font-semibold">
          <Link
            href="https://github.com/robyajo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={content.exploreAria}
          >
            <GithubLogoIcon
              data-icon="inline-start"
              className="size-5"
              aria-hidden="true"
            />

            <span>{content.explore}</span>
            <ArrowUpRightIcon
              data-icon="inline-end"
              className="size-4 opacity-70"
              aria-hidden="true"
            />
          </Link>
        </Button>
      </Reveal>
    </Section>
  );
}
