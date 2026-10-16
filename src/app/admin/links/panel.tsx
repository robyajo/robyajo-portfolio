"use client";

import { useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
} from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  createLink,
  updateLink,
  toggleLinkEnabled,
  deleteLink,
  getAdminLinks,
  type AdminLink,
} from "@/app/admin/links/actions";
import { useQuery } from "@tanstack/react-query";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { queryKeys } from "@/lib/query-keys";
import {
  formatPath,
  linkFormSchema,
  type LinkFormValues,
  type SlugPair,
} from "@/lib/links-schema";
import { slugify } from "@/lib/text";
import { siteConfig } from "@/lib/config";
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
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ImageIcon,
  ArrowSquareOutIcon,
  CaretUpDownIcon,
  LinkIcon,
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

const linkTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
});

function useLinkColumns(): ColumnDef<typeof linkTableFeatures, AdminLink>[] {
  const t = useDictionary().admin.links;
  return [
    {
      id: "path",
      header: t.colPath,
      accessorFn: (link) => formatPath(link.primary),
    },
    {
      id: "target",
      header: t.colTarget,
      accessorKey: "target",
      enableSorting: false,
    },
    { id: "clicks", header: t.colClicks, accessorKey: "clicks" },
    {
      id: "enabled",
      header: t.colEnabled,
      accessorKey: "enabled",
      enableSorting: false,
    },
    { id: "actions", header: t.colActions, enableSorting: false },
  ];
}

const HEAD_CLASS: Record<string, string> = {
  target: "hidden md:table-cell",
  clicks: "w-16 text-right",
  enabled: "w-20 text-center",
  actions: "w-20 text-right",
};

const emptyValues: LinkFormValues = {
  target: "",
  title: "",
  description: "",
  ogEnabled: false,
  ogImage: "",
  permanent: false,
  enabled: true,
  primary: { tag: "", slug: "" },
  aliases: [],
};

function toFormValues(link: AdminLink): LinkFormValues {
  return {
    target: link.target,
    title: link.title ?? "",
    description: link.description ?? "",
    ogEnabled: link.ogEnabled,
    ogImage: link.ogImage ?? "",
    permanent: link.permanent,
    enabled: link.enabled,
    primary: { ...link.primary },
    aliases: link.aliases.map((a) => ({ ...a })),
  };
}

function pathLabel(pair: SlugPair): string {
  const tag = pair.tag.trim();
  const slug = pair.slug.trim();
  return slug ? formatPath({ tag, slug }) : "…";
}

type PathFieldName = "primary" | `aliases.${number}`;

function SlugPairFields({
  control,
  name,
  tagLabel,
  slugLabel,
  preview,
  disabled,
  showSlugMessage = false,
  onRemove,
}: {
  control: Control<LinkFormValues>;
  name: PathFieldName;
  tagLabel: string;
  slugLabel: string;
  preview: SlugPair;
  disabled: boolean;
  showSlugMessage?: boolean;
  onRemove?: () => void;
}) {
  const t = useDictionary().admin.links;
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <FormField
          control={control}
          name={`${name}.tag`}
          render={({ field }) => (
            <FormItem className="w-36">
              <FormControl>
                <Input
                  autoComplete="off"
                  {...field}
                  onChange={(e) => field.onChange(slugify(e.target.value))}
                  placeholder="tag"
                  aria-label={tagLabel}
                  className="font-mono text-sm"
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <TypographyMuted className="self-center font-mono text-sm">
          /
        </TypographyMuted>
        <FormField
          control={control}
          name={`${name}.slug`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  autoComplete="off"
                  {...field}
                  onChange={(e) => field.onChange(slugify(e.target.value))}
                  placeholder="short-url"
                  aria-label={slugLabel}
                  className="font-mono text-sm"
                  disabled={disabled}
                />
              </FormControl>
              {showSlugMessage && <FormMessage />}
            </FormItem>
          )}
        />
        {onRemove && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-9 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
            disabled={disabled}
            aria-label={t.removeAlias}
          >
            <TrashIcon className="size-4" />
          </Button>
        )}
      </div>
      <TypographyMuted className="font-mono text-2xs">
        {siteConfig.domain}/{pathLabel(preview)}
      </TypographyMuted>
    </div>
  );
}

function SwitchField({
  control,
  name,
  label,
  description,
  disabled,
}: {
  control: Control<LinkFormValues>;
  name: "ogEnabled" | "permanent" | "enabled";
  label: string;
  description: string;
  disabled: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5 pr-3">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
          <FormControl>
            <Switch
              aria-label={label}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function LinkForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  defaultValues: LinkFormValues;
  onSubmit: (values: LinkFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const form = useForm<LinkFormValues>({
    resolver: standardSchemaResolver(linkFormSchema),
    defaultValues,
    mode: "onSubmit",
  });
  const t = useDictionary().admin.links;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "aliases",
  });
  const primary = useWatch({ control: form.control, name: "primary" });
  const aliases = useWatch({ control: form.control, name: "aliases" });
  const ogEnabled = useWatch({ control: form.control, name: "ogEnabled" });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="target"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.targetLabel}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  {...field}
                  placeholder={t.targetPlaceholder}
                  disabled={submitting}
                />
              </FormControl>
              <FormDescription>
                Where visitors are sent. Supports http(s) and mailto.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-1.5">
          <Label>{t.primaryPath}</Label>
          <SlugPairFields
            control={form.control}
            name="primary"
            tagLabel={t.tagAria}
            slugLabel={t.slugAria}
            preview={primary}
            disabled={submitting}
            showSlugMessage
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t.aliases}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ tag: primary.tag, slug: "" })}
              disabled={submitting}
            >
              <PlusIcon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
              Add alias
            </Button>
          </div>
          {fields.length === 0 ? (
            <TypographyMuted className="text-xs">
              Extra paths that resolve to the same target.
            </TypographyMuted>
          ) : (
            <div className="flex flex-col gap-3">
              {fields.map((row, i) => (
                <SlugPairFields
                  key={row.id}
                  control={form.control}
                  name={`aliases.${i}`}
                  tagLabel={t.aliasTagAria}
                  slugLabel={t.aliasSlugAria}
                  preview={aliases[i] ?? { tag: "", slug: "" }}
                  disabled={submitting}
                  onRemove={() => remove(i)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.previewTitle}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  {...field}
                  placeholder={t.previewTitlePlaceholder}
                  disabled={submitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.previewDesc}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t.previewDescPlaceholder}
                  rows={2}
                  className="resize-none"
                  disabled={submitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SwitchField
          control={form.control}
          name="ogEnabled"
          label={t.ogLabel}
          description={t.ogDescription}
          disabled={submitting}
        />

        {ogEnabled && (
          <FormField
            control={form.control}
            name="ogImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.ogImage}</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    {...field}
                    placeholder={t.ogImagePlaceholder}
                    disabled={submitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <SwitchField
          control={form.control}
          name="permanent"
          label={t.permanent}
          description={t.permanentDescription}
          disabled={submitting}
        />

        <SwitchField
          control={form.control}
          name="enabled"
          label={t.enabled}
          description={t.enabledDescription}
          disabled={submitting}
        />

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

export function LinksPanel() {
  const t = useDictionary().admin.links;
  const linkColumns = useLinkColumns();
  const { data: links = [] } = useQuery({
    queryKey: queryKeys.admin.links,
    queryFn: getAdminLinks,
  });

  const table = useTable({
    key: "admin-links",
    features: linkTableFeatures,
    columns: linkColumns,
    data: links,
  });
  const [dialog, setDialog] = useState<{
    open: boolean;
    target: AdminLink | null;
  }>({ open: false, target: null });
  const dialogOpen = dialog.open;
  const editTarget = dialog.target;

  function openAdd() {
    setDialog({ open: true, target: null });
  }

  function openEdit(link: AdminLink) {
    setDialog({ open: true, target: link });
  }

  const save = useActionMutation({
    action: (values: LinkFormValues) => {
      const raw = {
        ...values,
        aliases: values.aliases.filter((a) => a.slug.trim() !== ""),
      };
      return editTarget ? updateLink(editTarget.id, raw) : createLink(raw);
    },
    successMessage: () => (editTarget ? t.updated : t.created),
    invalidate: [queryKeys.admin.links],
    onDone: () => setDialog((prev) => ({ ...prev, open: false })),
  });

  const toggle = useActionMutation({
    action: (id: number) => toggleLinkEnabled(id),
    invalidate: [queryKeys.admin.links],
  });

  const remove = useActionMutation({
    action: (id: number) => deleteLink(id),
    successMessage: () => t.deleted,
    invalidate: [queryKeys.admin.links],
  });

  const pendingId = toggle.isPending
    ? toggle.variables
    : remove.isPending
      ? remove.variables
      : null;

  const handleSubmit = (values: LinkFormValues) => save.mutate(values);

  const handleToggle = (id: number) => {
    if (pendingId === null) toggle.mutate(id);
  };

  const handleDelete = (id: number) => {
    if (pendingId === null) remove.mutate(id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <TypographySmall className="font-semibold">
            {t.heading}
          </TypographySmall>
          <TypographyMuted
            role="status"
            aria-live="polite"
            className="text-xs"
          >
            {t.statusEnabled.replace("{enabled}", String(links.filter((l) => l.enabled).length)).replace("{total}", String(links.length)).replace("{domain}", siteConfig.domain)}
          </TypographyMuted>
        </div>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          {t.add}
        </Button>
      </div>

      {links.length === 0 ? (
        <Empty bordered>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LinkIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.emptyTitle}</EmptyTitle>
            <EmptyDescription>
              {t.emptyBody.replace("{domain}", siteConfig.domain)}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={openAdd}>
              <PlusIcon
                data-icon="inline-start"
                className="size-3.5"
                aria-hidden="true"
              />
              Add Link
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
                    const label = String(header.column.columnDef.header);
                    const sortable = header.column.getCanSort();
                    const direction = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        // eslint-disable-next-line shadcn/require-static-classes
                        className={HEAD_CLASS[header.id]}
                        aria-sort={
                          direction === "asc"
                            ? "ascending"
                            : direction === "desc"
                              ? "descending"
                              : undefined
                        }
                      >
                        {sortable ? (
                          <Button
                            type="button"
                            variant="muted"
                            size="xs"
                            onClick={header.column.getToggleSortingHandler()}
                            className="-mx-1.5"
                          >
                            {label}
                            <CaretUpDownIcon
                              className="size-3 opacity-60"
                              aria-hidden="true"
                            />
                          </Button>
                        ) : (
                          label
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const link = row.original;
                const isRowPending = pendingId === link.id;
                const primaryPath = formatPath(link.primary);
                return (
                  <TableRow
                    key={link.id}
                    className={cn(
                      "transition-opacity",
                      !link.enabled && "opacity-50",
                      isRowPending && "opacity-40 pointer-events-none",
                    )}
                  >
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <TypographySmall asChild>
                            <a
                              href={`/${primaryPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono hover:underline"
                            >
                              /{primaryPath}
                            </a>
                          </TypographySmall>
                          {link.ogEnabled && (
                            <Badge
                              variant="outline"
                              className="px-1.5 py-0 h-4 text-3xs"
                            >
                              <ImageIcon className="size-2.5" aria-hidden />
                              OG
                            </Badge>
                          )}
                          {link.permanent && (
                            <Badge
                              variant="outline"
                              className="px-1.5 py-0 h-4 text-3xs"
                            >
                              308
                            </Badge>
                          )}
                        </div>
                        {link.aliases.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {link.aliases.map((a) => (
                              <TypographyMuted
                                key={`${a.tag}/${a.slug}`}
                                asChild
                              >
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-3xs">
                                  /{formatPath(a)}
                                </span>
                              </TypographyMuted>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell py-3 max-w-xs">
                      <TypographyMuted asChild>
                        <a
                          href={link.target}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs hover:text-foreground truncate"
                        >
                          <span className="truncate">{link.target}</span>
                          <ArrowSquareOutIcon
                            className="size-3 shrink-0 opacity-60"
                            aria-hidden
                          />
                        </a>
                      </TypographyMuted>
                    </TableCell>

                    <TableCell className="text-right py-3">
                      <TypographyMuted className="tabular-nums">
                        {link.clicks.toLocaleString()}
                      </TypographyMuted>
                    </TableCell>

                    <TableCell className="text-center py-3">
                      <Switch
                        checked={link.enabled}
                        onCheckedChange={() => handleToggle(link.id)}
                        disabled={isRowPending}
                        aria-label={
                          link.enabled ? t.disable : t.enable
                        }
                      />
                    </TableCell>

                    <TableCell className="text-right py-3">
                      <ButtonGroup className="justify-end">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7"
                          onClick={() => openEdit(link)}
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
                                {t.deleteTitle.replace("{path}", primaryPath)}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.deleteBody}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(link.id)}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? t.dialogEdit : t.dialogAdd}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? t.dialogEditBody
                : t.dialogAddBody}
            </DialogDescription>
          </DialogHeader>
          <LinkForm
            key={editTarget?.id ?? "new"}
            defaultValues={editTarget ? toFormValues(editTarget) : emptyValues}
            onSubmit={handleSubmit}
            onCancel={() => setDialog((prev) => ({ ...prev, open: false }))}
            submitting={save.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
