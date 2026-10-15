#!/usr/bin/env bash
#
# dev.sh — bootstrap + dev server robyajo-portfolio dalam satu perintah.
#
#   ./dev.sh           cek semua, migrasi DB, lalu jalankan `pnpm dev`
#   ./dev.sh --check   hanya cek (tidak menjalankan server), untuk verifikasi
#
# Tidak menyimpan/mencetak secret apa pun. Kredensial dibaca dari `.env.local`
# yang tidak ikut git. Jika variabel belum ada, script memberi tahu cara
# mengambilnya, bukan mengisinya.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

CHECK_ONLY=0
if [[ "${1:-}" == "--check" ]]; then
    CHECK_ONLY=1
fi

say() { printf '\n==> %s\n' "$*"; }
ok() { printf '  [OK] %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

has_var() {
    # Cek variabel terisi di .env.local tanpa mengeksekusi isinya (aman untuk & dkk).
    grep -qE "^$1=.+" .env.local 2>/dev/null
}

say "1/5  Cek Node.js"
command -v node >/dev/null 2>&1 || die "Node.js tidak ditemukan. Instal Node 22+ dulu (disarankan via nvm)."
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
[[ "$NODE_MAJOR" -ge 22 ]] || die "Node v$NODE_MAJOR terdeteksi, butuh >= 22."
ok "node $(node --version)"

say "2/5  Cek pnpm"
corepack enable >/dev/null 2>&1 || true
command -v pnpm >/dev/null 2>&1 || die "pnpm tidak ditemukan. Jalankan: corepack enable"
ok "pnpm $(pnpm --version)"

say "3/5  Instal dependensi"
# core-js butuh izin build script, kalau tidak `pnpm install`/`build` gagal.
pnpm approve-builds core-js >/dev/null 2>&1 || true
pnpm install || die "pnpm install gagal."
ok "dependensi terinstal"

say "4/5  Cek .env.local"
[[ -f .env.local ]] || die ".env.local tidak ada. Buat dengan: cp .env.example .env.local lalu isi sesuai DEVELOPMENT.md bagian 4."
MISSING=()
for v in DATABASE_URL IP_HASH_SALT NEXTAUTH_SECRET; do
    if has_var "$v"; then
        ok "$v terisi"
    else
        MISSING+=("$v")
    fi
done
if [[ "${#MISSING[@]}" -gt 0 ]]; then
    die "Variabel kosong: ${MISSING[*]}. Lihat cara mengisi di DEVELOPMENT.md bagian 4 (DATABASE_URL/IP_HASH_SALT via Neon atau vercel pull; NEXTAUTH_SECRET dibuat dengan: openssl rand -hex 32)."
fi

say "5/5  Migrasi database"
pnpm db:migrate || die "db:migrate gagal. Periksa DATABASE_URL menjangkau Neon."
ok "migrasi OK"

if [[ "$CHECK_ONLY" -eq 1 ]]; then
    printf '\nSemua cek lolos. Jalankan ./dev.sh untuk menyalakan server.\n'
    exit 0
fi

say "Menjalankan dev server (http://localhost:3000)"
exec pnpm dev
