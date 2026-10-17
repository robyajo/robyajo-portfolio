# Gaya & Suara — blog `ajoroby.is-a.dev`

Disusun dari 4 artikel yang ada di `content/blog/`. Tujuannya: artikel baru terasa
ditulis orang yang sama, bukan hasil mesin.

## Identitas penulis

- Pemilik situs: `siteConfig.name` di `src/lib/config.ts` (Roby Karti S.),
  fullstack developer dari Pekanbaru, Indonesia.
- Bidang & minat: layanan digital skala kota (SuperApp, dasbor, sistem
  perpajakan), TypeScript/React/Next.js, Laravel, Go, keamanan, data.
- Artikel ditulis orang pertama ("I", "my"), pengalaman nyata, tanpa
  membesar-besarkan pencapaian.
- **Jangan** memakai identitas pemilik template lama (mis. "Anish Shobith P S",
  konteks India/RCB) untuk artikel baru.

## Anatomi artikel (contoh nyata)

Contoh pembuka yang khas (dari artikel RCB):

```mdx
> Satu paragraf disclaimer/authorship bila topik sensitif — ditulis apa adanya,
> jujur soal batasan, tanpa membela diri.

## Bagian pertama yang langsung ke inti

Paragraf dengan <TypographyMark>fakta kunci atau tanggal</TypographyMark> dan
tautan sumber untuk setiap klaim eksternal.
```

Contoh catatan samping (dari artikel emoji):

```mdx
<TypographyMuted as="span">
Post ini merujuk emoji dari Unicode 14.0–15.1 (2021–2023). Penjelasan singkat
konteks yang pembaca butuh untuk memahami isi.
</TypographyMuted>
```

Contoh tab kode lintas platform (dari artikel resume):

```mdx
<Tabs groupId="os" items={['macOS', 'Linux', 'Windows']} persist>
  <Tab value="macOS">
    ```bash
    brew install exiftool
    ```
  </Tab>
  <Tab value="Linux">
    ```bash
    sudo apt install libimage-exiftool-perl
    ```
  </Tab>
</Tabs>
```

## Pola kalimat

- Kalimat pendek–sedang. Satu ide per kalimat.
- Angka dan waktu spesifik: `4:00am`, `3:30pm`, `28.000 penonton`, `₹3,750`.
- Sebutkan jumlah iterasi/pengorbanan bila relevan ("45 menit hilang", "dua jam
  tidur"). Kejujuran soal kegagalan itu bagian dari suara penulis.
- Mulai bagian dengan pernyataan, bukan pertanyaan retoris.
- Setiap klaim teknis diikuti *kenapa* itu penting bagi pembaca.

## Yang dilarang

| Dilarang | Alasan |
| --- | --- |
| Emoji di badan teks (kecuali artikel memang tentang emoji) | Mengurangi kredibilitas, ada aturan gaya situs |
| "In today's fast-paced world", "delve", "tapestry", "game-changer", "unlock the power" | Frasa AI klise, langsung terasa mesin |
| Superlatif kosong ("luar biasa", "revolusioner") tanpa bukti | Isi kosong |
| Judul clickbait ("Anda tidak akan percaya…") | Menurunkan kepercayaan & kualitas SEO |
| Klaim angka/peristiwa tanpa tautan sumber | Bisa salah, merusak reputasi situs |
| Menulis pengalaman yang tidak terjadi | Kejujuran adalah inti gaya ini |
| Struktur heading lebih dalam dari `###` | Konsisten dengan 4 artikel yang ada |

## Checklist mutu (periksa sebelum menyerahkan)

- [ ] Pembuka 2–4 paragraf, langsung menohok, ada satu detail konkret.
- [ ] Setiap bagian `##` punya satu pesan utama.
- [ ] `TypographyMark` dipakai hemat: hanya fakta/angka/keputusan kunci.
- [ ] Semua klaim eksternal punya tautan.
- [ ] Ada bagian penutup personal dan satu kalimat penutup yang menonjol.
- [ ] 1.500–3.500 kata; tidak ada bagian yang bisa dihapus tanpa kehilangan isi.
- [ ] Tidak ada frasa AI klise, tidak ada emoji, tidak ada klaim tanpa sumber.
- [ ] Slug tidak diubah, tidak memuat tanggal.

## Integrasi situs

- Waktu baca otomatis (`remarkReadingTime`) — jangan tulis manual.
- Cover otomatis per slug; tambahkan skene khusus di `blog-covers.tsx` hanya bila
  ingin ilustrasi sendiri.
- Halaman daftar (`/blogs`) mengurutkan dari `date` terbaru; `tags` tampil di kartu.
- `lastModified` di frontmatter memunculkan "Diperbarui <tanggal>" di halaman artikel.
- Sitemap, RSS (`/feed.xml`), dan gambar OG mengikuti otomatis setelah berkas ada.
