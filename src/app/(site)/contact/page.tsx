import Link from "next/link";
import type { Metadata } from "next";
import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import { EnvelopeIcon, ArrowUpRightIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
    TypographyH1,
    TypographyH2,
    TypographyLead,
    TypographyMark,
    TypographyMuted,
    TypographyP,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { ContactForm } from "@/app/(site)/contact/contact-form";

export async function generateMetadata(): Promise<Metadata> {
    const content = (await getDictionary()).contactPage;
    const locale = await getLocale();
    return buildMeta({
        locale,
        title: content.title,
        pageTitle: content.pageTitle,
        description: content.description,
        path: "home / contact",
        canonicalPath: "/contact",
        type: "website",
    });
}

export default async function ContactPage() {
    const content = (await getDictionary()).contactPage;

    return (
        <>
            <JsonLd
                type="webpage"
                title={content.pageTitle}
                description={content.description}
                canonicalUrl={`${siteConfig.baseUrl}/contact`}
            />
            <Section variant="hero" aria-label={content.headerAria}>
                <HeroWithArt art={<PageArt name="contact" />}>
                    <TypographyH1>{content.title}</TypographyH1>
                    <TypographyLead>
                        {content.leadPrefix}{" "}
                        <TypographyMark>{content.leadHighlight}</TypographyMark>
                        {content.leadSuffix}
                    </TypographyLead>
                </HeroWithArt>
            </Section>

            <Section aria-label={content.formTitle}>
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="min-w-0 max-w-2xl">
                        <TypographyH2>{content.formTitle}</TypographyH2>
                        <TypographyMuted className="mt-2">
                            {content.formLead}
                        </TypographyMuted>
                        <div className="mt-6">
                            <ContactForm />
                        </div>
                    </div>

                    <aside className="flex flex-col gap-8 border-line lg:border-l lg:pl-10">
                        <div className="flex flex-col gap-2">
                            <TypographyH2>{content.directTitle}</TypographyH2>
                            <TypographyP>{content.directLead}</TypographyP>
                            <Button
                                asChild
                                variant="outline"
                                className="mt-2 w-max"
                            >
                                <Link href={`mailto:${siteConfig.email}`}>
                                    <EnvelopeIcon
                                        data-icon="inline-start"
                                        aria-hidden="true"
                                    />
                                    {siteConfig.email}
                                    <ArrowUpRightIcon
                                        data-icon="inline-end"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </Button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <TypographyH2>{content.responseTitle}</TypographyH2>
                            <TypographyP>{content.responseBody}</TypographyP>
                        </div>
                    </aside>
                </div>
            </Section>
        </>
    );
}
