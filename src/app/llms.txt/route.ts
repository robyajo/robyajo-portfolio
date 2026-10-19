import { siteConfig } from "@/lib/config";
import { source } from "@/lib/source";

export const revalidate = false;

export function GET() {
    const pages = source.getPages().filter((page) => page.data.lang !== "en");

    const links = pages
        .map((page) => {
            const description = page.data.description
                ? `: ${page.data.description}`
                : "";
            return `- [${page.data.title}](${siteConfig.baseUrl}${page.url}.mdx)${description}`;
        })
        .join("\n");

    const body = `# ${siteConfig.name}

> ${siteConfig.description}

## Halaman

- [Tentang](${siteConfig.baseUrl}/about): profil, cara bekerja, dan teknologi yang dipakai.
- [Sekarang](${siteConfig.baseUrl}/now): proyek dan tulisan terbaru.
- [Perkakas](${siteConfig.baseUrl}/uses): teknologi yang dipakai beserta jumlah proyeknya.
- [Kegiatan](${siteConfig.baseUrl}/activity): riwayat rilis situs.
- [Proyek](${siteConfig.baseUrl}/projects): karya yang sudah dirilis.
- [Kontak](${siteConfig.baseUrl}/contact): formulir pesan langsung.
- [Resume](${siteConfig.baseUrl}/resume): pengalaman dan keahlian.

## Blog

${links}
`;

    return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
