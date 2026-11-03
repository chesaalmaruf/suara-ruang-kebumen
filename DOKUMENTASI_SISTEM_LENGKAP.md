# Dokumentasi Teknis Lengkap Sistem SUARA RUANG
**Sistem Pemetaan Geospasial & Pendukung Keputusan Prioritas Penanganan Hambatan Aksesibilitas Ruang Publik Kabupaten Kebumen**

Dokumen ini menjelaskan secara menyeluruh dan terperinci arsitektur sistem **SUARA RUANG** dari sisi **Frontend**, **Algoritma Inti (SPK SAW, Geospasial, Klasterisasi, Kompresi, & Sinkronisasi)**, hingga **Backend, REST API, dan Database**.

---

## Daftar Isi

1. [Gambaran Umum & Arsitektur Sistem End-to-End](#1-gambaran-umum--arsitektur-sistem-end-to-end)
2. [Struktur Direktori & Tumpukan Teknologi (Tech Stack)](#2-struktur-direktori--tumpukan-teknologi-tech-stack)
3. [Arsitektur Frontend (Dual-Portal SPA)](#3-arsitektur-frontend-dual-portal-spa)
   - [3.1 Pengendali Utama & Routing Portal (`App.tsx`)](#31-pengendali-utama--routing-portal-apptsx)
   - [3.2 Portal Publik Warga (`Citizen Portal`)](#32-portal-publik-warga-citizen-portal)
   - [3.3 Portal Pengawas Dinas PUPR (`Admin Portal`)](#33-portal-pengawas-dinas-pupr-admin-portal)
   - [3.4 Mesin Peta Interaktif Multi-Lapisan (`LeafletMapView.tsx`)](#34-mesin-peta-interaktif-multi-lapisan-leafletmapviewtsx)
   - [3.5 Fitur Aksesibilitas Inklusif (Kontras, Dikte Suara, & TTS)](#35-fitur-aksesibilitas-inklusif-kontras-dikte-suara--tts)
4. [Rincian Lengkap Algoritma Sistem](#4-rincian-lengkap-algoritma-sistem)
   - [4.1 Algoritma SPK Simple Additive Weighting (SAW)](#41-algoritma-spk-simple-additive-weighting-saw)
   - [4.2 Simulasi Matematis Perhitungan Skor Prioritas](#42-simulasi-matematis-perhitungan-skor-prioritas)
   - [4.3 Algoritma Pencarian Lokasi Hibrida & Reverse Geocoding](#43-algoritma-pencarian-lokasi-hibrida--reverse-geocoding)
   - [4.4 Algoritma Ekstraksi & Auto-Healing Wilayah/Kecamatan](#44-algoritma-ekstraksi--auto-healing-wilayahkecamatan)
   - [4.5 Algoritma Klasterisasi Spasial Geofencing (Rumus Haversine)](#45-algoritma-klasterisasi-spasial-geofencing-rumus-haversine)
   - [4.6 Algoritma Hierarki Visual Pin Peta](#46-algoritma-hierarki-visual-pin-peta)
   - [4.7 Algoritma Kompresi Citra & Ketahanan Kuota Penyimpanan Lokal](#47-algoritma-kompresi-citra--ketahanan-kuota-penyimpanan-lokal)
   - [4.8 Algoritma Rekonsiliasi Data, Isolasi Perangkat & Sinkronisasi Lintas-Tab](#48-algoritma-rekonsiliasi-data-isolasi-perangkat--sinkronisasi-lintas-tab)
5. [Arsitektur Backend, REST API & Database](#5-arsitektur-backend-rest-api--database)
   - [5.1 Server Dual-Runtime (Express Node.js & Serverless)](#51-server-dual-runtime-express-nodejs--serverless)
   - [5.2 Manajemen Koneksi MongoDB Atlas & Fallback Memori](#52-manajemen-koneksi-mongodb-atlas--fallback-memori)
   - [5.3 Spesifikasi Endpoint REST API](#53-spesifikasi-endpoint-rest-api)
   - [5.4 Skema Data Lengkap (`ReportItem` Document Model)](#54-skema-data-lengkap-reportitem-document-model)
6. [Alur Siklus Hidup Laporan dari Hulu ke Hilir](#6-alur-siklus-hidup-laporan-dari-hulu-ke-hilir)
7. [Konfigurasi Lingkungan, Build & Deployment](#7-konfigurasi-lingkungan-build--deployment)

---

## 1. Gambaran Umum & Arsitektur Sistem End-to-End

**SUARA RUANG** adalah platform pelaporan warga (*civic tech*) dan pusat kendali disposisi teknis pemerintah daerah (**Dinas Pekerjaan Umum dan Penataan Ruang / DPUPR Kabupaten Kebumen**) untuk memetakan, memverifikasi, serta memprioritaskan perbaikan hambatan aksesibilitas fasilitas publik bagi penyandang disabilitas, lansia, anak-anak, dan masyarakat umum.

Secara arsitektural, aplikasi dibangun sebagai **Full-Stack TypeScript Web Application** yang menggabungkan:
1. **Antarmuka Dua Portal (*Dual-Portal React SPA*)**: Memisahkan antarmuka pelaporan warga tanpa hambatan login (*zero-friction reporting*) di rute `/` dan ruang kendali pengawas pemerintah daerah di rute `/admin`.
2. **Mesin Penghitung Prioritas Objektif (*SAW Decision Engine*)**: Mengubah isian formulir kualitatif warga menjadi indeks urgensi kuantitatif berskala `0–100` (tanpa membebani pengguna awam dengan istilah matematis/akademis).
3. **Arsitektur Data Hibrida (*Cloud-First with Local-Resilient Fallback*)**: Menyimpan seluruh laporan secara terpusat di **MongoDB Atlas** melalui API `/api/reports`, dilengkapi *cache* tahan kuota di `localStorage`, isolasi riwayat perangkat pribadi, serta penyimpanan cadangan di memori server (*in-memory store*) apabila koneksi basis data terputus.

### Diagram Alur Arsitektur Sistem

```text
+-----------------------------------------------------------------------------------+
|                                LAPISAN FRONTEND (SPA)                             |
|                                                                                   |
|  +-----------------------------------+     +-----------------------------------+  |
|  |     PORTAL PUBLIK WARGA ( / )     |     |   PORTAL ADMIN DPUPR ( /admin )   |  |
|  | - Beranda & Peta Sebaran Publik   |     | - Login Pengawas (AdminLogin)     |  |
|  | - Form Buat Laporan 3-Tahap       |     | - Dashboard Antrean Prioritas     |  |
|  | - Lacak Laporan ( Khusus Device ) |     | - Peta Analitik & Geofencing      |  |
|  | - Dikte Suara, TTS, High Contrast |     | - Disposisi SPK, Regu TRC & Audit |  |
|  +-----------------+-----------------+     +-----------------+-----------------+  |
|                    |                                         |                    |
|                    +--------------------+--------------------+                    |
|                                         |                                         |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  |                    LAPISAN ALGORITMA & LAYANAN CLIENT                       |  |
|  | - sawCalculator.ts : Hitung Kriteria C1..C4, Normalisasi Matriks & Ranking  |  |
|  | - placeSearch.ts   : Hybrid Geocoding (Lokal + Nominatim + Photon) &        |  |
|  |                      Auto-Healing Resolusi 26 Kecamatan Kebumen / Luar      |  |
|  | - imageHelper.ts   : Kompresi Kanvas HTML5 (Maks 960px, JPEG Q=0.75)        |  |
|  | - reportService.ts : Isolasi UID Perangkat, Merge Konflik & Safe Storage    |  |
|  +--------------------------------------+--------------------------------------+  |
+-----------------------------------------|-----------------------------------------+
                                          | HTTP JSON (GET / POST / PATCH / DELETE)
                                          v
+-----------------------------------------------------------------------------------+
|                         LAPISAN BACKEND & SERVERLESS API                          |
|                                                                                   |
|  - Express Server (server.ts, Port 3000, Body Limit 10MB) / Vercel Functions      |
|  - /api/reports.ts : CRUD Laporan, Sanitasi Legacy ID, & Auto-Upsert pada PATCH   |
|  - /api/health.ts  : Diagnostik Ping MongoDB & Status Mode Penyimpanan            |
|  - /api/_lib/mongodb.ts : Normalisasi URI, Singleton Pool, & In-Memory Fallback   |
+-----------------------------------------+-----------------------------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v (Utama)                           v (Cadangan Otomatis)
        +-------------------------------+   +-------------------------------+
        |     MONGODB ATLAS CLOUD       |   |    IN-MEMORY SERVER STORE     |
        | DB: suararuang_kebumen        |   | Menyimpan state sementara     |
        | Collection: reports           |   | jika MONGODB_URI belum aktif  |
        +-------------------------------+   +-------------------------------+
```

---

## 2. Struktur Direktori & Tumpukan Teknologi (Tech Stack)

### 2.1 Tumpukan Teknologi Utama
- **Frontend Framework**: React 19 + TypeScript (Vite 8)
- **Styling & Desain**: Tailwind CSS v4 (`@tailwindcss/vite`), ikonografi `lucide-react` & *Google Material Symbols*
- **Pemetaan Geospasial**: Leaflet 1.9 (`L.map`, `L.tileLayer`, `L.layerGroup`, `L.circle`) dengan sumber peta *OpenStreetMap* (Default) dan *Esri ArcGIS World Imagery + Transportation + Places* (Satelit Hibrida)
- **Layanan Geocoding**: Basis data lokal terkurasi + *OpenStreetMap Nominatim API* + *Komoot Photon Geocoder API*
- **Aksesibilitas Suara**: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition` untuk dikte suara Bahasa Indonesia & `speechSynthesis` untuk pembacaan teks ke suara)
- **Backend Runtime**: Node.js + Express (`tsx server.ts` saat pengembangan, `node server.ts` saat produksi, serta kompatibel penuh dengan *Vercel Serverless Functions*)
- **Database Utama**: MongoDB Atlas menggunakan driver resmi `mongodb` v7.7

### 2.2 Peta Berkas Kode Sumber
```text
/
├── server.ts                         # Entry point server Express (API + Vite middleware / static dist)
├── vercel.json                       # Konfigurasi routing SPA & fungsi serverless untuk deployment Vercel
├── package.json                      # Konfigurasi skrip build, start, lint, dan dependensi
├── api/
│   ├── _lib/
│   │   └── mongodb.ts                # Pool koneksi MongoDB, normalisasi URI, & fallback memori
│   ├── health.ts                     # Endpoint GET /api/health untuk cek status koneksi database
│   └── reports.ts                    # Endpoint utama GET, POST, PATCH (dengan upsert), DELETE /api/reports
└── src/
    ├── main.tsx                      # Bootstrap React DOM
    ├── App.tsx                       # State global, router portal (/ vs /admin), & sinkronisasi lintas-tab
    ├── index.css                     # Konfigurasi Tailwind CSS & aturan tema kontras tinggi
    ├── types/
    │   └── index.ts                  # Definisi interface TypeScript (ReportItem, SawCriteria, dll.)
    ├── data/
    │   └── initialData.ts            # Konfigurasi data awal bersih & daftar ID dummy lawas yang diblokir
    ├── services/
    │   └── reportService.ts          # Klien HTTP API, isolasi laporan per perangkat, merge & kuota storage
    ├── utils/
    │   ├── sawCalculator.ts          # Implementasi penuh algoritma SPK SAW (bobot, matriks, normalisasi)
    │   ├── placeSearch.ts            # Pencarian hibrida, reverse geocoding, & ekstraksi/pemulihan kecamatan
    │   ├── imageHelper.ts            # Kompresi foto bukti berbasis Canvas HTML5 & pemformat waktu WIB
    │   └── speechHelper.ts           # Layanan Text-to-Speech (TTS) & Speech-to-Text Bahasa Indonesia
    └── components/
        ├── Header.tsx                # Navigasi atas Portal Warga + tombol aksesibilitas kontras tinggi
        ├── BottomNav.tsx             # Navigasi bawah seluler (Beranda, Buat Laporan, Lacak Laporan)
        ├── BerandaView.tsx           # Halaman utama publik, statistik, filter kecamatan, & peta sebaran
        ├── BuatLaporanView.tsx       # Formulir pelaporan 3 tahap terintegrasi peta & kompresi foto
        ├── LacakLaporanView.tsx      # Halaman pelacakan linimasa progres tiket milik perangkat pengguna
        ├── LeafletMapView.tsx        # Komponen peta interaktif (mode default/satelit, picker, geofence, GPS)
        └── admin/
            ├── AdminLogin.tsx        # Halaman otentikasi Pengawas Dinas PUPR
            └── AdminPortal.tsx       # Pusat kendali Admin (Dashboard, Peta Klaster, Tugas TRC, Audit & CSV)
```

---

## 3. Arsitektur Frontend (Dual-Portal SPA)

### 3.1 Pengendali Utama & Routing Portal (`App.tsx`)
`App.tsx` bertindak sebagai *orchestrator* tingkat atas yang mengatur:
- **Deteksi Portal Berdasarkan URL**: Memeriksa `window.location.pathname`. Jika URL memuat `/admin`, aplikasi merender **Portal Admin Dinas PUPR**; selain itu aplikasi merender **Portal Publik Warga**. Listener `popstate` menjaga sinkronisasi tombol *Back/Forward* peramban.
- **Pemisahan State Laporan Publik vs Pribadi**:
  - `reports`: Menyimpan seluruh daftar laporan publik yang sudah diurutkan oleh `rankReportsBySaw` untuk ditampilkan pada Peta Sebaran Beranda dan Portal Admin.
  - `myReports`: Menyimpan khusus laporan yang dikirim dari peramban/perangkat pengguna saat ini (`syncAndGetMyDeviceReports`), sehingga tab **Lacak Laporan** bersifat privat per perangkat namun tetap menerima pembaruan status/SPK dari Admin secara langsung.
- **Sinkronisasi Otomatis Lintas-Tab & Fokus Jendela**: Mendaftarkan event listener `focus`, `visibilitychange`, dan `storage`. Ketika Admin memperbarui status laporan di tab `/admin` (misalnya menjadi *Terverifikasi* atau *Tuntas Selesai*), tab warga `/` akan otomatis memuat ulang dan memperbarui warna pin peta serta linimasa tiket begitu tab dibuka.

### 3.2 Portal Publik Warga (`Citizen Portal`)
Dirancang dengan pendekatan *mobile-first* (lebar optimal kolom tengah `max-w-md`) agar nyaman dioperasikan satu tangan di lapangan:
1. **Beranda (`BerandaView.tsx`)**:
   - Menampilkan ringkasan jumlah laporan aktif, dalam pengerjaan, dan selesai diperbaiki.
   - Menyediakan **Peta Sebaran Interaktif** dengan filter wilayah dinamis yang mengelompokkan *Wilayah dengan Laporan Masuk* (termasuk lokasi di luar Kabupaten Kebumen jika ada) dan seluruh *26 Kecamatan Kabupaten Kebumen*.
   - Menampilkan kartu daftar laporan berdasarkan urutan skor prioritas serta dokumentasi perbandingan visual **Sebelum vs Sesudah** bagi laporan yang telah diselesaikan regu TRC.
2. **Buat Laporan (`BuatLaporanView.tsx`)**:
   - **Bagian 1 — Lokasi Kejadian**:
     - Input **Nama Tempat / Fasilitas** dengan *autocomplete* pencarian hibrida (*debounce* `260 ms` dan pembatalan request lama via `AbortController`).
     - Pemilihan **Kecamatan / Wilayah** (26 kecamatan resmi Kebumen, deteksi otomatis wilayah luar Kebumen dari peta, atau opsi isi manual `Lainnya`).
     - Input **Alamat Lengkap / Patokan** yang terisi otomatis dari hasil *geocoding* atau *reverse geocoding* saat pin digeser/diketuk di peta, namun tetap bebas disunting manual.
     - **Peta Interaktif & Mode Layar Penuh**: Pengguna dapat memperbesar peta ke layar penuh, mencari lokasi langsung di atas peta layar penuh, menggeser pin `📍`, atau mengaktifkan GPS.
   - **Bagian 2 — Informasi Hambatan**:
     - **A. Kategori Ruang atau Fasilitas**: 5 pilihan kategori ruang (`Ruang Terbuka & Jalur Pedestrian`, `Gedung Layanan & Fasilitas Umum`, `Transportasi & Penyeberangan`, `Lingkungan & Gang Permukiman`, `Fasilitas Lainnya`).
     - **B. Jenis Hambatan Aksesibilitas**: Daftar hambatan berubah secara kontekstual mengikuti Kategori A, ditambah opsi tetap **Pengaduan lain** yang membuka kolom input teks manual.
     - **C. Tingkat Keparahan**: 4 tingkatan universal (`mild`, `moderate`, `severe`, `critical`) yang relevan untuk segala bentuk fasilitas fisik maupun layanan gedung.
     - **D. Kelompok yang Terdampak**: Pilihan majemuk (*multi-select*) untuk `Penyandang disabilitas`, `Lansia`, `Anak-anak`, `Masyarakat umum`, dan `Kelompok rentan lainnya`.
   - **Bagian 3 — Bukti dan Keterangan**:
     - Unggah foto langsung dari kamera ponsel (`capture="environment"`) maupun galeri foto, dikompresi otomatis sebelum dikirim.
     - Kolom deskripsi kondisi hambatan dengan tombol **Dikte Suara** serta tombol **Bacakan Ringkasan** di bilah aksi bawah.
3. **Lacak Laporan (`LacakLaporanView.tsx`)**:
   - Menampilkan daftar tiket milik perangkat pengguna dan pencarian tiket berdasarkan nomor kode `#KBM-YYYY-XXXX`.
   - Memvisualisasikan 4 tahapan progres resmi: `1. Laporan Dikirim` $\rightarrow$ `2. Verifikasi Lapangan` $\rightarrow$ `3. Sedang Dikerjakan` (lengkap dengan nomor SPK, nama regu TRC, dan persentase pengerjaan) $\rightarrow$ `4. Selesai & Terbuka Diakses` (lengkap dengan foto bukti perbaikan).

### 3.3 Portal Pengawas Dinas PUPR (`Admin Portal`)
Dirancang dengan tata letak *full-screen responsive command center* untuk layar desktop maupun tablet pengawas:
- **Otentikasi Pengawas (`AdminLogin.tsx`)**: Memvalidasi kredensial pengawas (`admin_pupr` / `kebumen2025` atau akun cadangan pengawas `admin` / `admin123`) dan menyimpan sesi pada `localStorage` (`suara_ruang_admin_auth`).
- **4 Modul Operasional (`AdminPortal.tsx`)**:
  1. **Dashboard & Antrean Prioritas**: Menampilkan kartu KPI real-time, progres penyelesaian per kecamatan, tabel antrean yang diurutkan otomatis berdasarkan **Skor Prioritas (`0–100`)**, rincian 4 komponen kriteria penilaian pada setiap tiket, serta **Panel Inspektor Tiket** untuk verifikasi satu klik dan penerbitan **Surat Perintah Kerja (SPK)**.
  2. **Peta Analitik & Geofencing**: Memetakan seluruh titik laporan berdasarkan filter kategori dan kecamatan, menggambar lingkaran *geofence* (`10m`, `20m`, `50m`), serta mendeteksi klaster laporan berdekatan untuk penggabungan disposisi SPK.
  3. **Manajemen Tugas & Regu TRC**: Mengelola penugasan 3 regu operasional (`TRC PUPR Regu A — Zona Kebumen Kota`, `TRC PUPR Regu B — Zona Barat / Gombong`, `Tim Pemeliharaan Regu C — Zona Timur / Prembun`), memperbarui progres pengerjaan (`25%`–`100%`), mengunggah foto bukti pasca-perbaikan (*after-photo*), dan menandai laporan **Tuntas Selesai**.
  4. **Audit & Rekapitulasi**: Menyusun *audit log* kronologis dari seluruh tahapan tiket yang selesai dilaksanakan serta menyediakan fitur **Unduh Laporan CSV** dan **Cetak Dokumen SPK**.

### 3.4 Mesin Peta Interaktif Multi-Lapisan (`LeafletMapView.tsx`)
Komponen peta tunggal yang melayani baik mode penentuan titik (*Picker Mode*) maupun mode pemantauan sebaran laporan (*Viewer Mode*):
- **Pemilih Lapisan Peta Ringkas (*Compact Layer Switcher*)**: Tombol berikon lapisan kecil di sudut kiri atas peta memungkinkan pergantian instan antara:
  - **Mode Default**: Peta jalan standar *OpenStreetMap* (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
  - **Mode Satelit**: Gabungan 3 lapisan (*LayerGroup*) *Esri World Imagery* (citra satelit resolusi tinggi) + *Esri World Transportation* (garis jalan raya) + *Esri World Boundaries and Places* (label nama tempat/desa), sehingga menyerupai tampilan satelit hibrida modern tanpa menutupi area peta.
- **Pelacakan Lokasi Langsung (*Live GPS Watch*)**: Menggunakan `navigator.geolocation.watchPosition` dengan `enableHighAccuracy: true` untuk menampilkan titik biru posisi pengguna beserta lingkaran radius akurasi meter secara *real-time*.
- **Penyesuaian Kamera & Ukuran Otomatis**: Menggunakan `ResizeObserver` dan `map.invalidateSize()` agar ubin peta tidak pernah terpotong saat berpindah tab atau beralih ke mode layar penuh, serta `map.fitBounds()` otomatis saat pengguna memfilter kecamatan tertentu.

### 3.5 Fitur Aksesibilitas Inklusif (Kontras, Dikte Suara, & TTS)
- **Mode Kontras Tinggi**: Mengaktifkan kelas `contrast-more` pada elemen `<html>` dan menyimpannya di `localStorage` untuk mempertegas batas antarmuka bagi pengguna *low-vision*.
- **Dikte Suara (`DictationService` pada `speechHelper.ts`)**: Membungkus `SpeechRecognition` / `webkitSpeechRecognition` dengan konfigurasi bahasa `id-ID` agar pelapor dapat mendiktekan deskripsi kerusakan tanpa mengetik panjang.
- **Pembaca Suara Bahasa Indonesia (`speakText` pada `speechHelper.ts`)**: Menggunakan `window.speechSynthesis` dengan pemilihan suara Bahasa Indonesia (`id-ID`) untuk membacakan rangkuman isian laporan sebelum dikirim.

---

## 4. Rincian Lengkap Algoritma Sistem

### 4.1 Algoritma SPK Simple Additive Weighting (SAW)
Diimplementasikan pada `src/utils/sawCalculator.ts`, metode **Simple Additive Weighting (SAW)** digunakan untuk menentukan urutan prioritas penanganan laporan secara objektif berdasarkan penjumlahan terbobot dari rating kinerja yang telah dinormalisasi pada setiap alternatif laporan.

#### A. Kriteria dan Bobot Keputusan ($W$)
Seluruh empat kriteria bersifat **Benefit** (semakin tinggi nilai dampak/risiko pada suatu kriteria, semakin tinggi urgensi penanganannya):

| Kode | Nama Kriteria Penilaian | Bobot ($w_j$) | Persentase | Sumber Input Formulir Warga |
| :--- | :--- | :---: | :---: | :--- |
| **$C_1$** | Tingkat Bahaya terhadap Keselamatan | `0.35` | **35%** | Tingkat Keparahan (C) + Faktor Bahaya Jenis Hambatan (B) |
| **$C_2$** | Dampak terhadap Aksesibilitas Difabel | `0.30` | **30%** | Basis Aksesibilitas Jenis Hambatan (B) + Delta Keparahan (C) |
| **$C_3$** | Jumlah Pengguna & Fasilitas Publik Terdampak | `0.25` | **25%** | Kategori Ruang/Fasilitas (A) + Jumlah Kelompok Rentan (D) |
| **$C_4$** | Tingkat Kerusakan / Keparahan Fisik | `0.10` | **10%** | Tingkat Keparahan (C) $\times$ Skala Fisik Jenis Hambatan (B) |
| **Total** | **Akumulasi Bobot Keputusan** | **`1.00`** | **100%** | — |

#### B. Parameter Konfigurasi Jenis Hambatan & Penanganan Seragam "Pengaduan lain"
Setiap opsi pada **B. Jenis Hambatan Aksesibilitas** memiliki tiga parameter terkalibrasi:
- `c2BaseAccess`: Dampak dasar terhadap kemandirian akses difabel (`0.80` – `0.95`).
- `c1SafetyBoost`: Penyesuaian risiko bahaya kecelakaan langsung (`-0.02` hingga `+0.07`).
- `c4PhysicalScale`: Pengali kerusakan fisik struktural permanen vs penghalang non-permanen (`0.82` – `1.06`).

**Aturan Khusus Input Manual ("Pengaduan lain"):**
Apabila pengguna memilih opsi **Pengaduan lain** (`isCustomObstacle === true`) dan mengetikkan keluhan secara manual, fungsi `calculateRawCriteria` **mengabaikan kata kunci pada teks manual** dan selalu menetapkan konstanta seragam `CUSTOM_OBSTACLE_CONFIG`:
- `c2BaseAccess = 0.88`
- `c1SafetyBoost = 0.03`
- `c4PhysicalScale = 1.00`

Dengan demikian, **apapun kalimat yang diketik pengguna pada kolom manual akan menghasilkan bobot dasar hambatan yang 100% setara dan adil** (variasi skor hanya ditentukan oleh pilihan Kategori Ruang, Tingkat Keparahan, dan Kelompok Terdampak).

Tabel parameter untuk seluruh opsi hambatan terdefinisi:

| Kategori Ruang | Jenis Hambatan | `c2BaseAccess` | `c1SafetyBoost` | `c4PhysicalScale` |
| :--- | :--- | :---: | :---: | :---: |
| **Ruang Terbuka (`public_space`)** | Trotoar rusak, berlubang, atau amblas | `0.84` | `+0.04` | `1.05` |
| | Guiding block terputus / mengelupas | `0.92` | `+0.03` | `1.00` |
| | Ramp trotoar tidak ada atau terlalu curam | `0.94` | `+0.03` | `1.00` |
| | Lubang drainase / penutup selokan terbuka | `0.88` | `+0.07` | `1.06` |
| | Jalur terhalang bollard sempit, tiang, atau PKL/parkir | `0.90` | `+0.01` | `0.85` |
| | Akses taman / alun-alun berundak tanpa jalur kursi roda | `0.91` | `+0.02` | `0.95` |
| **Gedung Layanan (`public_service`)** | Pintu masuk gedung tanpa ramp kursi roda / hanya tangga tinggi | `0.95` | `+0.03` | `0.95` |
| | Toilet khusus disabilitas tidak tersedia, terkunci, atau rusak | `0.93` | `0.00` | `0.95` |
| | Loket pelayanan / koridor gedung terlalu sempit atau tinggi | `0.90` | `-0.02` | `0.90` |
| | Tangga / selasar gedung tanpa pegangan rambat (handrail) | `0.87` | `+0.05` | `0.98` |
| | Lantai selasar licin, berundak tajam, atau tanpa penanda tunanetra | `0.89` | `+0.05` | `1.00` |
| | Area parkir khusus disabilitas tidak ada atau terhalang | `0.84` | `-0.02` | `0.82` |
| **Transportasi (`transit`)** | Halte / peron terlalu tinggi tanpa ramp naik-turun kursi roda | `0.95` | `+0.04` | `0.98` |
| | Penyeberangan jalan (zebra cross) tanpa ramp atau sinyal suara | `0.93` | `+0.07` | `0.96` |
| | Jembatan penyeberangan / akses stasiun terlalu curam | `0.92` | `+0.04` | `0.96` |
| | Jalur pemandu (guiding block) menuju halte/stasiun/terminal terputus | `0.91` | `+0.03` | `1.00` |
| | Titik turun-naik penumpang terhalang parkir liar / hambatan fisik | `0.86` | `+0.04` | `0.85` |
| | Minim penerangan & rambu informasi rute tidak ramah tunanetra | `0.88` | `+0.05` | `0.92` |
| **Permukiman (`residential`)** | Jalan lingkungan / gang permukiman berlubang parah atau amblas | `0.83` | `+0.05` | `1.06` |
| | Saluran air / gorong-gorong permukiman terbuka tanpa penutup | `0.85` | `+0.07` | `1.05` |
| | Tanjakan jalan gang terlalu curam atau licin tanpa pengaman tepi | `0.88` | `+0.06` | `1.00` |
| | Akses kursi roda & lansia di gang terhalang portal sempit / material | `0.91` | `+0.01` | `0.85` |
| | Permukaan paving / beton jalan warga pecah & bergelombang | `0.82` | `+0.03` | `1.04` |
| | Jalur warga minim penerangan & tanpa pembatas tepi rawan jatuh | `0.80` | `+0.06` | `0.94` |
| **Semua Kategori (Input Manual)** | **Pengaduan lain** *(teks manual bebas)* | **`0.88`** | **`+0.03`** | **`1.00`** |

#### C. Rumus Pembentukan Nilai Mentah Kriteria ($x_{ij}$)
1. **Jangkar Tingkat Keparahan (`severity`)**:
   - `mild` (*Ringan*): `safetyBase = 0.35`, `accessDelta = -0.14`, `physicalBase = 0.35`
   - `moderate` (*Sedang*): `safetyBase = 0.60`, `accessDelta = -0.06`, `physicalBase = 0.60`
   - `severe` (*Berat*): `safetyBase = 0.82`, `accessDelta = +0.01`, `physicalBase = 0.80`
   - `critical` (*Sangat Berat*): `safetyBase = 0.92`, `accessDelta = +0.04`, `physicalBase = 0.90`

2. **Pengali Kategori Fasilitas (`facilityMultiplier`)**:
   - `public_space = 0.90`
   - `transit = 0.88`
   - `public_service = 0.85`
   - `residential = 0.65`
   - `other = 0.55`

3. **Persamaan Empat Kriteria Mentah** (dibulatkan 3 desimal dengan fungsi pembatas $\text{clamp}(v, \min, \max)$):
   $$x_{i1} \; (C_1) = \text{clamp}\big(\text{safetyBase} + \text{c1SafetyBoost},\; 0.30,\; 0.98\big)$$
   $$x_{i2} \; (C_2) = \text{clamp}\big(\text{c2BaseAccess} + \text{accessDelta},\; 0.45,\; 0.98\big)$$
   $$\text{groupWeight} = \min\big(1.0,\; 0.40 + 0.15 \times N_{\text{kelompok}}\big)$$
   $$x_{i3} \; (C_3) = \text{clamp}\big(0.60 \times \text{facilityMultiplier} + 0.40 \times \text{groupWeight},\; 0.40,\; 0.98\big)$$
   $$x_{i4} \; (C_4) = \text{clamp}\big(\text{physicalBase} \times \text{c4PhysicalScale},\; 0.28,\; 0.96\big)$$

#### D. Normalisasi Matriks & Perhitungan Skor Preferensi Akhir ($V_i$)
Saat sekumpulan laporan $A_1, A_2, \dots, A_m$ diperingkat oleh `rankReportsBySaw(reports)`:
1. Sistem mencari nilai maksimum teramati untuk setiap kolom kriteria $j \in \{1, 2, 3, 4\}$ di antara seluruh laporan aktif:
   $$x_j^{\max} = \max\big(\max_{1 \le i \le m} x_{ij},\; 0.1\big)$$
2. Setiap elemen matriks dinormalisasi menggunakan rumus kriteria *Benefit*:
   $$r_{ij} = \frac{x_{ij}}{x_j^{\max}}$$
3. Nilai preferensi akhir $V_i$ (`totalSaw`) dihitung sebagai:
   $$V_i = (0.35 \cdot r_{i1}) + (0.30 \cdot r_{i2}) + (0.25 \cdot r_{i3}) + (0.10 \cdot r_{i4})$$
4. Seluruh laporan diurutkan menurun berdasarkan $V_i$, diberi atribut `rank = 1, 2, ..., m`, dan dikonversi ke skala tampilan `0–100` melalui `toScore100(V_i) = Math.round(V_i * 100)`.

---

### 4.2 Simulasi Matematis Perhitungan Skor Prioritas

Misalkan terdapat **2 laporan warga** yang masuk ke sistem:
- **Laporan A (`#KBM-2026-1001`)**:
  - Kategori: `public_space` (`facilityMultiplier = 0.90`)
  - Hambatan: *Lubang drainase / penutup selokan terbuka* (`c2BaseAccess = 0.88`, `c1SafetyBoost = +0.07`, `c4PhysicalScale = 1.06`)
  - Keparahan: `critical` (`safetyBase = 0.92`, `accessDelta = +0.04`, `physicalBase = 0.90`)
  - Kelompok Terdampak: 3 kelompok — Disabilitas, Lansia, Anak-anak ($N = 3$)
- **Laporan B (`#KBM-2026-1002`)**:
  - Kategori: `public_service` (`facilityMultiplier = 0.85`)
  - Hambatan: **Pengaduan lain** *(input manual: "Papan informasi ruang tunggu kurang jelas")* $\rightarrow$ menggunakan `CUSTOM_OBSTACLE_CONFIG` (`c2BaseAccess = 0.88`, `c1SafetyBoost = +0.03`, `c4PhysicalScale = 1.00`)
  - Keparahan: `moderate` (`safetyBase = 0.60`, `accessDelta = -0.06`, `physicalBase = 0.60`)
  - Kelompok Terdampak: 2 kelompok — Disabilitas, Lansia ($N = 2$)

**Langkah 1 — Hitung Nilai Kriteria Mentah ($x_{ij}$):**
- **Laporan A**:
  - $C_1 = \text{clamp}(0.92 + 0.07, 0.30, 0.98) = \mathbf{0.980}$
  - $C_2 = \text{clamp}(0.88 + 0.04, 0.45, 0.98) = \mathbf{0.920}$
  - $\text{groupWeight}_A = \min(1.0, 0.40 + 3 \times 0.15) = 0.85 \implies C_3 = (0.60 \times 0.90) + (0.40 \times 0.85) = 0.54 + 0.34 = \mathbf{0.880}$
  - $C_4 = \text{clamp}(0.90 \times 1.06, 0.28, 0.96) = \mathbf{0.954}$
- **Laporan B**:
  - $C_1 = \text{clamp}(0.60 + 0.03, 0.30, 0.98) = \mathbf{0.630}$
  - $C_2 = \text{clamp}(0.88 - 0.06, 0.45, 0.98) = \mathbf{0.820}$
  - $\text{groupWeight}_B = \min(1.0, 0.40 + 2 \times 0.15) = 0.70 \implies C_3 = (0.60 \times 0.85) + (0.40 \times 0.70) = 0.51 + 0.28 = \mathbf{0.790}$
  - $C_4 = \text{clamp}(0.60 \times 1.00, 0.28, 0.96) = \mathbf{0.600}$

**Langkah 2 — Tentukan Nilai Maksimum per Kriteria ($x_j^{\max}$):**
- $x_1^{\max} = 0.980$, $\; x_2^{\max} = 0.920$, $\; x_3^{\max} = 0.880$, $\; x_4^{\max} = 0.954$

**Langkah 3 — Normalisasi ($r_{ij}$) & Penjumlahan Terbobot ($V_i$):**
- **Laporan A**: $r_{A} = [1.000, 1.000, 1.000, 1.000] \implies V_A = 0.35(1) + 0.30(1) + 0.25(1) + 0.10(1) = \mathbf{1.000}$ $\rightarrow$ **Skor Prioritas = `100/100` (Peringkat #1)**
- **Laporan B**:
  - $r_{B1} = 0.630 / 0.980 = 0.6429$
  - $r_{B2} = 0.820 / 0.920 = 0.8913$
  - $r_{B3} = 0.790 / 0.880 = 0.8977$
  - $r_{B4} = 0.600 / 0.954 = 0.6289$
  - $V_B = (0.35 \times 0.6429) + (0.30 \times 0.8913) + (0.25 \times 0.8977) + (0.10 \times 0.6289) = 0.2250 + 0.2674 + 0.2244 + 0.0629 = \mathbf{0.780}$ $\rightarrow$ **Skor Prioritas = `78/100` (Peringkat #2)**

---

### 4.3 Algoritma Pencarian Lokasi Hibrida & Reverse Geocoding
Diimplementasikan pada `src/utils/placeSearch.ts` (`searchPlacesHybrid` dan `reverseGeocodePoint`):
1. **Pencocokan Instan Landmark Lokal (`searchLocalKebumenPlaces`)**: Memecah kata kunci menjadi token kata dan mencocokkan terhadap 34 fasilitas publik utama di berbagai kecamatan Kabupaten Kebumen (`CURATED_KEBUMEN_PLACES`) dalam waktu `0 ms`.
2. **Geocoding Primer OpenStreetMap Nominatim**: Mengirimkan kueri ke `nominatim.openstreetmap.org/search` dengan parameter `countrycodes=id`, `addressdetails=1`, dan kotak fokus Kabupaten Kebumen `viewbox=109.33,-7.42,109.86,-7.85` namun `bounded=0` (tidak dikunci paksa). Pengaturan `bounded=0` memastikan lokasi di dalam Kabupaten Kebumen mendapat prioritas teratas, sementara lokasi di luar Kebumen tetap dapat ditemukan dengan akurat.
3. **Kueri Fallback Kontekstual Kebumen**: Jika hasil primer kosong dan pengguna belum mengetikkan kata *"Kebumen"*, sistem otomatis melakukan pencarian kedua dengan menambahkan konteks `"Kebumen"` di belakang kueri.
4. **Failover ke Photon Komoot Geocoder**: Jika layanan Nominatim mengalami batas waktu atau gangguan jaringan, sistem beralih ke `photon.komoot.io/api/` berpusat pada koordinat Alun-Alun Kebumen (`lat=-7.6748, lon=109.6575`).
5. **Deduplikasi Spasial-Leksikal**: Menggabungkan hasil lokal dan OSM dengan membuang entri duplikat yang memiliki nama sama (case-insensitive) sekaligus jarak koordinat $|\Delta\text{lat}| < 0.0012^\circ$ dan $|\Delta\text{lng}| < 0.0012^\circ$ (~130 meter).
6. **Reverse Geocoding Titik Manual (`reverseGeocodePoint`)**: Saat pengguna mengetuk peta atau menggeser pin, sistem memanggil endpoint `/reverse?format=jsonv2&zoom=18&addressdetails=1` untuk mengisi otomatis nama jalan/tempat, alamat lengkap, dan kecamatan.

---

### 4.4 Algoritma Ekstraksi & Auto-Healing Wilayah/Kecamatan
Diimplementasikan pada `extractDistrictFromAddress` dan `resolveReportDistrict` (`src/utils/placeSearch.ts`) untuk menjamin akurasi filter wilayah baik di dalam **26 Kecamatan Kabupaten Kebumen** maupun di **luar Kabupaten Kebumen**:
1. **Resolusi 6 Lapis (`extractDistrictFromAddress`)**:
   - **Lapis 1 (Objek Alamat Terstruktur)**: Membaca properti `city_district`, `municipality`, `district`, `suburb`, `town`, serta `county`/`city`/`regency` dari respons JSON geocoder. Jika berada di Kabupaten Kebumen, sistem mencocokkan ke 25 kecamatan non-"Kebumen" terlebih dahulu sebelum jatuh ke `"Kebumen"` (agar string *"Kabupaten Kebumen"* tidak menutupi kecamatan asli seperti *Gombong*, *Prembun*, atau *Ayah*). Jika berada di luar Kebumen, sistem memformat label menjadi `NamaKecamatan (NamaKabupaten)` atau `Kota NamaKota`.
   - **Lapis 2 (Deteksi Kabupaten/Kota Eksternal Eksplisit)**: Mengenali pola `Kabupaten X` / `Kota X` pada teks alamat lengkap dan memproteksi kasus nama kembar (contoh: *Kecamatan Karanganyar, Kebumen* vs *Kabupaten Karanganyar*).
   - **Lapis 3 (Pola Eksplisit Kecamatan)**: Mengenali awalan `Kecamatan`, `Kec.`, `Kemantren`, `Kapanewon`, atau `Distrik`.
   - **Lapis 4 ( Penguraian Ekor Geografis Berbasis Koma)**: Memangkas segmen ekor alamat standar Nominatim (`Indonesia`, kode pos 5 digit, pulau, dan provinsi) dari kanan ke kiri untuk membaca segmen Kabupaten/Kota dan Kecamatan secara presisi meskipun tanpa kata awalan `"Kec."`.
   - **Lapis 5 & 6 (Fallback Kamus 26 Kecamatan Kebumen / Nama Kabupaten Luar)**.
2. **Pemulihan Otomatis Data Lama (`resolveReportDistrict`)**:
   - Dijalankan pada saat pembacaan, pembuatan, maupun pembaruan laporan. Apabila atribut `district` pada suatu laporan masih bernilai bawaan `'Kebumen'`, `'Lainnya'`, atau kosong, padahal teks `address` atau `placeName` memuat kecamatan lain (atau koordinat berada di luar batas geografis Kabupaten Kebumen: $\text{lat} \notin [-7.88, -7.38]$ atau $\text{lng} \notin [109.32, 109.88]$), sistem otomatis memperbaiki nilai `district` sehingga laporan langsung muncul di filter kecamatan yang tepat dan pembaruan statusnya selalu sinkron.

---

### 4.5 Algoritma Klasterisasi Spasial Geofencing (Rumus Haversine)
Pada **Portal Admin** (`src/components/admin/AdminPortal.tsx`), pengawas dapat memilih radius *geofencing* $R_{\text{geo}} \in \{10\text{ m}, 20\text{ m}, 50\text{ m}\}$. Sistem mengelompokkan laporan yang saling berdekatan menggunakan jarak permukaan bola bumi **Haversine**:

$$a = \sin^2\!\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\!\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2 R_{\text{bumi}} \arcsin\!\left(\min\big(1, \sqrt{a}\big)\right), \quad R_{\text{bumi}} = 6.371.000\text{ meter}$$

Setiap pasangan/kelompok minimal 2 laporan yang belum dikunjungi dengan jarak $d \le R_{\text{geo}}$ digabungkan menjadi entitas `SpatialCluster` (`#KBM-CLUST-01`, dst.) dengan nilai prioritas klaster sama dengan $\max(\text{totalSaw})$ anggotanya, memudahkan penerbitan satu SPK terpadu untuk titik kerusakan yang berdekatan.

---

### 4.6 Algoritma Hierarki Visual Pin Peta
Pada `LeafletMapView.tsx`, warna dan simbol pin ditentukan secara ketat oleh **status tindak lanjut terbaru**, bukan semata tingkat keparahan awal saat dilaporkan:
1. **Prioritas 1 — `status === 'completed'`**: Warna Hijau (`#005713`), simbol centang `✓` (menandakan hambatan telah tuntas diperbaiki meskipun awalnya berstatus kritis).
2. **Prioritas 2 — `status === 'in_progress' || status === 'verified'`**: Warna Biru Operasional (`#006496`), simbol pengerjaan `🛠️`.
3. **Prioritas 3 — Laporan Aktif Kritis (`status === 'submitted'` dan `severity === 'critical'` atau `totalSaw >= 0.85`)**: Warna Merah Darurat (`#ba1a1a`), simbol peringatan `⚠️` disertai animasi gelombang radar (`ping`).
4. **Prioritas 4 — Laporan Aktif Lainnya (`status === 'submitted'`)**: Warna Biru Tua (`#0f4c81`), simbol lokasi `📍`.

---

### 4.7 Algoritma Kompresi Citra & Ketahanan Kuota Penyimpanan Lokal
1. **Kompresi Foto Berbasis Canvas (`compressImageFile` di `src/utils/imageHelper.ts`)**:
   - Membaca berkas foto menggunakan `FileReader`, menghitung rasio aspek proporsional agar sisi terpanjang maksimal **`960 piksel`**, merender ulang ke elemen `<canvas>`, lalu mengekspor string Data URL `image/jpeg` dengan kualitas **`0.75`**. Ukuran foto kamera ponsel yang semula `4–8 MB` menyusut menjadi sekitar `60–140 KB` sehingga cepat dikirim ke MongoDB maupun fungsi serverless.
2. **Penyimpanan Bertingkat Anti-QuotaExceeded (`safeSaveReportsToStorage` di `src/services/reportService.ts`)**:
   - Browser membatasi `localStorage` sekitar `5 MB`. Jika penyimpanan penuh akibat akumulasi foto Base64, pembaruan status laporan bisa gagal tersimpan secara diam-diam. Fungsi `safeSaveReportsToStorage` mencegah hal tersebut melalui 3 lapis percobaan:
     - **Lapis 1**: Simpan seluruh objek laporan beserta seluruh foto secara utuh.
     - **Lapis 2 (Jika Kuota Penuh)**: Pertahankan foto penuh hanya pada tiket prioritas yang baru saja dibuat/diubah serta 3 laporan terbaru; pangkas string Base64 `data:` pada item cache lama.
     - **Lapis 3 (Darurat Kuota Ekstrem)**: Simpan seluruh metadata tiket, status terbaru, nomor SPK, kecamatan, dan linimasa tanpa string foto Base64, sehingga status penanganan laporan **dijamin 100% selalu tersimpan**.

---

### 4.8 Algoritma Rekonsiliasi Data, Isolasi Perangkat & Sinkronisasi Lintas-Tab
Diimplementasikan pada `src/services/reportService.ts`:
- **Identitas Unik Perangkat (`getOrCreateDeviceId`)**: Membuat UUID persisten (`dev_<uuid>`) pada kunci `suara_ruang_device_uid_v1`. Laporan yang dibuat dari perangkat tersebut disimpan ke `suara_ruang_my_device_reports_v1` dan ditandai dengan `reporterDeviceId`. Halaman **Lacak Laporan** hanya menampilkan laporan yang cocok dengan perangkat tersebut.
- **Penggabungan Versi Tanpa Kehilangan Status (`mergeReportVersions`)**:
  - Setiap status diberi bobot progres monotonik: `submitted = 0`, `verified = 1`, `in_progress = 2`, `completed = 3`, dilengkapi penanda waktu milidetik `updatedAt`.
  - Ketika menggabungkan data lokal dan data server:
    - Jika terhubung ke MongoDB (`syncedWithMongo === true`), server menjadi sumber otoritatif utama, namun mutasi lokal yang baru saja terjadi dalam `< 30 detik` terakhir dengan bobot status $\ge$ server tetap dipertahankan agar tidak terjadi *flicker* status mundur sesaat setelah Admin menekan tombol.
    - Jika server berjalan dalam mode cadangan lokal (`syncedWithMongo === false`), sistem memilih versi dengan `updatedAt` atau bobot status yang lebih maju.
    - Atribut foto (`photoBefore`, `photoDuring`, `photoAfter`) digabungkan secara komplementer (`base || server || local`) sehingga foto yang sempat dipangkas dari `localStorage` karena batas kuota otomatis dipulihkan dari respons server.

---

## 5. Arsitektur Backend, REST API & Database

### 5.1 Server Dual-Runtime (Express Node.js & Serverless)
Backend dirancang agar identik saat dijalankan sebagai server Node.js mandiri maupun saat di-*deploy* ke platform *serverless*:
1. **Mode Server Express (`server.ts`)**:
   - Berjalan pada port `3000` (`0.0.0.0`) dengan parser `express.json({ limit: '10mb' })` untuk menampung payload foto bukti pra/pasca perbaikan.
   - Meneruskan rute `/api/health` ke `api/health.ts` dan `/api/reports` ke `api/reports.ts`.
   - Menyediakan *error-handling middleware* khusus kesalahan jaringan database (`MongoNetworkError`, `MongoServerSelectionError`) agar server tidak pernah berhenti mendadak (*crash*).
   - Saat `NODE_ENV !== 'production'`, server memasang *middleware* Vite secara langsung (*single-port full-stack dev server*); saat `NODE_ENV === 'production'`, server menyajikan berkas hasil build dari folder `dist/` dengan fallback SPA ke `dist/index.html`.
2. **Mode Serverless (`vercel.json` + `/api/*`)**:
   - Handler di dalam `/api/reports.ts` dan `/api/health.ts` menggunakan tanda tangan standar Node HTTP `(req: IncomingMessage, res: ServerResponse)` serta parser stream mandiri `parseBody(req)`, sehingga langsung berjalan sebagai *Serverless Functions* tanpa pembungkus tambahan.

### 5.2 Manajemen Koneksi MongoDB Atlas & Fallback Memori
Diimplementasikan pada `api/_lib/mongodb.ts`:
- **Normalisasi & Auto-Encoding URI (`getNormalizedMongoUri`)**: Membersihkan tanda kutip berlebih dari variabel lingkungan `MONGODB_URI`, memisahkan bagian `user:password@host`, dan mengenkode ulang karakter khusus (seperti `@`, `:`, `/`, `%`) pada kredensial menggunakan `decodeURIComponent` $\rightarrow$ `encodeURIComponent` agar tidak terjadi kegagalan parsing URI maupun *double-encoding*.
- **Resolusi Nama Database (`getResolvedDbName`)**: Mengambil dari variabel `MONGODB_DB`, atau mengekstrak nama path dari `MONGODB_URI`, atau menggunakan default `suararuang_kebumen` dengan nama koleksi `reports`.
- **Singleton Connection Pool (`globalThis._mongoClientPromise`)**: Menyimpan instance koneksi `MongoClient` (`maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000–10000ms`, `socketTimeoutMS: 25000ms`) pada objek global agar pemanggilan API berulang menggunakan kembali koneksi yang sudah terbuka. Jika koneksi awal gagal, cache promise langsung direset (`undefined`) agar percobaan berikutnya dapat menyambung ulang.
- **Penyimpanan Cadangan di Memori (`memoryReportsStore`)**: Apabila `MONGODB_URI` belum dikonfigurasi atau cluster MongoDB sedang tidak dapat dijangkau, seluruh operasi `GET`, `POST`, `PATCH`, dan `DELETE` otomatis dialihkan ke `memoryReportsStore` di RAM server dan mengembalikan penanda `source: 'fallback'` / `'local_fallback'` agar aplikasi tetap berfungsi penuh.

### 5.3 Spesifikasi Endpoint REST API

#### 1. `GET /api/health`
Memeriksa kesehatan layanan backend dan melakukan `db.command({ ping: 1 })` ke MongoDB.
- **Respons Sukses Terhubung (`200 OK`)**:
  ```json
  {
    "status": "ok",
    "database": "connected",
    "dbName": "suararuang_kebumen",
    "provider": "MongoDB Atlas",
    "message": "Successfully connected to MongoDB database.",
    "timestamp": "2026-11-03T09:00:00.000Z"
  }
  ```
- **Respons Belum Dikonfigurasi / Degraded (`200 OK`)**: Mengembalikan `"database": "not_configured"` atau `"connection_error"` beserta pesan diagnostik tanpa memicu kegagalan HTTP 500 pada klien.

#### 2. `GET /api/reports`
Mengambil seluruh daftar laporan masyarakat.
- Menghapus otomatis dokumen sampel/dummy versi lama apabila ditemukan di koleksi (`deleteMany({ id: { $in: LEGACY_DUMMY_IDS } })`).
- Mengambil dokumen dengan pengurutan tingkat database `.sort({ 'sawScores.totalSaw': -1, createdAt: -1 })`.
- Menghapus properti internal `_id` MongoDB sebelum dikirim sebagai JSON.

#### 3. `POST /api/reports`
Menyimpan laporan baru dari warga.
- Memvalidasi keberadaan `id` tiket (`#KBM-YYYY-XXXX`).
- Menyimpan ke `memoryReportsStore` dan menjalankan `collection.insertOne({ ...newReport })` pada MongoDB (`201 Created`).

#### 4. `PATCH /api/reports`
Memperbarui status laporan, verifikasi pengawas, penerbitan SPK, penugasan regu TRC, progres pengerjaan, perbaikan nama kecamatan, maupun unggahan foto pasca-perbaikan (`photoAfter`).
- **Mekanisme Self-Healing Upsert**:
  - Pertama menjalankan `collection.updateOne({ id }, { $set: updates })`.
  - Apabila `updateResult.matchedCount === 0` (misalnya tiket dibuat saat database sempat offline sehingga hanya ada di cache lokal peramban) dan klien menyertakan cadangan objek `_fullReport`, server otomatis mengeksekusi `collection.updateOne({ id }, { $set: { ...cleanFull, ...updates, id } }, { upsert: true })`. Fitur ini menjamin **tidak ada perubahan status laporan yang gagal tersimpan** di lokasi atau kondisi jaringan apa pun.

#### 5. `DELETE /api/reports?id=<reportId>`
Menghapus tiket laporan berdasarkan parameter kueri `id` dari `memoryReportsStore` dan menjalankan `collection.deleteOne({ id: reportId })` di MongoDB.

---

### 5.4 Skema Data Lengkap (`ReportItem` Document Model)

Setiap dokumen pada koleksi `reports` mengikuti struktur TypeScript `ReportItem` (`src/types/index.ts`):

| Field | Tipe Data | Deskripsi Teknis |
| :--- | :--- | :--- |
| `id` | `string` | Nomor tiket unik berformat `#KBM-YYYY-XXXX` (contoh: `#KBM-2026-4821`). |
| `title` | `string` | Judul ringkas otomatis (`"<Jenis Hambatan> di <Nama Tempat>"`). |
| `placeName` | `string` | Nama fasilitas umum, gedung, jalan, atau patokan lokasi. |
| `address` | `string` | Alamat lengkap hasil geocoding / input warga. |
| `district` | `string` | Nama Kecamatan di Kab. Kebumen (26 kecamatan) atau label wilayah luar Kebumen. |
| `coordinates` | `{ lat: number, lng: number }` | Titik koordinat geografis presisi 5 desimal. |
| `facilityCategory` | `FacilityCategory` | `'public_space' \| 'public_service' \| 'transit' \| 'residential' \| 'other'`. |
| `obstacleType` | `string` | Label hambatan terpilih atau teks keluhan manual pengguna. |
| `isCustomObstacle` | `boolean` *(opsional)* | Bernilai `true` jika pengguna memilih opsi manual **Pengaduan lain**. |
| `severity` | `SeverityLevel` | `'mild' \| 'moderate' \| 'severe' \| 'critical'`. |
| `severityLabel` | `string` | Kalimat deskripsi tingkat keparahan universal untuk tampilan UI. |
| `impactedGroups` | `string[]` | Daftar kelompok rentan/pengguna yang terdampak oleh hambatan tersebut. |
| `description` | `string` | Keterangan detail kondisi hambatan dari pelapor. |
| `photoBefore` | `string` | String Data URL JPEG terkompresi kondisi awal hambatan. |
| `photoDuring` | `string` *(opsional)* | Foto dokumentasi saat pengerjaan berlangsung. |
| `photoAfter` | `string` *(opsional)* | String Data URL JPEG terkompresi bukti perbaikan selesai oleh TRC. |
| `status` | `ReportStatus` | `'submitted' \| 'verified' \| 'in_progress' \| 'completed'`. |
| `statusLabel` | `string` | Label status operasional (misal: `'Terverifikasi DPUPR'`, `'Tuntas Selesai'`). |
| `createdAt` | `string` | Waktu pelaporan dalam format WIB (`"03 Nov 2026 • 14:25 WIB"`). |
| `sawScores` | `SawCriteria` | Objek `{ c1Safety, c2Access, c3Users, c4Physical, totalSaw, rank }`. |
| `assignedTeam` | `AssignedTeam` *(opsional)* | Detail regu TRC (`name`, `leadOfficer`, `vehicle`, `slaHours`, `progressPercent`, `statusNote`). |
| `spkNumber` | `string` *(opsional)* | Nomor Surat Perintah Kerja resmi (`#SPK-PUPR-YYYYXXXX`). |
| `verifiedBy` / `verifiedAt` | `string` *(opsional)* | Identitas pengawas dan waktu verifikasi lapangan. |
| `completedAt` | `string` *(opsional)* | Waktu penyelesaian perbaikan dan publikasi bukti selesai. |
| `timeline` | `TimelineItem[]` | Array 4 objek tahapan (`stage 1..4`, `title`, `time`, `desc`, `completed`, `active`). |
| `reporterDeviceId` | `string` *(opsional)* | Penanda unik peramban pengirim (`dev_<uuid>`) untuk isolasi tab Lacak Laporan. |
| `localSavedAt` | `number` *(opsional)* | Epoch timestamp milidetik saat laporan dibuat di perangkat. |
| `updatedAt` | `number` *(opsional)* | Epoch timestamp milidetik pembaruan terakhir untuk resolusi konflik sinkronisasi. |

---

## 6. Alur Siklus Hidup Laporan dari Hulu ke Hilir

1. **Tahap 1 — Pengiriman Laporan oleh Warga (`submitted`)**:
   - Warga memilih lokasi di peta (atau mencari nama tempat), memilih kategori fasilitas, jenis hambatan (atau mengisi **Pengaduan lain**), tingkat keparahan, kelompok terdampak, mengunggah foto kondisi awal, lalu menekan **Kirim Laporan Sekarang**.
   - Frontend menghitung `c1Safety`, `c2Access`, `c3Users`, `c4Physical`, dan `totalSaw`, menghasilkan nomor tiket `#KBM-YYYY-XXXX`, menyimpan ke riwayat perangkat pribadi & cache publik, lalu mengirim `POST /api/reports` ke MongoDB.
   - Pin muncul di peta dengan warna merah berdenyut `⚠️` (bila kritis/skor $\ge 85$) atau biru tua `📍`.

2. **Tahap 2 — Validasi & Verifikasi Pengawas (`verified`)**:
   - Pengawas Dinas PUPR membuka `/admin`, meninjau urutan antrean prioritas tertinggi (`0–100`), memeriksa foto awal serta titik koordinat peta, lalu menekan **Verifikasi Laporan**.
   - Sistem memperbarui tahapan ke-2 pada `timeline`, mengubah status menjadi `verified` (`Terverifikasi DPUPR`), mengirim `PATCH /api/reports`, dan memperbarui ikon pin peta menjadi biru operasional `🛠️`.

3. **Tahap 3 — Penerbitan SPK & Pengerjaan Regu TRC (`in_progress`)**:
   - Pengawas memilih regu pelaksana (`Regu A`, `Regu B`, atau `Regu C`), menambahkan instruksi teknis lapangan, lalu menerbitkan **Surat Perintah Kerja (`#SPK-PUPR-...`)**.
   - Selama perbaikan berlangsung di lapangan, progres pengerjaan dapat diperbarui (`25%` $\rightarrow$ `50%` $\rightarrow$ `75%` $\rightarrow$ `100%`) dan langsung terlihat pada halaman **Lacak Laporan** di perangkat pelapor.

4. **Tahap 4 — Penyelesaian & Publikasi Transparansi (`completed`)**:
   - Setelah perbaikan fisik tuntas, pengawas mengunggah **Foto Bukti Selesai (`photoAfter`)** yang otomatis dikompresi, lalu menekan **Selesaikan & Publikasikan**.
   - Status tiket berubah menjadi `completed` (`Tuntas Selesai`), tahap ke-4 pada `timeline` aktif, tiket dikeluarkan dari penghitung hambatan aktif, pin peta berubah menjadi hijau `✓`, dan dokumentasi **Sebelum vs Sesudah** tampil transparan di Beranda Publik.

---

## 7. Konfigurasi Lingkungan, Build & Deployment

### 7.1 Variabel Lingkungan (`.env`)
```env
# URI Koneksi Cluster MongoDB Atlas (opsional saat pengembangan lokal karena tersedia fallback otomatis)
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/suararuang_kebumen?retryWrites=true&w=majority"

# Nama database target (default: suararuang_kebumen)
MONGODB_DB="suararuang_kebumen"
```

### 7.2 Perintah Eksekusi & Build (`package.json`)
- **Mode Pengembangan Full-Stack (Port 3000)**:
  ```bash
  npm run dev
  ```
  Menjalankan `tsx server.ts` yang menggabungkan REST API Express dan Vite SPA pada satu port `3000`.
- **Pemeriksaan Tipe Statis TypeScript**:
  ```bash
  npm run lint
  ```
  Menjalankan `tsc --noEmit` untuk memvalidasi seluruh tipe data frontend maupun backend.
- **Kompilasi Produksi**:
  ```bash
  npm run build
  ```
  Memaketkan aplikasi frontend ke dalam direktori `dist/`.
- **Menjalankan Server Produksi Node.js**:
  ```bash
  npm start
  ```
  Menjalankan `NODE_ENV=production node server.ts` untuk melayani API `/api/*` sekaligus berkas statis dari `dist/`.
