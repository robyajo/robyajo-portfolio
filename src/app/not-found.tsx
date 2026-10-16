import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader } from "@/components/ui/empty";
import { HouseIcon } from "@/components/shared/icons";
import { PageArt } from "@/components/diagrams/page-art";
import { ArtStage } from "@/components/layouts/hero-art";
import {
  Text,
  TypographyMuted,
  TypographyMark,
} from "@/components/ui/typography";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const content = (await getDictionary()).notFound;
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <Empty className="relative z-10 flex-none gap-4">
        <ArtStage active className="aspect-[4/3] w-full max-w-md">
          <PageArt name="notFound" />
        </ArtStage>

        <EmptyHeader>
          <div className="space-y-2 text-center">
            <Text
              as="h1"
              variant="none"
              className="text-lg font-semibold tracking-tight"
            >
              {content.title}
            </Text>
            <TypographyMuted>
              {content.bodyPrefix}{" "}
              <TypographyMark>{content.bodyHighlight}</TypographyMark>
              {content.bodySuffix}
            </TypographyMuted>
          </div>
        </EmptyHeader>

        <EmptyContent>
          <Button asChild size="lg">
            <Link href="/" className="flex items-center gap-2">
              <HouseIcon aria-hidden="true" data-icon="inline-start" />
              {content.goHome}
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
