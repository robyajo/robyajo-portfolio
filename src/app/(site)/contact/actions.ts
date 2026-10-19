"use server";

import { headers } from "next/headers";
import { createContactMessage } from "@/lib/contact";
import { getClientIp } from "@/lib/ip";
import { getDictionary } from "@/lib/i18n/server";
import type { ContactFormValues } from "@/lib/contact-schema";

export type ContactActionResult =
    | { success: true }
    | { success: false; error: string };

export async function submitContactMessage(
    raw: ContactFormValues,
): Promise<ContactActionResult> {
    const errors = (await getDictionary()).contactPage.errors;
    const result = await createContactMessage(raw, getClientIp(await headers()));

    if (result.ok) return { success: true };
    if (result.reason === "rateLimited") {
        return { success: false, error: errors.rateLimited };
    }
    if (result.reason === "invalid") {
        return { success: false, error: errors.invalid };
    }
    return { success: false, error: errors.failed };
}
