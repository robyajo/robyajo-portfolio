# robyajo-portfolio

Personal software developer portfolio — Astro.

- Production (custom domain): https://ajoroby.is-a.dev/
- Vercel preview/production: https://robyajo-portfolio.vercel.app/

## 🚀 Project Structure

```text
/
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src
│   ├── assets
│   ├── components
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
├── astro.config.mjs  # site: https://ajoroby.is-a.dev
└── vercel.json
```

Site URL (`astro.config.mjs`) memakai custom domain `https://ajoroby.is-a.dev` agar canonical/OG/sitemap konsisten. Domain Vercel tetap aktif dan diarahkan ke deployment yang sama.

## 🧞 Commands

| Command                   | Action                                       |
| :------------------------ | :------------------------------------------- |
| `pnpm install`            | Installs dependencies                        |
| `pnpm dev`                | Starts local dev server at `localhost:4321`  |
| `pnpm build`              | Build your production site to `./dist/`      |
| `pnpm preview`            | Preview your build locally, before deploying |
| `pnpm astro ...`          | Run CLI commands like `astro add`, `astro check` |

## Domain setup

1. Vercel Dashboard → Project → Settings → Domains → tambahkan `ajoroby.is-a.dev`.
2. Verifikasi TXT bila diminta (lihat `_vercel.ajoroby.json`).
3. DNS di repo `is-a-dev/develop` (`domains/ajoroby.json`) mengarah ke Vercel.
