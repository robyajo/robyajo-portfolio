import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { visitors } from "@/lib/schema";
import { safeQuery } from "@/lib/safe-query";
import { getClientIp, hashIp } from "@/lib/ip";

export interface VisitorStats {
    total: number;
    today: number;
    online: number;
    views: number;
    countries: number;
}

export interface VisitorRow {
    hash: string;
    views: number;
    firstSeenAt: string;
    lastSeenAt: string;
    country: string | null;
    region: string | null;
    city: string | null;
    device: string | null;
}

const ONLINE_WINDOW = "5 minutes";

/** Ringkasan pengunjung: perangkat unik, hari ini, online sekarang, dsb. */
export async function getVisitorStats(): Promise<VisitorStats> {
    return safeQuery(
        "getVisitorStats",
        async () => {
            const [row] = await db
                .select({
                    total: sql<number>`count(*)::int`,
                    today: sql<number>`count(*) filter (where ${visitors.lastSeenAt} >= date_trunc('day', now()))::int`,
                    online: sql<number>`count(*) filter (where ${visitors.lastSeenAt} >= now() - interval '${sql.raw(ONLINE_WINDOW)}')::int`,
                    views: sql<number>`coalesce(sum(${visitors.views}), 0)::int`,
                    countries: sql<number>`count(distinct ${visitors.country})::int`,
                })
                .from(visitors);
            return {
                total: row?.total ?? 0,
                today: row?.today ?? 0,
                online: row?.online ?? 0,
                views: row?.views ?? 0,
                countries: row?.countries ?? 0,
            };
        },
        { total: 0, today: 0, online: 0, views: 0, countries: 0 },
    );
}

/**
 * Identitas perangkat: hash satu arah IP + user-agent + salt sisi server.
 * IP mentah tidak pernah disimpan, sama seperti hitungan baca blog.
 */
export async function deviceHash(hdrs: Headers): Promise<string> {
    const ip = getClientIp(hdrs);
    const device = hdrs.get("user-agent") ?? "";
    return hashIp(`${ip}:${device}`);
}

/** Ringkasan perangkat dari user-agent: peramban versi + sistem + bentuk. */
export function describeDevice(ua: string): string {
    if (!ua) return "";
    const browsers: [RegExp, string][] = [
        [/edg(?:ios|e|a)?\/([\d]+)/i, "Edge"],
        [/opr\/([\d]+)/i, "Opera"],
        [/(?:firefox|fxios)\/([\d]+)/i, "Firefox"],
        [/crios\/([\d]+)/i, "Chrome"],
        [/(?:chrome|crmo)\/([\d]+)/i, "Chrome"],
        [/version\/([\d]+).*safari/i, "Safari"],
        [/safari/i, "Safari"],
    ];
    let browser = "";
    for (const [pattern, name] of browsers) {
        const paired = ua.match(pattern);
        if (paired) {
            browser = paired[1] ? `${name} ${paired[1].split(".")[0]}` : name;
            break;
        }
    }
    const os = (() => {
        if (/windows nt/i.test(ua)) return "Windows";
        if (/android/i.test(ua)) return "Android";
        if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
        if (/mac os x|macintosh/i.test(ua)) return "macOS";
        if (/linux|cros/i.test(ua)) return "Linux";
        return "";
    })();
    const form = /android|iphone|ipad|ipod|mobile/i.test(ua) ? "Mobile" : "Desktop";
    const parts = [browser, os, form].filter(Boolean);
    return parts.join(" · ");
}

/** Catat kunjungan sekali per perangkat (naikkan hitungan + lokasi terkini). */
export async function trackVisit(hash: string, hdrs: Headers): Promise<void> {
    const country = hdrs.get("x-vercel-ip-country") ?? process.env.GEO_FALLBACK_COUNTRY ?? "";
    const region = hdrs.get("x-vercel-ip-country-region") ?? "";
    const city = hdrs.get("x-vercel-ip-city") ? decodeURIComponent(hdrs.get("x-vercel-ip-city")!) : "";
    const ua = hdrs.get("user-agent") ?? "";
    const device = describeDevice(ua);
    await db
        .insert(visitors)
        .values({ hash, country, region, city, device })
        .onConflictDoUpdate({
            target: visitors.hash,
            set: {
                views: sql`${visitors.views} + 1`,
                lastSeenAt: sql`now()`,
                ...(country ? { country } : {}),
                ...(region ? { region } : {}),
                ...(city ? { city } : {}),
                ...(device ? { device } : {}),
            },
        });
}

/** Daftar kunjungan per perangkat, terbaru dulu (untuk panel admin). */
export async function getVisitorRows(limit = 100): Promise<VisitorRow[]> {
    const rows = await db
        .select()
        .from(visitors)
        .orderBy(desc(visitors.lastSeenAt))
        .limit(Math.min(Math.max(limit, 1), 500));
    return rows.map((row) => ({
        hash: row.hash.slice(0, 8),
        views: row.views,
        firstSeenAt: row.firstSeenAt.toISOString(),
        lastSeenAt: row.lastSeenAt.toISOString(),
        country: row.country,
        region: row.region,
        city: row.city,
        device: row.device,
    }));
}

export interface VisitorDetail {
    hash: string;
    views: number;
    firstSeenAt: string;
    lastSeenAt: string;
    country: string | null;
    region: string | null;
    city: string | null;
    device: string | null;
}

/** Rincian satu perangkat berdasarkan 8 karakter awal hash-nya (untuk detail admin). */
export async function getVisitorDetail(id: string): Promise<VisitorDetail | null> {
    const clean = id.replace(/[^a-f0-9]/gi, "").toLowerCase().slice(0, 8);
    if (clean.length !== 8) return null;
    const [row] = await db
        .select()
        .from(visitors)
        .where(sql`left(${visitors.hash}, 8) = ${clean}`)
        .limit(1);
    if (!row) return null;
    return {
        hash: clean,
        views: row.views,
        firstSeenAt: row.firstSeenAt.toISOString(),
        lastSeenAt: row.lastSeenAt.toISOString(),
        country: row.country,
        region: row.region,
        city: row.city,
        device: row.device,
    };
}
