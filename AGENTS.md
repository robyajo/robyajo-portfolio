<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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

## Protokol Catatan Rilis (wajib setiap ada perubahan yang dirasakan pengguna)

Setiap penambahan fitur atau perbaikan bug yang **dirasakan pengguna** harus dicatat di direktori `releases/` — maksimal **1 berkas JSON per hari** (konsolidasi harian). Lihat skill terinstal: `.agents/skills/release-notes/SKILL.md`.

1. **Periksa tanggal hari ini**: cek apakah `releases/YYYY-MM-DD-*.json` sudah ada.
2. **Jika SUDAH ADA**: JANGAN buat berkas baru. Tambahkan poin ke array `items`, perbarui `title`/`body`, naikkan `type` bila perlu (`important` > `feature` > `fix` > `improvement`).
3. **Jika BELUM ADA**: buat `releases/YYYY-MM-DD-nama-singkat.json` dengan format dwibahasa (`id` + `en`) untuk `title`, `body`, dan tiap item.
4. **Bahasa publik, bebas istilah teknis internal**: DILARANG menulis nama library/framework/database/middleware/file kode atau mekanisme internal. Rumuskan sebagai pemberitahuan pelayanan yang ramah dan berfokus pada dampak bagi pengguna (kemudahan, kecepatan, hemat kuota, kerahasiaan data).
