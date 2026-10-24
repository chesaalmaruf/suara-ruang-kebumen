import React from 'react';
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
    <div className="bg-[#131b2e] text-white px-3 py-1.5 flex items-center justify-between text-[11px] border-b border-white/10 z-50">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-[#a3f69c] animate-pulse"></span>
        <span className="font-mono text-[#a0c9ff] truncate font-semibold">
          https://{currentHost}
        </span>

        {/* Database Status Indicator Pill */}
        {dbStatus && (
          <div
            title={dbStatus.message}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border shrink-0 ${
              isConnected
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : dbStatus.status === 'error'
                ? 'bg-red-950/60 text-red-300 border-red-500/40'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-400'
                  : dbStatus.status === 'error'
                  ? 'bg-red-400'
                  : 'bg-amber-400'
              }`}
            ></span>
            <span>
              {isConnected
                ? '🍃 MongoDB Atlas: Live'
                : dbStatus.status === 'error'
                ? '⚠️ MongoDB Error'
                : '🍃 Local Storage'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onSwitchPortal('citizen')}
          className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
            currentPortal === 'citizen'
              ? 'bg-[#006496] text-white shadow-xs'
              : 'text-[#a0c9ff] hover:text-white'
          }`}
        >
          Portal Warga (/)
        </button>

        <span className="text-white/30">|</span>

        <button
          onClick={() => onSwitchPortal('admin')}
          className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
            currentPortal === 'admin'
              ? 'bg-[#ba1a1a] text-white shadow-xs'
              : 'text-[#a0c9ff] hover:text-white'
          }`}
        >
          Admin PUPR (/admin)
        </button>
      </div>
    </div>
  );
};
