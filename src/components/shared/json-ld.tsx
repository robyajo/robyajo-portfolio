import { siteConfig } from "@/lib/config";
import { escapeInlineScript } from "@/lib/inline-script";
import type {
  Person,
  WebSite,
  WebPage,
  BlogPosting,
  BreadcrumbList,
  ItemList,
  WithContext,
} from "schema-dts";

type SchemaProps =
  | { type: "person"; baseUrl?: string }
  | { type: "website"; baseUrl?: string }
  | {
      type: "webpage";
      title: string;
      description: string;
      canonicalUrl: string;
      baseUrl?: string;
    }
  | {
      type: "article";
      title: string;
      description: string;
      canonicalUrl: string;
      publishedAt?: string;
      updatedAt?: string;
      tags?: string[];
      inLanguage?: string;
      baseUrl?: string;
    }
  | { type: "breadcrumb"; items: { name: string; url: string }[]; baseUrl?: string }
  | {
      type: "itemList";
      name: string;
      description: string;
      items: { name: string; url?: string; date?: string }[];
      baseUrl?: string;
    };

type ArticleProps = Extract<SchemaProps, { type: "article" }>;
type AnySchema = WithContext<
  Person | WebSite | WebPage | BlogPosting | BreadcrumbList | ItemList
>;

const SCHEMA_CONTEXT = "https://schema.org" as const;

function buildPerson(baseUrl = siteConfig.baseUrl): WithContext<Person> {
  const profileImageUrl = `${baseUrl}/profile.avif`;
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Person",
    name: siteConfig.name,
    givenName: "Roby",
    familyName: "Karti",
    additionalName: "S.",
    alternateName: [
      ...siteConfig.aliases,
    ],
    url: baseUrl,
    image: profileImageUrl,
    jobTitle: siteConfig.role,
    description: siteConfig.description,
    knowsAbout: [
      "Web Development",
      "Fullstack Development",
      "Software Engineering",
      "TypeScript",
      "React",
      "Next.js",
      "Laravel",
      "Go",
      "PostgreSQL",
      "Tailwind CSS",
    ],
    sameAs: [...siteConfig.sameAs],
  };
}

function buildWebSite(baseUrl = siteConfig.baseUrl): WithContext<WebSite> {
  const schemaAuthor = {
    "@type": "Person" as const,
    name: siteConfig.name,
    url: baseUrl,
  };
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: siteConfig.name,
    url: baseUrl,
    description: siteConfig.description,
    author: schemaAuthor,
    sameAs: [
      "https://ajoroby.is-a.dev",
      "https://robyajo-portfolio.vercel.app",
      "https://robyajo.fyi",
    ],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/blogs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    } as never,
  };
}

function buildWebPage(
  title: string,
  description: string,
  canonicalUrl: string,
  baseUrl = siteConfig.baseUrl,
): WithContext<WebPage> {
  const schemaAuthor = {
    "@type": "Person" as const,
    name: siteConfig.name,
    url: baseUrl,
  };
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebPage",
    name: title,
    description,
    url: canonicalUrl,
    isPartOf: { "@type": "WebSite", url: baseUrl },
    author: schemaAuthor,
    mainEntity: buildPerson(baseUrl),
  };
}

function buildBlogPosting({
  title,
  description,
  canonicalUrl,
  publishedAt,
  updatedAt,
  tags,
  inLanguage,
  baseUrl = siteConfig.baseUrl,
}: ArticleProps): WithContext<BlogPosting> {
  const profileImageUrl = `${baseUrl}/profile.avif`;
  const schemaAuthor = {
    "@type": "Person" as const,
    name: siteConfig.name,
    url: baseUrl,
  };
  const schemaPublisher = {
    "@type": "Organization" as const,
    name: siteConfig.name,
    url: baseUrl,
    logo: {
      "@type": "ImageObject" as const,
      url: profileImageUrl,
      width: "460",
      height: "460",
    },
  };
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BlogPosting",
    headline: title,
    description,
    url: canonicalUrl,
    image: profileImageUrl,
    ...(inLanguage && { inLanguage }),
    ...(publishedAt && { datePublished: publishedAt }),
    ...(updatedAt && { dateModified: updatedAt }),
    ...(tags && { keywords: tags.join(", ") }),
    author: { ...schemaAuthor, image: profileImageUrl },
    publisher: schemaPublisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  };
}

function buildBreadcrumb(
  items: { name: string; url: string }[],
): WithContext<BreadcrumbList> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildItemList(
  name: string,
  description: string,
  items: { name: string; url?: string; date?: string }[],
): WithContext<ItemList> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "ItemList",
    name,
    description,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url && { url: item.url }),
      ...(item.date && { dateCreated: item.date }),
    })),
  };
}

function buildSchema(props: SchemaProps): AnySchema {
  const baseUrl = props.baseUrl || siteConfig.baseUrl;
  switch (props.type) {
    case "person":
      return buildPerson(baseUrl);
    case "website":
      return buildWebSite(baseUrl);
    case "webpage":
      return buildWebPage(
        props.title,
        props.description,
        props.canonicalUrl,
        baseUrl,
      );
    case "article":
      return buildBlogPosting(props);
    case "breadcrumb":
      return buildBreadcrumb(props.items);
    case "itemList":
      return buildItemList(props.name, props.description, props.items);
  }
}

export function JsonLd(props: SchemaProps) {
  const schema = buildSchema(props);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: escapeInlineScript(JSON.stringify(schema)),
      }}
    />
  );
}
