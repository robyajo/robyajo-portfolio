"use client";

import { useState } from "react";
import {
  SectionLabel,
  TypographyLarge,
  TypographyMuted,
} from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import { Signpost } from "@/components/shared/doodles";
import { ArrowClockwiseIcon } from "@/components/shared/icons";
import { useDictionary } from "@/lib/i18n/provider";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

const TILTS = [-5, 4, -3, 5, -4, 3, -2, 4];

interface PlankProps {
  index: number;
  accent?: boolean;
  right?: boolean;
  children: ReactNode;
}

function plankClass({ index, accent, right: explicitRight }: Omit<PlankProps, "children">) {
  const right = explicitRight !== undefined ? explicitRight : index % 2 === 0;
  return cn(
    "absolute flex w-44 rotate-(--tilt) flex-col justify-center gap-0.5 py-1.5 transition-all duration-300 ease-out hover:rotate-0 focus-visible:rotate-0 z-10 animate-plank-nudge hover:animate-none focus-visible:animate-none",
    right
      ? "left-[calc(50%-6px)] origin-left pr-6 pl-5 [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)] hover:translate-x-2"
      : "right-[calc(50%-6px)] origin-right pr-5 pl-6 text-right [clip-path:polygon(14px_0,100%_0,100%_100%,14px_100%,0_50%)] hover:-translate-x-2",
    accent
      ? "bg-(--brand) text-(--brand-foreground) hover:bg-(--brand)/90 shadow-sm"
      : "bg-secondary text-foreground hover:bg-muted",
  );
}

function plankStyle(index: number) {
  const tiltDeg = TILTS[index % TILTS.length];
  const delaySec = ((index * 1.35) % 4).toFixed(1);
  const durationSec = (4.4 + (index % 3) * 0.7).toFixed(1);

  return {
    top: `${20 + index * 38}px`,
    "--tilt": `${tiltDeg}deg`,
    animationDelay: `${delaySec}s`,
    animationDuration: `${durationSec}s`,
  } as CSSProperties;
}

function PlankText({ label, note }: { label: string; note: string }) {
  return (
    <>
      <SectionLabel pixel asChild className="text-inherit">
        <span>{label}</span>
      </SectionLabel>
      <span aria-hidden="true" className="text-2xs leading-none opacity-75 truncate">
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

  const [pageOffset, setPageOffset] = useState(0);

  const destinations: Array<{
    href: Route;
    label: string;
    note: string;
    accent?: boolean;
  }> = [
    {
      href: "/markas" as Route,
      label: t.destinations.markas?.label || "Markas 3D",
      note: t.destinations.markas?.note || "kantor agen AI",
      accent: true,
    },
    {
      href: "/projects" as Route,
      label: t.destinations.projects.label,
      note: t.destinations.projects.note,
    },
    {
      href: "/about" as Route,
      label: t.destinations.about?.label || "Tentang Saya",
      note: t.destinations.about?.note || "karier & etos",
    },
    {
      href: "/blogs" as Route,
      label: t.destinations.blogs.label,
      note: t.destinations.blogs.note,
    },
    {
      href: "/guestbook" as Route,
      label: t.destinations.guestbook.label,
      note: t.destinations.guestbook.note,
      accent: true,
    },
    {
      href: "/resume" as Route,
      label: t.destinations.resume.label,
      note: t.destinations.resume.note,
    },
    {
      href: "/now" as Route,
      label: t.destinations.now?.label || "Sekarang",
      note: t.destinations.now?.note || "fokus terkini",
    },
    {
      href: "/uses" as Route,
      label: t.destinations.uses?.label || "Perkakas",
      note: t.destinations.uses?.note || "gear & setup",
    },
    {
      href: "/activity" as Route,
      label: t.destinations.activity?.label || "Linimasa",
      note: t.destinations.activity?.note || "kegiatan sistem",
    },
    {
      href: "/contact" as Route,
      label: t.destinations.contact?.label || "Kontak",
      note: t.destinations.contact?.note || "mari berdiskusi",
    },
    {
      href: "/changelog" as Route,
      label: t.destinations.changelog?.label || "Catatan Rilis",
      note: t.destinations.changelog?.note || "riwayat versi",
    },
    {
      href: "/branding" as Route,
      label: t.destinations.branding?.label || "Branding",
      note: t.destinations.branding?.note || "logo & aset",
    },
  ];

  // Saring halaman aktif saat ini
  const availableDestinations = destinations.filter(
    (d) => !pathname.startsWith(d.href),
  );

  // Ambil 5 bilah destinasi bertingkat di tiang signpost
  const displayCount = 5;
  const planks = Array.from({ length: Math.min(displayCount, availableDestinations.length) }).map(
    (_, i) => {
      const idx = (pageOffset + i) % availableDestinations.length;
      return availableDestinations[idx];
    },
  );

  const handleRotate = () => {
    setPageOffset((prev) => (prev + 3) % availableDestinations.length);
  };

  return (
    <div className="grid items-center gap-8 sm:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="flex flex-col gap-3">
        <SectionLabel pixel className="text-(--brand-text)">
          {t.sectionLabel}
        </SectionLabel>
        <TypographyLarge>{t.title}</TypographyLarge>
        <TypographyMuted className="max-w-sm text-pretty leading-relaxed">
          {t.description}
        </TypographyMuted>

        {/* Direktori Navigasi Lengkap Seluruh Halaman Portofolio */}
        <div className="mt-2 flex flex-col gap-2 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-3xs uppercase tracking-widest text-muted-foreground/80">
              // {t.otherPages || "Jelajahi Halaman Lainnya:"}
            </span>
            <button
              type="button"
              onClick={handleRotate}
              title="Putar dan acak penunjuk arah di tiang kayu"
              className="inline-flex items-center gap-1 font-mono text-3xs text-(--brand-text) hover:underline transition-colors"
            >
              <ArrowClockwiseIcon className="size-3 transition-transform hover:rotate-180 duration-300" />
              <span>Putar Arah ({pageOffset + 1}/{availableDestinations.length})</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {destinations.map((d) => {
              const isCurrent =
                pathname === d.href ||
                (d.href !== "/" && pathname.startsWith(d.href));
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  className={cn(
                    "rounded-md border px-2 py-0.8 font-mono text-3xs transition-all duration-150",
                    isCurrent
                      ? "border-(--brand)/40 bg-(--brand)/10 text-(--brand-text) font-semibold"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:border-(--brand-text)/40 hover:bg-muted hover:text-foreground",
                  )}
                >
                  {d.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <nav
        aria-label={t.exploreAria}
        className="relative mx-auto h-72 w-full max-w-76 select-none"
      >
        <Signpost />

        {/* Bilah Papan Penunjuk Arah Kayu (5 Arah Bertingkat) */}
        {planks.map(({ href, label, note, accent }, index) => (
          <Link
            key={`${href}-${index}`}
            href={href}
            aria-label={`${label}, ${note}`}
            className={plankClass({ index, accent })}
            // eslint-disable-next-line shadcn/no-inline-styles
            style={plankStyle(index)}
          >
            <PlankText label={label} note={note} />
          </Link>
        ))}

        {/* Bilah Kembali ke Atas (Bilah Keenam di Bagian Bawah Tiang) */}
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
