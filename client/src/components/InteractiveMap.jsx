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

      // Clean Watermark-Free Dark Canvas Tiles (No API key required)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Clean Roads & Street Labels Overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        opacity: 0.85
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
      let color = '#06b6d4'; // Low cyan
      let pulseClass = '';
      if (issue.severity === 'CRITICAL' || issue.priorityScore >= 81) {
        color = '#f43f5e'; // Red
        pulseClass = 'animate-ping';
      } else if (issue.severity === 'HIGH' || issue.priorityScore >= 61) {
        color = '#f97316'; // Orange
      } else if (issue.priorityScore >= 31) {
        color = '#eab308'; // Yellow
      } else {
        color = '#10b981'; // Green
      }

      // Heatmap glow circle if enabled
      if (showHeatmap && heatmapLayerRef.current) {
        const radius = Math.min(600, 150 + issue.complaintCount * 22);
        const heatCircle = L.circle([lat, lng], {
          radius,
          fillColor: color,
          fillOpacity: issue.isHotspot ? 0.35 : 0.18,
          color: color,
          weight: 1,
          opacity: 0.4
        });
        heatCircle.addTo(heatmapLayerRef.current);
      }

      // Custom HTML Marker Icon
      const isCriticalCluster = issue.complaintCount >= 5;
      const markerHtml = `
        <div class="relative cursor-pointer group">
          ${isCriticalCluster ? `<div class="absolute -inset-2 rounded-full ${color === '#f43f5e' ? 'bg-rose-500/40' : 'bg-orange-500/40'} ${pulseClass}"></div>` : ''}
          <div style="background-color: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 15px ${color};"
               class="relative flex items-center justify-center rounded-full text-white font-extrabold text-[11px] shadow-2xl ${isCriticalCluster ? 'w-10 h-10' : 'w-7 h-7'}">
            ${isCriticalCluster ? `🚨 ${issue.complaintCount}` : '📍'}
          </div>
          <div class="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-slate-100 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 shadow-md pointer-events-none">
            ${issue.roadName} (${issue.priorityScore}/100)
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: markerHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedMarkerData(issue);
        if (onSelectIssue) onSelectIssue(issue);
      });

      marker.addTo(markersLayerRef.current);
    });
  }, [masterIssues, activeCategory, showHeatmap, onSelectIssue]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Top Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2 items-center bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-xl max-w-xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 px-2 border-r border-slate-700">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          Filter:
        </div>
        {['ALL', 'Pothole', 'Garbage', 'Streetlight', 'Drainage'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}

        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
            showHeatmap
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          Heatmap: {showHeatmap ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-4 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500 animate-pulse"></span>
          <span>Critical (81–100)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500"></span>
          <span>High (61–80)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500"></span>
          <span>Medium (31–60)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
          <span>Low (0–30)</span>
        </div>
      </div>

      {/* Selected Marker Detail Card Overlay */}
      {selectedMarkerData && (
        <div className="absolute top-4 right-4 z-[1000] w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl p-4 text-slate-200 animate-fadeIn">
          <div className="flex items-start justify-between">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                selectedMarkerData.severity === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
              }`}
            >
              {selectedMarkerData.severity} PRIORITY ({selectedMarkerData.priorityScore}/100)
            </span>
            <button
              onClick={() => setSelectedMarkerData(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <h4 className="mt-2 text-base font-bold text-white leading-tight">
            {selectedMarkerData.roadName}
          </h4>
          <p className="text-xs text-slate-400 mt-1">{selectedMarkerData.landmark}</p>

          <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Aggregated Reports</div>
              <div className="text-base font-extrabold text-cyan-400">
                {selectedMarkerData.complaintCount} Complaints
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Affected Citizens</div>
              <div className="text-base font-extrabold text-indigo-300">
                {selectedMarkerData.affectedCitizens} Citizens
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Work Progress</span>
              <span className="text-cyan-400">{selectedMarkerData.progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${selectedMarkerData.progress}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onSelectIssue && onSelectIssue(selectedMarkerData)}
            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 transition-all"
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
