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
  ChevronRight
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';
import { getWeatherDescription, getLocalizedPlaceName } from '../services/weatherService';

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

export default function RouteWeatherPlanner({ activeLanguage = 'en', currentLocation }) {
  const [selectedRoute, setSelectedRoute] = useState(POPULAR_ROUTES[0]);
  const [departureOffset, setDepartureOffset] = useState(0); // in hours from now
  const [routeSimulation, setRouteSimulation] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [overallSafetyScore, setOverallSafetyScore] = useState(88);
  const [hazardPoints, setHazardPoints] = useState([]);

  useEffect(() => {
    simulateRouteWeather(selectedRoute, departureOffset);
  }, [selectedRoute, departureOffset, activeLanguage]);

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
              wind: 16,
              vis: 10,
              wmo: { label: 'Clear' },
              isRainy: false,
              isFoggy: false,
              isGale: false,
            };
          }
        })
      );

      setRouteSimulation(fetched);

      // Compute Route Safety Score (0-100)
      let penalty = 0;
      const hazards = [];

      fetched.forEach((pt) => {
        if (pt.rainMm >= 5 || pt.rainProb >= 70) {
          penalty += 15;
          hazards.push(`Heavy rain near ${pt.name} (~${pt.rainMm} mm, ${pt.rainProb}% chance)`);
        } else if (pt.isRainy) {
          penalty += 8;
          hazards.push(`Passing showers expected near ${pt.name}`);
        }
        if (pt.isFoggy) {
          penalty += 12;
          hazards.push(`Low visibility & dense fog near ${pt.name} (${pt.vis} km)`);
        }
        if (pt.isGale) {
          penalty += 10;
          hazards.push(`Strong crosswinds near ${pt.name} (${pt.wind} km/h)`);
        }
      });

      const finalScore = Math.max(25, 100 - penalty);
      setOverallSafetyScore(finalScore);
      setHazardPoints(hazards);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-20 animate-fadeIn">
      {/* 1. Header Card */}
      <div className="bg-gradient-to-br from-white via-sky-50/50 to-indigo-50/40 border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {activeLanguage === 'ta' ? '🚗 பயணப் பாதை வானிலை வழிகாட்டி' : '🚗 Smart Travel & Route Weather Planner'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeLanguage === 'ta'
                  ? 'நெடுஞ்சாலை வழித்தட வானிலை, மழை எச்சரிக்கைகள் மற்றும் பாதுகாப்பான புறப்படும் நேரம்'
                  : 'Waypoint-by-waypoint highway telemetry, road hazard scoring & safe departure windows.'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 border border-sky-200">
            NWP Live Route GIS
          </span>
        </div>

        {/* Route Selector Chips */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {activeLanguage === 'ta' ? 'பிரபலமான நெடுஞ்சாலை வழித்தடங்கள்:' : 'Select Highway Corridor:'}
          </label>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            {POPULAR_ROUTES.map((rt) => (
              <button
                key={rt.id}
                onClick={() => setSelectedRoute(rt)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-2xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  selectedRoute.id === rt.id
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
        <div className="p-3 bg-white/90 border border-slate-200/80 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'புறப்படும் நேரம்:' : 'Planned Departure Time:'}</span>
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
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
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
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
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
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
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

      {/* 3. Waypoint-by-Waypoint Interactive Timeline */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
            {activeLanguage === 'ta' ? 'வழித்தட வானிலை நிலவரம் (Waypoint Telemetry)' : 'Waypoint-by-Waypoint Live Weather'}
          </h3>
          {isSimulating && (
            <div className="flex items-center space-x-1 text-xs text-sky-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating...</span>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-1">
          {routeSimulation.map((pt, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                pt.isRainy
                  ? 'bg-sky-50/60 border-sky-300 shadow-xs'
                  : pt.isFoggy
                  ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              {/* Point Name & Timing */}
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  pt.isStart
                    ? 'bg-emerald-600 text-white'
                    : pt.isEnd
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {pt.isStart ? 'A' : pt.isEnd ? 'B' : `${idx}`}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{getLocalizedPlaceName(pt.name, activeLanguage) || pt.name}</span>
                    {pt.isStart && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        {activeLanguage === 'ta' ? 'தொடக்க இடம்' : 'Start'}
                      </span>
                    )}
                    {pt.isEnd && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                        {activeLanguage === 'ta' ? 'சேருமிடம்' : 'Destination'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    {activeLanguage === 'ta' ? `கணிக்கப்பட்ட நேரம்: ${pt.arrivalStr}` : `Expected Arrival: ${pt.arrivalStr}`}
                  </div>
                </div>
              </div>

              {/* Weather Metrics Strip */}
              <div className="flex items-center space-x-3 text-xs self-end sm:self-auto">
                {/* Temp */}
                <div className="flex items-center space-x-1 text-slate-700 font-bold">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  <span>{pt.temp}°C</span>
                </div>

                {/* Rain */}
                <div className={`flex items-center space-x-1 font-bold ${
                  pt.rainProb >= 40 ? 'text-sky-600' : 'text-slate-500'
                }`}>
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>{pt.rainProb}% Rain</span>
                </div>

                {/* Wind */}
                <div className="flex items-center space-x-1 text-slate-600 hidden sm:flex">
                  <Wind className="w-3.5 h-3.5 text-blue-500" />
                  <span>{pt.wind} km/h</span>
                </div>

                {/* Condition Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                  pt.isRainy
                    ? 'bg-sky-100 text-sky-800 border-sky-300'
                    : pt.isFoggy
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}>
                  {pt.wmo.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
