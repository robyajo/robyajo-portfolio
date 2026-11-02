"use client";

import {
  BookOpenIcon,
  CodeIcon,
  EnvelopeIcon,
  FileTextIcon,
  FolderOpenIcon,
  GlobeIcon,
  SparkleIcon,
} from "@/components/shared/icons";

export function getCategoryIcon(id: string) {
  switch (id) {
    case "projects":
      return (
        <FolderOpenIcon
          className="size-3.5 text-(--brand-text)"
          aria-hidden="true"
        />
      );
    case "stack":
      return (
        <CodeIcon className="size-3.5 text-(--brand-text)" aria-hidden="true" />
      );
    case "resume":
      return (
        <FileTextIcon
          className="size-3.5 text-(--brand-text)"
          aria-hidden="true"
        />
      );
    case "blogs":
      return (
        <BookOpenIcon
          className="size-3.5 text-(--brand-text)"
          aria-hidden="true"
        />
      );
    case "pages":
      return (
        <GlobeIcon
          className="size-3.5 text-(--brand-text)"
          aria-hidden="true"
        />
      );
    case "contact":
      return (
        <EnvelopeIcon
          className="size-3.5 text-(--brand-text)"
          aria-hidden="true"
        />
      );
    default:
      return (
        <SparkleIcon
          className="size-3.5 text-(--brand-text)"
          aria-hidden="true"
        />
      );
  }
}

interface QuickCategory {
  id: string;
  label: string;
  prompt: string;
}

interface ChatCategoryNavProps {
  categories: QuickCategory[];
  title?: string;
  onSelect: (prompt: string) => void;
}

export function ChatCategoryNav({
  categories,
  title,
  onSelect,
}: ChatCategoryNavProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex items-center gap-1.5 font-pixel text-3xs uppercase tracking-widest text-muted-foreground">
        <SparkleIcon className="size-3 text-(--brand-text)" />
        // {title || "Jelajahi Berdasarkan Topik:"}
      </span>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.prompt)}
            className="group flex items-center gap-2 rounded-lg border border-border/80 bg-background/60 p-2 text-left text-xs transition-all hover:border-(--brand-text)/50 hover:bg-muted/50 active:scale-95 shadow-xs"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted transition-transform group-hover:scale-105 group-hover:border-(--brand-text)/40">
              {getCategoryIcon(cat.id)}
            </span>
            <div className="min-w-0 flex-1">
              <span className="line-clamp-1 font-semibold text-2xs text-foreground leading-tight group-hover:text-(--brand-text) transition-colors">
                {cat.label}
              </span>
              <span className="font-pixel text-3xs uppercase tracking-widest text-muted-foreground/50 block">
                NAV.{cat.id}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
