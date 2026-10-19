# robyajo-portfolio

Source code for [ajoroby.is-a.dev](https://ajoroby.is-a.dev): portfolio, blog, dan guestbook milik **Roby Karti S. (robyajo)** — Fullstack Software Developer dari Pekanbaru, Indonesia.

<p>
  <a href="https://ajoroby.is-a.dev">Live site</a> ·
  <a href="https://ajoroby.is-a.dev/blogs">Blog</a> ·
  <a href="https://ajoroby.is-a.dev/feed.xml">RSS</a> ·
  <a href="https://ajoroby.is-a.dev/branding">Branding</a> ·
  <a href="https://ajoroby.is-a.dev/privacy-policy">Privacy</a>
</p>

> ### License at a glance
>
> - **Functional code**, including the code examples in this README and in blog posts: MIT
> - **Writing, original artwork, and creative copy**, including this README's prose: CC BY-NC-ND 4.0
> - **Logo, wordmark, and mascot:** CC BY-NC-ND 4.0 as artwork, not licensed as branding
> - **Name, domain, likeness, photograph, and brand identity:** reserved
> - **Third-party material:** its original license
>
> This repository is intentionally mixed-license, and so is this README. See [`LICENSE.md`](LICENSE.md) for the exact scope.
> NOTE: `LICENSE.md` masih atas nama penulis template sebelumnya — perlu diperbarui ke identitas pemilik repo ini (lihat TODO).

---

## What's in here

| Route                        | What it does                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/`                          | Hero with doodles, project teasers, latest post, guestbook rotator                                                  |
| `/blogs`, `/blogs/*`         | MDX posts via [fumadocs](https://fumadocs.dev), isometric covers, reading time, anonymous reactions, view counts, threaded comments |
| `/projects`                  | Pulled from the database, not a hardcoded array; ordered and toggled from the admin                                 |
| `/resume`                    | PDF rendered inline with react-pdf, streamed from the latest GitHub release; `/api/resume/download` saves it         |
| `/guestbook`                 | OAuth-authenticated messages (GitHub/Google) with likes, pinning, and soft delete                                 |
| `/branding`                  | Type scale, logo downloads (SVG or PNG, 16 to 512 px), the doodle set, and a live OG preview                         |
| `/privacy-policy`            | What gets stored, where, and why                                                                                     |
| `/admin/*`                   | Owner-only dashboard for posts, projects and stacks, comments, guestbook, short links, and visitor stats            |
| `/og`                        | Generated OpenGraph cards with the isometric mascot ([takumi](https://github.com/kane50613/takumi), not Satori)      |
| `/svg`                       | SVG cards for GitHub READMEs: headings, posts, activity, calendar, guestbook and more                                |
| `/blogs/latest`              | Redirects to the newest post, so a README link always matches the post card                                          |
| `/feed.xml`                  | RSS 2.0 feed of Indonesian posts, linked from page metadata for autodiscovery                                        |
| `/llms.txt`                  | Machine-readable site summary; every post also serves raw MDX at `/blogs/<slug>.mdx`                                 |
| `/sitemap.xml`, `/robots.txt`| The sitemap is built from the post source, so new posts show up without touching it                                  |
| `/<slug>`                    | Short-link resolver with click counts (lihat bagian Short links)                                                     |

On every page:

- <kbd>⌘</kbd> <kbd>K</kbd> (or <kbd>Ctrl</kbd> <kbd>K</kbd>) opens a command palette for navigation, theme switching, the resume, and socials. <kbd>⇧</kbd> <kbd>⌘</kbd> <kbd>D</kbd> flips the theme without opening anything.
- A floating quick menu, fronted by the logo mascot. On a post it shows reading progress and jumps to the comments; on `/resume` it downloads the PDF; on the blog and guestbook it holds the sign-in pass. Drag it anywhere and it remembers the spot.
- The footer links to socials and site sections.

A few things worth calling out (spesifik fork ini):

- Reactions and view counts are anonymous, no account needed. Identity is a SHA-256 of `ip:IP_HASH_SALT` (see [`src/lib/ip.ts`](src/lib/ip.ts)). The raw IP is never stored.
- Comments and the guestbook need sign-in (GitHub/Google OAuth, no middle layer). Your display name and avatar are saved with your entry at posting time.
- Projects, links, and engagement all live in Postgres, and posts live in `content/blog`. Nothing is hardcoded that shouldn't be.
- **Semua layanan eksternal bersifat opsional di fork ini**: tanpa `DATABASE_URL`/OAuth, site tetap build & tayang — guestbook/komentar read-only dan kosong, `/admin` redirect ke home. Implementasi: [`src/lib/db.ts`](src/lib/db.ts) (lazy init), [`src/lib/auth.ts`](src/lib/auth.ts) + [`src/components/shared/auth-session.tsx`](src/components/shared/auth-session.tsx). Lihat [`DOCS/infra.md`](DOCS/infra.md) untuk peta teknologi lengkap.
- The artwork is authored directly in code rather than imported as raster exports. See [The art](#the-art).

---

## Running locally

Node 22+ and pnpm 11 (the repo pins `packageManager`, so `corepack enable` is enough).

```bash
pnpm install
cp .env.example .env.local   # isi sesuai kebutuhan (semua opsional untuk boot)
pnpm db:migrate              # hanya jika DATABASE_URL diisi; applies drizzle/
pnpm dev                     # http://localhost:3000
```

| Need   | For                    | Where                                                     |
| ------ | ---------------------- | --------------------------------------------------------- |
| PostgreSQL | guestbook, comments, projects, links | [neon.tech](https://neon.tech) (free tier works) |
| Auth   | guestbook posting, comments, `/admin` | OAuth GitHub/Google via NextAuth (lihat `.env.example`) |

Full variable reference: [`.env.example`](.env.example). Sign-in uses GitHub/Google OAuth directly; penghapusan data bisa diminta via email di halaman privacy-policy.

---

## Project layout

```
content/blog/          MDX posts — the only place posts live
drizzle/               committed SQL migrations + meta
scripts/               one-off tsx scripts (seeding)
tests/                 vitest, node environment, pure logic plus the /svg route contract
DOCS/                  project docs (technology map in infra.md)
.github/               CI workflow and the README artwork
src/
  proxy.ts             short-link domain routing
  app/(site)/          public pages
  app/admin/           owner-only dashboard
  app/api/             resume proxy + NextAuth (`/api/auth/[...nextauth]`)
  app/[...link]/       short-link resolver (catch-all, keep it last)
  app/og/              OpenGraph image route
  app/svg/             SVG card route + dev-only /svg/preview
  components/
    diagrams/          isometric engine (iso.tsx) and every scene drawn with it
    shared/            header, footer, quick menu, command palette, doodles, logo + mascot, OG card
    engagement/        comment and guestbook panels
    layouts/           page, blog, and hero shells
    ui/                shadcn primitives
  hooks/               client hooks (draggable, engagement anchor, …)
  lib/                 db, schema, auth shims, and everything not React
  lib/svg/             SVG card templates, primitives, loaders, fonts shared with /og
```

---

## Commands

```bash
pnpm dev          # dev server — http://localhost:3000
pnpm build        # next build
pnpm start        # production server
pnpm types:check  # fumadocs codegen + next typegen + tsc --noEmit
pnpm lint         # ESLint
pnpm test         # Vitest
pnpm test:watch   # Vitest, watching
pnpm knip         # unused code/dependency check

pnpm db:migrate   # apply committed migrations
pnpm db:push      # push schema directly (dev only — skips migrations)
pnpm db:studio    # Drizzle Studio
pnpm db:seed:guestbook          # seed fake guestbook entries
pnpm db:seed:guestbook:cleanup  # remove seeded entries
pnpm db:seed:links              # seed short links
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs `types:check` and `test` on every push to `master` and every PR, with a read-only token. Lint and knip are local-only for now.

---

## Writing a post

Drop an `.mdx` file in `content/blog/`. The filename is the slug. Frontmatter is validated by [`source.config.ts`](source.config.ts):

```yaml
---
title: Judul Postingan
description: Satu-dua kalimat. Dipakai juga untuk OG image, RSS, dan meta description.
date: 2026-10-16
tags:
  - Web
  - TypeScript
lastModified: 2026-10-20   # optional — isi manual saat edit layak diumumkan
---
```

`lastModified` is deliberately manual. It used to come from git history, but shallow clones on the deploy host re-dated every post on every push. Reading time is computed at build time by a remark plugin.

`<TypographyMark>` and `<TypographyMuted>` are available in every post without an import. Video goes through the media player in `src/components/ui/media-player.tsx`, imported at the top of the post.

Every post gets an isometric cover. Give it a bespoke scene by adding the slug to `covers` in [`src/components/diagrams/blog-covers.tsx`](src/components/diagrams/blog-covers.tsx); anything without one gets a block cover generated from the slug.

---

## Admin

`/admin` is gated on `OWNER_USER_ID` matching the signed-in OAuth user. There's no role system, just the one ID. It gives you stats, blog post management (create/edit/delete, category, tags, optional English version), project CRUD with ordering and stack picker, comment and guestbook moderation (pin, soft delete), short-link management, visitor stats, and a button to bust the cached resume PDF. Without OAuth configured, `/admin` redirects to `/`.

---

## Short links

Any unclaimed path resolves through `/[...link]`, in one of two shapes:

```
/<slug>          →  tag = "" (the default bucket)
/<tag>/<slug>    →  namespaced, e.g. /talk/react-meetup
```

Slugs are unique per `(tag, slug)`. Each link can redirect straight through (permanent or temporary), or, if it has a title, description, or OG image, render an interstitial with preview metadata first. Clicks are counted in `after()` so the redirect isn't waiting on the write.

Set `SHORTLINK_DOMAIN` to serve the same links from a second, shorter domain pointed at this deployment. [`src/proxy.ts`](src/proxy.ts) lets slugs through on that host and sends anything that belongs to the main site (`/blog`, `/admin`, `/api`, …) to the main domain with a 308. The list of main-site paths lives in [`src/lib/reserved-segments.ts`](src/lib/reserved-segments.ts), so add new top-level routes there too. Requires the `links`/`link_slugs` tables (i.e. `DATABASE_URL` + migrate).

---

## SVG cards

`/svg` renders cards for GitHub READMEs from the site's own data, tokens, and fonts. Each response is a static SVG with its text drawn as glyph outlines, so GitHub's image proxy shows exactly what the site renders.

```
GET /svg?type=<template>&theme=light|dark&v=<n>&<template options>
```

| Param   | Notes                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------- |
| `type`  | Required. One of the templates below. Anything else returns an error card with status 400.               |
| `theme` | Required. `light` or `dark`. The SVG can't follow the viewer's theme, so the README picks one with `<picture>`. |
| `v`     | Ignored by the server. Bump it in the README to bust GitHub's image cache after a design change.         |

| `type`          | Shows                                                       | Options                                                                                   |
| --------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `banner`        | The name header: photo in a notched frame, name, domain, role pill. Transparent, so it sits on GitHub's canvas | `role` (up to 24 characters, defaults to `siteConfig.role`) |
| `heading`       | A numbered section heading                                  | `n` (1–99), `title` (optional, cut at 40 characters) |
| `post`          | The newest post: title, description, date, reading time and tags | `slug` (defaults to the newest post)                                                 |
| `activity`      | When I code: a weekday × hour grid in local time            | `source=github\|wakatime\|both` (default `github`)                                        |
| `calendar`      | The last 12 months of contributions, with streaks and best day | none                                                               |
| `posts`         | The newest posts with reading time, reads and date          | `limit` (1–8, default 3)                                                                  |
| `guestbook`     | The latest guestbook signatures with avatars and the total  | `limit` (1–6, default 3)                                                                  |
| `local`         | Time/weather/daylight for any place (geocoded, Open-Meteo, no key needed) | `city` + optional `country`, or `lat` + `lon`; `units=c\|f` (default `c`) |
| `resume`        | The latest résumé build and downloads per release           | none                                                                                      |

In a README:

```html
<a href="https://ajoroby.is-a.dev/blogs/latest">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://ajoroby.is-a.dev/svg?type=post&theme=dark&v=1">
    <img src="https://ajoroby.is-a.dev/svg?type=post&theme=light&v=1" width="100%" alt="Latest post on ajoroby.is-a.dev">
  </picture>
</a>
```

- [`src/app/svg/route.tsx`](src/app/svg/route.tsx) reads `type`, finds the template in [`src/lib/svg/registry.ts`](src/lib/svg/registry.ts), validates options with zod, loads data, renders with takumi's `renderSvg()`.
- Each template is one file in [`src/lib/svg/templates/`](src/lib/svg/templates/). Templates never fetch and loaders never render; loaders live in [`src/lib/svg/data/`](src/lib/svg/data/) and are cached with `unstable_cache`.
- [`/svg/preview`](http://localhost:3000/svg/preview) renders every template's fixtures in both themes. It only exists in development.
- Adding a card means one file in `templates/` exporting `defineTemplate({ params, size, load, revalidate, fixtures, render })`, plus one line in the registry.

---

## The art

None of the illustrations are image exports. They're all drawn in code:

| Piece                         | Where                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| Isometric engine              | [`src/components/diagrams/iso.tsx`](src/components/diagrams/iso.tsx): projector, boxes, plates, labels, lifts |
| Page scenes and blog covers   | `page-art.tsx`, `blog-covers.tsx`, `git-chaos.tsx`, `layers.tsx` in the same folder         |
| Doodles and nudges            | [`src/components/shared/doodles.tsx`](src/components/shared/doodles.tsx)                    |
| Logo and mascot               | `logo.tsx`, `logo-icon.tsx`, `logo-mascot.tsx` in `src/components/shared/`                  |
| OpenGraph card                | [`src/components/shared/OG.tsx`](src/components/shared/OG.tsx), rendered by `/og`           |

Colours come from the tokens in [`src/app/global.css`](src/app/global.css). The OG route runs on the server, where CSS variables don't exist, so [`src/lib/theme-tokens.ts`](src/lib/theme-tokens.ts) resolves `var()` and `color-mix()` from that file into hex.

The engine is MIT. The expressive artwork produced with it is CC BY-NC-ND 4.0. See [License](#license).

---

## Deploy

Target: Vercel, project `robyajo-portfolio`.

- Production: [ajoroby.is-a.dev](https://ajoroby.is-a.dev) (+ `robyajo-portfolio.vercel.app`)
- Framework preset: **Next.js** — dipin via [`vercel.json`](vercel.json) (`"framework": "nextjs"`). Jangan sampai preset Astro era lama aktif lagi (build lolos tapi deploy gagal `STATIC_BUILD_NO_OUT_DIR`).
- The build runs `next build` only. It never migrates, so run `pnpm db:migrate` against the production database yourself when the schema changes.
- Tanpa env vars, build & runtime tetap jalan (fitur DB/auth degradasi, lihat di atas).
- Jika `SHORTLINK_DOMAIN` dipakai, tambahkan domain itu ke project Vercel yang sama, atau proxy tidak akan melihat request-nya.
- Remote image host baru harus ditambahkan ke `images.remotePatterns` dan CSP di [`next.config.mjs`](next.config.mjs).

---

## TODO rebrand (sisa identitas template)

- [ ] `content/blog/*` — 4 postingan masih milik penulis template; tulis ulang/hapus
- [ ] Logo & maskot (`logo.tsx`, `logo-icon.tsx`, `logo-mascot.tsx`), `public/favicon-*.svg`, `public/profile.avif`
- [ ] Artwork README `.github/banner-*.svg`, `.github/license-*.svg`
- [ ] `LICENSE.md` — masih atas nama penulis template; putuskan lisensi repo ini
- [ ] `src/app/(site)/privacy-policy/page.tsx` — tulis sesuai setup sendiri
- [ ] Cek lisensi `public/fonts/LastoriaBoldRegular.otf` sebelum dipakai produksi
- [ ] Upload resume PDF ke GitHub release repo ini (`siteConfig.resumeURL`)

---

## License

Code is [MIT](LICENSE.md), including the code blocks in this README and in blog posts. The prose and artwork (including artwork drawn in code) are [CC BY-NC-ND 4.0](LICENSE.md). [`LICENSE.md`](LICENSE.md) spells out where the line falls. None of it licenses the owner's name, likeness, or brand identity for use as your own.

---

## Kontak pemilik

- GitHub: [robyajo](https://github.com/robyajo)
- LinkedIn: [robykartis](https://id.linkedin.com/in/robykartis)
- Instagram: [@roby_karti](https://www.instagram.com/roby_karti)
- Web: [robyajo.fyi](https://robyajo.fyi)
- Email: robyfull.dev@gmail.com
