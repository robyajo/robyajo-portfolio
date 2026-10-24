<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Design system

Sebelum mengubah UI, baca `DESIGN.md` (token, tipografi, aturan komponen). Sumber
kebenaran visual adalah `src/app/global.css`; jika token berubah di sana, perbarui
`DESIGN.md` juga dan validasi dengan `npx @google/design.md lint DESIGN.md`
(0 error). Jangan menambah warna/gradient/shadow di luar token, dan jangan menimpa
tipografi, spacing, atau warna komponen design-system lewat `className`.

## Neon setup

Set up this app on Neon.

1. `npm i -g neon@latest`. If that fails, use `npx neon@latest` in place of `neon`.
   If a neon command opens a browser sign-in, tell the user to finish it there. If that times out or fails, ask the user to run `neon login`, then retry.
2. In the project root:
   `neon init -y --org-id org-dawn-leaf-80546672 --project-id falling-river-69990935 --branch production --services postgres`
3. `neon deploy`. It provisions the services in neon.ts and pulls their env vars into `.env.local` (or `.env` if it exists).
4. Wire each service into the app's code using those env vars. Consult the installed Neon agent skills for best practices, e.g., what database driver to use given the app architecture and hosting runtime.
5. Prove it works: `npm run build` must pass, then start the app, each wired service must be tested to prove it works end to end.
6. Report what changed, the command output that proves step 5, and anything that failed.

⚡ Protokol Catatan Rilis: 1 Berkas JSON Per Hari

Setiap penambahan fitur atau perbaikan bug yang **dirasakan pengguna** harus dicatat di direktori `releases/` dengan aturan:

### Aturan Konsolidasi Harian (1 JSON Per Hari)

1. **Periksa Tanggal Hari Ini**: Cek apakah berkas `releases/YYYY-MM-DD-*.json` sudah ada.
2. **Jika SUDAH ADA**:
    - **JANGAN** membuat berkas baru!
    - Buka berkas tersebut dan tambahkan poin baru ke dalam array `items: [...]`.
    - Perbarui ringkasan `title` dan `body` harian secara terpadu.
    - Naikkan `type` jika terdapat kategori yang lebih tinggi (`important` > `feature` > `fix` > `improvement`).
3. **Jika BELUM ADA**:
4. **Format Dwibahasa (`id` & `en`)**:
    - Wajib menyertakan `id` (Bahasa Indonesia) dan `en` (Bahasa Inggris) untuk `title`, `body`, dan tiap elemen dalam `items`.
5. **Wajib Bahasa Publik & Bebas Istilah Teknis Internal (Security-Safe & Citizen-Facing)**:
    - **DILARANG KERAS** menuliskan istilah teknis arsitektur inti, nama library/package pihak ketiga, nama framework, database, middleware, nama file kode sumber, atau mekanisme internal (seperti _Prisma, Arcjet, Security Guard, Tiptap, CSRF, CSP, Next.js, React, Turbopack, Zod, TanStack, rate limiter, deepmerge, dsb._) di dalam berkas rilis.
    - **Tujuan Keamanan**: Mencegah pihak luar menganalisis atau menebak struktur komponen internal dan potensi celah keamanan sistem dari catatan rilis publik.
    - **Orientasi Pelayanan Warga**: Seluruh `title`, `body`, dan butir `items` wajib dirumuskan sebagai **pemberitahuan pelayanan publik** yang ramah, sopan, dan berfokus pada dampak langsung bagi masyarakat (misalnya: kemudahan pengurusan berkas, kecepatan buka halaman, penghematan kuota ponsel, dan perlindungan kerahasiaan data warga).

---

## Blog (content/blog)

Setiap permintaan menulis, mengedit, atau menghapus artikel blog wajib memakai skill
`.agents/skills/blog-writer/SKILL.md` (gaya & suara di
`.agents/skills/blog-writer/reference/voice-and-style.md`, kerangka di
`templates/post.mdx`). Ringkas: berkas MDX baru di `content/blog/<slug>.mdx`
(slug kebab-case tanpa tanggal), frontmatter wajib `title`/`description`/`date`
(+`tags`, `lastModified` bila menyunting artikel lama), komponen MDX terbatas pada
`src/mdx-components.tsx` (`TypographyMark`, `TypographyMuted`, `Tabs`/`Tab`,
`MediaPlayer` via impor), validasi `pnpm types:check` + `pnpm build`, lalu verifikasi
`/blog/<slug>`, `/blogs`, `sitemap.xml`, dan `feed.xml`. Artikel yang ada saat ini
berasal dari pemilik template lama — jangan meniru identitasnya.

Artikel blog baru adalah halaman yang dilihat pengguna, jadi tetap wajib dicatat
di `releases/` sesuai protokol di atas dan disinkronkan lewat skill `activity-sync`.

## Blog otomatis (harian, dwibahasa)

Satu artikel/hari ditulis otomatis oleh `.github/workflows/blog-autopilot.yml`
(cron 02:00 UTC / 09:00 WIB, plus tombol manual). Skripnya
`scripts/blog-autopilot.ts`, data topik di `scripts/blog-pipeline/`, rahasia
`GEMINI_API_KEY` (+ `ACTIVITY_PROJECT_KEYS` bila ingin sinkron otomatis).
Aturan lengkap, perintah uji, dan cara menambah pilar ada di skill
`.agents/skills/blog-autopilot/SKILL.md`. Versi Inggris (`<slug>-en.mdx`)
disembunyikan dari daftar/RSS tetapi tetap ada di sitemap dengan `hreflang`.

---

## Activity Sync — lapor kegiatan ke portfolio

Setiap selesai mengerjakan perubahan yang **dirasakan pengguna** (fitur baru,
perbaikan bug, perubahan perilaku, rilis, deploy, hapus fitur), AI WAJIB
mencatat di berkas rilis lalu mengirim satu entri kegiatan ke portfolio
sebelum menyelesaikan tugas. Refactor internal, format, komentar, dan tes yang
tak terlihat pengguna: jangan kirim.

1. Tulis/perbarui berkas rilis `releases/YYYY-MM-DD-*.json` memakai skill
   `release-notes`: konsolidasi 1 berkas JSON per hari, dwibahasa (id + en),
   bahasa pelayanan publik — bebas istilah teknis/library/framework.
2. Muat skill `activity-sync` (`.agents/skills/activity-sync/SKILL.md`) dan
   ikuti alur CRUD di sana: cek proyek (`GET /api/projects?key=`), kirim
   isi berkas rilis `releases/*.json` apa adanya lewat `POST` (tambah
   `"project": {"name": "Roby Portfolio Project"}`; API yang memetakan
   `type`/`date`/`items` otomatis), ubah (`PATCH`), hapus (`DELETE`), lalu
   verifikasi (`GET` + cek tidak dobel).
3. Kunci `X-project` proyek ini: baca dari berkas `.ACTIVITY_PROJECT_KEYS`
   di folder `.agents/skills/activity-sync/` — JANGAN commit berkas kunci ke
   git, JANGAN tampilkan ke user kecuali diminta.
4. Setiap kiriman wajib dwibahasa (`id` + `en`), maksimal 300 karakter judul /
   10.000 karakter isi gabungan `body` + seluruh `items[]` per bahasa, dengan bahasa
   pelayanan publik (dilarang menyebut library, framework, database, file kode,
   atau mekanisme internal). Semua rincian harus dikirim; API menolak total yang
   melebihi batas, bukan memotong isinya diam-diam.
5. Untuk rilis lama yang belum terkirim: ikuti `DOCS/sync/activity-sync/backfill.md`.
6. Laporkan ke user: apa yang dikirim (id baris), hasil verifikasi, dan apa
   pun yang gagal.

Aturan tambahan untuk AI:

- Kunci di `.ACTIVITY_PROJECT_KEYS` adalah sumber kebenaran. Bila respons API
  `401` (tanpa header) atau `403` (kunci salah), berhenti dan minta kunci baru
  ke pemilik — jangan menebak.
- `source` otomatis dari `date` + slug judul berkas rilis; bila mengirim
  bentuk kanonik, `source` HARUS stabil per rilis agar revisi menimpa baris
  yang sama.
- Bila judul rilis berubah, entri lama dengan `source` sama harus dihapus
  lalu dibuat ulang agar tidak duplikat.
