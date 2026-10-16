import { z } from "zod";

export const ACTIVITY_KINDS = ["deploy", "feature", "fix", "update"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_LIMITS = {
    projectKey: 64,
    projectName: 256,
    title: 300,
    body: 2000,
    url: 2048,
    limit: 50,
} as const;

/** Payload yang dikirim proyek lain (nama proyek diambil dari registry kunci). */
export const activityIngestSchema = z.object({
    kind: z.enum(ACTIVITY_KINDS).optional().default("update"),
    title: z.object({
        id: z.string().trim().min(1).max(ACTIVITY_LIMITS.title),
        en: z.string().trim().min(1).max(ACTIVITY_LIMITS.title),
    }),
    body: z
        .object({
            id: z.string().trim().max(ACTIVITY_LIMITS.body).optional().or(z.literal("")),
            en: z.string().trim().max(ACTIVITY_LIMITS.body).optional().or(z.literal("")),
        })
        .optional(),
    url: z.string().trim().max(ACTIVITY_LIMITS.url).optional().or(z.literal("")),
    occurred_at: z.string().datetime({ offset: true }).optional(),
});

export type ActivityIngest = z.infer<typeof activityIngestSchema>;

export interface ProjectRegistryEntry {
    key: string;
    name: string;
}

/**
 * Registry kunci proyek: env ACTIVITY_PROJECT_KEYS format
 * "kunci1:Nama Proyek 1,kunci2:Nama Proyek 2".
 */
export function parseProjectRegistry(raw: string | undefined): ProjectRegistryEntry[] {
    if (!raw) return [];
    return raw
        .split(",")
        .map((pair) => {
            const sep = pair.indexOf(":");
            if (sep <= 0) return null;
            const key = pair.slice(0, sep).trim();
            const name = pair.slice(sep + 1).trim();
            if (!key || !name) return null;
            return { key, name };
        })
        .filter((e): e is ProjectRegistryEntry => e !== null);
}

export function resolveProjectName(raw: string | undefined, key: string): string | null {
    return parseProjectRegistry(raw).find((e) => e.key === key)?.name ?? null;
}
