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
import type { Metadata } from "next";

export const metadata: Metadata = buildMeta({
  title: "Privacy Policy",
  pageTitle: "Privacy Policy",
  description: `How ${siteConfig.name}'s website handles your data: what's collected, why, and how it's stored. Short version: not much, and nothing creepy.`,
  path: "home / privacy-policy",
  canonicalPath: "/privacy-policy",
  type: "website",
});

const LAST_UPDATED = "September 29, 2026";

const POLICY_HISTORY_URL = `${siteConfig.repoUrl}/commits/main/src/app/(site)/privacy-policy/page.tsx`;

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd
        type="webpage"
        title="Privacy Policy"
        description={`Privacy policy for ${siteConfig.domain}: what is collected, where it is stored, and why.`}
        canonicalUrl={`${siteConfig.baseUrl}/privacy-policy`}
      />

      <Section variant="hero" aria-label="Privacy Policy">
        <HeroWithArt art={<PageArt name="privacy" />}>
          <TypographyH1>Privacy Policy</TypographyH1>
          <TypographyLead>
            The short version:{" "}
            <TypographyMark>
              I collect very little, store it carefully, and never sell it.
            </TypographyMark>{" "}
            The long version follows.
          </TypographyLead>
          <TypographyMuted className="font-mono">
            Last updated: {LAST_UPDATED}
          </TypographyMuted>
        </HeroWithArt>
      </Section>

      <Section aria-label="What this site is">
        <SectionHeader>What this site is</SectionHeader>
        <div className="max-w-2xl space-y-4">
          <TypographyP>
            This is a personal portfolio and blog at{" "}
            <TypographyMark>{siteConfig.domain}</TypographyMark>. The site has
            a <TypographyMark>guestbook</TypographyMark> and a{" "}
            <TypographyMark>blog comments section</TypographyMark>, both of
            which require signing in with <TypographyMark>GitHub or Google</TypographyMark>{" "}
            to leave a message, post a comment, or
            like an entry. Everything else, including blog posts, reactions,
            projects, and the resume, is fully public and requires no account.
          </TypographyP>
          <TypographyP>
            There&apos;s no newsletter. If you want new posts, the{" "}
            <TypographyMark>RSS feed at /feed.xml</TypographyMark> is a plain
            file your reader fetches, and nothing about who subscribes is
            recorded.
          </TypographyP>
        </div>
      </Section>

      <Section aria-label="What data is collected">
        <SectionHeader>What data is collected</SectionHeader>
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>Blog read counts</Heading>
            <TypographyP>
              When you visit a blog post, a{" "}
              <TypographyMark>hashed</TypographyMark> version of your IP address
              is stored alongside the post to count unique reads. The hash is{" "}
              <TypographyMark>
                one-way (SHA-256 with a server-side salt)
              </TypographyMark>
              . Your actual IP is <TypographyMark>never stored</TypographyMark>{" "}
              and cannot be reverse-engineered from it. There is one row per
              post per hash, so reloading a post doesn&apos;t count twice.
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>Reactions and mood votes</Heading>
            <TypographyP>
              If you click one of the reaction buttons on a blog post, your
              choice (one of: <em>Not for me, Meh, Liked it, Loved it</em>) is
              stored with the same hashed IP and post pair. Reactions are{" "}
              <TypographyMark>fully voluntary</TypographyMark>. If you
              don&apos;t click anything,{" "}
              <TypographyMark>nothing is stored</TypographyMark>.
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>Short link clicks</Heading>
            <TypographyP>
              Following a short link (any{" "}
              <TypographyMark>{siteConfig.domain}/&lt;slug&gt;</TypographyMark>{" "}
              that redirects somewhere else, or the same slug on the separate
              short-link domain that points at this site) adds one to a counter
              on that link. No IP address, hash, account, or per-click
              timestamp is recorded, so the number says how many times a link
              was followed and{" "}
              <TypographyMark>nothing about who followed it</TypographyMark>.
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>Guestbook entries &amp; likes</Heading>
            <TypographyP>
              If you sign in and leave a guestbook message, the following is
              stored in the database:{" "}
              <TypographyMark>
                your account ID, your message text, and a timestamp
              </TypographyMark>
              . If you like an entry, your account ID and the entry ID are
              stored. Entries removed during moderation are{" "}
              <TypographyMark>soft-deleted</TypographyMark>: hidden from the
              page but kept in the database until you ask for them to be
              erased.               Your{" "}
              <TypographyMark>
                name and profile picture
              </TypographyMark>{" "}
              are saved together with your entry at the time you post, so the
              guestbook keeps showing who wrote what even if you disconnect
              your account later. Both actions are{" "}
              <TypographyMark>fully voluntary</TypographyMark>. If you
              don&apos;t sign in, nothing is stored.
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>Blog post comments &amp; comment likes</Heading>
            <TypographyP>
              If you sign in and post a comment on a blog post, the following is
              stored in the database:{" "}
              <TypographyMark>
                your account ID, your comment text, the post it belongs to,
                an optional parent comment ID (for replies), and a timestamp
              </TypographyMark>
              . If you like a comment, your account ID and the comment ID are
              stored. Deleted comments are{" "}
              <TypographyMark>soft-deleted</TypographyMark>: the text is hidden
              but the record is kept so the reply thread stays intact. Full
              deletion is honoured on request (see Your rights below). Your{" "}
              <TypographyMark>name and profile picture</TypographyMark>{" "}
              are saved together with your comment, not fetched from elsewhere
              when rendering. Both actions are{" "}
              <TypographyMark>fully voluntary</TypographyMark>. If you
              don&apos;t sign in, nothing is stored.
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4">What is not collected</Heading>
            <TypographyP>
              There is no browser fingerprinting, no tracking pixels, and{" "}
              <TypographyMark>no third-party ad networks</TypographyMark>. No
              email addresses or passwords are stored in this site&apos;s own
              database, because sign-in happens directly with the{" "}
              <TypographyMark>OAuth provider you choose</TypographyMark> (GitHub
              or Google) — this site never sees your password (see Third-party
              services below). If you never sign in to the guestbook or comments, no
              personally identifiable information about you is stored anywhere
              by this site.
            </TypographyP>
          </div>
        </div>
      </Section>

      <Section aria-label="Stored in your browser">
        <SectionHeader>Stored in your browser</SectionHeader>
        <div className="max-w-2xl space-y-4">
          <TypographyP>
            A few preferences live in your browser&apos;s{" "}
            <TypographyMark>localStorage</TypographyMark> and are never sent to
            this site&apos;s server: your{" "}
            <TypographyMark>theme choice</TypographyMark> (light, dark, or
            system), the spot you last dragged the{" "}
            <TypographyMark>floating quick-menu button</TypographyMark> to, and,
            once you&apos;ve played a video in a post, the player&apos;s{" "}
            <TypographyMark>volume, mute, and subtitle settings</TypographyMark>
            . A <TypographyMark>session cookie</TypographyMark> is set only
            after you sign in, to remember that you&apos;re signed in.
            Clearing this site&apos;s data in your browser removes all
            of it.
          </TypographyP>
          <TypographyP>
            This site sets <TypographyMark>no cookies of its own</TypographyMark>{" "}
            beyond that session cookie, and no tracking or advertising cookies
            at all.
          </TypographyP>
        </div>
      </Section>

      <Section aria-label="Where data is stored">
        <SectionHeader>Where data is stored</SectionHeader>
        <div className="max-w-2xl space-y-4">
          <TypographyP>
            Read counts, reactions, and short-link counters are stored in a
            PostgreSQL database hosted on{" "}
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="link-external"
            >
              Neon
            </a>
            . These records contain no personal information, only post
            references, IP hashes, moods, counts, and timestamps.
          </TypographyP>
          <TypographyP>
            Guestbook entries, likes, blog comments, and comment likes are all
            stored in the same Neon PostgreSQL database. These records contain
            your <TypographyMark>account ID</TypographyMark>, message or
            comment text, the post they belong to, and timestamps. Your account
            ID is an opaque identifier assigned by the sign-in provider, not
            your email, name, or any other human-readable detail. The display
            name and avatar shown next to your words are saved with your entry
            at posting time, not in a separate profile store.
          </TypographyP>
        </div>
      </Section>

      <Section aria-label="Analytics">
        <SectionHeader>Analytics</SectionHeader>
        <div className="max-w-2xl">
          <TypographyP>
            This site uses{" "}
            <a
              href="https://umami.is"
              target="_blank"
              rel="noopener noreferrer"
              className="link-external"
            >
              Umami Analytics
            </a>
            , a <TypographyMark>privacy-focused, open-source</TypographyMark>{" "}
            analytics tool hosted on{" "}
            <a
              href="https://umami.is/docs/cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="link-external"
            >
              Umami Cloud
            </a>
            . Umami does <TypographyMark>not use cookies</TypographyMark>, does
            not collect personal data, and complies with{" "}
            <TypographyMark>GDPR, CCPA, and PECR</TypographyMark>. Only
            anonymized, aggregated page view data is recorded, with no IP
            addresses, no fingerprinting, and no cross-site tracking. The
            script and the events it sends are{" "}
            <TypographyMark>proxied through this domain</TypographyMark>, so
            your browser never connects to Umami directly.
          </TypographyP>
        </div>
      </Section>

      <Section aria-label="Third-party services">
        <SectionHeader>Third-party services</SectionHeader>
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>Hosting</Heading>
            <TypographyP>
              The site runs on{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="link-external"
              >
                Vercel
              </a>
              . Like any host, Vercel handles each request, including your{" "}
              <TypographyMark>IP address and user agent</TypographyMark>, in
              order to serve the page, and keeps short-lived request logs for
              operating the platform. This site doesn&apos;t read those logs
              for anything beyond debugging.
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>Sign-in (OAuth)</Heading>
            <TypographyP>
              Sign-in for the guestbook and blog comments goes{" "}
              <TypographyMark>directly to GitHub or Google</TypographyMark> —
              there is no middle layer. When you sign in, the provider shares
              your <TypographyMark>name, email address, and profile picture</TypographyMark>{" "}
              with this site so it can show who wrote what. Your password never
              touches this site. Each provider&apos;s handling of your data is
              covered by its own privacy policy.
            </TypographyP>
            <TypographyP>
              This site keeps you signed in with an{" "}
              <TypographyMark>encrypted session cookie</TypographyMark>. It
              exists for authentication only, not for advertising or analytics.
            </TypographyP>
            <TypographyP>
              Profile pictures next to comments and guestbook entries were
              provided by you at posting time and load{" "}
              <TypographyMark>directly from the provider&apos;s image CDN</TypographyMark>{" "}
              (such as GitHub or Google avatars). That includes the guestbook
              preview on the home page, so viewing the home page, the
              guestbook, or a post with comments lets that image host see your
              IP address and user agent, the way any image host does. To stop
              sharing new data, disconnect this site in your GitHub or Google
              account settings.
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>Cloudinary</Heading>
            <TypographyP>
              Video in blog posts streams directly from{" "}
              <a
                href="https://cloudinary.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-external"
              >
                Cloudinary
              </a>
              . Playing one connects your browser to Cloudinary, which sees
              your <TypographyMark>IP address and user agent</TypographyMark>{" "}
              the way any site you visit does. Images inside posts are handled
              differently: they are optimised and served from this domain, so
              reading a post involves no Cloudinary request until you press
              play.
            </TypographyP>
          </div>
          <div className="space-y-2">
            <Heading as="h3" level="h4" divider>Fonts &amp; GitHub</Heading>
            <TypographyP>
              Fonts are <TypographyMark>self-hosted</TypographyMark>. They are
              downloaded at build time and served from this domain, so your
              browser never contacts Google to render this page. The resume is
              fetched from GitHub Releases by the server and passed through{" "}
              <TypographyMark>/api/resume</TypographyMark>, and the repository
              card in the quick menu is read from GitHub&apos;s API on the
              server and cached, so GitHub never sees your request for either.
            </TypographyP>
          </div>
        </div>
      </Section>

      <Section aria-label="Your rights">
        <SectionHeader>Your rights</SectionHeader>
        <div className="max-w-2xl space-y-4">
          <TypographyP>
            If you have never signed in to the guestbook or comments, the only
            data stored is an{" "}
            <TypographyMark>irreversible IP hash</TypographyMark>, and there is
            no practical way to identify or retrieve those records.
          </TypographyP>
          <TypographyP>
            If you have signed in and left a guestbook message, posted a
            comment, or liked either, you can ask for that data to be erased
            by emailing{" "}
            <a href={`mailto:${siteConfig.email}`} className="link-external">
              {siteConfig.email}
            </a>
            . To remove your words from this site, email{" "}
            <a href={`mailto:${siteConfig.email}`} className="link-external">
              {siteConfig.email}
            </a>
            . You can also disconnect this site from your GitHub or Google
            account settings at any time to stop sharing new data; entries you
            already posted stay until you ask for them to be erased.
            Depending on your jurisdiction, you
            may have rights to access, correct, or erase your personal data
            under laws such as <TypographyMark>GDPR (EU)</TypographyMark>,{" "}
            <TypographyMark>CCPA (California)</TypographyMark>, or{" "}
            <TypographyMark>India&apos;s DPDP Act</TypographyMark>.
          </TypographyP>
        </div>
      </Section>

      <Section aria-label="Changes to this policy">
        <SectionHeader>Changes to this policy</SectionHeader>
        <div className="max-w-2xl">
          <TypographyP>
            When something meaningful changes, like a new third-party service
            or a new kind of data, this page is updated and the{" "}
            <TypographyMark>&ldquo;Last updated&rdquo;</TypographyMark> date
            moves with it. Every past version is public in the{" "}
            <a
              href={POLICY_HISTORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-external"
            >
              repository history
            </a>
            .
          </TypographyP>
        </div>
      </Section>
    </>
  );
}
