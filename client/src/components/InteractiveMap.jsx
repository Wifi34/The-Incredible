import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Flame,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Eye,
  Zap,
  MapPin,
  Compass
} from 'lucide-react';

// Helper to determine category icon, color palette and label
export const getCategoryMeta = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('pothole') || cat.includes('road')) {
    return {
      key: 'Pothole',
      label: 'Pothole & Road Damage',
      symbol: '🚧',
      iconEmoji: '🚧',
      color: '#e11d48', // Rose 600
      glowColor: 'rgba(225, 29, 72, 0.35)',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      pillActive: 'bg-rose-600 text-white shadow-rose-500/20'
    };
  }
  if (cat.includes('garbage') || cat.includes('dump') || cat.includes('waste') || cat.includes('sanitation')) {
    return {
      key: 'Garbage',
      label: 'Garbage & Sanitation',
      symbol: '🗑️',
      iconEmoji: '🗑️',
      color: '#ea580c', // Orange 600
      glowColor: 'rgba(234, 88, 12, 0.35)',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
      pillActive: 'bg-orange-600 text-white shadow-orange-500/20'
    };
  }
  if (cat.includes('light') || cat.includes('lamp') || cat.includes('electric')) {
    return {
      key: 'Streetlight',
      label: 'Broken Streetlight',
      symbol: '💡',
      iconEmoji: '💡',
      color: '#d97706', // Amber 600
      glowColor: 'rgba(217, 119, 6, 0.35)',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      pillActive: 'bg-amber-600 text-white shadow-amber-500/20'
    };
  }
  if (cat.includes('drain') || cat.includes('water') || cat.includes('sewage') || cat.includes('leak')) {
    return {
      key: 'Drainage',
      label: 'Drainage & Water Defect',
      symbol: '💧',
      iconEmoji: '💧',
      color: '#0284c7', // Sky 600
      glowColor: 'rgba(2, 132, 199, 0.35)',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      pillActive: 'bg-sky-600 text-white shadow-sky-500/20'
    };
  }
  return {
    key: 'Other',
    label: category || 'Civic Hazard',
    symbol: '📍',
    iconEmoji: '📍',
    color: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.35)',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    pillActive: 'bg-slate-800 text-white'
  };
};

export function InteractiveMap({ masterIssues = [], onSelectIssue, selectedCategory = 'ALL' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedMarkerData, setSelectedMarkerData] = useState(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered on Nagpur Civic District
      const map = L.map(mapContainerRef.current, {
        center: [21.1458, 79.0882],
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Clean Crisp OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      heatmapLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Update Markers, Area Hotspot Circles & Auto-Fly to targeted area on category switch
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    if (heatmapLayerRef.current) heatmapLayerRef.current.clearLayers();

    const filtered = masterIssues.filter(m => {
      if (activeCategory === 'ALL') return true;
      const meta = getCategoryMeta(m.category);
      return meta.key === activeCategory;
    });

    // Auto-Focus / FlyToBounds when category is selected
    if (filtered.length > 0) {
      const latLngs = filtered.map(item => [
        item.location?.lat || 21.1425,
        item.location?.lng || 79.0620
      ]);

      if (filtered.length === 1) {
        mapInstanceRef.current.flyTo(latLngs[0], 15, {
          duration: 1.0,
          easeLinearity: 0.25
        });
      } else {
        const bounds = L.latLngBounds(latLngs);
        mapInstanceRef.current.flyToBounds(bounds.pad(0.25), {
          duration: 1.0,
          maxZoom: 14
        });
      }
    }

    // Render Markers & Area Circles
    filtered.forEach(issue => {
      const lat = issue.location?.lat || 21.1425;
      const lng = issue.location?.lng || 79.0620;
      const meta = getCategoryMeta(issue.category);

      // 1. Area Hotspot / Incident Zone Circle
      if (showHeatmap && heatmapLayerRef.current) {
        const radius = Math.min(650, 180 + issue.complaintCount * 22);
        const areaCircle = L.circle([lat, lng], {
          radius,
          fillColor: meta.color,
          fillOpacity: issue.isHotspot ? 0.25 : 0.14,
          color: meta.color,
          weight: issue.isHotspot ? 2 : 1.2,
          dashArray: issue.isHotspot ? '4, 4' : null,
          opacity: 0.8
        });

        areaCircle.bindTooltip(`
          <div class="px-2 py-1 text-[11px] font-bold">
            <span class="mr-1">${meta.symbol}</span>
            <span>${issue.roadName} (${issue.complaintCount} reports)</span>
          </div>
        `, { direction: 'top', className: 'civic-map-tooltip' });

        areaCircle.addTo(heatmapLayerRef.current);
      }

      // 2. Custom Category Symbol Pin Marker
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group transform transition-transform duration-200 hover:scale-125">
          <!-- Pulsing Danger Wave for Hotspots -->
          ${issue.isHotspot ? `
            <div class="absolute -inset-2 rounded-full animate-ping opacity-35" style="background-color: ${meta.color};"></div>
          ` : ''}

          <!-- Outer Pin Body -->
          <div class="relative flex flex-col items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-xl border-2 transition-all"
                 style="border-color: ${meta.color}; box-shadow: 0 4px 14px ${meta.glowColor};">
              <span class="text-base select-none">${meta.symbol}</span>

              <!-- Floating Complaint Count Badge -->
              <span class="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black text-white shadow-sm border border-white"
                    style="background-color: ${meta.color}; min-width: 18px; text-align: center;">
                ${issue.complaintCount}
              </span>
            </div>

            <!-- Pin Bottom Pointer -->
            <div class="w-2 h-2 -mt-1 rotate-45 border-r-2 border-b-2 bg-white"
                 style="border-color: ${meta.color};"></div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-civic-pin',
        iconSize: [40, 46],
        iconAnchor: [20, 44]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Click Handler
      marker.on('click', () => {
        setSelectedMarkerData(issue);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
        }
      });

      marker.addTo(markersLayerRef.current);
    });
  }, [masterIssues, activeCategory, showHeatmap]);

  // Compute category statistics for filter tabs
  const categoryCounts = {
    ALL: masterIssues.length,
    Pothole: masterIssues.filter(m => getCategoryMeta(m.category).key === 'Pothole').length,
    Garbage: masterIssues.filter(m => getCategoryMeta(m.category).key === 'Garbage').length,
    Streetlight: masterIssues.filter(m => getCategoryMeta(m.category).key === 'Streetlight').length,
    Drainage: masterIssues.filter(m => getCategoryMeta(m.category).key === 'Drainage').length
  };

  const filterTabs = [
    { key: 'ALL', label: 'All Issues', symbol: '🌐' },
    { key: 'Pothole', label: 'Potholes', symbol: '🚧' },
    { key: 'Garbage', label: 'Garbage', symbol: '🗑️' },
    { key: 'Streetlight', label: 'Streetlights', symbol: '💡' },
    { key: 'Drainage', label: 'Drainage', symbol: '💧' }
  ];

  return (
    <div className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white">
      {/* Category Filter Pills on Top of Map */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-lg flex flex-wrap items-center gap-1.5 max-w-[calc(100%-2rem)] sm:max-w-none">
        <div className="flex items-center gap-1 px-2 text-xs font-extrabold text-slate-600">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Category:</span>
        </div>

        {filterTabs.map(tab => {
          const isActive = activeCategory === tab.key;
          const count = categoryCounts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <span>{tab.symbol}</span>
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            showHeatmap
              ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-600" />
          <span>Area Zones: {showHeatmap ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Recenter & Active Filter Indicator */}
      <div className="absolute top-4 right-4 z-[999] hidden sm:flex items-center gap-2">
        <button
          onClick={() => {
            if (!navigator.geolocation) {
              alert('Geolocation is not supported by your browser.');
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords;
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
                  
                  // Pulse user marker
                  const userIcon = L.divIcon({
                    html: `
                      <div class="relative flex items-center justify-center">
                        <div class="w-8 h-8 rounded-full bg-blue-500/30 animate-ping absolute"></div>
                        <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg"></div>
                      </div>
                    `,
                    className: 'user-live-pin',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  });
                  L.marker([latitude, longitude], { icon: userIcon })
                    .addTo(mapInstanceRef.current)
                    .bindPopup('<b>📍 Your Live Location</b><br>Accurate to GPS position')
                    .openPopup();
                }
              },
              (err) => {
                console.warn('Geolocation error:', err.message);
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([21.1458, 79.0882], 15, { duration: 1.0 });
                }
              },
              { enableHighAccuracy: true }
            );
          }}
          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>My Live Location</span>
        </button>

        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([21.1458, 79.0882], 13, { duration: 1.0 });
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 text-[11px] font-bold text-slate-700 flex flex-wrap items-center gap-3.5 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🚧</span>
          <span>Potholes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🗑️</span>
          <span>Garbage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">💡</span>
          <span>Streetlights</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">💧</span>
          <span>Drainage</span>
        </div>
      </div>

      {/* Selected Marker Detail Card Overlay */}
      {selectedMarkerData && (
        <div className="absolute top-16 right-4 z-[1000] w-88 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl p-5 text-slate-800 animate-fadeIn">
          {(() => {
            const meta = getCategoryMeta(selectedMarkerData.category);
            return (
              <>
                <div className="flex items-start justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${meta.badgeBg}`}>
                    <span>{meta.symbol}</span>
                    <span>{selectedMarkerData.severity} ({selectedMarkerData.priorityScore}/100)</span>
                  </span>
                  <button
                    onClick={() => setSelectedMarkerData(null)}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition-all"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-2xl">{meta.symbol}</span>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                      {selectedMarkerData.roadName}
                    </h4>
                    <span className="text-[11px] font-bold text-blue-600">{meta.label}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-1">{selectedMarkerData.landmark}</p>

                <div className="grid grid-cols-2 gap-2 my-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Aggregated Reports</div>
                    <div className="text-base font-extrabold" style={{ color: meta.color }}>
                      {selectedMarkerData.complaintCount} Complaints
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Affected Citizens</div>
                    <div className="text-base font-extrabold text-indigo-700">
                      {selectedMarkerData.affectedCitizens} Citizens
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span>Resolution Progress</span>
                    <span className="text-blue-600">{selectedMarkerData.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${selectedMarkerData.progress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => onSelectIssue && onSelectIssue(selectedMarkerData)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-98"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Inspect Hub Details (#{selectedMarkerData.id})
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* The Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

