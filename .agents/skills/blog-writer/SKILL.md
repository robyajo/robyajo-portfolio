---
name: blog-writer
description: "ACTIVATE setiap kali pemilik meminta menulis, membuat, menambah, menyusun, mengedit, atau menghapus artikel blog di portfolio ini. Menulis berkas MDX di content/blog/ sesuai skema dan gaya situs, memvalidasi dengan build, lalu (bila diminta) commit, deploy, dan mencatat rilis. Triggers on: tulis blog, buat artikel, blog baru, postingan baru, tulis tentang, draft artikel, edit artikel, hapus artikel."
---

# Blog Writer — artikel otomatis di `content/blog/`

Tujuan: setiap kali pemilik meminta sebuah artikel, hasilnya langsung siap tayang di
`https://ajoroby.is-a.dev/blog/<slug>` — struktur, gaya, dan validasinya sama
seperti artikel yang sudah ada. Bahasa skill ini: Indonesia. Bahasa artikel:
**Inggris secara bawaan** (konsisten dengan 4 artikel yang ada) kecuali pemilik
minta lain.

## 0. Orientasi berkas (baca dulu sebelum menulis)

| Berkas | Untuk apa |
| --- | --- |
| `content/blog/*.mdx` | 4 contoh artikel — tiru bentuk & nadanya |
| `source.config.ts` | Skema frontmatter (zod), plugin waktu baca, tema kode |
| `src/mdx-components.tsx` | Komponen yang tersedia di MDX |
| `src/lib/config.ts` | Identitas situs (nama, peran, kontak, tautan sosial) |
| `src/components/diagrams/blog-covers.tsx` | Cover per slug; slug baru otomatis dapat cover bawaan |
| `src/app/(site)/blog/[[...slug]]/page.tsx` | Cara halaman membaca `date`, `tags`, `lastModified` |

Gaya lengkap: `reference/voice-and-style.md`. Kerangka siap salin:
`templates/post.mdx`.

## 1. Kumpulkan bahan — jangan mengarang

- Pastikan minimal: **topik**, **sudut pandang**, dan **pengalaman pribadi** yang
  boleh dipakai. Bila pemilik hanya menyebut topik, tanyakan 1–3 detail konkret
  (kejadian, angka, keputusan teknis) sebelum menulis draft penuh.
- Klaim eksternal (angka, peristiwa, kutipan, produk) **wajib** punya tautan
  sumber di badan artikel.
- Jangan menulis sebagai orang lain. Pemilik situs ini adalah `siteConfig.name`
  di `src/lib/config.ts`; identitas pada artikel template lama ("Anish Shobith
  P S") **bukan** pemilik situs ini — jangan ditiru atau dipertahankan.
- Bila ada bagian yang tidak diketahui, tanyakan atau tulis lebih umum. Tidak ada
  angka/tanggal hasil karangan.

## 2. Tentukan bahasa

- Bawaan: **Inggris** (mengikuti artikel yang ada; audiens internasional).
- Bila pemilik minta Indonesia: tulis penuh dalam Indonesia, tetap pakai istilah
  teknis aslinya. Beri tahu bahwa artikel lama berbahasa Inggris.

## 3. Buat berkas

`content/blog/<slug>.mdx`

- **Slug**: kebab-case, deskriptif, **tanpa tanggal**, stabil (dipakai sebagai
  URL selamanya). Contoh: `rcb-tickets-are-broken-so-i-built-an-alert-system-at-4am`.
- Frontmatter wajib dan opsional:

```yaml
---
title: Judul Spesifik yang Menarik, Tanpa Clickbait
description: Satu kalimat hook dengan satu detail konkret di dalamnya.
date: 2026-10-17 # YYYY-MM-DD, tanggal publikasi
tags: # 3–6 tag, Kapitalisasi Seperti Ini
  - TypeScript
  - Personal
# lastModified: 2026-10-20 # hanya bila artikel LAMA disunting secara berarti
---
```

- `date` dan `lastModified` ditulis literal di frontmatter (bukan dari git).
  Isi `lastModified` **hanya** saat menyunting artikel lama, lalu halaman otomatis
  menampilkan "Diperbarui <tanggal>".
- Jangan menambah field baru tanpa mengubah `source.config.ts` (butuh izin
  pemilik, karena itu perubahan skema).

## 4. Struktur & komponen

Urutan yang dipakai artikel yang ada:

1. **Pembuka**: 2–4 paragraf hook; sering dibuka dengan
   `<TypographyMark>` berisi fakta/tanggal kunci, atau blockquote disclaimer
   bila topiknya sensitif.
2. **`##` bagian utama** (kalimat biasa, sering memuat angka/klaim spesifik),
   `###` untuk subbagian — jangan lebih dalam dari `###`.
3. **Penutup personal/reflektif** dengan satu kalimat penutup yang menonjol.

Komponen yang tersedia (dari `src/mdx-components.tsx`):

- `<TypographyMark>…</TypographyMark>` — sorotan inline untuk fakta, angka,
  tanggal, dan nama penting. Boleh membungkus tautan:
  `<TypographyMark>[Unicode Consortium](https://home.unicode.org/)</TypographyMark>`.
- `<TypographyMuted as="span">…</TypographyMuted>` — catatan samping kecil
  (mis. penjelasan versi, disclaimer render).
- `<Tabs groupId="os" items={['macOS', 'Linux', 'Windows']} persist>` +
  `<Tab value="macOS">…</Tab>` — varian perintah/kode per platform.
- `<MediaPlayer>` — hanya untuk media milik sendiri; impor dulu di atas berkas:
  `import { MediaPlayer, MediaPlayerControls, … } from "@/components/ui/media-player";`
- Markdown standar: tabel perbandingan, blockquote, ` ```lang ` dengan bahasa
  (`ts`, `bash`, `json`, `tex`, …), tautan inline sebagai sumber.

Aturan gaya ringkas (detail di `reference/voice-and-style.md`):

- Panjang wajar **1.500–3.500 kata**; satu ide per bagian.
- Kalimat pendek–sedang, aktif, tanpa basa-basi.
- **Hindari**: emoji di badan teks, frasa AI klise ("in today's fast-paced
  world", "delve into", "tapestry of"), superlatif kosong, judul clickbait,
  klaim tanpa sumber.
- Tanda baca dan angka konsisten (`4:00am`, `₹3,750`, `1,500`).

## 5. Verifikasi sebelum mengatakan selesai

```bash
pnpm types:check   # fumadocs-mdx + typegen + tsc — menangkap frontmatter salah
pnpm build         # memastikan halaman benar-benar tergenerasi
pnpm dev           # opsional pratinjau: http://localhost:3000/blog/<slug>
```

Ceklist:

- [ ] `pnpm types:check` dan `pnpm build` hijau.
- [ ] Halaman `/blog/<slug>` merender 200 (dev atau produksi).
- [ ] Halaman `/blogs` memuat kartu artikel baru (urut tanggal terbaru).
- [ ] `/sitemap.xml` memuat URL artikel; `/feed.xml` memuat item baru.
- [ ] Gambar OG artikel otomatis benar (dari `getPageImage`), tidak perlu diurus.
- [ ] Waktu baca otomatis muncul (plugin `remarkReadingTime`), tidak diisi manual.

## 6. Publikasi

- **Commit dan push hanya bila pemilik memintanya.** Format pesan repo ini:
  kalimat perintah singkat, mis. `Blog: <judul singkat>`.
- Setelah deploy, verifikasi di produksi:
  `curl -s -o /dev/null -w "%{http_code}" https://ajoroby.is-a.dev/blog/<slug>`
- Artikel baru = halaman yang dilihat pengguna → **wajib catat rilis**:
  aktifkan skill `release-notes` (tambah 1 item ke berkas `releases/YYYY-MM-DD-*.json`,
  dwibahasa `id` + `en`, bahasa publik, **tanpa** istilah internal/nama library),
  lalu sinkronkan ke API lewat skill `activity-sync`.

## 7. Menyunting & menghapus artikel

- **Sunting**: ubah isi, isi `lastModified: YYYY-MM-DD` di frontmatter, ulangi
  verifikasi. Jangan mengganti slug artikel yang sudah tayang (URL-nya sudah
  diindeks mesin pencari).
- **Hapus**: `rm content/blog/<slug>.mdx`. Opsional: hapus entri slug di
  `covers` pada `src/components/diagrams/blog-covers.tsx` (tanpa itu pun aman —
  ada cover bawaan). Penghapusan tetap dicatat di rilis.
- **Ganti artikel template lama** (milik pemilik sebelumnya): tulis ulang atau
  hapus, lalu masa berlaku URL-nya tetap dijaga (jangan buat slug baru untuk
  topik yang sama bila URL lama masih diindeks — sunting yang lama).

## 8. Yang tidak boleh dilakukan

- Tidak menambah dependensi baru (MDX, plugin, library) tanpa izin pemilik.
- Tidak mengubah `source.config.ts`, `mdx-components.tsx`, atau `blog-covers.tsx`
  struktur besar tanpa izin.
- Tidak commit rahasia/kunci, dan tidak commit tanpa diminta.
- Tidak menyalin utuh tulisan orang lain; ringkas + tautkan sumbernya.
