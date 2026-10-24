import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  FileCheck2,
  FolderKanban,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  MapPin,
  Menu,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { FacilityCategory, ReportItem } from '../../types';
import { DatabaseStatus } from '../../services/reportService';
import { compressImageFile, formatCurrentWibTime } from '../../utils/imageHelper';
import { cleanLegacySawText, toScore100 } from '../../utils/sawCalculator';
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

type AdminTab = 'dashboard' | 'peta' | 'tugas' | 'audit';

const TRC_TEAMS = [
  {
    id: 'regu_a',
    label: 'TRC PUPR Regu A — Zona Kebumen Kota',
    leadOfficer: 'Pengawas Regu A DPUPR',
    vehicle: 'Unit Operasional TRC-01',
    phone: '0287381110',
  },
  {
    id: 'regu_b',
    label: 'TRC PUPR Regu B — Zona Barat / Gombong',
    leadOfficer: 'Pengawas Regu B DPUPR',
    vehicle: 'Unit Operasional TRC-02',
    phone: '0287381110',
  },
  {
    id: 'regu_c',
    label: 'Tim Pemeliharaan Regu C — Zona Timur / Prembun',
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

function StatusInline({ status, label }: { status: ReportItem['status']; label: string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{label || 'Tuntas Selesai'}</span>
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 whitespace-nowrap">
        <Wrench className="w-3.5 h-3.5 shrink-0" />
        <span>{label || 'Sedang Dikerjakan'}</span>
      </span>
    );
  }
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00355f] whitespace-nowrap">
        <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
        <span>{label || 'Terverifikasi'}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>{label || 'Menunggu Verifikasi'}</span>
    </span>
  );
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
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);

  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCategoryFilter, setMapCategoryFilter] = useState<'all' | FacilityCategory>('all');
  const [sawQueueTab, setSawQueueTab] = useState<'antrean' | 'prioritas' | 'dikerjakan'>(
    'prioritas'
  );
  const [taskFilter, setTaskFilter] = useState<
    'all' | 'submitted' | 'in_progress' | 'completed'
  >('all');
  const [geofenceRadius, setGeofenceRadius] = useState<'10m' | '20m' | '50m'>('20m');
  const [autoMerge, setAutoMerge] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected report for inspector, disposition & completion form
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [selectedReguId, setSelectedReguId] = useState<string>(TRC_TEAMS[0].id);
  const [fieldNote, setFieldNote] = useState<string>('');
  const [uploadedAfterPhoto, setUploadedAfterPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

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

  // District + Search filtered reports
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter(r => {
      const matchDistrict = selectedDistrict === 'ALL' || r.district === selectedDistrict;
      if (!matchDistrict) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.obstacleType.toLowerCase().includes(q) ||
        r.placeName.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        (r.spkNumber && r.spkNumber.toLowerCase().includes(q))
      );
    });
  }, [reports, selectedDistrict, searchQuery]);

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
      .slice(0, 6);
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

  // Active target report for Inspector, Disposition & Publication form
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
      district: string;
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
            district: rep.district,
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

  // Open ticket in inspector (desktop sticky panel + mobile/tablet drawer)
  const openTicketInspector = (reportId: string, openModalOnMobile = false) => {
    setSelectedTicketId(reportId);
    setUploadedAfterPhoto(null);
    if (openModalOnMobile) {
      setIsMobileInspectorOpen(true);
    }
  };

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
      statusLabel: 'Terverifikasi DPUPR',
      verifiedAt: now,
      verifiedBy: 'Pengawas Dinas PUPR Kebumen',
      timeline: updatedTimeline,
    });
    setSelectedTicketId(report.id);
    showToast(`Tiket ${report.id} berhasil diverifikasi.`);
  };

  const handleDispatchSpk = (report: ReportItem, customTeamId?: string, note?: string) => {
    const now = formatCurrentWibTime();
    const team = TRC_TEAMS.find(t => t.id === (customTeamId || selectedReguId)) || TRC_TEAMS[0];
    const spkCode = report.spkNumber || `#SPK-PUPR-${report.id.replace(/[^0-9]/g, '')}`;
    const noteText =
      note?.trim() ||
      `Diterjunkan ${team.label} ke lokasi ${report.placeName} sesuai urutan prioritas penanganan.`;

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
      statusLabel: 'Sedang Dikerjakan TRC',
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
    showToast(`SPK ${spkCode} diterbitkan & regu lapangan ditugaskan.`);
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
      statusLabel: 'Tuntas 100% (Terverifikasi)',
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
    setIsMobileInspectorOpen(false);
    showToast(`Tiket ${report.id} tuntas 100% & dipublikasikan ke Portal Warga.`);
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
      'Skor Prioritas (0-100)',
      'Status',
      'Nomor SPK',
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
      toScore100(r.sawScores.totalSaw),
      r.statusLabel,
      r.spkNumber || '-',
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
  const avgPriorityScore =
    filteredReports.length > 0
      ? Math.round(
          filteredReports.reduce(
            (acc, r) => acc + toScore100(r.sawScores?.totalSaw),
            0
          ) / filteredReports.length
        )
      : 0;
  const completionPct =
    filteredReports.length > 0
      ? Math.round((completedCount / filteredReports.length) * 100)
      : 0;

  const navItems: Array<{
    id: AdminTab;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Ringkasan & Validasi',
      shortLabel: 'Ringkasan',
      icon: LayoutDashboard,
      count: needVerification > 0 ? needVerification : undefined,
    },
    {
      id: 'peta',
      label: 'Peta & Klaster Spasial',
      shortLabel: 'Peta',
      icon: MapIcon,
      count: spatialClusters.length > 0 ? spatialClusters.length : undefined,
    },
    {
      id: 'tugas',
      label: 'Tugas & Disposisi SPK',
      shortLabel: 'Tugas SPK',
      icon: ClipboardCheck,
      count: inProgressCount > 0 ? inProgressCount : undefined,
    },
    {
      id: 'audit',
      label: 'Audit & Rekapitulasi',
      shortLabel: 'Audit',
      icon: ShieldCheck,
      count: completedCount > 0 ? completedCount : undefined,
    },
  ];

  const currentTabTitle =
    navItems.find(item => item.id === activeTab)?.label || 'Ringkasan & Validasi';

  // Reusable Inspector & Disposition Panel Content (rendered sticky on desktop + slide-over on mobile/tablet)
  const renderInspectorPanel = (report: ReportItem | null) => {
    if (!report) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-2">
          <FolderKanban className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">
            Belum Ada Tiket yang Dipilih
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ketika warga mengirim laporan baru, pilih salah satu tiket pada antrean untuk melakukan
            verifikasi, menerbitkan SPK, mengunggah foto perbaikan, atau menyelesaikan laporan.
          </p>
        </div>
      );
    }

    const currentProgress =
      report.status === 'completed'
        ? 100
        : report.assignedTeam?.progressPercent ||
          (report.status === 'in_progress' ? 50 : report.status === 'verified' ? 25 : 0);

    const beforeBroken = brokenImages[`before-${report.id}`];
    const afterSrc = uploadedAfterPhoto || report.photoAfter;
    const afterBroken = brokenImages[`after-${report.id}`];

    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Panel Disposisi & Penyelesaian</p>
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {report.placeName || report.title}
            </h3>
          </div>
          <span className="font-mono tabular-nums text-xs font-semibold text-[#00355f] shrink-0">
            {report.id}
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Quick Ticket Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="inspector-ticket-select"
              className="block text-xs font-semibold text-slate-700"
            >
              Pilih Tiket Aktif
            </label>
            <select
              id="inspector-ticket-select"
              value={report.id}
              onChange={e => openTicketInspector(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00355f]"
            >
              {filteredReports.map(r => (
                <option key={r.id} value={r.id}>
                  {r.id} · {r.placeName} ({r.statusLabel})
                </option>
              ))}
            </select>
          </div>

          {/* Ticket Summary Metadata */}
          <div className="py-3 border-y border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Status Saat Ini</span>
              <StatusInline status={report.status} label={report.statusLabel} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Skor Prioritas</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {toScore100(report.sawScores.totalSaw)}/100 · Urutan #{report.sawScores.rank || 1}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Lokasi & Kecamatan</span>
              <span className="font-medium text-slate-800 text-right truncate max-w-[220px]">
                Kec. {report.district} · {report.address}
              </span>
            </div>
            {report.spkNumber && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Nomor SPK</span>
                <span className="font-mono tabular-nums font-semibold text-[#00355f]">
                  {report.spkNumber}
                </span>
              </div>
            )}
          </div>

          {/* Regu Pelaksana Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="inspector-team-select"
              className="block text-xs font-semibold text-slate-700"
            >
              Penugasan Regu Lapangan (TRC PUPR)
            </label>
            <select
              id="inspector-team-select"
              value={selectedReguId}
              onChange={e => setSelectedReguId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00355f]"
            >
              {TRC_TEAMS.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Field Progress Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Progres Pengerjaan Lapangan</span>
              <span className="font-mono tabular-nums font-bold text-[#00355f]">
                {currentProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  report.status === 'completed' ? 'bg-emerald-600' : 'bg-[#00355f]'
                }`}
                style={{ width: `${currentProgress}%` }}
              />
            </div>
            {report.status !== 'completed' && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[25, 50, 75].map(stepPct => (
                  <button
                    key={stepPct}
                    type="button"
                    onClick={() => handleUpdateProgress(report, stepPct)}
                    className={`h-8 rounded-lg text-xs font-mono tabular-nums font-semibold border transition-colors whitespace-nowrap ${
                      currentProgress === stepPct
                        ? 'bg-[#00355f] text-white border-[#00355f]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Set {stepPct}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Officer Action Note */}
          <div className="space-y-1.5">
            <label
              htmlFor="inspector-field-note"
              className="block text-xs font-semibold text-slate-700"
            >
              Catatan Tindakan / Hasil Perbaikan
            </label>
            <textarea
              id="inspector-field-note"
              rows={2}
              value={fieldNote}
              onChange={e => setFieldNote(e.target.value)}
              placeholder="Contoh: Pemasangan kembali ubin guiding block & perataan akses kursi roda..."
              className="w-full p-3 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00355f] resize-none"
            />
          </div>

          {/* Before & After Photo Documentation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Dokumentasi Sebelum & Sesudah
              </span>
              {uploadedAfterPhoto && (
                <button
                  type="button"
                  onClick={() => setUploadedAfterPhoto(null)}
                  className="text-xs font-semibold text-red-700 hover:underline whitespace-nowrap"
                >
                  Hapus Foto Baru
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Before Photo */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Kondisi Awal (Warga)
                </span>
                <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  {report.photoBefore && !beforeBroken ? (
                    <img
                      src={report.photoBefore}
                      alt={`Kondisi awal ${report.title}`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages(prev => ({ ...prev, [`before-${report.id}`]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-3 text-center text-[11px] text-slate-500">
                      Tanpa lampiran foto awal
                    </div>
                  )}
                </div>
              </div>

              {/* After Photo Upload */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Pasca-Perbaikan (DPUPR)
                </span>
                <button
                  type="button"
                  onClick={() => afterPhotoInputRef.current?.click()}
                  className="relative w-full h-32 rounded-lg border border-dashed border-slate-300 hover:border-[#00355f] bg-slate-50 hover:bg-slate-100/70 transition-colors flex flex-col items-center justify-center p-2 text-center overflow-hidden"
                >
                  {afterSrc && !afterBroken ? (
                    <img
                      src={afterSrc}
                      alt={`Hasil perbaikan ${report.title}`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages(prev => ({ ...prev, [`after-${report.id}`]: true }))
                      }
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <>
                      <ImagePlus className="w-5 h-5 text-[#00355f] mb-1" />
                      <span className="text-xs font-semibold text-slate-800">
                        {isUploadingPhoto ? 'Memproses...' : 'Unggah Foto'}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        Klik untuk pilih gambar
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Workflow Buttons */}
          <div className="space-y-2.5 pt-2">
            {report.status === 'submitted' && (
              <button
                type="button"
                onClick={() => handleVerifyReport(report)}
                className="w-full h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <FileCheck2 className="w-4 h-4 text-[#00355f]" />
                <span>Validasi Laporan Warga</span>
              </button>
            )}

            {report.status !== 'completed' && (
              <button
                type="button"
                onClick={() => handleDispatchSpk(report, selectedReguId, fieldNote)}
                className="w-full h-10 px-4 rounded-lg bg-[#00355f] hover:bg-[#004880] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Wrench className="w-4 h-4" />
                <span>Simpan Disposisi & Terbitkan SPK</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCompleteReport(report)}
              className="w-full h-11 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tandai Selesai & Publikasikan ke Warga</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-36px)] w-full bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Hidden input for real compressed after-photo upload */}
      <input
        ref={afterPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleAfterPhotoFile}
        className="hidden"
      />

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          DESKTOP SIDEBAR NAVIGATION (lg and up)
          ========================================================================= */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 bg-white border-r border-slate-200 flex-col justify-between sticky top-0 h-[calc(100vh-36px)] print:hidden">
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-white p-0.5 border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/assets/aistudio/logo_7cbe31cf.png"
                alt="Logo Suara Ruang Kebumen"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-slate-900 truncate">
                SUARA RUANG
              </p>
              <p className="text-xs text-slate-500 truncate">Dinas PUPR Kebumen</p>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-1" aria-label="Menu Utama Admin">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full h-10 px-3 rounded-lg flex items-center justify-between text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#00355f] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <span
                      className={`font-mono tabular-nums text-[11px] ${
                        isActive ? 'text-sky-200' : 'text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Wilayah / Kecamatan Filter in Sidebar */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label
              htmlFor="sidebar-district-filter"
              className="block text-xs font-semibold text-slate-700"
            >
              Filter Wilayah Kecamatan
            </label>
            <select
              id="sidebar-district-filter"
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#00355f]"
            >
              <option value="ALL">Semua Kecamatan ({reports.length})</option>
              {availableDistricts.map(d => (
                <option key={d} value={d}>
                  Kecamatan {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sidebar Account & Portal Footer */}
        <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50/60">
          <div className="px-2 py-1 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-medium text-slate-800 truncate">Pengawas DPUPR</span>
            <span className="font-mono text-[11px] text-slate-500">
              {dbStatus?.connected ? 'MongoDB' : 'Lokal'}
            </span>
          </div>

          <button
            type="button"
            onClick={onSwitchToCitizen}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors whitespace-nowrap"
          >
            <span>Lihat Portal Warga</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full h-9 px-3 rounded-lg text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi Pengawas</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE & TABLET SLIDE-OVER NAVIGATION DRAWER (< lg)
          ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col justify-between p-5 z-10 shadow-xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white p-0.5 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/assets/aistudio/logo_7cbe31cf.png"
                      alt="Logo Suara Ruang Kebumen"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">SUARA RUANG</p>
                    <p className="text-[11px] text-slate-500">Admin Dinas PUPR</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  aria-label="Tutup menu"
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full h-11 px-3.5 rounded-lg flex items-center justify-between text-xs font-semibold transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-[#00355f] text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </span>
                      {item.count !== undefined && (
                        <span className="font-mono tabular-nums text-xs">{item.count}</span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label
                  htmlFor="drawer-district-filter"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Filter Kecamatan
                </label>
                <select
                  id="drawer-district-filter"
                  value={selectedDistrict}
                  onChange={e => setSelectedDistrict(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">Semua Kecamatan ({reports.length})</option>
                  {availableDistricts.map(d => (
                    <option key={d} value={d}>
                      Kecamatan {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onSwitchToCitizen();
                }}
                className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between"
              >
                <span>Buka Portal Warga</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="w-full h-10 px-3.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Sesi Pengawas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MOBILE / TABLET SLIDE-UP TICKET INSPECTOR MODAL (< xl)
          ========================================================================= */}
      {isMobileInspectorOpen && activeDispositionReport && (
        <div className="fixed inset-0 z-50 xl:hidden flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMobileInspectorOpen(false)}
          />
          <div className="relative z-10 w-full sm:max-w-lg max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Kelola & Disposisi Tiket {activeDispositionReport.id}
              </span>
              <button
                type="button"
                onClick={() => setIsMobileInspectorOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 sm:p-4">{renderInspectorPanel(activeDispositionReport)}</div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN WORKSPACE COLUMN (HEADER + RESPONSIVE VIEWPORT)
          ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Top Bar (Strict SaaS Top Bar Contract: Breadcrumb Left — Primary Actions Right) */}
        <header className="sticky top-0 z-30 h-13 lg:h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Buka navigasi admin"
              className="lg:hidden p-2 -ml-1.5 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="hidden sm:inline text-slate-500 font-medium whitespace-nowrap">
                Dinas PUPR Kebumen
              </span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="font-bold text-slate-900 truncate">{currentTabTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onRefreshReports();
                showToast('Menyinkronkan data terbaru dari database...');
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sinkronkan</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="h-9 px-3.5 rounded-lg bg-[#00355f] hover:bg-[#004880] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </header>

        {/* Main Responsive Content Container */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 pb-24 lg:pb-12 space-y-6">
          {/* Global Workspace Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari ID tiket, nama tempat, alamat, atau nomor SPK..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00355f] focus:ring-2 focus:ring-[#00355f]/10"
              />
            </div>

            <div className="flex items-center gap-2.5">
              {/* Mobile/Tablet District Dropdown */}
              <div className="lg:hidden flex-1 sm:flex-initial">
                <select
                  aria-label="Filter Kecamatan"
                  value={selectedDistrict}
                  onChange={e => setSelectedDistrict(e.target.value)}
                  className="w-full sm:w-auto h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00355f]"
                >
                  <option value="ALL">Semua Kecamatan ({reports.length})</option>
                  {availableDistricts.map(d => (
                    <option key={d} value={d}>
                      Kec. {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
                <span>Menampilkan {filteredReports.length} tiket</span>
                {selectedDistrict !== 'ALL' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDistrict('ALL')}
                      className="text-[#00355f] font-sans font-semibold hover:underline"
                    >
                      Reset Wilayah
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* =====================================================================
              TAB 1: DASHBOARD EKSEKUTIF, VALIDASI SAW & PUBLIKASI
              ===================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 4-Column Responsive KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Laporan Aktif</span>
                    <FolderKanban className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
                    {totalActive}
                  </p>
                  <p className="text-xs text-amber-700 font-medium tabular-nums">
                    {needVerification} menunggu verifikasi
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Prioritas Kritis</span>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-red-700 font-mono tabular-nums">
                    {criticalCount}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Skor Prioritas &ge; 85
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>SPK Lapangan</span>
                    <Wrench className="w-4 h-4 text-[#00355f]" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-[#00355f] font-mono tabular-nums">
                    {inProgressCount}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Ditangani regu TRC PUPR
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Tuntas Selesai</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono tabular-nums">
                      {completedCount}
                    </p>
                    <span className="text-xs font-semibold text-emerald-700 font-mono tabular-nums">
                      ({completionPct}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Rata-rata skor prioritas {avgPriorityScore}/100
                  </p>
                </div>
              </div>

              {/* Master-Detail 12-Column Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Column: Priority Queue + Geospatial Mini-Analytics */}
                <div className="xl:col-span-7 space-y-6">
                  {/* Priority Queue */}
                  <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900">
                          Antrean Validasi & Urutan Prioritas
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Diurutkan otomatis berdasarkan tingkat kedaruratan keselamatan, akses difabel, dan dampak warga (skala 0–100)
                        </p>
                      </div>

                      {/* Segmented Filter Control */}
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
                        {[
                          { id: 'prioritas', label: `Prioritas (${totalActive})` },
                          { id: 'antrean', label: `Baru (${needVerification})` },
                          { id: 'dikerjakan', label: `Diproses (${inProgressCount})` },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSawQueueTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                              sawQueueTab === tab.id
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {queueReports.length === 0 ? (
                      <div className="p-8 sm:p-12 text-center space-y-2">
                        <FolderKanban className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-sm font-semibold text-slate-900">
                          Tidak Ada Tiket pada Kategori Ini
                        </p>
                        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                          Laporan baru yang dikirim warga melalui Portal Warga akan langsung masuk ke
                          daftar ini beserta skor prioritas (0–100) secara otomatis.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {queueReports.map(rep => {
                          const isSelected = activeDispositionReport?.id === rep.id;
                          const thumbBroken = brokenImages[`queue-${rep.id}`];

                          return (
                            <article
                              key={rep.id}
                              onClick={() => openTicketInspector(rep.id, false)}
                              className={`p-4 sm:p-5 transition-colors cursor-pointer space-y-3.5 ${
                                isSelected ? 'bg-sky-50/50' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              {/* Unboxed Metadata Row */}
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
                                  <span className="font-mono tabular-nums font-bold text-[#00355f]">
                                    {rep.id}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>Kec. {rep.district}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="tabular-nums">{rep.createdAt}</span>
                                </div>

                                <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                                  <span className="font-semibold text-slate-700">
                                    Urutan #{rep.sawScores.rank || 1}
                                  </span>
                                  <span className="text-slate-300" aria-hidden="true">
                                    ·
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      toScore100(rep.sawScores.totalSaw) >= 85
                                        ? 'text-red-700'
                                        : 'text-[#00355f]'
                                    }`}
                                  >
                                    Skor {toScore100(rep.sawScores.totalSaw)}/100
                                  </span>
                                </div>
                              </div>

                              {/* Content Body */}
                              <div className="flex gap-3.5 items-start">
                                {rep.photoBefore && !thumbBroken && (
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                    <img
                                      src={rep.photoBefore}
                                      alt={rep.title}
                                      referrerPolicy="no-referrer"
                                      onError={() =>
                                        setBrokenImages(prev => ({
                                          ...prev,
                                          [`queue-${rep.id}`]: true,
                                        }))
                                      }
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0 space-y-1">
                                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                    {rep.title}
                                  </h3>
                                  <p className="text-xs text-slate-600 truncate">
                                    {rep.placeName} — {rep.address}
                                  </p>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {rep.description}
                                  </p>
                                </div>
                              </div>

                              {/* 4-Column Priority Aspect Breakdown (0-100) */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px]">
                                {[
                                  {
                                    label: 'Keselamatan',
                                    score: toScore100(rep.sawScores.c1Safety),
                                    bar: 'bg-red-600',
                                  },
                                  {
                                    label: 'Akses Difabel',
                                    score: toScore100(rep.sawScores.c2Access),
                                    bar: 'bg-sky-600',
                                  },
                                  {
                                    label: 'Warga Terdampak',
                                    score: toScore100(rep.sawScores.c3Users),
                                    bar: 'bg-[#00355f]',
                                  },
                                  {
                                    label: 'Kerusakan Fisik',
                                    score: toScore100(rep.sawScores.c4Physical),
                                    bar: 'bg-slate-600',
                                  },
                                ].map(crit => (
                                  <div key={crit.label} className="space-y-1">
                                    <div className="flex justify-between text-slate-600">
                                      <span className="truncate">{crit.label}</span>
                                      <span className="font-mono tabular-nums font-semibold text-slate-900">
                                        {crit.score}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`${crit.bar} h-full`}
                                        style={{
                                          width: `${crit.score}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Status & Action Row */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                <StatusInline status={rep.status} label={rep.statusLabel} />

                                <div className="flex flex-wrap items-center gap-2">
                                  {rep.status === 'submitted' && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleVerifyReport(rep);
                                      }}
                                      className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                    >
                                      <FileCheck2 className="w-3.5 h-3.5 text-[#00355f]" />
                                      <span>Validasi</span>
                                    </button>
                                  )}

                                  {rep.status !== 'in_progress' && rep.status !== 'completed' && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleDispatchSpk(rep);
                                      }}
                                      className="h-9 px-3.5 rounded-lg bg-[#00355f] hover:bg-[#004880] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                    >
                                      <Wrench className="w-3.5 h-3.5" />
                                      <span>Terbitkan SPK</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      openTicketInspector(rep.id, true);
                                    }}
                                    className="xl:hidden h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    <span>Kelola</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      onDeleteReport(rep.id);
                                      showToast(`Tiket ${rep.id} dihapus dari database.`);
                                    }}
                                    title="Hapus Laporan"
                                    aria-label={`Hapus tiket ${rep.id}`}
                                    className="h-9 w-9 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-700 inline-flex items-center justify-center transition-colors shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* Map Preview & District Completion Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Geospatial Mini Map */}
                    <section className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Sebaran Geospasial & Geofencing
                          </h3>
                          <p className="text-xs text-slate-500">
                            Radius klaster {geofenceRadius} · {spatialClusters.length} klaster terdeteksi
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('peta')}
                          className="text-xs font-semibold text-[#00355f] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          <span>Peta Penuh</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <LeafletMapView
                        reports={mapReports}
                        heightClass="h-56 sm:h-64"
                        geofenceRadiusMeters={radiusMeters}
                        onSelectReport={id => {
                          openTicketInspector(id, true);
                          showToast(`Tiket ${id} dipilih pada panel disposisi.`);
                        }}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
                        <span>
                          Kritis: <strong className="font-mono tabular-nums text-red-700">{criticalCount}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Sedang: <strong className="font-mono tabular-nums text-sky-700">{moderateCount}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Rendah: <strong className="font-mono tabular-nums text-emerald-700">{mildCount}</strong>
                        </span>
                      </div>
                    </section>

                    {/* District Completion Breakdown */}
                    <section className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Penyelesaian per Kecamatan
                        </h3>
                        <p className="text-xs text-slate-500">
                          Proporsi tiket selesai terhadap laporan masuk
                        </p>
                      </div>

                      {districtCompletion.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-500">
                          Belum ada data wilayah tercatat.
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {districtCompletion.map(d => (
                            <div key={d.district} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-800 truncate">
                                  Kec. {d.district}
                                </span>
                                <span className="font-mono tabular-nums text-slate-600">
                                  {d.done}/{d.total} ({d.pct}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#00355f] h-full transition-all duration-200"
                                  style={{ width: `${d.pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </div>

                {/* Right Column: Sticky Inspector & Disposition Panel */}
                <div className="xl:col-span-5 xl:sticky xl:top-22">
                  {renderInspectorPanel(activeDispositionReport)}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 2: PETA & KLASTER GEOFENCING SPASIAL
              ===================================================================== */}
          {activeTab === 'peta' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Large Geospatial Map Canvas */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Category Filter */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
                    {[
                      { id: 'all', label: 'Semua Fasilitas' },
                      { id: 'public_space', label: 'Ruang Publik' },
                      { id: 'public_service', label: 'Layanan Umum' },
                      { id: 'transit', label: 'Transportasi' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMapCategoryFilter(cat.id as any)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          mapCategoryFilter === cat.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Geofence Radius Segmented Control */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      Radius Klaster:
                    </span>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                      {(['10m', '20m', '50m'] as const).map(rad => (
                        <button
                          key={rad}
                          type="button"
                          onClick={() => setGeofenceRadius(rad)}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono tabular-nums font-semibold transition-colors whitespace-nowrap ${
                            geofenceRadius === rad
                              ? 'bg-[#00355f] text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {rad}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <LeafletMapView
                  reports={mapReports}
                  heightClass="h-[360px] sm:h-[460px] lg:h-[560px]"
                  geofenceRadiusMeters={radiusMeters}
                  onSelectReport={id => {
                    openTicketInspector(id, true);
                    if (window.innerWidth >= 1280) {
                      setActiveTab('dashboard');
                    }
                    showToast(`Membuka detail tiket ${id}.`);
                  }}
                />

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
                  <span className="font-mono tabular-nums">
                    Total titik terpetakan: {mapReports.length} laporan
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Penggabungan Duplikasi Otomatis</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoMerge}
                      onClick={() => {
                        setAutoMerge(!autoMerge);
                        showToast(
                          autoMerge ? 'Auto-merge klaster dinonaktifkan.' : 'Auto-merge klaster diaktifkan.'
                        );
                      }}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                        autoMerge ? 'bg-[#00355f]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                          autoMerge ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Spatial Clusters Column */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Deteksi Klaster Berdekatan
                      </h2>
                      <p className="text-xs text-slate-500">
                        Kalkulasi jarak Haversine &le; {geofenceRadius}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-sm font-bold text-[#00355f]">
                      {spatialClusters.length} Klaster
                    </span>
                  </div>

                  {spatialClusters.length === 0 ? (
                    <div className="py-8 text-center space-y-2 border-t border-slate-100">
                      <MapPin className="w-7 h-7 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-800">
                        Tidak Ada Duplikasi pada Radius {geofenceRadius}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Klaster otomatis terbentuk apabila terdapat 2 atau lebih laporan warga dalam
                        jarak kurang dari {geofenceRadius}.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 border-t border-slate-100">
                      {spatialClusters.map(clust => (
                        <div key={clust.clusterId} className="py-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-mono tabular-nums text-xs font-bold text-[#00355f]">
                                {clust.clusterId}
                              </span>
                              <h3 className="text-xs font-bold text-slate-900 mt-0.5">
                                {clust.placeName}
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Kec. {clust.district} · {clust.items.length} tiket berdekatan
                              </p>
                            </div>
                            <div className="text-right font-mono tabular-nums">
                              <span className="text-[10px] text-slate-500 block">Skor Tertinggi</span>
                              <span className="text-xs font-bold text-red-700">
                                {toScore100(clust.maxSaw)}/100
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {clust.items.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  openTicketInspector(item.id, true);
                                  if (window.innerWidth >= 1280) {
                                    setActiveTab('dashboard');
                                  }
                                }}
                                className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between gap-2 transition-colors"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-mono tabular-nums font-semibold text-[#00355f]">
                                    {item.id} · {item.createdAt}
                                  </p>
                                  <p className="text-xs font-medium text-slate-800 truncate">
                                    {item.title}
                                  </p>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="w-full h-10 px-4 rounded-lg bg-[#00355f] hover:bg-[#004880] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Titik Koordinat GPS (CSV)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: TUGAS OPERASIONAL LAPANGAN & DISPOSISI SPK
              ===================================================================== */}
          {activeTab === 'tugas' && (
            <div className="space-y-5">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Daftar Tugas Lapangan & Surat Perintah Kerja (SPK)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pantau penugasan regu TRC PUPR, perbarui persentase pengerjaan, dan selesaikan tiket
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto self-start sm:self-auto max-w-full">
                  {[
                    { id: 'all', label: `Semua (${filteredReports.length})` },
                    { id: 'submitted', label: `Menunggu (${needVerification})` },
                    { id: 'in_progress', label: `SPK Aktif (${inProgressCount})` },
                    { id: 'completed', label: `Selesai (${completedCount})` },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTaskFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                        taskFilter === f.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
                  <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-900">
                    Belum Ada Tugas pada Filter Ini
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Setiap laporan warga yang masuk dapat langsung diverifikasi, diterbitkan SPK, dan
                    dipantau progres pengerjaannya di halaman ini.
                  </p>
                </div>
              ) : (
                <>
                  {/* DESKTOP HIGH-DENSITY DATA TABLE (lg and up) */}
                  <div className="hidden lg:block bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                            <th className="py-3 px-4">Tiket & Lokasi</th>
                            <th className="py-3 px-4">Kecamatan</th>
                            <th className="py-3 px-4 text-right">Skor Prioritas</th>
                            <th className="py-3 px-4">Regu Pelaksana / SPK</th>
                            <th className="py-3 px-4 w-52">Progres Lapangan</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
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
                              <tr
                                key={task.id}
                                className="hover:bg-slate-50/80 transition-colors align-middle"
                              >
                                <td className="py-3.5 px-4 max-w-xs">
                                  <div className="font-mono tabular-nums font-bold text-[#00355f]">
                                    {task.id}
                                    <span className="font-sans font-normal text-slate-400">
                                      {' '}
                                      · {task.createdAt}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-slate-900 truncate mt-0.5">
                                    {task.title}
                                  </div>
                                  <div className="text-slate-500 truncate">{task.address}</div>
                                </td>

                                <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                                  Kec. {task.district}
                                </td>

                                <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                                  <span
                                    className={`font-bold ${
                                      toScore100(task.sawScores.totalSaw) >= 85
                                        ? 'text-red-700'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    {toScore100(task.sawScores.totalSaw)}/100
                                  </span>
                                  <span className="block text-[11px] text-slate-400">
                                    Urutan #{task.sawScores.rank || 1}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 max-w-[220px]">
                                  {task.assignedTeam ? (
                                    <div>
                                      <div className="font-mono tabular-nums text-[11px] font-semibold text-[#00355f]">
                                        {task.spkNumber || 'SPK Aktif'}
                                      </div>
                                      <div className="font-medium text-slate-800 truncate">
                                        {task.assignedTeam.name}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">Belum ditugaskan</span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between font-mono tabular-nums text-[11px]">
                                      <span className="text-slate-500">Realisasi</span>
                                      <span className="font-bold text-slate-900">{pct}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-200 ${
                                          task.status === 'completed'
                                            ? 'bg-emerald-600'
                                            : 'bg-[#00355f]'
                                        }`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    {task.status === 'in_progress' && (
                                      <div className="flex items-center gap-1 pt-0.5">
                                        {[25, 50, 75].map(step => (
                                          <button
                                            key={step}
                                            type="button"
                                            onClick={() => handleUpdateProgress(task, step)}
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-semibold border ${
                                              pct === step
                                                ? 'bg-[#00355f] text-white border-[#00355f]'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                          >
                                            {step}%
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <StatusInline status={task.status} label={task.statusLabel} />
                                </td>

                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    {task.status === 'submitted' && (
                                      <button
                                        type="button"
                                        onClick={() => handleVerifyReport(task)}
                                        className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold whitespace-nowrap"
                                      >
                                        Validasi
                                      </button>
                                    )}

                                    {task.status !== 'in_progress' &&
                                      task.status !== 'completed' && (
                                        <button
                                          type="button"
                                          onClick={() => handleDispatchSpk(task)}
                                          className="h-8 px-3 rounded-lg bg-[#00355f] hover:bg-[#004880] text-white font-semibold whitespace-nowrap"
                                        >
                                          Terbitkan SPK
                                        </button>
                                      )}

                                    {task.status === 'in_progress' && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            openTicketInspector(task.id, false);
                                            setActiveTab('dashboard');
                                          }}
                                          className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold whitespace-nowrap"
                                        >
                                          Foto & Detail
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleCompleteReport(task)}
                                          className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold whitespace-nowrap"
                                        >
                                          Selesai
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* MOBILE & TABLET RESPONSIVE CARD GRID (< lg) */}
                  <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-mono tabular-nums font-bold text-[#00355f]">
                                {task.spkNumber || task.id} · Skor {toScore100(task.sawScores.totalSaw)}/100
                              </span>
                              <StatusInline status={task.status} label={task.statusLabel} />
                            </div>

                            <div>
                              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                {task.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Kec. {task.district} · {task.address}
                              </p>
                            </div>

                            {task.assignedTeam && (
                              <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                                <span className="font-semibold text-slate-800 block truncate">
                                  {task.assignedTeam.name}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {task.assignedTeam.leadOfficer} · {task.assignedTeam.vehicle}
                                </span>
                              </div>
                            )}

                            {/* Progress */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between text-xs font-mono tabular-nums">
                                <span className="font-sans text-slate-600 font-medium">
                                  Progres Penanganan
                                </span>
                                <span className="font-bold text-slate-900">{pct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-200 ${
                                    task.status === 'completed' ? 'bg-emerald-600' : 'bg-[#00355f]'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>

                              {task.status === 'in_progress' && (
                                <div className="grid grid-cols-3 gap-1.5 pt-1">
                                  {[25, 50, 75].map(stepPct => (
                                    <button
                                      key={stepPct}
                                      type="button"
                                      onClick={() => handleUpdateProgress(task, stepPct)}
                                      className={`h-8 rounded-lg text-xs font-mono tabular-nums font-semibold border ${
                                        pct === stepPct
                                          ? 'bg-[#00355f] text-white border-[#00355f]'
                                          : 'bg-slate-50 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {stepPct}%
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {task.status !== 'completed' && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                              {task.status === 'submitted' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyReport(task)}
                                  className="h-10 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  <span>Validasi</span>
                                </button>
                              )}

                              {task.status !== 'in_progress' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDispatchSpk(task)}
                                  className={`h-10 px-3 rounded-lg bg-[#00355f] hover:bg-[#004880] text-white text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                    task.status === 'verified' ? 'col-span-2' : 'col-span-1'
                                  }`}
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                  <span>Terbitkan SPK</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openTicketInspector(task.id, true)}
                                    className="h-10 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <ImagePlus className="w-3.5 h-3.5" />
                                    <span>Unggah Foto</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteReport(task)}
                                    className="h-10 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Selesaikan</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* =====================================================================
              TAB 4: AUDIT AKUNTABILITAS PUBLIK & REKAP REAL-TIME
              ===================================================================== */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Executive Print & Summary Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#005187]">
                    Rekapitulasi Akuntabilitas Penanganan · {currentPeriodLabel}
                  </p>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Log Audit & Dokumentasi Penyelesaian Dinas PUPR Kebumen
                  </h2>
                  <p className="text-xs text-slate-500">
                    Wilayah:{' '}
                    {selectedDistrict === 'ALL'
                      ? 'Seluruh Kecamatan Kabupaten Kebumen'
                      : `Kecamatan ${selectedDistrict}`}{' '}
                    · Sumber data tersinkronisasi dari pelaporan warga
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 print:hidden">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="h-10 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="h-10 px-4 rounded-lg bg-[#00355f] hover:bg-[#004880] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>

              {/* Audit Summary Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-1">
                  <span className="text-xs text-slate-500">Rasio Penyelesaian</span>
                  <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
                    {completionPct}%
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {completedCount} dari {filteredReports.length} tiket selesai
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-1">
                  <span className="text-xs text-slate-500">Rata-Rata Skor Prioritas</span>
                  <p className="text-2xl font-bold text-[#00355f] font-mono tabular-nums">
                    {avgPriorityScore}/100
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {criticalCount} laporan kategori kritis
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-1">
                  <span className="text-xs text-slate-500">Jejak Aktivitas</span>
                  <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    {auditLogs.length}
                  </p>
                  <p className="text-xs text-slate-500">Tahapan linimasa terekam</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-1">
                  <span className="text-xs text-slate-500">Cakupan Kecamatan</span>
                  <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    {availableDistricts.length}
                  </p>
                  <p className="text-xs text-slate-500">Kecamatan dengan laporan</p>
                </div>
              </div>

              {/* 2-Column Split: Audit Trail Feed + Completed Before/After Archive */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Chronological Audit Trail */}
                <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Riwayat Jejak Audit Penanganan
                    </h3>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {auditLogs.length} entri
                    </span>
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Belum ada jejak aktivitas tercatat pada database.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {auditLogs.slice(0, 20).map(log => (
                        <div key={log.id} className="p-4 sm:px-5 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="font-mono tabular-nums font-semibold text-[#00355f]">
                              {log.reportId} · Kec. {log.district} · Skor {toScore100(log.saw)}/100
                            </span>
                            <span className="tabular-nums">{log.time}</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {log.stageTitle} — {log.title}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {cleanLegacySawText(log.desc)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Public Before-After Verification Archive */}
                <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Arsip Dokumentasi Selesai
                    </h3>
                    <span className="text-xs font-mono tabular-nums text-emerald-700 font-semibold">
                      {completedCount} tuntas
                    </span>
                  </div>

                  {completedCount === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 leading-relaxed">
                      Tiket yang telah ditandai selesai beserta foto sebelum dan sesudah perbaikan
                      akan tampil di arsip transparansi ini.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {filteredReports
                        .filter(r => r.status === 'completed')
                        .map(doneRep => (
                          <div key={doneRep.id} className="p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono tabular-nums font-bold text-emerald-700">
                                {doneRep.id}
                              </span>
                              <span className="text-slate-500 tabular-nums">
                                {doneRep.completedAt}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{doneRep.title}</h4>
                              <p className="text-xs text-slate-500">
                                Kec. {doneRep.district} · {doneRep.placeName}
                              </p>
                            </div>

                            {(doneRep.photoBefore || doneRep.photoAfter) && (
                              <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <div className="space-y-1">
                                  <span className="text-[11px] text-slate-500 block">Sebelum</span>
                                  <div className="h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                    {doneRep.photoBefore ? (
                                      <img
                                        src={doneRep.photoBefore}
                                        alt={`Sebelum perbaikan ${doneRep.title}`}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[11px] text-slate-400">
                                        Tanpa foto awal
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[11px] text-emerald-700 font-medium block">
                                    Sesudah
                                  </span>
                                  <div className="h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                    {doneRep.photoAfter ? (
                                      <img
                                        src={doneRep.photoAfter}
                                        alt={`Sesudah perbaikan ${doneRep.title}`}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[11px] text-slate-500 px-2 text-center">
                                        Terverifikasi selesai
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MOBILE & TABLET BOTTOM NAVIGATION BAR (< lg, compact 56px height)
          ========================================================================= */}
      <nav
        aria-label="Navigasi Bawah Admin"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-safe print:hidden"
      >
        <div className="grid grid-cols-4 h-14 max-w-2xl mx-auto px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                  isActive ? 'text-[#00355f] font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[11px] leading-none">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
