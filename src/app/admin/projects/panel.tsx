"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { useDictionary } from "@/lib/i18n/provider";
import { queryKeys } from "@/lib/query-keys";
import {
    createProject,
    createProjectStack,
    getAdminProjectStacks,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    PlusIcon,
    FolderOpenIcon,
    ArrowCounterClockwiseIcon,
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
    ProjectForm,
    formatProjectMetrics,
    parseProjectGallery,
    parseProjectHighlights,
    parseProjectMetrics,
    type ProjectFormData,
} from "@/app/admin/projects/_components/shredForm";
import { ProjectTable } from "@/app/admin/projects/_components/project-table";
import { ProjectFilter } from "@/app/admin/projects/_components/project-filter";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";

export function ProjectsPanel() {
    const { data: projects = [] } = useQuery({
        queryKey: queryKeys.admin.projects,
        queryFn: getAdminProjects,
    });
    const { data: stacks = [] } = useQuery({
        queryKey: queryKeys.admin.projectStacks,
        queryFn: getAdminProjectStacks,
    });
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState<{
        open: boolean;
        target: ProjectRow | null;
    }>({ open: false, target: null });
    const dialogOpen = dialog.open;
    const editTarget = dialog.target;

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"all" | "enabled" | "disabled">("all");
    const [stack, setStack] = useState<string>("all");

    const dict = useDictionary();
    const t = dict.admin.projects;
    const save = useActionMutation({
        action: (data: ProjectInput) =>
            editTarget
                ? updateProject(editTarget.id, data)
                : createProject(data),
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
            liveVisibility: form.liveVisibility,
            github: form.github.trim() || null,
            repoVisibility: form.repoVisibility,
            problem: form.problem.trim(),
            role: form.role.trim(),
            outcome: form.outcome.trim(),
            period: form.period.trim(),
            metrics: parseProjectMetrics(form.metrics),
            gallery: parseProjectGallery(form.gallery),
        });
    }

    async function handleQuickAddStack(name: string) {
        const result = await createProjectStack({
            name,
            description: "",
            sortOrder: 0,
            visible: true,
        });
        if (result.success) {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.admin.projectStacks,
            });
        }
        return result;
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

    function handleResetFilters() {
        setSearch("");
        setStatus("all");
        setStack("all");
    }

    const availableStacks = Array.from(
        new Set(projects.flatMap((p) => p.highlights)),
    ).sort((a, b) => a.localeCompare(b));

    const sorted = [...projects].sort((a, b) => {
        const aTime = a.lastActivityAt
            ? new Date(a.lastActivityAt).getTime()
            : 0;
        const bTime = b.lastActivityAt
            ? new Date(b.lastActivityAt).getTime()
            : 0;
        return bTime - aTime || a.sortOrder - b.sortOrder || a.id - b.id;
    });

    const hasActiveFilter =
        search.trim() !== "" || status !== "all" || stack !== "all";

    const filtered = sorted.filter((p) => {
        if (status === "enabled" && !p.enabled) return false;
        if (status === "disabled" && p.enabled) return false;
        if (stack !== "all" && !p.highlights.includes(stack)) return false;
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            const inTitle = p.title.toLowerCase().includes(q);
            const inSlug = p.slug.toLowerCase().includes(q);
            const inDesc = p.description.toLowerCase().includes(q);
            const inStack = p.highlights.some((h) =>
                h.toLowerCase().includes(q),
            );
            if (!inTitle && !inSlug && !inDesc && !inStack) return false;
        }
        return true;
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <TypographySmall>
                        {t.heading}
                    </TypographySmall>
                    <TypographyMuted
                        role="status"
                        aria-live="polite"
                    >
                        {t.visibleStatus
                            .replace(
                                "{visible}",
                                String(
                                    projects.filter((p) => p.enabled).length,
                                ),
                            )
                            .replace("{total}", String(projects.length))}
                    </TypographyMuted>
                </div>
                <Button size="sm" onClick={openAdd}>
                    <PlusIcon
                        data-icon="inline-start"
                        className="size-3.5"
                        aria-hidden="true"
                    />
                    {t.add}
                </Button>
            </div>

            {sorted.length > 0 && (
                <ProjectFilter
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    stack={stack}
                    onStackChange={setStack}
                    stacks={availableStacks}
                    onReset={handleResetFilters}
                    hasActiveFilter={hasActiveFilter}
                />
            )}

            {sorted.length === 0 ? (
                <Empty bordered>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <FolderOpenIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>{t.emptyTitle}</EmptyTitle>
                        <EmptyDescription>{t.emptyBody}</EmptyDescription>
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
            ) : filtered.length === 0 ? (
                <Empty bordered>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <FolderOpenIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>{t.emptyTitle}</EmptyTitle>
                        <EmptyDescription>{t.noFilteredResults}</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleResetFilters}
                        >
                            <ArrowCounterClockwiseIcon
                                data-icon="inline-start"
                                className="size-3.5"
                                aria-hidden="true"
                            />
                            {t.resetFilter}
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <ProjectTable
                    projects={filtered}
                    pendingId={pendingId}
                    onMove={handleMove}
                    onToggle={handleToggle}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            )}

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) =>
                    setDialog((prev) => ({ ...prev, open }))
                }
            >
                <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
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
                                      highlights:
                                          editTarget.highlights.join(", "),
                                      live: editTarget.live ?? "",
                                      liveVisibility:
                                          editTarget.liveVisibility === "private"
                                              ? "private"
                                              : "public",
                                      github: editTarget.github ?? "",
                                      repoVisibility:
                                          editTarget.repoVisibility === "private"
                                              ? "private"
                                              : "public",
                                      period: editTarget.period ?? "",
                                      problem: editTarget.problem ?? "",
                                      role: editTarget.role ?? "",
                                      outcome: editTarget.outcome ?? "",
                                      metrics: formatProjectMetrics(
                                          editTarget.metrics,
                                      ),
                                      gallery: editTarget.gallery.join("\n"),
                                  }
                                : {
                                      title: "",
                                      slug: "",
                                      syncKey: "",
                                      description: "",
                                      highlights: "",
                                      live: "",
                                      liveVisibility: "public",
                                      github: "",
                                      repoVisibility: "public",
                                      period: "",
                                      problem: "",
                                      role: "",
                                      outcome: "",
                                      metrics: "",
                                      gallery: "",
                                  }
                        }
                        stacks={stacks}
                        submitting={save.isPending}
                        onSubmit={handleFormSubmit}
                        onCancel={() =>
                            setDialog((prev) => ({ ...prev, open: false }))
                        }
                        quickAddStack={handleQuickAddStack}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
