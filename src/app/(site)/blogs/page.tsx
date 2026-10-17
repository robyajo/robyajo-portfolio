import { BlogCover } from "@/components/diagrams/blog-covers";
import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { BlogsClient, type BlogPost } from "@/app/(site)/blogs/blogs-client";
import { BlogsSkeleton } from "@/app/(site)/blogs/blogs-skeleton";
import { PostGridFiller } from "@/app/(site)/blogs/post-grid-filler";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import {
  TypographyH1,
  TypographyLead,
  TypographyMark,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { source } from "@/lib/source";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { toISOString, toTimestamp } from "@/lib/date";

export async function generateMetadata(): Promise<Metadata> {
  const page = (await getDictionary()).blog.page;
  const locale = await getLocale();
  return buildMeta({
    locale,
    title: page.title,
    pageTitle: page.pageTitle,
    description: page.description,
    path: "home / blogs",
    canonicalPath: "/blogs",
    type: "website",
  });
}

export default async function BlogPage() {
  const pages = source
    .getPages()
    .filter((page) => page.data.lang !== "en")
    .sort((a, b) => {
      return toTimestamp(b.data.date) - toTimestamp(a.data.date);
    });

  const posts: BlogPost[] = pages.map((page, i) => ({
    url: page.url,
    title: page.data.title,
    description: page.data.description,
    date: page.data.date ? toISOString(page.data.date) : undefined,
    tags: page.data.tags,
    number: pages.length - i,
    cover: <BlogCover slug={page.slugs.at(-1) ?? ""} />,
  }));

  const allTags = Array.from(
    new Set(pages.flatMap((p) => p.data.tags ?? [])),
  ).sort();

  const page = (await getDictionary()).blog.page;

  return (
    <>
      <JsonLd
        type="webpage"
        title={page.title}
        description={page.shortDescription}
        canonicalUrl={`${siteConfig.baseUrl}/blogs`}
      />
      <Section variant="hero" aria-label={page.heroAria}>
        <HeroWithArt art={<PageArt name="blogs" />}>
          <TypographyH1>{page.title}</TypographyH1>
          <TypographyLead>
            {page.leadPrefix}{" "}
            <TypographyMark>{page.leadHighlight}</TypographyMark>
            {page.leadSuffix}
          </TypographyLead>
        </HeroWithArt>
      </Section>

      <Section className="pb-6" aria-label={page.postsAria}>
        <Suspense fallback={<BlogsSkeleton count={Math.min(posts.length, 10)} />}>
          <BlogsClient posts={posts} allTags={allTags} filler={<PostGridFiller />} />
        </Suspense>
      </Section>
    </>
  );
}
