---
name: activity-sync
description: "ACTIVATE setiap kali selesai mengerjakan perubahan yang dilihat pengguna di proyek ini: tambah fitur, perbaikan bug, ubah perilaku, atau rilis. Kirim satu entri kegiatan dwibahasa (id + en) ke API portfolio agar otomatis tayang di halaman utama. Triggers on: selesai memperbaiki, tambah fitur, ubah perilaku, perbaikan bug, rilis, deploy."
---

# Activity Sync — kirim kegiatan ke portfolio

Setiap selesai mengerjakan perubahan yang **dirasakan pengguna** di proyek ini,
kirim **satu** entri kegiatan ke API portfolio. Portfolio menampilkannya otomatis
di bagian Kegiatan Terbaru (dwibahasa, sesuai bahasa pengunjung).

## Kapan WAJIB kirim

| Perubahan | Kirim? |
|---|---|
| Fitur baru / halaman baru | **Ya** (`kind: "feature"`) |
| Bug diperbaiki / keluhan pengguna | **Ya** (`kind: "fix"`) |
| Deploy / rilis ke produksi | **Ya** (`kind: "deploy"`) |
| Peningkatan kecil / kabar lain | **Ya** (`kind: "update"`) |
| Refactor internal, format, komentar, tes (tak terlihat pengguna) | Tidak |

## Cara kirim

```bash
curl -X POST "https://ajoroby.is-a.dev/api/activities" \
  -H "Content-Type: application/json" \
  -H "X-project: <KUNCI_PROYEK_INI>" \
  -d '{
    "kind": "feature",
    "title": {
      "id": "Judul singkat Bahasa Indonesia (maks 300 karakter)",
      "en": "Short title in English (max 300 characters)"
    },
    "body": {
      "id": "Satu-dua kalimat dampak bagi pengguna (maks 2000 karakter)",
      "en": "One or two sentences of user impact (max 2000 characters)"
    },
    "url": "https://contoh.com/tautan-terkait (opsional, boleh kosong)",
    "occurred_at": "2026-10-16T10:00:00+07:00 (opsional, default sekarang)"
  }'
```

- `X-project` = kunci statis proyek ini (minta ke pemilik portfolio; tanpa kunci valid server menolak: 401 tanpa header, 403 kunci salah).
- `kind`: `deploy` · `feature` · `fix` · `update`.
- Respons sukses: `201 {"ok": true, "id": 123}`. Validasi gagal: `422` + daftar masalah.

## Aturan bahasa (wajib, security-safe & citizen-facing)

- Tulis `id` dan `en` — keduanya wajib, bukan terjemahan mesin mentah.
- DILARANG menyebut nama library/package/framework/database/file kode/mekanisme internal.
- Rumuskan sebagai kabar pelayanan yang ramah dan berfokus pada dampak pengguna.

Contoh benar:

```json
{
  "kind": "fix",
  "title": {
    "id": "Perbaikan formulir pendaftaran yang macet",
    "en": "Fixed the stuck registration form"
  },
  "body": {
    "id": "Formulir kini bisa dikirim sampai selesai tanpa mengulang dari awal.",
    "en": "The form can now be submitted to completion without starting over."
  }
}
```

Contoh salah (jangan kirim seperti ini):

```json
{
  "kind": "fix",
  "title": { "id": "Perbaiki bug Zod rate limiter", "en": "Fix Zod rate limiter bug" }
}
```

## Verifikasi

```bash
curl "https://ajoroby.is-a.dev/api/activities?limit=3"
```

Entri harus muncul di daftar (dan di halaman utama portfolio dalam hitungan menit,
mengikuti cache).
