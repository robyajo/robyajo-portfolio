"use client";

import { Button } from "@/components/ui/button";
import { useDictionary, useLocale, useSetLocale } from "@/lib/i18n/provider";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";

const LABELS: Record<Locale, string> = { id: "ID", en: "EN" };

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const dict = useDictionary();
  const setLocale = useSetLocale();

  return (
    <div
      role="group"
      aria-label={dict.header.language}
      className={cn(
        "flex items-center rounded-full border p-0.5",
        className,
      )}
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <Button
            key={option}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={active}
            aria-label={dict.header.switchTo.replace("{lang}", LABELS[option]!)}
            onClick={() => setLocale(option)}
            className={cn(
              "h-7 rounded-full px-2.5 font-mono text-3xs",
              active
                ? "bg-foreground text-background hover:bg-foreground hover:text-background"
                : "text-muted-foreground",
            )}
          >
            {LABELS[option]}
          </Button>
        );
      })}
    </div>
  );
}
