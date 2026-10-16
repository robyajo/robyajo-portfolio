import { getGuestbookPreview } from "@/app/(site)/guestbook/actions";
import { GuestbookRotator } from "@/app/(site)/_components/guestbook-rotator";
import { Section } from "@/components/layouts/page";
import {
  TypographyH2,
  TypographyLead,
  TypographyMark,
} from "@/components/ui/typography";
import { Reveal } from "@/components/shared/reveal";
import { ArtStage } from "@/components/layouts/hero-art";
import { PageArt } from "@/components/diagrams/page-art";
import { Button } from "@/components/ui/button";
import { CaretRightIcon } from "@/components/shared/icons";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { getDictionary } from "@/lib/i18n/server";

export async function GuestbookTeaser() {
  await connection();
  const dict = await getDictionary();
  const content = dict.home.guestbookTeaser;

  let entries: Awaited<ReturnType<typeof getGuestbookPreview>>;
  try {
    entries = await getGuestbookPreview(15);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to load guestbook preview:", error);
    entries = [];
  }

  return (
    <Section aria-label={content.section}>
      <TypographyH2 className="sr-only">{content.section}</TypographyH2>
      <Reveal className="group/iso">
        <div className="mb-8 grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <TypographyLead className="max-w-2xl">
              {content.leadPrefix}{" "}
              <TypographyMark>{content.leadHighlight}</TypographyMark>
              {content.leadSuffix}
            </TypographyLead>
            <Button asChild variant="outline">
              <Link href="/guestbook">
                {content.signButton}
                <CaretRightIcon
                  data-icon="inline-end"
                  className="size-3.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
          <ArtStage className="order-first -mx-gutter h-44 md:order-none md:mx-0 md:h-auto md:aspect-video">
            <PageArt name="traces" />
          </ArtStage>
        </div>

        <GuestbookRotator entries={entries} />
      </Reveal>
    </Section>
  );
}
