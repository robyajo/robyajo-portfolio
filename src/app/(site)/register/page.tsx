import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import { TypographyH1, TypographyLead } from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { RegisterForm } from "@/app/(site)/register/register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getDictionary()).auth;
  return buildMeta({
    title: t.registerTitle,
    pageTitle: t.registerTitle,
    description: t.registerLead,
    path: "home / register",
    canonicalPath: "/register",
    type: "website",
  });
}

export default async function RegisterPage() {
  const t = (await getDictionary()).auth;
  return (
    <>
      <JsonLd
        type="webpage"
        title={t.registerTitle}
        description={t.registerLead}
        canonicalUrl={`${siteConfig.baseUrl}/register`}
      />
      <Section variant="hero" aria-label={t.registerTitle}>
        <div className="w-full max-w-md">
          <TypographyH1>{t.registerTitle}</TypographyH1>
          <TypographyLead className="mt-3">{t.registerLead}</TypographyLead>
          <div className="mt-8">
            <RegisterForm />
          </div>
        </div>
      </Section>
    </>
  );
}
