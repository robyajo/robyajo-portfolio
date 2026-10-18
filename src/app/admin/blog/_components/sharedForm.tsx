"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  getAdminBlogCategories,
  getAdminBlogPostSource,
  getAdminBlogTags,
} from "@/app/admin/blog/actions";
import {
  postFormSchema,
  type BlogPostFormValues,
} from "@/lib/blog-admin-schema";
import { slugify } from "@/lib/text";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogFooter,
} from "@/components/ui/dialog";
import { TypographyMuted } from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

const NO_CATEGORY = "__none__";

function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export function emptyBlogValues(): BlogPostFormValues {
  return {
    slug: "",
    date: todayJakarta(),
    category: "",
    tags: [],
    titleId: "",
    descriptionId: "",
    bodyId: "",
    includeEnglish: false,
    titleEn: "",
    descriptionEn: "",
    bodyEn: "",
  };
}

export function BlogPostForm({
  defaultValues,
  lockSlug,
  onSubmit,
  onCancel,
  submitting,
}: {
  defaultValues: BlogPostFormValues;
  lockSlug: boolean;
  onSubmit: (values: BlogPostFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const t = useDictionary().admin.blog.posts;
  const form = useForm<BlogPostFormValues>({
    resolver: standardSchemaResolver(postFormSchema),
    defaultValues,
    mode: "onSubmit",
  });
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.admin.blogCategories,
    queryFn: getAdminBlogCategories,
  });
  const { data: tags = [] } = useQuery({
    queryKey: queryKeys.admin.blogTags,
    queryFn: getAdminBlogTags,
  });

  const selectedTags = useWatch({ control: form.control, name: "tags" }) ?? [];
  const registryNames = new Set(tags.map((tag) => tag.name));
  const [extraTags, setExtraTags] = useState(
    defaultValues.tags.filter((tag) => !registryNames.has(tag)).join(", "),
  );
  const includeEnglish = useWatch({
    control: form.control,
    name: "includeEnglish",
  });

  function mergedTags(values: BlogPostFormValues): string[] {
    const extra = extraTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");
    return Array.from(new Set([...values.tags, ...extra]));
  }

  function submit(values: BlogPostFormValues) {
    onSubmit({ ...values, tags: mergedTags(values) });
  }

  function toggleTag(name: string, pressed: boolean) {
    const current = form.getValues("tags");
    const next = pressed
      ? [...current, name]
      : current.filter((tag) => tag !== name);
    form.setValue("tags", Array.from(new Set(next)), { shouldDirty: true });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.slugLabel}</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    {...field}
                    onChange={(event) =>
                      field.onChange(slugify(event.target.value))
                    }
                    placeholder={t.slugPlaceholder}
                    className="font-mono text-sm"
                    disabled={submitting || lockSlug}
                  />
                </FormControl>
                {!lockSlug && (
                  <FormDescription>{t.slugDescription}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.dateLabel}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    disabled={submitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.categoryLabel}</FormLabel>
                <Select
                  value={field.value === "" ? NO_CATEGORY : field.value}
                  onValueChange={(value) =>
                    field.onChange(value === NO_CATEGORY ? "" : value)
                  }
                  disabled={submitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>{t.categoryNone}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.nameId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label>{t.tagsLabel}</Label>
            {tags.length === 0 ? (
              <TypographyMuted asChild>
                <span className="text-xs">{t.tagsEmpty}</span>
              </TypographyMuted>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Toggle
                    key={tag.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    pressed={selectedTags.includes(tag.name)}
                    onPressedChange={(pressed) =>
                      toggleTag(tag.name, pressed)
                    }
                    disabled={submitting}
                  >
                    {tag.name}
                  </Toggle>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blog-post-extra-tags">{t.tagsExtraLabel}</Label>
          <Input
            id="blog-post-extra-tags"
            autoComplete="off"
            value={extraTags}
            onChange={(event) => setExtraTags(event.target.value)}
            placeholder={t.tagsExtraPlaceholder}
            disabled={submitting}
          />
        </div>

        <div className="h-px bg-border" />

        <FormField
          control={form.control}
          name="titleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.titleIdLabel}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} disabled={submitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descriptionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.descriptionIdLabel}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={2}
                  className="resize-none"
                  placeholder={t.descriptionPlaceholder}
                  disabled={submitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bodyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.bodyIdLabel}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={14}
                  className="font-mono text-xs leading-relaxed"
                  placeholder={t.bodyPlaceholder}
                  disabled={submitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="includeEnglish"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5 pr-3">
                <FormLabel>{t.includeEnglishLabel}</FormLabel>
                <FormDescription>
                  {t.includeEnglishDescription}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  aria-label={t.includeEnglishLabel}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={submitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {includeEnglish && (
          <>
            <FormField
              control={form.control}
              name="titleEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.titleEnLabel}</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} disabled={submitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descriptionEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.descriptionEnLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      className="resize-none"
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bodyEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.bodyEnLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={14}
                      className="font-mono text-xs leading-relaxed"
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

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
            {submitting ? t.saving : t.save}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function BlogSourceForm({
  slug,
  onSubmit,
  onCancel,
  submitting,
}: {
  slug: string;
  onSubmit: (values: BlogPostFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const t = useDictionary().admin.blog.posts;
  const { data, isPending } = useQuery({
    queryKey: queryKeys.admin.blogPost(slug),
    queryFn: () => getAdminBlogPostSource(slug),
  });

  if (isPending) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner />
        <TypographyMuted className="text-xs">{t.loading}</TypographyMuted>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <TypographyMuted className="text-xs">{t.loadFailed}</TypographyMuted>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  const defaults: BlogPostFormValues = {
    slug: data.slug,
    date: data.id.date,
    category: data.id.category,
    tags: data.id.tags,
    titleId: data.id.title,
    descriptionId: data.id.description,
    bodyId: data.id.body,
    includeEnglish: Boolean(data.en),
    titleEn: data.en?.title ?? "",
    descriptionEn: data.en?.description ?? "",
    bodyEn: data.en?.body ?? "",
  };

  return (
    <BlogPostForm
      key={data.slug}
      defaultValues={defaults}
      lockSlug
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitting={submitting}
    />
  );
}
