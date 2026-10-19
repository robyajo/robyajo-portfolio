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

## Blog

${links}
`;

    return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
