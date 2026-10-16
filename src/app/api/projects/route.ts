import { NextResponse } from "next/server";
import { getSyncProjects } from "@/lib/activities";
import { isValidProjectKey } from "@/lib/activities";

/**
 * GET /api/projects — daftar proyek terdaftar beserta statistik
 * kegiatan publik. Tanpa auth; kunci API tidak pernah diekspos.
 * Dengan ?key=<kunci> (milik sendiri): hanya proyek berkunci itu,
 * agar AI mempelajari proyek yang ada. Kunci salah -> 403.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key")?.trim() || undefined;
        if (key && !(await isValidProjectKey(key))) {
            return NextResponse.json({ error: "Unknown project key." }, { status: 403 });
        }
        const projects = await getSyncProjects(key);
        return NextResponse.json({ ok: true, total: projects.length, projects });
    } catch (error) {
        console.error("[GET /api/projects]", error);
        return NextResponse.json({ error: "Failed to load projects." }, { status: 500 });
    }
}
