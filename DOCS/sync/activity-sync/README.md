# Paket Sinkron Kegiatan (siap salin ke proyek lain)

Paket mandiri agar AI di proyek lain otomatis mengirim kabar ke portfolio.
Salin **seluruh folder `DOCS/sync/`** atau ambil per berkas sesuai kebutuhan.

| Berkas | Untuk | Dipakai di mana |
|---|---|---|
| `activity-sync/SKILL.md` | AI proyek lain | salin ke `<proyek>/.agents/skills/activity-sync/SKILL.md` |
| `activity-sync/.ACTIVITY_PROJECT_KEYS.example` | Pola berkas kunci `X-project` — salin jadi `.ACTIVITY_PROJECT_KEYS` lalu isi kunci app | dibaca AI sebagai sumber kunci |
| `activity-sync/backfill.md` | Kirim ulang `releases/*.json` lama (sekali per proyek) | dijalankan sekali saat pasang |
| `activity-sync/postman-collection.json` | Uji coba manual semua route | import ke Postman, isi variable `projectKey` |
| `route.md` | Referensi kontrak API (POST/GET/PATCH/DELETE, kode status, batas) | dibaca AI/manusia saat integrasi |
| `skill-activity-sync.md` | Panduan pemilik portfolio (kunci, registry, alur data) | arsip internal, jangan disebar ke proyek lain |
| `README.md` (ini) | Peta paket + checklist pasang | dibaca pertama |

**Catatan duplikasi**: `SKILL.md` di sini identik dengan
`.agents/skills/activity-sync/SKILL.md` (yang dipakai AI repo ini).
Jika salah satu diubah, samakan yang lain — cek cepat: `diff` kedua berkas
harus kosong.

## Checklist pasang di proyek lain (untuk AI/owner)

1. Salin `activity-sync/` ke `.agents/skills/` proyek tersebut.
2. Siapkan kunci: `cp .ACTIVITY_PROJECT_KEYS.example .ACTIVITY_PROJECT_KEYS`
   lalu isi kunci `X-project` app tersebut (bukan kunci bersama) — AI membaca
   berkas itu sebagai sumber kunci; berkas asli jangan di-commit.
3. Uji sekali: kirim contoh dari `SKILL.md` dengan `project.name` proyek itu, lalu cek `GET /api/activities?limit=3`.
4. Setelah itu AI wajib mengirim setiap ada perubahan yang dirasakan pengguna,
   dengan `source` = nama berkas rilis agar revisi menimpa, bukan mendobel.
