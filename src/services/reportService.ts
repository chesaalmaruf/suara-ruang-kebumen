import { ReportItem } from '../types';
import { LEGACY_DUMMY_IDS } from '../data/initialData';
import { rankReportsBySaw } from '../utils/sawCalculator';

const OLD_STORAGE_KEY = 'suara_ruang_reports_kebumen_v2';
const OLD_SHARED_CACHE_KEY = 'suara_ruang_reports_clean_v3';
export const PUBLIC_CACHE_KEY = 'suara_ruang_public_reports_cache_v1';
export const MY_DEVICE_REPORTS_KEY = 'suara_ruang_my_device_reports_v1';
export const DEVICE_UID_KEY = 'suara_ruang_device_uid_v1';

export interface DatabaseStatus {
  connected: boolean;
  status: 'connected' | 'offline_fallback' | 'not_configured' | 'error';
  message: string;
  source: 'mongodb' | 'local';
}

/**
 * Generates or retrieves a unique persistent identifier for this browser/device.
 * Used so 'Lacak Laporan' only shows reports submitted from this specific device.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let uid = localStorage.getItem(DEVICE_UID_KEY);
    if (!uid) {
      const randomPart =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      uid = `dev_${randomPart}`;
      localStorage.setItem(DEVICE_UID_KEY, uid);
    }
    return uid;
  } catch {
    return 'dev_ephemeral';
  }
}

function purgeOldDummyCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OLD_STORAGE_KEY);
    localStorage.removeItem(OLD_SHARED_CACHE_KEY);
  } catch {}
}

/**
 * Reads reports strictly created on THIS device from LocalStorage,
 * and enriches them with live status/SPK/timeline updates from MongoDB when available.
 */
export function syncAndGetMyDeviceReports(
  allServerReports?: ReportItem[],
  syncedWithMongo = false
): ReportItem[] {
  if (typeof window === 'undefined') return [];

  const myDeviceId = getOrCreateDeviceId();
  let storedMyReports: ReportItem[] = [];

  try {
    const raw = localStorage.getItem(MY_DEVICE_REPORTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        storedMyReports = parsed.filter(
          (r: ReportItem) => r && r.id && !LEGACY_DUMMY_IDS.includes(r.id)
        );
      }
    }
  } catch {}

  if (!allServerReports) {
    return storedMyReports;
  }

  const serverMap = new Map<string, ReportItem>();
  for (const sr of allServerReports) {
    if (sr && sr.id) {
      serverMap.set(sr.id, sr);
    }
  }

  const myIds = new Set(storedMyReports.map(r => r.id));

  // Also include any server report explicitly tagged with this device's unique ID
  for (const sr of allServerReports) {
    if (sr.reporterDeviceId && sr.reporterDeviceId === myDeviceId && !myIds.has(sr.id)) {
      storedMyReports.push(sr);
      myIds.add(sr.id);
    }
  }

  const now = Date.now();
  const merged: ReportItem[] = [];

  for (const localRep of storedMyReports) {
    const liveServerRep = serverMap.get(localRep.id);
    if (liveServerRep) {
      // Merge latest Admin PUPR updates (status, timeline, SPK, photos, global rank)
      merged.push({
        ...localRep,
        ...liveServerRep,
        reporterDeviceId: localRep.reporterDeviceId || myDeviceId,
        localSavedAt: localRep.localSavedAt,
      });
    } else {
      // If connected to MongoDB and report is not on server (e.g. deleted by Admin),
      // keep only if it was just created within the last 60 seconds (in-flight sync protection)
      const recentlyCreated =
        typeof localRep.localSavedAt === 'number' && now - localRep.localSavedAt < 60_000;
      if (!syncedWithMongo || recentlyCreated) {
        merged.push(localRep);
      }
    }
  }

  try {
    localStorage.setItem(MY_DEVICE_REPORTS_KEY, JSON.stringify(merged));
  } catch {}

  return merged;
}

/**
 * Registers a newly submitted report into this device's private LocalStorage history.
 */
export function saveReportToMyDevice(newReport: ReportItem): ReportItem[] {
  if (typeof window === 'undefined') return [newReport];
  const myDeviceId = getOrCreateDeviceId();
  const enriched: ReportItem = {
    ...newReport,
    reporterDeviceId: newReport.reporterDeviceId || myDeviceId,
    localSavedAt: newReport.localSavedAt || Date.now(),
  };

  try {
    const existing = syncAndGetMyDeviceReports();
    const updated = [enriched, ...existing.filter(r => r.id !== enriched.id)];
    localStorage.setItem(MY_DEVICE_REPORTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [enriched];
  }
}

/**
 * Removes a report ID from this device's local history if deleted.
 */
export function removeReportFromMyDevice(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = syncAndGetMyDeviceReports();
    const filtered = existing.filter(r => r.id !== id);
    localStorage.setItem(MY_DEVICE_REPORTS_KEY, JSON.stringify(filtered));
  } catch {}
}

/**
 * Fetch all reports from /api/reports (MongoDB) for Admin Portal & Public Map.
 */
export async function fetchReports(): Promise<{
  reports: ReportItem[];
  myReports: ReportItem[];
  dbStatus: DatabaseStatus;
}> {
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
          localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(ranked));
        } catch {}

        const isMongo = result.source === 'mongodb';
        const isConnError = result.source === 'fallback_on_error';
        const myReports = syncAndGetMyDeviceReports(ranked, isMongo);

        return {
          reports: ranked,
          myReports,
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

  // Fallback to local cache when offline
  let localPublicReports: ReportItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(PUBLIC_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localPublicReports = parsed.filter(r => r && !LEGACY_DUMMY_IDS.includes(r.id));
        }
      }
    } catch {}
  }

  const ranked = rankReportsBySaw(localPublicReports);
  const myReports = syncAndGetMyDeviceReports(ranked, false);

  return {
    reports: ranked,
    myReports,
    dbStatus: {
      connected: false,
      status: 'offline_fallback',
      message: 'Mode Offline / Penyimpanan Lokal',
      source: 'local',
    },
  };
}

/**
 * Save a newly submitted citizen report to THIS device's history & MongoDB
 */
export async function createReport(newReport: ReportItem): Promise<boolean> {
  const myDeviceId = getOrCreateDeviceId();
  const reportWithDevice: ReportItem = {
    ...newReport,
    reporterDeviceId: newReport.reporterDeviceId || myDeviceId,
    localSavedAt: newReport.localSavedAt || Date.now(),
  };

  saveReportToMyDevice(reportWithDevice);

  try {
    const stored = localStorage.getItem(PUBLIC_CACHE_KEY);
    const existing: ReportItem[] = stored ? JSON.parse(stored) : [];
    const updated = rankReportsBySaw([
      reportWithDevice,
      ...existing.filter(r => r.id !== reportWithDevice.id),
    ]);
    localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(updated));
  } catch {}

  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportWithDevice),
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
    const stored = localStorage.getItem(PUBLIC_CACHE_KEY);
    if (stored) {
      const list: ReportItem[] = JSON.parse(stored);
      const updated = rankReportsBySaw(
        list.map(r => (r.id === id ? { ...r, ...updates } : r))
      );
      localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(updated));
    }
  } catch {}

  try {
    const myStored = localStorage.getItem(MY_DEVICE_REPORTS_KEY);
    if (myStored) {
      const myList: ReportItem[] = JSON.parse(myStored);
      if (myList.some(r => r.id === id)) {
        const myUpdated = myList.map(r => (r.id === id ? { ...r, ...updates } : r));
        localStorage.setItem(MY_DEVICE_REPORTS_KEY, JSON.stringify(myUpdated));
      }
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
 * Delete a report from MongoDB & local caches
 */
export async function deleteReport(id: string): Promise<boolean> {
  removeReportFromMyDevice(id);

  try {
    const stored = localStorage.getItem(PUBLIC_CACHE_KEY);
    if (stored) {
      const list: ReportItem[] = JSON.parse(stored);
      const filtered = rankReportsBySaw(list.filter(r => r.id !== id));
      localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(filtered));
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
