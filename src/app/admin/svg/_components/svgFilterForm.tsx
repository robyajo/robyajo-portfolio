"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon, XIcon } from "@/components/shared/icons";
import { cn } from "@/lib/cn";

export type CategoryFilter =
  | "all"
  | "infrastructure"
  | "security"
  | "devops"
  | "data"
  | "application";

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "Semua Kategori" },
  { key: "infrastructure", label: "Infrastruktur" },
  { key: "security", label: "Keamanan" },
  { key: "devops", label: "DevOps & CI/CD" },
  { key: "data", label: "Basis Data" },
  { key: "application", label: "Aplikasi & Layanan" },
];

export function SvgFilterForm({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}: {
  search: string;
  onSearchChange: (val: string) => void;
  category: CategoryFilter;
  onCategoryChange: (val: CategoryFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/60 p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Input Pencarian */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama ilustrasi, konsep (mis. queue, firewall, database)..."
            className="pl-9 pr-8 h-9 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Info Jumlah */}
        <div className="text-2xs font-mono text-muted-foreground shrink-0 text-right">
          Gaya: <span className="font-semibold text-foreground">Isometric 30°</span> • Format: <span className="font-semibold text-foreground">SVG Murni</span>
        </div>
      </div>

      {/* Filter Kategori Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.key;
          return (
            <Button
              key={cat.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(cat.key)}
              className={cn(
                "h-7 rounded-full text-xs font-mono px-3",
                isActive && "shadow-xs",
              )}
            >
              {cat.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
