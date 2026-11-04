import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import { MarkasView } from "./_components/markas-view";
import {
  TypographyH1,
  TypographyLead,
  TypographyMark,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getMarkasAgentsConfig } from "@/lib/ai-config";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  const content = dict.markas;
  const agents = await getMarkasAgentsConfig();
  const locale = await getLocale();

  return buildMeta({
    locale,
    title: content.title,
    pageTitle: content.title,
    description: content.lead,
    path: "home / markas",
    canonicalPath: "/markas",
    type: "website",
  });
}

export default async function MarkasPage() {
  const dict = await getDictionary();
  const content = dict.markas;
  const agents = await getMarkasAgentsConfig();

  return (
    <>
      <JsonLd
        type="webpage"
        title={content.title}
        description={content.lead}
        canonicalUrl={`${siteConfig.baseUrl}/markas`}
      />

      <Section variant="hero" aria-label="Markas Agen AI & Command Center">
        <HeroWithArt art={<PageArt name="traces" />}>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {content.badge}
            </span>
          </div>
          <TypographyH1>{content.title}</TypographyH1>
          <TypographyLead>
            {content.lead}{" "}
            <TypographyMark>{content.subtitle}</TypographyMark>
          </TypographyLead>
        </HeroWithArt>
      </Section>

      <Section variant="flush" aria-label="Markas 3D Environment & Interactive Terminal">
        <MarkasView initialAgents={agents} />
      </Section>
    </>
  );
}
