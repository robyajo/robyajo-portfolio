"use client";

import { useDictionary } from "@/lib/i18n/provider";
import { RobotAgentAnimation } from "./robot-agent-animation";

interface FloatingChatTriggerProps {
  onClick: () => void;
}

export function FloatingChatTrigger({ onClick }: FloatingChatTriggerProps) {
  const dict = useDictionary();
  const chatDict = dict.chat;

  return (
    <div className="fixed bottom-20 right-4 z-40 print:hidden">
      <button
        type="button"
        onClick={onClick}
        aria-label={chatDict.title}
        className="group relative flex items-center gap-2.5 rounded-full border border-border/90 bg-card/95 p-1.5 pr-4 shadow-xl backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:border-foreground/30 hover:shadow-2xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/80 shadow-xs transition-transform duration-300 group-hover:rotate-6">
          <RobotAgentAnimation
            variant="avatar"
            size={28}
            state="idle"
            interactive={false}
          />
          <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--available) opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full border-2 border-background bg-(--available)" />
          </span>
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-tight text-foreground">
              {chatDict.title}
            </span>
            <span className="rounded border border-(--brand)/30 bg-(--brand)/15 px-1.5 py-0.2 font-pixel text-3xs font-semibold uppercase tracking-widest text-(--brand-text)">
              {chatDict.triggerBadge || "ER AI"}
            </span>
          </div>
          <span className="font-mono text-3xs text-muted-foreground transition-colors group-hover:text-foreground">
            // {chatDict.triggerSubtitle || "Tanya apa saja"}
          </span>
        </div>
      </button>
    </div>
  );
}
