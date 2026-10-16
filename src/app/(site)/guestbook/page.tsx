import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { getGuestbookEntries } from "@/app/(site)/guestbook/actions";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";
import { GuestbookClient } from "@/app/(site)/guestbook/guestbook-client";
import { Panel, PanelRow, Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import {
  TypographyH1,
  TypographyLead,
  TypographyMark,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getAuth as auth } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  const locale = await getLocale();
  return buildMeta({
    locale,
    title: dict.guestbook.title,
    pageTitle: dict.guestbook.title,
    description: `${dict.guestbook.metaDescription}`,
    path: "home / guestbook",
    canonicalPath: "/guestbook",
    type: "website",
  });
}

async function GuestbookFeed({ currentUserId }: { currentUserId: string | null }) {
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.guestbook,
    queryFn: ({ pageParam }) => getGuestbookEntries({ offset: pageParam }),
    initialPageParam: 0,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GuestbookClient currentUserId={currentUserId} />
    </HydrationBoundary>
  );
}

function GuestbookFallback() {
  return (
    <Panel aria-hidden="true" className="animate-pulse">
      <PanelRow className="h-32" />
      <PanelRow className="h-[50vh]" />
    </Panel>
  );
}

export default async function GuestbookPage() {
  const { userId } = await auth();
  const dict = await getDictionary();
  const content = dict.guestbook;

  return (
    <>
      <JsonLd
        type="webpage"
        title={content.title}
        description={`${content.metaDescription}`}
        canonicalUrl={`${siteConfig.baseUrl}/guestbook`}
      />

      <Section variant="hero" aria-label={content.title}>
        <HeroWithArt art={<PageArt name="guestbook" />}>
          <TypographyH1>{content.title}</TypographyH1>
          <TypographyLead>
            {content.heroPrefix} <TypographyMark>{content.heroHighlight}</TypographyMark>
          </TypographyLead>
        </HeroWithArt>
      </Section>

      <Section variant="flush" aria-label={content.entriesLabel}>
        <Suspense fallback={<GuestbookFallback />}>
          <GuestbookFeed currentUserId={userId} />
        </Suspense>
      </Section>
    </>
  );
}
