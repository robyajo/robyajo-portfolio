import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMark,
  TypographyMuted,
  TypographyP,
} from "@/components/ui/typography";
import { ActivityFeed } from "@/app/(site)/_components/activity-feed";
import { ActivityFeedSkeleton } from "@/app/(site)/_components/activity-feed-skeleton";
import { ProjectLinks } from "@/app/(site)/projects/[slug]/links";
import { WorkReportButton } from "@/app/(site)/projects/[slug]/report-button";
import { isAdmin } from "@/lib/assert-admin";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getProjectBySlug } from "@/lib/projects";
import { trackProjectView, getProjectViewCount } from "@/lib/project-views";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  const dict = await getDictionary();
  const locale = await getLocale();
  return buildMeta({
    locale,
    title: project.title,
    pageTitle: project.title,
    description: project.description,
    path: `home / projects / ${project.slug}`,
    canonicalPath: `/projects/${project.slug}`,
    type: "website",
  });
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project || !project.enabled) notFound();
  const dict = await getDictionary();
  const content = dict.projectsDetail;
  const admin = await isAdmin();
  await trackProjectView(project.id);
  const views = await getProjectViewCount(project.id);
  const caseStudyBlocks = [
    { label: content.problemLabel, body: project.problem },
    { label: content.roleLabel, body: project.role },
    { label: content.outcomeLabel, body: project.outcome },
  ].filter((block) => block.body);
  const hasCaseStudy =
    caseStudyBlocks.length > 0 ||
    project.metrics.length > 0 ||
    project.gallery.length > 0;

  return (
    <>
      <JsonLd
        type="webpage"
        title={project.title}
        description={project.description}
        canonicalUrl={`${siteConfig.baseUrl}/projects/${project.slug}`}
      />
      <Section variant="hero" aria-label={project.title}>
        <HeroWithArt art={<PageArt name="projects" />}>
          <TypographyH1>{project.title}</TypographyH1>
          <TypographyLead>{project.description}</TypographyLead>
          {project.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {project.highlights.map((h) => (
                <span
                  key={h}
                  className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                >
                  {h}
                </span>
              ))}
            </div>
          )}
          <ProjectLinks project={project} labels={content} />
          <p className="pt-1 font-mono text-xs tabular-nums text-muted-foreground">
            {views} {views === 1 ? content.visitorOne : content.visitorMany}
          </p>
          {admin && (
            <div className="pt-2">
              <WorkReportButton slug={project.slug} />
            </div>
          )}
        </HeroWithArt>
      </Section>

      {hasCaseStudy && (
        <Section aria-label={content.caseStudyAria}>
          <div className="flex flex-col gap-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <TypographyH2>{content.caseStudyTitle}</TypographyH2>
              {project.period && (
                <span className="font-mono text-xs text-muted-foreground">
                  {project.period}
                </span>
              )}
            </div>

            {caseStudyBlocks.length > 0 && (
              <div className="grid gap-8 border-t pt-8 md:grid-cols-3">
                {caseStudyBlocks.map((block) => (
                  <div key={block.label} className="space-y-3">
                    <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                      {block.label}
                    </h3>
                    <TypographyP>{block.body}</TypographyP>
                  </div>
                ))}
              </div>
            )}

            {project.metrics.length > 0 && (
              <ul
                aria-label={content.metricsAria}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {project.metrics.map((metric) => (
                  <li
                    key={`${metric.label}-${metric.value}`}
                    className="rounded-panel border bg-card p-4"
                  >
                    <p className="font-display text-2xl font-semibold tracking-tight">
                      {metric.value}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {metric.label}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {project.gallery.length > 0 && (
              <ul
                aria-label={content.galleryAria}
                className="grid gap-3 sm:grid-cols-2"
              >
                {project.gallery.map((src, index) => (
                  <li key={src}>
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-panel border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={content.galleryAlt
                          .replace("{n}", String(index + 1))
                          .replace("{title}", project.title)}
                        loading="lazy"
                        className="aspect-video w-full object-cover"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      )}

      {project.syncKey ? (
        <Suspense fallback={<ActivityFeedSkeleton count={3} />}>
          <ActivityFeed projectKey={project.syncKey} limit={20} showLead={false} />
        </Suspense>
      ) : (
        <Section aria-label={content.activitiesLabel}>
          <TypographyMuted className="font-mono text-sm">
            {content.noSync}
          </TypographyMuted>
          <div className="mt-4">
            <Link
              href="/projects"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              ← {content.backToProjects}
            </Link>
          </div>
        </Section>
      )}
    </>
  );
}
