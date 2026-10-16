import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import { TypographyH1, TypographyLead } from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getOAuthProviders } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { LoginForm } from "@/app/(site)/login/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getDictionary()).auth;
  return buildMeta({
    title: t.loginTitle,
    pageTitle: t.loginTitle,
    description: t.loginLead,
    path: "home / login",
    canonicalPath: "/login",
    type: "website",
  });
}

export default async function LoginPage() {
  const t = (await getDictionary()).auth;
  const providers = getOAuthProviders();
  return (
    <>
      <JsonLd
        type="webpage"
        title={t.loginTitle}
        description={t.loginLead}
        canonicalUrl={`${siteConfig.baseUrl}/login`}
      />
      <Section variant="hero" aria-label={t.loginTitle}>
        <div className="w-full max-w-md">
          <TypographyH1>{t.loginTitle}</TypographyH1>
          <TypographyLead className="mt-3">{t.loginLead}</TypographyLead>
          <div className="mt-8">
            <LoginForm providers={providers} />
          </div>
        </div>
      </Section>
    </>
  );
}
