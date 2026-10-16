import { NextResponse } from "next/server";
import { getSyncProjects } from "@/lib/activities";

/**
 * GET /api/projects — daftar proyek terdaftar beserta statistik
 * kegiatan publik. Tanpa auth; kunci API tidak pernah diekspos.
 */
export async function GET() {
    try {
        const projects = await getSyncProjects();
        return NextResponse.json({ ok: true, total: projects.length, projects });
    } catch (error) {
        console.error("[GET /api/projects]", error);
        return NextResponse.json({ error: "Failed to load projects." }, { status: 500 });
    }
}
