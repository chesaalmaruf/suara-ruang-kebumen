import { ReportItem, ReportStatus } from '../types';
import { LEGACY_DUMMY_IDS } from '../data/initialData';
import { rankReportsBySaw } from '../utils/sawCalculator';
import { resolveReportDistrict } from '../utils/placeSearch';

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

const STATUS_STAGE_WEIGHT: Record<ReportStatus, number> = {
  submitted: 0,
  verified: 1,
  in_progress: 2,
  completed: 3,
};

function normalizeReportsList(items: ReportItem[]): ReportItem[] {
  return items
    .filter((r): r is ReportItem => Boolean(r && r.id && !LEGACY_DUMMY_IDS.includes(r.id)))
    .map(r => resolveReportDistrict(r));
}

/**
 * Safely persists reports to localStorage without losing status/timeline updates
 * when base64 photos exceed the browser's ~5MB localStorage quota.
 */
export function safeSaveReportsToStorage(
  key: string,
  items: ReportItem[],
  priorityPhotoIds?: Set<string>
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
    return;
  } catch {
    // Fallback 1: Keep photos only on priority / newest 3 items; strip base64 on older cached items
    try {
      const trimmedOlderPhotos = items.map((item, idx) => {
        const keepFull = (priorityPhotoIds && priorityPhotoIds.has(item.id)) || idx < 3;
        if (keepFull) return item;
        return {
          ...item,
          photoBefore: item.photoBefore?.startsWith('data:') ? '' : item.photoBefore,
          photoDuring: item.photoDuring?.startsWith('data:') ? undefined : item.photoDuring,
          photoAfter: item.photoAfter?.startsWith('data:') ? undefined : item.photoAfter,
        };
      });
      localStorage.setItem(key, JSON.stringify(trimmedOlderPhotos));
      return;
    } catch {
      // Fallback 2: Strip all heavy data-URI photos so ticket metadata, district & status ALWAYS save
      try {
        const metadataOnly = items.map(item => ({
          ...item,
          photoBefore: item.photoBefore?.startsWith('data:') ? '' : item.photoBefore,
          photoDuring: item.photoDuring?.startsWith('data:') ? undefined : item.photoDuring,
          photoAfter: item.photoAfter?.startsWith('data:') ? undefined : item.photoAfter,
        }));
        localStorage.setItem(key, JSON.stringify(metadataOnly));
      } catch {}
    }
  }
}

/**
 * Merges two versions of the same report, preserving newer status updates
 * (e.g. in-flight Admin updates or local updates when MongoDB is in fallback mode)
 * and retaining photos if local cache trimmed base64 strings for quota reasons.
 */
function mergeReportVersions(
  localRep: ReportItem,
  serverRep: ReportItem,
  syncedWithMongo: boolean
): ReportItem {
  const localWeight = STATUS_STAGE_WEIGHT[localRep.status] ?? 0;
  const serverWeight = STATUS_STAGE_WEIGHT[serverRep.status] ?? 0;
  const localUpdated = localRep.updatedAt ?? 0;
  const serverUpdated = serverRep.updatedAt ?? 0;
  const now = Date.now();

  const recentLocalMutation = localUpdated > serverUpdated && now - localUpdated < 30_000;
  const preferLocalState = syncedWithMongo
    ? recentLocalMutation && localWeight >= serverWeight
    : localUpdated > serverUpdated || localWeight > serverWeight;

  const base = preferLocalState
    ? { ...serverRep, ...localRep }
    : { ...localRep, ...serverRep };

  return resolveReportDistrict({
    ...base,
    photoBefore: base.photoBefore || serverRep.photoBefore || localRep.photoBefore || '',
    photoDuring: base.photoDuring || serverRep.photoDuring || localRep.photoDuring,
    photoAfter: base.photoAfter || serverRep.photoAfter || localRep.photoAfter,
    reporterDeviceId: localRep.reporterDeviceId || serverRep.reporterDeviceId,
    localSavedAt: localRep.localSavedAt || serverRep.localSavedAt,
    updatedAt: Math.max(localUpdated, serverUpdated) || undefined,
  });
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

function readPublicCacheReports(): ReportItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PUBLIC_CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return normalizeReportsList(parsed);
      }
    }
  } catch {}
  return [];
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
        storedMyReports = normalizeReportsList(parsed);
      }
    }
  } catch {}

  if (!allServerReports) {
    return storedMyReports;
  }

  const normalizedServer = normalizeReportsList(allServerReports);
  const serverMap = new Map<string, ReportItem>();
  for (const sr of normalizedServer) {
    serverMap.set(sr.id.trim(), sr);
  }

  const myIds = new Set(storedMyReports.map(r => r.id.trim()));

  // Also include any server report explicitly tagged with this device's unique ID
  for (const sr of normalizedServer) {
    if (sr.reporterDeviceId && sr.reporterDeviceId === myDeviceId && !myIds.has(sr.id.trim())) {
      storedMyReports.push(sr);
      myIds.add(sr.id.trim());
    }
  }

  const now = Date.now();
  const merged: ReportItem[] = [];

  for (const localRep of storedMyReports) {
    const liveServerRep = serverMap.get(localRep.id.trim());
    if (liveServerRep) {
      const combined = mergeReportVersions(localRep, liveServerRep, syncedWithMongo);
      merged.push({
        ...combined,
        reporterDeviceId: combined.reporterDeviceId || myDeviceId,
      });
    } else {
      // If connected to MongoDB and report is not on server (e.g. deleted by Admin),
      // keep only if it was just created within the last 60 seconds (in-flight sync protection)
      const recentlyCreated =
        typeof localRep.localSavedAt === 'number' && now - localRep.localSavedAt < 60_000;
      if (!syncedWithMongo || recentlyCreated) {
        merged.push(resolveReportDistrict(localRep));
      }
    }
  }

  safeSaveReportsToStorage(MY_DEVICE_REPORTS_KEY, merged);

  return merged;
}

/**
 * Registers a newly submitted report into this device's private LocalStorage history.
 */
export function saveReportToMyDevice(newReport: ReportItem): ReportItem[] {
  if (typeof window === 'undefined') return [newReport];
  const myDeviceId = getOrCreateDeviceId();
  const enriched: ReportItem = resolveReportDistrict({
    ...newReport,
    reporterDeviceId: newReport.reporterDeviceId || myDeviceId,
    localSavedAt: newReport.localSavedAt || Date.now(),
    updatedAt: newReport.updatedAt || Date.now(),
  });

  const existing = syncAndGetMyDeviceReports();
  const updated = [enriched, ...existing.filter(r => r.id.trim() !== enriched.id.trim())];
  safeSaveReportsToStorage(MY_DEVICE_REPORTS_KEY, updated, new Set([enriched.id]));
  return updated;
}

/**
 * Removes a report ID from this device's local history if deleted.
 */
export function removeReportFromMyDevice(id: string): void {
  if (typeof window === 'undefined') return;
  const targetId = id.trim();
  const existing = syncAndGetMyDeviceReports();
  const filtered = existing.filter(r => r.id.trim() !== targetId);
  safeSaveReportsToStorage(MY_DEVICE_REPORTS_KEY, filtered);
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
  const localCached = readPublicCacheReports();

  try {
    const response = await fetch('/api/reports', {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const serverCleaned = normalizeReportsList(result.data);
        const isMongo = result.source === 'mongodb';
        const isConnError = result.source === 'fallback_on_error';

        let combinedList: ReportItem[];
        if (isMongo) {
          // MongoDB is authoritative, while preserving any brand-new in-flight local mutations
          const localMap = new Map(localCached.map(r => [r.id.trim(), r]));
          const seenIds = new Set<string>();
          combinedList = serverCleaned.map(sr => {
            seenIds.add(sr.id.trim());
            const loc = localMap.get(sr.id.trim());
            return loc ? mergeReportVersions(loc, sr, true) : sr;
          });
          // Keep very recently created local reports (< 30s) not yet visible in Mongo read
          const now = Date.now();
          for (const loc of localCached) {
            if (
              !seenIds.has(loc.id.trim()) &&
              typeof loc.localSavedAt === 'number' &&
              now - loc.localSavedAt < 30_000
            ) {
              combinedList.push(loc);
            }
          }
        } else {
          // Server is in unconfigured / ephemeral fallback mode: merge server + localStorage so updates never vanish
          const mergedMap = new Map<string, ReportItem>();
          for (const loc of localCached) {
            mergedMap.set(loc.id.trim(), loc);
          }
          for (const sr of serverCleaned) {
            const existing = mergedMap.get(sr.id.trim());
            mergedMap.set(
              sr.id.trim(),
              existing ? mergeReportVersions(existing, sr, false) : sr
            );
          }
          combinedList = Array.from(mergedMap.values());
        }

        const ranked = rankReportsBySaw(combinedList);
        safeSaveReportsToStorage(PUBLIC_CACHE_KEY, ranked);

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
  const ranked = rankReportsBySaw(localCached);
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
  const now = Date.now();
  const reportWithDevice: ReportItem = resolveReportDistrict({
    ...newReport,
    reporterDeviceId: newReport.reporterDeviceId || myDeviceId,
    localSavedAt: newReport.localSavedAt || now,
    updatedAt: newReport.updatedAt || now,
  });

  saveReportToMyDevice(reportWithDevice);

  const existing = readPublicCacheReports();
  const updated = rankReportsBySaw([
    reportWithDevice,
    ...existing.filter(r => r.id.trim() !== reportWithDevice.id.trim()),
  ]);
  safeSaveReportsToStorage(PUBLIC_CACHE_KEY, updated, new Set([reportWithDevice.id]));

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
  updates: Partial<ReportItem>,
  fullReport?: ReportItem
): Promise<boolean> {
  const cleanId = id.trim();
  const stampedUpdates: Partial<ReportItem> = {
    ...updates,
    updatedAt: updates.updatedAt || Date.now(),
  };

  let resolvedTarget: ReportItem | undefined = fullReport
    ? resolveReportDistrict({ ...fullReport, ...stampedUpdates, id: cleanId })
    : undefined;

  const existingPublic = readPublicCacheReports();
  const foundInPublic = existingPublic.some(r => r.id.trim() === cleanId);
  let nextPublicList: ReportItem[];

  if (foundInPublic) {
    nextPublicList = existingPublic.map(r => {
      if (r.id.trim() === cleanId) {
        const merged = resolveReportDistrict({ ...r, ...stampedUpdates });
        if (!resolvedTarget) resolvedTarget = merged;
        return merged;
      }
      return r;
    });
  } else if (resolvedTarget) {
    nextPublicList = [resolvedTarget, ...existingPublic];
  } else {
    nextPublicList = existingPublic;
  }

  const rankedPublic = rankReportsBySaw(nextPublicList);
  safeSaveReportsToStorage(PUBLIC_CACHE_KEY, rankedPublic, new Set([cleanId]));

  try {
    const rawMy = localStorage.getItem(MY_DEVICE_REPORTS_KEY);
    if (rawMy) {
      const myList: ReportItem[] = JSON.parse(rawMy);
      if (Array.isArray(myList) && myList.some(r => r && r.id?.trim() === cleanId)) {
        const myUpdated = myList.map(r =>
          r.id?.trim() === cleanId ? resolveReportDistrict({ ...r, ...stampedUpdates }) : r
        );
        safeSaveReportsToStorage(MY_DEVICE_REPORTS_KEY, myUpdated, new Set([cleanId]));
      }
    }
  } catch {}

  try {
    // Strip heavy photoBefore from _fullReport backup payload unless photoBefore itself was updated
    const lightweightFallback = resolvedTarget
      ? {
          ...resolvedTarget,
          photoBefore:
            stampedUpdates.photoBefore !== undefined ? stampedUpdates.photoBefore : resolvedTarget.photoBefore,
        }
      : undefined;

    const response = await fetch('/api/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: cleanId,
        ...stampedUpdates,
        ...(resolvedTarget ? { district: resolvedTarget.district } : {}),
        _fullReport: lightweightFallback,
      }),
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
  const cleanId = id.trim();
  removeReportFromMyDevice(cleanId);

  const existingPublic = readPublicCacheReports();
  const filtered = rankReportsBySaw(existingPublic.filter(r => r.id.trim() !== cleanId));
  safeSaveReportsToStorage(PUBLIC_CACHE_KEY, filtered);

  try {
    const response = await fetch(`/api/reports?id=${encodeURIComponent(cleanId)}`, {
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
