"use client";

import { MarkasChatPanel } from "./markas-chat-panel";
import type { AgentWorkStatus } from "./markas-canvas";

interface MarkasTerminalProps {
  onStatusChange?: (status: AgentWorkStatus) => void;
  onTaskChange?: (task: string | null) => void;
  className?: string;
}

export function MarkasTerminal({
  className,
}: MarkasTerminalProps) {
  return (
    <MarkasChatPanel className={className} />
  );
}
