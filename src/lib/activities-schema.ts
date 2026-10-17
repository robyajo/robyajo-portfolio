import { z } from "zod";
import { slugifyTitle } from "./sync-keys";

export const ACTIVITY_KINDS = ["deploy", "feature", "fix", "update"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_ITEM_KINDS = [
    "new",
    "feature",
    "fix",
    "deploy",
    "update",
    "improvement",
    "important",
] as const;

export const ACTIVITY_LIMITS = {
    projectKey: 64,
    projectName: 256,
    title: 300,
    body: 2000,
    url: 2048,
    limit: 50,
} as const;

/** Bentuk kanonik yang disimpan (atanama armada internal). */
const activityCanonicalSchema = z.object({
    kind: z.enum(ACTIVITY_KINDS).optional().default("update"),
    project: z
        .object({
            name: z.string().trim().min(1).max(ACTIVITY_LIMITS.projectName).optional(),
            url: z.string().trim().max(ACTIVITY_LIMITS.url).optional().or(z.literal("")),
            description: z.string().trim().max(ACTIVITY_LIMITS.body).optional().or(z.literal("")),
        })
        .optional(),
    /** Id stabil dari pengirim (mis. nama berkas rilis) — bila sama, baris DIUPDATE. */
    source: z.string().trim().min(1).max(256).optional(),
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

export type ActivityCanonical = z.infer<typeof activityCanonicalSchema>;

/** Peta alias tipe rilis → kind internal. */
function resolveKind(value: unknown): ActivityKind | undefined {
    if (typeof value !== "string") return undefined;
    const key = value.trim().toLowerCase();
    if ((ACTIVITY_KINDS as readonly string[]).includes(key)) return key as ActivityKind;
    if (key === "new") return "feature";
    if (key === "important" || key === "major" || key === "release") return "feature";
    if (key === "improvement" || key === "minor" || key === "chore") return "update";
    if (key === "bug" || key === "hotfix") return "fix";
    return undefined;
}

function toDateISO(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${value}T00:00:00+00:00`;
    }
    const raw = value;
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return undefined;
}

function collectItems(value: unknown): { id: string[]; en: string[] } {
    const result = { id: [] as string[], en: [] as string[] };
    if (!Array.isArray(value)) return result;
    for (const entry of value) {
        if (typeof entry === "string") {
            const text = entry.trim();
            if (text) {
                result.id.push(text);
                result.en.push(text);
            }
            continue;
        }
        if (typeof entry !== "object" || entry === null) continue;
        const item = entry as Record<string, unknown>;
        if (typeof item.id === "string" && item.id.trim()) {
            result.id.push(item.id.trim());
        }
        if (typeof item.en === "string" && item.en.trim()) {
            result.en.push(item.en.trim());
        }
    }
    return result;
}

/**
 * Terima dua bentuk payload sekaligus:
 * 1. Kanonik: `{kind, project, source, title, body, url, occurred_at}`.
 * 2. Berkas rilis persis seperti di proyek lain:
 *    `{date, type, title{id,en}, body{id,en}, items[{type,id,en}]}` —
 *    `type` dipetakan ke kind, `date` jadi waktu, `items` jadi butir berstrip
 *    di isi. `source` diambil dari nama berkat rilis (date + slug judul).
 */
export function normalizeActivityPayload(raw: unknown): unknown {
    if (typeof raw !== "object" || raw === null) return raw;
    const input = raw as Record<string, unknown>;
    if (Array.isArray(input)) return raw;

    const kindInput = typeof input.kind === "string" ? input.kind : undefined;
    const kind =
        kindInput !== undefined
            ? resolveKind(kindInput)
            : typeof input.type === "string"
              ? (resolveKind(input.type) ?? "update")
              : undefined;
    // `kind` kanonik invalid diteruskan apa adanya agar zod menolak (bukan
    // diam-diam jadi update); alias `type` yang tak dikenal dimaafkan.

    const occurredAt = toDateISO(input.occurred_at) ?? toDateISO(input.date);

    let source: unknown = input.source;
    if (typeof source !== "string" || !source.trim()) {
        const titleId = typeof input.title === "object" && input.title !== null
            ? (input.title as Record<string, unknown>).id
            : undefined;
        const titleEn = typeof input.title === "object" && input.title !== null
            ? (input.title as Record<string, unknown>).en
            : undefined;
        const baseTitle = typeof titleId === "string" && titleId.trim()
            ? titleId
            : typeof titleEn === "string" && titleEn.trim()
              ? titleEn
              : undefined;
        if (baseTitle) {
            const slug = slugifyTitle(baseTitle);
            const datePrefix =
                typeof input.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.date)
                    ? `${input.date}-`
                    : "";
            const derived = `${datePrefix}${slug}`.replace(/-+$/, "");
            if (derived) source = derived.slice(0, 256);
        }
    }

    const bodyRaw =
        typeof input.body === "object" && input.body !== null
            ? (input.body as Record<string, unknown>)
            : undefined;
    const items = collectItems(input.items);

    function composeBody(base: unknown, lines: string[]): string {
        const parts: string[] = [];
        if (typeof base === "string" && base.trim()) parts.push(base.trim());
        for (const line of lines) {
            parts.push(`- ${line}`);
        }
        return parts.join("\n");
    }

    const bodyId = composeBody(bodyRaw?.id, items.id);
    const bodyEn = composeBody(bodyRaw?.en, items.en);

    return {
        ...(kind !== undefined
            ? { kind }
            : kindInput !== undefined
              ? { kind: kindInput }
              : {}),
        project: input.project,
        source: typeof source === "string" && source.trim() ? source.trim() : undefined,
        title: input.title,
        body: {
            id: bodyId.slice(0, ACTIVITY_LIMITS.body),
            en: bodyEn.slice(0, ACTIVITY_LIMITS.body),
        },
        url: input.url,
        occurred_at: occurredAt,
    };
}

export const activityIngestSchema = z.preprocess(
    normalizeActivityPayload,
    activityCanonicalSchema,
);

export type ActivityIngest = z.output<typeof activityCanonicalSchema>;

/** Untai isi → lead + butir berstrip (baris mulai "- " disusun jadi daftar). */
export function splitActivityBody(body: string | null | undefined): {
    lead: string;
    bullets: string[];
} {
    if (!body) return { lead: "", bullets: [] };
    const lead: string[] = [];
    const bullets: string[] = [];
    for (const line of body.split("\n")) {
        const text = line.trim();
        if (!text) continue;
        if (text.startsWith("- ") && text.length > 2) {
            bullets.push(text.slice(2));
        } else {
            lead.push(text);
        }
    }
    return { lead: lead.join(" "), bullets };
}

/** Patch parsial untuk PATCH /api/activities/[id] — semua opsional. */
export const activityPatchSchema = z
    .object({
        kind: z.enum(ACTIVITY_KINDS).optional(),
        title: z
            .object({
                id: z.string().trim().min(1).max(ACTIVITY_LIMITS.title).optional(),
                en: z.string().trim().min(1).max(ACTIVITY_LIMITS.title).optional(),
            })
            .optional(),
        body: z
            .object({
                id: z.string().trim().max(ACTIVITY_LIMITS.body).optional().or(z.literal("")),
                en: z.string().trim().max(ACTIVITY_LIMITS.body).optional().or(z.literal("")),
            })
            .optional(),
        url: z.string().trim().max(ACTIVITY_LIMITS.url).optional().or(z.literal("")),
        occurred_at: z.string().datetime({ offset: true }).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

export type ActivityPatch = z.infer<typeof activityPatchSchema>;

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
