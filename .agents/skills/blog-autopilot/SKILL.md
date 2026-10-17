---
name: blog-autopilot-pipeline
description: Pakai saat merawat, menyesuaikan, men-debug, atau memperluas penulis artikel blog otomatis (GitHub Actions harian, dwibahasa) di proyek ini. Triggers on: blog autopilot, penulis otomatis blog, cron blog, artikel harian, workflow blog-autopilot, gemini blog, topik fesyen otomatis, gagal tulis artikel.
---

# Skill: Pipeline Blog Autopilot

Penulis artikel blog otomatis: satu artikel per hari, dwibahasa (Indonesia
utama + Inggris), bertema fesyen & teknologi, terbit lewat commit ke `master`.

## Peta berkas

| Berkas | Fungsi |
| --- | --- |
| `scripts/blog-autopilot.ts` | Seluruh logika: pilih topik, panggil model, validasi, tulis berkas |
| `scripts/blog-pipeline/pillars.json` | Pilar topik + daftar kata kunci tren (`trending.lexicon`) |
| `scripts/blog-pipeline/facts.md` | Satu-satunya sumber fakta pribadi yang boleh dipakai |
| `scripts/blog-pipeline/published.json` | Registri slug/judul/topik terpakai + tanggal terakhir terbit |
| `.github/workflows/blog-autopilot.yml` | Cron harian 02:00 UTC (09:00 WIB) + tombol manual |
| `.agents/skills/blog-writer/` | Gaya & suara yang dipakai sebagai system prompt |
| `content/blog/<slug>.mdx` | Artikel Indonesia (`lang: id`) |
| `content/blog/<slug>-en.mdx` | Artikel Inggris (`lang: en`) |

## Perintah

```bash
# uji coba tanpa menulis berkas (hasil lengkap di /tmp/blog-autopilot-dryrun.json)
pnpm tsx --env-file=.env.local scripts/blog-autopilot.ts --dry-run

# paksa topik tertentu
pnpm tsx --env-file=.env.local scripts/blog-autopilot.ts --topic "tren sepatu lokal" --dry-run

# tulis sungguhan (berkas + catatan rilis + registri)
pnpm tsx --env-file=.env.local scripts/blog-autopilot.ts

# uji ulang parser terhadap balasan mentah yang tersimpan
pnpm tsx scripts/blog-autopilot.ts --parse-file /tmp/blog-autopilot-raw.txt

# sinkronkan catatan rilis hari ini ke API kegiatan
pnpm tsx scripts/blog-autopilot.ts --sync
```

Flag lain: `--date YYYY-MM-DD`, `--force` (abaikan penjaga "sudah terbit hari
ini"), `--no-release`, `--no-link-check`.

## Rahasia (GitHub > Settings > Secrets and variables > Actions)

| Nama | Wajib | Guna |
| --- | --- | --- |
| `GEMINI_API_KEY` | ya | Kunci Google AI Studio (endpoint kompatibel OpenAI) |
| `ACTIVITY_PROJECT_KEYS` | tidak | Sinkronisasi catatan rilis ke API kegiatan |
| `DATABASE_URL` | tidak | Mengaktifkan verifikasi `pnpm build` penuh di runner |

## Alur kerja (jangan diubah tanpa alasan)

1. Ambil tren Google Trends Indonesia, cocokkan dengan `trending.lexicon`.
   Tidak ada yang cocok → pakai rotasi pilar (indeks = jumlah topik terpakai).
2. Panggil model (daftar cadangan di `LLM_MODELS`, lalu `DEFAULT_MODELS`).
   Balasan **wajib dipaksa** lewat `repairJson()` karena model sering mengirim
   kutip ganda di dalam teks (`as="span"`) atau baris baru mentah.
3. Validasi ketat (`collectProblems`): panjang, jumlah kata, tautan, emoji,
   frasa klise, identitas lama, dan tautan mati (404/410). Gagal → satu kali
   tulis ulang otomatis dengan catatan perbaikan, lalu job merah.
4. Tulis kedua berkas MDX + perbarui `published.json` + catatan rilis harian
   (`releases/<tanggal-WIB>-*.json`, konsolidasi 1 berkas/hari).
5. Workflow menjalankan `pnpm types:check` (wajib) dan `pnpm build` (opsional)
   **sebelum** commit. Jangan pindahkan commit sebelum verifikasi.
6. Setelah push, `--sync` mengirim berkas rilis ke API kegiatan.

## Aturan yang mudah terlanggar

- Tanggal **selalu** memakai zona Asia/Jakarta (`todayISO()`), bukan UTC:
  cron pukul 02:00 UTC masih tanggal yang sama di WIB, tetapi 00:00-07:00 WIB
  terbaca kemarin bila memakai UTC.
- Versi `-en` **disembunyikan** dari daftar `/blogs`, umpan RSS, dan
  `blog-teaser`; tetap muncul di `sitemap.xml` (dengan `hreflang`).
- Komponen MDX yang boleh dipakai model hanya `<TypographyMark>` dan
  `<TypographyMuted as='span'>`. Menambah komponen berarti memperbarui aturan
  prompt **dan** regex di `collectProblems`.
- Jangan menaruh berkas non-artikel di `content/blog/` — fumadocs menyapu
  seluruh direktori itu. Data pipeline ada di `scripts/blog-pipeline/`.
- Artikel otomatis tetap wajib tunduk pada protokol catatan rilis publik:
  bahasa warga, tanpa nama pustaka/framework/alat internal.

## Menambah pilar topik

Tambahkan objek `{ id, label, angle }` di `pillars.json`. `angle` ditulis
sebagai instruksi untuk model, bukan judul. Panjang array menentukan rotasi;
tidak perlu menyentuh kode.

## Model & biaya

Model gratis Google AI Studio memiliki kuota harian; satu artikel per hari aman.
`gemini-3.8-flash` paling stabil saat ditulis. Bila sering `503`, tambahkan
model cadangan di `LLM_MODELS`.
