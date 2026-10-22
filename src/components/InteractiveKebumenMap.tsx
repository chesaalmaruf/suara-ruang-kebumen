import React, { useState } from 'react';
import { ReportItem } from '../types';

interface InteractiveKebumenMapProps {
  reports: ReportItem[];
  onSelectReport?: (reportId: string) => void;
  heightClass?: string;
  isPickerMode?: boolean;
  onPickCoordinates?: (coords: { lat: number; lng: number }, name: string) => void;
  selectedCoordinates?: { lat: number; lng: number };
}

interface MapPin {
  id: string;
  name: string;
  desc: string;
  tag: string;
  type: 'critical' | 'in_progress' | 'completed';
  top: string;
  left: string;
  scoreText: string;
}

export const InteractiveKebumenMap: React.FC<InteractiveKebumenMapProps> = ({
  reports,
  onSelectReport,
  heightClass = 'h-72',
  isPickerMode = false,
  onPickCoordinates,
  selectedCoordinates,
}) => {
  // Default pins positioned over stylized Alun-Alun Kebumen and surrounding corridors
  const pins: MapPin[] = [
    {
      id: '#KBM-2025-0842',
      name: 'Jl. Pahlawan (Depan Masjid Agung)',
      desc: 'Guiding block amblas & lubang drainase tanpa penutup',
      tag: 'Prioritas 1',
      type: 'critical',
      top: '32%',
      left: '38%',
      scoreText: '0.892 (Prioritas 1)',
    },
    {
      id: '#KBM-2024-089',
      name: 'Jl. Pemuda (Area Bank Jateng)',
      desc: 'Pemasangan ramp kursi roda & relokasi pot penghalang',
      tag: 'Diproses PUPR',
      type: 'in_progress',
      top: '52%',
      left: '68%',
      scoreText: '0.942 (Diproses PUPR)',
    },
    {
      id: '#KBM-2024-055',
      name: 'Kawasan Alun-Alun Barat',
      desc: 'Jalur pemandu disabilitas netra baru terhubung ke selter bus',
      tag: 'Tuntas 100%',
      type: 'completed',
      top: '74%',
      left: '48%',
      scoreText: 'Tuntas 100%',
    },
  ];

  const [activePin, setActivePin] = useState<MapPin>(pins[2]);
  const [pickerPos, setPickerPos] = useState({ x: 50, y: 50 });

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPickerMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPickerPos({ x, y });

    // Approximate Kebumen lat/lng coordinate mapping based on click
    const approxLat = Number((-7.6748 + (y - 50) * 0.001).toFixed(4));
    const approxLng = Number((109.6575 + (x - 50) * 0.001).toFixed(4));

    if (onPickCoordinates) {
      onPickCoordinates(
        { lat: approxLat, lng: approxLng },
        `Titik Peta Pejalan Kaki (${approxLat}, ${approxLng})`
      );
    }
  };

  return (
    <div
      onClick={handleMapClick}
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden bg-gradient-to-br from-[#131b2e] via-[#0f4c81] to-[#00355f] shadow-inner select-none cursor-pointer group`}
    >
      {/* Visual GIS Grid & Stylized Streets */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle grid pattern */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              strokeOpacity="0.2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Luk Ulo River line representation */}
        <path
          d="M -10,120 Q 80,180 150,150 T 280,240 T 420,290"
          fill="none"
          stroke="#7fc5fd"
          strokeWidth="6"
          strokeOpacity="0.45"
          strokeLinecap="round"
        />

        {/* Main Corridors (Jl. Veteran, Jl. Pahlawan, Jl. Pemuda) */}
        <line x1="0" y1="110" x2="420" y2="110" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.3" />
        <line x1="160" y1="0" x2="160" y2="350" stroke="#ffffff" strokeWidth="4" strokeOpacity="0.3" />
        <line x1="280" y1="40" x2="280" y2="350" stroke="#7fc5fd" strokeWidth="2.5" strokeOpacity="0.3" />

        {/* Central Park / Alun-Alun Square */}
        <rect
          x="130"
          y="85"
          width="70"
          height="60"
          rx="8"
          fill="#005713"
          fillOpacity="0.4"
          stroke="#a3f69c"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
        <text x="140" y="120" fill="#a3f69c" fontSize="10" fontWeight="bold" opacity="0.8">
          ALUN-ALUN
        </text>
      </svg>

      {/* District Badge Overlay */}
      <div className="absolute top-3 left-3 bg-[#faf8ff]/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 z-10 border border-white/20">
        <span className="material-symbols-outlined text-[16px] text-[#00355f]">near_me</span>
        <span className="text-[11px] text-[#131b2e] font-bold">
          Kebumen, Gombong, Karanganyar
        </span>
      </div>

      {/* Geofence / Compass Indicator */}
      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white flex items-center gap-1 z-10">
        <span className="material-symbols-outlined text-[14px] text-[#7fc5fd]">gps_fixed</span>
        <span className="font-mono">7.674°S, 109.657°E</span>
      </div>

      {/* Render Interactive Hotspots in Standard Mode */}
      {!isPickerMode &&
        pins.map(pin => {
          const isSelected = activePin.id === pin.id;

          if (pin.type === 'critical') {
            return (
              <button
                key={pin.id}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setActivePin(pin);
                }}
                style={{ top: pin.top, left: pin.left }}
                aria-label={pin.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-20"
              >
                <span className="relative flex h-10 w-10 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ba1a1a] opacity-75"></span>
                  <span
                    className={`relative inline-flex items-center justify-center rounded-full h-8 w-8 bg-[#ba1a1a] text-white shadow-lg transition-transform ${
                      isSelected ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                  </span>
                </span>
              </button>
            );
          }

          if (pin.type === 'in_progress') {
            return (
              <button
                key={pin.id}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setActivePin(pin);
                }}
                style={{ top: pin.top, left: pin.left }}
                aria-label={pin.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-20"
              >
                <span className="relative flex h-9 w-9 items-center justify-center">
                  <span
                    className={`relative inline-flex items-center justify-center rounded-full h-7 w-7 bg-[#006496] text-white shadow-md transition-transform ${
                      isSelected ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">construction</span>
                  </span>
                </span>
              </button>
            );
          }

          return (
            <button
              key={pin.id}
              type="button"
              onClick={e => {
                e.stopPropagation();
                setActivePin(pin);
              }}
              style={{ top: pin.top, left: pin.left }}
              aria-label={pin.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-20"
            >
              <span className="relative flex h-9 w-9 items-center justify-center">
                <span
                  className={`relative inline-flex items-center justify-center rounded-full h-7 w-7 bg-[#005713] text-[#a3f69c] shadow-md transition-transform ${
                    isSelected ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                </span>
              </span>
            </button>
          );
        })}

      {/* Picker Marker in Picker Mode */}
      {isPickerMode && (
        <div
          style={{ top: `${pickerPos.y}%`, left: `${pickerPos.x}%` }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex flex-col items-center"
        >
          <div className="w-8 h-8 rounded-full bg-[#00355f] text-white flex items-center justify-center shadow-xl ring-4 ring-white animate-bounce">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
          </div>
          <span className="bg-[#131b2e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 shadow-md whitespace-nowrap">
            Titik Terpilih
          </span>
        </div>
      )}

      {/* Active Pin Interactive Detail Card in Standard Mode */}
      {!isPickerMode && activePin && (
        <div
          onClick={e => {
            e.stopPropagation();
            if (onSelectReport) onSelectReport(activePin.id);
          }}
          className="absolute inset-x-3 bottom-3 bg-[#faf8ff]/95 backdrop-blur-md rounded-xl p-3 shadow-lg flex items-center justify-between transition-all z-30 border border-white/50 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                activePin.type === 'critical'
                  ? 'bg-[#ffdad6] text-[#93000a]'
                  : activePin.type === 'in_progress'
                  ? 'bg-[#7fc5fd]/30 text-[#00517b]'
                  : 'bg-[#a3f69c] text-[#002204]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {activePin.type === 'critical'
                  ? 'report_problem'
                  : activePin.type === 'in_progress'
                  ? 'engineering'
                  : 'task_alt'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[13px] font-bold text-[#131b2e] truncate">
                {activePin.name}
              </p>
              <p className="text-[11px] text-[#42474f] truncate">
                {activePin.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
            <span
              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${
                activePin.type === 'critical'
                  ? 'bg-[#ffdad6] text-[#ba1a1a]'
                  : activePin.type === 'in_progress'
                  ? 'bg-[#eaedff] text-[#006496]'
                  : 'bg-[#eaedff] text-[#005713]'
              }`}
            >
              {activePin.scoreText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
