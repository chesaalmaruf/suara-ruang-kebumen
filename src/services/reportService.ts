import { ReportItem } from '../types';
import { LEGACY_DUMMY_IDS } from '../data/initialData';
import { rankReportsBySaw } from '../utils/sawCalculator';

const OLD_STORAGE_KEY = 'suara_ruang_reports_kebumen_v2';
export const STORAGE_KEY = 'suara_ruang_reports_clean_v3';

export interface DatabaseStatus {
  connected: boolean;
  status: 'connected' | 'offline_fallback' | 'not_configured' | 'error';
  message: string;
  source: 'mongodb' | 'local';
}

function purgeOldDummyCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OLD_STORAGE_KEY);
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (item: ReportItem) => item && !LEGACY_DUMMY_IDS.includes(item.id)
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
    }
  } catch {}
}

/**
 * Fetch all reports from /api/reports (MongoDB).
 * Supports empty arrays cleanly without falling back to dummy data.
 */
export async function fetchReports(): Promise<{ reports: ReportItem[]; dbStatus: DatabaseStatus }> {
  purgeOldDummyCache();

  try {
    const response = await fetch('/api/reports', {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const cleaned = result.data.filter(
          (r: ReportItem) => r && !LEGACY_DUMMY_IDS.includes(r.id)
        );
        const ranked = rankReportsBySaw(cleaned);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(ranked));
        } catch {}

        const isMongo = result.source === 'mongodb';
        const isConnError = result.source === 'fallback_on_error';

        return {
          reports: ranked,
          dbStatus: {
            connected: isMongo,
            status: isMongo ? 'connected' : isConnError ? 'error' : 'not_configured',
            message: isMongo
              ? 'Terhubung ke MongoDB Atlas'
              : isConnError
              ? `Gagal koneksi MongoDB: ${result.error || 'Periksa MONGODB_URI & Network Access 0.0.0.0/0'}`
              : 'MongoDB belum diatur, menggunakan penyimpanan lokal',
            source: isMongo ? 'mongodb' : 'local',
          },
        };
      }
    }
  } catch (err) {
    console.warn('API /api/reports unavailable, loading from local cache:', err);
  }

  // Fallback to local cache (clean, no dummy data)
  let localReports: ReportItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localReports = parsed.filter(r => r && !LEGACY_DUMMY_IDS.includes(r.id));
        }
      }
    } catch {}
  }

  const ranked = rankReportsBySaw(localReports);
  return {
    reports: ranked,
    dbStatus: {
      connected: false,
      status: 'offline_fallback',
      message: 'Mode Offline / Penyimpanan Lokal',
      source: 'local',
    },
  };
}

/**
 * Save a newly submitted citizen report to MongoDB & local cache
 */
export async function createReport(newReport: ReportItem): Promise<boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing: ReportItem[] = stored ? JSON.parse(stored) : [];
    const updated = rankReportsBySaw([
      newReport,
      ...existing.filter(r => r.id !== newReport.id),
    ]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReport),
    });

    if (!response.ok) {
      console.warn('Failed to sync new report with MongoDB API:', response.statusText);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Could not post report to MongoDB:', err);
    return false;
  }
}

/**
 * Update report fields (status, SPK, team, timeline, after-photo, etc.)
 */
export async function updateReport(
  id: string,
  updates: Partial<ReportItem>
): Promise<boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const list: ReportItem[] = JSON.parse(stored);
      const updated = rankReportsBySaw(
        list.map(r => (r.id === id ? { ...r, ...updates } : r))
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {}

  try {
    const response = await fetch('/api/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });

    return response.ok;
  } catch (err) {
    console.warn('Could not patch report to MongoDB:', err);
    return false;
  }
}

/**
 * Delete a report from MongoDB & local cache
 */
export async function deleteReport(id: string): Promise<boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const list: ReportItem[] = JSON.parse(stored);
      const filtered = rankReportsBySaw(list.filter(r => r.id !== id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch {}

  try {
    const response = await fetch(`/api/reports?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (err) {
    console.warn('Could not delete report from MongoDB:', err);
    return false;
  }
}

/**
 * Check live database connectivity
 */
export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      if (data.database === 'connected') {
        return {
          connected: true,
          status: 'connected',
          message: 'MongoDB Atlas Terhubung',
          source: 'mongodb',
        };
      }
      return {
        connected: false,
        status: data.database === 'not_configured' ? 'not_configured' : 'error',
        message: data.message || 'Database belum dikonfigurasi',
        source: 'local',
      };
    }
  } catch {}

  return {
    connected: false,
    status: 'offline_fallback',
    message: 'Server lokal / offline',
    source: 'local',
  };
}
