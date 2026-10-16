
import { siteConfig } from "@/lib/config";
import { formatFileDate } from "@/lib/date";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export const RESUME_CACHE_TAG = "resume-pdf";

/** PDF resume milik sendiri di repo — selalu diutamakan dari unduhan remote. */
const LOCAL_RESUME_PATH = join(process.cwd(), "public", "assets", "resume-roby.pdf");

async function fetchLocalResume(): Promise<Response | null> {
    try {
        const [buf, st] = await Promise.all([
            readFile(LOCAL_RESUME_PATH),
            stat(LOCAL_RESUME_PATH),
        ]);
        return new Response(new Uint8Array(buf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Length": String(st.size),
                "Last-Modified": st.mtime.toUTCString(),
            },
        });
    } catch {
        return null;
    }
}

export async function fetchResume() {
    const local = await fetchLocalResume();
    if (local) return local;

    const res = await fetch(siteConfig.resumeURL, {
        next: { revalidate: 3600, tags: [RESUME_CACHE_TAG] },
    });

    if (!res.ok || !res.body) {
        throw new Error(
            `Failed to fetch resume: ${res.status} ${res.statusText}`
        );
    }

    return res;
}

export function getResumeFilename(download: boolean = false) {
    const formattedName = siteConfig.name.replace(/\s+/g, "_");
    const formattedDate = formatFileDate();
    return download ? `${formattedName}-Resume-${formattedDate}.pdf` : `${siteConfig.name}'s Resume.pdf`;
}

export function forwardResumeHeaders(res: Response, extra: Record<string, string>): Headers {
    const headers = new Headers({
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=3600",
        ...extra,
    });
    const contentLength = res.headers.get("content-length");
    const etag = res.headers.get("etag");
    const lastModified = res.headers.get("last-modified");
    if (contentLength) headers.set("Content-Length", contentLength);
    if (etag) headers.set("ETag", etag);
    if (lastModified) headers.set("Last-Modified", lastModified);
    return headers;
}
