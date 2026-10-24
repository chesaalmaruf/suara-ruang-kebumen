import { ReportItem, SawCriteria, SeverityLevel, FacilityCategory } from '../types';

export const SAW_WEIGHTS = {
  C1_SAFETY: 0.35,
  C2_ACCESS: 0.30,
  C3_USERS: 0.25,
  C4_PHYSICAL: 0.10,
};

/**
 * Maps user form inputs to raw SAW criteria values (0 to 1 scale)
 */
export function calculateRawCriteria(
  severity: SeverityLevel,
  facilityCategory: FacilityCategory,
  impactedGroupsCount: number,
  obstacleType: string
): Omit<SawCriteria, 'totalSaw'> {
  // C1: Tingkat bahaya terhadap keselamatan (Benefit)
  let c1Safety = 0.4;
  if (severity === 'critical') c1Safety = 0.95;
  else if (severity === 'severe') c1Safety = 0.85;
  else if (severity === 'moderate') c1Safety = 0.60;
  else c1Safety = 0.35;

  // C2: Dampak terhadap aksesibilitas (Benefit)
  let c2Access = 0.5;
  if (obstacleType.toLowerCase().includes('guiding block') || obstacleType.toLowerCase().includes('tunanetra')) {
    c2Access = 0.90;
  } else if (obstacleType.toLowerCase().includes('ramp') || obstacleType.toLowerCase().includes('kursi roda')) {
    c2Access = 0.92;
  } else if (severity === 'critical' || severity === 'severe') {
    c2Access = 0.85;
  } else {
    c2Access = 0.60;
  }

  // C3: Jumlah pengguna yang terdampak (Benefit)
  // Public spaces and transport hubs have higher foot traffic in Kebumen
  let facilityMultiplier = 0.5;
  if (facilityCategory === 'public_space') facilityMultiplier = 0.90;
  else if (facilityCategory === 'transit') facilityMultiplier = 0.85;
  else if (facilityCategory === 'public_service') facilityMultiplier = 0.80;
  else if (facilityCategory === 'residential') facilityMultiplier = 0.65;
  else facilityMultiplier = 0.50;

  const groupWeight = Math.min(1.0, 0.4 + impactedGroupsCount * 0.15);
  const c3Users = Number(((facilityMultiplier * 0.6 + groupWeight * 0.4)).toFixed(3));

  // C4: Tingkat kerusakan fisik (Benefit)
  let c4Physical = 0.4;
  if (severity === 'critical') c4Physical = 0.90;
  else if (severity === 'severe') c4Physical = 0.80;
  else if (severity === 'moderate') c4Physical = 0.60;
  else c4Physical = 0.35;

  return {
    c1Safety,
    c2Access,
    c3Users,
    c4Physical,
  };
}

/**
 * Computes SAW score using normalized values against maximum observed criteria
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
 * Re-ranks a list of reports by SAW score descending
 */
export function rankReportsBySaw(reports: ReportItem[]): ReportItem[] {
  if (!reports || reports.length === 0) {
    return [];
  }

  // Find max values for normalization
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

  // Sort descending
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

