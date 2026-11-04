"use client";

import { useState, useCallback } from "react";
import { MarkasCanvas } from "@/components/markas/markas-canvas";
import {
  MarkasChatProvider,
  useMarkasChat,
} from "@/components/markas/markas-chat-state";
import type { ConfiguredMarkasAgent } from "@/lib/ai-config";
import { useDictionary } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";
import { RobotIcon } from "@/components/shared/icons";

interface SpecialistAgent {
  id: string;
  name: string;
  role: string;
  badge: string;
  icon: string;
  model: string;
  specialty: string;
  defaultTask: string;
}

const SPECIALIST_AGENTS: SpecialistAgent[] = [
  {
    id: "roby",
    name: "Roby Karti S.",
    role: "Pimpinan Markas",
    badge: "PIMPINAN",
    icon: "👨‍💻",
    model: "Human Lead & Architect",
    specialty: "Fullstack, Cloud Architecture & Direction",
    defaultTask: "Pimpinan Roby mengarahkan koordinasi arsitektur sistem",
  },
  {
    id: "buruang",
    name: "Buruang",
    role: "Kepala Proyek",
    badge: "PROJECT LEAD",
    icon: "📋",
    model: "ER AI · Project Inspector",
    specialty: "Quality Control, Audit 25+ Proyek & Milestones",
    defaultTask: "Buruang memeriksa seluruh kelaikan proyek portofolio",
  },
  {
    id: "koncek",
    name: "Koncek",
    role: "Backend Specialist",
    badge: "BACKEND",
    icon: "🐹",
    model: "ER AI · Go Specialist",
    specialty: "Golang, PostgreSQL, Redis, REST & gRPC",
    defaultTask: "Koncek mengoptimalkan backend API & database pool",
  },
  {
    id: "biawak",
    name: "Biawak",
    role: "Frontend Specialist",
    badge: "FRONTEND",
    icon: "🦎",
    model: "ER AI · UI/UX Specialist",
    specialty: "Next.js, React, Tailwind CSS, 3D WebGL",
    defaultTask: "Biawak memoles tampilan UI responsif dan animasi 3D",
  },
  {
    id: "bonta",
    name: "Bonta",
    role: "Security Specialist",
    badge: "SECURITY",
    icon: "🛡️",
    model: "ER AI · Security Guard",
    specialty: "WAF, OWASP Hardening, Anti-DDoS, SSL",
    defaultTask: "Bonta mengaudit keamanan WAF dan rate limiting",
  },
  {
    id: "bala",
    name: "Bala",
    role: "Support Specialist",
    badge: "SUPPORT",
    icon: "🎧",
    model: "ER AI · Support Engineer",
    specialty: "Customer Care, Uptime VPS, Ticketing Inbox",
    defaultTask: "Bala memantau uptime dan menangani tiket bantuan",
  },
];

function MarkasViewInner({
  initialAgents,
}: {
  initialAgents?: ConfiguredMarkasAgent[];
}) {
  const dict = useDictionary();
  const { status, activeTask, triggerManualRandomQuip } = useMarkasChat();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("roby");

  const handleSelectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case "thinking":
        return {
          label: dict.markas?.thinking || "Menganalisis Spesifikasi",
          color: "border-sky-500/40 bg-sky-500/10 text-sky-400",
          dot: "bg-sky-400 animate-pulse",
        };
      case "working":
        return {
          label: dict.markas?.working || "Mengetik & Eksekusi",
          color: "border-amber-500/40 bg-amber-500/10 text-amber-400",
          dot: "bg-amber-400 animate-ping",
        };
      case "success":
        return {
          label: dict.markas?.success || "Tugas Selesai",
          color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
          dot: "bg-emerald-400",
        };
      default:
        return {
          label: "Semua Tim Sibuk Bekerja (Obrolan Santai Live)",
          color: "border-border/60 bg-muted/40 text-muted-foreground",
          dot: "bg-emerald-500 animate-pulse",
        };
    }
  };

  const badgeInfo = getStatusBadge();

  return (
    <div className="space-y-6">
      {/* Subagents Grid / Active Team Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RobotIcon className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              Tim Markas: Ayah Roby, Buruang, Koncek, Biawak, Bonta, Bala, Bunda Putri & Alyona
            </h2>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium transition-colors",
              badgeInfo.color,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", badgeInfo.dot)} />
            <span>{badgeInfo.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(initialAgents && initialAgents.length > 0 ? initialAgents : SPECIALIST_AGENTS).map((agent) => {
            const isLead = agent.id === "roby";
            const isSelected = selectedAgentId === agent.id;
            const isAssigned =
              activeTask &&
              (activeTask.toLowerCase().includes(agent.id) ||
                (agent.id === "buruang" && activeTask.toLowerCase().includes("proyek")) ||
                (agent.id === "koncek" && (activeTask.toLowerCase().includes("backend") || activeTask.toLowerCase().includes("api") || activeTask.toLowerCase().includes("database"))) ||
                (agent.id === "biawak" && (activeTask.toLowerCase().includes("frontend") || activeTask.toLowerCase().includes("ui") || activeTask.toLowerCase().includes("animasi"))) ||
                (agent.id === "bonta" && (activeTask.toLowerCase().includes("security") || activeTask.toLowerCase().includes("waf") || activeTask.toLowerCase().includes("keamanan"))) ||
                (agent.id === "bala" && (activeTask.toLowerCase().includes("support") || activeTask.toLowerCase().includes("tiket") || activeTask.toLowerCase().includes("uptime"))));

            return (
              <button
                type="button"
                key={agent.id}
                onClick={() => {
                  handleSelectAgent(agent.id);
                  triggerManualRandomQuip(agent.id);
                }}
                className={cn(
                  "relative flex flex-col justify-between rounded-lg border p-3 text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isLead
                    ? "border-primary/50 bg-primary/[0.04]"
                    : isAssigned
                      ? "border-sky-500/60 bg-sky-500/[0.08] shadow-sm"
                      : isSelected
                        ? "border-primary/40 bg-muted/40 shadow-sm"
                        : "border-border/50 bg-card/60 hover:border-border hover:bg-card",
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-xl" role="img" aria-label={agent.name}>
                      {agent.icon}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[8.5px] font-mono font-bold",
                        isLead
                          ? "bg-primary/10 text-primary"
                          : isAssigned
                            ? "bg-sky-500/20 text-sky-400 animate-pulse"
                            : "bg-muted/60 text-muted-foreground",
                      )}
                    >
                      {agent.badge}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold leading-tight text-foreground line-clamp-1">
                    {agent.name}
                  </h3>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5 line-clamp-1">
                    {agent.role}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-border/40 text-[10px] text-muted-foreground/80 leading-snug line-clamp-2">
                  {agent.specialty}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Immersive Headquarters Canvas (Besar & Penuh dengan Panel Chat Transparan di Dalam) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              Markas 3D Tim (Ruang Anak di Belakang Ayah, Bangku Santai Lounge & Live Stream Chat)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground/70 hidden sm:inline-block">
            Panel Chat Transparan Live Stream di Dalam Kanvas · Fitur Sembunyikan/Tampilkan Tersedia
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xl">
          <MarkasCanvas
            onSelectAgent={handleSelectAgent}
            className="h-[580px] sm:h-[660px] lg:h-[750px] w-full"
          />
        </div>

        {/* Interactive Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-mono text-muted-foreground pt-1">
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-start gap-2.5">
            <span className="text-pink-400 mt-0.5 text-sm">🌸</span>
            <div>
              <p className="font-semibold text-foreground">Ruang Anak Belakang Ayah</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">
                Bunda Putri di kursi santai mewah mendampingi Alyona bermain balok & tenda teepee di belakang meja kerja Ayah.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-start gap-2.5">
            <span className="text-sky-400 mt-0.5 text-sm">🛋️</span>
            <div>
              <p className="font-semibold text-foreground">Bangku Santai & Kurir Express</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">
                Executive Lounge Sofa santai tetap di tempatnya, kurir meluncur antar berkas saat prompt masuk!
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-start gap-2.5">
            <span className="text-emerald-400 mt-0.5 text-sm">💬</span>
            <div>
              <p className="font-semibold text-foreground">Live Stream Chat & Tracer</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">
                Panel chat transparan melayang di dalam kanvas gaya live stream; dapat disembunyikan/ditampilkan kapan saja.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarkasView({
  initialAgents,
}: {
  initialAgents?: ConfiguredMarkasAgent[];
}) {
  return (
    <MarkasChatProvider>
      <MarkasViewInner initialAgents={initialAgents} />
    </MarkasChatProvider>
  );
}
