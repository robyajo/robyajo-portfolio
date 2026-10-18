import { useState } from "react";
import { useForm, type Control } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { isHttpUrl } from "@/lib/links-schema";
import { projectInputSchema } from "@/lib/projects-schema";
import type { AdminStackRow } from "@/app/admin/actions";
import {
  Form,
  FormControl,
  FormDescription,
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
import { EyeIcon, CheckIcon, CopyIcon, PlusIcon } from "@/components/shared/icons";
import { TypographyMuted } from "@/components/ui/typography";
import { generateSyncKey, slugifyTitle } from "@/lib/sync-keys";
import { stackSlug } from "@/lib/project-stacks-schema";
import type { ActionResult } from "@/lib/action-result";

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
  repoVisibility: z.enum(["public", "private"]),
});

export type ProjectFormData = z.input<typeof projectFormSchema>;

export function parseProjectHighlights(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function StackPicker({
  control,
  stacks,
  quickAdd,
  disabled,
}: {
  control: Control<ProjectFormData>;
  stacks: AdminStackRow[];
  quickAdd: (name: string) => Promise<ActionResult>;
  disabled: boolean;
}) {
  const t = useDictionary().admin.projects;
  const [ newName, setNewName ] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);

  const visibleStacks = stacks.filter((stack) => stack.visible);

  async function handleQuickAdd() {
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    setAddMessage(null);
    const result = await quickAdd(name);
    setAddMessage(result.success ? t.stackPickAdded : result.error);
    if (result.success) setNewName("");
    setAdding(false);
  }

  return (
    <FormField
      control={control}
      name="highlights"
      render={({ field }) => {
        const selected = parseProjectHighlights(field.value);
        const selectedSlugs = new Set(
          selected.map((token) => stackSlug(token)),
        );
        const pickedNames = new Set(
          selected.map((token) => token.toLowerCase()),
        );
        const customTokens = selected.filter((token) =>
          !visibleStacks.some(
            (stack) => stack.name.toLowerCase() === token.toLowerCase(),
          ),
        );

        function toggle(stack: AdminStackRow) {
          const lower = stack.name.toLowerCase();
          const next = pickedNames.has(lower)
            ? selected.filter((token) => token.toLowerCase() !== lower)
            : [...selected, stack.name];
          field.onChange(next.join(", "));
        }

        return (
          <FormItem>
            <FormLabel>
              {t.stackPickLabel}
              <span className="text-xs font-normal text-muted-foreground">
                {t.stackPickHint}
              </span>
            </FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {visibleStacks.map((stack) => (
                  <Button
                    key={stack.id}
                    type="button"
                    size="sm"
                    variant={selectedSlugs.has(stack.slug) ? "default" : "outline"}
                    disabled={disabled}
                    aria-pressed={selectedSlugs.has(stack.slug)}
                    onClick={() => toggle(stack)}
                  >
                    {stack.name}
                  </Button>
                ))}
                {visibleStacks.length === 0 && (
                  <TypographyMuted asChild>
                    <span className="text-xs">{t.stackPickEmpty}</span>
                  </TypographyMuted>
                )}
              </div>
            </FormControl>
            {customTokens.length > 0 && (
              <FormDescription>
                {customTokens.join(", ")}
              </FormDescription>
            )}
            {addMessage && (
              <FormDescription>{addMessage}</FormDescription>
            )}
            <FormMessage />
            <div className="flex gap-2">
              <Input
                autoComplete="off"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleQuickAdd();
                  }
                }}
                placeholder={t.stackPickAddPlaceholder}
                disabled={disabled || adding}
                className="max-w-64"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickAdd}
                disabled={disabled || adding}
                className="shrink-0"
              >
                <PlusIcon className="size-3.5" aria-hidden="true" />
                {t.stackPickAddButton}
              </Button>
            </div>
            <FormDescription>{t.stackPickAdd}</FormDescription>
          </FormItem>
        );
      }}
    />
  );
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

export interface ProjectFormProps {
  initial: ProjectFormData;
  stacks: AdminStackRow[];
  quickAddStack: (name: string) => Promise<ActionResult>;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  submitting: boolean;
}

export function ProjectForm({
  initial,
  stacks,
  quickAddStack,
  onSubmit,
  onCancel,
  submitting,
}: ProjectFormProps) {
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
        <StackPicker
          control={form.control}
          stacks={stacks}
          quickAdd={quickAddStack}
          disabled={submitting}
        />
        <FormField
          control={form.control}
          name="repoVisibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t.repoVisibilityLabel}
                <span className="text-xs font-normal text-muted-foreground">
                  {t.repoVisibilityHint}
                </span>
              </FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={field.value === "public" ? "default" : "outline"}
                    disabled={submitting}
                    aria-pressed={field.value === "public"}
                    onClick={() => field.onChange("public")}
                  >
                    {t.repoVisibilityPublic}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={field.value === "private" ? "default" : "outline"}
                    disabled={submitting}
                    aria-pressed={field.value === "private"}
                    onClick={() => field.onChange("private")}
                  >
                    {t.repoVisibilityPrivate}
                  </Button>
                </div>
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
