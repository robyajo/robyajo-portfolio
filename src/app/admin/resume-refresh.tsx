"use client";

import { refreshResume } from "@/app/admin/actions";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowClockwiseIcon,
  FileTextIcon,
} from "@/components/shared/icons";
import {
  TypographySmall,
  TypographyMuted,
} from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";

export function ResumeRefresh() {
  const t = useDictionary().admin;
  const { mutate: refresh, isPending: pending } = useActionMutation({
    action: refreshResume,
    successMessage: () => t.resumeRefreshed,
  });

  function handleRefresh() {
    if (!pending) refresh(undefined);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="text-muted-foreground">
          <FileTextIcon className="size-5" weight="duotone" />
        </span>
        <div className="flex flex-col gap-1">
          <TypographySmall className="font-medium">{t.resumeTitle}</TypographySmall>
          <TypographyMuted className="text-xs">
            {t.resumeBody}
          </TypographyMuted>
        </div>
      </div>
      <TypographyMuted role="status" aria-live="polite" className="sr-only">
        {pending ? t.resumeRefreshing : ""}
      </TypographyMuted>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={pending}
        className="shrink-0"
      >
        {pending ? (
          <Spinner data-icon="inline-start" className="size-4" />
        ) : (
          <ArrowClockwiseIcon data-icon="inline-start" className="size-4" />
        )}
        {pending ? t.refreshing : t.resumeRefresh}
      </Button>
    </div>
  );
}
