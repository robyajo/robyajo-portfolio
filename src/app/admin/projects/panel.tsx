"use client";

import { useState } from "react";
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
import { PlusIcon, FolderOpenIcon } from "@/components/shared/icons";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ProjectActivities } from "@/app/admin/projects/activities";
import {
  ProjectForm,
  parseProjectHighlights,
  type ProjectFormData,
} from "@/app/admin/projects/_components/shredForm";
import { ProjectTable } from "@/app/admin/projects/_components/project-table";
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
        <ProjectTable
          projects={sorted}
          pendingId={pendingId}
          onMove={handleMove}
          onToggle={handleToggle}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
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
