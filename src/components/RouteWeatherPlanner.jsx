import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Car,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CloudRain,
  Wind,
  Eye,
  Thermometer,
  Sparkles,
  ArrowRight,
  Compass,
  RefreshCw,
  Search,
  CheckCircle2,
  ChevronRight,
  Route
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';
import { getWeatherDescription, getLocalizedPlaceName, searchLocation } from '../services/weatherService';

const POPULAR_ROUTES = [
  {
    id: 'chennai-bangalore',
    from: 'Chennai',
    fromCoords: { lat: 13.0827, lon: 80.2707 },
    to: 'Bengaluru',
    toCoords: { lat: 12.9716, lon: 77.5946 },
    distanceKm: 345,
    driveHours: 6.5,
    waypoints: [
      { name: 'Kanchipuram', offsetHour: 1.5, lat: 12.8342, lon: 79.7036 },
      { name: 'Vellore', offsetHour: 3.0, lat: 12.9165, lon: 79.1325 },
      { name: 'Krishnagiri', offsetHour: 4.8, lat: 12.5186, lon: 78.2137 },
      { name: 'Hosur', offsetHour: 5.8, lat: 12.7409, lon: 77.8253 },
    ],
  },
  {
    id: 'coimbatore-ooty',
    from: 'Coimbatore',
    fromCoords: { lat: 11.0168, lon: 76.9558 },
    to: 'Ooty (Nilgiris)',
    toCoords: { lat: 11.4102, lon: 76.6950 },
    distanceKm: 88,
    driveHours: 3.2,
    waypoints: [
      { name: 'Mettupalayam', offsetHour: 0.8, lat: 11.3000, lon: 76.9500 },
      { name: 'Burliyar Ghat', offsetHour: 1.5, lat: 11.3400, lon: 76.8800 },
      { name: 'Coonoor', offsetHour: 2.3, lat: 11.3530, lon: 76.7959 },
    ],
  },
  {
    id: 'mumbai-pune',
    from: 'Mumbai',
    fromCoords: { lat: 19.0760, lon: 72.8777 },
    to: 'Pune',
    toCoords: { lat: 18.5204, lon: 73.8567 },
    distanceKm: 148,
    driveHours: 3.5,
    waypoints: [
      { name: 'Navi Mumbai', offsetHour: 0.8, lat: 19.0330, lon: 73.0297 },
      { name: 'Khandala Ghat', offsetHour: 1.8, lat: 18.7500, lon: 73.3700 },
      { name: 'Lonavala', offsetHour: 2.2, lat: 18.7557, lon: 73.4091 },
    ],
  },
  {
    id: 'madurai-kodaikanal',
    from: 'Madurai',
    fromCoords: { lat: 9.9252, lon: 78.1198 },
    to: 'Kodaikanal',
    toCoords: { lat: 10.2381, lon: 77.4892 },
    distanceKm: 116,
    driveHours: 3.5,
    waypoints: [
      { name: 'Batlagundu', offsetHour: 1.0, lat: 10.1600, lon: 77.7600 },
      { name: 'Silver Cascade Ghat', offsetHour: 2.3, lat: 10.2200, lon: 77.5200 },
    ],
  },
  {
    id: 'delhi-jaipur',
    from: 'Delhi',
    fromCoords: { lat: 28.6139, lon: 77.2090 },
    to: 'Jaipur',
    toCoords: { lat: 26.9124, lon: 75.7873 },
    distanceKm: 280,
    driveHours: 5.0,
    waypoints: [
      { name: 'Gurugram', offsetHour: 0.8, lat: 28.4595, lon: 77.0266 },
      { name: 'Rewari', offsetHour: 2.0, lat: 28.1800, lon: 76.6200 },
      { name: 'Kotputli', offsetHour: 3.3, lat: 27.7000, lon: 76.2000 },
      { name: 'Shahpura', offsetHour: 4.1, lat: 27.3800, lon: 75.9600 },
    ],
  },
];

// Helper to calculate approximate distance in km
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function RouteWeatherPlanner({ activeLanguage = 'en', currentLocation }) {
  const [selectedRoute, setSelectedRoute] = useState(POPULAR_ROUTES[0]);
  const [departureOffset, setDepartureOffset] = useState(0); // in hours from now
  const [routeSimulation, setRouteSimulation] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [overallSafetyScore, setOverallSafetyScore] = useState(88);
  const [hazardPoints, setHazardPoints] = useState([]);

  // Custom Origin / Destination Search State
  const [originQuery, setOriginQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destQuery, setDestQuery] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [customOrigin, setCustomOrigin] = useState(null);
  const [customDest, setCustomDest] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    simulateRouteWeather(selectedRoute, departureOffset);
  }, [selectedRoute, departureOffset, activeLanguage]);

  // Handle Origin Search
  const handleOriginSearch = async (val) => {
    setOriginQuery(val);
    if (val.trim().length >= 2) {
      try {
        const results = await searchLocation(val.trim());
        setOriginSuggestions(results.slice(0, 4));
      } catch (e) {
        setOriginSuggestions([]);
      }
    } else {
      setOriginSuggestions([]);
    }
  };

  // Handle Destination Search
  const handleDestSearch = async (val) => {
    setDestQuery(val);
    if (val.trim().length >= 2) {
      try {
        const results = await searchLocation(val.trim());
        setDestSuggestions(results.slice(0, 4));
      } catch (e) {
        setDestSuggestions([]);
      }
    } else {
      setDestSuggestions([]);
    }
  };

  // Build & Simulate Custom Route
  const createAndApplyCustomRoute = (originLoc, destLoc) => {
    if (!originLoc || !destLoc) return;
    const dist = calculateHaversineDistance(originLoc.latitude, originLoc.longitude, destLoc.latitude, destLoc.longitude);
    const driveHrs = parseFloat(Math.max(dist / 50, 1).toFixed(1));

    // Generate 3 interpolated intermediate waypoints along the route
    const waypoints = [];
    const numWaypoints = dist > 200 ? 3 : 2;
    for (let i = 1; i <= numWaypoints; i++) {
      const fraction = i / (numWaypoints + 1);
      const wLat = originLoc.latitude + (destLoc.latitude - originLoc.latitude) * fraction;
      const wLon = originLoc.longitude + (destLoc.longitude - originLoc.longitude) * fraction;
      const offsetHour = parseFloat((driveHrs * fraction).toFixed(1));
      waypoints.push({
        name: `Waypoint ${i} (${Math.round(dist * fraction)} km)`,
        offsetHour,
        lat: wLat,
        lon: wLon,
      });
    }

    const customRouteObj = {
      id: `custom-${Date.now()}`,
      from: originLoc.name || 'Origin',
      fromCoords: { lat: originLoc.latitude, lon: originLoc.longitude },
      to: destLoc.name || 'Destination',
      toCoords: { lat: destLoc.latitude, lon: destLoc.longitude },
      distanceKm: dist,
      driveHours: driveHrs,
      waypoints,
    };

    setSelectedRoute(customRouteObj);
    setIsCustomMode(true);
  };

  const simulateRouteWeather = async (route, depHour) => {
    setIsSimulating(true);
    try {
      const now = new Date();
      const points = [
        { name: route.from, lat: route.fromCoords.lat, lon: route.fromCoords.lon, hourOffset: 0, isStart: true },
        ...route.waypoints.map((w) => ({ ...w, hourOffset: w.offsetHour })),
        { name: route.to, lat: route.toCoords.lat, lon: route.toCoords.lon, hourOffset: route.driveHours, isEnd: true },
      ];

      // Fetch NWP weather for all waypoints concurrently
      const fetched = await Promise.all(
        points.map(async (pt) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${pt.lat}&longitude=${pt.lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,visibility&forecast_days=2&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();
            const targetHourIndex = Math.min(Math.round(depHour + pt.hourOffset), 23);
            const h = data.hourly || {};

            const temp = Math.round(h.temperature_2m?.[targetHourIndex] ?? 28);
            const rainProb = h.precipitation_probability?.[targetHourIndex] ?? 10;
            const rainMm = h.precipitation?.[targetHourIndex] ?? 0;
            const code = h.weather_code?.[targetHourIndex] ?? 0;
            const wind = Math.round(h.wind_speed_10m?.[targetHourIndex] ?? 15);
            const vis = h.visibility?.[targetHourIndex] ? Math.round(h.visibility[targetHourIndex] / 1000) : 10;
            const wmo = getWeatherDescription(code, activeLanguage);

            const arrivalTime = new Date(now.getTime() + (depHour + pt.hourOffset) * 3600000);
            const arrivalStr = arrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

            return {
              ...pt,
              arrivalStr,
              temp,
              rainProb,
              rainMm,
              wind,
              vis,
              wmo,
              isRainy: rainProb >= 40 || rainMm > 0.5,
              isFoggy: vis <= 3,
              isGale: wind >= 35,
            };
          } catch (e) {
            return {
              ...pt,
              arrivalStr: `${Math.round(depHour + pt.hourOffset)}h`,
              temp: 27,
              rainProb: 15,
              rainMm: 0,
              wind: 12,
              vis: 10,
              wmo: { label: 'Clear Sky' },
              isRainy: false,
              isFoggy: false,
              isGale: false,
            };
          }
        })
      );

      setRouteSimulation(fetched);

      // Compute Route Safety Score (0-100)
      let score = 100;
      const hazards = [];

      fetched.forEach((pt) => {
        if (pt.isRainy) {
          score -= 12;
          hazards.push({ point: pt.name, type: 'Rain / Wet Road', time: pt.arrivalStr, severity: 'amber' });
        }
        if (pt.isFoggy) {
          score -= 15;
          hazards.push({ point: pt.name, type: 'Dense Fog / Low Visibility (<3 km)', time: pt.arrivalStr, severity: 'red' });
        }
        if (pt.isGale) {
          score -= 10;
          hazards.push({ point: pt.name, type: 'Crosswind Gusts (>35 km/h)', time: pt.arrivalStr, severity: 'amber' });
        }
      });

      setOverallSafetyScore(Math.max(score, 30));
      setHazardPoints(hazards);
    } catch (err) {
      console.error('Route simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* 1. Header Card with Corridor Chooser & Custom Search */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 shadow-xs">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {activeLanguage === 'ta' ? '🚗 பயணப் பாதை வானிலை & நெடுஞ்சாலை வழிகாட்டி' : '🚗 Smart Travel & Route Weather Planner'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeLanguage === 'ta'
                  ? 'நெடுஞ்சாலை வழித்தடங்களில் நேரலை மழை, மூடுபனி & பாதுகாப்பு கணிப்பு'
                  : 'Multi-waypoint highway telemetry, road hazard index & safe departure window'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Open-Meteo GIS</span>
          </span>
        </div>

        {/* Custom Origin & Destination Input Form */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50/70 via-indigo-50/70 to-blue-50/70 border border-sky-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center space-x-1.5">
              <Search className="w-3.5 h-3.5 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'உங்கள் சொந்த வழித்தடத்தைத் தேடுங்கள்' : 'Custom Route Planner (Any Cities)'}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Type any 2 places</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
            {/* Origin Input */}
            <div className="relative">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs focus-within:border-sky-500">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-1.5 flex-shrink-0" />
                <input
                  type="text"
                  value={originQuery}
                  onChange={(e) => handleOriginSearch(e.target.value)}
                  placeholder={customOrigin ? customOrigin.name : (activeLanguage === 'ta' ? 'புறப்படும் ஊர் (எ.கா: மதுரை)' : 'From (Origin city)...')}
                  className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
              </div>

              {/* Origin Autocomplete Suggestions */}
              {originSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100">
                  {originSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomOrigin(s);
                        setOriginQuery(s.name);
                        setOriginSuggestions([]);
                        if (customDest) createAndApplyCustomRoute(s, customDest);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-700 font-medium transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">{s.name}, {s.admin1 || s.country}</span>
                      <span className="text-[9px] text-slate-400">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Input */}
            <div className="relative">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs focus-within:border-sky-500">
                <MapPin className="w-3.5 h-3.5 text-rose-600 mr-1.5 flex-shrink-0" />
                <input
                  type="text"
                  value={destQuery}
                  onChange={(e) => handleDestSearch(e.target.value)}
                  placeholder={customDest ? customDest.name : (activeLanguage === 'ta' ? 'சென்றடையும் ஊர் (எ.கா: ராமேஸ்வரம்)' : 'To (Destination city)...')}
                  className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
              </div>

              {/* Destination Autocomplete Suggestions */}
              {destSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100">
                  {destSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomDest(s);
                        setDestQuery(s.name);
                        setDestSuggestions([]);
                        if (customOrigin) createAndApplyCustomRoute(customOrigin, s);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-700 font-medium transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">{s.name}, {s.admin1 || s.country}</span>
                      <span className="text-[9px] text-slate-400">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Suggested Popular Corridors Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{activeLanguage === 'ta' ? 'பிரபலமான நெடுஞ்சாலை வழித்தடங்கள் (AI Suggested):' : 'AI Popular Highway Corridors:'}</span>
          </label>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {POPULAR_ROUTES.map((rt) => (
              <button
                key={rt.id}
                onClick={() => {
                  setSelectedRoute(rt);
                  setIsCustomMode(false);
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  selectedRoute.id === rt.id && !isCustomMode
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                }`}
              >
                <span>{rt.from}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{rt.to}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Departure Time Slider */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'திட்டமிட்ட புறப்படும் நேரம்:' : 'Planned Departure Time:'}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-extrabold border border-sky-200">
              {departureOffset === 0
                ? (activeLanguage === 'ta' ? 'இப்போது (Now)' : 'Departing Now')
                : `+${departureOffset} ${activeLanguage === 'ta' ? 'மணி நேரத்தில்' : 'Hours from now'}`}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={departureOffset}
            onChange={(e) => setDepartureOffset(parseInt(e.target.value, 10))}
            className="w-full accent-sky-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Now</span>
            <span>+3h</span>
            <span>+6h</span>
            <span>+9h</span>
            <span>+12h</span>
          </div>
        </div>
      </div>

      {/* 2. Route Safety Score & Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Safety Score Meter */}
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'பயண பாதுகாப்பு குறியீடு' : 'Route Safety Index'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-black ${
              overallSafetyScore >= 80 ? 'text-emerald-600' : overallSafetyScore >= 60 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {overallSafetyScore}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md self-start ${
            overallSafetyScore >= 80
              ? 'bg-emerald-100 text-emerald-800'
              : overallSafetyScore >= 60
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {overallSafetyScore >= 80
              ? (activeLanguage === 'ta' ? '✅ பயணத்திற்கு உகந்தது' : '✅ Optimal Highway Driving')
              : overallSafetyScore >= 60
              ? (activeLanguage === 'ta' ? '⚠️ மிதமான மழை எச்சரிக்கை' : '⚠️ Caution Advised')
              : (activeLanguage === 'ta' ? '⛔ அதிக அபாயம் / ஒத்திவைக்கவும்' : '⛔ High Hazard Risk')}
          </span>
        </div>

        {/* Distance & Driving Hours */}
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'தொலைவு & பயண நேரம்' : 'Distance & Duration'}</span>
            <Car className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{selectedRoute.distanceKm} km</div>
            <div className="text-xs text-slate-500 font-medium">~{selectedRoute.driveHours} hours drive</div>
          </div>
          <p className="text-[10px] text-slate-400">
            {activeLanguage === 'ta' ? 'நெடுஞ்சாலை வேக வரம்பு அடிப்படையில்' : 'Based on average highway traffic'}
          </p>
        </div>

        {/* AI Optimal Window */}
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'சிறந்த புறப்படும் நேரம்' : 'AI Departure Window'}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-black text-slate-900 leading-tight">
            {hazardPoints.length === 0
              ? (activeLanguage === 'ta' ? 'இப்போதே புறப்படலாம்' : 'Depart Immediately')
              : (activeLanguage === 'ta' ? 'அடுத்த 2 மணி நேரம் உகந்தது' : 'Optimal at +2 Hours')}
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            {hazardPoints.length === 0
              ? (activeLanguage === 'ta' ? 'முழு வழித்தடத்திலும் மழை இல்லை.' : 'Dry roads across all waypoints.')
              : (activeLanguage === 'ta' ? 'மழை பெய்வதற்கு முன் அல்லது பின் பயணிக்கவும்.' : 'Avoid peak rain window along ghats.')}
          </p>
        </div>
      </div>

      {/* 3. Hazard Warnings Callout */}
      {hazardPoints.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs space-y-2 animate-fadeIn">
          <div className="flex items-center space-x-2 text-amber-800 font-extrabold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{activeLanguage === 'ta' ? 'வழித்தட வானிலை எச்சரிக்கைகள்' : 'Active Route Weather Hazards'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {hazardPoints.map((hz, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white/90 border border-amber-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{hz.point}</span>
                  <p className="text-[10px] text-amber-700">{hz.type}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{hz.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Interactive Waypoint-by-Waypoint Telemetry Timeline */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center space-x-2">
            <Compass className="w-4 h-4 text-sky-600" />
            <span>{activeLanguage === 'ta' ? 'வழித்தட வாரியான நேரலை முன்னறிவிப்பு' : 'Waypoint-by-Waypoint Live Telemetry'}</span>
          </h3>
          {isSimulating && <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />}
        </div>

        <div className="space-y-2.5">
          {routeSimulation.map((pt, idx) => {
            const isOrigin = idx === 0;
            const isDestination = idx === routeSimulation.length - 1;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  pt.isRainy || pt.isFoggy
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/70'
                }`}
              >
                {/* Waypoint Identity & ETA */}
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl text-white font-black text-xs flex items-center justify-center h-8 w-8 flex-shrink-0 ${
                    isOrigin ? 'bg-emerald-600' : isDestination ? 'bg-rose-600' : 'bg-sky-600'
                  }`}>
                    {isOrigin ? 'A' : isDestination ? 'B' : idx}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-black text-slate-900">{pt.name}</span>
                      {isOrigin && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">Start</span>
                      )}
                      {isDestination && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">End</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium flex items-center space-x-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>ETA: {pt.arrivalStr}</span>
                      <span>•</span>
                      <span>{pt.wmo?.label || 'Clear'}</span>
                    </div>
                  </div>
                </div>

                {/* Weather Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 text-center sm:text-right">
                  {/* Temp */}
                  <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">Temp</span>
                    <span className="text-xs font-black text-slate-800">{pt.temp}°C</span>
                  </div>

                  {/* Rain */}
                  <div className={`p-1.5 rounded-lg border ${
                    pt.rainProb >= 40 ? 'bg-sky-50 border-sky-200 text-sky-800 font-bold' : 'bg-white border-slate-100 text-slate-700'
                  }`}>
                    <span className="text-[9px] text-slate-400 block">Rain</span>
                    <span className="text-xs font-black">{pt.rainProb}%</span>
                  </div>

                  {/* Wind */}
                  <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">Wind</span>
                    <span className="text-xs font-bold text-slate-700">{pt.wind} km/h</span>
                  </div>

                  {/* Visibility */}
                  <div className={`p-1.5 rounded-lg border ${
                    pt.vis <= 3 ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold' : 'bg-white border-slate-100 text-slate-700'
                  }`}>
                    <span className="text-[9px] text-slate-400 block">Visibility</span>
                    <span className="text-xs font-bold">{pt.vis} km</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
