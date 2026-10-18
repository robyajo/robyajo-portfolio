import { useState } from "react";
import { useForm, type Control } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { isHttpUrl } from "@/lib/links-schema";
import { projectInputSchema } from "@/lib/projects-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  DialogFooter,
} from "@/components/ui/dialog";
import { useDictionary } from "@/lib/i18n/provider";
import { EyeIcon, CheckIcon, CopyIcon } from "@/components/shared/icons";
import { generateSyncKey, slugifyTitle } from "@/lib/sync-keys";

const optionalUrlField = z
  .string()
  .trim()
  .refine((value) => value === "" || isHttpUrl(value), {
    message: "Enter a valid http(s):// URL.",
  });

const projectFormSchema = z.object({
  title: projectInputSchema.shape.title,
  slug: z.string().trim().max(256),
  syncKey: z.string().trim().max(64),
  description: projectInputSchema.shape.description,
  highlights: z.string(),
  live: optionalUrlField,
  github: optionalUrlField,
});

export type ProjectFormData = z.input<typeof projectFormSchema>;

export function parseProjectHighlights(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function useProjectTextFields() {
  const t = useDictionary().admin.projects;
  return [
    {
      name: "title",
      label: t.titleLabel,
      placeholder: t.titlePlaceholder,
    },
    {
      name: "highlights",
      label: t.highlightsLabel,
      hint: t.highlightsHint,
      placeholder: t.highlightsPlaceholder,
    },
    {
      name: "github",
      label: t.githubLabel,
      hint: t.optionalHint,
      placeholder: t.githubPlaceholder,
      type: "url",
    },
    {
      name: "live",
      label: t.liveLabel,
      hint: t.optionalHint,
      placeholder: t.livePlaceholder,
      type: "url",
    },
  ] as const;
}

function ProjectTextField({
  control,
  field: spec,
  disabled,
}: {
  control: Control<ProjectFormData>;
  field: ReturnType<typeof useProjectTextFields>[number];
  disabled: boolean;
}) {
  return (
    <FormField
      control={control}
      name={spec.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {spec.label}
            {"hint" in spec && (
              <span className="text-xs font-normal text-muted-foreground">
                {spec.hint}
              </span>
            )}
          </FormLabel>
          <FormControl>
            <Input
              autoComplete="off"
              {...field}
              placeholder={spec.placeholder}
              type={"type" in spec ? spec.type : "text"}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: ProjectFormData;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const form = useForm<ProjectFormData>({
    resolver: standardSchemaResolver(projectFormSchema),
    defaultValues: initial,
    mode: "onSubmit",
  });
  const t = useDictionary().admin.projects;
  const textFields = useProjectTextFields();
  const [titleField, ...restFields] = textFields;
  const [keyVisible, setKeyVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  function fillSlugFromTitle() {
    const current = form.getValues("slug").trim();
    if (current) return;
    const slug = slugifyTitle(form.getValues("title"));
    if (slug) form.setValue("slug", slug, { shouldValidate: true });
  }

  function generateKey() {
    form.setValue("syncKey", generateSyncKey(), { shouldValidate: true });
    setKeyVisible(true);
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(form.getValues("syncKey"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <ProjectTextField
          control={form.control}
          field={titleField}
          disabled={submitting}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.slugLabel}</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    autoComplete="off"
                    {...field}
                    placeholder={t.slugPlaceholder}
                    disabled={submitting}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fillSlugFromTitle}
                    disabled={submitting}
                    className="shrink-0"
                  >
                    {t.slugAuto}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="syncKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.syncKeyLabel}</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    autoComplete="off"
                    {...field}
                    type={keyVisible ? "text" : "password"}
                    placeholder={t.syncKeyPlaceholder}
                    disabled={submitting}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setKeyVisible((v) => !v)}
                    disabled={submitting}
                    className="shrink-0"
                    aria-label={keyVisible ? t.keyHide : t.keyShow}
                  >
                    <EyeIcon size={14} className={keyVisible ? "" : "opacity-50"} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateKey}
                    disabled={submitting}
                    className="shrink-0"
                  >
                    {t.keyGenerate}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyKey}
                    disabled={submitting || !field.value}
                    className="shrink-0"
                    aria-label={t.keyCopy}
                  >
                    {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                  </Button>
                </div>
              </FormControl>
              <p className="text-xs text-muted-foreground">{t.syncKeyHint}</p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.descriptionLabel}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t.descriptionPlaceholder}
                  rows={3}
                  className="resize-none"
                  disabled={submitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {restFields.map((spec) => (
          <ProjectTextField
            key={spec.name}
            control={form.control}
            field={spec}
            disabled={submitting}
          />
        ))}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            {t.cancel}
          </Button>
          <Button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting && <Spinner data-icon="inline-start" aria-hidden="true" />}
            {t.save}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
