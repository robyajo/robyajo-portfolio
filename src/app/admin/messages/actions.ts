"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminMutation } from "@/lib/admin-action";
import type { ActionResult } from "@/lib/action-result";
import { assertAdmin } from "@/lib/assert-admin";
import {
    getContactMessages,
    getUnreadContactCount,
    type ContactMessage,
} from "@/lib/contact";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/safe-query";
import { contactMessages } from "@/lib/schema";

const idSchema = z.number().int().positive();

export async function getAdminContactMessages(): Promise<ContactMessage[]> {
    await assertAdmin();
    return safeQuery("getAdminContactMessages", () => getContactMessages(), []);
}

export async function getAdminUnreadContactCount(): Promise<number> {
    await assertAdmin();
    return safeQuery("getAdminUnreadContactCount", getUnreadContactCount, 0);
}

export async function setContactMessageRead(
    id: number,
    isRead: boolean,
): Promise<ActionResult> {
    return adminMutation(
        "update the message",
        async () => {
            if (!idSchema.safeParse(id).success) return "Invalid message.";
            const [updated] = await db
                .update(contactMessages)
                .set({ isRead })
                .where(eq(contactMessages.id, id))
                .returning({ id: contactMessages.id });
            return updated ? undefined : "Message not found.";
        },
        () => revalidatePath("/admin/messages"),
    );
}

export async function deleteContactMessage(id: number): Promise<ActionResult> {
    return adminMutation(
        "delete the message",
        async () => {
            if (!idSchema.safeParse(id).success) return "Invalid message.";
            const [deleted] = await db
                .delete(contactMessages)
                .where(eq(contactMessages.id, id))
                .returning({ id: contactMessages.id });
            return deleted ? undefined : "Message not found.";
        },
        () => revalidatePath("/admin/messages"),
    );
}
