# Catatan Rilis

Direktori ini berisi riwayat perubahan aplikasi yang **dirasakan pengguna**, satu berkas JSON per hari
(konsolidasi harian). Aturan lengkap: `AGENTS.md` (Protokol Catatan Rilis) dan
`.agents/skills/release-notes/SKILL.md`.

## Aturan

1. Maksimal **1 berkas JSON per hari**: `releases/YYYY-MM-DD-nama-singkat.json`.
2. Jika berkas hari ini sudah ada, **tambahkan ke `items`-nya** — jangan buat baru.
3. Dwibahasa (`id` + `en`) untuk `title`, `body`, dan setiap item.
4. Bahasa publik: dilarang menyebut library/framework/database/file kode/mekanisme internal.

## Format

```json
{
    "date": "2026-10-15",
    "type": "improvement",
    "status": "published",
    "title": { "id": "...", "en": "..." },
    "body": { "id": "...", "en": "..." },
    "items": [
        { "type": "new", "id": "...", "en": "..." },
        { "type": "fix", "id": "...", "en": "..." }
    ]
}
```

- `type` berkas: `feature` · `fix` · `improvement` · `important` (ambil yang tertinggi di hari itu).
- `type` item: `new` · `fix` · `improvement` · `security` · `removed`.
- `status`: `"published"` (bawaan) atau `"draft"`.
