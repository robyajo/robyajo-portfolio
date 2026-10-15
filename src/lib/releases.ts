import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export type ReleaseItemType = "new" | "fix" | "improvement" | "security" | "removed";
export type ReleaseType = "feature" | "fix" | "improvement" | "important";

export interface ReleaseItem {
    type: ReleaseItemType;
    id: string;
    en: string;
}

export interface Release {
    date: string;
    type: ReleaseType;
    status?: "published" | "draft";
    title: { id: string; en: string };
    body: { id: string; en: string };
    items: ReleaseItem[];
}

const RELEASES_DIR = join(process.cwd(), "releases");

function isRelease(value: unknown): value is Release {
    if (typeof value !== "object" || value === null) return false;
    const r = value as Record<string, unknown>;
    return (
        typeof r.date === "string" &&
        typeof r.type === "string" &&
        typeof r.title === "object" &&
        typeof r.body === "object" &&
        Array.isArray(r.items)
    );
}

/** Membaca seluruh berkas rilis harian, terbaru dulu. Melewati yang rusak. */
export async function getReleases(): Promise<Release[]> {
    let files: string[];
    try {
        files = (await readdir(RELEASES_DIR)).filter((f) => f.endsWith(".json")).sort().reverse();
    } catch {
        return [];
    }
    const out: Release[] = [];
    for (const file of files) {
        try {
            const raw = await readFile(join(RELEASES_DIR, file), "utf-8");
            const parsed: unknown = JSON.parse(raw);
            if (isRelease(parsed) && parsed.status !== "draft") out.push(parsed);
        } catch (error) {
            console.error(`Skipping unreadable release file (${file}):`, error);
        }
    }
    return out;
}

/** Berkas rilis untuk tanggal hari ini (format YYYY-MM-DD), jika ada. */
export async function getTodayReleaseFile(today: string): Promise<string | null> {
    let files: string[];
    try {
        files = await readdir(RELEASES_DIR);
    } catch {
        return null;
    }
    return files.find((f) => f.startsWith(today) && f.endsWith(".json")) ?? null;
}
