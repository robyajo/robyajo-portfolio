---
name: illos-draw
description: "ACTIVATE saat perlu menggambar, membuat, mengedit, atau menguji ilustrasi SVG animasi kustom yang serasi dengan 4 tema resmi Illos (Isometric, HUD, Shader, Interface), membuat animasi looping mulus tanpa patahan (Motion), memeriksa performa & token warna SVG (Check), serta melakukan audit visual sebelum dirilis (Review). Triggers on: gambar ilustrasi, buat ilustrasi svg, illos-draw, illos-isometric, illos-hud, illos-shader, illos-interface, illos-check, illos-motion, illos-review, ilustrasi kustom, animated svg kustom, cek svg, animasikan svg."
allowed-tools:
  - Read
  - Grep
  - Glob
  - run_command
---

# Illos Draw — Menggambar, Menganimasikan, dan Memeriksa Ilustrasi SVG

Ketika katalog Illos.dev belum memiliki ilustrasi yang persis dibutuhkan untuk konsep sistem atau fitur tertentu, skill ini membimbing proses perancangan ilustrasi SVG animasi baru dari nol agar memiliki bahasa visual, ketebalan garis, palet warna, dan dinamika gerakan yang 100% konsisten dengan standar Illos.

---

## 1. Panduan Desain Menurut 4 Tema Resmi Illos

### A. Tema Isometric (Arsitektur Sistem, API, Layanan Publik, Database)
- **Geometri & Sudut**: Menggunakan proyeksi isometrik murni dengan rasio 2:1 (kemiringan sudut sumbu 30° / arc tangen 0.5).
  - Vektor kubus / bidang atas: `polygon` dengan titik simetris `(x, y - h)`, `(x + w, y - h/2)`, `(x, y)`, `(x - w, y - h/2)`.
- **Garis & Stroke**: Garis kontur teknis tegas berbobot `1.5px` hingga `2px`, ujung garis `stroke-linecap="round"` dan sudut `stroke-linejoin="round"`.
- **Label Penjelas Teknis**: Menyertakan label garis tipis penunjuk komponen (`circle` dot `1.75px` + garis siku penunjuk teks akronim monospace atau sans teknis).
- **Warna & Bayangan**: Menggunakan gradasi kedalaman 3 sisi:
  - Sisi atas (*top face*): warna latar permukaan paling terang.
  - Sisi kiri (*left face*): tingkat gelap medium (arsir atau opacity 15-20%).
  - Sisi kanan (*right face*): tingkat gelap pekat (opacity 30-40%).

### B. Tema HUD (Dashboard Pemantauan, Telemetri, Status Jaringan, Cyber Security)
- **Estetika**: Tampilan *Heads-Up Display* / instrumen kokpit futuristik dengan nuansa garis neon kawat tipis (`1px` - `1.5px`).
- **Elemen Wajib**:
  - Grid koordinat atau garis bidik silang (*crosshairs*).
  - Skala melingkar (*arc gauges*) dan meteran desimal status (misal: `99.98%`, `RTT 14ms`, `ACTIVE`).
  - Efek kilau lembut (*soft glow*) menggunakan SVG `<filter>` sederhana `feGaussianBlur`.
- **Palet Warna**: Latar gelap/transparan dengan aksen neon cyan (`#00f2fe`), hijau emerald (`#10b981`), atau amber peringatan.

### C. Tema Shader (AI, Machine Learning, Vektor, Pemrosesan Data)
- **Estetika**: Bidang kepadatan (*density field*) garis-garis bar vertikal atau horizontal rapat layaknya layar dithered CRT / spektrum sinyal frekuensi.
- **Struktur Batang**: Rangkaian `rect` tipis berjarak teratur dengan ketinggian bervariasi sesuai distribusi data Gaussian atau sinusoidal.
- **Fokus Aksen**: Blok sorotan berwarna *teal* atau aksen kontras yang membatasi area "kluster aktif" atau "token jendela konteks" yang sedang dianalisis.

### D. Tema Interface (Fitur Produk, Form Interaktif, Kartu UI, Onboarding)
- **Estetika**: Representasi antarmuka produk datar tampak depan (*flat front-on UI*).
- **Elemen UI Nyata**: Menggunakan struktur miniatur yang presisi:
  - Bilah judul jendela dengan 3 titik pips (`circle r="3"`).
  - Sakelar toggle switch yang dapat digeser, input field dengan kursor berkedip, atau tabel dengan baris status badge.
- **Tipografi & Sudut**: Memakai radius sudut yang serasi dengan desain website (`rounded-lg` / `rx="6"` atau `rx="8"`).

---

## 2. Standar Animasi Mulus (Motion Protocol)

Animasi yang baik di Illos tidak boleh terasa patah, tersentak (*jump*), atau berhenti mendadak. Ikuti kaidah berikut:

1. **Looping Tanpa Patahan (Seamless Loop)**:
   - Keadaan pada `0%` dan `100%` harus identik.
   - Untuk elemen yang mengalir (misal paket data pada pipa atau garis putus-putus `stroke-dasharray`):
     ```css
     @keyframes flow {
       from { stroke-dashoffset: 0; }
       to { stroke-dashoffset: -24; /* kelipatan dari total dasharray (misal 12 12) */ }
     }
     ```
   - Untuk pulsa atau gelombang: gunakan fungsi pelunakan `ease-in-out` dengan siklus 3-4 detik.

2. **Dukungan CSS Transform Mandiri**:
   - Berikan aturan berikut pada elemen SVG yang diputar atau diskalakan:
     ```css
     .animated-node {
       transform-box: fill-box;
       transform-origin: center;
     }
     ```

3. **Performa & Aksesibilitas**:
   - Selalu sertakan aturan preferensi pengurangan gerakan:
     ```css
     @media (prefers-reduced-motion: reduce) {
       * {
         animation: none !important;
         transition: none !important;
       }
     }
     ```
   - Berikan variabel kendali `--illos-play: running` yang bisa dihentikan (`paused`) saat komponen berada di luar layar pengguna (*viewport*).

---

## 3. Pemeriksaan Kualitas & Kinerja (Check Protocol)

Sebelum menyematkan SVG ke dalam proyek, jalankan pemeriksaan berkas:

1. **Fleksibilitas Skala (Responsive SVG)**:
   - Wajib memiliki `viewBox="0 0 W H"` yang valid (misal `viewBox="0 0 600 400"`).
   - Jangan menyetel `width` dan `height` absolut berukuran piksel kaku tanpa `viewBox`.
   - Gunakan `className="w-full h-auto"` saat di-render.

2. **Dukungan Dark Mode & Light Mode**:
   - Gunakan `currentColor` untuk garis utama yang mengikuti warna teks tema:
     `stroke="currentColor" className="text-foreground/80"`
   - Untuk warna latar atau kartu, gunakan kelas CSS semantik Tailwind:
     `hsl(var(--card))`, `hsl(var(--muted))`, `hsl(var(--primary))`.

3. **Ukuran Berkas & Node DOM**:
   - Hindari SVG raksasa hasil export mentah editor vektor yang memuat metadata sampah (`xmlns:sketch`, `inkscape`, tag `metadata` kosong).
   - Target ukuran berkas di bawah 50 KB.
   - Sederhanakan *path* yang memiliki terlalu banyak desimal pecahan panjang (cukup 1-2 angka di belakang koma).

---

## 4. Daftar Uji Tinjau Visual (Review Checklist)

Gunakan 6 pertanyaan panduan ini saat meninjau hasil karya:

- [ ] **Makna Konsep**: Apakah ilustrasi secara jelas merefleksikan judul dan pesan bagian tersebut (bukan sekadar hiasan abstrak)?
- [ ] **Konsistensi Tema**: Apakah garis, sudut (30° untuk isometrik), dan radius sesuai dengan tema yang dipilih?
- [ ] **Kualitas Gerakan**: Saat animasi kembali ke detik awal, apakah perpindahannya mulus tanpa lompatan visual?
- [ ] **Keterbacaan Kontras**: Apakah ilustrasi tetap terlihat kontras dan nyaman dipandang pada tema gelap maupun terang?
- [ ] **Efisiensi Beban**: Apakah animasi berhenti saat tab diminimalkan atau saat scroll menjauhi elemen?
- [ ] **Aksesibilitas**: Apakah elemen luar memiliki `aria-hidden="true"` untuk gambar dekoratif, atau `role="img"` dengan `aria-label` yang deskriptif?
