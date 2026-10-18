import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Artikel blog hidup sebagai berkas MDX di repo (sumber tunggal), bukan baris
 * database. Di runtime produksi berkas hanya-baca, jadi penyimpanan dilakukan
 * lewat commit GitHub (Contents API) yang memicu deploy ulang. Di lokal
 * `BLOG_WRITE_MODE=file` menulis langsung ke disk agar pengembangan tanpa
 * token tetap bisa menulis artikel.
 */

export const BLOG_DIR = "content/blog";

const GITHUB_API = "https://api.github.com";
const GITHUB_REPO = process.env.BLOG_GITHUB_REPO ?? "robyajo/robyajo-portfolio";
const GITHUB_BRANCH = process.env.BLOG_GITHUB_BRANCH ?? "master";

export type BlogLang = "id" | "en";
export type WriteMode = "file" | "commit";

export interface BlogFileInput {
    title: string;
    description: string;
    date: string;
    tags: string[];
    category?: string | null;
    lang: BlogLang;
    translation?: string | null;
    lastModified?: string | null;
    body: string;
}

function yamlString(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ").trim()}"`;
}

export function buildBlogFile(input: BlogFileInput): string {
    const lines = [
        "---",
        `title: ${yamlString(input.title)}`,
        `description: ${yamlString(input.description)}`,
        `date: ${input.date}`,
    ];

    if (input.tags.length > 0) {
        lines.push("tags:");
        for (const tag of input.tags) lines.push(`    - ${yamlString(tag)}`);
    }

    if (input.category) lines.push(`category: ${yamlString(input.category)}`);
    lines.push(`lang: ${input.lang}`);
    if (input.translation) {
        lines.push(`translation: ${yamlString(input.translation)}`);
    }
    if (input.lastModified) lines.push(`lastModified: ${input.lastModified}`);
    lines.push("---");

    return `${lines.join("\n")}\n${input.body.trim()}\n`;
}

export function blogFileName(slug: string, lang: BlogLang): string {
    return lang === "en" ? `${slug}-en.mdx` : `${slug}.mdx`;
}

export function blogFilePath(slug: string, lang: BlogLang): string {
    return `${BLOG_DIR}/${blogFileName(slug, lang)}`;
}

export function baseSlug(slug: string): string {
    return slug.endsWith("-en") ? slug.slice(0, -3) : slug;
}

export function stripFrontmatter(raw: string): string {
    const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(raw);
    return (match ? raw.slice(match[0].length) : raw).trim();
}

function token(): string | null {
    return process.env.BLOG_ADMIN_TOKEN ?? process.env.GITHUB_TOKEN ?? null;
}

export function usesFilesystemWrites(): boolean {
    return process.env.BLOG_WRITE_MODE === "file" || token() === null;
}

function localPath(repoPath: string): string {
    return path.join(process.cwd(), repoPath);
}

async function githubFetch(
    urlPath: string,
    init: RequestInit,
): Promise<Response> {
    const auth = token();
    if (!auth) throw new Error("BLOG_ADMIN_TOKEN belum diatur.");
    return fetch(`${GITHUB_API}${urlPath}`, {
        ...init,
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${auth}`,
            "X-GitHub-Api-Version": "2022-11-28",
            ...(init.headers ?? {}),
        },
        cache: "no-store",
    });
}

export async function readRepoFile(repoPath: string): Promise<string | null> {
    if (usesFilesystemWrites()) {
        try {
            return await fs.readFile(localPath(repoPath), "utf8");
        } catch {
            return null;
        }
    }

    const response = await githubFetch(
        `/repos/${GITHUB_REPO}/contents/${repoPath}?ref=${GITHUB_BRANCH}`,
        { headers: { Accept: "application/vnd.github.raw+json" } },
    );
    if (response.status === 404) return null;
    if (!response.ok) {
        throw new Error(`Gagal membaca ${repoPath} (${response.status}).`);
    }
    return response.text();
}

async function remoteSha(repoPath: string): Promise<string | null> {
    const response = await githubFetch(
        `/repos/${GITHUB_REPO}/contents/${repoPath}?ref=${GITHUB_BRANCH}`,
        { method: "GET" },
    );
    if (response.status === 404) return null;
    if (!response.ok) {
        throw new Error(`Gagal memeriksa ${repoPath} (${response.status}).`);
    }
    const data = (await response.json()) as { sha?: string };
    return data.sha ?? null;
}

export async function writeRepoFile(
    repoPath: string,
    content: string,
    message: string,
): Promise<WriteMode> {
    if (usesFilesystemWrites()) {
        const target = localPath(repoPath);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, content, "utf8");
        return "file";
    }

    const sha = await remoteSha(repoPath);
    const response = await githubFetch(
        `/repos/${GITHUB_REPO}/contents/${repoPath}`,
        {
            method: "PUT",
            body: JSON.stringify({
                message,
                content: Buffer.from(content, "utf8").toString("base64"),
                branch: GITHUB_BRANCH,
                ...(sha ? { sha } : {}),
            }),
        },
    );
    if (!response.ok) {
        throw new Error(
            `Gagal menyimpan ${repoPath} ke repo (${response.status}). Periksa izin token.`,
        );
    }
    return "commit";
}

export async function deleteRepoFile(
    repoPath: string,
    message: string,
): Promise<WriteMode | "missing"> {
    if (usesFilesystemWrites()) {
        try {
            await fs.unlink(localPath(repoPath));
            return "file";
        } catch {
            return "missing";
        }
    }

    const sha = await remoteSha(repoPath);
    if (!sha) return "missing";

    const response = await githubFetch(
        `/repos/${GITHUB_REPO}/contents/${repoPath}`,
        {
            method: "DELETE",
            body: JSON.stringify({ message, sha, branch: GITHUB_BRANCH }),
        },
    );
    if (!response.ok) {
        throw new Error(
            `Gagal menghapus ${repoPath} dari repo (${response.status}).`,
        );
    }
    return "commit";
}

export interface AdminBlogPost {
    slug: string;
    title: string;
    description: string;
    date: string;
    tags: string[];
    category: string | null;
    hasEnglish: boolean;
    translation: string | null;
    url: string;
    lastModified: string | null;
    author: string | null;
}

export interface BlogPostSource {
    title: string;
    description: string;
    date: string;
    tags: string[];
    category: string;
    body: string;
}
