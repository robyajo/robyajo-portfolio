import { NextResponse } from "next/server";
import { getProjectBySlug } from "@/lib/projects";
import { getAuth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const project = await getProjectBySlug(slug);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 },
      );
    }

    const auth = await getAuth();
    const isAdmin = auth.role === "admin";
    const hasGithub = Boolean(project.github);
    const isPrivate = !hasGithub || project.repoVisibility === "private";

    // Kode hanya boleh diinspeksi jika publik ATAU pengguna adalah admin terverifikasi
    const canInspectCode = !isPrivate || isAdmin;

    // Status dan label badge
    let status: "public" | "private" | "private_admin";
    let badgeLabel: string;

    if (isAdmin) {
      status = isPrivate ? "private_admin" : "public";
      badgeLabel = isPrivate
        ? "Admin Mode • Repo Privat"
        : "Admin Mode • Repo Publik";
    } else if (isPrivate) {
      status = "private";
      badgeLabel = "Repo Privat";
    } else {
      status = "public";
      badgeLabel = "Repo Publik";
    }

    // Saran pertanyaan kontekstual yang aman dan relevan
    let prompts: string[] = [];
    if (isAdmin) {
      prompts = [
        `Bantu jelaskan fungsi & metode utama di repo ${project.title}`,
        `Cari potongan kode atau implementasi logika di proyek ini`,
        `Berikan rekomendasi perbaikan atau optimasi untuk proyek ini`,
      ];
    } else if (!isPrivate) {
      prompts = [
        `Jelaskan fungsi & metode penggunaan publik di repo ${project.title}`,
        `Bagaimana contoh cara instalasi dan penggunaan kode proyek ini?`,
        `Tampilkan contoh kode implementasi dari repo ini`,
      ];
    } else {
      // Repositori privat bagi pengunjung publik: TIDAK menawarkan kode internal
      prompts = [
        `Apa tujuan utama dan solusi yang dihadirkan proyek ${project.title}?`,
        `Teknologi apa saja yang digunakan di proyek ${project.title}?`,
        `Bagaimana gambaran arsitektur sistem proyek ini secara umum?`,
      ];
    }

    return NextResponse.json({
      ok: true,
      slug: project.slug,
      title: project.title,
      description: project.description,
      hasGithub,
      github: canInspectCode ? project.github : null,
      repoVisibility: project.repoVisibility ?? (hasGithub ? "public" : "none"),
      isPrivate,
      isAdmin,
      canInspectCode,
      status,
      badgeLabel,
      prompts,
    });
  } catch (error) {
    console.error("[GET /api/projects/[slug]/context]", error);
    return NextResponse.json(
      { error: "Failed to load project context." },
      { status: 500 },
    );
  }
}
