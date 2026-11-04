"use client";

import { useState, useMemo } from "react";
import {
  FREE_ISOMETRIC_ILLUSTRATIONS,
  type IsometricIllustrationMeta,
} from "@/components/illos/isometric";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { CopyIcon, CheckIcon, DownloadIcon, CodeIcon } from "@/components/shared/icons";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

type CategoryFilter = "all" | "infrastructure" | "security" | "devops" | "data" | "application";

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "Semua (17)" },
  { key: "infrastructure", label: "Infrastruktur" },
  { key: "security", label: "Keamanan" },
  { key: "devops", label: "DevOps & CI/CD" },
  { key: "data", label: "Basis Data" },
  { key: "application", label: "Aplikasi & Layanan" },
];

export function IsometricShowcase() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return FREE_ISOMETRIC_ILLUSTRATIONS;
    return FREE_ISOMETRIC_ILLUSTRATIONS.filter(
      (item) => item.category === selectedCategory,
    );
  }, [selectedCategory]);

  const handleCopyMdx = (item: IsometricIllustrationMeta) => {
    const componentName = item.Component.name;
    const code = `<${componentName} className="w-full max-w-md mx-auto aspect-4/3" />`;
    navigator.clipboard.writeText(code);
    setCopiedId(item.id);
    toast.success(`Tag MDX <${componentName} /> berhasil disalin!`);
    setTimeout(() => {
      setCopiedId((curr) => (curr === item.id ? null : curr));
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Kategori Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <Button
              key={cat.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                "rounded-full text-xs font-mono transition-all",
                isActive && "shadow-xs",
              )}
            >
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* Grid Kartu Ilustrasi Isometrik */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const Component = item.Component;
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card/60 p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-md"
            >
              <div>
                {/* Header Kartu */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="outline" className="text-2xs font-mono uppercase tracking-wider">
                    {item.category}
                  </Badge>
                  <span className="text-3xs font-mono text-muted-foreground flex items-center gap-1">
                    <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Hover loop
                  </span>
                </div>

                {/* Wadah Ilustrasi Animasi */}
                <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-background/50 p-2 transition-transform duration-300 group-hover:scale-[1.02]">
                  <Component className="size-full" />
                </div>

                {/* Judul & Deskripsi */}
                <div className="mt-4 space-y-1.5">
                  <h4 className="font-semibold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs font-medium text-foreground/80">
                    {item.titleId}
                  </p>
                  <TypographyMuted className="text-xs leading-relaxed line-clamp-2">
                    {item.descriptionId}
                  </TypographyMuted>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyMdx(item)}
                  className="flex-1 text-xs gap-1.5 font-mono h-8"
                  title="Salin tag MDX untuk artikel blog"
                >
                  {isCopied ? (
                    <>
                      <CheckIcon className="size-3.5 text-emerald-500" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <CodeIcon className="size-3.5" />
                      Tag MDX
                    </>
                  )}
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  title="Unduh berkas SVG mentah"
                >
                  <a href={item.svgUrl} download={`${item.id}.svg`}>
                    <DownloadIcon className="size-4" />
                    <span className="sr-only">Unduh SVG {item.name}</span>
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Petunjuk Penggunaan untuk Blog & MDX */}
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs">
              ✦
            </span>
            Siap Digunakan Langsung pada Artikel Blog (MDX)
          </p>
          <TypographySmall className="text-muted-foreground text-xs font-normal">
            Seluruh 17 ilustrasi di atas telah didaftarkan ke sistem MDX. Anda cukup menyematkan tag seperti{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-2xs">&lt;IllosApiGateway /&gt;</code> atau{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-2xs">&lt;IllosFirewall /&gt;</code> di dalam berkas artikel markdown.
          </TypographySmall>
        </div>
      </div>
    </div>
  );
}
