import Link from "next/link";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import {
  TypographyH2,
  TypographyLead,
  TypographyMark,
  TypographyMuted,
} from "@/components/ui/typography";
import { Reveal } from "@/components/shared/reveal";
import { getRecentActivities } from "@/lib/activities";
import { splitActivityBody } from "@/lib/activities-schema";
import { formatShortDate } from "@/lib/date";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

function pick(locale: Locale, id: string, en: string): string {
    return locale === "id" ? id : en;
}

export async function ActivityFeed({
    limit = 6,
    projectKey,
    showLead = true,
}: {
    limit?: number;
    projectKey?: string;
    showLead?: boolean;
}) {
    const locale = await getLocale();
    const dict = await getDictionary(locale);
    const content = dict.activity;
    const dateLocale = locale === "id" ? "id-ID" : "en-US";
    const items = await getRecentActivities(limit, projectKey);

    return (
        <Section aria-label={content.section}>
            <JsonLd
                type="itemList"
                name={content.section}
                description={`${content.leadPrefix} ${content.leadHighlight}${content.leadSuffix}`}
                items={items.map((a) => ({
                    name: pick(locale, a.titleId, a.titleEn),
                    ...(a.url ? { url: a.url } : {}),
                    date: a.occurredAt,
                }))}
            />
            <TypographyH2 className="sr-only">{content.section}</TypographyH2>
            <Reveal className="group/iso">
                {showLead && (
                    <div className="mb-8 max-w-2xl">
                        <TypographyLead>
                            {content.leadPrefix}{" "}
                            <TypographyMark>{content.leadHighlight}</TypographyMark>
                            {content.leadSuffix}
                        </TypographyLead>
                    </div>
                )}
                {items.length === 0 ? (
                    <TypographyMuted className="font-mono text-sm">{content.empty}</TypographyMuted>
                ) : (
                    <ul role="list" className="flex flex-col divide-y divide-border border-y border-line">
                        {items.map((a) => {
                            const title = pick(locale, a.titleId, a.titleEn);
                            const { lead, bullets } = splitActivityBody(
                                pick(locale, a.bodyId ?? "", a.bodyEn ?? ""),
                            );
                            const kind = content.kinds[a.kind as keyof typeof content.kinds] ?? a.kind;
                            const inner = (
                                <>
                                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="rounded-md bg-(--brand)/10 px-2 py-0.5 font-mono text-xs text-(--brand-text)">
                                            {a.projectName}
                                        </span>
                                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                            {kind}
                                        </span>
                                        <time
                                            dateTime={a.occurredAt}
                                            className="ml-auto font-mono text-xs text-muted-foreground tabular-nums"
                                        >
                                            {formatShortDate(a.occurredAt, dateLocale)}
                                        </time>
                                    </span>
                                    <span className="block font-medium text-foreground">{title}</span>
                                    {(lead || bullets.length > 0) && (
                                        <span className="block text-sm text-muted-foreground leading-relaxed">
                                            {lead && <span className="block">{lead}</span>}
                                            {bullets.length > 0 && (
                                                <span className="mt-1.5 flex flex-col gap-1">
                                                    {bullets.map((b) => (
                                                        <span key={b} className="flex gap-1.5">
                                                            <span aria-hidden="true">–</span>
                                                            <span className="min-w-0">{b}</span>
                                                        </span>
                                                    ))}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </>
                            );
                            return (
                                <li key={a.id} className="py-4">
                                    {a.url ? (
                                        <Link
                                            href={a.url as never}
                                            target={a.url.startsWith("http") ? "_blank" : undefined}
                                            rel={a.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                            className="block space-y-1.5 hover:opacity-90"
                                        >
                                            {inner}
                                        </Link>
                                    ) : (
                                        <div className="space-y-1.5">{inner}</div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Reveal>
        </Section>
    );
}
