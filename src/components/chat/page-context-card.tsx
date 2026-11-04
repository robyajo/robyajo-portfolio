"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getPageChatTemplate,
  type PageChatTemplate,
} from "@/lib/page-chat-context";
import { useDictionary, useLocale } from "@/lib/i18n/provider";
import {
  ArrowDownIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ChatCircleIcon,
  CodeIcon,
  EnvelopeIcon,
  FileTextIcon,
  FolderOpenIcon,
  GearIcon,
  GitCommitIcon,
  GlobeIcon,
  HouseIcon,
  InfoIcon,
  MonitorIcon,
  ShieldCheckIcon,
  SparkleIcon,
  ClockIcon,
} from "@/components/shared/icons";
import { cn } from "@/lib/cn";

export interface PageContextCardProps {
  onSelectPrompt: (promptText: string) => void;
  className?: string;
  compact?: boolean;
}

function renderPageIcon(iconType: PageChatTemplate["iconType"]) {
  const iconClass = "size-4 shrink-0 text-(--brand-text)";
  switch (iconType) {
    case "home":
      return <HouseIcon className={iconClass} aria-hidden="true" />;
    case "about":
      return <InfoIcon className={iconClass} aria-hidden="true" />;
    case "projects":
    case "project-detail":
      return <FolderOpenIcon className={iconClass} aria-hidden="true" />;
    case "resume":
      return <BriefcaseIcon className={iconClass} aria-hidden="true" />;
    case "blogs":
    case "blog-detail":
      return <BookOpenIcon className={iconClass} aria-hidden="true" />;
    case "markas":
      return <MonitorIcon className={iconClass} aria-hidden="true" />;
    case "now":
      return <ClockIcon className={iconClass} aria-hidden="true" />;
    case "uses":
      return <CodeIcon className={iconClass} aria-hidden="true" />;
    case "activity":
      return <GitCommitIcon className={iconClass} aria-hidden="true" />;
    case "guestbook":
      return <ChatCircleIcon className={iconClass} aria-hidden="true" />;
    case "changelog":
      return <FileTextIcon className={iconClass} aria-hidden="true" />;
    case "branding":
      return <SparkleIcon className={iconClass} aria-hidden="true" />;
    case "contact":
      return <EnvelopeIcon className={iconClass} aria-hidden="true" />;
    case "privacy":
      return <ShieldCheckIcon className={iconClass} aria-hidden="true" />;
    case "admin":
      return <GearIcon className={iconClass} aria-hidden="true" />;
    default:
      return <GlobeIcon className={iconClass} aria-hidden="true" />;
  }
}

export function PageContextCard({
  onSelectPrompt,
  className,
  compact = false,
}: PageContextCardProps) {
  const pathname = usePathname();
  const dict = useDictionary();
  const locale = useLocale();
  const langKey = locale === "en" ? "en" : "id";

  const [isExpanded, setIsExpanded] = useState(true);

  const template = useMemo(
    () => getPageChatTemplate(pathname || "/"),
    [pathname],
  );

  const badgeText = template.badge[langKey];
  const titleText = template.title[langKey];
  const summaryText = template.summary[langKey];
  const prompts = template.prompts;

  return (
    <div
      className={cn(
        "group/context rounded-xl border border-border/80 bg-background/85 shadow-xs backdrop-blur-sm transition-all duration-200 overflow-hidden",
        className,
      )}
    >
      {/* Header bar: Badge & Location */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {renderPageIcon(template.iconType)}
          <span className="font-pixel text-3xs font-semibold uppercase tracking-wider text-(--brand-text) truncate">
            {badgeText}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="font-mono text-3xs text-muted-foreground hover:text-foreground transition-colors shrink-0 px-1 py-0.5 rounded hover:bg-muted"
          title={isExpanded ? "Kecilkan template" : "Tampilkan template"}
        >
          {isExpanded ? "[Sembunyikan]" : "[Lihat Template]"}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 flex flex-col gap-3">
          {/* Page Title & Summary */}
          <div>
            <h4 className="font-heading text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
              <span>{titleText}</span>
            </h4>
            <p className="mt-1 font-sans text-2xs leading-relaxed text-muted-foreground">
              {summaryText}
            </p>
          </div>

          {/* Quick Inquiry Suggested Prompts */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between pb-1">
              <span className="font-pixel text-3xs uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                <SparkleIcon className="size-2.5 text-(--brand-text)" />
                {langKey === "en"
                  ? "// PAGE QUICK INQUIRY TEMPLATES"
                  : "// TEMPLATE PERTANYAAN HALAMAN INI"}
              </span>
              <span className="font-mono text-3xs text-muted-foreground/60">
                {prompts.length} Opsi
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {prompts.map((p, idx) => {
                const promptString = p[langKey];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectPrompt(promptString)}
                    className="group/item flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-left transition-all duration-150 hover:border-(--brand-text)/50 hover:bg-muted/70 active:scale-[0.99]"
                  >
                    <span className="font-mono text-2xs text-foreground group-hover/item:text-(--brand-text) transition-colors leading-snug line-clamp-2">
                      {promptString}
                    </span>
                    <ArrowDownIcon className="size-3 shrink-0 -rotate-90 text-muted-foreground/60 transition-transform group-hover/item:translate-x-0.5 group-hover/item:text-(--brand-text)" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
