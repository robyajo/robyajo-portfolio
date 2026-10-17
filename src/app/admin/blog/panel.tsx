"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  createBlogPost,
  deleteBlogPost,
  getAdminBlogCategories,
  getAdminBlogPostSource,
  getAdminBlogPosts,
  getAdminBlogTags,
  updateBlogPost,
} from "@/app/admin/blog/actions";
import type { AdminBlogPost } from "@/lib/blog-admin";
import { useQuery } from "@tanstack/react-query";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { queryKeys } from "@/lib/query-keys";
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
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ArrowSquareOutIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/shared/icons";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/cn";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";

const postTableFeatures = tableFeatures({});

const NO_CATEGORY = "__none__";

function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function emptyValues(): BlogPostFormValues {
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

function PostForm({
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

function SourceForm({
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
    <PostForm
      key={data.slug}
      defaultValues={defaults}
      lockSlug
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitting={submitting}
    />
  );
}

export function BlogPostsPanel() {
  const t = useDictionary().admin.blog.posts;
  const notice = useDictionary().admin.blog.notice;
  const { data: posts = [] } = useQuery({
    queryKey: queryKeys.admin.blogPosts,
    queryFn: getAdminBlogPosts,
  });

  const columns: ColumnDef<typeof postTableFeatures, AdminBlogPost>[] = [
    { id: "title", header: t.colTitle, accessorKey: "title" },
    { id: "date", header: t.colDate, accessorKey: "date" },
    { id: "category", header: t.colCategory, accessorKey: "category" },
    { id: "lang", header: t.colLang, accessorKey: "hasEnglish" },
    { id: "actions", header: t.colActions },
  ];

  const table = useTable({
    key: "admin-blog-posts",
    features: postTableFeatures,
    columns,
    data: posts,
  });

  const [dialog, setDialog] = useState<{
    open: boolean;
    slug: string | null;
    create: boolean;
  }>({ open: false, slug: null, create: true });

  const save = useActionMutation({
    action: (values: BlogPostFormValues) =>
      dialog.create
        ? createBlogPost(values)
        : updateBlogPost(dialog.slug ?? values.slug, values),
    successMessage: () => (dialog.create ? t.created : t.updated),
    invalidate: [
      queryKeys.admin.blogPosts,
      queryKeys.admin.blogCategories,
      queryKeys.admin.blogTags,
    ],
    onDone: () => setDialog((prev) => ({ ...prev, open: false })),
  });

  const remove = useActionMutation({
    action: (slug: string) => deleteBlogPost(slug),
    successMessage: () => t.deleted,
    invalidate: [queryKeys.admin.blogPosts],
  });

  const englishCount = posts.filter((post) => post.hasEnglish).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <TypographySmall className="font-semibold">
            {t.heading}
          </TypographySmall>
          <TypographyMuted role="status" aria-live="polite" className="text-xs">
            {t.status
              .replace("{total}", String(posts.length))
              .replace("{english}", String(englishCount))}
          </TypographyMuted>
        </div>
        <Button
          size="sm"
          disabled={save.isPending || remove.isPending}
          onClick={() => setDialog({ open: true, slug: null, create: true })}
        >
          <PlusIcon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          {t.add}
        </Button>
      </div>

      <TypographyMuted asChild>
        <span className="text-2xs">{notice}</span>
      </TypographyMuted>

      {posts.length === 0 ? (
        <Empty bordered>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.emptyBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              onClick={() => setDialog({ open: true, slug: null, create: true })}
            >
              {t.add}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {String(header.column.columnDef.header)}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const post = row.original;
                const isRowPending = remove.isPending && remove.variables === post.slug;
                return (
                  <TableRow
                    key={post.slug}
                    className={cn(
                      "transition-opacity",
                      isRowPending && "opacity-40 pointer-events-none",
                    )}
                  >
                    <TableCell className="py-3 max-w-sm">
                      <div className="flex flex-col gap-1">
                        <TypographySmall>{post.title || post.slug}</TypographySmall>
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.map((tag) => (
                              <TypographyMuted key={tag} asChild>
                                <span className="rounded bg-muted px-1.5 py-0.5 text-3xs">
                                  {tag}
                                </span>
                              </TypographyMuted>
                            ))}
                          </div>
                        )}
                        <TypographyMuted asChild>
                          <span className="font-mono text-3xs">/{post.slug}</span>
                        </TypographyMuted>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 tabular-nums">
                      <TypographyMuted asChild>
                        <span className="text-xs">{post.date}</span>
                      </TypographyMuted>
                    </TableCell>
                    <TableCell className="py-3">
                      {post.category ? (
                        <Badge variant="outline" className="px-1.5 py-0 h-4">
                          {post.category}
                        </Badge>
                      ) : (
                        <TypographyMuted asChild>
                          <span className="text-3xs">—</span>
                        </TypographyMuted>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {post.hasEnglish ? (
                        <Badge variant="outline" className="px-1.5 py-0 h-4">
                          {t.englishBadge}
                        </Badge>
                      ) : (
                        <TypographyMuted asChild>
                          <span className="text-3xs">ID</span>
                        </TypographyMuted>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <ButtonGroup className="justify-end">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7"
                          asChild
                          aria-label={t.view}
                        >
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ArrowSquareOutIcon className="size-3.5" />
                          </a>
                        </Button>
                        <ButtonGroupSeparator />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            setDialog({
                              open: true,
                              slug: post.slug,
                              create: false,
                            })
                          }
                          aria-label={t.edit}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <ButtonGroupSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={isRowPending}
                              aria-label={t.delete}
                            >
                              <TrashIcon className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t.deleteTitle.replace(
                                  "{title}",
                                  post.title || post.slug,
                                )}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.deleteBody}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => remove.mutate(post.slug)}
                              >
                                {t.deleteAction}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.create ? t.dialogAdd : t.dialogEdit}
            </DialogTitle>
            <DialogDescription>
              {dialog.create ? t.dialogAddBody : t.dialogEditBody}
            </DialogDescription>
          </DialogHeader>
          {dialog.create ? (
            <PostForm
              key="new"
              defaultValues={emptyValues()}
              lockSlug={false}
              onSubmit={(values) => save.mutate(values)}
              onCancel={() => setDialog((prev) => ({ ...prev, open: false }))}
              submitting={save.isPending}
            />
          ) : (
            dialog.slug && (
              <SourceForm
                slug={dialog.slug}
                onSubmit={(values) => save.mutate(values)}
                onCancel={() => setDialog((prev) => ({ ...prev, open: false }))}
                submitting={save.isPending}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
