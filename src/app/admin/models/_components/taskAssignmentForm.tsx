"use client";

import { useState, useMemo } from "react";
import type {
  AiModelRow,
  AiProviderRow,
  AiSettingInput,
  AiSettingRow,
} from "@/lib/ai-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { SparkleIcon, RobotIcon, CheckIcon } from "@/components/shared/icons";

export function TaskAssignmentForm({
  task,
  taskTitle,
  taskDescription,
  initial,
  providers,
  models,
  onSubmit,
  submitting,
}: {
  task: "chat" | "blog";
  taskTitle: string;
  taskDescription: string;
  initial?: AiSettingRow;
  providers: AiProviderRow[];
  models: AiModelRow[];
  onSubmit: (data: AiSettingInput) => void;
  submitting: boolean;
}) {
  const [providerId, setProviderId] = useState(
    initial?.providerId || providers[0]?.id || "cloudflare",
  );

  // Filter models for selected provider
  const availableModels = useMemo(() => {
    return models.filter((m) => m.providerId === providerId && m.enabled);
  }, [models, providerId]);

  const [modelId, setModelId] = useState(
    initial?.modelId || availableModels[0]?.modelId || "",
  );
  const [enableThinking, setEnableThinking] = useState(
    initial?.enableThinking ?? false,
  );
  const [reasoningEffort, setReasoningEffort] = useState<
    "low" | "medium" | "high"
  >((initial?.reasoningEffort as "low" | "medium" | "high") || "medium");
  const [temperature, setTemperature] = useState(
    initial?.temperature || (task === "blog" ? "0.95" : "0.7"),
  );
  const [maxTokens, setMaxTokens] = useState<number>(
    initial?.maxTokens || (task === "blog" ? 8192 : 1024),
  );

  const selectedModel = useMemo(() => {
    return models.find((m) => m.providerId === providerId && m.modelId === modelId);
  }, [models, providerId, modelId]);

  const handleProviderChange = (newProvider: string) => {
    setProviderId(newProvider);
    const candidate = models.find(
      (m) => m.providerId === newProvider && m.enabled,
    );
    if (candidate) {
      setModelId(candidate.modelId);
      if (candidate.isThinkingSupported) {
        setEnableThinking(true);
      }
    }
  };

  const handleModelChange = (newModelId: string) => {
    setModelId(newModelId);
    const m = models.find(
      (mod) => mod.providerId === providerId && mod.modelId === newModelId,
    );
    if (m?.isThinkingSupported) {
      setEnableThinking(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId) return;

    onSubmit({
      task,
      providerId,
      modelId,
      enableThinking,
      reasoningEffort,
      temperature,
      maxTokens: Number(maxTokens) || (task === "blog" ? 8192 : 1024),
      systemPrompt: initial?.systemPrompt || null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border bg-card/60 p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {task === "chat" ? (
              <RobotIcon className="size-5" />
            ) : (
              <SparkleIcon className="size-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base">{taskTitle}</h3>
            <p className="text-xs text-muted-foreground">{taskDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Badge variant="outline" className="text-xs font-mono">
            Tugas: {task.toUpperCase()}
          </Badge>
          {selectedModel?.isThinkingSupported && (
            <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
              Reasoning Ready
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pilih Provider */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`provider-${task}`} className="font-medium">
            1. Pilih Provider AI
          </Label>
          <Select value={providerId} onValueChange={handleProviderChange}>
            <SelectTrigger id={`provider-${task}`} className="w-full">
              <SelectValue placeholder="Pilih Provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {!p.enabled && (
                      <span className="text-xs text-destructive">(Nonaktif)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pilih Model */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`model-${task}`} className="font-medium">
            2. Pilih Model AI yang Ditugaskan
          </Label>
          <Select value={modelId} onValueChange={handleModelChange}>
            <SelectTrigger id={`model-${task}`} className="w-full">
              <SelectValue placeholder="Pilih Model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((m) => (
                <SelectItem key={m.id} value={m.modelId}>
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span>{m.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {m.modelId}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedModel?.description && (
        <div className="rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground mr-1.5">Keterangan Model:</span>
          {selectedModel.description}
        </div>
      )}

      {/* Parameter Tambahan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`effort-${task}`} className="text-xs">
            Reasoning Effort
          </Label>
          <Select
            value={reasoningEffort}
            onValueChange={(val) =>
              val && setReasoningEffort(val as "low" | "medium" | "high")
            }
          >
            <SelectTrigger id={`effort-${task}`} size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Rendah (Low)</SelectItem>
              <SelectItem value="medium">Sedang (Medium)</SelectItem>
              <SelectItem value="high">Tinggi (High)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`temp-${task}`} className="text-xs">
            Temperature
          </Label>
          <Input
            id={`temp-${task}`}
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="h-8 text-xs"
            placeholder="0.7"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`tokens-${task}`} className="text-xs">
            Max Output Tokens
          </Label>
          <Input
            id={`tokens-${task}`}
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="h-8 text-xs"
            placeholder={task === "blog" ? "8192" : "1024"}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t mt-1">
        <div className="flex items-center gap-2">
          <Switch
            id={`thinking-${task}`}
            checked={enableThinking}
            onCheckedChange={setEnableThinking}
          />
          <Label htmlFor={`thinking-${task}`} className="cursor-pointer text-xs sm:text-sm">
            Aktifkan Mode Penalaran Berpikir (Thinking Mode)
          </Label>
        </div>

        <Button type="submit" size="sm" disabled={submitting || !modelId}>
          {submitting ? (
            <>
              <Spinner className="size-3.5 mr-1.5" />
              Menyimpan…
            </>
          ) : (
            <>
              <CheckIcon className="size-4 mr-1.5" />
              Terapkan untuk {task === "chat" ? "Chat Bot" : "Blog"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
