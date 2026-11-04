"use client";

import * as React from "react";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import {
  CheckCircleIcon,
  SparkleIcon,
  SpinnerIcon,
} from "@/components/shared/icons";
import { cn } from "@/lib/cn";

interface ReasoningProps {
  text: string;
  isStreaming?: boolean;
  durationSeconds?: number;
  className?: string;
}

export function Reasoning({
  text,
  isStreaming = false,
  durationSeconds,
  className,
}: ReasoningProps) {
  // Default to open while streaming, closed once finished
  const [open, setOpen] = React.useState<boolean>(isStreaming);

  // When streaming starts or completes, sync open state if user hasn't explicitly overridden
  React.useEffect(() => {
    if (isStreaming) {
      setOpen(true);
    }
  }, [isStreaming]);

  if (!text && !isStreaming) {
    return null;
  }

  const line = (
    <TraceLine
      status={isStreaming ? "running" : "completed"}
      className="rounded px-1.5 py-0.5 hover:bg-muted/60 transition-colors"
    >
      <TraceIcon>
        {isStreaming ? (
          <SpinnerIcon className="size-3.5 animate-spin text-(--brand-text)" />
        ) : (
          <CheckCircleIcon className="size-3.5 text-emerald-500 dark:text-emerald-400" />
        )}
      </TraceIcon>
      <TraceTitle className="flex items-center gap-1.5">
        <span className={cn(isStreaming && "animate-pulse text-(--brand-text)")}>
          {isStreaming ? "Sedang Berpikir (Reasoning)..." : "Proses Berpikir (Chain of Thought)"}
        </span>
      </TraceTitle>
      {durationSeconds !== undefined && durationSeconds > 0 && !isStreaming && (
        <TraceDescription>{durationSeconds.toFixed(1)}s</TraceDescription>
      )}
    </TraceLine>
  );

  if (!text) {
    return (
      <Trace className={cn("my-1.5", className)}>
        {line}
      </Trace>
    );
  }

  return (
    <Trace className={cn("my-1.5", className)}>
      <TraceCollapsible open={open} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger className="hover:opacity-100">
          {line}
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="whitespace-pre-wrap font-mono text-2xs leading-relaxed max-h-60 overflow-y-auto overscroll-contain bg-muted/30 border-border/60">
          {text}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
