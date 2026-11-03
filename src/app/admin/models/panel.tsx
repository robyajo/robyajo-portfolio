"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  AiDashboardData,
  syncProviderModelsAction,
} from "./actions";
import {
  createModelAction,
  deleteModelAction,
  saveTaskAssignmentAction,
  syncProviderModelsAction as syncAction,
  updateModelAction,
  updateProviderAction,
} from "./actions";
import type {
  AiModelInput,
  AiModelRow,
  AiProviderInput,
  AiProviderRow,
  AiSettingInput,
} from "@/lib/ai-schema";
import { ModelForm } from "./_components/modelForm";
import { TaskAssignmentForm } from "./_components/taskAssignmentForm";
import { ProviderForm } from "./_components/providerForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  DotsThreeIcon,
  GlobeIcon,
  PencilIcon,
  PlusIcon,
  RobotIcon,
  SparkleIcon,
  TrashIcon,
} from "@/components/shared/icons";
import { Spinner } from "@/components/ui/spinner";

export function AdminModelsPanel({
  initialData,
}: {
  initialData: AiDashboardData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<AiDashboardData>(initialData);
  const [activeProviderFilter, setActiveProviderFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Syncing state per provider
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  // Modal dialog states
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModelRow | null>(null);
  const [editingProvider, setEditingProvider] = useState<AiProviderRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter models
  const filteredModels = data.models.filter((m) => {
    if (activeProviderFilter !== "all" && m.providerId !== activeProviderFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchId = m.modelId.toLowerCase().includes(q);
      const matchFamily = m.family?.toLowerCase().includes(q) ?? false;
      const matchDesc = m.description?.toLowerCase().includes(q) ?? false;
      return matchName || matchId || matchFamily || matchDesc;
    }
    return true;
  });

  const refreshData = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Sync Provider Models
  const handleSyncProvider = async (providerId: string) => {
    setSyncingProvider(providerId);
    try {
      const res = await syncAction(providerId);
      if (res.success) {
        toast.success(
          `Berhasil menyinkronkan ${res.count || 0} model dari provider!`,
        );
        refreshData();
      } else {
        toast.error(res.error || "Gagal menyinkronkan model.");
      }
    } catch (err) {
      toast.error((err as Error).message || "Terjadi kesalahan.");
    } finally {
      setSyncingProvider(null);
    }
  };

  // Create Model
  const handleCreateModel = async (formData: AiModelInput) => {
    setSubmitting(true);
    try {
      const res = await createModelAction(formData);
      if (res.success) {
        toast.success("Model berhasil ditambahkan ke database.");
        setIsAddModelOpen(false);
        refreshData();
      } else {
        toast.error(res.error || "Gagal menambahkan model.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Update Model
  const handleUpdateModel = async (formData: AiModelInput) => {
    if (!editingModel) return;
    setSubmitting(true);
    try {
      const res = await updateModelAction(editingModel.id, formData);
      if (res.success) {
        toast.success("Model berhasil diperbarui.");
        setEditingModel(null);
        refreshData();
      } else {
        toast.error(res.error || "Gagal memperbarui model.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Model Enabled
  const handleToggleModelEnabled = async (model: AiModelRow) => {
    try {
      const newEnabled = !model.enabled;
      // Optimistic update
      setData((prev) => ({
        ...prev,
        models: prev.models.map((m) =>
          m.id === model.id ? { ...m, enabled: newEnabled } : m,
        ),
      }));

      const res = await updateModelAction(model.id, { enabled: newEnabled });
      if (!res.success) {
        toast.error(res.error || "Gagal mengubah status model.");
        refreshData();
      }
    } catch {
      toast.error("Gagal mengubah status model.");
      refreshData();
    }
  };

  // Delete Model
  const handleDeleteModel = async (model: AiModelRow) => {
    if (!confirm(`Hapus model "${model.name}" (${model.modelId})?`)) return;
    try {
      const res = await deleteModelAction(model.id);
      if (res.success) {
        toast.success("Model berhasil dihapus.");
        refreshData();
      } else {
        toast.error(res.error || "Gagal menghapus model.");
      }
    } catch {
      toast.error("Gagal menghapus model.");
    }
  };

  // Save Task Assignment (Chat / Blog)
  const handleSaveTaskAssignment = async (formData: AiSettingInput) => {
    setSubmitting(true);
    try {
      const res = await saveTaskAssignmentAction(formData);
      if (res.success) {
        toast.success(
          `Penugasan untuk ${formData.task === "chat" ? "Chat Bot" : "Blog Autopilot"} berhasil disimpan!`,
        );
        refreshData();
      } else {
        toast.error(res.error || "Gagal menyimpan penugasan model.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Update Provider
  const handleUpdateProvider = async (formData: Partial<AiProviderInput>) => {
    if (!editingProvider) return;
    setSubmitting(true);
    try {
      const res = await updateProviderAction(editingProvider.id, formData);
      if (res.success) {
        toast.success("Konfigurasi provider berhasil diperbarui.");
        setEditingProvider(null);
        refreshData();
      } else {
        toast.error(res.error || "Gagal memperbarui provider.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">
              Manajemen Model AI & Provider
            </h1>
            <Badge variant="outline" className="text-xs">
              OpenAI Compatible
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Sinkronkan model dari setiap provider, kelola katalog model, dan pilih provider & model mana yang bertugas untuk Chat Bot dan Penulis Blog.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              for (const p of data.providers) {
                if (p.enabled) handleSyncProvider(p.id);
              }
            }}
            disabled={Boolean(syncingProvider)}
          >
            <ArrowClockwiseIcon
              className={`size-4 mr-1.5 ${syncingProvider ? "animate-spin" : ""}`}
            />
            Sinkronkan Semua
          </Button>

          <Button size="sm" onClick={() => setIsAddModelOpen(true)}>
            <PlusIcon className="size-4 mr-1.5" />
            Tambah Model
          </Button>
        </div>
      </div>

      {/* Bagian 1: Penugasan AI (Chat Bot & Blog Autopilot) */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            1. Penugasan Model AI Aktif (Task Assignments)
          </h2>
          <p className="text-xs text-muted-foreground">
            Pilih provider dan model yang akan aktif mengeksekusi masing-masing tugas AI di situs ini.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Penugasan Chat Bot */}
          <TaskAssignmentForm
            task="chat"
            taskTitle="Chat Bot Portfolio (Assistant)"
            taskDescription="Melayani pengunjung portfolio di /api/chat untuk menjawab seputar proyek, keahlian, dan resume."
            initial={data.settings["chat"]}
            providers={data.providers}
            models={data.models}
            onSubmit={handleSaveTaskAssignment}
            submitting={submitting}
          />

          {/* Form Penugasan Blog Autopilot */}
          <TaskAssignmentForm
            task="blog"
            taskTitle="Penulis Otomatis Blog (Autopilot)"
            taskDescription="Menulis artikel dwibahasa (ID + EN) harian di scripts/blog-autopilot.ts dan panel admin blog."
            initial={data.settings["blog"]}
            providers={data.providers}
            models={data.models}
            onSubmit={handleSaveTaskAssignment}
            submitting={submitting}
          />
        </div>
      </section>

      {/* Bagian 2: Status Provider Terdaftar */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            2. Provider AI Terhubung
          </h2>
          <p className="text-xs text-muted-foreground">
            Daftar gateway yang terintegrasi untuk melayani komputasi model AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.providers.map((p) => {
            const providerModelsCount = data.models.filter(
              (m) => m.providerId === p.id,
            ).length;
            const isSyncing = syncingProvider === p.id;

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between gap-4 rounded-xl border bg-card/40 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <GlobeIcon className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{p.name}</span>
                        {p.enabled ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-destructive">
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[280px]">
                        {p.baseUrl}
                      </p>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    {providerModelsCount} Model
                  </Badge>
                </div>

                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t text-xs">
                  <span className="text-muted-foreground">
                    Kunci: {p.apiKey ? "Tersimpan kustom di DB" : "Default dari .env"}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setEditingProvider(p)}
                    >
                      <PencilIcon className="size-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleSyncProvider(p.id)}
                      disabled={isSyncing}
                    >
                      <ArrowClockwiseIcon
                        className={`size-3 mr-1 ${isSyncing ? "animate-spin" : ""}`}
                      />
                      Sinkronkan
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bagian 3: Tabel Katalog & CRUD Model */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              3. Katalog Model AI ({filteredModels.length} Model)
            </h2>
            <p className="text-xs text-muted-foreground">
              Daftar seluruh model AI yang tersimpan di database. Anda dapat menambah, mengedit, atau menonaktifkan model kapan saja.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Cari model ID, nama, atau brand…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Button
            variant={activeProviderFilter === "all" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setActiveProviderFilter("all")}
          >
            Semua ({data.models.length})
          </Button>
          {data.providers.map((p) => {
            const count = data.models.filter((m) => m.providerId === p.id).length;
            return (
              <Button
                key={p.id}
                variant={activeProviderFilter === p.id ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveProviderFilter(p.id)}
              >
                {p.name} ({count})
              </Button>
            );
          })}
        </div>

        {/* Tabel Model */}
        <div className="rounded-xl border bg-card/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[280px]">Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Family / Brand</TableHead>
                <TableHead>Kapabilitas</TableHead>
                <TableHead className="text-center w-[100px]">Aktif</TableHead>
                <TableHead className="text-right w-[110px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground text-sm">
                    Tidak ada model yang cocok dengan pencarian atau filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((m) => {
                  const isAssignedChat =
                    data.settings["chat"]?.providerId === m.providerId &&
                    data.settings["chat"]?.modelId === m.modelId;
                  const isAssignedBlog =
                    data.settings["blog"]?.providerId === m.providerId &&
                    data.settings["blog"]?.modelId === m.modelId;

                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      {/* Nama & Model ID */}
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm">{m.name}</span>
                            {isAssignedChat && (
                              <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-primary text-primary-foreground">
                                Chat
                              </Badge>
                            )}
                            {isAssignedBlog && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                Blog
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                            {m.modelId}
                          </span>
                        </div>
                      </TableCell>

                      {/* Provider Badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            m.providerId === "cloudflare"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                          }
                        >
                          {m.providerId === "cloudflare"
                            ? "Cloudflare Gateway"
                            : "er-ai-rest"}
                        </Badge>
                      </TableCell>

                      {/* Family */}
                      <TableCell className="text-xs capitalize font-medium">
                        {m.family || "-"}
                      </TableCell>

                      {/* Kapabilitas */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {m.isThinkingSupported ? (
                            <Badge
                              variant="secondary"
                              className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            >
                              Thinking Ready
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Standar</span>
                          )}
                          {m.reasoningEffort && m.isThinkingSupported && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              Effort: {m.reasoningEffort}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status Switch */}
                      <TableCell className="text-center">
                        <Switch
                          checked={m.enabled}
                          onCheckedChange={() => handleToggleModelEnabled(m)}
                          className="scale-90"
                        />
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditingModel(m)}
                            title="Edit Model"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteModel(m)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Hapus Model"
                          >
                            <TrashIcon className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Modal Tambah Model */}
      <Dialog open={isAddModelOpen} onOpenChange={setIsAddModelOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Model AI Kustom</DialogTitle>
            <DialogDescription>
              Tambahkan model baru secara manual untuk salah satu provider.
            </DialogDescription>
          </DialogHeader>
          <ModelForm
            initial={{
              providerId: activeProviderFilter !== "all" ? activeProviderFilter : "cloudflare",
              isThinkingSupported: false,
              reasoningEffort: "medium",
              enabled: true,
            }}
            providers={data.providers}
            existingModels={data.models}
            onSubmit={handleCreateModel}
            onCancel={() => setIsAddModelOpen(false)}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Edit Model */}
      <Dialog
        open={Boolean(editingModel)}
        onOpenChange={(open) => !open && setEditingModel(null)}
      >
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Edit Model AI</DialogTitle>
            <DialogDescription>
              Perbarui rincian, kapabilitas, atau nama tampil model ini.
            </DialogDescription>
          </DialogHeader>
          {editingModel && (
            <ModelForm
              initial={editingModel}
              providers={data.providers}
              existingModels={data.models}
              onSubmit={handleUpdateModel}
              onCancel={() => setEditingModel(null)}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Edit Provider */}
      <Dialog
        open={Boolean(editingProvider)}
        onOpenChange={(open) => !open && setEditingProvider(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Konfigurasi Provider AI</DialogTitle>
            <DialogDescription>
              Atur Base URL dan token akses kunci untuk provider {editingProvider?.name}.
            </DialogDescription>
          </DialogHeader>
          {editingProvider && (
            <ProviderForm
              initial={editingProvider}
              onSubmit={handleUpdateProvider}
              onCancel={() => setEditingProvider(null)}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
