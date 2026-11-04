"use client";

import { useState, useTransition } from "react";
import {
  ChatCircleIcon,
  UsersIcon,
  TrashIcon,
  SparkleIcon,
  CheckIcon,
  CopyIcon,
  MagnifyingGlassIcon,
  ArrowClockwiseIcon,
  DesktopIcon,
  DeviceMobileIcon,
  GlobeIcon,
  RobotIcon,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import {
  deleteChatLogAction,
  clearAllChatLogsAction,
  getChatLogsAction,
  type ChatLogsResult,
} from "../actions";
import type { AiChatLog } from "@/lib/schema";

export function ChatLogsPanel({
  initialData,
}: {
  initialData: ChatLogsResult;
}) {
  const [data, setData] = useState<ChatLogsResult>(initialData);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<"all" | "assistant" | "markas">("all");
  const [selectedLog, setSelectedLog] = useState<AiChatLog | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadData = (newChannel = channel, newSearch = search, page = 1) => {
    startTransition(async () => {
      const res = await getChatLogsAction({
        channel: newChannel,
        search: newSearch,
        page,
        limit: 25,
      });
      setData(res);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reloadData(channel, search, 1);
  };

  const handleChannelChange = (c: "all" | "assistant" | "markas") => {
    setChannel(c);
    reloadData(c, search, 1);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus baris log percakapan ini?")) return;
    const res = await deleteChatLogAction(id);
    if (res.success) {
      if (selectedLog?.id === id) setSelectedLog(null);
      reloadData();
    } else {
      alert(res.error || "Gagal menghapus");
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA riwayat log percakapan AI?",
      )
    )
      return;
    const res = await clearAllChatLogsAction();
    if (res.success) {
      setSelectedLog(null);
      reloadData();
    } else {
      alert(res.error || "Gagal membersihkan");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator?.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Percakapan</span>
            <ChatCircleIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {data.stats.total.toLocaleString("id-ID")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Semua riwayat tanya jawab AI
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pengunjung Unik (IP)</span>
            <UsersIcon className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {data.stats.uniqueIps.toLocaleString("id-ID")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Alamat IP perangkat berbeda
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Percakapan Hari Ini</span>
            <SparkleIcon className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {data.stats.todayCount.toLocaleString("id-ID")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Aktivitas 24 jam terakhir
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Kanal Sumber</span>
            <RobotIcon className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-center gap-3 font-mono text-sm">
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              🤖 {data.stats.assistantCount} Asisten
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              🏢 {data.stats.markasCount} Markas
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Perbandingan bot vs markas 3D
          </p>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Channel Segment Buttons */}
        <div className="flex rounded-lg border bg-muted/40 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleChannelChange("all")}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              channel === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Semua ({data.stats.total})
          </button>
          <button
            type="button"
            onClick={() => handleChannelChange("assistant")}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors flex items-center gap-1.5",
              channel === "assistant"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            🤖 Bot Asisten ({data.stats.assistantCount})
          </button>
          <button
            type="button"
            onClick={() => handleChannelChange("markas")}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors flex items-center gap-1.5",
              channel === "markas"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            🏢 AI Markas 3D ({data.stats.markasCount})
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari IP, prompt, perangkat..."
              className="h-8 pl-8 text-xs"
            />
          </form>

          <Button
            size="sm"
            variant="outline"
            onClick={() => reloadData()}
            disabled={isPending}
            className="h-8 px-2.5 text-xs"
            title="Muat ulang data"
          >
            <ArrowClockwiseIcon
              className={cn("h-3.5 w-3.5", isPending && "animate-spin")}
            />
          </Button>

          {data.stats.total > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClearAll}
              disabled={isPending}
              className="h-8 px-2.5 text-xs font-mono"
            >
              <TrashIcon className="h-3.5 w-3.5 mr-1" />
              Bersihkan
            </Button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Waktu</TableHead>
              <TableHead className="w-[105px]">Kanal</TableHead>
              <TableHead className="w-[170px]">Provider & Model</TableHead>
              <TableHead className="w-[170px]">Pengunjung & IP</TableHead>
              <TableHead className="w-[160px]">Perangkat</TableHead>
              <TableHead>Isi Pertanyaan Pengunjung</TableHead>
              <TableHead className="w-[60px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  Belum ada log percakapan AI yang tercatat.
                </TableCell>
              </TableRow>
            ) : (
              data.logs.map((log) => {
                const isMarkas = log.channel === "markas";
                return (
                  <TableRow
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-mono text-2xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono font-semibold py-0.5",
                          isMarkas
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-primary/40 bg-primary/10 text-primary",
                        )}
                      >
                        {isMarkas ? "🏢 Markas 3D" : "🤖 Asisten"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-xs min-w-0 max-w-[160px]">
                        <div className="flex items-center gap-1 font-semibold text-primary truncate">
                          <SparkleIcon className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="truncate">{log.provider || "Cloudflare"}</span>
                        </div>
                        <span
                          className="font-mono text-[10px] text-muted-foreground truncate mt-0.5"
                          title={log.modelId || undefined}
                        >
                          {log.modelId ? log.modelId.split("/").pop() : "llama-3.3-70b"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                          <span>{log.ip}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate mt-0.5">
                          <GlobeIcon className="h-3 w-3 shrink-0" />
                          <span>
                            {log.city ? `${log.city}, ` : ""}
                            {log.country || "Lokasi Global"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <div className="flex items-center gap-1.5 font-medium">
                          {log.formFactor === "Mobile" ? (
                            <DeviceMobileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <DesktopIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{log.browser}</span>
                        </div>
                        <span className="text-2xs text-muted-foreground truncate mt-0.5">
                          {log.os} · {log.formFactor}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-md">
                        <p className="line-clamp-2 text-xs font-medium text-foreground">
                          {log.userPrompt}
                        </p>
                        {log.aiResponse && (
                          <p className="line-clamp-1 text-2xs text-muted-foreground mt-0.5 italic">
                            ↳ {log.aiResponse.replace(/[#*`_]/g, "")}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => void handleDelete(log.id, e)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Hapus log ini"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Toolbar */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
            <div>
              Menampilkan {(data.currentPage - 1) * 25 + 1} -{" "}
              {Math.min(data.currentPage * 25, data.total)} dari {data.total} log
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={data.currentPage <= 1 || isPending}
                onClick={() => reloadData(channel, search, data.currentPage - 1)}
                className="h-7 px-2 text-xs"
              >
                Sebelumnya
              </Button>
              <span className="px-2 font-mono font-medium text-foreground">
                {data.currentPage} / {data.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={data.currentPage >= data.totalPages || isPending}
                onClick={() => reloadData(channel, search, data.currentPage + 1)}
                className="h-7 px-2 text-xs"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Percakapan & Informasi Perangkat */}
      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <ChatCircleIcon className="h-5 w-5 text-primary" />
                <span>Detail Log Percakapan AI</span>
              </DialogTitle>
              {selectedLog && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-mono font-semibold",
                    selectedLog.channel === "markas"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                      : "border-primary/40 bg-primary/10 text-primary",
                  )}
                >
                  {selectedLog.channel === "markas"
                    ? "🏢 AI Markas 3D"
                    : "🤖 Bot Asisten Portofolio"}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Waktu: {selectedLog && formatDate(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
              {/* Box Info Perangkat & Pengunjung */}
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Informasi Perangkat & Jaringan</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          {
                            ip: selectedLog.ip,
                            device: selectedLog.device,
                            browser: selectedLog.browser,
                            os: selectedLog.os,
                            location: `${selectedLog.city}, ${selectedLog.region}, ${selectedLog.country}`,
                            provider: selectedLog.provider || "Cloudflare",
                            modelId: selectedLog.modelId || "llama-3.3-70b-instruct",
                            userAgent: selectedLog.userAgent,
                          },
                          null,
                          2,
                        ),
                        "json",
                      )
                    }
                    className="text-primary hover:underline flex items-center gap-1 font-sans text-2xs"
                  >
                    {copiedText === "json" ? (
                      <>
                        <CheckIcon className="h-3 w-3 text-emerald-500" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-3 w-3" />
                        <span>Salin Info</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-2xs">
                      IP Address
                    </span>
                    <strong className="text-foreground">{selectedLog.ip}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">
                      Lokasi Geografis
                    </span>
                    <strong className="text-foreground">
                      {selectedLog.city ? `${selectedLog.city}, ` : ""}
                      {selectedLog.country || "Global / Localhost"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">
                      Form Factor
                    </span>
                    <strong className="text-foreground">
                      {selectedLog.formFactor || "Desktop"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">
                      Peramban (Browser)
                    </span>
                    <strong className="text-foreground">
                      {selectedLog.browser || "Unknown"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">
                      Sistem Operasi
                    </span>
                    <strong className="text-foreground">
                      {selectedLog.os || "Unknown"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">
                      Halaman Asal (Path)
                    </span>
                    <strong className="text-foreground">
                      {selectedLog.path || "/"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-2xs">
                      Provider AI
                    </span>
                    <strong className="text-primary flex items-center gap-1">
                      <SparkleIcon className="h-3 w-3 text-amber-500 shrink-0" />
                      {selectedLog.provider || "Cloudflare"}
                    </strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-2xs">
                      Model ID
                    </span>
                    <strong className="text-foreground break-all text-[10px]">
                      {selectedLog.modelId || "llama-3.3-70b-instruct"}
                    </strong>
                  </div>
                </div>

                {selectedLog.userAgent && (
                  <div className="border-t pt-2 mt-2">
                    <span className="text-muted-foreground block text-2xs font-mono">
                      Raw User Agent:
                    </span>
                    <code className="text-3xs text-muted-foreground/80 break-all block mt-0.5">
                      {selectedLog.userAgent}
                    </code>
                  </div>
                )}
              </div>

              {/* Box Prompt Pengunjung */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-primary font-mono text-2xs font-semibold uppercase">
                  <span>Pertanyaan / Prompt Pengunjung:</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(selectedLog.userPrompt, "prompt")
                    }
                    className="hover:underline flex items-center gap-1 font-sans text-2xs"
                  >
                    {copiedText === "prompt" ? (
                      <CheckIcon className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <CopyIcon className="h-3 w-3" />
                    )}
                    <span>Salin</span>
                  </button>
                </div>
                <p className="text-sm font-medium whitespace-pre-wrap text-foreground">
                  {selectedLog.userPrompt}
                </p>
              </div>

              {/* Box Respons AI */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground font-mono text-2xs font-semibold uppercase">
                  <div className="flex items-center gap-1.5">
                    <RobotIcon className="h-3.5 w-3.5 text-primary" />
                    <span>Jawaban AI:</span>
                    {selectedLog.modelId && (
                      <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-mono text-foreground font-normal">
                        {selectedLog.modelId}
                      </span>
                    )}
                  </div>
                  {selectedLog.aiResponse && (
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(selectedLog.aiResponse || "", "resp")
                      }
                      className="hover:underline flex items-center gap-1 font-sans text-2xs"
                    >
                      {copiedText === "resp" ? (
                        <CheckIcon className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <CopyIcon className="h-3 w-3" />
                      )}
                      <span>Salin Respons</span>
                    </button>
                  )}
                </div>
                <div className="text-xs leading-relaxed whitespace-pre-wrap text-foreground max-h-60 overflow-y-auto pr-1">
                  {selectedLog.aiResponse || (
                    <span className="italic text-muted-foreground">
                      (Respons tidak tercatat atau error)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
