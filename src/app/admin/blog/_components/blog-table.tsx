"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminBlogPost } from "@/lib/blog-admin";
import {
  ArrowSquareOutIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/shared/icons";
import { cn } from "@/lib/cn";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";

export function BlogTable({
  posts,
  pendingSlug,
  onEdit,
  onDelete,
}: {
  posts: AdminBlogPost[];
  pendingSlug: string | null;
  onEdit: (slug: string) => void;
  onDelete: (slug: string) => void;
}) {
  const t = useDictionary().admin.blog.posts;

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.colTitle}</TableHead>
            <TableHead>{t.colDate}</TableHead>
            <TableHead>{t.colCategory}</TableHead>
            <TableHead>{t.colLang}</TableHead>
            <TableHead className="text-right">{t.colReads}</TableHead>
            <TableHead className="text-right">{t.colActions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => {
            const isRowPending = pendingSlug === post.slug;
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
                    <TypographySmall asChild>
                      <Link
                        href={`/admin/blog/${post.slug}`}
                        className="hover:underline"
                      >
                        {post.title || post.slug}
                      </Link>
                    </TypographySmall>
                    {post.author && (
                      <Badge
                        variant="secondary"
                        className="w-fit px-1.5 py-0 h-4 text-3xs"
                      >
                        {t.autopilotBadge}
                      </Badge>
                    )}
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
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {post.reads}
                  </span>
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
                      onClick={() => onEdit(post.slug)}
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
                            onClick={() => onDelete(post.slug)}
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
  );
}
