"use client";

import { useSyncExternalStore } from "react";

export const CONSENT_STORAGE_KEY = "cookie-consent";
const CONSENT_EVENT = "cookie-consent-change";

export type ConsentChoice = "accepted" | "declined";

export type Consent = ConsentChoice | null;

const listeners = new Set<() => void>();

export function readConsent(): Consent {
    try {
        const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        return value === "accepted" || value === "declined" ? value : null;
    } catch {
        return null;
    }
}

export function writeConsent(choice: ConsentChoice): void {
    try {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {}
    for (const listener of listeners) listener();
}

function subscribe(callback: () => void): () => void {
    const notify = () => callback();
    listeners.add(notify);
    window.addEventListener(CONSENT_EVENT, notify);
    window.addEventListener("storage", (event) => {
        if (event.key === CONSENT_STORAGE_KEY) notify();
    });
    return () => {
        listeners.delete(notify);
        window.removeEventListener(CONSENT_EVENT, notify);
    };
}

/** Pilihan persetujuan pengunjung (null = belum memilih). SSR-safe. */
export function useConsent(): Consent {
    return useSyncExternalStore(subscribe, readConsent, () => null);
}
