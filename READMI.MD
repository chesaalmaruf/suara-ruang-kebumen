# SUARA RUANG: Sistem Pemetaan Hambatan Aksesibilitas Ruang Publik di Kabupaten Kebumen

**SUARA RUANG** adalah platform partisipasi publik berbasis web yang dirancang untuk menjembatani warga Kabupaten Kebumen dengan pemerintah daerah (Dinas PUPR dan Dishub) dalam mengidentifikasi, melaporkan, dan memprioritaskan penanganan kerusakan fasilitas serta hambatan aksesibilitas ruang publik (seperti trotoar rusak, *guiding block* tunanetra terputus, atau *ramp* kursi roda curam/amblas).

Aplikasi ini menggunakan metode **Simple Additive Weighting (SAW)** untuk menentukan tingkat prioritas penanganan secara objektif, terukur, dan transparan, serta terintegrasi dengan **Map API (Leaflet & OpenStreetMap)** untuk pelacakan area (*real-time area tracking*) dan arsitektur siap Firebase.

---

## 🌐 Dua Alamat Web Terpisah (Citizen vs Admin)

Sistem memisahkan akses warga dan pengawas pemerintah melalui dua portal web mandiri:

1. **Portal Publik Warga (Citizen Portal)**
   - **Alamat Web**: `https://suararuang.kebumenkab.go.id/` (Route: `/` atau `/warga`)
   - **Akses**: Tanpa login (*zero-friction*), riwayat laporan tersimpan otomatis di *Local Storage* perangkat warga.
   - **Fitur**: Peta sebaran infrastruktur Kebumen, formulir 3 langkah pelaporan aksesibilitas dengan GPS terintegrasi, komparasi visual sebelum-sesudah perbaikan berstempel DPUPR, fitur pembaca layar suara (*Text-to-Speech*), dan pelacakan status tiket real-time.

2. **Portal Pengawas & Command Center Dinas PUPR (Admin Portal)**
   - **Alamat Web**: `https://admin-suararuang.kebumenkab.go.id/admin` (Route: `/admin`)
   - **Akses**: Dilindungi otentikasi Nama Pengguna & Kata Sandi (*Username & Password Guard*).
   - **Kredensial Default Prototipe**:
     - **Username**: `admin_pupr` *(atau `admin`)*
     - **Password**: `kebumen2025` *(atau `admin123`)*
     - *(Tersedia tombol satu-klik "Login Demo Instan" pada halaman login)*
   - **Fitur Eksekutif & Alur Kerja Real-Time**:
     - **Dashboard**: Metrik eksekutif langsung dari database, peta analitik geofencing, antrean verifikasi laporan baru, pemeringkatan prioritas SAW, penerbitan SPK, serta publikasi foto pasca-perbaikan (Sebelum vs Sesudah).
     - **Peta & Klaster**: Pengaturan radius *geofencing* (10m, 20m, 50m), pengelompokan otomatis laporan berdekatan dengan kalkulasi Haversine real-time, dan ekspor data spasial CSV.
     - **Tugas (Daftar Tugas SPK Terbit)**: Pemantauan penugasan regu TRC PUPR, pembaruan persentase progres lapangan, unggah foto dokumentasi pasca-perbaikan, dan penyelesaian tiket.
     - **Audit & Laporan**: Log jejak audit *real-time* dari riwayat lini masa setiap tiket, ringkasan tingkat penyelesaian & rata-rata skor SAW, serta ekspor laporan CSV.

---

## 🗺️ Integrasi Map API & Tracking Area Real-Time

Aplikasi telah mengintegrasikan pustaka pemetaan geospasial **Leaflet API** dengan sumber ubin *OpenStreetMap (OSM) Tile Server*:

1. **Pelacakan Area Real-Time (Live GPS Area Tracking)**:
   - Ketuk ikon **GPS / My Location** di pojok kanan atas peta untuk mengunci posisi Anda secara langsung (`navigator.geolocation.watchPosition`).
   - Peta otomatis berpusat pada koordinat Anda, menampilkan lingkaran radius akurasi GPS dan penanda berdenyut (*pulsating marker*).
2. **Geofencing Radius Spasial**:
   - Menampilkan batas lingkaran geofence transparan (10 meter, 20 meter, atau 50 meter) di sekitar titik kerusakan untuk mendeteksi laporan ganda (*duplicate reports aggregation*).
3. **Penyematan Pin Interaktif (Marker Pinning)**:
   - Pada formulir pelaporan, warga dapat mengetuk atau menggeser (*drag-and-drop*) penanda pin pada peta untuk menentukan lokasi kerusakan secara akurat.

---

## 🧮 Penjelasan Metode Perhitungan: Simple Additive Weighting (SAW)

Metode SAW mencari penjumlahan terbobot dari rating kinerja pada setiap alternatif di semua kriteria.

### Kriteria Penilaian dan Bobot ($w_j$):
| Kode | Kriteria Penilaian | Bobot ($w_j$) | Sifat Atribut |
|---|---|---|---|
| **C1** | Tingkat bahaya terhadap keselamatan | **35% (0.35)** | Benefit |
| **C2** | Dampak terhadap aksesibilitas difabel | **30% (0.30)** | Benefit |
| **C3** | Jumlah pengguna / fasilitas publik terdampak | **20% (0.20)** | Benefit |
| **C4** | Tingkat kerusakan / keparahan fisik | **15% (0.15)** | Benefit |
| **Total** | | **100% (1.00)** | |

### Rumus Matematis:
1. **Normalisasi Matriks ($R_{ij}$):**
   $$R_{ij} = \frac{X_{ij}}{\max(X_j)}$$

2. **Perhitungan Skor Akhir Prioritas ($V_i$):**
   $$V_i = \sum_{j=1}^{4} w_j R_{ij}$$

---

## 💻 Panduan Instalasi dan Menjalankan Aplikasi

### Persyaratan Sistem:
- **Node.js**: Versi 18.x atau lebih baru (disarankan LTS 20.x atau 22.x).
- **npm**: Versi 9.x atau lebih baru.
- Peramban web modern (Google Chrome, Mozilla Firefox, Safari, Microsoft Edge).

### Langkah-langkah Instalasi:

1. **Buka Terminal di Direktori Proyek**:
   ```bash
   cd /path/to/suara-ruang
   ```

2. **Pasang Dependensi Proyek**:
   ```bash
   npm install
   ```

3. **Menjalankan Server Pengembangan (Dev Mode)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan pada port 3000:
   - Portal Warga: `http://localhost:3000/`
   - Portal Admin: `http://localhost:3000/admin`

4. **Membangun Berkas Produksi (Production Build)**:
   ```bash
   npm run build
   ```

---

---

## 🍃 Integrasi Database MongoDB & Deployment ke Vercel

Aplikasi ini telah dimigrasi dengan arsitektur **Vercel Serverless Functions + MongoDB Atlas Database**:

```
[ Frontend: React 19 + Vite ] 
          │  /api/reports, /api/health
          ▼
[ Vercel Serverless Functions (Node.js runtime di folder /api) ]
          │  MongoDB Driver Connection Pool
          ▼
[ Cloud Database: MongoDB Atlas (Cluster / Database: suararuang_kebumen) ]
```

### 1. Menyiapkan MongoDB Atlas (Gratis / Free Tier M0)
1. Buka [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) dan buat akun gratis.
2. Buat Cluster baru (pilih shared M0 Free).
3. Di menu **Database Access**, buat User & Password (misal: user `admin_kebumen`).
4. Di menu **Network Access**, tambahkan IP Access List `0.0.0.0/0` (Allow Access from Anywhere) agar Vercel Serverless dapat terhubung secara dinamis.
5. Klik **Connect** -> **Drivers (Node.js)** dan salin Connection String:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 2. Konfigurasi Environment Variables Lokal (`.env.local`)
Buat berkas `.env.local` di root proyek:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="suararuang_kebumen"
```
*Catatan: Jika `MONGODB_URI` belum diisi, aplikasi otomatis menggunakan fallback LocalStorage tanpa membuat aplikasi error.*

### 3. Deploy ke Vercel
#### Opsi A: Menggunakan Vercel Dashboard (GitHub / Git) — Direkomendasikan
1. Push proyek ke repository GitHub Anda.
2. Masuk ke [Vercel Dashboard](https://vercel.com/) dan pilih **Add New Project**.
3. Import repository GitHub Anda.
4. Pada form konfigurasi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Pada bagian **Environment Variables**, tambahkan:
   - `MONGODB_URI` = connection string MongoDB Atlas Anda.
   - `MONGODB_DB` = `suararuang_kebumen`
6. Klik **Deploy**. Aplikasi beserta Serverless Function `/api/reports` dan `/api/health` akan langsung online!

#### Opsi B: Menggunakan Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```
Saat deploy, masukkan environment variable `MONGODB_URI` dan `MONGODB_DB` di dashboard Vercel.

---

*SUARA RUANG — Sistem Informasi Aksesibilitas Terpadu Kabupaten Kebumen.*

