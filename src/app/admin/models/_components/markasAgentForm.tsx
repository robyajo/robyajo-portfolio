"use client";

import { useState, useMemo, useEffect } from "react";
import type {
  AiModelRow,
  AiProviderRow,
  AiSettingInput,
  AiSettingRow,
  MarkasAgentMetadata,
} from "@/lib/ai-schema";
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
import { Badge } from "@/components/ui/badge";
import {
  RobotIcon,
  SparkleIcon,
  CheckCircleIcon,
  ArrowClockwiseIcon,
} from "@/components/shared/icons";

export interface DefaultAgentProfile {
  id: string;
  name: string;
  role: string;
  badge: string;
  icon: string;
  specialty: string;
  defaultTask: string;
  defaultProviderId: string;
  defaultModelId: string;
  promptDirective: string;
}

export const DEFAULT_MARKAS_AGENTS: DefaultAgentProfile[] = [
  {
    id: "roby",
    name: "Roby Karti S.",
    role: "Pimpinan & Lead Architect",
    badge: "PIMPINAN",
    icon: "👨‍💻",
    specialty: "Fullstack Architecture, Cloud Systems, & Multi-Agent Direction",
    defaultTask: "Pimpinan Roby mengarahkan koordinasi arsitektur sistem dan memantau video keynote",
    defaultProviderId: "cloudflare",
    defaultModelId: "@cf/zai-org/glm-4.7-flash",
    promptDirective:
      "Kamu adalah Roby Karti S., Pimpinan dan Lead Architect Markas. Bertugas mengambil keputusan strategis, mengarahkan tim, dan memvalidasi arsitektur menyeluruh.",
  },
  {
    id: "buruang",
    name: "Buruang",
    role: "Kepala Proyek",
    badge: "PROJECT LEAD",
    icon: "📋",
    specialty: "Quality Control, Audit 25+ Proyek Portofolio, & Milestone Verification",
    defaultTask: "Buruang berkeliling menginspeksi papan proyek dan kelaikan rilis tim",
    defaultProviderId: "cloudflare",
    defaultModelId: "@cf/qwen/qwen3-30b-a3b-fp8",
    promptDirective:
      "Kamu adalah Buruang, Kepala Proyek Markas. Bertugas melakukan quality audit, memeriksa status 25+ proyek portofolio, dan memverifikasi pengiriman berkas oleh kurir.",
  },
  {
    id: "koncek",
    name: "Koncek",
    role: "Backend Specialist",
    badge: "BACKEND",
    icon: "🐹",
    specialty: "Golang, PostgreSQL, Redis, REST APIs, & High-Concurrency Systems",
    defaultTask: "Koncek mengoptimalkan query SQL, goroutine pool, dan latency endpoint",
    defaultProviderId: "cloudflare",
    defaultModelId: "@cf/zai-org/glm-4.7-flash",
    promptDirective:
      "Kamu adalah Koncek, Backend Specialist Markas. Fokus pada performa server, efisiensi database PostgreSQL, Redis caching, dan arsitektur gRPC/REST.",
  },
  {
    id: "biawak",
    name: "Biawak",
    role: "Frontend Specialist",
    badge: "FRONTEND",
    icon: "🦎",
    specialty: "Next.js Turbopack, React 19, Tailwind CSS v4, 3D WebGL Three.js",
    defaultTask: "Biawak memoles tampilan UI/UX responsif dan visualisasi 3D WebGL",
    defaultProviderId: "cloudflare",
    defaultModelId: "@cf/zai-org/glm-4.7-flash",
    promptDirective:
      "Kamu adalah Biawak, Frontend & UI/UX Specialist Markas. Fokus pada tampilan interaktif, animasi 60 FPS, layout shifting, dan estetika desain modern.",
  },
  {
    id: "bonta",
    name: "Bonta",
    role: "Security Specialist",
    badge: "SECURITY",
    icon: "🛡️",
    specialty: "Cloudflare WAF, OWASP Top 10 Hardening, Anti-DDoS, SSL/TLS Grade A+",
    defaultTask: "Bonta mengaudit keamanan firewall dan menolak paket anomali",
    defaultProviderId: "cloudflare",
    defaultModelId: "@cf/qwen/qwen3-30b-a3b-fp8",
    promptDirective:
      "Kamu adalah Bonta, Security Specialist Markas. Bertugas menegakkan zero-trust, memantau alert WAF, mitigasi SQLi/XSS, dan memastikan keamanan absolut.",
  },
  {
    id: "bala",
    name: "Bala",
    role: "Support Specialist",
    badge: "SUPPORT",
    icon: "🎧",
    specialty: "VPS Droplets Uptime 99.99%, Customer Care, & Nginx Reverse Proxy",
    defaultTask: "Bala memantau kesehatan server Singapore dan tiket bantuan",
    defaultProviderId: "cloudflare",
    defaultModelId: "@cf/zai-org/glm-4.7-flash",
    promptDirective:
      "Kamu adalah Bala, Support Specialist Markas. Ramah, sigap membantu pertanyaan pengunjung, memantau uptime server VPS, dan menyelesaikan tiket inbox.",
  },
  {
    id: "putri",
    name: "Putri",
    role: "Istri Pimpinan & First Lady Markas",
    badge: "FIRST LADY",
    icon: "🌸",
    specialty: "Dukungan Penuh Keluarga, Menemani Ayah di Ruangan Anak Markas",
    defaultTask: "Putri duduk santai di bangku tunggu lounge mendampingi Ayah Roby dan Alyona",
    defaultProviderId: "cloudflare",
    defaultModelId: "@cf/zai-org/glm-4.7-flash",
    promptDirective:
      "Kamu adalah Putri, Istri tercinta dari Roby Karti S. dan First Lady Markas. Selalu ramah, hangat, penuh perhatian, dan bangga atas dedikasi kerja Ayah Roby.",
  },
  {
    id: "alyona",
    name: "Alyona",
    role: "Putri Kecil Roby (Maskot Ceria Markas)",
    badge: "PUTRI KECIL",
    icon: "🎀",
    specialty: "Bermain Ceria dengan Boneka Beruang di Markas",
    defaultTask: "Alyona bermain riang gembira di lantai markas di ruangan anak dan mendekati meja Ayah",
    defaultProviderId: "cloudflare",
    defaultModelId: "@cf/zai-org/glm-4.7-flash",
    promptDirective:
      "Kamu adalah Alyona, anak perempuan kecil tercinta dari Ayah Roby dan Bunda Putri. Ceria, suka main boneka beruang, kagum dengan komputer markas Ayah yang kedap-kedip!",
  },
];

interface MarkasAgentFormProps {
  settings: Record<string, AiSettingRow>;
  providers: AiProviderRow[];
  models: AiModelRow[];
  onSubmit: (data: AiSettingInput) => Promise<void>;
  submitting: boolean;
}

export function MarkasAgentForm({
  settings,
  providers,
  models,
  onSubmit,
  submitting,
}: MarkasAgentFormProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("roby");

  const currentDefault = useMemo(() => {
    return (
      DEFAULT_MARKAS_AGENTS.find((a) => a.id === selectedAgentId) ||
      DEFAULT_MARKAS_AGENTS[0]
    );
  }, [selectedAgentId]);

  const taskKey = `markas_${selectedAgentId}`;
  const currentSetting = settings[taskKey];

  // Parse custom metadata if stored in systemPrompt as JSON
  const parsedMeta: Partial<MarkasAgentMetadata> = useMemo(() => {
    if (!currentSetting?.systemPrompt) return {};
    try {
      if (currentSetting.systemPrompt.startsWith("{")) {
        return JSON.parse(currentSetting.systemPrompt);
      }
    } catch {
      // Plain text fallback
    }
    return { promptDirective: currentSetting.systemPrompt };
  }, [currentSetting?.systemPrompt]);

  // Form State
  const [name, setName] = useState(
    parsedMeta.name || currentDefault.name,
  );
  const [role, setRole] = useState(
    parsedMeta.role || currentDefault.role,
  );
  const [badge, setBadge] = useState(
    parsedMeta.badge || currentDefault.badge,
  );
  const [specialty, setSpecialty] = useState(
    parsedMeta.specialty || currentDefault.specialty,
  );
  const [defaultTask, setDefaultTask] = useState(
    parsedMeta.defaultTask || currentDefault.defaultTask,
  );
  const [promptDirective, setPromptDirective] = useState(
    parsedMeta.promptDirective || currentDefault.promptDirective,
  );

  const [providerId, setProviderId] = useState(
    currentSetting?.providerId || currentDefault.defaultProviderId,
  );

  // Available models for the chosen provider
  const availableModels = useMemo(() => {
    return models.filter((m) => m.providerId === providerId && m.enabled);
  }, [models, providerId]);

  const [modelId, setModelId] = useState(
    currentSetting?.modelId ||
      availableModels[0]?.modelId ||
      currentDefault.defaultModelId,
  );

  const [enableThinking, setEnableThinking] = useState(
    currentSetting?.enableThinking ?? false,
  );
  const [reasoningEffort, setReasoningEffort] = useState<
    "low" | "medium" | "high"
  >((currentSetting?.reasoningEffort as "low" | "medium" | "high") || "medium");
  const [temperature, setTemperature] = useState(
    currentSetting?.temperature || "0.7",
  );
  const [maxTokens, setMaxTokens] = useState<number>(
    currentSetting?.maxTokens || 2048,
  );

  // Update form fields whenever selected agent changes
  useEffect(() => {
    const meta: Partial<MarkasAgentMetadata> = (() => {
      const sp = settings[`markas_${selectedAgentId}`]?.systemPrompt;
      if (!sp) return {};
      try {
        if (sp.startsWith("{")) return JSON.parse(sp);
      } catch {}
      return { promptDirective: sp };
    })();

    const def =
      DEFAULT_MARKAS_AGENTS.find((a) => a.id === selectedAgentId) ||
      DEFAULT_MARKAS_AGENTS[0];
    const s = settings[`markas_${selectedAgentId}`];

    setName(meta.name || def.name);
    setRole(meta.role || def.role);
    setBadge(meta.badge || def.badge);
    setSpecialty(meta.specialty || def.specialty);
    setDefaultTask(meta.defaultTask || def.defaultTask);
    setPromptDirective(meta.promptDirective || def.promptDirective);

    const pid = s?.providerId || def.defaultProviderId;
    setProviderId(pid);

    const curModels = models.filter((m) => m.providerId === pid && m.enabled);
    setModelId(s?.modelId || curModels[0]?.modelId || def.defaultModelId);
    setEnableThinking(s?.enableThinking ?? false);
    setReasoningEffort(
      (s?.reasoningEffort as "low" | "medium" | "high") || "medium",
    );
    setTemperature(s?.temperature || "0.7");
    setMaxTokens(s?.maxTokens || 2048);
  }, [selectedAgentId, settings, models]);

  const selectedModelRow = useMemo(() => {
    return models.find(
      (m) => m.providerId === providerId && m.modelId === modelId,
    );
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

  const handleResetToDefault = () => {
    setName(currentDefault.name);
    setRole(currentDefault.role);
    setBadge(currentDefault.badge);
    setSpecialty(currentDefault.specialty);
    setDefaultTask(currentDefault.defaultTask);
    setPromptDirective(currentDefault.promptDirective);
    setProviderId(currentDefault.defaultProviderId);
    setModelId(currentDefault.defaultModelId);
    setTemperature("0.7");
    setMaxTokens(2048);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId) return;

    const metadata: MarkasAgentMetadata = {
      id: selectedAgentId,
      name: name.trim() || currentDefault.name,
      role: role.trim() || currentDefault.role,
      badge: badge.trim().toUpperCase() || currentDefault.badge,
      specialty: specialty.trim() || currentDefault.specialty,
      defaultTask: defaultTask.trim() || currentDefault.defaultTask,
      avatarIcon: currentDefault.icon,
      promptDirective: promptDirective.trim() || currentDefault.promptDirective,
    };

    await onSubmit({
      task: `markas_${selectedAgentId}`,
      providerId,
      modelId,
      enableThinking,
      reasoningEffort,
      temperature,
      maxTokens: Number(maxTokens) || 2048,
      systemPrompt: JSON.stringify(metadata),
    });
  };

  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card/60 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <RobotIcon className="size-5 text-primary" />
            Pengaturan Tim Markas AI & Penugasan Role
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pilih dan atur nama anggota, role penugasan, provider AI, dan model AI spesifik yang digunakan untuk masing-masing agen di Markas 3D.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetToDefault}
          className="text-xs h-7 gap-1.5"
        >
          <ArrowClockwiseIcon className="size-3.5" />
          Pulihkan Default Agen
        </Button>
      </div>

      {/* Selector Tab Kartu Agen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-2.5">
        {DEFAULT_MARKAS_AGENTS.map((agent) => {
          const isSelected = agent.id === selectedAgentId;
          const assignedSetting = settings[`markas_${agent.id}`];
          const hasCustomConfig = Boolean(assignedSetting?.modelId);

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgentId(agent.id)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all relative ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                  : "border-border/60 hover:bg-muted/40 bg-card/40"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xl">{agent.icon}</span>
                {hasCustomConfig && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" title="Model AI Aktif dari DB" />
                )}
              </div>
              <span className="font-semibold text-xs truncate w-full text-foreground">
                {agent.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate w-full">
                {agent.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Formulir Pengaturan Agen Terpilih */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
        <div className="flex items-center gap-2.5 bg-muted/30 p-3 rounded-lg border border-border/50">
          <span className="text-2xl">{currentDefault.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{name}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {badge}
              </Badge>
              {selectedModelRow?.isThinkingSupported && (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                >
                  Reasoning Ready
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {role} · ID Tugas: <span className="font-mono">markas_{selectedAgentId}</span>
            </p>
          </div>
        </div>

        {/* Baris 1: Nama, Role, Badge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-name" className="text-xs font-medium">
              Nama Anggota
            </Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Roby Karti S."
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-role" className="text-xs font-medium">
              Role / Jabatan
            </Label>
            <Input
              id="agent-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Contoh: Pimpinan & Lead Architect"
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-badge" className="text-xs font-medium">
              Badge Gelar (Singkat)
            </Label>
            <Input
              id="agent-badge"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Contoh: PIMPINAN"
              className="h-8 text-xs font-mono uppercase"
              required
            />
          </div>
        </div>

        {/* Baris 2: Pemilihan Provider & Model AI yang Digunakan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-provider" className="text-xs font-medium">
              Provider AI yang Digunakan
            </Label>
            <Select value={providerId} onValueChange={handleProviderChange}>
              <SelectTrigger id="agent-provider" className="h-8 text-xs">
                <SelectValue placeholder="Pilih Provider AI" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name} {p.enabled ? "" : "(Nonaktif)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[10px] text-muted-foreground">
              Gateway komputasi yang memproses perintah untuk agen ini.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-model" className="text-xs font-medium">
              Model AI dari Provider Tersebut
            </Label>
            <Select value={modelId} onValueChange={(val) => setModelId(val)}>
              <SelectTrigger id="agent-model" className="h-8 text-xs">
                <SelectValue placeholder="Pilih Model AI" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((m) => (
                  <SelectItem key={m.modelId} value={m.modelId} className="text-xs">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-1.5">
                      ({m.modelId})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[10px] text-muted-foreground">
              {selectedModelRow?.description || "Model aktif untuk agen ini."}
            </span>
          </div>
        </div>

        {/* Baris 3: Spesialisasi & Default Task */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-specialty" className="text-xs font-medium">
              Spesialisasi Stack & Keahlian
            </Label>
            <Input
              id="agent-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Contoh: Golang, PostgreSQL, Redis, REST APIs"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-task" className="text-xs font-medium">
              Deskripsi Penugasan Harian (Status Kerja)
            </Label>
            <Input
              id="agent-task"
              value={defaultTask}
              onChange={(e) => setDefaultTask(e.target.value)}
              placeholder="Contoh: Koncek mengoptimalkan backend API & database pool"
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Baris 4: Instruksi System Prompt / Arahan Kerja */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="agent-prompt" className="text-xs font-medium">
            Instruksi Khusus / System Prompt Agen
          </Label>
          <Textarea
            id="agent-prompt"
            value={promptDirective}
            onChange={(e) => setPromptDirective(e.target.value)}
            rows={3}
            placeholder="Tuliskan arahan karakter, persona, atau aturan kerja agen ini saat merespons prompt..."
            className="text-xs font-mono"
          />
        </div>

        {/* Baris 5: Opsi Tingkat Lanjut (Thinking / Temperature / Tokens) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 p-3.5 rounded-lg border border-border/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <Label htmlFor="agent-thinking" className="text-xs font-medium">
                Reasoning Mode
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Tampilkan proses berpikir
              </span>
            </div>
            <Switch
              id="agent-thinking"
              checked={enableThinking}
              onCheckedChange={setEnableThinking}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="agent-temp" className="text-xs font-medium">
              Temperature ({temperature})
            </Label>
            <Input
              id="agent-temp"
              type="number"
              step="0.05"
              min="0"
              max="2"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="agent-tokens" className="text-xs font-medium">
              Max Tokens
            </Label>
            <Input
              id="agent-tokens"
              type="number"
              step="128"
              min="256"
              max="16384"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" size="sm" disabled={submitting} className="h-8 px-4 text-xs">
            {submitting ? (
              <>
                <Spinner className="size-3.5 mr-1.5" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircleIcon className="size-3.5 mr-1.5" />
                Simpan Penugasan {name}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
