import React from 'react';

interface BottomNavProps {
  currentTab: 'beranda' | 'lapor' | 'lacak';
  onTabChange: (tab: 'beranda' | 'lapor' | 'lacak') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#faf8ff]/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.06)] border-t border-[#eaedff]"
      aria-label="Navigasi Utama"
    >
      <div className="grid grid-cols-3 items-center h-16 max-w-md mx-auto px-2 relative">
        {/* Tab 1: Beranda */}
        <button
          onClick={() => onTabChange('beranda')}
          aria-current={currentTab === 'beranda' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors focus:outline-none ${
            currentTab === 'beranda'
              ? 'text-[#00355f] font-bold'
              : 'text-[#42474f] hover:text-[#00355f]'
          }`}
        >
          <div
            className={`flex items-center justify-center p-1 rounded-full ${
              currentTab === 'beranda' ? 'bg-[#cce5ff]/60' : ''
            }`}
          >
            <span
              className={`material-symbols-outlined text-[23px] ${
                currentTab === 'beranda' ? 'fill-1' : ''
              }`}
            >
              home
            </span>
          </div>
          <span className="text-[11px] font-semibold leading-tight">Beranda</span>
        </button>

        {/* Tab 2: Lapor (Elevated Tactile Center Button) */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            onClick={() => onTabChange('lapor')}
            aria-label="Buat Laporan Kerusakan Trotoar Baru"
            className="w-13 h-13 rounded-full bg-[#00355f] hover:bg-[#006496] text-white flex items-center justify-center shadow-lg shadow-[#00355f]/25 focus:ring-4 focus:ring-[#d2e4ff] focus:outline-none transition-all active:scale-95 group"
          >
            <span className="material-symbols-outlined text-[26px] group-hover:rotate-12 transition-transform">
              add_a_photo
            </span>
          </button>
          <span
            className={`text-[11px] mt-1 font-bold leading-none ${
              currentTab === 'lapor' ? 'text-[#00355f]' : 'text-[#42474f]'
            }`}
          >
            Lapor
          </span>
        </div>

        {/* Tab 3: Lacak */}
        <button
          onClick={() => onTabChange('lacak')}
          aria-current={currentTab === 'lacak' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors focus:outline-none ${
            currentTab === 'lacak'
              ? 'text-[#00355f] font-bold'
              : 'text-[#42474f] hover:text-[#00355f]'
          }`}
        >
          <div
            className={`flex items-center justify-center p-1 rounded-full ${
              currentTab === 'lacak' ? 'bg-[#cce5ff]/60' : ''
            }`}
          >
            <span
              className={`material-symbols-outlined text-[23px] ${
                currentTab === 'lacak' ? 'fill-1' : ''
              }`}
            >
              fact_check
            </span>
          </div>
          <span className="text-[11px] font-semibold leading-tight">Lacak</span>
        </button>
      </div>
    </nav>
  );
};
