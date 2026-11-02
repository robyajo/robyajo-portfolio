"use client";

import React from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRightIcon } from "@/components/shared/icons";
import { CodeBlock } from "./code-block";
import { cn } from "@/lib/cn";

interface FormattedContentProps {
  text: string;
  onNavigate?: (href: string) => void;
  className?: string;
}

interface InlineToken {
  type: "text" | "bold" | "code" | "link";
  text?: string;
  label?: string;
  href?: string;
  bold?: boolean;
}

function parseInlineTokens(line: string): InlineToken[] {
  // Regex pattern matching:
  // 1. Bold or italic markdown links: **[label](url)** or *[label](url)*
  // 2. Standard markdown links: [label](url)
  // 3. Bold text: **text**
  // 4. Inline code: `code`
  // 5. Standalone URL or internal routes: /(about|projects|resume|blogs|now|uses|activity|guestbook|changelog|branding|contact|privacy-policy)\b
  const regex =
    /(\*{1,2}\[[^\]]+\]\([^)]+\)\*{1,2}|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|(?:https?:\/\/[^\s)]+|\/(?:about|projects|resume|blogs|now|uses|activity|guestbook|changelog|branding|contact|privacy-policy)\b))/g;

  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        text: line.slice(lastIndex, match.index),
      });
    }

    const token = match[0];

    // Case 1: **[label](url)**
    const boldLinkMatch = token.match(/^\*\*\[([^\]]+)\]\(([^)]+)\)\*\*$/);
    if (boldLinkMatch) {
      tokens.push({
        type: "link",
        label: boldLinkMatch[1],
        href: boldLinkMatch[2].trim(),
        bold: true,
      });
      lastIndex = match.index + token.length;
      continue;
    }

    // Case 2: [label](url)
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      let label = linkMatch[1];
      let isBold = false;
      if (label.startsWith("**") && label.endsWith("**")) {
        label = label.slice(2, -2);
        isBold = true;
      }
      tokens.push({
        type: "link",
        label,
        href: linkMatch[2].trim(),
        bold: isBold,
      });
      lastIndex = match.index + token.length;
      continue;
    }

    // Case 3: **bold**
    if (token.startsWith("**") && token.endsWith("**")) {
      tokens.push({
        type: "bold",
        text: token.slice(2, -2),
      });
      lastIndex = match.index + token.length;
      continue;
    }

    // Case 4: `code`
    if (token.startsWith("`") && token.endsWith("`")) {
      tokens.push({
        type: "code",
        text: token.slice(1, -1),
      });
      lastIndex = match.index + token.length;
      continue;
    }

    // Case 5: Standalone raw link/route (e.g. /about or https://...)
    if (token.startsWith("/") || token.startsWith("http")) {
      tokens.push({
        type: "link",
        label: token,
        href: token,
        bold: false,
      });
      lastIndex = match.index + token.length;
      continue;
    }

    tokens.push({ type: "text", text: token });
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    tokens.push({ type: "text", text: line.slice(lastIndex) });
  }

  return tokens;
}

function InlineRenderer({
  tokens,
  onNavigate,
}: {
  tokens: InlineToken[];
  onNavigate?: (href: string) => void;
}) {
  return (
    <>
      {tokens.map((token, idx) => {
        if (token.type === "bold") {
          return (
            <strong key={idx} className="font-semibold text-inherit">
              {token.text}
            </strong>
          );
        }

        if (token.type === "code") {
          return (
            <code
              key={idx}
              className="rounded border border-border/80 bg-muted/80 dark:bg-muted/50 px-1.5 py-0.5 font-mono text-2xs text-inherit"
            >
              {token.text}
            </code>
          );
        }

        if (token.type === "link" && token.href) {
          const isInternal =
            token.href.startsWith("/") || token.href.startsWith("#");

          if (isInternal) {
            return (
              <Link
                key={idx}
                href={token.href as Route}
                onClick={() => onNavigate?.(token.href!)}
                className="group/link my-0.5 inline-flex items-center gap-1.5 rounded border border-(--brand-text)/30 bg-muted/60 px-2 py-0.5 font-mono text-xs font-medium text-(--brand-text) no-underline transition-all duration-150 hover:border-(--brand-text) hover:bg-muted hover:shadow-2xs active:scale-95"
              >
                <span className="font-pixel text-3xs font-semibold text-(--brand-text)/70 group-hover/link:text-(--brand-text) select-none">
                  ›
                </span>
                <span className={token.bold ? "font-bold text-foreground" : undefined}>
                  {token.label}
                </span>
                <ArrowUpRightIcon className="size-3 shrink-0 opacity-70 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:opacity-100" />
              </Link>
            );
          }

          return (
            <a
              key={idx}
              href={token.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-(--brand-text) underline underline-offset-3 transition-colors hover:text-(--brand-text)/80"
            >
              <span className={token.bold ? "font-bold" : undefined}>
                {token.label}
              </span>
              <ArrowUpRightIcon className="size-3 shrink-0 opacity-70" />
            </a>
          );
        }

        return <React.Fragment key={idx}>{token.text}</React.Fragment>;
      })}
    </>
  );
}

type ContentBlock =
  | { type: "header"; level: number; text: string }
  | { type: "blockquote"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "numbered"; items: { num: string; text: string }[] }
  | { type: "paragraph"; lines: string[] };

function groupLinesIntoBlocks(rawText: string): ContentBlock[] {
  const lines = rawText.split("\n");
  const blocks: ContentBlock[] = [];
  let currentList: ContentBlock | null = null;
  let currentParagraph: string[] = [];

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      blocks.push({ type: "paragraph", lines: [...currentParagraph] });
      currentParagraph = [];
    }
  }

  function flushList() {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Headers: #, ##, ###, ####
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "header",
        level: headerMatch[1].length,
        text: headerMatch[2],
      });
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "blockquote",
        text: trimmed.replace(/^>\s?/, ""),
      });
      continue;
    }

    // Bullet items: *, -, •
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "bullet") {
        flushList();
        currentList = { type: "bullet", items: [] };
      }
      (currentList as { type: "bullet"; items: string[] }).items.push(
        bulletMatch[1],
      );
      continue;
    }

    // Numbered items: 1. text, 2) text
    const numMatch = trimmed.match(/^(\d+)[\.)]\s+(.+)$/);
    if (numMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "numbered") {
        flushList();
        currentList = { type: "numbered", items: [] };
      }
      (
        currentList as {
          type: "numbered";
          items: { num: string; text: string }[];
        }
      ).items.push({ num: numMatch[1], text: numMatch[2] });
      continue;
    }

    // Regular paragraph text line
    flushList();
    currentParagraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function FormattedContent({
  text,
  onNavigate,
  className,
}: FormattedContentProps) {
  // Split segments by code fences: ```lang\ncode\n```
  const segments = text.split(/(```[a-zA-Z0-9_-]*\n[\s\S]*?```)/g);

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 leading-relaxed text-inherit",
        className,
      )}
    >
      {segments.map((segment, sIdx) => {
        // Code Block
        const codeMatch = segment.match(
          /^```([a-zA-Z0-9_-]*)\n([\s\S]*?)```$/,
        );
        if (codeMatch) {
          const [, lang, code] = codeMatch;
          return (
            <CodeBlock key={sIdx} language={lang || "code"} code={code} />
          );
        }

        // Markdown Blocks
        const blocks = groupLinesIntoBlocks(segment);
        return (
          <React.Fragment key={sIdx}>
            {blocks.map((block, bIdx) => {
              if (block.type === "header") {
                const Tag =
                  block.level === 1
                    ? "h2"
                    : block.level === 2
                    ? "h3"
                    : "h4";
                return (
                  <div key={bIdx} className="mt-3 first:mt-0 pt-0.5">
                    <Tag className="flex items-center gap-2 border-l-2 border-(--brand-text) pl-2.5 font-display text-sm font-bold tracking-tight text-foreground">
                      <span className="font-pixel text-3xs uppercase tracking-widest text-(--brand-text)/70 select-none">
                        // 0{block.level}
                      </span>
                      <span>
                        <InlineRenderer
                          tokens={parseInlineTokens(block.text)}
                          onNavigate={onNavigate}
                        />
                      </span>
                    </Tag>
                  </div>
                );
              }

              if (block.type === "blockquote") {
                return (
                  <blockquote
                    key={bIdx}
                    className="my-1.5 rounded-r-md border-l-2 border-(--brand-text) bg-muted/30 py-1.5 pl-3 pr-2.5 font-mono text-xs text-foreground/90"
                  >
                    <p>
                      <InlineRenderer
                        tokens={parseInlineTokens(block.text)}
                        onNavigate={onNavigate}
                      />
                    </p>
                  </blockquote>
                );
              }

              if (block.type === "bullet") {
                return (
                  <ul key={bIdx} className="my-1 space-y-1.5 pl-0.5">
                    {block.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rotate-45 border border-(--brand-text) bg-(--brand-text)/80 shadow-2xs select-none" />
                        <span className="min-w-0 flex-1">
                          <InlineRenderer
                            tokens={parseInlineTokens(item)}
                            onNavigate={onNavigate}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              }

              if (block.type === "numbered") {
                return (
                  <ol key={bIdx} className="my-1 space-y-1.5 pl-0.5">
                    {block.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 font-pixel text-3xs font-semibold tracking-wider text-(--brand-text) select-none">
                          [{item.num.padStart(2, "0")}]
                        </span>
                        <span className="min-w-0 flex-1">
                          <InlineRenderer
                            tokens={parseInlineTokens(item.text)}
                            onNavigate={onNavigate}
                          />
                        </span>
                      </li>
                    ))}
                  </ol>
                );
              }

              // Paragraph
              return (
                <p key={bIdx} className="leading-relaxed">
                  {block.lines.map((line, lIdx) => (
                    <React.Fragment key={lIdx}>
                      {lIdx > 0 && <br />}
                      <InlineRenderer
                        tokens={parseInlineTokens(line)}
                        onNavigate={onNavigate}
                      />
                    </React.Fragment>
                  ))}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}
