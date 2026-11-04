"use client";

import { useState, useMemo } from "react";
import type { SvgDashboardData, IsometricItemDto } from "./actions";
import { SvgFilterForm, type CategoryFilter } from "./_components/svgFilterForm";
import { SvgCodeModal } from "./_components/svgCodeModal";
import { DynamicCardCustomizer } from "./_components/dynamicCardCustomizer";
import { FREE_ISOMETRIC_ILLUSTRATIONS } from "@/components/illos/isometric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyIcon, CheckIcon, DownloadIcon, CodeIcon, EyeIcon } from "@/components/shared/icons";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export function AdminSvgPanel({
  data,
}: {
  data: SvgDashboardData;
}) {
  const [activeTab, setActiveTab] = useState<"isometric" | "dynamic" | "guide">("isometric");

  // State Filter Ilustrasi Isometrik
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  // State Modal Kode SVG
  const [selectedModalItem, setSelectedModalItem] = useState<IsometricItemDto | null>(null);

  // State Salin Cepat Tag MDX
  const [copiedMdxId, setCopiedMdxId] = useState<string | null>(null);

  // Map Component dari index.ts
  const componentMap = useMemo(() => {
    const map = new Map<string, React.ComponentType<{ className?: string }>>();
    for (const item of FREE_ISOMETRIC_ILLUSTRATIONS) {
      map.set(item.id, item.Component);
    }
    return map;
  }, []);

  // Filter List Ilustrasi Isometrik
  const filteredIsometric = useMemo(() => {
    return data.isometric.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const text = `${item.name} ${item.titleId} ${item.sentence} ${item.descriptionId}`.toLowerCase();
        return text.includes(q);
      }
      return true;
    });
  }, [data.isometric, category, search]);

  const handleCopyMdx = (item: IsometricItemDto) => {
    const code = `<${item.componentName} className="w-full max-w-lg mx-auto aspect-4/3 my-6" />`;
    navigator.clipboard.writeText(code);
    setCopiedMdxId(item.id);
    toast.success(`Tag MDX <${item.componentName} /> berhasil disalin!`);
    setTimeout(() => {
      setCopiedMdxId((curr) => (curr === item.id ? null : curr));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Statistik Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card/60 p-4 shadow-2xs">
          <p className="text-xs font-mono text-muted-foreground uppercase">Ilustrasi Isometrik</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{data.totalIsometric}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono">100% Free Komersial</span>
          </div>
          <p className="mt-1 text-2xs text-muted-foreground">Animasi looping mulus SVG murni dari Illos.dev</p>
        </div>

        <div className="rounded-xl border bg-card/60 p-4 shadow-2xs">
          <p className="text-xs font-mono text-muted-foreground uppercase">Kartu SVG Dinamis</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{data.totalDynamic}</span>
            <span className="text-xs text-primary font-medium font-mono">ISR / SSG Endpoint</span>
          </div>
          <p className="mt-1 text-2xs text-muted-foreground">Kartu GitHub Profile Readme & Status Layanan</p>
        </div>

        <div className="rounded-xl border bg-card/60 p-4 shadow-2xs">
          <p className="text-xs font-mono text-muted-foreground uppercase">Dukungan Tema</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">Light + Dark</span>
            <span className="text-xs text-muted-foreground font-mono">Auto Adaptive</span>
          </div>
          <p className="mt-1 text-2xs text-muted-foreground">Mendukung prefers-reduced-motion & IntersectionObserver</p>
        </div>
      </div>

      {/* Tab Navigasi Utama */}
      <div className="flex border-b border-border/60">
        <button
          type="button"
          onClick={() => setActiveTab("isometric")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-all -mb-px",
            activeTab === "isometric"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <span>Ilustrasi Isometrik Illos</span>
          <Badge variant="secondary" className="font-mono text-2xs px-1.5 py-0 h-4">
            {data.totalIsometric}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dynamic")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-all -mb-px",
            activeTab === "dynamic"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <span>Kartu Dinamis Readme</span>
          <Badge variant="secondary" className="font-mono text-2xs px-1.5 py-0 h-4">
            {data.totalDynamic}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guide")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-all -mb-px",
            activeTab === "guide"
              ? "border-primary text-foreground font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <span>Panduan Penggunaan</span>
        </button>
      </div>

      {/* Konten Tab 1: Ilustrasi Isometrik */}
      {activeTab === "isometric" && (
        <div className="space-y-6">
          <SvgFilterForm
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
          />

          {filteredIsometric.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              <p className="text-sm">Tidak ada ilustrasi isometrik yang cocok dengan filter.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="mt-2 text-xs"
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredIsometric.map((item) => {
                const Component = componentMap.get(item.id);
                const sizeKb = (item.fileSizeBytes / 1024).toFixed(1);
                const isCopied = copiedMdxId === item.id;

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-xl border bg-card/60 p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                  >
                    <div>
                      {/* Badge Kategori & File Size */}
                      <div className="flex items-center justify-between gap-1 mb-2.5">
                        <Badge variant="outline" className="text-3xs font-mono uppercase tracking-wider">
                          {item.category}
                        </Badge>
                        <span className="font-mono text-3xs text-muted-foreground">
                          {sizeKb} KB
                        </span>
                      </div>

                      {/* Wadah Ilustrasi Interaktif */}
                      <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-background/50 p-2 transition-transform duration-300 group-hover:scale-[1.02]">
                        {Component ? (
                          <Component className="size-full" />
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">Preview SVG</span>
                        )}
                      </div>

                      {/* Detail Nama & Penjelasan */}
                      <div className="mt-3.5 space-y-1">
                        <h4 className="font-semibold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-2xs font-medium text-foreground/80">
                          {item.titleId}
                        </p>
                        <p className="text-3xs text-muted-foreground leading-relaxed line-clamp-2">
                          {item.descriptionId}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 flex items-center gap-1.5 border-t pt-3">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setSelectedModalItem(item)}
                        className="flex-1 h-7 text-2xs font-mono gap-1"
                        title="Buka kode SVG mentah"
                      >
                        <EyeIcon className="size-3" />
                        Kode SVG
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyMdx(item)}
                        className="h-7 px-2 text-2xs font-mono gap-1"
                        title="Salin tag MDX"
                      >
                        {isCopied ? (
                          <CheckIcon className="size-3 text-emerald-500" />
                        ) : (
                          <CodeIcon className="size-3" />
                        )}
                        MDX
                      </Button>

                      <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        title="Unduh file SVG"
                      >
                        <a href={item.svgUrl} download={`${item.id}.svg`}>
                          <DownloadIcon className="size-3.5" />
                          <span className="sr-only">Unduh {item.name}</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Konten Tab 2: Kartu SVG Dinamis */}
      {activeTab === "dynamic" && (
        <DynamicCardCustomizer cards={data.dynamicCards} />
      )}

      {/* Konten Tab 3: Panduan & Penggunaan */}
      {activeTab === "guide" && (
        <div className="rounded-xl border bg-card/60 p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-base text-foreground">
              Panduan Integrasi Aset SVG Portofolio
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Cara menyematkan dan memanfaatkan seluruh aset ilustrasi isometrik dan kartu SVG dinamis di berbagai lingkungan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kartu Panduan 1 */}
            <div className="rounded-lg border p-4 space-y-2 bg-muted/20">
              <span className="font-mono text-xs font-semibold text-primary uppercase">1. Penggunaan di Artikel Blog (MDX)</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seluruh 17 komponen ilustrasi telah terdaftar secara global di <code className="bg-muted px-1 py-0.5 rounded text-2xs font-mono">src/mdx-components.tsx</code>. Anda bisa langsung memanggilnya di dalam file artikel tanpa perlu mengimpor:
              </p>
              <pre className="bg-background/80 p-3 rounded font-mono text-2xs border overflow-x-auto text-foreground">
{`# Arsitektur Layanan Kami

Berikut adalah pintu gerbang API yang kami kelola:

<IllosApiGateway className="w-full max-w-lg mx-auto aspect-4/3 my-6" />

Lalu lintas disaring oleh lapisan keamanan WAF:

<IllosFirewall className="w-full max-w-lg mx-auto aspect-4/3 my-6" />`}
              </pre>
            </div>

            {/* Kartu Panduan 2 */}
            <div className="rounded-lg border p-4 space-y-2 bg-muted/20">
              <span className="font-mono text-xs font-semibold text-primary uppercase">2. Sematkan di GitHub Readme</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gunakan endpoint kartu dinamis <code className="bg-muted px-1 py-0.5 rounded text-2xs font-mono">/svg?type=...</code> untuk menampilkan status profil, kalender kontribusi git, atau artikel terbaru secara otomatis:
              </p>
              <pre className="bg-background/80 p-3 rounded font-mono text-2xs border overflow-x-auto text-foreground">
{`[![Kalender Kontribusi](https://ajoroby.is-a.dev/svg?type=calendar&theme=dark)](https://ajoroby.is-a.dev)

[![Artikel Terbaru](https://ajoroby.is-a.dev/svg?type=posts&theme=dark)](https://ajoroby.is-a.dev/blogs)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kode SVG */}
      <SvgCodeModal
        isOpen={!!selectedModalItem}
        onClose={() => setSelectedModalItem(null)}
        id={selectedModalItem?.id || null}
        name={selectedModalItem?.name || null}
        componentName={selectedModalItem?.componentName || null}
        sizeBytes={selectedModalItem?.fileSizeBytes || 0}
      />
    </div>
  );
}
