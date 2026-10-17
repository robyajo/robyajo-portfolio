import { desc, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { visitorDays, visitors } from "@/lib/schema";
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

export interface ParsedDevice {
    browser: string;
    os: string;
    formFactor: string;
    device: string;
}

const ONLINE_WINDOW = "5 minutes";
const EMPTY_STATS: VisitorStats = { total: 0, today: 0, online: 0, views: 0, countries: 0 };

/** Ringkasan pengunjung: perangkat unik, hari ini, online sekarang, dsb. */
export async function getVisitorStats(): Promise<VisitorStats> {
    return safeQuery("getVisitorStats", async () => {
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
    }, EMPTY_STATS);
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

/** Rincian perangkat dari user-agent: peramban + versi, sistem + versi, bentuk perangkat. */
export function parseDevice(ua: string): ParsedDevice {
    const empty: ParsedDevice = { browser: "", os: "", formFactor: "", device: "" };
    if (!ua) return empty;

    let browser = "";
    let os = "";

    for (const [pattern, name] of [
        [/edg(?:e|a|ios)?\/([\d.]+)/i, "Edge"],
        [/opr\/([\d.]+)/i, "Opera"],
        [/(?:firefox|fxios)\/([\d.]+)/i, "Firefox"],
        [/crios\/([\d.]+)/i, "Chrome"],
        [/(?:chrome|crmo)\/([\d.]+)/i, "Chrome"],
        [/version\/([\d.]+).*safari/i, "Safari"],
        [/safari\/[\d.]+/i, "Safari"],
    ] as const) {
        const match = ua.match(pattern);
        if (match) {
            const version = match[1];
            browser = version ? `${name} ${version.split(".")[0]}` : name;
            break;
        }
    }

    for (const [pattern, format] of [
        [/windows phone ([\d.]+)/i, (v: string) => `Windows Phone ${v.split(".")[0]}`],
        [/windows nt ([\d.]+)/i, () => "Windows"],
        [/android[ /]([\d.]+)/i, (v: string) => `Android ${v.split(".")[0]}`],
        [/(?:cpu iphone os ([\d_]+))/i, (v: string) => `iOS ${v.split("_")[0]}`],
        [/ipad.*cpu os ([\d_]+)/i, (v: string) => `iPadOS ${v.split("_")[0]}`],
        [/mac os x ([\d_]+)/i, (v: string) => `macOS ${v.split("_")[0]}`],
        [/cros/i, () => "ChromeOS"],
        [/linux/i, () => "Linux"],
    ] as const) {
        const match = ua.match(pattern);
        if (match) {
            os = format(match[1]);
            break;
        }
    }

    const formFactor = (() => {
        if (/tablet|ipad/i.test(ua)) return "Tablet";
        if (/mobile|iphone|android/i.test(ua)) return "Mobile";
        if (/bot|crawl|spider/i.test(ua)) return "Bot";
        return "Desktop";
    })();

    const parts = [browser, os, formFactor].filter(Boolean);
    return { browser, os, formFactor, device: parts.join(" · ") };
}

/** Kompatibilitas API lama: label ringkas dari user-agent. */
export function describeDevice(ua: string): string {
    return parseDevice(ua).device;
}

/** Catat kunjungan sekali per perangkat (naikkan hitungan + lokasi + rincian perangkat). */
export async function trackVisit(hash: string, hdrs: Headers): Promise<void> {
    const country = hdrs.get("x-vercel-ip-country") ?? process.env.GEO_FALLBACK_COUNTRY ?? "";
    const region = hdrs.get("x-vercel-ip-country-region") ?? "";
    const city = hdrs.get("x-vercel-ip-city")
        ? decodeURIComponent(hdrs.get("x-vercel-ip-city")!)
        : "";
    const ua = hdrs.get("user-agent") ?? "";
    const device = parseDevice(ua);
    await db
        .insert(visitors)
        .values({
            hash,
            country,
            region,
            city,
            device: device.device,
            browser: device.browser,
            os: device.os,
            formFactor: device.formFactor,
            userAgent: ua,
        })
        .onConflictDoUpdate({
            target: visitors.hash,
            set: {
                views: sql`${visitors.views} + 1`,
                lastSeenAt: sql`now()`,
                ...(country ? { country } : {}),
                ...(region ? { region } : {}),
                ...(city ? { city } : {}),
                ...(device.device ? { device: device.device } : {}),
                ...(device.browser ? { browser: device.browser } : {}),
                ...(device.os ? { os: device.os } : {}),
                ...(device.formFactor ? { formFactor: device.formFactor } : {}),
                ...(ua ? { userAgent: ua } : {}),
            },
        });

    await db
        .insert(visitorDays)
        .values({ hash, day: sql`now()` })
        .onConflictDoUpdate({
            target: [visitorDays.hash, visitorDays.day],
            set: { count: sql`${visitorDays.count} + 1` },
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
    browser: string | null;
    os: string | null;
    formFactor: string | null;
    userAgent: string | null;
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
        browser: row.browser,
        os: row.os,
        formFactor: row.formFactor,
        userAgent: row.userAgent?.slice(0, 512) ?? null,
    };
}

function isoDay(offsetDays: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offsetDays);
    return date.toISOString().slice(0, 10);
}

export interface SeriesPoint {
    label: string;
    count: number;
}

export interface RankingItem {
    label: string;
    count: number;
    views: number;
}

export interface VisitorOverview {
    week: SeriesPoint[];
    month: SeriesPoint[];
    year: SeriesPoint[];
    rankings: {
        countries: RankingItem[];
        browsers: RankingItem[];
        systems: RankingItem[];
        forms: RankingItem[];
    };
}

const RANKINGS_LIMIT = 5;

/** Seri kunjungan harian/menset + peringkat perangkat & negara untuk dasbor admin. */
export async function getVisitorOverview(): Promise<VisitorOverview> {
    return safeQuery(
        "getVisitorOverview",
        async (): Promise<VisitorOverview> => {
            const daily = await db
                .select({
                    day: sql<string>`${visitorDays.day}::text`,
                    count: sql<number>`coalesce(sum(${visitorDays.count}), 0)::int`,
                })
                .from(visitorDays)
                .where(sql`${visitorDays.day} >= ${isoDay(364)}::date`)
                .groupBy(visitorDays.day);

            const perDay = new Map(daily.map((row) => [row.day, row.count]));
            const week: SeriesPoint[] = [];
            for (let offset = 6; offset >= 0; offset -= 1) {
                const day = isoDay(offset);
                week.push({ label: day.slice(5), count: perDay.get(day) ?? 0 });
            }
            const month: SeriesPoint[] = [];
            for (let offset = 29; offset >= 0; offset -= 1) {
                const day = isoDay(offset);
                month.push({ label: day.slice(5), count: perDay.get(day) ?? 0 });
            }

            const yearly = await db
                .select({
                    month: sql<string>`to_char(date_trunc('month', ${visitorDays.day}), 'YYYY-MM')`,
                    count: sql<number>`coalesce(sum(${visitorDays.count}), 0)::int`,
                })
                .from(visitorDays)
                .where(sql`${visitorDays.day} >= ${isoDay(364)}::date`)
                .groupBy(sql`date_trunc('month', ${visitorDays.day})`)
                .orderBy(sql`date_trunc('month', ${visitorDays.day})`);

            const year: SeriesPoint[] = yearly.map((row) => ({
                label: row.month.slice(2),
                count: row.count,
            }));

            const rank = (column: PgColumn) =>
                db
                    .select({
                        label: sql<string>`coalesce(${column}, '')`,
                        views: sql<number>`coalesce(sum(${visitors.views}), 0)::int`,
                        count: sql<number>`count(*)::int`,
                    })
                    .from(visitors)
                    .where(sql`coalesce(${column}, '') <> ''`)
                    .groupBy(column)
                    .orderBy(desc(sql`count(*)`), desc(sql`coalesce(sum(${visitors.views}), 0)`))
                    .limit(RANKINGS_LIMIT);

            const [countries, browsers, systems, forms] = await Promise.all([
                rank(visitors.country),
                rank(visitors.browser),
                rank(visitors.os),
                rank(visitors.formFactor),
            ]);

            return {
                week,
                month,
                year,
                rankings: { countries, browsers, systems, forms },
            };
        },
        { week: [], month: [], year: [], rankings: { countries: [], browsers: [], systems: [], forms: [] } },
    );
}
