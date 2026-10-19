"use client";

import {
  SectionLabel,
  TypographyLarge,
  TypographyMuted,
} from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import { Signpost } from "@/components/shared/doodles";
import { useDictionary } from "@/lib/i18n/provider";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

const TILTS = [-4, 3, -2, 4];

interface PlankProps {
  index: number;
  accent?: boolean;
  children: ReactNode;
}

function plankClass({ index, accent }: Omit<PlankProps, "children">) {
  const right = index % 2 === 0;
  return cn(
    "absolute flex w-40 rotate-(--tilt) flex-col justify-center gap-0.5 py-2 transition-[rotate,translate,background-color] duration-300 ease-out hover:rotate-0 focus-visible:rotate-0",
    right
      ? "left-[calc(50%-6px)] origin-left pr-6 pl-5 [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)] hover:translate-x-1.5"
      : "right-[calc(50%-6px)] origin-right pr-5 pl-6 text-right [clip-path:polygon(14px_0,100%_0,100%_100%,14px_100%,0_50%)] hover:-translate-x-1.5",
    accent
      ? "animate-plank-nudge hover:animate-none focus-visible:animate-none bg-(--brand) text-(--brand-foreground) hover:bg-(--brand)/90"
      : "bg-secondary text-foreground hover:bg-muted",
  );
}

function plankStyle(index: number) {
  return {
    top: `${28 + index * 46}px`,
    "--tilt": `${TILTS[index]}deg`,
  } as CSSProperties;
}

function PlankText({ label, note }: { label: string; note: string }) {
  return (
    <>
      <SectionLabel pixel asChild className="text-inherit">
        <span>{label}</span>
      </SectionLabel>
      <span aria-hidden="true" className="text-2xs leading-none opacity-70">
        {note}
      </span>
    </>
  );
}

function backToTop() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  document.getElementById("main-content")?.focus({ preventScroll: true });
}

export function EndOfPage() {
  const pathname = usePathname();
  const dict = useDictionary();
  const t = dict.endOfPage;

  const destinations: Array<{
    href: Route;
    label: string;
    note: string;
    accent?: boolean;
  }> = [
    {
      href: "/guestbook" as Route,
      label: t.destinations.guestbook.label,
      note: t.destinations.guestbook.note,
      accent: true,
    },
    {
      href: "/blogs" as Route,
      label: t.destinations.blogs.label,
      note: t.destinations.blogs.note,
    },
    {
      href: "/projects" as Route,
      label: t.destinations.projects.label,
      note: t.destinations.projects.note,
    },
    {
      href: "/resume" as Route,
      label: t.destinations.resume.label,
      note: t.destinations.resume.note,
    },
  ];

  const planks = destinations
    .filter((d) => !pathname.startsWith(d.href))
    .slice(0, 3);

  return (
    <div className="grid items-center gap-8 sm:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex flex-col gap-3">
        <SectionLabel pixel className="text-(--brand-text)">
          {t.sectionLabel}
        </SectionLabel>
        <TypographyLarge>{t.title}</TypographyLarge>
        <TypographyMuted className="max-w-sm text-pretty leading-relaxed">
          {t.description}
        </TypographyMuted>
      </div>

      <nav
        aria-label={t.exploreAria}
        className="relative mx-auto h-62 w-full max-w-72"
      >
        <Signpost />
        {planks.map(({ href, label, note, accent }, index) => (
          <Link
            key={href}
            href={href}
            aria-label={`${label}, ${note}`}
            className={plankClass({ index, accent })}
            // eslint-disable-next-line shadcn/no-inline-styles
            style={plankStyle(index)}
          >
            <PlankText label={label} note={note} />
          </Link>
        ))}
        {/* eslint-disable-next-line no-restricted-syntax */}
        <button
          type="button"
          onClick={backToTop}
          aria-label={t.backToTop}
          className={plankClass({ index: planks.length })}
          // eslint-disable-next-line shadcn/no-inline-styles
          style={plankStyle(planks.length)}
        >
          <PlankText label={t.backToTop} note={t.backToTopNote} />
        </button>
      </nav>
    </div>
  );
}
