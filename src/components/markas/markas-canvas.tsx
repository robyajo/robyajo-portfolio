"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import {
  ArrowClockwiseIcon,
  PlayIcon,
  PauseIcon,
  RobotIcon,
  SparkleIcon,
  ArrowsOutSimpleIcon,
  ArrowsInSimpleIcon,
  ChatCircleIcon,
} from "@/components/shared/icons";
import { useMarkasChat } from "./markas-chat-state";
import { MarkasChatPanel } from "./markas-chat-panel";
import { cn } from "@/lib/cn";

export type AgentWorkStatus = "idle" | "thinking" | "working" | "success";

interface MarkasCanvasProps {
  status?: AgentWorkStatus;
  activeTask?: string | null;
  className?: string;
  onSelectAgent?: (agentId: string) => void;
}

interface ActorDef {
  id: string;
  name: string;
  role: string;
  titleBadge: string;
  color: string;
  shirtColor: string;
  hairColor: string;
  deskPos: [number, number, number];
  terminalHeader: string;
  terminalLogs: string[];
  quips: string[];
}

const ACTORS_DEF: ActorDef[] = [
  {
    id: "roby",
    name: "Roby Karti S.",
    role: "Pimpinan & Lead Architect",
    titleBadge: "PIMPINAN",
    color: "#f59e0b", // Amber/Gold Leader
    shirtColor: "#1e1b4b", // Midnight Indigo Suit
    hairColor: "#18181b",
    deskPos: [-5.0, 0, -3.2],
    terminalHeader: "YOUTUBE-STREAM-LEADER",
    terminalLogs: [
      "▶ [LIVE 4K] Tech Keynotes, Lo-Fi Chill Beats & Cinema",
      "● Channel: Silicon Valley Tech & Architecture Summit",
      "● Viewer Mode: Boss Stream · Resolution 2160p60 HDR",
      "● Playing: 'How Visionary Leaders Orchestrate AI Agents'",
      "● Next Up: 'Fullstack Systems & 3D Interactive WebGL'",
      "● Streaming smoothly at 60 FPS · Volume 75%",
    ],
    quips: [
      "Nonton video keynote tech santai dulu, tim yang eksekusi! ☕🍿",
      "Sebagai pimpinan, tugas saya strategi, monitoring video, & delegasi 🎬",
      "Keren banget materi AI keynote ini! Tim dev tetap semangat ya! 😎",
      "Kerja santai, hasil maksimal. 25+ proyek portofolio aman terkendali 💼",
      "Pimpinan tugasnya mikir arah besar, tim Markas yang gass koding! 🚀",
      "Nonton video sambil hisap sebatang rokok & ngopi dulu, inspirasi arsitektur mengalir deras! ☕🚬",
      "Pikiran tenang, sebat dulu sambil pantau dashboard & video keynote 🍿🚬",
      "Keluarga tercinta Bunda Putri & Alyona ada di ruang anak markas, Ayah makin semangat kerja! ❤️",
    ],
  },
  {
    id: "buruang",
    name: "Buruang",
    role: "Kepala Proyek",
    titleBadge: "PROJECT LEAD",
    color: "#eab308", // Yellow
    shirtColor: "#ca8a04",
    hairColor: "#451a03",
    deskPos: [-1.0, 0, 1.8],
    terminalHeader: "BURUANG@PORTFOLIO-PROJECTS-QC",
    terminalLogs: [
      "[INSPECT] Scanning 25+ portfolio projects...",
      "[QC-PASS] robyajo-portfolio: 100% HEALTHY",
      "[MILESTONE] Sprint #42: 18 tasks completed",
      "[AUDIT] Next.js Turbopack build: SUCCESS (72 pages)",
      "[ROBY-FEEDBACK] Leader watching keynotes, roadmap approved",
      "[DISPATCH] Next package dispatch queued to courier",
    ],
    quips: [
      "Buruang mengecek seluruh 25+ proyek portofolio: semua aman & online! 📋",
      "Papan Kanban dan timeline proyek terverifikasi tanpa kendala! 📌",
      "Laporan sprint sudah saya kirimkan ke meja Pak Roby! 📝",
      "Semua modul selesai sesuai spesifikasi dan standar kualitas tinggi! 🔍",
      "Satu lagi tiket selesai, kurir siap mengantarkan berkas! 📬",
    ],
  },
  {
    id: "koncek",
    name: "Koncek",
    role: "Backend & Database",
    titleBadge: "BACKEND",
    color: "#06b6d4", // Cyan
    shirtColor: "#0e7490",
    hairColor: "#27272a",
    deskPos: [-2.2, 0, -3.2],
    terminalHeader: "KONCEK@GOLANG-POSTGRES-SRV",
    terminalLogs: [
      "[GIN] POST /api/chat --> 200 OK (11ms)",
      "[POSTGRES] Pool: 25/25 active, 0 idle",
      "[REDIS] HIT: key:projects_cache (99.4%)",
      "[GOROUTINE] 148 workers non-blocking",
      "[DB] Query execution time: 0.8ms",
      "[ENDPOINT] REST & gRPC endpoints ready",
    ],
    quips: [
      "API latency 11ms, goroutine pool aman tanpa deadlock! 🐹",
      "Query database sudah di-optimize pakai composite index ⚡",
      "Redis caching hit ratio 99.4%, backend enteng banget! 🚀",
      "Break sebentar ambil minum di dispenser, lalu gas koding lagi! 💧",
      "Koneksi pool PostgreSQL stabil 100% tanpa connection leak 💾",
    ],
  },
  {
    id: "biawak",
    name: "Biawak",
    role: "Frontend & UI/UX",
    titleBadge: "FRONTEND",
    color: "#10b981", // Emerald
    shirtColor: "#047857",
    hairColor: "#3f3f46",
    deskPos: [0.6, 0, -3.2],
    terminalHeader: "BIAWAK@NEXTJS-TURBOPACK-DEV",
    terminalLogs: [
      "▲ Next.js 16.3.6 Turbopack ready (:3000)",
      "✓ Compiled /markas in 14ms (3D WebGL)",
      "✓ Responsive layout shift: 60 FPS verified",
      "✓ Tailwind CSS v4 loaded, 0 layout shifts",
      "✓ Dark/Light mode theme contrast: 100%",
      "✓ DOM hydration & micro-interactions OK",
    ],
    quips: [
      "Komponen Tailwind CSS sudah 100% responsif & clean! 🦎",
      "Animasi Three.js 60 FPS mulus di mobile & desktop ✨",
      "Sofa santai di lounge empuk banget buat stretching sejenak! 🛋️",
      "Dark mode dan light mode kontrasnya sudah sesuai standar WCAG 👍",
      "Semua layout bergeser halus tanpa menutup konten website! 📱",
    ],
  },
  {
    id: "bonta",
    name: "Bonta",
    role: "Security & WAF",
    titleBadge: "SECURITY",
    color: "#ef4444", // Red
    shirtColor: "#b91c1c",
    hairColor: "#1c1917",
    deskPos: [3.4, 0, -3.2],
    terminalHeader: "BONTA@WAF-FIREWALL-DEFENSE",
    terminalLogs: [
      "[WAF-ALERT] Rule 942100: SQLi MITIGATED",
      "[RATE-LIMIT] 192.168.1.14: 12 req/min (SAFE)",
      "[FIREWALL] Inbound traffic: 0 anomalies",
      "[SSL/TLS] TLS_AES_256_GCM_SHA384 (Grade A+)",
      "[CORS] Origin validated for production",
      "[SECURITY] Zero vulnerabilities detected",
    ],
    quips: [
      "Firewall WAF aktif, zero vulnerability terdeteksi! 🛡️",
      "Serangan brute force dan DDoS otomatis ditolak 🚫",
      "Sertifikat SSL dan security headers grade A+ 🔒",
      "Layar chart besar menampilkan traffic bersih tanpa anomali! 📊",
      "Logs keamanan bersih, tidak ada paket mencurigakan! ⚔️",
    ],
  },
  {
    id: "bala",
    name: "Bala",
    role: "Support & Uptime",
    titleBadge: "SUPPORT",
    color: "#8b5cf6", // Purple
    shirtColor: "#6d28d9",
    hairColor: "#292524",
    deskPos: [6.2, 0, -3.2],
    terminalHeader: "BALA@UPTIME-VPS-MONITOR",
    terminalLogs: [
      "[UPTIME] 99.99% across all 4 Singapore droplets",
      "[PING] Singapore <-> Jakarta 14ms (OPTIMAL)",
      "[NGINX] HTTP/2 & HTTP/3 QUIC active",
      "[TICKET] 0 pending issues, customer inbox clean",
      "[HEALTH-CHECK] SSL cert renewed, 89 days left",
      "[FEEDBACK] Rating: 5.0/5.0 from visitors",
    ],
    quips: [
      "Uptime VPS 99.99%, server responsif tanpa kendala! 🎧",
      "Semua tiket bantuan pengunjung sudah tuntas terjawab! 💬",
      "Kurir paket baru saja lewat mengantar dokumen hasil chat! 📦",
      "Monitor VPS stabil, jalan santai dulu ke coffee lounge! ☕",
      "Health-check droplet hijau semua, performa maksimal! 🌟",
    ],
  },
  {
    id: "putri",
    name: "Bunda Putri",
    role: "Istri Pimpinan & First Lady Markas",
    titleBadge: "FIRST LADY",
    color: "#ec4899", // Rose Pink
    shirtColor: "#f472b6", // Elegant Pink Blouse
    hairColor: "#171717", // Long Glossy Black Hair
    deskPos: [-3.9, 0, 1.6], // Seated at Kids Room Chair behind Ayah Roby
    terminalHeader: "PUTRI@FAMILY-LOUNGE-VIP",
    terminalLogs: [
      "♥ Welcome to Markas Portfolio Command Center",
      "♥ Accompanying Ayah Roby & watching Alyona play",
      "♥ Lounge Sofa: Cozy & peaceful ambiance",
      "♥ Coffee & snacks ready for the engineering team",
      "♥ Status: Happy family supporting each other",
    ],
    quips: [
      "Semangat kerjanya Ayah Roby & tim Markas tercinta! 💕",
      "Ruang bermain anak di kantor ini nyaman banget, Alyona senang main di sini ✨",
      "Jangan lupa minum kopi dan istirahat sejenak ya Ayah Roby ☕🌸",
      "Kursi santai di ruangan anak ini anggun & empuk banget buat nemani Ayah kerja 🛋️💖",
      "Tim dev semuanya hebat-hebat, bangga sama karya Ayah Roby! 👏",
    ],
  },
  {
    id: "alyona",
    name: "Alyona",
    role: "Putri Kecil Roby (Maskot Ceria Markas)",
    titleBadge: "PUTRI KECIL",
    color: "#fbbf24", // Amber Yellow
    shirtColor: "#fde047", // Cute Sunny Yellow Dress
    hairColor: "#292524", // Cute Ponytails
    deskPos: [-5.2, 0, 1.8], // Playing in Kids Corner behind Ayah Roby
    terminalHeader: "ALYONA@PLAYGROUND-CORNER",
    terminalLogs: [
      "★ Alyona is playing happily in Ayah's Markas!",
      "★ Toy: Teddy Bear & Colorful Building Blocks",
      "★ Activity: Hopping, smiling & watching big screens",
      "★ High-five given to Om Koncek, Biawak, Bonta, Bala",
      "★ Mood: 100% Joyful & Energized!",
    ],
    quips: [
      "Ayah Roby hebat bikin markas komputer kedap-kedip! 🎈✨",
      "Halo om-om tim dev! Alyona lagi main boneka sama Bunda Putri di ruang anak 🧸",
      "Markas Ayah seru banget ada tempat bermain anak dan layar besarnya! 🌟",
      "Ayah, nanti kalau sudah selesai kerja temani Alyona jalan-jalan ya! 🍦🎠",
      "Alyona sayang Ayah Roby dan Bunda Putri! 🥰",
    ],
  },
];

interface SpeechBubbleData {
  actorId: string;
  name: string;
  text: string;
  color: string;
  x: number;
  y: number;
  visible: boolean;
}

// Agent Life Cycle States for Realistic Office Behavior
type AgentLifeState =
  | "working"
  | "getting_up"
  | "walking_to_lounge"
  | "relaxing_lounge"
  | "walking_to_board"
  | "inspecting_board"
  | "returning_desk"
  | "sitting_down";

export function MarkasCanvas({
  status = "idle",
  activeTask = null,
  className,
  onSelectAgent,
}: MarkasCanvasProps) {
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraView, setCameraView] = useState<"all" | "roby" | "projects" | "devs" | "lounge" | "family">("all");
  const [bubbles, setBubbles] = useState<Record<string, SpeechBubbleData>>({});

  // Optional shared chat context
  let chatContext: ReturnType<typeof useMarkasChat> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    chatContext = useMarkasChat();
  } catch {
    chatContext = null;
  }

  const [showChatPanel, setShowChatPanel] = useState(true);

  const onSelectAgentRef = useRef(onSelectAgent);
  useEffect(() => {
    onSelectAgentRef.current = onSelectAgent;
  }, [onSelectAgent]);

  const statusRef = useRef<AgentWorkStatus>(status || "idle");
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const actorsMeshRef = useRef<
    Map<
      string,
      {
        root: THREE.Group;
        spine: THREE.Group;
        head: THREE.Group;
        arms: [THREE.Group, THREE.Group];
        legs: [THREE.Group, THREE.Group];
        pos: THREE.Vector3;
        homePos: THREE.Vector3;
        heading: number;
        typingSpeed: number;
        patrolWaypoints: THREE.Vector3[];
        patrolIdx: number;
        // Office Routine State
        lifeState: AgentLifeState;
        stateTimer: number;
      }
    >
  >(new Map());

  // Courier ref to trigger delivery
  const courierTriggerRef = useRef<{
    triggerDelivery: (taskName?: string) => void;
  } | null>(null);

  const showBubbleRef = useRef<(actorId: string, text: string, durationMs?: number) => void>(() => {});

  const showBubble = useCallback(
    (actorId: string, text: string, durationMs = 4200) => {
      let actorDef = ACTORS_DEF.find((a) => a.id === actorId);
      let color = actorDef?.color || "#f97316";
      let name = actorDef?.name || "Kurir Paket";
      if (actorId === "courier") {
        name = "Kurir Paket Express";
        color = "#f97316";
      }

      setBubbles((prev) => ({
        ...prev,
        [actorId]: {
          actorId,
          name,
          text,
          color,
          x: 0,
          y: 0,
          visible: true,
        },
      }));

      setTimeout(() => {
        setBubbles((prev) => {
          if (!prev[actorId]) return prev;
          return {
            ...prev,
            [actorId]: { ...prev[actorId], visible: false },
          };
        });
      }, durationMs);
    },
    [],
  );

  useEffect(() => {
    showBubbleRef.current = showBubble;
  }, [showBubble]);

  // Camera preset handler
  const handleSetCameraView = useCallback(
    (view: "all" | "roby" | "projects" | "devs" | "lounge" | "family") => {
      setCameraView(view);
      const controls = controlsRef.current;
      const camera = cameraRef.current;
      if (!controls || !camera) return;

      let target = new THREE.Vector3(0, 0.8, -0.8);
      let camPos = new THREE.Vector3(0, 8.5, 12.0);

      switch (view) {
        case "roby":
          target = new THREE.Vector3(-5.0, 1.2, -2.8);
          camPos = new THREE.Vector3(-5.0, 3.2, 0.6);
          break;
        case "projects":
          target = new THREE.Vector3(-1.0, 1.4, 2.0);
          camPos = new THREE.Vector3(-1.0, 3.8, 5.8);
          break;
        case "devs":
          target = new THREE.Vector3(2.0, 1.0, -2.8);
          camPos = new THREE.Vector3(2.0, 3.6, 0.6);
          break;
        case "lounge":
          target = new THREE.Vector3(5.8, 0.8, 1.8);
          camPos = new THREE.Vector3(5.8, 3.2, 5.2);
          break;
        case "family":
          target = new THREE.Vector3(-5.0, 0.9, 1.6);
          camPos = new THREE.Vector3(-5.0, 2.6, 4.8);
          break;
        default:
          target = new THREE.Vector3(0, 0.8, -0.8);
          camPos = new THREE.Vector3(0, 8.5, 12.0);
          break;
      }

      controls.target.copy(target);
      camera.position.copy(camPos);
      controls.update();
    },
    [],
  );

  // Update autoRotate without re-creating Three.js scene
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = useCallback(() => {
    const el = outerContainerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      void el.requestFullscreen().catch(() => {});
    } else {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (isFs) {
        setShowChatPanel(true);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Connect 3D courier and bubble effects to shared chat context
  useEffect(() => {
    if (!chatContext) return;
    chatContext.registerCourierTrigger((taskName) => {
      courierTriggerRef.current?.triggerDelivery(taskName);
    });
    chatContext.registerBubbleTrigger((actorId, text) => {
      showBubble(actorId, text, 4500);
    });
  }, [chatContext, showBubble]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const canvasContainer = canvasMountRef.current;
    if (!canvasContainer) return;

    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const initialWidth = canvasContainer.clientWidth || 800;
    const initialHeight = canvasContainer.clientHeight || 500;

    // 1. Scene with studio lighting
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#131722");

    const camera = new THREE.PerspectiveCamera(
      38,
      initialWidth / initialHeight,
      0.1,
      100,
    );
    camera.position.set(0, 8.5, 12.0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initialWidth, initialHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    canvasContainer.appendChild(renderer.domElement);

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 24;
    controls.target.set(0, 0.8, -0.8);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.6;
    controlsRef.current = controls;

    // 3. Bright, Vivid Lighting
    const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x475569, 1.8);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff3e0, 2.8);
    dirLight.position.set(8, 16, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 1.4);
    fillLight.position.set(-8, 12, -4);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const createMat = (
      color: string | number,
      roughness = 0.6,
      metalness = 0.1,
    ) => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness,
        metalness,
      });
    };

    // 4. Room Construction
    const ROOM_W = 20;
    const ROOM_D = 14;

    // Warm Parquet Floor
    const floorGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_D);
    const floorMat = createMat("#c2af98", 0.75, 0.05);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Grid Helper
    const gridLines = new THREE.GridHelper(ROOM_W, 40, 0xa89680, 0xbaa892);
    gridLines.position.y = 0.006;
    scene.add(gridLines);

    // Back Wall
    const backWallGeo = new THREE.BoxGeometry(ROOM_W, 5.0, 0.2);
    const backWall = new THREE.Mesh(backWallGeo, createMat("#e2dcd4", 0.9));
    backWall.position.set(0, 2.5, -ROOM_D / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left Wall with Office Entrance Door
    const leftWallGeo = new THREE.BoxGeometry(0.2, 5.0, ROOM_D);
    const leftWall = new THREE.Mesh(leftWallGeo, createMat("#cbd5e1", 0.9));
    leftWall.position.set(-ROOM_W / 2, 2.5, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Office Entrance Door (Used by Courier)
    const doorGroup = new THREE.Group();
    doorGroup.position.set(-ROOM_W / 2 + 0.12, 0, 3.8);

    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.8, 1.6),
      createMat("#1e293b", 0.4),
    );
    doorFrame.position.y = 1.4;

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 2.7, 1.44),
      createMat("#047857", 0.5),
    );
    doorPanel.position.y = 1.35;

    // Door Sign (EXIT / COURIER ENTER)
    const doorSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.28, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 }),
    );
    doorSign.position.set(0.08, 2.9, 0);

    doorGroup.add(doorFrame, doorPanel, doorSign);
    scene.add(doorGroup);

    // Baseboard
    const baseboardGeo = new THREE.BoxGeometry(ROOM_W, 0.18, 0.04);
    const baseboard = new THREE.Mesh(baseboardGeo, createMat("#334155", 0.5));
    baseboard.position.set(0, 0.09, -ROOM_D / 2 + 0.1);
    scene.add(baseboard);

    // Windows with Daylight
    [-7.0, 7.0].forEach((wx) => {
      const winFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 2.0, 0.08),
        createMat("#1e293b", 0.4),
      );
      winFrame.position.set(wx, 3.0, -ROOM_D / 2 + 0.12);
      const winGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 1.8),
        createMat("#93c5fd", 0.2, 0.8),
      );
      winGlass.position.set(wx, 3.0, -ROOM_D / 2 + 0.17);
      scene.add(winFrame, winGlass);
    });

    // =========================================================================
    // 5. TWO GIANT WALL SCREENS DISPLAYING LIVE CHARTS (DI DINDING DEPAN)
    // =========================================================================
    // Screen 1: Real-time Cloud VPS Metrics Line Chart
    const chartCanvas1 = document.createElement("canvas");
    chartCanvas1.width = 512;
    chartCanvas1.height = 288;
    const chartCtx1 = chartCanvas1.getContext("2d")!;
    const chartTex1 = new THREE.CanvasTexture(chartCanvas1);
    chartTex1.colorSpace = THREE.SRGBColorSpace;

    const wallScreen1 = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 2.0),
      new THREE.MeshBasicMaterial({ map: chartTex1 }),
    );
    wallScreen1.position.set(-3.2, 3.2, -ROOM_D / 2 + 0.16);
    const screenFrame1 = new THREE.Mesh(
      new THREE.BoxGeometry(3.72, 2.12, 0.06),
      createMat("#0f172a", 0.3),
    );
    screenFrame1.position.set(-3.2, 3.2, -ROOM_D / 2 + 0.13);
    scene.add(wallScreen1, screenFrame1);

    // Screen 2: 25+ Projects Sprint Status Multi-Bar & Donut Chart
    const chartCanvas2 = document.createElement("canvas");
    chartCanvas2.width = 512;
    chartCanvas2.height = 288;
    const chartCtx2 = chartCanvas2.getContext("2d")!;
    const chartTex2 = new THREE.CanvasTexture(chartCanvas2);
    chartTex2.colorSpace = THREE.SRGBColorSpace;

    const wallScreen2 = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 2.0),
      new THREE.MeshBasicMaterial({ map: chartTex2 }),
    );
    wallScreen2.position.set(3.2, 3.2, -ROOM_D / 2 + 0.16);
    const screenFrame2 = new THREE.Mesh(
      new THREE.BoxGeometry(3.72, 2.12, 0.06),
      createMat("#0f172a", 0.3),
    );
    screenFrame2.position.set(3.2, 3.2, -ROOM_D / 2 + 0.13);
    scene.add(wallScreen2, screenFrame2);

    // =========================================================================
    // 6. RUANGAN KHUSUS ANAK & BANGKU DUDUK ISTRI (PUTRI & ALYONA)
    // (POSISI: TEPAT DI BELAKANG MEJA KERJA AYAH ROBY [-5.0, 0, 1.6])
    // =========================================================================
    const kidsPlayroomGroup = new THREE.Group();
    kidsPlayroomGroup.position.set(-5.0, 0, 1.6);

    // Colorful Pastel Kids Puzzle Play Mat (Karpet Bermain Anak)
    const playMatGeo = new THREE.PlaneGeometry(4.2, 3.2);
    const playMatMat = createMat("#fef3c7", 0.85); // Warm cream base
    const playMat = new THREE.Mesh(playMatGeo, playMatMat);
    playMat.rotation.x = -Math.PI / 2;
    playMat.position.set(0, 0.008, 0);
    kidsPlayroomGroup.add(playMat);

    // Play Mat Colorful Puzzle Tiles
    const tileColors = ["#fbcfe8", "#bae6fd", "#bbf7d0", "#fef08a"];
    for (let tx = -1.6; tx <= 1.6; tx += 0.8) {
      for (let tz = -1.1; tz <= 1.1; tz += 0.75) {
        const cIdx = Math.floor(Math.abs(tx * 3 + tz * 5)) % tileColors.length;
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(0.74, 0.68),
          createMat(tileColors[cIdx], 0.85),
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(tx, 0.009, tz);
        kidsPlayroomGroup.add(tile);
      }
    }

    // Low Wooden Partition Fence around Kids Playroom (Pagar Pembatas Ramah Anak)
    const fenceMat = createMat("#f8fafc", 0.5);
    const fencePostMat = createMat("#cbd5e1", 0.4);
    // Front Fence
    const frontRail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.06, 0.04), fenceMat);
    frontRail.position.set(-0.2, 0.52, -1.6);
    kidsPlayroomGroup.add(frontRail);
    for (let fx = -1.9; fx <= 1.5; fx += 0.4) {
      const picket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.03), fenceMat);
      picket.position.set(fx, 0.26, -1.6);
      kidsPlayroomGroup.add(picket);
    }

    // Play Tent Teepee for Alyona (Tenda Bermain Anak)
    const teepeeGroup = new THREE.Group();
    teepeeGroup.position.set(-1.3, 0, 0.7);
    const teepeeCanvas = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 1.35, 4),
      createMat("#fbcfe8", 0.8), // Soft pink teepee
    );
    teepeeCanvas.position.y = 0.68;
    teepeeCanvas.rotation.y = Math.PI / 4;
    // Teepee Poles
    for (let p = 0; p < 4; p++) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8),
        createMat("#78350f", 0.6),
      );
      pole.position.set(Math.sin((p * Math.PI) / 2) * 0.35, 0.75, Math.cos((p * Math.PI) / 2) * 0.35);
      pole.rotation.z = Math.sin((p * Math.PI) / 2) * 0.18;
      teepeeGroup.add(pole);
    }
    // Flag on top
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.01), createMat("#f59e0b", 0.5));
    flag.position.set(0.06, 1.42, 0);
    teepeeGroup.add(teepeeCanvas, flag);
    kidsPlayroomGroup.add(teepeeGroup);

    // Toy Shelf with Colorful Building Blocks & Books
    const toyShelf = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 1.0), createMat("#fdf2f8", 0.6));
    toyShelf.position.set(-1.8, 0.4, -0.6);
    kidsPlayroomGroup.add(toyShelf);

    const blockColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
    for (let b = 0; b < 6; b++) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        createMat(blockColors[b % blockColors.length], 0.7),
      );
      block.position.set(-0.2 + (b % 3) * 0.16, 0.05, 0.3 + Math.floor(b / 3) * 0.18);
      kidsPlayroomGroup.add(block);
    }

    // =========================================================================
    // BANGKU DUDUK ISTRI (PUTRI): ELEGANT MOTHER'S ROSE-GOLD WINGBACK CHAIR
    // (DIBEDAKAN: Kursi Santai Mewah Ibu di Ruangan Anak, bukan sofa umum)
    // =========================================================================
    const putriChair = new THREE.Group();
    putriChair.position.set(1.1, 0, 0); // Positioned inside kids room watching Alyona

    // Thick Sculpted Cushion Seat
    const putriSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.16, 0.68),
      createMat("#ec4899", 0.75), // Luxurious Rose-Gold Fabric
    );
    putriSeat.position.y = 0.42;

    // Curved High Wingback Rest with Head Pillow
    const putriBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.85, 0.12),
      createMat("#ec4899", 0.75),
    );
    putriBack.position.set(0, 0.88, 0.28);
    putriBack.rotation.x = 0.08;

    // Soft Lumbar / Back Pillow
    const lumbarPillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.28, 0.1),
      createMat("#fdf2f8", 0.85), // Pearl white soft pillow
    );
    lumbarPillow.position.set(0, 0.62, 0.22);

    // Rounded Comfortable Armrests
    [-0.38, 0.38].forEach((ax) => {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.36, 0.6),
        createMat("#db2777", 0.75),
      );
      arm.position.set(ax, 0.58, 0.02);
      putriChair.add(arm);
    });

    // Elegant Brass-Tipped Wooden Legs
    [
      [-0.3, -0.26],
      [0.3, -0.26],
      [-0.3, 0.26],
      [0.3, 0.26],
    ].forEach(([lx, lz]) => {
      const legWood = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.02, 0.34, 8),
        createMat("#78350f", 0.5),
      );
      legWood.position.set(lx, 0.17, lz);
      // Gold brass tip
      const brassTip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.021, 0.02, 0.08, 8),
        createMat("#f59e0b", 0.2, 0.9),
      );
      brassTip.position.set(lx, 0.04, lz);
      putriChair.add(legWood, brassTip);
    });

    putriChair.add(putriSeat, putriBack, lumbarPillow);
    kidsPlayroomGroup.add(putriChair);

    // Chic Side Table for Putri with Flower Vase & Tea
    const sideTable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16),
      createMat("#fdf2f8", 0.3, 0.6),
    );
    sideTable.position.set(1.75, 0.46, 0.2);
    const sideLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.44, 8),
      createMat("#f59e0b", 0.2, 0.9), // Gold pillar
    );
    sideLeg.position.set(1.75, 0.22, 0.2);

    // Flower Vase on Side Table
    const vase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.04, 0.12, 10),
      createMat("#93c5fd", 0.2, 0.8),
    );
    vase.position.set(1.75, 0.54, 0.2);
    const flowerRose = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.05, 1),
      createMat("#f43f5e", 0.7),
    );
    flowerRose.position.set(1.75, 0.63, 0.2);
    kidsPlayroomGroup.add(sideTable, sideLeg, vase, flowerRose);

    // Playroom Room Signboard: RUANGAN ANAK & KELUARGA
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.28, 0.04),
      createMat("#f472b6", 0.6),
    );
    signBoard.position.set(0, 1.25, -1.6);
    kidsPlayroomGroup.add(signBoard);

    scene.add(kidsPlayroomGroup);

    // =========================================================================
    // BANGKU SANTAI KANTOR (EXECUTIVE LOUNGE SOFA & COFFEE STATION)
    // (TETAP DI TEMPAT SEBELUMNYA: Area Santai Lounge [5.8, 0, 1.8])
    // =========================================================================
    const loungeGroup = new THREE.Group();
    loungeGroup.position.set(5.8, 0, 1.8);

    // Warm Charcoal / Slate Area Rug (Karpet Lounge Santai)
    const loungeRug = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 2.6),
      createMat("#334155", 0.8),
    );
    loungeRug.rotation.x = -Math.PI / 2;
    loungeRug.position.set(0, 0.007, 0);
    loungeGroup.add(loungeRug);

    // Modern 3-Seater Plush Lounge Sofa (Bangku Santai)
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(0, 0, 0.2);

    // Base Seat Cushion
    const sofaBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.22, 0.88),
      createMat("#1e293b", 0.7),
    );
    sofaBase.position.y = 0.35;

    // 3 Individual Soft Cushions
    for (let ci = -1; ci <= 1; ci++) {
      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(0.74, 0.12, 0.82),
        createMat("#475569", 0.75),
      );
      cushion.position.set(ci * 0.78, 0.48, 0);
      sofaGroup.add(cushion);
    }

    // High Padded Backrest
    const sofaBack = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.65, 0.18),
      createMat("#1e293b", 0.7),
    );
    sofaBack.position.set(0, 0.72, 0.38);
    sofaBack.rotation.x = 0.06;

    // Side Armrests
    [-1.24, 1.24].forEach((ax) => {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.42, 0.92),
        createMat("#0f172a", 0.6),
      );
      arm.position.set(ax, 0.52, 0.04);
      sofaGroup.add(arm);
    });

    // Decorative Pillows (Gold Amber & Emerald Green)
    const pillow1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.34, 0.12),
      createMat("#f59e0b", 0.8),
    );
    pillow1.position.set(-0.85, 0.58, 0.28);
    pillow1.rotation.set(0.1, 0.2, 0.1);

    const pillow2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.34, 0.12),
      createMat("#10b981", 0.8),
    );
    pillow2.position.set(0.85, 0.58, 0.28);
    pillow2.rotation.set(0.1, -0.2, -0.1);

    // Sofa Wooden Legs with Brass Tips
    [
      [-1.1, -0.36],
      [1.1, -0.36],
      [-1.1, 0.36],
      [1.1, 0.36],
    ].forEach(([lx, lz]) => {
      const sLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.02, 0.24, 8),
        createMat("#78350f", 0.5),
      );
      sLeg.position.set(lx, 0.12, lz);
      sofaGroup.add(sLeg);
    });

    sofaGroup.add(sofaBase, sofaBack, pillow1, pillow2);
    loungeGroup.add(sofaGroup);

    // Elegant Oval Walnut Coffee Table in Front of Sofa
    const coffeeTable = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.65),
      createMat("#451a03", 0.4),
    );
    coffeeTable.position.set(0, 0.36, -0.7);
    [
      [-0.6, -0.25],
      [0.6, -0.25],
      [-0.6, 0.25],
      [0.6, 0.25],
    ].forEach(([tx, tz]) => {
      const tLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.015, 0.33, 8),
        createMat("#f59e0b", 0.3, 0.8),
      );
      tLeg.position.set(tx, 0.18, -0.7 + tz);
      loungeGroup.add(tLeg);
    });

    // Tech Magazine & Succulent Plant on Coffee Table
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.015, 0.36),
      createMat("#0284c7", 0.5),
    );
    mag.position.set(-0.35, 0.4, -0.7);
    mag.rotation.y = 0.2;

    const plantPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.05, 0.1, 10),
      createMat("#ffffff", 0.3),
    );
    plantPot.position.set(0.35, 0.44, -0.7);
    const plantLeaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      createMat("#10b981", 0.8),
    );
    plantLeaves.position.set(0.35, 0.52, -0.7);

    loungeGroup.add(coffeeTable, mag, plantPot, plantLeaves);

    // Office Water Dispenser with Blue/Red Tap LED
    const dispenserGroup = new THREE.Group();
    dispenserGroup.position.set(1.5, 0, -0.8);
    const dispenserBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.9, 0.35),
      createMat("#f8fafc", 0.4),
    );
    dispenserBody.position.y = 0.45;
    const waterBottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.42, 12),
      createMat("#38bdf8", 0.2, 0.8),
    );
    waterBottle.position.y = 1.05;
    dispenserGroup.add(dispenserBody, waterBottle);
    loungeGroup.add(dispenserGroup);

    // Standing Floor Lamp
    const lampGroup = new THREE.Group();
    lampGroup.position.set(1.5, 0, 0.8);
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16),
      createMat("#0f172a", 0.4),
    );
    lampBase.position.y = 0.015;
    const lampPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 1.8, 8),
      createMat("#f59e0b", 0.3, 0.8),
    );
    lampPole.position.y = 0.9;
    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.3, 16, 1, true),
      createMat("#fef3c7", 0.5),
    );
    lampShade.position.y = 1.75;
    lampGroup.add(lampBase, lampPole, lampShade);
    loungeGroup.add(lampGroup);

    scene.add(loungeGroup);

    // =========================================================================
    // 7. PROJECT KANBAN WHITEBOARD (BURUANG INSPECTION POST)
    // =========================================================================
    const boardGroup = new THREE.Group();
    boardGroup.position.set(-1.0, 0, 3.0);

    const boardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 2.1, 0.06),
      createMat("#1e293b", 0.4),
    );
    boardFrame.position.y = 1.9;
    const boardSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.9),
      createMat("#ffffff", 0.2),
    );
    boardSurface.position.set(0, 1.9, -0.035);
    boardSurface.rotation.y = Math.PI;

    const standLegL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.9, 8),
      createMat("#334155", 0.4),
    );
    standLegL.position.set(-1.7, 0.95, 0);
    const standLegR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.9, 8),
      createMat("#334155", 0.4),
    );
    standLegR.position.set(1.7, 0.95, 0);

    const stickyColors = ["#0284c7", "#059669", "#d97706", "#db2777", "#7c3aed"];
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 3; r++) {
        const sticky = new THREE.Mesh(
          new THREE.PlaneGeometry(0.32, 0.22),
          createMat(stickyColors[(c + r) % stickyColors.length], 0.8),
        );
        sticky.position.set(-1.2 + c * 0.6, 2.4 - r * 0.45, -0.04);
        sticky.rotation.y = Math.PI;
        boardGroup.add(sticky);
      }
    }

    boardGroup.add(boardFrame, boardSurface, standLegL, standLegR);
    scene.add(boardGroup);

    // Server Rack Cluster (VPS Cloud)
    const rackGroup = new THREE.Group();
    rackGroup.position.set(-7.8, 0, -3.2);
    const rackFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 2.6, 0.9),
      createMat("#0f172a", 0.4, 0.8),
    );
    rackFrame.position.y = 1.3;
    rackGroup.add(rackFrame);

    const rackLeds: THREE.Mesh[] = [];
    for (let u = 0; u < 7; u++) {
      const serverUnit = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.25, 0.85),
        createMat("#1e293b", 0.5),
      );
      serverUnit.position.set(0, 0.35 + u * 0.32, 0.04);
      rackGroup.add(serverUnit);

      for (let l = 0; l < 4; l++) {
        const led = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 8, 8),
          new THREE.MeshBasicMaterial({
            color: l % 2 === 0 ? 0x10b981 : 0x06b6d4,
          }),
        );
        led.position.set(-0.3 + l * 0.2, 0.35 + u * 0.32, 0.47);
        rackGroup.add(led);
        rackLeds.push(led);
      }
    }
    scene.add(rackGroup);

    // =========================================================================
    // 8. COMPUTER SCREENS CANVAS TEXTURES (ROBY'S VIDEO STREAM & DEVS' TERMINALS)
    // =========================================================================
    interface MonitorTerminal {
      actorId: string;
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      tex: THREE.CanvasTexture;
      header: string;
      logs: string[];
      scrollOffset: number;
    }

    const monitorTerminals: MonitorTerminal[] = [];

    const createTerminalScreen = (actor: ActorDef) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 320;
      const ctx = canvas.getContext("2d")!;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;

      const term: MonitorTerminal = {
        actorId: actor.id,
        canvas,
        ctx,
        tex,
        header: actor.terminalHeader,
        logs: actor.terminalLogs,
        scrollOffset: 0,
      };

      monitorTerminals.push(term);
      return term;
    };

    // =========================================================================
    // 9. WORKSTATIONS, EXECUTIVE LEADER CHAIR & STAFF CHAIRS
    // =========================================================================
    ACTORS_DEF.forEach((actor) => {
      if (actor.id === "buruang" || actor.id === "putri" || actor.id === "alyona") return;

      const isLead = actor.id === "roby";
      const [dx, , dz] = actor.deskPos;
      const deskGroup = new THREE.Group();
      deskGroup.position.set(dx, 0, dz);

      // Desk Tabletop
      const tableMat = createMat(isLead ? "#1e1b4b" : "#334155", 0.5);
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.08, 1.0),
        tableMat,
      );
      top.position.y = 0.72;
      top.castShadow = true;
      deskGroup.add(top);

      // Table Legs
      const legMat = createMat("#0f172a", 0.5);
      [
        [-0.95, -0.4],
        [0.95, -0.4],
        [-0.95, 0.4],
        [0.95, 0.4],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.7, 12),
          legMat,
        );
        leg.position.set(lx, 0.35, lz);
        deskGroup.add(leg);
      });

      // =======================================================================
      // DISTINCT EXECUTIVE CHAIR FOR ROBY (PIMPINAN) vs STANDARD CHAIR FOR STAFF
      // =======================================================================
      if (isLead) {
        // Luxury High-Back Leather Boss Chair (Kursi Eksekutif Direktur)
        const bossChair = new THREE.Group();
        bossChair.position.set(0, 0, 0.72);

        // Heavy Star-Base with Casters
        const starBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.34, 0.34, 0.05, 10),
          createMat("#d97706", 0.3, 0.8), // Gold/Chrome finish
        );
        starBase.position.y = 0.08;

        const hydraulicPillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.38, 12),
          createMat("#f59e0b", 0.2, 0.9), // Gold pillar
        );
        hydraulicPillar.position.y = 0.26;

        // Thick Executive Cushion Seat
        const bossSeat = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.12, 0.58),
          createMat("#18181b", 0.6), // Jet black leather
        );
        bossSeat.position.y = 0.48;

        // Gold Trim on Seat
        const bossSeatTrim = new THREE.Mesh(
          new THREE.BoxGeometry(0.64, 0.04, 0.6),
          createMat("#f59e0b", 0.3, 0.7),
        );
        bossSeatTrim.position.y = 0.44;

        // Tall Ergonomic High-Backrest with Headrest
        const bossBack = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, 0.74, 0.1),
          createMat("#18181b", 0.6),
        );
        bossBack.position.set(0, 0.9, 0.26);
        bossBack.rotation.x = 0.12; // Relaxed executive tilt

        const bossHeadrest = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.22, 0.12),
          createMat("#27272a", 0.5),
        );
        bossHeadrest.position.set(0, 1.32, 0.31);
        bossHeadrest.rotation.x = 0.12;

        // Luxury Padded Armrests
        [-0.32, 0.32].forEach((armX) => {
          const armStalk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.26, 8),
            createMat("#f59e0b", 0.3, 0.8),
          );
          armStalk.position.set(armX, 0.62, 0.05);

          const armPad = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.05, 0.42),
            createMat("#18181b", 0.6),
          );
          armPad.position.set(armX, 0.75, 0.05);
          bossChair.add(armStalk, armPad);
        });

        bossChair.add(
          starBase,
          hydraulicPillar,
          bossSeat,
          bossSeatTrim,
          bossBack,
          bossHeadrest,
        );
        deskGroup.add(bossChair);

        // Roby's Desk Decor: Mug "#1 BOSS" & Snack Bowl (Nonton Video)
        const bossMug = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.045, 0.11, 10),
          createMat("#f59e0b", 0.4, 0.4),
        );
        bossMug.position.set(0.62, 0.81, 0.18);

        const popcornBowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.08, 0.1, 12),
          createMat("#ef4444", 0.5),
        );
        popcornBowl.position.set(-0.62, 0.81, 0.18);

        // Modern Glass Ashtray with Cigarette Butts on Roby's Desk
        const ashtray = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.08, 0.04, 12),
          createMat("#94a3b8", 0.2, 0.8),
        );
        ashtray.position.set(0.38, 0.78, 0.22);
        const ashtrayInside = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 0.02, 10),
          createMat("#334155", 0.9),
        );
        ashtrayInside.position.set(0.38, 0.795, 0.22);
        // Gold Lighter
        const lighter = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.07, 0.02),
          createMat("#f59e0b", 0.3, 0.8),
        );
        lighter.position.set(0.48, 0.78, 0.28);
        lighter.rotation.y = 0.4;
        deskGroup.add(bossMug, popcornBowl, ashtray, ashtrayInside, lighter);
      } else {
        // Standard Modern Office Chair for Staff
        const chair = new THREE.Group();
        chair.position.set(0, 0, 0.65);
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.08, 0.46),
          createMat(actor.color, 0.8),
        );
        seat.position.y = 0.46;
        const backrest = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.54, 0.06),
          createMat(actor.color, 0.8),
        );
        backrest.position.set(0, 0.75, 0.22);
        backrest.rotation.x = 0.08;
        const basePost = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.42, 10),
          createMat("#0f172a", 0.4),
        );
        basePost.position.y = 0.22;
        chair.add(seat, backrest, basePost);
        deskGroup.add(chair);
      }

      // Computer Monitor
      const terminalObj = createTerminalScreen(actor);

      const monMat = createMat("#0f172a", 0.4);
      const monScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.85, 0.52),
        new THREE.MeshBasicMaterial({ map: terminalObj.tex }),
      );
      monScreen.position.set(0, 1.14, -0.18);

      const monBezel = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.56, 0.04),
        monMat,
      );
      monBezel.position.set(0, 1.14, -0.2);
      const monStand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8),
        monMat,
      );
      monStand.position.set(0, 0.9, -0.2);
      deskGroup.add(monScreen, monBezel, monStand);

      if (isLead) {
        // Dual monitor for Roby
        const sideScreen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.75, 0.48),
          new THREE.MeshBasicMaterial({ color: 0x312e81 }),
        );
        sideScreen.position.set(0.72, 1.12, -0.12);
        sideScreen.rotation.y = -0.32;
        const sideBezel = new THREE.Mesh(
          new THREE.BoxGeometry(0.78, 0.52, 0.04),
          monMat,
        );
        sideBezel.position.set(0.72, 1.12, -0.14);
        sideBezel.rotation.y = -0.32;
        deskGroup.add(sideScreen, sideBezel);

        // Commander Flag
        const flagPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, 0.35, 8),
          createMat("#fbbf24", 0.3, 0.9),
        );
        flagPole.position.set(-0.85, 0.9, -0.2);
        const flagBanner = new THREE.Mesh(
          new THREE.PlaneGeometry(0.16, 0.1),
          createMat("#f59e0b", 0.8),
        );
        flagBanner.position.set(-0.76, 1.02, -0.2);
        deskGroup.add(flagPole, flagBanner);
      }

      // Keyboard & Desk Nameplate
      const kb = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.02, 0.16),
        createMat("#e2e8f0", 0.4),
      );
      kb.position.set(0, 0.77, 0.2);
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.08, 0.04),
        createMat("#f8fafc", 0.5),
      );
      plate.position.set(0, 0.79, -0.38);
      deskGroup.add(kb, plate);

      scene.add(deskGroup);
    });

    // =========================================================================
    // 10. CHARACTER RIGS (ROBY, BURUANG, KONCEK, BIAWAK, BONTA, BALA)
    // =========================================================================
    const createCharacterRig = (def: ActorDef) => {
      const root = new THREE.Group();
      root.name = def.id;

      const isLead = def.id === "roby";
      const isBuruang = def.id === "buruang";
      const isPutri = def.id === "putri";
      const isAlyona = def.id === "alyona";

      // Dedicated skin, fabric and hair materials
      const skinMat = createMat(
        isPutri ? "#fed7aa" : isAlyona ? "#ffe4e6" : "#fcd34d",
        0.75,
      );
      const shirtMat = createMat(def.shirtColor, 0.8);
      const pantsMat = createMat(
        isPutri ? "#db2777" : isAlyona ? "#facc15" : "#1e293b",
        0.8,
      );
      const hairMat = createMat(def.hairColor, 0.9);

      // Spine / Torso
      const spine = new THREE.Group();

      let torso: THREE.Mesh;
      if (isPutri) {
        // Bunda Putri: Siluet tubuh wanita dewasa anggun & berlekuk feminin
        torso = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.12, 0.38, 14),
          shirtMat,
        );
        torso.position.y = 0.2;

        // Rok midi feminin anggun melingkar di pinggul
        const skirt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.28, 0.34, 16),
          createMat("#db2777", 0.75),
        );
        skirt.position.y = 0.05;
        skirt.castShadow = true;

        // Leher ramping feminin
        const neck = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.1, 8),
          skinMat,
        );
        neck.position.y = 0.42;

        // Kalung mutiara berkilau mewah (Pearl Necklace)
        const pearlNecklace = new THREE.Mesh(
          new THREE.TorusGeometry(0.065, 0.013, 8, 16),
          createMat("#fdf2f8", 0.1, 0.95),
        );
        pearlNecklace.rotation.x = Math.PI / 2;
        pearlNecklace.position.set(0, 0.38, 0.02);

        spine.add(torso, skirt, neck, pearlNecklace);
      } else if (isAlyona) {
        // Alyona: Gaun / Dress Pesta Anak Perempuan Cantik Warna Kuning
        root.scale.set(0.58, 0.58, 0.58); // Proporsi anak kecil mungil

        torso = new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.12, 0.3, 12),
          shirtMat,
        );
        torso.position.y = 0.18;

        // Kerah renda putih manis di dada/leher
        const whiteCollar = new THREE.Mesh(
          new THREE.TorusGeometry(0.078, 0.018, 8, 16),
          createMat("#ffffff", 0.6),
        );
        whiteCollar.rotation.x = Math.PI / 2;
        whiteCollar.position.set(0, 0.3, 0.01);

        // Rok gaun mekar mengembang anak perempuan (Flared Ruffled Girl Dress Skirt)
        const girlSkirt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.3, 0.26, 16),
          shirtMat,
        );
        girlSkirt.position.y = 0.06;
        girlSkirt.castShadow = true;

        // Pita besar merah muda di belakang pinggang dress (Cute Big Pink Bow)
        const bowGroup = new THREE.Group();
        bowGroup.position.set(0, 0.12, -0.13);
        const bowKnot = new THREE.Mesh(
          new THREE.SphereGeometry(0.026, 8, 8),
          createMat("#ec4899", 0.85),
        );
        const bowWingL = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.038, 0.02),
          createMat("#f472b6", 0.85),
        );
        bowWingL.position.set(-0.045, 0.01, -0.01);
        bowWingL.rotation.z = 0.3;
        const bowWingR = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.038, 0.02),
          createMat("#f472b6", 0.85),
        );
        bowWingR.position.set(0.045, 0.01, -0.01);
        bowWingR.rotation.z = -0.3;
        const bowRibbonTailL = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 0.1, 0.01),
          createMat("#ec4899", 0.85),
        );
        bowRibbonTailL.position.set(-0.025, -0.06, -0.01);
        bowRibbonTailL.rotation.z = 0.2;
        const bowRibbonTailR = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 0.1, 0.01),
          createMat("#ec4899", 0.85),
        );
        bowRibbonTailR.position.set(0.025, -0.06, -0.01);
        bowRibbonTailR.rotation.z = -0.2;

        bowGroup.add(bowKnot, bowWingL, bowWingR, bowRibbonTailL, bowRibbonTailR);

        spine.add(torso, whiteCollar, girlSkirt, bowGroup);
      } else {
        // Anggota Tim Markas Pria
        torso = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.16, 0.42, 12),
          shirtMat,
        );
        torso.position.y = 0.21;
        spine.add(torso);
      }
      torso.castShadow = true;

      // Head & Hair
      const head = new THREE.Group();
      head.position.y = isPutri ? 0.48 : isAlyona ? 0.44 : 0.48;

      const headRadius = isPutri ? 0.14 : isAlyona ? 0.145 : 0.15;
      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(headRadius, 16, 14),
        skinMat,
      );
      headMesh.castShadow = true;
      head.add(headMesh);

      // Hair & Facial Details
      if (isPutri) {
        // Bunda Putri: Rambut panjang hitam bergelombang wanita anggun
        const hairDome = new THREE.Mesh(
          new THREE.SphereGeometry(0.152, 16, 14),
          hairMat,
        );
        hairDome.position.set(0, 0.03, -0.02);

        // Helai rambut panjang menjuntai di punggung melewati bahu
        const longHairBack = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.44, 0.09),
          hairMat,
        );
        longHairBack.position.set(0, -0.16, -0.09);

        // Poni samping anggun menjuntai di kiri & kanan dada
        const hairStrandL = new THREE.Mesh(
          new THREE.CylinderGeometry(0.028, 0.016, 0.34, 8),
          hairMat,
        );
        hairStrandL.position.set(-0.12, -0.14, 0.07);
        hairStrandL.rotation.z = -0.1;

        const hairStrandR = new THREE.Mesh(
          new THREE.CylinderGeometry(0.028, 0.016, 0.34, 8),
          hairMat,
        );
        hairStrandR.position.set(0.12, -0.14, 0.07);
        hairStrandR.rotation.z = 0.1;

        // Jepit rambut bunga mawar merah muda (Flower Pin)
        const flowerPin = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.035, 1),
          createMat("#ec4899", 0.7),
        );
        flowerPin.position.set(0.14, 0.06, 0.04);

        // Rona pipi manis feminin (Rosy Blushed Cheeks)
        const blushMat = createMat("#fb7185", 0.9);
        const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), blushMat);
        blushL.scale.set(1.1, 0.6, 0.3);
        blushL.position.set(-0.08, -0.02, 0.12);
        const blushR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), blushMat);
        blushR.scale.set(1.1, 0.6, 0.3);
        blushR.position.set(0.08, -0.02, 0.12);

        // Senyum bibir manis feminin
        const lips = new THREE.Mesh(
          new THREE.BoxGeometry(0.042, 0.012, 0.015),
          createMat("#f43f5e", 0.9),
        );
        lips.position.set(0, -0.05, 0.136);

        head.add(hairDome, longHairBack, hairStrandL, hairStrandR, flowerPin, blushL, blushR, lips);
      } else if (isAlyona) {
        // Alyona: Gaya rambut kuncir dua kembar (Twin Pigtails) anak perempuan manis
        const hairDome = new THREE.Mesh(
          new THREE.SphereGeometry(0.155, 16, 14),
          hairMat,
        );
        hairDome.position.set(0, 0.03, -0.02);

        // Poni depan manis anak perempuan
        const bangs = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.06, 0.05),
          hairMat,
        );
        bangs.position.set(0, 0.08, 0.12);

        // Kuncir Dua Kembar (Twin Pigtails) dengan pita merah muda
        const ribbonMat = createMat("#ec4899", 0.85);
        // Kuncir Kiri
        const ribbonL = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), ribbonMat);
        ribbonL.position.set(-0.16, 0.08, -0.02);
        const pigtailL = new THREE.Mesh(
          new THREE.CylinderGeometry(0.036, 0.018, 0.22, 8),
          hairMat,
        );
        pigtailL.position.set(-0.21, -0.01, -0.03);
        pigtailL.rotation.z = 0.55;
        pigtailL.rotation.x = -0.15;

        // Kuncir Kanan
        const ribbonR = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), ribbonMat);
        ribbonR.position.set(0.16, 0.08, -0.02);
        const pigtailR = new THREE.Mesh(
          new THREE.CylinderGeometry(0.036, 0.018, 0.22, 8),
          hairMat,
        );
        pigtailR.position.set(0.21, -0.01, -0.03);
        pigtailR.rotation.z = -0.55;
        pigtailR.rotation.x = -0.15;

        // Pipi gembil merona manis anak kecil
        const blushMat = createMat("#fb7185", 0.9);
        const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), blushMat);
        blushL.position.set(-0.075, 0.0, 0.125);
        const blushR = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), blushMat);
        blushR.position.set(0.075, 0.0, 0.125);

        // Senyum ceria anak kecil
        const smile = new THREE.Mesh(
          new THREE.BoxGeometry(0.036, 0.012, 0.015),
          createMat("#f43f5e", 0.9),
        );
        smile.position.set(0, -0.04, 0.14);

        head.add(hairDome, bangs, ribbonL, pigtailL, ribbonR, pigtailR, blushL, blushR, smile);
      } else {
        const hairMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 14, 12),
          hairMat,
        );
        hairMesh.position.set(0, 0.04, -0.02);
        head.add(hairMesh);
      }

      // Eyes
      const eyeGeo = new THREE.SphereGeometry(0.02, 6, 6);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.05, 0.01, headRadius - 0.01);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.05, 0.01, headRadius - 0.01);
      head.add(leftEye, rightEye);
      spine.add(head);

      // Arms
      const armRadiusTop = isPutri ? 0.038 : isAlyona ? 0.038 : 0.05;
      const armRadiusBottom = isPutri ? 0.032 : isAlyona ? 0.032 : 0.045;
      const armLength = isPutri ? 0.32 : isAlyona ? 0.28 : 0.34;
      const armOffsetX = isPutri ? 0.2 : isAlyona ? 0.18 : 0.24;
      const armOffsetY = isPutri ? 0.34 : isAlyona ? 0.28 : 0.36;

      const leftArm = new THREE.Group();
      leftArm.position.set(-armOffsetX, armOffsetY, 0);
      const leftArmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(armRadiusTop, armRadiusBottom, armLength, 8),
        shirtMat,
      );
      leftArmMesh.position.y = -armLength / 2;
      leftArm.add(leftArmMesh);

      const rightArm = new THREE.Group();
      rightArm.position.set(armOffsetX, armOffsetY, 0);
      const rightArmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(armRadiusTop, armRadiusBottom, armLength, 8),
        shirtMat,
      );
      rightArmMesh.position.y = -armLength / 2;
      rightArm.add(rightArmMesh);

      spine.add(leftArm, rightArm);
      root.add(spine);

      // Legs
      const legRadius = isPutri ? 0.045 : isAlyona ? 0.042 : 0.06;
      const legOffsetX = isPutri ? 0.08 : isAlyona ? 0.07 : 0.1;
      const legOffsetY = isPutri ? 0.44 : isAlyona ? 0.4 : 0.48;

      const leftLeg = new THREE.Group();
      leftLeg.position.set(-legOffsetX, legOffsetY, 0);
      const leftThigh = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius, legRadius * 0.85, 0.28, 8),
        pantsMat,
      );
      leftThigh.position.y = -0.14;
      leftLeg.add(leftThigh);

      const leftKnee = new THREE.Group();
      leftKnee.position.y = -0.28;
      const leftShin = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius * 0.85, legRadius * 0.75, 0.28, 8),
        pantsMat,
      );
      leftShin.position.y = -0.14;
      leftKnee.add(leftShin);

      // Sepatu feminin/anak
      if (isPutri) {
        const shoeL = new THREE.Mesh(
          new THREE.BoxGeometry(0.075, 0.045, 0.13),
          createMat("#db2777", 0.6),
        );
        shoeL.position.set(0, -0.26, 0.03);
        leftKnee.add(shoeL);
      } else if (isAlyona) {
        // Kaus kaki renda putih + sepatu Mary Jane
        const sockL = new THREE.Mesh(
          new THREE.CylinderGeometry(0.044, 0.044, 0.06, 8),
          createMat("#ffffff", 0.7),
        );
        sockL.position.y = -0.22;
        const shoeL = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.045, 0.12),
          createMat("#db2777", 0.75),
        );
        shoeL.position.set(0, -0.26, 0.03);
        leftKnee.add(sockL, shoeL);
      }
      leftLeg.add(leftKnee);

      const rightLeg = new THREE.Group();
      rightLeg.position.set(legOffsetX, legOffsetY, 0);
      const rightThigh = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius, legRadius * 0.85, 0.28, 8),
        pantsMat,
      );
      rightThigh.position.y = -0.14;
      rightLeg.add(rightThigh);

      const rightKnee = new THREE.Group();
      rightKnee.position.y = -0.28;
      const rightShin = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius * 0.85, legRadius * 0.75, 0.28, 8),
        pantsMat,
      );
      rightShin.position.y = -0.14;
      rightKnee.add(rightShin);

      if (isPutri) {
        const shoeR = new THREE.Mesh(
          new THREE.BoxGeometry(0.075, 0.045, 0.13),
          createMat("#db2777", 0.6),
        );
        shoeR.position.set(0, -0.26, 0.03);
        rightKnee.add(shoeR);
      } else if (isAlyona) {
        const sockR = new THREE.Mesh(
          new THREE.CylinderGeometry(0.044, 0.044, 0.06, 8),
          createMat("#ffffff", 0.7),
        );
        sockR.position.y = -0.22;
        const shoeR = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.045, 0.12),
          createMat("#db2777", 0.75),
        );
        shoeR.position.set(0, -0.26, 0.03);
        rightKnee.add(sockR, shoeR);
      }
      rightLeg.add(rightKnee);

      root.add(leftLeg, rightLeg);

      // Buruang gets an inspection clipboard
      if (def.id === "buruang") {
        const clipboard = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.24, 0.02),
          createMat("#78350f", 0.5),
        );
        clipboard.position.set(0.15, -0.12, 0.15);
        clipboard.rotation.x = -0.4;
        rightArm.add(clipboard);
      }

      // Roby gets a Lit Cigarette with Glowing Red Ember
      if (def.id === "roby") {
        const cigaretteGroup = new THREE.Group();
        cigaretteGroup.position.set(0.04, -0.16, 0.12);
        cigaretteGroup.rotation.x = Math.PI / 2.8;

        const cigBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8),
          createMat("#f8fafc", 0.5),
        );
        const cigFilter = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0082, 0.0082, 0.024, 8),
          createMat("#d97706", 0.6),
        );
        cigFilter.position.y = -0.028;
        const cigEmber = new THREE.Mesh(
          new THREE.SphereGeometry(0.009, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xef4444 }),
        );
        cigEmber.position.y = 0.042;
        cigaretteGroup.add(cigBody, cigFilter, cigEmber);
        rightArm.add(cigaretteGroup);
      }

      // Bunda Putri gets an elegant teacup & gold bracelet
      if (def.id === "putri") {
        const teacupGroup = new THREE.Group();
        teacupGroup.position.set(0.08, -0.2, 0.14);

        const saucer = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.05, 0.012, 12),
          createMat("#fdf2f8", 0.3, 0.8),
        );
        const teacup = new THREE.Mesh(
          new THREE.CylinderGeometry(0.038, 0.028, 0.055, 10),
          createMat("#fdf2f8", 0.3, 0.8),
        );
        teacup.position.y = 0.032;
        teacupGroup.add(saucer, teacup);
        rightArm.add(teacupGroup);

        // Gelang emas di tangan kiri
        const goldBracelet = new THREE.Mesh(
          new THREE.TorusGeometry(0.042, 0.007, 8, 16),
          createMat("#fbbf24", 0.2, 0.9),
        );
        goldBracelet.rotation.x = Math.PI / 2;
        goldBracelet.position.set(0, -0.22, 0);
        leftArm.add(goldBracelet);
      }

      // Alyona gets a cute fluffy Teddy Bear
      if (def.id === "alyona") {
        const teddyGroup = new THREE.Group();
        teddyGroup.position.set(0.12, -0.14, 0.2);
        teddyGroup.rotation.x = -0.3;

        const teddyMat = createMat("#854d0e", 0.9);
        const teddySnoutMat = createMat("#fef3c7", 0.85);

        const teddyBody = new THREE.Mesh(
          new THREE.SphereGeometry(0.095, 10, 10),
          teddyMat,
        );
        const teddyHead = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 10, 10),
          teddyMat,
        );
        teddyHead.position.set(0, 0.11, 0.02);

        // Telinga beruang
        const earL = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), teddyMat);
        earL.position.set(-0.055, 0.17, 0.02);
        const earR = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), teddyMat);
        earR.position.set(0.055, 0.17, 0.02);

        // Moncong hidung
        const snout = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), teddySnoutMat);
        snout.position.set(0, 0.1, 0.07);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), createMat("#0f172a", 0.5));
        nose.position.set(0, 0.115, 0.095);

        // Pita merah di leher teddy bear
        const teddyBow = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 6, 6),
          createMat("#ef4444", 0.8),
        );
        teddyBow.position.set(0, 0.05, 0.065);

        teddyGroup.add(teddyBody, teddyHead, earL, earR, snout, nose, teddyBow);
        rightArm.add(teddyGroup);
      }

      let initialPos = new THREE.Vector3(
        def.deskPos[0],
        0,
        def.deskPos[2] + 0.65,
      );

      if (isBuruang) {
        initialPos = new THREE.Vector3(-1.0, 0, 1.8);
        root.position.copy(initialPos);
        root.rotation.y = 0;
        spine.position.y = 0.52;
      } else if (isPutri) {
        // BUNDA PUTRI DUDUK ANGGUN DI KURSI WINGBACK MEWAH DI RUANG BERMAIN ANAK (DI BELAKANG MEJA AYAH ROBY)
        initialPos = new THREE.Vector3(-3.9, 0, 1.6);
        root.position.copy(initialPos);
        root.rotation.y = -Math.PI / 1.7; // Menghadap ke karpet bermain Alyona & meja Ayah Roby
        spine.position.y = 0.44;

        leftLeg.rotation.x = -Math.PI / 2.0;
        rightLeg.rotation.x = -Math.PI / 2.0;
        leftKnee.rotation.x = Math.PI / 2.1;
        rightKnee.rotation.x = Math.PI / 2.1;

        leftArm.rotation.x = -0.4;
        rightArm.rotation.x = -0.65;
        head.rotation.y = 0.1;
      } else if (isAlyona) {
        // ALYONA BERMAIN CERIA DI KARPET BERMAIN ANAK (DI BELAKANG MEJA AYAH ROBY)
        initialPos = new THREE.Vector3(-5.0, 0, 1.8);
        root.position.copy(initialPos);
        root.rotation.y = 0;
        spine.position.y = 0.42;
      } else if (isLead) {
        // ROBY LEADER RELAXED POSTURE (HANYA NONTON VIDEO)
        initialPos = new THREE.Vector3(def.deskPos[0], 0, def.deskPos[2] + 0.72);
        root.position.copy(initialPos);
        root.rotation.y = Math.PI;

        // Leaning back comfortably in executive chair
        spine.position.y = 0.5;
        spine.rotation.x = -0.1; // Leaning back

        // Legs comfortably resting forward
        leftLeg.rotation.x = -Math.PI / 2.05;
        rightLeg.rotation.x = -Math.PI / 2.05;
        leftKnee.rotation.x = Math.PI / 2.1;
        rightKnee.rotation.x = Math.PI / 2.1;

        // Relaxed arms on armrests (not typing)
        leftArm.rotation.x = -0.45;
        leftArm.rotation.z = -0.2;
        rightArm.rotation.x = -0.55;
        rightArm.rotation.z = 0.2;

        head.rotation.x = -0.05; // Looking up slightly at the video player
      } else {
        // Staff seated in chairs
        root.position.copy(initialPos);
        root.rotation.y = Math.PI;
        spine.position.y = 0.48;

        leftLeg.rotation.x = -Math.PI / 2.0;
        rightLeg.rotation.x = -Math.PI / 2.0;
        leftKnee.rotation.x = Math.PI / 2.0;
        rightKnee.rotation.x = Math.PI / 2.0;

        leftArm.rotation.x = -Math.PI / 2.8;
        rightArm.rotation.x = -Math.PI / 2.8;
        head.rotation.x = 0.12;
      }

      scene.add(root);

      return {
        root,
        spine,
        head,
        arms: [leftArm, rightArm] as [THREE.Group, THREE.Group],
        legs: [leftLeg, rightLeg] as [THREE.Group, THREE.Group],
        pos: initialPos.clone(),
        homePos: initialPos.clone(),
        heading: isBuruang ? 0 : Math.PI,
        typingSpeed: 14 + Math.random() * 4,
        patrolWaypoints: [
          new THREE.Vector3(-1.0, 0, 1.8), // Whiteboard
          new THREE.Vector3(-2.2, 0, -1.6), // Koncek
          new THREE.Vector3(-5.0, 0, -1.6), // Roby
          new THREE.Vector3(0.6, 0, -1.6), // Biawak
          new THREE.Vector3(3.4, 0, -1.6), // Bonta
          new THREE.Vector3(6.2, 0, -1.6), // Bala
          new THREE.Vector3(-1.0, 0, 1.8), // Whiteboard
        ],
        patrolIdx: 0,
        lifeState: "working" as AgentLifeState,
        stateTimer: 10 + Math.random() * 20, // Seconds until taking a stroll
      };
    };

    ACTORS_DEF.forEach((def) => {
      const actorObj = createCharacterRig(def);
      actorsMeshRef.current.set(def.id, actorObj);
    });

    // =========================================================================
    // 11. COURIER CHARACTER RIG (KURIR PAKET KELUAR MASUK MEMBAWA BERKAS AI)
    // =========================================================================
    const courierGroup = new THREE.Group();
    courierGroup.name = "courier";
    const doorEntrancePos = new THREE.Vector3(-ROOM_W / 2 + 0.6, 0, 3.8);
    courierGroup.position.copy(doorEntrancePos);

    const courierSkin = createMat("#fed7aa", 0.8);
    const courierShirt = createMat("#f97316", 0.7); // Bright Orange Express Uniform
    const courierPants = createMat("#0f172a", 0.8);

    const courierSpine = new THREE.Group();
    const courierTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.16, 0.42, 12),
      courierShirt,
    );
    courierTorso.position.y = 0.21;
    courierSpine.add(courierTorso);

    // Reflective Safety Stripe on Vest
    const courierStripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.182, 0.162, 0.08, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    courierStripe.position.y = 0.22;
    courierSpine.add(courierStripe);

    // Courier Head & Visor Cap
    const courierHead = new THREE.Group();
    courierHead.position.y = 0.48;
    const courierFace = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 12),
      courierSkin,
    );
    const courierCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12),
      createMat("#1e293b", 0.5),
    );
    courierCap.position.y = 0.1;
    const courierVisor = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.02, 0.14),
      createMat("#f97316", 0.5),
    );
    courierVisor.position.set(0, 0.08, 0.12);
    courierHead.add(courierFace, courierCap, courierVisor);
    courierSpine.add(courierHead);

    // Courier Arms
    const courierArmL = new THREE.Group();
    courierArmL.position.set(-0.24, 0.36, 0);
    const armLMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.045, 0.34, 8),
      courierShirt,
    );
    armLMesh.position.y = -0.17;
    courierArmL.add(armLMesh);

    const courierArmR = new THREE.Group();
    courierArmR.position.set(0.24, 0.36, 0);
    const armRMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.045, 0.34, 8),
      courierShirt,
    );
    armRMesh.position.y = -0.17;
    courierArmR.add(armRMesh);

    // GLOWING AI PROMPT DELIVERY PACKAGE (BERKAS HASIL PROMPTING DARI CHAT AI)
    const packageGroup = new THREE.Group();
    packageGroup.position.set(0, -0.12, 0.22);
    const packageBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.16, 0.36),
      createMat("#d97706", 0.5), // Express parcel carton
    );
    // Glowing prompt document folder inside
    const docFolder = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.04, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), // Glowing cyan prompt dossier
    );
    docFolder.position.y = 0.1;
    const packageRibbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.17, 0.37),
      new THREE.MeshBasicMaterial({ color: 0x10b981 }), // Green verified seal
    );
    packageGroup.add(packageBox, docFolder, packageRibbon);
    courierArmR.add(packageGroup);

    courierSpine.add(courierArmL, courierArmR);
    courierGroup.add(courierSpine);

    // Courier Legs
    const courierLegL = new THREE.Group();
    courierLegL.position.set(-0.1, 0.48, 0);
    const legLMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.05, 0.28, 8),
      courierPants,
    );
    legLMesh.position.y = -0.14;
    courierLegL.add(legLMesh);

    const courierKneeL = new THREE.Group();
    courierKneeL.position.y = -0.28;
    const shinLMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.045, 0.28, 8),
      courierPants,
    );
    shinLMesh.position.y = -0.14;
    courierKneeL.add(shinLMesh);
    courierLegL.add(courierKneeL);

    const courierLegR = new THREE.Group();
    courierLegR.position.set(0.1, 0.48, 0);
    const legRMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.05, 0.28, 8),
      courierPants,
    );
    legRMesh.position.y = -0.14;
    courierLegR.add(legRMesh);

    const courierKneeR = new THREE.Group();
    courierKneeR.position.y = -0.28;
    const shinRMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.045, 0.28, 8),
      courierPants,
    );
    shinRMesh.position.y = -0.14;
    courierKneeR.add(shinRMesh);
    courierLegR.add(courierKneeR);

    courierGroup.add(courierLegL, courierLegR);
    courierGroup.visible = false; // Initially outside the office
    scene.add(courierGroup);

    // Courier State Manager
    interface CourierState {
      status: "idle_outside" | "entering" | "delivering" | "handing_over" | "exiting";
      targetPos: THREE.Vector3;
      timer: number;
      taskLabel: string;
    }

    const courierState: CourierState = {
      status: "idle_outside",
      targetPos: new THREE.Vector3(-5.0, 0, -1.8), // Deliver to Roby's desk front
      timer: 0,
      taskLabel: "Dokumen AI Chat",
    };

    const triggerCourierDelivery = (taskName = "Berkas Prompting AI") => {
      courierState.status = "entering";
      courierState.taskLabel = taskName;
      courierState.timer = 0;
      courierGroup.position.copy(doorEntrancePos);
      courierGroup.visible = true;

      // Pick destination: Roby's desk front or developer desks
      courierState.targetPos = new THREE.Vector3(-5.0, 0, -1.8);
      showBubbleRef.current("courier", `Permisi! Paket hasil prompting baru saja tiba! 📦⚡`, 4500);
    };

    courierTriggerRef.current = {
      triggerDelivery: triggerCourierDelivery,
    };

    // =========================================================================
    // 12. RAYCASTING CLICK INTERACTION
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersectableRoots: THREE.Object3D[] = [];
      actorsMeshRef.current.forEach((a) => intersectableRoots.push(a.root));
      if (courierGroup.visible) intersectableRoots.push(courierGroup);

      const intersects = raycaster.intersectObjects(intersectableRoots, true);
      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (
          current &&
          current.parent &&
          !actorsMeshRef.current.has(current.name) &&
          current.name !== "courier"
        ) {
          current = current.parent;
        }

        if (current) {
          if (current.name === "courier") {
            showBubbleRef.current(
              "courier",
              `Paket berkas hasil prompting siap diantar ke pimpinan & tim! 📦💨`,
              4500,
            );
          } else if (actorsMeshRef.current.has(current.name)) {
            const clickedId = current.name;
            const actorDef = ACTORS_DEF.find((a) => a.id === clickedId);
            if (actorDef) {
              const randomQuip =
                actorDef.quips[Math.floor(Math.random() * actorDef.quips.length)];
              showBubbleRef.current(clickedId, randomQuip, 4500);
              onSelectAgentRef.current?.(clickedId);
            }
          }
        }
      }
    };

    renderer.domElement.addEventListener("click", handleCanvasClick);

    // Initial greetings
    const welcomeTimer = setTimeout(() => {
      showBubbleRef.current(
        "roby",
        "Markas Portofolio Siap! Kursi pimpinan nyaman, saya pantau keynote sambil nonton video 🎬🍿",
        5000,
      );
      setTimeout(() => {
        showBubbleRef.current(
          "buruang",
          "Buruang memverifikasi 25+ proyek portofolio berjalan 100% stabil! 📋",
          5000,
        );
      }, 2500);
    }, 1200);

    // Periodic Courier visit every 40s to keep Markas lively
    const periodicCourierInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (courierState.status === "idle_outside" && Math.random() > 0.6) {
        triggerCourierDelivery("Laporan Eksekusi Sprint Portofolio");
      }
    }, 90000);

    // =========================================================================
    // 13. ANIMATION LOOP (LIVELY OFFICE ROUTINE, VIDEO, CHARTS & COURIER)
    // =========================================================================
    let animId: number;
    let frameCount = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      frameCount++;

      controls.update();

      // Animate Server LEDs
      rackLeds.forEach((led, i) => {
        led.visible = Math.sin(elapsed * 7 + i) > -0.2;
      });

      // -----------------------------------------------------------------------
      // A. RENDER TWO GIANT WALL SCREENS (CHARTS) EVERY 3 FRAMES
      // -----------------------------------------------------------------------
      if (frameCount % 3 === 0) {
        // Wall Chart 1: Real-time VPS Cloud Traffic Line Chart
        {
          const W = chartCanvas1.width;
          const H = chartCanvas1.height;
          chartCtx1.fillStyle = "#090d16";
          chartCtx1.fillRect(0, 0, W, H);

          // Top Header Bar
          chartCtx1.fillStyle = "#1e293b";
          chartCtx1.fillRect(0, 0, W, 42);
          chartCtx1.fillStyle = "#38bdf8";
          chartCtx1.font = "bold 16px monospace";
          chartCtx1.fillText("⚡ CLOUD VPS METRICS & REAL-TIME RPS", 20, 27);

          // Metric Badges
          chartCtx1.fillStyle = "#10b981";
          chartCtx1.font = "bold 13px monospace";
          chartCtx1.fillText("UPTIME 99.99%", 360, 27);

          // Sub-metrics row
          chartCtx1.fillStyle = "#94a3b8";
          chartCtx1.font = "12px monospace";
          chartCtx1.fillText("RPS: 1,842 req/s   |   LATENCY: 8.4ms   |   MEM: 38%   |   SSL: GRADE A+", 20, 64);

          // Draw Live Wave Line Chart
          chartCtx1.strokeStyle = "rgba(56, 189, 248, 0.2)";
          chartCtx1.lineWidth = 1;
          for (let y = 90; y <= 240; y += 30) {
            chartCtx1.beginPath();
            chartCtx1.moveTo(20, y);
            chartCtx1.lineTo(W - 20, y);
            chartCtx1.stroke();
          }

          chartCtx1.beginPath();
          chartCtx1.strokeStyle = "#06b6d4";
          chartCtx1.lineWidth = 3;
          for (let x = 20; x <= W - 20; x += 8) {
            const sample = Math.sin(elapsed * 3 + x * 0.04) * 35 + Math.cos(elapsed * 5 + x * 0.08) * 15;
            const y = 175 + sample;
            if (x === 20) chartCtx1.moveTo(x, y);
            else chartCtx1.lineTo(x, y);
          }
          chartCtx1.stroke();

          // Second green line
          chartCtx1.beginPath();
          chartCtx1.strokeStyle = "#10b981";
          chartCtx1.lineWidth = 2;
          for (let x = 20; x <= W - 20; x += 10) {
            const sample = Math.cos(elapsed * 2.5 + x * 0.03) * 25 + Math.sin(elapsed * 4 + x * 0.06) * 12;
            const y = 185 + sample;
            if (x === 20) chartCtx1.moveTo(x, y);
            else chartCtx1.lineTo(x, y);
          }
          chartCtx1.stroke();

          // Bottom live pulse
          chartCtx1.fillStyle = "#34d399";
          chartCtx1.beginPath();
          chartCtx1.arc(28, H - 20, 5, 0, Math.PI * 2);
          chartCtx1.fill();
          chartCtx1.fillStyle = "#cbd5e1";
          chartCtx1.font = "11px monospace";
          chartCtx1.fillText("LIVE TRAFFIC SYNCED WITH CLOUDFLARE WAF & NGINX", 42, H - 16);

          chartTex1.needsUpdate = true;
        }

        // Wall Chart 2: 25+ Projects Sprint & Multi-Bar Chart
        {
          const W = chartCanvas2.width;
          const H = chartCanvas2.height;
          chartCtx2.fillStyle = "#090d16";
          chartCtx2.fillRect(0, 0, W, H);

          // Top Header Bar
          chartCtx2.fillStyle = "#1e293b";
          chartCtx2.fillRect(0, 0, W, 42);
          chartCtx2.fillStyle = "#f59e0b";
          chartCtx2.font = "bold 16px monospace";
          chartCtx2.fillText("📊 25+ PROJECTS SPRINT & AGENT COMPLETION", 20, 27);

          chartCtx2.fillStyle = "#34d399";
          chartCtx2.font = "bold 13px monospace";
          chartCtx2.fillText("SPRINT #42: 100% OK", 340, 27);

          // Multi-Bar Chart for Agents
          const barLabels = ["Roby (Lead)", "Buruang", "Koncek (BE)", "Biawak (FE)", "Bonta (Sec)", "Bala (Supp)"];
          const barColors = ["#f59e0b", "#eab308", "#06b6d4", "#10b981", "#ef4444", "#8b5cf6"];
          const basePercents = [96, 100, 94, 98, 92, 95];

          const startX = 30;
          const barW = 34;
          const gap = 38;
          const chartBottomY = 220;

          barLabels.forEach((label, idx) => {
            const bx = startX + idx * (barW + gap);
            const dynamicPct = basePercents[idx] + Math.sin(elapsed * 3 + idx) * 3;
            const barHeight = (dynamicPct / 100) * 120;
            const by = chartBottomY - barHeight;

            // Bar background slot
            chartCtx2.fillStyle = "#1e293b";
            chartCtx2.fillRect(bx, chartBottomY - 120, barW, 120);

            // Active bar
            chartCtx2.fillStyle = barColors[idx];
            chartCtx2.fillRect(bx, by, barW, barHeight);

            // Value text
            chartCtx2.fillStyle = "#ffffff";
            chartCtx2.font = "bold 11px monospace";
            chartCtx2.fillText(`${Math.round(dynamicPct)}%`, bx - 2, by - 6);

            // Agent label
            chartCtx2.fillStyle = "#94a3b8";
            chartCtx2.font = "10px monospace";
            chartCtx2.fillText(label.split(" ")[0], bx - 4, chartBottomY + 16);
          });

          // Mini Donut Chart in Corner
          const donutX = 430;
          const donutY = 145;
          chartCtx2.lineWidth = 14;
          chartCtx2.beginPath();
          chartCtx2.strokeStyle = "#10b981";
          chartCtx2.arc(donutX, donutY, 32, 0, Math.PI * 1.6);
          chartCtx2.stroke();

          chartCtx2.beginPath();
          chartCtx2.strokeStyle = "#06b6d4";
          chartCtx2.arc(donutX, donutY, 32, Math.PI * 1.6, Math.PI * 2.0);
          chartCtx2.stroke();

          chartCtx2.fillStyle = "#ffffff";
          chartCtx2.font = "bold 13px monospace";
          chartCtx2.textAlign = "center";
          chartCtx2.fillText("25+", donutX, donutY + 5);
          chartCtx2.textAlign = "left";

          // Bottom status
          chartCtx2.fillStyle = "#cbd5e1";
          chartCtx2.font = "11px monospace";
          chartCtx2.fillText("PORTFOLIO RELEASES VERIFIED · ALL MODULES MERGED", 20, H - 16);

          chartTex2.needsUpdate = true;
        }

        // ---------------------------------------------------------------------
        // B. RENDER COMPUTER MONITORS (ROBY'S VIDEO STREAM & DEVS' CODE TERMINALS)
        // ---------------------------------------------------------------------
        monitorTerminals.forEach((term, tIdx) => {
          const { ctx, canvas, header, logs, tex, actorId } = term;
          const W = canvas.width;
          const H = canvas.height;

          if (actorId === "roby") {
            // =================================================================
            // ROBY'S MONITOR: VIDEO STREAMING PLAYER (HANYA NONTON VIDEO)
            // =================================================================
            // Background
            ctx.fillStyle = "#030712";
            ctx.fillRect(0, 0, W, H);

            // YouTube Video Header
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(0, 0, W, 34);

            // Video Brand & Title
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText("▶ YouTube · Keynote 4K HDR", 16, 22);

            ctx.fillStyle = "#cbd5e1";
            ctx.font = "11px sans-serif";
            ctx.fillText("🔴 LIVE STREAMING", W - 130, 22);

            // Video Scene (Simulating dynamic animated cinema stream)
            const gradient = ctx.createLinearGradient(0, 34, W, H - 46);
            gradient.addColorStop(0, "#1e1b4b");
            gradient.addColorStop(0.5, "#4338ca");
            gradient.addColorStop(1, "#312e81");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 34, W, H - 80);

            // Animated Audio Wave Visualizer in Video
            ctx.fillStyle = "#f43f5e";
            for (let v = 0; v < 28; v++) {
              const h = Math.abs(Math.sin(elapsed * 6 + v * 0.4)) * 48 + 12;
              ctx.fillRect(40 + v * 15, H - 95 - h, 9, h);
            }

            // Video Title & Subtitle in Video Frame
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 17px sans-serif";
            ctx.fillText("AI AGENTS ORCHESTRATION & CHILL TECH TALK", 40, 78);

            ctx.fillStyle = "#fbbf24";
            ctx.font = "13px sans-serif";
            ctx.fillText("Speaker: Roby Karti S. · Portfolio Multi-Agent Hub", 40, 104);

            // Video Player Progress Bar (Red YouTube scrubbing bar)
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(0, H - 46, W, 46);

            const progressRatio = ((elapsed * 0.05) % 1);
            const scrubW = W * progressRatio;
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(0, H - 46, scrubW, 6);
            // Knob
            ctx.beginPath();
            ctx.arc(scrubW, H - 43, 6, 0, Math.PI * 2);
            ctx.fill();

            // Video Player Controls
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px sans-serif";
            ctx.fillText("⏸ 🔊 18:42 / 52:10   [HD]  ⚙  ⛶", 16, H - 18);

            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.fillText("Status: Relaxed Watching", W - 170, H - 18);
          } else {
            // =================================================================
            // DEVELOPER AGENTS' MONITORS: LIVE SCROLLING TERMINAL CODE LOGS
            // =================================================================
            ctx.fillStyle = "#0a0f1d";
            ctx.fillRect(0, 0, W, H);

            // Top Header Bar
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(0, 0, W, 36);

            // Dots
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(18, 18, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(36, 18, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#10b981";
            ctx.beginPath();
            ctx.arc(54, 18, 6, 0, Math.PI * 2);
            ctx.fill();

            // Title
            ctx.fillStyle = "#94a3b8";
            ctx.font = "bold 15px monospace";
            ctx.fillText(`bash: ${header}`, 72, 23);

            // Scrolling logs
            ctx.font = "16px monospace";
            const lineSpacing = 28;
            const startY = 64;
            const activeLogShift = Math.floor(elapsed * 1.5 + tIdx * 2) % logs.length;

            for (let l = 0; l < 8; l++) {
              const logIndex = (l + activeLogShift) % logs.length;
              const logText = logs[logIndex] || "";

              if (logText.includes("OK") || logText.includes("SUCCESS") || logText.includes("Tested")) {
                ctx.fillStyle = "#34d399";
              } else if (logText.includes("ALERT") || logText.includes("MITIGATED")) {
                ctx.fillStyle = "#f87171";
              } else if (logText.includes("GIN") || logText.includes("POST") || logText.includes("Next.js")) {
                ctx.fillStyle = "#38bdf8";
              } else {
                ctx.fillStyle = "#e2e8f0";
              }

              if (l === 7) {
                const blink = Math.sin(elapsed * 8) > 0 ? " ▋" : "";
                ctx.fillText(`> ${logText}${blink}`, 18, startY + l * lineSpacing);
              } else {
                ctx.fillText(`> ${logText}`, 18, startY + l * lineSpacing);
              }
            }
          }

          tex.needsUpdate = true;
        });
      }

      // -----------------------------------------------------------------------
      // C. AGENT ROUTINE & LIFE-CYCLE (BERJALAN-JALAN & KEMBALI BEKERJA)
      // -----------------------------------------------------------------------
      const loungeTarget = new THREE.Vector3(5.5, 0, 1.2);
      const boardTarget = new THREE.Vector3(-1.0, 0, 1.8);

      actorsMeshRef.current.forEach((actor, id) => {
        if (id === "buruang") {
          // Buruang Patrol Behavior
          const targetWaypoint = actor.patrolWaypoints[actor.patrolIdx];
          const dist = actor.pos.distanceTo(targetWaypoint);

          if (dist < 0.25) {
            actor.legs[0].rotation.x = 0;
            actor.legs[1].rotation.x = 0;
            actor.arms[0].rotation.x = -Math.PI / 4 + Math.sin(elapsed * 3) * 0.1;
            actor.arms[1].rotation.x = -Math.PI / 4;
            actor.head.rotation.x = Math.sin(elapsed * 2) * 0.12;

            if (Math.sin(elapsed * 0.7) > 0.98) {
              actor.patrolIdx = (actor.patrolIdx + 1) % actor.patrolWaypoints.length;
            }
          } else {
            const dir = targetWaypoint.clone().sub(actor.pos).normalize();
            actor.pos.add(dir.multiplyScalar(delta * 1.6));
            actor.heading = Math.atan2(dir.x, dir.z);
            actor.root.rotation.y = actor.heading;

            const swing = Math.sin(elapsed * 8);
            actor.legs[0].rotation.x = swing * 0.6;
            actor.legs[1].rotation.x = -swing * 0.6;
            actor.arms[0].rotation.x = -swing * 0.5;
            actor.arms[1].rotation.x = swing * 0.5;
            actor.spine.position.y = 0.52 + Math.abs(Math.sin(elapsed * 8)) * 0.04;
          }
        } else if (id === "roby") {
          // ===================================================================
          // ROBY (PIMPINAN): NONTON VIDEO, MINUM KOPI & MEROKOK SANTAI
          // ===================================================================
          actor.spine.position.y = 0.5 + Math.sin(elapsed * 1.5) * 0.006;
          actor.head.rotation.x = -0.06 + Math.sin(elapsed * 1.2) * 0.03;
          actor.head.rotation.y = Math.sin(elapsed * 0.8) * 0.06;

          // Smoking animation: periodically lift cigarette to lips
          const smokingCycle = Math.sin(elapsed * 0.5);
          if (smokingCycle > 0.55) {
            // Lifting cigarette to mouth
            actor.arms[1].rotation.x = -1.15 + (smokingCycle - 0.55) * 0.35;
            actor.arms[1].rotation.z = 0.32;
          } else {
            // Resting on armrest holding cigarette
            actor.arms[1].rotation.x = -0.55 + Math.sin(elapsed * 1.5) * 0.04;
            actor.arms[1].rotation.z = 0.2;
          }
          actor.arms[0].rotation.x = -0.45;
        } else if (id === "putri") {
          // PUTRI SEATED ON WAITING SOFA: Smiling, gentle breathing & watching Alyona
          actor.spine.position.y = 0.44 + Math.sin(elapsed * 1.4) * 0.004;
          actor.head.rotation.y = -0.15 + Math.sin(elapsed * 0.7) * 0.2;
          actor.head.rotation.x = 0.05 + Math.sin(elapsed * 1.1) * 0.02;
          actor.arms[1].rotation.x = -0.65 + Math.sin(elapsed * 1.4) * 0.03;
        } else if (id === "alyona") {
          // ALYONA HOPPING & PLAYING HAPPILY ACROSS MARKAS
          const alyonaWaypoints = [
            new THREE.Vector3(-5.0, 0, 1.8), // Ruang bermain anak di belakang meja Ayah Roby
            new THREE.Vector3(-4.0, 0, 1.6), // Dekat Bunda Putri di kursi santai ruang anak
            new THREE.Vector3(-5.0, 0, -1.6), // Menghampiri meja kerja Ayah Roby
            new THREE.Vector3(-1.0, 0, 2.0), // Dekat Kanban Whiteboard
            new THREE.Vector3(5.0, 0, 1.6), // Bermain ke sofa santai lounge
            new THREE.Vector3(-5.0, 0, 1.8), // Kembali ke ruang anak belakang Ayah
          ];
          const targetWaypoint = alyonaWaypoints[actor.patrolIdx % alyonaWaypoints.length];
          const dist = actor.pos.distanceTo(targetWaypoint);

          if (dist < 0.25) {
            // Reached checkpoint: happy hopping
            const hop = Math.abs(Math.sin(elapsed * 7)) * 0.07;
            actor.spine.position.y = 0.42 + hop;
            actor.head.rotation.x = -0.12 + Math.sin(elapsed * 4) * 0.1;
            actor.arms[0].rotation.x = -Math.PI / 4 + Math.sin(elapsed * 5) * 0.2;
            actor.arms[1].rotation.x = -Math.PI / 4 + Math.cos(elapsed * 5) * 0.2;

            if (Math.sin(elapsed * 0.75) > 0.98) {
              actor.patrolIdx = (actor.patrolIdx + 1) % alyonaWaypoints.length;
            }
          } else {
            // Running happily with teddy bear
            const dir = targetWaypoint.clone().sub(actor.pos).normalize();
            actor.pos.add(dir.multiplyScalar(delta * 1.4));
            actor.heading = Math.atan2(dir.x, dir.z);
            actor.root.rotation.y = actor.heading;

            const swing = Math.sin(elapsed * 11);
            actor.legs[0].rotation.x = swing * 0.6;
            actor.legs[1].rotation.x = -swing * 0.6;
            actor.arms[0].rotation.x = -swing * 0.5;
            actor.arms[1].rotation.x = swing * 0.5;
            actor.spine.position.y = 0.42 + Math.abs(Math.sin(elapsed * 11)) * 0.06;
          }
        } else {
          // ===================================================================
          // STAFF (KONCEK, BIAWAK, BONTA, BALA): KERJA, JALAN-JALAN & KEMBALI
          // ===================================================================
          // Decrease state timer
          actor.stateTimer -= delta;

          // State Machine
          if (actor.lifeState === "working") {
            // Typing at keyboard
            const speed = actor.typingSpeed;
            actor.arms[0].rotation.x = -Math.PI / 2.7 + Math.sin(elapsed * speed) * 0.08;
            actor.arms[1].rotation.x = -Math.PI / 2.7 + Math.cos(elapsed * speed) * 0.08;
            actor.head.rotation.x = 0.12 + Math.sin(elapsed * 2) * 0.03;
            actor.head.rotation.y = Math.sin(elapsed * 0.7) * 0.05;
            actor.spine.position.y = 0.48 + Math.sin(elapsed * 4) * 0.004;

            // Seated legs
            actor.legs[0].rotation.x = -Math.PI / 2.0;
            actor.legs[1].rotation.x = -Math.PI / 2.0;
            actor.legs[0].children[1].rotation.x = Math.PI / 2.0;
            actor.legs[1].children[1].rotation.x = Math.PI / 2.0;

            if (statusRef.current === "working" || statusRef.current === "thinking") {
              actor.stateTimer = 99999;
            } else if (actor.stateTimer <= 0) {
              // Transition to walking (either to lounge or to whiteboard)
              actor.lifeState = Math.random() > 0.5 ? "walking_to_lounge" : "walking_to_board";
              actor.stateTimer = 8 + Math.random() * 5;
            }
          } else if (actor.lifeState === "walking_to_lounge" || actor.lifeState === "walking_to_board") {
            const dest = actor.lifeState === "walking_to_lounge" ? loungeTarget : boardTarget;
            const dist = actor.pos.distanceTo(dest);

            if (dist < 0.35) {
              actor.lifeState = actor.lifeState === "walking_to_lounge" ? "relaxing_lounge" : "inspecting_board";
              actor.stateTimer = 6 + Math.random() * 6; // Relax for 6-12s
            } else {
              // Walk animation
              const dir = dest.clone().sub(actor.pos).normalize();
              actor.pos.add(dir.multiplyScalar(delta * 1.4));
              actor.heading = Math.atan2(dir.x, dir.z);
              actor.root.rotation.y = actor.heading;

              const swing = Math.sin(elapsed * 7.5);
              actor.legs[0].rotation.x = swing * 0.55;
              actor.legs[1].rotation.x = -swing * 0.55;
              actor.legs[0].children[1].rotation.x = 0;
              actor.legs[1].children[1].rotation.x = 0;

              actor.arms[0].rotation.x = -swing * 0.45;
              actor.arms[1].rotation.x = swing * 0.45;
              actor.spine.position.y = 0.52 + Math.abs(Math.sin(elapsed * 7.5)) * 0.03;
            }
          } else if (actor.lifeState === "relaxing_lounge" || actor.lifeState === "inspecting_board") {
            // Standing relaxing / taking drink / stretching
            actor.legs[0].rotation.x = 0;
            actor.legs[1].rotation.x = 0;
            actor.legs[0].children[1].rotation.x = 0;
            actor.legs[1].children[1].rotation.x = 0;
            actor.arms[0].rotation.x = -0.3 + Math.sin(elapsed * 2) * 0.1;
            actor.arms[1].rotation.x = -0.3 + Math.cos(elapsed * 2) * 0.1;
            actor.head.rotation.y = Math.sin(elapsed * 1.5) * 0.2;
            actor.spine.position.y = 0.52;

            if (actor.stateTimer <= 0) {
              actor.lifeState = "returning_desk";
            }
          } else if (actor.lifeState === "returning_desk") {
            const dist = actor.pos.distanceTo(actor.homePos);

            if (dist < 0.2) {
              // Arrived back home at chair
              actor.pos.copy(actor.homePos);
              actor.heading = Math.PI;
              actor.root.rotation.y = Math.PI;
              actor.lifeState = "working";
              actor.stateTimer = 18 + Math.random() * 25; // Work for 18-43s
            } else {
              // Walk animation back to desk
              const dir = actor.homePos.clone().sub(actor.pos).normalize();
              actor.pos.add(dir.multiplyScalar(delta * 1.5));
              actor.heading = Math.atan2(dir.x, dir.z);
              actor.root.rotation.y = actor.heading;

              const swing = Math.sin(elapsed * 8);
              actor.legs[0].rotation.x = swing * 0.55;
              actor.legs[1].rotation.x = -swing * 0.55;
              actor.legs[0].children[1].rotation.x = 0;
              actor.legs[1].children[1].rotation.x = 0;

              actor.arms[0].rotation.x = -swing * 0.45;
              actor.arms[1].rotation.x = swing * 0.45;
              actor.spine.position.y = 0.52 + Math.abs(Math.sin(elapsed * 8)) * 0.03;
            }
          }
        }

        actor.root.position.copy(actor.pos);

        // Project 3D head position for 2D speech bubble
        const headWorld = new THREE.Vector3();
        actor.head.getWorldPosition(headWorld);
        headWorld.y += 0.42;
        headWorld.project(camera);

        const currentWidth = canvasContainer.clientWidth || initialWidth;
        const currentHeight = canvasContainer.clientHeight || initialHeight;
        const sx = ((headWorld.x + 1) / 2) * currentWidth;
        const sy = ((-headWorld.y + 1) / 2) * currentHeight;

        setBubbles((prev) => {
          if (!prev[id]) return prev;
          return {
            ...prev,
            [id]: {
              ...prev[id],
              x: sx,
              y: sy,
            },
          };
        });
      });

      // -----------------------------------------------------------------------
      // D. COURIER MOVEMENT & DELIVERY LIFECYCLE (KELUAR MASUK MEMBAWA BERKAS)
      // -----------------------------------------------------------------------
      if (courierGroup.visible) {
        if (courierState.status === "entering") {
          const dist = courierGroup.position.distanceTo(courierState.targetPos);
          if (dist < 0.3) {
            courierState.status = "handing_over";
            courierState.timer = 3.5; // Handover pause
            showBubble(
              "roby",
              "Terima kasih kurir! Berkas prompt AI saya terima sambil nonton video 🍿📦",
              4000,
            );
          } else {
            const dir = courierState.targetPos.clone().sub(courierGroup.position).normalize();
            courierGroup.position.add(dir.multiplyScalar(delta * 2.2));
            courierGroup.rotation.y = Math.atan2(dir.x, dir.z);

            const swing = Math.sin(elapsed * 9);
            courierLegL.rotation.x = swing * 0.6;
            courierLegR.rotation.x = -swing * 0.6;
            courierArmL.rotation.x = -swing * 0.5;
            courierSpine.position.y = 0.52 + Math.abs(Math.sin(elapsed * 9)) * 0.03;
          }
        } else if (courierState.status === "handing_over") {
          courierState.timer -= delta;
          courierLegL.rotation.x = 0;
          courierLegR.rotation.x = 0;
          courierArmR.rotation.x = -Math.PI / 3; // Holding out parcel
          if (courierState.timer <= 0) {
            courierState.status = "exiting";
          }
        } else if (courierState.status === "exiting") {
          const dist = courierGroup.position.distanceTo(doorEntrancePos);
          if (dist < 0.4) {
            // Reached door: exit and hide
            courierGroup.visible = false;
            courierState.status = "idle_outside";
          } else {
            const dir = doorEntrancePos.clone().sub(courierGroup.position).normalize();
            courierGroup.position.add(dir.multiplyScalar(delta * 2.2));
            courierGroup.rotation.y = Math.atan2(dir.x, dir.z);

            const swing = Math.sin(elapsed * 9);
            courierLegL.rotation.x = swing * 0.6;
            courierLegR.rotation.x = -swing * 0.6;
            courierArmL.rotation.x = -swing * 0.5;
            courierSpine.position.y = 0.52 + Math.abs(Math.sin(elapsed * 9)) * 0.03;
          }
        }

        // Courier head bubble projection
        const courierHeadWorld = new THREE.Vector3();
        courierHead.getWorldPosition(courierHeadWorld);
        courierHeadWorld.y += 0.42;
        courierHeadWorld.project(camera);

        const currentWidth = canvasContainer.clientWidth || initialWidth;
        const currentHeight = canvasContainer.clientHeight || initialHeight;
        const sx = ((courierHeadWorld.x + 1) / 2) * currentWidth;
        const sy = ((-courierHeadWorld.y + 1) / 2) * currentHeight;

        setBubbles((prev) => {
          if (!prev["courier"]) return prev;
          return {
            ...prev,
            ["courier"]: {
              ...prev["courier"],
              x: sx,
              y: sy,
            },
          };
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nw, height: nh } = entry.contentRect;
        if (nw > 0 && nh > 0) {
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        }
      }
    });

    resizeObserver.observe(canvasContainer);

    return () => {
      clearTimeout(welcomeTimer);
      clearInterval(periodicCourierInterval);
      renderer.domElement.removeEventListener("click", handleCanvasClick);
      resizeObserver.disconnect();
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ===========================================================================
  // HANDLE INCOMING CHAT PROMPTS & TRIGGER COURIER PACKAGE DELIVERY
  // ===========================================================================
  useEffect(() => {
    if (!status || status === "idle") {
      actorsMeshRef.current.forEach((actor) => {
        actor.typingSpeed = 14 + Math.random() * 4;
      });
      return;
    }

    statusRef.current = status;
    if (status === "thinking" || status === "working") {
      showBubble(
        "roby",
        `Ada prompt baru masuk: "${activeTask || "Eksekusi Task"}"! Seluruh tim langsung duduk bekerja di meja masing-masing 🍿🎬`,
        4200,
      );

      // LANGSUNG DUDUK BEKERJA DI MEJA MASING-MASING SECARA INSTAN!
      actorsMeshRef.current.forEach((actor, id) => {
        if (id !== "putri" && id !== "alyona") {
          actor.pos.copy(actor.homePos);
          actor.root.position.copy(actor.homePos);
          actor.heading = id === "buruang" ? 0 : Math.PI;
          actor.root.rotation.y = actor.heading;
          actor.lifeState = "working";
          actor.typingSpeed = 26 + Math.random() * 6; // Turbo typing
          actor.stateTimer = 99999;
          actor.legs[0].rotation.x = -Math.PI / 2.0;
          actor.legs[1].rotation.x = -Math.PI / 2.0;
          actor.legs[0].children[1].rotation.x = Math.PI / 2.0;
          actor.legs[1].children[1].rotation.x = Math.PI / 2.0;
        }
      });

      // Dispatch courier parcel with AI prompt dossier!
      courierTriggerRef.current?.triggerDelivery(activeTask || "Dokumen Prompt AI");
    } else if (status === "success") {
      showBubble(
        "buruang",
        "Semua proyek terverifikasi 100% lolos quality check! 🌟",
        4500,
      );

      setTimeout(() => {
        showBubble(
          "roby",
          "Hasil koding tim mantap, berkas dari kurir sudah saya periksa! Lanjut nonton video lagi 🍿☕",
          4500,
        );
      }, 2000);
    }
  }, [status, activeTask, showBubble]);

  return (
    <div
      ref={outerContainerRef}
      className={cn(
        "relative w-full rounded-xl overflow-hidden border border-border/60 bg-slate-950 select-none transition-all shadow-md",
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "",
        className,
      )}
    >
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 2D Speech Bubbles */}
      {Object.values(bubbles).map((b) => {
        if (!b.visible || b.x <= 0 || b.y <= 0) return null;
        return (
          <div
            key={b.actorId}
            style={{
              left: `${b.x}px`,
              top: `${b.y}px`,
              transform: "translate(-50%, -100%)",
            }}
            className="pointer-events-none absolute z-20 max-w-[280px] animate-in fade-in zoom-in-95 duration-200"
          >
            <div
              className="rounded-lg border px-3 py-1.5 shadow-xl backdrop-blur-md text-xs font-sans text-white leading-snug"
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.94)",
                borderColor: b.color,
                boxShadow: `0 4px 20px ${b.color}45`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-90">
                  {b.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-100">{b.text}</p>
            </div>
            {/* Bubble arrow tip */}
            <div
              className="mx-auto h-0 w-0 border-x-4 border-x-transparent border-t-6"
              style={{ borderTopColor: b.color }}
            />
          </div>
        );
      })}

      {/* Canvas Top Bar: Status, Camera Selector & Fullscreen */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border/60 bg-background/85 px-2.5 py-1 text-xs font-mono backdrop-blur-md shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-foreground font-semibold">Markas 3D Live</span>
          <span className="text-muted-foreground text-[10px] hidden sm:inline">
            · Roby (Pimpinan Nonton Video), Buruang, Koncek, Biawak, Bonta, Bala, Kurir Paket
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border/60 bg-background/85 p-1 text-[11px] font-mono backdrop-blur-md shadow-sm">
          <Button
            size="sm"
            variant={cameraView === "all" ? "default" : "ghost"}
            className="h-6 px-2 text-[10px]"
            onClick={() => handleSetCameraView("all")}
          >
            Semua
          </Button>
          <Button
            size="sm"
            variant={cameraView === "roby" ? "default" : "ghost"}
            className="h-6 px-2 text-[10px]"
            onClick={() => handleSetCameraView("roby")}
          >
            Pimpinan
          </Button>
          <Button
            size="sm"
            variant={cameraView === "lounge" ? "default" : "ghost"}
            className="h-6 px-2 text-[10px]"
            onClick={() => handleSetCameraView("lounge")}
          >
            Lounge Santai
          </Button>
          <Button
            size="sm"
            variant={cameraView === "family" ? "default" : "ghost"}
            className="h-6 px-2 text-[10px] text-pink-400 font-semibold"
            onClick={() => handleSetCameraView("family")}
          >
            Putri & Alyona
          </Button>
          <Button
            size="sm"
            variant={cameraView === "projects" ? "default" : "ghost"}
            className="h-6 px-2 text-[10px]"
            onClick={() => handleSetCameraView("projects")}
          >
            Papan Proyek
          </Button>
          <Button
            size="sm"
            variant={cameraView === "devs" ? "default" : "ghost"}
            className="h-6 px-2 text-[10px]"
            onClick={() => handleSetCameraView("devs")}
          >
            Tim Dev
          </Button>
          <Button
            size="sm"
            variant={showChatPanel ? "default" : "outline"}
            className="h-6 px-2 text-[10px] ml-1"
            onClick={() => setShowChatPanel((prev) => !prev)}
            title={showChatPanel ? "Sembunyikan Panel Chat" : "Tampilkan Panel Chat"}
          >
            <ChatCircleIcon className="h-3 w-3 mr-1" />
            <span>{showChatPanel ? "Sembunyikan Chat" : "Tampilkan Chat"}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px] ml-1"
            onClick={handleToggleFullscreen}
            title={
              isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh (Fullscreen)"
            }
          >
            {isFullscreen ? (
              <ArrowsInSimpleIcon className="h-3 w-3" />
            ) : (
              <ArrowsOutSimpleIcon className="h-3 w-3" />
            )}
            <span className="ml-1 hidden sm:inline">
              {isFullscreen ? "Normal" : "Fullscreen"}
            </span>
          </Button>
        </div>
      </div>

      {/* Canvas Bottom Bar: Quick Action Buttons */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-[11px] font-mono bg-background/85 backdrop-blur-md border-border/60 shadow-sm"
            onClick={() => {
              const randomActor =
                ACTORS_DEF[Math.floor(Math.random() * ACTORS_DEF.length)];
              const randomQuip =
                randomActor.quips[
                  Math.floor(Math.random() * randomActor.quips.length)
                ];
              showBubble(randomActor.id, randomQuip, 4500);
            }}
          >
            <SparkleIcon className="mr-1 h-3 w-3 text-primary" />
            Obrolan Tim
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-[11px] font-mono bg-background/85 backdrop-blur-md border-border/60 shadow-sm"
            onClick={() => {
              courierTriggerRef.current?.triggerDelivery("Dokumen Prompt Cepat");
            }}
          >
            📦 Panggil Kurir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-[11px] font-mono bg-background/85 backdrop-blur-md border-border/60 shadow-sm text-pink-500 hover:text-pink-600"
            onClick={() => {
              const putriDef = ACTORS_DEF.find((a) => a.id === "putri");
              if (putriDef) {
                const randomQuip = putriDef.quips[Math.floor(Math.random() * putriDef.quips.length)];
                showBubble("putri", randomQuip, 4500);
              }
            }}
          >
            🌸 Sapa Bunda Putri
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-[11px] font-mono bg-background/85 backdrop-blur-md border-border/60 shadow-sm text-amber-500 hover:text-amber-600"
            onClick={() => {
              const alyonaDef = ACTORS_DEF.find((a) => a.id === "alyona");
              if (alyonaDef) {
                const randomQuip = alyonaDef.quips[Math.floor(Math.random() * alyonaDef.quips.length)];
                showBubble("alyona", randomQuip, 4500);
              }
            }}
          >
            🧸 Ajak Alyona Main
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-[11px] font-mono bg-background/85 backdrop-blur-md border-border/60 shadow-sm hidden sm:inline-flex"
            onClick={() => handleSetCameraView("all")}
          >
            <ArrowClockwiseIcon className="mr-1 h-3 w-3" />
            Reset Kamera
          </Button>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-[11px] font-mono bg-background/85 backdrop-blur-md border-border/60 shadow-sm"
            onClick={() => {
              const next = !autoRotate;
              setAutoRotate(next);
              if (controlsRef.current) controlsRef.current.autoRotate = next;
            }}
          >
            {autoRotate ? (
              <>
                <PauseIcon className="mr-1 h-3 w-3" />
                Jeda Putar
              </>
            ) : (
              <>
                <PlayIcon className="mr-1 h-3 w-3" />
                Putar 3D
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Translucent Live Stream Chat & Tracer Panel Overlay (Inside Canvas) */}
      {showChatPanel && (
        <div className="absolute top-12 right-3 bottom-12 z-30 w-full sm:w-[380px] md:w-[420px] max-w-[calc(100vw-24px)] pointer-events-auto shadow-2xl animate-in slide-in-from-right fade-in duration-200">
          <MarkasChatPanel
            className="h-full"
            isFloating={true}
            transparent={true}
            onCloseFloating={() => setShowChatPanel(false)}
          />
        </div>
      )}

      {/* Floating Reopen Button when Chat Panel is Hidden */}
      {!showChatPanel && (
        <div className="absolute bottom-12 right-3 z-30 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <Button
            size="sm"
            onClick={() => setShowChatPanel(true)}
            className="h-7 px-3 text-[11px] font-mono bg-slate-950/85 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md shadow-xl flex items-center gap-1.5"
          >
            <ChatCircleIcon className="h-3.5 w-3.5 text-primary" />
            <span>Tampilkan Chat Stream</span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          </Button>
        </div>
      )}

      {!webglSupported && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/95 p-6 text-center">
          <div className="max-w-md space-y-2">
            <RobotIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-semibold">WebGL Tidak Tersedia</p>
            <p className="text-xs text-muted-foreground">
              Browser atau perangkat Anda belum mendukung akselerasi WebGL
              untuk visualisasi 3D.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
