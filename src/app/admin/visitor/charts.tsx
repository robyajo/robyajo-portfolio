"use client";

import { useState } from "react";
import type { VisitorOverview, RankingItem, SeriesPoint } from "@/lib/visitors";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDictionary } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

type Period = "week" | "month" | "year";

function niceMax(value: number): number {
    if (value <= 4) return Math.max(value, 4);
    const magnitude = 10 ** Math.floor(Math.log10(value));
    return Math.ceil(value / magnitude) * magnitude;
}

function fill(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

function BarChart({
    series,
    totalTemplate,
    peakTemplate,
    empty,
}: {
    series: SeriesPoint[];
    totalTemplate: string;
    peakTemplate: string;
    empty: string;
}) {
    const total = series.reduce((sum, point) => sum + point.count, 0);
    if (total === 0) {
        return <span className="text-sm text-muted-foreground">{empty}</span>;
    }

    const peak = series.reduce(
        (best, point) => (point.count > best.count ? point : best),
        series[0],
    );
    const max = niceMax(Math.max(...series.map((point) => point.count), 1));
    const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0];
    const labelStep = Math.max(Math.ceil(series.length / 8), 1);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                <span className="font-medium">
                    {fill(totalTemplate, { count: total })}
                </span>
                <span className="text-muted-foreground">
                    {fill(peakTemplate, { label: peak.label, count: peak.count })}
                </span>
            </div>
            <div className="flex gap-2">
                <div className="flex w-8 shrink-0 flex-col justify-between py-0.5 text-3xs tabular-nums text-muted-foreground">
                    {ticks.map((tick) => (
                        <span key={tick} className="text-right leading-none">
                            {Math.round(tick)}
                        </span>
                    ))}
                </div>
                <div className="relative h-36 min-w-0 flex-1">
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                        {ticks.map((tick) => (
                            <span
                                key={tick}
                                aria-hidden="true"
                                className="h-px w-full bg-border"
                            />
                        ))}
                    </div>
                    <div className="absolute inset-0 flex items-end gap-px">
                        {series.map((point, index) => (
                            <div
                                key={`${point.label}-${index}`}
                                title={`${point.label}: ${point.count}`}
                                className="group/bar flex h-full min-w-1 flex-1 items-end"
                            >
                                <div
                                    className={cn(
                                        "w-full rounded-t transition-colors",
                                        point.count > 0 && "min-h-0.5",
                                        index === series.length - 1
                                            ? "bg-(--color-available)"
                                            : "bg-(--brand) group-hover/bar:bg-(--brand)/70",
                                    )}
                                    style={{
                                        height: `${(point.count / max) * 100}%`,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <span className="w-8 shrink-0" />
                <div className="flex min-w-0 flex-1 gap-px">
                    {series.map((point, index) => (
                        <span
                            key={`${point.label}-${index}`}
                            className={cn(
                                "min-w-1 flex-1 text-center text-3xs text-muted-foreground",
                                index % labelStep !== 0 && index !== series.length - 1
                                    ? "invisible"
                                    : "",
                            )}
                        >
                            {point.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function RankingBars({ items }: { items: RankingItem[] }) {
    const max = Math.max(...items.map((item) => item.count), 1);
    const total = items.reduce((sum, item) => sum + item.count, 0);
    return (
        <ul className="flex flex-col gap-2">
            {items.map((item) => {
                const share = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                    <li key={item.label} className="flex items-center gap-2 text-sm">
                        <span className="w-28 shrink-0 truncate text-muted-foreground">
                            {item.label}
                        </span>
                        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-(--brand)"
                                style={{ width: `${Math.max((item.count / max) * 100, 4)}%` }}
                            />
                        </div>
                        <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                            {item.count} · {share}%
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

export function VisitorCharts({ overview }: { overview: VisitorOverview }) {
    const dict = useDictionary().admin.visitor;
    const [period, setPeriod] = useState<Period>("week");
    const labels: Record<Period, string> = {
        week: dict.charts.week,
        month: dict.charts.month,
        year: dict.charts.year,
    };

    const sections: { title: string; items: RankingItem[] }[] = [
        { title: dict.rankings.country, items: overview.rankings.countries },
        { title: dict.rankings.browser, items: overview.rankings.browsers },
        { title: dict.rankings.system, items: overview.rankings.systems },
        { title: dict.rankings.screen, items: overview.rankings.forms },
    ];

    return (
        <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                        {dict.charts.title}
                    </span>
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        spacing={1}
                        value={period}
                        onValueChange={(value) => value && setPeriod(value as Period)}
                        aria-label={dict.charts.title}
                    >
                        {(Object.keys(labels) as Period[]).map((value) => (
                            <ToggleGroupItem key={value} value={value}>
                                {labels[value]}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
                <BarChart
                    series={overview[period]}
                    totalTemplate={dict.charts.total}
                    peakTemplate={dict.charts.peak}
                    empty={dict.charts.empty}
                />
            </section>

            <section className="flex flex-col gap-4 rounded-xl border p-4">
                <span className="text-sm text-muted-foreground">
                    {dict.rankings.title}
                </span>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
                    {sections.map((section) => (
                        <div key={section.title} className="flex flex-col gap-2">
                            <span className="text-sm font-medium">{section.title}</span>
                            {section.items.length === 0 ? (
                                <span className="text-sm text-muted-foreground">
                                    {dict.unknown}
                                </span>
                            ) : (
                                <RankingBars items={section.items} />
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
