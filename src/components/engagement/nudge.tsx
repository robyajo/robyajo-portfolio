"use client";

import { TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import { useDictionary, useLocale } from "@/lib/i18n/provider";
import { useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/i18n/id";

export type NudgeType = keyof Dictionary["nudge"];

const picked = new Map<string, string>();

function pickLine(pool: readonly string[], key: string): string {
  const cached = picked.get(key);
  if (cached) return cached;
  const line = pool[Math.floor(Math.random() * pool.length)] ?? "";
  picked.set(key, line);
  return line;
}

function subscribeToNothing() {
  return () => {};
}

export function EngagementNudge({
  type,
  className,
}: {
  type: NudgeType;
  className?: string;
}) {
  const dict = useDictionary();
  const locale = useLocale();
  const key = `${locale}:${type}`;
  const line = useSyncExternalStore(
    subscribeToNothing,
    () => pickLine(dict.nudge[type], key),
    () => null,
  );

  if (!line) return null;

  return (
    <TypographyMuted
      className={cn("text-center text-xs font-mono", className)}
      aria-hidden="true"
    >
      {`// ${line}`}
    </TypographyMuted>
  );
}
