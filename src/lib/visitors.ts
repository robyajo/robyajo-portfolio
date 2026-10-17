import { count, sql } from "drizzle-orm";
import {
    db,
} from "@/lib/db";
import { visitors } from "@/lib/schema";
import { safeQuery } from "@/lib/safe-query";
import {
    getClientIp,
    hashIp,
} from "@/lib/ip";

export interface VisitorStats {
    total: number;
    today: number;
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

/** Catat kunjungan sekali per perangkat (naikkan hitungan + waktu terakhir). */
export async function trackVisit(hash: string): Promise<void> {
    await db
        .insert(visitors)
        .values({ hash })
        .onConflictDoUpdate({
            target: visitors.hash,
            set: {
                views: sql`${visitors.views} + 1`,
                lastSeenAt: sql`now()`,
            },
        });
}

/** Ringkasan kunjungan: total perangkat unik + yang terlihat hari ini. */
export async function getVisitorStats(): Promise<VisitorStats> {
    return safeQuery(
        "getVisitorStats",
        async () => {
            const [row] = await db
                .select({
                    total: count(visitors.hash),
                    today: sql<number>`count(${visitors.hash}) filter (where ${visitors.lastSeenAt} >= date_trunc('day', now()))::int`,
                })
                .from(visitors);
            return {
                total: row?.total ?? 0,
                today: row?.today ?? 0,
            };
        },
        { total: 0, today: 0 },
    );
}
