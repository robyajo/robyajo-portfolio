"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CaretRightIcon } from "@/components/shared/icons";

function Trace({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="trace"
      className={cn(
        "flex w-full min-w-0 flex-col gap-1 *:has-[>[data-slot=trace-line]]:flex *:has-[>[data-slot=trace-line]]:w-fit *:has-[>[data-slot=trace-line]]:max-w-full *:has-[>[data-slot=trace-line]]:min-w-0 *:has-[>[data-slot=trace-line]]:text-left *:has-[>[data-slot=trace-line]]:outline-none",
        className,
      )}
      {...props}
    />
  );
}

function TraceLine({
  className,
  status,
  ...props
}: React.ComponentProps<"span"> & {
  status?: "running" | "error" | "pending" | "completed";
}) {
  return (
    <span
      data-slot="trace-line"
      data-status={status}
      className={cn(
        "flex w-fit max-w-full min-w-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors in-[a,button]:cursor-pointer in-[a:hover,button:hover]:text-foreground data-[status=error]:text-destructive data-[status=error]:in-[a:hover,button:hover]:text-destructive data-[status=pending]:opacity-60 data-[status=running]:text-foreground data-[status=completed]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TraceIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="trace-icon"
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center [&_svg]:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

function TraceTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="trace-title"
      className={cn(
        "min-w-0 truncate font-mono text-2xs font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function TraceDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="trace-description"
      className={cn(
        "shrink-0 font-mono text-3xs text-muted-foreground/70 tabular-nums ml-1.5",
        className,
      )}
      {...props}
    />
  );
}

function TraceCollapsible({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Collapsible>, "asChild" | "open"> &
  (
    | { open?: undefined }
    | {
        open: boolean;
        onOpenChange: NonNullable<
          React.ComponentProps<typeof Collapsible>["onOpenChange"]
        >;
      }
  )) {
  return (
    <Collapsible
      data-slot="trace-collapsible"
      className={cn("flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
}

function TraceCollapsibleTrigger({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CollapsibleTrigger>, "asChild">) {
  return (
    <CollapsibleTrigger
      data-slot="trace-collapsible-trigger"
      className={cn(
        "group/trace-collapsible-trigger flex w-fit max-w-full min-w-0 cursor-pointer items-center text-left text-muted-foreground transition-colors outline-none hover:text-foreground has-[[data-status=error]]:text-destructive",
        className,
      )}
      {...props}
    >
      {children}
      <TraceIcon className="transition-transform duration-200 group-aria-expanded/trace-collapsible-trigger:rotate-90">
        <CaretRightIcon className="size-3" />
      </TraceIcon>
    </CollapsibleTrigger>
  );
}

function TraceCollapsibleContent({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CollapsibleContent>, "asChild">) {
  return (
    <CollapsibleContent
      data-slot="trace-collapsible-content"
      className="min-w-0 overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
      {...props}
    >
      <div
        data-slot="trace-collapsible-content-inner"
        className={cn(
          "min-w-0 break-words rounded-md border border-border/70 bg-muted/40 p-2.5 font-mono text-2xs text-muted-foreground mt-1.5",
          className,
        )}
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

export {
  Trace,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
};
