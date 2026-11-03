"use client";

import { useState } from "react";
import type { AiModelInput, AiProviderRow } from "@/lib/ai-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { DialogFooter } from "@/components/ui/dialog";

export function ModelForm({
  initial,
  providers,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: Partial<
    Omit<AiModelInput, "reasoningEffort"> & {
      reasoningEffort?: "low" | "medium" | "high" | string;
      id?: number;
    }
  >;
  providers: AiProviderRow[];
  onSubmit: (data: AiModelInput) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [providerId, setProviderId] = useState(
    initial.providerId || providers[0]?.id || "cloudflare",
  );
  const [modelId, setModelId] = useState(initial.modelId || "");
  const [name, setName] = useState(initial.name || "");
  const [family, setFamily] = useState(initial.family || "");
  const [description, setDescription] = useState(initial.description || "");
  const [isThinkingSupported, setIsThinkingSupported] = useState(
    initial.isThinkingSupported ?? false,
  );
  const [reasoningEffort, setReasoningEffort] = useState<
    "low" | "medium" | "high"
  >((initial.reasoningEffort as "low" | "medium" | "high") || "medium");
  const [enabled, setEnabled] = useState(initial.enabled ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId.trim() || !name.trim()) return;

    onSubmit({
      providerId,
      modelId: modelId.trim(),
      name: name.trim(),
      family: family.trim() || null,
      description: description.trim() || null,
      isThinkingSupported,
      reasoningEffort,
      enabled,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="provider">Provider AI</Label>
        <Select
          value={providerId}
          onValueChange={(val) => val && setProviderId(val)}
        >
          <SelectTrigger id="provider" className="w-full">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="modelId">Model ID (Kunci API)</Label>
          <Input
            id="modelId"
            placeholder="mis. @cf/zai-org/glm-4.7-flash atau gemini-3.8-flash-medium"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nama Tampil</Label>
          <Input
            id="name"
            placeholder="mis. GLM 4.7 Flash atau Gemini 3.8 Flash (Medium)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="family">Keluarga Model / Brand (Opsional)</Label>
          <Input
            id="family"
            placeholder="mis. gemini, claude, glm, qwen, llama"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reasoningEffort">
            Tingkat Penalaran (Reasoning Effort)
          </Label>
          <Select
            value={reasoningEffort}
            onValueChange={(val) =>
              val && setReasoningEffort(val as "low" | "medium" | "high")
            }
          >
            <SelectTrigger id="reasoningEffort" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Rendah (Low - Cepat)</SelectItem>
              <SelectItem value="medium">Sedang (Medium - Seimbang)</SelectItem>
              <SelectItem value="high">Tinggi (High - Mendalam)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          placeholder="Karakteristik atau keunggulan model..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-1">
        <div className="flex items-center gap-2">
          <Switch
            id="isThinkingSupported"
            checked={isThinkingSupported}
            onCheckedChange={setIsThinkingSupported}
          />
          <Label
            htmlFor="isThinkingSupported"
            className="cursor-pointer text-xs sm:text-sm"
          >
            Mendukung Mode Penalaran (Thinking / Reasoning)
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
          <Label
            htmlFor="enabled"
            className="cursor-pointer text-xs sm:text-sm"
          >
            Model Aktif
          </Label>
        </div>
      </div>

      <DialogFooter className="mt-4 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={submitting || !modelId.trim() || !name.trim()}
        >
          {submitting ? (
            <>
              <Spinner className="size-4 mr-2" />
              Menyimpan…
            </>
          ) : (
            "Simpan Model"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
