import { EndOfPage } from "@/components/shared/end-of-page";
import {
    GroupGlyph,
    OnlinePing,
    ThemeNudge,
} from "@/components/shared/doodles";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
    SectionLabel,
    TypographyMuted,
    TypographySmall,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { getPlatformIcon } from "@/components/shared/platform-icons";
import { currentYear, formatShortDate } from "@/lib/date";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { navLabel, isNavHref } from "@/lib/i18n/nav";
import { getRecentActivities } from "@/lib/activities";
import Link from "next/link";
import type { Route } from "next";

export async function Footer() {
    const dict = await getDictionary();
    const [locale, lastActivity] = await Promise.all([
        getLocale(),
        getRecentActivities(1),
    ]);
    const dateLocale = locale === "id" ? "id-ID" : "en-US";
    const lastUpdated = lastActivity[0];
    const linkGroups = [
        { title: dict.footer.pages, variant: "pages", links: siteConfig.nav },
        {
            title: dict.footer.site,
            variant: "site",
            links: [
                { href: "/branding", label: dict.footer.branding },
                { href: "/privacy-policy", label: dict.footer.privacy },
            ],
        },
    ] as const;
    return (
        <footer className="relative -mt-px" aria-label="Site footer">
            <div className="mx-auto max-w-5xl border border-b-0 border-line bg-line">
                <div className="flex flex-col gap-14 rounded-t-2xl bg-background px-gutter pt-12 pb-12">
                    <EndOfPage />

                    <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
                        <div className="flex flex-col gap-4">
                            <Link
                                href="/"
                                aria-label={`${siteConfig.name}, ${dict.header.homeLabel}`}
                                className="w-max"
                            >
                                <Logo
                                    size={32}
                                    showWordmark
                                    aria-hidden="true"
                                />
                            </Link>
                            <TypographyMuted className="max-w-sm text-balance leading-relaxed">
                                {dict.footer.description}
                            </TypographyMuted>

                            <TypographySmall className="font-mono text-2xs uppercase tracking-mega text-muted-foreground">
                                {dict.footer.tagline}
                            </TypographySmall>

                            <SectionLabel className="inline-flex items-center gap-1.5">
                                <OnlinePing />
                                {dict.footer.elsewhere}
                            </SectionLabel>
                            <nav
                                aria-label={dict.footer.socialAria}
                                className="flex gap-2"
                            >
                                {siteConfig.social.map((item) => (
                                    <Button
                                        key={item.label}
                                        asChild
                                        size="icon-sm"
                                        variant="outline"
                                        className="bg-background/70 pointer-coarse:size-11"
                                    >
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`${item.label} (${dict.footer.opensInNewTab})`}
                                        >
                                            {getPlatformIcon(item.platform)}
                                        </a>
                                    </Button>
                                ))}
                            </nav>
                        </div>

                        <div className="grid grid-cols-2 gap-8 sm:gap-12">
                            {linkGroups.map(({ title, variant, links }) => (
                                <nav
                                    key={title}
                                    aria-label={`${title} ${dict.footer.linksWord}`}
                                    className="flex flex-col gap-3"
                                >
                                    <SectionLabel className="inline-flex items-center gap-1.5">
                                        <GroupGlyph variant={variant} />
                                        {title}
                                    </SectionLabel>
                                    <ul
                                        role="list"
                                        className="flex flex-col gap-1"
                                    >
                                        {links.map(({ href, label }) => (
                                            <li key={href}>
                                                <Link
                                                    href={href as Route}
                                                    className="inline-flex min-h-8 items-center text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline pointer-coarse:min-h-11"
                                                >
                                                    <TypographySmall>
                                                        {isNavHref(href)
                                                            ? navLabel(
                                                                  href,
                                                                  dict,
                                                              )
                                                            : label}
                                                    </TypographySmall>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <TypographyMuted className="font-mono tabular-nums">
                            <span className="block">
                                &copy; 2021–{currentYear()} {siteConfig.name}.{" "}
                                {dict.footer.rightsReserved}
                            </span>
                            {lastUpdated && (
                                <span className="block">
                                    {dict.footer.lastUpdate}{" "}
                                    {formatShortDate(lastUpdated.occurredAt, dateLocale)}
                                </span>
                            )}
                        </TypographyMuted>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <ThemeNudge />
                            <ThemeToggle aria-label={dict.footer.toggleTheme} />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
