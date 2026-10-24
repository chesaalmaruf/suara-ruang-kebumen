import React, { useEffect, useState } from 'react';
import { ReportItem } from '../types';
import { cleanLegacySawText, toScore100 } from '../utils/sawCalculator';

interface LacakLaporanViewProps {
  reports: ReportItem[];
  initialSearchId?: string;
  onNavigateToLaporWithLocation?: (loc: string) => void;
}

export const LacakLaporanView: React.FC<LacakLaporanViewProps> = ({
  reports,
  initialSearchId = '',
  onNavigateToLaporWithLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchId || reports[0]?.id || '');
  const [selectedReportId, setSelectedReportId] = useState(
    initialSearchId || reports[0]?.id || ''
  );
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [showSawDetails, setShowSawDetails] = useState(false);

  useEffect(() => {
    if (initialSearchId) {
      setSearchQuery(initialSearchId);
      setSelectedReportId(initialSearchId);
      setSearchNotFound(false);
    } else if (!selectedReportId && reports.length > 0) {
      setSearchQuery(reports[0].id);
      setSelectedReportId(reports[0].id);
    }
  }, [initialSearchId, reports]);

  const activeReport =
    reports.find(r => r.id.toLowerCase() === selectedReportId.toLowerCase()) ||
    reports[0] ||
    null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const found = reports.find(
      r =>
        r.id.toLowerCase().includes(q) ||
        r.placeName.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
    );
    if (found) {
      setSelectedReportId(found.id);
      setSearchNotFound(false);
    } else {
      setSearchNotFound(true);
    }
  };

  const handleShareStatus = () => {
    if (!activeReport) return;
    const shareUrl = window.location.href;
    const shareText = `Pantau progres perbaikan fasilitas aksesibilitas di ${activeReport.placeName} Kebumen (${activeReport.id}): Status ${activeReport.statusLabel}`;

    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any)
        .share({
          title: `Lapor Akses Kebumen - Tiket ${activeReport.id}`,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2200);
    }
  };

  const handleCallOfficer = () => {
    window.location.href = `tel:${activeReport?.assignedTeam?.phone || '0287381110'}`;
  };

  const handleCallInklusif112 = () => {
    window.location.href = 'tel:112';
  };

  if (reports.length === 0 || !activeReport) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#eaedff] text-[#00355f] flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">fact_check</span>
        </div>
        <h2 className="text-[17px] font-extrabold text-[#131b2e]">
          Belum Ada Tiket Laporan
        </h2>
        <p className="text-[12px] text-[#42474f] leading-relaxed">
          Saat ini belum ada laporan aksesibilitas yang tercatat di database. Silakan buat laporan baru terlebih dahulu untuk melacak progres penanganan Dinas PUPR secara real-time.
        </p>
        <button
          type="button"
          onClick={() => onNavigateToLaporWithLocation?.('')}
          className="px-5 py-3 rounded-xl bg-[#00355f] hover:bg-[#006496] text-white text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
          <span>Buat Laporan Pertama</span>
        </button>
      </div>
    );
  }

  const officerPhoto = activeReport.photoAfter || activeReport.photoDuring || '';

  return (
    <div className="flex flex-col w-full px-4 pt-2 pb-24 space-y-4 max-w-md mx-auto">
      {copyToast && (
        <div className="fixed top-20 inset-x-4 z-50 max-w-sm mx-auto bg-[#131b2e] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-fade-in">
          <span className="material-symbols-outlined text-[18px] text-[#a3f69c]">
            check_circle
          </span>
          <span>Tautan dan status tiket berhasil disalin!</span>
        </div>
      )}

      {/* Section 1: Search & Tracking Bar */}
      <section className="bg-white p-3.5 rounded-2xl shadow-xs border border-[#eaedff] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="ticket-search"
            className="text-[12px] font-bold text-[#131b2e]"
          >
            Lacak Laporan Anda
          </label>
          <span className="inline-flex items-center gap-1 text-[#006496] text-[11px] font-bold">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            Data Terintegrasi PUPR
          </span>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-1.5 bg-[#f2f3ff] rounded-xl p-1 border border-transparent focus-within:border-[#00355f] transition-all"
        >
          <span className="material-symbols-outlined text-[#727780] pl-2 text-[20px]">
            search
          </span>
          <input
            id="ticket-search"
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSearchNotFound(false);
            }}
            placeholder="Cari Nomor Tiket (#KBM-...) atau Lokasi"
            className="bg-transparent flex-1 text-[13px] text-[#131b2e] outline-none placeholder:text-[#727780] py-1.5 font-mono font-bold"
          />
          <button
            type="submit"
            aria-label="Cari Laporan"
            className="px-3 py-1.5 rounded-lg bg-[#00355f] hover:bg-[#006496] text-white text-xs font-bold transition-colors"
          >
            Cari
          </button>
        </form>

        {searchNotFound && (
          <p className="text-[11px] text-[#ba1a1a] font-semibold">
            Tiket atau lokasi &ldquo;{searchQuery}&rdquo; tidak ditemukan. Menampilkan tiket aktif.
          </p>
        )}

        {/* Quick Ticket Selection Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5">
          <span className="text-[10px] text-[#42474f] flex-shrink-0 font-semibold">
            Pilih Tiket:
          </span>
          {reports.slice(0, 6).map(rep => (
            <button
              key={rep.id}
              type="button"
              onClick={() => {
                setSearchQuery(rep.id);
                setSelectedReportId(rep.id);
                setSearchNotFound(false);
              }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                activeReport.id === rep.id
                  ? 'bg-[#00355f] text-white font-bold'
                  : 'bg-[#eaedff] text-[#00355f] hover:bg-[#dae2fd]'
              }`}
            >
              {rep.id}
            </button>
          ))}
        </div>
      </section>

      {/* Section 2: Active Report Highlight Card */}
      <section className="bg-white rounded-2xl p-4 shadow-xs border border-[#eaedff] space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-[#006496] bg-[#eaedff] px-2.5 py-0.5 rounded-full font-bold font-mono">
                {activeReport.id}
              </span>
              <span className="text-[11px] text-[#42474f]">
                {activeReport.createdAt}
              </span>
            </div>

            <h2 className="text-[16px] font-bold text-[#131b2e] mt-1 leading-snug">
              {activeReport.title}
            </h2>

            <div className="flex items-center gap-1 text-[#42474f] mt-1 text-[11px]">
              <span className="material-symbols-outlined text-[16px] text-[#006496] flex-shrink-0">
                location_on
              </span>
              <span className="truncate">
                Kec. {activeReport.district} • {activeReport.address}
              </span>
            </div>

            {activeReport.description && (
              <p className="text-[12px] text-[#42474f] mt-2 leading-relaxed bg-[#f2f3ff] p-2.5 rounded-xl">
                {activeReport.description}
              </p>
            )}
          </div>
        </div>

        {/* Live Pulsating Status Indicator */}
        <div className="bg-[#eaedff] rounded-xl p-3 flex items-center justify-between border border-[#cce5ff]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeReport.status === 'completed'
                    ? 'bg-[#005713]'
                    : activeReport.status === 'in_progress' || activeReport.status === 'verified'
                    ? 'bg-[#006496]'
                    : 'bg-[#ba1a1a]'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  activeReport.status === 'completed'
                    ? 'bg-[#005713]'
                    : activeReport.status === 'in_progress' || activeReport.status === 'verified'
                    ? 'bg-[#006496]'
                    : 'bg-[#ba1a1a]'
                }`}
              ></span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-[#00517b] uppercase tracking-wider font-extrabold">
                Status Pekerjaan
              </span>
              <span className="text-[11px] text-[#00517b] font-bold truncate">
                {activeReport.status === 'completed'
                  ? 'SELESAI & TUNTAS DIKERJAKAN'
                  : activeReport.status === 'in_progress'
                  ? 'SEDANG DIKERJAKAN OLEH DINAS PUPR'
                  : activeReport.status === 'verified'
                  ? 'TERVERIFIKASI PENGAWAS • ANTREAN SPK'
                  : 'MENUNGGU VERIFIKASI ADMIN PUPR'}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#006496] text-[22px]">
            {activeReport.status === 'completed' ? 'task_alt' : 'engineering'}
          </span>
        </div>

        {/* Priority Score Summary & Breakdown Toggle */}
        <div className="pt-1 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#42474f] font-medium">Skor Prioritas:</span>
            <span className="font-extrabold text-[#00355f] bg-[#d2e4ff] px-2 py-0.5 rounded-md font-mono">
              {toScore100(activeReport.sawScores.totalSaw)}/100 (Urutan #
              {activeReport.sawScores.rank || 1})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSawDetails(!showSawDetails)}
            className="text-[#006496] font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>{showSawDetails ? 'Tutup Rincian' : 'Rincian Penilaian'}</span>
            <span className="material-symbols-outlined text-[14px]">
              {showSawDetails ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {showSawDetails && (
          <div className="p-3 bg-[#f2f3ff] rounded-xl space-y-2 text-[11px] border border-[#dae2fd] animate-fade-in">
            <div className="flex justify-between text-[#131b2e]">
              <span>Tingkat Bahaya Keselamatan</span>
              <span className="font-mono font-bold text-[#ba1a1a]">
                {toScore100(activeReport.sawScores.c1Safety)}/100
              </span>
            </div>
            <div className="flex justify-between text-[#131b2e]">
              <span>Dampak Aksesibilitas Difabel</span>
              <span className="font-mono font-bold text-[#006496]">
                {toScore100(activeReport.sawScores.c2Access)}/100
              </span>
            </div>
            <div className="flex justify-between text-[#131b2e]">
              <span>Cakupan Warga Terdampak</span>
              <span className="font-mono font-bold text-[#00355f]">
                {toScore100(activeReport.sawScores.c3Users)}/100
              </span>
            </div>
            <div className="flex justify-between text-[#131b2e]">
              <span>Tingkat Kerusakan Fisik</span>
              <span className="font-mono font-bold text-[#727780]">
                {toScore100(activeReport.sawScores.c4Physical)}/100
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Linimasa Status Real-Time (4-Stage Visual Stepper) */}
      <section className="bg-white rounded-2xl p-4 shadow-xs border border-[#eaedff] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#131b2e] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00355f] text-[20px]">route</span>
            Linimasa Penanganan
          </h3>
          <span className="text-[11px] text-[#42474f] font-semibold">
            {activeReport.timeline.filter(t => t.completed).length} dari 4 Tahap
          </span>
        </div>

        <div className="relative pl-6 space-y-4 pt-1">
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-[#eaedff]"></div>

          {activeReport.timeline.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-3">
              <div
                className={`absolute -left-6 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${
                  step.completed
                    ? 'bg-[#005713] text-white'
                    : step.active
                    ? 'bg-[#006496] text-white animate-pulse'
                    : 'bg-[#eaedff] text-[#727780]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {step.completed ? 'check' : step.active ? 'construction' : 'pending'}
                </span>
              </div>

              <div
                className={`flex-1 min-w-0 rounded-xl p-2.5 ${
                  step.active ? 'bg-[#f2f3ff] border border-[#cce5ff]' : 'bg-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[12px] font-bold ${
                      step.active ? 'text-[#006496]' : 'text-[#131b2e]'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-[10px] text-[#42474f] font-medium shrink-0">
                    {step.time}
                  </span>
                </div>
                <p className="text-[11px] text-[#42474f] mt-1 leading-relaxed">
                  {cleanLegacySawText(step.desc)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Bukti Visual Lapangan */}
      <section className="bg-white rounded-2xl p-4 shadow-xs border border-[#eaedff] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#131b2e] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00355f] text-[20px]">
              photo_library
            </span>
            Bukti Visual Lapangan
          </h3>
          <span className="bg-[#eaedff] text-[#00355f] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            {(activeReport.photoBefore ? 1 : 0) + (officerPhoto ? 1 : 0)} Foto Terlampir
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Foto Pelapor */}
          <div className="flex flex-col gap-1">
            <div className="relative rounded-xl overflow-hidden h-32 bg-[#f2f3ff] border border-[#eaedff] flex items-center justify-center">
              {activeReport.photoBefore ? (
                <img
                  src={activeReport.photoBefore}
                  alt="Kondisi Awal Laporan"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2 text-[#727780]">
                  <span className="material-symbols-outlined text-[22px] block">
                    hide_image
                  </span>
                  <span className="text-[10px]">Tanpa foto awal</span>
                </div>
              )}
              <span className="absolute bottom-1.5 left-1.5 bg-[#131b2e]/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                Kondisi Awal (Warga)
              </span>
            </div>
          </div>

          {/* Foto Petugas Lapangan / Selesai */}
          <div className="flex flex-col gap-1">
            <div className="relative rounded-xl overflow-hidden h-32 bg-[#f2f3ff] border border-[#eaedff] flex items-center justify-center">
              {officerPhoto ? (
                <img
                  src={officerPhoto}
                  alt="Dokumentasi Petugas DPUPR"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2 text-[#727780]">
                  <span className="material-symbols-outlined text-[22px] block">
                    pending_actions
                  </span>
                  <span className="text-[10px]">Menunggu foto petugas</span>
                </div>
              )}
              <span className="absolute bottom-1.5 left-1.5 bg-[#006496] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                {activeReport.status === 'completed' ? 'Hasil Tuntas (PUPR)' : 'Dokumentasi PUPR'}
              </span>
            </div>
          </div>
        </div>

        {/* Field Worker Dispatch Note */}
        {activeReport.assignedTeam && (
          <div className="flex items-center justify-between p-3 bg-[#f2f3ff] rounded-xl border border-[#eaedff]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#00355f] text-white flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">engineering</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-[#131b2e] truncate">
                  {activeReport.assignedTeam.name}
                </span>
                <span className="text-[10px] text-[#42474f] truncate">
                  PJ: {activeReport.assignedTeam.leadOfficer} ({activeReport.assignedTeam.vehicle})
                </span>
                {activeReport.assignedTeam.statusNote && (
                  <span className="text-[10px] text-[#006496] font-semibold mt-0.5 line-clamp-1">
                    {activeReport.assignedTeam.statusNote}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleCallOfficer}
              aria-label="Telepon Petugas Lapangan PUPR"
              className="w-10 h-10 rounded-xl bg-white hover:bg-[#dae2fd] text-[#00355f] flex items-center justify-center shadow-xs transition-colors border border-[#eaedff]"
            >
              <span className="material-symbols-outlined text-[20px]">phone_in_talk</span>
            </button>
          </div>
        )}
      </section>

      {/* Section 5: Citizen Interactive Actions */}
      <section className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleShareStatus}
            className="h-11 px-3 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#00355f] text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs border border-[#eaedff] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>Bagikan Status</span>
          </button>

          <button
            onClick={handleCallOfficer}
            className="h-11 px-3 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#006496] text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs border border-[#eaedff] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>Hubungi Pengawas</span>
          </button>
        </div>

        <button
          onClick={() => onNavigateToLaporWithLocation?.(activeReport.placeName)}
          className="w-full h-12 rounded-xl bg-[#00355f] hover:bg-[#006496] text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
          <span>Lapor Masalah Serupa di Area Ini</span>
        </button>

        <div className="p-3 rounded-xl bg-[#eaedff] flex items-center gap-2.5 text-[#131b2e] border border-[#cce5ff]">
          <span className="material-symbols-outlined text-[#00355f] text-[22px] flex-shrink-0">
            accessibility_new
          </span>
          <div className="flex-1 text-[11px] leading-relaxed">
            Perlu pendampingan khusus tunanetra atau disabilitas fisik saat melewati rute ini?{' '}
            <button
              onClick={handleCallInklusif112}
              className="font-bold text-[#006496] underline inline-flex items-center gap-0.5"
            >
              Hubungi Layanan Inklusif di 112
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
