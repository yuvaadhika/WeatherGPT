import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Layers,
  Eye,
  Wind,
  CloudRain,
  ShieldAlert,
  Sparkles,
  MapPin,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Navigation2,
  Search,
  Sliders,
  X,
  ExternalLink,
  Compass,
  Radio
} from 'lucide-react';
import { fetchRainViewerMetadata, calculateDistrictMicroZoneBreakdown, searchLocation } from '../services/weatherService';
import { TRANSLATIONS } from '../services/languages';
import L from 'leaflet';

// Authentic Google Maps & GIS High-Resolution Tile Layers
export const BASE_MAP_PROVIDERS = {
  google_roadmap: {
    id: 'google_roadmap',
    name: 'Google Maps (Roads)',
    nameTa: 'கூகுள் வரைபடம் (சாலைகள்)',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 22,
    maxNativeZoom: 20,
    icon: '🗺️',
  },
  google_satellite: {
    id: 'google_satellite',
    name: 'Google Satellite (Hybrid HD)',
    nameTa: 'செயற்கைக்கோள் (Hybrid HD)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 22,
    maxNativeZoom: 20,
    icon: '🛰️',
  },
  google_terrain: {
    id: 'google_terrain',
    name: 'Google Terrain (Topo)',
    nameTa: 'நிலப்பரப்பு வரைபடம் (Terrain)',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 22,
    maxNativeZoom: 20,
    icon: '⛰️',
  },
  osm_standard: {
    id: 'osm_standard',
    name: 'OpenStreetMap HD',
    nameTa: 'OpenStreetMap வரைபடம்',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 21,
    maxNativeZoom: 19,
    icon: '🧭',
  },
  dark_canvas: {
    id: 'dark_canvas',
    name: 'Night / Dark Mode',
    nameTa: 'இரவு முறை (Dark)',
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Base/MapServer/tile/{z}/{y}/{x}',
    subdomains: ['server', 'services'],
    maxZoom: 19,
    maxNativeZoom: 16,
    icon: '🌙',
  },
};

export default function WeatherRadarMap({
  activeLanguage = 'en',
  currentLocation,
  weatherData,
  alerts = [],
  compact = false,
  height = '480px',
}) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const baseTileLayerRef = useRef(null);
  const radarLayerRef = useRef(null);
  const markerRef = useRef(null);
  const microZoneLayerRef = useRef(null);
  const searchPinRef = useRef(null);

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const r = t.radar || TRANSLATIONS.en.radar;

  // State Management
  const [selectedBaseMap, setSelectedBaseMap] = useState('google_roadmap');
  const [radarFrames, setRadarFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playSpeed, setPlaySpeed] = useState(800); // ms per frame
  const [activeLayerType, setActiveLayerType] = useState('radar'); // 'radar' | 'satellite' | 'lightning' | 'both'
  const [colorScheme, setColorScheme] = useState(2); // 2: Universal Doppler blue/green/yellow/red
  const [opacity, setOpacity] = useState(0.78);
  const [showMicroZones, setShowMicroZones] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  // In-Map City Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const lat = currentLocation?.latitude || 12.6841;
  const lon = currentLocation?.longitude || 79.9836;
  const locName = currentLocation?.name || 'Selected Location';

  // Invalidate map size on resizing, compact toggles, and fullscreen changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [compact, height, isFullscreen]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Initialize Leaflet Map with Google Maps Capabilities & Deep Zoom
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 10,
        minZoom: 3,
        maxZoom: 22,
        zoomControl: false, // Sleek custom floating Google Maps zoom controls
        attributionControl: false,
        fadeAnimation: true,
        zoomAnimation: true,
      });

      // Add Base Tile Layer
      const baseProvider = BASE_MAP_PROVIDERS[selectedBaseMap] || BASE_MAP_PROVIDERS.google_roadmap;
      const tileLayer = L.tileLayer(baseProvider.url, {
        maxZoom: baseProvider.maxZoom,
        maxNativeZoom: baseProvider.maxNativeZoom,
        subdomains: baseProvider.subdomains,
      }).addTo(map);

      baseTileLayerRef.current = tileLayer;
      microZoneLayerRef.current = L.layerGroup().addTo(map);

      // Track zoom level changes
      map.on('zoomend', () => {
        setCurrentZoom(Math.round(map.getZoom()));
      });

      leafletMap.current = map;
      setCurrentZoom(10);
    } else {
      leafletMap.current.setView([lat, lon], leafletMap.current.getZoom() || 10);
    }

    // Render / Update Current Location Marker
    if (leafletMap.current) {
      if (markerRef.current) {
        leafletMap.current.removeLayer(markerRef.current);
      }

      const temp = weatherData?.current?.temperature_2m ?? 28;
      const wind = weatherData?.current?.wind_speed_10m ?? 12;
      const code = weatherData?.current?.weather_code ?? 0;

      const customIcon = L.divIcon({
        className: 'custom-weather-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute -inset-2 rounded-full bg-sky-500/30 animate-ping"></div>
            <div class="relative px-2 py-1 rounded-full bg-gradient-to-r from-sky-600 to-blue-700 text-white font-black text-[11px] shadow-xl border-2 border-white flex items-center space-x-1 ring-2 ring-sky-300 transform group-hover:scale-110 transition-transform">
              <span>📍</span>
              <span>${Math.round(temp)}°C</span>
            </div>
          </div>
        `,
        iconSize: [60, 30],
        iconAnchor: [30, 15],
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(leafletMap.current);
      marker.bindPopup(`
        <div class="p-2 text-xs font-sans min-w-[200px]">
          <div class="font-extrabold text-sky-800 text-sm border-b border-slate-100 pb-1 flex items-center justify-between">
            <span>${locName}</span>
            <span class="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">GPS Target</span>
          </div>
          <div class="mt-2 space-y-1 text-slate-700">
            <div class="flex justify-between"><span>${r.temp || 'Temperature'}:</span> <b>${temp}°C</b></div>
            <div class="flex justify-between"><span>${r.wind || 'Wind Speed'}:</span> <b>${wind} km/h</b></div>
            <div class="flex justify-between"><span>Precipitation:</span> <b>${weatherData?.current?.precipitation || 0} mm</b></div>
          </div>
          <div class="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>✨ Live Radar Centered</span>
            <a href="https://www.google.com/maps/@${lat},${lon},14z" target="_blank" rel="noopener noreferrer" class="text-sky-600 font-bold hover:underline">Google Maps ↗</a>
          </div>
        </div>
      `);
      markerRef.current = marker;
    }
  }, [lat, lon, currentLocation, weatherData, activeLanguage]);

  // Update Base Tile Layer when `selectedBaseMap` changes
  useEffect(() => {
    if (!leafletMap.current) return;

    if (baseTileLayerRef.current) {
      leafletMap.current.removeLayer(baseTileLayerRef.current);
    }

    const provider = BASE_MAP_PROVIDERS[selectedBaseMap] || BASE_MAP_PROVIDERS.google_roadmap;
    const tileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      maxNativeZoom: provider.maxNativeZoom,
      subdomains: provider.subdomains,
    }).addTo(leafletMap.current);

    baseTileLayerRef.current = tileLayer;
    baseTileLayerRef.current.bringToBack();
  }, [selectedBaseMap]);

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

      const ringColor = isSevere
        ? 'border-rose-500 ring-2 ring-rose-300'
        : isModerate
        ? 'border-amber-500 ring-2 ring-amber-300'
        : 'border-emerald-500 ring-2 ring-emerald-200';
      const bgColor = isRain
        ? 'bg-sky-700 text-white'
        : isDrizzle
        ? 'bg-cyan-600 text-white'
        : 'bg-white text-slate-800 border border-slate-300';
      const shortLabel =
        activeLanguage === 'ta' ? zone.nameTa.split('–')[0].trim() : zone.nameEn.split('–')[0].trim();

      const zoneIcon = L.divIcon({
        className: 'sub-locality-pin',
        html: `
          <div class="px-2 py-0.5 rounded-full ${bgColor} ${ringColor} text-[9px] font-bold shadow-md flex items-center space-x-1 whitespace-nowrap cursor-pointer transform hover:scale-110 transition-transform">
            <span>${zone.statusIcon}</span>
            <span>${shortLabel}</span>
          </div>
        `,
        iconSize: [110, 24],
        iconAnchor: [55, 12],
      });

      const pin = L.marker([zone.latitude, zone.longitude], { icon: zoneIcon });
      pin.bindPopup(`
        <div class="p-2 text-xs max-w-[240px] font-sans">
          <strong class="text-slate-900 font-bold block text-sm border-b pb-1 border-slate-100">
            ${activeLanguage === 'ta' ? zone.nameTa : zone.nameEn}
          </strong>
          <div class="mt-1.5 flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <span class="text-slate-600 font-medium">${activeLanguage === 'ta' ? 'மழை நிலை' : 'Rain Status'}:</span>
            <b class="${isRain ? 'text-sky-600' : isDrizzle ? 'text-cyan-600' : 'text-slate-700'}">
              ${zone.statusIcon} ${zone.status.toUpperCase()} (${zone.prob}%)
            </b>
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
      radarLayerRef.current = null;
    }

    if (activeLayerType === 'radar' || activeLayerType === 'both') {
      const radarLayer = L.tileLayer(radarTileUrl, {
        opacity: opacity,
        zIndex: 10,
        maxZoom: 22,
        maxNativeZoom: 12, // Native radar tiles up to zoom 12, interpolated seamlessly above zoom 12!
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
    }, playSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, radarFrames.length, playSpeed]);

  // Map Controls Helpers
  const handleZoomIn = () => {
    if (leafletMap.current) {
      leafletMap.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (leafletMap.current) {
      leafletMap.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (leafletMap.current) {
      leafletMap.current.flyTo([lat, lon], 14, { duration: 1.2 });
      if (markerRef.current) {
        setTimeout(() => markerRef.current?.openPopup(), 1200);
      }
    }
  };

  // In-Map Search Location Execution
  const handleSearchCity = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchLocation(searchQuery.trim());
      setSearchResults(results.slice(0, 5));
    } catch (err) {
      console.warn('Map location search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (loc) => {
    if (!leafletMap.current || !loc) return;
    const destLat = loc.latitude ?? loc.lat;
    const destLon = loc.longitude ?? loc.lon;

    if (searchPinRef.current) {
      leafletMap.current.removeLayer(searchPinRef.current);
    }

    leafletMap.current.flyTo([destLat, destLon], 15, { duration: 1.5 });

    const pinIcon = L.divIcon({
      className: 'searched-pin',
      html: `
        <div class="px-2 py-1 rounded-full bg-rose-600 text-white font-bold text-[11px] shadow-lg border-2 border-white flex items-center space-x-1 animate-bounce">
          <span>📍</span>
          <span>${loc.name}</span>
        </div>
      `,
      iconSize: [80, 28],
      iconAnchor: [40, 28],
    });

    const searchMarker = L.marker([destLat, destLon], { icon: pinIcon }).addTo(leafletMap.current);
    searchMarker.bindPopup(`
      <div class="p-1.5 text-xs">
        <strong class="text-rose-600 font-bold">${loc.name}</strong>
        <div class="text-[10px] text-slate-500">${loc.admin1 || ''}, ${loc.country || ''}</div>
        <div class="text-[9px] text-slate-400 mt-1">Lat: ${destLat.toFixed(4)}, Lon: ${destLon.toFixed(4)}</div>
      </div>
    `).openPopup();

    searchPinRef.current = searchMarker;
    setSearchResults([]);
    setSearchQuery('');
  };

  const activeTimestamp = radarFrames[activeFrameIndex]?.time
    ? new Date(radarFrames[activeFrameIndex].time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Live Stream';

  const zoomDetailLabel =
    currentZoom >= 18
      ? 'Ultra Zoom (Building / Street Level)'
      : currentZoom >= 14
      ? 'Town / Neighborhood Detail'
      : currentZoom >= 9
      ? 'District / City View'
      : 'Regional Radar View';

  return (
    <div
      className={`relative flex flex-col rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-lg transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none border-none'
          : compact
          ? 'h-[320px] w-full'
          : 'w-full'
      }`}
      style={{ height: isFullscreen ? '100vh' : compact ? '320px' : height }}
    >
      {/* 1. Header Toolbar (Title + Basemap Switcher + Fullscreen Toggle) */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 z-20">
        {/* Title & Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center space-x-1.5">
                <span>{r.title || 'Google Maps Live Radar & Satellite GIS'}</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              {locName} • {zoomDetailLabel} (Zoom: {currentZoom}x)
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Basemap Picker Segmented Pill Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[10px] font-bold">
            {Object.values(BASE_MAP_PROVIDERS).map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => setSelectedBaseMap(provider.id)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                  selectedBaseMap === provider.id
                    ? 'bg-white text-sky-700 shadow-2xs font-black ring-1 ring-sky-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={provider.name}
              >
                <span>{provider.icon}</span>
                <span className="hidden md:inline">{activeLanguage === 'ta' ? provider.nameTa.split(' ')[0] : provider.name.split(' ')[1] || provider.name}</span>
              </button>
            ))}
          </div>

          {/* Sub-Locality Pins Toggle */}
          <button
            type="button"
            onClick={() => setShowMicroZones(!showMicroZones)}
            className={`px-2 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs ${
              showMicroZones
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={activeLanguage === 'ta' ? 'பகுதிவாரி நிலையங்கள் (Sub-Locality Pins)' : 'Toggle Sub-Locality Pins'}
          >
            <MapPin className="w-3 h-3" />
            <span className="hidden sm:inline">{activeLanguage === 'ta' ? 'பகுதிவாரி' : 'Micro-Zones'}</span>
          </button>

          {/* Fullscreen Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen Google Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-rose-600" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Map Canvas with Overlay UI Controls */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Leaflet Map DOM Element */}
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: isFullscreen ? '100%' : compact ? '220px' : '400px' }}></div>

        {/* Overlay: Top Floating City / Locality Search Bar */}
        <div className="absolute top-3 left-3 z-[1000] max-w-[280px] sm:max-w-xs w-full">
          <form onSubmit={handleSearchCity} className="relative shadow-md rounded-2xl">
            <input
              type="text"
              placeholder={activeLanguage === 'ta' ? 'ஊர் / இடத்தை தேடுக...' : 'Search street, city, town...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="mt-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto animate-fadeIn">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-700 font-medium transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">📍 {res.name}, {res.admin1 || res.country}</span>
                  <span className="text-[9px] text-sky-600 font-bold ml-1">Fly ➔</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Overlay: Google-Style Zoom Controls & Recenter GPS (Bottom-Right) */}
        <div className="absolute top-3 right-3 sm:top-auto sm:bottom-6 sm:right-4 z-[1000] flex flex-col space-y-1.5 shadow-md">
          {/* Zoom In (+) */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Zoom In (Street Level)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Zoom Out (-) */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Recenter to Location GPS */}
          <button
            type="button"
            onClick={handleRecenter}
            className="w-8 h-8 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Recenter Map to Selected Location"
          >
            <Navigation2 className="w-4 h-4" />
          </button>
        </div>

        {/* Overlay: Current Zoom Level Badge (Bottom-Center or Top-Center) */}
        <div className="absolute top-14 sm:top-3 right-3 z-[1000] hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white font-mono text-[10px] shadow-md border border-slate-700">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Zoom: {currentZoom}x</span>
        </div>

        {/* Overlay: Precipitation dBZ Legend (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 z-[1000] p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 shadow-md space-y-1 max-w-[200px] sm:max-w-xs">
          <div className="font-bold text-slate-900 text-[10px] flex items-center justify-between">
            <span>Precipitation (dBZ)</span>
            <span className="text-[9px] text-sky-600 font-mono font-normal">HD Echo</span>
          </div>
          <div className="flex items-center space-x-1 text-[9px]">
            <span className="text-slate-500">{r.light || 'Light'}</span>
            <div className="h-2 w-20 sm:w-28 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-600 border border-slate-300"></div>
            <span className="text-rose-600 font-bold">{r.heavy || 'Heavy'}</span>
          </div>
        </div>

        {/* Overlay: Radar Playback & Timeline Scrubber Bar (Bottom-Right / Bottom Center) */}
        {radarFrames.length > 0 && (
          <div className="absolute bottom-3 right-14 sm:right-16 z-[1000] p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md flex items-center space-x-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-xl font-medium flex items-center justify-center transition-all shadow-xs cursor-pointer ${
                isPlaying
                  ? 'bg-sky-600 text-white hover:bg-sky-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isPlaying ? 'Pause Loop' : 'Play Loop'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Time Stamp */}
            <span className="text-[10px] font-mono text-slate-700 whitespace-nowrap">
              🕒 {activeTimestamp}
            </span>

            {/* Scrubber Slider */}
            <input
              type="range"
              min="0"
              max={radarFrames.length - 1}
              value={activeFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setActiveFrameIndex(Number(e.target.value));
              }}
              className="w-16 sm:w-24 accent-sky-600 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 3. Bottom Fine-Tuning Drawer (Opacity, Color Scheme, Layer Mode) */}
      <div className="bg-slate-50 border-t border-slate-200 p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Layer Mode Picker */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">Layer:</span>
          <select
            value={activeLayerType}
            onChange={(e) => setActiveLayerType(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded-xl text-sky-800 text-[11px] font-bold focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="radar">🌧️ Doppler Radar (dBZ)</option>
            <option value="satellite">☁️ Satellite Infrared</option>
            <option value="lightning">⚡ Live Lightning Strikes</option>
            <option value="both">🛰️ Multi-Layer Composite</option>
          </select>
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">Radar Opacity:</span>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-16 sm:w-20 accent-sky-600 cursor-pointer"
            title={`Opacity: ${Math.round(opacity * 100)}%`}
          />
          <span className="text-[10px] font-mono text-slate-600">{Math.round(opacity * 100)}%</span>
        </div>

        {/* Color Palette Selector */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-bold text-slate-600 hidden md:inline">Color Palette:</span>
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(Number(e.target.value))}
            className="px-2 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 text-[11px] focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value={2}>Doppler Standard</option>
            <option value={1}>RainViewer HD</option>
            <option value={4}>NOAA NWS</option>
            <option value={6}>Rainbow High Contrast</option>
          </select>
        </div>

        {/* External Google Maps Button */}
        <a
          href={`https://www.google.com/maps/@${lat},${lon},14z`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-white hover:bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200 shadow-2xs transition-all flex items-center space-x-1"
        >
          <span>Google Maps</span>
          <ExternalLink className="w-3 h-3 text-sky-600" />
        </a>
      </div>
    </div>
  );
}

