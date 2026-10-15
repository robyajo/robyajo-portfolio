# Kebutuhan Development — robyajo-portfolio

> Satu file rangkuman seluruh kebutuhan untuk mengembangkan proyek ini di PC mana pun.
> Disimpan di Drive sebagai arsip. Kredensial ASLI tidak ditulis di sini — hanya cara mendapatkannya.
> Terakhir diperbarui: 2026-10-15.

---

## 1. Identitas proyek

| Info | Nilai |
|---|---|
| Repo GitHub | `https://github.com/robyajo/robyajo-portfolio` (branch `master`) |
| Produksi | `https://ajoroby.is-a.dev` |
| Cadangan Vercel | `https://robyajo-portfolio.vercel.app` |
| Framework | Next.js 16 + React 19 + TypeScript (package manager `pnpm`) |
| Hosting | Vercel — project `robyajo-portfolio`, team `roys-projects-393b79bd` |
| Database | Neon Postgres — org `org-dawn-leaf-80546672`, project `falling-river-69990935`, branch `production`, database `db_ajoroby` (region ap-southeast-1) |
| Auth | Clerk — aplikasi `applikasi-auth` (`app_2YTO10xEkc54GDhx4JwPl4Sv4A3`) |
| Format catatan rilis | `releases/YYYY-MM-DD-*.json` (1 file/hari, dwibahasa, bahasa publik) |

---

## 2. Prasyarat (setiap PC)

1. **Node.js 22+** (disarankan via `nvm`; Vercel memakai 24.x).
2. **pnpm 11** — repo mem-pin versi (`packageManager`), jadi cukup `corepack enable`.
3. **Git**.
4. CLI yang dipakai: `vercel` (login via browser), `neon@latest` (`npm i -g neon@latest`), `clerk` (`npx -y clerk@latest`, tanpa install).

---

## 3. Setup PC baru (urutan wajib)

```bash
git clone https://github.com/robyajo/robyajo-portfolio.git
cd robyajo-portfolio
corepack enable
pnpm install
cp .env.example .env.local   # lalu isi (lihat bagian 4)
pnpm dev                     # http://localhost:3000
```

**JANGAN dicopy antar-PC** (regenerasi otomatis, sudah di `.gitignore`):
`node_modules/`, `.next/`, `.vercel/`, `.source/`.

**JANGAN dikirim via chat/email**: `.env.local` (berisi password & secret).
Pindahkan via SSH/USB/password-manager, ATAU buat ulang dari sumbernya (bagian 4–5).

---

## 4. Environment variables (`.env.local`)

Salin dari `.env.example`. Status tiap variabel:

| Variabel | Wajib? | Cara mendapatkan |
|---|---|---|
| `DATABASE_URL` | Ya (fitur DB) | Dashboard Neon → branch `production` → database `db_ajoroby` → pooled connection string. Atau: `neon connection-string --project-id falling-river-69990935 --branch production --database-name db_ajoroby --pooled` |
| `IP_HASH_SALT` | Ya (fitur engagement) | Buat acak: `openssl rand -hex 32`. Boleh beda tiap PC |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Ya (login) | `npx -y clerk@latest auth login` lalu `npx -y clerk@latest env pull` (app sudah ter-link) |
| `CLERK_SECRET_KEY` | Ya (login) | Sama seperti di atas |
| `OWNER_CLERK_USER_ID` | Untuk `/admin` | Clerk Dashboard → Users → salin `user_...` milik sendiri |
| `CLERK_WEBHOOK_SECRET` | Untuk webhook | Clerk Dashboard → Webhooks → Signing Secret; endpoint: `https://ajoroby.is-a.dev/api/webhooks/clerk` (`user.deleted`) |
| `GITHUB_TOKEN` | Opsional | GitHub → Settings → Developer settings → token klasik (`ghp_...`) |
| `WAKATIME_API_KEY` | Opsional | Dashboard WakaTime |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Opsional | Dashboard Umami Cloud |
| `SHORTLINK_DOMAIN` / `NEXT_PUBLIC_SHORTLINK_DOMAIN` | Opsional | Domain pendek sendiri (harus ditambahkan ke project Vercel yang sama) |
| `NEXT_PUBLIC_BASE_URL` | Opsional | Default ikut URL produksi Vercel, lalu `http://localhost:3000` |

Tanpa DB/Clerk, aplikasi tetap build & jalan (mode degradasi: buku tamu/komentar read-only, `/admin` redirect ke home).

---

## 5. Database (Neon)

```bash
pnpm db:migrate              # terapkan migrasi drizzle/ (wajib pertama kali)
pnpm db:push                 # alternatif: push skema langsung (dev saja)
pnpm db:studio               # GUI database
pnpm db:seed:guestbook       # data palsu buku tamu (butuh Clerk backend key)
pnpm db:seed:guestbook:cleanup
pnpm db:seed:links           # contoh shortlink
```

Driver: `@neondatabase/serverless` (HTTP) + `drizzle-orm` — sudah tepat untuk Vercel, jangan diganti driver TCP.
Tes koneksi cepat: `pnpm tsx --env-file=.env.local -e "import{neon}from'@neondatabase/serverless';neon(process.env.DATABASE_URL)('SELECT 1').then(r=>console.log('DB OK',r))"`.

---

## 6. Auth (Clerk)

- Aplikasi ter-link otomatis via git remote. Cek: `npx -y clerk@latest doctor`.
- Ambil/refresh keys: `npx -y clerk@latest auth login` → `npx -y clerk@latest env pull`.
- Produksi butuh aplikasi yang sudah di-claim + production instance (`env pull --instance prod`); JANGAN taruh dev keys ke Production.
- Tema Clerk: `@clerk/ui` (shadcn), diterapkan di `src/components/shared/clerk-optional.tsx`. Jika login dimatikan (tanpa keys), tombol masuk hilang otomatis — bukan bug.

---

## 7. Deploy (Vercel)

- Deploy otomatis setiap push ke `master`. Framework preset **harus Next.js** — dipin di `vercel.json` (`"framework": "nextjs"`). Jangan hapus file itu (pernah menyebabkan `STATIC_BUILD_NO_OUT_DIR` saat preset nyasar ke Astro).
- Env yang wajib ada di Dashboard (Production + Preview, sebagai Secret): `DATABASE_URL`, `IP_HASH_SALT`. Tambah Clerk saat produksi butuh login.
- Build tidak pernah migrasi DB — jalankan `pnpm db:migrate` manual ke database produksi saat skema berubah.

---

## 8. Perintah harian

```bash
pnpm dev          # dev server
pnpm build        # build produksi (wajib lolos sebelum push)
pnpm start        # jalankan hasil build
pnpm types:check  # typecheck + codegen
pnpm lint         # ESLint (ada error bawaan template — abaikan kecuali di file sendiri)
pnpm test         # vitest (171 test)
pnpm knip         # cek kode tak terpakai
```

---

## 9. Aturan kerja AI di repo ini

1. Baca `AGENTS.md` — ada 2 protokol wajib: **Neon setup** dan **Catatan Rilis**.
2. Setiap perubahan yang dirasakan pengguna → catat di `releases/YYYY-MM-DD-*.json` hari itu (JANGAN buat file baru jika sudah ada; bahasa publik, tanpa istilah teknis).
3. Skill terinstal: `.agents/skills/release-notes/`, `.agents/skills/playwright-cli/`.
4. Jangan commit `.env.local`, `node_modules`, `.next`, `.vercel`, `.source`.
5. Konten `content/blog/*`, logo, `LICENSE.md` masih milik template — lihat daftar TODO di `README.md`.

---

## 10. Troubleshooting yang pernah terjadi

| Gejala | Penyebab & solusi |
|---|---|
| Vercel: `STATIC_BUILD_NO_OUT_DIR` (minta `dist/`) | Preset framework nyasar ke Astro. Pastikan `vercel.json` berisi `"framework": "nextjs"` |
| Build gagal `Expected a closing tag for <Tab>` di MDX | File `.mdx` korup (pernah oleh proses otomatis). `git checkout -- <file>` lalu build ulang |
| `pnpm build` gagal `ERR_PNPM_IGNORED_BUILDS` (core-js) | `pnpm approve-builds core-js` |
| Error `DATABASE_URL is not set` di log | Normal jika DB belum diset (fallback kosong). Isi `.env.local` + migrate untuk menghilangkan |
| Error Spotify token di log | Sp
...[truncated 615 chars]