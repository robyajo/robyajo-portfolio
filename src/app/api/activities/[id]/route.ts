import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { activityPatchSchema } from "@/lib/activities-schema";
import {
    deleteActivity,
    getActivityOwnerKey,
    isValidProjectKey,
    patchActivity,
} from "@/lib/activities";

async function checkOwner(
    request: Request,
    id: number,
): Promise<{ key: string } | NextResponse> {
    const key = request.headers.get("x-project")?.trim();
    if (!key) {
        return NextResponse.json({ error: "Missing X-project header." }, { status: 401 });
    }
    if (!(await isValidProjectKey(key))) {
        return NextResponse.json({ error: "Unknown project key." }, { status: 403 });
    }
    const ownerKey = await getActivityOwnerKey(id);
    if (!ownerKey) {
        return NextResponse.json({ error: "Activity not found." }, { status: 404 });
    }
    if (ownerKey !== key) {
        return NextResponse.json(
            { error: "This activity belongs to another project key." },
            { status: 403 },
        );
    }
    return { key };
}

async function revalidateForKey(key: string): Promise<void> {
    try {
        const rows = await db
            .select({ slug: projects.slug })
            .from(projects)
            .where(eq(projects.syncKey, key))
            .limit(5);
        for (const row of rows) revalidatePath(`/projects/${row.slug}`);
        revalidatePath("/projects");
    } catch {
        /* revalidasi best-effort */
    }
}

/**
 * PATCH /api/activities/[id] — ubah sebagian field kegiatan milik kunci ini.
 * Body parsial: { kind?, title?: {id?, en?}, body?: {id?, en?}, url?, occurred_at? }
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "Invalid activity id." }, { status: 400 });
    }
    const auth = await checkOwner(request, id);
    if (auth instanceof NextResponse) return auth;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = activityPatchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid payload.", issues: parsed.error.issues.map((i) => i.message) },
            { status: 422 },
        );
    }
    try {
        const changed = await patchActivity(id, parsed.data);
        if (!changed) {
            return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
        }
        await revalidateForKey(auth.key);
        return NextResponse.json({ ok: true, id });
    } catch (error) {
        console.error("[PATCH /api/activities/[id]]", error);
        return NextResponse.json({ error: "Failed to update activity." }, { status: 500 });
    }
}

/**
 * DELETE /api/activities/[id] — hapus kegiatan milik kunci ini.
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "Invalid activity id." }, { status: 400 });
    }
    const auth = await checkOwner(request, id);
    if (auth instanceof NextResponse) return auth;

    try {
        await deleteActivity(id);
        await revalidateForKey(auth.key);
        return NextResponse.json({ ok: true, id });
    } catch (error) {
        console.error("[DELETE /api/activities/[id]]", error);
        return NextResponse.json({ error: "Failed to delete activity." }, { status: 500 });
    }
}
