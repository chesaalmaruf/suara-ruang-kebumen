import React, { useState } from 'react';
import { ReportItem } from '../../types';
import { LeafletMapView } from '../LeafletMapView';
import { DatabaseStatus } from '../../services/reportService';

interface AdminPortalProps {
  reports: ReportItem[];
  onUpdateReportStatus: (reportId: string, newStatus: ReportItem['status']) => void;
  onLogout: () => void;
  onSwitchToCitizen: () => void;
  dbStatus?: DatabaseStatus;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  reports,
  onUpdateReportStatus,
  onLogout,
  onSwitchToCitizen,
  dbStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'peta' | 'tugas' | 'audit'>('dashboard');
  const [selectedDistrict, setSelectedDistrict] = useState('Semua Kecamatan (Kebumen)');
  const [sawQueueTab, setSawQueueTab] = useState<'antrean' | 'prioritas' | 'dikerjakan'>('prioritas');
  const [geofenceRadius, setGeofenceRadius] = useState<'10m' | '20m' | '50m'>('20m');
  const [autoMerge, setAutoMerge] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Verification & Publication state
  const [selectedRegu, setSelectedRegu] = useState('Tim Reaksi Cepat PUPR Regu A (Zona Kebumen)');
  const [uploadedAfterPhoto, setUploadedAfterPhoto] = useState<string | null>(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDjx1gIVdlsHfwiKN3iWrUqwMRQaovbWeySCK5_SvyC3CFTK-Rb-evTVDfHPB_vMoKqRuWkiQhwXwXV7Mi86UUEPJBqGKn1YumqUa0CLL88JF4_XFRVfVGwOvu3cAw0K8FoAaLiJyw7WuISUSxrg6e_M3PaYxfBafTX7RDLD_9gP_OzKvONwS4WOdeJQfc-XLNJUAcZj0bd2DWdH_tv72ao5iTAMw0bxL6zbTY9VrmNJYsFOtob_XEX'
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col max-w-md mx-auto relative select-none pb-20 border-x border-[#eaedff]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 max-w-sm mx-auto bg-[#00355f] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#7fc5fd]/30">
          <span className="material-symbols-outlined text-[18px] text-[#a3f69c]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header (Exact replica of Image 11 / Image 3) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#eaedff] px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {/* Logo DPUPR */}
            <div className="w-8 h-8 rounded-lg bg-[#00355f] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-extrabold text-[#131b2e] truncate">
                Admin Portal Dinas PUPR
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#006496] font-semibold">
                  Kabupaten Kebumen
                </span>
                {dbStatus && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-bold ${
                      dbStatus.connected
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    ● {dbStatus.connected ? 'MongoDB' : 'Local'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Notification Bell with Badge */}
            <button
              onClick={() => showToast('Tidak ada notifikasi darurat baru saat ini.')}
              aria-label="Notifikasi"
              className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#131b2e] flex items-center justify-center hover:bg-[#eaedff] relative transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
            </button>

            {/* Switch to Citizen App */}
            <button
              onClick={onSwitchToCitizen}
              title="Lihat Portal Warga"
              className="w-8 h-8 rounded-full bg-[#eaedff] text-[#00355f] flex items-center justify-center hover:bg-[#dae2fd] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Keluar dari Akun Pengawas"
              className="w-8 h-8 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center hover:bg-[#ffb4ab] transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">logout</span>
            </button>
          </div>
        </div>

        {/* District Filter Pill */}
        <div className="mt-2.5 flex items-center justify-between bg-[#f2f3ff] rounded-xl px-3 py-1.5 text-xs text-[#00355f] font-bold border border-[#dae2fd]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="material-symbols-outlined text-[16px]">domain</span>
            <span>Wilayah: {selectedDistrict}</span>
          </span>
          <span className="material-symbols-outlined text-[18px]">arrow_drop_down</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-5">
        {/* =========================================================================
            TAB 1: DASHBOARD EKSEKUTIF, SAW PRIORITAS & PUBLIKASI (Image 11 / Image 3)
            ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Dashboard Top Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00355f]">
                  DASHBOARD
                </span>
                <h2 className="text-sm font-bold text-[#131b2e]">
                  Ringkasan Kinerja & Validasi
                </h2>
              </div>
              <span className="text-[10px] text-[#42474f] font-semibold bg-[#eaedff] px-2 py-0.5 rounded-md">
                Update: 2 Menit Lalu
              </span>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Total Lap. Aktif */}
              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                  <span>Total Lap. Aktif</span>
                  <span className="material-symbols-outlined text-[18px] text-[#006496]">folder</span>
                </div>
                <span className="text-2xl font-black text-[#00355f] my-0.5">24</span>
                <span className="text-[10px] text-[#006496] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  3 Butuh Verifikasi
                </span>
              </div>

              {/* Darurat / Kritis */}
              <div className="bg-[#ffdad6]/40 p-3 rounded-2xl border border-[#ffdad6] shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center text-[#ba1a1a] text-[11px] font-bold">
                  <span>Darurat / Kritis</span>
                  <span className="material-symbols-outlined text-[18px]">emergency</span>
                </div>
                <span className="text-2xl font-black text-[#ba1a1a] my-0.5">2 Kasus</span>
                <span className="text-[10px] text-[#ba1a1a] font-semibold">
                  Menunggu Verifikasi SPK
                </span>
              </div>

              {/* Resp. Time Rata2 */}
              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                  <span>Resp. Time Rata2</span>
                  <span className="material-symbols-outlined text-[18px] text-[#006496]">timer</span>
                </div>
                <span className="text-2xl font-black text-[#006496] my-0.5">1.4 <span className="text-xs font-bold">Hari</span></span>
                <span className="text-[10px] text-[#005713] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                  0.6 hr dari target
                </span>
              </div>

              {/* Penyelesaian Wilayah */}
              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                  <span>Penyelesaian Wilayah</span>
                  <span className="material-symbols-outlined text-[18px] text-[#006496]">bar_chart</span>
                </div>
                <div className="space-y-1 mt-1 text-[10px]">
                  <div>
                    <div className="flex justify-between font-bold text-[#131b2e]">
                      <span>Kebumen</span>
                      <span>92%</span>
                    </div>
                    <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#00355f] h-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold text-[#131b2e]">
                      <span>Gombong</span>
                      <span>84%</span>
                    </div>
                    <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#006496] h-full" style={{ width: '84%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold text-[#131b2e]">
                      <span>Karanganyar</span>
                      <span>78%</span>
                    </div>
                    <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#727780] h-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peta Analitik & Geofencing Card */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#00355f] text-[18px]">troubleshoot</span>
                  Peta Analitik & Geofencing
                </h3>
                <span className="text-[10px] text-[#006496] font-bold">Radius: {geofenceRadius}</span>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
                <button className="px-2.5 py-1 rounded-full bg-[#00355f] text-white">Semua Kategori</button>
                <button className="px-2.5 py-1 rounded-full bg-[#f2f3ff] text-[#131b2e]">Jalan & Trotoar</button>
                <button className="px-2.5 py-1 rounded-full bg-[#f2f3ff] text-[#131b2e]">Akses Disabilitas</button>
              </div>

              {/* Urgensi Badges */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#42474f]">
                <span>URGENSI:</span>
                <span className="px-2 py-0.5 rounded-md bg-[#ffdad6] text-[#ba1a1a]">Kritis (2)</span>
                <span className="px-2 py-0.5 rounded-md bg-[#cce5ff] text-[#00517b]">Sedang (9)</span>
                <span className="px-2 py-0.5 rounded-md bg-[#a3f69c]/50 text-[#003d0b]">Rendah (13)</span>
              </div>

              {/* Live Interactive Leaflet Map */}
              <LeafletMapView
                reports={reports}
                heightClass="h-48"
                geofenceRadiusMeters={geofenceRadius === '10m' ? 10 : geofenceRadius === '20m' ? 20 : 50}
                onSelectReport={id => showToast(`Titik ${id} dipilih untuk inspeksi.`)}
              />

              {/* Banner Duplikasi Terdeteksi */}
              <div className="p-2.5 bg-[#f2f3ff] rounded-xl flex items-center justify-between text-[11px] font-bold text-[#00355f]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#006496]">hub</span>
                  <span>2 Titik Klaster Duplikasi Terdeteksi</span>
                </div>
                <span className="text-[10px] bg-[#dae2fd] px-2 py-0.5 rounded-md">Radius 20m</span>
              </div>

              {/* Klaster Aktif Card */}
              <div className="p-3 bg-[#eaedff] rounded-xl border border-[#cce5ff] space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#00355f] text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">polyline</span>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-[#131b2e]">
                        Klaster Aktif: Jl. Kusuma & Simpang RSUD
                      </h4>
                      <span className="text-[10px] text-[#006496] font-semibold">
                        4 Laporan Diagregasikan (#KBM-CLUST-04)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAutoMerge(!autoMerge);
                      showToast(autoMerge ? 'Auto-Merge dimatikan.' : 'Auto-Merge diaktifkan (+0.20 SAW)!');
                    }}
                    className="px-2 py-1 rounded-md bg-[#00355f] text-white text-[10px] font-bold hover:bg-[#006496]"
                  >
                    Auto-Merge
                  </button>
                </div>

                <p className="text-[11px] text-[#42474f] leading-relaxed">
                  4 Laporan Warga Diagregasikan menjadi 1 Tiket Induk <strong>#KBM-CLUST-04</strong>. Bobot parameter frekuensi dampak publik otomatis dinaikkan (+0.20).
                </p>

                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#dae2fd]">
                  <span className="text-[#00355f] font-mono font-bold">
                    Tiket Tergabung: #0908, #0910, #0911, #0915
                  </span>
                  <button
                    onClick={() => setActiveTab('peta')}
                    className="text-[#006496] font-bold hover:underline"
                  >
                    Lihat Rincian Agregasi =
                  </button>
                </div>
              </div>
            </div>

            {/* SISTEM PENDUKUNG KEPUTUSAN: Manajemen Validasi & Peringkat SAW */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#006496]">
                    SISTEM PENDUKUNG KEPUTUSAN
                  </span>
                  <h3 className="text-xs font-bold text-[#131b2e]">
                    Manajemen Validasi & Peringkat SAW
                  </h3>
                </div>
                <span className="bg-[#d2e4ff] text-[#001c37] text-[10px] font-bold px-2 py-0.5 rounded-md">
                  18 Antrean
                </span>
              </div>

              {/* Sub-tabs */}
              <div className="grid grid-cols-3 gap-1 bg-[#f2f3ff] p-1 rounded-xl text-[10px] font-bold text-center">
                <button
                  onClick={() => setSawQueueTab('antrean')}
                  className={`py-1.5 rounded-lg transition-colors ${
                    sawQueueTab === 'antrean'
                      ? 'bg-white text-[#00355f] shadow-xs'
                      : 'text-[#42474f] hover:text-[#00355f]'
                  }`}
                >
                  Antrean Validasi (8)
                </button>
                <button
                  onClick={() => setSawQueueTab('prioritas')}
                  className={`py-1.5 rounded-lg transition-colors ${
                    sawQueueTab === 'prioritas'
                      ? 'bg-white text-[#00355f] shadow-xs'
                      : 'text-[#42474f] hover:text-[#00355f]'
                  }`}
                >
                  Prioritas SAW (16)
                </button>
                <button
                  onClick={() => setSawQueueTab('dikerjakan')}
                  className={`py-1.5 rounded-lg transition-colors ${
                    sawQueueTab === 'dikerjakan'
                      ? 'bg-white text-[#00355f] shadow-xs'
                      : 'text-[#42474f] hover:text-[#00355f]'
                  }`}
                >
                  Sedang Dikerjakan (5)
                </button>
              </div>

              {/* Laporan Masuk Belum Tervalidasi */}
              <div className="p-3 bg-[#f2f3ff] rounded-xl space-y-2 border border-[#dae2fd]">
                <span className="text-[10px] font-bold text-[#ba1a1a] uppercase">
                  Laporan Masuk Belum Tervalidasi
                </span>
                <div className="flex gap-2.5">
                  <div className="w-14 h-14 rounded-lg bg-[#eaedff] overflow-hidden flex-shrink-0">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1Q3FRuW7Tg0DI06kWvMJ1quckUoxg3R4k5k0kGTr4qYevnGA3RtPr5joGVFSkXoHY5LFNuN-Yr6LrqSsBuVwm9ohWi8WT5X6561fXwNRc9BZWjDP3iABe_FZiR6iKH7MmV_e8xi6A0RFQ26Qk3XDuH1CekXhj1HD1LKlMr6IA0A7w1TFLE5HQu89w-AvspmfMxNhukxKfQAbvxxubobp85FFJrIoSx2PTEGzUqFbK9-FfX_Nf3UJa"
                      alt="Trotoar Rusak"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-[#131b2e] truncate">
                      Trotoar & Saluran Rusak Parah
                    </h4>
                    <p className="text-[10px] text-[#42474f] truncate">
                      Jl. Tentara Pelajar (Dekat Stasiun Kebumen)
                    </p>
                    <span className="text-[10px] text-[#006496] font-semibold">
                      Pelapor: Hendra (Foto Meta Terverifikasi)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => showToast('Laporan Hendra divalidasi ke antrean SAW!')}
                  className="w-full py-1.5 bg-white text-[#00355f] border border-[#cce5ff] rounded-lg text-[11px] font-bold hover:bg-[#eaedff] flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  <span>Validasi</span>
                </button>
              </div>

              {/* Rank #1 Card: #KBM-0911 */}
              <div className="p-3.5 bg-white rounded-xl border-2 border-[#00355f] space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-[#00355f] bg-[#eaedff] px-2 py-0.5 rounded">
                      #KBM-0911
                    </span>
                    <span className="text-[10px] text-[#42474f]">14 Menit lalu</span>
                  </div>
                  <div className="bg-[#00355f] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    RANK #1 • Skor V: 0.942
                  </div>
                </div>

                <div>
                  <h4 className="text-[12px] font-bold text-[#131b2e]">
                    Ramp Trotoar Amblas Depan RSUD Dr. Soedirman
                  </h4>
                  <p className="text-[10px] text-[#42474f] flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px] text-[#006496]">location_on</span>
                    Jl. Lingkar Selatan KM 2.3, Kebumen
                  </p>
                </div>

                {/* Breakdown C1-C4 */}
                <div className="space-y-1.5 pt-1 text-[10px] border-t border-[#eaedff]">
                  <div className="flex justify-between items-center">
                    <span>Rincian :</span>
                    <span className="text-[#42474f] font-mono">Total Bobot: 1.00</span>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[#ba1a1a]">
                      <span>C1: Bahaya Keselamatan</span>
                      <span>0.95 (Sangat Kritis)</span>
                    </div>
                    <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div className="bg-[#ba1a1a] h-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[#ba1a1a]">
                      <span>C2: Akses Difabel</span>
                      <span>0.90 (Total Blokir)</span>
                    </div>
                    <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div className="bg-[#ba1a1a] h-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[#00355f]">
                      <span>C3: Kepadatan Faskes</span>
                      <span>0.85 (Zona Padat)</span>
                    </div>
                    <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div className="bg-[#00355f] h-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[#006496]">
                      <span>C4: Skala Kerusakan</span>
                      <span>0.80 (&gt;20cm Amblas)</span>
                    </div>
                    <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div className="bg-[#006496] h-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      onUpdateReportStatus('#KBM-2024-089', 'in_progress');
                      showToast('SPK Elektronik PUPR berhasil diterbitkan!');
                    }}
                    className="py-2 bg-[#00355f] text-white rounded-xl text-[11px] font-bold hover:bg-[#006496] flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">assignment_turned_in</span>
                    <span>Terbitkan SPK PUPR</span>
                  </button>

                  <button
                    onClick={() => showToast('Disposisi lapangan dialihkan ke regu siaga TRC!')}
                    className="py-2 bg-white text-[#00355f] border border-[#00355f] rounded-xl text-[11px] font-bold hover:bg-[#f2f3ff] flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">send_time_extension</span>
                    <span>Disposisi Lapangan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Disposisi Tim Teknis & Publikasi (Sebelum-Sesudah) */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#00355f] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">groups</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#131b2e]">
                      Disposisi Tim Teknis & Publikasi
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] text-[#006496] font-bold bg-[#eaedff] px-2 py-0.5 rounded">
                  Akuntabilitas Publik
                </span>
              </div>

              {/* Dropdown Regu Pelaksana */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#131b2e]">
                  Penugasan Regu Pelaksana:
                </label>
                <div className="relative">
                  <select
                    value={selectedRegu}
                    onChange={e => setSelectedRegu(e.target.value)}
                    className="w-full h-10 px-3 pr-8 rounded-xl bg-[#f2f3ff] text-xs font-bold text-[#00355f] border border-[#dae2fd] focus:outline-none"
                  >
                    <option>Tim Reaksi Cepat PUPR Regu A (Zona Kebumen)</option>
                    <option>Tim Reaksi Cepat PUPR Regu B (Zona Gombong)</option>
                    <option>Tim Pemeliharaan Rutin Regu C (Zona Prembun)</option>
                  </select>
                </div>
              </div>

              {/* Unggah Bukti Pasca-Perbaikan */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-[#131b2e]">Unggah Bukti Pasca-Perbaikan:</span>
                  <span className="text-[#006496] font-semibold">Komparasi Sebelum & Sesudah</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Sebelum */}
                  <div className="relative h-28 rounded-xl overflow-hidden border border-[#eaedff] bg-[#eaedff]">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1Q3FRuW7Tg0DI06kWvMJ1quckUoxg3R4k5k0kGTr4qYevnGA3RtPr5joGVFSkXoHY5LFNuN-Yr6LrqSsBuVwm9ohWi8WT5X6561fXwNRc9BZWjDP3iABe_FZiR6iKH7MmV_e8xi6A0RFQ26Qk3XDuH1CekXhj1HD1LKlMr6IA0A7w1TFLE5HQu89w-AvspmfMxNhukxKfQAbvxxubobp85FFJrIoSx2PTEGzUqFbK9-FfX_Nf3UJa"
                      alt="Sebelum"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-[#ba1a1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Sebelum
                    </span>
                    <span className="absolute bottom-1.5 inset-x-1.5 bg-black/75 text-white text-[8px] p-1 rounded text-center truncate">
                      Trotoar Amblas (Warga)
                    </span>
                  </div>

                  {/* Sesudah / Upload Box */}
                  <div
                    onClick={() => {
                      showToast('Foto Sesudah Pengerjaan DPUPR Terpilih!');
                    }}
                    className="relative h-28 rounded-xl border-2 border-dashed border-[#006496] bg-[#f2f3ff] hover:bg-[#eaedff] cursor-pointer flex flex-col items-center justify-center p-2 text-center transition-colors"
                  >
                    {uploadedAfterPhoto ? (
                      <>
                        <img
                          src={uploadedAfterPhoto}
                          alt="Sesudah"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <span className="absolute top-1.5 right-1.5 bg-[#005713] text-[#a3f69c] text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Sesudah
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[24px] text-[#006496]">
                          add_photo_alternate
                        </span>
                        <span className="text-[10px] font-bold text-[#00355f] mt-1">
                          Unggah Foto Sesudah
                        </span>
                        <span className="text-[8px] text-[#42474f]">JPG/PNG maks. 5MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Big Green Publish Button */}
              <button
                onClick={() => {
                  onUpdateReportStatus('#KBM-2025-0842', 'completed');
                  showToast('Hasil perbaikan berhasil dipublikasikan ke Portal Warga & status tiket tuntas 100%!');
                }}
                className="w-full py-3 bg-[#005713] hover:bg-[#003d0b] text-[#a3f69c] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[18px]">public</span>
                <span>Publikasikan ke Portal Warga & Selesaikan Tiket</span>
              </button>

              <p className="text-[10px] text-[#42474f] text-center">
                Data penyelesaian dan foto pasca-pengerjaan akan langsung dapat ditinjau oleh warga di menu Lacak Laporan.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: PETA & KLASTER GEOFENCING (Exact replica of Image 7)
            ========================================================================= */}
        {activeTab === 'peta' && (
          <div className="space-y-4">
            {/* Geofencing Header Controls */}
            <div className="bg-white p-3 rounded-2xl border border-[#eaedff] space-y-2">
              <div className="text-center font-bold text-xs text-[#131b2e]">
                Geofencing Klaster
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {(['10m', '20m', '50m'] as const).map(rad => (
                    <button
                      key={rad}
                      onClick={() => setGeofenceRadius(rad)}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                        geofenceRadius === rad
                          ? 'bg-[#00355f] text-white shadow-xs'
                          : 'bg-[#f2f3ff] text-[#00355f] hover:bg-[#eaedff]'
                      }`}
                    >
                      {rad}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#131b2e]">Auto-Merge</span>
                  <button
                    onClick={() => {
                      setAutoMerge(!autoMerge);
                      showToast(autoMerge ? 'Auto-merge dinonaktifkan.' : 'Auto-merge diaktifkan.');
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      autoMerge ? 'bg-[#00355f]' : 'bg-[#dae2fd]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        autoMerge ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Map Canvas with Clusters */}
            <div className="bg-white p-2 rounded-2xl border border-[#eaedff] shadow-xs space-y-2">
              <LeafletMapView
                reports={reports}
                heightClass="h-56"
                geofenceRadiusMeters={geofenceRadius === '10m' ? 10 : geofenceRadius === '20m' ? 20 : 50}
                onSelectReport={id => showToast(`Memeriksa detail klaster geospasial ${id}`)}
              />
              {/* Map Footer Legend */}
              <div className="flex justify-around text-[10px] font-bold text-[#42474f] pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></span>
                  Kritis (&gt;=4)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006496]"></span>
                  Sedang (2-3)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#005713]"></span>
                  Tunggal (1)
                </span>
              </div>
            </div>

            {/* Cluster Detail Card #KBM-CLUST-04 */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-extrabold px-2 py-0.5 rounded">
                    Prioritas Kritis
                  </span>
                  <div className="text-xs font-bold text-[#131b2e] mt-1">
                    #KBM-CLUST-04
                  </div>
                  <h4 className="text-xs font-bold text-[#131b2e]">
                    Simpang Empat RSUD Kebumen
                  </h4>
                  <p className="text-[10px] text-[#42474f]">
                    Kecamatan Kebumen • Radius Geofence {geofenceRadius}
                  </p>
                </div>

                <div className="bg-[#f2f3ff] p-2 rounded-xl text-center">
                  <span className="text-[9px] text-[#42474f] font-semibold block">
                    BOBOT FREKUENSI
                  </span>
                  <span className="text-xs font-extrabold text-[#ba1a1a]">
                    +0.20 SAW
                  </span>
                </div>
              </div>

              {/* 4 Laporan Warga Teragregasi Notice */}
              <div className="p-2.5 bg-[#eaedff] rounded-xl flex items-center justify-between text-xs text-[#00355f] font-bold">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">vertical_align_top</span>
                  <span>4 Laporan Warga Teragregasi</span>
                </div>
                <span className="text-[10px] text-[#006496]">Geotag Presisi ±3m</span>
              </div>

              {/* 4 Combined Tickets List */}
              <div className="space-y-1.5 text-xs">
                {[
                  { id: '#KBM-0908', time: '35 mnt lalu', title: 'Guiding block hancur dekat zebra cross', reporter: 'Ahmad Rifai' },
                  { id: '#KBM-0910', time: '1 jam lalu', title: 'Ramp kursi roda terhalang tiang listrik', reporter: 'Sri Wahyuni' },
                  { id: '#KBM-0911', time: '2 jam lalu', title: 'Manhole saluran terbuka tanpa penutup', reporter: 'Budi Santoso' },
                  { id: '#KBM-0915', time: '3 jam lalu', title: 'Jalur tactile licin berlumut & curam', reporter: 'Hendra Kurnia' },
                ].map(item => (
                  <div key={item.id} className="p-2 bg-[#f2f3ff] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-mono font-bold text-[11px] text-[#00355f]">
                        <span>{item.id}</span>
                        <span className="text-[10px] text-[#42474f] font-normal">{item.time}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#131b2e]">{item.title}</div>
                      <div className="text-[10px] text-[#42474f]">Pelapor: {item.reporter}</div>
                    </div>
                    <span className="material-symbols-outlined text-[#727780] text-[18px]">chevron_right</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => showToast('Klaster berhasil divalidasi & diteruskan ke antrean SPK!')}
                className="w-full py-2.5 bg-[#00355f] text-white rounded-xl text-xs font-bold hover:bg-[#006496] transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>Validasi Klaster & Teruskan ke Antrean SPK SAW</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => showToast('Klaster dipisahkan menjadi tiket individu!')}
                  className="py-2 bg-[#f2f3ff] text-[#ba1a1a] rounded-xl text-xs font-bold hover:bg-[#ffdad6] transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">call_split</span>
                  <span>Pisahkan (Unmerge)</span>
                </button>
                <button
                  onClick={() => showToast('Titik koordinat GPS berhasil diekspor (GeoJSON/CSV)!')}
                  className="py-2 bg-[#eaedff] text-[#00355f] rounded-xl text-xs font-bold hover:bg-[#dae2fd] transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Ekspor Titik GPS</span>
                </button>
              </div>
            </div>

            {/* Klaster Lain di Kebumen */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#131b2e]">
                <span>Klaster Lain di Kebumen</span>
                <span className="text-[#006496]">2 Klaster Aktif</span>
              </div>

              {/* Cluster 2 */}
              <div className="bg-white p-3 rounded-xl border border-[#eaedff] shadow-xs space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="bg-[#cce5ff] text-[#00517b] font-bold px-2 py-0.5 rounded">
                    Prioritas Sedang
                  </span>
                  <span className="font-mono font-bold text-[#00355f]">#KBM-CLUST-02</span>
                </div>
                <h4 className="text-xs font-bold text-[#131b2e]">
                  Koridor Jl. Tentara Pelajar (Depan SMA N 1)
                </h4>
                <div className="flex justify-between items-center text-[10px] text-[#42474f]">
                  <span>Radius 15m • 2 Laporan Masuk</span>
                  <span className="font-bold text-[#006496]">Skor SAW: 0.742</span>
                </div>
              </div>

              {/* Cluster 3 */}
              <div className="bg-white p-3 rounded-xl border border-[#eaedff] shadow-xs space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="bg-[#a3f69c] text-[#003d0b] font-bold px-2 py-0.5 rounded">
                    Dalam Pemantauan
                  </span>
                  <span className="font-mono font-bold text-[#00355f]">#KBM-CLUST-05</span>
                </div>
                <h4 className="text-xs font-bold text-[#131b2e]">
                  Pedestrian Lingkar Alun-Alun Pancasila
                </h4>
                <div className="flex justify-between items-center text-[10px] text-[#42474f]">
                  <span>Radius 20m • 3 Laporan Masuk</span>
                  <span className="font-bold text-[#005713]">Skor SAW: 0.690</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: TUGAS OPERASIONAL LAPANGAN TRC PUPR (Exact replica of Image 3)
            ========================================================================= */}
        {activeTab === 'tugas' && (
          <div className="space-y-4">
            {/* Header Badge */}
            <div className="space-y-1">
              <span className="bg-[#cce5ff] text-[#00517b] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                Operasional Lapangan TRC PUPR
              </span>
              <h2 className="text-sm font-black text-[#131b2e] tracking-tight">
                Daftar Tugas SPK Terbit
              </h2>
              <p className="text-xs text-[#42474f]">
                Disposisi otomatis prioritas Simple Additive Weighting & pemantauan realtime regu tanggap fasilitas disabilitas.
              </p>
            </div>

            {/* 3 Metrics: SPK AKTIF, RATA DURASI, REGU SIAGA */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs text-center">
                <span className="text-[10px] text-[#42474f] font-semibold block">SPK AKTIF</span>
                <span className="text-xl font-black text-[#00355f] block my-0.5">12</span>
                <span className="text-[9px] text-[#006496] font-bold">5 Siap Berangkat</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs text-center">
                <span className="text-[10px] text-[#42474f] font-semibold block">RATA DURASI</span>
                <span className="text-xl font-black text-[#006496] block my-0.5">2.1 <span className="text-xs">hr</span></span>
                <span className="text-[9px] text-[#005713] font-bold">Tepat SLA (94%)</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs text-center">
                <span className="text-[10px] text-[#42474f] font-semibold block">REGU SIAGA</span>
                <span className="text-xl font-black text-[#005713] block my-0.5">3</span>
                <span className="text-[9px] text-[#003d0b] font-bold">A, B, & C Aktif</span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              <button className="px-3 py-1.5 rounded-full bg-[#00355f] text-white">Semua 18</button>
              <button className="px-3 py-1.5 rounded-full bg-[#eaedff] text-[#00355f]">Diterbitkan 5</button>
              <button className="px-3 py-1.5 rounded-full bg-[#f2f3ff] text-[#42474f]">Dalam Pengerjaan</button>
              <button className="px-3 py-1.5 rounded-full bg-[#f2f3ff] text-[#42474f]">Selesai</button>
            </div>

            {/* Card SPK 1: #SPK-PUPR-2024-089 */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs text-[#00355f]">
                    #SPK-PUPR-2024-089
                  </span>
                  <span className="bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold px-2 py-0.5 rounded">
                    Prioritas #1 SAW (0.942)
                  </span>
                </div>
                <span className="bg-[#cce5ff] text-[#00517b] text-[10px] font-extrabold px-2 py-0.5 rounded">
                  Sedang Dikerjakan
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#42474f]">Diterbitkan 29 Okt, 08:30 WIB</span>
                <h4 className="text-xs font-bold text-[#131b2e] leading-snug">
                  Rekonstruksi Ramp Trotoar & Saluran Terbuka Depan RSUD Dr. Soedirman
                </h4>
                <p className="text-[10px] text-[#42474f] flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-[#006496]">location_on</span>
                  Jl. Lingkar Selatan KM 2.5, Muktisari, Kec. Kebumen
                </p>
              </div>

              {/* Regu Info Box */}
              <div className="p-2.5 bg-[#f2f3ff] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00355f] text-white flex items-center justify-center font-bold text-[10px]">
                    TRC-A
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#131b2e]">Tim Reaksi Cepat Regu A</div>
                    <div className="text-[10px] text-[#42474f]">Ketua: Bpk. Bambang • 6 Personel</div>
                  </div>
                </div>
                <span className="text-[10px] bg-[#dae2fd] text-[#00355f] font-bold px-2 py-0.5 rounded">
                  Foto TRC
                </span>
              </div>

              {/* SLA Target & Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-[#00355f] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">timer</span> Target SLA: 48 Jam
                  </span>
                  <span className="text-[#ba1a1a]">Sisa 18 Jam 15 Menit</span>
                </div>
                <div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#00355f] h-full" style={{ width: '65%' }}></div>
                </div>
                <div className="text-[10px] text-[#42474f] text-right font-semibold">
                  Pengecoran dasar ramp & penutup saluran <strong>65% Rampung</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => showToast('Surat SPK Elektronik (PDF) berhasil diunduh!')}
                  className="py-2 bg-[#f2f3ff] text-[#00355f] rounded-xl text-xs font-bold hover:bg-[#eaedff] flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                  <span>Surat SPK (PDF)</span>
                </button>

                <button
                  onClick={() => showToast('Progres pengerjaan diperbarui ke 75%!')}
                  className="py-2 bg-[#00355f] text-white rounded-xl text-xs font-bold hover:bg-[#006496] flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">edit_note</span>
                  <span>Update Progres</span>
                </button>
              </div>

              <button
                onClick={() => window.location.href = 'tel:0287381110'}
                className="w-full py-2 bg-[#eaedff] text-[#00355f] rounded-xl text-xs font-bold hover:bg-[#dae2fd] flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">call</span>
                <span>Hubungi Hotline Komunikasi Regu Lapangan</span>
              </button>
            </div>

            {/* Card SPK 2: #SPK-PUPR-2024-092 */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-xs text-[#00355f]">
                    #SPK-PUPR-2024-092
                  </span>
                  <span className="bg-[#cce5ff] text-[#00517b] text-[10px] font-bold px-2 py-0.5 rounded">
                    Prioritas #3 SAW (0.812)
                  </span>
                </div>
                <span className="bg-[#f2f3ff] text-[#727780] text-[10px] font-extrabold px-2 py-0.5 rounded">
                  Menunggu Berangkat
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#42474f]">Diterbitkan Hari ini, 11:15 WIB</span>
                <h4 className="text-xs font-bold text-[#131b2e] leading-snug">
                  Penggantian Penutup Manhole Saluran & Guiding Block Terbuka
                </h4>
                <p className="text-[10px] text-[#42474f] flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-[#006496]">location_on</span>
                  Jl. Pahlawan No. 42 (Depan Kantor Pos Gombong)
                </p>
              </div>

              <div className="p-2 bg-[#f2f3ff] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#131b2e]">Tim Pemeliharaan Regu B</div>
                  <div className="text-[10px] text-[#42474f]">PJ: Sdr. Joko Santoso</div>
                </div>
                <span className="text-[10px] text-[#00355f] font-mono font-bold">2 Unit Grill Besi Cor</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => showToast('Form revisi disposisi dibuka.')}
                  className="py-2 bg-[#f2f3ff] text-[#00355f] rounded-xl text-xs font-bold hover:bg-[#eaedff]"
                >
                  Revisi Disposisi
                </button>
                <button
                  onClick={() => showToast('Tugas Regu B dimulai! Armada berangkat ke Gombong.')}
                  className="py-2 bg-[#00355f] text-white rounded-xl text-xs font-bold hover:bg-[#006496] flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                  <span>Mulai Tugas</span>
                </button>
              </div>
            </div>

            {/* Disposisi Lintas Instansi (DISHUB) */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold text-[#00355f]">#DISP-DISHUB-014</span>
                <span className="bg-[#dae2fd] text-[#00355f] text-[10px] font-bold px-2 py-0.5 rounded">
                  Bukan Aset PUPR
                </span>
              </div>

              <h4 className="text-xs font-bold text-[#131b2e]">
                Lampu Penerangan Trotoar & Tombol Pelican Crossing Mati
              </h4>
              <p className="text-[10px] text-[#42474f]">
                Simpang Empat Pegadaian Kebumen Kota
              </p>

              <div className="p-2.5 bg-[#eaedff] rounded-xl text-[10px] text-[#00355f] leading-relaxed">
                Kewenangan sarana perlengkapan jalan & lampu isyarat penyeberang jalan tunanetra dialihkan via Surat Pengantar #551/PUPR/X/2024 ke Seksi Manajemen Lalu Lintas DISHUB Kebumen.
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => showToast('Surat Tanda Terima Dishub (PDF) diunduh!')}
                  className="flex-1 py-1.5 bg-[#f2f3ff] text-[#00355f] rounded-lg text-xs font-bold hover:bg-[#eaedff] flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">description</span>
                  <span>Surat Tanda Terima Dishub</span>
                </button>
                <button
                  onClick={() => showToast('Status konfirmasi Dishub diverifikasi.')}
                  className="flex-1 py-1.5 bg-[#005713] text-[#a3f69c] rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">done_all</span>
                  <span>Diterima Dishub</span>
                </button>
              </div>
            </div>

            {/* Big Terbitkan SPK Button */}
            <button
              onClick={() => showToast('SPK baru dibuat dari urutan teratas antrean SAW!')}
              className="w-full py-3 bg-[#00355f] hover:bg-[#006496] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              <span>+ Terbitkan SPK dari Antrean SAW</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 4: AUDIT AKUNTABILITAS PUBLIK & SPBE (Exact replica of Image 9)
            ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Header Box */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs font-bold text-[#131b2e]">
                    Audit Akuntabilitas Publik
                  </h2>
                  <p className="text-[11px] text-[#42474f] leading-snug mt-0.5">
                    Sistem Rekam Jejak Keterbukaan & Integritas Penanganan
                  </p>
                </div>
                <span className="bg-[#a3f69c] text-[#002204] text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#005713] animate-ping"></span>
                  Live Log
                </span>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#f2f3ff] p-2 rounded-xl flex items-center justify-between text-[#00355f] font-bold">
                  <span>Oktober 2024</span>
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                </div>
                <div className="bg-[#f2f3ff] p-2 rounded-xl flex items-center justify-between text-[#00355f] font-bold">
                  <span>Seluruh Kebumen</span>
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => showToast('Mengunduh Laporan Akuntabilitas Publik (PDF)...')}
                  className="py-2.5 bg-[#00355f] text-white rounded-xl text-xs font-bold hover:bg-[#006496] flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>Unduh Laporan PDF</span>
                </button>
                <button
                  onClick={() => showToast('Mengunduh Rekapitulasi Data (XLSX)...')}
                  className="py-2.5 bg-[#eaedff] text-[#00355f] rounded-xl text-xs font-bold hover:bg-[#dae2fd] flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                  <span>Format Excel (XLSX)</span>
                </button>
              </div>
            </div>

            {/* Metrik Integritas & Kinerja SPBE Terakreditasi A */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#131b2e]">Metrik Integritas & Kinerja</span>
                <span className="text-[#005713] bg-[#a3f69c]/30 px-2 py-0.5 rounded">
                  SPBE Terakreditasi A
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Indeks Kepuasan Warga */}
                <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs space-y-1">
                  <span className="bg-[#a3f69c] text-[#002204] text-[10px] font-bold px-2 py-0.5 rounded">
                    96% Positif
                  </span>
                  <div className="text-xl font-black text-[#131b2e] pt-1">
                    4.8 <span className="text-xs font-normal text-[#42474f]">/ 5.0</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#131b2e]">Indeks Kepuasan Warga</div>
                  <div className="text-[10px] text-[#42474f]">Dari 342 ulasan tervalidasi</div>
                </div>

                {/* Rasio Tepat Waktu SLA */}
                <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs space-y-1">
                  <span className="bg-[#cce5ff] text-[#00517b] text-[10px] font-bold px-2 py-0.5 rounded">
                    SLA &lt; 48 Jam
                  </span>
                  <div className="text-xl font-black text-[#006496] pt-1">
                    94.2 %
                  </div>
                  <div className="text-[11px] font-bold text-[#131b2e]">Rasio Tepat Waktu</div>
                  <div className="text-[10px] text-[#42474f]">162 dari 172 tiket tepat SLA</div>
                </div>
              </div>
            </div>

            {/* Anggaran Pemeliharaan Aksesibilitas */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#131b2e] block">
                    Anggaran Pemeliharaan Aksesibilitas
                  </span>
                  <span className="text-[10px] text-[#42474f]">
                    Tahun Anggaran Berjalan (DPA PUPR 2024)
                  </span>
                </div>
                <span className="text-base font-black text-[#00355f]">71%</span>
              </div>

              <div className="w-full bg-[#dae2fd] h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#00355f] h-full rounded-full" style={{ width: '71%' }}></div>
              </div>

              <div className="flex justify-between text-[11px] pt-1 text-[#42474f]">
                <div>
                  <span className="block text-[10px]">Realisasi Lapangan</span>
                  <span className="font-bold text-[#005713]">Rp 142.500.000</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px]">Pagu Alokasi</span>
                  <span className="font-bold text-[#131b2e]">Rp 200.000.000</span>
                </div>
              </div>
            </div>

            {/* Jejak Audit Real-Time */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#131b2e]">
                <span>Jejak Audit Real-Time</span>
                <span className="text-[#006496]">Lihat Semua →</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-[#eaedff] space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#42474f]">Hari ini • 10:45 WIB</span>
                    <span className="bg-[#cce5ff] text-[#00517b] font-bold px-2 py-0.5 rounded">
                      SPK Terbit
                    </span>
                  </div>
                  <h4 className="font-bold text-[#131b2e]">
                    Penerbitan SPK Elektronik #KBM-0911
                  </h4>
                  <p className="text-[11px] text-[#42474f] leading-relaxed">
                    Admin Bambang S. mengesahkan penugasan perbaikan ramp jalur pedestrian Alun-alun. Verifikasi SAW Skor: <strong>0.942 (Prioritas 1)</strong>.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#eaedff] space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#42474f]">Hari ini • 09:30 WIB</span>
                    <span className="bg-[#dae2fd] text-[#00355f] font-bold px-2 py-0.5 rounded">
                      Geofencing
                    </span>
                  </div>
                  <h4 className="font-bold text-[#131b2e]">
                    Agregasi Otomatis Klaster #KBM-CLUST-04
                  </h4>
                  <p className="text-[11px] text-[#42474f] leading-relaxed">
                    Kecerdasan spasial menggabungkan 4 laporan warga identik radius 15m di Jl. Pahlawan untuk efisiensi rute penanganan.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#eaedff] space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#42474f]">Kemarin • 16:20 WIB</span>
                    <span className="bg-[#a3f69c] text-[#002204] font-bold px-2 py-0.5 rounded">
                      Selesai & Publish
                    </span>
                  </div>
                  <h4 className="font-bold text-[#131b2e]">
                    Verifikasi Ramp Jl. Pemuda (Tiket #KBM-0882)
                  </h4>
                  <p className="text-[11px] text-[#42474f] leading-relaxed">
                    TRC Regu A mengunggah bukti fisik tuntas. Pengawas lapangan melakukan validasi geo-metadata dan merilis publikasi terbuka.
                  </p>
                </div>
              </div>
            </div>

            {/* Komparasi Verifikasi Lapangan #KBM-0882 */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#131b2e]">Komparasi Verifikasi Lapangan</span>
                <span className="font-mono font-bold text-[#00355f]">#KBM-0882</span>
              </div>
              <h4 className="text-xs font-bold text-[#131b2e]">
                Penyelarasan Ramp Trotoar Difabel Jl. Pemuda Km 1.2, Kelurahan Kutosari, Kebumen
              </h4>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="relative rounded-xl overflow-hidden h-28 bg-[#eaedff]">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1Q3FRuW7Tg0DI06kWvMJ1quckUoxg3R4k5k0kGTr4qYevnGA3RtPr5joGVFSkXoHY5LFNuN-Yr6LrqSsBuVwm9ohWi8WT5X6561fXwNRc9BZWjDP3iABe_FZiR6iKH7MmV_e8xi6A0RFQ26Qk3XDuH1CekXhj1HD1LKlMr6IA0A7w1TFLE5HQu89w-AvspmfMxNhukxKfQAbvxxubobp85FFJrIoSx2PTEGzUqFbK9-FfX_Nf3UJa"
                    alt="Sebelum"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-[#ba1a1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Sebelum</span>
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 text-white text-[9px] p-0.5 rounded text-center">Tingkat Kemiringan &gt; 18°</span>
                </div>

                <div className="relative rounded-xl overflow-hidden h-28 bg-[#eaedff]">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjx1gIVdlsHfwiKN3iWrUqwMRQaovbWeySCK5_SvyC3CFTK-Rb-evTVDfHPB_vMoKqRuWkiQhwXwXV7Mi86UUEPJBqGKn1YumqUa0CLL88JF4_XFRVfVGwOvu3cAw0K8FoAaLiJyw7WuISUSxrg6e_M3PaYxfBafTX7RDLD_9gP_OzKvONwS4WOdeJQfc-XLNJUAcZj0bd2DWdH_tv72ao5iTAMw0bxL6zbTY9VrmNJYsFOtob_XEX"
                    alt="Sesudah"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 right-1.5 bg-[#005713] text-[#a3f69c] text-[9px] font-bold px-1.5 py-0.5 rounded">Sesudah</span>
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 text-white text-[9px] p-0.5 rounded text-center">Standar Permen PUPR Sesuai</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] pt-1 border-t border-[#eaedff]">
                <span className="text-[#005713] font-bold">Validasi: Ir. H. Supriyanto, M.T. (Stempel Digital SHA-256)</span>
                <span className="text-[#006496] font-bold hover:underline cursor-pointer">Detail Geotag</span>
              </div>
            </div>

            {/* Pengesahan Kinerja Bulanan */}
            <div className="p-3.5 bg-[#00355f] text-white rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#7fc5fd]">verified</span>
                  Pengesahan Kinerja Bulanan
                </span>
                <span className="text-[10px] text-[#a0c9ff]">Terverifikasi Kadis</span>
              </div>
              <p className="text-[11px] text-[#d2e4ff] leading-relaxed">
                Seluruh 172 data penanganan, skor multi-kriteria SAW, alokasi anggaran, dan catatan penugasan telah diaudit secara sah untuk dipublikasikan pada Portal Informasi Publik Terbuka Kabupaten Kebumen.
              </p>
              <div className="flex justify-between items-center text-[10px] pt-1 border-t border-white/20 text-[#a0c9ff]">
                <span>Enkripsi E-Sign BSSN Aktif</span>
                <span className="font-mono">Reg: KBM-PUPR-X/2024</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Bottom Navigation Bar (Exact replica of Image 11 / Image 3 / Image 7 / Image 9) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#eaedff] pb-safe shadow-lg max-w-md mx-auto">
        <div className="grid grid-cols-4 items-center h-16 px-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
            { id: 'peta', label: 'Peta & Klaster', icon: 'map' },
            { id: 'tugas', label: 'Tugas', icon: 'assignment' },
            { id: 'audit', label: 'Audit & Laporan', icon: 'verified_user' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
                activeTab === tab.id
                  ? 'text-[#00355f] font-bold'
                  : 'text-[#727780] hover:text-[#00355f]'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === tab.id ? 'fill-1' : ''}`}>
                {tab.icon}
              </span>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
