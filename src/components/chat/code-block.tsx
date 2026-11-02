"use client";

import { useState } from "react";
import { CheckIcon, CodeIcon, CopyIcon } from "@/components/shared/icons";
import { useDictionary } from "@/lib/i18n/provider";

export function formatLanguageName(lang: string): string {
  const normalized = lang.trim().toLowerCase();
  switch (normalized) {
    case "ts":
    case "typescript":
      return "TypeScript";
    case "tsx":
      return "React TSX";
    case "js":
    case "javascript":
      return "JavaScript";
    case "jsx":
      return "React JSX";
    case "php":
      return "PHP";
    case "go":
    case "golang":
      return "Go";
    case "py":
    case "python":
      return "Python";
    case "bash":
    case "sh":
    case "shell":
    case "zsh":
      return "Bash";
    case "json":
      return "JSON";
    case "sql":
      return "SQL";
    case "html":
      return "HTML";
    case "css":
      return "CSS";
    case "scss":
      return "SCSS";
    case "yaml":
    case "yml":
      return "YAML";
    case "md":
    case "markdown":
      return "Markdown";
    case "c":
      return "C";
    case "cpp":
    case "c++":
      return "C++";
    case "rust":
    case "rs":
      return "Rust";
    default:
      return normalized ? normalized.toUpperCase() : "Code";
  }
}

export function HighlightedLine({ text }: { text: string }) {
  if (!text) return <span>{"\n"}</span>;

  const trimmed = text.trim();
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*")
  ) {
    return <span className="text-muted-foreground/80 italic">{text}</span>;
  }

  // Tokenizer pattern for keywords, strings, types, numbers, functions
  const tokenRegex =
    /(\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:function|const|let|var|class|return|if|else|import|export|from|async|await|try|catch|finally|throw|new|typeof|interface|type|extends|implements|public|private|protected|static|readonly|namespace|package|use|fn|def|func|struct|select|where|order|by|group|echo|die|exit)\b|\b(?:string|number|boolean|any|void|never|null|undefined|Array|Promise|Record|Response|Request|Date|Error|Object|int|int64|float|bool|byte)\b|\b(?:true|false|null|undefined|nil)\b|\b\d+(?:\.\d+)?\b|[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("//")) {
      parts.push(
        <span key={match.index} className="text-muted-foreground/80 italic">
          {token}
        </span>,
      );
    } else if (
      token.startsWith('"') ||
      token.startsWith("'") ||
      token.startsWith("`")
    ) {
      parts.push(
        <span key={match.index} className="text-(--brand-text) font-medium">
          {token}
        </span>,
      );
    } else if (
      /^(function|const|let|var|class|return|if|else|import|export|from|async|await|try|catch|finally|throw|new|typeof|interface|type|extends|implements|public|private|protected|static|readonly|namespace|package|use|fn|def|func|struct|select|where|order|by|group|echo|die|exit)$/.test(
        token,
      )
    ) {
      parts.push(
        <span
          key={match.index}
          className="text-indigo-600 dark:text-indigo-400 font-semibold"
        >
          {token}
        </span>,
      );
    } else if (
      /^(string|number|boolean|any|void|never|null|undefined|Array|Promise|Record|Response|Request|Date|Error|Object|int|int64|float|bool|byte)$/.test(
        token,
      )
    ) {
      parts.push(
        <span key={match.index} className="text-sky-600 dark:text-sky-400">
          {token}
        </span>,
      );
    } else if (/^(true|false|null|undefined|nil)$/.test(token)) {
      parts.push(
        <span
          key={match.index}
          className="text-rose-600 dark:text-rose-400 font-semibold"
        >
          {token}
        </span>,
      );
    } else if (/^\d+(\.\d+)?$/.test(token)) {
      parts.push(
        <span key={match.index} className="text-amber-600 dark:text-amber-400">
          {token}
        </span>,
      );
    } else {
      // Function call
      parts.push(
        <span
          key={match.index}
          className="text-violet-600 dark:text-violet-400 font-medium"
        >
          {token}
        </span>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const dict = useDictionary();
  const chatDict = dict.chat;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = code.replace(/\n$/, "").split("\n");
  const displayLang = formatLanguageName(language);

  return (
    <div className="my-2.5 overflow-hidden rounded-xl border border-border/80 bg-muted/40 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/70 px-3 py-1.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="size-2 rounded-full bg-rose-500/80" />
            <span className="size-2 rounded-full bg-amber-500/80" />
            <span className="size-2 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1.5">
            <CodeIcon className="size-3.5 text-(--brand-text)" />
            <span className="font-pixel text-3xs uppercase tracking-widest font-semibold text-foreground">
              {displayLang}
            </span>
            <span className="font-pixel text-3xs uppercase tracking-wider text-muted-foreground/70">
              // {lines.length} {lines.length === 1 ? "LOC" : "LINES"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded border border-border/60 bg-background/60 px-2 py-0.5 font-pixel text-3xs uppercase tracking-wider text-muted-foreground transition-all hover:border-(--brand-text)/50 hover:bg-muted hover:text-foreground active:scale-95 shadow-2xs"
          title={
            copied
              ? chatDict.copiedCode || "Tersalin!"
              : chatDict.copyCode || "Salin Kode"
          }
        >
          {copied ? (
            <>
              <CheckIcon className="size-3 text-(--brand-text)" />
              <span className="text-(--brand-text)">
                {chatDict.copiedCode || "COPIED"}
              </span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3" />
              <span>{chatDict.copyCode || "COPY"}</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
        <pre className="grid grid-cols-[auto_1fr] gap-x-3">
          {lines.map((line, idx) => (
            <span key={idx} className="contents group/line">
              <span className="select-none pr-2.5 text-right font-mono text-3xs text-muted-foreground/40 border-r border-border/40 group-hover/line:text-muted-foreground">
                {idx + 1}
              </span>
              <span className="min-w-0 pl-1 whitespace-pre">
                <HighlightedLine text={line} />
              </span>
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}
