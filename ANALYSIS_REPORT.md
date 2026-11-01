# Laporan Analisa Arsitektur: robyajo-portfolio

**Tanggal:** 2026-10-30  
**Analisis berdasarkan:** Metadata proyek, struktur direktori, kode sumber, dan dokumentasi.

---

## 1. Evaluasi Arsitektur & Pola Desain

### 1.1 Modularitas & Pemisahan Layer

Proyek ini mengikuti **arkitektur Modern Next.js 16 (App Router)** dengan pemisahan yang jelas antara:

- **`src/app/`**: Rute, layout, server components. Berisi `layout.tsx`, `global.css`, `page.tsx`, dan rute terstruktur (`/`, `/projects`, `/blogs`, `/admin/*`).
- **`src/components/`**: Komponen-komponen UI yang reusable. Terorganisir ke:
  - `ui/` — Primitif shadcn/ui (button, input, dialog, dll) yang sudah divariantkan dengan `class-variance-authority` (cva).
  - `shared/` — Komponen non-UI seperti bouncing-logo, cookie-consent, floating-hub, dsb.
  - `layouts/` — Layout khusus halaman (blog-nav, blog, hero-art, page).
  - `diagrams/` — Komponen art isometrik kustom menggunakan takumi-js.
  - `engagement/` — Fitur interaksi (avatar, composer, nudge, panel).
- **`src/lib/`**: Fungsi utilitas dan logika bisnis:
  - `db.ts`, `schema.ts` — Konfigurasi Drizzle ORM (19 tabel).
  - `i18n/` — Provider & server locale.
  - `config.siteConfig` — Konfigurasi situs (nav, social, dsb.).
  - `theme-tokens.ts` — Eksstraksi warna dari global.css menggunakan culori.
  - `safe-query.ts` — Fallback query ketika DATABASE_URL tidak tersedia.
  - `ip.ts` — Hash IP untuk anti-spam.
- **`src/lib/i18n/`**: Sistem i18n untuk bahasa Indonesia/Inggris.
- **`src/types/`**: TypeScript types minimal (satu file untuk view transition).

**Kekuatan:**
- Struktur folder bersih dan konsisten sesuai konvensi Next.js App Router.
- Pemisahan concerns: UI komponen di `components/ui/`, logika di `lib/`, konten di `content/blog/`.
- Semua komponen UI menggunakan shadcn/ui conventions dengan `cva` untuk varian.
- Path alias `@/*` di `tsconfig.json` untuk impor yang bersih (`@/lib`, `@/components`, dsb.).

**Area untuk ditingkatkan:**
- Layer `lib/` cukup besar (54 file), bisa dibagi lebih lanjut ke sub-package seperti `lib/db`, `lib/auth`, `lib/blog`, `lib/iso` untuk mempertahankan skala yang lebih besar.
- `src/components/shared/` berisi 28 file campuran UI dan logika, bisa dikategorisasi lebih jelas.

### 1.2 Kerapian Struktur Folder

- **`src/app/`**: 18 entry — terstruktur dengan `(site)` dan `admin` direktori tersemat.
- **`src/components/`**: 6 kategori utama dengan jumlah file yang terdistribusi.
- **`content/blog/`**: 10 postingan MDX dengan frontmatter standar.
- **`src/lib/`**: 54 file utilitas — ini adalah bagian terbesar dan cukuppad.

**Pola Desain yang Terapati:**
1. **Design Tokens First**: Semua warna, typografi, radius berasal dari `global.css` → `theme-tokens.ts` → `DESIGN.md`. Tidak ada hardcode warna di komponen (dilarang `shadcn/no-raw-colors`).
2. **Single Accent Color**: Hanya satu warna accent (oklch(0.967 0.001 286.375) / hijau muda) digunakan untuk links, focus, live signals.
3. **Editorial Layout**: Konten dipusatkan dengan measure 65-75 karakter, gutter responsive (24px→32px→40px).
4. **Elevation via Borders**: Shadow hanya untuk floating layers (popover, dropdown), basis menggunakan border + bg-card.
5. **Typography Hierarki**: Bricolage Grotesque (display), Manrope (body), Geist Mono (caption/pixel).

### 1.3 Teknologi & Ekosistem

| kategori | teknologi | catatan |
|---|---|---|
| Framework | Next.js 16, React 19, TypeScript | App Router, Server Components dominate |
| Styling | Tailwind CSS v4, culori | Global CSS berat fungsional, theme tokens otomatis |
| ORM | Drizzle ORM ^0.45.3, Neon Postgres | 19 tabel, lazy init db |
| Blog | fumadocs-mdx 15.1.0 | MDX pipeline otomatis via postinstall |
| UI | shadcn/ui ^4.21.0, radix-ui ^1.6.7 | 39 primitif di `components/ui/`, konvensi `new-york`/`zinc` |
| State | @tanstack/react-query ^5.104.0, nuqs ^2.10.1 | Client state + URL sync |
| Animasi | motion ^12.43.0, tw-animate-css | AnimatRingan, respect prefers-reduced-motion |
| Ikon | @phosphor-icons/react ^2.1.10 | Satu library ikon |

---

## 2. Potensi Risiko & Area Optimasi

### 2.1 Performansi

| Risiko | Dampak | Peluang |
|---|---|---|
| **Tailwind CSS v4 besar** | File `global.css` memiliki ribuan @utility dan @keyframes (animate iso, marquee, neon, dsb.). Meskipun CSS v4 otomatis membuang unused, namun jumlah animasi deklarasi bisa memperbesar payload awal. | ✅ Cek `purge` konfigurasi; pertimbangkan membagi animasi ke file terpisah yang hanya dimuat saat perlu. |
| **View transitions banyak** | `global.css` memiliki view-transition-group untuk element tertentu. Di halaman dengan banyak navigasi, bisa menyebabkan reflow/repaint tambahan. | ✅ Validasi apakah view-transition name tetap dibutuhkan per halaman. |
| **ISO art rendering** | Komponen `iso-art` dan `IsoArt` memiliki banyak `--anatomy-*` CSS variables dan fill rules. Render SVG kompleks bisa membebani re-render. | ✅ Cek apakah `prefers-reduced-motion` menghentikan animasi ISO secara efektif. |
| **171 vitest test** | Build waktu tambah selama pengembangan. | ✅ Gunakan `test:watch` hanya saat debugging; CI cukupkan `pnpm test`. |

### 2.2 Keamanan

| Risiko | Dampak | Peluang |
|---|---|---|
| **NextAuth v4 sudah lama** | NextAuth sudah tidak mendapatkan update besar, migrating ke Auth.js (v5) akan hadir dengan API yang lebih modern dan security fixes. | � Pertimbangkan migrasi ke Auth.js v5 saat proyek evolution, tapi v4 masih stabil untuk skenario ini. |
| **SQL Injection melalui Drizzle** | Drizzle ORM menggunakan query parameterized secara default, namun pastikan semua input user melalui `safe-query.ts` fallback. | � Sudah ada `safe-query` dengan fallback kosong — praktik yang baik. |
| **IP Hash deterministik** | `ipHash` menggunakan salt (`IP_HASH_SALT`) untuk anonimisasi, tapi jika salt bocor, privacy terkompromi. | � Validasi `IP_HASH_SALT` selalu diisi di `.env.local` produksi. |
| **Content sanitization** | Blog comments/guestbook menyimpan input user tanpa sanitasi HTML eksplisit (dibercakan oleh React DOM). | � Pastikan `dangerouslySetInnerHTML` tidak digunakan di area user-generated. |

### 2.3 Dependensi

| Risiko | Catatan |
|---|---|
| **Dependency mati/lebih tua** | Beberapa paket masih versi awal dalam ekosistem Next.js 16: `next-auth` ^4.24.15 (versi lama), `drizzle-kit` ^0.31.11. Perlu monitoring security advisories. |
| **Paket unik** | `takumi-js` ^2.14.0 digunakan untuk OG images — library ini kurang dikenal, perlu supervisi maintainer. |
| **Tailwind CSS v4 baru** | Versi sangat baru (rilis 2026), bisa masih memiliki bug kompatibilitas dengan plugin shadcn/ui lama. | � Monitor `@tailwindcss/postcss` changelog. |
| **Fumadocs-mdx 15.x** | Versi baru, pastikan kompatibilitas dengan terbaru Next.js 16 dan TypeScript 6.x. |

### 2.4 Skalabilitas

- **DB schema**: 19 tabel cukup modular (`users`, `projects`, `blog_posts`, `blog_comments`, dsb.), namun ada beberapa tabel yang berkaitan ketat seperti `blog_reactions`/`blog_reads` yang menggunakan `ipHash` — skala menjadi masalah jika traffic besar tanpa caching.
- **Fitur modular**: Setiap fitur (blog, guestbook, projects, admin) terisolasi dengan API route-nya sendiri.
- **Environment config**: 15+ env vars opsional — dokumentasi bagus tapi perlu validasi di CI bahwa wajib wajib terpenuhi sebelum build.

---

## 3. Rekomendasi Standar Koding Khusus untuk AI Agent

Berikut 5 pedoman spesifik agar AI coding konsisten dengan proyek ini:

### 3.1 Warna & Gaya Hanya dari Token

**Pedoman:** Selalu gunakan warna dan gaya yang sudah didefinisikan di `DESIGN.md` dan diekstrak ke `theme-tokens.ts`. Jangan pernah menulis hex/rgb langsung di komponen Tailwind class.

**Contoh Sanku:**
- ✅ `className="bg-card text-card-foreground"` (gunakan token `bg-card`, `text-card-foreground`)
- ✅ `className="text-primary"` (gunakan token `text-primary`)
- ❌ `className="bg-[#111827]"` atau `className="text-green-500"`

**Basis:** Aturan `shadcn/no-raw-colors` di `eslint.config.mjs` + `DESIGN.md` halaman 175: "no raw hex/rgb values in components".

### 3.2 Variasi Komponen baru lewat `cva` saja

**Pedoman:** Saat membuat komponen varian baru (seperti button, badge, input), gunakan `class-variance-authority` (cva) pattern yang sudah ada di `ui/button.tsx`, `ui/badge.tsx`. Jangan menambahkan varian lewat `className` manual.

**Contoh:**
```tsx
// ✅ Benar — ikuti pattern yang sudah ada
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        muted: "bg-muted text-muted-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-lg",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### 3.3 Typography dengan Primitif `Typography*`

**Pedoman:** Selalu gunakan komponen `TypographyH1`, `TypographyP`, `TypographyMuted`, dsb. dari `src/components/ui/typography.tsx` untuk konten teks. Jangan menggunakan raw `h1`, `h2`, `p` di halaman depan tanpa keperluan khusus.

**Basis:** `DESIGN.md` halaman 188-190: "Use the `Typography*` primitives instead of raw `h1`/`p` tags. Uppercase is limited to short labels with wide tracking."

### 3.4 Responsivitas Gutter melalui CSS Variable

**Pedoman:** Gunakan CSS variable `--gutter` untuk spacing horizontal antar elemen, bukan nilai `px` atau `rem` hardcode. Lihat konfig di `src/app/global.css` baris 70: `--gutter: 1.5rem;` dan media query baris 175-185 yang mengubah nilai pada breakpoint.

**Contoh:**
- ✅ `className="gap-4"` (ini akan mapping ke `--gutter` melalui konfig Tailwind/custom)
- ✅ Gunakan `px-gutter` utility yang tersedia di proyek
- ❌ `className="gap-16"` atau `my-8` tanpa alasan desain khusus

**Basis:** `DESIGN.md` halaman 196: "Page gutter is responsive via `--gutter`: 24px → 32px (≥40rem) → 40px (≥64rem). Use `px-gutter`, never ad-hoc horizontal padding."

### 3.5 Animasi yang Hormati `prefers-reduced-motion`

**Pedoman:** Semua animasi harus hormati `prefers-reduced-motion: reduce` dengan menghentikan animasi non-essensial. Lihat pattern di `global.css` baris 460-474 dan `logo.tsx` untuk implementasi.

**Contoh:**
```tsx
// ✅ Benar — sudah ada di global.css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

// ✅ Di component individual
<div className="transition-colors duration-200" style={{ animation: 'none' }} />
```

**Basis:** `DESIGN.md` halaman 262-263: "Don't animate layout properties; animate `transform` and `opacity`, respect `prefers-reduced-motion`, and keep transitions under ~250ms with `ease-snappy`."

---

## Ringkasan Umum

Proyek **robyajo-portfolio** menunjukkan struktur arsitektur yang matang dan ter-organisasi dengan:

1. **Desain sistem yang konsisten** dari token warna/typografi hingga varian komponen.
2. **Pemisahan lapisan** yang jelas antara UI, logika bisnis, dan konten.
3. **Praktik pengembangan yang baik** dengan TypeScript rigor, linting otomatis, dan dokumentasi yang komprehensif.
4. **Fokus editorial** dengan visual monokromatik satu accent warna yang membedakan dari portfolio typis.

Area utama perbaikan: monitoring keterlambatan dependensi (next-auth lama, takumi-js kurang dikenal), dan memastikan praktik performansi saat menambah animasi/utility CSS baru. Pedoman AI agent di atas akan memastikan konsistensi kode dengan eksisting codebase saat pengembangan lebih lanjut.