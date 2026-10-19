import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import { ActivityFeed } from "@/app/(site)/_components/activity-feed";
import { ActivityFeedSkeleton } from "@/app/(site)/_components/activity-feed-skeleton";
import {
  TypographyH1,
  TypographyLead,
  TypographyMark,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const content = (await getDictionary()).activityPage;
  const locale = await getLocale();
  return buildMeta({
    locale,
    title: content.title,
    pageTitle: content.pageTitle,
    description: content.description,
    path: "home / activity",
    canonicalPath: "/activity",
    type: "website",
  });
}

export default async function ActivityPage() {
  const content = (await getDictionary()).activityPage;

  return (
    <>
      <JsonLd
        type="webpage"
        title={content.pageTitle}
        description={content.description}
        canonicalUrl={`${siteConfig.baseUrl}/activity`}
      />
      <Section variant="hero" aria-label={content.headerAria}>
        <HeroWithArt art={<PageArt name="lateNight" />}>
          <TypographyH1>{content.title}</TypographyH1>
          <TypographyLead>
            {content.leadPrefix}{" "}
            <TypographyMark>{content.leadHighlight}</TypographyMark>
            {content.leadSuffix}
          </TypographyLead>
        </HeroWithArt>
      </Section>

      <Suspense fallback={<ActivityFeedSkeleton count={6} />}>
        <ActivityFeed limit={50} showLead={false} />
      </Suspense>
    </>
  );
}
