import { z } from "zod";
import { compare, hash } from "bcryptjs";

export const CREDENTIAL_LIMITS = {
    name: 100,
    email: 320,
    passwordMin: 8,
    passwordMax: 128,
} as const;

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required.")
        .max(CREDENTIAL_LIMITS.name, "Name is too long.")
        .optional()
        .or(z.literal("")),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, "Email is required.")
        .max(CREDENTIAL_LIMITS.email, "Email is too long.")
        .email("Enter a valid email address."),
    password: z
        .string()
        .min(CREDENTIAL_LIMITS.passwordMin, "Password needs at least 8 characters.")
        .max(CREDENTIAL_LIMITS.passwordMax, "Password is too long."),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().min(1, "Email is required.").email("Enter a valid email address."),
    password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

const BCRYPT_COST = 12;

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
    return hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    if (!password || !passwordHash) return false;
    try {
        return await compare(password, passwordHash);
    } catch {
        return false;
    }
}
