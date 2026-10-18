"use client";

import { useState } from "react";
import Link from "next/link";
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
import { ProjectActivities } from "@/app/admin/projects/activities";
import {
  ProjectForm,
  parseProjectHighlights,
  type ProjectFormData,
} from "@/app/admin/projects/_components/shredForm";
import { cn } from "@/lib/cn";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";

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

  function handleFormSubmit(form: ProjectFormData) {
    save.mutate({
      title: form.title.trim(),
      slug: form.slug.trim(),
      syncKey: form.syncKey.trim(),
      description: form.description.trim(),
      highlights: parseProjectHighlights(form.highlights),
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
              {t.add}
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
                          <Link
                            href={`/admin/projects/${project.id}`}
                            aria-label={t.openDetail}
                            className="text-sm font-semibold leading-tight hover:underline underline-offset-4"
                          >
                            {project.title}
                          </Link>
                          {!project.enabled && (
                            <Badge
                              variant="outline"
                              className="text-3xs px-1.5 py-0 h-4"
                            >
                              {t.hidden}
                            </Badge>
                          )}
                          {project.syncKey ? (
                            <Badge
                              variant="secondary"
                              className="text-3xs px-1.5 py-0 h-4"
                            >
                              {t.syncOn} · {project.activityCount}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-3xs px-1.5 py-0 h-4"
                            >
                              {t.syncOff}
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
                    slug: editTarget.slug,
                    syncKey: editTarget.syncKey ?? "",
                    description: editTarget.description,
                    highlights: editTarget.highlights.join(", "),
                    live: editTarget.live ?? "",
                    github: editTarget.github ?? "",
                  }
                : {
                    title: "",
                    slug: "",
                    syncKey: "",
                    description: "",
                    highlights: "",
                    live: "",
                    github: "",
                  }
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setDialog((prev) => ({ ...prev, open: false }))}
            submitting={save.isPending}
          />
          {editTarget?.syncKey && (
            <div className="mt-4">
              <ProjectActivities
                key={editTarget.id}
                syncKey={editTarget.syncKey}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
