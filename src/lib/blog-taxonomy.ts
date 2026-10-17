import { db } from "@/lib/db";
import { blogCategories, blogTags } from "@/lib/schema";
import { safeQuery } from "@/lib/safe-query";
import { asc, eq } from "drizzle-orm";

export interface BlogCategoryView {
    slug: string;
    nameId: string;
    nameEn: string;
    descriptionId: string | null;
    descriptionEn: string | null;
}

export interface BlogTagView {
    name: string;
    slug: string;
}

export function localizedCategoryName(
    category: BlogCategoryView,
    locale: string,
): string {
    const value = locale === "id" ? category.nameId : category.nameEn;
    return value.trim() === "" ? category.slug : value;
}

export function localizedCategoryDescription(
    category: BlogCategoryView,
    locale: string,
): string | null {
    return locale === "id" ? category.descriptionId : category.descriptionEn;
}

export async function getVisibleCategories(): Promise<BlogCategoryView[]> {
    return safeQuery(
        "getVisibleCategories",
        async () => {
            const rows = await db
                .select()
                .from(blogCategories)
                .where(eq(blogCategories.visible, true))
                .orderBy(asc(blogCategories.sortOrder), asc(blogCategories.nameId));

            return rows.map((row) => ({
                slug: row.slug,
                nameId: row.nameId,
                nameEn: row.nameEn,
                descriptionId: row.descriptionId,
                descriptionEn: row.descriptionEn,
            }));
        },
        [],
    );
}

export async function getTagRegistry(): Promise<Map<string, boolean>> {
    return safeQuery(
        "getTagRegistry",
        async () => {
            const rows = await db
                .select({ name: blogTags.name, visible: blogTags.visible })
                .from(blogTags)
                .orderBy(asc(blogTags.sortOrder), asc(blogTags.name));

            return new Map(rows.map((row) => [row.name, row.visible]));
        },
        new Map<string, boolean>(),
    );
}
