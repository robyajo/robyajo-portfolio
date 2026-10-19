import { OG_SIZE, OGImage } from "@/components/shared/OG";
import { siteConfig } from "@/lib/config";
import { loadFonts } from "@/lib/svg/fonts";
import { ImageResponse } from "takumi-js/response";
import type { NextRequest } from "next/server";

const CACHE_CONTROL =
  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800, immutable";

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max - 1).trimEnd() + "…" : str;

function getParam(
  params: URLSearchParams,
  key: string,
  fallback: string,
  max: number,
) {
  return truncate(params.get(key) ?? fallback, max);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const title = getParam(searchParams, "title", siteConfig.name, 100);
  const description = getParam(
    searchParams,
    "description",
    siteConfig.description,
    180,
  );
  const name = getParam(searchParams, "name", siteConfig.name, 40);
  const domain = getParam(searchParams, "domain", siteConfig.domain, 50);
  const path = getParam(searchParams, "path", "home", 60);
  const role = getParam(searchParams, "role", siteConfig.role, 50);
  const availableForHire = siteConfig.availableForHire && searchParams.get("available") !== "false";
  const tags = (searchParams.get("tags")?.split(",") ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((tag) => truncate(tag, 20));

  return new ImageResponse(
    <OGImage
      title={title}
      description={description}
      name={name}
      domain={domain}
      path={path}
      role={role}
      tags={tags}
      availableForHire={availableForHire}
    />,
    {
      ...OG_SIZE,
      format: "png",
      fonts: await loadFonts(),
      headers: { "Cache-Control": CACHE_CONTROL },
    },
  );
}
