"use client";

import { useMemo, useState } from "react";
import { fetchWorkReportActivities } from "@/app/(site)/projects/[slug]/report-actions";
import type { Activity } from "@/lib/activities";
import { splitActivityBody } from "@/lib/activities-schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DownloadIcon } from "@/components/shared/icons";
import { TypographyMuted } from "@/components/ui/typography";
import { useDictionary, useLocale } from "@/lib/i18n/provider";
import type { useDictionary as useDictionaryType } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/config";

type Dict = ReturnType<typeof useDictionaryType>;

function dayOf(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function kindText(
  dict: Dict["activity"],
  kind: string | null,
  mapping: "kinds" | "itemKinds",
): string {
  if (!kind) return "";
  const source = dict[mapping];
  return source[kind as keyof typeof source] ?? kind;
}

interface ReportItem {
  kind: string;
  title: string;
  lead: string;
  bullets: Array<{ kind: string | null; text: string }>;
}

interface ReportDay {
  pretty: string;
  items: ReportItem[];
}

interface ReportContent {
  projectTitle: string;
  url: string;
  isId: boolean;
  locale: Locale;
  dict: Dict;
  days: ReportDay[];
}

function reportHtml(content: ReportContent): string {
  const { dict, locale, isId } = content;
  const today = new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
  }).format(new Date());

  const createdLabel = isId ? "Dibuat" : "Created";
  const linkLabel = isId ? "Tautan" : "Link";
  const countLabel = isId ? "Jumlah kegiatan" : "Activities";
  const activityWord = isId ? "kegiatan" : "activities";

  const selectedCount = content.days.reduce(
    (sum, day) => sum + day.items.length,
    0,
  );

  const body = content.days
    .map(({ pretty, items }) => {
      const itemHtml = items
        .map((item) => {
          const kindLabel2 = kindText(dict.activity, item.kind, "kinds");
          const bullets = item.bullets
            .map((bullet) => {
              const label = kindText(
                dict.activity,
                bullet.kind,
                "itemKinds",
              );
              return label
                ? `<li><strong>${escapeHtml(label)}</strong> — ${escapeHtml(bullet.text)}</li>`
                : `<li>${escapeHtml(bullet.text)}</li>`;
            })
            .join("\n");
          return [
            `<h3>${escapeHtml(kindLabel2 ? `[${kindLabel2}] ` : "")}${escapeHtml(item.title)}</h3>`,
            item.lead ? `<p>${escapeHtml(item.lead)}</p>` : "",
            bullets ? `<ul>${bullets}</ul>` : "",
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n");
      return `<h2>${escapeHtml(pretty)}</h2>\n${itemHtml}`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(isId ? "Laporan Kerja" : "Work Report")} — ${escapeHtml(content.projectTitle)}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; line-height: 1.6; color: #1c1c1c; max-width: 46em; margin: 2em auto; }
  h1 { margin-bottom: 0.2em; }
  h3 { margin: 1.2em 0 0.2em; }
  ul { margin: 0.4em 0 0.8em; }
  .meta { color: #555; font-size: 0.9em; border-bottom: 1px solid #ccc; padding-bottom: 1em; }
  @page { margin: 2cm; }
</style>
</head>
<body>
<h1>${escapeHtml(isId ? "Laporan Kerja" : "Work Report")} — ${escapeHtml(content.projectTitle)}</h1>
<p class="meta">
  ${escapeHtml(createdLabel)}: ${escapeHtml(today)} ·
  ${escapeHtml(linkLabel)}: ${escapeHtml(content.url)} ·
  ${escapeHtml(countLabel)}: ${selectedCount} ${escapeHtml(activityWord)}
</p>
${body}
</body>
</html>`;
}

export function WorkReportButton({ slug }: { slug: string }) {
  const dict = useDictionary();
  const t = dict.projectsDetail;
  const locale = useLocale();
  const isId = locale === "id";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    projectTitle: string;
    url: string;
    activities: Activity[];
  } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function openDialog() {
    setOpen(true);
    if (data) return;
    setLoading(true);
    fetchWorkReportActivities(slug)
      .then((result) => {
        setData(result);
        if (result) setSelected(new Set(result.activities.map((a) => a.id)));
      })
      .finally(() => setLoading(false));
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.activities.filter((a) => {
      const day = dayOf(a.occurredAt);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [data, from, to]);

  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const item of filtered) {
      const day = dayOf(item.occurredAt);
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected =
    filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((a) => next.add(a.id));
      return next;
    });
  }

  function clearSelection() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((a) => next.delete(a.id));
      return next;
    });
  }

  const selectedInFilter = filtered.filter((a) => selected.has(a.id));

  function buildContent(): string | null {
    if (!data) return null;
    const dateLocale = isId ? "id-ID" : "en-US";

    const picked = [...selectedInFilter]
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .map((item) => {
        const { lead, bullets } = splitActivityBody(
          isId ? item.bodyId : item.bodyEn,
        );
        const title = (isId ? item.titleId : item.titleEn) || "";
        return {
          day: dayOf(item.occurredAt),
          item: {
            kind: item.kind,
            title,
            lead: lead.trim(),
            bullets,
          } satisfies ReportItem,
        };
      });

    const dayMap = new Map<string, ReportDay>();
    for (const { day, item } of picked) {
      const pretty = new Intl.DateTimeFormat(dateLocale, {
        timeZone: "Asia/Jakarta",
        dateStyle: "full",
      }).format(new Date(`${day}T00:00:00Z`));
      const existing = dayMap.get(day) ?? { pretty, items: [] };
      existing.items.push(item);
      dayMap.set(day, existing);
    }

    return reportHtml({
      projectTitle: data.projectTitle,
      url: data.url,
      isId,
      locale,
      dict,
      days: [...dayMap.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([, day]) => day),
    });
  }

  function downloadWord() {
    const html = buildContent();
    if (!html) return;
    const blob = new Blob(["\ufeff", html], {
      type: "application/msword;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${isId ? "laporan-kerja" : "work-report"}-${slug}-${dayOf(new Date().toISOString())}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function printReport() {
    const html = buildContent();
    if (!html) return;
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.border = "0";
    frame.srcdoc = html;
    frame.addEventListener("load", () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 60000);
    });
    document.body.appendChild(frame);
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openDialog}>
        <DownloadIcon
          data-icon="inline-start"
          className="size-3.5"
          aria-hidden="true"
        />
        {t.reportButtonText}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.reportTitle}</DialogTitle>
            <DialogDescription>{t.reportDialogDescription}</DialogDescription>
          </DialogHeader>

          {loading || !data ? (
            <TypographyMuted asChild>
              <span className="text-sm">{t.reportLoading}</span>
            </TypographyMuted>
          ) : data.activities.length === 0 ? (
            <TypographyMuted asChild>
              <span className="text-sm">{t.reportEmptyData}</span>
            </TypographyMuted>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-muted-foreground">{t.reportFrom}</span>
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-muted-foreground">{t.reportTo}</span>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={allSelected ? clearSelection : selectAllFiltered}
                >
                  {allSelected ? t.reportClear : t.reportSelectAll}
                </Button>
                <TypographyMuted asChild>
                  <span className="text-xs">
                    {t.reportSelected.replace(
                      "{count}",
                      String(selectedInFilter.length),
                    )}
                  </span>
                </TypographyMuted>
              </div>

              <div className="flex max-h-72 flex-col gap-3 overflow-y-auto rounded-lg border p-3">
                {grouped.map(([day, items]) => (
                  <div key={day} className="flex flex-col gap-1.5">
                    <TypographyMuted asChild>
                      <span className="text-3xs font-medium uppercase tracking-widest">
                        {day}
                      </span>
                    </TypographyMuted>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2.5 rounded-md p-2 hover:bg-muted/50"
                      >
                        <Label
                          htmlFor={`report-activity-${item.id}`}
                          className="flex w-full min-w-0"
                        >
                          <Checkbox
                            id={`report-activity-${item.id}`}
                            checked={selected.has(item.id)}
                            onCheckedChange={() => toggle(item.id)}
                            className="mt-0.5"
                          />
                          <span className="min-w-0 pl-2.5">
                            <span className="block text-sm leading-snug">
                              {(isId ? item.titleId : item.titleEn) || day}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {kindText(dict.activity, item.kind, "kinds") ||
                                item.kind}
                            </span>
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <TypographyMuted asChild>
                    <span className="text-sm">{t.reportEmptySelection}</span>
                  </TypographyMuted>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={selectedInFilter.length === 0}
                  onClick={downloadWord}
                >
                  <DownloadIcon
                    data-icon="inline-start"
                    className="size-3.5"
                    aria-hidden="true"
                  />
                  {t.reportDownloadWord}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={selectedInFilter.length === 0}
                  onClick={printReport}
                >
                  {t.reportDownloadPdf}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
