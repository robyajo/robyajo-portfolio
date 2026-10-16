import { NextResponse } from "next/server";
import { activityIngestSchema, resolveProjectName } from "@/lib/activities-schema";
import { getActivityCount, getRecentActivities, insertActivity } from "@/lib/activities";

/**
 * GET /api/activities?limit=20&project=kunci — daftar kegiatan publik,
 * terbaru dulu. Tanpa auth (data tayang).
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 50);
    const project = searchParams.get("project")?.trim() || undefined;
    try {
        const [items, total] = await Promise.all([
            getRecentActivities(limit, project),
            getActivityCount(project),
        ]);
        return NextResponse.json({ ok: true, total, items });
    } catch (error) {
        console.error("[GET /api/activities]", error);
        return NextResponse.json({ error: "Failed to load activities." }, { status: 500 });
    }
}

/**
 * POST /api/activities — terima kegiatan dari proyek lain.
 * Auth: header statis X-project berisi kunci yang terdaftar di
 * env ACTIVITY_PROJECT_KEYS ("kunci:Nama Proyek,...").
 */
export async function POST(request: Request) {
    const key = request.headers.get("x-project")?.trim();
    if (!key) {
        return NextResponse.json({ error: "Missing X-project header." }, { status: 401 });
    }
    const projectName = resolveProjectName(process.env.ACTIVITY_PROJECT_KEYS, key);
    if (!projectName) {
        return NextResponse.json({ error: "Unknown project key." }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = activityIngestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid payload.", issues: parsed.error.issues.map((i) => i.message) },
            { status: 422 },
        );
    }

    try {
        const id = await insertActivity(key, projectName, parsed.data);
        return NextResponse.json({ ok: true, id }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/activities]", error);
        return NextResponse.json({ error: "Failed to store activity." }, { status: 500 });
    }
}
