import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { SectionMargins } from "@/components/layouts/section-margins";
import {
    Section,
    Card,
    CardGrid,
    CardGridItem,
} from "@/components/layouts/page";
import { LogoDownloadCard } from "@/app/(site)/branding/logo-download-card";
import { BrandingOGPreview } from "@/app/(site)/branding/branding-og-preview";
import {
    CricketDoodle,
    GroupGlyph,
    HoverNudge,
    IceCreamNote,
    OnlinePing,
    PhotoCallout,
    ReactionMascot,
    Signpost,
    SocialsNudge,
    ThemeNudge,
    TypingBubble,
} from "@/components/shared/doodles";
import { LoaderCaption, LogoLoader } from "@/components/shared/loader";
import { Logo } from "@/components/shared/logo";
import {
    TypographyH1,
    TypographyH2,
    TypographyH3,
    TypographyH4,
    TypographyP,
    TypographyLead,
    TypographyMuted,
    TypographyBlockquote,
    TypographyList,
    TypographyInlineCode,
    TypographyLarge,
    TypographySmall,
    TypographyMark,
    SectionLabel,
    SectionHeader,
} from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import { getDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/id";
import { siteConfig } from "@/lib/config";
import type { ReactNode } from "react";

function DoodleStage({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "relative flex h-24 items-center justify-center",
                className,
            )}
        >
            {children}
        </div>
    );
}

interface ShowcaseItem {
    title: string;
    description: string;
    component: ReactNode;
    className?: string;
}

function ShowcaseCard({
    title,
    description,
    component,
    className,
}: ShowcaseItem) {
    return (
        <CardGridItem aria-label={`${title} example`} className={className}>
            <div className="space-y-3">
                <TypographyMuted
                    className="text-xs uppercase tracking-wider"
                    aria-hidden="true"
                >
                    {title}
                </TypographyMuted>
                {component}
                <TypographySmall className="block font-normal text-muted-foreground">
                    {description}
                </TypographySmall>
            </div>
        </CardGridItem>
    );
}

const moods = ["", "terrible", "bad", "good", "amazing"] as const;

function motionItems(b: Dictionary["branding"]): ShowcaseItem[] {
    return [
        {
            title: b.motionItems.sketch[0],
            description: b.motionItems.sketch[1],
            component: (
                <DoodleStage className="h-44">
                    <div className="flex flex-col items-center gap-3">
                        <LogoLoader size={88} />
                        <LoaderCaption />
                    </div>
                </DoodleStage>
            ),
        },
        {
            title: b.motionItems.live[0],
            description: b.motionItems.live[1],
            component: (
                <DoodleStage className="h-44">
                    <div className="flex flex-col items-center gap-1">
                        <div className="group/logo">
                            <Logo
                                size={56}
                                showWordmark
                                alive
                                aria-hidden="true"
                            />
                        </div>
                        <div className="ml-16">
                            <HoverNudge />
                        </div>
                    </div>
                </DoodleStage>
            ),
        },
        {
            title: b.motionItems.margin[0],
            description: b.motionItems.margin[1],
            className: "md:col-span-2",
            component: (
                <div className="flex h-72 flex-col overflow-hidden rounded-lg border border-line">
                    <div className="hatch h-6 shrink-0 border-b border-line" />
                    <div className="relative mx-24 flex-1 border-x border-line bg-background">
                        <SectionMargins label={b.motion} index="07" demo />
                    </div>
                    <div className="hatch h-6 shrink-0 border-t border-line" />
                </div>
            ),
        },
    ];
}

export default async function BrandingPage() {
    const b = (await getDictionary()).branding;
    return (
        <>
            <Section aria-label={b.heroAria}>
                <SectionHeader as="p">{b.heroAria}</SectionHeader>
                <HeroWithArt art={<PageArt name="branding" />}>
                    <TypographyH1>{b.heroTitle}</TypographyH1>
                    <TypographyLead>
                        {b.leadPrefix}{" "}
                        <TypographyMark>{b.leadHighlight}</TypographyMark>{" "}
                        {b.leadSuffix}
                    </TypographyLead>
                </HeroWithArt>
            </Section>

            <Section aria-label={b.typography}>
                <SectionHeader>{b.typography}</SectionHeader>
                <CardGrid>
                    {[
                        {
                            title: b.typeNames.h1,
                            component: (
                                <TypographyH1 as="p">
                                    {b.specimens.h1}
                                </TypographyH1>
                            ),
                        },
                        {
                            title: b.typeNames.h2,
                            component: (
                                <TypographyH2 as="p">
                                    {b.specimens.h2}
                                </TypographyH2>
                            ),
                        },
                        {
                            title: b.typeNames.h3,
                            component: (
                                <TypographyH3 as="p">
                                    {b.specimens.h3}
                                </TypographyH3>
                            ),
                        },
                        {
                            title: b.typeNames.h4,
                            component: (
                                <TypographyH4 as="p">
                                    {b.specimens.h4}
                                </TypographyH4>
                            ),
                        },
                        {
                            title: b.typeNames.paragraph,
                            component: (
                                <TypographyP>
                                    {b.specimens.paragraph}
                                </TypographyP>
                            ),
                        },
                        {
                            title: b.typeNames.lead,
                            component: (
                                <TypographyLead>
                                    {b.specimens.lead}
                                </TypographyLead>
                            ),
                        },
                        {
                            title: b.typeNames.blockquote,
                            component: (
                                <TypographyBlockquote>
                                    {b.specimens.blockquote}
                                </TypographyBlockquote>
                            ),
                        },
                        {
                            title: b.typeNames.list,
                            component: (
                                <TypographyList>
                                    {b.specimens.list.map((li) => (
                                        <li key={li}>{li}</li>
                                    ))}
                                </TypographyList>
                            ),
                        },
                        {
                            title: b.typeNames.inlineCode,
                            component: (
                                <TypographyP>
                                    {b.specimens.inlinePrefix}{" "}
                                    <TypographyInlineCode>
                                        git commit -m &quot;fix&quot;
                                    </TypographyInlineCode>
                                </TypographyP>
                            ),
                        },
                        {
                            title: b.typeNames.large,
                            component: (
                                <TypographyLarge>
                                    {b.specimens.large}
                                </TypographyLarge>
                            ),
                        },
                        {
                            title: b.typeNames.small,
                            component: (
                                <TypographySmall>
                                    {b.specimens.small}
                                </TypographySmall>
                            ),
                        },
                        {
                            title: b.typeNames.muted,
                            component: (
                                <TypographyMuted>
                                    {b.specimens.muted}
                                </TypographyMuted>
                            ),
                        },
                        {
                            title: b.typeNames.mark,
                            component: (
                                <TypographyP>
                                    {b.specimens.markPrefix}{" "}
                                    <TypographyMark>
                                        {b.specimens.markWord}
                                    </TypographyMark>{" "}
                                    {b.specimens.markSuffix}
                                </TypographyP>
                            ),
                        },
                        {
                            title: b.typeNames.sectionLabel,
                            component: (
                                <SectionLabel>
                                    {b.specimens.sectionLabel}
                                </SectionLabel>
                            ),
                        },
                    ].map((item) => (
                        <CardGridItem
                            key={item.title}
                            aria-label={`${item.title} example`}
                        >
                            <div className="space-y-3">
                                <TypographyMuted
                                    className="text-xs uppercase tracking-wider"
                                    aria-hidden="true"
                                >
                                    {item.title}
                                </TypographyMuted>
                                {item.component}
                            </div>
                        </CardGridItem>
                    ))}
                </CardGrid>

                <div className="mt-14 max-w-3xl">
                    <TypographyLead>
                        {b.typoOutroPrefix}{" "}
                        <TypographyMark>{b.typoOutroMark}</TypographyMark>
                        {b.typoOutroSuffix}
                    </TypographyLead>
                </div>
            </Section>

            <Section aria-label={b.logoVariants}>
                <SectionHeader>{b.logoVariants}</SectionHeader>
                <CardGrid columns={3}>
                    {[
                        { label: b.icon, props: {}, description: b.iconDesc },
                        {
                            label: b.wordmark,
                            props: { showWordmark: true },
                            description: b.wordmarkDesc,
                        },
                        {
                            label: b.fullName,
                            props: { showWordmark: true, full: true },
                            description: b.fullNameDesc,
                        },
                    ].map((variant) => (
                        <CardGridItem key={variant.label}>
                            <LogoDownloadCard
                                label={variant.label}
                                description={variant.description}
                                logoProps={variant.props}
                            />
                        </CardGridItem>
                    ))}
                </CardGrid>

                <div
                    role="note"
                    aria-label={b.beforeDownload}
                    className="mt-6 max-w-3xl space-y-1.5 rounded-lg border border-border bg-muted/30 p-4"
                >
                    <SectionLabel>{b.beforeDownload}</SectionLabel>
                    <TypographySmall className="block font-normal leading-relaxed text-muted-foreground">
                        {b.licenseNotePrefix} {b.licenseNoteMid}{" "}
                        {siteConfig.name}, {siteConfig.domain}, the logo,
                        wordmark, or mascot as your own brand, or to imply
                        endorsement. The{" "}
                        <a
                            href={`${siteConfig.repoUrl}/blob/main/LICENSE.md`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-external"
                        >
                            {b.license}
                        </a>{" "}
                        {b.licenseNoteSuffix}
                    </TypographySmall>
                </div>

                <div className="mt-14 max-w-3xl">
                    <TypographyLead>
                        {b.logoOutroPrefix}{" "}
                        <TypographyMark>{b.logoOutroMark}</TypographyMark>
                        {b.logoOutroSuffix}
                    </TypographyLead>
                </div>
            </Section>

            <Section aria-label={b.doodles}>
                <SectionHeader>{b.doodles}</SectionHeader>
                <CardGrid>
                    {[
                        {
                            title: b.doodleItems.photo[0],
                            description: b.doodleItems.photo[1],
                            component: (
                                <div className="pt-12">
                                    <DoodleStage className="h-12">
                                        <PhotoCallout />
                                    </DoodleStage>
                                </div>
                            ),
                        },
                        {
                            title: b.doodleItems.socials[0],
                            description: b.doodleItems.socials[1],
                            component: (
                                <div className="pb-10">
                                    <DoodleStage className="h-12">
                                        <SocialsNudge />
                                    </DoodleStage>
                                </div>
                            ),
                        },
                        {
                            title: b.doodleItems.iceCream[0],
                            description: b.doodleItems.iceCream[1],
                            component: (
                                <DoodleStage>
                                    <IceCreamNote />
                                </DoodleStage>
                            ),
                        },
                        {
                            title: b.doodleItems.theme[0],
                            description: b.doodleItems.theme[1],
                            component: (
                                <DoodleStage>
                                    <ThemeNudge />
                                </DoodleStage>
                            ),
                        },
                        {
                            title: b.doodleItems.online[0],
                            description: b.doodleItems.online[1],
                            component: (
                                <DoodleStage>
                                    <OnlinePing />
                                </DoodleStage>
                            ),
                        },
                        {
                            title: b.doodleItems.nav[0],
                            description: b.doodleItems.nav[1],
                            component: (
                                <DoodleStage>
                                    <div className="flex items-center gap-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <GroupGlyph variant="pages" />
                                            <TypographyMuted className="text-3xs uppercase tracking-wider">
                                                {b.pages}
                                            </TypographyMuted>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <GroupGlyph variant="site" />
                                            <TypographyMuted className="text-3xs uppercase tracking-wider">
                                                {b.site}
                                            </TypographyMuted>
                                        </div>
                                    </div>
                                </DoodleStage>
                            ),
                        },
                        {
                            title: b.doodleItems.cricket[0],
                            description: b.doodleItems.cricket[1],
                            component: (
                                <DoodleStage>
                                    <CricketDoodle />
                                </DoodleStage>
                            ),
                        },
                        {
                            title: b.doodleItems.typing[0],
                            description: b.doodleItems.typing[1],
                            component: (
                                <DoodleStage>
                                    <TypingBubble />
                                </DoodleStage>
                            ),
                        },
                        {
                            title: b.doodleItems.signpost[0],
                            description: b.doodleItems.signpost[1],
                            component: (
                                <DoodleStage className="h-40">
                                    <div className="relative h-36 w-28">
                                        <Signpost />
                                    </div>
                                </DoodleStage>
                            ),
                        },
                        {
                            title: b.doodleItems.reaction[0],
                            description: b.doodleItems.reaction[1],
                            component: (
                                <DoodleStage className="h-auto py-4">
                                    <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-4">
                                        {moods.map((mood) => (
                                            <div
                                                key={mood || "neutral"}
                                                className="flex flex-col items-center gap-1.5"
                                            >
                                                <ReactionMascot mood={mood} />
                                                <TypographyMuted className="text-3xs uppercase tracking-wider">
                                                    {mood || b.neutral}
                                                </TypographyMuted>
                                            </div>
                                        ))}
                                    </div>
                                </DoodleStage>
                            ),
                        },
                    ].map((item) => (
                        <ShowcaseCard key={item.title} {...item} />
                    ))}
                </CardGrid>

                <div className="mt-14 max-w-3xl">
                    <TypographyLead>
                        {b.doodleOutroPrefix}{" "}
                        <TypographyMark>{b.doodleOutroMark}</TypographyMark>
                        {b.doodleOutroSuffix}
                    </TypographyLead>
                </div>
            </Section>

            <Section aria-label={b.motion}>
                <SectionHeader>{b.motion}</SectionHeader>
                <CardGrid>
                    {motionItems(b).map((item) => (
                        <ShowcaseCard key={item.title} {...item} />
                    ))}
                </CardGrid>

                <div className="mt-14 max-w-3xl">
                    <TypographyLead>
                        {b.motionOutroPrefix}{" "}
                        <TypographyMark>{b.motionOutroMark}</TypographyMark>
                        {b.motionOutroSuffix}
                    </TypographyLead>
                </div>
            </Section>

            <Section aria-label={b.og}>
                <SectionHeader>{b.og}</SectionHeader>
                <Card className="max-w-7xl p-0 @lg:p-0 overflow-hidden">
                    <BrandingOGPreview />
                </Card>
                <div className="mt-14 max-w-3xl">
                    <TypographyLead>
                        {b.ogOutroPrefix}{" "}
                        <TypographyMark>{b.ogOutroMark}</TypographyMark>
                        {b.ogOutroSuffix}
                    </TypographyLead>
                </div>
            </Section>
        </>
    );
}
