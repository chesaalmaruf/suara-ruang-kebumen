import { ReportItem } from '../types';
import { INITIAL_REPORTS } from '../data/initialData';
import { rankReportsBySaw } from '../utils/sawCalculator';

const STORAGE_KEY = 'suara_ruang_reports_kebumen_v2';

export interface DatabaseStatus {
  connected: boolean;
  status: 'connected' | 'offline_fallback' | 'not_configured' | 'error';
  message: string;
  source: 'mongodb' | 'local';
}

/**
 * Fetch all reports.
 * Queries /api/reports (MongoDB) first. If offline, not configured, or error,
 * falls back seamlessly to LocalStorage / INITIAL_REPORTS.
 */
export async function fetchReports(): Promise<{ reports: ReportItem[]; dbStatus: DatabaseStatus }> {
  try {
    const response = await fetch('/api/reports', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const ranked = rankReportsBySaw(result.data);
        // Sync local cache
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(ranked));
        } catch {}

        return {
          reports: ranked,
          dbStatus: {
            connected: result.source === 'mongodb',
            status: result.source === 'mongodb' ? 'connected' : 'not_configured',
            message:
              result.source === 'mongodb'
                ? 'Terhubung ke MongoDB Database'
                : 'MongoDB belum diatur, menggunakan data lokal',
            source: result.source === 'mongodb' ? 'mongodb' : 'local',
          },
        };
      }
    }
  } catch (err) {
    console.warn('API /api/reports unavailable, loading from local cache:', err);
  }

  // Fallback to local cache / initial reports
  let localReports = INITIAL_REPORTS;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localReports = parsed;
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
      message: 'Mode Offline / LocalStorage Cache',
      source: 'local',
    },
  };
}

/**
 * Save a newly submitted citizen report to MongoDB & local cache
 */
export async function createReport(newReport: ReportItem): Promise<boolean> {
  // Always update local storage first so UI is immediately responsive
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newReport, ...existing]));
  } catch {}

  // Push to /api/reports (MongoDB)
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
    console.warn('Could not post report to MongoDB (network offline or dev mode):', err);
    return false;
  }
}

/**
 * Update report status (e.g. from Admin Portal)
 */
export async function updateReport(
  id: string,
  updates: Partial<ReportItem>
): Promise<boolean> {
  // Update local storage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const list: ReportItem[] = JSON.parse(stored);
      const updated = list.map(r => (r.id === id ? { ...r, ...updates } : r));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {}

  // Send update to MongoDB
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
  } catch {
    // Local / offline fallback
  }

  return {
    connected: false,
    status: 'offline_fallback',
    message: 'Server lokal / offline',
    source: 'local',
  };
}
