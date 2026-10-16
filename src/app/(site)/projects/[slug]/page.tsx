import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import {
  TypographyH1,
  TypographyLead,
  TypographyMark,
  TypographyMuted,
} from "@/components/ui/typography";
import { ActivityFeed } from "@/app/(site)/_components/activity-feed";
import { ProjectLinks } from "@/app/(site)/projects/[slug]/links";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getProjectBySlug } from "@/lib/projects";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
        </HeroWithArt>
      </Section>

      {project.syncKey ? (
        <ActivityFeed projectKey={project.syncKey} limit={20} showLead={false} />
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
