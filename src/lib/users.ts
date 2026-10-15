export interface PublicUser {
    id: string;
    name: string;
    username: string | null;
    imageUrl: string;
}

/**
 * Author identitas diambil dari snapshot yang disimpan saat tulis
 * (kolom author_name/author_image), tanpa direktori user eksternal.
 */
export function resolveUser(
    row: { userId: string; authorName: string | null; authorImage: string | null },
): PublicUser {
    return {
        id: row.userId,
        name: row.authorName || "Unknown User",
        username: null,
        imageUrl: row.authorImage ?? "",
    };
}
