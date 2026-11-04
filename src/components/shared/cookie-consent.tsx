"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/lib/i18n/provider";
import { useConsent, writeConsent, type ConsentChoice } from "@/lib/consent";

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
    const choice = useConsent();
    const [dismissed, setDismissed] = useState(false);

    if (choice || dismissed) return null;

    const handleChoice = (c: ConsentChoice) => {
        setDismissed(true);
        writeConsent(c);
    };

    return (
        <div
            role="region"
            aria-label={dict.ariaLabel}
            className="fixed inset-x-3 bottom-3 z-[80] mx-auto flex max-w-7xl flex-col gap-3 rounded-xl border border-line bg-background/95 p-4 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 sm:p-5 pointer-events-auto"
        >
            <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
                <CookieIcon />
                <div className="flex flex-col gap-1">
                    <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {dict.body}{" "}
                        <Link
                            href="/privacy-policy"
                            className="underline underline-offset-2 hover:text-foreground text-foreground/90 font-medium"
                        >
                            {dict.more}
                        </Link>
                    </span>
                </div>
            </div>
            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:ml-auto">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none h-9 px-4 active:scale-95 transition-transform"
                    onClick={() => handleChoice("declined")}
                >
                    {dict.decline}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    className="flex-1 sm:flex-none h-9 px-4 active:scale-95 transition-transform"
                    onClick={() => handleChoice("accepted")}
                >
                    {dict.accept}
                </Button>
            </div>
        </div>
    );
}
