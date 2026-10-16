export const SYNC_KEY_PREFIX = "pk_";
const SYNC_KEY_BYTES = 16;

const DIACRITICS = /[̀-ͯ]/g;

function randomHex(bytes: number): string {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Buat kunci X-project baru: `pk_` + 32 hex acak. */
export function generateSyncKey(): string {
    return `${SYNC_KEY_PREFIX}${randomHex(SYNC_KEY_BYTES)}`;
}

export function isSyncKey(value: string): boolean {
    return /^pk_[0-9a-f]{32}$/.test(value.trim());
}

export function slugifyTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFKD")
        .replace(DIACRITICS, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 128);
}
