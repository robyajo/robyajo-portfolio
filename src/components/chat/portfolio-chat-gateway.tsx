"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reasoning } from "@/components/ui/reasoning";
import { parseAiResponse } from "@/lib/parse-ai-response";
import { RobotAgentAnimation } from "./robot-agent-animation";
import { FormattedContent } from "./formatted-content";
import { ChatCategoryNav } from "./chat-category-nav";
import { PageContextCard } from "./page-context-card";
import { getPageChatTemplate } from "@/lib/page-chat-context";
import {
  ArrowDownIcon,
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  GithubLogoIcon,
  LockKeyIcon,
  MinusIcon,
  PaperPlaneTiltIcon,
  RobotIcon,
  ShieldCheckIcon,
  SidebarSimpleIcon,
  SparkleIcon,
  StopIcon,
  TrashIcon,
  XIcon,
} from "@/components/shared/icons";
import {
  clearChatMessages,
  getChatDraftInput,
  setChatDraftInput,
  setChatExpanded,
  setChatMessages,
  setChatOpen,
  useChatExpanded,
  useChatMessages,
  useChatOpen,
  type ChatMessage as Message,
} from "@/lib/chat-store";
import { useDictionary, useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export type { Message };

function ChatInnerGateway({
  onMinimize,
  onCloseAndReset,
  isExpanded,
  onToggleExpand,
}: {
  onMinimize: () => void;
  onCloseAndReset: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const dict = useDictionary();
  const chatDict = dict.chat;
  const pathname = usePathname();

  const locale = useLocale();
  const langKey = locale === "en" ? "en" : "id";
  const activePageTemplate = getPageChatTemplate(pathname || "/");

  // Project detection from current page
  const isProjectPage =
    Boolean(pathname?.startsWith("/projects/")) && pathname !== "/projects";
  const currentProjectSlug = isProjectPage
    ? pathname?.replace("/projects/", "").split("/")[0]
    : null;

  const messages = useChatMessages();
  const [input, setInputState] = useState(() => getChatDraftInput());
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(
    null,
  );

  const setInput = useCallback((val: string) => {
    setInputState(val);
    setChatDraftInput(val);
  }, []);

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
    scrollToBottom("auto");
  }, [messages, scrollToBottom]);

  const handleCopy = useCallback((id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleClear = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearChatMessages();
    setInput("");
    setLoading(false);
    setRecentlyCompletedId(null);
  }, [setInput]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  // Internal link navigation: sidebar remains docked and open so user can read while chatting
  const handleInternalNavigate = useCallback((_href: string) => {}, []);

  const handleSelectSuggestedPrompt = useCallback(
    (promptText: string) => {
      setInput(promptText);
      inputRef.current?.focus();
    },
    [setInput],
  );

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const trimmed = (textToSend ?? input).trim();
      if (!trimmed || loading) return;

      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `assistant-${Date.now()}`;

      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const emptyAssistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const updatedHistory = [...messages, userMessage];
      setChatMessages([...updatedHistory, emptyAssistantMessage]);
      setInput("");
      setLoading(true);
      setRecentlyCompletedId(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const payloadMessages = updatedHistory.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: payloadMessages,
            currentPath: pathname,
            projectSlug: currentProjectSlug,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || chatDict.errorFailed);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("Gagal membaca aliran teks (Stream reader null).");
        }

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          const currentText = accumulated;

          setChatMessages((prev) =>
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
        setChatMessages((prev) =>
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
      setInput,
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
                  ? chatDict.collapse || "Perkecil ukuran sidebar"
                  : chatDict.expand || "Perlebar ukuran sidebar"
              }
              aria-label={
                isExpanded ? "Perkecil ukuran sidebar" : "Perlebar ukuran sidebar"
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

          {/* Clear chat history without closing */}
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

          {/* Minimize Button: Hide sidebar into background while keeping all messages */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMinimize}
            title={chatDict.minimize || "Sembunyikan bilah sisi (obrolan tersimpan)"}
            aria-label={chatDict.minimize || "Sembunyikan bilah sisi (obrolan tersimpan)"}
            className="hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <MinusIcon className="size-4" />
          </Button>

          {/* Close & Reset Button: Close sidebar AND clear chat session to start fresh */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              handleClear();
              onCloseAndReset();
            }}
            title={chatDict.closeAndReset || "Tutup & mulai baru (hapus percakapan)"}
            aria-label={chatDict.closeAndReset || "Tutup & mulai baru (hapus percakapan)"}
            className="hover:bg-destructive/15 hover:text-destructive text-muted-foreground transition-colors"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Active Page / Project Context Banner */}
      {currentProjectSlug ? (
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
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-1.5 text-2xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5 truncate">
            <span className="size-1.5 rounded-full bg-(--brand-text) animate-pulse shrink-0" />
            <span className="truncate">
              {chatDict.activePageLabel || "Halaman Aktif:"}{" "}
              <strong className="text-foreground">
                {activePageTemplate.title[langKey]}
              </strong>
            </span>
          </span>
          <span className="rounded px-1.5 py-0.2 font-pixel text-3xs font-semibold uppercase tracking-widest shrink-0 bg-(--brand)/15 text-(--brand-text) border border-(--brand)/25">
            {activePageTemplate.badge[langKey].replace("// ", "")}
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
                statusText={activePageTemplate.welcomeGreeting[langKey]}
                className="border-(--brand-text)/30 bg-muted/20"
              />

              {/* Template Informasi Halaman yang Sedang Dikunjungi */}
              <PageContextCard onSelectPrompt={handleSelectSuggestedPrompt} />

              {/* Categorized Portfolio Knowledge Nav */}
              <ChatCategoryNav onSelectPrompt={handleSelectSuggestedPrompt} />
            </div>
          )}
          {/* Conversation history */}
          {messages.map((msg, mIdx) => {
            const isUser = msg.role === "user";
            const isLastMessage = mIdx === messages.length - 1;
            const isCurrentStreaming = !isUser && isLastMessage && loading;
            const isRecentlyCompleted = msg.id === recentlyCompletedId;

            // Extract thinking / reasoning process using AI Elements parser
            const parsed = !isUser
              ? parseAiResponse(msg.content, isCurrentStreaming)
              : { thinking: null, isThinkingActive: false, content: msg.content };

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
                          ? parsed.content
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
                      : "group relative max-w-[92%] sm:max-w-[92%] break-words rounded-2xl rounded-tl-xs border border-border/80 bg-card p-4 text-xs text-foreground sm:text-sm shadow-xs"
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
                        {parsed.content && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, parsed.content)}
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

                      {/* AI Elements: Reasoning / Chain of Thought Component */}
                      {parsed.thinking && (
                        <Reasoning
                          text={parsed.thinking}
                          isStreaming={parsed.isThinkingActive}
                          className="mb-2.5"
                        />
                      )}

                      {parsed.content ? (
                        <>
                          <FormattedContent
                            text={parsed.content}
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
                      ) : parsed.isThinkingActive ? (
                        <div className="mt-2 flex items-center gap-2 font-mono text-2xs text-muted-foreground animate-pulse">
                          <span className="size-1.5 rounded-full bg-(--brand-text) animate-ping" />
                          <span>// Sedang menganalisis konteks & merumuskan jawaban...</span>
                        </div>
                      ) : loading ? (
                        <div className="flex items-center gap-2.5 py-1 text-muted-foreground font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-(--brand-text) animate-ping" />
                            <span className="font-pixel text-3xs font-semibold uppercase tracking-widest text-(--brand-text)">
                              [SYS // ANALYZING]
                            </span>
                          </div>
                          <span className="text-2xs text-muted-foreground/80 animate-pulse">
                            {chatDict.robotThinking || "Memproses..."}
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
      </div>

      {/* Scroll to bottom helper button */}
      {showScrollBottom && (
        <div className="absolute bottom-24 right-6 z-10">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            onClick={() => scrollToBottom("smooth")}
            className="rounded-full shadow-lg border-border/80 bg-background/90 backdrop-blur-xs"
            title="Gulir ke bawah"
            aria-label="Gulir ke pesan terbaru"
          >
            <ArrowDownIcon className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="shrink-0 border-t border-border/80 bg-background/95 p-3 sm:p-4 backdrop-blur-md">
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
  const open = useChatOpen();
  const isExpanded = useChatExpanded();
  const dict = useDictionary();

  const handleMinimize = useCallback(() => {
    setChatOpen(false);
  }, []);

  const handleCloseAndReset = useCallback(() => {
    clearChatMessages();
    setChatOpen(false);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setChatExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="portfolio-ai-sidebar"
          initial={{ x: "100%", opacity: 0.9 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.9 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          role="complementary"
          aria-label={dict.chat.title}
          className={cn(
            "fixed inset-y-0 right-0 z-40 flex h-dvh flex-col border-l border-border/80 bg-background/98 dark:bg-card/98 shadow-2xl backdrop-blur-2xl transition-[width] duration-300 ease-in-out w-full md:w-[460px] lg:w-[500px] xl:w-[540px] pointer-events-auto",
            isExpanded && "md:w-[680px] lg:w-[760px] xl:w-[840px]",
          )}
        >
          <ChatInnerGateway
            onMinimize={handleMinimize}
            onCloseAndReset={handleCloseAndReset}
            isExpanded={isExpanded}
            onToggleExpand={handleToggleExpand}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
