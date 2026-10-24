# SUARA RUANG: Sistem Pemetaan & Prioritas Penanganan Hambatan Aksesibilitas Ruang Publik Kabupaten Kebumen

**SUARA RUANG** adalah platform partisipasi publik berbasis web geospasial yang menjembatani masyarakat Kabupaten Kebumen dengan pemerintah daerah (**Dinas PUPR** dan **Dinas Perhubungan**) dalam mengidentifikasi, melaporkan, memetakan, serta memprioritaskan penanganan kerusakan fasilitas dan hambatan aksesibilitas ruang publik secara transparan, terukur, dan berkeadilan bagi kelompok rentan (penyandang disabilitas, lansia, anak-anak, dan pejalan kaki).

Di balik layar, sistem menggunakan model pengambilan keputusan multikriteria **Simple Additive Weighting (SAW)** yang telah diterjemahkan ke dalam **antarmuka ramah pengguna (skala 0–100 tanpa istilah teknis/akademis)**, dipadukan dengan **Peta Interaktif Leaflet & OpenStreetMap** (pencarian tempat otomatis, *reverse geocoding*, *geofencing*, dan mode peta layar penuh) serta arsitektur penyimpanan hibrida **MongoDB Atlas + Isolasi Riwayat Perangkat Lokal**.

---

## 📋 Daftar Isi

1. [Pembaruan Utama & Ringkasan Perubahan Sistem](#-pembaruan-utama--ringkasan-perubahan-sistem)
2. [Arsitektur Dua Portal (Warga vs Admin DPUPR)](#-arsitektur-dua-portal-warga-vs-admin-dpupr)
3. [Privasi & Isolasi Riwayat Laporan Per Perangkat](#-privasi--isolasi-riwayat-laporan-per-perangkat)
4. [Integrasi Peta Geospasial, Pencarian Lokasi & Mode Layar Penuh](#-integrasi-peta-geospasial-pencarian-lokasi--mode-layar-penuh)
5. [Rincian Lengkap Algoritma & Kriteria Penilaian Prioritas (SAW)](#-rincian-lengkap-algoritma--kriteria-penilaian-prioritas-saw)
   - [1. Tabel Kriteria dan Bobot Terbaru](#1-tabel-kriteria-dan-bobot-terbaru)
   - [2. Pemetaan Pertanyaan Formulir Warga ke Kriteria Model](#2-pemetaan-pertanyaan-formulir-warga-ke-kriteria-model)
   - [3. Daftar Dinamis 24 Jenis Hambatan Sesuai Kategori Ruang & Parameter Algoritma](#3-daftar-dinamis-24-jenis-hambatan-sesuai-kategori-ruang--parameter-algoritma)
   - [4. Rumus Pembentukan Nilai Mentah, Normalisasi, dan Skor Skala 0–100](#4-rumus-pembentukan-nilai-mentah-normalisasi-dan-skor-skala-0100)
   - [5. Simulasi Perhitungan Nyata (Studi Kasus)](#5-simulasi-perhitungan-nyata-studi-kasus)
6. [Panduan Instalasi & Menjalankan Aplikasi](#-panduan-instalasi--menjalankan-aplikasi)
7. [Integrasi Database MongoDB Atlas & Deployment ke Vercel](#-integrasi-database-mongodb-atlas--deployment-ke-vercel)

---

## ✨ Pembaruan Utama & Ringkasan Perubahan Sistem

Berikut adalah rincian seluruh pembaruan fitur, antarmuka, privasi perangkat, dan penyesuaian algoritma yang telah diterapkan pada sistem:

1. **Penyederhanaan Bahasa UI & Konversi Skala Skor Prioritas `0–100`:**
   - Seluruh istilah teknis metode **SAW** dihapus dari tampilan antarmuka pengguna (baik di **Portal Warga** maupun **Portal Admin**) dan diganti dengan istilah yang intuitif bagi masyarakat umum serta petugas lapangan, seperti **Skor Prioritas**, **Indeks Prioritas**, dan **Urutan Prioritas Penanganan**.
   - Tampilan angka skor prioritas pada seluruh tabel, kartu metrik, modal verifikasi, ekspor CSV, dan laporan audit di Portal Admin dikonversi dari skala desimal `0,00 – 1,00` menjadi **skala bilangan bulat `0 – 100`** (`Math.round(skor * 100)`).
2. **Pembaruan Identitas Visual (Logo Resmi):**
   - Logo utama pada bilah navigasi atas (**Header Portal Warga**) dan panel samping (**Sidebar Command Center Admin**) telah diperbarui menggunakan aset logo resmi **SUARA RUANG** (`/assets/aistudio/logo_7cbe31cf.png`).
3. **Pencarian Nama Tempat Otomatis + Auto-Pin + Fallback Tandai Manual + Mode Lebarkan Peta:**
   - Kolom **Nama Tempat / Patokan Lokasi** kini terintegrasi langsung dengan mesin pencari geospasial hibrida (Landmark Kabupaten Kebumen + *OpenStreetMap Nominatim* + *Photon Geocoder*).
   - Saat pengguna mengetik dan memilih nama tempat dari daftar saran, peta otomatis mengarahkan kamera ke titik tersebut, menancapkan pin lokasi berlabel nama tempat, serta mengisi kolom **Kecamatan** dan **Alamat** secara otomatis.
   - Jika tempat sangat spesifik/lokal dan belum terdata di peta digital, sistem menampilkan opsi **Tandai di Peta** dan **Lebarkan & Tandai** agar pengguna dapat mengetuk titik koordinat secara manual tanpa menghapus nama tempat yang sudah diketik.
   - Tersedia tombol **Lebarkan Peta** untuk membuka peta dalam **mode layar penuh (*fullscreen*)** lengkap dengan kotak pencarian lokasi di dalam peta, tombol GPS, dan bilah konfirmasi titik koordinat.
   - Lencana statis `GPS Interaktif` yang tidak diperlukan pada bagian atas peta formulir telah dihapus agar tampilan lebih bersih.
4. **Penyesuaian Bobot Kriteria Prioritas:**
   - Bobot kriteria **Fasilitas Publik & Pengguna Terdampak (`C3`)** ditingkatkan menjadi **25% (`0.25`)**.
   - Bobot kriteria **Tingkat Kerusakan / Keparahan Fisik (`C4`)** disesuaikan menjadi **10% (`0.10`)**.
   - Bobot **Keselamatan Warga (`C1`)** tetap **35% (`0.35`)** dan **Aksesibilitas Difabel (`C2`)** tetap **30% (`0.30`)**, sehingga total bobot tetap **100% (`1.00`)**.
5. **Jenis Hambatan Kontekstual & Dinamis Berdasarkan Kategori Ruang:**
   - Pilihan pada bagian **B. Jenis Hambatan Aksesibilitas** tidak lagi statis (hanya seputar trotoar), melainkan **berubah secara dinamis mengikuti pilihan pada A. Kategori Ruang atau Fasilitas** (*Ruang Publik & Terbuka*, *Fasilitas Umum & Pelayanan Dasar*, *Transportasi & Konektivitas*, serta *Kawasan Permukiman*).
   - Terdapat **24 jenis hambatan spesifik** (6 opsi per kategori ruang) dengan bobot dampak aksesibilitas, dorongan risiko keselamatan, dan skala kerusakan fisik yang dikalibrasi khusus pada algoritma perhitungan.
6. **Isolasi Riwayat "Lacak Laporan" Per Perangkat (Per-Device Storage):**
   - Diperbaiki masalah di mana laporan yang dikirim dari **Perangkat A** ikut tampil di daftar **Lacak Laporan** pada **Perangkat B** saat aplikasi di-*deploy*. Kini setiap peramban/perangkat hanya menyimpan dan menampilkan riwayat laporan miliknya sendiri di halaman **Lacak Laporan**, sembari tetap menerima pembaruan status verifikasi Admin DPUPR secara *real-time* dari database server.

---

## 🌐 Arsitektur Dua Portal (Warga vs Admin DPUPR)

Sistem memisahkan alur kerja pelaporan publik dan pengelolaan teknis pemerintah daerah ke dalam dua portal mandiri:

### 1. Portal Publik Warga (*Citizen Portal*)
- **Rute Akses**: `/` (Beranda, Buat Laporan, Lacak Laporan, Panduan & Edukasi)
- **Prinsip Akses**: Tanpa registrasi akun (*zero-friction reporting*) agar ramah bagi penyandang disabilitas, lansia, dan warga yang ingin melapor cepat di lapangan.
- **Fitur Utama**:
  - **Beranda & Peta Sebaran Publik**: Menampilkan statistik penanganan, peta titik hambatan se-Kabupaten Kebumen, pratinjau laporan publik, serta dokumentasi transparansi **Sebelum vs Sesudah** perbaikan berstempel resmi DPUPR.
  - **Formulir Pelaporan Terstruktur**: Pencarian lokasi pintar & peta layar penuh, kategori ruang & jenis hambatan adaptif, unggah bukti foto lapangan, serta pembuatan kode tiket otomatis.
  - **Lacak Laporan Pribadi**: Memantau lini masa tindak lanjut tiket yang dikirim dari perangkat pengguna tersebut (Menunggu Verifikasi $\rightarrow$ Terverifikasi $\rightarrow$ SPK Terbit / Dalam Pengerjaan $\rightarrow$ Selesai Diperbaiki).
  - **Fitur Aksesibilitas Web**: Pembaca layar suara Bahasa Indonesia (*Text-to-Speech*), pengaturan ukuran teks, dan kontras visual tinggi.

### 2. Portal Pengawas & Command Center Dinas PUPR (*Admin Portal*)
- **Rute Akses**: `/admin`
- **Keamanan**: Dilindungi otentikasi Nama Pengguna & Kata Sandi (*Username & Password Guard*).
- **Kredensial Demo Prototipe**:
  - **Username**: `admin_pupr` *(atau `admin`)*
  - **Password**: `kebumen2025` *(atau `admin123`)*
- **Fitur Eksekutif & Operasional**:
  - **Dashboard Prioritas (`0–100`)**: Pemeringkatan otomatis seluruh laporan warga dari skor tertinggi ke terendah (skala `0–100`), rincian nilai per aspek penilaian, verifikasi laporan masuk, dan penerbitan Surat Perintah Kerja (SPK).
  - **Peta Analitik & Klaster Geofencing**: Pengaturan radius *geofencing* (`10m`, `20m`, `50m`), pengelompokan laporan berdekatan menggunakan rumus jarak geospasial *Haversine*, serta ekspor data spasial ke CSV.
  - **Manajemen Tugas Regu TRC**: Pemantauan progres pengerjaan lapangan (`0% – 100%`), unggah foto bukti pasca-perbaikan, dan penutupan tiket.
  - **Audit & Rekapitulasi**: Jejak waktu (*audit trail*) setiap perubahan status tiket, rata-rata indeks prioritas daerah, dan unduh laporan evaluasi CSV.

---

## 🔒 Privasi & Isolasi Riwayat Laporan Per Perangkat

Pada lingkungan produksi (*deployed website*) yang terhubung ke MongoDB Atlas, sistem menerapkan arsitektur **penyimpanan terpisah antara Peta Publik dan Riwayat Perangkat Pribadi**:

1. **Identitas Unik Perangkat (`suara_ruang_device_uid_v1`)**:
   - Saat pertama kali membuka aplikasi, peramban warga membuat pengenal acak lokal (*Device UID*) di `localStorage` tanpa meminta data pribadi sensitif.
2. **Penyimpanan Tiket Milik Perangkat (`suara_ruang_my_device_reports_v1`)**:
   - Hanya laporan yang **dibuat dan dikirim langsung dari perangkat tersebut** yang dicatat ke dalam daftar tiket perangkat (`saveReportToMyDevice`).
   - Halaman **Lacak Laporan** hanya membaca daftar ID tiket dari penyimpanan perangkat ini, sehingga laporan warga di **Perangkat A tidak akan pernah bocor atau muncul di halaman Lacak Laporan milik Perangkat B** maupun perangkat warga lainnya.
3. **Sinkronisasi Status Real-Time dari Server (`syncAndGetMyDeviceReports`)**:
   - Meskipun daftar tiket bersifat lokal per perangkat, sistem secara otomatis mencocokkan ID tiket milik perangkat tersebut dengan data terbaru di server MongoDB (`/api/reports`).
   - Dengan demikian, ketika Admin DPUPR memverifikasi laporan, menerbitkan nomor SPK, memperbarui persentase pengerjaan, atau mengunggah foto selesai diperbaiki, perubahan tersebut langsung terbarui di halaman **Lacak Laporan** perangkat pelapor.
4. **Cache Peta Publik Terpisah (`suara_ruang_public_reports_cache_v1`)**:
   - Seluruh laporan publik di halaman **Beranda** disimpan pada ruang *cache* terpisah. Apabila warga mengetuk salah satu laporan warga lain di **Beranda**, sistem membukanya melalui **Modal Pratinjau Laporan Publik (*Read-Only*)** tanpa memasukkannya ke dalam riwayat pribadi di halaman **Lacak Laporan**.

---

## 🗺️ Integrasi Peta Geospasial, Pencarian Lokasi & Mode Layar Penuh

Modul pemetaan menggunakan **Leaflet API** di atas jaringan peta **OpenStreetMap (OSM)** dengan empat kapabilitas terintegrasi pada formulir pelaporan:

1. **Pencarian Nama Tempat Hibrida & Auto-Pin (`src/utils/placeSearch.ts`)**:
   - Saat warga mengetik nama tempat, gedung, sekolah, puskesmas, pasar, stasiun, atau jalan pada kolom **Nama Tempat / Patokan Lokasi**, sistem mencari secara simultan ke:
     - **Katalog Landmark Lokal Kabupaten Kebumen** (Alun-Alun Pancasila Kebumen, RSUD dr. Soedirman, Pasar Tumenggungan, Stasiun Kebumen, Stasiun Gombong, Terminal Bus Kebumen, Benteng Van der Wijck, kantor kecamatan, puskesmas, dll.) untuk respons instan.
     - **OpenStreetMap Nominatim Geocoding API** yang dibatasi khusus pada koordinat wilayah Kabupaten Kebumen (*bounding box* Kebumen) beserta cadangan **Photon Geocoder**.
   - Memilih salah satu hasil pencarian akan **langsung menggerakkan peta (`flyTo`)**, **menancapkan pin otomatis** lengkap dengan label nama tempat di atas pin, serta **mengisi otomatis Kecamatan dan Alamat detail**.
2. **Mekanisme Fallback Tandai Manual & Reverse Geocoding**:
   - Jika nama lokasi yang diketik warga belum terdaftar di OpenStreetMap (misalnya gang kecil atau patokan warga setempat), sistem menampilkan pemberitahuan ramah beserta tombol cepat **Tandai di Peta** dan **Lebarkan & Tandai**.
   - Ketika warga mengetuk titik di peta secara manual, sistem memanggil *Reverse Geocoding* untuk melengkapi nama jalan dan kecamatan terdekat **tanpa menimpa nama tempat/patokan** yang sudah diketik oleh warga.
3. **Fitur Lebarkan Peta (*Fullscreen Map Mode*)**:
   - Warga dapat menekan tombol **Lebarkan Peta** untuk memperbesar peta ke seluruh layar perangkat (*viewport fullscreen*).
   - Di dalam mode layar penuh tersedia bilah pencarian tempat langsung di atas peta, tombol pengunci GPS, petunjuk interaktif, serta bilah konfirmasi koordinat di bagian bawah layar.
4. **Pelacakan GPS Langsung & Geofencing Klaster**:
   - Tombol **Gunakan GPS Saat Ini** mengaktifkan pelacakan posisi akurat (`navigator.geolocation`) disertai indikator akurasi meter, sementara di sisi Admin sistem menampilkan radius *geofencing* (`10m / 20m / 50m`) untuk mendeteksi laporan berdekatan di titik kerusakan yang sama.

---

## 🧮 Rincian Lengkap Algoritma & Kriteria Penilaian Prioritas (SAW)

Untuk memastikan urutan penanganan perbaikan infrastruktur berjalan objektif dan bebas subjektivitas, sistem menerapkan metode **Simple Additive Weighting (SAW)** di sisi kalkulasi sistem (`src/utils/sawCalculator.ts`), kemudian menyajikannya dalam **Skor Prioritas skala `0 – 100`** di antarmuka Admin.

### 1. Tabel Kriteria dan Bobot Terbaru

Seluruh kriteria bersifat **Benefit** (semakin tinggi nilai dampak/urgensi suatu kriteria, semakin tinggi prioritas penanganannya):

| Kode | Aspek pada UI Admin | Deskripsi Kriteria Penilaian | Bobot ($w_j$) | Sifat Atribut |
| :--- | :--- | :--- | :---: | :---: |
| **C1** | **01. Keselamatan Warga** | Tingkat bahaya terhadap keselamatan jiwa & risiko kecelakaan fisik warga | **35% (`0.35`)** | *Benefit* |
| **C2** | **02. Aksesibilitas Difabel** | Dampak langsung terhadap kemandirian mobilitas penyandang disabilitas | **30% (`0.30`)** | *Benefit* |
| **C3** | **03. Fasilitas & Pengguna** | Skala kepadatan fasilitas publik & keragaman kelompok warga terdampak | **25% (`0.25`)** | *Benefit* |
| **C4** | **04. Kerusakan Fisik** | Tingkat kerusakan struktural / keparahan fisik infrastruktur di lapangan | **10% (`0.10`)** | *Benefit* |
| **Total** | | | **100% (`1.00`)** | |

---

### 2. Pemetaan Pertanyaan Formulir Warga ke Kriteria Model

Warga tidak diminta mengisi angka teknis. Sebaliknya, warga cukup menjawab 4 pertanyaan observasi lapangan pada **Bagian 2: Informasi Hambatan (Poin A, B, C, dan D)** di formulir pelaporan, yang kemudian diterjemahkan oleh sistem ke keempat kriteria di atas:

| Bagian pada Formulir Warga | Pertanyaan pada UI Warga | Mewakili Kriteria pada Program Admin | Penjelasan Peran dalam Algoritma |
| :--- | :--- | :--- | :--- |
| **Poin A** | **Kategori ruang atau fasilitas** *(Ruang publik & terbuka, Fasilitas pelayanan dasar, Transportasi & konektivitas, Kawasan permukiman)* | **C3 — Fasilitas & Pengguna (25%)** *(serta menentukan daftar opsi hambatan pada Poin B)* | Menentukan pengali skala kepadatan fasilitas publik (`facilityMultiplier`) sekaligus memfilter jenis hambatan agar sesuai dengan konteks ruang yang dipilih. |
| **Poin B** | **Jenis hambatan aksesibilitas** *(6 opsi spesifik yang menyesuaikan pilihan Poin A)* | **Utama: C2 — Aksesibilitas Difabel (30%)**<br>*(Penguat kontekstual pada **C1** & **C4**)* | Menentukan nilai dasar hambatan mobilitas difabel (`c2BaseAccess`), tambahan potensi bahaya kecelakaan (`c1SafetyBoost`), serta pengali kerusakan fisik (`c4PhysicalScale`). |
| **Poin C** | **Tingkat keparahan hambatan** *(Ringan, Sedang, Berat, Sangat berat / membahayakan keselamatan)* | **Utama: C1 — Keselamatan Warga (35%)** & **C4 — Kerusakan Fisik (10%)**<br>*(Modulator pada **C2**)* | Menentukan nilai jangkar bahaya keselamatan (`safetyBase`), nilai dasar kerusakan fisik (`physicalBase`), serta koreksi tingkat kesulitan akses (`accessDelta`). |
| **Poin D** | **Dampak langsung hambatan (Kelompok Terdampak)** *(Checkbox multi-pilihan: Penyandang disabilitas, Lansia, Anak-anak, Masyarakat umum, Kelompok rentan lainnya)* | **C3 — Fasilitas & Pengguna (25%)** | Semakin banyak kelompok warga dan kelompok rentan yang terdampak langsung di lokasi tersebut, semakin tinggi nilai cakupan pengguna (`groupWeight`). |

---

### 3. Daftar Dinamis 24 Jenis Hambatan Sesuai Kategori Ruang & Parameter Algoritma

Setiap pilihan pada **Poin A (Kategori Ruang)** secara otomatis memuat **6 jenis hambatan yang relevan secara kontekstual** pada **Poin B**, lengkap dengan parameter kalibrasi masing-masing:

#### A.1. Kategori: Ruang Publik & Ruang Terbuka (`public_space`)
*Pengali Fasilitas (`facilityMultiplier`) = **`0.90`** (Alun-alun, taman kota, jalur pedestrian/trotoar jalan raya)*

| No | Jenis Hambatan pada Formulir Warga | Nilai Dasar Difabel (`c2BaseAccess`) | Dorongan Bahaya (`c1SafetyBoost`) | Pengali Fisik (`c4PhysicalScale`) |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Trotoar rusak, berlubang, atau amblas | `0.84` | `+0.04` | `1.05` |
| 2 | Guiding block (pemandu tunanetra) terputus / mengelupas | `0.92` | `+0.03` | `1.00` |
| 3 | Ramp trotoar tidak ada atau terlalu curam | `0.94` | `+0.03` | `1.00` |
| 4 | Lubang drainase / penutup selokan terbuka di jalur pejalan kaki | `0.88` | `+0.07` | `1.06` |
| 5 | Jalur ruang terbuka terhalang bollard sempit, tiang, atau PKL/parkir | `0.90` | `+0.01` | `0.85` |
| 6 | Akses taman / alun-alun berundak tanpa jalur kursi roda | `0.91` | `+0.02` | `0.95` |

#### A.2. Kategori: Fasilitas Umum & Pelayanan Dasar (`public_service`)
*Pengali Fasilitas (`facilityMultiplier`) = **`0.85`** (Puskesmas, RSUD, sekolah, kantor desa/kecamatan, pasar rakyat, tempat ibadah)*

| No | Jenis Hambatan pada Formulir Warga | Nilai Dasar Difabel (`c2BaseAccess`) | Dorongan Bahaya (`c1SafetyBoost`) | Pengali Fisik (`c4PhysicalScale`) |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Pintu masuk gedung tanpa ramp kursi roda / hanya tangga tinggi | `0.95` | `+0.03` | `0.95` |
| 2 | Toilet khusus disabilitas tidak tersedia, terkunci, atau rusak | `0.93` | `0.00` | `0.95` |
| 3 | Loket pelayanan / koridor gedung terlalu sempit atau tinggi bagi kursi roda | `0.90` | `-0.02` | `0.90` |
| 4 | Tangga / selasar gedung tanpa pegangan rambat (*handrail*) pengaman | `0.87` | `+0.05` | `0.98` |
| 5 | Lantai selasar licin, berundak tajam, atau tanpa penanda tunanetra | `0.89` | `+0.05` | `1.00` |
| 6 | Area parkir khusus disabilitas tidak ada atau terhalang kendaraan lain | `0.84` | `-0.02` | `0.82` |

#### A.3. Kategori: Transportasi & Konektivitas (`transit`)
*Pengali Fasilitas (`facilityMultiplier`) = **`0.88`** (Halte angkutan, terminal bus, stasiun kereta, zebra cross, JPO)*

| No | Jenis Hambatan pada Formulir Warga | Nilai Dasar Difabel (`c2BaseAccess`) | Dorongan Bahaya (`c1SafetyBoost`) | Pengali Fisik (`c4PhysicalScale`) |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Halte / peron terlalu tinggi tanpa ramp naik-turun kursi roda | `0.95` | `+0.04` | `0.98` |
| 2 | Penyeberangan jalan (*zebra cross*) tanpa ramp trotoar atau sinyal suara | `0.93` | `+0.07` | `0.96` |
| 3 | Jembatan penyeberangan / akses stasiun terlalu curam bagi difabel & lansia | `0.92` | `+0.04` | `0.96` |
| 4 | Jalur pemandu (*guiding block*) menuju halte / stasiun / terminal terputus | `0.91` | `+0.03` | `1.00` |
| 5 | Titik turun-naik penumpang terhalang parkir liar atau hambatan fisik | `0.86` | `+0.04` | `0.85` |
| 6 | Minim penerangan & rambu informasi rute tidak ramah tunanetra/*low-vision* | `0.88` | `+0.05` | `0.92` |

#### A.4. Kategori: Kawasan Permukiman (`residential`)
*Pengali Fasilitas (`facilityMultiplier`) = **`0.65`** (Jalan lingkungan RT/RW, gang warga, akses fasilitas warga)*

| No | Jenis Hambatan pada Formulir Warga | Nilai Dasar Difabel (`c2BaseAccess`) | Dorongan Bahaya (`c1SafetyBoost`) | Pengali Fisik (`c4PhysicalScale`) |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Jalan lingkungan / gang permukiman berlubang parah atau amblas | `0.83` | `+0.05` | `1.06` |
| 2 | Saluran air / gorong-gorong permukiman terbuka tanpa penutup aman | `0.85` | `+0.07` | `1.05` |
| 3 | Tanjakan jalan gang terlalu curam atau licin tanpa pengaman tepi | `0.88` | `+0.06` | `1.00` |
| 4 | Akses kursi roda & lansia di gang terhalang portal sempit / material | `0.91` | `+0.01` | `0.85` |
| 5 | Permukaan paving / beton jalan warga pecah & bergelombang | `0.82` | `+0.03` | `1.04` |
| 6 | Jalur warga minim penerangan & tanpa pembatas pada tepi rawan jatuh | `0.80` | `+0.06` | `0.94` |

#### A.5. Opsi "Pengaduan Lain" (Input Manual di Semua Kategori)
Di setiap kategori ruang pada **Poin B**, tersedia pilihan **`Pengaduan lain`** yang membuka kolom isian teks manual bagi warga apabila hambatan di lapangan belum termasuk dalam 6 opsi standar di atas.
- **Skor Seragam Apapun Inputnya**: Apapun teks atau kalimat yang diketik warga pada kolom manual **`Pengaduan lain`**, algoritma menggunakan parameter konstanta seragam tanpa dipengaruhi kata kunci kalimat:
  - `c2BaseAccess = 0.88`
  - `c1SafetyBoost = +0.03`
  - `c4PhysicalScale = 1.00`

---

### 4. Rumus Pembentukan Nilai Mentah, Normalisasi, dan Skor Skala `0–100`

#### Tahap 1 — Jangkar Keparahan (`Poin C`)
Pilihan tingkat keparahan menetapkan tiga parameter dasar:
- **Ringan (`mild`)**: `safetyBase = 0.35`, `accessDelta = -0.14`, `physicalBase = 0.35`
- **Sedang (`moderate`)**: `safetyBase = 0.60`, `accessDelta = -0.06`, `physicalBase = 0.60`
- **Berat (`severe`)**: `safetyBase = 0.82`, `accessDelta = +0.01`, `physicalBase = 0.80`
- **Sangat Berat (`critical`)**: `safetyBase = 0.92`, `accessDelta = +0.04`, `physicalBase = 0.90`

#### Tahap 2 — Perhitungan Matriks Keputusan Mentah ($X_{ij}$)
Untuk setiap laporan ke-$i$, sistem menghitung empat nilai kriteria mentah (dengan fungsi pembatas $\text{clamp}(x, \min, \max)$ agar tetap berada pada rentang terukur):

1. **Nilai Keselamatan Warga ($X_{i,C1}$):**
   $$X_{i,C1} = \text{clamp}\big(\text{safetyBase} + \text{c1SafetyBoost},\; 0.30,\; 0.98\big)$$

2. **Nilai Aksesibilitas Difabel ($X_{i,C2}$):**
   $$X_{i,C2} = \text{clamp}\big(\text{c2BaseAccess} + \text{accessDelta},\; 0.45,\; 0.98\big)$$

3. **Nilai Fasilitas & Pengguna Terdampak ($X_{i,C3}$):**
   $$\text{groupWeight} = \min\big(1.0,\; 0.40 + (\text{jumlah\_kelompok\_terdampak} \times 0.15)\big)$$
   $$X_{i,C3} = \text{clamp}\big((0.60 \times \text{facilityMultiplier}) + (0.40 \times \text{groupWeight}),\; 0.40,\; 0.98\big)$$

4. **Nilai Kerusakan Fisik ($X_{i,C4}$):**
   $$X_{i,C4} = \text{clamp}\big(\text{physicalBase} \times \text{c4PhysicalScale},\; 0.28,\; 0.96\big)$$

#### Tahap 3 — Normalisasi Matriks ($R_{ij}$)
Setiap nilai kriteria dibagi dengan nilai tertinggi ($\max X_j$) dari seluruh laporan aktif pada kriteria yang sama:
$$R_{ij} = \frac{X_{ij}}{\max_{k}(X_{kj})}$$

*(Catatan: Untuk pratinjau skor mandiri satu laporan sebelum dibandingkan dalam antrean, digunakan acuan batas maksimum $\max(X_j) = 1.00$).*

#### Tahap 4 — Penjumlahan Terbobot ($V_i$) & Konversi Skala UI (`0–100`)
Nilai preferensi akhir dihitung dengan mengalikan matriks ternormalisasi terhadap bobot terbaru:
$$V_i = (0.35 \times R_{i,C1}) + (0.30 \times R_{i,C2}) + (0.25 \times R_{i,C3}) + (0.10 \times R_{i,C4})$$

Agar mudah dipahami oleh petugas dinas dan pimpinan daerah tanpa latar belakang teknis TI, nilai $V_i \in [0, 1]$ dikonversi ke **Skala Indeks Prioritas `0 – 100`**:
$$\text{Skor Prioritas UI} = \text{round}(V_i \times 100)$$

**Kategori Ambang Tindak Lanjut di Portal Admin:**
- **Skor `75 – 100` (Prioritas Utama / Tinggi)**: Penanganan segera oleh Tim Reaksi Cepat (TRC) DPUPR / Dishub.
- **Skor `55 – 74` (Prioritas Menengah / Terjadwal)**: Masuk antrean pemeliharaan terjadwal berkala.
- **Skor `< 55` (Prioritas Rutin)**: Pemantauan dan perawatan rutin wilayah.

---

### 5. Simulasi Perhitungan Nyata (Studi Kasus)

Misalkan seorang warga melaporkan kerusakan di sekitar **RSUD dr. Soedirman Kebumen** dengan isian formulir:
- **Poin A (Kategori Ruang)**: *Fasilitas umum & pelayanan dasar* (`facilityMultiplier = 0.85`)
- **Poin B (Jenis Hambatan)**: *Pintu masuk gedung tanpa ramp kursi roda / hanya tangga tinggi* (`c2BaseAccess = 0.95`, `c1SafetyBoost = +0.03`, `c4PhysicalScale = 0.95`)
- **Poin C (Keparahan)**: *Berat* (`safetyBase = 0.82`, `accessDelta = +0.01`, `physicalBase = 0.80`)
- **Poin D (Kelompok Terdampak)**: Mencengang 3 kelompok (*Penyandang disabilitas*, *Lansia*, *Masyarakat umum*) $\rightarrow$ `jumlah = 3`

**Langkah Perhitungan:**
1. $X_{C1} = 0.82 + 0.03 = \mathbf{0.85}$
2. $X_{C2} = 0.95 + 0.01 = \mathbf{0.96}$
3. $\text{groupWeight} = \min(1.0,\; 0.40 + 3 \times 0.15) = 0.85 \implies X_{C3} = (0.60 \times 0.85) + (0.40 \times 0.85) = \mathbf{0.85}$
4. $X_{C4} = 0.80 \times 0.95 = \mathbf{0.76}$

Apabila nilai maksimum antrean saat ini pada keempat kriteria masing-masing adalah $\max X = [0.95,\; 0.98,\; 0.94,\; 0.95]$, maka nilai normalisasinya:
- $R_{C1} = 0.85 / 0.95 = 0.8947$
- $R_{C2} = 0.96 / 0.98 = 0.9796$
- $R_{C3} = 0.85 / 0.94 = 0.9043$
- $R_{C4} = 0.76 / 0.95 = 0.8000$

**Skor Akhir:**
$$V_i = (0.35 \times 0.8947) + (0.30 \times 0.9796) + (0.25 \times 0.9043) + (0.10 \times 0.8000) = 0.3131 + 0.2939 + 0.2261 + 0.0800 = \mathbf{0.9131}$$
$$\text{Skor Tampilan UI Admin} = \text{round}(0.9131 \times 100) = \mathbf{91\text{ / }100}\;\text{(Prioritas Utama)}$$

---

## 💻 Panduan Instalasi & Menjalankan Aplikasi

### Persyaratan Sistem
- **Node.js**: Versi 18.x atau lebih baru (disarankan LTS 20.x atau 22.x).
- **npm**: Versi 9.x atau lebih baru.
- Peramban web modern (Chrome, Firefox, Safari, atau Edge) dengan dukungan Geolocation API.

### Langkah-langkah Instalasi Lokal

1. **Masuk ke Direktori Proyek**:
   ```bash
   cd suara-ruang-kebumen
   ```

2. **Pasang Seluruh Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Server Pengembangan (Port 3000)**:
   ```bash
   npm run dev
   ```
   Akses aplikasi melalui peramban:
   - **Portal Publik Warga**: `http://localhost:3000/`
   - **Portal Admin DPUPR**: `http://localhost:3000/admin`

4. **Pemeriksaan Tipe TypeScript & Build Produksi**:
   ```bash
   npm run lint
   npm run build
   ```

---

## 🍃 Integrasi Database MongoDB Atlas & Deployment ke Vercel

Aplikasi dirancang menggunakan arsitektur **React 19 + Vite Frontend** yang terhubung ke **Vercel Serverless Functions (`/api`)** dan **MongoDB Atlas**:

```text
[ Perangkat Warga / Admin (React 19 + Vite + Leaflet) ]
   ├── localStorage Perangkat (Tiket Pribadi "Lacak Laporan" + Device UID)
   │
   ▼  HTTP REST (/api/reports, /api/health)
[ Backend Express / Vercel Serverless Functions (/api) ]
   │  MongoDB Node.js Driver Connection Pool
   ▼
[ Cloud Database: MongoDB Atlas (Database: suararuang_kebumen) ]
```

### 1. Menyiapkan MongoDB Atlas (Free Tier M0)
1. Buat akun dan klaster gratis (*M0 Sandbox*) di [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Pada menu **Database Access**, buat pengguna database baru beserta kata sandinya.
3. Pada menu **Network Access**, tambahkan alamat IP `0.0.0.0/0` (*Allow Access from Anywhere*) agar fungsi serverless Vercel dapat terhubung secara dinamis.
4. Klik **Connect $\rightarrow$ Drivers (Node.js)** dan salin *Connection String* URI Anda:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 2. Konfigurasi Variabel Lingkungan Lokal (`.env.local`)
Buat berkas `.env.local` pada akar direktori proyek:
```env
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="suararuang_kebumen"
```
*Catatan: Apabila `MONGODB_URI` belum dikonfigurasi pada mode pengembangan lokal, aplikasi secara otomatis beralih menggunakan penyimpanan lokal peramban tanpa menimbulkan kegagalan sistem.*

### 3. Deployment ke Vercel
#### Opsi A: Melalui Vercel Dashboard (Direkomendasikan)
1. Unggah (*push*) repositori proyek ke GitHub.
2. Buka [Vercel Dashboard](https://vercel.com/), klik **Add New Project**, lalu impor repositori tersebut.
3. Pastikan konfigurasi build:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Tambahkan **Environment Variables** pada pengaturan proyek Vercel:
   - `MONGODB_URI` = *Connection String* MongoDB Atlas Anda
   - `MONGODB_DB` = `suararuang_kebumen`
5. Klik **Deploy**. Endpoint API `/api/reports` dan `/api/health` beserta isolasi riwayat laporan per perangkat akan langsung aktif di produksi.

#### Opsi B: Melalui Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```
Pastikan variabel lingkungan `MONGODB_URI` dan `MONGODB_DB` telah ditambahkan pada pengaturan proyek di Vercel.

---

*SUARA RUANG — Sistem Informasi Pemetaan & Prioritas Aksesibilitas Ruang Publik Kabupaten Kebumen.*