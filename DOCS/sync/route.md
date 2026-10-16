# Kontrak Route Activity Sync

Basis: `https://ajoroby.is-a.dev`. Semua respons JSON. Waktu dalam ISO-8601
dengan offset (contoh `2026-10-16T10:00:00+07:00`).

## POST /api/activities — kirim / revisi kegiatan

**Header wajib**

| Header | Isi |
|---|---|
| `Content-Type` | `application/json` |
| `X-project` | kunci proyek (dibuat dari `/admin/projects`, atau terdaftar di `ACTIVITY_PROJECT_KEYS`) |

Kunci valid bila tercatat di database (dibuat via admin) ATAU ada di registry
env — jadi menambah proyek tidak butuh ubah env maupun rebuild portfolio.

**Body (JSON)**

| Field | Wajib | Batas / nilai |
|---|---|---|
| `kind` | tidak | `deploy` · `feature` · `fix` · `update` (default `update`) |
| `project.name` | saat kontak pertama | maks 256 karakter |
| `project.url` | tidak | maks 2048 karakter, boleh `""` |
| `project.description` | tidak | maks 2000 karakter, boleh `""` |
| `source` | tidak (sangat dianjurkan) | id stabil, mis. nama berkas rilis, maks 256 karakter |
| `title.id` / `title.en` | ya | masing-masing 1–300 karakter |
| `body.id` / `body.en` | tidak | masing-masing maks 2000 karakter, boleh `""` |
| `url` | tidak | maks 2048 karakter, boleh `""` |
| `occurred_at` | tidak | datetime ISO dengan offset (default: waktu terima) |

**Semantik**

1. Kunci dicek ke registry. Proyek yang belum tercatat **didaftarkan otomatis**
   (nama dari `project.name`, fallback nama registry). Kiriman berikut
   memperbarui nama/url/deskripsi bila dikirim + `last_activity_at`.
2. Bila `source` sudah pernah dikirim dari kunci yang sama, baris **diperbarui**
   (bukan duplikat).
3. Nama proyek tampil diambil dari data server, bukan mentah dari pengirim.

**Respons**

| Status | Arti | Contoh body |
|---|---|---|
| `201` | tersimpan baru (+ `createdProject` bila proyek baru) | `{"ok": true, "id": 7, "project": "Nama", "createdProject": true, "updated": false}` |
| `200` | revisi `source` yang sama | `{"ok": true, "id": 7, "project": "Nama", "createdProject": false, "updated": true}` |
| `401` | tanpa header `X-project` | `{"error": "Missing X-project header."}` |
| `403` | kunci tidak dikenal | `{"error": "Unknown project key."}` |
| `422` | payload salah | `{"error": "Invalid payload.", "issues": [...]}` |
| `400` / `500` | JSON rusak / gagal simpan | `{"error": "..."}` |

## GET /api/activities — daftar publik

- Query: `?limit=20&project=<kunci>` (`limit` 1–50, default 20; `project` opsional, filter by kunci).
- Tanpa auth. Respons: `{"ok": true, "total": N, "items": [...]}`.
- Tiap item: `id, projectKey, projectName, kind, titleId, titleEn, bodyId, bodyEn, url, occurredAt`.

## GET /api/projects — daftar proyek

- Tanpa auth, tanpa query. Respons: `{"ok": true, "total": N, "projects": [...]}`.
- Tiap proyek: `name, url, description, activityCount, lastActivityAt`.
- **Kunci API tidak pernah muncul** di respons mana pun.
