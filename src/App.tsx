import React, { useEffect, useState } from 'react';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminPortal } from './components/admin/AdminPortal';
import { BerandaView } from './components/BerandaView';
import { BottomNav } from './components/BottomNav';
import { BuatLaporanView } from './components/BuatLaporanView';
import { Header } from './components/Header';
import { LacakLaporanView } from './components/LacakLaporanView';
import { PortalSwitcherBar } from './components/PortalSwitcherBar';
import { SawExplainerModal } from './components/SawExplainerModal';
import { INITIAL_REPORTS } from './data/initialData';
import { ReportItem } from './types';
import { rankReportsBySaw } from './utils/sawCalculator';
import {
  fetchReports,
  createReport,
  updateReport,
  DatabaseStatus,
} from './services/reportService';

const STORAGE_KEY = 'suara_ruang_reports_kebumen_v2';
const CONTRAST_KEY = 'suara_ruang_contrast_mode';
const ADMIN_AUTH_KEY = 'suara_ruang_admin_auth';

export default function App() {
  // Routing state between Citizen Portal ('citizen') and Admin Portal ('admin')
  const [currentPortal, setCurrentPortal] = useState<'citizen' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/admin')) {
        return 'admin';
      }
    }
    return 'citizen';
  });

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    }
    return false;
  });

  // Citizen Tab state
  const [citizenTab, setCitizenTab] = useState<'beranda' | 'lapor' | 'lacak'>('beranda');
  const [selectedReportId, setSelectedReportId] = useState<string>('#KBM-2025-0842');
  const [isSawModalOpen, setIsSawModalOpen] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Database connectivity state
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: false,
    status: 'offline_fallback',
    message: 'Memuat data...',
    source: 'local',
  });
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Sync browser URL with routing
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
  };

  // Initial reports state (starts from local cache / INITIAL_REPORTS)
  const [reports, setReports] = useState<ReportItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return rankReportsBySaw(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load local reports:', err);
      }
    }
    return rankReportsBySaw(INITIAL_REPORTS);
  });

  // Fetch live reports from MongoDB API on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingReports(true);

    fetchReports().then(({ reports: fetchedReports, dbStatus: status }) => {
      if (!isMounted) return;
      if (fetchedReports && fetchedReports.length > 0) {
        setReports(fetchedReports);
      }
      setDbStatus(status);
      setIsLoadingReports(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // High contrast mode initialization and toggle
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

  // Admin Login / Logout handlers
  const handleAdminLoginSuccess = (user: string) => {
    setIsAdminLoggedIn(true);
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem(ADMIN_AUTH_KEY);
  };

  // Submit new report handler from citizen
  const handleAddNewReport = (newReport: ReportItem) => {
    const updatedList = [newReport, ...reports];
    const rankedList = rankReportsBySaw(updatedList);
    setReports(rankedList);
    setSelectedReportId(newReport.id);

    // Sync to MongoDB in background
    createReport(newReport)
      .then(() => {
        fetchReports().then(({ dbStatus: status }) => setDbStatus(status));
      })
      .catch(err => console.error('Failed to sync new report with MongoDB:', err));

    // Redirect to tracking tab
    setTimeout(() => {
      setCitizenTab('lacak');
    }, 1200);
  };

  // Update report status from Admin Portal
  const handleUpdateStatus = (reportId: string, newStatus: ReportItem['status']) => {
    const updated = reports.map(r => {
      if (r.id === reportId) {
        const isCompleted = newStatus === 'completed';
        return {
          ...r,
          status: newStatus,
          statusLabel: isCompleted
            ? 'Tuntas 100% (Terverifikasi DPUPR)'
            : newStatus === 'in_progress'
            ? 'Sedang Dikerjakan oleh Dinas PUPR'
            : 'Terverifikasi DPUPR',
          completedAt: isCompleted ? 'Hari Ini • Baru Saja' : undefined,
          timeline: r.timeline.map((step, idx) => {
            if (isCompleted) {
              return { ...step, completed: true, active: false };
            }
            if (newStatus === 'in_progress' && idx === 2) {
              return { ...step, completed: true, active: true };
            }
            return step;
          }),
        };
      }
      return r;
    });

    const ranked = rankReportsBySaw(updated);
    setReports(ranked);

    // Sync to MongoDB
    const target = updated.find(r => r.id === reportId);
    if (target) {
      updateReport(reportId, {
        status: target.status,
        statusLabel: target.statusLabel,
        completedAt: target.completedAt,
        timeline: target.timeline,
      }).catch(err => console.error('Failed to sync status update with MongoDB:', err));
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-[#131b2e] flex flex-col justify-start selection:bg-[#7fc5fd]/30">
      {/* Dual Web Address Switcher Bar (simulates separate domains/addresses as requested) */}
      <PortalSwitcherBar
        currentPortal={currentPortal}
        onSwitchPortal={navigatePortal}
        dbStatus={dbStatus}
      />

      {/* =========================================================================
          PORTAL 1: CITIZEN / WARGA PORTAL (https://suararuang.kebumenkab.go.id/)
          ========================================================================= */}
      {currentPortal === 'citizen' && (
        <div className="w-full max-w-md bg-[#faf8ff] min-h-[calc(100vh-32px)] flex flex-col relative mx-auto shadow-2xl border-x border-[#eaedff]">
          {/* Universal Citizen Top Header */}
          <Header
            currentTab={citizenTab}
            onTabChange={setCitizenTab}
            onOpenSawModal={() => setIsSawModalOpen(true)}
            isHighContrast={isHighContrast}
            onToggleContrast={handleToggleContrast}
          />

          {/* Dynamic Citizen Views */}
          <main className="flex-1 pt-16 flex flex-col">
            {citizenTab === 'beranda' && (
              <BerandaView
                reports={reports}
                onNavigateToLapor={() => setCitizenTab('lapor')}
                onNavigateToLacak={reportId => {
                  if (reportId) setSelectedReportId(reportId);
                  setCitizenTab('lacak');
                }}
                onOpenSawModal={() => setIsSawModalOpen(true)}
              />
            )}

            {citizenTab === 'lapor' && (
              <BuatLaporanView
                onSubmitReport={handleAddNewReport}
                onCancel={() => setCitizenTab('beranda')}
              />
            )}

            {citizenTab === 'lacak' && (
              <LacakLaporanView
                reports={reports}
                initialSearchId={selectedReportId}
                onNavigateToLaporWithLocation={loc => {
                  setCitizenTab('lapor');
                }}
                onOpenSawModal={() => setIsSawModalOpen(true)}
              />
            )}
          </main>

          {/* Citizen Fixed Bottom Navigation Bar */}
          <BottomNav currentTab={citizenTab} onTabChange={setCitizenTab} />

          {/* Modal: SAW Formula & Weight Methodology */}
          <SawExplainerModal
            isOpen={isSawModalOpen}
            onClose={() => setIsSawModalOpen(false)}
          />
        </div>
      )}

      {/* =========================================================================
          PORTAL 2: ADMIN DINAS PUPR PORTAL (https://admin.suararuang.kebumenkab.go.id/admin)
          ========================================================================= */}
      {currentPortal === 'admin' && (
        <div className="w-full max-w-md bg-[#faf8ff] min-h-[calc(100vh-32px)] flex flex-col relative mx-auto shadow-2xl border-x border-[#eaedff]">
          {!isAdminLoggedIn ? (
            <AdminLogin
              onLoginSuccess={handleAdminLoginSuccess}
              onBackToCitizen={() => navigatePortal('citizen')}
            />
          ) : (
            <AdminPortal
              reports={reports}
              onUpdateReportStatus={handleUpdateStatus}
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
