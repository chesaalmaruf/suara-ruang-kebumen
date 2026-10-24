import React, { useMemo, useState } from 'react';
import { ReportItem } from '../types';
import { LeafletMapView } from './LeafletMapView';

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
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'critical' | 'in_progress' | 'completed'
  >('all');

  const completedReport = useMemo(
    () => reports.find(r => r.status === 'completed') || null,
    [reports]
  );

  // Dynamic live statistics from real reports
  const criticalCount = reports.filter(
    r => r.severity === 'critical' || (r.sawScores?.totalSaw && r.sawScores.totalSaw >= 0.85)
  ).length;
  const inProgressCount = reports.filter(
    r => r.status === 'in_progress' || r.status === 'verified'
  ).length;
  const completedCount = reports.filter(r => r.status === 'completed').length;
  const totalReportsCount = reports.length;
  const completionPercentage =
    totalReportsCount > 0 ? ((completedCount / totalReportsCount) * 100).toFixed(0) : '0';

  // Aggregate real reports by sub-district (Kecamatan)
  const districtStats = useMemo(() => {
    const map = new Map<string, { count: number; maxSaw: number }>();
    reports.forEach(r => {
      if (r.status === 'completed') return;
      const dist = r.district?.trim() || 'Kebumen';
      const prev = map.get(dist) || { count: 0, maxSaw: 0 };
      map.set(dist, {
        count: prev.count + 1,
        maxSaw: Math.max(prev.maxSaw, r.sawScores?.totalSaw || 0),
      });
    });

    const entries = Array.from(map.entries())
      .map(([district, info]) => ({ district, ...info }))
      .sort((a, b) => b.count - a.count || b.maxSaw - a.maxSaw)
      .slice(0, 3);

    const maxCount = entries.length > 0 ? Math.max(...entries.map(e => e.count), 1) : 1;
    return entries.map(e => ({
      ...e,
      percent: Math.max(12, Math.round((e.count / maxCount) * 100)),
    }));
  }, [reports]);

  // Filtered live reports feed
  const filteredReports = useMemo(() => {
    if (selectedFilter === 'critical') {
      return reports.filter(
        r => r.severity === 'critical' || (r.sawScores?.totalSaw && r.sawScores.totalSaw >= 0.85)
      );
    }
    if (selectedFilter === 'in_progress') {
      return reports.filter(r => r.status === 'in_progress' || r.status === 'verified');
    }
    if (selectedFilter === 'completed') {
      return reports.filter(r => r.status === 'completed');
    }
    return reports;
  }, [reports, selectedFilter]);

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

        {/* Status Legend Chips with Counter (Dynamic) */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-[#ffdad6]/40 p-2 rounded-xl flex flex-col items-center border border-[#ffdad6]">
            <span className="text-[10px] text-[#ba1a1a] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
              Kritis (SAW &ge; 0.85)
            </span>
            <span className="text-sm font-extrabold text-[#ba1a1a] mt-0.5">
              {criticalCount} Titik
            </span>
          </div>
          <div className="bg-[#cce5ff]/40 p-2 rounded-xl flex flex-col items-center border border-[#cce5ff]">
            <span className="text-[10px] text-[#00517b] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#006496]"></span>
              Diproses PUPR
            </span>
            <span className="text-sm font-extrabold text-[#00517b] mt-0.5">
              {inProgressCount} Titik
            </span>
          </div>
          <div className="bg-[#a3f69c]/30 p-2 rounded-xl flex flex-col items-center border border-[#a3f69c]">
            <span className="text-[10px] text-[#003d0b] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#005713]"></span>
              Tuntas 100%
            </span>
            <span className="text-sm font-extrabold text-[#003d0b] mt-0.5">
              {completedCount} Titik
            </span>
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
            Data Real-Time
          </span>
        </div>

        {/* 3 Key Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#eaedff] flex flex-col justify-between">
            <span className="text-[11px] text-[#42474f] font-medium">Total Laporan</span>
            <span className="text-[24px] font-black text-[#00355f] my-1 tabular-nums">
              {totalReportsCount}
            </span>
            <span className="text-[10px] text-[#42474f] flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[13px] text-[#005713]">
                trending_up
              </span>
              Kab. Kebumen
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#eaedff] flex flex-col justify-between">
            <span className="text-[11px] text-[#42474f] font-medium">Sedang Proses</span>
            <span className="text-[24px] font-black text-[#006496] my-1 tabular-nums">
              {inProgressCount}
            </span>
            <span className="text-[10px] text-[#00517b] font-semibold">
              Dinas PUPR
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#eaedff] flex flex-col justify-between">
            <span className="text-[11px] text-[#42474f] font-medium">Tuntas (PUPR)</span>
            <span className="text-[24px] font-black text-[#005713] my-1 tabular-nums">
              {completedCount}
            </span>
            <span className="text-[10px] text-[#002204] font-extrabold bg-[#a3f69c] px-1.5 py-0.5 rounded-md w-fit">
              {completionPercentage}% Selesai
            </span>
          </div>
        </div>

        {/* Urgency Ranking by Sub-District (Kecamatan) */}
        <div className="bg-[#f2f3ff] rounded-2xl p-4 space-y-3 border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#131b2e] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">
                location_city
              </span>
              Wilayah Paling Butuh Perbaikan
            </span>
            <span className="text-[10px] font-semibold text-[#006496]">Prioritas SAW</span>
          </div>

          {districtStats.length === 0 ? (
            <p className="text-[12px] text-[#42474f] py-2 text-center">
              Belum ada laporan aktif yang tercatat di wilayah Kabupaten Kebumen.
            </p>
          ) : (
            <div className="space-y-2.5">
              {districtStats.map((item, idx) => (
                <div key={item.district}>
                  <div className="flex justify-between text-[11px] mb-1 text-[#131b2e]">
                    <span className="font-semibold">
                      {idx + 1}. Kec. {item.district}
                    </span>
                    <span
                      className={`font-bold ${
                        idx === 0 ? 'text-[#ba1a1a]' : 'text-[#006496]'
                      }`}
                    >
                      {item.count} laporan aktif
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#dae2fd] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-[#ba1a1a]'
                          : idx === 1
                          ? 'bg-[#006496]'
                          : 'bg-[#0f4c81]'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Daftar Laporan Warga Real-Time */}
      <section className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#131b2e] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#00355f]">
              format_list_bulleted
            </span>
            Daftar Laporan Warga
          </h2>
          <span className="text-[11px] font-bold text-[#006496]">
            {filteredReports.length} Tiket
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `Semua (${totalReportsCount})` },
            { id: 'critical', label: `Kritis (${criticalCount})` },
            { id: 'in_progress', label: `Diproses (${inProgressCount})` },
            { id: 'completed', label: `Tuntas (${completedCount})` },
          ].map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedFilter(chip.id as any)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                selectedFilter === chip.id
                  ? 'bg-[#00355f] text-white'
                  : 'bg-white text-[#42474f] border border-[#eaedff] hover:bg-[#f2f3ff]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-[#eaedff] space-y-2">
            <span className="material-symbols-outlined text-[36px] text-[#727780]">
              inbox
            </span>
            <p className="text-[13px] font-bold text-[#131b2e]">
              Belum Ada Laporan pada Kategori Ini
            </p>
            <p className="text-[11px] text-[#42474f]">
              Gunakan tombol &ldquo;Laporkan Kerusakan&rdquo; di atas untuk mengirim laporan fasilitas aksesibilitas baru.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredReports.slice(0, 5).map(rep => (
              <button
                key={rep.id}
                type="button"
                onClick={() => onNavigateToLacak(rep.id)}
                className="w-full text-left bg-white p-3.5 rounded-2xl border border-[#eaedff] hover:border-[#006496] shadow-xs transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#00355f] bg-[#eaedff] px-2 py-0.5 rounded">
                    {rep.id} • Rank #{rep.sawScores.rank || 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rep.status === 'completed'
                        ? 'bg-[#a3f69c] text-[#002204]'
                        : rep.status === 'in_progress'
                        ? 'bg-[#cce5ff] text-[#00517b]'
                        : rep.status === 'verified'
                        ? 'bg-[#d2e4ff] text-[#00355f]'
                        : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}
                  >
                    {rep.statusLabel}
                  </span>
                </div>
                <h3 className="text-[13px] font-bold text-[#131b2e] line-clamp-1">
                  {rep.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-[#42474f]">
                  <span className="truncate">
                    Kec. {rep.district} • {rep.placeName}
                  </span>
                  <span className="font-mono font-bold text-[#006496] shrink-0 ml-2">
                    SAW {rep.sawScores.totalSaw.toFixed(3)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 5. Hasil Perbaikan Terbaru (Only rendered from real completed reports) */}
      {completedReport && (
        <section className="w-full space-y-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#005713] text-[20px]">
                task_alt
              </span>
              <h2 className="text-[16px] font-bold text-[#131b2e]">
                Hasil Perbaikan Terbaru
              </h2>
            </div>
            <button
              onClick={() => onNavigateToLacak(completedReport.id)}
              className="text-[12px] text-[#006496] font-bold hover:underline"
            >
              Lihat Tiket
            </button>
          </div>

          <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-[#eaedff] flex flex-col">
            {(completedReport.photoBefore || completedReport.photoAfter) && (
              <div className="relative w-full h-44 bg-[#eaedff] grid grid-cols-2 gap-0.5">
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#f2f3ff]">
                  {completedReport.photoBefore ? (
                    <img
                      src={completedReport.photoBefore}
                      alt="Foto Sebelum Perbaikan"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-[#727780]">Tanpa Foto Awal</span>
                  )}
                  <span className="absolute top-2 left-2 bg-[#131b2e]/85 text-white px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                    Sebelum
                  </span>
                </div>
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#f2f3ff]">
                  {completedReport.photoAfter ? (
                    <img
                      src={completedReport.photoAfter}
                      alt="Foto Sesudah Perbaikan"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-[#727780]">Terverifikasi Selesai</span>
                  )}
                  <span className="absolute top-2 right-2 bg-[#005713] text-[#a3f69c] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                    Sesudah
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#a3f69c] text-[#002204]">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  Terverifikasi DPUPR
                </span>
                <span className="text-[11px] text-[#42474f]">
                  {completedReport.completedAt || completedReport.createdAt}
                </span>
              </div>

              <h3 className="text-[15px] font-bold text-[#131b2e] leading-snug">
                {completedReport.title}
              </h3>

              <p className="text-[12px] text-[#42474f] leading-relaxed line-clamp-2">
                {completedReport.description}
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-[#f2f3ff] text-[11px] text-[#006496]">
                <span className="font-semibold">
                  Skor SAW: {completedReport.sawScores.totalSaw.toFixed(3)} (Tuntas)
                </span>
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
      )}
    </div>
  );
};
