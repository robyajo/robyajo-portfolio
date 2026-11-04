"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AgentWorkStatus } from "./markas-canvas";

export interface ChatMessage {
  id: string;
  senderId: string; // 'user' | 'assistant' | 'roby' | 'buruang' | 'koncek' | 'biawak' | 'bonta' | 'bala' | 'putri' | 'alyona' | 'courier'
  senderName: string;
  senderBadge?: string;
  senderIcon?: string;
  role: "user" | "assistant" | "system" | "team";
  content: string;
  timestamp: string;
  color?: string;
  isTracer?: boolean;
  tracerSteps?: TracerStep[];
}

export interface TracerStep {
  id: string;
  agentId: string;
  agentName: string;
  role: string;
  badge: string;
  icon: string;
  actionText: string;
  status: "pending" | "running" | "completed";
  durationMs?: number;
}

export interface MarkasChatContextType {
  messages: ChatMessage[];
  status: AgentWorkStatus;
  activeTask: string | null;
  loading: boolean;
  tracerSteps: TracerStep[];
  cooldownSeconds: number; // 180s countdown to 0s
  isCooldownActive: boolean;
  executeSend: (promptText: string) => Promise<void>;
  handleStop: () => void;
  handleClear: () => void;
  registerCourierTrigger: (cb: (taskName?: string) => void) => void;
  registerBubbleTrigger: (cb: (actorId: string, text: string) => void) => void;
  triggerManualRandomQuip: (actorId?: string) => void;
}

const MarkasChatContext = createContext<MarkasChatContextType | null>(null);

// Random dialog scenarios between all models
interface TeamDialogue {
  actorId: string;
  name: string;
  badge: string;
  icon: string;
  color: string;
  content: string;
}

const RANDOM_TEAM_DIALOGUES: TeamDialogue[] = [
  // Scenario 1: Proyek & Kinerja
  {
    actorId: "buruang",
    name: "Buruang",
    badge: "PROJECT LEAD",
    icon: "📋",
    color: "#eab308",
    content: "Lapor Pak Roby, inspeksi 25+ proyek portofolio (SIPRAJA, SuperApp Pekanbaru, Smart Posyandu) lulus quality check 100%! 📋✅",
  },
  {
    actorId: "roby",
    name: "Roby Karti S.",
    badge: "PIMPINAN",
    icon: "👨‍💻",
    color: "#f59e0b",
    content: "Mantap Buruang! Blueprint arsitektur cloud kita makin matang. Saya pantau keynote dulu ya! ☕🎬",
  },
  {
    actorId: "koncek",
    name: "Koncek",
    badge: "BACKEND",
    icon: "🐹",
    color: "#06b6d4",
    content: "Query database PostgreSQL proyek portofolio udah di-cache Redis, response time super ngebut 0.8ms! 🐹⚡",
  },
  {
    actorId: "biawak",
    name: "Biawak",
    badge: "FRONTEND",
    icon: "🦎",
    color: "#10b981",
    content: "Komponen UI responsif Next.js dan animasi 3D WebGL 60 FPS halus banget di semua layar perangkat 🦎🎨",
  },
  // Scenario 2: Kehangatan Keluarga di Ruang Anak Belakang Ayah
  {
    actorId: "alyona",
    name: "Alyona",
    badge: "PUTRI KECIL",
    icon: "🧸",
    color: "#f59e0b",
    content: "Ayah! Lihat Alyona baru bikin istana balok warna-warni di karpet mainan belakang meja Ayah! 🏰✨",
  },
  {
    actorId: "putri",
    name: "Bunda Putri",
    badge: "FIRST LADY",
    icon: "🌸",
    color: "#ec4899",
    content: "Pintar sekali anak Bunda. Ayah lagi fokus kerja memimpin markas, kita temani dari kursi santai ya sayang 🛋️💕",
  },
  {
    actorId: "roby",
    name: "Roby Karti S.",
    badge: "PIMPINAN",
    icon: "👨‍💻",
    color: "#f59e0b",
    content: "Anak pinter kesayangan Ayah! Terima kasih Bunda Putri sudah mendampingi di markas tercinta ❤️",
  },
  // Scenario 3: Keamanan & Uptime Markas
  {
    actorId: "bonta",
    name: "Bonta",
    badge: "SECURITY",
    icon: "🛡️",
    color: "#ef4444",
    content: "Status WAF ruleset updated, zero DDoS threat terdeteksi, proteksi OWASP aktif 100%! 🛡️🔒",
  },
  {
    actorId: "bala",
    name: "Bala",
    badge: "SUPPORT",
    icon: "🎧",
    color: "#8b5cf6",
    content: "Uptime server VPS 99.99%, tiket pengunjung tuntas terjawab, semua performa optimal! 🎧🌟",
  },
  {
    actorId: "courier",
    name: "Kurir Express",
    badge: "COURIER",
    icon: "📦",
    color: "#f97316",
    content: "Kurir siap siaga di pintu masuk! Begitu pengunjung mengirim prompt, berkas langsung saya antarkan ke meja komando 📦💨",
  },
  // Scenario 4: Suasana Santai Markas
  {
    actorId: "putri",
    name: "Bunda Putri",
    badge: "FIRST LADY",
    icon: "🌸",
    color: "#ec4899",
    content: "Ayah Roby, jangan lupa diminum teh dan kopinya ya, rokoknya jangan banyak-banyak biar tetap bugar ☕🌸",
  },
  {
    actorId: "roby",
    name: "Roby Karti S.",
    badge: "PIMPINAN",
    icon: "👨‍💻",
    color: "#f59e0b",
    content: "Siap Bunda tersayang! Sebat dulu sebatang sambil menanti arahan atau prompt baru dari pengunjung ☕🚬",
  },
  {
    actorId: "koncek",
    name: "Koncek",
    badge: "BACKEND",
    icon: "🐹",
    color: "#06b6d4",
    content: "Break 2 menit stretching ke sofa lounge santai dulu ah, ambil air di dispenser 🛋️💧",
  },
  {
    actorId: "biawak",
    name: "Biawak",
    badge: "FRONTEND",
    icon: "🦎",
    color: "#10b981",
    content: "Ikut Koncek, bangku santai di lounge empuk banget buat refreshing mata sejenak 🛋️🦎",
  },
];

// Initial Tracer Steps Template
export const INITIAL_TRACER_STEPS: TracerStep[] = [
  {
    id: "step-courier",
    agentId: "courier",
    agentName: "Kurir Paket Express",
    role: "Kurir Pengantar Tugas",
    badge: "COURIER",
    icon: "📦",
    actionText: "Mengantarkan berkas prompting user dari pintu masuk ke meja markas pimpinan",
    status: "pending",
  },
  {
    id: "step-roby",
    agentId: "roby",
    agentName: "Roby Karti S.",
    role: "Pimpinan & Lead Architect",
    badge: "PIMPINAN",
    icon: "👨‍💻",
    actionText: "Menerima berkas kurir, merumuskan arsitektur sistem, dan mendisposisi task ke tim",
    status: "pending",
  },
  {
    id: "step-buruang",
    agentId: "buruang",
    agentName: "Buruang",
    role: "Kepala Proyek",
    badge: "PROJECT LEAD",
    icon: "📋",
    actionText: "Menginspeksi dependensi 25+ proyek portofolio dan membagi sprint tugas ke tim dev",
    status: "pending",
  },
  {
    id: "step-koncek",
    agentId: "koncek",
    agentName: "Koncek",
    role: "Backend Specialist",
    badge: "BACKEND",
    icon: "🐹",
    actionText: "Memproses query database PostgreSQL, optimasi indexing, dan strategi caching Redis",
    status: "pending",
  },
  {
    id: "step-biawak",
    agentId: "biawak",
    agentName: "Biawak",
    role: "Frontend Specialist",
    badge: "FRONTEND",
    icon: "🦎",
    actionText: "Mengintegrasikan UI komponen responsif Next.js dan animasi Three.js WebGL 60 FPS",
    status: "pending",
  },
  {
    id: "step-bonta",
    agentId: "bonta",
    agentName: "Bonta",
    role: "Security Specialist",
    badge: "SECURITY",
    icon: "🛡️",
    actionText: "Menjalankan audit kerentanan OWASP, verifikasi ruleset WAF, dan proteksi server",
    status: "pending",
  },
  {
    id: "step-bala",
    agentId: "bala",
    agentName: "Bala",
    role: "Support & DevOps",
    badge: "SUPPORT",
    icon: "🎧",
    actionText: "Memverifikasi uptime VPS cloud, validasi deployment pipeline, dan uji performa latency",
    status: "pending",
  },
  {
    id: "step-done",
    agentId: "roby",
    agentName: "Roby Karti S. (Finalisasi)",
    role: "Sintesis & Penyajian",
    badge: "SUCCESS",
    icon: "🚀",
    actionText: "Menyintesis seluruh hasil kerja tim dev dan mempresentasikan respons komprehensif ke pengunjung",
    status: "pending",
  },
];

export function MarkasChatProvider({
  children,
  onExternalStatusChange,
  onExternalTaskChange,
}: {
  children: React.ReactNode;
  onExternalStatusChange?: (status: AgentWorkStatus) => void;
  onExternalTaskChange?: (task: string | null) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "init-welcome",
      senderId: "roby",
      senderName: "Roby Karti S.",
      senderBadge: "PIMPINAN",
      senderIcon: "👨‍💻",
      color: "#f59e0b",
      role: "team",
      content:
        "Selamat datang di Markas AI! Kursi pimpinan siap, kopi & rokok tersedia, dan keluarga tercinta Bunda Putri bersama Alyona mendampingi di ruang anak belakang saya. Kirimkan prompt untuk melihat seluruh agen kami bekerja! ☕🎬🍿",
      timestamp: "08:00:00",
    },
    {
      id: "init-buruang",
      senderId: "buruang",
      senderName: "Buruang",
      senderBadge: "PROJECT LEAD",
      senderIcon: "📋",
      color: "#eab308",
      role: "team",
      content:
        "Buruang memverifikasi seluruh 25+ proyek portofolio aman terkendali. Tim markas standby menerima instruksi! 📋",
      timestamp: "08:00:04",
    },
  ]);

  const [status, setStatus] = useState<AgentWorkStatus>("idle");
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracerSteps, setTracerSteps] = useState<TracerStep[]>([]);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const courierTriggerRef = useRef<((taskName?: string) => void) | null>(null);
  const bubbleTriggerRef = useRef<((actorId: string, text: string) => void) | null>(null);
  const dialogIndexRef = useRef(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateStatus = useCallback(
    (newStatus: AgentWorkStatus) => {
      setStatus(newStatus);
      onExternalStatusChange?.(newStatus);
    },
    [onExternalStatusChange],
  );

  const updateTask = useCallback(
    (newTask: string | null) => {
      setActiveTask(newTask);
      onExternalTaskChange?.(newTask);
    },
    [onExternalTaskChange],
  );

  const registerCourierTrigger = useCallback((cb: (taskName?: string) => void) => {
    courierTriggerRef.current = cb;
  }, []);

  const registerBubbleTrigger = useCallback((cb: (actorId: string, text: string) => void) => {
    bubbleTriggerRef.current = cb;
  }, []);

  const getTimestamp = () => {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());
  };

  // Trigger manual or specific quip
  const triggerManualRandomQuip = useCallback((actorId?: string) => {
    let pick = RANDOM_TEAM_DIALOGUES[dialogIndexRef.current % RANDOM_TEAM_DIALOGUES.length];
    if (actorId) {
      const filtered = RANDOM_TEAM_DIALOGUES.filter((d) => d.actorId === actorId);
      if (filtered.length > 0) {
        pick = filtered[Math.floor(Math.random() * filtered.length)];
      }
    } else {
      dialogIndexRef.current++;
    }

    const newMsg: ChatMessage = {
      id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: pick.actorId,
      senderName: pick.name,
      senderBadge: pick.badge,
      senderIcon: pick.icon,
      color: pick.color,
      role: "team",
      content: pick.content,
      timestamp: getTimestamp(),
    };

    setMessages((prev) => [...prev.slice(-40), newMsg]);
    bubbleTriggerRef.current?.(pick.actorId, pick.content);
  }, []);

  // Periodic Random Chatter during Idle (natural duration: 22s - 32s, only when page is active)
  useEffect(() => {
    if (loading || cooldownSeconds > 0 || status !== "idle") return;

    let timer: NodeJS.Timeout | null = null;
    let isMounted = true;

    const scheduleNextQuip = () => {
      if (!isMounted) return;
      // Durasi santai natural 20-30 detik agar tidak seperti spam
      const delay = 22000 + Math.random() * 10000;
      timer = setTimeout(() => {
        if (!isMounted) return;
        // Hanya kirimkan percakapan santai jika tab browser sedang aktif dibuka user
        if (typeof document !== "undefined" && !document.hidden) {
          triggerManualRandomQuip();
        }
        scheduleNextQuip();
      }, delay);
    };

    // Jeda awal sebelum celetukan pertama agar tenang saat baru masuk halaman
    timer = setTimeout(() => {
      if (!isMounted) return;
      if (typeof document !== "undefined" && !document.hidden) {
        triggerManualRandomQuip();
      }
      scheduleNextQuip();
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.hidden && timer) {
        clearTimeout(timer);
        timer = null;
      } else if (!document.hidden && !timer) {
        scheduleNextQuip();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [loading, cooldownSeconds, status, triggerManualRandomQuip]);

  // Cooldown countdown timer (3 minutes = 180 seconds)
  useEffect(() => {
    if (cooldownSeconds <= 0) {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      return;
    }

    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          // Cooldown finished: resume random team conversations!
          updateStatus("idle");
          triggerManualRandomQuip("roby");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, [cooldownSeconds, updateStatus, triggerManualRandomQuip]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    updateStatus("idle");
    setCooldownSeconds(0);
  }, [updateStatus]);

  const handleClear = useCallback(() => {
    handleStop();
    setMessages([]);
    setTracerSteps([]);
    updateTask(null);
  }, [handleStop, updateTask]);

  // Main Prompt Execution with Courier and Multi-Agent Tracer
  const executeSend = useCallback(
    async (promptText: string) => {
      const trimmed = promptText.trim();
      if (!trimmed || loading) return;

      // 1. Reset any ongoing cooldown
      setCooldownSeconds(0);
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }

      setLoading(true);
      updateStatus("thinking");
      updateTask(trimmed);

      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `assistant-${Date.now()}`;
      const time = getTimestamp();

      // Initialize tracer steps
      const steps: TracerStep[] = INITIAL_TRACER_STEPS.map((s) => ({
        ...s,
        status: "pending" as const,
      }));
      setTracerSteps(steps);

      // Add user message and blank assistant message with initial tracer steps
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          senderId: "user",
          senderName: "Pengunjung / User",
          role: "user",
          content: trimmed,
          timestamp: time,
        },
        {
          id: assistantMsgId,
          senderId: "assistant",
          senderName: "Tim Markas AI",
          senderBadge: "ALL AGENTS",
          senderIcon: "⚡",
          role: "assistant",
          content: "",
          timestamp: time,
          tracerSteps: steps,
        },
      ]);

      const updateTracer = (updater: (prev: TracerStep[]) => TracerStep[]) => {
        setTracerSteps((prev) => {
          const next = updater(prev);
          setMessages((mPrev) =>
            mPrev.map((m) =>
              m.id === assistantMsgId ? { ...m, tracerSteps: next } : m,
            ),
          );
          return next;
        });
      };

      // 2. TRIGGER COURIER DELIVERY IN 3D CANVAS
      courierTriggerRef.current?.(trimmed);
      bubbleTriggerRef.current?.(
        "courier",
        `Permisi! Paket hasil prompting "${trimmed.slice(0, 32)}..." segera diantarkan ke meja komando! 📦💨`,
      );

      // Setup abort controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Step progression simulation alongside real AI stream
        updateStatus("working");

        // Advance Step 0: Courier -> Completed, Step 1: Roby -> Running
        updateTracer((prev) =>
          prev.map((s, idx) =>
            idx === 0
              ? { ...s, status: "completed" }
              : idx === 1
                ? { ...s, status: "running" }
                : s,
          ),
        );

        // Advance Step 1: Roby -> Completed, Step 2: Buruang -> Running
        setTimeout(() => {
          bubbleTriggerRef.current?.(
            "roby",
            "Berkas kurir diterima! Saya rumuskan arsitektur sistem, Buruang silakan distribusikan sprint ke tim dev 🍿🎬",
          );
          updateTracer((prev) =>
            prev.map((s, idx) =>
              idx <= 1
                ? { ...s, status: "completed" }
                : idx === 2
                  ? { ...s, status: "running" }
                  : s,
            ),
          );
        }, 900);

        // Advance Step 2: Buruang -> Completed, Step 3: Koncek -> Running
        setTimeout(() => {
          bubbleTriggerRef.current?.(
            "buruang",
            "Buruang membagi sprint: Koncek (Backend), Biawak (Frontend), Bonta (Security), Bala (DevOps) langsung gas di meja masing-masing! 📋⚡",
          );
          updateTracer((prev) =>
            prev.map((s, idx) =>
              idx <= 2
                ? { ...s, status: "completed" }
                : idx === 3
                  ? { ...s, status: "running" }
                  : s,
            ),
          );
        }, 1800);

        // Advance Step 3: Koncek -> Completed, Step 4: Biawak -> Running
        setTimeout(() => {
          bubbleTriggerRef.current?.(
            "koncek",
            "Query PostgreSQL di-cache Redis, latensi super ngebut 0.8ms! 🐹⚡",
          );
          updateTracer((prev) =>
            prev.map((s, idx) =>
              idx <= 3
                ? { ...s, status: "completed" }
                : idx === 4
                  ? { ...s, status: "running" }
                  : s,
            ),
          );
        }, 2700);

        // Advance Step 4: Biawak -> Completed, Step 5: Bonta -> Running
        setTimeout(() => {
          bubbleTriggerRef.current?.(
            "biawak",
            "Komponen UI Next.js & WebGL 60 FPS responsif selesai dioptimasi! 🦎🎨",
          );
          updateTracer((prev) =>
            prev.map((s, idx) =>
              idx <= 4
                ? { ...s, status: "completed" }
                : idx === 5
                  ? { ...s, status: "running" }
                  : s,
            ),
          );
        }, 3600);

        // Advance Step 5: Bonta -> Completed, Step 6: Bala -> Running
        setTimeout(() => {
          bubbleTriggerRef.current?.(
            "bonta",
            "Audit OWASP lulus 100%, proteksi WAF & anti-DDoS aktif penuh! 🛡️🔒",
          );
          updateTracer((prev) =>
            prev.map((s, idx) =>
              idx <= 5
                ? { ...s, status: "completed" }
                : idx === 6
                  ? { ...s, status: "running" }
                  : s,
            ),
          );
        }, 4500);

        // Advance Step 6: Bala -> Completed, Step 7: Roby Finalisasi -> Running
        setTimeout(() => {
          bubbleTriggerRef.current?.(
            "bala",
            "Uptime VPS cloud 99.99%, latency stabil, pipeline deployment tuntas! 🎧🌟",
          );
          updateTracer((prev) =>
            prev.map((s, idx) =>
              idx <= 6
                ? { ...s, status: "completed" }
                : idx === 7
                  ? { ...s, status: "running" }
                  : s,
            ),
          );
        }, 5300);

        // Fetch streaming response from /api/chat
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: trimmed }],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => null);
          throw new Error(errJson?.error || `Gagal menghubungi server (${response.status})`);
        }

        if (!response.body) {
          throw new Error("Respons streaming tidak tersedia.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          streamedContent += chunk;

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: streamedContent } : m)),
          );
        }

        // All steps completed
        updateTracer((prev) => prev.map((s) => ({ ...s, status: "completed" })));
        updateStatus("success");

        bubbleTriggerRef.current?.(
          "roby",
          `Tugas selesai diproses dengan sempurna oleh seluruh tim Markas! Lanjut pantau video lagi 🍿☕`,
        );

        // 3. START 3 MINUTES (180 SECONDS) COOLDOWN BEFORE RESUMING RANDOM CHATTER
        setCooldownSeconds(180);
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + "\n\n*(Instruksi dihentikan oleh pengguna)*" }
                : m,
            ),
          );
        } else {
          const msg = (err as Error)?.message || "Terjadi kesalahan saat memproses prompt.";
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: `❌ **Error**: ${msg}` } : m)),
          );
        }
        updateTracer((prev) =>
          prev.map((s) => (s.status === "running" ? { ...s, status: "completed" } : s)),
        );
        updateStatus("idle");
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [loading, updateStatus, updateTask],
  );

  return (
    <MarkasChatContext.Provider
      value={{
        messages,
        status,
        activeTask,
        loading,
        tracerSteps,
        cooldownSeconds,
        isCooldownActive: cooldownSeconds > 0,
        executeSend,
        handleStop,
        handleClear,
        registerCourierTrigger,
        registerBubbleTrigger,
        triggerManualRandomQuip,
      }}
    >
      {children}
    </MarkasChatContext.Provider>
  );
}

export function useMarkasChat() {
  const ctx = useContext(MarkasChatContext);
  if (!ctx) {
    throw new Error("useMarkasChat must be used within MarkasChatProvider");
  }
  return ctx;
}
