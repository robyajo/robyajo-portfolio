import { BlogCover } from "@/components/diagrams/blog-covers";
import { HeroWithArt } from "@/components/layouts/hero-art";
import {
  EndOfPost,
  ScrollToEngagement,
} from "@/app/(site)/blog/[[...slug]]/_components/end-of-post";
import {
  getBlogReadsCount,
  getCommentCount,
  trackRead,
} from "@/app/(site)/blog/[[...slug]]/actions";
import {
  CommentsFallback,
  CommentsSection,
} from "@/app/(site)/blog/[[...slug]]/_components/comments-section";
import { BlogBody } from "@/components/layouts/blog";
import { BlogPostNav } from "@/components/layouts/blog-nav";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import { Signature } from "@/components/ui/signature";
import {
  TypographyH1,
  TypographyLead,
  TypographyMuted,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import {
  formatLongDate,
  formatShortDate,
  toISOString,
  toTimestamp,
} from "@/lib/date";
import { buildMeta } from "@/lib/metadata";
import { source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { getAuth as auth } from "@/lib/auth";
import {
  CalendarIcon,
  GitCommitIcon,
  ClockIcon,
  EyeIcon,
  GlobeIcon,
} from "@/components/shared/icons";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { postTransitionName } from "@/lib/view-transition";

export default async function Page(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const { userId } = await auth();
  const [reads, commentCount] = await Promise.all([
    getBlogReadsCount(page.url),
    getCommentCount(page.url),
    trackRead(page.url),
  ]);
  const MDX = page.data.body;
  const readingTime = (page.data as any)._exports?.readingTime;
  const dict = await getDictionary();
  const post = dict.blog.post;
  const dateLocale = (await getLocale()) === "id" ? "id-ID" : "en-US";

  const lang = page.data.lang ?? "en";
  const sibling = page.data.translation
    ? source.getPage([page.data.translation])
    : undefined;

  const allPages = source
    .getPages()
    .filter((p) => (p.data.lang ?? "en") === lang)
    .sort((a, b) => {
      return toTimestamp(b.data.date) - toTimestamp(a.data.date);
    });

  const currentIndex = allPages.findIndex((p) => p.url === page.url);
  const prevPost =
    currentIndex < allPages.length - 1
      ? {
          url: allPages[currentIndex + 1].url,
          title: allPages[currentIndex + 1].data.title,
        }
      : null;
  const nextPost =
    currentIndex > 0
      ? {
          url: allPages[currentIndex - 1].url,
          title: allPages[currentIndex - 1].data.title,
        }
      : null;
  const postUrl = `${siteConfig.baseUrl}${page.url}`;

  return (
    <>
      <JsonLd
        type="article"
        title={page.data.title}
        description={page.data.description ?? ""}
        canonicalUrl={postUrl}
        publishedAt={page.data.date ? toISOString(page.data.date) : undefined}
        updatedAt={
          page.data.lastModified
            ? toISOString(page.data.lastModified)
            : undefined
        }
        tags={page.data.tags}
        inLanguage={lang}
      />
      <JsonLd
        type="breadcrumb"
        items={[
          { name: post.home, url: siteConfig.baseUrl },
          { name: dict.blog.page.title, url: `${siteConfig.baseUrl}/blogs` },
          { name: page.data.title, url: postUrl },
        ]}
      />
      <Section variant="nav">
        <BlogPostNav
          pageUrl={postUrl}
          title={page.data.title}
          prevPost={prevPost}
          nextPost={nextPost}
        />
      </Section>

      <Section variant="hero" aria-label={post.headerAria}>
        <HeroWithArt art={<BlogCover slug={page.slugs.at(-1) ?? ""} zoom />}>
          <ViewTransition
            name={postTransitionName(page.url)}
            share="auto"
            default="none"
          >
            <TypographyH1>{page.data.title}</TypographyH1>
          </ViewTransition>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 -mt-2">
            <address className="not-italic contents">
              <TypographyMuted className="font-mono text-xs flex items-center gap-1.5">
                <Link
                  href={siteConfig.baseUrl as Route}
                  className="hover:text-foreground transition-colors"
                  rel="author"
                >
                  {siteConfig.name}
                </Link>
              </TypographyMuted>
            </address>
            {page.data.date && (
              <TypographyMuted className="font-mono text-xs flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="sr-only">{post.published} </span>

                <time dateTime={toISOString(page.data.date)}>
                  {formatLongDate(page.data.date, dateLocale)}
                </time>
              </TypographyMuted>
            )}
            {page.data.lastModified && (
              <TypographyMuted className="font-mono text-xs flex items-center gap-1.5">
                <GitCommitIcon className="size-3.5 shrink-0" aria-hidden="true" />
                {post.updated}{" "}
                <time dateTime={toISOString(page.data.lastModified)}>
                  {formatShortDate(page.data.lastModified, dateLocale)}
                </time>
              </TypographyMuted>
            )}
            {readingTime && (
              <TypographyMuted className="font-mono text-xs flex items-center gap-1.5">
                <ClockIcon className="size-3.5 shrink-0" aria-hidden="true" />
                {post.minRead.replace("{n}", String(Math.max(1, Math.ceil(readingTime.minutes ?? 1))))}
              </TypographyMuted>
            )}
            <TypographyMuted className="font-mono tabular-nums text-xs flex items-center gap-1.5">
              <EyeIcon className="size-3.5 shrink-0" aria-hidden="true" />
              {reads} {reads === 1 ? post.readOne : post.readMany}
            </TypographyMuted>
            {commentCount > 0 && <ScrollToEngagement count={commentCount} />}
            {sibling && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <GlobeIcon className="size-3.5 shrink-0" aria-hidden="true" />
                <Link
                  href={sibling.url as Route}
                  hrefLang={sibling.data.lang === "id" ? "id" : "en"}
                  aria-label={post.translationAria}
                  className="hover:text-foreground transition-colors"
                >
                  {sibling.data.lang === "id"
                    ? post.translationId
                    : post.translationEn}
                </Link>
              </span>
            )}
          </div>

          {page.data.description && (
            <TypographyLead>{page.data.description}</TypographyLead>
          )}

          {page.data.tags && page.data.tags.length > 0 && (
            <ul
              role="list"
              aria-label={post.tagsAria}
              className="flex flex-wrap gap-1.5"
            >
              {page.data.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/blogs?tags=${encodeURIComponent(tag)}`}
                    className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </HeroWithArt>
      </Section>

      <BlogBody toc={page.data.toc}>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
        <EndOfPost commentCount={commentCount} />
        <Signature text={siteConfig.name} />
      </BlogBody>

      <Section
        id="engagement"
        variant="flush"
        aria-label={post.engagementAria}
        data-comment-count={commentCount}
      >
        <Suspense fallback={<CommentsFallback />}>
          <CommentsSection slug={page.url} currentUserId={userId} />
        </Suspense>
      </Section>

      <Section variant="nav">
        <BlogPostNav
          label={post.morePosts}
          pageUrl={postUrl}
          title={page.data.title}
          prevPost={prevPost}
          nextPost={nextPost}
        />
      </Section>
    </>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const rawTitle = page.data.title;
  const metaTitle =
    rawTitle.length > 60 ? rawTitle.slice(0, 57).trimEnd() + "…" : rawTitle;

  const rawDesc = page.data.description ?? "";
  const metaDesc =
    rawDesc.length > 155 ? rawDesc.slice(0, 152).trimEnd() + "…" : rawDesc;

  const selfUrl = `${siteConfig.baseUrl}${page.url}`;
  const selfLang = page.data.lang ?? "en";
  const sibling = page.data.translation
    ? source.getPage([page.data.translation])
    : undefined;
  const siblingLang = sibling?.data.lang ?? "en";
  const siblingUrl = sibling
    ? `${siteConfig.baseUrl}${sibling.url}`
    : undefined;
  const alternateLanguages: Record<string, string> = {
    [selfLang === "id" ? "id-ID" : "en-US"]: selfUrl,
    ...(siblingUrl && {
      [siblingLang === "id" ? "id-ID" : "en-US"]: siblingUrl,
    }),
    "x-default": selfLang === "id" ? selfUrl : (siblingUrl ?? selfUrl),
  };

  return buildMeta({
    title: rawTitle,
    pageTitle: metaTitle,
    description: metaDesc,
    path: `home / blog / ${params.slug?.join(" / ") ?? ""}`,
    canonicalPath: page.url,
    type: "article",
    tags: (page.data.tags as string[] | undefined) ?? [],
    publishedAt: page.data.date ? toISOString(page.data.date) : undefined,
    updatedAt: page.data.lastModified
      ? toISOString(page.data.lastModified)
      : undefined,
    alternateLanguages,
  });
}
