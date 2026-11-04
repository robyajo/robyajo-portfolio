import type { ComponentType, CSSProperties } from "react";
import { IllosAnalytics } from "./analytics";
import { IllosApiGateway } from "./api-gateway";
import { IllosBilling } from "./billing";
import { IllosCiPipeline } from "./ci-pipeline";
import { IllosContainers } from "./containers";
import { IllosCron } from "./cron";
import { IllosDatabase } from "./database";
import { IllosEmail } from "./email";
import { IllosEncryption } from "./encryption";
import { IllosFirewall } from "./firewall";
import { IllosImageProcessing } from "./image-processing";
import { IllosMigration } from "./migration";
import { IllosNotifications } from "./notifications";
import { IllosQueue } from "./queue";
import { IllosTwoFactor } from "./two-factor";
import { IllosUploads } from "./uploads";
import { IllosVersionControl } from "./version-control";

export {
  IllosAnalytics,
  IllosApiGateway,
  IllosBilling,
  IllosCiPipeline,
  IllosContainers,
  IllosCron,
  IllosDatabase,
  IllosEmail,
  IllosEncryption,
  IllosFirewall,
  IllosImageProcessing,
  IllosMigration,
  IllosNotifications,
  IllosQueue,
  IllosTwoFactor,
  IllosUploads,
  IllosVersionControl,
};

export interface IsometricIllustrationMeta {
  id: string;
  name: string;
  titleId: string;
  category: "infrastructure" | "security" | "devops" | "data" | "application";
  sentence: string;
  descriptionId: string;
  svgUrl: string;
  Component: ComponentType<{ className?: string; style?: CSSProperties }>;
}

export const FREE_ISOMETRIC_ILLUSTRATIONS: IsometricIllustrationMeta[] = [
  {
    id: "api-gateway",
    name: "API Gateway",
    titleId: "Pintu Gerbang Layanan API",
    category: "infrastructure",
    sentence: "Each request is checked at the gateway and turned toward the service it belongs to.",
    descriptionId: "Pemeriksaan dan routing setiap request menuju microservices atau sistem OPD yang tepat.",
    svgUrl: "/illustrations/isometric/api-gateway.svg",
    Component: IllosApiGateway,
  },
  {
    id: "firewall",
    name: "Firewall & WAF",
    titleId: "Dinding Pengaman & WAF",
    category: "security",
    sentence: "The rule plate lets port 443 through the gate and drops port 23 into the box below.",
    descriptionId: "Penyaringan lalu lintas berbahaya dan pengamanan akses protokol sesuai standar Zero-Trust.",
    svgUrl: "/illustrations/isometric/firewall.svg",
    Component: IllosFirewall,
  },
  {
    id: "database",
    name: "Database Engine",
    titleId: "Mesin Basis Data Relasional",
    category: "data",
    sentence: "A query goes in, the read head climbs to the right tier, and the rows come back out.",
    descriptionId: "Pemrosesan query terindeks, pembacaan tingkat tinggi, dan persistensi data transaksi kota.",
    svgUrl: "/illustrations/isometric/database.svg",
    Component: IllosDatabase,
  },
  {
    id: "ci-pipeline",
    name: "CI/CD Pipeline",
    titleId: "Integrasi & Penerapan Otomatis",
    category: "devops",
    sentence: "A commit rides through build, test and ship, and each check lights as it passes.",
    descriptionId: "Alur build, lint, pengujian otomatis, hingga deployment tanpa henti (zero-downtime).",
    svgUrl: "/illustrations/isometric/ci-pipeline.svg",
    Component: IllosCiPipeline,
  },
  {
    id: "containers",
    name: "Containerization",
    titleId: "Isolasi Layanan & Kontainer",
    category: "infrastructure",
    sentence: "The crane lowers a new container into the host, and its light comes on as it runs.",
    descriptionId: "Manajemen siklus hidup kontainer Docker untuk menjamin isolasi dan skalabilitas aplikasi.",
    svgUrl: "/illustrations/isometric/containers.svg",
    Component: IllosContainers,
  },
  {
    id: "encryption",
    name: "Encryption",
    titleId: "Enkripsi Kriptografi Kunci",
    category: "security",
    sentence: "A readable card goes in and comes out sealed, and only the key opens it again.",
    descriptionId: "Pengamanan payload sensitif, hashing IP satu arah, dan enkripsi data istirahat (at-rest).",
    svgUrl: "/illustrations/isometric/encryption.svg",
    Component: IllosEncryption,
  },
  {
    id: "queue",
    name: "Job Queue",
    titleId: "Antrean Tugas & Worker",
    category: "infrastructure",
    sentence: "Jobs wait their turn, and the worker takes the next one.",
    descriptionId: "Pengelolaan antrean pesan asinkron agar beban trafik puncak tidak membebani server utama.",
    svgUrl: "/illustrations/isometric/queue.svg",
    Component: IllosQueue,
  },
  {
    id: "two-factor",
    name: "Two-Factor Auth",
    titleId: "Autentikasi Dua Faktor (2FA)",
    category: "security",
    sentence: "A fresh code shows on the token, and the lock opens only once it is keyed in.",
    descriptionId: "Lapisan proteksi ganda verifikasi identitas pengelola sistem dengan token waktu OTP.",
    svgUrl: "/illustrations/isometric/two-factor.svg",
    Component: IllosTwoFactor,
  },
  {
    id: "cron",
    name: "Cron Scheduler",
    titleId: "Penjadwal Otomatis (Cron)",
    category: "devops",
    sentence: "The clock reaches each mark and stamps a job onto the belt, right on schedule.",
    descriptionId: "Eksekusi berkala untuk agregasi statistik, autopilot artikel, dan pemeliharaan basis data.",
    svgUrl: "/illustrations/isometric/cron.svg",
    Component: IllosCron,
  },
  {
    id: "migration",
    name: "Schema Migration",
    titleId: "Migrasi Skema Basis Data",
    category: "data",
    sentence: "Rows move from the old table into the new one and pick up the new column on the way.",
    descriptionId: "Evolusi skema database Drizzle ORM tanpa kehilangan data historis pengguna.",
    svgUrl: "/illustrations/isometric/migration.svg",
    Component: IllosMigration,
  },
  {
    id: "version-control",
    name: "Version Control",
    titleId: "Kendali Versi Git",
    category: "devops",
    sentence: "A branch leaves main, picks up a commit and merges back in.",
    descriptionId: "Percabangan fitur, rebase, audit riwayat perubahan kode, dan rilis stabil.",
    svgUrl: "/illustrations/isometric/version-control.svg",
    Component: IllosVersionControl,
  },
  {
    id: "notifications",
    name: "Notification Push",
    titleId: "Distribusi Notifikasi Warga",
    category: "application",
    sentence: "The bell rings and a card lands on top of the stack on the phone.",
    descriptionId: "Pengiriman sinyal notifikasi darurat 112, pembaruan tiket, dan pesan peringatan dini.",
    svgUrl: "/illustrations/isometric/notifications.svg",
    Component: IllosNotifications,
  },
  {
    id: "analytics",
    name: "Funnel Analytics",
    titleId: "Analitik Kinerja & Funnel",
    category: "data",
    sentence: "Events drop through the funnel, and the chart rises bar by bar.",
    descriptionId: "Pelacakan metrik pelayanan warga, konversi aduan, dan pemantauan latensi endpoint.",
    svgUrl: "/illustrations/isometric/analytics.svg",
    Component: IllosAnalytics,
  },
  {
    id: "uploads",
    name: "Chunked Uploads",
    titleId: "Pengunggahan Berkas Terfragmentasi",
    category: "application",
    sentence: "A file splits into chunks that drop down the chute and come back together in storage.",
    descriptionId: "Pengunggahan dokumen berkas berukuran besar secara modular dengan verifikasi checksum.",
    svgUrl: "/illustrations/isometric/uploads.svg",
    Component: IllosUploads,
  },
  {
    id: "email",
    name: "Email Dispatch",
    titleId: "Pengiriman Surat Elektronik",
    category: "application",
    sentence: "Letters land in their pigeonholes, and one comes back as a bounce.",
    descriptionId: "Integrasi pengiriman bukti transaksi, tanda terima, dan laporan otomatis terverifikasi SPF/DKIM.",
    svgUrl: "/illustrations/isometric/email.svg",
    Component: IllosEmail,
  },
  {
    id: "image-processing",
    name: "Image Processing",
    titleId: "Optimasi Gambar Responsif",
    category: "application",
    sentence: "A photo goes into the press and comes out in three sizes.",
    descriptionId: "Kompresi dinamis, pembuatan format modern WebP/AVIF, dan pembuatan ragam ukuran thumbnail.",
    svgUrl: "/illustrations/isometric/image-processing.svg",
    Component: IllosImageProcessing,
  },
  {
    id: "billing",
    name: "Usage & Invoicing",
    titleId: "Pengukuran Penggunaan & Faktur",
    category: "application",
    sentence: "Usage stacks up in the meter, and at the end of the month it prints the invoice.",
    descriptionId: "Kalkulasi tarif pajak daerah, meteran pemakaian kuota API, dan pencetakan bukti bayar.",
    svgUrl: "/illustrations/isometric/billing.svg",
    Component: IllosBilling,
  },
];
