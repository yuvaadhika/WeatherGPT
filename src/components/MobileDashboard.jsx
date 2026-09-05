import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Sparkles,
  Search,
  Bell,
  BellRing,
  Droplets,
  Wind,
  Sun,
  ShieldAlert,
  Thermometer,
  CloudRain,
  Eye,
  ChevronRight,
  Radio,
  Clock,
  Compass,
  Zap,
  PhoneCall,
  Volume2,
  Mic,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Wheat,
  Share2,
  Maximize2
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';
import { getWeatherDescription, getLocalizedPlaceName } from '../services/weatherService';

export default function MobileDashboard({
  activeLanguage = 'en',
  currentLocation,
  weatherData,
  aqiData,
  alerts = [],
  riskData,
  onOpenRadar,
  onOpenChat,
  onOpenAlerts,
  onOpenXAI,
  onOpenAlertModal,
  onDetectLocation,
  onSelectCity,
  notificationsEnabled
}) {
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const current = weatherData?.current || {};
  const daily = weatherData?.daily || {};
  const hourly = weatherData?.hourly || {};

  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=${activeLanguage}&format=json`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (city) => {
    const localizedName = getLocalizedPlaceName(city.name, activeLanguage) || city.name;
    onSelectCity({
      ...city,
      rawName: city.name,
      name: localizedName,
    });
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const wmo = getWeatherDescription(current.weather_code || 0, activeLanguage);
  const tempC = current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : 28;
  const feelsLike = current.apparent_temperature !== undefined ? Math.round(current.apparent_temperature) : tempC + 3;
  const rainToday = (daily.precipitation_sum?.[0] || current.precipitation || 0).toFixed(1);
  const windKmh = current.wind_speed_10m !== undefined ? Math.round(current.wind_speed_10m) : 18;
  const windGust = current.wind_gusts_10m !== undefined ? Math.round(current.wind_gusts_10m) : Math.round(windKmh * 1.4);
  const humidity = current.relative_humidity_2m !== undefined ? Math.round(current.relative_humidity_2m) : 82;
  const dewPoint = (tempC - (100 - humidity) / 5).toFixed(0);
  const aqiVal = aqiData?.current?.us_aqi || 48;
  const uvVal = current.uv_index !== undefined ? current.uv_index : (daily.uv_index_max?.[0] || 6);

  const riskScore = riskData?.score || 75;
  const riskLevel = riskData?.level || 'high';
  const riskBadge = riskData?.badgeText || (activeLanguage === 'ta' ? 'அதிக அபாயம்' : 'High Risk');
  const riskSummary = riskData?.summary || (activeLanguage === 'ta' ? 'கனமழை + நகர்ப்புற வெள்ள அபாயம்' : 'Heavy Rainfall + Severe Flooding');

  const getRiskScoreColor = (score) => {
    if (score >= 80) return '#e11d48'; // red
    if (score >= 65) return '#ea580c'; // orange
    if (score >= 40) return '#d97706'; // amber
    return '#059669'; // emerald
  };

  const getRiskBadgeClass = (score) => {
    if (score >= 80) return 'bg-rose-500/15 text-rose-600 border-rose-300';
    if (score >= 65) return 'bg-orange-500/15 text-orange-600 border-orange-300';
    if (score >= 40) return 'bg-amber-500/15 text-amber-600 border-amber-300';
    return 'bg-emerald-500/15 text-emerald-600 border-emerald-300';
  };

  // Next 24 hours slice
  const next24Hours = (hourly.time || []).slice(0, 12).map((timeStr, idx) => {
    const d = new Date(timeStr);
    const hourLabel = idx === 0 ? (activeLanguage === 'ta' ? 'இப்போது' : 'Now') : d.toLocaleTimeString([], { hour: 'numeric' });
    const hTemp = Math.round(hourly.temperature_2m?.[idx] ?? tempC);
    const hRainProb = hourly.precipitation_probability?.[idx] ?? Math.min(100, Math.round((hourly.precipitation?.[idx] || 0) * 20));
    const hCode = hourly.weather_code?.[idx] ?? 0;
    const hWmo = getWeatherDescription(hCode, activeLanguage);
    return { hourLabel, hTemp, hRainProb, hWmo };
  });

  // Next 7 days slice
  const next7Days = (daily.time || []).slice(0, 7).map((dateStr, idx) => {
    const d = new Date(dateStr);
    const dayLabel = idx === 0
      ? (activeLanguage === 'ta' ? 'இன்று' : 'Today')
      : idx === 1
      ? (activeLanguage === 'ta' ? 'நாளை' : 'Tomorrow')
      : d.toLocaleDateString(activeLanguage === 'ta' ? 'ta-IN' : 'en-US', { weekday: 'short' });
    const maxT = Math.round(daily.temperature_2m_max?.[idx] ?? 32);
    const minT = Math.round(daily.temperature_2m_min?.[idx] ?? 24);
    const rainSum = (daily.precipitation_sum?.[idx] ?? 0).toFixed(1);
    const dCode = daily.weather_code?.[idx] ?? 0;
    const dWmo = getWeatherDescription(dCode, activeLanguage);
    return { dayLabel, maxT, minT, rainSum, dWmo };
  });

  const displayLocation = currentLocation
    ? `${getLocalizedPlaceName(currentLocation.rawName || currentLocation.name, activeLanguage) || currentLocation.name}, ${getLocalizedPlaceName(currentLocation.rawAdmin1 || currentLocation.admin1, activeLanguage) || currentLocation.admin1 || 'India'}`
    : 'Chennai, Tamil Nadu';

  const latLonStr = currentLocation
    ? `${Math.abs(currentLocation.latitude).toFixed(4)}°${currentLocation.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(currentLocation.longitude).toFixed(4)}°${currentLocation.longitude >= 0 ? 'E' : 'W'}`
    : '13.0827°N, 80.2707°E';

  return (
    <div className="w-full max-w-lg mx-auto pb-24 space-y-4 font-sans text-slate-800 animate-fadeIn">
      {/* 1. Phone Top Status Bar (Dynamic Island & Time & Connectivity) */}
      <div className="flex items-center justify-between px-3 pt-1 text-[11px] font-semibold text-slate-500 tracking-tight select-none">
        <div className="flex items-center space-x-1 font-mono text-slate-800 text-xs font-bold">
          <span>{currentTimeStr || '9:41'}</span>
        </div>

        {/* Dynamic Island Pill / SIH Badge */}
        <div className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-medium flex items-center space-x-1.5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="tracking-wide text-sky-300 font-bold">WEATHERGPT</span>
          <span className="text-slate-400 text-[9px] hidden sm:inline">• SIH 2026</span>
        </div>

        <div className="flex items-center space-x-1.5 text-slate-700">
          <span className="text-[10px] font-bold">5G</span>
          <div className="w-4 h-2 rounded-sm border border-slate-600 p-0.5 flex items-center">
            <div className="h-full w-3/4 bg-slate-800 rounded-2xs"></div>
          </div>
        </div>
      </div>

      {/* 2. Top Location Bar & Header */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-base font-black tracking-tight text-slate-900">WeatherGPT</h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                  AI v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                {activeLanguage === 'ta' ? 'தாக்க அடிப்படையிலான வானிலை நுண்ணறிவு' : 'Impact-Based Weather Intelligence'}
              </p>
            </div>
          </div>

          {/* Right Action Icons (Search + Alert Bell) */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Search City"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenAlertModal}
              className={`p-2 rounded-2xl border transition-all cursor-pointer relative ${
                notificationsEnabled
                  ? 'bg-sky-50 border-sky-300 text-sky-600'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title="Alert Notifications Setup"
            >
              {notificationsEnabled ? <BellRing className="w-4 h-4 text-sky-600" /> : <Bell className="w-4 h-4" />}
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </button>
          </div>
        </div>

        {/* Location Selector Chip */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <button
            onClick={() => onDetectLocation && onDetectLocation(activeLanguage)}
            className="flex items-center space-x-1.5 text-left group cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                <span className="truncate max-w-[200px]">{displayLocation}</span>
                <span className="text-[10px] text-sky-600 font-semibold">(GPS)</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">{latLonStr}</div>
            </div>
          </button>

          <button
            onClick={() => onDetectLocation && onDetectLocation(activeLanguage)}
            className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 px-2 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
          >
            {activeLanguage === 'ta' ? 'ஜிபிஎஸ் புதுப்பி' : 'Auto GPS'}
          </button>
        </div>

        {/* Expandable City Search Bar */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="pt-2 relative animate-fadeIn">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeLanguage === 'ta' ? 'நகரம் அல்லது கிராமத்தின் பெயரைத் தேடுங்கள்...' : 'Search any city, district or village...'}
                className="w-full pl-8 pr-16 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner"
                autoFocus
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-2.5 py-1 text-[10px] font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-all"
              >
                {isSearching ? '...' : (activeLanguage === 'ta' ? 'தேடு' : 'Search')}
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100">
                {searchResults.map((city) => (
                  <button
                    key={`${city.id}-${city.latitude}`}
                    type="button"
                    onClick={() => handleSelectLocation(city)}
                    className="w-full px-3 py-2 text-left hover:bg-sky-50 text-xs flex items-center justify-between text-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                      <span className="font-bold text-slate-900">
                        {getLocalizedPlaceName(city.name, activeLanguage) || city.name}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {city.admin1 ? `${getLocalizedPlaceName(city.admin1, activeLanguage) || city.admin1}, ` : ''}
                        {city.country || 'India'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>
        )}
      </div>

      {/* 3. Impact Risk Score Card with Circular SVG Radial Gauge (0-100) */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-orange-50/30 border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden">
        {/* Subtle background glow */}
        <div
          className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none ${
            riskScore >= 65 ? 'bg-rose-500' : 'bg-amber-500'
          }`}
        />

        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1.5 pr-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {activeLanguage === 'ta' ? 'தற்போதைய இடர் நிலை' : 'Current Risk Level'}
            </div>

            <div className="flex items-center space-x-2">
              <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-2xl border shadow-xs ${getRiskBadgeClass(riskScore)}`}>
                {riskBadge}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
              {riskSummary}
            </h3>

            {/* Explainable AI "Why this risk?" Button */}
            <button
              onClick={onOpenXAI}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/70 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'இந்த இடர் ஏன்? (XAI)' : 'Why this risk?'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* SVG Circular Radial Gauge */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-200"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={getRiskScoreColor(riskScore)}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - riskScore / 100)}`}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {riskScore}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                / 100
              </span>
              <span className="text-[8px] font-semibold text-slate-500 uppercase">
                {activeLanguage === 'ta' ? 'மதிப்பீடு' : 'Risk Score'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 4 Live Weather Telemetry Badges (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Card 1: Temperature & Feel */}
        <div className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <Thermometer className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-semibold text-slate-400">{wmo.label}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {tempC}°C
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {activeLanguage === 'ta' ? `உணர்வு ${feelsLike}°C` : `Feels like ${feelsLike}°C`}
          </div>
        </div>

        {/* Card 2: Rainfall (12h) */}
        <div className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <CloudRain className="w-4 h-4 text-sky-500" />
            <span className="text-[10px] font-semibold text-sky-600 font-mono">12h</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {rainToday} <span className="text-xs font-bold text-slate-500">mm</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium truncate">
            {activeLanguage === 'ta' ? 'மழைப்பொழிவு திரட்டல்' : 'Rainfall accumulation'}
          </div>
        </div>

        {/* Card 3: Wind & Gusts */}
        <div className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <Wind className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-semibold text-slate-400">
              {current.wind_direction_10m !== undefined ? `${current.wind_direction_10m}°` : 'ENE'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {windKmh} <span className="text-xs font-bold text-slate-500">km/h</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {activeLanguage === 'ta' ? `காற்று வீச்சு ${windGust} km/h` : `Gust ${windGust} km/h`}
          </div>
        </div>

        {/* Card 4: Humidity & Dew Point */}
        <div className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <Droplets className="w-4 h-4 text-teal-500" />
            <span className="text-[10px] font-semibold text-slate-400">RH</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {humidity}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {activeLanguage === 'ta' ? `பனிப்புள்ளி ${dewPoint}°C` : `Dew point ${dewPoint}°C`}
          </div>
        </div>
      </div>

      {/* Extra Secondary Telemetry Pill Strip (AQI, UV, Pressure, Visibility) */}
      <div className="grid grid-cols-4 gap-2 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-2 text-center text-xs">
        <div className="border-r border-slate-200 pr-1">
          <span className="text-[9px] font-bold text-slate-400 block uppercase">AQI PM2.5</span>
          <span className="font-extrabold text-emerald-600 text-xs">{aqiVal}</span>
        </div>
        <div className="border-r border-slate-200 pr-1">
          <span className="text-[9px] font-bold text-slate-400 block uppercase">UV Index</span>
          <span className="font-extrabold text-amber-600 text-xs">{uvVal}</span>
        </div>
        <div className="border-r border-slate-200 pr-1">
          <span className="text-[9px] font-bold text-slate-400 block uppercase">Pressure</span>
          <span className="font-extrabold text-slate-700 text-xs">{current.surface_pressure ? Math.round(current.surface_pressure) : 1012} hPa</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-slate-400 block uppercase">Visibility</span>
          <span className="font-extrabold text-sky-700 text-xs">10 km</span>
        </div>
      </div>

      {/* 5. Live Weather Doppler Radar Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-900">
              {activeLanguage === 'ta' ? 'நிகழ்நேர டாப்ளர் வானிலை ரேடார்' : 'Live Weather Doppler Radar'}
            </h3>
          </div>
          <button
            onClick={onOpenRadar}
            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>{activeLanguage === 'ta' ? 'விரிவாக்கு' : 'Expand'}</span>
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Interactive Mini Radar Container */}
        <div
          onClick={onOpenRadar}
          className="relative h-36 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer group"
        >
          {/* Static Map Background Simulation with RainViewer Doppler Tile */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
          
          {/* Simulated radar sweep animation overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-emerald-500/30 animate-ping"></div>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/50"></div>
            <div className="absolute h-3.5 w-3.5 rounded-full bg-sky-400 border-2 border-white shadow-md"></div>
          </div>

          {/* Location Badge on Radar */}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-[10px] font-semibold text-white border border-slate-700 flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{displayLocation}</span>
          </div>

          {/* Color Scale Legend (Light -> Heavy) */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-[9px] font-semibold text-slate-300 border border-slate-700">
            <span>{activeLanguage === 'ta' ? 'லேசானது' : 'Light'}</span>
            <div className="h-1.5 flex-1 mx-2 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-600"></div>
            <span>{activeLanguage === 'ta' ? 'தீவிரமானது' : 'Heavy'}</span>
          </div>
        </div>
      </div>

      {/* 6. Active Alerts Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>{activeLanguage === 'ta' ? 'செயலில் உள்ள வானிலை எச்சரிக்கைகள்' : 'Active Weather Alerts'}</span>
          </h3>
          <button
            onClick={onOpenAlerts}
            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>{activeLanguage === 'ta' ? 'அனைத்தும்' : 'View All'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Alerts List matching Mockup */}
        <div className="space-y-2">
          {alerts.length > 0 ? (
            alerts.slice(0, 3).map((al, idx) => (
              <div
                key={al.id || idx}
                onClick={onOpenAlerts}
                className={`p-3.5 rounded-2xl border shadow-xs flex items-start space-x-3 cursor-pointer transition-all hover:scale-[1.01] ${
                  al.level === 'red'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : al.level === 'orange'
                    ? 'bg-orange-50/70 border-orange-200 text-orange-900'
                    : al.level === 'yellow'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${
                  al.level === 'red' ? 'bg-rose-600 text-white' :
                  al.level === 'orange' ? 'bg-orange-500 text-white' :
                  al.level === 'yellow' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold truncate">{al.title}</h4>
                    <span className="text-[10px] font-mono text-slate-500 flex-shrink-0 ml-1">
                      {al.validTime || (activeLanguage === 'ta' ? 'இன்று இரவு 11:30 வரை' : 'Valid till 11:30 PM')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 line-clamp-2 mt-0.5 leading-relaxed">
                    {al.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">
                  {activeLanguage === 'ta' ? 'இயல்பான நிலை (பச்சை எச்சரிக்கை)' : 'Normal Atmospheric Status (Green Alert)'}
                </h4>
                <p className="text-[11px] text-emerald-700">
                  {activeLanguage === 'ta' ? 'அபாயகரமான வானிலை எச்சரிக்கைகள் ஏதுமில்லை.' : 'No severe hazardous conditions detected in current telemetry.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7. 24-Hour Hourly Forecast Slider */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900">
              {activeLanguage === 'ta' ? '24 மணி நேர மணிநேர முன்னறிவிப்பு' : '24-Hour Hourly Forecast'}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeLanguage === 'ta' ? 'மழை சாத்தியம் %' : 'Rain prob %'}
          </span>
        </div>

        {/* Horizontal Scroll Strip */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          {next24Hours.map((h, idx) => (
            <div
              key={idx}
              className={`flex-shrink-0 w-16 p-2 rounded-2xl border text-center space-y-1 transition-all ${
                idx === 0
                  ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-500">{h.hourLabel}</div>
              <div className="text-sm font-extrabold text-slate-900">{h.hTemp}°</div>
              <div className="text-[9px] font-bold text-sky-600 font-mono">
                {h.hRainProb}%
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${Math.max(10, h.hRainProb)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. 7-Day Extended Forecast */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900">
              {activeLanguage === 'ta' ? '7 நாள் நீட்டிக்கப்பட்ட வானிலை' : '7-Day Extended Forecast'}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">ECMWF / GFS</span>
        </div>

        <div className="space-y-2 divide-y divide-slate-100">
          {next7Days.map((d, idx) => (
            <div key={idx} className="pt-2 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 w-16">{d.dayLabel}</span>
              <div className="flex items-center space-x-1.5 text-slate-600 flex-1 px-2">
                <span className="text-[11px] font-medium truncate max-w-[120px]">{d.dWmo.label}</span>
                {parseFloat(d.rainSum) > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-sky-100 text-sky-800 font-bold">
                    {d.rainSum} mm
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 font-mono text-[11px] font-bold">
                <span className="text-slate-900">{d.maxT}°</span>
                <span className="text-slate-400">{d.minT}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Floating WeatherGPT Assistant Preview Card */}
      <div
        onClick={onOpenChat}
        className="p-4 rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/20 cursor-pointer space-y-2 hover:scale-[1.01] transition-transform"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Sun className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold tracking-wide">WeatherGPT Assistant</span>
          </div>
          <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {activeLanguage === 'ta' ? 'குரல் வழி & அரட்டை' : 'Voice & Chat'}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-xs leading-relaxed font-normal">
          {activeLanguage === 'ta'
            ? `வணக்கம்! ${currentLocation?.name || 'சென்னை'} பகுதியில் அடுத்த 48 மணி நேரத்தில் மழை வாய்ப்பு மற்றும் புயல் எச்சரிக்கை குறித்து என்னிடம் தமிழில் கேளுங்கள்.`
            : `Hi! Heavy rain is likely in ${currentLocation?.name || 'Chennai'} tomorrow. Ask me anything about hyperlocal rain, floods, or crop advisories in 10 languages.`}
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 font-semibold text-sky-100">
          <span className="flex items-center space-x-1">
            <Mic className="w-3.5 h-3.5" />
            <span>{activeLanguage === 'ta' ? 'பேசி பதில் பெறவும்' : 'Tap to speak or chat'}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>{activeLanguage === 'ta' ? 'தொடங்கவும்' : 'Ask AI'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
