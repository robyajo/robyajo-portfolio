import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import {
  TypographyH1,
  TypographyLead,
  TypographyMark,
  TypographyMuted,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getStackUsage } from "@/lib/stack-usage";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/shared/icons";

export async function generateMetadata(): Promise<Metadata> {
  const content = (await getDictionary()).usesPage;
  const locale = await getLocale();
  return buildMeta({
    locale,
    title: content.title,
    pageTitle: content.pageTitle,
    description: content.description,
    path: "home / uses",
    canonicalPath: "/uses",
    type: "website",
  });
}

export default async function UsesPage() {
  const content = (await getDictionary()).usesPage;
  const stacks = await getStackUsage();

  return (
    <>
      <JsonLd
        type="webpage"
        title={content.pageTitle}
        description={content.description}
        canonicalUrl={`${siteConfig.baseUrl}/uses`}
      />
      <Section variant="hero" aria-label={content.headerAria}>
        <HeroWithArt art={<PageArt name="principles" />}>
          <TypographyH1>{content.title}</TypographyH1>
          <TypographyLead>
            {content.leadPrefix}{" "}
            <TypographyMark>{content.leadHighlight}</TypographyMark>
            {content.leadSuffix}
          </TypographyLead>
        </HeroWithArt>
      </Section>

      <Section aria-label={content.title}>
        <TypographyMuted className="max-w-3xl">{content.note}</TypographyMuted>

        {stacks.length === 0 ? (
          <span className="mt-8 block font-mono text-sm text-muted-foreground">
            {content.empty}
          </span>
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stacks.map((stack) => (
              <li key={stack.slug}>
                <Link
                  href={`/projects?stack=${stack.slug}`}
                  className="flex items-center justify-between gap-4 rounded-panel border bg-card p-4 transition-colors hover:border-ring"
                >
                  <span className="font-medium">{stack.name}</span>
                  <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    {content.countLabel.replace("{count}", String(stack.count))}
                    <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <Button asChild variant="outline" size="sm">
            <Link href="/about">{content.aboutLink}</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
