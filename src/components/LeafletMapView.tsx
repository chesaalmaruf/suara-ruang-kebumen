import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ReportItem } from '../types';

interface LeafletMapViewProps {
  reports: ReportItem[];
  heightClass?: string;
  isPickerMode?: boolean;
  selectedCoordinates?: { lat: number; lng: number };
  onPickCoordinates?: (coords: { lat: number; lng: number }, name: string) => void;
  onSelectReport?: (reportId: string) => void;
  geofenceRadiusMeters?: number;
  showClusters?: boolean;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  reports,
  heightClass = 'h-72',
  isPickerMode = false,
  selectedCoordinates,
  onPickCoordinates,
  onSelectReport,
  geofenceRadiusMeters = 20,
  showClusters = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userTrackingMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Keep refs updated for event handlers
  const onPickCoordinatesRef = useRef(onPickCoordinates);
  onPickCoordinatesRef.current = onPickCoordinates;
  const isPickerModeRef = useRef(isPickerMode);
  isPickerModeRef.current = isPickerMode;
  const onSelectReportRef = useRef(onSelectReport);
  onSelectReportRef.current = onSelectReport;

  // Default coordinates centered on Alun-Alun Kebumen
  const KEBUMEN_CENTER = { lat: -7.6748, lng: 109.6575 };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const initialCoords = selectedCoordinates || KEBUMEN_CENTER;
    const map = L.map(mapContainerRef.current, {
      center: [initialCoords.lat, initialCoords.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // Add standard OpenStreetMap tiles (free, reliable, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add custom zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Invalidate size to guarantee full tile coverage immediately
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Handle container resize (e.g. tab switches, keyboard, orientation)
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    // Handle map clicks in picker mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isPickerModeRef.current && onPickCoordinatesRef.current) {
        const { lat, lng } = e.latlng;
        onPickCoordinatesRef.current(
          { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) },
          `Koordinat Peta (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        );
      }
    });

    return () => {
      resizeObserver.disconnect();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when reports or picker changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Render reports as markers
    reports.forEach(report => {
      const isCritical = report.severity === 'critical' || report.sawScores.totalSaw >= 0.85;
      const isProgress = report.status === 'in_progress';
      const isCompleted = report.status === 'completed';

      const colorClass = isCritical
        ? '#ba1a1a'
        : isProgress
        ? '#006496'
        : isCompleted
        ? '#005713'
        : '#0f4c81';

      const iconHtml = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          ${
            isCritical
              ? `<span style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: ${colorClass}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
              : ''
          }
          <div style="width: 28px; height: 28px; border-radius: 9999px; background: ${colorClass}; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 11px;">
            ${
              isCritical
                ? '⚠️'
                : isProgress
                ? '🛠️'
                : isCompleted
                ? '✓'
                : '📍'
            }
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-marker',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([report.coordinates.lat, report.coordinates.lng], {
        icon: customIcon,
      });

      // Geofence radius circle if requested or for clusters
      if (geofenceRadiusMeters > 0) {
        L.circle([report.coordinates.lat, report.coordinates.lng], {
          radius: geofenceRadiusMeters,
          color: colorClass,
          fillColor: colorClass,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4',
        }).addTo(markersLayer);
      }

      // Popup content with interactive track button
      const cleanId = report.id.replace(/[^a-zA-Z0-9]/g, '');
      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px; min-width: 180px;">
          <div style="font-size: 10px; font-weight: 800; color: ${colorClass}; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${report.id} • Skor SAW: ${report.sawScores.totalSaw.toFixed(3)}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #131b2e; margin-bottom: 4px; line-height: 1.3;">
            ${report.title}
          </div>
          <div style="font-size: 11px; color: #42474f; margin-bottom: 8px;">
            ${report.address}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="background: #eaedff; color: #00355f; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 10px;">
              ${report.statusLabel}
            </span>
          </div>
          <button 
            type="button" 
            id="lacak-btn-${cleanId}"
            style="width: 100%; background: #00355f; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: background 0.2s;"
            onmouseover="this.style.background='#006496'"
            onmouseout="this.style.background='#00355f'"
          >
            <span>Lihat Linimasa Laporan</span>
            <span style="font-size: 13px;">&rarr;</span>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });

      marker.on('popupopen', () => {
        const popupEl = marker.getPopup()?.getElement();
        if (popupEl) {
          const btn = popupEl.querySelector(`#lacak-btn-${cleanId}`);
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              if (onSelectReportRef.current) {
                onSelectReportRef.current(report.id);
              }
            });
          }
        }
      });

      marker.addTo(markersLayer);
    });

    // In picker mode, render designated picked coordinates
    if (isPickerMode && selectedCoordinates) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([selectedCoordinates.lat, selectedCoordinates.lng]);
      } else {
        const pickerIcon = L.divIcon({
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
              <div style="width: 32px; height: 32px; border-radius: 9999px; background: #00355f; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); border: 3px solid white; font-size: 14px;">
                📍
              </div>
              <span style="background: #131b2e; color: white; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; margin-top: 2px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                Titik Dipilih
              </span>
            </div>
          `,
          className: 'picker-marker',
          iconSize: [40, 50],
          iconAnchor: [20, 36],
        });

        const newPickerMarker = L.marker([selectedCoordinates.lat, selectedCoordinates.lng], {
          icon: pickerIcon,
          draggable: true,
        }).addTo(map);

        newPickerMarker.on('dragend', e => {
          const target = e.target;
          const position = target.getLatLng();
          if (onPickCoordinatesRef.current) {
            onPickCoordinatesRef.current(
              { lat: Number(position.lat.toFixed(5)), lng: Number(position.lng.toFixed(5)) },
              `Koordinat Geser (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`
            );
          }
        });

        pickerMarkerRef.current = newPickerMarker;
      }
    }
  }, [reports, isPickerMode, selectedCoordinates, geofenceRadiusMeters]);

  // Live Real-Time GPS Tracking function
  const handleToggleTracking = () => {
    if (!navigator.geolocation) {
      setTrackingStatus('GPS tidak didukung pada browser ini.');
      setTimeout(() => setTrackingStatus(null), 3000);
      return;
    }

    if (isLiveTracking) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
      setTrackingStatus('Pelacakan area dihentikan.');
      if (userTrackingMarkerRef.current) userTrackingMarkerRef.current.remove();
      if (userAccuracyCircleRef.current) userAccuracyCircleRef.current.remove();
      setTimeout(() => setTrackingStatus(null), 2000);
      return;
    }

    // Start live tracking
    setIsLiveTracking(true);
    setTrackingStatus('Mengunci sinyal GPS lokasi Anda...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        const map = mapInstanceRef.current;
        if (!map) return;

        setTrackingStatus(`Lokasi Terkunci (Akurasi: ±${Math.round(accuracy)}m)`);

        // Update or create user location marker
        if (!userTrackingMarkerRef.current) {
          const userIcon = L.divIcon({
            html: `
              <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                <span style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background: #0284c7; opacity: 0.5; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                <div style="width: 14px; height: 14px; border-radius: 9999px; background: #0284c7; border: 2.5px solid white; box-shadow: 0 0 10px rgba(2, 132, 199, 0.6);"></div>
              </div>
            `,
            className: 'user-gps-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userTrackingMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
          userAccuracyCircleRef.current = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#0284c7',
            fillColor: '#0284c7',
            fillOpacity: 0.1,
            weight: 1,
          }).addTo(map);

          map.setView([latitude, longitude], 17, { animate: true });
        } else {
          userTrackingMarkerRef.current.setLatLng([latitude, longitude]);
          if (userAccuracyCircleRef.current) {
            userAccuracyCircleRef.current.setLatLng([latitude, longitude]);
            userAccuracyCircleRef.current.setRadius(accuracy);
          }
        }

        if (isPickerMode && onPickCoordinates) {
          onPickCoordinates(
            { lat: Number(latitude.toFixed(5)), lng: Number(longitude.toFixed(5)) },
            `Lokasi GPS Saya (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          );
        }
      },
      error => {
        console.warn('Geolocation error:', error);
        setTrackingStatus('Gagal mengambil GPS. Menampilkan area Kebumen.');
        setTimeout(() => setTrackingStatus(null), 3000);
        setIsLiveTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCenterKebumen = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([KEBUMEN_CENTER.lat, KEBUMEN_CENTER.lng], 16, { animate: true });
    }
  };

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden shadow-inner border border-[#c2c7d1]/50 bg-[#e2e7ff]`}>
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="bg-[#faf8ff]/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1.5 border border-white/60 pointer-events-auto">
          <span className="material-symbols-outlined text-[15px] text-[#00355f]">explore</span>
          <span className="text-[11px] text-[#131b2e] font-extrabold">
            Peta Geospasial Kebumen
          </span>
        </div>

        {trackingStatus && (
          <div className="bg-[#131b2e]/90 text-white text-[10px] px-2.5 py-0.5 rounded-lg shadow-sm font-medium animate-fade-in pointer-events-auto">
            {trackingStatus}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
        {/* Live GPS Area Tracking Button */}
        <button
          type="button"
          onClick={handleToggleTracking}
          title="Lacak Lokasi Real-Time Saya"
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 ${
            isLiveTracking
              ? 'bg-[#ba1a1a] text-white animate-pulse'
              : 'bg-white hover:bg-[#eaedff] text-[#00355f]'
          }`}
        >
          <span className="material-symbols-outlined text-[19px]">
            {isLiveTracking ? 'gps_fixed' : 'my_location'}
          </span>
        </button>

        {/* Reset View to Alun-Alun Kebumen */}
        <button
          type="button"
          onClick={handleCenterKebumen}
          title="Pusatkan ke Alun-Alun Kebumen"
          className="w-9 h-9 rounded-xl bg-white hover:bg-[#eaedff] text-[#00355f] flex items-center justify-center shadow-md transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[19px]">pin_drop</span>
        </button>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-2 left-2 z-10 bg-[#faf8ff]/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-bold text-[#131b2e] flex items-center gap-2 shadow-xs border border-white/60 pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span> Kritis
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#006496]"></span> Proses
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#005713]"></span> Tuntas
        </span>
        <span className="text-[#42474f] font-mono">Geofence: {geofenceRadiusMeters}m</span>
      </div>
    </div>
  );
};
