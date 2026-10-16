"use client";

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
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { useDictionary } from "@/lib/i18n/provider";
import { queryKeys } from "@/lib/query-keys";
import {
  createProject,
  getAdminProjects,
  type ProjectInput,
  updateProject,
  toggleProjectEnabled,
  deleteProject,
  moveProject,
  type ProjectRow,
} from "@/app/admin/actions";
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
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  FolderOpenIcon,
} from "@/components/shared/icons";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";

const optionalUrlField = z
  .string()
  .trim()
  .refine((value) => value === "" || isHttpUrl(value), {
    message: "Enter a valid http(s):// URL.",
  });

const projectFormSchema = z.object({
  title: projectInputSchema.shape.title,
  description: projectInputSchema.shape.description,
  highlights: z.string(),
  live: optionalUrlField,
  github: optionalUrlField,
});

type FormData = z.input<typeof projectFormSchema>;

const emptyForm: FormData = {
  title: "",
  description: "",
  highlights: "",
  live: "",
  github: "",
};

function parseHighlights(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function useTextFields() {
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
  control: Control<FormData>;
  field: ReturnType<typeof useTextFields>[number];
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

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: FormData;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const form = useForm<FormData>({
    resolver: standardSchemaResolver(projectFormSchema),
    defaultValues: initial,
    mode: "onSubmit",
  });
  const t = useDictionary().admin.projects;
  const textFields = useTextFields();
  const [titleField, ...restFields] = textFields;

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

export function ProjectsPanel() {
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.admin.projects,
    queryFn: getAdminProjects,
  });
  const [dialog, setDialog] = useState<{
    open: boolean;
    target: ProjectRow | null;
  }>({ open: false, target: null });
  const dialogOpen = dialog.open;
  const editTarget = dialog.target;

  const dict = useDictionary();
  const t = dict.admin.projects;
  const save = useActionMutation({
    action: (data: ProjectInput) =>
      editTarget ? updateProject(editTarget.id, data) : createProject(data),
    successMessage: () => (editTarget ? t.updated : t.created),
    invalidate: [queryKeys.admin.projects],
    onDone: () => setDialog((prev) => ({ ...prev, open: false })),
  });

  const toggle = useActionMutation({
    action: (id: number) => toggleProjectEnabled(id),
    invalidate: [queryKeys.admin.projects],
  });

  const remove = useActionMutation({
    action: (id: number) => deleteProject(id),
    successMessage: () => t.deleted,
    invalidate: [queryKeys.admin.projects],
  });

  const move = useActionMutation({
    action: ({ id, direction }: { id: number; direction: "up" | "down" }) =>
      moveProject(id, direction),
    invalidate: [queryKeys.admin.projects],
  });

  const pendingId = toggle.isPending
    ? toggle.variables
    : remove.isPending
      ? remove.variables
      : move.isPending
        ? move.variables.id
        : null;

  function openAdd() {
    setDialog({ open: true, target: null });
  }

  function openEdit(project: ProjectRow) {
    setDialog({ open: true, target: project });
  }

  function handleFormSubmit(form: FormData) {
    save.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      highlights: parseHighlights(form.highlights),
      live: form.live.trim() || null,
      github: form.github.trim() || null,
    });
  }

  function handleToggle(id: number) {
    if (pendingId === null) toggle.mutate(id);
  }

  function handleDelete(id: number) {
    if (pendingId === null) remove.mutate(id);
  }

  function handleMove(id: number, direction: "up" | "down") {
    if (pendingId === null) move.mutate({ id, direction });
  }

  const sorted = [...projects].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <TypographySmall className="font-semibold">{t.heading}</TypographySmall>
          <TypographyMuted
            role="status"
            aria-live="polite"
            className="text-xs"
          >
            {t.visibleStatus.replace("{visible}", String(projects.filter((p) => p.enabled).length)).replace("{total}", String(projects.length))}
          </TypographyMuted>
        </div>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          {t.add}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Empty bordered>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpenIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.emptyTitle}</EmptyTitle>
            <EmptyDescription>
              {t.emptyBody}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={openAdd}>
              <PlusIcon
                data-icon="inline-start"
                className="size-3.5"
                aria-hidden="true"
              />
              Add Project
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t.order}</TableHead>
                <TableHead>{t.project}</TableHead>
                <TableHead className="hidden md:table-cell">{t.stack}</TableHead>
                <TableHead className="w-20 text-center">{t.visible}</TableHead>
                <TableHead className="w-20 text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((project, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === sorted.length - 1;
                const isRowPending = pendingId === project.id;

                return (
                  <TableRow
                    key={project.id}
                    className={cn(
                      "transition-opacity",
                      !project.enabled && "opacity-50",
                      isRowPending && "opacity-40 pointer-events-none",
                    )}
                  >
                    <TableCell className="py-2 align-middle">
                      <ButtonGroup
                        orientation="vertical"
                        aria-label={t.reorder}
                      >
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-6"
                          onClick={() => handleMove(project.id, "up")}
                          disabled={isFirst || isRowPending}
                          aria-label={t.moveUp}
                        >
                          <ArrowUpIcon className="size-3" />
                        </Button>
                        <ButtonGroupSeparator orientation="horizontal" />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-6"
                          onClick={() => handleMove(project.id, "down")}
                          disabled={isLast || isRowPending}
                          aria-label={t.moveDown}
                        >
                          <ArrowDownIcon className="size-3" />
                        </Button>
                      </ButtonGroup>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold leading-tight">
                            {project.title}
                          </span>
                          {!project.enabled && (
                            <Badge
                              variant="outline"
                              className="text-3xs px-1.5 py-0 h-4"
                            >
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <TypographyMuted className="text-xs line-clamp-2 leading-relaxed max-w-sm">
                          {project.description}
                        </TypographyMuted>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell py-3">
                      <div className="flex flex-wrap gap-1">
                        {project.highlights.slice(0, 4).map((h) => (
                          <span
                            key={h}
                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-3xs text-muted-foreground"
                          >
                            {h}
                          </span>
                        ))}
                        {project.highlights.length > 4 && (
                          <span className="text-3xs text-muted-foreground self-center">
                            +{project.highlights.length - 4}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center py-3">
                      <Switch
                        checked={project.enabled}
                        onCheckedChange={() =>
                          handleToggle(project.id)
                        }
                        disabled={isRowPending}
                        aria-label={
                          project.enabled ? t.hide : t.show
                        }
                      />
                    </TableCell>

                    <TableCell className="text-right py-3">
                      <ButtonGroup className="justify-end">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-7"
                          onClick={() => openEdit(project)}
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
                                {t.deleteTitleName.replace("{title}", project.title)}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.deleteBody}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(project.id)}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? t.dialogEdit : t.dialogAdd}
            </DialogTitle>
            <DialogDescription>
              {editTarget ? t.dialogEditBody : t.dialogAddBody}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            initial={
              editTarget
                ? {
                    title: editTarget.title,
                    description: editTarget.description,
                    highlights: editTarget.highlights.join(", "),
                    live: editTarget.live ?? "",
                    github: editTarget.github ?? "",
                  }
                : emptyForm
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setDialog((prev) => ({ ...prev, open: false }))}
            submitting={save.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
