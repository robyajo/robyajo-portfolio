import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import { ActivityFeed } from "@/app/(site)/_components/activity-feed";
import { ActivityFeedSkeleton } from "@/app/(site)/_components/activity-feed-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMark,
  TypographyMuted,
  TypographyP,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getStackUsage } from "@/lib/stack-usage";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const content = (await getDictionary()).aboutPage;
  const locale = await getLocale();
  return buildMeta({
    locale,
    title: content.title,
    pageTitle: content.pageTitle,
    description: content.description,
    path: "home / about",
    canonicalPath: "/about",
    type: "profile",
  });
}

export default async function AboutPage() {
  const dict = await getDictionary();
  const content = dict.aboutPage;
  const stacks = await getStackUsage();

  const more = [
    { href: "/uses", label: content.exploreUses },
    { href: "/now", label: content.exploreNow },
    { href: "/activity", label: content.exploreActivity },
    { href: "/projects", label: content.exploreProjects },
    { href: "/blogs", label: content.exploreBlogs },
    { href: "/resume", label: content.exploreResume },
  ];

  return (
    <>
      <JsonLd
        type="webpage"
        title={content.pageTitle}
        description={content.description}
        canonicalUrl={`${siteConfig.baseUrl}/about`}
      />
      <Section variant="hero" aria-label={content.headerAria}>
        <HeroWithArt art={<PageArt name="traces" />}>
          <TypographyH1>{content.title}</TypographyH1>
          <TypographyLead>
            {content.leadPrefix}{" "}
            <TypographyMark>{content.leadHighlight}</TypographyMark>
            {content.leadSuffix}
          </TypographyLead>
        </HeroWithArt>
      </Section>

      <Section aria-label={content.title}>
        <div className="max-w-3xl">
          {content.paragraphs.map((paragraph) => (
            <TypographyP key={paragraph}>{paragraph}</TypographyP>
          ))}
        </div>

        {stacks.length > 0 && (
          <div className="mt-12 max-w-3xl">
            <TypographyH2>{content.stackTitle}</TypographyH2>
            <TypographyMuted className="mt-2">
              {content.stackLead}
            </TypographyMuted>
            <ul className="mt-5 flex flex-wrap gap-2">
              {stacks.map((stack) => (
                <li key={stack.slug}>
                  <Badge asChild variant="outline">
                    <Link href={`/projects?stack=${stack.slug}`}>
                      {stack.name}
                    </Link>
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12">
          <TypographyH2>{content.exploreTitle}</TypographyH2>
          <div className="mt-5 flex flex-wrap gap-2">
            {more.map((item) => (
              <Button key={item.href} asChild variant="outline" size="sm">
                <Link href={item.href as Route}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </Section>

      <Suspense fallback={<ActivityFeedSkeleton count={3} />}>
        <ActivityFeed limit={3} showLead={false} />
      </Suspense>
    </>
  );
}
