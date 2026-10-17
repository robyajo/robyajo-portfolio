"use client";

import { useEffect } from "react";
import { useConsent } from "@/lib/consent";

const SESSION_KEY = "visitor-ping";

/**
 * Kirim ping kunjungan sekali per sesi, hanya untuk pengunjung yang
 * telah menyetujui statistik lewat pemberitahuan persetujuan.
 */
export function VisitorPing() {
    const consent = useConsent();

    useEffect(() => {
        if (consent !== "accepted") return;
        let counted;
        try {
            counted = window.sessionStorage.getItem(SESSION_KEY) === "1";
        } catch {
            return;
        }
        if (counted) return;
        void fetch("/api/visitors", { method: "POST", keepalive: true })
            .then((response) => {
                if (!response.ok) throw new Error(String(response.status));
                try {
                    window.sessionStorage.setItem(SESSION_KEY, "1");
                } catch {}
            })
            .catch(() => {});
    }, [consent]);

    return null;
}
