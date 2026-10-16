import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { ProjectGrid } from "@/app/(site)/_components/projects";
import { ProjectsSkeleton } from "@/app/(site)/projects/projects-skeleton";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import {
  TypographyH1,
  TypographyLead,
  TypographyMark,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const page = (await getDictionary()).projectsPage;
  return buildMeta({
    title: page.title,
    pageTitle: page.title,
    description: page.description,
    path: "home / projects",
    canonicalPath: "/projects",
    type: "website",
  });
}

export default async function ProjectsPage() {
  const page = (await getDictionary()).projectsPage;
  return (
    <>
      <JsonLd
        type="webpage"
        title={page.title}
        description={page.shortDescription}
        canonicalUrl={`${siteConfig.baseUrl}/projects`}
      />
      <Section variant="hero" aria-label={page.headerAria}>
        <HeroWithArt art={<PageArt name="projects" />}>
          <TypographyH1>{page.title}</TypographyH1>
          <TypographyLead>
            {page.leadPrefix}{" "}
            <TypographyMark>{page.leadHighlight}</TypographyMark>{" "}
            {page.leadSuffix}
          </TypographyLead>
        </HeroWithArt>
      </Section>
      <Section variant="flush" aria-label={page.listAria}>
        <Suspense fallback={<ProjectsSkeleton count={6} />}>
          <ProjectGrid />
        </Suspense>
      </Section>
    </>
  );
}
