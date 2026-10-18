"use client";

import { useState } from "react";
import { generateWorkReport } from "@/app/(site)/projects/[slug]/report-actions";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/shared/icons";
import { useDictionary } from "@/lib/i18n/provider";

export function WorkReportButton({ slug }: { slug: string }) {
  const t = useDictionary().projectsDetail;
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    try {
      const report = await generateWorkReport(slug);
      if (!report) return;
      const blob = new Blob([report.content], {
        type: "text/markdown;charset=utf-8",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = report.filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={download}
    >
      <DownloadIcon
        data-icon="inline-start"
        className="size-3.5"
        aria-hidden="true"
      />
      {pending ? t.reportGenerating : t.reportButtonText}
    </Button>
  );
}
