import { headers } from "next/headers";
import { siteConfig } from "@/lib/config";

/**
 * Mendapatkan base URL dinamis berdasarkan host yang sedang diakses pengunjung/crawler.
 * Memungkinkan canonical tag, sitemap, OpenGraph, dan JSON-LD merespons sesuai domain:
 * - https://robyajo-portfolio.vercel.app
 * - https://ajoroby.is-a.dev
 * - https://robyajo.fyi
 * - localhost (dev)
 */
export async function getDynamicBaseUrl(): Promise<string> {
  try {
    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
    const proto =
      hdrs.get("x-forwarded-proto") ||
      (process.env.NODE_ENV === "production" ? "https" : "http");

    if (host) {
      const cleanHost = host.split(":")[0]?.toLowerCase();
      if (
        cleanHost.endsWith("vercel.app") ||
        cleanHost.endsWith("is-a.dev") ||
        cleanHost.endsWith("robyajo.fyi") ||
        cleanHost === "localhost" ||
        cleanHost === "127.0.0.1"
      ) {
        return `${proto}://${host}`;
      }
    }
  } catch {
    // Dipanggil di luar request context (misal saat static prerender build)
  }
  return siteConfig.baseUrl;
}
