import React, { useMemo, useState } from 'react';
import { ReportItem } from '../types';
import { KNOWN_KEBUMEN_DISTRICTS, formatDistrictLabel } from '../utils/placeSearch';
import { cleanLegacySawText, toScore100 } from '../utils/sawCalculator';
import { LeafletMapView } from './LeafletMapView';

interface BerandaViewProps {
  reports: ReportItem[];
  myReportIds?: string[];
  onNavigateToLapor: () => void;
  onNavigateToLacak: (reportId?: string) => void;
}

export const BerandaView: React.FC<BerandaViewProps> = ({
  reports,
  myReportIds = [],
  onNavigateToLapor,
  onNavigateToLacak,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'critical' | 'in_progress' | 'completed'
  >('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [showAllReports, setShowAllReports] = useState(false);
  const [publicPreviewReportId, setPublicPreviewReportId] = useState<string | null>(null);

  const publicPreviewReport = useMemo(
    () =>
      publicPreviewReportId
        ? reports.find(r => r.id === publicPreviewReportId) || null
        : null,
    [reports, publicPreviewReportId]
  );

  const handleOpenReportItem = (reportId: string) => {
    if (myReportIds.includes(reportId)) {
      onNavigateToLacak(reportId);
      return;
    }
    setPublicPreviewReportId(reportId);
  };

  // Build district counts across all live reports (both Kebumen & external locations)
  const { reportedDistricts, unrepresentedKebumenDistricts } = useMemo(() => {
    const counts = new Map<string, number>();
    reports.forEach(r => {
      const d = (r.district || 'Kebumen').trim();
      if (!d) return;
      counts.set(d, (counts.get(d) || 0) + 1);
    });

    const reported = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'id'));

    const reportedSet = new Set(reported.map(d => d.name.toLowerCase()));
    const remainingKebumen = KNOWN_KEBUMEN_DISTRICTS.filter(
      d => !reportedSet.has(d.toLowerCase())
    );

    return {
      reportedDistricts: reported,
      unrepresentedKebumenDistricts: remainingKebumen,
    };
  }, [reports]);

  // Reports scoped by selected Kecamatan / Wilayah
  const districtScopedReports = useMemo(() => {
    if (selectedDistrict === 'ALL') return reports;
    return reports.filter(
      r => (r.district || 'Kebumen').trim().toLowerCase() === selectedDistrict.toLowerCase()
    );
  }, [reports, selectedDistrict]);

  // Most recently completed report (sorted by updatedAt descending so newly completed non-Kebumen reports appear immediately)
  const completedReport = useMemo(() => {
    const completedList = districtScopedReports.filter(r => r.status === 'completed');
    if (completedList.length === 0) return null;
    return [...completedList].sort(
      (a, b) => (b.updatedAt || b.localSavedAt || 0) - (a.updatedAt || a.localSavedAt || 0)
    )[0];
  }, [districtScopedReports]);

  // Dynamic live statistics from district-scoped reports (completed reports are never counted as active critical)
  const criticalCount = districtScopedReports.filter(
    r =>
      r.status !== 'completed' &&
      (r.severity === 'critical' || (r.sawScores?.totalSaw && r.sawScores.totalSaw >= 0.85))
  ).length;
  const inProgressCount = districtScopedReports.filter(
    r => r.status === 'in_progress' || r.status === 'verified'
  ).length;
  const completedCount = districtScopedReports.filter(r => r.status === 'completed').length;
  const totalReportsCount = districtScopedReports.length;
  const completionPercentage =
    totalReportsCount > 0 ? ((completedCount / totalReportsCount) * 100).toFixed(0) : '0';

  // Aggregate real reports by sub-district (Kecamatan / Wilayah)
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
      .slice(0, 4);

    const maxCount = entries.length > 0 ? Math.max(...entries.map(e => e.count), 1) : 1;
    return entries.map(e => ({
      ...e,
      percent: Math.max(12, Math.round((e.count / maxCount) * 100)),
    }));
  }, [reports]);

  // Filtered live reports feed
  const filteredReports = useMemo(() => {
    if (selectedFilter === 'critical') {
      return districtScopedReports.filter(
        r =>
          r.status !== 'completed' &&
          (r.severity === 'critical' ||
            (r.sawScores?.totalSaw && r.sawScores.totalSaw >= 0.85))
      );
    }
    if (selectedFilter === 'in_progress') {
      return districtScopedReports.filter(
        r => r.status === 'in_progress' || r.status === 'verified'
      );
    }
    if (selectedFilter === 'completed') {
      return districtScopedReports.filter(r => r.status === 'completed');
    }
    return districtScopedReports;
  }, [districtScopedReports, selectedFilter]);

  const displayedReports = showAllReports ? filteredReports : filteredReports.slice(0, 10);

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-24 space-y-5 max-w-md mx-auto">
      {/* 1. Interactive Map Section: Peta Sebaran Aksesibilitas */}
      <section className="w-full bg-white rounded-2xl p-4 shadow-sm border border-[#eaedff] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[20px] text-[#00355f] shrink-0">
              map
            </span>
            <h2 className="text-[15px] font-bold text-[#131b2e] truncate">
              Peta Sebaran Infrastruktur
            </h2>
          </div>

          {/* Kecamatan / Wilayah Filter */}
          <select
            aria-label="Filter Kecamatan atau Wilayah"
            value={selectedDistrict}
            onChange={e => {
              setSelectedDistrict(e.target.value);
              setShowAllReports(false);
            }}
            className="max-w-[165px] h-8 px-2.5 rounded-xl bg-[#f2f3ff] border border-[#dae2fd] text-[11px] font-bold text-[#00355f] focus:outline-none focus:ring-2 focus:ring-[#00355f] truncate"
          >
            <option value="ALL">Semua Wilayah ({reports.length})</option>
            {reportedDistricts.length > 0 && (
              <optgroup label="Wilayah Terlapor">
                {reportedDistricts.map(d => (
                  <option key={d.name} value={d.name}>
                    {formatDistrictLabel(d.name)} ({d.count})
                  </option>
                ))}
              </optgroup>
            )}
            {unrepresentedKebumenDistricts.length > 0 && (
              <optgroup label="Kecamatan Kab. Kebumen Lainnya">
                {unrepresentedKebumenDistricts.map(d => (
                  <option key={d} value={d}>
                    Kec. {d} (0)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Map Canvas Container with Live Area Tracking */}
        <LeafletMapView
          reports={districtScopedReports}
          onSelectReport={reportId => handleOpenReportItem(reportId)}
          heightClass="h-72"
          geofenceRadiusMeters={20}
        />

        {/* Status Legend Chips with Counter (Dynamic) */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-[#ffdad6]/40 p-2 rounded-xl flex flex-col items-center border border-[#ffdad6]">
            <span className="text-[10px] text-[#ba1a1a] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
              Darurat (Skor &ge; 85)
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
            {selectedDistrict === 'ALL' ? 'Data Real-Time' : formatDistrictLabel(selectedDistrict)}
          </span>
        </div>

        {/* 3 Key Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-[#eaedff] flex flex-col justify-between">
            <span className="text-[11px] text-[#42474f] font-medium">Total Laporan</span>
            <span className="text-[24px] font-black text-[#00355f] my-1 tabular-nums">
              {totalReportsCount}
            </span>
            <span className="text-[10px] text-[#42474f] flex items-center gap-1 font-semibold truncate">
              <span className="material-symbols-outlined text-[13px] text-[#005713] shrink-0">
                trending_up
              </span>
              <span className="truncate">
                {selectedDistrict === 'ALL' ? 'Semua Wilayah' : formatDistrictLabel(selectedDistrict)}
              </span>
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
            <span className="text-[10px] font-semibold text-[#006496]">Urutan Prioritas</span>
          </div>

          {districtStats.length === 0 ? (
            <p className="text-[12px] text-[#42474f] py-2 text-center">
              Belum ada laporan aktif yang menunggu penanganan.
            </p>
          ) : (
            <div className="space-y-2.5">
              {districtStats.map((item, idx) => (
                <button
                  key={item.district}
                  type="button"
                  onClick={() =>
                    setSelectedDistrict(prev =>
                      prev === item.district ? 'ALL' : item.district
                    )
                  }
                  className="w-full text-left group"
                >
                  <div className="flex justify-between text-[11px] mb-1 text-[#131b2e]">
                    <span className="font-semibold group-hover:text-[#00355f] group-hover:underline">
                      {idx + 1}. {formatDistrictLabel(item.district)}
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
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Daftar Laporan Warga Real-Time */}
      <section className="w-full space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[16px] font-bold text-[#131b2e] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#00355f]">
              format_list_bulleted
            </span>
            Daftar Laporan Warga
          </h2>
          <div className="flex items-center gap-2">
            {selectedDistrict !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedDistrict('ALL')}
                className="text-[11px] font-bold text-[#ba1a1a] hover:underline"
              >
                Reset Wilayah
              </button>
            )}
            <span className="text-[11px] font-bold text-[#006496]">
              {filteredReports.length} Tiket
            </span>
          </div>
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
              onClick={() => {
                setSelectedFilter(chip.id as any);
                setShowAllReports(false);
              }}
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
              Belum Ada Laporan pada Filter Ini
            </p>
            <p className="text-[11px] text-[#42474f]">
              {selectedDistrict !== 'ALL'
                ? `Belum ada laporan tercatat untuk ${formatDistrictLabel(selectedDistrict)} pada kategori ini.`
                : 'Gunakan tombol "Laporkan Kerusakan" di atas untuk mengirim laporan fasilitas aksesibilitas baru.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedReports.map(rep => (
              <button
                key={rep.id}
                type="button"
                onClick={() => handleOpenReportItem(rep.id)}
                className="w-full text-left bg-white p-3.5 rounded-2xl border border-[#eaedff] hover:border-[#006496] shadow-xs transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#00355f] bg-[#eaedff] px-2 py-0.5 rounded">
                    {rep.id} • Urutan #{rep.sawScores.rank || 1}
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
                    {formatDistrictLabel(rep.district)} • {rep.placeName}
                  </span>
                  <span className="font-mono font-bold text-[#006496] shrink-0 ml-2">
                    Skor {toScore100(rep.sawScores.totalSaw)}/100
                  </span>
                </div>
              </button>
            ))}

            {filteredReports.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllReports(prev => !prev)}
                className="w-full py-2.5 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#00355f] text-[12px] font-bold transition-colors"
              >
                {showAllReports
                  ? 'Ringkas Daftar Laporan'
                  : `Tampilkan Semua (${filteredReports.length} Tiket)`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* 5. Hasil Perbaikan Terbaru (Rendered from real completed reports) */}
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
              onClick={() => handleOpenReportItem(completedReport.id)}
              className="text-[12px] text-[#006496] font-bold hover:underline"
            >
              Lihat Detail
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
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#a3f69c] text-[#002204]">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  Terverifikasi DPUPR
                </span>
                <span className="text-[11px] text-[#42474f] truncate">
                  {formatDistrictLabel(completedReport.district)} •{' '}
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
                  Skor Prioritas: {toScore100(completedReport.sawScores.totalSaw)}/100 (Tuntas)
                </span>
                <button
                  onClick={() => handleOpenReportItem(completedReport.id)}
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

      {/* Ringkasan Informasi Laporan Publik (Live Status, Bukti Foto & Linimasa) */}
      {publicPreviewReport && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPublicPreviewReportId(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-4 space-y-3.5 shadow-2xl border border-[#eaedff] max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold text-[#00355f] bg-[#eaedff] px-2 py-0.5 rounded">
                    {publicPreviewReport.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      publicPreviewReport.status === 'completed'
                        ? 'bg-[#a3f69c] text-[#002204]'
                        : publicPreviewReport.status === 'in_progress'
                        ? 'bg-[#cce5ff] text-[#00517b]'
                        : publicPreviewReport.status === 'verified'
                        ? 'bg-[#d2e4ff] text-[#00355f]'
                        : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}
                  >
                    {publicPreviewReport.statusLabel}
                  </span>
                </div>
                <h3 className="text-[15px] font-extrabold text-[#131b2e] pt-1 leading-snug">
                  {publicPreviewReport.title}
                </h3>
                <p className="text-[11px] text-[#42474f]">
                  {formatDistrictLabel(publicPreviewReport.district)} • {publicPreviewReport.address}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPublicPreviewReportId(null)}
                aria-label="Tutup detail"
                className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] flex items-center justify-center shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {(publicPreviewReport.photoBefore || publicPreviewReport.photoAfter) && (
              <div
                className={`rounded-xl overflow-hidden bg-[#f2f3ff] border border-[#eaedff] ${
                  publicPreviewReport.photoBefore && publicPreviewReport.photoAfter
                    ? 'grid grid-cols-2 gap-0.5 h-36'
                    : 'h-40'
                }`}
              >
                {publicPreviewReport.photoBefore && (
                  <div className="relative w-full h-full overflow-hidden">
                    <img
                      src={publicPreviewReport.photoBefore}
                      alt={`Kondisi awal ${publicPreviewReport.title}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 bg-[#131b2e]/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Sebelum
                    </span>
                  </div>
                )}
                {publicPreviewReport.photoAfter && (
                  <div className="relative w-full h-full overflow-hidden">
                    <img
                      src={publicPreviewReport.photoAfter}
                      alt={`Hasil perbaikan ${publicPreviewReport.title}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-[#005713] text-[#a3f69c] text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Sesudah
                    </span>
                  </div>
                )}
              </div>
            )}

            {publicPreviewReport.assignedTeam && (
              <div className="p-2.5 rounded-xl bg-[#f2f3ff] border border-[#cce5ff] text-[11px] space-y-0.5">
                <div className="font-bold text-[#00355f] flex items-center justify-between gap-2">
                  <span className="truncate">{publicPreviewReport.assignedTeam.name}</span>
                  {publicPreviewReport.spkNumber && (
                    <span className="font-mono text-[10px] shrink-0">
                      {publicPreviewReport.spkNumber}
                    </span>
                  )}
                </div>
                {publicPreviewReport.assignedTeam.statusNote && (
                  <p className="text-[#42474f] leading-snug">
                    {publicPreviewReport.assignedTeam.statusNote}
                  </p>
                )}
              </div>
            )}

            {publicPreviewReport.description && (
              <p className="text-[12px] text-[#42474f] bg-[#f2f3ff] p-3 rounded-xl leading-relaxed">
                {publicPreviewReport.description}
              </p>
            )}

            {/* Live Timeline Stepper in Public Modal */}
            {publicPreviewReport.timeline && publicPreviewReport.timeline.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-[#f2f3ff]">
                <p className="text-[11px] font-bold text-[#131b2e]">Linimasa Penanganan</p>
                <div className="space-y-1.5">
                  {publicPreviewReport.timeline.map(step => (
                    <div
                      key={step.stage}
                      className="flex items-start gap-2 text-[11px]"
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          step.completed
                            ? 'bg-[#005713] text-white'
                            : step.active
                            ? 'bg-[#006496] text-white'
                            : 'bg-[#eaedff] text-[#727780]'
                        }`}
                      >
                        {step.completed ? '✓' : step.stage}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#131b2e]">{step.title}</span>
                          <span className="text-[10px] text-[#42474f] shrink-0">{step.time}</span>
                        </div>
                        <p className="text-[10.5px] text-[#42474f] leading-snug">
                          {cleanLegacySawText(step.desc)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#f2f3ff]">
              <span className="text-[#42474f]">
                Dilaporkan: {publicPreviewReport.createdAt}
              </span>
              <span className="font-mono font-bold text-[#00355f]">
                Skor Prioritas {toScore100(publicPreviewReport.sawScores.totalSaw)}/100
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
