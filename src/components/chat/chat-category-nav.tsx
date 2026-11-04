"use client";

import {
  BookOpenIcon,
  BriefcaseIcon,
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
    case "experience":
    case "resume":
      return (
        <BriefcaseIcon
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

export interface QuickCategory {
  id: string;
  label: string;
  prompt: string;
}

export const DEFAULT_CHAT_CATEGORIES: QuickCategory[] = [
  {
    id: "projects",
    label: "Karya & Proyek Unggulan",
    prompt: "Ceritakan tentang proyek-proyek unggulan yang telah dibangun oleh Roby Karti S.",
  },
  {
    id: "experience",
    label: "Pengalaman & Karier IT",
    prompt: "Bagaimana rekam jejak pengalaman kerja Roby di pemerintahan (Diskominfo) dan perbankan?",
  },
  {
    id: "stack",
    label: "Tech Stack & Arsitektur",
    prompt: "Teknologi, bahasa pemrograman, dan infrastruktur server apa yang dikuasai Roby?",
  },
  {
    id: "blogs",
    label: "Artikel Blog & Catatan Teknis",
    prompt: "Artikel teknis menarik apa saja yang ditulis Roby di blog portfolio ini?",
  },
  {
    id: "contact",
    label: "Kontak & Kerja Sama",
    prompt: "Bagaimana cara menghubungi Roby untuk tawaran kerja atau kolaborasi proyek?",
  },
];

export interface ChatCategoryNavProps {
  categories?: QuickCategory[];
  title?: string;
  onSelect?: (prompt: string) => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function ChatCategoryNav({
  categories = DEFAULT_CHAT_CATEGORIES,
  title,
  onSelect,
  onSelectPrompt,
}: ChatCategoryNavProps) {
  const handleSelect = onSelectPrompt || onSelect;
  if (!categories || categories.length === 0 || !handleSelect) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex items-center gap-1.5 font-pixel text-3xs uppercase tracking-widest text-muted-foreground">
        <SparkleIcon className="size-3 text-(--brand-text)" />
        {"// "}{title || "Jelajahi Berdasarkan Topik:"}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelect(cat.prompt)}
            className="group flex items-center gap-2 rounded-lg border border-border/80 bg-background/80 dark:bg-card/70 p-2 text-left text-xs transition-all hover:border-(--brand-text)/50 hover:bg-muted/60 active:scale-95 shadow-xs"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/80 dark:bg-muted/50 transition-transform group-hover:scale-105 group-hover:border-(--brand-text)/40">
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
