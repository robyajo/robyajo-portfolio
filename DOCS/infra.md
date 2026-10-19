# Peta Teknologi — robyajo-portfolio

> Next.js 16 portfolio app (di-fork dari template `anishshobithps.com`, direbrand ke `robyajo`).
> Deploy: Vercel (`robyajo-portfolio.vercel.app` + custom domain `ajoroby.is-a.dev`).
> Dokumen ini memetakan **setiap teknologi → kegunaannya di aplikasi ini**, diverifikasi lewat grep import di `src/`, `scripts/`, dan file config.

## Arsitektur singkat

```
Browser ──▶ Vercel (Next.js 16, Turbopack) ──▶ Neon Postgres (via drizzle-orm)
   │                    │
   │                    └─▶ OAuth GitHub/Google (auth: guestbook, komentar blog, /admin)
   │                    └─▶ Umami Cloud (analytics, via rewrite /stats/*)
```

## 1. Framework & runtime

| Teknologi | Versi | Kegunaan di app ini |
|---|---|---|
| `next` | ^16.3.6 | Framework utama: App Router (`src/app`), SSR/SSG, API routes, middleware (`src/proxy.ts`), Turbopack build |
| `react` / `react-dom` | ^19.3.0 | UI library; dipakai bareng Server Components + Client Components (`"use client"`) |
| `typescript` | ^6.0.3 | Type safety seluruh codebase; `pnpm types:check` = `fumadocs-mdx && next typegen && tsc --noEmit` |

## 2. Blog & konten (MDX)

| Teknologi | Versi | Kegunaan di app ini |
|---|---|---|
| `fumadocs-mdx` | 15.1.0 | Pipeline kompilasi MDX: `source.config.ts`, `next.config.mjs` (`createMDX()`), jalan otomatis di `postinstall` |
| `fumadocs-core` | 16.11.1 | Loader + skema konten blog (`src/lib/source.ts`), TOC & `ScrollProvider` (`src/components/layouts/blog.tsx`) |
| `fumadocs-ui` | 16.11.1 | Komponen tampilan MDX (`Tabs`, dsb. di `src/mdx-components.tsx`), layout blog, `createRelativeLink` |
| `reading-time` + `unist-util-visit` + `vfile` | ^1.5.0 / ^5.1.0 / ^6.0.3 | Remark plugin `src/lib/remarkReadingTime.ts`: hitung estimasi baca tiap postingan (260 wpm, skip blok kode) |
| `zod` | ^4.6.5 | Validasi skema: frontmatter blog (`source.config.ts`), parameter template SVG (`src/lib/svg/*`), skema links/projects (`src/lib/*-schema.ts`) |

Konten: `content/blog/*.mdx` (4 postingan, frontmatter `title/description/date/tags`).

## 3. Database

| Teknologi | Versi | Kegunaan di app ini |
|---|---|---|
| `@neondatabase/serverless` | ^1.1.0 | Driver Postgres serverless (Neon); dipakai di `src/lib/db.ts` + script seeding |
| `drizzle-orm` | ^0.45.3 | Query builder + skema (`src/lib/schema.ts`): 19 tabel — `users`, `sync_projects`, `activities`, `blog_posts`, `blog_categories`, `blog_tags`, `blog_reactions`, `blog_reads`, `project_views`, `guestbook_entries`, `guestbook_likes`, `blog_comments`, `blog_comment_likes`, `projects`, `project_stacks`, `links`, `link_slugs`, `visitors`, `visitor_days` |
| `drizzle-kit` | ^0.31.11 | CLI migrasi: `db:migrate`, `db:push`, `db:studio`; output ke `drizzle/` |

> Catatan: `src/lib/db.ts` dibuat lazy-init agar `next build` dan runtime tetap jalan tanpa `DATABASE_URL`; query baca dibungkus `safeQuery()` (`src/lib/safe-query.ts`) dengan fallback kosong.

## 4. Auth & webhook

| Teknologi | Versi | Kegunaan di app ini |
|---|---|---|
| `next-auth` | ^4.24.15 | Auth: `[...nextauth]` route, `getServerSession` (`src/lib/auth.ts`), `SessionProvider` + adapter (`src/components/shared/auth-session.tsx`) — untuk guestbook, komentar/like blog, dan gerbang `/admin`. Provider GitHub/Google aktif bila env-nya diisi |

> Catatan: tanpa OAuth terkonfigurasi, site tampil signed-out dan fitur tulis nonaktif. Identitas penulis disimpan sebagai snapshot (`author_name`/`author_image`) saat tulis — tanpa direktori user eksternal.

## 5. Styling & komponen UI

| Teknologi | Versi | Kegunaan di app ini |
|---|---|---|
| `tailwindcss` + `@tailwindcss/postcss` | ^4.3.3 | Utility CSS (`src/app/global.css`); PostCSS plugin di `postcss.config.mjs` |
| `tw-animate-css` | ^1.4.0 | Animasi utilitas Tailwind |
| `shadcn` (+ `components.json`) | ^4.21.0 | Konvensi shadcn `new-york`, base `zinc`, CSS variables; puluhan primitif di-vendor ke `src/components/ui/*` |
| `radix-ui` | ^1.6.7 | Primitif aksesibel di balik `ui/*`: dialog, sheet, popover, tooltip, select, checkbox, scroll-area, command, drawer |
| `class-variance-authority` | ^0.7.1 | Varian komponen (`cva`) di `ui/button`, `ui/badge`, `ui/sidebar`, dsb. |
| `next-themes` | ^0.4.6 | Dark/light mode (`ThemeProvider` di `src/app/layout.tsx`, `theme-toggle`, hotkey, command menu) |
| `@phosphor-icons/react` | ^2.1.10 | Satu-satunya icon library (`src/components/shared/icons.tsx`, `IconContext weight:fill`) |
| `cmdk` | ^1.1.1 | Command palette (Ctrl/⌘K) via `src/components/ui/command.tsx` |
| `vaul` | ^1.1.1 | Drawer bawah (`src/components/ui/drawer.tsx`), dipakai floating-hub |
| `sonner` | ^2.0.8 | Toast notifikasi (`Toaster`, `lib/toast.ts`) untuk aksi guestbook/komentar |
| `cn` | ^0.3.3 | Helper gabung class (`src/lib/cn.ts`, re-export) |
| `motion` | ^12.43.0 | Animasi ringan: tanda tangan SVG, flicker-text, `global-error` (hormat `useReducedMotion`) |
| `culori` | ^4.0.2 | Matematika warna untuk theme tokens (`src/lib/theme-tokens.ts`) |

## 6. Data, form & state (client)

| Teknologi | Versi | Kegunaan di app ini |
|---|---|---|
| `@tanstack/react-query` | ^5.104.0 | Fetching + cache client: guestbook, komentar, reactions, panel admin (`QueryProvider`, hydration di page admin) |
| `nuqs` | ^2.10.1 | State lewat URL query string (`NuqsAdapter`; filter blog + panel admin comments/guestbook) |
| `@tanstack/react-table` | ^9.2.4 | Tabel manajemen shortlinks di `/admin/links` |
| `@tanstack/react-virtual` | ^3.14.13 | Virtualisasi list panjang: entries guestbook + list komentar blog |
| `react-hook-form` + `@hookform/resolvers` | ^7.89.0 / ^5.9.1 | Form admin links & projects (dengan `standardSchemaResolver`) |
| `@wojtekmaj/react-hooks` | ^2.2.0 | `useResizeObserver` (PDF viewer), `useDebouncedValue` (preview branding/OG) |

## 7. Media & dokumen

| Teknologi | Versi | Kegunaan di app ini |
|---|---|---|
| `media-chrome` | ^4.19.2 | Pemutar media di postingan blog (`src/components/ui/media-player.tsx`) |
| `react-pdf` + `pdfjs-dist` | ^10.5.0 / 5.4.296 | Pratinjau resume PDF di halaman `/resume` (worker dimuat dari `pdfjs-dist`) |
| `opentype.js` | 1.3.4 | Parse font tulisan tangan untuk animasi tanda tangan (`ui/signature.tsx`) |
| `takumi-js` | ^2.14.0 | Render OG image/SVG dinamis (`/og`, `src/lib/svg/render.tsx`); didaftar `serverExternalPackages` |
| `schema-dts` | ^1.1.5 | Tipe TypeScript untuk JSON-LD SEO (`src/components/shared/json-ld.tsx`) |

## 8. Fitur khas app (rute & layanan)

| Fitur | Teknologi pendukung | Lokasi |
|---|---|---|
| Blog + RSS/LLM (`/feed.xml`, `/llms.txt`, `/blog/*.mdx`) | fumadocs, MDX | `src/app/(site)/blog`, `content/blog` |
| Guestbook + komentar/like blog | NextAuth, Neon, react-query, react-virtual | `src/app/(site)/guestbook`, `.../blog/[[...slug]]` |
| Panel admin (`/admin/*`: overview, blog, guestbook, comments, projects + stacks, links, visitors) | NextAuth (owner-only), react-table, react-hook-form | `src/app/admin` |
| Shortlink multi-domain | `SHORTLINK_DOMAIN` di `src/proxy.ts` + tabel `links`/`link_slugs` | `src/app/[...link]` |
| Kartu SVG dinamis + playground (`/svg`, `/svg/preview`) | takumi-js, zod | `src/app/svg`, `src/lib/svg` |
| Download resume (`/api/resume*`) | react-pdf, Neon (cache) | `src/app/api/resume` |
| Analytics privat | Umami Cloud via rewrite `/stats/*` (anti-adblock), hanya di production | `next.config.mjs`, `src/app/layout.tsx` |

## 9. Tooling (tidak masuk runtime)

| Teknologi | Kegunaan |
|---|---|
| `vitest` + `@faker-js/faker` | Unit test (`pnpm test`, 171 test) + data palsu untuk seed guestbook |
| `tsx` | Menjalankan script seeding (`scripts/seed-*.ts`) dengan `.env.local` |
| `eslint` + `eslint-config-next` + `@shadcn/lint` | Lint (`core-web-vitals`, aturan `shadcn/no-*` sebagai error) |
| `knip` | Deteksi export/dependensi tak terpakai (`knip.config.mjs`, `knip.json`) |
| `postcss` | Peer dari `@tailwindcss/postcss` |
| `drizzle.config.ts` | `out: ./drizzle`, `schema: ./src/lib/schema.ts`, `dialect: postgresql`, URL dari `DATABASE_URL` |

## Env vars yang dipakai

| Var | Wajib? | Untuk |
|---|---|---|
| `DATABASE_URL` | Opsional (degradasi) | Neon Postgres: guestbook, komentar, projects, links |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Ya (login) | Secret sesi (acak) + URL situs untuk callback OAuth |
| `GITHUB_ID` / `GITHUB_SECRET` / `GOOGLE_ID` / `GOOGLE_SECRET` | Salah satu wajib (login) | OAuth Apps GitHub / kredensial Google Cloud |
| `OWNER_USER_ID` | Jika auth dipakai | Subject ID OAuth pemilik untuk `/admin` |
| `GITHUB_TOKEN` | Opsional | Menaikkan rate-limit API GitHub (kartu repo/profil) |
| `WAKATIME_API_KEY` | Opsional | Statistik coding |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Opsional | Analytics Umami |
| `SHORTLINK_DOMAIN` / `NEXT_PUBLIC_SHORTLINK_DOMAIN` | Opsional | Mode shortlink multi-domain |
| `NEXT_PUBLIC_BASE_URL` | Opsional | Override canonical URL (default ikut URL produksi Vercel) |
| `IP_HASH_SALT` | Opsional | Hash IP untuk anti-spam guestbook/komentar |
