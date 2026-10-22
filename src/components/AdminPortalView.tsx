import React, { useState } from 'react';
import { ReportItem } from '../types';
import { RealLeafletMap } from './RealLeafletMap';

interface AdminPortalViewProps {
  reports: ReportItem[];
  officerName: string;
  onLogout: () => void;
  onNavigateToCitizen: () => void;
  onUpdateReportStatus: (reportId: string, newStatus: ReportItem['status']) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  reports,
  officerName,
  onLogout,
  onNavigateToCitizen,
  onUpdateReportStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'klaster' | 'tugas' | 'audit'>('dashboard');
  const [selectedDistrict, setSelectedDistrict] = useState('Semua Kecamatan (Kebumen)');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const [geofenceRadius, setGeofenceRadius] = useState<'10m' | '20m' | '50m'>('20m');
  const [autoMerge, setAutoMerge] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Task filter
  const [taskFilter, setTaskFilter] = useState<'semua' | 'diterbitkan' | 'proses' | 'selesai'>('semua');

  // Map category filter on dashboard
  const [mapCategory, setMapCategory] = useState<'all' | 'road' | 'access'>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const districts = [
    'Semua Kecamatan (Kebumen)',
    'Kec. Kebumen Kota',
    'Kec. Gombong',
    'Kec. Prembun',
    'Kec. Karanganyar',
    'Kec. Kutowinangun',
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-[#131b2e] flex flex-col justify-start items-center">
      <div className="w-full max-w-md bg-[#faf8ff] min-h-screen flex flex-col relative shadow-2xl border-x border-[#eaedff]">
        {/* ================= ADMIN TOP APP BAR ================= */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#eaedff] px-4 py-2.5 flex-shrink-0 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#00355f] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[18px] text-[#7fc5fd]">
                  admin_panel_settings
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-[#131b2e] truncate">
                  Admin Portal Dinas PUPR
                </span>
                <span className="text-[10px] text-[#006496] truncate font-semibold">
                  {officerName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Notification icon */}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifikasi Pengaduan"
                  onClick={() => showToast('3 Laporan Baru Masuk dari Kec. Kebumen Kota')}
                  className="w-8 h-8 rounded-lg bg-[#eaedff] hover:bg-[#dae2fd] text-[#00355f] flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">notifications</span>
                </button>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ba1a1a] text-white text-[9px] font-bold flex items-center justify-center">
                  2
                </span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                aria-label="Keluar / Logout"
                title="Keluar"
                className="w-8 h-8 rounded-lg bg-[#ffdad6]/60 hover:bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">logout</span>
              </button>
            </div>
          </div>

          {/* District Filter Pill with Dropdown */}
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
              className="w-full flex items-center justify-between bg-[#f2f3ff] hover:bg-[#eaedff] rounded-xl px-3 py-1.5 text-xs text-[#00355f] font-semibold transition-colors border border-[#eaedff]"
            >
              <span className="flex items-center gap-1.5 text-[11px] truncate">
                <span className="material-symbols-outlined text-[16px]">location_city</span>
                <span>Wilayah: {selectedDistrict}</span>
              </span>
              <span className="material-symbols-outlined text-[16px]">
                {isDistrictDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isDistrictDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-[#eaedff] z-50 overflow-hidden divide-y divide-[#eaedff] animate-fade-in">
                {districts.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDistrict(d);
                      setIsDistrictDropdownOpen(false);
                      showToast(`Filter wilayah diubah: ${d}`);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-semibold hover:bg-[#f2f3ff] transition-colors flex items-center justify-between ${
                      selectedDistrict === d ? 'text-[#00355f] bg-[#eaedff]' : 'text-[#131b2e]'
                    }`}
                  >
                    <span>{d}</span>
                    {selectedDistrict === d && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed top-24 inset-x-4 z-50 max-w-sm mx-auto bg-[#00355f] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[18px] text-[#a3f69c]">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================= BODY CONTENT PER TAB ================= */}
        <main className="flex-1 p-4 pb-24 space-y-4 overflow-y-auto">
          {/* ================= TAB 1: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Executive Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs">
                  <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                    <span className="font-semibold">Total Lap. Aktif</span>
                    <span className="material-symbols-outlined text-[16px] text-[#006496]">folder</span>
                  </div>
                  <span className="text-2xl font-black text-[#00355f] block mt-1 tabular-nums">24</span>
                  <span className="text-[10px] text-[#006496] font-semibold">3 Butuh Verifikasi</span>
                </div>

                <div className="bg-[#ffdad6]/40 p-3.5 rounded-2xl border border-[#ffdad6] shadow-xs">
                  <div className="flex justify-between items-center text-[#ba1a1a] text-[11px]">
                    <span className="font-bold">Darurat / Kritis</span>
                    <span className="material-symbols-outlined text-[16px]">e911_emergency</span>
                  </div>
                  <span className="text-2xl font-black text-[#ba1a1a] block mt-1 tabular-nums">2 Kasus</span>
                  <span className="text-[10px] text-[#ba1a1a] font-semibold">Menunggu Verifikasi SPK</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs">
                  <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                    <span className="font-semibold">Resp. Time Rata2</span>
                    <span className="material-symbols-outlined text-[16px] text-[#006496]">schedule</span>
                  </div>
                  <span className="text-2xl font-black text-[#006496] block mt-1 tabular-nums">1.4 Hari</span>
                  <span className="text-[10px] text-[#005713] font-semibold flex items-center gap-0.5">
                    <span>▼ 0.6 hr dari target</span>
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs">
                  <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                    <span className="font-semibold">Penyelesaian Wilayah</span>
                    <span className="material-symbols-outlined text-[16px] text-[#006496]">bar_chart</span>
                  </div>
                  <div className="space-y-1.5 mt-1.5 text-[10px]">
                    <div>
                      <div className="flex justify-between font-semibold mb-0.5">
                        <span>Kebumen</span>
                        <span className="font-bold text-[#00355f]">92%</span>
                      </div>
                      <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#00355f] h-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold mb-0.5">
                        <span>Gombong</span>
                        <span className="font-bold text-[#006496]">84%</span>
                      </div>
                      <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#006496] h-full" style={{ width: '84%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Peta Analitik & Geofencing Section */}
              <section className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#006496]">
                      travel_explore
                    </span>
                    Peta Analitik & Geofencing
                  </h3>
                  <span className="text-[10px] font-bold text-[#005713] bg-[#a3f69c]/30 px-2 py-0.5 rounded-md">
                    2 Titik Klaster
                  </span>
                </div>

                {/* Filter Category Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'Semua Kategori' },
                    { id: 'road', label: 'Jalan & Trotoar' },
                    { id: 'access', label: 'Akses Disabilitas' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setMapCategory(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${
                        mapCategory === cat.id
                          ? 'bg-[#00355f] text-white'
                          : 'bg-[#eaedff] text-[#00355f] hover:bg-[#dae2fd]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Interactive Leaflet Map with Geofencing & Clusters */}
                <RealLeafletMap
                  reports={reports}
                  heightClass="h-56"
                  showClusters={true}
                  geofenceRadiusMeters={20}
                  onSelectReport={id => showToast(`Titik laporan dipilih: ${id}`)}
                />

                {/* Active Cluster Card */}
                <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#cce5ff] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#00355f] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#006496]">hub</span>
                      Klaster Aktif: Jl. Kusuma & Simpang RSUD
                    </span>
                    <span className="text-[9px] font-extrabold bg-[#cce5ff] text-[#001e31] px-2 py-0.5 rounded-md">
                      Auto-Merge
                    </span>
                  </div>
                  <p className="text-[11px] text-[#42474f] leading-relaxed">
                    4 Laporan Warga Diagregasikan menjadi 1 Tiket Induk{' '}
                    <strong className="text-[#00355f]">#KBM-CLUST-04</strong>. Bobot parameter frekuensi dampak publik otomatis dinaikkan (+0.20).
                  </p>
                  <div className="text-[10px] text-[#006496] font-semibold flex items-center justify-between pt-1 border-t border-[#dae2fd]">
                    <span>Tiket Tergabung: #0908, #0910, #0911, #0915</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('klaster')}
                      className="font-bold underline"
                    >
                      Lihat Rincian
                    </button>
                  </div>
                </div>
              </section>

              {/* Sistem Pendukung Keputusan: Manajemen Validasi & Peringkat SAW */}
              <section className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#006496] uppercase tracking-wider block">
                      SISTEM PENDUKUNG KEPUTUSAN
                    </span>
                    <h3 className="text-sm font-bold text-[#131b2e]">
                      Manajemen Validasi & Peringkat SAW
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#00355f] bg-[#d2e4ff] px-2.5 py-0.5 rounded-full">
                    18 Antrean
                  </span>
                </div>

                {/* Rank #1 Card: #KBM-0911 */}
                <div className="p-3.5 bg-[#f2f3ff] rounded-2xl border border-[#dae2fd] space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-[#00355f] bg-white px-2 py-0.5 rounded-md border border-[#eaedff]">
                      #KBM-0911 • 14 Menit lalu
                    </span>
                    <span className="text-xs font-extrabold bg-[#00355f] text-white px-2.5 py-0.5 rounded-full">
                      RANK #1 • Skor V: 0.942
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#131b2e]">
                    Ramp Trotoar Amblas Depan RSUD Dr. Soedirman
                  </h4>
                  <div className="text-[10px] text-[#42474f] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#006496]">location_on</span>
                    <span>Jl. Lingkar Selatan KM 2.3, Kebumen</span>
                  </div>

                  {/* 4 SAW Criteria Bars */}
                  <div className="space-y-1.5 pt-1 text-[10px]">
                    <div>
                      <div className="flex justify-between font-semibold mb-0.5">
                        <span>C1: Bahaya Keselamatan (w=0.35)</span>
                        <span className="font-bold text-[#ba1a1a]">0.95 (Sangat Kritis)</span>
                      </div>
                      <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#ba1a1a] h-full" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold mb-0.5">
                        <span>C2: Akses Difabel (w=0.30)</span>
                        <span className="font-bold text-[#ba1a1a]">0.90 (Total Blokir)</span>
                      </div>
                      <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#ba1a1a] h-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold mb-0.5">
                        <span>C3: Kepadatan Faskes (w=0.20)</span>
                        <span className="font-bold text-[#00355f]">0.85 (Zona Padat)</span>
                      </div>
                      <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#00355f] h-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold mb-0.5">
                        <span>C4: Skala Kerusakan (w=0.15)</span>
                        <span className="font-bold text-[#727780]">0.80 (&gt;20cm Amblas)</span>
                      </div>
                      <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#727780] h-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateReportStatus('#KBM-2024-089', 'in_progress');
                        showToast('Surat Perintah Kerja (SPK) Berhasil Diterbitkan!');
                      }}
                      className="flex-1 py-2 bg-[#00355f] hover:bg-[#006496] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                      <span>Terbitkan SPK PUPR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Disposisi lapangan diteruskan ke TRC Regu A!')}
                      className="flex-1 py-2 bg-white hover:bg-[#eaedff] text-[#00355f] rounded-xl text-xs font-bold border border-[#dae2fd] flex items-center justify-center gap-1 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">share_location</span>
                      <span>Disposisi Lapangan</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Disposisi Tim Teknis & Publikasi Sebelum/Sesudah */}
              <section className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#00355f]">
                      engineering
                    </span>
                    Disposisi Tim Teknis & Publikasi
                  </h3>
                  <span className="text-[10px] text-[#006496] font-semibold bg-[#eaedff] px-2 py-0.5 rounded-md">
                    Akuntabilitas Publik
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#131b2e]">
                    Penugasan Regu Pelaksana:
                  </label>
                  <div className="p-2.5 bg-[#f2f3ff] rounded-xl text-xs font-semibold text-[#00355f] flex items-center justify-between border border-[#eaedff]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">groups</span>
                      Tim Reaksi Cepat PUPR Regu A (Zona Kebumen)
                    </span>
                    <span className="material-symbols-outlined text-[16px]">unfold_more</span>
                  </div>
                </div>

                {/* Upload Bukti Pasca-Perbaikan */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#131b2e]">Unggah Bukti Pasca-Perbaikan:</span>
                    <span className="text-[10px] text-[#006496] font-semibold">Komparasi Sebelum & Sesudah</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative rounded-xl overflow-hidden h-28 bg-[#eaedff]">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeW2V-OYmaId2o2Dqzs3AtGMysDjF_l48Ga_1tX6waVVwKdZMknFegrUgHXlM75SPmRXCN6-x76KtdjCvFSp5YeM7zDdXHS-NFVgCzYFqjrT7oGhVogzhKGDSUXA8jdkg4Lmd-pEAY8ZFjHLhFnxhQ8qh39jkM9jJRkqLNM-NTdBVNp6ZFyaSfIA4i0HYQCsX9j6FpUcwtDBnUcKtHPK9T7VidJGVXlVWXxcoSr4ueabQVmSYZHMqO"
                        alt="Foto Sebelum"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 bg-[#ba1a1a] text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                        Sebelum
                      </span>
                    </div>

                    <div className="border-2 border-dashed border-[#006496]/40 rounded-xl bg-[#f2f3ff] flex flex-col items-center justify-center p-2 text-center">
                      <span className="material-symbols-outlined text-[24px] text-[#006496]">
                        add_a_photo
                      </span>
                      <span className="text-[10px] font-bold text-[#00355f] mt-1">
                        Unggah Foto Sesudah
                      </span>
                      <span className="text-[8px] text-[#727780]">JPG/PNG maks. 5MB</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateReportStatus('#KBM-2025-0842', 'completed');
                    showToast('Data Dipublikasikan ke Portal Warga & Tiket Selesai Tuntas!');
                  }}
                  className="w-full h-12 bg-[#005713] hover:bg-[#003d0b] text-[#a3f69c] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">publish</span>
                  <span>Publikasikan ke Portal Warga & Selesaikan Tiket</span>
                </button>
              </section>
            </div>
          )}

          {/* ================= TAB 2: PETA & KLASTER GEOFENCING ================= */}
          {activeTab === 'klaster' && (
            <div className="space-y-4">
              {/* Geofencing Controls */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#131b2e]">Geofencing Klaster</span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#006496]">
                    <span>Auto-Merge</span>
                    <button
                      type="button"
                      onClick={() => setAutoMerge(!autoMerge)}
                      className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                        autoMerge ? 'bg-[#00355f]' : 'bg-[#dae2fd]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          autoMerge ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      ></span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['10m', '20m', '50m'] as const).map(rad => (
                    <button
                      key={rad}
                      type="button"
                      onClick={() => {
                        setGeofenceRadius(rad);
                        showToast(`Radius geofence diatur: ${rad}`);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                        geofenceRadius === rad
                          ? 'bg-[#00355f] text-white shadow-xs'
                          : 'bg-[#f2f3ff] text-[#00355f] hover:bg-[#eaedff]'
                      }`}
                    >
                      {rad}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map with Geofencing Display */}
              <RealLeafletMap
                reports={reports}
                heightClass="h-60"
                showClusters={true}
                geofenceRadiusMeters={geofenceRadius === '10m' ? 10 : geofenceRadius === '20m' ? 20 : 50}
              />

              {/* Klaster Kritis Detail Card */}
              <div className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-[#ffdad6] text-[#ba1a1a] px-2.5 py-0.5 rounded-full">
                    Prioritas Kritis
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-[#42474f] block">#KBM-CLUST-04</span>
                    <span className="text-xs font-bold text-[#ba1a1a]">BOBOT FREKUENSI +0.20 SAW</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#131b2e]">
                    Simpang Empat RSUD Kebumen
                  </h4>
                  <p className="text-xs text-[#42474f] mt-0.5">
                    Kecamatan Kebumen • Radius Geofence {geofenceRadius}
                  </p>
                </div>

                <div className="p-3 bg-[#eaedff] rounded-xl flex items-center gap-2.5 text-xs text-[#00355f]">
                  <span className="material-symbols-outlined text-[20px] text-[#006496]">hub</span>
                  <div>
                    <span className="font-bold block">4 Laporan Warga Teragregasi</span>
                    <span className="text-[10px] text-[#42474f]">
                      Titik kerusakan berdekatan dalam radius {geofenceRadius}
                    </span>
                  </div>
                </div>

                {/* Sub-tickets list */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-[#131b2e] block">
                    Daftar Tiket Tergabung (4) • Geotag Presisi ±3m
                  </span>

                  {[
                    { id: '#KBM-0908', time: '35 mnt lalu', title: 'Guiding block hancur dekat trotoar RSUD', reporter: 'Ahmad Rifai' },
                    { id: '#KBM-0910', time: '1 jam lalu', title: 'Ramp kursi roda terhalang pot beton', reporter: 'Sri Wahyuni' },
                    { id: '#KBM-0911', time: '2 jam lalu', title: 'Manhole saluran terbuka tanpa penutup', reporter: 'Budi Santoso' },
                    { id: '#KBM-0915', time: '3 jam lalu', title: 'Jalur tactile licin berlumut', reporter: 'Hendra Kurniawan' },
                  ].map(t => (
                    <div
                      key={t.id}
                      className="p-2.5 bg-[#f2f3ff] rounded-xl flex items-center justify-between text-xs hover:bg-[#eaedff] transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#00355f]">{t.id}</span>
                          <span className="text-[10px] text-[#727780]">· {t.time}</span>
                        </div>
                        <p className="text-[11px] text-[#42474f] truncate">{t.title}</p>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-[#006496]">
                        chevron_right
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => showToast('Klaster berhasil divalidasi ke antrean SPK SAW!')}
                    className="w-full py-2.5 bg-[#00355f] hover:bg-[#006496] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                    <span>Validasi Klaster & Teruskan ke Antrean SPK SAW</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => showToast('Klaster berhasil dipisahkan (Unmerge)!')}
                      className="py-2 bg-white hover:bg-[#f2f3ff] text-[#ba1a1a] rounded-xl text-xs font-bold border border-[#dae2fd] flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">call_split</span>
                      <span>Pisahkan (Unmerge)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Titik koordinat GPS berhasil diekspor (GeoJSON)!')}
                      className="py-2 bg-white hover:bg-[#f2f3ff] text-[#006496] rounded-xl text-xs font-bold border border-[#dae2fd] flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span>Ekspor Titik GPS</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: TUGAS SPK ================= */}
          {activeTab === 'tugas' && (
            <div className="space-y-4">
              {/* Header Banner */}
              <div className="bg-[#eaedff] p-3.5 rounded-2xl border border-[#cce5ff] space-y-1">
                <span className="text-[10px] font-extrabold bg-[#00355f] text-white px-2 py-0.5 rounded-md inline-block">
                  Operasional Lapangan TRC PUPR
                </span>
                <h3 className="text-sm font-bold text-[#131b2e]">Daftar Tugas SPK Terbit</h3>
                <p className="text-[11px] text-[#42474f] leading-relaxed">
                  Disposisi otomatis prioritas Simple Additive Weighting & pemantauan realtime regu tanggap fasilitas disabilitas.
                </p>
              </div>

              {/* Top Stat Strip */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded-xl border border-[#eaedff] text-center">
                  <span className="text-[10px] text-[#42474f] block font-semibold">SPK AKTIF</span>
                  <span className="text-xl font-black text-[#00355f] block">12</span>
                  <span className="text-[9px] text-[#006496]">5 Siap Berangkat</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#eaedff] text-center">
                  <span className="text-[10px] text-[#42474f] block font-semibold">RATA DURASI</span>
                  <span className="text-xl font-black text-[#006496] block">2.1 hr</span>
                  <span className="text-[9px] text-[#005713]">Tepat SLA (94%)</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#eaedff] text-center">
                  <span className="text-[10px] text-[#42474f] block font-semibold">REGU SIAGA</span>
                  <span className="text-xl font-black text-[#005713] block">3</span>
                  <span className="text-[9px] text-[#005713]">A, B, & C Aktif</span>
                </div>
              </div>

              {/* Task Status Filters */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'semua', label: 'Semua (18)' },
                  { id: 'diterbitkan', label: 'Diterbitkan (5)' },
                  { id: 'proses', label: 'Dalam Pengerjaan (8)' },
                  { id: 'selesai', label: 'Selesai (5)' },
                ].map(flt => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setTaskFilter(flt.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      taskFilter === flt.id
                        ? 'bg-[#00355f] text-white shadow-xs'
                        : 'bg-white text-[#42474f] hover:bg-[#eaedff] border border-[#eaedff]'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {/* Task Card 1: #SPK-PUPR-2024-089 */}
              <div className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#00355f]">
                      #SPK-PUPR-2024-089
                    </span>
                    <span className="text-[10px] text-[#ba1a1a] font-bold block">
                      Prioritas #1 SAW (0.942)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#cce5ff] text-[#001e31] px-2.5 py-0.5 rounded-full">
                    Sedang Dikerjakan
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#131b2e]">
                    Rekonstruksi Ramp Trotoar & Saluran Terbuka Depan RSUD Dr. Soedirman
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-[#42474f] mt-0.5">
                    <span className="material-symbols-outlined text-[15px] text-[#006496]">location_on</span>
                    <span>Jl. Lingkar Selatan KM 2.5, Muktisari, Kec. Kebumen</span>
                  </div>
                </div>

                {/* Team Info Box */}
                <div className="p-3 bg-[#f2f3ff] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#00355f] block">
                      Tim Reaksi Cepat Regu A
                    </span>
                    <span className="text-[10px] text-[#42474f]">
                      Ketua Regu: Bpk. Bambang S. • 6 Personel & Pick-up Hidraulik
                    </span>
                  </div>
                  <span className="text-[9px] bg-[#00355f] text-white px-2 py-0.5 rounded font-bold">
                    Foto TRC
                  </span>
                </div>

                {/* SLA & Progress Bar */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#42474f]">Target SLA: 48 Jam</span>
                    <span className="font-bold text-[#ba1a1a]">Sisa 18 Jam 15 Menit</span>
                  </div>
                  <div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#00355f] h-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-[10px] text-[#42474f] block text-right">
                    Pengecoran dasar ramp & penutup saluran <strong>65% Rampung</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => showToast('Surat Perintah Kerja (PDF) diunduh!')}
                    className="py-2 bg-[#eaedff] text-[#00355f] hover:bg-[#dae2fd] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Surat SPK (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Progres berhasil diperbarui ke 85%!')}
                    className="py-2 bg-[#00355f] text-white hover:bg-[#006496] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">update</span>
                    <span>Update Progres</span>
                  </button>
                </div>
              </div>

              {/* Task Card 2: #DISP-DISHUB-014 (Bukan Aset PUPR) */}
              <div className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-[#42474f]">
                    #DISP-DISHUB-014
                  </span>
                  <span className="text-[10px] font-bold bg-[#dae2fd] text-[#00355f] px-2 py-0.5 rounded-full">
                    Bukan Aset PUPR
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#131b2e]">
                    Lampu Penerangan Trotoar & Tombol Pelican Crossing Mati
                  </h4>
                  <span className="text-[11px] text-[#42474f] block">
                    Simpang Empat Pegadaian Kebumen Kota
                  </span>
                </div>

                <div className="p-2.5 bg-[#f2f3ff] rounded-xl text-[11px] text-[#42474f] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#006496] flex-shrink-0 mt-0.5">
                    info
                  </span>
                  <span>
                    Kewenangan sarana perlengkapan jalan & lampu isyarat penyeberang jalan tunanetra dialihkan via Surat Pengantar #551/PUPR/X/2024 ke Seksi Manajemen Lalu Lintas DISHUB Kebumen.
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-[#eaedff]">
                  <span className="text-[#005713] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Diterima Dishub
                  </span>
                  <button
                    type="button"
                    onClick={() => showToast('Surat Tanda Terima Dishub dibuka')}
                    className="text-[#006496] font-bold underline"
                  >
                    Surat Tanda Terima Dishub
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: AUDIT & LAPORAN ================= */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-[#131b2e]">
                      Audit Akuntabilitas Publik
                    </h3>
                    <p className="text-[11px] text-[#42474f]">
                      Sistem Rekam Jejak Keterbukaan & Integritas Penanganan
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-[#a3f69c] text-[#002204] px-2.5 py-0.5 rounded-full animate-pulse">
                    Live Log
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => showToast('Laporan Akuntabilitas Resmi (PDF) diunduh!')}
                    className="flex-1 py-2 bg-[#00355f] text-white hover:bg-[#006496] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Unduh Laporan PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Rekap Data Pengaduan Excel (XLSX) diunduh!')}
                    className="flex-1 py-2 bg-[#eaedff] text-[#00355f] hover:bg-[#dae2fd] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">table_chart</span>
                    <span>Format Excel (XLSX)</span>
                  </button>
                </div>
              </div>

              {/* Metrik SPBE Terakreditasi A */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="material-symbols-outlined text-[20px] text-[#005713]">sentiment_very_satisfied</span>
                    <span className="text-[10px] font-bold bg-[#a3f69c] text-[#002204] px-1.5 py-0.2 rounded">
                      96% Positif
                    </span>
                  </div>
                  <span className="text-xl font-black text-[#00355f] block mt-1">4.8 / 5.0</span>
                  <span className="text-[10px] text-[#42474f] block">Indeks Kepuasan Warga</span>
                  <span className="text-[9px] text-[#727780]">Dari 342 ulasan tervalidasi</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="material-symbols-outlined text-[20px] text-[#006496]">timer</span>
                    <span className="text-[10px] font-bold bg-[#d2e4ff] text-[#001c37] px-1.5 py-0.2 rounded">
                      SLA &lt; 48 Jam
                    </span>
                  </div>
                  <span className="text-xl font-black text-[#006496] block mt-1">94.2 %</span>
                  <span className="text-[10px] text-[#42474f] block">Rasio Tepat Waktu</span>
                  <span className="text-[9px] text-[#727780]">162 dari 172 tiket tepat SLA</span>
                </div>
              </div>

              {/* Anggaran Pemeliharaan Aksesibilitas DPA 2024 */}
              <div className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#131b2e]">
                    Anggaran Pemeliharaan Aksesibilitas (DPA PUPR 2024)
                  </span>
                  <span className="font-extrabold text-[#005713] bg-[#a3f69c] px-2 py-0.5 rounded-md">
                    71%
                  </span>
                </div>

                <div className="w-full bg-[#dae2fd] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#00355f] h-full" style={{ width: '71%' }}></div>
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-[#727780] block">Realisasi Lapangan</span>
                    <span className="font-bold text-[#00355f]">Rp 142.500.000</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#727780] block">Pagu Alokasi</span>
                    <span className="font-bold text-[#131b2e]">Rp 200.000.000</span>
                  </div>
                </div>
              </div>

              {/* Jejak Audit Real-Time */}
              <div className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#131b2e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#00355f]">history</span>
                    Jejak Audit Real-Time
                  </span>
                  <span className="text-[10px] text-[#006496] font-bold">Semua Log</span>
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-[#eaedff] text-xs">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-[#00355f]"></div>
                    <div className="flex justify-between text-[10px] text-[#727780]">
                      <span>Hari ini • 10:45 WIB</span>
                      <span className="font-bold text-[#00355f]">SPK Terbit</span>
                    </div>
                    <h5 className="font-bold text-[#131b2e] text-[11px] mt-0.5">
                      Penerbitan SPK Elektronik #KBM-0911
                    </h5>
                    <p className="text-[10px] text-[#42474f]">
                      Admin Bambang S. mengesahkan penugasan perbaikan ramp jalur pedestrian Alun-alun. Skor SAW: 0.942.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-[#006496]"></div>
                    <div className="flex justify-between text-[10px] text-[#727780]">
                      <span>Hari ini • 09:30 WIB</span>
                      <span className="font-bold text-[#006496]">Geofencing</span>
                    </div>
                    <h5 className="font-bold text-[#131b2e] text-[11px] mt-0.5">
                      Agregasi Otomatis Klaster #KBM-CLUST-04
                    </h5>
                    <p className="text-[10px] text-[#42474f]">
                      Kecerdasan spasial menggabungkan 4 laporan warga identik radius 15m di Jl. Pahlawan untuk efisiensi rute.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pengesahan Kinerja Bulanan */}
              <div className="bg-[#00355f] text-white p-4 rounded-2xl space-y-2 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px] text-[#a3f69c]">
                    verified
                  </span>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">
                      Pengesahan Kinerja Bulanan
                    </h4>
                    <span className="text-[10px] text-[#7fc5fd]">
                      Terverifikasi Kepala Dinas PUPR Kebumen
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#d2e4ff] leading-relaxed">
                  Seluruh 172 data penanganan, skor multi-kriteria SAW, alokasi anggaran, dan catatan penugasan telah diaudit secara sah untuk dipublikasikan pada Portal Informasi Publik Terbuka Kabupaten Kebumen.
                </p>

                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/20 text-[#a3f69c]">
                  <span>🔒 Enkripsi E-Sign BSSN Aktif</span>
                  <span>Reg: KBM-PUPR-X/2024</span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ================= ADMIN BOTTOM NAVIGATION BAR ================= */}
        <nav
          className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#eaedff] pb-safe shadow-lg max-w-md mx-auto"
          aria-label="Navigasi Admin Portal"
        >
          <div className="grid grid-cols-4 h-16 items-center px-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
              { id: 'klaster', label: 'Peta & Klaster', icon: 'map' },
              { id: 'tugas', label: 'Tugas', icon: 'assignment' },
              { id: 'audit', label: 'Audit & Laporan', icon: 'policy' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
                    isActive ? 'text-[#00355f] font-bold' : 'text-[#727780] hover:text-[#00355f]'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center p-1 rounded-full ${
                      isActive ? 'bg-[#cce5ff]/60' : ''
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-1' : ''}`}>
                      {tab.icon}
                    </span>
                  </div>
                  <span className="text-[10px] leading-tight truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
