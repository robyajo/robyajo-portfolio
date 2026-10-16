import { Section } from "@/components/layouts/page";
import { Reveal } from "@/components/shared/reveal";
import { ArtStage } from "@/components/layouts/hero-art";
import { PageArt } from "@/components/diagrams/page-art";
import {
  TypographyH2,
  TypographyH3,
  TypographyLead,
  TypographyMuted,
  TypographyMark,
  SectionLabel,
} from "@/components/ui/typography";
import { padIndex } from "@/lib/text";
import { getDictionary } from "@/lib/i18n/server";

export async function RulesIFollow() {
  const dict = await getDictionary();
  const content = dict.home.rules;
  return (
    <Section aria-label={content.section}>
      <TypographyH2 className="sr-only">{content.section}</TypographyH2>
      <div className="group/iso grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_24rem]">
        <TypographyLead className="max-w-3xl">
          {content.leadPrefix}{" "}
          <TypographyMark>
            {content.leadHighlight}
          </TypographyMark>
          {content.leadSuffix}
        </TypographyLead>
        <ArtStage className="order-first -mx-gutter h-44 md:order-none md:mx-0 md:h-auto md:aspect-video">
          <PageArt name="principles" />
        </ArtStage>
      </div>
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
        {content.items.map((item, index) => (
          <Reveal key={item.title} delay={index * 90}>
            <div className="space-y-2">
              <SectionLabel pixel className="text-base text-(--brand-text)">
                {padIndex(index + 1)}
              </SectionLabel>
              <TypographyH3 className="text-xl">{item.title}</TypographyH3>
              <TypographyMuted className="leading-relaxed">
                {item.description}
              </TypographyMuted>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
