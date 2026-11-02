"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoMascot } from "@/components/shared/logo-mascot";
import {
  PaperPlaneTiltIcon,
  RobotIcon,
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function FormattedContent({ text }: { text: string }) {
  const paragraphs = text.split("\n\n");

  return (
    <div className="flex flex-col gap-2.5">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split("\n");
        const isList = lines.every(
          (l) => l.trim().startsWith("- ") || l.trim().startsWith("* "),
        );

        if (isList) {
          return (
            <ul key={pIdx} className="list-disc pl-5 space-y-1">
              {lines.map((item, iIdx) => {
                const itemText = item.trim().replace(/^[-*]\s+/, "");
                return (
                  <li key={iIdx}>
                    <InlineFormatted text={itemText} />
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <span key={lIdx}>
                {lIdx > 0 && <br />}
                <InlineFormatted text={line} />
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function InlineFormatted({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={idx} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={idx}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, href] = linkMatch;
          const isInternal = href.startsWith("/") || href.startsWith("#");
          return (
            <a
              key={idx}
              href={href}
              target={isInternal ? undefined : "_blank"}
              rel={isInternal ? undefined : "noopener noreferrer"}
              className="font-medium text-primary underline underline-offset-3 hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
            >
              {label}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

function ChatInner({ onClose }: { onClose: () => void }) {
  const dict = useDictionary();
  const chatDict = dict.chat;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
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

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend ?? input).trim();
      if (!query || loading) return;

      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `asst-${Date.now()}`;

      const newHistory: Message[] = [
        ...messages,
        { id: userMessageId, role: "user", content: query },
      ];

      setMessages([
        ...newHistory,
        { id: assistantMessageId, role: "assistant", content: "" },
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
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Chat error (${res.status})`);
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
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: chatDict.errorFailed,
                }
              : msg,
          ),
        );
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, loading, messages, chatDict.errorFailed],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
            <LogoMascot size={22} waving />
          </span>
          <div className="flex flex-col">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {chatDict.title}
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-3xs font-medium text-foreground">
                <span className="size-1.5 rounded-full bg-(--color-available) animate-pulse" />
                {chatDict.statusOnline}
              </span>
            </span>
            <span className="text-2xs text-muted-foreground">
              {chatDict.subtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
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

      {/* Message List - Native smooth scroll container with bounded height */}
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-label="Riwayat percakapan"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 outline-none"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {/* Welcome Message if empty */}
          {messages.length === 0 && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                  <LogoMascot size={20} />
                </span>
                <div className="rounded-2xl rounded-tl-xs border border-border/70 bg-muted/30 p-3.5 text-xs text-foreground sm:text-sm">
                  <p className="leading-relaxed">{chatDict.welcomeMessage}</p>
                </div>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col gap-2 pl-11">
                <span className="flex items-center gap-1.5 text-2xs uppercase tracking-wider text-muted-foreground">
                  <SparkleIcon className="size-3 text-(--brand)" />
                  {chatDict.suggestionsTitle}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {chatDict.suggestions.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => void handleSend(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation history */}
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={isUser ? "flex justify-end" : "flex items-start gap-3"}
              >
                {!isUser && (
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                    <LogoMascot size={20} />
                  </span>
                )}
                <div
                  className={
                    isUser
                      ? "max-w-[85%] break-words rounded-2xl rounded-tr-xs bg-foreground px-4 py-2.5 text-xs text-background sm:text-sm"
                      : "max-w-[88%] break-words rounded-2xl rounded-tl-xs border border-border/70 bg-muted/30 px-4 py-2.5 text-xs text-foreground sm:text-sm"
                  }
                >
                  {msg.content ? (
                    <FormattedContent text={msg.content} />
                  ) : loading ? (
                    <div className="flex items-center gap-1.5 py-1 text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                      <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                      <span className="size-1.5 rounded-full bg-foreground/60 animate-bounce" />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Form */}
      <div className="shrink-0 border-t border-border/80 bg-background/95 p-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
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
              placeholder={chatDict.placeholder}
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
          <div className="flex items-center justify-between px-1 text-3xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <RobotIcon className="size-3 text-(--brand)" />
              {chatDict.disclaimer}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingChatTrigger({ onClick }: { onClick: () => void }) {
  const dict = useDictionary();
  const chatDict = dict.chat;

  return (
    <div className="fixed bottom-20 right-4 z-40 print:hidden">
      <button
        type="button"
        onClick={onClick}
        aria-label={chatDict.title}
        className="group relative flex items-center gap-2.5 rounded-full border border-primary/20 bg-background/85 p-1.5 pr-4 shadow-xl shadow-primary/10 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:bg-background/95 hover:shadow-2xl hover:shadow-primary/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Animated glowing gradient avatar orb */}
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-sky-500 via-indigo-600 to-violet-500 text-white shadow-md transition-transform duration-300 group-hover:rotate-6">
          <RobotIcon className="size-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full border-2 border-background bg-emerald-500" />
          </span>
        </div>

        {/* Text container */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold tracking-tight text-foreground">
              {chatDict.title}
            </span>
            <SparkleIcon className="size-3 text-amber-500 animate-pulse" />
          </div>
          <span className="text-3xs text-muted-foreground transition-colors group-hover:text-primary">
            {chatDict.triggerSubtitle || "Tanya apa saja"}
          </span>
        </div>
      </button>
    </div>
  );
}

export function PortfolioChat() {
  const isMobile = useIsMobile();
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
          <DrawerContent className="h-[85dvh] max-h-[85dvh] flex flex-col overflow-hidden">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{dict.chat.title}</DrawerTitle>
              <DrawerDescription>{dict.chat.subtitle}</DrawerDescription>
            </DrawerHeader>
            <ChatInner onClose={handleClose} />
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
          className="fixed bottom-4 right-4 z-50 flex h-[580px] w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-200 print:hidden"
        >
          <ChatInner onClose={handleClose} />
        </div>
      )}
    </>
  );
}
