# Jalansukses

Website company profile PT Jalan Sukses Amanah dengan HTML, CSS, dan JavaScript. Repo ini memakai versi statis sesuai pilihan pemilik project. PHP, MySQL, login admin, dan CMS merupakan aplikasi lokal terpisah dan tidak disertakan.

Repo awal berisi prototipe satu halaman pada `compro_jalansukses/`. Paket HTML dari arsip lokal project yang sama melengkapi halaman profil, layanan, artikel, dan kontak. Source website sekarang berada di `public/`; prototipe awal tetap tersedia dalam riwayat Git.

## Menjalankan dengan Docker

Gunakan Docker Desktop dengan Linux containers atau Docker Engine dengan Compose:

```powershell
git clone https://github.com/zalamanga/jalansukses.git
Set-Location -LiteralPath '.\jalansukses'
docker compose up -d --build
docker compose ps
```

Buka [http://127.0.0.1:18089](http://127.0.0.1:18089). Port hanya terikat ke komputer lokal. Untuk menggantinya, salin `.env.example` menjadi `.env` dan sesuaikan `APP_PORT`, atau:

```powershell
$env:APP_PORT = '18090'
docker compose up -d --build
```

Hentikan project dengan `docker compose down`. Perubahan source memerlukan build ulang. Image Nginx hanya menyajikan `public/`, berjalan sebagai pengguna `nginx`, memakai filesystem baca saja dan `/tmp` sementara. Akses berkas tersembunyi serta metode selain GET/HEAD ditolak. Project ini tidak memerlukan database, PHP, atau volume data.

## Menjalankan tanpa Docker

Python 3 dapat dipakai untuk server pengembangan lokal dari root repo:

```powershell
python tests/serve.py --port 8080
```

Buka `http://127.0.0.1:8080` dan hentikan dengan `Ctrl+C`. Helper menyajikan folder `public/` pada localhost; Python bukan bagian runtime Docker.

## Halaman dan struktur

| File di `public/` | Isi sumber |
| --- | --- |
| `index.html` | Beranda |
| `tentangkami.html` | Profil perusahaan |
| `layanan.html` | Indeks layanan |
| `layananmanajemen.html` | Konsultasi manajemen |
| `layananaplikasi.html` | Pengembangan aplikasi |
| `layananwebsite.html` | Pengembangan website |
| `layananmarketing.html` | Digital marketing |
| `berita.html` | Daftar artikel contoh |
| `artikel.html` | Artikel contoh dari arsip |
| `hubungikami.html` | Informasi kontak dan formulir nonaktif |

```text
public/
  *.html                  Halaman website
  assets/css/             Gaya per halaman dan common.css
  assets/js/main.js        Navigasi dan kontrol dropdown
  assets/img/              Media sumber yang digunakan
docker/nginx.conf         Konfigurasi server statis
tests/                    Pemeriksaan source dan browser
compose.yaml              Layanan HTTP lokal
```

CSS per halaman mempertahankan tampilan sumber. `common.css` memusatkan perbaikan navigasi, fokus keyboard, formulir nonaktif, dan penyesuaian responsif. Tidak ada proses build frontend atau dependency JavaScript pada runtime.

PNG besar dikode ulang menjadi WebP lossless untuk mengurangi ukuran transfer. Dimensi dan seluruh piksel RGBA dibandingkan dengan sumber sebelum perubahan format diterapkan. Aset yang tidak dipakai dikeluarkan dari folder website; aslinya tetap tersimpan dalam cadangan. Untuk hosting statis, gunakan `public/` sebagai document root.

## Perbaikan dan batas penggunaan

- Menu dan dropdown memakai tombol native, status `aria-expanded`, Escape, serta pengelolaan fokus saat viewport berubah. Isi menu tertutup tidak masuk urutan Tab.
- Referensi halaman yang tersedia dihubungkan kembali. Tujuan contoh yang belum tersedia ditandai nonaktif. Kartu layanan mengarah ke halaman layanan yang sesuai.
- ID, label formulir, judul halaman, bahasa dokumen, struktur heading, dan tautan lewati navigasi diperbaiki.
- Formulir kontak belum memiliki layanan penerima. Field dikunci dan diberi pemberitahuan; tidak ada pengiriman email atau penyimpanan data. `mail.php` dari arsip tidak disertakan.
- Artikel, kutipan, daftar klien, alamat dan kontak berasal dari arsip project. Materi contoh ditandai pada halaman terkait; rincian operasional dan klaim sumber belum diverifikasi sebagai informasi terkini. Artikel arsip bukan panduan hukum atau pajak terkini.
- Google Fonts dan sematan Google Maps menggunakan layanan eksternal. Font mempunyai fallback sistem. Ikon kontrol navigasi memakai CSS lokal; situs tidak memerlukan CDN ikon.
- Tautan WhatsApp mempertahankan tujuan dari sumber. Pengujian tidak membuka tautan kontak atau mengirim pesan.
- Preferensi pengurangan gerakan dihormati.

Tanpa internet, halaman dan aset lokal tetap tersedia, sedangkan font eksternal dan peta mungkin tidak dimuat. Tidak ada pengaturan domain produksi atau sitemap yang diasumsikan.

## Pengujian

Node.js 22 digunakan untuk pengujian, bukan untuk menjalankan website. Enam pemeriksaan source tidak membutuhkan dependency:

```powershell
npm test
```

Untuk pengujian browser:

```powershell
npm ci
npm run test:browser
```

Playwright menggunakan Microsoft Edge terpasang pada Windows. Pada Linux/macOS, pasang Chromium pengujian dengan `npx playwright install chromium`. `PLAYWRIGHT_CHANNEL` dapat memilih channel browser lain yang tersedia. Server Python lokal akan dijalankan otomatis.

Untuk menguji Docker yang sudah berjalan:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:18089'
npm run test:browser
```

Tes mencakup sepuluh halaman, aset dan fragmen lokal, formulir nonaktif, menu/dropdown keyboard, serta lebar 320, 390, 768, 1118 dan 1280 piksel. Koneksi eksternal dan request selain GET/HEAD diblokir selama pengujian browser. Profil browser sementara memakai `node_modules/.cache/playwright-temp` di dalam project; simpan checkout di D: untuk menempatkannya di D:.

## Sumber dan cadangan

Paket statis utama berasal dari `jsa.zip`, bagian `webbbb/web-isi-html/`. Varian `tewsas.zip` dibandingkan untuk perbaikan tautan kartu. Prototipe lain, aplikasi PHP/CMS, database, konfigurasi hosting, dan arsip mentah tetap terpisah. Seluruh input yang dipakai dicadangkan secara privat dan diverifikasi sebelum perubahan; cadangan tidak disertakan di repo publik.

Gambar, logo dan materi pihak ketiga mempertahankan kepemilikan/lisensi sumber. Repo ini tidak menambahkan klaim lisensi baru atas materi tersebut.
