import { Contact } from "@/app/(site)/_components/contact";
import { Hero } from "@/app/(site)/_components/hero";
import { BuiltThings } from "@/app/(site)/_components/projects";
import { RulesIFollow } from "@/app/(site)/_components/rules";
import { BlogTeaser } from "@/app/(site)/_components/blog-teaser";
import { GuestbookTeaser } from "@/app/(site)/_components/guestbook-teaser";
import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/layouts/page";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { Suspense } from "react";

const homeTitle = `${siteConfig.name} – ${siteConfig.role}`;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    ...buildMeta({
      title: siteConfig.name,
      pageTitle: homeTitle,
      description: dict.footer.description,
      path: "home",
      canonicalPath: "/",
      type: "profile",
    }),
    title: { absolute: homeTitle },
  };
}

export default async function Page() {
  const dict = await getDictionary();
  return (
    <>
      <JsonLd
        type="webpage"
        title={siteConfig.name}
        description={dict.footer.description}
        canonicalUrl={`${siteConfig.baseUrl}`}
      />
      <Hero />
      <BuiltThings />
      <RulesIFollow />
      <BlogTeaser />
      <Suspense
        fallback={
          <Section aria-hidden="true" className="animate-pulse">
            <div className="h-5 w-80 max-w-full rounded bg-muted" />
            <div className="h-20 rounded-md bg-muted/50" />
            <div className="h-9 w-40 rounded-md bg-muted" />
          </Section>
        }
      >
        <GuestbookTeaser />
      </Suspense>
      <Contact />
    </>
  );
}
