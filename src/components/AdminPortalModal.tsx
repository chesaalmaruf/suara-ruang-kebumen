import React, { useState } from 'react';
import { ReportItem } from '../types';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ReportItem[];
  onUpdateReportStatus: (reportId: string, newStatus: ReportItem['status']) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  reports,
  onUpdateReportStatus,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'klaster' | 'tugas' | 'audit'
  >('dashboard');
  const [selectedDistrict, setSelectedDistrict] = useState('Semua Kecamatan (Kebumen)');
  const [geofenceRadius, setGeofenceRadius] = useState<'10m' | '20m' | '50m'>('20m');
  const [autoMerge, setAutoMerge] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-[#faf8ff] rounded-3xl max-w-md w-full h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-[#dae2fd]">
        {/* Admin Header */}
        <header className="bg-white border-b border-[#eaedff] px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00355f] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">
                  Admin Portal Dinas PUPR
                </h3>
                <span className="text-[10px] text-[#006496] font-semibold">
                  Kabupaten Kebumen • SPBE A
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup Portal Admin"
              className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* District Selector */}
          <div className="mt-2 flex items-center justify-between bg-[#f2f3ff] rounded-xl px-2.5 py-1 text-xs text-[#00355f] font-semibold">
            <span className="flex items-center gap-1 text-[11px]">
              <span className="material-symbols-outlined text-[15px]">location_city</span>
              Wilayah: {selectedDistrict}
            </span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </div>
        </header>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="bg-[#005713] text-[#a3f69c] text-xs font-bold px-4 py-2 text-center animate-fade-in flex items-center justify-center gap-1.5 flex-shrink-0">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Scrollable Admin Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: DASHBOARD EKSEKUTIF & SAW */}
          {activeAdminTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs">
                  <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                    <span>Total Lap. Aktif</span>
                    <span className="material-symbols-outlined text-[16px] text-[#006496]">folder</span>
                  </div>
                  <span className="text-2xl font-black text-[#00355f] block mt-1">24</span>
                  <span className="text-[10px] text-[#006496] font-semibold">3 Butuh Verifikasi</span>
                </div>

                <div className="bg-[#ffdad6]/40 p-3 rounded-2xl border border-[#ffdad6] shadow-xs">
                  <div className="flex justify-between items-center text-[#ba1a1a] text-[11px]">
                    <span className="font-bold">Darurat / Kritis</span>
                    <span className="material-symbols-outlined text-[16px]">e911_emergency</span>
                  </div>
                  <span className="text-2xl font-black text-[#ba1a1a] block mt-1">2 Kasus</span>
                  <span className="text-[10px] text-[#ba1a1a] font-semibold">Menunggu SPK</span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs">
                  <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                    <span>Resp. Time Rata2</span>
                    <span className="material-symbols-outlined text-[16px] text-[#006496]">timer</span>
                  </div>
                  <span className="text-2xl font-black text-[#006496] block mt-1">1.4 Hari</span>
                  <span className="text-[10px] text-[#005713] font-semibold">▼ 0.6 hr dari target</span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs">
                  <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                    <span>Penyelesaian Wilayah</span>
                    <span className="material-symbols-outlined text-[16px] text-[#006496]">bar_chart</span>
                  </div>
                  <div className="space-y-1 mt-1 text-[10px]">
                    <div className="flex justify-between font-semibold">
                      <span>Kebumen</span>
                      <span>92%</span>
                    </div>
                    <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#00355f] h-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SPK SAW Priority List */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[13px] font-bold text-[#131b2e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#00355f] text-[18px]">verified</span>
                    Prioritas SPK Teratas (SAW v2.4)
                  </h4>
                  <span className="text-[10px] bg-[#d2e4ff] text-[#001c37] font-bold px-2 py-0.5 rounded-md">
                    Antrean #1
                  </span>
                </div>

                <div className="p-3 bg-[#f2f3ff] rounded-xl space-y-2 border border-[#dae2fd]">
                  <div className="flex justify-between text-xs font-bold text-[#131b2e]">
                    <span>#KBM-2025-0842</span>
                    <span className="text-[#ba1a1a]">Skor V: 0.892 (Prioritas 1)</span>
                  </div>
                  <p className="text-[11px] text-[#42474f]">
                    Guiding Block Hilang & Ramp Amblas — Jl. Pahlawan, Alun-Alun Sisi Barat
                  </p>

                  <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-[#eaedff]">
                    <span>C1 Bahaya: 0.88</span>
                    <span>C2 Akses: 0.92</span>
                    <span>C3 Pengguna: 0.89</span>
                    <span>C4 Fisik: 0.85</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateReportStatus('#KBM-2025-0842', 'completed');
                        triggerNotice('Tiket #KBM-2025-0842 ditandai SELESAI & Tuntas!');
                      }}
                      className="flex-1 py-1.5 bg-[#005713] text-[#a3f69c] rounded-lg text-[11px] font-bold hover:bg-[#003d0b] transition-colors"
                    >
                      Tandai Tuntas (Selesai)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateReportStatus('#KBM-2025-0842', 'in_progress');
                        triggerNotice('SPK Diterbitkan ke TRC Regu 2 PUPR!');
                      }}
                      className="flex-1 py-1.5 bg-[#00355f] text-white rounded-lg text-[11px] font-bold hover:bg-[#006496] transition-colors"
                    >
                      Terbitkan SPK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PETA & KLASTER GEOFENCING */}
          {activeAdminTab === 'klaster' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#eaedff]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#131b2e]">
                  <span>Radius Geofence:</span>
                  {(['10m', '20m', '50m'] as const).map(rad => (
                    <button
                      key={rad}
                      onClick={() => setGeofenceRadius(rad)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        geofenceRadius === rad
                          ? 'bg-[#00355f] text-white'
                          : 'bg-[#eaedff] text-[#00355f]'
                      }`}
                    >
                      {rad}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAutoMerge(!autoMerge)}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                    autoMerge ? 'bg-[#a3f69c] text-[#002204]' : 'bg-[#f2f3ff] text-[#727780]'
                  }`}
                >
                  Auto-Merge: {autoMerge ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Cluster Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded-md">
                    Klaster Kritis #KBM-CLUST-04
                  </span>
                  <span className="text-[10px] font-bold text-[#006496]">
                    Bobot Frekuensi +0.20 SAW
                  </span>
                </div>

                <h4 className="text-[13px] font-bold text-[#131b2e]">
                  Simpang Empat RSUD Kebumen — 4 Laporan Warga Teragregasi
                </h4>
                <p className="text-[11px] text-[#42474f]">
                  Kecamatan Kebumen • Radius 20 Meter • Geotag Presisi ±3m
                </p>

                <div className="space-y-1.5 pt-1 text-[11px]">
                  {['#KBM-0908: Guiding block hancur dekat zebra cross',
                    '#KBM-0910: Ramp kursi roda terhalang tiang listrik',
                    '#KBM-0911: Manhole saluran terbuka tanpa penutup',
                    '#KBM-0915: Jalur tactile licin berlumut'].map((t, idx) => (
                    <div key={idx} className="p-2 bg-[#f2f3ff] rounded-lg text-[#131b2e] flex items-center justify-between">
                      <span>{t}</span>
                      <span className="text-[10px] text-[#006496] font-bold">Valid</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => triggerNotice('Klaster divalidasi & diteruskan ke antrean SPK!')}
                  className="w-full py-2 bg-[#00355f] text-white rounded-xl text-xs font-bold hover:bg-[#006496] transition-colors"
                >
                  Validasi Klaster & Teruskan ke Antrean SPK
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TUGAS SPK */}
          {activeAdminTab === 'tugas' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#131b2e]">Daftar Tugas SPK Terbit</span>
                <span className="text-[#006496] font-semibold">12 SPK Aktif (SLA 94%)</span>
              </div>

              {/* Task Cards */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#00355f]">#SPK-PUPR-2024-089</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#cce5ff] text-[#00517b] font-bold text-[10px]">
                    Sedang Dikerjakan
                  </span>
                </div>
                <h4 className="text-[12px] font-bold text-[#131b2e]">
                  Rekonstruksi Ramp Trotoar & Saluran Depan RSUD Dr. Soedirman
                </h4>
                <div className="flex items-center justify-between text-[11px] text-[#42474f]">
                  <span>Regu: TRC-A (Bpk. Bambang S.)</span>
                  <span className="font-mono text-[#ba1a1a] font-bold">Sisa 18 Jam 15 Menit</span>
                </div>
                <div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#00355f] h-full" style={{ width: '65%' }}></div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerNotice('Dokumen SPK (PDF) berhasil diunduh!')}
                  className="w-full py-1.5 bg-[#eaedff] text-[#00355f] rounded-lg text-xs font-bold hover:bg-[#dae2fd] transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>Cetak Surat Tugas SPK (PDF)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT & LAPORAN */}
          {activeAdminTab === 'audit' && (
            <div className="space-y-3">
              <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-[#131b2e]">Audit Akuntabilitas Publik</h4>
                  <span className="text-[10px] bg-[#a3f69c] text-[#002204] font-bold px-2 py-0.5 rounded-full">
                    Live Log
                  </span>
                </div>
                <p className="text-[11px] text-[#42474f]">
                  Sistem rekam jejak keterbukaan dan integritas penanganan pengaduan fasilitas trotoar Kabupaten Kebumen.
                </p>

                <div className="p-3 bg-[#f2f3ff] rounded-xl space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-bold">
                    <span>Realisasi DPA PUPR 2024</span>
                    <span>71% Terpakai</span>
                  </div>
                  <div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#005713] h-full" style={{ width: '71%' }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#42474f]">
                    <span>Realisasi: Rp 142.500.000</span>
                    <span>Pagu: Rp 200.000.000</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => triggerNotice('Laporan Akuntabilitas (PDF) diunduh!')}
                    className="flex-1 py-1.5 bg-[#00355f] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Unduh PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerNotice('Rekap Excel XLSX diunduh!')}
                    className="flex-1 py-1.5 bg-[#eaedff] text-[#00355f] rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">table_view</span>
                    <span>Format XLSX</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Tab Navigation in Admin Modal */}
        <nav className="bg-white border-t border-[#eaedff] grid grid-cols-4 h-14 items-center px-1 flex-shrink-0 text-center">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
            { id: 'klaster', label: 'Peta & Klaster', icon: 'map' },
            { id: 'tugas', label: 'Tugas SPK', icon: 'assignment' },
            { id: 'audit', label: 'Audit', icon: 'policy' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeAdminTab === tab.id
                  ? 'text-[#00355f] font-bold'
                  : 'text-[#727780] hover:text-[#00355f]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
