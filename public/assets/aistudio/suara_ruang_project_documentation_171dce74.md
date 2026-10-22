# SUARA RUANG: Sistem Pemetaan Hambatan Aksesibilitas Ruang Publik di Kabupaten Kebumen

**SUARA RUANG** adalah platform partisipasi publik berbasis web yang dirancang untuk menjembatani warga Kabupaten Kebumen dengan pemerintah daerah (Dinas PUPR dan Dishub) dalam mengidentifikasi, melaporkan, dan memprioritaskan penanganan kerusakan fasilitas serta hambatan aksesibilitas ruang publik.

## 🎯 Gagasan Utama & Tujuan

Gagasan utama sistem ini adalah memberikan kesempatan seluas-luasnya kepada warga untuk berpartisipasi aktif melaporkan kondisi infrastruktur yang tidak ramah akses (seperti trotoar rusak, jalur terhalang, *ramp* tidak tersedia, atau fasilitas disabilitas yang tidak berfungsi).

Sistem memproses laporan tersebut secara transparan menggunakan metode **Simple Additive Weighting (SAW)** untuk menentukan tingkat prioritas penanganan secara objektif dan terstruktur.

## 👥 Peran dan Deskripsi Sistem

### 1. Sisi Pengguna (Masyarakat / Warga)

Dirancang dengan prinsip *accessibility-first*, formulir ringkas, serta **tanpa kewajiban membuat akun atau login** agar warga dapat melapor dengan cepat dan mudah tanpa hambatan.

* **Akses Tanpa Login & Penyimpanan Perangkat:** Warga dapat langsung membuat laporan dan melacak riwayatnya karena **aktivitas serta tiket laporan tersimpan secara otomatis di masing-masing perangkat (*device storage* / *local storage* browser)** pengguna.
* **Peta Interaktif Publik:** Menampilkan sebaran titik kerusakan fasilitas di wilayah Kabupaten Kebumen dengan kode warna status laporan secara real-time.
* **Formulir Pelaporan 6 Variabel Minimalis:**
  1. **Jenis Fasilitas:** Trotoar, Jalur Tunanetra, *Ramp* Kursi Roda, Penyeberangan Jalan, atau Lainnya.
  2. **Jenis Masalah:** Rusak/berlubang, Terhalang benda/kendaraan, Tidak tersedia, atau Terputus/sulit diakses.
  3. **Dampak ke Pengguna:** Gangguan ringan, Akses terganggu, atau Tidak dapat dilewati/berisiko kecelakaan.
  4. **Bukti Foto:** Unggah foto langsung dari kamera perangkat atau galeri.
  5. **Lokasi Masalah:** Deteksi koordinat GPS otomatis, pilih titik manual di peta, atau input alamat/patokan.
  6. **Keterangan Tambahan:** Catatan teks opsional dari pelapor.

* **Pelacakan Status (*Tracking*):** Fitur pemantauan linimasa laporan yang tersimpan di perangkat warga mulai dari *Terkirim* $\rightarrow$ *Terverifikasi* $\rightarrow$ *Masuk Daftar Prioritas* $\rightarrow$ *Sedang Dikerjakan* $\rightarrow$ *Selesai (dengan bukti foto pasca-perbaikan)*.

### 2. Sisi Admin (Pemerintahan Kabupaten Kebumen)

Berfungsi sebagai pusat kendali (*command center*) bagi instansi teknis terkait untuk mengelola operasional perbaikan infrastruktur.

* **Dashboard Eksekutif:** Panel metrik yang menyajikan total laporan aktif, waktu tanggap rata-rata, dan persentase penyelesaian per kecamatan.
* **Verifikasi & Validasi Laporan:** Memeriksa kesesuaian data visual, koordinat, dan kategori laporan masuk dari warga.
* **Deteksi Duplikasi Otomatis (*Geofencing*):** Sistem mendeteksi laporan ganda dalam radius koordinat yang sama dan menggabungkannya (*merge*) untuk mengakumulasi bobot dampak secara akurat.
* **Pemeringkatan Otomatis (Metode SAW):** Mengurutkan daftar prioritas perbaikan infrastruktur secara otomatis berdasarkan skor akhir perhitungan SAW dari data laporan warga.
* **Disposisi & Akuntabilitas Publik:** Mengarahkan tiket perbaikan ke tim teknis lapangan dan mempublikasikan dokumentasi perbaikan untuk transparansi kepada warga.

## 🧮 Metode Perhitungan Prioritas: Simple Additive Weighting (SAW)

Sistem menggunakan metode **SAW** karena berbasis pada penjumlahan terbobot dari performa setiap alternatif laporan pada berbagai kriteria.

### Kriteria Penilaian & Bobot Usulan

| Kode | Kriteria Penilaian | Bobot ($w_j$) | Jenis Atribut | 
| ----- | ----- | ----- | ----- | 
| **C1** | Tingkat bahaya terhadap keselamatan | 35% | Benefit | 
| **C2** | Dampak terhadap aksesibilitas | 30% | Benefit | 
| **C3** | Jumlah pengguna yang terdampak | 20% | Benefit | 
| **C4** | Tingkat kerusakan / keparahan fisik | 15% | Benefit | 
|  | **Total Bobot** | **100%** |  | 

### Rumus Perhitungan

1. **Normalisasi Matriks (**$R_{ij}$**):**

   $$
   R_{ij} = \frac{X_{ij}}{\max(X_j)}
   $$

   *(Di mana* $X_{ij}$ *adalah nilai laporan ke-*$i$ *pada kriteria ke-*$j$*)*

2. **Skor Akhir Prioritas (**$V_i$**):**

   $$
   V_i = \sum_{j=1}^{4} w_j R_{ij}
   $$

   Laporan dengan nilai skor akhir $V_i$ tertinggi akan otomatis menempati urutan teratas pada daftar prioritas penanganan infrastruktur di dashboard admin.

## 🛠️ Teknologi yang Direkomendasikan

* **Frontend (Warga & Admin):** React.js / Vue.js / Tailwind CSS (Responsive Web Application).
* **Backend:** Node.js / Express atau Python / FastAPI.
* **Database & Geospasial:** PostgreSQL dengan ekstensi PostGIS untuk manajemen koordinat GPS dan *geofencing*.
* **Peta Digital:** Leaflet.js / Mapbox API.
* **Penyimpanan Lokal Pengguna:** Browser Local Storage untuk riwayat laporan tanpa login.

*Dokumen ini disusun sebagai spesifikasi acuan pengembangan proyek sistem partisipasi publik SUARA RUANG Kabupaten Kebumen.*