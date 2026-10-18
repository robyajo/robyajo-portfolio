"use client";

import Link from "next/link";
import type { AdminBlogPostSource } from "@/app/admin/blog/actions";
import type { AdminBlogPost } from "@/lib/blog-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  PencilIcon,
} from "@/components/shared/icons";
import { TypographyMuted } from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";

type Labels = ReturnType<typeof useDictionary>["admin"]["blog"]["posts"];

export function BlogPostDetail({
  post,
  source,
}: {
  post: AdminBlogPost;
  source: AdminBlogPostSource | null;
}) {
  const t = useDictionary().admin.blog.posts;

  return (
    <div className="flex max-w-full flex-col gap-6">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
        {t.backToList}
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold leading-tight">
            {source?.id.title || post.title || post.slug}
          </h2>
          {post.author ? (
            <Badge variant="secondary" size="tiny">
              {t.autopilotBadge}
            </Badge>
          ) : (
            <Badge variant="outline" size="tiny">
              {t.manualBadge}
            </Badge>
          )}
          {post.hasEnglish && (
            <Badge variant="outline" size="tiny">
              {t.englishBadge}
            </Badge>
          )}
        </div>
        <TypographyMuted asChild>
          <span className="font-mono text-xs">/blog/{post.slug}</span>
        </TypographyMuted>
        {source?.id.description && (
          <TypographyMuted asChild>
            <span className="max-w-2xl text-sm">
              {source.id.description}
            </span>
          </TypographyMuted>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-6 sm:flex-row">
        <DescriptionList post={post} t={t} />

        <div className="flex flex-col gap-2 sm:ml-auto">
          <Button variant="secondary" size="sm" asChild>
            <a href={post.url} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOutIcon
                data-icon="inline-start"
                className="size-3.5"
                aria-hidden="true"
              />
              {t.view}
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/admin/blog?edit=${post.slug}`}>
              <PencilIcon
                data-icon="inline-start"
                className="size-3.5"
                aria-hidden="true"
              />
              {t.edit}
            </Link>
          </Button>
        </div>
      </div>

      {source && <BodyPreview content={source} t={t} />}
    </div>
  );
}

function DescriptionList({ post, t }: { post: AdminBlogPost; t: Labels }) {
  const rows: Array<[string, string | null]> = [
    [t.detailDate, post.date],
    [t.detailCategory, post.category],
    [t.detailOrigin, post.author ? t.autopilotBadge : t.manualBadge],
    [t.detailEnglish, post.hasEnglish ? (post.translation ?? "✓") : "—"],
  ];

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm sm:min-w-72">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value ?? "—"}</dd>
        </div>
      ))}
      <dt className="self-start text-muted-foreground">{t.detailTags}</dt>
      <dd className="flex min-w-0 flex-wrap gap-1">
        {post.tags.length > 0 ? (
          post.tags.map((tag) => (
            <TypographyMuted key={tag} asChild>
              <span className="rounded bg-muted px-1.5 py-0.5 text-3xs">
                {tag}
              </span>
            </TypographyMuted>
          ))
        ) : (
          <span>—</span>
        )}
      </dd>
    </dl>
  );
}

function BodyPreview({
  content,
  t,
}: {
  content: AdminBlogPostSource;
  t: Labels;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{t.detailPreview}</h3>
      <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs whitespace-pre-wrap">
        {content.id.body || "—"}
      </pre>
    </div>
  );
}
