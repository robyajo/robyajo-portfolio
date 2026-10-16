---
name: activity-sync
description: "ACTIVATE setiap kali selesai mengerjakan perubahan yang dilihat pengguna di proyek ini: tambah fitur, perbaikan bug, ubah perilaku, atau rilis. Kirim satu entri kegiatan dwibahasa (id + en) ke API portfolio agar otomatis tayang di halaman utama. Triggers on: selesai memperbaiki, tambah fitur, ubah perilaku, perbaikan bug, rilis, deploy."
---

# Activity Sync — kirim kegiatan ke portfolio

Setiap selesai mengerjakan perubahan yang **dirasakan pengguna** di proyek ini,
kirim **satu** entri kegiatan ke API portfolio. Portfolio menampilkannya otomatis
di **halaman detail proyek** (dwibahasa, sesuai bahasa pengunjung).

## Kunci: buat di admin portfolio, bukan di sini

1. Pemilik membuka `/admin/projects` → tambah/ubah proyek → tekan **Buat** pada
   kolom kunci sinkron → **salin** kuncinya.
2. Tempel kunci itu ke konfigurasi AI proyek ini (jangan commit ke git publik).
3. Satu kunci = satu proyek showcase. Kegiatan berkunci itu hanya tampil di
   halaman detail proyek tersebut (`/projects/<slug>`), bukan di beranda.

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
    "project": {
      "name": "Nama Proyek Tampil (wajib saat pertama kali, opsional setelahnya)",
      "url": "https://contoh.com (opsional)",
      "description": "Deskripsi singkat proyek (opsional)"
    },
    "source": "releases/2026-10-16-nama-rilis.json",
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
- **Satu kunci boleh dipakai banyak proyek**: yang membedakan adalah
  `project.name`. Kirim nama yang sama setiap kali agar tercatat sebagai satu
  proyek. Menambah proyek baru TIDAK butuh ubah env / rebuild portfolio —
  cukup kirim dengan `project.name` berbeda.
- `kind`: `deploy` · `feature` · `fix` · `update`.
- Respons sukses: `201 {"ok": true, "id": 123, "project": "...", "createdProject": true|false, "updated": false}`. Validasi gagal: `422` + daftar masalah.

## Aturan proyek & revisi rilis (penting)

- **Proyek baru otomatis terdaftar** saat pertama mengirim (nama diambil dari `project.name`, boleh beda-beda dalam satu kunci). Setelah itu nama boleh dikosongkan selama konsisten.
- **`source` wajib diisi stabil** — idealnya **nama berkas rilis** (mis. `releases/2026-10-16-fitur-x.json`).
  Kiriman berikutnya dengan `source` yang sama akan **MEMPERBARUI** baris yang
  sama (judul/isi/kind ikut baru), bukan menambah duplikat.
- Jadi alur yang benar setiap selesai rilis: kirim sekali dengan `source` = nama
  berkas rilisnya. Kalau berkas rilis direvisi, kirim ulang dengan `source`
  yang sama — konten di portfolio ikut terbarui otomatis.

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
curl "https://ajoroby.is-a.dev/api/projects"
```

Entri harus muncul di daftar dan di halaman detail proyeknya (dan daftar proyek
TIDAK pernah memuat kunci API). Admin portfolio juga bisa mengubah/menghapus
kegiatan manual dari dialog proyek.
