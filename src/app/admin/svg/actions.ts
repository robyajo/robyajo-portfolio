"use server";

import { assertAdmin } from "@/lib/assert-admin";
import fs from "node:fs/promises";
import path from "node:path";
import { FREE_ISOMETRIC_ILLUSTRATIONS } from "@/components/illos/isometric";
import { templates } from "@/lib/svg/registry";

export interface IsometricItemDto {
  id: string;
  name: string;
  titleId: string;
  category: "infrastructure" | "security" | "devops" | "data" | "application";
  sentence: string;
  descriptionId: string;
  svgUrl: string;
  componentName: string;
  fileSizeBytes: number;
}

export interface DynamicCardDto {
  type: string;
  title: string;
  description: string;
  defaultQuery: Record<string, string>;
  previewUrl: string;
}

export interface SvgDashboardData {
  isometric: IsometricItemDto[];
  dynamicCards: DynamicCardDto[];
  totalIsometric: number;
  totalDynamic: number;
}

export async function getSvgDashboardData(): Promise<SvgDashboardData> {
  await assertAdmin();

  // 1. Data Ilustrasi Isometrik
  const isometricList: IsometricItemDto[] = [];
  const illustrationsDir = path.join(process.cwd(), "public/illustrations/isometric");

  for (const item of FREE_ISOMETRIC_ILLUSTRATIONS) {
    let size = 0;
    try {
      const stat = await fs.stat(path.join(illustrationsDir, `${item.id}.svg`));
      size = stat.size;
    } catch {
      // Fallback
    }

    isometricList.push({
      id: item.id,
      name: item.name,
      titleId: item.titleId,
      category: item.category,
      sentence: item.sentence,
      descriptionId: item.descriptionId,
      svgUrl: item.svgUrl,
      componentName: item.Component.name || `Illos${item.name.replace(/[^a-zA-Z0-9]/g, "")}`,
      fileSizeBytes: size,
    });
  }

  // 2. Data Kartu Dinamis dari Registry SVG
  const dynamicMeta: Record<string, { title: string; desc: string; defaultQuery: Record<string, string> }> = {
    banner: {
      title: "Hero Banner",
      desc: "Banner header utama dengan animasi nama, role, dan dot status ketersediaan kerja.",
      defaultQuery: { type: "banner" },
    },
    heading: {
      title: "Seksi Heading",
      desc: "Kartu judul seksi profil teknis dengan aksen garis dan penomoran monospasi.",
      defaultQuery: { type: "heading", title: "Engineering Philosophy" },
    },
    calendar: {
      title: "Kalender Kontribusi GitHub",
      desc: "Visualisasi matriks kontribusi git komit dan aktivitas mingguan.",
      defaultQuery: { type: "calendar" },
    },
    activity: {
      title: "Linimasa Aktivitas Terkini",
      desc: "Kartu status log kegiatan rilis fitur dan perbaikan bug terbaru.",
      defaultQuery: { type: "activity" },
    },
    posts: {
      title: "Daftar Artikel Blog Terbaru",
      desc: "Ringkasan 3 tulisan teknis terbaru beserta estimasi waktu baca.",
      defaultQuery: { type: "posts" },
    },
    post: {
      title: "Kartu Sorotan Artikel Tunggal",
      desc: "Sorotan kartu artikel spesifik dengan tag dan tanggal publikasi.",
      defaultQuery: { type: "post", slug: "bioinformatics-developer-tooling-genomic-pipelines" },
    },
    guestbook: {
      title: "Tanda Tangan Buku Tamu",
      desc: "Kartu tanda tangan digital dari pengunjung portofolio.",
      defaultQuery: { type: "guestbook" },
    },
    resume: {
      title: "Ringkasan Resume Karir",
      desc: "Kartu ringkasan pengalaman 12+ tahun, pendidikan, dan fokus rekayasa perangkat lunak.",
      defaultQuery: { type: "resume" },
    },
    local: {
      title: "Waktu Lokal & Domisili",
      desc: "Kartu jam analog dan zona waktu Pekanbaru (WIB / UTC+7).",
      defaultQuery: { type: "local" },
    },
  };

  const dynamicCards: DynamicCardDto[] = Object.keys(templates).map((key) => {
    const meta = dynamicMeta[key] || {
      title: key.charAt(0).toUpperCase() + key.slice(1),
      desc: `Template kartu SVG dinamis untuk tipe ${key}.`,
      defaultQuery: { type: key },
    };

    const qs = new URLSearchParams(meta.defaultQuery).toString();

    return {
      type: key,
      title: meta.title,
      description: meta.desc,
      defaultQuery: meta.defaultQuery,
      previewUrl: `/svg?${qs}`,
    };
  });

  return {
    isometric: isometricList,
    dynamicCards,
    totalIsometric: isometricList.length,
    totalDynamic: dynamicCards.length,
  };
}

export async function getRawSvgAction(id: string): Promise<string> {
  await assertAdmin();

  const filePath = path.join(process.cwd(), "public/illustrations/isometric", `${id}.svg`);
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (err) {
    throw new Error(`Gagal membaca berkas SVG ${id}: ${(err as Error).message}`);
  }
}
