import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import { JsonLd } from "@/components/shared/json-ld";
import {
  Heading,
  TypographyH1,
  TypographyLead,
  TypographyMuted,
  TypographyMark,
  TypographyP,
  SectionHeader,
} from "@/components/ui/typography";
import { siteConfig } from "@/lib/config";
import { buildMeta } from "@/lib/metadata";
import { getDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const privacy = (await getDictionary()).privacy;
  return buildMeta({
    title: privacy.title,
    pageTitle: privacy.title,
    description: privacy.description,
    path: "home / privacy-policy",
    canonicalPath: "/privacy-policy",
    type: "website",
  });
}

const POLICY_HISTORY_URL = `${siteConfig.repoUrl}/commits/main/src/app/(site)/privacy-policy/page.tsx`;

export default async function PrivacyPolicyPage() {
  const privacy = (await getDictionary()).privacy;
  return (
    <>
      <JsonLd
        type="webpage"
        title={privacy.title}
        description={privacy.shortDescription}
        canonicalUrl={`${siteConfig.baseUrl}/privacy-policy`}
      />

      <Section variant="hero" aria-label={privacy.heroAria}>
        <HeroWithArt art={<PageArt name="privacy" />}>
          <TypographyH1>{privacy.title}</TypographyH1>
          <TypographyLead>
            {privacy.leadPrefix}{" "}
            <TypographyMark>
              {privacy.leadHighlight}
            </TypographyMark>{" "}
            {privacy.leadSuffix}
          </TypographyLead>
          <TypographyMuted className="font-mono">
            {privacy.updated}: {privacy.updatedDate}
          </TypographyMuted>
        </HeroWithArt>
      </Section>

      <Section aria-label={privacy.whatIs}>
        <SectionHeader>{privacy.whatIs}</SectionHeader>
        <div className="max-w-2xl space-y-4">
          <TypographyP>
            {privacy.whatIsP1Prefix}{" "}
            <TypographyMark>{privacy.whatIsP1Mark}</TypographyMark>
            {privacy.whatIsP1Suffix}
          </TypographyP>
          <TypographyP>
            {privacy.whatIsP2Prefix}{" "}
            <TypographyMark>{privacy.whatIsP2Mark}</TypographyMark>
            {privacy.whatIsP2Suffix}
          </TypographyP>
        </div>
      </Section>

      <Section aria-label={privacy.collected}>
        <SectionHeader>{privacy.collected}</SectionHeader>
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>{privacy.reads}</Heading>
            <TypographyP>
              {privacy.readsPrefix}{" "}
              <TypographyMark>
                {privacy.readsMark}
              </TypographyMark>
              {privacy.readsSuffix}
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>{privacy.reactions}</Heading>
            <TypographyP>
              {privacy.reactionsPrefix}{" "}
              <TypographyMark>
                {privacy.reactionsMark}
              </TypographyMark>
              {privacy.reactionsSuffix}
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>{privacy.clicks}</Heading>
            <TypographyP>
              {privacy.clicksPrefix}{" "}
              <TypographyMark>{siteConfig.domain}/&lt;slug&gt;</TypographyMark>{" "}
              {privacy.clicksDomain}{" "}
              <TypographyMark>
                {privacy.clicksMark}
              </TypographyMark>
              {privacy.clicksSuffix}
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>{privacy.guestbook}</Heading>
            <TypographyP>
              {privacy.guestbookPrefix}{" "}
              <TypographyMark>
                {privacy.guestbookMark}
              </TypographyMark>
              {privacy.guestbookMid}{" "}
              <TypographyMark>
                {privacy.guestbookMark2}
              </TypographyMark>
              {privacy.guestbookSuffix}
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>{privacy.comments}</Heading>
            <TypographyP>
              {privacy.commentsPrefix}{" "}
              <TypographyMark>
                {privacy.commentsMark}
              </TypographyMark>
              {privacy.commentsMid}{" "}
              <TypographyMark>
                {privacy.guestbookMark2}
              </TypographyMark>
              {privacy.commentsSuffix}
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4">{privacy.notCollected}</Heading>
            <TypographyP>
              {privacy.notCollectedPrefix}{" "}
              <TypographyMark>
                {privacy.notCollectedMark}
              </TypographyMark>
              {privacy.notCollectedSuffix}
            </TypographyP>
          </div>
        </div>
      </Section>

      <Section aria-label={privacy.browser}>
        <SectionHeader>{privacy.browser}</SectionHeader>
        <div className="max-w-2xl space-y-4">
          <TypographyP>
            {privacy.browserPrefix}{" "}
            <TypographyMark>{privacy.browserMark}</TypographyMark>
            {privacy.browserSuffix}
          </TypographyP>
          <TypographyP>
            {privacy.sessionCookie}
          </TypographyP>
          <TypographyP>
            {privacy.noOwnCookies}
          </TypographyP>
        </div>
      </Section>

      <Section aria-label={privacy.storedWhere}>
        <SectionHeader>{privacy.storedWhere}</SectionHeader>
        <div className="max-w-2xl space-y-4">
          <TypographyP>
            {privacy.storedReadsPrefix}{" "}
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="link-external"
            >
              Neon
            </a>
            {privacy.storedReadsSuffix}
          </TypographyP>
          <TypographyP>
            {privacy.storedEntriesPrefix}
          </TypographyP>
        </div>
      </Section>

      <Section aria-label={privacy.analytics}>
        <SectionHeader>{privacy.analytics}</SectionHeader>
        <div className="max-w-2xl">
          <TypographyP>
            {privacy.analyticsPrefix}{" "}
            <a
              href="https://umami.is"
              target="_blank"
              rel="noopener noreferrer"
              className="link-external"
            >
              Umami Analytics
            </a>
            {privacy.analyticsSuffix}
          </TypographyP>
        </div>
      </Section>

      <Section aria-label={privacy.thirdParty}>
        <SectionHeader>{privacy.thirdParty}</SectionHeader>
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>{privacy.hosting}</Heading>
            <TypographyP>
              {privacy.hostingPrefix}{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="link-external"
              >
                Vercel
              </a>
              {privacy.hostingSuffix}
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>{privacy.oauth}</Heading>
            <TypographyP>
              {privacy.oauthPrefix}{" "}
              <TypographyMark>
                {privacy.oauthMark}
              </TypographyMark>
              {privacy.oauthSuffix}
            </TypographyP>
            <TypographyP>
              {privacy.oauthCookie}
            </TypographyP>
            <TypographyP>
              {privacy.oauthAvatarPrefix}
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>{privacy.cloudinary}</Heading>
            <TypographyP>
              {privacy.cloudinaryPrefix}{" "}
              <a
                href="https://cloudinary.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-external"
              >
                Cloudinary
              </a>
              {privacy.cloudinarySuffix}
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>{privacy.fontsGithub}</Heading>
            <TypographyP>
              {privacy.fontsGithubPrefix}
            </TypographyP>
          </div>
        </div>
      </Section>

      <Section aria-label={privacy.rights}>
        <SectionHeader>{privacy.rights}</SectionHeader>
        <div className="max-w-2xl space-y-4">
          <TypographyP>
            {privacy.rightsP1}
          </TypographyP>
          <TypographyP>
            {privacy.rightsP2Prefix}{" "}
            <a href={`mailto:${siteConfig.email}`} className="link-external">
              {siteConfig.email}
            </a>
            {privacy.rightsP2Suffix}
          </TypographyP>
        </div>
      </Section>

      <Section aria-label={privacy.changes}>
        <SectionHeader>{privacy.changes}</SectionHeader>
        <div className="max-w-2xl">
          <TypographyP>
            {privacy.changesPrefix}{" "}
            <TypographyMark>
              {privacy.changesMark}
            </TypographyMark>{" "}
            {privacy.changesMid}{" "}
            <a
              href={POLICY_HISTORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-external"
            >
              {privacy.changesSuffix}
            </a>
            .
          </TypographyP>
        </div>
      </Section>
    </>
  );
}
