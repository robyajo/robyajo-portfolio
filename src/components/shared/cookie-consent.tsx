"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/lib/i18n/provider";
import { useConsent, writeConsent } from "@/lib/consent";

function CookieIcon() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0">
            <circle
                cx="8"
                cy="8"
                r="6.4"
                className="fill-(--brand)/25 stroke-(--brand)"
                strokeWidth="1"
                strokeDasharray="2.2 1.4"
            />
            <circle cx="6" cy="6.4" r="1" className="fill-(--brand)" />
            <circle cx="9.6" cy="8.4" r="0.9" className="fill-(--brand)" />
            <circle cx="7.2" cy="10.4" r="0.8" className="fill-(--brand)" />
        </svg>
    );
}

export function CookieConsent() {
    const dict = useDictionary().consent;
    // Pilihan dibaca lewat hook SSR-safe agar hasil SSR dan hidrasi konsisten.
    const choice = useConsent();

    if (choice) return null;

    return (
        <div
            role="region"
            aria-label={dict.ariaLabel}
            className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-7xl flex-col gap-3 rounded-xl border border-line bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:gap-4 sm:p-5"
        >
            <CookieIcon />
            <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                    {dict.body}{" "}
                    <Link
                        href="/privacy-policy"
                        className="underline underline-offset-2 hover:text-foreground"
                    >
                        {dict.more}
                    </Link>
                </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => writeConsent("declined")}
                >
                    {dict.decline}
                </Button>
                <Button size="sm" onClick={() => writeConsent("accepted")}>
                    {dict.accept}
                </Button>
            </div>
        </div>
    );
}
