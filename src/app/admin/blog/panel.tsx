"use client";

import { useState } from "react";
import {
  createBlogPost,
  deleteBlogPost,
  getAdminBlogPosts,
  getAdminBlogTags,
  triggerBlogAutopilot,
  updateBlogPost,
} from "@/app/admin/blog/actions";
import type { AdminBlogPost } from "@/lib/blog-admin";
import { useQuery } from "@tanstack/react-query";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { useSearchParams } from "next/navigation";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileTextIcon, PlayIcon, PlusIcon } from "@/components/shared/icons";
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
import { BlogTable } from "@/app/admin/blog/_components/blog-table";
import {
  BlogPostForm,
  BlogSourceForm,
  emptyBlogValues,
} from "@/app/admin/blog/_components/sharedForm";

export function BlogPostsPanel() {
  const t = useDictionary().admin.blog.posts;
  const notice = useDictionary().admin.blog.notice;
  const editParam = useSearchParams().get("edit") ?? null;
  const { data: posts = [] } = useQuery({
    queryKey: queryKeys.admin.blogPosts,
    queryFn: getAdminBlogPosts,
  });

  const [dialog, setDialog] = useState<{
    open: boolean;
    slug: string | null;
    create: boolean;
  }>(() => ({
    open: Boolean(editParam),
    slug: editParam,
    create: false,
  }));

  const save = useActionMutation({
    action: (values: typeof emptyBlogValues extends () => infer R ? R : never) =>
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

  const trigger = useActionMutation({
    action: triggerBlogAutopilot,
    successMessage: () => "Workflow dipicu! Cek tab Actions di GitHub.",
    invalidate: [],
  });

  const englishCount = posts.filter((post) => post.hasEnglish).length;
  const pendingSlug = remove.isPending ? remove.variables : null;

  function openAdd() {
    setDialog({ open: true, slug: null, create: true });
  }

  function openEdit(slug: string) {
    setDialog({ open: true, slug, create: false });
  }

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
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={trigger.isPending}
            onClick={() => trigger.mutate()}
          >
            <PlayIcon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
            {trigger.isPending ? "Memicu..." : "Trigger Autopilot"}
          </Button>
          <Button
            size="sm"
            disabled={save.isPending || remove.isPending || trigger.isPending}
            onClick={openAdd}
          >
            <PlusIcon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
            {t.add}
          </Button>
        </div>
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
            <Button size="sm" onClick={openAdd}>
              {t.add}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <BlogTable
          posts={posts}
          pendingSlug={pendingSlug}
          onEdit={openEdit}
          onDelete={(slug) => {
            if (pendingSlug === null) remove.mutate(slug);
          }}
        />
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
            <BlogPostForm
              key="new"
              defaultValues={emptyBlogValues()}
              lockSlug={false}
              onSubmit={(values) => save.mutate(values)}
              onCancel={() => setDialog((prev) => ({ ...prev, open: false }))}
              submitting={save.isPending}
            />
          ) : (
            dialog.slug && (
              <BlogSourceForm
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
