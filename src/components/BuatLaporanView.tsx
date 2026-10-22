import React, { useState } from 'react';
import { FacilityCategory, ReportItem, SeverityLevel } from '../types';
import { calculateRawCriteria, computeSawScore } from '../utils/sawCalculator';
import { DictationService, speakText } from '../utils/speechHelper';
import { LeafletMapView } from './LeafletMapView';

interface BuatLaporanViewProps {
  onSubmitReport: (newReport: ReportItem) => void;
  onCancel: () => void;
}

export const BuatLaporanView: React.FC<BuatLaporanViewProps> = ({
  onSubmitReport,
  onCancel,
}) => {
  // Form State
  const [placeName, setPlaceName] = useState('📍 Alun-Alun Kebumen');
  const [address, setAddress] = useState(
    'Jl. Veteran No. 1, Kebumen (Depan Masjid Agung Kebumen)'
  );
  const [coordinates, setCoordinates] = useState({ lat: -7.6748, lng: 109.6575 });
  const [isPickerActive, setIsPickerActive] = useState(false);

  const [category, setCategory] = useState<FacilityCategory>('public_space');
  const [obstacleType, setObstacleType] = useState('Trotoar rusak atau terhalang');
  const [severity, setSeverity] = useState<SeverityLevel>('severe');
  const [impactedGroups, setImpactedGroups] = useState<string[]>([
    'Penyandang disabilitas',
    'Lansia',
  ]);

  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDeW2V-OYmaId2o2Dqzs3AtGMysDjF_l48Ga_1tX6waVVwKdZMknFegrUgHXlM75SPmRXCN6-x76KtdjCvFSp5YeM7zDdXHS-NFVgCzYFqjrT7oGhVogzhKGDSUXA8jdkg4Lmd-pEAY8ZFjHLhFnxhQ8qh39jkM9jJRkqLNM-NTdBVNp6ZFyaSfIA4i0HYQCsX9j6FpUcwtDBnUcKtHPK9T7VidJGVXlVWXxcoSr4ueabQVmSYZHMqO'
  );
  const [notes, setNotes] = useState(
    'Guiding block trotoar pecah dan berlubang sekitar 2 meter, membahayakan pejalan kaki tunanetra yang melintas ke arah selter.'
  );

  // Dictation state
  const [isDictating, setIsDictating] = useState(false);
  const [dictationService] = useState(() => new DictationService());

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [newTicketId, setNewTicketId] = useState('');

  const toggleImpactedGroup = (group: string) => {
    if (impactedGroups.includes(group)) {
      setImpactedGroups(impactedGroups.filter(g => g !== group));
    } else {
      setImpactedGroups([...impactedGroups, group]);
    }
  };

  const handleVoiceDictation = () => {
    if (isDictating) {
      dictationService.stop({
        onResult: () => {},
        onListeningChange: setIsDictating,
      });
      return;
    }

    dictationService.start({
      onResult: transcript => {
        setNotes(prev => (prev ? `${prev} ${transcript}` : transcript));
      },
      onListeningChange: setIsDictating,
    });
  };

  const handleReadSummary = () => {
    const summaryText = `Rangkuman Laporan Anda. Lokasi: ${placeName}, ${address}. Jenis fasilitas: ${
      category === 'public_space' ? 'Ruang Publik' : 'Fasilitas Umum'
    }. Hambatan: ${obstacleType}. Tingkat keparahan: ${severity}. Catatan: ${notes}`;
    speakText(summaryText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Compute SAW Score
    const rawCriteria = calculateRawCriteria(
      severity,
      category,
      impactedGroups.length,
      obstacleType
    );
    const totalSaw = computeSawScore(rawCriteria);

    const generatedId = `#KBM-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewTicketId(generatedId);

    const newReport: ReportItem = {
      id: generatedId,
      title: `${obstacleType} di ${placeName.replace('📍 ', '')}`,
      placeName: placeName.replace('📍 ', ''),
      address,
      district: 'Kebumen',
      coordinates,
      facilityCategory: category,
      obstacleType,
      severity,
      severityLabel:
        severity === 'critical'
          ? 'Sangat berat atau membahayakan'
          : severity === 'severe'
          ? 'Berat, sulit dilewati'
          : severity === 'moderate'
          ? 'Sedang, cukup mengganggu'
          : 'Ringan, masih mudah dilewati',
      impactedGroups,
      description: notes,
      photoBefore: photoUrl,
      status: 'submitted',
      statusLabel: 'Diterima oleh Sistem Lapor Akses Kebumen',
      createdAt: 'Baru Saja • Hari ini',
      sawScores: {
        ...rawCriteria,
        totalSaw,
      },
      timeline: [
        {
          stage: 1,
          title: '1. Laporan Dikirim',
          time: 'Baru saja',
          desc: 'Diterima oleh sistem Lapor Akses Kebumen dari warga via portal publik.',
          completed: true,
          active: true,
        },
        {
          stage: 2,
          title: '2. Verifikasi Lapangan',
          time: 'Menunggu Pengawas',
          desc: 'Pengawas DPUPR & Dishub akan memvalidasi bukti visual dan koordinat GPS.',
          completed: false,
        },
        {
          stage: 3,
          title: '3. Sedang Dikerjakan',
          time: 'Estimasi 24-48 Jam',
          desc: 'Pemberangkatan Tim Reaksi Cepat (TRC) PUPR ke lokasi.',
          completed: false,
        },
        {
          stage: 4,
          title: '4. Selesai & Validasi Inklusif',
          time: 'Tahap Akhir',
          desc: 'Pengujian fisik ramp dan guiding blocks oleh perwakilan komunitas disabilitas.',
          completed: false,
        },
      ],
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionSuccess(true);
      onSubmitReport(newReport);
    }, 1200);
  };

  if (submissionSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh] space-y-4">
        <div className="w-18 h-18 rounded-full bg-[#a3f69c] text-[#002204] flex items-center justify-center shadow-lg animate-bounce">
          <span className="material-symbols-outlined text-[36px]">check_circle</span>
        </div>
        <h2 className="text-xl font-extrabold text-[#131b2e]">
          Laporan Berhasil Terkirim!
        </h2>
        <div className="bg-[#eaedff] px-4 py-2 rounded-xl text-center">
          <span className="text-xs text-[#006496] font-semibold">Nomor Tiket Anda:</span>
          <p className="text-lg font-black text-[#00355f] font-mono tracking-wider">
            {newTicketId}
          </p>
        </div>
        <p className="text-sm text-[#42474f] leading-relaxed">
          Tiket otomatis tersimpan di penyimpanan perangkat browser Anda (Local Storage) tanpa perlu login akun. Skor SAW telah dihitung untuk antrean disposisi PUPR.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full pb-28 max-w-md mx-auto">
      {/* Interactive Progress Header Section */}
      <section className="px-4 pt-3 pb-3 bg-[#f2f3ff] shadow-xs border-b border-[#eaedff]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#00355f] text-white text-xs font-extrabold">
              1
            </span>
            <span className="text-[15px] font-bold text-[#131b2e]">
              Langkah 1 dari 3
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#006496] bg-white px-2 py-0.5 rounded-md border border-[#eaedff]">
            Formulir Aksesibilitas
          </span>
        </div>

        {/* 3-Segment Visual Progress Bar */}
        <div aria-hidden="true" className="w-full grid grid-cols-3 gap-2 mt-1">
          <div className="h-2 rounded-full bg-[#00355f] relative overflow-hidden">
            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
          </div>
          <div className="h-2 rounded-full bg-[#dae2fd]"></div>
          <div className="h-2 rounded-full bg-[#dae2fd]"></div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-[#42474f] font-bold mt-1.5 px-0.5">
          <span className="text-[#00355f]">1. Lokasi</span>
          <span>2. Hambatan</span>
          <span>3. Bukti & Keterangan</span>
        </div>

        <p className="text-[11px] text-[#42474f] mt-1.5">
          Formulir Pelaporan Aksesibilitas Terpadu Kabupaten Kebumen
        </p>
      </section>

      {/* Main Multi-step Form Content */}
      <div className="px-4 py-4 space-y-5">
        {/* ================= BAGIAN 1: LOKASI KEJADIAN ================= */}
        <fieldset className="space-y-3 p-4 rounded-2xl bg-white shadow-xs border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <legend className="text-[15px] font-bold text-[#131b2e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#00355f] text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              Lokasi Kejadian
            </legend>
            <span className="px-2 py-0.5 rounded-md bg-[#cce5ff] text-[#001e31] text-[10px] font-extrabold">
              Fokus Sekarang
            </span>
          </div>

          <p className="text-[11px] text-[#42474f]">
            Tentukan lokasi tempat hambatan ditemukan.
          </p>

          {/* Kolom Nama Tempat */}
          <div className="space-y-1">
            <label
              className="block text-[12px] font-bold text-[#131b2e]"
              htmlFor="place-name-input"
            >
              Nama Tempat / Fasilitas <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#00355f] text-[18px]">
                pin_drop
              </span>
              <input
                id="place-name-input"
                type="text"
                value={placeName}
                onChange={e => setPlaceName(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] border border-transparent focus:border-[#00355f] transition-all"
                placeholder="Contoh: Alun-Alun Kebumen"
              />
            </div>
          </div>

          {/* Kolom Alamat */}
          <div className="space-y-1">
            <label
              className="block text-[12px] font-bold text-[#131b2e]"
              htmlFor="address-input"
            >
              Alamat atau Keterangan Lokasi <span className="text-[#ba1a1a]">*</span>
            </label>
            <textarea
              id="address-input"
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[12px] leading-relaxed focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] border border-transparent focus:border-[#00355f] transition-all resize-none"
              placeholder="Tuliskan nama jalan, patokan gedung, atau detail lokasi..."
            />
          </div>

          {/* Titik Lokasi pada Peta Interaktif */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006496] text-[18px]">map</span>
                Titik Lokasi pada Peta
              </label>
              <span className="px-2 py-0.5 rounded-full bg-[#a3f69c] text-[#002204] text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#005713] animate-ping"></span>
                GPS Terkunci
              </span>
            </div>

            <LeafletMapView
              reports={[]}
              heightClass="h-44"
              isPickerMode={true}
              selectedCoordinates={coordinates}
              onPickCoordinates={(coords, name) => {
                setCoordinates(coords);
                setPlaceName(`📍 ${name}`);
              }}
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[#42474f] font-mono">
                <span className="material-symbols-outlined text-[16px] text-[#006496]">my_location</span>
                <span>{coordinates.lat}, {coordinates.lng}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerActive(!isPickerActive)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                  isPickerActive
                    ? 'bg-[#00355f] text-white shadow-xs'
                    : 'bg-[#eaedff] text-[#00355f] hover:bg-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">touch_app</span>
                <span>{isPickerActive ? 'Selesai Pilih' : 'Pilih Titik di Peta'}</span>
              </button>
            </div>
          </div>
        </fieldset>

        {/* ================= BAGIAN 2: INFORMASI HAMBATAN ================= */}
        <fieldset className="space-y-4 p-4 rounded-2xl bg-white shadow-xs border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <legend className="text-[15px] font-bold text-[#131b2e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d2e4ff] text-[#001c37] flex items-center justify-center text-xs font-bold">
                2
              </span>
              Informasi Hambatan
            </legend>
            <span className="text-[10px] font-bold text-[#00355f] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">checklist</span>
              Parameter SAW
            </span>
          </div>

          {/* Sub-bagian A: Kategori Ruang */}
          <div className="space-y-2">
            <label className="block text-[12px] font-bold text-[#131b2e]">
              A. Kategori Ruang atau Fasilitas <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'public_space', label: 'Ruang publik dan ruang terbuka', icon: 'park' },
                { id: 'public_service', label: 'Fasilitas umum dan pelayanan dasar', icon: 'domain' },
                { id: 'transit', label: 'Transportasi dan konektivitas', icon: 'directions_bus' },
                { id: 'residential', label: 'Kawasan permukiman', icon: 'home' },
              ].map(opt => {
                const isSelected = category === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCategory(opt.id as FacilityCategory)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-[#d2e4ff] text-[#001c37] border border-[#00355f]/20 font-bold'
                        : 'bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[#00355f] text-white' : 'bg-[#dae2fd] text-[#00355f]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {opt.icon}
                        </span>
                      </div>
                      <span className="text-[12px] truncate">{opt.label}</span>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isSelected ? 'text-[#00355f] fill-1' : 'text-[#727780]'
                      }`}
                    >
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-bagian B: Jenis Hambatan */}
          <div className="space-y-2 pt-1">
            <label className="block text-[12px] font-bold text-[#131b2e]">
              B. Jenis Hambatan Aksesibilitas <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Trotoar rusak atau terhalang',
                'Guiding block terputus',
                'Tidak ada ramp curam',
                'Lubang manhole terbuka',
              ].map(item => {
                const isSelected = obstacleType === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setObstacleType(item)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-[#00355f] text-white shadow-xs'
                        : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-bagian C: Tingkat Keparahan */}
          <div className="space-y-2 pt-1">
            <label className="block text-[12px] font-bold text-[#131b2e]">
              C. Tingkat Keparahan <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="space-y-1.5">
              {[
                {
                  id: 'mild',
                  label: 'Ringan, masih mudah dilewati',
                  dotColor: 'bg-[#a3f69c]',
                  sub: 'Bisa dilalui mandiri dengan kehati-hatian',
                },
                {
                  id: 'moderate',
                  label: 'Sedang, cukup mengganggu',
                  dotColor: 'bg-[#7fc5fd]',
                  sub: 'Memperlambat mobilitas pejalan kaki & lansia',
                },
                {
                  id: 'severe',
                  label: 'Berat, sulit dilewati',
                  dotColor: 'bg-[#ffdad6]',
                  sub: 'Membutuhkan bantuan orang lain untuk melintas',
                },
                {
                  id: 'critical',
                  label: 'Sangat berat atau membahayakan keselamatan',
                  dotColor: 'bg-[#ba1a1a]',
                  sub: 'Risiko jatuh ke jalan raya / lubang terbuka',
                },
              ].map(lvl => {
                const isSelected = severity === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSeverity(lvl.id as SeverityLevel)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-[#00355f] text-white shadow-sm'
                        : 'bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${lvl.dotColor}`}></span>
                      <div>
                        <span className="text-[12px] font-bold block">{lvl.label}</span>
                        <span
                          className={`text-[10px] block ${
                            isSelected ? 'text-[#d2e4ff]' : 'text-[#42474f]'
                          }`}
                        >
                          {lvl.sub}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[20px] flex-shrink-0 ${
                        isSelected ? 'text-[#7fc5fd] fill-1' : 'text-[#727780]'
                      }`}
                    >
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-bagian D: Kelompok yang Terdampak */}
          <div className="space-y-2 pt-1">
            <label className="block text-[12px] font-bold text-[#131b2e]">
              D. Kelompok yang Terdampak{' '}
              <span className="text-[#42474f] font-normal">(bisa pilih lebih dari satu)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Penyandang disabilitas',
                'Lansia',
                'Anak-anak',
                'Masyarakat umum',
                'Kelompok rentan lainnya',
              ].map(grp => {
                const isChecked = impactedGroups.includes(grp);
                return (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => toggleImpactedGroup(grp)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      isChecked
                        ? 'bg-[#00355f] text-white shadow-xs'
                        : 'bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isChecked ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <span>{grp}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        {/* ================= BAGIAN 3: BUKTI DAN KETERANGAN ================= */}
        <fieldset className="space-y-3 p-4 rounded-2xl bg-white shadow-xs border border-[#eaedff]">
          <div className="flex items-center justify-between">
            <legend className="text-[15px] font-bold text-[#131b2e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d2e4ff] text-[#001c37] flex items-center justify-center text-xs font-bold">
                3
              </span>
              Bukti dan Keterangan
            </legend>
            <span className="text-[10px] font-bold text-[#42474f] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">attach_file</span>
              Lampiran
            </span>
          </div>

          {/* Foto Preview & Upload Simulation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-[#131b2e]">
                Foto Kondisi Hambatan
              </label>
              <span className="text-[10px] text-[#005713] bg-[#a3f69c]/30 px-2 py-0.5 rounded-md font-semibold">
                Foto Terlampir
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden h-36 bg-[#eaedff] border border-[#eaedff]">
              <img
                src={photoUrl}
                alt="Foto Bukti Hambatan"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white text-[10px]">
                <span>Pratinjau Foto Bukti Lapangan</span>
                <span className="font-mono">JPEG • GPS Tagged</span>
              </div>
            </div>

            {/* Camera / Preset Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  setPhotoUrl(
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDeW2V-OYmaId2o2Dqzs3AtGMysDjF_l48Ga_1tX6waVVwKdZMknFegrUgHXlM75SPmRXCN6-x76KtdjCvFSp5YeM7zDdXHS-NFVgCzYFqjrT7oGhVogzhKGDSUXA8jdkg4Lmd-pEAY8ZFjHLhFnxhQ8qh39jkM9jJRkqLNM-NTdBVNp6ZFyaSfIA4i0HYQCsX9j6FpUcwtDBnUcKtHPK9T7VidJGVXlVWXxcoSr4ueabQVmSYZHMqO'
                  )
                }
                className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-[#00355f] text-white text-[11px] font-bold active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span>Ambil Kamera</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setPhotoUrl(
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuD1Q3FRuW7Tg0DI06kWvMJ1quckUoxg3R4k5k0kGTr4qYevnGA3RtPr5joGVFSkXoHY5LFNuN-Yr6LrqSsBuVwm9ohWi8WT5X6561fXwNRc9BZWjDP3iABe_FZiR6iKH7MmV_e8xi6A0RFQ26Qk3XDuH1CekXhj1HD1LKlMr6IA0A7w1TFLE5HQu89w-AvspmfMxNhukxKfQAbvxxubobp85FFJrIoSx2PTEGzUqFbK9-FfX_Nf3UJa'
                  )
                }
                className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-[#eaedff] text-[#00355f] text-[11px] font-bold active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">image</span>
                <span>Ganti Galeri</span>
              </button>
            </div>
          </div>

          {/* Deskripsi Singkat */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="notes-area"
                className="text-[12px] font-bold text-[#131b2e]"
              >
                Deskripsi Singkat
              </label>
              <span className="text-[10px] text-[#006496] font-semibold">
                Bisa gunakan suara
              </span>
            </div>
            <div className="relative">
              <textarea
                id="notes-area"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-3 pb-12 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[12px] leading-relaxed focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] border border-transparent focus:border-[#00355f] transition-all resize-none"
                placeholder="Jelaskan secara singkat kendala fisik yang dialami, dimensi kerusakan, atau patokan rute pejalan kaki..."
              />
              {/* Tombol Dikte Suara */}
              <button
                type="button"
                onClick={handleVoiceDictation}
                aria-label="Rekam deskripsi dengan suara"
                className={`absolute bottom-2.5 right-2.5 h-8 px-2.5 rounded-lg flex items-center gap-1 text-[11px] font-bold shadow-xs transition-colors ${
                  isDictating
                    ? 'bg-[#ba1a1a] text-white animate-pulse'
                    : 'bg-[#d2e4ff] text-[#001c37] hover:bg-[#cce5ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isDictating ? 'graphic_eq' : 'mic'}
                </span>
                <span>{isDictating ? 'Mendengarkan...' : 'Dikte Suara'}</span>
              </button>
            </div>
          </div>
        </fieldset>
      </div>

      {/* Persistent Bottom Sticky Call-to-Action Bar */}
      <div className="sticky bottom-0 inset-x-0 p-3 bg-[#faf8ff]/95 backdrop-blur-lg shadow-xl border-t border-[#eaedff] z-40">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {/* Quick Voice Assistance Shortcut */}
          <button
            type="button"
            onClick={handleReadSummary}
            aria-label="Bacakan rangkuman isian laporan dengan suara"
            title="Bacakan ringkasan form"
            className="w-12 h-12 rounded-xl bg-[#7fc5fd]/30 text-[#00517b] flex items-center justify-center active:scale-95 transition-transform flex-shrink-0 border border-[#7fc5fd]/50"
          >
            <span className="material-symbols-outlined text-[24px]">volume_up</span>
          </button>

          {/* Big Tactile Primary Submission Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 px-4 rounded-xl bg-[#00355f] hover:bg-[#006496] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                <span>Menghitung Skor SAW...</span>
              </>
            ) : (
              <>
                <span>Kirim Laporan Sekarang</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center text-[10px] text-[#42474f] mt-1.5 font-medium">
          Data langsung terhubung ke Sistem Manajemen Pengaduan Aksesibilitas Pemkab Kebumen
        </div>
      </div>
    </form>
  );
};
