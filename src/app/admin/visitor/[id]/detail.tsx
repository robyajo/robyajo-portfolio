"use client";

import Link from "next/link";
import type { VisitorDetail as VisitorDetailData } from "@/lib/visitors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@/components/shared/icons";
import { TypographyH1, TypographyLead } from "@/components/ui/typography";
import { useEffect, useState } from "react";
import { useDictionary, useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

const ONLINE_WINDOW_MS = 5 * 60_000;

function flagOf(code: string | null): string | null {
    if (!code || code.length !== 2) return null;
    const upper = code.toUpperCase();
    if (!/^[A-Z]{2}$/.test(upper)) return null;
    return String.fromCodePoint(...[...upper].map((c) => 127397 + c.charCodeAt(0)));
}

export function VisitorDetail({ visitor }: { visitor: VisitorDetailData }) {
    const dict = useDictionary().admin.visitor;
    const t = dict.detail;
    const locale = useLocale();
    const dateLocale = locale === "id" ? "id-ID" : "en-US";

    const [now, setNow] = useState(0);

    useEffect(() => {
        const tick = () => setNow(Date.now());
        const initial = window.setTimeout(tick, 0);
        const interval = window.setInterval(tick, 60_000);
        return () => {
            window.clearTimeout(initial);
            window.clearInterval(interval);
        };
    }, []);

    const online =
        now > 0 && now - new Date(visitor.lastSeenAt).getTime() < ONLINE_WINDOW_MS;

    const formatter = new Intl.DateTimeFormat(dateLocale, {
        dateStyle: "full",
        timeStyle: "short",
    });
    const format = (iso: string) => formatter.format(new Date(iso));

    const locationParts = [visitor.city, visitor.region, visitor.country]
        .filter((part) => part && part.length > 2)
        .join(", ");
    const fields = [
        { label: t.device, value: visitor.device ?? dict.unknown },
        { label: t.browser, value: visitor.browser || t.empty },
        { label: t.os, value: visitor.os || t.empty },
        { label: t.formFactor, value: visitor.formFactor || t.empty },
        { label: t.userAgent, value: visitor.userAgent || t.empty },
        {
            label: t.location,
            value: locationParts || dict.unknown,
            flag: flagOf(visitor.country),
        },
        { label: t.views, value: visitor.views.toLocaleString(dateLocale) },
        { label: t.firstSeen, value: format(visitor.firstSeenAt) },
        { label: t.lastSeen, value: format(visitor.lastSeenAt) },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-start gap-1">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/visitor">
                        <ArrowLeftIcon className="size-4" />
                        {t.back}
                    </Link>
                </Button>
                <TypographyH1>{dict.detailHeading}</TypographyH1>
                <TypographyLead>{dict.description}</TypographyLead>
                <span className="text-xs text-muted-foreground">{t.hashNote}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t.status}</span>
                <span
                    aria-hidden="true"
                    className={cn(
                        "size-2 shrink-0 rounded-full",
                        online ? "bg-(--color-available)" : "bg-muted-foreground/40",
                    )}
                />
                {online ? (
                    <Badge variant="positive" size="tiny">
                        {t.online}
                    </Badge>
                ) : (
                    <Badge variant="neutral" size="tiny">
                        {t.offline}
                    </Badge>
                )}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((field) => (
                    <div
                        key={field.label}
                        className="flex flex-col gap-2 rounded-lg border p-4"
                    >
                        <span className="text-sm text-muted-foreground">{field.label}</span>
                        <span className="flex items-baseline gap-2 text-sm font-bold">
                            <span aria-hidden="true">{field.flag}</span>
                            <span suppressHydrationWarning>{field.value}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
