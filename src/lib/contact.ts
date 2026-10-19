import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/schema";
import { hashIp } from "@/lib/ip";
import {
    CONTACT_RATE_LIMIT,
    contactInputSchema,
} from "@/lib/contact-schema";

export type ContactSubmissionResult =
    | { ok: true }
    | { ok: false; reason: "invalid" | "rateLimited" | "failed" };

function minutesAgo(minutes: number): Date {
    return new Date(Date.now() - minutes * 60 * 1000);
}

function hoursAgo(hours: number): Date {
    return minutesAgo(hours * 60);
}

async function isRateLimited(ipHash: string): Promise<boolean> {
    const [recent, daily] = await Promise.all([
        db
            .select({ count: count() })
            .from(contactMessages)
            .where(
                and(
                    eq(contactMessages.ipHash, ipHash),
                    gte(
                        contactMessages.createdAt,
                        minutesAgo(CONTACT_RATE_LIMIT.windowMinutes),
                    ),
                ),
            ),
        db
            .select({ count: count() })
            .from(contactMessages)
            .where(
                and(
                    eq(contactMessages.ipHash, ipHash),
                    gte(contactMessages.createdAt, hoursAgo(24)),
                ),
            ),
    ]);

    return (
        (recent[0]?.count ?? 0) >= CONTACT_RATE_LIMIT.maxPerWindow ||
        (daily[0]?.count ?? 0) >= CONTACT_RATE_LIMIT.dailyMax
    );
}

export async function createContactMessage(
    raw: unknown,
    ip: string,
): Promise<ContactSubmissionResult> {
    const honeypot = (raw as Record<string, unknown> | null)?.["website"];
    if (typeof honeypot === "string" && honeypot.trim() !== "") {
        return { ok: true };
    }

    const parsed = contactInputSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, reason: "invalid" };

    try {
        const ipHash = await hashIp(ip);
        if (await isRateLimited(ipHash)) {
            return { ok: false, reason: "rateLimited" };
        }

        await db.insert(contactMessages).values({
            name: parsed.data.name,
            email: parsed.data.email,
            subject: parsed.data.subject ? parsed.data.subject : null,
            message: parsed.data.message,
            ipHash,
        });

        return { ok: true };
    } catch (error) {
        console.error("[createContactMessage]", error);
        return { ok: false, reason: "failed" };
    }
}

export interface ContactMessage {
    id: number;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export async function getContactMessages(limit = 200): Promise<ContactMessage[]> {
    const rows = await db
        .select({
            id: contactMessages.id,
            name: contactMessages.name,
            email: contactMessages.email,
            subject: contactMessages.subject,
            message: contactMessages.message,
            isRead: contactMessages.isRead,
            createdAt: contactMessages.createdAt,
        })
        .from(contactMessages)
        .orderBy(desc(contactMessages.createdAt), desc(contactMessages.id))
        .limit(Math.min(Math.max(limit, 1), 500));

    return rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
    }));
}

export async function getUnreadContactCount(): Promise<number> {
    const [row] = await db
        .select({ count: count() })
        .from(contactMessages)
        .where(eq(contactMessages.isRead, false));
    return row?.count ?? 0;
}
