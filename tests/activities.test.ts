import { describe, expect, it } from "vitest";
import {
    activityIngestSchema,
    activityPatchSchema,
    parseProjectRegistry,
    resolveProjectName,
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
