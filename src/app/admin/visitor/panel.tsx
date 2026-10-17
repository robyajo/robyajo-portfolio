"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVisitorMonitor } from "@/app/admin/actions";
import type { VisitorMonitor } from "@/app/admin/actions";
import type { VisitorOverview } from "@/lib/visitors";
import { VisitorCharts } from "./charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UsersIcon } from "@/components/shared/icons";
import { useDictionary, useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const REFRESH_PLACEHOLDER = "—";

function flagOf(code: string | null): string | null {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return String.fromCodePoint(...[...upper].map((c) => 127397 + c.charCodeAt(0)));
}

function onlineOf(iso: string, now: number): boolean {
  return now - new Date(iso).getTime() < ONLINE_WINDOW_MS;
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold tabular-nums">
        {value.toLocaleString()}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function VisitorPanel({
  initial,
  overview,
  ariaLabel,
}: {
  initial: VisitorMonitor;
  overview: VisitorOverview;
  ariaLabel: string;
}) {
  const dict = useDictionary().admin.visitor;
  const locale = useLocale();
  const dateLocale = locale === "id" ? "id-ID" : "en-US";
  const [monitor, setMonitor] = useState(initial);
  const [loading, setLoading] = useState(false);
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

  async function refresh() {
    setLoading(true);
    try {
      setMonitor(await getVisitorMonitor());
      setNow(Date.now());
    } finally {
      setLoading(false);
    }
  }

  const relative = (iso: string) => {
    if (!now) return REFRESH_PLACEHOLDER;
    const diff = now - new Date(iso).getTime();
    const formatter = new Intl.RelativeTimeFormat(dateLocale, { numeric: "auto" });
    const minutes = Math.round(diff / 60000);
    if (Math.abs(minutes) < 60) return formatter.format(-minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 48) return formatter.format(-hours, "hour");
    return formatter.format(-Math.round(hours / 24), "day");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          {dict.tableTitle}
        </span>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          {dict.refresh}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label={dict.cards.devices} value={monitor.stats.total} />
        <Stat label={dict.cards.today} value={monitor.stats.today} />
        <Stat label={dict.cards.online} value={monitor.stats.online} />
        <Stat label={dict.cards.views} value={monitor.stats.views} />
        <Stat label={dict.cards.countries} value={monitor.stats.countries} />
      </div>

      <VisitorCharts overview={overview} />

      {monitor.rows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <UsersIcon weight="duotone" className="size-6" />
            </EmptyMedia>
            <EmptyTitle>{dict.emptyTitle}</EmptyTitle>
            <EmptyDescription>{dict.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table aria-label={ariaLabel}>
          <TableHeader>
            <TableRow>
              {[dict.columns.hash, dict.columns.device, dict.columns.location, dict.columns.views, dict.columns.firstSeen, dict.columns.lastSeen].map((head) => (
                <TableHead key={head}>
                  <span className="text-sm text-muted-foreground">
                    {head}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {monitor.rows.map((row) => {
              const online = now > 0 && onlineOf(row.lastSeenAt, now);
              return (
                <TableRow key={row.hash}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          online ? "bg-(--color-available)" : "bg-muted-foreground/40",
                        )}
                      />
                      <Link
                        href={`/admin/visitor/${row.hash}`}
                        className="font-mono text-xs underline-offset-2 hover:underline"
                      >
                        {row.hash}…
                      </Link>
                      {online && (
                        <Badge variant="positive" size="tiny">
                          {dict.onlineLabel}
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{row.device ?? dict.unknown}</span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-baseline gap-2">
                      <span aria-hidden="true">{flagOf(row.country)}</span>
                      <span className="text-sm">
                        {[row.city, row.region, row.country]
                          .filter((part) => part && part.length > 2)
                          .join(", ") || dict.unknown}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm tabular-nums">
                      {row.views.toLocaleString(dateLocale)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span suppressHydrationWarning className="text-xs text-muted-foreground tabular-nums">
                      {relative(row.firstSeenAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span suppressHydrationWarning className="text-xs text-muted-foreground tabular-nums">
                      {relative(row.lastSeenAt)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
