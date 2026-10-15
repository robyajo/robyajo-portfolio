# Setup PC Baru — copy-paste siap pakai

> Jalankan blok per blok sesuai urutan. Semua secret diambil otomatis lewat CLI
> setelah login — tidak ada yang perlu diketik manual. Estimasi: ±10 menit.

## 0. Prasyarat (sekali per PC)

```bash
node --version   # butuh v22+
corepack enable
npm i -g neon@latest
```

## 1. Clone + install

```bash
git clone https://github.com/robyajo/robyajo-portfolio.git
cd robyajo-portfolio
pnpm install
```

## 2. Login layanan (browser terbuka sekali tiap layanan)

```bash
npx vercel login
neon login
```

## 3. Tautkan project + tarik env

```bash
npx vercel link --yes --project robyajo-portfolio
npx vercel pull --yes --environment preview
```

Lalu isi kunci NextAuth di `.env.local` (tidak ikut pull karena secret lokal):

```bash
# Buat secret sesi:
openssl rand -hex 32   # salin ke NEXTAUTH_SECRET di .env.local
```

Daftarkan OAuth provider (salah satu/cukup keduanya) lalu isi ID+secret-nya di
`.env.local` — panduan per provider ada di `.env.example`:

- GitHub: Settings > Developer settings > OAuth Apps (callback: `http://localhost:3000/api/auth/callback/github`)
- Google: console.cloud.google.com > Credentials (callback: `http://localhost:3000/api/auth/callback/google`)

Cek `.env.local` terisi variabel inti (nilai tersembunyi = benar):

```bash
grep -oE "^[A-Z_0-9]+=" .env.local | sort -u
# Harus tampil: DATABASE_URL, IP_HASH_SALT, NEXTAUTH_SECRET (+ NEXTAUTH_URL)
```

> Catatan: `neon login` di atas hanya untuk kebutuhan CLI. `DATABASE_URL` tidak
> perlu diambil manual — kuncinya: kalau suatu saat butuh string koneksi langsung:
> `neon connection-string --project-id falling-river-69990935 --branch production --database-name db_ajoroby --pooled`

## 4. Database (sekali saja — lewati jika sudah pernah migrate)

```bash
pnpm db:migrate
```

## 5. Jika pnpm protes soal build script

```bash
pnpm approve-builds core-js
```

## 6. Jalan!

```bash
pnpm dev   # http://localhost:3000
```

## 7. Verifikasi cepat

```bash
pnpm build   # wajib lolos sebelum push
pnpm test    # 171 test
```

---

### Referensi ID (tidak rahasia)

| Layanan | ID |
|---|---|
| Neon org / project / branch / db | `org-dawn-leaf-80546672` / `falling-river-69990935` / `production` / `db_ajoroby` |
| Auth | NextAuth v4, OAuth GitHub/Google langsung (tanpa perantara) |
| Vercel project | `robyajo-portfolio` (team `roys-projects-393b79bd`) |
| Repo | `https://github.com/robyajo/robyajo-portfolio` (branch `master`) |
