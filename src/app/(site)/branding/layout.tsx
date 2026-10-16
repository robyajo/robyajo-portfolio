import { buildMeta } from "@/lib/metadata";
import { siteConfig } from "@/lib/config";
import { getDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const b = (await getDictionary()).branding;
  return buildMeta({
    title: b.title,
    pageTitle: b.pageTitle,
    description: b.description,
    path: "home / branding",
    canonicalPath: "/branding",
    type: "website",
    noIndex: true,
  });
}

export default function BrandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
