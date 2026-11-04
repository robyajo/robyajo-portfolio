"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedContent } from "@/components/chat/formatted-content";
import { Reasoning } from "@/components/ui/reasoning";
import { parseAiResponse } from "@/lib/parse-ai-response";
import {
  Trace,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
} from "@/components/ui/trace";
import {
  PaperPlaneTiltIcon,
  StopIcon,
  TrashIcon,
  SparkleIcon,
  CheckIcon,
  CopyIcon,
  ChatCircleIcon,
} from "@/components/shared/icons";
import { cn } from "@/lib/cn";
import { useMarkasChat, type TracerStep } from "./markas-chat-state";

// In-line Stack Trace Component for Assistant Bubble
function MarkasStackTrace({
  steps,
  isRunning,
}: {
  steps: TracerStep[];
  isRunning?: boolean;
}) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const totalCount = steps.length;
  const isAllDone = completedCount === totalCount && totalCount > 0;
  const currentRunningStep = steps.find((s) => s.status === "running");

  return (
    <div className="mb-2.5 rounded-xl border border-white/15 bg-black/55 p-2 font-mono text-slate-200 shadow-xl backdrop-blur-md">
      <TraceCollapsible defaultOpen={isRunning || !isAllDone}>
        <div className="flex items-center justify-between">
          <TraceCollapsibleTrigger className="w-full justify-between py-1 px-1 text-slate-300 hover:text-white">
            <div className="flex items-center gap-2 text-[11px] font-semibold min-w-0 pr-2">
              <span className="flex h-2 w-2 relative shrink-0">
                {isRunning ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </>
                ) : isAllDone ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400" />
                )}
              </span>
              <span className="font-bold text-white tracking-wide truncate">
                ⚡ Stack Trace:{" "}
                {currentRunningStep ? (
                  <span className="text-amber-300 font-semibold animate-pulse">
                    [{currentRunningStep.agentName} Sedang Bekerja]
                  </span>
                ) : isAllDone ? (
                  <span className="text-emerald-400 font-normal">8/8 Agen Tuntas Eksekusi</span>
                ) : (
                  "Alur Kerja Multi-Agen"
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-auto">
                ({completedCount}/{totalCount})
              </span>
            </div>
          </TraceCollapsibleTrigger>
        </div>

        {/* Banner spesifik: apa yang sedang dilakukan agen saat ini */}
        {currentRunningStep && isRunning && (
          <div className="mx-1 mt-1.5 mb-2 rounded-lg bg-amber-500/20 border border-amber-500/40 p-2 text-xs flex items-center gap-2 animate-pulse">
            <span className="text-base">{currentRunningStep.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-200 text-[11px]">
                  {currentRunningStep.agentName}
                </span>
                <span className="rounded bg-amber-400/20 px-1 py-0.2 text-[8.5px] font-bold text-amber-300 uppercase">
                  {currentRunningStep.badge}
                </span>
              </div>
              <p className="text-[10.5px] text-amber-100/90 leading-snug mt-0.5">
                ⚡ Sedang Melakukan: <strong className="text-white">{currentRunningStep.actionText}</strong>
              </p>
            </div>
          </div>
        )}

        <TraceCollapsibleContent className="border-t border-white/10 bg-slate-950/85 p-2 mt-1.5 rounded-lg">
          <Trace className="gap-1.5">
            {steps.map((step) => {
              const isCurrent = step.status === "running";
              const isDone = step.status === "completed";

              return (
                <TraceLine
                  key={step.id}
                  status={step.status}
                  className={cn(
                    "w-full justify-between p-1.5 rounded-md transition-all text-slate-200",
                    isCurrent
                      ? "bg-amber-500/25 border border-amber-500/50 shadow-sm"
                      : isDone
                        ? "bg-white/[0.03] border border-white/5 opacity-85"
                        : "opacity-40 border border-transparent",
                  )}
                >
                  <div className="flex items-start gap-2 min-w-0 pr-2">
                    <TraceIcon className="text-sm shrink-0 mt-0.5">
                      {step.icon}
                    </TraceIcon>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "font-bold text-[11px]",
                            isCurrent
                              ? "text-amber-200"
                              : isDone
                                ? "text-white"
                                : "text-slate-400",
                          )}
                        >
                          {step.agentName}
                        </span>
                        <span className="text-[8.5px] uppercase font-mono px-1 py-0.2 rounded bg-white/10 text-slate-300">
                          {step.badge}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] leading-tight mt-0.5",
                          isCurrent
                            ? "text-slate-100 font-medium"
                            : "text-slate-400",
                        )}
                      >
                        {step.actionText}
                      </span>
                    </div>
                  </div>
                  <TraceDescription>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[8.5px] font-mono font-semibold shrink-0 whitespace-nowrap",
                        isDone
                          ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                          : isCurrent
                            ? "bg-amber-500/35 text-amber-200 animate-pulse border border-amber-500/60 shadow-xs"
                            : "bg-white/5 text-slate-400 border border-white/5",
                      )}
                    >
                      {isDone
                        ? "✓ SELESAI"
                        : isCurrent
                          ? "⚡ SEDANG BEKERJA"
                          : "MENUNGGU"}
                    </span>
                  </TraceDescription>
                </TraceLine>
              );
            })}
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </div>
  );
}

export function MarkasChatPanel({
  className,
  isFloating = false,
  transparent = true,
  onCloseFloating,
}: {
  className?: string;
  isFloating?: boolean;
  transparent?: boolean;
  onCloseFloating?: () => void;
}) {
  const {
    messages,
    loading,
    tracerSteps,
    cooldownSeconds,
    isCooldownActive,
    executeSend,
    handleStop,
    handleClear,
    triggerManualRandomQuip,
  } = useMarkasChat();

  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages arrive or tracer updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, tracerSteps]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    await executeSend(trimmed);
  };

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatCooldown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden shadow-2xl transition-all",
        transparent
          ? "bg-slate-950/45 border border-white/15 backdrop-blur-md text-slate-100 rounded-2xl"
          : "bg-card/95 border border-border/60 backdrop-blur-md rounded-xl",
        isFloating && "rounded-2xl border-white/20",
        className,
      )}
    >
      {/* Panel Header - Video Streaming Overlay Style (No more intrusive tab switching!) */}
      <div
        className={cn(
          "flex items-center justify-between px-3.5 py-2.5 border-b backdrop-blur-sm",
          transparent
            ? "border-white/10 bg-slate-950/60 text-slate-200"
            : "border-border/50 bg-muted/40 text-foreground",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold ml-1 flex items-center gap-1.5 drop-shadow-xs">
            <ChatCircleIcon className="h-3.5 w-3.5 text-primary" />
            <span>Markas Live Stream Chat</span>
          </span>
          <span className="flex h-2 w-2 relative">
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                loading ? "bg-amber-400" : "bg-emerald-400",
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                loading ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
          </span>
          {loading && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-amber-300 border border-amber-500/30 animate-pulse">
              ⚡ Multi-Agen Bekerja
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-100 hover:bg-white/10"
            title="Bersihkan riwayat chat"
          >
            <TrashIcon className="h-3 w-3" />
          </Button>

          {onCloseFloating && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCloseFloating}
              className="h-6 px-1.5 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-white/15"
              title="Sembunyikan Panel Chat"
            >
              <span className="font-bold">✕ Sembunyikan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Cooldown Timer Bar (3 Menit sebelum obrolan santai tim dilanjutkan) */}
      {isCooldownActive && (
        <div className="flex items-center justify-between bg-amber-500/20 border-b border-amber-500/30 px-3.5 py-1.5 text-[11px] font-mono text-amber-300 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>
              Selesai · Cooldown: <strong className="font-bold tabular-nums text-white">{formatCooldown(cooldownSeconds)}</strong>
            </span>
          </div>
          <span className="text-[10px] text-amber-200/80 hidden sm:inline">
            Obrolan santai berlanjut jika tak ada prompt
          </span>
        </div>
      )}

      {/* Messages Scroll Area - Live Stream Chat with In-Line Stack Trace */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3.5 space-y-2.5 font-sans text-xs min-h-[220px]"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const isTeam = msg.role === "team";
          const isLastMessage = index === messages.length - 1;
          const parsed = parseAiResponse(msg.content, loading && msg.role === "assistant");
          const msgTracerSteps = msg.tracerSteps || (isLastMessage && loading && tracerSteps.length > 0 ? tracerSteps : null);

          return (
            <div
              key={msg.id}
              className={cn(
                "group relative flex flex-col gap-1 rounded-xl p-2.5 transition-all shadow-sm",
                transparent
                  ? isUser
                    ? "border border-primary/40 bg-primary/20 text-white ml-4 sm:ml-6 backdrop-blur-xs"
                    : isTeam
                      ? "border border-white/10 bg-slate-900/45 text-slate-100 hover:bg-slate-900/65 backdrop-blur-xs"
                      : "border border-white/15 bg-slate-900/60 text-slate-100 mr-4 sm:mr-6 backdrop-blur-xs"
                  : isUser
                    ? "border border-primary/30 bg-primary/5 ml-4 sm:ml-8"
                    : isTeam
                      ? "border border-border/40 bg-muted/20"
                      : "border border-border/50 bg-card/70 mr-4 sm:mr-8",
              )}
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-mono">
                  {msg.senderIcon && (
                    <span role="img" aria-label={msg.senderName}>
                      {msg.senderIcon}
                    </span>
                  )}
                  <span
                    className="font-bold text-white drop-shadow-xs"
                    style={msg.color ? { color: msg.color } : undefined}
                  >
                    {msg.senderName}
                  </span>
                  {msg.senderBadge && (
                    <span
                      className="rounded px-1.5 py-0.2 text-[8.5px] font-semibold uppercase tracking-wider"
                      style={
                        msg.color
                          ? {
                              backgroundColor: `${msg.color}30`,
                              color: msg.color,
                              borderColor: `${msg.color}50`,
                              borderWidth: "1px",
                            }
                          : undefined
                      }
                    >
                      {msg.senderBadge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                    {msg.timestamp}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white"
                    title="Salin teks"
                  >
                    {copiedId === msg.id ? (
                      <CheckIcon className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <CopyIcon className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Message Content & In-Line Stack Trace */}
              <div className="text-slate-100 leading-relaxed break-words mt-0.5">
                {/* In-Line Stack Trace for Assistant Responses */}
                {msg.role === "assistant" && msgTracerSteps && msgTracerSteps.length > 0 && (
                  <MarkasStackTrace
                    steps={msgTracerSteps}
                    isRunning={loading && isLastMessage && msgTracerSteps.some((s) => s.status === "running")}
                  />
                )}

                {parsed.thinking && (
                  <Reasoning
                    text={parsed.thinking}
                    isStreaming={parsed.isThinkingActive}
                    className="mb-2 text-slate-300"
                  />
                )}

                {isUser || isTeam ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <>
                    <FormattedContent text={parsed.content} />
                    {loading && isLastMessage && !parsed.content && !parsed.thinking && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 py-1 italic">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>Tim markas sedang mengeksekusi instruksi & menyusun respons...</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Box & Action Bar */}
      <div
        className={cn(
          "p-2.5 space-y-2 border-t backdrop-blur-md",
          transparent
            ? "border-white/10 bg-slate-950/60"
            : "border-border/50 bg-muted/30",
        )}
      >
        {/* Quick Trigger Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px] font-mono scrollbar-none">
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-6 px-2 text-[10px]",
              transparent
                ? "bg-slate-900/60 border-white/15 text-slate-200 hover:bg-slate-800/80 hover:text-white"
                : "bg-background/80",
            )}
            onClick={() => triggerManualRandomQuip()}
          >
            <SparkleIcon className="mr-1 h-2.5 w-2.5 text-primary" />
            Obrolan Tim
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-6 px-2 text-[10px]",
              transparent
                ? "bg-slate-900/60 border-white/15 text-slate-200 hover:bg-slate-800/80 hover:text-white"
                : "bg-background/80",
            )}
            onClick={() => void executeSend("Periksa status seluruh 25+ proyek portofolio Roby Karti S.")}
          >
            📋 QC Proyek
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-6 px-2 text-[10px]",
              transparent
                ? "bg-slate-900/60 border-white/15 text-slate-200 hover:bg-slate-800/80 hover:text-white"
                : "bg-background/80",
            )}
            onClick={() => void executeSend("Optimasi backend database Postgres dan REST API Go.")}
          >
            🐹 Backend Go
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "h-6 px-2 text-[10px]",
              transparent
                ? "bg-slate-900/60 border-white/15 text-slate-200 hover:bg-slate-800/80 hover:text-white"
                : "bg-background/80",
            )}
            onClick={() => void executeSend("Audit keamanan WAF, OWASP hardening dan mitigasi DDoS.")}
          >
            🛡️ Security WAF
          </Button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik instruksi prompt (Kurir & tracer akan aktif)..."
            className={cn(
              "h-8 text-xs font-mono",
              transparent
                ? "bg-slate-900/70 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-primary/60"
                : "bg-background/90",
            )}
            disabled={loading}
          />
          {loading ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleStop}
              className="h-8 px-2.5 text-xs font-mono shrink-0"
            >
              <StopIcon className="h-3.5 w-3.5 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim()}
              className="h-8 px-3 text-xs font-mono bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              <PaperPlaneTiltIcon className="h-3.5 w-3.5 mr-1" />
              Kirim
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
