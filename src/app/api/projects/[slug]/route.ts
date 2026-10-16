import { NextResponse } from "next/server";
import { getRecentActivities, getSyncProjects, isValidProjectKey } from "@/lib/activities";
import { getProjectBySlug } from "@/lib/projects";
import { slugifyTitle } from "@/lib/sync-keys";

/**
 * GET /api/projects/[slug] — detail satu proyek + kegiatannya.
 * `slug` cocok dengan slug halaman showcase (/projects/<slug>) atau
 * nama proyek sync yang di-slugify. Untuk proyek sync, sertakan
 * `?key=<kunci>` miliknya agar kegiatan ikut tampil.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key")?.trim() || undefined;

        const showcase = await getProjectBySlug(slug);
        if (showcase?.syncKey) {
            const items = await getRecentActivities(20, showcase.syncKey);
            return NextResponse.json({
                ok: true,
                project: {
                    name: showcase.title,
                    slug: showcase.slug,
                    description: showcase.description,
                    url: showcase.live,
                },
                total: items.length,
                items,
            });
        }

        const projects = await getSyncProjects();
        const match = projects.find((p) => slugifyTitle(p.name) === slug);
        if (!match) {
            return NextResponse.json({ error: "Project not found." }, { status: 404 });
        }
        if (!key || !(await isValidProjectKey(key))) {
            return NextResponse.json({
                ok: true,
                project: match,
                total: match.activityCount,
                items: [],
                note: "Tambahkan ?key=<kunci> milik proyek ini untuk melihat kegiatannya.",
            });
        }
        const items = await getRecentActivities(20, key, match.name);
        return NextResponse.json({
            ok: true,
            project: match,
            total: items.length,
            items,
        });
    } catch (error) {
        console.error("[GET /api/projects/[slug]]", error);
        return NextResponse.json({ error: "Failed to load project." }, { status: 500 });
    }
}
