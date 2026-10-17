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

⚡ Protokol Catatan Rilis: 1 Berkas JSON Per Hari

Setiap penambahan fitur atau perbaikan bug yang **dirasakan pengguna** harus dicatat di direktori `releases/` dengan aturan:

### Aturan Konsolidasi Harian (1 JSON Per Hari)

1. **Periksa Tanggal Hari Ini**: Cek apakah berkas `releases/YYYY-MM-DD-*.json` sudah ada.
2. **Jika SUDAH ADA**:
    - **JANGAN** membuat berkas baru!
    - Buka berkas tersebut dan tambahkan poin baru ke dalam array `items: [...]`.
    - Perbarui ringkasan `title` dan `body` harian secara terpadu.
    - Naikkan `type` jika terdapat kategori yang lebih tinggi (`important` > `feature` > `fix` > `improvement`).
3. **Jika BELUM ADA**:
4. **Format Dwibahasa (`id` & `en`)**:
    - Wajib menyertakan `id` (Bahasa Indonesia) dan `en` (Bahasa Inggris) untuk `title`, `body`, dan tiap elemen dalam `items`.
5. **Wajib Bahasa Publik & Bebas Istilah Teknis Internal (Security-Safe & Citizen-Facing)**:
    - **DILARANG KERAS** menuliskan istilah teknis arsitektur inti, nama library/package pihak ketiga, nama framework, database, middleware, nama file kode sumber, atau mekanisme internal (seperti _Prisma, Arcjet, Security Guard, Tiptap, CSRF, CSP, Next.js, React, Turbopack, Zod, TanStack, rate limiter, deepmerge, dsb._) di dalam berkas rilis.
    - **Tujuan Keamanan**: Mencegah pihak luar menganalisis atau menebak struktur komponen internal dan potensi celah keamanan sistem dari catatan rilis publik.
    - **Orientasi Pelayanan Warga**: Seluruh `title`, `body`, dan butir `items` wajib dirumuskan sebagai **pemberitahuan pelayanan publik** yang ramah, sopan, dan berfokus pada dampak langsung bagi masyarakat (misalnya: kemudahan pengurusan berkas, kecepatan buka halaman, penghematan kuota ponsel, dan perlindungan kerahasiaan data warga).

---

## Blog (content/blog)

Setiap permintaan menulis, mengedit, atau menghapus artikel blog wajib memakai skill
`.agents/skills/blog-writer/SKILL.md` (gaya & suara di
`.agents/skills/blog-writer/reference/voice-and-style.md`, kerangka di
`templates/post.mdx`). Ringkas: berkas MDX baru di `content/blog/<slug>.mdx`
(slug kebab-case tanpa tanggal), frontmatter wajib `title`/`description`/`date`
(+`tags`, `lastModified` bila menyunting artikel lama), komponen MDX terbatas pada
`src/mdx-components.tsx` (`TypographyMark`, `TypographyMuted`, `Tabs`/`Tab`,
`MediaPlayer` via impor), validasi `pnpm types:check` + `pnpm build`, lalu verifikasi
`/blog/<slug>`, `/blogs`, `sitemap.xml`, dan `feed.xml`. Artikel yang ada saat ini
berasal dari pemilik template lama — jangan meniru identitasnya.

Artikel blog baru adalah halaman yang dilihat pengguna, jadi tetap wajib dicatat
di `releases/` sesuai protokol di atas dan disinkronkan lewat skill `activity-sync`.
