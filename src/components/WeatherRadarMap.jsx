import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Layers, Eye, Wind, CloudRain, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { fetchRainViewerMetadata, calculateDistrictMicroZoneBreakdown } from '../services/weatherService';
import { TRANSLATIONS } from '../services/languages';
import L from 'leaflet';

export default function WeatherRadarMap({
  activeLanguage = 'en',
  currentLocation,
  weatherData,
  alerts = [],
  compact = false,
  height = '420px'
}) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const radarLayerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const markerRef = useRef(null);
  const microZoneLayerRef = useRef(null);

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const r = t.radar || TRANSLATIONS.en.radar;

  const [radarFrames, setRadarFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeLayerType, setActiveLayerType] = useState('radar'); // 'radar' | 'satellite' | 'both'
  const [colorScheme, setColorScheme] = useState(2); // 2: Universal blue/green/yellow/red
  const [opacity, setOpacity] = useState(0.75);
  const [showMicroZones, setShowMicroZones] = useState(true);

  const lat = currentLocation?.latitude || 12.6841;
  const lon = currentLocation?.longitude || 79.9836;

  // Invalidate size on mount / resize for responsive rendering in modals
  useEffect(() => {
    const timer = setTimeout(() => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [compact, height]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 9,
        zoomControl: true,
        attributionControl: false,
      });

      // Light theme base map tile layer (CartoDB Voyager)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map);

      microZoneLayerRef.current = L.layerGroup().addTo(map);
      leafletMap.current = map;
    } else {
      leafletMap.current.setView([lat, lon], leafletMap.current.getZoom() || 9);
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
            <div class="w-8 h-8 rounded-full bg-sky-600 border-2 border-white shadow-xl flex items-center justify-center text-[11px] font-black text-white ring-2 ring-sky-300">
              ${Math.round(temp)}°
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(leafletMap.current);
      marker.bindPopup(`
        <div class="p-1 text-xs">
          <strong class="text-sky-700 font-bold">${currentLocation?.name || 'Selected Location'}</strong>
          <div class="mt-1 text-slate-700">${r.temp || 'Temp'}: <b>${temp}°C</b> | ${r.wind || 'Wind'}: <b>${wind} km/h</b></div>
          <div class="text-[10px] text-slate-500 mt-0.5">${r.liveObservation || 'Live Weather Observation'}</div>
        </div>
      `);
      markerRef.current = marker;
    }
  }, [lat, lon, currentLocation, weatherData, activeLanguage]);

  // Render Hyper-Local Sub-District Micro-Zone Pins on Map
  useEffect(() => {
    if (!leafletMap.current || !microZoneLayerRef.current) return;

    microZoneLayerRef.current.clearLayers();
    if (!showMicroZones) return;

    const microBreakdown = calculateDistrictMicroZoneBreakdown(currentLocation, weatherData, null, activeLanguage);
    
    microBreakdown.zones.forEach((zone) => {
      const isRain = zone.status === 'rain';
      const isDrizzle = zone.status === 'drizzle';
      const isSevere = zone.riskLevel === 'severe';
      const isModerate = zone.riskLevel === 'moderate';

      const ringColor = isSevere ? 'border-rose-500 ring-2 ring-rose-300' : isModerate ? 'border-amber-500 ring-2 ring-amber-300' : 'border-emerald-500 ring-2 ring-emerald-200';
      const bgColor = isRain ? 'bg-sky-700 text-white' : isDrizzle ? 'bg-cyan-600 text-white' : 'bg-white text-slate-800 border border-slate-300';
      const shortLabel = activeLanguage === 'ta' ? zone.nameTa.split('–')[0].trim() : zone.nameEn.split('–')[0].trim();

      const zoneIcon = L.divIcon({
        className: 'sub-locality-pin',
        html: `
          <div class="px-2 py-0.5 rounded-full ${bgColor} ${ringColor} text-[9px] font-bold shadow-md flex items-center space-x-1 whitespace-nowrap cursor-pointer transform hover:scale-110 transition-transform">
            <span>${zone.statusIcon}</span>
            <span>${shortLabel}</span>
          </div>
        `,
        iconSize: [100, 24],
        iconAnchor: [50, 12],
      });

      const pin = L.marker([zone.latitude, zone.longitude], { icon: zoneIcon });
      pin.bindPopup(`
        <div class="p-1.5 text-xs max-w-[240px] font-sans">
          <strong class="text-slate-900 font-bold block text-sm">${activeLanguage === 'ta' ? zone.nameTa : zone.nameEn}</strong>
          <div class="mt-1 flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <span class="text-slate-600 font-medium">${activeLanguage === 'ta' ? 'மழை நிலை' : 'Rain Status'}:</span>
            <b class="${isRain ? 'text-sky-600' : isDrizzle ? 'text-cyan-600' : 'text-slate-700'}">${zone.statusIcon} ${zone.status.toUpperCase()} (${zone.prob}%)</b>
          </div>
          <div class="text-[10px] text-slate-600 mt-1">
            <span>${activeLanguage === 'ta' ? 'நேரம்' : 'Window'}: <b>${activeLanguage === 'ta' ? zone.timingTa : zone.timingEn}</b></span>
          </div>
          <div class="mt-1.5 pt-1.5 border-t border-slate-200 text-[10px]">
            <span class="font-bold ${isSevere ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'} block">
              ${activeLanguage === 'ta' ? zone.riskBadgeTa : zone.riskBadgeEn}
            </span>
            <p class="text-slate-600 mt-0.5 leading-snug">
              ${activeLanguage === 'ta' ? zone.riskAdvisoryTa : zone.riskAdvisoryEn}
            </p>
          </div>
        </div>
      `);
      microZoneLayerRef.current.addLayer(pin);
    });
  }, [currentLocation, weatherData, showMicroZones, activeLanguage]);

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
    <div className={`w-full flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm ${compact ? 'h-[300px]' : 'h-full'}`}>
      {/* Radar GIS Controls Header */}
      <div className={`${compact ? 'p-2' : 'p-3.5'} bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex items-center space-x-2">
          <div className={`${compact ? 'p-1' : 'p-1.5'} rounded-lg bg-sky-50 border border-sky-200 text-sky-600`}>
            <CloudRain className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-slate-900 flex items-center space-x-1.5`}>
                <span>{r.title || 'Live Doppler Radar & Satellite GIS'}</span>
                <span className="flex h-2 w-2 relative">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
              </h3>
            </div>
            {!compact && (
              <p className="text-[11px] text-slate-500">
                {r.subtitle || 'Real-time precipitation echo reflectivity and satellite cloud streaming.'}
              </p>
            )}
          </div>
        </div>

        {/* Playback & Layer Controls */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Layer Mode Picker */}
          <select
            value={activeLayerType}
            onChange={(e) => setActiveLayerType(e.target.value)}
            className="px-2 py-1 bg-sky-50 border border-sky-300 rounded-xl text-sky-800 text-[11px] font-bold focus:outline-none shadow-2xs"
          >
            <option value="radar">🌧️ Doppler Radar (dBZ)</option>
            <option value="satellite">☁️ Satellite Infrared</option>
            <option value="wrf">🌐 WRF 3km Mesoscale Grid</option>
            <option value="lightning">⚡ Live Lightning Strikes</option>
            <option value="both">🛰️ Multi-Layer Composite</option>
          </select>

          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2.5 py-1 rounded-xl font-medium flex items-center space-x-1 transition-all shadow-sm ${
              isPlaying
                ? 'bg-sky-600 text-white hover:bg-sky-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span className="text-[11px]">{isPlaying ? (r.pause || 'Pause') : (r.play || 'Play Loop')}</span>
          </button>

          {/* Sub-Locality Micro-Zones Toggle */}
          <button
            onClick={() => setShowMicroZones(!showMicroZones)}
            className={`px-2 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs ${
              showMicroZones
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={activeLanguage === 'ta' ? 'பகுதிவாரி நிலையங்கள் (Sub-Locality Pins)' : 'Toggle Sub-Locality Pins'}
          >
            <MapPin className="w-3 h-3" />
            <span className="hidden sm:inline">{activeLanguage === 'ta' ? 'பகுதிவாரி' : 'Micro-Zones'}</span>
          </button>

          {/* Timestamp Indicator */}
          <div className="px-2 py-0.5 rounded-xl bg-slate-100 border border-slate-200 font-mono text-slate-700 text-[10px]">
            🕒 {activeTimestamp}
          </div>

          {/* Color Scheme Picker */}
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(Number(e.target.value))}
            className="px-2 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 text-[11px] focus:outline-none shadow-sm hidden sm:inline"
          >
            <option value={2}>Doppler Standard</option>
            <option value={1}>RainViewer HD</option>
            <option value={4}>NOAA NWS</option>
            <option value={6}>Rainbow High Contrast</option>
          </select>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className={`relative flex-1 w-full ${compact ? 'min-h-[220px]' : 'min-h-[420px]'}`}>
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: compact ? '220px' : '420px' }}></div>

        {/* Legend Overlay */}
        <div className={`absolute bottom-2 left-2 z-[1000] ${compact ? 'p-1.5 text-[9px]' : 'p-2.5 text-[10px]'} rounded-xl bg-white/95 border border-slate-200 backdrop-blur-md text-slate-700 shadow-md space-y-1`}>
          <div className="font-semibold text-slate-900 flex items-center justify-between">
            <span>Precipitation (dBZ)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-500">{r.light || 'Light'}</span>
            <div className={`${compact ? 'h-2 w-20' : 'h-2.5 w-32'} rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-600 border border-slate-300`}></div>
            <span className="text-rose-600 font-bold">{r.heavy || 'Heavy'}</span>
          </div>
        </div>

        {/* Frame Timeline Scrubber Slider */}
        {radarFrames.length > 0 && (
          <div className={`absolute bottom-2 right-2 z-[1000] ${compact ? 'p-1.5' : 'p-2'} rounded-xl bg-white/95 border border-slate-200 backdrop-blur-md shadow-md flex items-center space-x-1.5`}>
            <span className="text-[9px] text-slate-600 font-mono">Frame {activeFrameIndex + 1}/{radarFrames.length}</span>
            <input
              type="range"
              min="0"
              max={radarFrames.length - 1}
              value={activeFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setActiveFrameIndex(Number(e.target.value));
              }}
              className="w-20 sm:w-28 accent-sky-600 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
