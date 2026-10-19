import { z } from "zod";

export const CONTACT_LIMITS = {
    name: 120,
    email: 254,
    subject: 160,
    message: 4000,
    messageMin: 20,
} as const;

export const contactInputSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required.")
        .max(CONTACT_LIMITS.name, "Name is too long."),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, "Email is required.")
        .max(CONTACT_LIMITS.email, "Email is too long.")
        .email("Enter a valid email address."),
    subject: z
        .string()
        .trim()
        .max(CONTACT_LIMITS.subject, "Subject is too long.")
        .optional()
        .or(z.literal("")),
    message: z
        .string()
        .trim()
        .min(
            CONTACT_LIMITS.messageMin,
            `Message needs at least ${CONTACT_LIMITS.messageMin} characters.`,
        )
        .max(CONTACT_LIMITS.message, "Message is too long."),
});

export const contactFormSchema = contactInputSchema.extend({
    website: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const CONTACT_RATE_LIMIT = {
    windowMinutes: 15,
    maxPerWindow: 3,
    dailyMax: 10,
} as const;

export const HONEYPOT_FIELD = "website" as const;
