"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  createBlogCategory,
  deleteBlogCategory,
  getAdminBlogCategories,
  updateBlogCategory,
  type AdminBlogCategory,
} from "@/app/admin/blog/actions";
import { useQuery } from "@tanstack/react-query";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { queryKeys } from "@/lib/query-keys";
import {
  categoryFormSchema,
  type CategoryFormValues,
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  FolderOpenIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
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

const categoryTableFeatures = tableFeatures({});

const emptyValues: CategoryFormValues = {
  slug: "",
  nameId: "",
  nameEn: "",
  descriptionId: "",
  descriptionEn: "",
  sortOrder: 0,
  visible: true,
};

function toFormValues(category: AdminBlogCategory): CategoryFormValues {
  return {
    slug: category.slug,
    nameId: category.nameId,
    nameEn: category.nameEn,
    descriptionId: category.descriptionId ?? "",
    descriptionEn: category.descriptionEn ?? "",
    sortOrder: category.sortOrder,
    visible: category.visible,
  };
}

function CategoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  defaultValues: CategoryFormValues;
  onSubmit: (values: CategoryFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(categoryFormSchema),
    defaultValues,
    mode: "onSubmit",
  });
  const t = useDictionary().admin.blog.categories;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nameId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.nameIdLabel}</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    {...field}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                      if (defaultValues.slug === "") {
                        form.setValue("slug", slugify(event.target.value));
                      }
                    }}
                    disabled={submitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.nameEnLabel}</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    {...field}
                    disabled={submitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  className="font-mono text-sm"
                  disabled={submitting}
                />
              </FormControl>
              <FormDescription>{t.slugDescription}</FormDescription>
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
                  disabled={submitting}
                />
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.sortOrderLabel}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={9999}
                    {...field}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                    disabled={submitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="visible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5 pr-3">
                  <FormLabel>{t.visibleLabel}</FormLabel>
                  <FormDescription>{t.visibleDescription}</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    aria-label={t.visibleLabel}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={submitting}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

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

export function BlogCategoriesPanel() {
  const t = useDictionary().admin.blog.categories;
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.admin.blogCategories,
    queryFn: getAdminBlogCategories,
  });

  const columns: ColumnDef<typeof categoryTableFeatures, AdminBlogCategory>[] = [
    { id: "name", header: t.colName, accessorKey: "nameId" },
    { id: "slug", header: t.colSlug, accessorKey: "slug" },
    { id: "order", header: t.colOrder, accessorKey: "sortOrder" },
    { id: "usage", header: t.colUsage, accessorKey: "usage" },
    { id: "actions", header: t.colActions },
  ];

  const table = useTable({
    key: "admin-blog-categories",
    features: categoryTableFeatures,
    columns,
    data: categories,
  });

  const [dialog, setDialog] = useState<{
    open: boolean;
    target: AdminBlogCategory | null;
  }>({ open: false, target: null });

  const save = useActionMutation({
    action: (values: CategoryFormValues) =>
      dialog.target
        ? updateBlogCategory(dialog.target.id, values)
        : createBlogCategory(values),
    successMessage: () => (dialog.target ? t.updated : t.created),
    invalidate: [queryKeys.admin.blogCategories, queryKeys.admin.blogPosts],
    onDone: () => setDialog((prev) => ({ ...prev, open: false })),
  });

  const toggle = useActionMutation({
    action: (category: AdminBlogCategory) =>
      updateBlogCategory(category.id, {
        slug: category.slug,
        nameId: category.nameId,
        nameEn: category.nameEn,
        descriptionId: category.descriptionId ?? "",
        descriptionEn: category.descriptionEn ?? "",
        sortOrder: category.sortOrder,
        visible: !category.visible,
      }),
    invalidate: [queryKeys.admin.blogCategories, queryKeys.admin.blogPosts],
  });

  const remove = useActionMutation({
    action: (id: number) => deleteBlogCategory(id),
    successMessage: () => t.deleted,
    invalidate: [queryKeys.admin.blogCategories, queryKeys.admin.blogPosts],
  });

  const busyId = toggle.isPending
    ? toggle.variables.id
    : remove.isPending
      ? remove.variables
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <TypographySmall className="font-semibold">
            {t.heading}
          </TypographySmall>
          <TypographyMuted role="status" aria-live="polite" className="text-xs">
            {t.status
              .replace("{total}", String(categories.length))
              .replace(
                "{visible}",
                String(categories.filter((category) => category.visible).length),
              )}
          </TypographyMuted>
        </div>
        <Button
          size="sm"
          onClick={() => setDialog({ open: true, target: null })}
        >
          <PlusIcon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          {t.add}
        </Button>
      </div>

      {categories.length === 0 ? (
        <Empty bordered>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpenIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.emptyBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="sm"
              onClick={() => setDialog({ open: true, target: null })}
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
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {String(header.column.columnDef.header)}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const category = row.original;
                const isRowPending = busyId === category.id;
                return (
                  <TableRow
                    key={category.id}
                    className={cn(
                      "transition-opacity",
                      !category.visible && "opacity-50",
                      isRowPending && "opacity-40 pointer-events-none",
                    )}
                  >
                    <TableCell className="py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <TypographySmall>{category.nameId}</TypographySmall>
                        <TypographyMuted asChild>
                          <span className="text-2xs">{category.nameEn}</span>
                        </TypographyMuted>
                        {!category.visible && (
                          <Badge variant="outline" className="px-1.5 py-0 h-4">
                            {t.hidden}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <TypographyMuted asChild>
                        <span className="font-mono text-xs">
                          {category.slug}
                        </span>
                      </TypographyMuted>
                    </TableCell>
                    <TableCell className="py-3 tabular-nums">
                      {category.sortOrder}
                    </TableCell>
                    <TableCell className="py-3">
                      <TypographyMuted asChild>
                        <span className="text-xs">
                          {t.usage.replace("{count}", String(category.usage))}
                        </span>
                      </TypographyMuted>
                    </TableCell>
                    <TableCell className="py-3">
                      <Switch
                        checked={category.visible}
                        onCheckedChange={() => toggle.mutate(category)}
                        disabled={isRowPending}
                        aria-label={t.visibleLabel}
                      />
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <ButtonGroup className="justify-end">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            setDialog({ open: true, target: category })
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
                                  "{name}",
                                  category.nameId,
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
                                onClick={() => remove.mutate(category.id)}
                              >
                                {t.delete}
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.target ? t.dialogEdit : t.dialogAdd}
            </DialogTitle>
            <DialogDescription>
              {dialog.target ? t.dialogEditBody : t.dialogAddBody}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            key={dialog.target?.id ?? "new"}
            defaultValues={
              dialog.target ? toFormValues(dialog.target) : emptyValues
            }
            onSubmit={(values) => save.mutate(values)}
            onCancel={() => setDialog((prev) => ({ ...prev, open: false }))}
            submitting={save.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
