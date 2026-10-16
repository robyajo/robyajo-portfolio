import { PageArt } from "@/components/diagrams/page-art";
import { HeroWithArt } from "@/components/layouts/hero-art";
import { Section } from "@/components/layouts/page";
import {
  TypographyH1,
  TypographyLead,
  TypographyMark,
  TypographyMuted,
} from "@/components/ui/typography";
import {
  PdfViewer,
  PdfViewerControls,
  PdfViewerDownload,
  PdfViewerFilename,
  PdfViewerFooter,
  PdfViewerOpen,
  PdfViewerPagination,
  PdfViewerReload,
  PdfViewerToolbar,
  PdfViewerZoom,
} from "@/components/ui/pdf-viewer";
import { getResumeFilename } from "@/lib/resume";
import { LoaderCaption, LogoLoader } from "@/components/shared/loader";
import { Reveal } from "@/components/shared/reveal";
import { buildMeta } from "@/lib/metadata";
import { siteConfig } from "@/lib/config";
import { getDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const page = (await getDictionary()).resumePage;
  return buildMeta({
    title: page.title,
    pageTitle: page.pageTitle,
    description: page.description,
    path: "home / resume",
    canonicalPath: "/resume",
    type: "profile",
  });
}

export default async function ResumePage() {
  const filename = getResumeFilename();
  const page = (await getDictionary()).resumePage;

  return (
    <>
      <JsonLd
        type="webpage"
        title={page.title}
        description={page.shortDescription}
        canonicalUrl={`${siteConfig.baseUrl}/resume`}
      />

      <Section variant="hero" aria-label={page.headerAria}>
        <HeroWithArt art={<PageArt name="resume" />}>
          <TypographyH1>{page.title}</TypographyH1>
          <TypographyLead>
            {page.leadPrefix}{" "}
            <TypographyMark>{page.leadHighlight}</TypographyMark>
            {page.leadSuffix}
          </TypographyLead>
        </HeroWithArt>
      </Section>

      <Section variant="article" aria-label={page.docAria}>
        <Reveal>
        <PdfViewer
          file="/api/resume"
          downloadHref="/api/resume/download"
          aria-label={`${page.pdfAria}: ${filename}`}
          loader={
            <div
              className="flex h-full flex-col items-center justify-center gap-4"
              role="status"
              aria-label={page.loadingAria}
            >
              <LogoLoader aria-hidden="true" />
              <LoaderCaption phrases={page.quips} />
            </div>
          }
        >
          <PdfViewerToolbar aria-label={page.toolbarAria}>
            <PdfViewerFilename
              name={filename}
              aria-label={`${page.fileAria}: ${filename}`}
            />
            <PdfViewerControls>
              <PdfViewerPagination aria-label={page.paginationAria} />
              <PdfViewerZoom aria-label={page.zoomAria} />
              <PdfViewerReload aria-label={page.reloadAria} />
              <PdfViewerOpen aria-label={page.openAria} />
              <PdfViewerDownload
                label={page.download}
                aria-label={page.downloadAria}
              />
            </PdfViewerControls>
          </PdfViewerToolbar>

          <PdfViewerFooter>
            <TypographyMuted className="font-mono text-2xs tracking-wide">
              {page.footerNote}
            </TypographyMuted>
          </PdfViewerFooter>
        </PdfViewer>
        </Reveal>
      </Section>
    </>
  );
}
