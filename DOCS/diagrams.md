# Membuat Diagram Isometrik Sendiri

Aplikasi ini memakai dua mesin diagram. Untuk karya orisinal, pakai **mesin
sederhana** — 10 menit sudah bisa membuat scene seperti `roby-stack.tsx`.

## 1. Mesin sederhana (`src/components/diagrams/iso.tsx`)

Satu-satunya yang perlu dipahami: **proyektor** mengubah koordinat 3D `[x, y, z]`
menjadi titik 2D di layar (sudut isometrik 30°).

```tsx
import { IsoBox, project, projector } from "./iso";

const p = projector(4.2, 170, 138); // (skala, titik-tengah-x, titik-tengah-y)

// Balok 3D di posisi [x, y, z] berukuran [lebar, dalam, tinggi]
<IsoBox p={p} at={[0, 0, 0]} size={[40, 26, 6]} tone="default" />
```

- `at` = sudut kiri-depan-bawah balok. `size` = `[w, d, h]`.
- Menumpuk ke atas = naikkan `z` (`0 → 9 → 18`).
- `tone`: `"default"` (abu, ikut tema), `"accent"` (warna brand),
  `"ghost"` (garis putus transparan, untuk bayangan/rencana).

### Memberi label

Cari titik tengah permukaan atas, proyeksikan, tulis teks biasa (tetap
horizontal, tidak dimiringkan — seperti label di `git-chaos.tsx`):

```tsx
const [x, y] = project(p, [W / 2, D / 2, z + H]);
<text x={x} y={y - 10} textAnchor="middle" fontSize="11" className="fill-foreground">
  {label}
</text>
```

### Animasi siap pakai (`classes.ts`)

- `isoTwinkle` — titik berkelip (bintang/partikel). Atur `animationDelay` negatif acak.
- `isoType` — gaya font label diagram (`font-pixel uppercase`).
- `gitDraw` / `gitPop` / `gitFade` — garis yang "digambar", titik yang "muncul", fade masuk. Butuh `style={{ "--git-delay": "400ms" }}`.
- `isoRipple` — lingkaran berdenyut.

Warna yang sadar-tema: `fill-foreground`, `fill-muted-foreground`,
`fill-(--brand)`, `stroke-(--brand)`. Jangan tulis kode warna mentah
(aturan lint `shadcn/no-raw-colors`).

## 2. Contoh lengkap: `roby-stack.tsx`

Tiga slab (`Neon Postgres` → `Next.js` → `React`) + tiga partikel berkelip.
Pola yang bisa didaur ulang untuk scene lain:

1. Definisikan data (`SLABS`) — bukan markup campur logika.
2. Satu `projector` untuk seluruh scene (semua balok konsisten).
3. Label = `project()` + `<text>`.
4. Bungkus `<svg viewBox>` + `aria-label` untuk aksesibilitas.

Memakainya di halaman mana pun:

```tsx
import { RobyStack } from "@/components/diagrams/roby-stack";
<RobyStack className="mx-auto max-w-md" />
```

## 3. Mesin lengkap (`src/lib/iso/`)

Untuk animasi kompleks (maskot 3D, sampul blog bergerak): scene didefinisikan
sebagai data (`Scene`: `body` SVG + `css` keyframes yang disampling saat
build) di `src/lib/iso/scenes/*.ts`, dirender oleh `IsoArt`. Pelajari ini
hanya bila scene sederhana sudah tidak cukup — mulai dari membaca
`screens/stairs.ts` (paling kecil) dan `figure.ts` (format `Scene`).

## 4. Aturan main

- Buat scene **orisinal** (data, label, komposisi milik Anda) — jangan menjiplak
  scene template; artwork template berlisensi CC BY-NC-ND.
- Satu file per scene di `src/components/diagrams/`.
- Selalu beri `aria-label` (atau `aria-hidden` untuk dekorasi murni).
- Hormati `prefers-reduced-motion` untuk animasi besar (lihat pola di `logo.tsx`).
