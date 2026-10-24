import React, { useCallback, useEffect, useState } from 'react';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminPortal } from './components/admin/AdminPortal';
import { BerandaView } from './components/BerandaView';
import { BottomNav } from './components/BottomNav';
import { BuatLaporanView } from './components/BuatLaporanView';
import { Header } from './components/Header';
import { LacakLaporanView } from './components/LacakLaporanView';
import { PortalSwitcherBar } from './components/PortalSwitcherBar';
import { LEGACY_DUMMY_IDS } from './data/initialData';
import { ReportItem } from './types';
import { rankReportsBySaw } from './utils/sawCalculator';
import {
  fetchReports,
  createReport,
  updateReport,
  deleteReport,
  DatabaseStatus,
  PUBLIC_CACHE_KEY,
  syncAndGetMyDeviceReports,
  saveReportToMyDevice,
  removeReportFromMyDevice,
} from './services/reportService';

const CONTRAST_KEY = 'suara_ruang_contrast_mode';
const ADMIN_AUTH_KEY = 'suara_ruang_admin_auth';

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<'citizen' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/admin')) {
        return 'admin';
      }
    }
    return 'citizen';
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    }
    return false;
  });

  const [citizenTab, setCitizenTab] = useState<'beranda' | 'lapor' | 'lacak'>('beranda');
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [prefilledLocation, setPrefilledLocation] = useState<string>('');
  const [isHighContrast, setIsHighContrast] = useState(false);

  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: false,
    status: 'offline_fallback',
    message: 'Memuat data...',
    source: 'local',
  });
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Global reports for Admin Portal & Public Beranda Map
  const [reports, setReports] = useState<ReportItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('suara_ruang_reports_kebumen_v2');
        localStorage.removeItem('suara_ruang_reports_clean_v3');
        const stored = localStorage.getItem(PUBLIC_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(
              (r: ReportItem) => r && !LEGACY_DUMMY_IDS.includes(r.id)
            );
            return rankReportsBySaw(clean);
          }
        }
      } catch (err) {
        console.warn('Failed to load local reports:', err);
      }
    }
    return [];
  });

  // Strictly per-device reports for Citizen 'Lacak Laporan' tab
  const [myReports, setMyReports] = useState<ReportItem[]>(() =>
    syncAndGetMyDeviceReports()
  );

  const loadReportsFromServer = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const {
        reports: fetchedReports,
        myReports: deviceReports,
        dbStatus: status,
      } = await fetchReports();
      setReports(fetchedReports);
      setMyReports(deviceReports);
      setDbStatus(status);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    loadReportsFromServer();
  }, [loadReportsFromServer]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/admin')) {
        setCurrentPortal('admin');
      } else {
        setCurrentPortal('citizen');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigatePortal = (portal: 'citizen' | 'admin') => {
    setCurrentPortal(portal);
    const targetPath = portal === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    // Always sync fresh reports from MongoDB when switching portals
    loadReportsFromServer();
  };

  useEffect(() => {
    const saved = localStorage.getItem(CONTRAST_KEY);
    if (saved === 'true') {
      setIsHighContrast(true);
      document.documentElement.classList.add('contrast-more');
    }
  }, []);

  const handleToggleContrast = () => {
    const nextState = !isHighContrast;
    setIsHighContrast(nextState);
    if (nextState) {
      document.documentElement.classList.add('contrast-more');
      localStorage.setItem(CONTRAST_KEY, 'true');
    } else {
      document.documentElement.classList.remove('contrast-more');
      localStorage.setItem(CONTRAST_KEY, 'false');
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    loadReportsFromServer();
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem(ADMIN_AUTH_KEY);
  };

  // Citizen submits a new report -> saved to THIS device's history & MongoDB (for Admin)
  const handleAddNewReport = async (newReport: ReportItem) => {
    const updatedDeviceReports = saveReportToMyDevice(newReport);
    setMyReports(updatedDeviceReports);

    const updatedList = [newReport, ...reports.filter(r => r.id !== newReport.id)];
    const rankedList = rankReportsBySaw(updatedList);
    setReports(rankedList);
    setSelectedReportId(newReport.id);
    setPrefilledLocation('');

    try {
      await createReport(newReport);
      await loadReportsFromServer();
    } catch (err) {
      console.error('Failed to sync new report with MongoDB:', err);
    }

    setTimeout(() => {
      setCitizenTab('lacak');
    }, 900);
  };

  // Admin processes a report (verify, issue SPK, update progress, upload after-photo, complete)
  const handleProcessReport = async (reportId: string, updates: Partial<ReportItem>) => {
    const updated = reports.map(r => (r.id === reportId ? { ...r, ...updates } : r));
    const ranked = rankReportsBySaw(updated);
    setReports(ranked);
    setMyReports(prev =>
      prev.some(r => r.id === reportId)
        ? syncAndGetMyDeviceReports(ranked, dbStatus.connected)
        : prev
    );

    try {
      await updateReport(reportId, updates);
    } catch (err) {
      console.error('Failed to sync report update with MongoDB:', err);
    }
  };

  // Admin deletes a report
  const handleDeleteReport = async (reportId: string) => {
    removeReportFromMyDevice(reportId);
    const filtered = reports.filter(r => r.id !== reportId);
    const ranked = rankReportsBySaw(filtered);
    setReports(ranked);
    setMyReports(prev => prev.filter(r => r.id !== reportId));
    if (selectedReportId === reportId) {
      setSelectedReportId('');
    }

    try {
      await deleteReport(reportId);
    } catch (err) {
      console.error('Failed to delete report from MongoDB:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-[#131b2e] flex flex-col justify-start selection:bg-[#7fc5fd]/30">
      <PortalSwitcherBar
        currentPortal={currentPortal}
        onSwitchPortal={navigatePortal}
        dbStatus={dbStatus}
      />

      {/* PORTAL 1: CITIZEN / WARGA PORTAL */}
      {currentPortal === 'citizen' && (
        <div className="w-full max-w-md bg-[#faf8ff] min-h-[calc(100vh-32px)] flex flex-col relative mx-auto shadow-2xl border-x border-[#eaedff]">
          <Header
            currentTab={citizenTab}
            onTabChange={tab => {
              if (tab !== 'lapor') setPrefilledLocation('');
              if (tab === 'lacak') loadReportsFromServer();
              setCitizenTab(tab);
            }}
            isHighContrast={isHighContrast}
            onToggleContrast={handleToggleContrast}
          />

          <main className="flex-1 pt-16 flex flex-col">
            {citizenTab === 'beranda' && (
              <BerandaView
                reports={reports}
                myReportIds={myReports.map(r => r.id)}
                onNavigateToLapor={() => {
                  setPrefilledLocation('');
                  setCitizenTab('lapor');
                }}
                onNavigateToLacak={reportId => {
                  if (reportId) setSelectedReportId(reportId);
                  setCitizenTab('lacak');
                }}
              />
            )}

            {citizenTab === 'lapor' && (
              <BuatLaporanView
                initialPlaceName={prefilledLocation}
                onSubmitReport={handleAddNewReport}
                onCancel={() => setCitizenTab('beranda')}
              />
            )}

            {citizenTab === 'lacak' && (
              <LacakLaporanView
                reports={myReports}
                initialSearchId={selectedReportId}
                onRefreshStatus={loadReportsFromServer}
                isRefreshing={isLoadingReports}
                onNavigateToLaporWithLocation={loc => {
                  setPrefilledLocation(loc);
                  setCitizenTab('lapor');
                }}
              />
            )}
          </main>

          <BottomNav
            currentTab={citizenTab}
            onTabChange={tab => {
              if (tab !== 'lapor') setPrefilledLocation('');
              if (tab === 'lacak') loadReportsFromServer();
              setCitizenTab(tab);
            }}
          />
        </div>
      )}

      {/* PORTAL 2: ADMIN DINAS PUPR PORTAL (FULL RESPONSIVE WORKSPACE) */}
      {currentPortal === 'admin' && (
        <div className="w-full flex-1 flex flex-col bg-slate-50 min-h-[calc(100vh-36px)]">
          {!isAdminLoggedIn ? (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToCitizen={() => navigatePortal('citizen')}
            />
          ) : (
            <AdminPortal
              reports={reports}
              onProcessReport={handleProcessReport}
              onDeleteReport={handleDeleteReport}
              onRefreshReports={loadReportsFromServer}
              isRefreshing={isLoadingReports}
              onLogout={handleAdminLogout}
              onSwitchToCitizen={() => navigatePortal('citizen')}
              dbStatus={dbStatus}
            />
          )}
        </div>
      )}
    </div>
  );
}
