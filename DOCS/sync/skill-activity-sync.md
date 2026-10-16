# Sinkron Kegiatan Antar-Proyek (Activity Sync)

Portfolio ini (`https://ajoroby.is-a.dev`) bisa menerima kabar kegiatan dari
proyek-proyek lain dan menampilkannya otomatis di bagian Kegiatan Terbaru.

## Cara pakai di proyek lain (untuk AI)

1. Salin folder skill ini ke proyek tersebut:
   `.agents/skills/activity-sync/` (cukup berkas `SKILL.md`).
2. Pastikan AI di proyek itu memuat skill saat ada perubahan yang dirasakan
   pengguna — sesuai bagian `description` (triggers) di `SKILL.md`.
3. Beri AI di sana dua hal:
    - **URL API**: `https://ajoroby.is-a.dev/api/activities`
    - **Kunci `X-project`** proyek tersebut (lihat di bawah).

## Kunci proyek (`X-project`)

- Daftar kunci hidup di env portfolio: `ACTIVITY_PROJECT_KEYS` dengan format
  `kunci:Nama Tampil,kunci2:Nama Tampil 2` (lokal: `.env.local`, produksi: env Vercel).
- **Satu kunci per proyek.** Kunci hanya untuk auth; nama tampil boleh
  diperbarui lewat payload `project`.
- Membuat kunci baru: `openssl rand -hex 16`, beri awalan `pk_`, tambahkan ke
  kedua env, beri tahu AI proyek terkait.
- Kunci yang bocor: hapus dari registry + redeploy — kiriman dengan kunci
  salah ditolak (`403`) tanpa menyentuh database.

## Data proyek & revisi (disimpan di database)

- Kiriman pertama dari suatu kunci **otomatis mendaftarkan proyek** (nama dari
  `project.name`, fallback nama registry). Kiriman berikut memperbarui
  progres: nama/url/deskripsi bila dikirim + `last_activity_at`.
- Bila payload menyertakan `source` stabil (nama berkas rilis) dan `source`
  itu sudah pernah dikirim, baris kegiatan **diperbarui** (judul/isi/kind/
  waktu ikut baru) — tidak duplikat. Inilah jalur "AI merevisi rilis".
- Daftar proyek publik: `GET /api/projects` (nama, url, deskripsi, jumlah
  kegiatan, update terakhir — tanpa kunci).

## Alur data

```
AI proyek lain --POST /api/activities--> portfolio --tayang--> beranda + JSON-LD
   header X-project: <kunci>                validasi zod + registry
```

- Tanpa header: `401`. Kunci salah: `403`. Payload salah: `422` + rincian.
- Daftar publik: `GET /api/activities?limit=20&project=<kunci>` (tanpa auth).

## Batas

- Judul maks 300 karakter, isi maks 2000 karakter, masing-masing `id` + `en`.
- Maks 50 entri per permintaan daftar.
