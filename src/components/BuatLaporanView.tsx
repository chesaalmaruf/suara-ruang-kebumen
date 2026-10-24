import React, { useEffect, useRef, useState } from 'react';
import { FacilityCategory, ReportItem, SeverityLevel } from '../types';
import { compressImageFile, formatCurrentWibTime } from '../utils/imageHelper';
import {
  PlaceSuggestion,
  reverseGeocodePoint,
  searchLocalKebumenPlaces,
  searchPlacesHybrid,
} from '../utils/placeSearch';
import { getOrCreateDeviceId } from '../services/reportService';
import {
  CATEGORY_CRITICAL_SUBTEXT,
  CATEGORY_LABELS,
  CATEGORY_OBSTACLE_OPTIONS,
  calculateRawCriteria,
  computeSawScore,
} from '../utils/sawCalculator';
import { DictationService, speakText } from '../utils/speechHelper';
import { LeafletMapView } from './LeafletMapView';

interface BuatLaporanViewProps {
  onSubmitReport: (newReport: ReportItem) => void;
  onCancel: () => void;
  initialPlaceName?: string;
}

const KEBUMEN_DISTRICTS = [
  'Kebumen',
  'Gombong',
  'Karanganyar',
  'Pejagoan',
  'Klirong',
  'Sruweng',
  'Prembun',
  'Kutowinangun',
  'Petanahan',
  'Ayah',
  'Rowokele',
  'Sempor',
  'Buayan',
  'Adimulyo',
  'Kuwarasan',
  'Alian',
  'Puring',
  'Ambal',
  'Mirit',
  'Lainnya',
];

export const BuatLaporanView: React.FC<BuatLaporanViewProps> = ({
  onSubmitReport,
  initialPlaceName = '',
}) => {
  // Clean initial form state (no pre-filled dummy values)
  const [placeName, setPlaceName] = useState(initialPlaceName);
  const [district, setDistrict] = useState('Kebumen');
  const [address, setAddress] = useState('');
  const [isAddressAutoFilled, setIsAddressAutoFilled] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: -7.66875, lng: 109.6521 });

  // Place search & interactive map states
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>(() =>
    searchLocalKebumenPlaces(initialPlaceName)
  );
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [pinStatus, setPinStatus] = useState<
    'idle' | 'auto_pinned' | 'manual_needed' | 'manual_pinned' | 'gps_pinned'
  >('idle');

  // Fullscreen / expanded map states
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [fullscreenQuery, setFullscreenQuery] = useState('');
  const [fullscreenSuggestions, setFullscreenSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingFullscreen, setIsSearchingFullscreen] = useState(false);
  const [showFullscreenDropdown, setShowFullscreenDropdown] = useState(false);

  const placeSearchBoxRef = useRef<HTMLDivElement>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const reverseGeoAbortRef = useRef<AbortController | null>(null);

  const [category, setCategory] = useState<FacilityCategory>('public_space');
  const [obstacleType, setObstacleType] = useState(
    CATEGORY_OBSTACLE_OPTIONS.public_space[0].label
  );
  const [isCustomObstacle, setIsCustomObstacle] = useState(false);
  const [customObstacleText, setCustomObstacleText] = useState('');
  const customObstacleInputRef = useRef<HTMLInputElement>(null);

  const [severity, setSeverity] = useState<SeverityLevel>('severe');
  const [impactedGroups, setImpactedGroups] = useState<string[]>(['Penyandang disabilitas']);

  const handleCategoryChange = (nextCategory: FacilityCategory) => {
    setCategory(nextCategory);
    const nextOptions = CATEGORY_OBSTACLE_OPTIONS[nextCategory] || [];
    if (nextOptions.length > 0 && !nextOptions.some(opt => opt.label === obstacleType)) {
      setObstacleType(nextOptions[0].label);
    }
  };

  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Close autocomplete dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        placeSearchBoxRef.current &&
        !placeSearchBoxRef.current.contains(e.target as Node)
      ) {
        setShowPlaceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resolve initialPlaceName if navigated from another screen
  useEffect(() => {
    if (!initialPlaceName.trim()) return;
    const localHits = searchLocalKebumenPlaces(initialPlaceName);
    if (localHits.length > 0) {
      const top = localHits[0];
      setCoordinates({ lat: top.lat, lng: top.lng });
      if (top.district && KEBUMEN_DISTRICTS.includes(top.district)) {
        setDistrict(top.district);
      }
      setAddress(top.address);
      setIsAddressAutoFilled(true);
      setPinStatus('auto_pinned');
    }
  }, [initialPlaceName]);

  // Debounced hybrid search for #place-name-input
  useEffect(() => {
    const q = placeName.trim();
    const instantLocal = searchLocalKebumenPlaces(q);
    setPlaceSuggestions(instantLocal);
    setHighlightedIndex(-1);

    if (q.length < 2) {
      setIsSearchingPlaces(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchingPlaces(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlacesHybrid(q, controller.signal);
        setPlaceSuggestions(results);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setPlaceSuggestions(instantLocal);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingPlaces(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [placeName]);

  // Debounced hybrid search inside Fullscreen Map top bar
  useEffect(() => {
    if (!isMapExpanded) return;
    const q = fullscreenQuery.trim();
    const instantLocal = searchLocalKebumenPlaces(q);
    setFullscreenSuggestions(instantLocal);

    if (q.length < 2) {
      setIsSearchingFullscreen(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchingFullscreen(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlacesHybrid(q, controller.signal);
        setFullscreenSuggestions(results);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setFullscreenSuggestions(instantLocal);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingFullscreen(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fullscreenQuery, isMapExpanded]);

  const isGenericAutoPlaceLabel = (val: string) => {
    const trimmed = val.trim();
    return (
      !trimmed ||
      trimmed.startsWith('Koordinat Peta (') ||
      trimmed.startsWith('Koordinat Geser (') ||
      trimmed.startsWith('Lokasi GPS Saya (')
    );
  };

  const handleSelectSuggestion = (item: PlaceSuggestion) => {
    setPlaceName(item.name);
    setFullscreenQuery(item.name);
    setCoordinates({ lat: item.lat, lng: item.lng });
    if (item.district && KEBUMEN_DISTRICTS.includes(item.district)) {
      setDistrict(item.district);
    }
    if (!address.trim() || isAddressAutoFilled) {
      setAddress(item.address);
      setIsAddressAutoFilled(true);
    }
    setPinStatus('auto_pinned');
    setShowPlaceDropdown(false);
    setShowFullscreenDropdown(false);
  };

  const handleActivateManualMapPin = (expandMap = false) => {
    setShowPlaceDropdown(false);
    setPinStatus('manual_needed');
    if (expandMap) {
      setFullscreenQuery(placeName);
      setIsMapExpanded(true);
    } else {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleMapPickCoordinates = async (
    coords: { lat: number; lng: number },
    fallbackLabel: string,
    source?: 'manual' | 'gps'
  ) => {
    setCoordinates(coords);
    setPinStatus(source === 'gps' ? 'gps_pinned' : 'manual_pinned');
    setShowPlaceDropdown(false);
    setShowFullscreenDropdown(false);

    // Keep user's custom place name if they already typed one!
    const shouldFillPlaceName = isGenericAutoPlaceLabel(placeName);
    if (shouldFillPlaceName && !placeName.trim()) {
      setPlaceName(fallbackLabel);
    }

    // Reverse geocode in background to enrich street address & kecamatan
    if (reverseGeoAbortRef.current) {
      reverseGeoAbortRef.current.abort();
    }
    const controller = new AbortController();
    reverseGeoAbortRef.current = controller;

    const rev = await reverseGeocodePoint(coords.lat, coords.lng, controller.signal);
    if (!rev || controller.signal.aborted) return;

    if (shouldFillPlaceName && rev.roadOrPlace) {
      setPlaceName(rev.roadOrPlace);
    }
    if (rev.district && KEBUMEN_DISTRICTS.includes(rev.district)) {
      setDistrict(rev.district);
    }
    if (rev.fullAddress && (!address.trim() || isAddressAutoFilled)) {
      setAddress(rev.fullAddress);
      setIsAddressAutoFilled(true);
    }
  };

  // Dictation state
  const [isDictating, setIsDictating] = useState(false);
  const [dictationService] = useState(() => new DictationService());

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [newTicketId, setNewTicketId] = useState('');

  const effectiveObstacleType = isCustomObstacle
    ? customObstacleText.trim()
    : obstacleType;

  // Dynamic step progress indicator
  const step1Done = placeName.trim().length > 0 && address.trim().length > 0;
  const step2Done = Boolean(category && effectiveObstacleType && severity);
  const step3Done = notes.trim().length > 0 || photoUrl.length > 0;
  const currentStep = !step1Done ? 1 : !step3Done ? 2 : 3;

  const toggleImpactedGroup = (group: string) => {
    if (impactedGroups.includes(group)) {
      if (impactedGroups.length > 1) {
        setImpactedGroups(impactedGroups.filter(g => g !== group));
      }
    } else {
      setImpactedGroups([...impactedGroups, group]);
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImageFile(file, 960, 0.75);
      setPhotoUrl(compressed);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal memproses foto.');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };

  const handleVoiceDictation = () => {
    setFormError(null);
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
      onError: msg => setFormError(msg),
    });
  };

  const handleReadSummary = () => {
    const summaryText = `Rangkuman Laporan Anda. Lokasi: ${
      placeName || 'belum diisi'
    }, Kecamatan ${district}, ${address || 'alamat belum diisi'}. Hambatan: ${
      effectiveObstacleType || 'pengaduan lain belum diisi'
    }. Tingkat keparahan: ${severity}. Catatan: ${notes || 'belum ada catatan'}`;
    speakText(summaryText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPlace = placeName.replace(/^📍\s*/, '').trim();
    const cleanAddress = address.trim();
    const cleanNotes = notes.trim();
    const finalObstacle = isCustomObstacle ? customObstacleText.trim() : obstacleType;

    if (!cleanPlace || !cleanAddress) {
      setFormError('Mohon lengkapi Nama Tempat dan Alamat lokasi hambatan.');
      return;
    }

    if (isCustomObstacle && !finalObstacle) {
      setFormError('Mohon tuliskan jenis hambatan pada kolom Pengaduan lain.');
      customObstacleInputRef.current?.focus();
      return;
    }

    if (!cleanNotes) {
      setFormError('Mohon tuliskan deskripsi singkat mengenai kondisi hambatan.');
      return;
    }

    setIsSubmitting(true);

    const rawCriteria = calculateRawCriteria(
      severity,
      category,
      impactedGroups.length,
      finalObstacle,
      isCustomObstacle
    );
    const totalSaw = computeSawScore(rawCriteria);

    const year = new Date().getFullYear();
    const generatedId = `#KBM-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowFormatted = formatCurrentWibTime();
    setNewTicketId(generatedId);

    const newReport: ReportItem = {
      id: generatedId,
      title: `${finalObstacle} di ${cleanPlace}`,
      placeName: cleanPlace,
      address: cleanAddress,
      district,
      coordinates,
      facilityCategory: category,
      obstacleType: finalObstacle,
      isCustomObstacle,
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
      description: cleanNotes,
      photoBefore: photoUrl,
      status: 'submitted',
      statusLabel: 'Menunggu Verifikasi DPUPR',
      createdAt: nowFormatted,
      reporterDeviceId: getOrCreateDeviceId(),
      localSavedAt: Date.now(),
      sawScores: {
        ...rawCriteria,
        totalSaw,
      },
      timeline: [
        {
          stage: 1,
          title: '1. Laporan Dikirim',
          time: nowFormatted,
          desc: 'Diterima oleh sistem Lapor Akses Kebumen dan masuk ke antrean verifikasi Admin Dinas PUPR.',
          completed: true,
          active: true,
        },
        {
          stage: 2,
          title: '2. Verifikasi Lapangan',
          time: 'Menunggu Pengawas',
          desc: 'Pengawas DPUPR memvalidasi bukti visual, lokasi GPS, dan tingkat urgensi penanganan.',
          completed: false,
        },
        {
          stage: 3,
          title: '3. Sedang Dikerjakan',
          time: 'Menunggu SPK',
          desc: 'Penerbitan SPK & pengerahan Tim Reaksi Cepat (TRC) Dinas PUPR ke lokasi.',
          completed: false,
        },
        {
          stage: 4,
          title: '4. Selesai & Validasi Inklusif',
          time: 'Tahap Akhir',
          desc: 'Publikasi hasil perbaikan fasilitas aksesibilitas ruang publik.',
          completed: false,
        },
      ],
    };

    setIsSubmitting(false);
    setSubmissionSuccess(true);
    onSubmitReport(newReport);
  };

  if (submissionSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh] space-y-4">
        <div className="w-18 h-18 rounded-full bg-[#a3f69c] text-[#002204] flex items-center justify-center shadow-lg">
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
          Laporan telah tersimpan ke database dan langsung masuk ke antrean Admin Dinas PUPR untuk diverifikasi dan ditindaklanjuti berdasarkan tingkat urgensi lapangan.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full pb-28 max-w-md mx-auto">
      {/* Hidden Real File Inputs for Camera & Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFileChange}
        className="hidden"
      />

      {/* Interactive Progress Header Section */}
      <section className="px-4 pt-3 pb-3 bg-[#f2f3ff] shadow-xs border-b border-[#eaedff]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#00355f] text-white text-xs font-extrabold">
              {currentStep}
            </span>
            <span className="text-[15px] font-bold text-[#131b2e]">
              Langkah {currentStep} dari 3
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#006496] bg-white px-2 py-0.5 rounded-md border border-[#eaedff]">
            Formulir Aksesibilitas
          </span>
        </div>

        {/* 3-Segment Visual Progress Bar */}
        <div aria-hidden="true" className="w-full grid grid-cols-3 gap-2 mt-1">
          <div className="h-2 rounded-full bg-[#00355f]"></div>
          <div
            className={`h-2 rounded-full ${
              step1Done && step2Done ? 'bg-[#00355f]' : 'bg-[#dae2fd]'
            }`}
          ></div>
          <div
            className={`h-2 rounded-full ${
              step1Done && step2Done && step3Done ? 'bg-[#00355f]' : 'bg-[#dae2fd]'
            }`}
          ></div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-[#42474f] font-bold mt-1.5 px-0.5">
          <span className="text-[#00355f]">1. Lokasi</span>
          <span className={step1Done ? 'text-[#00355f]' : ''}>2. Hambatan</span>
          <span className={step3Done ? 'text-[#00355f]' : ''}>3. Bukti & Keterangan</span>
        </div>
      </section>

      <div className="px-4 py-4 space-y-5">
        {formError && (
          <div className="p-3 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}

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
              Wajib Diisi
            </span>
          </div>

          {/* Kolom Nama Tempat (Terintegrasi Pencarian Peta & Auto-Pin) */}
          <div ref={placeSearchBoxRef} className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <label
                className="block text-[12px] font-bold text-[#131b2e]"
                htmlFor="place-name-input"
              >
                Nama Tempat / Fasilitas <span className="text-[#ba1a1a]">*</span>
              </label>
              <span className="text-[10px] font-semibold text-[#006496]">
                Ketik untuk cari & tandai otomatis
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#00355f] text-[18px] pointer-events-none">
                search
              </span>
              <input
                id="place-name-input"
                type="text"
                autoComplete="off"
                value={placeName}
                onFocus={() => setShowPlaceDropdown(true)}
                onChange={e => {
                  setPlaceName(e.target.value);
                  setShowPlaceDropdown(true);
                  if (pinStatus === 'auto_pinned') {
                    setPinStatus('idle');
                  }
                }}
                onKeyDown={e => {
                  if (!showPlaceDropdown) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex(prev =>
                      placeSuggestions.length > 0 ? (prev + 1) % placeSuggestions.length : -1
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex(prev =>
                      placeSuggestions.length > 0
                        ? (prev - 1 + placeSuggestions.length) % placeSuggestions.length
                        : -1
                    );
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (highlightedIndex >= 0 && placeSuggestions[highlightedIndex]) {
                      handleSelectSuggestion(placeSuggestions[highlightedIndex]);
                    } else if (placeSuggestions.length > 0) {
                      handleSelectSuggestion(placeSuggestions[0]);
                    } else if (placeName.trim()) {
                      handleActivateManualMapPin(false);
                    }
                  } else if (e.key === 'Escape') {
                    setShowPlaceDropdown(false);
                  }
                }}
                required
                className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] border border-transparent focus:border-[#00355f] transition-all"
                placeholder="Cari nama tempat, jalan, atau fasilitas umum..."
              />

              {isSearchingPlaces ? (
                <div className="absolute right-3 w-4 h-4 rounded-full border-2 border-[#00355f] border-t-transparent animate-spin" />
              ) : (
                placeName && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlaceName('');
                      setPinStatus('idle');
                      setShowPlaceDropdown(true);
                    }}
                    aria-label="Bersihkan nama tempat"
                    className="absolute right-2.5 w-6 h-6 rounded-full hover:bg-[#dae2fd] text-[#42474f] flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )
              )}
            </div>

            {/* Dropdown Hasil Pencarian Tempat */}
            {showPlaceDropdown && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 bg-white rounded-2xl shadow-xl border border-[#c2c7d1]/70 overflow-hidden">
                {placeSuggestions.length > 0 ? (
                  <>
                    <div className="px-3 py-1.5 bg-[#f2f3ff] border-b border-[#eaedff] flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#00355f]">
                        {placeName.trim()
                          ? 'Pilih lokasi untuk langsung ditandai di peta'
                          : 'Rekomendasi Fasilitas Umum Kebumen'}
                      </span>
                      {isSearchingPlaces && (
                        <span className="text-[10px] text-[#006496] font-medium">Mencari...</span>
                      )}
                    </div>
                    <ul className="max-h-56 overflow-y-auto divide-y divide-[#f2f3ff]">
                      {placeSuggestions.map((item, idx) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => handleSelectSuggestion(item)}
                            className={`w-full px-3 py-2.5 text-left flex items-start gap-2.5 transition-colors ${
                              idx === highlightedIndex
                                ? 'bg-[#d2e4ff]/70'
                                : 'hover:bg-[#f2f3ff]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px] text-[#00355f] mt-0.5 shrink-0">
                              location_on
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] font-bold text-[#131b2e] truncate">
                                  {item.name}
                                </span>
                                {item.district && (
                                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#eaedff] text-[#00355f]">
                                    Kec. {item.district}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#42474f] line-clamp-1 mt-0.5">
                                {item.address}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {placeName.trim().length >= 2 && (
                      <div className="px-3 py-2 bg-[#faf8ff] border-t border-[#eaedff] flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[#42474f]">
                          Bukan lokasi yang dimaksud?
                        </span>
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => handleActivateManualMapPin(false)}
                          className="text-[11px] font-bold text-[#00355f] hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                          Tandai Manual di Peta
                        </button>
                      </div>
                    )}
                  </>
                ) : !isSearchingPlaces && placeName.trim().length >= 2 ? (
                  <div className="p-3.5 space-y-2.5 bg-white">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[20px] text-[#006496] mt-0.5 shrink-0">
                        edit_location_alt
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-[12px] font-bold text-[#131b2e]">
                          &ldquo;{placeName.trim()}&rdquo; belum terdaftar di pencarian peta
                        </p>
                        <p className="text-[11px] text-[#42474f] leading-snug">
                          Nama tempat tetap disimpan. Silakan tandai titik lokasinya secara manual pada peta di bawah.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleActivateManualMapPin(false)}
                        className="h-9 px-2.5 rounded-xl bg-[#eaedff] hover:bg-[#d2e4ff] text-[#00355f] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">touch_app</span>
                        <span>Tandai di Peta</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleActivateManualMapPin(true)}
                        className="h-9 px-2.5 rounded-xl bg-[#00355f] hover:bg-[#006496] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">open_in_full</span>
                        <span>Lebarkan & Tandai</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-[11px] text-[#42474f]">
                    Mencari lokasi di wilayah Kebumen...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kolom Kecamatan */}
          <div className="space-y-1">
            <label
              className="block text-[12px] font-bold text-[#131b2e]"
              htmlFor="district-select"
            >
              Kecamatan <span className="text-[#ba1a1a]">*</span>
            </label>
            <select
              id="district-select"
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f]"
            >
              {KEBUMEN_DISTRICTS.map(d => (
                <option key={d} value={d}>
                  Kecamatan {d}
                </option>
              ))}
            </select>
          </div>

          {/* Kolom Alamat */}
          <div className="space-y-1">
            <label
              className="block text-[12px] font-bold text-[#131b2e]"
              htmlFor="address-input"
            >
              Alamat Lengkap / Patokan Lokasi <span className="text-[#ba1a1a]">*</span>
            </label>
            <textarea
              id="address-input"
              rows={2}
              value={address}
              onChange={e => {
                setAddress(e.target.value);
                setIsAddressAutoFilled(false);
              }}
              required
              className="w-full p-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[12px] leading-relaxed focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] border border-transparent focus:border-[#00355f] transition-all resize-none"
              placeholder="Tuliskan nama jalan, patokan gedung, atau detail titik lokasi..."
            />
          </div>

          {/* Titik Lokasi pada Peta Interaktif */}
          <div ref={mapSectionRef} className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[12px] font-bold text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006496] text-[18px]">map</span>
                Titik Koordinat Peta
              </label>

              <button
                type="button"
                onClick={() => {
                  setFullscreenQuery(placeName);
                  setIsMapExpanded(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00355f] hover:bg-[#006496] text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                <span>Lebarkan Peta</span>
              </button>
            </div>

            {pinStatus === 'auto_pinned' && (
              <div className="px-3 py-1.5 rounded-xl bg-[#d8f8d3] text-[#00390a] text-[11px] font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">where_to_vote</span>
                <span>Lokasi otomatis ditandai di peta. Geser pin jika ingin lebih presisi.</span>
              </div>
            )}

            {pinStatus === 'manual_needed' && (
              <div className="px-3 py-1.5 rounded-xl bg-[#d2e4ff] text-[#001c37] text-[11px] font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">touch_app</span>
                <span>
                  Mode Tandai Manual: Ketuk titik lokasi pada peta atau lebarkan peta agar lebih jelas.
                </span>
              </div>
            )}

            {(pinStatus === 'manual_pinned' || pinStatus === 'gps_pinned') && (
              <div className="px-3 py-1.5 rounded-xl bg-[#eaedff] text-[#00355f] text-[11px] font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>
                  {pinStatus === 'gps_pinned'
                    ? 'Titik lokasi dikunci melalui GPS perangkat Anda.'
                    : 'Titik lokasi berhasil ditandai secara manual di peta.'}
                </span>
              </div>
            )}

            <LeafletMapView
              reports={[]}
              heightClass="h-52"
              isPickerMode={true}
              selectedCoordinates={coordinates}
              selectedPlaceLabel={placeName || 'Titik Lokasi'}
              onPickCoordinates={handleMapPickCoordinates}
              allowExpand={true}
              isExpanded={isMapExpanded}
              onToggleExpand={next => {
                if (next) setFullscreenQuery(placeName);
                setIsMapExpanded(next);
              }}
              fullscreenTopBar={
                <div className="p-3 max-w-3xl mx-auto w-full space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMapExpanded(false)}
                      className="h-9 px-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        close_fullscreen
                      </span>
                      <span>Kecilkan</span>
                    </button>
                    <span className="text-[13px] font-extrabold text-[#131b2e] truncate">
                      Pilih & Tandai Titik Lokasi Kejadian
                    </span>
                    <div className="w-8 sm:w-16 shrink-0" />
                  </div>

                  {/* Pencarian Tempat langsung di dalam Peta Lebar */}
                  <div className="relative">
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#00355f] text-[18px] pointer-events-none">
                        search
                      </span>
                      <input
                        type="text"
                        value={fullscreenQuery}
                        onFocus={() => setShowFullscreenDropdown(true)}
                        onChange={e => {
                          setFullscreenQuery(e.target.value);
                          setShowFullscreenDropdown(true);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (fullscreenSuggestions.length > 0) {
                              handleSelectSuggestion(fullscreenSuggestions[0]);
                            } else if (fullscreenQuery.trim()) {
                              setPlaceName(fullscreenQuery.trim());
                              setShowFullscreenDropdown(false);
                            }
                          } else if (e.key === 'Escape') {
                            e.stopPropagation();
                            setShowFullscreenDropdown(false);
                          }
                        }}
                        placeholder="Cari nama tempat / jalan di Kebumen, atau langsung ketuk peta..."
                        className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[13px] font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f]"
                      />
                      {isSearchingFullscreen ? (
                        <div className="absolute right-3 w-4 h-4 rounded-full border-2 border-[#00355f] border-t-transparent animate-spin" />
                      ) : (
                        fullscreenQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setFullscreenQuery('');
                              setShowFullscreenDropdown(true);
                            }}
                            className="absolute right-2.5 w-6 h-6 rounded-full hover:bg-[#dae2fd] text-[#42474f] flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )
                      )}
                    </div>

                    {showFullscreenDropdown && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 bg-white rounded-2xl shadow-xl border border-[#c2c7d1]/70 overflow-hidden">
                        {fullscreenSuggestions.length > 0 ? (
                          <ul className="max-h-52 overflow-y-auto divide-y divide-[#f2f3ff]">
                            {fullscreenSuggestions.map(item => (
                              <li key={`fs-${item.id}`}>
                                <button
                                  type="button"
                                  onMouseDown={e => e.preventDefault()}
                                  onClick={() => handleSelectSuggestion(item)}
                                  className="w-full px-3 py-2.5 text-left hover:bg-[#f2f3ff] flex items-start gap-2.5"
                                >
                                  <span className="material-symbols-outlined text-[18px] text-[#00355f] mt-0.5 shrink-0">
                                    location_on
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[12px] font-bold text-[#131b2e] truncate">
                                        {item.name}
                                      </span>
                                      {item.district && (
                                        <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#eaedff] text-[#00355f]">
                                          Kec. {item.district}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-[#42474f] line-clamp-1">
                                      {item.address}
                                    </p>
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : !isSearchingFullscreen && fullscreenQuery.trim().length >= 2 ? (
                          <div className="p-3 flex items-center justify-between gap-3">
                            <span className="text-[11px] text-[#42474f]">
                              Tidak ditemukan di pencarian. Ketuk langsung titiknya di peta.
                            </span>
                            <button
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setPlaceName(fullscreenQuery.trim());
                                setShowFullscreenDropdown(false);
                              }}
                              className="shrink-0 px-3 py-1.5 rounded-lg bg-[#00355f] text-white text-[11px] font-bold"
                            >
                              Gunakan Nama & Tandai Manual
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              }
              fullscreenBottomBar={
                <div className="p-3 sm:p-4 max-w-3xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#00355f] shrink-0">
                        pin_drop
                      </span>
                      <p className="text-[13px] font-extrabold text-[#131b2e] truncate">
                        {placeName || 'Titik Lokasi Dipilih'}
                      </p>
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-[#eaedff] text-[#00355f]">
                        Kec. {district}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#42474f] line-clamp-1">
                      {address || 'Ketuk titik pada peta atau geser pin 📍 untuk menyesuaikan lokasi'}
                    </p>
                    <p className="text-[10px] font-mono text-[#006496]">
                      Koordinat: {coordinates.lat}, {coordinates.lng}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMapExpanded(false)}
                    className="h-11 px-5 rounded-xl bg-[#00355f] hover:bg-[#006496] text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Gunakan Titik Lokasi Ini</span>
                  </button>
                </div>
              }
            />

            <div className="flex items-center justify-between gap-2 text-[11px] text-[#42474f] font-mono">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#006496]">
                  my_location
                </span>
                {coordinates.lat}, {coordinates.lng}
              </span>
              <span className="text-[10px] font-sans text-[#006496] font-semibold">
                Ketuk peta / geser pin untuk koreksi manual
              </span>
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
              Tingkat Dampak
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
                    onClick={() => handleCategoryChange(opt.id as FacilityCategory)}
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

          {/* Sub-bagian B: Jenis Hambatan (Dinamis Menyesuaikan Pilihan Kategori A) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-[12px] font-bold text-[#131b2e]">
                B. Jenis Hambatan Aksesibilitas <span className="text-[#ba1a1a]">*</span>
              </label>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#f2f3ff] text-[#006496]">
                {CATEGORY_LABELS[category]}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(CATEGORY_OBSTACLE_OPTIONS[category] || CATEGORY_OBSTACLE_OPTIONS.public_space).map(
                opt => {
                  const isSelected = !isCustomObstacle && obstacleType === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setIsCustomObstacle(false);
                        setObstacleType(opt.label);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all text-left ${
                        isSelected
                          ? 'bg-[#00355f] text-white shadow-xs'
                          : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[14px] shrink-0">
                          check
                        </span>
                      )}
                      <span>{opt.label}</span>
                    </button>
                  );
                }
              )}

              {/* Opsi Pengaduan Lain (Input Manual) */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomObstacle(true);
                  setTimeout(() => customObstacleInputRef.current?.focus(), 50);
                }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all text-left ${
                  isCustomObstacle
                    ? 'bg-[#00355f] text-white shadow-xs'
                    : 'bg-[#f2f3ff] text-[#00355f] border border-dashed border-[#00355f]/40 hover:bg-[#eaedff]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] shrink-0">
                  {isCustomObstacle ? 'check' : 'edit_note'}
                </span>
                <span>Pengaduan lain</span>
              </button>
            </div>

            {isCustomObstacle && (
              <div className="pt-1.5 space-y-1">
                <label
                  htmlFor="custom-obstacle-input"
                  className="block text-[11px] font-bold text-[#00355f]"
                >
                  Tuliskan Pengaduan / Jenis Hambatan Lainnya{' '}
                  <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  ref={customObstacleInputRef}
                  id="custom-obstacle-input"
                  type="text"
                  value={customObstacleText}
                  onChange={e => setCustomObstacleText(e.target.value)}
                  required={isCustomObstacle}
                  maxLength={120}
                  placeholder="Ketik jenis hambatan aksesibilitas yang Anda temui..."
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[12px] font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] border border-[#00355f]/25 focus:border-[#00355f] transition-all"
                />
                <p className="text-[10px] text-[#42474f]">
                  Isi secara manual apabila jenis hambatan belum tercantum pada pilihan di atas.
                </p>
              </div>
            )}
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
                  sub: 'Bisa dilalui mandiri dengan sedikit kehati-hatian',
                },
                {
                  id: 'moderate',
                  label: 'Sedang, cukup mengganggu',
                  dotColor: 'bg-[#7fc5fd]',
                  sub: 'Memperlambat mobilitas pejalan kaki, difabel & lansia',
                },
                {
                  id: 'severe',
                  label: 'Berat, sulit dilewati',
                  dotColor: 'bg-[#ffdad6]',
                  sub: 'Membutuhkan bantuan orang lain untuk dapat melintas',
                },
                {
                  id: 'critical',
                  label: 'Sangat berat atau membahayakan keselamatan',
                  dotColor: 'bg-[#ba1a1a]',
                  sub: CATEGORY_CRITICAL_SUBTEXT[category],
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
              Lampiran Asli
            </span>
          </div>

          {/* Foto Bukti Real Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-[#131b2e]">
                Foto Kondisi Hambatan
              </label>
              {photoUrl ? (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="text-[10px] text-[#ba1a1a] bg-[#ffdad6]/50 px-2 py-0.5 rounded-md font-bold hover:bg-[#ffdad6]"
                >
                  Hapus Foto
                </button>
              ) : (
                <span className="text-[10px] text-[#42474f]">JPG / PNG / Kamera</span>
              )}
            </div>

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden h-40 bg-[#eaedff] border border-[#eaedff]">
                <img
                  src={photoUrl}
                  alt="Foto Bukti Hambatan"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white text-[10px]">
                  <span>Foto Bukti Lapangan Terlampir</span>
                  <span className="font-mono">Siap Dikirim</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => galleryInputRef.current?.click()}
                className="rounded-2xl h-32 bg-[#f2f3ff] border-2 border-dashed border-[#006496]/40 hover:bg-[#eaedff] cursor-pointer flex flex-col items-center justify-center p-3 text-center transition-colors"
              >
                <span className="material-symbols-outlined text-[28px] text-[#006496]">
                  {isProcessingPhoto ? 'hourglass_top' : 'add_a_photo'}
                </span>
                <span className="text-[12px] font-bold text-[#00355f] mt-1">
                  {isProcessingPhoto
                    ? 'Memproses foto...'
                    : 'Belum ada foto dilampirkan'}
                </span>
                <span className="text-[10px] text-[#42474f]">
                  Ketuk di sini atau pilih tombol di bawah untuk mengunggah foto asli
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-[#00355f] text-white text-[11px] font-bold active:scale-95 transition-all disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span>Ambil Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-[#eaedff] text-[#00355f] text-[11px] font-bold active:scale-95 transition-all disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]">image</span>
                <span>Pilih Galeri</span>
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
                Deskripsi Kondisi Hambatan <span className="text-[#ba1a1a]">*</span>
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
                required
                className="w-full p-3 pb-12 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-[12px] leading-relaxed focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00355f] border border-transparent focus:border-[#00355f] transition-all resize-none"
                placeholder="Jelaskan kondisi kerusakan, ukuran hambatan, atau dampaknya bagi pejalan kaki / disabilitas..."
              />
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
          <button
            type="button"
            onClick={handleReadSummary}
            aria-label="Bacakan rangkuman isian laporan dengan suara"
            title="Bacakan ringkasan form"
            className="w-12 h-12 rounded-xl bg-[#7fc5fd]/30 text-[#00517b] flex items-center justify-center active:scale-95 transition-transform flex-shrink-0 border border-[#7fc5fd]/50"
          >
            <span className="material-symbols-outlined text-[24px]">volume_up</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isProcessingPhoto}
            className="flex-1 h-12 px-4 rounded-xl bg-[#00355f] hover:bg-[#006496] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                <span>Menyimpan ke Database...</span>
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
          Data langsung dikirim ke Database & Command Center Admin Dinas PUPR Kebumen
        </div>
      </div>
    </form>
  );
};
