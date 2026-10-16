"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, normalizeEmail, registerSchema } from "@/lib/credentials";
import { getDictionary } from "@/lib/i18n/server";

export async function registerAccount(raw: {
    name?: string;
    email: string;
    password: string;
}): Promise<{ success: true } | { success: false; error: string }> {
    const t = (await getDictionary()).auth;
    try {
        const parsed = registerSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: t.invalidInput };
        }
        const email = normalizeEmail(parsed.data.email);
        const [existing] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (existing) {
            return { success: false, error: t.accountExists };
        }
        const name = parsed.data.name?.trim() ? parsed.data.name.trim() : null;
        await db.insert(users).values({
            email,
            name,
            passwordHash: await hashPassword(parsed.data.password),
        });
        return { success: true };
    } catch (error) {
        console.error("[registerAccount]", error);
        return { success: false, error: t.registerFailed };
    }
}
