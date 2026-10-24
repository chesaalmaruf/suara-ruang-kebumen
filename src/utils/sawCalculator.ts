import { ReportItem, SawCriteria, SeverityLevel, FacilityCategory } from '../types';

export const SAW_WEIGHTS = {
  C1_SAFETY: 0.35,
  C2_ACCESS: 0.30,
  C3_USERS: 0.25,
  C4_PHYSICAL: 0.10,
};

export interface ObstacleOptionConfig {
  label: string;
  c2BaseAccess: number; // Dampak terhadap aksesibilitas difabel (0..1)
  c1SafetyBoost: number; // Penyesuaian bahaya keselamatan langsung (-0.05..+0.07)
  c4PhysicalScale: number; // Pengali kerusakan fisik struktural vs penghalang non-permanen
}

export const CATEGORY_LABELS: Record<FacilityCategory, string> = {
  public_space: 'Ruang Terbuka & Jalur Pedestrian',
  public_service: 'Gedung Layanan & Fasilitas Umum',
  transit: 'Transportasi & Penyeberangan',
  residential: 'Lingkungan & Gang Permukiman',
  other: 'Fasilitas Lainnya',
};

export const CATEGORY_OBSTACLE_OPTIONS: Record<FacilityCategory, ObstacleOptionConfig[]> = {
  public_space: [
    {
      label: 'Trotoar rusak, berlubang, atau amblas',
      c2BaseAccess: 0.84,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 1.05,
    },
    {
      label: 'Guiding block (pemandu tunanetra) terputus / mengelupas',
      c2BaseAccess: 0.92,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
    },
    {
      label: 'Ramp trotoar tidak ada atau terlalu curam',
      c2BaseAccess: 0.94,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
    },
    {
      label: 'Lubang drainase / penutup selokan terbuka di jalur pejalan kaki',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 1.06,
    },
    {
      label: 'Jalur ruang terbuka terhalang bollard sempit, tiang, atau PKL/parkir',
      c2BaseAccess: 0.90,
      c1SafetyBoost: 0.01,
      c4PhysicalScale: 0.85,
    },
    {
      label: 'Akses taman / alun-alun berundak tanpa jalur kursi roda',
      c2BaseAccess: 0.91,
      c1SafetyBoost: 0.02,
      c4PhysicalScale: 0.95,
    },
  ],
  public_service: [
    {
      label: 'Pintu masuk gedung tanpa ramp kursi roda / hanya tangga tinggi',
      c2BaseAccess: 0.95,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 0.95,
    },
    {
      label: 'Toilet khusus disabilitas tidak tersedia, terkunci, atau rusak',
      c2BaseAccess: 0.93,
      c1SafetyBoost: 0.0,
      c4PhysicalScale: 0.95,
    },
    {
      label: 'Loket pelayanan / koridor gedung terlalu sempit atau tinggi bagi kursi roda',
      c2BaseAccess: 0.90,
      c1SafetyBoost: -0.02,
      c4PhysicalScale: 0.9,
    },
    {
      label: 'Tangga / selasar gedung tanpa pegangan rambat (handrail) pengaman',
      c2BaseAccess: 0.87,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 0.98,
    },
    {
      label: 'Lantai selasar licin, berundak tajam, atau tanpa penanda tunanetra',
      c2BaseAccess: 0.89,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 1.0,
    },
    {
      label: 'Area parkir khusus disabilitas tidak ada atau terhalang kendaraan lain',
      c2BaseAccess: 0.84,
      c1SafetyBoost: -0.02,
      c4PhysicalScale: 0.82,
    },
  ],
  transit: [
    {
      label: 'Halte / peron terlalu tinggi tanpa ramp naik-turun kursi roda',
      c2BaseAccess: 0.95,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 0.98,
    },
    {
      label: 'Penyeberangan jalan (zebra cross) tanpa ramp trotoar atau sinyal suara',
      c2BaseAccess: 0.93,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 0.96,
    },
    {
      label: 'Jembatan penyeberangan / akses stasiun terlalu curam bagi difabel & lansia',
      c2BaseAccess: 0.92,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 0.96,
    },
    {
      label: 'Jalur pemandu (guiding block) menuju halte / stasiun / terminal terputus',
      c2BaseAccess: 0.91,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
    },
    {
      label: 'Titik turun-naik penumpang terhalang parkir liar atau hambatan fisik',
      c2BaseAccess: 0.86,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 0.85,
    },
    {
      label: 'Minim penerangan & rambu informasi rute tidak ramah tunanetra/low-vision',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 0.92,
    },
  ],
  residential: [
    {
      label: 'Jalan lingkungan / gang permukiman berlubang parah atau amblas',
      c2BaseAccess: 0.83,
      c1SafetyBoost: 0.05,
      c4PhysicalScale: 1.06,
    },
    {
      label: 'Saluran air / gorong-gorong permukiman terbuka tanpa penutup aman',
      c2BaseAccess: 0.85,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 1.05,
    },
    {
      label: 'Tanjakan jalan gang terlalu curam atau licin tanpa pengaman tepi',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.06,
      c4PhysicalScale: 1.0,
    },
    {
      label: 'Akses kursi roda & lansia di gang terhalang portal sempit / material',
      c2BaseAccess: 0.91,
      c1SafetyBoost: 0.01,
      c4PhysicalScale: 0.85,
    },
    {
      label: 'Permukaan paving / beton jalan warga pecah & bergelombang',
      c2BaseAccess: 0.82,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.04,
    },
    {
      label: 'Jalur warga minim penerangan & tanpa pembatas pada tepi rawan jatuh',
      c2BaseAccess: 0.80,
      c1SafetyBoost: 0.06,
      c4PhysicalScale: 0.94,
    },
  ],
  other: [
    {
      label: 'Trotoar rusak, berlubang, atau amblas',
      c2BaseAccess: 0.84,
      c1SafetyBoost: 0.04,
      c4PhysicalScale: 1.05,
    },
    {
      label: 'Guiding block (pemandu tunanetra) terputus / mengelupas',
      c2BaseAccess: 0.92,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
    },
    {
      label: 'Tidak ada ramp kursi roda atau kemiringan terlalu curam',
      c2BaseAccess: 0.94,
      c1SafetyBoost: 0.03,
      c4PhysicalScale: 1.0,
    },
    {
      label: 'Lubang drainase / gorong-gorong terbuka membahayakan',
      c2BaseAccess: 0.88,
      c1SafetyBoost: 0.07,
      c4PhysicalScale: 1.06,
    },
  ],
};

export const CATEGORY_CRITICAL_SUBTEXT: Record<FacilityCategory, string> = {
  public_space: 'Risiko jatuh ke jalan raya / terperosok lubang trotoar terbuka',
  public_service: 'Akses gedung tertutup bagi difabel / risiko jatuh di tangga pelayanan',
  transit: 'Risiko kecelakaan di penyeberangan / gagal mengakses transportasi umum',
  residential: 'Risiko terperosok saluran warga / akses gang putus bagi lansia & kursi roda',
  other: 'Risiko kecelakaan langsung / fasilitas tidak dapat dilalui sama sekali',
};

export const CUSTOM_OBSTACLE_LABEL = 'Pengaduan lain';

/**
 * Parameter seragam untuk opsi "Pengaduan lain" (input manual).
 * Apapun teks yang diketik pengguna pada kolom manual, nilai parameter
 * hambatannya dijamin 100% sama tanpa dipengaruhi kata kunci kalimat.
 */
export const CUSTOM_OBSTACLE_CONFIG: ObstacleOptionConfig = {
  label: CUSTOM_OBSTACLE_LABEL,
  c2BaseAccess: 0.88,
  c1SafetyBoost: 0.03,
  c4PhysicalScale: 1.0,
};

function findObstacleConfig(
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
  return undefined;
}

function clampScore(val: number, min = 0.2, max = 0.98): number {
  return Number(Math.max(min, Math.min(max, val)).toFixed(3));
}

/**
 * Maps user form inputs (Category A, Obstacle B, Severity C, Impacted Groups D)
 * to raw criteria values (0 to 1 scale) while preserving weights 35%, 30%, 25%, 10%.
 * Any custom manual input ("Pengaduan lain") uses uniform CUSTOM_OBSTACLE_CONFIG
 * regardless of the text entered.
 */
export function calculateRawCriteria(
  severity: SeverityLevel,
  facilityCategory: FacilityCategory,
  impactedGroupsCount: number,
  obstacleType: string,
  isCustomObstacle = false
): Omit<SawCriteria, 'totalSaw'> {
  const activeObstacleConfig = isCustomObstacle
    ? CUSTOM_OBSTACLE_CONFIG
    : findObstacleConfig(facilityCategory, obstacleType) ?? CUSTOM_OBSTACLE_CONFIG;

  // Base severity anchors
  const severitySafetyBase =
    severity === 'critical'
      ? 0.92
      : severity === 'severe'
      ? 0.82
      : severity === 'moderate'
      ? 0.60
      : 0.35;

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
      : 0.35;

  // C1: Tingkat bahaya terhadap keselamatan (35%)
  const c1Safety = clampScore(
    severitySafetyBase + activeObstacleConfig.c1SafetyBoost,
    0.30,
    0.98
  );

  // C2: Dampak terhadap aksesibilitas difabel (30%)
  const c2Access = clampScore(
    activeObstacleConfig.c2BaseAccess + severityAccessDelta,
    0.45,
    0.98
  );

  // C3: Jumlah pengguna / fasilitas publik terdampak (25%)
  let facilityMultiplier = 0.5;
  if (facilityCategory === 'public_space') facilityMultiplier = 0.90;
  else if (facilityCategory === 'transit') facilityMultiplier = 0.88;
  else if (facilityCategory === 'public_service') facilityMultiplier = 0.85;
  else if (facilityCategory === 'residential') facilityMultiplier = 0.65;
  else facilityMultiplier = 0.55;

  const groupWeight = Math.min(1.0, 0.4 + impactedGroupsCount * 0.15);
  const c3Users = clampScore(facilityMultiplier * 0.6 + groupWeight * 0.4, 0.40, 0.98);

  // C4: Tingkat kerusakan / keparahan fisik (10%)
  const c4Physical = clampScore(
    severityPhysicalBase * activeObstacleConfig.c4PhysicalScale,
    0.28,
    0.96
  );

  return {
    c1Safety,
    c2Access,
    c3Users,
    c4Physical,
  };
}

/**
 * Computes priority score using normalized values against maximum observed criteria
 */
export function computeSawScore(
  criteria: Omit<SawCriteria, 'totalSaw'>,
  maxCriteria = { c1: 1.0, c2: 1.0, c3: 1.0, c4: 1.0 }
): number {
  const r1 = criteria.c1Safety / (maxCriteria.c1 || 1.0);
  const r2 = criteria.c2Access / (maxCriteria.c2 || 1.0);
  const r3 = criteria.c3Users / (maxCriteria.c3 || 1.0);
  const r4 = criteria.c4Physical / (maxCriteria.c4 || 1.0);

  const total =
    SAW_WEIGHTS.C1_SAFETY * r1 +
    SAW_WEIGHTS.C2_ACCESS * r2 +
    SAW_WEIGHTS.C3_USERS * r3 +
    SAW_WEIGHTS.C4_PHYSICAL * r4;

  return Number(total.toFixed(3));
}

/**
 * Re-ranks a list of reports by priority score descending
 */
export function rankReportsBySaw(reports: ReportItem[]): ReportItem[] {
  if (!reports || reports.length === 0) {
    return [];
  }

  const maxCriteria = {
    c1: Math.max(...reports.map(r => r.sawScores.c1Safety), 0.1),
    c2: Math.max(...reports.map(r => r.sawScores.c2Access), 0.1),
    c3: Math.max(...reports.map(r => r.sawScores.c3Users), 0.1),
    c4: Math.max(...reports.map(r => r.sawScores.c4Physical), 0.1),
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
