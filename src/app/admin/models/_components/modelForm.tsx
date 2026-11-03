"use client";

import { useEffect, useState } from "react";
import type { AiModelInput, AiModelRow, AiProviderRow } from "@/lib/ai-schema";
import {
  getProviderRemoteModelsAction,
  type RemoteModelItem,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RobotIcon,
  SparkleIcon,
} from "@/components/shared/icons";
import { cn } from "@/lib/cn";

export function ModelForm({
  initial,
  providers,
  existingModels = [],
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
  existingModels?: AiModelRow[];
  onSubmit: (data: AiModelInput) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const isEditMode = Boolean(initial.id || (initial.modelId && initial.name));

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

  // State untuk Remote Models dari Gateway
  const [remoteModels, setRemoteModels] = useState<RemoteModelItem[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteFilter, setRemoteFilter] = useState<
    "all" | "new_only" | "existing_only"
  >("new_only");
  const [remoteSearch, setRemoteSearch] = useState("");
  const [selectedRemoteId, setSelectedRemoteId] = useState<string | null>(null);

  // Muat model dari provider gateway saat provider dipilih
  const loadRemoteModels = async (pId: string) => {
    setLoadingRemote(true);
    try {
      const res = await getProviderRemoteModelsAction(pId);
      if (res.success && res.data) {
        setRemoteModels(res.data);
      } else {
        setRemoteModels([]);
      }
    } catch {
      setRemoteModels([]);
    } finally {
      setLoadingRemote(false);
    }
  };

  useEffect(() => {
    if (!isEditMode) {
      loadRemoteModels(providerId);
    }
  }, [providerId, isEditMode]);

  // Cek apakah suatu modelId sudah ada di sistem untuk provider ini
  const isModelAlreadyInSystem = (mId: string) => {
    return existingModels.some(
      (em) =>
        em.providerId === providerId &&
        em.modelId.toLowerCase() === mId.trim().toLowerCase(),
    );
  };

  // Hitung jumlah model yang belum ada dan yang sudah ada
  const newModelsCount = remoteModels.filter(
    (rm) => !isModelAlreadyInSystem(rm.modelId),
  ).length;
  const existingModelsCount = remoteModels.filter((rm) =>
    isModelAlreadyInSystem(rm.modelId),
  ).length;

  // Filter daftar model remote
  const filteredRemoteModels = remoteModels.filter((rm) => {
    const alreadyIn = isModelAlreadyInSystem(rm.modelId);
    if (remoteFilter === "new_only" && alreadyIn) return false;
    if (remoteFilter === "existing_only" && !alreadyIn) return false;

    if (remoteSearch.trim()) {
      const q = remoteSearch.toLowerCase();
      const matchId = rm.modelId.toLowerCase().includes(q);
      const matchName = rm.name.toLowerCase().includes(q);
      const matchFamily = rm.family?.toLowerCase().includes(q) ?? false;
      return matchId || matchName || matchFamily;
    }
    return true;
  });

  // Handler saat user mengklik salah satu model dari gateway
  const handleSelectRemoteModel = (rm: RemoteModelItem) => {
    setSelectedRemoteId(rm.modelId);
    setModelId(rm.modelId);
    setName(rm.name);
    setFamily(rm.family || "");
    setDescription(rm.description || "");
    setIsThinkingSupported(rm.isThinkingSupported ?? false);
    setReasoningEffort(rm.reasoningEffort || "medium");
  };

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

  const currentModelExistsInDb =
    !isEditMode && modelId.trim() ? isModelAlreadyInSystem(modelId) : false;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 1. Pemilihan Provider */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="provider">Provider AI</Label>
        <Select
          value={providerId}
          onValueChange={(val) => {
            if (val && val !== providerId) {
              setProviderId(val);
              setSelectedRemoteId(null);
            }
          }}
          disabled={isEditMode}
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

      {/* 2. Daftar Model Langsung dari Gateway Provider (Khusus Mode Tambah Baru) */}
      {!isEditMode && (
        <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <SparkleIcon className="size-4 text-(--brand-text)" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Model Tersedia di Gateway Provider
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadRemoteModels(providerId)}
              disabled={loadingRemote}
              className="h-7 text-xs gap-1.5 self-start sm:self-auto"
            >
              <ArrowClockwiseIcon
                className={cn("size-3.5", loadingRemote && "animate-spin")}
              />
              Periksa Gateway
            </Button>
          </div>

          <p className="text-2xs text-muted-foreground">
            Daftar model yang disediakan oleh gateway. Klik model yang bertanda{" "}
            <strong className="text-blue-500 font-medium">Belum Ada</strong>{" "}
            untuk langsung mengisi formulir dan menambahkannya ke sistem.
          </p>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari model di gateway..."
                value={remoteSearch}
                onChange={(e) => setRemoteSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-1 sm:pb-0">
              <Button
                type="button"
                variant={remoteFilter === "new_only" ? "default" : "outline"}
                size="sm"
                onClick={() => setRemoteFilter("new_only")}
                className="h-8 text-xs gap-1"
              >
                <PlusIcon className="size-3" />
                Belum Ada ({newModelsCount})
              </Button>
              <Button
                type="button"
                variant={remoteFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setRemoteFilter("all")}
                className="h-8 text-xs"
              >
                Semua ({remoteModels.length})
              </Button>
              <Button
                type="button"
                variant={
                  remoteFilter === "existing_only" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setRemoteFilter("existing_only")}
                className="h-8 text-xs gap-1 text-muted-foreground"
              >
                <CheckCircleIcon className="size-3 text-emerald-500" />
                Sudah Ada ({existingModelsCount})
              </Button>
            </div>
          </div>

          {/* List Models dari Gateway */}
          <div className="mt-1 max-h-[190px] overflow-y-auto rounded-lg border border-border/80 bg-background divide-y divide-border/60">
            {loadingRemote ? (
              <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
                <Spinner className="size-4" />
                <span>Menghubungi gateway provider & memeriksa model…</span>
              </div>
            ) : filteredRemoteModels.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {remoteFilter === "new_only" && newModelsCount === 0 ? (
                  <div className="flex flex-col items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircleIcon className="size-5" />
                    <span>
                      Semua model dari gateway ini sudah terdaftar di sistem!
                    </span>
                  </div>
                ) : (
                  "Tidak ada model yang sesuai dengan filter pencarian."
                )}
              </div>
            ) : (
              filteredRemoteModels.map((rm) => {
                const alreadyIn = isModelAlreadyInSystem(rm.modelId);
                const isSelected = selectedRemoteId === rm.modelId;

                return (
                  <div
                    key={rm.modelId}
                    onClick={() => handleSelectRemoteModel(rm)}
                    className={cn(
                      "flex items-center justify-between gap-3 p-2.5 transition-colors cursor-pointer text-left",
                      isSelected
                        ? "bg-(--brand)/10 ring-1 ring-inset ring-(--brand)/40"
                        : alreadyIn
                          ? "hover:bg-muted/40 opacity-75"
                          : "hover:bg-accent/40",
                    )}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {rm.name}
                        </span>
                        {rm.family && (
                          <Badge
                            variant="secondary"
                            className="text-3xs py-0 h-4 px-1 uppercase tracking-wider font-mono"
                          >
                            {rm.family}
                          </Badge>
                        )}
                        {rm.isThinkingSupported && (
                          <Badge
                            variant="outline"
                            className="text-3xs py-0 h-4 px-1 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          >
                            Reasoning
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono text-3xs text-muted-foreground truncate">
                        {rm.modelId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {alreadyIn ? (
                        <Badge
                          variant="outline"
                          className="text-3xs h-5 px-1.5 gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium"
                        >
                          <CheckIcon className="size-2.5" />
                          Sudah Ada
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="text-3xs h-5 px-1.5 gap-1 bg-blue-600 hover:bg-blue-600 text-white font-medium"
                        >
                          <PlusIcon className="size-2.5" />
                          Belum Ada
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. Input Model Detail Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="modelId">Model ID (Kunci API Gateway)</Label>
          <Input
            id="modelId"
            placeholder="mis. @cf/zai-org/glm-4.7-flash atau gemini-3.8-flash-medium"
            value={modelId}
            onChange={(e) => {
              setModelId(e.target.value);
              setSelectedRemoteId(null);
            }}
            required
            className={cn(currentModelExistsInDb && "border-amber-500/50")}
          />
          {currentModelExistsInDb && (
            <p className="text-3xs text-amber-600 dark:text-amber-400">
              ⚠️ Model ini sudah ada di sistem. Anda tidak perlu menambahkannya
              lagi.
            </p>
          )}
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
            Mendukung Mode Penalaran (Thinking)
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
          disabled={
            submitting ||
            !modelId.trim() ||
            !name.trim() ||
            currentModelExistsInDb
          }
        >
          {submitting ? (
            <>
              <Spinner className="size-4 mr-2" />
              Menyimpan…
            </>
          ) : currentModelExistsInDb ? (
            "Model Sudah Terdaftar"
          ) : (
            "Simpan Model ke Sistem"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
