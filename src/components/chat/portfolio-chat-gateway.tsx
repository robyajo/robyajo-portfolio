"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RobotAgentAnimation } from "./robot-agent-animation";
import { FormattedContent } from "./formatted-content";
import { ChatCategoryNav } from "./chat-category-nav";
import { FloatingChatTrigger } from "./floating-chat-trigger";
import {
  ArrowDownIcon,
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  GithubLogoIcon,
  LockKeyIcon,
  PaperPlaneTiltIcon,
  RobotIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StopIcon,
  TrashIcon,
  XIcon,
} from "@/components/shared/icons";
import {
  getChatOpen,
  getChatServerSnapshot,
  setChatOpen,
  subscribeChat,
} from "@/lib/chat-store";
import { useDictionary } from "@/lib/i18n/provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

function ChatInnerGateway({
  onClose,
  isExpanded,
  onToggleExpand,
}: {
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const dict = useDictionary();
  const chatDict = dict.chat;
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Project detection from current page
  const isProjectPage =
    Boolean(pathname?.startsWith("/projects/")) && pathname !== "/projects";
  const currentProjectSlug = isProjectPage
    ? pathname?.replace("/projects/", "").split("/")[0]
    : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(
    null,
  );

  interface ProjectContextData {
    slug: string;
    title: string;
    description: string;
    hasGithub: boolean;
    github: string | null;
    repoVisibility: string;
    isPrivate: boolean;
    isAdmin: boolean;
    canInspectCode: boolean;
    status: "public" | "private" | "private_admin";
    badgeLabel: string;
    prompts: string[];
  }

  const [projectContext, setProjectContext] =
    useState<ProjectContextData | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  useEffect(() => {
    if (!currentProjectSlug) {
      setProjectContext(null);
      return;
    }
    let active = true;
    setLoadingContext(true);
    fetch(`/api/projects/${currentProjectSlug}/context`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProjectContextData | null) => {
        if (active && data) {
          setProjectContext(data);
        }
      })
      .catch((err) => console.error("Failed to load project context:", err))
      .finally(() => {
        if (active) setLoadingContext(false);
      });
    return () => {
      active = false;
    };
  }, [currentProjectSlug]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  const handleClear = useCallback(() => {
    handleStop();
    setMessages([]);
    setInput("");
  }, [handleStop]);

  const handleCopy = useCallback((id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    }
  }, []);

  const handleInternalNavigate = useCallback(
    (_href: string) => {
      // If mobile, close the drawer so user can immediately view the target page
      if (isMobile) {
        onClose();
      }
    },
    [isMobile, onClose],
  );

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend ?? input).trim();
      if (!query || loading) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `asst-${Date.now()}`;

      const newHistory: Message[] = [
        ...messages,
        { id: userMessageId, role: "user", content: query, timestamp: timeStr },
      ];

      setMessages([
        ...newHistory,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: timeStr,
        },
      ]);
      setInput("");
      setLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: newHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context: {
              pathname,
              projectSlug: currentProjectSlug,
            },
          }),
        });

        if (!res.ok || !res.body) {
          const errorJson = await res.json().catch(() => null);
          const errorMsg = errorJson?.error || `Chat error (${res.status})`;
          throw new Error(errorMsg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          const currentText = accumulated;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: currentText }
                : msg,
            ),
          );
        }

        // Stream completed successfully - trigger celebration state
        setRecentlyCompletedId(assistantMessageId);
        setTimeout(() => {
          setRecentlyCompletedId((prev) =>
            prev === assistantMessageId ? null : prev,
          );
        }, 4000);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }
        const displayError = (err as Error)?.message || chatDict.errorFailed;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: displayError,
                }
              : msg,
          ),
        );
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      input,
      loading,
      messages,
      chatDict.errorFailed,
      pathname,
      currentProjectSlug,
    ],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card/60">
      {/* Header Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 shadow-xs">
            <RobotAgentAnimation
              variant="avatar"
              size={32}
              state={
                loading ? "working" : recentlyCompletedId ? "success" : "idle"
              }
            />
            <span className="absolute -top-1 -right-1 flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--available) opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full border-2 border-background bg-(--available)" />
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {chatDict.title}
              </span>
              <span className="rounded border border-border/80 bg-muted px-1.5 py-0.2 font-pixel text-3xs font-semibold uppercase tracking-widest text-muted-foreground">
                {chatDict.knowledgeBadge || "Peta Data"}
              </span>
            </div>
            <span className="font-mono text-2xs text-muted-foreground">
              {chatDict.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Desktop Expand / Collapse Button */}
          {onToggleExpand && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onToggleExpand}
              title={
                isExpanded
                  ? chatDict.collapse || "Perkecil ukuran"
                  : chatDict.expand || "Perbesar ke setengah layar"
              }
              aria-label={
                isExpanded ? "Perkecil ukuran" : "Perbesar ke setengah layar"
              }
              className="hidden sm:inline-flex"
            >
              {isExpanded ? (
                <ArrowsInSimpleIcon className="size-4" />
              ) : (
                <ArrowsOutSimpleIcon className="size-4" />
              )}
            </Button>
          )}

          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClear}
              title={chatDict.clear}
              aria-label={chatDict.clear}
            >
              <TrashIcon className="size-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            title={chatDict.close}
            aria-label={chatDict.close}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Project Page Active Context Banner */}
      {currentProjectSlug && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-muted/40 px-4 py-1.5 text-2xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5 truncate">
            {projectContext?.isAdmin ? (
              <ShieldCheckIcon className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            ) : projectContext?.isPrivate ? (
              <LockKeyIcon className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <GithubLogoIcon className="size-3.5 text-(--brand-text) shrink-0" />
            )}
            <span className="truncate">
              {projectContext?.isAdmin
                ? "Mode Admin:"
                : chatDict.projectContextLabel || "Konteks Proyek:"}{" "}
              <strong className="text-foreground">
                {projectContext?.title || currentProjectSlug}
              </strong>
            </span>
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.2 font-pixel text-3xs font-semibold uppercase tracking-widest shrink-0 transition-colors",
              projectContext?.isAdmin
                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                : projectContext?.isPrivate
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                : "bg-(--brand)/15 text-(--brand-text) border border-(--brand)/25",
            )}
          >
            {projectContext?.badgeLabel ||
              (loadingContext
                ? "Memeriksa..."
                : chatDict.publicRepoBadge || "Repo Publik")}
          </span>
        </div>
      )}

      {/* Message List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="Riwayat percakapan"
        className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 outline-none"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {/* Welcome & Interactive Hub if empty */}
          {messages.length === 0 && (
            <div className="flex flex-col gap-4 py-2">
              <RobotAgentAnimation
                state="idle"
                variant="card"
                className="border-(--brand-text)/30 bg-muted/20"
                statusText={
                  chatDict.robotInteractiveHint ||
                  "Klik robot untuk melihat animasi siap kerja!"
                }
              />
              <div className="rounded-xl border border-border/80 bg-card/80 p-3.5 text-xs text-foreground sm:text-sm shadow-xs leading-relaxed">
                <p>{chatDict.welcomeMessage}</p>
              </div>

              {/* Project Specific Questions if on a Project Page */}
              {currentProjectSlug && (
                <div className="flex flex-col gap-2 px-0.5 sm:pl-2">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 font-pixel text-3xs font-semibold uppercase tracking-widest",
                      projectContext?.isAdmin
                        ? "text-purple-600 dark:text-purple-400"
                        : projectContext?.isPrivate
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-(--brand-text)",
                    )}
                  >
                    {projectContext?.isAdmin ? (
                      <ShieldCheckIcon className="size-3 text-purple-500 shrink-0" />
                    ) : projectContext?.isPrivate ? (
                      <LockKeyIcon className="size-3 text-amber-500 shrink-0" />
                    ) : (
                      <CodeIcon className="size-3 text-(--brand-text) shrink-0" />
                    )}
                    {projectContext?.isAdmin
                      ? "// ADMIN // ASISTEN KODE & PENALARAN:"
                      : projectContext?.isPrivate
                      ? "// PRIV // KONSEPTUAL & ARSITEKTUR:"
                      : `// REPO // ${chatDict.projectPromptsTitle || "Tanya seputar kode & metode repo ini:"}`}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(projectContext?.prompts || chatDict.projectPrompts)?.map(
                      (p, pIdx) => (
                        <Button
                          key={pIdx}
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => void handleSend(p)}
                          className={cn(
                            "font-mono text-2xs transition-colors",
                            projectContext?.isAdmin
                              ? "border-purple-500/30 text-purple-700 dark:text-purple-300 hover:border-purple-500"
                              : projectContext?.isPrivate
                              ? "border-amber-500/30 text-amber-700 dark:text-amber-300 hover:border-amber-500"
                              : "border-(--brand-text)/30 hover:border-(--brand-text)",
                          )}
                        >
                          {projectContext?.isAdmin ? (
                            <ShieldCheckIcon className="size-3 text-purple-500 shrink-0" />
                          ) : projectContext?.isPrivate ? (
                            <LockKeyIcon className="size-3 text-amber-500 shrink-0" />
                          ) : (
                            <GithubLogoIcon className="size-3 text-(--brand-text) shrink-0" />
                          )}
                          <span>{p}</span>
                        </Button>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Quick Categories Navigation */}
              <div className="px-0.5 sm:pl-2">
                <ChatCategoryNav
                  categories={chatDict.quickCategories}
                  title={chatDict.quickCategoriesTitle}
                  onSelect={(prompt) => void handleSend(prompt)}
                />
              </div>

              {/* Suggestions Chips */}
              <div className="flex flex-col gap-2 px-0.5 sm:pl-2">
                <span className="font-pixel text-3xs uppercase tracking-widest text-muted-foreground">
                  // {chatDict.suggestionsTitle}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {chatDict.suggestions.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => void handleSend(suggestion)}
                      className="font-mono text-2xs"
                    >
                      <SparkleIcon className="size-3 text-(--brand-text) shrink-0" />
                      <span>{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation history */}
          {messages.map((msg, mIdx) => {
            const isUser = msg.role === "user";
            const isLastMessage = mIdx === messages.length - 1;
            const isCurrentStreaming = !isUser && isLastMessage && loading;
            const isRecentlyCompleted = msg.id === recentlyCompletedId;

            return (
              <div
                key={msg.id}
                className={
                  isUser ? "flex justify-end" : "flex items-start gap-3"
                }
              >
                {!isUser && (
                  <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 shadow-xs">
                    <RobotAgentAnimation
                      variant="avatar"
                      size={28}
                      interactive={false}
                      state={
                        isCurrentStreaming
                          ? msg.content
                            ? "working"
                            : "thinking"
                          : isRecentlyCompleted
                          ? "success"
                          : "idle"
                      }
                    />
                  </span>
                )}
                <div
                  className={
                    isUser
                      ? "max-w-[85%] break-words rounded-2xl rounded-tr-xs bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground sm:text-sm shadow-xs"
                      : "group relative max-w-[92%] sm:max-w-[90%] break-words rounded-2xl rounded-tl-xs border border-border/80 bg-card p-4 text-xs text-foreground sm:text-sm shadow-xs"
                  }
                >
                  {isUser ? (
                    <FormattedContent
                      text={msg.content}
                      onNavigate={handleInternalNavigate}
                    />
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between border-b border-border/50 pb-1.5 font-mono text-3xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-pixel text-3xs font-semibold uppercase tracking-widest text-foreground">
                          <RobotIcon className="size-3 text-(--brand-text)" />
                          [SYS // ER_AI.CORE]
                        </span>
                        {msg.content && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 rounded border border-border/50 bg-background/50 px-1.5 py-0.5 font-pixel text-3xs uppercase tracking-wider text-muted-foreground transition-all hover:border-(--brand-text)/50 hover:bg-muted hover:text-foreground active:scale-95"
                            title={chatDict.copy || "Salin"}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <CheckIcon className="size-3 text-(--brand-text)" />
                                <span className="text-(--brand-text)">
                                  {chatDict.copied || "COPIED"}
                                </span>
                              </>
                            ) : (
                              <>
                                <CopyIcon className="size-3" />
                                <span>{chatDict.copy || "COPY"}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {msg.content ? (
                        <>
                          <FormattedContent
                            text={msg.content}
                            onNavigate={handleInternalNavigate}
                          />
                          {isCurrentStreaming && (
                            <div className="mt-2.5 flex items-center gap-2 border-t border-border/40 pt-2 font-mono text-3xs text-muted-foreground">
                              <span className="size-1.5 rounded-full bg-(--brand-text) animate-ping" />
                              <span className="font-pixel text-3xs font-semibold uppercase tracking-widest text-(--brand-text)">
                                [STREAMING]
                              </span>
                              <span className="truncate opacity-80">
                                {chatDict.robotWorking ||
                                  "Menulis kode & penjelasan..."}
                              </span>
                            </div>
                          )}
                          {isRecentlyCompleted && (
                            <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/30 pt-1.5 font-pixel text-3xs uppercase tracking-widest text-(--available)">
                              <SparkleIcon className="size-3 text-(--available)" />
                              <span>
                                [STATUS // {chatDict.robotSuccess || "Jawaban selesai disiapkan!"}]
                              </span>
                            </div>
                          )}
                        </>
                      ) : loading ? (
                        <div className="flex items-center gap-2.5 py-1 text-muted-foreground font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-(--brand-text) animate-ping" />
                            <span className="font-pixel text-3xs font-semibold uppercase tracking-widest text-(--brand-text)">
                              [SYS // ANALYZING]
                            </span>
                          </div>
                          <span className="text-2xs text-muted-foreground/80 animate-pulse">
                            {chatDict.robotThinking ||
                              "Menganalisis kode & konteks..."}
                          </span>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            aria-label="Scroll ke bawah"
            className="absolute bottom-4 right-4 flex size-8 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowDownIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Input Form */}
      <div className="shrink-0 border-t border-border/80 bg-background/95 p-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentProjectSlug
                  ? projectContext?.isAdmin
                    ? `Mode Admin: Tanyakan kode, fungsi internal, atau debugging ${projectContext.title}...`
                    : projectContext?.isPrivate
                    ? `Tanyakan konsep, fitur, atau arsitektur ${projectContext.title}...`
                    : `Tanyakan kode, fungsi, atau cara pakai ${projectContext?.title || currentProjectSlug}...`
                  : chatDict.placeholder
              }
              disabled={loading}
              className="flex-1"
            />
            {loading ? (
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={handleStop}
                title={chatDict.stop}
                aria-label={chatDict.stop}
              >
                <StopIcon className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="default"
                size="icon-sm"
                disabled={!input.trim()}
                title={chatDict.send}
                aria-label={chatDict.send}
              >
                <PaperPlaneTiltIcon className="size-4" />
              </Button>
            )}
          </form>
          <div className="flex items-center justify-between px-1 font-pixel text-3xs uppercase tracking-wider text-muted-foreground/80">
            <span className="flex items-center gap-1.5">
              <RobotIcon className="size-3 text-(--brand-text)" />
              // {chatDict.disclaimer}
            </span>
            <span className="hidden sm:inline-block font-mono opacity-70">
              Enter ↵
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortfolioChatGateway() {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const open = useSyncExternalStore(
    subscribeChat,
    getChatOpen,
    getChatServerSnapshot,
  );
  const dict = useDictionary();

  const handleClose = useCallback(() => {
    setChatOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setChatOpen(!open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setChatOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (isMobile) {
    return (
      <>
        {!open && <FloatingChatTrigger onClick={handleToggle} />}
        <Drawer open={open} onOpenChange={setChatOpen}>
          <DrawerContent className="h-[90dvh] max-h-[90dvh] data-[vaul-drawer-direction=bottom]:max-h-[90dvh] flex flex-col overflow-hidden bg-background border-t border-border/80">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{dict.chat.title}</DrawerTitle>
              <DrawerDescription>{dict.chat.subtitle}</DrawerDescription>
            </DrawerHeader>
            <ChatInnerGateway onClose={handleClose} />
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {!open && <FloatingChatTrigger onClick={handleToggle} />}
      {open && (
        <div
          role="dialog"
          aria-label={dict.chat.title}
          className={cn(
            "fixed bottom-4 right-4 z-50 flex flex-col rounded-panel border border-border/90 bg-card/95 shadow-2xl backdrop-blur-xl overflow-hidden print:hidden transition-all duration-300 ease-in-out",
            isExpanded
              ? "h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] sm:w-[50vw] sm:min-w-[500px] max-w-[calc(100vw-2rem)]"
              : "h-[calc(100vh-2rem)] sm:h-[620px] w-[calc(100vw-2rem)] sm:w-[440px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-2.5rem)]",
          )}
        >
          <ChatInnerGateway
            onClose={handleClose}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded((prev) => !prev)}
          />
        </div>
      )}
    </>
  );
}
