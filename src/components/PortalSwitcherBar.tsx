import React from 'react';
import { Database, Globe, ShieldCheck } from 'lucide-react';
import { DatabaseStatus } from '../services/reportService';

interface PortalSwitcherBarProps {
  currentPortal: 'citizen' | 'admin';
  onSwitchPortal: (portal: 'citizen' | 'admin') => void;
  dbStatus?: DatabaseStatus;
}

export const PortalSwitcherBar: React.FC<PortalSwitcherBarProps> = ({
  currentPortal,
  onSwitchPortal,
  dbStatus,
}) => {
  const isConnected = dbStatus?.connected;
  const currentPath = currentPortal === 'citizen' ? '/' : '/admin';
  const currentHost =
    typeof window !== 'undefined'
      ? `${window.location.host}${currentPath}`
      : `suara-ruang-kebumen.vercel.app${currentPath}`;

  return (
    <div className="bg-[#0B192C] text-slate-200 px-3 sm:px-6 h-9 flex items-center justify-between gap-3 text-xs border-b border-white/10 z-50 print:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-[11px] text-slate-300 truncate">
          {currentHost}
        </span>

        {dbStatus && (
          <>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span
              title={dbStatus.message}
              className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap shrink-0 ${
                isConnected
                  ? 'text-emerald-300'
                  : dbStatus.status === 'error'
                  ? 'text-red-300'
                  : 'text-amber-300'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>
                {isConnected
                  ? 'MongoDB Atlas Terhubung'
                  : dbStatus.status === 'error'
                  ? 'Gangguan Koneksi Database'
                  : 'Penyimpanan Lokal'}
              </span>
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-md shrink-0">
        <button
          type="button"
          onClick={() => onSwitchPortal('citizen')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
            currentPortal === 'citizen'
              ? 'bg-white text-[#0B192C]'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>Portal Warga</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitchPortal('admin')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
            currentPortal === 'admin'
              ? 'bg-[#005187] text-white'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Admin PUPR</span>
        </button>
      </div>
    </div>
  );
};
