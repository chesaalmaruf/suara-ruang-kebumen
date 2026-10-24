import React from 'react';

interface HeaderProps {
  currentTab: 'beranda' | 'lapor' | 'lacak';
  onTabChange: (tab: 'beranda' | 'lapor' | 'lacak') => void;
  isHighContrast: boolean;
  onToggleContrast: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  isHighContrast,
  onToggleContrast,
}) => {
  const getTitle = () => {
    switch (currentTab) {
      case 'beranda':
        return 'Beranda';
      case 'lapor':
        return 'Buat Laporan';
      case 'lacak':
        return 'Lacak Laporan';
      default:
        return 'Beranda';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#faf8ff]/95 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#eaedff]">
      <div className="h-16 px-4 flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {currentTab !== 'beranda' && (
            <button
              aria-label="Kembali ke Beranda"
              onClick={() => onTabChange('beranda')}
              className="w-10 h-10 -ml-1 rounded-xl flex items-center justify-center text-[#131b2e] hover:bg-[#eaedff] active:bg-[#dae2fd] transition-colors focus:ring-2 focus:ring-[#006496] focus:outline-none"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          )}

          {/* Logo Badge */}
          <div className="h-10 w-10 rounded-xl bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs border border-[#eaedff] overflow-hidden">
            <img
              src="/assets/aistudio/logo_7cbe31cf.png"
              alt="Logo Suara Ruang Kebumen"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#00355f] font-extrabold uppercase tracking-widest truncate">
                SUARA RUANG
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#eaedff] text-[#006496] font-semibold">
                KEBUMEN
              </span>
            </div>
            <h1 className="text-[16px] font-bold text-[#131b2e] truncate leading-tight">
              {getTitle()}
            </h1>
          </div>
        </div>

        {/* Right Accessibility & Mode Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* High Contrast Toggle */}
          <button
            aria-label="Mode Kontras Tinggi"
            title="Kontras Tinggi"
            onClick={onToggleContrast}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors focus:ring-2 focus:ring-[#006496] focus:outline-none ${
              isHighContrast
                ? 'bg-[#131b2e] text-[#a3f69c] ring-2 ring-[#a3f69c]'
                : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">contrast</span>
          </button>
        </div>
      </div>
    </header>
  );
};
