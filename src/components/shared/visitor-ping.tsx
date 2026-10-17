"use client";

import { useEffect } from "react";

const SESSION_KEY = "visitor-ping";

/** Kirim ping kunjungan sekali per sesi (klik bar apa pun di halaman ini). */
export function VisitorPing() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            if (window.sessionStorage.getItem(SESSION_KEY)) return;
        } catch {
            return;
        }
        void fetch("/api/visitors", { method: "POST", keepalive: true })
            .then((response) => {
                if (!response.ok) throw new Error(String(response.status));
                try {
                    window.sessionStorage.setItem(SESSION_KEY, "1");
                } catch {}
            })
            .catch(() => {});
    }, []);
    return null;
}
