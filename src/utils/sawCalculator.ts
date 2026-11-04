import { ReportItem, SawCriteria, SeverityLevel, FacilityCategory } from '../types';

export const SAW_WEIGHTS = {
  C1_SAFETY: 0.35,
  C2_ACCESS: 0.30,
  C3_USERS: 0.25,
  C4_PHYSICAL: 0.10,
};

export type ObstacleScope = 'umum' | 'inklusif';

export interface ObstacleOptionConfig {
  label: string;
  scope: ObstacleScope; // 'umum' = gangguan publik/lalu lintas/infrastruktur umum, 'inklusif' = aksesibilitas difabel & rentan
  c2BaseAccess: number; // Dampak hambatan terhadap mobilitas & aksesibilitas pengguna (0..1)
  c1SafetyBoost: number; // Penyesuaian bahaya keselamatan langsung / risiko kecelakaan (-0.03..+0.08)
  c4PhysicalScale: number; // Pengali tingkat kerusakan fisik/teknis permanen vs penghalang non-struktural
  defaultGroups?: string[]; // Rekomendasi kelompok terdampak saat opsi dipilih
}

export const CATEGORY_LABELS: Record<FacilityCategory, string> = {
  transit: 'Jalan Raya, Lalu Lintas & Transportasi',
  public_space: 'Ruang Publik, Taman & Jalur Pejalan Kaki',
  public_service: 'Gedung Layanan & Fasilitas Umum',
  residential: 'Jalan Lingkungan & Kawasan Permukiman',
  other: 'Infrastruktur & Fasilitas Lainnya',
};

export const CATEGORY_OBSTACLE_OPTIONS: Record<FacilityCategory, ObstacleOptionConfig[]> = {
  transit: [
    // --- Gangguan Lalu Lintas, Jalan Raya & Masyarakat Umum ---
    {
      label: 'Lampu lalu lintas (APILL / traffic light) mati, berkedip error, atau tidak sinkron',
      scope: 'umum',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.08,
      c4PhysicalScale: 1.04,
      defaultGroups: ['Pengendara / pengguna jalan', 'Pejalan kaki', 'Masyarakat umum'],
    },
    {
      label: 'Rambu lalu lintas rusak, roboh, hilang, atau tertutup pohon',
      scope: 'umum',
      c2BaseAccess: 0.82,
      c1SafetyBoost: 0.06,
      c4PhysicalScale: 0.96,
      defaultGroups: ['Pengendara / pengguna jalan', 'Masyarakat umum'],
    },
    {
      label: 'Lampu penerangan jalan umum (PJU) mati / ruas jalan gelap gulita',
      scope: 'umum',
      c2BaseAccess: 0.84,
      c1SafetyBoost: 0.06,
      c4PhysicalScale: 0.98,
      defaultGroups: ['Pengendara / pengguna jalan', 'Pejalan kaki', 'Masyarakat umum'],
    },
    {
      label: 'Jalan raya berlubang dalam, bergelombang parah, atau aspal amblas',
      scope: 'umum',
      c2BaseAccess: 0.89,
      c1SafetyBoost: 0.08,
      c4PhysicalScale: 1.08,
      defaultGroups: ['Pengendara / pengguna jalan', 'Masyarakat umum'],
    },
    {
      label: 'Pohon tumbang / dahan rawan patah atau tiang/kabel melintang di jalan',
      scope: 'umum',
      c2BaseAccess: 0.90,
      c1SafetyBoost: 0.08,
      c4PhysicalScale: 1.05,
      defaultGroups: ['Pengendara / pengguna jalan', 'Pejalan kaki', 'Masyarakat umum'],
    },
    {
      label: 'Pagar pengaman jalan (guardrail), pembatas jembatan, atau cermin tikungan rusak',
      scope: 'umum',
      c2BaseAccess: 0.83,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 1.04,
      defaultGroups: ['Pengendara / pengguna jalan', 'Masyarakat umum'],
    },
    {
      label: 'Marka jalan, garis lajur, atau cat zebra cross pudar tidak terlihat',
      scope: 'umum',
      c2BaseAccess: 0.78,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 0.92,
      defaultGroups: ['Pengendara / pengguna jalan', 'Pejalan kaki'],
    },
    {
      label: 'Genangan banjir di badan jalan akibat drainase tepi jalan tersumbat',
      scope: 'umum',
      c2BaseAccess: 0.86,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 1.02,
      defaultGroups: ['Pengendara / pengguna jalan', 'Masyarakat umum'],
    },
    {
      label: 'Bahu jalan / titik turun-naik penumpang terhalang parkir liar atau material',
      scope: 'umum',
      c2BaseAccess: 0.82,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 0.85,
      defaultGroups: ['Pengendara / pengguna jalan', 'Pejalan kaki', 'Masyarakat umum'],
    },
    // --- Aksesibilitas Inklusif / Ramah Difabel & Lansia ---
    {
      label: 'Penyeberangan jalan (zebra cross) tanpa ramp trotoar atau sinyal suara',
      scope: 'inklusif',
      c2BaseAccess: 0.93,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 0.96,
      defaultGroups: ['Penyandang disabilitas', 'Lansia', 'Pejalan kaki'],
    },
    {
      label: 'Halte / peron terlalu tinggi tanpa ramp naik-turun kursi roda',
      scope: 'inklusif',
      c2BaseAccess: 0.95,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 0.98,
      defaultGroups: ['Penyandang disabilitas', 'Lansia'],
    },
    {
      label: 'Jalur pemandu (guiding block) menuju halte / stasiun / terminal terputus',
      scope: 'inklusif',
      c2BaseAccess: 0.91,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Penyandang disabilitas', 'Pejalan kaki'],
    },
    {
      label: 'Jembatan penyeberangan / akses stasiun terlalu curam bagi difabel & lansia',
      scope: 'inklusif',
      c2BaseAccess: 0.92,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 0.96,
      defaultGroups: ['Penyandang disabilitas', 'Lansia'],
    },
  ],

  public_space: [
    // --- Gangguan Ruang Publik & Jalur Pejalan Kaki Umum ---
    {
      label: 'Trotoar rusak, berlubang, atau amblas',
      scope: 'umum',
      c2BaseAccess: 0.86,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 1.05,
      defaultGroups: ['Pejalan kaki', 'Masyarakat umum', 'Penyandang disabilitas'],
    },
    {
      label: 'Lubang drainase / penutup selokan terbuka di jalur pejalan kaki',
      scope: 'umum',
      c2BaseAccess: 0.90,
      c1SafetyBoost: 0.08,
      c4PhysicalScale: 1.06,
      defaultGroups: ['Pejalan kaki', 'Anak-anak', 'Penyandang disabilitas', 'Masyarakat umum'],
    },
    {
      label: 'Lampu taman, alun-alun, atau penerangan trotoar mati pada malam hari',
      scope: 'umum',
      c2BaseAccess: 0.81,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 0.95,
      defaultGroups: ['Pejalan kaki', 'Masyarakat umum'],
    },
    {
      label: 'Pohon miring / dahan kering lapuk rawan tumbang di ruang publik',
      scope: 'umum',
      c2BaseAccess: 0.82,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Masyarakat umum', 'Pejalan kaki'],
    },
    {
      label: 'Saluran drainase ruang publik mampet, meluap, atau menimbulkan genangan',
      scope: 'umum',
      c2BaseAccess: 0.83,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Masyarakat umum', 'Pejalan kaki'],
    },
    {
      label: 'Fasilitas taman rusak (bangku umum, alat bermain anak, pagar pengaman, tempat sampah)',
      scope: 'umum',
      c2BaseAccess: 0.76,
      c1SafetyBoost: 0.02,
      c4PhysicalScale: 0.98,
      defaultGroups: ['Masyarakat umum', 'Anak-anak'],
    },
    {
      label: 'Papan rambu informasi kawasan / petunjuk arah ruang publik rusak atau hilang',
      scope: 'umum',
      c2BaseAccess: 0.74,
      c1SafetyBoost: 0.01,
      c4PhysicalScale: 0.90,
      defaultGroups: ['Masyarakat umum'],
    },
    {
      label: 'Jalur ruang terbuka terhalang bollard sempit, tiang, atau PKL/parkir',
      scope: 'umum',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.02,
      c4PhysicalScale: 0.85,
      defaultGroups: ['Pejalan kaki', 'Penyandang disabilitas', 'Masyarakat umum'],
    },
    // --- Aksesibilitas Inklusif / Ramah Difabel & Lansia ---
    {
      label: 'Guiding block (pemandu tunanetra) terputus / mengelupas',
      scope: 'inklusif',
      c2BaseAccess: 0.92,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Penyandang disabilitas', 'Pejalan kaki'],
    },
    {
      label: 'Ramp trotoar tidak ada atau terlalu curam',
      scope: 'inklusif',
      c2BaseAccess: 0.94,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Penyandang disabilitas', 'Lansia'],
    },
    {
      label: 'Akses taman / alun-alun berundak tanpa jalur kursi roda',
      scope: 'inklusif',
      c2BaseAccess: 0.91,
      c1SafetyBoost: 0.02,
      c4PhysicalScale: 0.95,
      defaultGroups: ['Penyandang disabilitas', 'Lansia'],
    },
  ],

  public_service: [
    // --- Gangguan Fasilitas Umum & Gedung Pelayanan Masyarakat ---
    {
      label: 'Atap bocor parah, plafon ambrol, atau dinding/struktur gedung retak membahayakan',
      scope: 'umum',
      c2BaseAccess: 0.86,
      c1SafetyBoost: 0.08,
      c4PhysicalScale: 1.08,
      defaultGroups: ['Masyarakat umum', 'Anak-anak', 'Lansia'],
    },
    {
      label: 'Instalasi listrik membahayakan, lampu pelayanan mati, atau air bersih terhenti',
      scope: 'umum',
      c2BaseAccess: 0.84,
      c1SafetyBoost: 0.06,
      c4PhysicalScale: 1.02,
      defaultGroups: ['Masyarakat umum'],
    },
    {
      label: 'Toilet umum / sanitasi fasilitas publik rusak, mampet, atau tidak layak pakai',
      scope: 'umum',
      c2BaseAccess: 0.82,
      c1SafetyBoost: 0.01,
      c4PhysicalScale: 0.96,
      defaultGroups: ['Masyarakat umum', 'Lansia', 'Anak-anak'],
    },
    {
      label: 'Drainase kawasan pasar / sekolah / puskesmas tersumbat dan becek parah',
      scope: 'umum',
      c2BaseAccess: 0.83,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Masyarakat umum', 'Pejalan kaki'],
    },
    {
      label: 'Jalur evakuasi darurat, APAR, atau rambu keselamatan gedung tidak ada / rusak',
      scope: 'umum',
      c2BaseAccess: 0.84,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 0.95,
      defaultGroups: ['Masyarakat umum', 'Penyandang disabilitas'],
    },
    {
      label: 'Halaman atau akses masuk pasar, sekolah, atau kantor layanan rusak berlubang',
      scope: 'umum',
      c2BaseAccess: 0.85,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 1.03,
      defaultGroups: ['Masyarakat umum', 'Pengendara / pengguna jalan'],
    },
    {
      label: 'Lantai selasar licin, berundak tajam, atau membahayakan pengunjung',
      scope: 'umum',
      c2BaseAccess: 0.87,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Masyarakat umum', 'Lansia', 'Penyandang disabilitas'],
    },
    // --- Aksesibilitas Inklusif / Ramah Difabel & Lansia ---
    {
      label: 'Pintu masuk gedung tanpa ramp kursi roda / hanya tangga tinggi',
      scope: 'inklusif',
      c2BaseAccess: 0.95,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 0.95,
      defaultGroups: ['Penyandang disabilitas', 'Lansia'],
    },
    {
      label: 'Toilet khusus disabilitas tidak tersedia, terkunci, atau rusak',
      scope: 'inklusif',
      c2BaseAccess: 0.93,
      c1SafetyBoost: 0.0,
      c4PhysicalScale: 0.95,
      defaultGroups: ['Penyandang disabilitas', 'Lansia'],
    },
    {
      label: 'Tangga / selasar gedung tanpa pegangan rambat (handrail) pengaman',
      scope: 'inklusif',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 0.98,
      defaultGroups: ['Lansia', 'Penyandang disabilitas'],
    },
    {
      label: 'Loket pelayanan / koridor gedung terlalu sempit atau tinggi bagi kursi roda',
      scope: 'inklusif',
      c2BaseAccess: 0.90,
      c1SafetyBoost: -0.02,
      c4PhysicalScale: 0.9,
      defaultGroups: ['Penyandang disabilitas'],
    },
    {
      label: 'Area parkir khusus disabilitas tidak ada atau terhalang kendaraan lain',
      scope: 'inklusif',
      c2BaseAccess: 0.84,
      c1SafetyBoost: -0.02,
      c4PhysicalScale: 0.82,
      defaultGroups: ['Penyandang disabilitas'],
    },
  ],

  residential: [
    // --- Gangguan Jalan Lingkungan & Infrastruktur Permukiman Warga ---
    {
      label: 'Jalan lingkungan / gang permukiman berlubang parah atau amblas',
      scope: 'umum',
      c2BaseAccess: 0.85,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 1.06,
      defaultGroups: ['Masyarakat umum', 'Pengendara / pengguna jalan'],
    },
    {
      label: 'Jembatan kecil lingkungan / gorong-gorong desa retak, miring, atau ambrol',
      scope: 'umum',
      c2BaseAccess: 0.91,
      c1SafetyBoost: 0.08,
      c4PhysicalScale: 1.08,
      defaultGroups: ['Masyarakat umum', 'Pengendara / pengguna jalan', 'Pejalan kaki'],
    },
    {
      label: 'Talud / tebing penahan tanah jalan warga retak atau longsor',
      scope: 'umum',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.08,
      c4PhysicalScale: 1.08,
      defaultGroups: ['Masyarakat umum', 'Pengendara / pengguna jalan'],
    },
    {
      label: 'Lampu penerangan jalan lingkungan (PJL) mati / kawasan gang gelap rawan',
      scope: 'umum',
      c2BaseAccess: 0.80,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 0.95,
      defaultGroups: ['Masyarakat umum', 'Pejalan kaki'],
    },
    {
      label: 'Saluran air / gorong-gorong permukiman terbuka tanpa penutup aman',
      scope: 'umum',
      c2BaseAccess: 0.85,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 1.05,
      defaultGroups: ['Masyarakat umum', 'Anak-anak', 'Pejalan kaki'],
    },
    {
      label: 'Tiang listrik / telepon miring atau kabel menjuntai rendah di jalan warga',
      scope: 'umum',
      c2BaseAccess: 0.84,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 1.02,
      defaultGroups: ['Masyarakat umum', 'Pengendara / pengguna jalan'],
    },
    {
      label: 'Cermin tikungan (convex mirror), rambu gang, atau pembatas tepi sungai/jurang rusak',
      scope: 'umum',
      c2BaseAccess: 0.81,
      c1SafetyBoost: 0.06,
      c4PhysicalScale: 0.96,
      defaultGroups: ['Pengendara / pengguna jalan', 'Masyarakat umum'],
    },
    {
      label: 'Permukaan paving / beton jalan warga pecah & bergelombang',
      scope: 'umum',
      c2BaseAccess: 0.82,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.04,
      defaultGroups: ['Masyarakat umum', 'Pengendara / pengguna jalan'],
    },
    // --- Aksesibilitas Inklusif / Ramah Difabel & Lansia ---
    {
      label: 'Tanjakan jalan gang terlalu curam atau licin tanpa pengaman tepi',
      scope: 'inklusif',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.06,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Lansia', 'Penyandang disabilitas', 'Masyarakat umum'],
    },
    {
      label: 'Akses kursi roda, lansia & kendaraan darurat di gang terhalang portal sempit / material',
      scope: 'inklusif',
      c2BaseAccess: 0.91,
      c1SafetyBoost: 0.02,
      c4PhysicalScale: 0.85,
      defaultGroups: ['Penyandang disabilitas', 'Lansia', 'Masyarakat umum'],
    },
  ],

  other: [
    // --- Gangguan Infrastruktur & Fasilitas Publik Lainnya ---
    {
      label: 'Kerusakan tanggul sungai, pintu air irigasi, atau jembatan penyeberangan warga',
      scope: 'umum',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.08,
      c4PhysicalScale: 1.08,
      defaultGroups: ['Masyarakat umum'],
    },
    {
      label: 'Rambu peringatan bahaya / papan keselamatan kawasan publik hilang atau rusak',
      scope: 'umum',
      c2BaseAccess: 0.82,
      c1SafetyBoost: 0.06,
      c4PhysicalScale: 0.96,
      defaultGroups: ['Masyarakat umum', 'Pengendara / pengguna jalan'],
    },
    {
      label: 'Lampu penerangan fasilitas olahraga, wisata, atau ruang publik lainnya mati',
      scope: 'umum',
      c2BaseAccess: 0.80,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 0.95,
      defaultGroups: ['Masyarakat umum'],
    },
    {
      label: 'Lubang drainase / gorong-gorong terbuka membahayakan',
      scope: 'umum',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 1.06,
      defaultGroups: ['Masyarakat umum', 'Pejalan kaki'],
    },
    {
      label: 'Tumpukan material liar / longsoran menutup akses fasilitas umum',
      scope: 'umum',
      c2BaseAccess: 0.85,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 0.92,
      defaultGroups: ['Masyarakat umum', 'Pengendara / pengguna jalan'],
    },
    // --- Aksesibilitas Inklusif ---
    {
      label: 'Tidak ada ramp kursi roda atau kemiringan terlalu curam',
      scope: 'inklusif',
      c2BaseAccess: 0.94,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Penyandang disabilitas', 'Lansia'],
    },
    {
      label: 'Guiding block (pemandu tunanetra) tidak tersedia atau rusak',
      scope: 'inklusif',
      c2BaseAccess: 0.92,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
      defaultGroups: ['Penyandang disabilitas'],
    },
  ],
};

// Kompatibilitas mundur untuk label laporan lama yang sudah tersimpan di database
const LEGACY_OBSTACLE_ALIASES: ObstacleOptionConfig[] = [
  {
    label: 'Lantai selasar licin, berundak tajam, atau tanpa penanda tunanetra',
    scope: 'inklusif',
    c2BaseAccess: 0.89,
    c1SafetyBoost: 0.05,
    c4PhysicalScale: 1.0,
  },
  {
    label: 'Titik turun-naik penumpang terhalang parkir liar atau hambatan fisik',
    scope: 'umum',
    c2BaseAccess: 0.86,
    c1SafetyBoost: 0.04,
    c4PhysicalScale: 0.85,
  },
  {
    label: 'Minim penerangan & rambu informasi rute tidak ramah tunanetra/low-vision',
    scope: 'inklusif',
    c2BaseAccess: 0.88,
    c1SafetyBoost: 0.05,
    c4PhysicalScale: 0.92,
  },
  {
    label: 'Akses kursi roda & lansia di gang terhalang portal sempit / material',
    scope: 'inklusif',
    c2BaseAccess: 0.91,
    c1SafetyBoost: 0.01,
    c4PhysicalScale: 0.85,
  },
  {
    label: 'Jalur warga minim penerangan & tanpa pembatas pada tepi rawan jatuh',
    scope: 'umum',
    c2BaseAccess: 0.80,
    c1SafetyBoost: 0.06,
    c4PhysicalScale: 0.94,
  },
];

export const CATEGORY_CRITICAL_SUBTEXT: Record<FacilityCategory, string> = {
  transit: 'Risiko kecelakaan lalu lintas di persimpangan / jalan raya tidak aman dilalui',
  public_space: 'Risiko jatuh atau terperosok di trotoar / membahayakan pengunjung ruang publik',
  public_service: 'Membahayakan pengunjung gedung / akses layanan tertutup bagi warga & difabel',
  residential: 'Akses jalan/jembatan warga terputus atau membahayakan keselamatan penghuni',
  other: 'Risiko kecelakaan langsung / fasilitas publik tidak berfungsi sama sekali',
};

export const CUSTOM_OBSTACLE_LABEL = 'Pengaduan lain';

/**
 * Parameter seragam untuk opsi "Pengaduan lain" (input manual).
 * Apapun teks yang diketik pengguna pada kolom manual, nilai parameter
 * hambatannya dijamin 100% sama tanpa dipengaruhi kata kunci kalimat.
 */
export const CUSTOM_OBSTACLE_CONFIG: ObstacleOptionConfig = {
  label: CUSTOM_OBSTACLE_LABEL,
  scope: 'umum',
  c2BaseAccess: 0.86,
  c1SafetyBoost: 0.03,
  c4PhysicalScale: 1.0,
};

/**
 * Nilai acuan maksimum domain kriteria (Benefit) agar normalisasi SAW tetap stabil
 * dan proporsional meskipun jumlah laporan aktif sedikit (misal baru ada 1 laporan ringan,
 * skor tidak terinflasi palsu menjadi 100/100).
 */
export const SAW_REFERENCE_MAX = {
  c1: 0.98,
  c2: 0.98,
  c3: 0.98,
  c4: 0.98,
};

const VULNERABLE_GROUP_NAMES = new Set([
  'penyandang disabilitas',
  'lansia',
  'anak-anak',
  'kelompok rentan lainnya',
]);

export function findObstacleConfig(
  facilityCategory: FacilityCategory,
  obstacleType: string
): ObstacleOptionConfig | undefined {
  const normalized = obstacleType.trim().toLowerCase();
  const categoryList = CATEGORY_OBSTACLE_OPTIONS[facilityCategory] || [];
  const exactInCat = categoryList.find(o => o.label.toLowerCase() === normalized);
  if (exactInCat) return exactInCat;

  for (const list of Object.values(CATEGORY_OBSTACLE_OPTIONS)) {
    const found = list.find(o => o.label.toLowerCase() === normalized);
    if (found) return found;
  }

  return LEGACY_OBSTACLE_ALIASES.find(o => o.label.toLowerCase() === normalized);
}

function clampScore(val: number, min = 0.2, max = 0.98): number {
  return Number(Math.max(min, Math.min(max, val)).toFixed(3));
}

/**
 * Memetakan input formulir warga (Kategori A, Jenis Gangguan/Hambatan B, Keparahan C, Kelompok Terdampak D)
 * ke nilai mentah 4 kriteria SAW (skala 0..1) dengan bobot C1=35%, C2=30%, C3=25%, C4=10%.
 * Input manual ("Pengaduan lain") selalu memakai CUSTOM_OBSTACLE_CONFIG secara seragam.
 */
export function calculateRawCriteria(
  severity: SeverityLevel,
  facilityCategory: FacilityCategory,
  impactedGroupsCount: number,
  obstacleType: string,
  isCustomObstacle = false,
  impactedGroups?: string[]
): Omit<SawCriteria, 'totalSaw'> {
  const activeObstacleConfig = isCustomObstacle
    ? CUSTOM_OBSTACLE_CONFIG
    : findObstacleConfig(facilityCategory, obstacleType) ?? CUSTOM_OBSTACLE_CONFIG;

  // Jangkar dasar tingkat keparahan (mild / moderate / severe / critical)
  const severitySafetyBase =
    severity === 'critical'
      ? 0.90
      : severity === 'severe'
      ? 0.80
      : severity === 'moderate'
      ? 0.60
      : 0.36;

  const severityAccessDelta =
    severity === 'critical'
      ? 0.04
      : severity === 'severe'
      ? 0.01
      : severity === 'moderate'
      ? -0.06
      : -0.14;

  const severityPhysicalBase =
    severity === 'critical'
      ? 0.90
      : severity === 'severe'
      ? 0.80
      : severity === 'moderate'
      ? 0.60
      : 0.36;

  // C1: Tingkat bahaya terhadap keselamatan publik & pengguna jalan (35%)
  const c1Safety = clampScore(
    severitySafetyBase + activeObstacleConfig.c1SafetyBoost,
    0.30,
    0.98
  );

  // C2: Dampak hambatan terhadap mobilitas warga & aksesibilitas inklusif (30%)
  const vulnerableSelectedCount = Array.isArray(impactedGroups)
    ? impactedGroups.filter(g => VULNERABLE_GROUP_NAMES.has(g.trim().toLowerCase())).length
    : 0;
  const vulnerabilityBonus = Math.min(0.03, vulnerableSelectedCount * 0.012);

  const c2Access = clampScore(
    activeObstacleConfig.c2BaseAccess + severityAccessDelta + vulnerabilityBonus,
    0.45,
    0.98
  );

  // C3: Cakupan pengguna jalan / vitalitas ruang publik terdampak (25%)
  let facilityMultiplier = 0.72;
  if (facilityCategory === 'transit') facilityMultiplier = 0.92;
  else if (facilityCategory === 'public_space') facilityMultiplier = 0.90;
  else if (facilityCategory === 'public_service') facilityMultiplier = 0.86;
  else if (facilityCategory === 'residential') facilityMultiplier = 0.68;
  else facilityMultiplier = 0.72;

  const safeGroupCount = Math.max(1, impactedGroupsCount);
  const groupWeight = Math.min(1.0, 0.42 + safeGroupCount * 0.12);
  const c3Users = clampScore(facilityMultiplier * 0.62 + groupWeight * 0.38, 0.40, 0.98);

  // C4: Tingkat kerusakan fisik / teknis infrastruktur (10%)
  const c4Physical = clampScore(
    severityPhysicalBase * activeObstacleConfig.c4PhysicalScale,
    0.28,
    0.98
  );

  return {
    c1Safety,
    c2Access,
    c3Users,
    c4Physical,
  };
}

/**
 * Menghitung skor preferensi SAW menggunakan matriks ternormalisasi terhadap nilai maksimum kriteria
 */
export function computeSawScore(
  criteria: Omit<SawCriteria, 'totalSaw'>,
  maxCriteria = SAW_REFERENCE_MAX
): number {
  const r1 = criteria.c1Safety / (maxCriteria.c1 || SAW_REFERENCE_MAX.c1);
  const r2 = criteria.c2Access / (maxCriteria.c2 || SAW_REFERENCE_MAX.c2);
  const r3 = criteria.c3Users / (maxCriteria.c3 || SAW_REFERENCE_MAX.c3);
  const r4 = criteria.c4Physical / (maxCriteria.c4 || SAW_REFERENCE_MAX.c4);

  const total =
    SAW_WEIGHTS.C1_SAFETY * r1 +
    SAW_WEIGHTS.C2_ACCESS * r2 +
    SAW_WEIGHTS.C3_USERS * r3 +
    SAW_WEIGHTS.C4_PHYSICAL * r4;

  return Number(total.toFixed(3));
}

/**
 * Mengurutkan seluruh daftar laporan berdasarkan skor preferensi SAW tertinggi ke terendah
 */
export function rankReportsBySaw(reports: ReportItem[]): ReportItem[] {
  if (!reports || reports.length === 0) {
    return [];
  }

  const maxCriteria = {
    c1: Math.max(...reports.map(r => r.sawScores.c1Safety), SAW_REFERENCE_MAX.c1),
    c2: Math.max(...reports.map(r => r.sawScores.c2Access), SAW_REFERENCE_MAX.c2),
    c3: Math.max(...reports.map(r => r.sawScores.c3Users), SAW_REFERENCE_MAX.c3),
    c4: Math.max(...reports.map(r => r.sawScores.c4Physical), SAW_REFERENCE_MAX.c4),
  };

  const updated = reports.map(r => {
    const totalSaw = computeSawScore(r.sawScores, maxCriteria);
    return {
      ...r,
      sawScores: {
        ...r.sawScores,
        totalSaw,
      },
    };
  });

  updated.sort((a, b) => b.sawScores.totalSaw - a.sawScores.totalSaw);

  return updated.map((r, idx) => ({
    ...r,
    sawScores: {
      ...r.sawScores,
      rank: idx + 1,
    },
  }));
}

/**
 * Converts a 0..1 score into an easy-to-read 0..100 integer score for all UI views
 */
export function toScore100(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  const scaled = value <= 1.0001 ? value * 100 : value;
  return Math.round(Math.max(0, Math.min(100, scaled)));
}

/**
 * Cleans any legacy 'SAW' mentions from previously saved database timeline strings
 */
export function cleanLegacySawText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\bskor prioritas SAW\b/gi, 'tingkat urgensi penanganan')
    .replace(/\bprioritas SAW\b/gi, 'prioritas penanganan')
    .replace(/\bSAW\b/gi, 'Prioritas')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
