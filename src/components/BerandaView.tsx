import React, { useState } from 'react';
import { ReportItem } from '../types';
import { LeafletMapView } from './LeafletMapView';
import { InteractiveKebumenMap } from './InteractiveKebumenMap';

interface BerandaViewProps {
  reports: ReportItem[];
  onNavigateToLapor: () => void;
  onNavigateToLacak: (reportId?: string) => void;
  onOpenSawModal: () => void;
}

export const BerandaView: React.FC<BerandaViewProps> = ({
  reports,
  onNavigateToLapor,
  onNavigateToLacak,
  onOpenSawModal,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'in_progress' | 'completed'>('all');
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 for before/after comparison

  const completedReport = reports.find(r => r.id === '#KBM-2024-071') || reports[3];

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-24 space-y-5 max-w-md mx-auto">
      {/* 1. Interactive Map Section: Peta Sebaran Aksesibilitas Kebumen */}
      <section className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#eaedff] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#00355f]">map</span>
            <h2 className="text-[16px] font-bold text-[#131b2e]">
              Peta Sebaran Infrastruktur
            </h2>
          </div>
          <button
            onClick={onOpenSawModal}
            className="text-[11px] font-bold text-[#006496] bg-[#eaedff] hover:bg-[#dae2fd] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>Matriks SAW</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Map Canvas Container with Live Area Tracking */}
        <LeafletMapView
          reports={reports}
          onSelectReport={reportId => onNavigateToLacak(reportId)}
          heightClass="h-72"
          geofenceRadiusMeters={20}
        />

        {/* Status Legend Chips with Counter */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-[#ffdad6]/40 p-2 rounded-xl flex flex-col items-center border border-[#ffdad6]">
            <span className="text-[10px] text-[#ba1a1a] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
              Kritis (SAW &gt; 0.85)
            </span>
            <span className="text-sm font-extrabold text-[#ba1a1a] mt-0.5">2 Titik</span>
          </div>
          <div className="bg-[#cce5ff]/40 p-2 rounded-xl flex flex-col items-center border border-[#cce5ff]">
            <span className="text-[10px] text-[#00517b] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#006496]"></span>
              Diproses PUPR
            </span>
            <span className="text-sm font-extrabold text-[#00517b] mt-0.5">5 Titik</span>
          </div>
          <div className="bg-[#a3f69c]/30 p-2 rounded-xl flex flex-col items-center border border-[#a3f69c]">
            <span className="text-[10px] text-[#003d0b] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#005713]"></span>
              Tuntas 100%
            </span>
            <span className="text-sm font-extrabold text-[#003d0b] mt-0.5">139 Titik</span>
          </div>
        </div>
      </section>

      {/* 2. Giant Tactile High-Priority Call to Action */}
      <section className="w-full">
        <button
          onClick={onNavigateToLapor}
          className="w-full text-left min-h-[5.5rem] bg-gradient-to-r from-[#7fc5fd] via-[#d2e4ff] to-[#cce5ff] text-[#00517b] rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 active:scale-[0.98] transition-all focus:ring-4 focus:ring-[#006496] focus:outline-none border border-white/60 group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-[#00355f] text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:rotate-6 transition-transform">
              <span className="material-symbols-outlined text-[30px]">add_a_photo</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] text-[#00355f] font-extrabold tracking-wider uppercase">
                Aksi Cepat Warga
              </span>
              <span className="text-[18px] font-extrabold text-[#131b2e] tracking-tight truncate leading-tight mt-0.5">
                Laporkan Kerusakan
              </span>
              <span className="text-[12px] text-[#00517b] font-medium mt-0.5">
                Hanya 1–2 menit • Ramah panduan suara & GPS
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#00517b]/10 flex items-center justify-center flex-shrink-0 text-[#00517b] group-hover:translate-x-1 transition-transform">
            <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
          </div>
        </button>
      </section>

      {/* 3. Transparency & Citizen Impact Metrics */}
      <section className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#131b2e] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#00355f]">monitoring</span>
            Transparansi Penanganan
          </h2>
          <span className="text-[11px] text-[#42474f] bg-[#eaedff] px-2 py-0.5 rounded-full font-medium">
            Update: Hari Ini
          </span>
        </div>

        {/* 3 Key Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#eaedff] flex flex-col justify-between">
            <span className="text-[11px] text-[#42474f] font-medium">Total Laporan</span>
            <span className="text-[24px] font-black text-[#00355f] my-1 tabular-nums">164</span>
            <span className="text-[10px] text-[#42474f] flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[13px] text-[#005713]">trending_up</span>
              2024 / 2025
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#eaedff] flex flex-col justify-between">
            <span className="text-[11px] text-[#42474f] font-medium">Tuntas (PUPR)</span>
            <span className="text-[24px] font-black text-[#005713] my-1 tabular-nums">139</span>
            <span className="text-[10px] text-[#002204] font-extrabold bg-[#a3f69c] px-1.5 py-0.5 rounded-md w-fit">
              84.7% Selesai
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#eaedff] flex flex-col justify-between">
            <span className="text-[11px] text-[#42474f] font-medium">Rerata Respon</span>
            <span className="text-[24px] font-black text-[#006496] my-1 tabular-nums">2.4</span>
            <span className="text-[10px] text-[#42474f] font-medium">Hari Kerja</span>
          </div>
        </div>

        {/* Urgency Ranking by Sub-District (Kecamatan) */}
        <div className="bg-[#f2f3ff] rounded-2xl p-4 space-y-3 border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#131b2e] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">location_city</span>
              Wilayah Paling Butuh Perbaikan
            </span>
            <span className="text-[10px] font-semibold text-[#006496]">Prioritas SAW</span>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[11px] mb-1 text-[#131b2e]">
                <span className="font-semibold">1. Kec. Kebumen Kota</span>
                <span className="font-bold text-[#ba1a1a]">38 laporan (Urgensi Tinggi)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#dae2fd] overflow-hidden">
                <div className="h-full bg-[#ba1a1a] rounded-full transition-all duration-500" style={{ width: '78%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 text-[#131b2e]">
                <span className="font-semibold">2. Kec. Gombong</span>
                <span className="font-bold text-[#006496]">24 laporan</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#dae2fd] overflow-hidden">
                <div className="h-full bg-[#006496] rounded-full transition-all duration-500" style={{ width: '52%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 text-[#131b2e]">
                <span className="font-semibold">3. Kec. Prembun</span>
                <span className="font-bold text-[#727780]">15 laporan</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#dae2fd] overflow-hidden">
                <div className="h-full bg-[#0f4c81] rounded-full transition-all duration-500" style={{ width: '32%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Citizen Impact Feed (Before-After Case) */}
      <section className="w-full space-y-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#005713] text-[20px]">task_alt</span>
            <h2 className="text-[16px] font-bold text-[#131b2e]">Hasil Perbaikan Terbaru</h2>
          </div>
          <button
            onClick={() => onNavigateToLacak(completedReport.id)}
            className="text-[12px] text-[#006496] font-bold hover:underline"
          >
            Lihat Tiket
          </button>
        </div>

        {/* Verified Story Card */}
        <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-[#eaedff] flex flex-col">
          {/* Media Before-After Comparison Split */}
          <div className="relative w-full h-44 bg-[#eaedff] grid grid-cols-2 gap-0.5">
            <div className="relative w-full h-full overflow-hidden">
              <img
                src={completedReport.photoBefore}
                alt="Foto Sebelum Perbaikan"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute top-2 left-2 bg-[#131b2e]/85 text-white px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                Sebelum
              </span>
            </div>
            <div className="relative w-full h-full overflow-hidden">
              <img
                src={completedReport.photoAfter || completedReport.photoBefore}
                alt="Foto Sesudah Perbaikan"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute top-2 right-2 bg-[#005713] text-[#a3f69c] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                Sesudah
              </span>
            </div>
          </div>

          {/* Card Body Content */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#a3f69c] text-[#002204]">
                <span className="material-symbols-outlined text-[14px]">check</span>
                Terverifikasi DPUPR
              </span>
              <span className="text-[11px] text-[#42474f]">4 hari lalu</span>
            </div>

            <h3 className="text-[15px] font-bold text-[#131b2e] leading-snug">
              Trotoar Koridor Jl. Pemuda (Samping RSUD Lama)
            </h3>

            <p className="text-[12px] text-[#42474f] leading-relaxed line-clamp-2">
              Pemasangan ulang ubin pemandu (guiding blocks) sepanjang 120 meter dan penyesuaian kelandaian ramp kursi roda sesuai standar Permen PUPR No. 14/2017.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-[#f2f3ff] text-[11px] text-[#006496]">
              <span className="font-semibold">Skor SAW: 0.898 (Prioritas Tuntas)</span>
              <button
                onClick={() => onNavigateToLacak(completedReport.id)}
                className="font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Detail Riwayat</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
