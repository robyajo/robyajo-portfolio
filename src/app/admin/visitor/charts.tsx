"use client";

import { useState } from "react";
import type { VisitorOverview } from "@/lib/visitors";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDictionary } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

type Period = "week" | "month" | "year";

function RankingBars({ items, color }: { items: { label: string; count: number }[]; color?: string }) {
    const max = Math.max(...items.map((item) => item.count), 1);
    return (
        <ul className="flex flex-col gap-2">
            {items.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                    <span className="w-28 shrink-0 truncate text-muted-foreground">
                        {item.label}
                    </span>
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                            className={cn("h-full rounded-full", color ?? "bg-(--brand)")}
                            style={{ width: `${Math.round((item.count / max) * 100)}%` }}
                        />
                    </div>
                    <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
                        {item.count}
                    </span>
                </li>
            ))}
        </ul>
    );
}

export function VisitorCharts({ overview }: { overview: VisitorOverview }) {
    const dict = useDictionary().admin.visitor;
    const [period, setPeriod] = useState<Period>("week");
    const series = overview[period];
    const max = Math.max(...series.map((point) => point.count), 1);
    const tabs: { value: Period; label: string }[] = [
        { value: "week", label: dict.charts.week },
        { value: "month", label: dict.charts.month },
        { value: "year", label: dict.charts.year },
    ];

    return (
        <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3 rounded-xl border p-4">
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
                        {tabs.map((tab) => (
                            <ToggleGroupItem key={tab.value} value={tab.value}>
                                {tab.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
                {series.length === 0 ? (
                    <span className="text-sm text-muted-foreground">{dict.charts.empty}</span>
                ) : (
                    <div
                        role="img"
                        aria-label={dict.charts.title}
                        className="flex h-32 items-end gap-0.5"
                    >
                        {series.map((point, index) => (
                            <div
                                key={`${point.label}-${index}`}
                                title={`${point.label}: ${point.count}`}
                                className="h-full min-w-[4px] flex-1"
                            >
                                <div
                                    className={cn(
                                        "w-full rounded-t",
                                        index === series.length - 1 ? "bg-(--color-available)" : "bg-(--brand)",
                                    )}
                                    style={{ height: `${Math.max((point.count / max) * 100, point.count > 0 ? 6 : 1)}%` }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="flex flex-col gap-3 rounded-xl border p-4">
                <span className="text-sm text-muted-foreground">
                    {dict.rankings.title}
                </span>
                <div className="grid gap-x-8 gap-y-6 grid-cols-1 lg:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">{dict.rankings.country}</span>
                        {overview.rankings.countries.length === 0 ? (
                            <span className="text-sm text-muted-foreground">{dict.unknown}</span>
                        ) : (
                            <RankingBars items={overview.rankings.countries} />
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">{dict.rankings.browser}</span>
                        {overview.rankings.browsers.length === 0 ? (
                            <span className="text-sm text-muted-foreground">{dict.unknown}</span>
                        ) : (
                            <RankingBars items={overview.rankings.browsers} />
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">{dict.rankings.system}</span>
                        {overview.rankings.systems.length === 0 ? (
                            <span className="text-sm text-muted-foreground">{dict.unknown}</span>
                        ) : (
                            <RankingBars items={overview.rankings.systems} />
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">{dict.rankings.screen}</span>
                        {overview.rankings.forms.length === 0 ? (
                            <span className="text-sm text-muted-foreground">{dict.unknown}</span>
                        ) : (
                            <RankingBars items={overview.rankings.forms} />
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
