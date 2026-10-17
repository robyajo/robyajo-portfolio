import { describe, expect, it } from "vitest";
import {
    activityIngestSchema,
    activityPatchSchema,
    parseProjectRegistry,
    resolveProjectName,
    splitActivityBody,
} from "@/lib/activities-schema";

describe("parseProjectRegistry", () => {
    it("parses key:name pairs", () => {
        expect(parseProjectRegistry("abc:My App,def:Lainnya")).toEqual([
            { key: "abc", name: "My App" },
            { key: "def", name: "Lainnya" },
        ]);
    });

    it("ignores malformed pairs and blanks", () => {
        expect(parseProjectRegistry("abc:OK,,no-separator,:noname,  ")).toEqual([
            { key: "abc", name: "OK" },
        ]);
    });

    it("returns empty for missing env", () => {
        expect(parseProjectRegistry(undefined)).toEqual([]);
        expect(parseProjectRegistry("")).toEqual([]);
    });
});

describe("resolveProjectName", () => {
    it("resolves known keys only", () => {
        const raw = "abc:My App";
        expect(resolveProjectName(raw, "abc")).toBe("My App");
        expect(resolveProjectName(raw, "zzz")).toBeNull();
    });
});

describe("activityIngestSchema", () => {
    const valid = {
        kind: "feature",
        title: { id: "Judul", en: "Title" },
        body: { id: "Isi", en: "Body" },
        url: "https://example.com/x",
        occurred_at: "2026-10-16T10:00:00+07:00",
    };

    it("accepts a full payload", () => {
        expect(activityIngestSchema.safeParse(valid).success).toBe(true);
    });

    it("defaults kind and accepts minimal payload", () => {
        const parsed = activityIngestSchema.safeParse({ title: { id: "J", en: "T" } });
        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.kind).toBe("update");
    });

    it("accepts project meta and stable source id", () => {
        const parsed = activityIngestSchema.safeParse({
            title: { id: "J", en: "T" },
            project: { name: "Kominfo Super Aman", url: "https://contoh.go.id" },
            source: "releases/2026-10-16-rilis.json",
        });
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.source).toBe("releases/2026-10-16-rilis.json");
            expect(parsed.data.project?.name).toBe("Kominfo Super Aman");
        }
    });

    it.each([
        [{ title: { id: "", en: "T" } }],
        [{ title: { id: "J" } }],
        [{ kind: "nope", title: { id: "J", en: "T" } }],
        [{ title: { id: "J", en: "T" }, url: "not-a-url-that-is-way-too-long-" + "x".repeat(2100) }],
    ])("rejects %o", (input) => {
        expect(activityIngestSchema.safeParse(input).success).toBe(false);
    });
});

describe("activityIngestSchema — bentuk berkas rilis", () => {
    const releaseFile = {
        date: "2026-05-13",
        type: "feature",
        title: {
            id: "Verifikasi Keabsahan Dokumen & Surat Resmi Kelurahan",
            en: "Official Document Authenticity & Electronic Signature Verification",
        },
        body: {
            id: "Fitur pengecekan keabsahan surat keterangan resmi kelurahan.",
            en: "Authenticity verification for official municipal certificates.",
        },
        items: [
            {
                type: "new",
                id: "Pindai Kode Keabsahan: memeriksa keaslian dokumen.",
                en: "Scan Verification Code: instantly verify authenticity.",
            },
            {
                type: "improvement",
                id: "Informasi Pengesahan Terbuka: transparan.",
                en: "Transparent Validation Details: clearly displayed.",
            },
        ],
    };

    it("maps date/type/items from a raw release file", () => {
        const parsed = activityIngestSchema.safeParse(releaseFile);
        expect(parsed.success).toBe(true);
        if (!parsed.success) return;
        expect(parsed.data.kind).toBe("feature");
        expect(parsed.data.occurred_at?.startsWith("2026-05-13")).toBe(true);
        expect(parsed.data.source).toBe("2026-05-13-verifikasi-keabsahan-dokumen-surat-resmi-kelurahan");
        expect(parsed.data.body?.id).toContain("Fitur pengecekan");
        expect(parsed.data.body?.id).toContain("- Pindai Kode Keabsahan");
        expect(parsed.data.body?.en).toContain("- Transparent Validation Details");
    });

    it.each([
        ["important", "feature"],
        ["new", "feature"],
        ["bug", "fix"],
        ["hotfix", "fix"],
        ["improvement", "update"],
        ["deploy", "deploy"],
        ["fix", "fix"],
        ["update", "update"],
        ["chore", "update"],
    ])("maps type %s → %s", (raw, expected) => {
        const parsed = activityIngestSchema.safeParse({
            ...releaseFile,
            type: raw,
        });
        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.kind).toBe(expected);
    });

    it("derives source without a date from the English title", () => {
        const parsed = activityIngestSchema.safeParse({
            type: "fix",
            title: { id: "Perbaikan Formulir", en: "Registration Form Fix" },
            items: [{ id: "Butir", en: "Bullet" }],
        });
        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.source).toBe("perbaikan-formulir");
    });

    it("keeps an explicit source untouched", () => {
        const parsed = activityIngestSchema.safeParse({
            ...releaseFile,
            source: "releases/2026-05-13-verifikasi-keaslian-e-surat.json",
        });
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.source).toBe(
                "releases/2026-05-13-verifikasi-keaslian-e-surat.json",
            );
        }
    });

    it("truncates an overlong body composed from items", () => {
        const parsed = activityIngestSchema.safeParse({
            title: { id: "J", en: "T" },
            items: Array.from({ length: 200 }, (_, i) => ({
                id: `butir ${i} ${"x".repeat(30)}`,
                en: `bullet ${i} ${"x".repeat(30)}`,
            })),
        });
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect((parsed.data.body?.id ?? "").length).toBeLessThanOrEqual(2000);
        }
    });

    it("falls back to unknown types as update", () => {
        const parsed = activityIngestSchema.safeParse({
            ...releaseFile,
            type: "weird",
        });
        expect(parsed.success).toBe(true);
        if (parsed.success) expect(parsed.data.kind).toBe("update");
    });
});

describe("splitActivityBody", () => {
    it("splits lead text and bullet lines", () => {
        expect(
            splitActivityBody("Ringkasan.\n- Butir satu\n- Butir dua\n"),
        ).toEqual({
            lead: "Ringkasan.",
            bullets: ["Butir satu", "Butir dua"],
        });
    });

    it("handles missing body and bullet-less text", () => {
        expect(splitActivityBody(null)).toEqual({ lead: "", bullets: [] });
        expect(splitActivityBody("hanya lead")).toEqual({
            lead: "hanya lead",
            bullets: [],
        });
    });
});

describe("activityPatchSchema", () => {
    it("accepts partial updates", () => {
        expect(activityPatchSchema.safeParse({ kind: "fix" }).success).toBe(true);
        expect(
            activityPatchSchema.safeParse({ title: { id: "Baru" } }).success,
        ).toBe(true);
    });

    it("rejects empty patch and bad kind", () => {
        expect(activityPatchSchema.safeParse({}).success).toBe(false);
        expect(activityPatchSchema.safeParse({ kind: "nope" }).success).toBe(false);
    });
});
