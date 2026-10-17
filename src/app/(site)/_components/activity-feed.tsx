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
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "@/components/shared/icons";
import { getRecentActivities } from "@/lib/activities";
import {
  activityBadgeVariant,
  splitActivityBody,
  type ActivityBullet,
} from "@/lib/activities-schema";
import { formatShortDate } from "@/lib/date";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

function pick(locale: Locale, id: string, en: string): string {
    return locale === "id" ? id : en;
}

function bulletLabel(
    bullet: ActivityBullet,
    itemKinds: Record<string, string>,
): string {
    if (!bullet.kind) return "";
    return itemKinds[bullet.kind] ?? bullet.kind;
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
                    <span className="font-mono text-sm text-muted-foreground">{content.empty}</span>
                ) : (
                    <ul role="list" className="flex flex-col gap-6">
                        {items.map((a) => {
                            const title = pick(locale, a.titleId, a.titleEn);
                            const { lead, bullets } = splitActivityBody(
                                pick(locale, a.bodyId ?? "", a.bodyEn ?? ""),
                            );
                            const kindLabel =
                                content.kinds[a.kind as keyof typeof content.kinds] ?? a.kind;
                            const titleNode = (
                                <span className="block text-lg font-bold leading-snug text-foreground">
                                    {title}
                                </span>
                            );
                            return (
                                <li
                                    key={a.id}
                                    id={`kegiatan-${a.id}`}
                                    className="flex flex-col gap-2.5 border-b border-line pb-6 last:border-none last:pb-0"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            <CalendarIcon
                                                className="size-4 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                            <time
                                                dateTime={a.occurredAt}
                                                className="tabular-nums"
                                            >
                                                {formatShortDate(a.occurredAt, dateLocale)}
                                            </time>
                                        </span>
                                        <Badge variant={activityBadgeVariant(a.kind)}>
                                            {kindLabel}
                                        </Badge>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        {a.url ? (
                                            <Link
                                                href={a.url as never}
                                                target={a.url.startsWith("http") ? "_blank" : undefined}
                                                rel={a.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                                className="hover:underline underline-offset-4"
                                            >
                                                {titleNode}
                                            </Link>
                                        ) : (
                                            titleNode
                                        )}
                                    </div>
                                    {lead && (
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {lead}
                                        </p>
                                    )}
                                    {bullets.length > 0 && (
                                        <div className="mt-1 flex flex-col gap-2 rounded-xl border border-line p-3">
                                            <span className="text-3xs font-medium uppercase tracking-widest text-muted-foreground">
                                                {content.detailsLabel} ({bullets.length})
                                            </span>
                                            <ul role="list" className="flex flex-col gap-2">
                                                {bullets.map((b) => {
                                                    const label = bulletLabel(b, content.itemKinds);
                                                    return (
                                                        <li
                                                            key={b.text}
                                                            className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3 max-md:flex-col max-md:gap-1.5"
                                                        >
                                                            {label && (
                                                                <Badge
                                                                    variant={activityBadgeVariant(b.kind)}
                                                                    size="tiny"
                                                                    className="mt-0.5 shrink-0"
                                                                >
                                                                    {label}
                                                                </Badge>
                                                            )}
                                                            <span className="text-sm leading-relaxed text-foreground">
                                                                {b.text}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
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
