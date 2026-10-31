export interface Coordinates {
  lat: number;
  lng: number;
}

export type FacilityCategory =
  | 'public_space'
  | 'public_service'
  | 'transit'
  | 'residential'
  | 'other';

export type SeverityLevel = 'mild' | 'moderate' | 'severe' | 'critical';

export type ReportStatus = 'submitted' | 'verified' | 'in_progress' | 'completed';

export interface SawCriteria {
  c1Safety: number; // Tingkat Bahaya Keselamatan (35%)
  c2Access: number; // Dampak Aksesibilitas Difabel (30%)
  c3Users: number; // Jumlah Pengguna / Fasilitas Publik Terdampak (25%)
  c4Physical: number; // Tingkat Kerusakan Fisik (10%)
  totalSaw: number; // Bobot prioritas terakumulasi
  rank?: number;
}

export interface TimelineItem {
  stage: number;
  title: string;
  time: string;
  desc: string;
  completed: boolean;
  active?: boolean;
}

export interface AssignedTeam {
  name: string;
  leadOfficer: string;
  nip?: string;
  vehicle: string;
  phone?: string;
  slaHours: number;
  remainingTime?: string;
  progressPercent?: number;
  statusNote?: string;
}

export interface ReportItem {
  id: string;
  title: string;
  placeName: string;
  address: string;
  district: string;
  coordinates: Coordinates;
  facilityCategory: FacilityCategory;
  obstacleType: string;
  isCustomObstacle?: boolean;
  severity: SeverityLevel;
  severityLabel: string;
  impactedGroups: string[];
  description: string;
  photoBefore: string;
  photoDuring?: string;
  photoAfter?: string;
  status: ReportStatus;
  statusLabel: string;
  createdAt: string;
  sawScores: SawCriteria;
  assignedTeam?: AssignedTeam;
  timeline: TimelineItem[];
  clusterId?: string;
  spkNumber?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  completedAt?: string;
  reporterDeviceId?: string;
  localSavedAt?: number;
  updatedAt?: number;
}
