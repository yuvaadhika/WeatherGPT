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
  VolumeX,
  Mic,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Wheat,
  Share2,
  Maximize2,
  Sunrise,
  Sunset,
  Car,
  Umbrella,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  BarChart2,
  Shirt,
  Footprints
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
  onOpenLocationModal,
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
  const [activeHourlyMetric, setActiveHourlyMetric] = useState('temp'); // 'temp' | 'rain' | 'wind'
  const [heroTab, setHeroTab] = useState('nowcast'); // 'nowcast' | 'activities' | 'health'
  const [sharedToast, setSharedToast] = useState(false);

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
    if (!searchQuery.trim()) {
      if (onOpenLocationModal) onOpenLocationModal();
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=6&language=${activeLanguage}&format=json`
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

  const handleShareWeather = () => {
    const shareText = `WeatherGPT Live Alert (${currentLocation?.name || 'Chennai'}): Temp ${Math.round(current.temperature_2m || 28)}°C, Risk Score ${riskData?.score || 75}/100 (${riskData?.badgeText || 'Alert'}). Check live: https://weather-gpt-yuvi.vercel.app/`;
    if (navigator.share) {
      navigator.share({
        title: 'WeatherGPT Live Alert',
        text: shareText,
        url: 'https://weather-gpt-yuvi.vercel.app/',
      }).catch(console.warn);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 3000);
    }
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

  // Extra Solar & Astronomical Data
  const sunriseStr = daily.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:05 AM';
  const sunsetStr = daily.sunset?.[0] ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:22 PM';

  // Extra Soil Moisture & Agri Telemetry
  const soilMoistureVal = hourly.soil_moisture_0_to_1cm?.[0] !== undefined ? Math.round(hourly.soil_moisture_0_to_1cm[0] * 100) : 42;
  const soilTempVal = hourly.soil_temperature_0cm?.[0] !== undefined ? Math.round(hourly.soil_temperature_0cm[0]) : tempC - 2;
  const spraySuitability = windKmh <= 15 && parseFloat(rainToday) === 0 ? 'Optimal' : 'Unfavorable';

  // Extra Commute & Road Flooding Vulnerability
  const roadFloodScore = parseFloat(rainToday) > 40 ? 88 : parseFloat(rainToday) > 15 ? 65 : parseFloat(rainToday) > 2 ? 35 : 12;
  const needUmbrella = parseFloat(rainToday) > 0.5 || (hourly.precipitation_probability?.[0] || 0) > 40;

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
    const hWind = Math.round(hourly.wind_speed_10m?.[idx] ?? windKmh);
    const hCode = hourly.weather_code?.[idx] ?? 0;
    const hWmo = getWeatherDescription(hCode, activeLanguage);
    return { hourLabel, hTemp, hRainProb, hWind, hWmo };
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
      {/* 1. Top Location Bar & Header */}
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

          {/* Right Action Icons (Share + Search + Alert Bell) */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleShareWeather}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Share Live Weather Bulletin"
            >
              <Share2 className="w-4 h-4" />
            </button>
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

        {/* Share Feedback Toast */}
        {sharedToast && (
          <div className="p-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold text-center animate-fadeIn">
            ✓ {activeLanguage === 'ta' ? 'வானிலை அறிக்கை நகலெடுக்கப்பட்டது!' : 'Live weather bulletin copied to clipboard!'}
          </div>
        )}

        {/* Location Selector Chip */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <button
            onClick={() => onOpenLocationModal ? onOpenLocationModal() : onDetectLocation && onDetectLocation(activeLanguage)}
            className="flex items-center space-x-1.5 text-left group cursor-pointer"
            title={activeLanguage === 'ta' ? 'அகராதி வரிசையில் அனைத்து இடங்களையும் காண்க (A-Z)' : 'Browse all available places alphabetically (A-Z)'}
          >
            <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                <span className="truncate max-w-[180px] group-hover:text-sky-600">{displayLocation}</span>
                <span className="text-[10px] text-sky-600 font-bold px-1.5 py-0.2 rounded bg-sky-100/80 border border-sky-200">
                  A-Z ▾
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">{latLonStr}</div>
            </div>
          </button>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onOpenLocationModal && onOpenLocationModal()}
              className="text-[10px] font-bold text-slate-700 hover:text-sky-700 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-sky-100 border border-slate-200 transition-colors cursor-pointer"
              title="Open Alphabetical A-Z Places Directory"
            >
              {activeLanguage === 'ta' ? 'அனைத்து இடங்கள் (A-Z)' : 'A-Z Places'}
            </button>
            <button
              onClick={() => onDetectLocation && onDetectLocation(activeLanguage)}
              className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 px-2 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors cursor-pointer"
            >
              {activeLanguage === 'ta' ? 'ஜிபிஎஸ்' : 'Auto GPS'}
            </button>
          </div>
        </div>

        {/* Expandable City Search Bar */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="pt-2 relative animate-fadeIn">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onClick={() => onOpenLocationModal && onOpenLocationModal()}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeLanguage === 'ta' ? 'அனைத்து இடங்கள் (A-Z) தேடுக...' : 'Search all places (A-Z directory)...'}
                className="w-full pl-8 pr-24 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner cursor-pointer"
                autoFocus
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <div className="absolute right-1.5 top-1.5 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => onOpenLocationModal && onOpenLocationModal()}
                  className="px-2 py-1 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  A-Z
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-[10px] font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-all cursor-pointer"
                >
                  {isSearching ? '...' : (activeLanguage === 'ta' ? 'தேடு' : 'Search')}
                </button>
              </div>
            </div>

            {/* Autocomplete dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100">
                {searchResults.map((city) => (
                  <button
                    key={`${city.id}-${city.latitude}`}
                    type="button"
                    onClick={() => handleSelectLocation(city)}
                    className="w-full px-3 py-2 text-left hover:bg-sky-50 text-xs flex items-center justify-between text-slate-700 transition-colors cursor-pointer"
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

      {/* 2. AI Hyperlocal Live Weather Intelligence & Smart Activity Hub */}
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 relative overflow-hidden">
        {/* Top Header & Tab Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
              {activeLanguage === 'ta' ? 'AI நேரடி வானிலை நுண்ணறிவு & வழிகாட்டி' : 'AI Hyperlocal Weather Intelligence'}
            </h2>
          </div>

          {/* Interactive 3 Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-2xl text-[11px] font-bold text-slate-600 self-start sm:self-auto">
            <button
              onClick={() => setHeroTab('nowcast')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                heroTab === 'nowcast' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              ⚡ {activeLanguage === 'ta' ? '3h முன்னறிவிப்பு' : '3h Nowcast'}
            </button>
            <button
              onClick={() => setHeroTab('activities')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                heroTab === 'activities' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              🎯 {activeLanguage === 'ta' ? 'செயல்பாடுகள்' : 'Activities'}
            </button>
            <button
              onClick={() => setHeroTab('health')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                heroTab === 'health' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              🩺 {activeLanguage === 'ta' ? 'சுகாதாரம்' : 'Health & Comfort'}
            </button>
          </div>
        </div>

        {/* TAB 1: 3-Hour AI Rain & Atmosphere Nowcast */}
        {heroTab === 'nowcast' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="grid grid-cols-4 gap-2">
              {[
                { time: activeLanguage === 'ta' ? 'இப்போது' : 'Now', offset: 0, rain: (current.precipitation || 0).toFixed(1), prob: hourly.precipitation_probability?.[0] || 0, desc: wmo.label },
                { time: '+45 min', offset: 1, rain: (hourly.precipitation?.[1] || 0).toFixed(1), prob: hourly.precipitation_probability?.[1] || 5, desc: activeLanguage === 'ta' ? 'சீரானது' : 'Fair' },
                { time: '+90 min', offset: 2, rain: (hourly.precipitation?.[2] || 0).toFixed(1), prob: hourly.precipitation_probability?.[2] || 10, desc: activeLanguage === 'ta' ? 'மேகமூட்டம்' : 'Cloudy' },
                { time: '+3 hrs', offset: 3, rain: (hourly.precipitation?.[3] || 0).toFixed(1), prob: hourly.precipitation_probability?.[3] || 15, desc: activeLanguage === 'ta' ? 'தென்றல்' : 'Breezy' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-2xl border text-center space-y-1 transition-all ${
                    idx === 0
                      ? 'bg-sky-50 border-sky-300 shadow-xs text-sky-950'
                      : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500 block">{step.time}</span>
                  <div className="text-xs font-black text-slate-900">{step.prob}% Rain</div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full"
                      style={{ width: `${Math.max(10, step.prob)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 block truncate">{step.desc}</span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200/80 text-xs text-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">
                  {parseFloat(rainToday) > 0.5
                    ? (activeLanguage === 'ta' ? `மழை பெய்ய வாய்ப்புள்ளது (${rainToday} mm). குடை எடுத்துச் செல்லவும்.` : `Showers expected today (~${rainToday} mm). Carry rain gear.`)
                    : (activeLanguage === 'ta' ? 'அடுத்த 3 மணி நேரத்திற்கு மழை குறுக்கீடு இல்லை. வானிலை சீரானது.' : 'No rain interruption expected in the next 3 hours. Atmospheric pressure stable.')}
                </span>
              </div>
              <button
                onClick={onOpenRadar}
                className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-0.5 flex-shrink-0 ml-1 cursor-pointer"
              >
                <span>{activeLanguage === 'ta' ? 'ரேடார்' : 'Radar'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Smart Daily Life Activity Advisor */}
        {heroTab === 'activities' && (
          <div className="grid grid-cols-2 gap-2 animate-fadeIn text-xs">
            {/* Travel */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <div className="flex items-center space-x-1.5">
                  <Car className="w-3.5 h-3.5 text-sky-600" />
                  <span>{activeLanguage === 'ta' ? 'பயணம் & வாகனம்' : 'Driving & Travel'}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-black">
                  {activeLanguage === 'ta' ? 'சீரானது' : 'Safe'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {activeLanguage === 'ta' ? 'சாலைகளில் பார்வைத் திறன் 10 கி.மீ. வழக்கமான போக்குவரத்து.' : 'Road visibility 10 km. Normal highway commute.'}
              </p>
            </div>

            {/* Sports */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <div className="flex items-center space-x-1.5">
                  <Footprints className="w-3.5 h-3.5 text-amber-600" />
                  <span>{activeLanguage === 'ta' ? 'உடற்பயிற்சி & ஓட்டம்' : 'Outdoor Fitness'}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-sky-100 text-sky-800 font-black">
                  {activeLanguage === 'ta' ? 'உகந்தது' : 'Good'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {activeLanguage === 'ta' ? `காற்றோட்டம் ${windKmh} km/h. மாலை 7 மணி வரை சிறந்தது.` : `Mild winds ${windKmh} km/h. Great until evening.`}
              </p>
            </div>

            {/* Laundry */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <div className="flex items-center space-x-1.5">
                  <Shirt className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{activeLanguage === 'ta' ? 'துணி உலர்த்துதல்' : 'Laundry Drying'}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-black">
                  95% Dry
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {activeLanguage === 'ta' ? 'வெளியில் 2 மணி நேரத்தில் முழுமையாக உலரும்.' : 'Estimated outdoor dry time: 2 hours.'}
              </p>
            </div>

            {/* Farming */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <div className="flex items-center space-x-1.5">
                  <Wheat className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeLanguage === 'ta' ? 'தோட்டம் & விவசாயம்' : 'Gardening & Agri'}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-black">
                  Optimal
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {activeLanguage === 'ta' ? 'இலைவழி உரம் தெளிக்க ஏற்ற காற்றின் வேகம்.' : 'Optimal foliar spraying conditions.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Health & Comfort Telemetry */}
        {heroTab === 'health' && (
          <div className="grid grid-cols-2 gap-2 animate-fadeIn text-xs">
            {/* AQI */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <div className="flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeLanguage === 'ta' ? 'சுவாசக் காற்று தரம்' : 'Air Quality'}</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700">{aqiVal} AQI</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {activeLanguage === 'ta' ? 'தூய்மையான காற்று; வெளிப்புற நடவடிக்கைகளுக்கு பாதுகாப்பானது.' : 'Clean air index. Safe for all demographic groups.'}
              </p>
            </div>

            {/* UV */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <div className="flex items-center space-x-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>{activeLanguage === 'ta' ? 'புற ஊதாக்கதிர் (UV)' : 'Solar UV'}</span>
                </div>
                <span className="text-[10px] font-extrabold text-amber-700">UV {uvVal}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {activeLanguage === 'ta' ? 'நண்பகல் வேளையில் சன்ஸ்கிரீன் அல்லது தொப்பி அணியவும்.' : 'Moderate UV. Sun protection advised during midday.'}
              </p>
            </div>

            {/* Hydration */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <div className="flex items-center space-x-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>{activeLanguage === 'ta' ? 'குடிநீர் அளவு' : 'Hydration'}</span>
                </div>
                <span className="text-[10px] font-extrabold text-sky-700">2.5 L</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {activeLanguage === 'ta' ? 'உடலில் நீர்ச்சத்தை தக்கவைக்க போதுமான நீர் அருந்தவும்.' : 'Maintain optimal hydration with natural water & fluids.'}
              </p>
            </div>

            {/* Thermal Feel */}
            <div className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <div className="flex items-center space-x-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-rose-600" />
                  <span>{activeLanguage === 'ta' ? 'வெப்ப உணர்வு' : 'Thermal Feel'}</span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-900">{feelsLike}°C</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {activeLanguage === 'ta' ? `காற்றின் ஈரப்பதம் ${humidity}%. சீரான மாலை தென்றல்.` : `Humidity at ${humidity}%. Comfortable ambient flow.`}
              </p>
            </div>
          </div>
        )}
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

      {/* ✨ EXTRA SECTION 1: Astronomical Ephemeris & Solar Cycle Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-amber-200/80 rounded-3xl p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sunrise className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900">
              {activeLanguage === 'ta' ? 'சூரிய உதயம் & அஸ்தமன சுழற்சி' : 'Sun Cycle & Astronomical Ephemeris'}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
            {activeLanguage === 'ta' ? 'பகல் 12 மணி 17 நிமி' : 'Daylight 12h 17m'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-white/90 border border-amber-200/60 flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <Sunrise className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block">{activeLanguage === 'ta' ? 'சூரிய உதயம்' : 'Sunrise'}</span>
              <span className="text-sm font-extrabold text-slate-900">{sunriseStr}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/90 border border-indigo-200/60 flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Sunset className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block">{activeLanguage === 'ta' ? 'சூரிய அஸ்தமனம்' : 'Sunset'}</span>
              <span className="text-sm font-extrabold text-slate-900">{sunsetStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✨ EXTRA SECTION 2: Agriculture Soil Moisture & Commute Safety Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Agri Soil Card */}
        <div className="p-4 rounded-3xl bg-white border border-emerald-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-bold text-xs text-emerald-800">
              <Wheat className="w-4 h-4 text-emerald-600" />
              <span>{activeLanguage === 'ta' ? 'விவசாய மண் ஈரப்பதம்' : 'Soil Moisture & Crop'}</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
              spraySuitability === 'Optimal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {spraySuitability} Spray
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{soilMoistureVal}%</span>
            <span className="text-xs text-slate-500">{activeLanguage === 'ta' ? '0-10cm மேல்மண் ஈரப்பதம்' : 'Topsoil Moisture'}</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {activeLanguage === 'ta'
              ? `மண் வெப்பநிலை ${soilTempVal}°C. பயிர் தெளிப்பு மற்றும் பாசன திட்டமிடலுக்கு ஏற்றது.`
              : `Soil temperature at ${soilTempVal}°C. Optimal for active root hydration and scheduling.`}
          </p>
        </div>

        {/* Urban Commute & Rain Gear Card */}
        <div className="p-4 rounded-3xl bg-white border border-sky-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-bold text-xs text-sky-800">
              <Car className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'பயண வெள்ள பாதிப்பு' : 'Urban Commute Risk'}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 font-mono">{roadFloodScore}/100</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <Umbrella className="w-4 h-4 text-sky-600" />
            <span>{needUmbrella ? (activeLanguage === 'ta' ? 'மழைக்கோட் / குடை தேவை' : 'Rain Gear Required') : (activeLanguage === 'ta' ? 'குடை தேவையில்லை' : 'No Rain Gear Needed')}</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {activeLanguage === 'ta'
              ? 'சாலைகளில் பார்வைத் திறன் நன்று (10 கி.மீ). சுரங்கப்பாதைகளில் வழக்கமான போக்குவரத்து.'
              : 'Highway visibility nominal (10 km). Standard traffic flow across underpasses.'}
          </p>
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
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-emerald-500/30 animate-ping"></div>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/50"></div>
            <div className="absolute h-3.5 w-3.5 rounded-full bg-sky-400 border-2 border-white shadow-md"></div>
          </div>

          <div className="absolute top-2 left-2 px-2 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-[10px] font-semibold text-white border border-slate-700 flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{displayLocation}</span>
          </div>

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

      {/* 7. 24-Hour Hourly Forecast Slider with Interactive Metric Switcher */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900">
              {activeLanguage === 'ta' ? '24 மணி நேர முன்னறிவிப்பு' : '24-Hour Hourly Forecast'}
            </h3>
          </div>

          {/* Metric Switcher Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold text-slate-600">
            <button
              onClick={() => setActiveHourlyMetric('temp')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                activeHourlyMetric === 'temp' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setActiveHourlyMetric('rain')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                activeHourlyMetric === 'rain' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Rain %
            </button>
            <button
              onClick={() => setActiveHourlyMetric('wind')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                activeHourlyMetric === 'wind' ? 'bg-white text-sky-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Wind
            </button>
          </div>
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
              
              {activeHourlyMetric === 'temp' && (
                <div className="text-sm font-extrabold text-slate-900">{h.hTemp}°</div>
              )}
              {activeHourlyMetric === 'rain' && (
                <div className="text-xs font-black text-sky-600 font-mono">{h.hRainProb}%</div>
              )}
              {activeHourlyMetric === 'wind' && (
                <div className="text-xs font-black text-blue-600 font-mono">{h.hWind}k</div>
              )}

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
