"use client";

import Link from "next/link";
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
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/shared/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ProjectRow } from "@/app/admin/actions";
import { cn } from "@/lib/cn";
import { TypographyMuted } from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";

export function ProjectTable({
  projects,
  pendingId,
  onMove,
  onToggle,
  onEdit,
  onDelete,
}: {
  projects: ProjectRow[];
  pendingId: number | null;
  onMove: (id: number, direction: "up" | "down") => void;
  onToggle: (id: number) => void;
  onEdit: (project: ProjectRow) => void;
  onDelete: (id: number) => void;
}) {
  const t = useDictionary().admin.projects;

  return (
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
          {projects.map((project, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === projects.length - 1;
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
                      onClick={() => onMove(project.id, "up")}
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
                      onClick={() => onMove(project.id, "down")}
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
                        <Badge variant="outline" size="tiny">
                          {t.hidden}
                        </Badge>
                      )}
                      {project.repoVisibility === "private" && (
                        <Badge variant="warning" size="tiny">
                          {t.repoVisibilityPrivate}
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
                    onCheckedChange={() => onToggle(project.id)}
                    disabled={isRowPending}
                    aria-label={project.enabled ? t.hide : t.show}
                  />
                </TableCell>

                <TableCell className="text-right py-3">
                  <ButtonGroup className="justify-end">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-7"
                      onClick={() => onEdit(project)}
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
                            onClick={() => onDelete(project.id)}
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
  );
}
