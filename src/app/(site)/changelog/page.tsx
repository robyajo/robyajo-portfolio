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
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/id";
import { getReleases, type Release } from "@/lib/releases";
import {
  activityBadgeVariant,
  splitActivityBody,
} from "@/lib/activities-schema";
import { formatShortDate } from "@/lib/date";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const changelog = (await getDictionary()).changelog;
  const locale = await getLocale();
  return buildMeta({
    locale,
    title: changelog.title,
    pageTitle: changelog.title,
    description: changelog.description,
    path: "home / changelog",
    canonicalPath: "/changelog",
    type: "website",
  });
}

function ReleaseEntry({
  release,
  locale,
  dateLocale,
  dict,
}: {
  release: Release;
  locale: Locale;
  dateLocale: string;
  dict: Dictionary;
}) {
  const content = dict.changelog;
  const kindLabel = dict.activity.itemKinds[release.type] ?? release.type;
  const pick = (id: string, en: string) => (locale === "id" ? id : en);
  const { lead } = splitActivityBody(pick(release.body.id, release.body.en));

  return (
    <li
      key={release.date}
      id={`rilis-${release.date}`}
      className="flex flex-col gap-3 border-b border-line pb-10 last:border-none last:pb-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <time
          dateTime={release.date}
          className="flex items-center gap-2 text-sm font-medium tabular-nums text-foreground"
        >
          {formatShortDate(release.date, dateLocale)}
        </time>
        <Badge variant={activityBadgeVariant(release.type)} size="tiny">
          {kindLabel}
        </Badge>
      </div>
      <h2 className="text-xl font-bold leading-snug text-foreground">
        {pick(release.title.id, release.title.en)}
      </h2>
      {lead && (
        <p className="text-sm leading-relaxed text-muted-foreground">{lead}</p>
      )}
      {release.items.length > 0 && (
        <div className="mt-1 flex flex-col gap-2 rounded-xl border border-line p-3">
          <span className="text-3xs font-medium uppercase tracking-widest text-muted-foreground">
            {content.detailsLabel} ({release.items.length})
          </span>
          <ul role="list" className="flex flex-col gap-2">
            {release.items.map((item) => (
              <li
                key={item.en}
                className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3 max-md:flex-col max-md:gap-1.5"
              >
                <Badge
                  variant={activityBadgeVariant(item.type)}
                  size="tiny"
                  className="mt-0.5 shrink-0"
                >
                  {dict.activity.itemKinds[item.type] ?? item.type}
                </Badge>
                <span className="text-sm leading-relaxed text-foreground">
                  {pick(item.id, item.en)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export default async function ChangelogPage() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const changelog = dict.changelog;
  const releases = await getReleases();
  const dateLocale = locale === "id" ? "id-ID" : "en-US";

  return (
    <>
      <JsonLd
        type="webpage"
        title={changelog.title}
        description={changelog.shortDescription}
        canonicalUrl={`${siteConfig.baseUrl}/changelog`}
      />
      <Section variant="hero" aria-label={changelog.heroAria}>
        <HeroWithArt art={<PageArt name="traces" />}>
          <TypographyH1>{changelog.title}</TypographyH1>
          <TypographyLead>
            {changelog.leadPrefix}{" "}
            <TypographyMark>{changelog.leadHighlight}</TypographyMark>{" "}
            {changelog.leadSuffix}
          </TypographyLead>
        </HeroWithArt>
      </Section>
      <Section aria-label={changelog.heroAria}>
        {releases.length === 0 ? (
          <TypographyMuted>{changelog.empty}</TypographyMuted>
        ) : (
          <ul role="list" className="flex flex-col gap-10">
            {releases.map((release) => (
              <ReleaseEntry
                key={release.date}
                release={release}
                locale={locale}
                dateLocale={dateLocale}
                dict={dict}
              />
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
