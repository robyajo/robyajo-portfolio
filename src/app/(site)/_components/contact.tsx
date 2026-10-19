import { ArtStage } from "@/components/layouts/hero-art";
import { PageArt } from "@/components/diagrams/page-art";
import Link from "next/link";
import {
  EnvelopeIcon,
  ArrowUpRightIcon,
  ChatCircleIcon,
} from "@/components/shared/icons";
import { Section } from "@/components/layouts/page";
import { Reveal } from "@/components/shared/reveal";
import {
  TypographyH2,
  TypographyLead,
  TypographyMuted,
  TypographyMark,
} from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { siteConfig } from "@/lib/config";
import { getPlatformIcon } from "@/components/shared/platform-icons";
import { Fragment } from "react";
import { SocialsNudge } from "@/components/shared/doodles";
import { getDictionary } from "@/lib/i18n/server";

export async function Contact() {
  const dict = await getDictionary();
  const content = dict.home.contact;
  return (
    <Section aria-label={content.section} id="contact">
      <Reveal className="w-full max-w-5xl">
        <div className="group/iso @container grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_18rem] lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-8">
            <div className="space-y-4 max-w-2xl">
              <TypographyH2>{content.title}</TypographyH2>

              <TypographyLead>
                {content.leadPrefix}{" "}
                <TypographyMark>{content.leadHighlight}</TypographyMark>
                {content.leadSuffix}
              </TypographyLead>

              <TypographyMuted>
                {content.availability}
              </TypographyMuted>
            </div>

            <nav aria-label={content.linksLabel} className="pt-4 pb-10">
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link
                    href={`mailto:${siteConfig.email}`}
                    aria-label={content.sayHelloAria}
                  >
                    <EnvelopeIcon
                      data-icon="inline-start"
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {content.sayHello}
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline">
                  <Link href="/contact" aria-label={content.writeMessageAria}>
                    <ChatCircleIcon
                      data-icon="inline-start"
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {content.writeMessage}
                  </Link>
                </Button>

                <div className="relative">
                  <ButtonGroup>
                    {siteConfig.social.map((item, index) => (
                      <Fragment key={item.platform}>
                        {index > 0 && <ButtonGroupSeparator />}
                        <Button
                          asChild
                          size="lg"
                          variant="outline"
                        >
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${item.label} ${content.profileAria}`}
                          >
                            {getPlatformIcon(item.platform, "size-4")}
                            <span className="hidden sm:inline">
                              {item.label}
                            </span>
                            <ArrowUpRightIcon
                              data-icon="inline-end"
                              className="size-3.5 opacity-50 hidden @sm:inline-flex"
                              aria-hidden="true"
                            />
                          </a>
                        </Button>
                      </Fragment>
                    ))}
                  </ButtonGroup>
                  <SocialsNudge />
                </div>
              </div>
            </nav>
          </div>
          <ArtStage className="order-first -mx-gutter h-44 md:order-none md:mx-0 md:h-auto md:aspect-[4/3]">
            <PageArt name="contact" />
          </ArtStage>
        </div>
      </Reveal>
    </Section>
  );
}
