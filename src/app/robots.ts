import { siteConfig } from "@/lib/config";
import { getDynamicBaseUrl } from "@/lib/domain";
import type { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
    const baseUrl = await getDynamicBaseUrl();
    return {
        rules: { userAgent: "*", allow: "/", disallow: ["/branding", "/admin", "/login", "/register", "/api"] },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
