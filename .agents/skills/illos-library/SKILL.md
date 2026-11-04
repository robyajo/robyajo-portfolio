---
name: illos-library
description: "ACTIVATE saat membutuhkan gambar ilustrasi SVG animasi resmi dari Illos.dev untuk halaman website atau aplikasi: hero section, kartu fitur, empty state, dokumentasi, onboarding, atau status monitor. Mencari 158 ilustrasi animasi dalam 4 tema (Shader, HUD, Isometric, Interface) lewat MCP atau catalog.json, dan memasangnya via shadcn atau raw SVG. Triggers on: illos, illos.dev, cari ilustrasi, tambah ilustrasi, spot illustration, animated svg, ilustrasi hero, empty state art, ilustrasi fitur, illos library."
allowed-tools:
  - Read
  - Grep
  - Glob
  - WebFetch
  - run_command
---

# Illos Library — Ilustrasi SVG Animasi dari Illos.dev

Illos.dev menyediakan 158 ilustrasi SVG teranimasi yang terbagi ke dalam 4 tema desain teknis tingkat tinggi, masing-masing mendukung mode terang (light) dan gelap (dark). Sebanyak **65 ilustrasi tersedia gratis untuk penggunaan komersial tanpa perlu mencantumkan atribusi/kredit** ([illos.dev/license](https://illos.dev/license)).

Setiap ilustrasi merupakan satu berkas SVG murni yang membawa animasinya sendiri (CSS keyframes), berhenti saat keluar layar, berputar sekali saat masuk viewport, dan berulang saat kursor diarahkan (hover).

---

## 1. Menentukan Bagian yang Memerlukan Ilustrasi

Telusuri halaman atau komponen yang sedang dibangun. Catat dalam beberapa kata apa konsep inti yang ingin divisualisasikan:
- *"antrean tugas / worker queue"*
- *"rate limiting / pembatasan request"*
- *"notifikasi kosong / empty state notifications"*
- *"audit log / riwayat perubahan"*
- *"koneksi basis data / database connection pool"*
- *"pencarian vektor / vector search"*

Frasa makna inilah yang digunakan saat melakukan pencarian di katalog Illos.

---

## 2. Pilih Satu Tema Konsisten untuk Seluruh Situs

Setiap website atau produk digital sebaiknya menggunakan **satu tema yang sama** agar seluruh ilustrasi tampak berasal dari satu keluarga desain terpadu.

| Tema | Karakter Visual | Sangat Cocok Untuk |
|---|---|---|
| **Shader** | *Density field* garis-garis tipis berpola dithered dengan sorotan kotak berwarna *teal* / aksen | Produk AI, LLM, vektor, data, pipeline infrastruktur |
| **HUD** | Garis kawat bercahaya (*glowing wireframe*), grid instrumen, pembacaan telemetri & radar | Sistem monitoring, status layanan, keamanan siber, dashboard analitik |
| **Isometric** | Garis isometrik teknis (sudut 30°) lengkap dengan label dan diagram alir; warna mengikuti kartu | Developer tools, Core API Gateway, arsitektur sistem, dokumentasi SaaS |
| **Interface** | Antarmuka produk datar tampak depan (*flat UI*): kartu, jendela, inbox, switch toggle, tabel | Status onboarding, empty state aplikasi, fitur dashboard internal |

> **Prinsip**: Jika proyek sudah memiliki ilustrasi bertema tertentu (misal: Isometric pada halaman proyek teknis atau HUD pada monitoring server), pertahankan tema tersebut untuk halaman terkait.

---

## 3. Cari Ilustrasi yang Sesuai

### Opsi A: Menggunakan Skrip Pencari Lokal Terpadu
Gunakan skrip pembantu yang sudah tersedia di folder skill ini:
```bash
# Cari berdasarkan kata kunci
node .agents/skills/illos-library/scripts/search-illos.mjs "queue"

# Filter khusus tema Isometric dan gratis (Free)
node .agents/skills/illos-library/scripts/search-illos.mjs "rate limit" --theme isometric --free

# Tampilkan hasil dalam format JSON
node .agents/skills/illos-library/scripts/search-illos.mjs "search" --json
```

### Opsi B: Menggunakan MCP Endpoint Illos (`https://illos.dev/mcp`)
Jika klien agent mendukung MCP HTTP streamable, gunakan tool:
- `find_illustrations({ need: "worker queue processing jobs", theme: "Isometric", free_only: true })`
- `get_illustration({ id: "queue" })`
- `list_themes()`

### Opsi C: Mengambil Langsung dari `catalog.json`
Ambil dan saring berkas katalog resmi:
```bash
curl -s "https://illos.dev/catalog.json"
```
Setiap entri memuat atribut:
- `name`: Nama ilustrasi
- `sentence`: Makna / apa yang digambarkan oleh animasi
- `theme`: Nama tema (`Shader`, `HUD`, `Isometric`, `Interface`)
- `size`: Ukuran peruntukan (`spot` untuk kartu/empty-state, `section` untuk blok fitur, `page` untuk hero lebar)
- `access`: `free` (bebas komersial) atau `pro` (lisensi Illos Pro)
- `page`: URL halaman detail di illos.dev
- `svg`: URL unduh langsung SVG resmi untuk ilustrasi gratis

---

## 4. Cara Memasang Ilustrasi ke Proyek

### A. Di Proyek React / Next.js dengan shadcn CLI (Rekomendasi Utama)
Gunakan perintah resmi shadcn untuk mengunduh komponen React lengkap yang sudah dioptimasi:
```bash
# Format: npx shadcn@latest add https://illos.dev/r/<theme-slug>/<id>.json
npx shadcn@latest add https://illos.dev/r/isometric/queue.json
```
Perintah ini akan membuat komponen React di folder komponen proyek (misal `src/components/illos-queue.tsx`):
- Menggunakan `IntersectionObserver` bawaan untuk efisiensi performa (animasi otomatis `paused` saat di luar layar).
- Menghormati pengaturan aksesibilitas `prefers-reduced-motion`.
- Terintegrasi langsung dengan variabel warna Tailwind CSS / HSL dark mode.

Panggil komponen di halaman yang bersangkutan:
```tsx
import { IllosQueue } from "@/components/illos-queue";

export function JobQueueSection() {
  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-xl">
      <IllosQueue className="w-full max-w-md h-auto" />
      <h3 className="font-semibold text-lg">Antrean Tugas Latar Belakang</h3>
      <p className="text-muted-foreground text-sm text-center">
        Setiap tugas antrean diproses secara berurutan dan aman oleh worker server.
      </p>
    </div>
  );
}
```

### B. Memasang sebagai Berkas SVG Langsung
Untuk aset gambar murni atau rendering non-React:
1. Unduh berkas dari URL `svg` pada katalog:
   ```bash
   curl -s "https://illos.dev/assets/styles/line-iso/queue.svg" -o "public/illustrations/queue.svg"
   ```
2. Pasang langsung menggunakan tag `<img src="/illustrations/queue.svg" alt="Queue" />` atau inline `<svg>`.

---

## 5. Lisensi dan Etika Penggunaan
- **Ilustrasi Gratis (Free - 65 item)**: Bebas digunakan untuk proyek komersial pribadi, instansi, maupun portofolio klien tanpa perlu atribusi. Pertahankan komentar lisensi bawaan di dalam berkas SVG.
- **Ilustrasi Pro (Pro - 93 item)**: Jika ilustrasi yang paling cocok berstatus `pro`, sarankan alternatif gratis yang paling mendekati, atau informasikan bahwa fitur tersebut memerlukan lisensi Illos Pro ([illos.dev/pro](https://illos.dev/pro)). Jangan pernah menjiplak berkas Pro dari preview webp.
