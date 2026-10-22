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
  const citizenUrl = 'suararuang.kebumenkab.go.id';
  const adminUrl = 'admin-suararuang.kebumenkab.go.id/admin';

  const isConnected = dbStatus?.connected;

  return (
    <div className="bg-[#131b2e] text-white px-3 py-1.5 flex items-center justify-between text-[11px] border-b border-white/10 z-50">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-[#a3f69c] animate-pulse"></span>
        <span className="font-mono text-[#a0c9ff] truncate font-semibold">
          {currentPortal === 'citizen' ? `https://${citizenUrl}` : `https://${adminUrl}`}
        </span>

        {/* Database Status Indicator Pill */}
        {dbStatus && (
          <div
            title={dbStatus.message}
            className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border ${
              isConnected
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span>{isConnected ? '🍃 MongoDB Atlas: Live' : '🍃 Local Storage'}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onSwitchPortal('citizen')}
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
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
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
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
