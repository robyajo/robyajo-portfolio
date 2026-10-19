import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import { ActivityFeed } from "@/app/(site)/_components/activity-feed";
import { ActivityFeedSkeleton } from "@/app/(site)/_components/activity-feed-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMark,
  TypographyMuted,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { formatLongDate, toISOString, toTimestamp } from "@/lib/date";
import { buildMeta } from "@/lib/metadata";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getPublicProjectsByActivity } from "@/lib/projects";
import { source } from "@/lib/source";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const content = (await getDictionary()).nowPage;
  const locale = await getLocale();
  return buildMeta({
    locale,
    title: content.title,
    pageTitle: content.pageTitle,
    description: content.description,
    path: "home / now",
    canonicalPath: "/now",
    type: "website",
  });
}

export default async function NowPage() {
  const dict = await getDictionary();
  const content = dict.nowPage;
  const locale = await getLocale();
  const dateLocale = locale === "id" ? "id-ID" : "en-US";

  let projects: Awaited<ReturnType<typeof getPublicProjectsByActivity>> = [];
  try {
    projects = await getPublicProjectsByActivity();
  } catch {
    projects = [];
  }

  const activeProjects = projects.slice(0, 4);
  const posts = source
    .getPages()
    .filter((page) => page.data.lang !== "en")
    .sort((a, b) => toTimestamp(b.data.date) - toTimestamp(a.data.date))
    .slice(0, 3);

  return (
    <>
      <JsonLd
        type="webpage"
        title={content.pageTitle}
        description={content.description}
        canonicalUrl={`${siteConfig.baseUrl}/now`}
      />
      <Section variant="hero" aria-label={content.headerAria}>
        <HeroWithArt art={<PageArt name="lateNight" />}>
          <TypographyH1>{content.title}</TypographyH1>
          <TypographyLead>
            {content.leadPrefix}{" "}
            <TypographyMark>{content.leadHighlight}</TypographyMark>
            {content.leadSuffix}
          </TypographyLead>
          {activeProjects[0] && (
            <p className="font-mono text-xs text-muted-foreground">
              {content.lastUpdated}{" "}
              {formatLongDate(activeProjects[0].updatedAt, dateLocale)}
            </p>
          )}
        </HeroWithArt>
      </Section>

      <Section aria-label={content.projectsTitle}>
        <TypographyH2>{content.projectsTitle}</TypographyH2>
        {activeProjects.length === 0 ? (
          <span className="mt-6 block font-mono text-sm text-muted-foreground">
            {content.projectsEmpty}
          </span>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {activeProjects.map((project) => (
              <li key={project.id}>
                <article className="flex h-full flex-col gap-3 rounded-panel border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold tracking-tight">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="hover:underline underline-offset-4"
                      >
                        {project.title}
                      </Link>
                    </h3>
                    {project.lastActivityAt && (
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {formatLongDate(project.lastActivityAt, dateLocale)}
                      </span>
                    )}
                  </div>
                  <TypographyMuted>{project.description}</TypographyMuted>
                  {project.highlights.length > 0 && (
                    <ul className="mt-auto flex flex-wrap gap-2 pt-2">
                      {project.highlights.slice(0, 4).map((highlight) => (
                        <li key={highlight}>
                          <Badge variant="outline" size="tiny">
                            {highlight}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section aria-label={content.postsTitle}>
        <TypographyH2>{content.postsTitle}</TypographyH2>
        {posts.length === 0 ? (
          <span className="mt-6 block font-mono text-sm text-muted-foreground">
            {content.postsEmpty}
          </span>
        ) : (
          <ul className="mt-6 flex flex-col divide-y divide-line border-y border-line">
            {posts.map((post) => (
              <li key={post.url}>
                <Link
                  href={post.url as Route}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-4 transition-colors hover:text-foreground"
                >
                  <span className="font-medium">{post.data.title}</span>
                  {post.data.date && (
                    <time
                      dateTime={toISOString(post.data.date)}
                      className="font-mono text-xs text-muted-foreground"
                    >
                      {formatLongDate(post.data.date, dateLocale)}
                    </time>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Suspense fallback={<ActivityFeedSkeleton count={4} />}>
        <ActivityFeed limit={4} showLead={false} />
      </Suspense>
    </>
  );
}
