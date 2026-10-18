import { z } from "zod";
import { slugify } from "@/lib/text";

export const STACK_LIMITS = {
    name: 64,
    description: 300,
    sortOrder: 9999,
    stacksPerProject: 12,
} as const;

const MESSAGES = {
    nameRequired: "Nama stack wajib diisi.",
    nameTooLong: `Nama stack maksimal ${STACK_LIMITS.name} karakter.`,
    descriptionTooLong: `Deskripsi maksimal ${STACK_LIMITS.description} karakter.`,
    sortOrderInvalid: "Urutan harus angka 0-9999.",
} as const;

export const stackInputSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, MESSAGES.nameRequired)
        .max(STACK_LIMITS.name, MESSAGES.nameTooLong),
    description: z
        .string()
        .trim()
        .max(STACK_LIMITS.description, MESSAGES.descriptionTooLong),
    sortOrder: z
        .number()
        .int()
        .min(0, MESSAGES.sortOrderInvalid)
        .max(STACK_LIMITS.sortOrder, MESSAGES.sortOrderInvalid),
    visible: z.boolean(),
});

export function stackSlug(name: string): string {
    return slugify(name);
}

export type StackFormValues = z.infer<typeof stackInputSchema>;
