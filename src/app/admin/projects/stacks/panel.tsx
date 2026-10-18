"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  createProjectStack,
  deleteProjectStack,
  getAdminProjectStacks,
  updateProjectStack,
  type AdminStackRow,
} from "@/app/admin/actions";
import { useQuery } from "@tanstack/react-query";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { queryKeys } from "@/lib/query-keys";
import { stackInputSchema, type StackFormValues } from "@/lib/project-stacks-schema";
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
import { PencilIcon, PlusIcon, TagIcon, TrashIcon } from "@/components/shared/icons";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";

const emptyValues: StackFormValues = {
  name: "",
  description: "",
  sortOrder: 0,
  visible: true,
};

function toFormValues(stack: AdminStackRow): StackFormValues {
  return {
    name: stack.name,
    description: stack.description ?? "",
    sortOrder: stack.sortOrder,
    visible: stack.visible,
  };
}

function StackForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  defaultValues: StackFormValues;
  onSubmit: (values: StackFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const form = useForm<StackFormValues>({
    resolver: standardSchemaResolver(stackInputSchema),
    defaultValues,
    mode: "onSubmit",
  });
  const t = useDictionary().admin.projects.stacks;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.nameLabel}</FormLabel>
              <FormControl>
                <Input autoComplete="off" {...field} disabled={submitting} />
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
              <FormLabel>{t.descriptionLabel}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={2}
                  placeholder={t.descriptionPlaceholder}
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
              <FormItem>
                <div className="flex flex-row items-center justify-between gap-3 rounded-lg border p-3">
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

export function StacksPanel() {
  const t = useDictionary().admin.projects.stacks;
  const { data: stacks = [] } = useQuery({
    queryKey: queryKeys.admin.projectStacks,
    queryFn: getAdminProjectStacks,
  });

  const [dialog, setDialog] = useState<{
    open: boolean;
    target: AdminStackRow | null;
  }>({ open: false, target: null });

  const save = useActionMutation({
    action: (values: StackFormValues) =>
      dialog.target
        ? updateProjectStack(dialog.target.id, values)
        : createProjectStack(values),
    successMessage: () => (dialog.target ? t.updated : t.created),
    invalidate: [queryKeys.admin.projectStacks],
    onDone: () => setDialog((prev) => ({ ...prev, open: false })),
  });

  const remove = useActionMutation({
    action: (id: number) => deleteProjectStack(id),
    successMessage: () => t.deleted,
    invalidate: [queryKeys.admin.projectStacks],
  });

  const busyId = remove.isPending ? remove.variables : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t.heading}</h3>
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            {t.status
              .replace("{total}", String(stacks.length))
              .replace(
                "{visible}",
                String(stacks.filter((stack) => stack.visible).length),
              )}
          </p>
        </div>
        <Button size="sm" onClick={() => setDialog({ open: true, target: null })}>
          <PlusIcon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          {t.add}
        </Button>
      </div>

      {stacks.length === 0 ? (
        <Empty bordered>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TagIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.emptyBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setDialog({ open: true, target: null })}>
              {t.add}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.colName}</TableHead>
                <TableHead>{t.colOrder}</TableHead>
                <TableHead>{t.colUsage}</TableHead>
                <TableHead className="text-right">{t.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stacks.map((stack) => {
                const isRowPending = busyId === stack.id;
                return (
                  <TableRow key={stack.id} data-disabled={isRowPending}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium">{stack.name}</span>
                        {!stack.visible && (
                          <Badge variant="outline" size="tiny">
                            {t.hidden}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {stack.sortOrder}
                    </TableCell>
                    <TableCell>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {t.usage.replace("{count}", String(stack.usage))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <ButtonGroup className="justify-end">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7"
                          onClick={() => setDialog({ open: true, target: stack })}
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
                              className="size-7"
                              disabled={isRowPending}
                              aria-label={t.delete}
                            >
                              <TrashIcon className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t.deleteTitle.replace("{name}", stack.name)}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.deleteBody}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => remove.mutate(stack.id)}
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.target ? t.dialogEdit : t.dialogAdd}
            </DialogTitle>
            <DialogDescription>
              {dialog.target ? t.dialogEditBody : t.dialogAddBody}
            </DialogDescription>
          </DialogHeader>
          <StackForm
            key={dialog.target?.id ?? "new"}
            defaultValues={dialog.target ? toFormValues(dialog.target) : emptyValues}
            onSubmit={(values) => save.mutate(values)}
            onCancel={() => setDialog((prev) => ({ ...prev, open: false }))}
            submitting={save.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
