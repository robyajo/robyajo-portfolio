import { db } from "@/lib/db";
import { blogPosts, blogReads } from "@/lib/schema";
import { eq, inArray, sql } from "drizzle-orm";

/**
 * Jumlah pembaca unik per artikel. Slug artikel dapat berbentuk `foo`,
 * `/blogs/foo`, atau `/blog/foo`; semua varian dihitung sebagai satu artikel.
 */

export function readSlugCandidates(slug: string): string[] {
    if (slug.startsWith("/blogs/")) {
        return [slug, `/blog/${slug.slice("/blogs/".length)}`];
    }
    if (slug.startsWith("/blog/")) {
        return [slug, `/blogs/${slug.slice("/blog/".length)}`];
    }
    return [slug, `/blogs/${slug}`, `/blog/${slug}`];
}

export async function getReadsCounts(
    slugs: string[],
): Promise<Record<string, number>> {
    if (slugs.length === 0) return {};

    const pairs = slugs.map(
        (slug) => [slug, readSlugCandidates(slug)] as const,
    );
    const allCandidates = Array.from(
        new Set(pairs.flatMap(([, candidates]) => candidates)),
    );

    const rows = await db
        .select({
            slug: blogPosts.slug,
            count: sql<number>`count(${blogReads.postId})::int`,
        })
        .from(blogPosts)
        .leftJoin(blogReads, eq(blogReads.postId, blogPosts.id))
        .where(inArray(blogPosts.slug, allCandidates))
        .groupBy(blogPosts.slug);

    const bySlug = new Map(rows.map((row) => [row.slug, row.count]));

    return Object.fromEntries(
        pairs.map(([slug, candidates]) => [
            slug,
            candidates.reduce(
                (best, candidate) => Math.max(best, bySlug.get(candidate) ?? 0),
                0,
            ),
        ]),
    );
}
