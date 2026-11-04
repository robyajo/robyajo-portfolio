"use client";

import { useState } from "react";
import type { DynamicCardDto } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyIcon, CheckIcon, DownloadIcon, ArrowSquareOutIcon } from "@/components/shared/icons";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export function DynamicCardCustomizer({
  cards,
}: {
  cards: DynamicCardDto[];
}) {
  const [selectedType, setSelectedType] = useState<string>(cards[0]?.type || "banner");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [copiedKind, setCopiedKind] = useState<"url" | "markdown" | "html" | null>(null);

  const current = cards.find((c) => c.type === selectedType) || cards[0];

  const queryParams = new URLSearchParams({
    type: selectedType,
    theme,
  });

  const relativeUrl = `/svg?${queryParams.toString()}`;
  const absoluteUrl = `https://ajoroby.is-a.dev${relativeUrl}`;

  const markdownSnippet = `[![${current?.title || selectedType}](${absoluteUrl})](https://ajoroby.is-a.dev)`;
  const htmlSnippet = `<img src="${absoluteUrl}" alt="${current?.title || selectedType}" width="600" />`;

  const copy = (text: string, kind: "url" | "markdown" | "html") => {
    navigator.clipboard.writeText(text);
    setCopiedKind(kind);
    toast.success(`Berhasil menyalin ${kind.toUpperCase()}!`);
    setTimeout(() => setCopiedKind(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card/60 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
            <span>Generator Kartu Dinamis Readme & Status</span>
            <Badge variant="outline" className="text-2xs font-mono uppercase">
              /svg?type={selectedType}
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kartu SVG yang digenerate langsung oleh server Next.js (SSG/ISR) untuk disematkan di GitHub Profile Readme atau dokumentasi.
          </p>
        </div>

        {/* Kontrol Pilihan Template & Tema */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-8 text-xs w-[180px]">
              <SelectValue placeholder="Pilih Template" />
            </SelectTrigger>
            <SelectContent>
              {cards.map((c) => (
                <SelectItem key={c.type} value={c.type} className="text-xs">
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-md border p-0.5 bg-muted/40 shrink-0">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "px-2.5 py-1 text-xs rounded font-medium transition-colors",
                theme === "light"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "px-2.5 py-1 text-xs rounded font-medium transition-colors",
                theme === "dark"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Pratinjau Langsung Kartu SVG */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-2xs font-mono text-muted-foreground">
          <span>Pratinjau Langsung ({theme.toUpperCase()} MODE):</span>
          <span>{current?.description}</span>
        </div>

        <div
          className={cn(
            "relative flex min-h-[180px] w-full items-center justify-center rounded-xl border p-6 transition-colors overflow-x-auto",
            theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={relativeUrl}
            alt={current?.title || selectedType}
            className="max-w-full h-auto shadow-sm rounded transition-all"
            loading="eager"
          />
        </div>
      </div>

      {/* Snippet Embed Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Markdown Embed */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold font-mono uppercase text-foreground">
                GitHub Markdown Embed
              </span>
              <span className="text-3xs text-muted-foreground">Untuk README.md</span>
            </div>
            <pre className="font-mono text-3xs text-muted-foreground truncate bg-background/60 p-2 rounded mt-1.5 border">
              {markdownSnippet}
            </pre>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copy(markdownSnippet, "markdown")}
            className="w-full h-7 text-xs font-mono gap-1"
          >
            {copiedKind === "markdown" ? (
              <CheckIcon className="size-3 text-emerald-500" />
            ) : (
              <CopyIcon className="size-3" />
            )}
            Salin Markdown
          </Button>
        </div>

        {/* HTML Embed */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold font-mono uppercase text-foreground">
                HTML Embed Tag
              </span>
              <span className="text-3xs text-muted-foreground">Untuk Web / Docs</span>
            </div>
            <pre className="font-mono text-3xs text-muted-foreground truncate bg-background/60 p-2 rounded mt-1.5 border">
              {htmlSnippet}
            </pre>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copy(htmlSnippet, "html")}
            className="w-full h-7 text-xs font-mono gap-1"
          >
            {copiedKind === "html" ? (
              <CheckIcon className="size-3 text-emerald-500" />
            ) : (
              <CopyIcon className="size-3" />
            )}
            Salin HTML
          </Button>
        </div>

        {/* URL Langsung */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold font-mono uppercase text-foreground">
                Endpoint URL Publik
              </span>
              <span className="text-3xs text-muted-foreground">Direct Link</span>
            </div>
            <pre className="font-mono text-3xs text-muted-foreground truncate bg-background/60 p-2 rounded mt-1.5 border">
              {absoluteUrl}
            </pre>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(absoluteUrl, "url")}
              className="flex-1 h-7 text-xs font-mono gap-1"
            >
              {copiedKind === "url" ? (
                <CheckIcon className="size-3 text-emerald-500" />
              ) : (
                <CopyIcon className="size-3" />
              )}
              Salin URL
            </Button>
            <Button asChild size="icon" variant="ghost" className="size-7">
              <a href={relativeUrl} target="_blank" rel="noreferrer" title="Buka di tab baru">
                <ArrowSquareOutIcon className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
