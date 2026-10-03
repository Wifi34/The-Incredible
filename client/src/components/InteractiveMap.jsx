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
  MapPin
} from 'lucide-react';

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
      // Centered on Pune Civic District
      const map = L.map(mapContainerRef.current, {
        center: [18.5314, 73.8567],
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Clean Crisp OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      heatmapLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // keep instance intact or cleanup if unmounting
    };
  }, []);

  // Update Markers & Hotspot Circles when data or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    if (heatmapLayerRef.current) heatmapLayerRef.current.clearLayers();

    const filtered = masterIssues.filter(m => {
      if (activeCategory === 'ALL') return true;
      if (activeCategory === 'Pothole' && (m.category === 'Pothole' || m.category === 'Road Damage')) return true;
      if (activeCategory === 'Garbage' && (m.category === 'Garbage' || m.category === 'Illegal Dumping')) return true;
      if (activeCategory === 'Streetlight' && m.category === 'Broken Streetlight') return true;
      if (activeCategory === 'Drainage' && (m.category === 'Open Drain' || m.category === 'Water Leakage')) return true;
      return m.category === activeCategory;
    });

    filtered.forEach(issue => {
      const lat = issue.location?.lat || 18.5314;
      const lng = issue.location?.lng || 73.8446;

      // Color mapping
      let color = '#0284c7'; // Blue
      let pulseClass = '';
      if (issue.severity === 'CRITICAL' || issue.priorityScore >= 81) {
        color = '#e11d48'; // Red
        pulseClass = 'animate-ping';
      } else if (issue.severity === 'HIGH' || issue.priorityScore >= 61) {
        color = '#ea580c'; // Orange
      } else if (issue.priorityScore >= 31) {
        color = '#d97706'; // Amber
      } else {
        color = '#059669'; // Emerald
      }

      // Heatmap glow circle if enabled
      if (showHeatmap && heatmapLayerRef.current) {
        const radius = Math.min(600, 150 + issue.complaintCount * 22);
        const heatCircle = L.circle([lat, lng], {
          radius,
          fillColor: color,
          fillOpacity: issue.isHotspot ? 0.35 : 0.18,
          color: color,
          weight: 1.5,
          opacity: 0.7
        });
        heatCircle.addTo(heatmapLayerRef.current);
      }

      // Custom pulsing HTML marker pin
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${issue.isHotspot ? `<div class="absolute w-10 h-10 rounded-full ${pulseClass}" style="background-color: ${color}; opacity: 0.35;"></div>` : ''}
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-[11px] shadow-lg border-2 border-white transition-transform transform group-hover:scale-125" style="background-color: ${color};">
            ${issue.complaintCount}
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rotate-45 border-r-2 border-b-2 border-white" style="background-color: ${color};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedMarkerData(issue);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([lat, lng]);
        }
      });

      marker.addTo(markersLayerRef.current);
    });
  }, [masterIssues, activeCategory, showHeatmap]);

  const categories = ['ALL', 'Pothole', 'Garbage', 'Streetlight', 'Drainage'];

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      {/* Category Filter Pills on Top of Map */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1 px-2 text-xs font-bold text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
            showHeatmap
              ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-600" />
          Heatmap: {showHeatmap ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-4 shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-600 shadow-xs"></span>
          <span>Critical (81–100)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-600 shadow-xs"></span>
          <span>High (61–80)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs"></span>
          <span>Medium (31–60)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 shadow-xs"></span>
          <span>Low (0–30)</span>
        </div>
      </div>

      {/* Selected Marker Detail Card Overlay */}
      {selectedMarkerData && (
        <div className="absolute top-4 right-4 z-[1000] w-84 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl p-5 text-slate-800 animate-fadeIn">
          <div className="flex items-start justify-between">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                selectedMarkerData.severity === 'CRITICAL'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}
            >
              {selectedMarkerData.severity} PRIORITY ({selectedMarkerData.priorityScore}/100)
            </span>
            <button
              onClick={() => setSelectedMarkerData(null)}
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition-all"
            >
              ✕
            </button>
          </div>

          <h4 className="mt-2.5 text-base font-extrabold text-slate-900 leading-tight">
            {selectedMarkerData.roadName}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">{selectedMarkerData.landmark}</p>

          <div className="grid grid-cols-2 gap-2 my-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] text-slate-500 font-medium">Aggregated Reports</div>
              <div className="text-base font-extrabold text-blue-700">
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
              <span>Work Progress</span>
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
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Inspect Master Hub (#{selectedMarkerData.id})
          </button>
        </div>
      )}

      {/* The Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
