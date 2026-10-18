"use server";

import { adminMutation } from "@/lib/admin-action";
import type { ActionResult } from "@/lib/action-result";
import { assertAdmin } from "@/lib/assert-admin";
import {
    baseSlug,
    blogFilePath,
    buildBlogFile,
    deleteRepoFile,
    readRepoFile,
    stripFrontmatter,
    writeRepoFile,
    type AdminBlogPost,
    type BlogLang,
    type BlogPostSource,
} from "@/lib/blog-admin";
import {
    categoryInputSchema,
    postInputSchema,
    tagInputSchema,
    tagSlug,
} from "@/lib/blog-admin-schema";
import { db } from "@/lib/db";
import { blogCategories, blogTags } from "@/lib/schema";
import { safeQuery } from "@/lib/safe-query";
import { source } from "@/lib/source";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface AdminBlogCategory {
    id: number;
    slug: string;
    nameId: string;
    nameEn: string;
    descriptionId: string | null;
    descriptionEn: string | null;
    sortOrder: number;
    visible: boolean;
    usage: number;
}

export interface AdminBlogTag {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    visible: boolean;
    usage: number;
}

export interface AdminBlogPostSource {
    slug: string;
    id: BlogPostSource;
    en: BlogPostSource | null;
}

interface PostIndexEntry {
    slug: string;
    lang: BlogLang;
    title: string;
    description: string | null;
    date: string | null;
    tags: string[];
    category: string | null;
    translation: string | null;
    lastModified: string | null;
}

function isoDay(value: Date | string | undefined): string | null {
    return value ? new Date(value).toISOString().slice(0, 10) : null;
}

function todayJakarta(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
    }).format(new Date());
}

function firstIssue(error: z.ZodError): string {
    return error.issues[0]?.message ?? "Invalid input.";
}

function indexPosts(): Map<string, PostIndexEntry> {
    const index = new Map<string, PostIndexEntry>();

    for (const page of source.getPages()) {
        const slug = page.slugs.at(-1);
        if (!slug) continue;

        const data = page.data as typeof page.data & {
            category?: string;
            translation?: string;
        };
        const isEnglish = data.lang === "en" || slug.endsWith("-en");

        index.set(slug, {
            slug,
            lang: isEnglish ? "en" : "id",
            title: data.title ?? "",
            description: data.description ?? null,
            date: isoDay(data.date),
            tags: (data.tags as string[] | undefined) ?? [],
            category: data.category ?? null,
            translation: data.translation ?? null,
            lastModified: isoDay(data.lastModified),
        });
    }

    return index;
}

function englishSibling(
    index: Map<string, PostIndexEntry>,
    entry: PostIndexEntry,
): PostIndexEntry | undefined {
    return (
        index.get(`${entry.slug}-en`) ??
        (entry.translation ? index.get(entry.translation) : undefined)
    );
}

function revalidateBlogAdmin() {
    revalidatePath("/admin/blog");
    revalidatePath("/admin/blog/categories");
    revalidatePath("/admin/blog/tags");
    revalidatePath("/blogs");
}

async function readRawBody(slug: string, lang: BlogLang): Promise<string> {
    const page = source.getPage([slug]);
    const getText = page?.data?.getText;

    if (typeof getText === "function") {
        try {
            const raw = await getText("raw");
            if (raw.trim() !== "") return stripFrontmatter(raw);
        } catch {
            // fall through to repo read
        }
    }

    const stored = await readRepoFile(blogFilePath(baseSlug(slug), lang));
    return stored ? stripFrontmatter(stored) : "";
}

export async function getAdminBlogPosts(): Promise<AdminBlogPost[]> {
    await assertAdmin();
    return safeQuery(
        "getAdminBlogPosts",
        async () => {
            const index = indexPosts();
            const rows = [...index.values()]
                .filter((entry) => entry.lang === "id")
                .map((entry) => {
                    const sibling = englishSibling(index, entry);
                    return {
                        slug: entry.slug,
                        title: entry.title,
                        description: entry.description ?? "",
                        date: entry.date ?? todayJakarta(),
                        tags: entry.tags,
                        category: entry.category,
                        hasEnglish: Boolean(sibling),
                        translation: sibling?.slug ?? null,
                        url: `/blog/${entry.slug}`,
                        lastModified: entry.lastModified,
                    } satisfies AdminBlogPost;
                });
            return rows.sort((a, b) => b.date.localeCompare(a.date));
        },
        [],
    );
}

export async function getAdminBlogPostSource(
    slug: string,
): Promise<AdminBlogPostSource | null> {
    await assertAdmin();
    return safeQuery(
        "getAdminBlogPostSource",
        async () => {
            const index = indexPosts();
            const entry = index.get(slug);
            if (!entry) throw new Error(`Artikel ${slug} tidak ditemukan.`);

            const sibling = englishSibling(index, entry);
            return {
                slug: entry.slug,
                id: {
                    title: entry.title,
                    description: entry.description ?? "",
                    date: entry.date ?? todayJakarta(),
                    tags: entry.tags,
                    category: entry.category ?? "",
                    body: await readRawBody(entry.slug, "id"),
                },
                en: sibling
                    ? {
                          title: sibling.title,
                          description: sibling.description ?? "",
                          date: sibling.date ?? todayJakarta(),
                          tags: sibling.tags,
                          category: sibling.category ?? "",
                          body: await readRawBody(sibling.slug, "en"),
                      }
                    : null,
            };
        },
        null,
    );
}

function parsePost(raw: unknown) {
    const parsed = postInputSchema.safeParse(raw);
    if (!parsed.success) return { ok: false as const, message: firstIssue(parsed.error) };
    return { ok: true as const, data: parsed.data };
}

export async function createBlogPost(raw: unknown): Promise<ActionResult> {
    return adminMutation(
        "create post",
        async () => {
            const parsed = parsePost(raw);
            if (!parsed.ok) return parsed.message;
            const data = parsed.data;

            const index = indexPosts();
            const taken =
                index.has(data.slug) ||
                index.has(`${data.slug}-en`) ||
                (await readRepoFile(blogFilePath(data.slug, "id"))) !== null;
            if (taken) return `Slug "${data.slug}" sudah dipakai artikel lain.`;

            try {
                await writeRepoFile(
                    blogFilePath(data.slug, "id"),
                    buildBlogFile({
                        title: data.titleId,
                        description: data.descriptionId,
                        date: data.date,
                        tags: data.tags,
                        category: data.category,
                        lang: "id",
                        translation: data.includeEnglish ? `${data.slug}-en` : null,
                        body: data.bodyId,
                    }),
                    `blog: tambah artikel ${data.slug}`,
                );

                if (data.includeEnglish) {
                    await writeRepoFile(
                        blogFilePath(data.slug, "en"),
                        buildBlogFile({
                            title: data.titleEn,
                            description: data.descriptionEn,
                            date: data.date,
                            tags: data.tags,
                            category: data.category,
                            lang: "en",
                            translation: data.slug,
                            body: data.bodyEn,
                        }),
                        `blog: tambah terjemahan ${data.slug}`,
                    );
                }
            } catch (error) {
                return error instanceof Error
                    ? error.message
                    : "Gagal menulis berkas artikel.";
            }
        },
        revalidateBlogAdmin,
    );
}

export async function updateBlogPost(
    slug: string,
    raw: unknown,
): Promise<ActionResult> {
    return adminMutation(
        "update post",
        async () => {
            const parsed = parsePost(raw);
            if (!parsed.ok) return parsed.message;
            const data = parsed.data;

            try {
                await writeRepoFile(
                    blogFilePath(slug, "id"),
                    buildBlogFile({
                        title: data.titleId,
                        description: data.descriptionId,
                        date: data.date,
                        tags: data.tags,
                        category: data.category,
                        lang: "id",
                        translation: data.includeEnglish ? `${slug}-en` : null,
                        lastModified: todayJakarta(),
                        body: data.bodyId,
                    }),
                    `blog: perbarui artikel ${slug}`,
                );

                if (data.includeEnglish) {
                    await writeRepoFile(
                        blogFilePath(slug, "en"),
                        buildBlogFile({
                            title: data.titleEn,
                            description: data.descriptionEn,
                            date: data.date,
                            tags: data.tags,
                            category: data.category,
                            lang: "en",
                            translation: slug,
                            lastModified: todayJakarta(),
                            body: data.bodyEn,
                        }),
                        `blog: perbarui terjemahan ${slug}`,
                    );
                } else {
                    await deleteRepoFile(
                        blogFilePath(slug, "en"),
                        `blog: hapus terjemahan ${slug}`,
                    );
                }
            } catch (error) {
                return error instanceof Error
                    ? error.message
                    : "Gagal menulis berkas artikel.";
            }
        },
        revalidateBlogAdmin,
    );
}

export async function deleteBlogPost(slug: string): Promise<ActionResult> {
    return adminMutation(
        "delete post",
        async () => {
            try {
                await deleteRepoFile(
                    blogFilePath(slug, "id"),
                    `blog: hapus artikel ${slug}`,
                );
                await deleteRepoFile(
                    blogFilePath(slug, "en"),
                    `blog: hapus terjemahan ${slug}`,
                );
            } catch (error) {
                return error instanceof Error
                    ? error.message
                    : "Gagal menghapus berkas artikel.";
            }
        },
        revalidateBlogAdmin,
    );
}

function postUsage(): { tags: Map<string, number>; categories: Map<string, number> } {
    const tags = new Map<string, number>();
    const categories = new Map<string, number>();

    for (const entry of indexPosts().values()) {
        if (entry.lang === "en") continue;
        for (const tag of entry.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
        if (entry.category) {
            categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1);
        }
    }

    return { tags, categories };
}

export async function getAdminBlogCategories(): Promise<AdminBlogCategory[]> {
    await assertAdmin();
    return safeQuery(
        "getAdminBlogCategories",
        async () => {
            const usage = postUsage().categories;
            const rows = await db
                .select()
                .from(blogCategories)
                .orderBy(asc(blogCategories.sortOrder), asc(blogCategories.nameId));

            return rows.map((row) => ({
                id: row.id,
                slug: row.slug,
                nameId: row.nameId,
                nameEn: row.nameEn,
                descriptionId: row.descriptionId,
                descriptionEn: row.descriptionEn,
                sortOrder: row.sortOrder,
                visible: row.visible,
                usage: usage.get(row.slug) ?? 0,
            }));
        },
        [],
    );
}

export async function getAdminBlogTags(): Promise<AdminBlogTag[]> {
    await assertAdmin();
    return safeQuery(
        "getAdminBlogTags",
        async () => {
            const usage = postUsage().tags;
            const rows = await db
                .select()
                .from(blogTags)
                .orderBy(asc(blogTags.sortOrder), asc(blogTags.name));

            return rows.map((row) => ({
                id: row.id,
                name: row.name,
                slug: row.slug,
                description: row.description,
                sortOrder: row.sortOrder,
                visible: row.visible,
                usage: usage.get(row.name) ?? 0,
            }));
        },
        [],
    );
}

export async function createBlogCategory(raw: unknown): Promise<ActionResult> {
    return adminMutation(
        "create category",
        async () => {
            const parsed = categoryInputSchema.safeParse(raw);
            if (!parsed.success) return firstIssue(parsed.error);
            const data = parsed.data;

            const [existing] = await db
                .select({ id: blogCategories.id })
                .from(blogCategories)
                .where(eq(blogCategories.slug, data.slug));
            if (existing) return `Kategori dengan slug "${data.slug}" sudah ada.`;

            await db.insert(blogCategories).values(data);
        },
        revalidateBlogAdmin,
    );
}

export async function updateBlogCategory(
    id: number,
    raw: unknown,
): Promise<ActionResult> {
    return adminMutation(
        "update category",
        async () => {
            const parsed = categoryInputSchema.safeParse(raw);
            if (!parsed.success) return firstIssue(parsed.error);
            const data = parsed.data;

            const [existing] = await db
                .select({ id: blogCategories.id })
                .from(blogCategories)
                .where(eq(blogCategories.slug, data.slug));
            if (existing && existing.id !== id) {
                return `Kategori dengan slug "${data.slug}" sudah ada.`;
            }

            await db
                .update(blogCategories)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(blogCategories.id, id));
        },
        revalidateBlogAdmin,
    );
}

export async function deleteBlogCategory(id: number): Promise<ActionResult> {
    return adminMutation(
        "delete category",
        async () => {
            const [row] = await db
                .select()
                .from(blogCategories)
                .where(eq(blogCategories.id, id));
            if (!row) return "Kategori tidak ditemukan.";

            const used = postUsage().categories.get(row.slug) ?? 0;
            if (used > 0) {
                return `Kategori ini masih dipakai di ${used} artikel. Pindahkan dulu kategorinya.`;
            }

            await db.delete(blogCategories).where(eq(blogCategories.id, id));
        },
        revalidateBlogAdmin,
    );
}

export async function createBlogTag(raw: unknown): Promise<ActionResult> {
    return adminMutation(
        "create tag",
        async () => {
            const parsed = tagInputSchema.safeParse(raw);
            if (!parsed.success) return firstIssue(parsed.error);
            const data = parsed.data;

            const [existing] = await db
                .select({ id: blogTags.id })
                .from(blogTags)
                .where(eq(blogTags.name, data.name));
            if (existing) return `Tag "${data.name}" sudah ada.`;

            await db.insert(blogTags).values({
                ...data,
                slug: tagSlug(data.name) || `tag-${Date.now()}`,
            });
        },
        revalidateBlogAdmin,
    );
}

export async function updateBlogTag(
    id: number,
    raw: unknown,
): Promise<ActionResult> {
    return adminMutation(
        "update tag",
        async () => {
            const parsed = tagInputSchema.safeParse(raw);
            if (!parsed.success) return firstIssue(parsed.error);
            const data = parsed.data;

            const [existing] = await db
                .select({ id: blogTags.id })
                .from(blogTags)
                .where(eq(blogTags.name, data.name));
            if (existing && existing.id !== id) {
                return `Tag "${data.name}" sudah ada.`;
            }

            await db
                .update(blogTags)
                .set({
                    ...data,
                    slug: tagSlug(data.name) || `tag-${id}`,
                    updatedAt: new Date(),
                })
                .where(eq(blogTags.id, id));
        },
        revalidateBlogAdmin,
    );
}

export async function deleteBlogTag(id: number): Promise<ActionResult> {
    return adminMutation(
        "delete tag",
        async () => {
            const [row] = await db
                .select()
                .from(blogTags)
                .where(eq(blogTags.id, id));
            if (!row) return "Tag tidak ditemukan.";

            const used = postUsage().tags.get(row.name) ?? 0;
            if (used > 0) {
                return `Tag ini masih dipakai di ${used} artikel. Lepas dulu dari artikelnya.`;
            }

            await db.delete(blogTags).where(eq(blogTags.id, id));
        },
        revalidateBlogAdmin,
    );
}

export async function triggerBlogAutopilot(): Promise<ActionResult> {
    await assertAdmin();
    return safeQuery(
        "triggerBlogAutopilot",
        async () => {
            const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
            if (!token) {
                return { success: false, error: "GitHub token tidak tersedia di server." };
            }
            const repo = "robyajo/robyajo-portfolio";
            const response = await fetch(
                `https://api.github.com/repos/${repo}/actions/workflows/blog-autopilot.yml/dispatches`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/vnd.github+json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ ref: "master" }),
                },
            );
            if (!response.ok) {
                const body = await response.text();
                throw new Error(`GitHub API ${response.status}: ${body}`);
            }
            return { success: true };
        },
        { success: false, error: "Gagal memicu workflow." },
    );
}
