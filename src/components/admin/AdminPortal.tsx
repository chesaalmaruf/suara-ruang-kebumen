import React, { useMemo, useRef, useState } from 'react';
import { FacilityCategory, ReportItem } from '../../types';
import { DatabaseStatus } from '../../services/reportService';
import { compressImageFile, formatCurrentWibTime } from '../../utils/imageHelper';
import { LeafletMapView } from '../LeafletMapView';

interface AdminPortalProps {
  reports: ReportItem[];
  onProcessReport: (reportId: string, updates: Partial<ReportItem>) => void;
  onDeleteReport: (reportId: string) => void;
  onRefreshReports: () => void;
  isRefreshing?: boolean;
  onLogout: () => void;
  onSwitchToCitizen: () => void;
  dbStatus?: DatabaseStatus;
}

const TRC_TEAMS = [
  {
    id: 'regu_a',
    label: 'Tim Reaksi Cepat PUPR Regu A (Zona Kebumen Kota)',
    leadOfficer: 'Pengawas Regu A DPUPR',
    vehicle: 'Unit Operasional TRC-01',
    phone: '0287381110',
  },
  {
    id: 'regu_b',
    label: 'Tim Reaksi Cepat PUPR Regu B (Zona Barat / Gombong)',
    leadOfficer: 'Pengawas Regu B DPUPR',
    vehicle: 'Unit Operasional TRC-02',
    phone: '0287381110',
  },
  {
    id: 'regu_c',
    label: 'Tim Pemeliharaan Rutin Regu C (Zona Timur / Prembun)',
    leadOfficer: 'Pengawas Regu C DPUPR',
    vehicle: 'Unit Pemeliharaan TRC-03',
    phone: '0287381110',
  },
];

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

interface SpatialCluster {
  clusterId: string;
  center: { lat: number; lng: number };
  district: string;
  placeName: string;
  items: ReportItem[];
  maxSaw: number;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  reports,
  onProcessReport,
  onDeleteReport,
  onRefreshReports,
  isRefreshing = false,
  onLogout,
  onSwitchToCitizen,
  dbStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'peta' | 'tugas' | 'audit'>(
    'dashboard'
  );
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [mapCategoryFilter, setMapCategoryFilter] = useState<'all' | FacilityCategory>('all');
  const [sawQueueTab, setSawQueueTab] = useState<'antrean' | 'prioritas' | 'dikerjakan'>(
    'antrean'
  );
  const [taskFilter, setTaskFilter] = useState<
    'all' | 'submitted' | 'in_progress' | 'completed'
  >('all');
  const [geofenceRadius, setGeofenceRadius] = useState<'10m' | '20m' | '50m'>('20m');
  const [autoMerge, setAutoMerge] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected report for disposition & completion form
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [selectedReguId, setSelectedReguId] = useState<string>(TRC_TEAMS[0].id);
  const [fieldNote, setFieldNote] = useState<string>('');
  const [uploadedAfterPhoto, setUploadedAfterPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const afterPhotoInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Unique districts present in live reports
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.district?.trim()) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [reports]);

  // District-filtered reports
  const filteredReports = useMemo(() => {
    if (selectedDistrict === 'ALL') return reports;
    return reports.filter(r => r.district === selectedDistrict);
  }, [reports, selectedDistrict]);

  // Map category-filtered reports
  const mapReports = useMemo(() => {
    if (mapCategoryFilter === 'all') return filteredReports;
    return filteredReports.filter(r => r.facilityCategory === mapCategoryFilter);
  }, [filteredReports, mapCategoryFilter]);

  // Live statistics
  const totalActive = filteredReports.filter(r => r.status !== 'completed').length;
  const needVerification = filteredReports.filter(r => r.status === 'submitted').length;
  const criticalCount = filteredReports.filter(
    r => r.severity === 'critical' || (r.sawScores?.totalSaw && r.sawScores.totalSaw >= 0.85)
  ).length;
  const inProgressCount = filteredReports.filter(
    r => r.status === 'in_progress' || r.status === 'verified'
  ).length;
  const completedCount = filteredReports.filter(r => r.status === 'completed').length;
  const moderateCount = filteredReports.filter(
    r =>
      r.severity === 'moderate' ||
      (r.sawScores?.totalSaw && r.sawScores.totalSaw >= 0.65 && r.sawScores.totalSaw < 0.85)
  ).length;
  const mildCount = filteredReports.filter(
    r => r.severity === 'mild' || (r.sawScores?.totalSaw && r.sawScores.totalSaw < 0.65)
  ).length;

  // Dynamic completion per district
  const districtCompletion = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    reports.forEach(r => {
      const d = r.district || 'Kebumen';
      const cur = map.get(d) || { total: 0, done: 0 };
      map.set(d, {
        total: cur.total + 1,
        done: cur.done + (r.status === 'completed' ? 1 : 0),
      });
    });
    return Array.from(map.entries())
      .map(([district, v]) => ({
        district,
        total: v.total,
        done: v.done,
        pct: Math.round((v.done / v.total) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [reports]);

  // Real spatial clusters based on Haversine distance
  const radiusMeters = geofenceRadius === '10m' ? 10 : geofenceRadius === '20m' ? 20 : 50;
  const spatialClusters = useMemo<SpatialCluster[]>(() => {
    const visited = new Set<string>();
    const clusters: SpatialCluster[] = [];
    let idx = 1;

    filteredReports.forEach(rep => {
      if (visited.has(rep.id)) return;
      const nearby = filteredReports.filter(
        other =>
          !visited.has(other.id) &&
          haversineMeters(rep.coordinates, other.coordinates) <= radiusMeters
      );
      if (nearby.length >= 2) {
        nearby.forEach(n => visited.add(n.id));
        clusters.push({
          clusterId: `#KBM-CLUST-${String(idx++).padStart(2, '0')}`,
          center: rep.coordinates,
          district: rep.district,
          placeName: rep.placeName,
          items: nearby,
          maxSaw: Math.max(...nearby.map(n => n.sawScores?.totalSaw || 0)),
        });
      }
    });

    return clusters;
  }, [filteredReports, radiusMeters]);

  // Queue list in Dashboard SPK section
  const queueReports = useMemo(() => {
    if (sawQueueTab === 'antrean') {
      return filteredReports.filter(r => r.status === 'submitted');
    }
    if (sawQueueTab === 'dikerjakan') {
      return filteredReports.filter(
        r => r.status === 'in_progress' || r.status === 'verified'
      );
    }
    return filteredReports.filter(r => r.status !== 'completed');
  }, [filteredReports, sawQueueTab]);

  // Active target report for Disposition & Publication form
  const activeDispositionReport = useMemo(() => {
    const found = filteredReports.find(r => r.id === selectedTicketId);
    if (found) return found;
    return (
      filteredReports.find(r => r.status === 'in_progress') ||
      filteredReports.find(r => r.status === 'verified') ||
      filteredReports.find(r => r.status === 'submitted') ||
      filteredReports[0] ||
      null
    );
  }, [filteredReports, selectedTicketId]);

  // Filtered tasks in Tab 3
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'submitted') {
      return filteredReports.filter(r => r.status === 'submitted');
    }
    if (taskFilter === 'in_progress') {
      return filteredReports.filter(
        r => r.status === 'in_progress' || r.status === 'verified'
      );
    }
    if (taskFilter === 'completed') {
      return filteredReports.filter(r => r.status === 'completed');
    }
    return filteredReports;
  }, [filteredReports, taskFilter]);

  // Real audit log entries derived from real reports' timeline steps
  const auditLogs = useMemo(() => {
    const entries: Array<{
      id: string;
      reportId: string;
      title: string;
      stageTitle: string;
      time: string;
      desc: string;
      status: ReportItem['status'];
      saw: number;
    }> = [];

    filteredReports.forEach(rep => {
      rep.timeline
        .filter(step => step.completed)
        .forEach(step => {
          entries.push({
            id: `${rep.id}-stage-${step.stage}`,
            reportId: rep.id,
            title: rep.title,
            stageTitle: step.title,
            time: step.time,
            desc: step.desc,
            status: rep.status,
            saw: rep.sawScores?.totalSaw || 0,
          });
        });
    });

    return entries.reverse();
  }, [filteredReports]);

  // Handlers for processing reports
  const handleVerifyReport = (report: ReportItem) => {
    const now = formatCurrentWibTime();
    const updatedTimeline = report.timeline.map((step, idx) => {
      if (idx === 0) return { ...step, completed: true, active: false };
      if (idx === 1) {
        return {
          ...step,
          time: now,
          desc: 'Diverifikasi oleh Pengawas Dinas PUPR Kebumen. Masuk antrean penerbitan SPK.',
          completed: true,
          active: true,
        };
      }
      return step;
    });

    onProcessReport(report.id, {
      status: 'verified',
      statusLabel: 'Terverifikasi Pengawas DPUPR',
      verifiedAt: now,
      verifiedBy: 'Pengawas Dinas PUPR Kebumen',
      timeline: updatedTimeline,
    });
    setSelectedTicketId(report.id);
    showToast(`Tiket ${report.id} berhasil diverifikasi!`);
  };

  const handleDispatchSpk = (report: ReportItem, customTeamId?: string, note?: string) => {
    const now = formatCurrentWibTime();
    const team = TRC_TEAMS.find(t => t.id === (customTeamId || selectedReguId)) || TRC_TEAMS[0];
    const spkCode = `#SPK-PUPR-${report.id.replace(/[^0-9]/g, '')}`;
    const noteText =
      note?.trim() ||
      `Diterjunkan ${team.label} ke lokasi ${report.placeName} sesuai prioritas SAW.`;

    const updatedTimeline = report.timeline.map((step, idx) => {
      if (idx === 0) return { ...step, completed: true, active: false };
      if (idx === 1) {
        return {
          ...step,
          time: report.verifiedAt || now,
          desc: `Terverifikasi & terbit Surat Perintah Kerja (${spkCode}).`,
          completed: true,
          active: false,
        };
      }
      if (idx === 2) {
        return {
          ...step,
          time: now,
          desc: noteText,
          completed: true,
          active: true,
        };
      }
      return step;
    });

    onProcessReport(report.id, {
      status: 'in_progress',
      statusLabel: 'Sedang Dikerjakan oleh Dinas PUPR',
      spkNumber: spkCode,
      verifiedAt: report.verifiedAt || now,
      assignedTeam: {
        name: team.label,
        leadOfficer: team.leadOfficer,
        vehicle: team.vehicle,
        phone: team.phone,
        slaHours: 48,
        remainingTime: 'Target SLA 48 Jam',
        progressPercent: report.assignedTeam?.progressPercent || 50,
        statusNote: noteText,
      },
      timeline: updatedTimeline,
    });
    setSelectedTicketId(report.id);
    showToast(`SPK ${spkCode} diterbitkan & ${team.label.split('(')[0].trim()} ditugaskan!`);
  };

  const handleUpdateProgress = (report: ReportItem, percent: number) => {
    if (!report.assignedTeam) {
      handleDispatchSpk(report);
      return;
    }
    onProcessReport(report.id, {
      assignedTeam: {
        ...report.assignedTeam,
        progressPercent: percent,
      },
    });
    showToast(`Progres lapangan tiket ${report.id} diperbarui menjadi ${percent}%.`);
  };

  const handleCompleteReport = (report: ReportItem) => {
    const now = formatCurrentWibTime();
    const team = TRC_TEAMS.find(t => t.id === selectedReguId) || TRC_TEAMS[0];
    const finalAfterPhoto = uploadedAfterPhoto || report.photoAfter || undefined;
    const summaryNote =
      fieldNote.trim() ||
      report.assignedTeam?.statusNote ||
      'Perbaikan fasilitas aksesibilitas telah tuntas dikerjakan dan diverifikasi oleh Dinas PUPR Kebumen.';

    const updatedTimeline = report.timeline.map((step, idx) => {
      if (idx === 1 && !step.completed) {
        return {
          ...step,
          time: report.verifiedAt || now,
          completed: true,
          active: false,
        };
      }
      if (idx === 2) {
        return {
          ...step,
          time: step.completed ? step.time : now,
          desc: summaryNote,
          completed: true,
          active: false,
        };
      }
      if (idx === 3) {
        return {
          ...step,
          time: now,
          desc: 'Perbaikan tuntas 100% dan telah dipublikasikan ke Portal Transparansi Warga.',
          completed: true,
          active: false,
        };
      }
      return { ...step, completed: true, active: false };
    });

    onProcessReport(report.id, {
      status: 'completed',
      statusLabel: 'Tuntas 100% (Terverifikasi DPUPR)',
      completedAt: now,
      verifiedBy: 'Dinas PUPR Kabupaten Kebumen',
      photoAfter: finalAfterPhoto,
      assignedTeam: report.assignedTeam
        ? {
            ...report.assignedTeam,
            progressPercent: 100,
            remainingTime: 'Selesai Tepat Waktu',
            statusNote: summaryNote,
          }
        : {
            name: team.label,
            leadOfficer: team.leadOfficer,
            vehicle: team.vehicle,
            phone: team.phone,
            slaHours: 48,
            remainingTime: 'Selesai Tepat Waktu',
            progressPercent: 100,
            statusNote: summaryNote,
          },
      timeline: updatedTimeline,
    });

    setUploadedAfterPhoto(null);
    setFieldNote('');
    showToast(`Tiket ${report.id} selesai 100% & dipublikasikan ke Portal Warga!`);
  };

  const handleAfterPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImageFile(file, 960, 0.75);
      setUploadedAfterPhoto(compressed);
      showToast('Foto pasca-perbaikan berhasil dilampirkan.');
    } catch (err: any) {
      showToast(err?.message || 'Gagal memproses foto.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleExportCsv = () => {
    if (filteredReports.length === 0) {
      showToast('Belum ada data laporan untuk diekspor.');
      return;
    }
    const headers = [
      'ID Tiket',
      'Judul',
      'Nama Tempat',
      'Kecamatan',
      'Alamat',
      'Latitude',
      'Longitude',
      'Kategori',
      'Jenis Hambatan',
      'Keparahan',
      'Skor SAW',
      'Status',
      'Waktu Lapor',
    ];
    const rows = filteredReports.map(r => [
      r.id,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.placeName.replace(/"/g, '""')}"`,
      r.district,
      `"${r.address.replace(/"/g, '""')}"`,
      r.coordinates.lat,
      r.coordinates.lng,
      r.facilityCategory,
      `"${r.obstacleType.replace(/"/g, '""')}"`,
      r.severity,
      r.sawScores.totalSaw.toFixed(3),
      r.statusLabel,
      `"${r.createdAt}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `laporan-aksesibilitas-kebumen-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Berkas CSV rekapitulasi laporan berhasil diunduh.');
  };

  const currentPeriodLabel = new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
  const avgSaw =
    filteredReports.length > 0
      ? (
          filteredReports.reduce((acc, r) => acc + (r.sawScores?.totalSaw || 0), 0) /
          filteredReports.length
        ).toFixed(3)
      : '0.000';
  const completionPct =
    filteredReports.length > 0
      ? Math.round((completedCount / filteredReports.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col max-w-md mx-auto relative select-none pb-20 border-x border-[#eaedff]">
      {/* Hidden input for real after-photo upload */}
      <input
        ref={afterPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleAfterPhotoFile}
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 max-w-sm mx-auto bg-[#00355f] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#7fc5fd]/30">
          <span className="material-symbols-outlined text-[18px] text-[#a3f69c]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#eaedff] px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
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
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8px] font-bold ${
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
            {/* Refresh Live Data from MongoDB */}
            <button
              onClick={() => {
                onRefreshReports();
                showToast('Menyegarkan data laporan terbaru dari database...');
              }}
              title="Muat Ulang Data Database"
              className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#00355f] flex items-center justify-center hover:bg-[#eaedff] transition-colors"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              >
                sync
              </span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() =>
                showToast(
                  needVerification > 0
                    ? `Ada ${needVerification} laporan warga baru menunggu verifikasi.`
                    : 'Semua laporan masuk sudah diverifikasi.'
                )
              }
              aria-label="Notifikasi"
              className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#131b2e] flex items-center justify-center hover:bg-[#eaedff] relative transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              {needVerification > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#ba1a1a] text-white text-[9px] font-bold flex items-center justify-center">
                  {needVerification}
                </span>
              )}
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

        {/* Real District Filter Select */}
        <div className="mt-2.5 flex items-center gap-2 bg-[#f2f3ff] rounded-xl px-3 py-1.5 text-xs text-[#00355f] font-bold border border-[#dae2fd]">
          <span className="material-symbols-outlined text-[16px]">domain</span>
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="bg-transparent flex-1 text-[11px] font-bold text-[#00355f] focus:outline-none"
          >
            <option value="ALL">Wilayah: Semua Kecamatan ({reports.length} Tiket)</option>
            {availableDistricts.map(d => (
              <option key={d} value={d}>
                Kecamatan {d}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-5">
        {/* =========================================================================
            TAB 1: DASHBOARD EKSEKUTIF, VALIDASI SAW & PUBLIKASI
            ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00355f]">
                  DASHBOARD REAL-TIME
                </span>
                <h2 className="text-sm font-bold text-[#131b2e]">
                  Ringkasan Kinerja & Validasi
                </h2>
              </div>
              <span className="text-[10px] text-[#42474f] font-semibold bg-[#eaedff] px-2 py-0.5 rounded-md">
                {filteredReports.length} Total Tiket
              </span>
            </div>

            {/* 4 Metric Cards (100% Real Data) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                  <span>Total Lap. Aktif</span>
                  <span className="material-symbols-outlined text-[18px] text-[#006496]">
                    folder
                  </span>
                </div>
                <span className="text-2xl font-black text-[#00355f] my-0.5">
                  {totalActive}
                </span>
                <span className="text-[10px] text-[#006496] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {needVerification} Butuh Verifikasi
                </span>
              </div>

              <div className="bg-[#ffdad6]/40 p-3 rounded-2xl border border-[#ffdad6] shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center text-[#ba1a1a] text-[11px] font-bold">
                  <span>Darurat / Kritis</span>
                  <span className="material-symbols-outlined text-[18px]">emergency</span>
                </div>
                <span className="text-2xl font-black text-[#ba1a1a] my-0.5">
                  {criticalCount} Kasus
                </span>
                <span className="text-[10px] text-[#ba1a1a] font-semibold">
                  Skor SAW &ge; 0.85
                </span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                  <span>Tuntas Selesai</span>
                  <span className="material-symbols-outlined text-[18px] text-[#005713]">
                    task_alt
                  </span>
                </div>
                <span className="text-2xl font-black text-[#005713] my-0.5">
                  {completedCount}{' '}
                  <span className="text-xs font-bold">({completionPct}%)</span>
                </span>
                <span className="text-[10px] text-[#005713] font-bold">
                  {inProgressCount} Sedang Dikerjakan
                </span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-center text-[#42474f] text-[11px]">
                  <span>Penyelesaian Wilayah</span>
                  <span className="material-symbols-outlined text-[18px] text-[#006496]">
                    bar_chart
                  </span>
                </div>
                {districtCompletion.length === 0 ? (
                  <p className="text-[10px] text-[#727780] my-auto pt-1">
                    Belum ada data wilayah
                  </p>
                ) : (
                  <div className="space-y-1 mt-1 text-[10px]">
                    {districtCompletion.map(d => (
                      <div key={d.district}>
                        <div className="flex justify-between font-bold text-[#131b2e]">
                          <span className="truncate">{d.district}</span>
                          <span>
                            {d.done}/{d.total}
                          </span>
                        </div>
                        <div className="w-full bg-[#dae2fd] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#00355f] h-full"
                            style={{ width: `${d.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Peta Analitik & Geofencing Card */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#00355f] text-[18px]">
                    troubleshoot
                  </span>
                  Peta Analitik & Geofencing
                </h3>
                <span className="text-[10px] text-[#006496] font-bold">
                  Radius: {geofenceRadius}
                </span>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'public_space', label: 'Ruang Publik' },
                  { id: 'public_service', label: 'Fasilitas Umum' },
                  { id: 'transit', label: 'Transportasi' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setMapCategoryFilter(cat.id as any)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                      mapCategoryFilter === cat.id
                        ? 'bg-[#00355f] text-white'
                        : 'bg-[#f2f3ff] text-[#131b2e]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#42474f] flex-wrap">
                <span>URGENSI:</span>
                <span className="px-2 py-0.5 rounded-md bg-[#ffdad6] text-[#ba1a1a]">
                  Kritis ({criticalCount})
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#cce5ff] text-[#00517b]">
                  Sedang ({moderateCount})
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#a3f69c]/50 text-[#003d0b]">
                  Rendah ({mildCount})
                </span>
              </div>

              <LeafletMapView
                reports={mapReports}
                heightClass="h-48"
                geofenceRadiusMeters={radiusMeters}
                onSelectReport={id => {
                  setSelectedTicketId(id);
                  showToast(`Tiket ${id} dipilih.`);
                }}
              />

              <div className="p-2.5 bg-[#f2f3ff] rounded-xl flex items-center justify-between text-[11px] font-bold text-[#00355f]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#006496]">
                    hub
                  </span>
                  <span>{spatialClusters.length} Klaster Berdekatan Terdeteksi</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('peta')}
                  className="text-[10px] bg-[#dae2fd] px-2 py-0.5 rounded-md hover:bg-[#cce5ff]"
                >
                  Detail Peta &rarr;
                </button>
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
                    Antrean Laporan Warga & Peringkat SAW
                  </h3>
                </div>
                <span className="bg-[#d2e4ff] text-[#001c37] text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {totalActive} Aktif
                </span>
              </div>

              {/* Working Sub-tabs */}
              <div className="grid grid-cols-3 gap-1 bg-[#f2f3ff] p-1 rounded-xl text-[10px] font-bold text-center">
                <button
                  type="button"
                  onClick={() => setSawQueueTab('antrean')}
                  className={`py-1.5 rounded-lg transition-colors ${
                    sawQueueTab === 'antrean'
                      ? 'bg-white text-[#00355f] shadow-xs'
                      : 'text-[#42474f] hover:text-[#00355f]'
                  }`}
                >
                  Baru Masuk ({needVerification})
                </button>
                <button
                  type="button"
                  onClick={() => setSawQueueTab('prioritas')}
                  className={`py-1.5 rounded-lg transition-colors ${
                    sawQueueTab === 'prioritas'
                      ? 'bg-white text-[#00355f] shadow-xs'
                      : 'text-[#42474f] hover:text-[#00355f]'
                  }`}
                >
                  Prioritas SAW ({totalActive})
                </button>
                <button
                  type="button"
                  onClick={() => setSawQueueTab('dikerjakan')}
                  className={`py-1.5 rounded-lg transition-colors ${
                    sawQueueTab === 'dikerjakan'
                      ? 'bg-white text-[#00355f] shadow-xs'
                      : 'text-[#42474f] hover:text-[#00355f]'
                  }`}
                >
                  Diproses ({inProgressCount})
                </button>
              </div>

              {queueReports.length === 0 ? (
                <div className="p-6 text-center bg-[#f2f3ff] rounded-xl space-y-1.5">
                  <span className="material-symbols-outlined text-[28px] text-[#727780]">
                    inbox
                  </span>
                  <p className="text-xs font-bold text-[#131b2e]">
                    Tidak Ada Tiket pada Tab Ini
                  </p>
                  <p className="text-[11px] text-[#42474f]">
                    Laporan baru yang dikirim oleh warga melalui Portal Warga akan langsung tampil di sini secara otomatis.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queueReports.map(rep => {
                    const isSelected = activeDispositionReport?.id === rep.id;
                    return (
                      <div
                        key={rep.id}
                        onClick={() => setSelectedTicketId(rep.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                          isSelected
                            ? 'bg-white border-2 border-[#00355f] shadow-sm'
                            : 'bg-[#faf8ff] border-[#eaedff] hover:border-[#006496]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-[#00355f] bg-[#eaedff] px-2 py-0.5 rounded">
                              {rep.id}
                            </span>
                            <span className="text-[10px] text-[#42474f]">{rep.createdAt}</span>
                          </div>
                          <div className="bg-[#00355f] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                            RANK #{rep.sawScores.rank || 1} • SAW:{' '}
                            {rep.sawScores.totalSaw.toFixed(3)}
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          {rep.photoBefore && (
                            <div className="w-16 h-16 rounded-lg bg-[#eaedff] overflow-hidden flex-shrink-0">
                              <img
                                src={rep.photoBefore}
                                alt={rep.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[12px] font-bold text-[#131b2e] leading-snug">
                              {rep.title}
                            </h4>
                            <p className="text-[10px] text-[#42474f] mt-0.5">
                              Kec. {rep.district} • {rep.address}
                            </p>
                            <p className="text-[11px] text-[#42474f] mt-1 line-clamp-2">
                              {rep.description}
                            </p>
                          </div>
                        </div>

                        {/* SAW Criteria Bars */}
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] border-t border-[#eaedff]">
                          <div>
                            <div className="flex justify-between font-bold text-[#ba1a1a]">
                              <span>C1 Keselamatan (35%)</span>
                              <span>{rep.sawScores.c1Safety.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-[#dae2fd] h-1 rounded-full overflow-hidden mt-0.5">
                              <div
                                className="bg-[#ba1a1a] h-full"
                                style={{
                                  width: `${Math.min(100, rep.sawScores.c1Safety * 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between font-bold text-[#006496]">
                              <span>C2 Akses Difabel (30%)</span>
                              <span>{rep.sawScores.c2Access.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-[#dae2fd] h-1 rounded-full overflow-hidden mt-0.5">
                              <div
                                className="bg-[#006496] h-full"
                                style={{
                                  width: `${Math.min(100, rep.sawScores.c2Access * 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between font-bold text-[#00355f]">
                              <span>C3 Pengguna (20%)</span>
                              <span>{rep.sawScores.c3Users.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-[#dae2fd] h-1 rounded-full overflow-hidden mt-0.5">
                              <div
                                className="bg-[#00355f] h-full"
                                style={{
                                  width: `${Math.min(100, rep.sawScores.c3Users * 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between font-bold text-[#42474f]">
                              <span>C4 Fisik (15%)</span>
                              <span>{rep.sawScores.c4Physical.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-[#dae2fd] h-1 rounded-full overflow-hidden mt-0.5">
                              <div
                                className="bg-[#42474f] h-full"
                                style={{
                                  width: `${Math.min(100, rep.sawScores.c4Physical * 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {rep.status === 'submitted' && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleVerifyReport(rep);
                              }}
                              className="flex-1 py-2 bg-[#eaedff] text-[#00355f] rounded-xl text-[11px] font-bold hover:bg-[#dae2fd] flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                verified
                              </span>
                              <span>Validasi</span>
                            </button>
                          )}

                          {rep.status !== 'in_progress' && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleDispatchSpk(rep);
                              }}
                              className="flex-1 py-2 bg-[#00355f] text-white rounded-xl text-[11px] font-bold hover:bg-[#006496] flex items-center justify-center gap-1 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                assignment_turned_in
                              </span>
                              <span>Terbitkan SPK & Kerjakan</span>
                            </button>
                          )}

                          {rep.status === 'in_progress' && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedTicketId(rep.id);
                                showToast(
                                  `Silakan unggah foto hasil perbaikan & klik Selesaikan di bawah untuk tiket ${rep.id}.`
                                );
                              }}
                              className="flex-1 py-2 bg-[#005713] text-[#a3f69c] rounded-xl text-[11px] font-bold hover:bg-[#003d0b] flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                task_alt
                              </span>
                              <span>Siap Diselesaikan</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteReport(rep.id);
                              showToast(`Tiket ${rep.id} dihapus dari database.`);
                            }}
                            title="Hapus Laporan"
                            className="w-9 h-9 rounded-xl bg-[#ffdad6]/60 hover:bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center flex-shrink-0"
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Disposisi Tim Teknis & Publikasi (Sebelum-Sesudah) */}
            {activeDispositionReport && (
              <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#00355f] text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">groups</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#131b2e]">
                        Disposisi Tim Teknis & Penyelesaian Tiket
                      </h3>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#00355f] font-mono font-bold bg-[#eaedff] px-2 py-0.5 rounded">
                    {activeDispositionReport.id}
                  </span>
                </div>

                {/*Pilih Tiket Target*/}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#131b2e]">
                    Tiket Laporan yang Diproses:
                  </label>
                  <select
                    value={activeDispositionReport.id}
                    onChange={e => setSelectedTicketId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] text-xs font-bold text-[#00355f] border border-[#dae2fd] focus:outline-none"
                  >
                    {filteredReports.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {r.placeName} ({r.statusLabel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown Regu Pelaksana */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#131b2e]">
                    Penugasan Regu Pelaksana:
                  </label>
                  <select
                    value={selectedReguId}
                    onChange={e => setSelectedReguId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] text-xs font-bold text-[#00355f] border border-[#dae2fd] focus:outline-none"
                  >
                    {TRC_TEAMS.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catatan Tindakan Petugas */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#131b2e]">
                    Catatan Tindakan / Hasil Perbaikan:
                  </label>
                  <textarea
                    rows={2}
                    value={fieldNote}
                    onChange={e => setFieldNote(e.target.value)}
                    placeholder="Contoh: Pemasangan kembali ubin guiding block & perbaikan kelandaian ramp..."
                    className="w-full p-2.5 rounded-xl bg-[#f2f3ff] text-xs text-[#131b2e] border border-[#dae2fd] focus:outline-none focus:bg-white resize-none"
                  />
                </div>

                {/* Unggah Bukti Pasca-Perbaikan */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-[#131b2e]">
                      Dokumentasi Sebelum & Sesudah:
                    </span>
                    {uploadedAfterPhoto && (
                      <button
                        type="button"
                        onClick={() => setUploadedAfterPhoto(null)}
                        className="text-[10px] text-[#ba1a1a] font-bold hover:underline"
                      >
                        Ganti / Hapus Foto
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Sebelum */}
                    <div className="relative h-28 rounded-xl overflow-hidden border border-[#eaedff] bg-[#f2f3ff] flex items-center justify-center">
                      {activeDispositionReport.photoBefore ? (
                        <img
                          src={activeDispositionReport.photoBefore}
                          alt="Sebelum"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-[#727780] p-2 text-center">
                          Warga tidak melampirkan foto awal
                        </span>
                      )}
                      <span className="absolute top-1.5 left-1.5 bg-[#ba1a1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Sebelum
                      </span>
                    </div>

                    {/* Sesudah / Real Upload Box */}
                    <div
                      onClick={() => afterPhotoInputRef.current?.click()}
                      className="relative h-28 rounded-xl border-2 border-dashed border-[#006496] bg-[#f2f3ff] hover:bg-[#eaedff] cursor-pointer flex flex-col items-center justify-center p-2 text-center transition-colors overflow-hidden"
                    >
                      {uploadedAfterPhoto || activeDispositionReport.photoAfter ? (
                        <>
                          <img
                            src={uploadedAfterPhoto || activeDispositionReport.photoAfter}
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
                            {isUploadingPhoto ? 'hourglass_top' : 'add_photo_alternate'}
                          </span>
                          <span className="text-[10px] font-bold text-[#00355f] mt-1">
                            {isUploadingPhoto ? 'Memproses...' : 'Unggah Foto Sesudah'}
                          </span>
                          <span className="text-[8px] text-[#42474f]">
                            Ketuk untuk pilih gambar
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {activeDispositionReport.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDispatchSpk(
                          activeDispositionReport,
                          selectedReguId,
                          fieldNote
                        )
                      }
                      className="w-full py-2.5 bg-[#00355f] hover:bg-[#006496] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        engineering
                      </span>
                      <span>Simpan Disposisi SPK & Tugaskan Regu</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCompleteReport(activeDispositionReport)}
                    className="w-full py-3 bg-[#005713] hover:bg-[#003d0b] text-[#a3f69c] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-[18px]">public</span>
                    <span>Publikasikan ke Portal Warga & Selesaikan Tiket</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: PETA & KLASTER GEOFENCING REAL-TIME
            ========================================================================= */}
        {activeTab === 'peta' && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-2xl border border-[#eaedff] space-y-2">
              <div className="text-center font-bold text-xs text-[#131b2e]">
                Radius Deteksi Geofencing Klaster
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
                      showToast(
                        autoMerge ? 'Auto-merge dinonaktifkan.' : 'Auto-merge diaktifkan.'
                      );
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

            <div className="bg-white p-2 rounded-2xl border border-[#eaedff] shadow-xs space-y-2">
              <LeafletMapView
                reports={filteredReports}
                heightClass="h-60"
                geofenceRadiusMeters={radiusMeters}
                onSelectReport={id => {
                  setSelectedTicketId(id);
                  setActiveTab('dashboard');
                  showToast(`Membuka tiket ${id} pada Dashboard.`);
                }}
              />
              <div className="flex justify-between items-center px-2 pt-1 text-[10px] font-bold text-[#42474f]">
                <span>Total Titik: {filteredReports.length}</span>
                <span>Klaster Radius {geofenceRadius}: {spatialClusters.length}</span>
              </div>
            </div>

            {spatialClusters.length === 0 ? (
              <div className="bg-white p-5 rounded-2xl border border-[#eaedff] text-center space-y-2">
                <span className="material-symbols-outlined text-[30px] text-[#006496]">
                  radar
                </span>
                <h4 className="text-xs font-bold text-[#131b2e]">
                  Tidak Ada Duplikasi Laporan pada Radius {geofenceRadius}
                </h4>
                <p className="text-[11px] text-[#42474f]">
                  Klaster otomatis terbentuk apabila terdapat 2 atau lebih laporan warga yang berjarak kurang dari {geofenceRadius}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {spatialClusters.map(clust => (
                  <div
                    key={clust.clusterId}
                    className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-extrabold px-2 py-0.5 rounded">
                          Klaster Spasial Aktif
                        </span>
                        <div className="text-xs font-mono font-bold text-[#00355f] mt-1">
                          {clust.clusterId}
                        </div>
                        <h4 className="text-xs font-bold text-[#131b2e]">
                          {clust.placeName}
                        </h4>
                        <p className="text-[10px] text-[#42474f]">
                          Kec. {clust.district} • {clust.items.length} Laporan Berdekatan
                        </p>
                      </div>
                      <div className="bg-[#f2f3ff] p-2 rounded-xl text-center">
                        <span className="text-[9px] text-[#42474f] font-semibold block">
                          SKOR MAKS
                        </span>
                        <span className="text-xs font-extrabold text-[#ba1a1a] font-mono">
                          {clust.maxSaw.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {clust.items.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedTicketId(item.id);
                            setActiveTab('dashboard');
                          }}
                          className="p-2 bg-[#f2f3ff] hover:bg-[#eaedff] cursor-pointer rounded-xl flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-mono font-bold text-[11px] text-[#00355f]">
                              <span>{item.id}</span>
                              <span className="text-[10px] text-[#42474f] font-normal">
                                {item.createdAt}
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-[#131b2e] truncate">
                              {item.title}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[#727780] text-[18px]">
                            chevron_right
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full py-2.5 bg-[#00355f] text-white rounded-xl text-xs font-bold hover:bg-[#006496] transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Ekspor Titik Koordinat GPS (CSV)</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 3: TUGAS OPERASIONAL LAPANGAN TRC PUPR
            ========================================================================= */}
        {activeTab === 'tugas' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="bg-[#cce5ff] text-[#00517b] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                Operasional Lapangan TRC PUPR
              </span>
              <h2 className="text-sm font-black text-[#131b2e] tracking-tight pt-1">
                Daftar Tugas & Penanganan Tiket
              </h2>
              <p className="text-xs text-[#42474f]">
                Kelola verifikasi laporan warga, penerbitan SPK, progres lapangan, hingga penyelesaian.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs text-center">
                <span className="text-[10px] text-[#42474f] font-semibold block">
                  MENUNGGU
                </span>
                <span className="text-xl font-black text-[#ba1a1a] block my-0.5">
                  {needVerification}
                </span>
                <span className="text-[9px] text-[#42474f] font-bold">Verifikasi</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs text-center">
                <span className="text-[10px] text-[#42474f] font-semibold block">
                  SPK AKTIF
                </span>
                <span className="text-xl font-black text-[#00355f] block my-0.5">
                  {inProgressCount}
                </span>
                <span className="text-[9px] text-[#006496] font-bold">Lapangan</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs text-center">
                <span className="text-[10px] text-[#42474f] font-semibold block">
                  SELESAI
                </span>
                <span className="text-xl font-black text-[#005713] block my-0.5">
                  {completedCount}
                </span>
                <span className="text-[9px] text-[#003d0b] font-bold">Tuntas 100%</span>
              </div>
            </div>

            {/* Working Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: 'all', label: `Semua (${filteredReports.length})` },
                { id: 'submitted', label: `Baru (${needVerification})` },
                { id: 'in_progress', label: `Dikerjakan (${inProgressCount})` },
                { id: 'completed', label: `Selesai (${completedCount})` },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTaskFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                    taskFilter === f.id
                      ? 'bg-[#00355f] text-white'
                      : 'bg-[#f2f3ff] text-[#42474f] hover:bg-[#eaedff]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-[#eaedff] text-center space-y-2">
                <span className="material-symbols-outlined text-[32px] text-[#727780]">
                  assignment_late
                </span>
                <p className="text-xs font-bold text-[#131b2e]">
                  Belum Ada Tugas pada Filter Ini
                </p>
                <p className="text-[11px] text-[#42474f]">
                  Setiap laporan yang masuk dari warga dapat langsung diterbitkan SPK dan dipantau progresnya di halaman ini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(task => {
                  const pct =
                    task.status === 'completed'
                      ? 100
                      : task.assignedTeam?.progressPercent ||
                        (task.status === 'in_progress'
                          ? 50
                          : task.status === 'verified'
                          ? 25
                          : 0);
                  return (
                    <div
                      key={task.id}
                      className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#00355f]">
                            {task.spkNumber || task.id}
                          </span>
                          <span className="bg-[#eaedff] text-[#00355f] text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                            SAW {task.sawScores.totalSaw.toFixed(3)}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            task.status === 'completed'
                              ? 'bg-[#a3f69c] text-[#002204]'
                              : task.status === 'in_progress'
                              ? 'bg-[#cce5ff] text-[#00517b]'
                              : task.status === 'verified'
                              ? 'bg-[#d2e4ff] text-[#00355f]'
                              : 'bg-[#ffdad6] text-[#ba1a1a]'
                          }`}
                        >
                          {task.statusLabel}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#42474f]">
                          Tiket: {task.id} • {task.createdAt}
                        </span>
                        <h4 className="text-xs font-bold text-[#131b2e] leading-snug mt-0.5">
                          {task.title}
                        </h4>
                        <p className="text-[10px] text-[#42474f] flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px] text-[#006496]">
                            location_on
                          </span>
                          Kec. {task.district} • {task.address}
                        </p>
                      </div>

                      {task.assignedTeam && (
                        <div className="p-2.5 bg-[#f2f3ff] rounded-xl flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-[#131b2e] truncate">
                              {task.assignedTeam.name}
                            </div>
                            <div className="text-[10px] text-[#42474f]">
                              PJ: {task.assignedTeam.leadOfficer} ({task.assignedTeam.vehicle})
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar & Quick Progress Controls */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-[#00355f]">
                          <span>Progres Penanganan</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-[#dae2fd] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              task.status === 'completed' ? 'bg-[#005713]' : 'bg-[#00355f]'
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>

                        {task.status === 'in_progress' && (
                          <div className="flex items-center gap-1 pt-1">
                            {[25, 50, 75].map(stepPct => (
                              <button
                                key={stepPct}
                                type="button"
                                onClick={() => handleUpdateProgress(task, stepPct)}
                                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border ${
                                  pct === stepPct
                                    ? 'bg-[#00355f] text-white border-[#00355f]'
                                    : 'bg-[#f2f3ff] text-[#00355f] border-[#dae2fd]'
                                }`}
                              >
                                {stepPct}%
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Task Action Buttons */}
                      {task.status !== 'completed' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {task.status === 'submitted' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyReport(task)}
                              className="py-2 bg-[#f2f3ff] text-[#00355f] rounded-xl text-xs font-bold hover:bg-[#eaedff] flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                verified
                              </span>
                              <span>Validasi</span>
                            </button>
                          )}

                          {task.status !== 'in_progress' ? (
                            <button
                              type="button"
                              onClick={() => handleDispatchSpk(task)}
                              className="py-2 bg-[#00355f] text-white rounded-xl text-xs font-bold hover:bg-[#006496] flex items-center justify-center gap-1 col-span-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                play_arrow
                              </span>
                              <span>Terbitkan SPK</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTicketId(task.id);
                                  setActiveTab('dashboard');
                                }}
                                className="py-2 bg-[#eaedff] text-[#00355f] rounded-xl text-xs font-bold hover:bg-[#dae2fd] flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  add_photo_alternate
                                </span>
                                <span>Lampirkan Foto</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCompleteReport(task)}
                                className="py-2 bg-[#005713] text-[#a3f69c] rounded-xl text-xs font-bold hover:bg-[#003d0b] flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  task_alt
                                </span>
                                <span>Tandai Selesai</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: AUDIT AKUNTABILITAS PUBLIK & REKAP REAL-TIME
            ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs font-bold text-[#131b2e]">
                    Audit Akuntabilitas Publik
                  </h2>
                  <p className="text-[11px] text-[#42474f] leading-snug mt-0.5">
                    Rekam jejak penanganan nyata berdasarkan data database
                  </p>
                </div>
                <span className="bg-[#a3f69c] text-[#002204] text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#005713] animate-ping"></span>
                  Live Log
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#f2f3ff] p-2 rounded-xl flex items-center justify-between text-[#00355f] font-bold text-[11px]">
                  <span>{currentPeriodLabel}</span>
                  <span className="material-symbols-outlined text-[16px]">
                    calendar_month
                  </span>
                </div>
                <div className="bg-[#f2f3ff] p-2 rounded-xl flex items-center justify-between text-[#00355f] font-bold text-[11px]">
                  <span>
                    {selectedDistrict === 'ALL'
                      ? 'Seluruh Kebumen'
                      : `Kec. ${selectedDistrict}`}
                  </span>
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 bg-[#00355f] text-white rounded-xl text-xs font-bold hover:bg-[#006496] flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="py-2.5 bg-[#eaedff] text-[#00355f] rounded-xl text-xs font-bold hover:bg-[#dae2fd] flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Real Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs space-y-1">
                <span className="bg-[#a3f69c] text-[#002204] text-[10px] font-bold px-2 py-0.5 rounded">
                  Penyelesaian
                </span>
                <div className="text-xl font-black text-[#131b2e] pt-1">
                  {completionPct}%
                </div>
                <div className="text-[11px] font-bold text-[#131b2e]">
                  Rasio Tiket Tuntas
                </div>
                <div className="text-[10px] text-[#42474f]">
                  {completedCount} dari {filteredReports.length} laporan selesai
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#eaedff] shadow-xs space-y-1">
                <span className="bg-[#cce5ff] text-[#00517b] text-[10px] font-bold px-2 py-0.5 rounded">
                  Indeks SAW
                </span>
                <div className="text-xl font-black text-[#006496] pt-1 font-mono">
                  {avgSaw}
                </div>
                <div className="text-[11px] font-bold text-[#131b2e]">
                  Rata-rata Skor SAW
                </div>
                <div className="text-[10px] text-[#42474f]">
                  {criticalCount} laporan kategori kritis
                </div>
              </div>
            </div>

            {/* Real-Time Audit Trail */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#131b2e]">
                <span>Jejak Audit Aktivitas Nyata</span>
                <span className="text-[#006496]">{auditLogs.length} Aktivitas</span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="bg-white p-5 rounded-2xl border border-[#eaedff] text-center text-xs text-[#42474f]">
                  Belum ada log aktivitas tercatat di database.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {auditLogs.slice(0, 10).map(log => (
                    <div
                      key={log.id}
                      className="bg-white p-3 rounded-xl border border-[#eaedff] space-y-1"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#42474f]">{log.time}</span>
                        <span className="bg-[#eaedff] text-[#00355f] font-mono font-bold px-2 py-0.5 rounded">
                          {log.reportId} • SAW {log.saw.toFixed(3)}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#131b2e]">
                        {log.stageTitle} — {log.title}
                      </h4>
                      <p className="text-[11px] text-[#42474f] leading-relaxed">
                        {log.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real Completed Before-After Gallery */}
            {filteredReports
              .filter(r => r.status === 'completed')
              .map(doneRep => (
                <div
                  key={doneRep.id}
                  className="bg-white p-3.5 rounded-2xl border border-[#eaedff] shadow-xs space-y-2.5"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#131b2e]">
                      Arsip Verifikasi Selesai
                    </span>
                    <span className="font-mono font-bold text-[#005713]">
                      {doneRep.id}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#131b2e]">{doneRep.title}</h4>

                  {(doneRep.photoBefore || doneRep.photoAfter) && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="relative rounded-xl overflow-hidden h-28 bg-[#f2f3ff] flex items-center justify-center">
                        {doneRep.photoBefore ? (
                          <img
                            src={doneRep.photoBefore}
                            alt="Sebelum"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-[#727780]">Tanpa foto awal</span>
                        )}
                        <span className="absolute top-1.5 left-1.5 bg-[#ba1a1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Sebelum
                        </span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden h-28 bg-[#f2f3ff] flex items-center justify-center">
                        {doneRep.photoAfter ? (
                          <img
                            src={doneRep.photoAfter}
                            alt="Sesudah"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-[#727780]">
                            Terverifikasi selesai
                          </span>
                        )}
                        <span className="absolute top-1.5 right-1.5 bg-[#005713] text-[#a3f69c] text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Sesudah
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-[#eaedff]">
                    <span className="text-[#005713] font-bold">
                      {doneRep.verifiedBy || 'Terverifikasi Dinas PUPR'}
                    </span>
                    <span className="text-[#42474f]">{doneRep.completedAt}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Admin Bottom Navigation Bar */}
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
              <span
                className={`material-symbols-outlined text-[22px] ${
                  activeTab === tab.id ? 'fill-1' : ''
                }`}
              >
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
