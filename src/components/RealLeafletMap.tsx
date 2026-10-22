import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ReportItem } from '../types';

interface RealLeafletMapProps {
  reports?: ReportItem[];
  center?: [number, number];
  zoom?: number;
  heightClass?: string;
  isPickerMode?: boolean;
  onPickLocation?: (coords: { lat: number; lng: number }, label: string) => void;
  onSelectReport?: (reportId: string) => void;
  showClusters?: boolean;
  geofenceRadiusMeters?: number; // 10, 20, 50
  activeReportId?: string;
}

export const RealLeafletMap: React.FC<RealLeafletMapProps> = ({
  reports = [],
  center = [-7.6748, 109.6575], // Alun-Alun Kebumen
  zoom = 15,
  heightClass = 'h-72',
  isPickerMode = false,
  onPickLocation,
  onSelectReport,
  showClusters = false,
  geofenceRadiusMeters = 20,
  activeReportId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent re-initialization if already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add high-resolution OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Add zoom control at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Handle map clicks in picker mode
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!isPickerMode) return;
        const { lat, lng } = e.latlng;
        const roundedLat = Number(lat.toFixed(5));
        const roundedLng = Number(lng.toFixed(5));

        if (pickerMarkerRef.current) {
          pickerMarkerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          const pickerIcon = L.divIcon({
            className: 'custom-picker-pin',
            html: `
              <div style="transform: translate(-50%, -100%);">
                <div style="background: #00355f; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid white;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">pin_drop</span>
                </div>
              </div>
            `,
            iconSize: [0, 0],
          });
          pickerMarkerRef.current = L.marker([roundedLat, roundedLng], {
            icon: pickerIcon,
            draggable: true,
          }).addTo(map);

          pickerMarkerRef.current.on('dragend', () => {
            const pos = pickerMarkerRef.current!.getLatLng();
            if (onPickLocation) {
              onPickLocation(
                { lat: Number(pos.lat.toFixed(5)), lng: Number(pos.lng.toFixed(5)) },
                `Koordinat Peta (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`
              );
            }
          });
        }

        if (onPickLocation) {
          onPickLocation(
            { lat: roundedLat, lng: roundedLng },
            `Titik Lokasi Terpilih (${roundedLat}, ${roundedLng})`
          );
        }
      });
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and geofences when reports or props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Render reports
    reports.forEach(report => {
      const isCritical = report.status === 'submitted' || report.sawScores.c1Safety > 0.85;
      const isInProgress = report.status === 'in_progress' || report.status === 'verified';
      const isCompleted = report.status === 'completed';
      const isSelected = activeReportId === report.id;

      let bgColor = '#ba1a1a';
      let iconName = 'warning';
      if (isInProgress) {
        bgColor = '#006496';
        iconName = 'construction';
      } else if (isCompleted) {
        bgColor = '#005713';
        iconName = 'check_circle';
      }

      // Styled custom marker icon
      const customIcon = L.divIcon({
        className: 'custom-civic-pin',
        html: `
          <div style="transform: translate(-50%, -50%); cursor: pointer;">
            <div style="position: relative; width: ${isSelected ? '36px' : '30px'}; height: ${
          isSelected ? '36px' : '30px'
        }; border-radius: 50%; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid white; transition: all 0.2s;">
              <span class="material-symbols-outlined" style="font-size: ${
                isSelected ? '20px' : '16px'
              }; line-height: 1;">${iconName}</span>
              ${
                isCritical
                  ? `<span style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid ${bgColor}; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
                  : ''
              }
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([report.coordinates.lat, report.coordinates.lng], {
        icon: customIcon,
      }).addTo(markersLayer);

      marker.on('click', () => {
        if (onSelectReport) {
          onSelectReport(report.id);
        }
      });

      // Bind tooltip popup
      marker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; font-weight: bold; padding: 2px 4px;">
          <div>${report.placeName}</div>
          <div style="font-size: 10px; color: #006496; font-weight: normal;">Skor SAW: ${report.sawScores.totalSaw.toFixed(
            3
          )}</div>
        </div>`,
        { direction: 'top', offset: [0, -16] }
      );
    });

    // If geofencing/clustering is active (e.g. for Admin Portal)
    if (showClusters) {
      // Cluster 1: Simpang RSUD Dr. Soedirman
      const rsudCenter: [number, number] = [-7.6832, 109.6641];
      L.circle(rsudCenter, {
        color: '#ba1a1a',
        fillColor: '#ba1a1a',
        fillOpacity: 0.2,
        radius: geofenceRadiusMeters,
      }).addTo(markersLayer);

      const clusterIcon = L.divIcon({
        className: 'custom-cluster-badge',
        html: `
          <div style="transform: translate(-50%, -50%);">
            <div style="background: #ba1a1a; color: white; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap;">
              ▲ 4 Laporan (RSUD)
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });
      L.marker(rsudCenter, { icon: clusterIcon }).addTo(markersLayer);

      // Cluster 2: Jl. Pahlawan Alun-Alun
      const pahlawanCenter: [number, number] = [-7.6748, 109.6575];
      L.circle(pahlawanCenter, {
        color: '#006496',
        fillColor: '#006496',
        fillOpacity: 0.15,
        radius: geofenceRadiusMeters,
      }).addTo(markersLayer);
    }
  }, [reports, showClusters, geofenceRadiusMeters, activeReportId]);

  // Live GPS Tracking Handler
  const handleLiveTracking = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung Geolocation.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const coords = { lat: Number(latitude.toFixed(5)), lng: Number(longitude.toFixed(5)) };
        setUserLocation(coords);

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([coords.lat, coords.lng], 16, { duration: 1.2 });

          // Remove old user marker if any
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove();
          }

          const userIcon = L.divIcon({
            className: 'user-gps-pulse',
            html: `
              <div style="transform: translate(-50%, -50%);">
                <div style="width: 22px; height: 22px; border-radius: 50%; background: #0284c7; border: 3px solid white; box-shadow: 0 0 12px rgba(2,132,199,0.8); position: relative;">
                  <span style="position: absolute; inset: -8px; border-radius: 50%; background: #0284c7; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                </div>
              </div>
            `,
            iconSize: [0, 0],
          });

          userLocationMarkerRef.current = L.marker([coords.lat, coords.lng], {
            icon: userIcon,
          }).addTo(map);

          userLocationMarkerRef.current.bindTooltip(
            `<div style="font-size: 11px; font-weight: bold;">Lokasi Anda (Akurasi ±${Math.round(
              accuracy
            )}m)</div>`,
            { permanent: false, direction: 'top' }
          );

          if (isPickerMode && onPickLocation) {
            onPickLocation(coords, `Lokasi GPS Saya (${coords.lat}, ${coords.lng})`);
          }
        }
      },
      err => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        // Fallback to center of Kebumen
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo(center, 15);
        }
        setGpsError('Izin GPS tidak aktif / simulasi koordinat Alun-Alun Kebumen.');
        setTimeout(() => setGpsError(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden shadow-inner border border-[#eaedff]`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* District / Coordinate Badge */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 z-10 border border-black/5">
        <span className="material-symbols-outlined text-[16px] text-[#00355f]">location_on</span>
        <span className="text-[11px] text-[#131b2e] font-bold">
          Kebumen, Gombong, Karanganyar
        </span>
      </div>

      {/* Live GPS Area Tracking Floating Button */}
      <button
        type="button"
        onClick={handleLiveTracking}
        aria-label="Lacak Posisi Saya Sekarang"
        title="Lacak Posisi Saya (GPS Real-Time)"
        className={`absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95 ${
          isLocating
            ? 'bg-[#00355f] text-white animate-pulse'
            : 'bg-white hover:bg-[#eaedff] text-[#00355f] border border-[#eaedff]'
        }`}
      >
        <span className="material-symbols-outlined text-[17px] text-[#006496]">
          {isLocating ? 'radar' : 'my_location'}
        </span>
        <span>{isLocating ? 'Mencari GPS...' : 'Lacak GPS'}</span>
      </button>

      {/* GPS Error Notification if any */}
      {gpsError && (
        <div className="absolute bottom-12 inset-x-4 z-20 bg-[#131b2e]/90 text-white text-[11px] px-3 py-1.5 rounded-lg text-center backdrop-blur-sm animate-fade-in">
          {gpsError}
        </div>
      )}

      {/* Interactive Picker Instruction Overlay */}
      {isPickerMode && (
        <div className="absolute bottom-2 inset-x-3 z-10 bg-white/95 backdrop-blur-md p-2 rounded-xl text-center shadow-md border border-[#eaedff]">
          <span className="text-[11px] font-bold text-[#00355f] flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">touch_app</span>
            Ketuk peta untuk menentukan titik kerusakan trotoar
          </span>
        </div>
      )}
    </div>
  );
};
