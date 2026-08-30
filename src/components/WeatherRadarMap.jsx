import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Layers, Eye, Wind, CloudRain, ShieldAlert, Sparkles } from 'lucide-react';
import { fetchRainViewerMetadata } from '../services/weatherService';
import L from 'leaflet';

export default function WeatherRadarMap({ currentLocation, weatherData, alerts = [] }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const radarLayerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const markerRef = useRef(null);

  const [radarFrames, setRadarFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeLayerType, setActiveLayerType] = useState('radar'); // 'radar' | 'satellite' | 'both'
  const [colorScheme, setColorScheme] = useState(2); // 2: Universal blue/green/yellow/red
  const [opacity, setOpacity] = useState(0.75);

  const lat = currentLocation?.latitude || 13.0827;
  const lon = currentLocation?.longitude || 80.2707;

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark theme base map tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map);

      leafletMap.current = map;
    } else {
      leafletMap.current.setView([lat, lon], leafletMap.current.getZoom() || 7);
    }

    // Add or update current location marker
    if (leafletMap.current) {
      if (markerRef.current) {
        leafletMap.current.removeLayer(markerRef.current);
      }

      const temp = weatherData?.current?.temperature_2m ?? 28;
      const wind = weatherData?.current?.wind_speed_10m ?? 12;

      const customIcon = L.divIcon({
        className: 'custom-weather-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-cyan-500/30 animate-ping"></div>
            <div class="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-slate-900">
              ${Math.round(temp)}°
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(leafletMap.current);
      marker.bindPopup(`
        <div class="p-1 text-xs">
          <strong class="text-cyan-400 font-bold">${currentLocation?.name || 'Selected Location'}</strong>
          <div class="mt-1 text-slate-200">Temp: <b>${temp}°C</b> | Wind: <b>${wind} km/h</b></div>
          <div class="text-[10px] text-slate-400 mt-0.5">Live Meteorological Station</div>
        </div>
      `);
      markerRef.current = marker;
    }
  }, [lat, lon, currentLocation, weatherData]);

  // Load RainViewer Radar Tile Frames
  useEffect(() => {
    let isMounted = true;
    fetchRainViewerMetadata().then((data) => {
      if (!isMounted) return;
      const past = data.radarPast || [];
      const nowcast = data.radarNowcast || [];
      const combined = [...past, ...nowcast];
      if (combined.length > 0) {
        setRadarFrames(combined);
        setActiveFrameIndex(past.length > 0 ? past.length - 1 : 0);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Radar / Satellite Tile Layer on Map
  useEffect(() => {
    if (!leafletMap.current || radarFrames.length === 0) return;

    const frame = radarFrames[activeFrameIndex];
    if (!frame) return;

    const time = frame.time;
    const radarTileUrl = `https://tilecache.rainviewer.com/v2/radar/${time}/256/{z}/{x}/{y}/${colorScheme}/1_1.png`;

    if (radarLayerRef.current) {
      leafletMap.current.removeLayer(radarLayerRef.current);
    }

    if (activeLayerType === 'radar' || activeLayerType === 'both') {
      const radarLayer = L.tileLayer(radarTileUrl, {
        opacity: opacity,
        zIndex: 10,
      });
      radarLayer.addTo(leafletMap.current);
      radarLayerRef.current = radarLayer;
    }

    return () => {
      if (radarLayerRef.current && leafletMap.current) {
        leafletMap.current.removeLayer(radarLayerRef.current);
      }
    };
  }, [activeFrameIndex, radarFrames, colorScheme, opacity, activeLayerType]);

  // Radar Animation Loop
  useEffect(() => {
    if (!isPlaying || radarFrames.length <= 1) return;

    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying, radarFrames.length]);

  const activeTimestamp = radarFrames[activeFrameIndex]?.time
    ? new Date(radarFrames[activeFrameIndex].time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Live Stream';

  return (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-xl">
      {/* Radar GIS Controls Header */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-400">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>RainViewer Live Precipitation Radar</span>
                <span className="flex h-2 w-2 relative">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Live Weather Radar & Satellite Precipitation Map
            </p>
          </div>
        </div>

        {/* Playback & Layer Controls */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center space-x-1.5 transition-all ${
              isPlaying
                ? 'bg-sky-600 text-white hover:bg-sky-500'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play Loop'}</span>
          </button>

          {/* Timestamp Indicator */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700 font-mono text-sky-300 text-xs">
            🕒 {activeTimestamp}
          </div>

          {/* Color Scheme Picker */}
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(Number(e.target.value))}
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none"
          >
            <option value={2}>Doppler Standard</option>
            <option value={1}>RainViewer HD</option>
            <option value={4}>NOAA NWS</option>
            <option value={6}>Rainbow High Contrast</option>
          </select>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative flex-1 min-h-[420px] w-full">
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '420px' }}></div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-[10px] text-slate-300 shadow-xl space-y-1.5">
          <div className="font-semibold text-slate-100 flex items-center justify-between">
            <span>Precipitation Intensity (dBZ)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Light</span>
            <div className="h-2.5 w-32 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-rose-600 border border-black/30"></div>
            <span className="text-rose-400 font-bold">Violent</span>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center justify-between">
            <span>Drizzle (10 dBZ)</span>
            <span>Heavy Hail (&gt;55 dBZ)</span>
          </div>
        </div>

        {/* Frame Timeline Scrubber Slider */}
        {radarFrames.length > 0 && (
          <div className="absolute bottom-4 right-4 z-[1000] p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl flex items-center space-x-2">
            <span className="text-[10px] text-slate-400 font-mono">Frame {activeFrameIndex + 1}/{radarFrames.length}</span>
            <input
              type="range"
              min="0"
              max={radarFrames.length - 1}
              value={activeFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setActiveFrameIndex(Number(e.target.value));
              }}
              className="w-28 sm:w-40 accent-cyan-500 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
