"use client";

import { useEffect, useRef, useState } from "react";
import type { AiModelRow, AiProviderRow } from "@/lib/ai-schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { DialogFooter } from "@/components/ui/dialog";
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  CopyIcon,
  PaperPlaneTiltIcon,
  RobotIcon,
  SparkleIcon,
  StopIcon,
  TrashIcon,
} from "@/components/shared/icons";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export interface TestChatInitialData {
  providerId?: string;
  modelId?: string;
}

export function TestChatForm({
  initial,
  providers,
  models,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: TestChatInitialData;
  providers: AiProviderRow[];
  models: AiModelRow[];
  onSubmit?: () => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [providerId, setProviderId] = useState(
    initial.providerId || providers[0]?.id || "cloudflare",
  );

  // Filter model berdasarkan provider yang dipilih
  const providerModels = models.filter((m) => m.providerId === providerId);

  const [modelId, setModelId] = useState(
    initial.modelId || providerModels[0]?.modelId || "",
  );

  const [prompt, setPrompt] = useState(
    "Halo! Perkenalkan dirimu secara singkat, sebutkan model apa yang sedang berjalan, dan jelaskan kemampuan utamamu.",
  );

  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [enableThinking, setEnableThinking] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Streaming State
  const [responseOutput, setResponseOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Jika provider berubah, sesuaikan modelId
  useEffect(() => {
    const available = models.filter((m) => m.providerId === providerId);
    if (available.length > 0 && !available.some((m) => m.modelId === modelId)) {
      setModelId(available[0]?.modelId || "");
    }
  }, [providerId, models, modelId]);

  // Update thinking toggle sesuai model terpilih
  useEffect(() => {
    const activeModel = models.find(
      (m) => m.providerId === providerId && m.modelId === modelId,
    );
    if (activeModel?.isThinkingSupported) {
      setEnableThinking(true);
    } else {
      setEnableThinking(false);
    }
  }, [modelId, providerId, models]);

  const handleSendTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modelId || !prompt.trim() || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setResponseOutput("");
    setErrorStatus(null);
    setLatencyMs(null);

    const startTime = Date.now();

    try {
      const res = await fetch("/api/ai/test-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          providerId,
          modelId,
          message: prompt.trim(),
          temperature,
          maxTokens,
          enableThinking,
        }),
      });

      setLatencyMs(Date.now() - startTime);

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errMsg =
          errorJson?.error ||
          errorJson?.detail ||
          `Eror pengujian (HTTP ${res.status})`;
        setErrorStatus(`HTTP ${res.status}: ${errMsg}`);
        setIsLoading(false);
        return;
      }

      if (!res.body) {
        setErrorStatus("Respons gateway kosong.");
        setIsLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        setResponseOutput(accumulated);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorStatus((err as Error).message || "Koneksi ke gateway terputus.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    toast.success("Respons model disalin ke clipboard!");
  };

  const selectedProviderObj = providers.find((p) => p.id === providerId);
  const selectedModelObj = models.find(
    (m) => m.providerId === providerId && m.modelId === modelId,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Bar Pengaturan Provider & Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/80 bg-muted/20">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="test-provider">Pilih Provider</Label>
          <Select
            value={providerId}
            onValueChange={(val) => {
              if (val) setProviderId(val);
            }}
          >
            <SelectTrigger id="test-provider" className="w-full bg-background">
              <SelectValue placeholder="Pilih Provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="test-model">Pilih Model Uji</Label>
          <Select
            value={modelId}
            onValueChange={(val) => {
              if (val) setModelId(val);
            }}
            disabled={providerModels.length === 0}
          >
            <SelectTrigger id="test-model" className="w-full bg-background font-mono text-xs">
              <SelectValue
                placeholder={
                  providerModels.length === 0
                    ? "Belum ada model terdaftar"
                    : "Pilih Model"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {providerModels.map((m) => (
                <SelectItem key={m.id} value={m.modelId}>
                  <div className="flex items-center gap-1.5">
                    <span>{m.name}</span>
                    <span className="text-3xs text-muted-foreground font-mono">
                      ({m.modelId})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Provider & Model Terpilih */}
      <div className="flex items-center justify-between gap-2 px-1 text-2xs text-muted-foreground font-mono">
        <span className="truncate">
          Endpoint: <strong className="text-foreground">{selectedProviderObj?.baseUrl}</strong>
        </span>
        {selectedModelObj?.isThinkingSupported && (
          <Badge
            variant="outline"
            className="text-3xs py-0 h-4.5 px-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 font-sans"
          >
            Reasoning Supported
          </Badge>
        )}
      </div>

      {/* 2. Input Prompt Pengujian */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="test-prompt">Pesan Pengujian (Prompt)</Label>
          <div className="flex items-center gap-1 text-3xs">
            <span className="text-muted-foreground">Preset:</span>
            <button
              type="button"
              onClick={() =>
                setPrompt(
                  "Halo! Perkenalkan dirimu secara singkat, sebutkan model apa yang sedang berjalan, dan jelaskan kemampuan utamamu.",
                )
              }
              className="text-foreground hover:underline px-1 py-0.5 rounded bg-muted/60"
            >
              Perkenalan
            </button>
            <button
              type="button"
              onClick={() =>
                setPrompt(
                  "Jika ada 3 buah apel dan saya mengambil 2, berapa banyak buah apel yang saya miliki sekarang? Jelaskan alasanmu secara logis.",
                )
              }
              className="text-foreground hover:underline px-1 py-0.5 rounded bg-muted/60"
            >
              Logika
            </button>
            <button
              type="button"
              onClick={() =>
                setPrompt(
                  "Tuliskan fungsi TypeScript debounce sederhana beserta tipe data parameternya.",
                )
              }
              className="text-foreground hover:underline px-1 py-0.5 rounded bg-muted/60"
            >
              Koding
            </button>
          </div>
        </div>

        <Textarea
          id="test-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ketik pertanyaan atau prompt untuk menguji respons model..."
          rows={3}
          className="text-xs sm:text-sm resize-none"
        />

        {/* Parameter Lanjutan Toggle */}
        <div className="flex items-center justify-between pt-0.5">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-3xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? "▼ Sembunyikan Parameter" : "▶ Parameter Lanjutan"}
          </button>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleStop}
                className="h-8 gap-1.5 text-xs"
              >
                <StopIcon className="size-3.5" />
                Hentikan Stream
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => handleSendTest()}
                disabled={!modelId || !prompt.trim()}
                className="h-8 gap-1.5 text-xs bg-(--brand) text-(--brand-foreground) hover:bg-(--brand)/90"
              >
                <PaperPlaneTiltIcon className="size-3.5" />
                Kirim Uji Model
              </Button>
            )}
          </div>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border border-border/70 bg-muted/10 text-xs">
            <div className="flex flex-col gap-1">
              <Label htmlFor="param-temp" className="text-3xs">
                Temperature: {temperature}
              </Label>
              <input
                id="param-temp"
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="param-tokens" className="text-3xs">
                Max Tokens: {maxTokens}
              </Label>
              <input
                id="param-tokens"
                type="number"
                min="64"
                max="8192"
                step="128"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                className="h-7 rounded border border-border px-2 text-xs bg-background"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="param-thinking" className="text-3xs cursor-pointer">
                Thinking Mode
              </Label>
              <Switch
                id="param-thinking"
                checked={enableThinking}
                onCheckedChange={setEnableThinking}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Jendela Respons Streaming */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RobotIcon className="size-4 text-(--brand-text)" />
            <span className="text-xs font-semibold text-foreground">
              Respons Model Live
            </span>
            {latencyMs !== null && (
              <Badge variant="secondary" className="text-3xs h-4 px-1 py-0 font-mono">
                ⚡ {latencyMs}ms
              </Badge>
            )}
            {isLoading && (
              <span className="flex items-center gap-1 text-3xs text-blue-500 font-mono animate-pulse">
                <Spinner className="size-3" />
                streaming…
              </span>
            )}
          </div>

          {responseOutput && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 text-3xs px-2 gap-1 text-muted-foreground hover:text-foreground"
              >
                <CopyIcon className="size-3" />
                Salin
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResponseOutput("")}
                className="h-6 text-3xs px-2 gap-1 text-muted-foreground hover:text-foreground"
              >
                <TrashIcon className="size-3" />
                Hapus
              </Button>
            </div>
          )}
        </div>

        <div className="relative min-h-[140px] max-h-[260px] overflow-y-auto rounded-xl border border-border/80 bg-card p-3.5 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap selection:bg-(--brand)/20">
          {errorStatus ? (
            <div className="flex flex-col gap-1 text-rose-600 dark:text-rose-400 font-sans">
              <span className="font-semibold flex items-center gap-1">
                ❌ Gagal Terhubung ke Gateway:
              </span>
              <p className="text-2xs font-mono bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                {errorStatus}
              </p>
            </div>
          ) : responseOutput ? (
            responseOutput
          ) : isLoading ? (
            <div className="flex items-center justify-center h-28 text-muted-foreground gap-2">
              <Spinner className="size-4" />
              <span>Menunggu jawaban pertama dari model…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-muted-foreground text-center gap-1">
              <SparkleIcon className="size-5 opacity-40" />
              <span>Belum ada pesan uji. Klik tombol "Kirim Uji Model" di atas.</span>
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="mt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Tutup
        </Button>
      </DialogFooter>
    </div>
  );
}
