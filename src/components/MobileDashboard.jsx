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
  Zap,
  PhoneCall,
  Volume2,
  Mic,
  MessageSquare,
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
  Navigation,
  Heart,
  Users
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';
import { getWeatherDescription, getLocalizedPlaceName, generateCropSeedAdvisory } from '../services/weatherService';

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
  isLocating,
  onSelectCity,
  onOpenLocationModal,
  onOpenRoutePlanner,
  onOpenEventScore,
  onOpenSpotter,
  onOpenEmergencySOS,
  notificationsEnabled = false
}) {
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const current = weatherData?.current || {};
  const daily = weatherData?.daily || {};
  const hourly = weatherData?.hourly || {};

  const [activeTab, setActiveTab] = useState('hourly'); // 'hourly' | '7day' | 'tools' | 'agri' | 'health'
  const [activeHourlyMetric, setActiveHourlyMetric] = useState('temp'); // 'temp' | 'rain' | 'wind'
  const [sharedToast, setSharedToast] = useState(false);

  const wmo = getWeatherDescription(current.weather_code || 0, activeLanguage);
  const tempC = current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : 28;
  const feelsLike = current.apparent_temperature !== undefined ? Math.round(current.apparent_temperature) : tempC + 3;
  const todayMax = daily.temperature_2m_max?.[0] !== undefined ? Math.round(daily.temperature_2m_max[0]) : tempC + 4;
  const todayMin = daily.temperature_2m_min?.[0] !== undefined ? Math.round(daily.temperature_2m_min[0]) : tempC - 4;
  const rainToday = (daily.precipitation_sum?.[0] || current.precipitation || 0).toFixed(1);
  const rainProbNow = hourly.precipitation_probability?.[0] || Math.min(100, Math.round((current.precipitation || 0) * 25));
  const windKmh = current.wind_speed_10m !== undefined ? Math.round(current.wind_speed_10m) : 18;
  const windGust = current.wind_gusts_10m !== undefined ? Math.round(current.wind_gusts_10m) : Math.round(windKmh * 1.35);
  const humidity = current.relative_humidity_2m !== undefined ? Math.round(current.relative_humidity_2m) : 78;
  const dewPoint = (tempC - (100 - humidity) / 5).toFixed(0);
  const aqiVal = aqiData?.current?.us_aqi || 48;
  const uvVal = current.uv_index !== undefined ? current.uv_index : (daily.uv_index_max?.[0] || 6);

  const sunriseStr = daily.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:05 AM';
  const sunsetStr = daily.sunset?.[0] ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:22 PM';

  const soilMoistureVal = hourly.soil_moisture_0_to_1cm?.[0] !== undefined ? Math.round(hourly.soil_moisture_0_to_1cm[0] * 100) : 42;
  const soilTempVal = hourly.soil_temperature_0cm?.[0] !== undefined ? Math.round(hourly.soil_temperature_0cm[0]) : tempC - 2;
  const cropSeedAdvisory = generateCropSeedAdvisory(weatherData, activeLanguage);

  const handleShareWeather = () => {
    const locName = currentLocation?.name || 'Chennai';
    const text = `WeatherGPT Live (${locName}): ${tempC}°C, ${wmo.label}, Rain: ${rainProbNow}%, Wind: ${windKmh}km/h. Live: https://weather-gpt-yuvi.vercel.app/`;
    if (navigator.share) {
      navigator.share({ title: 'WeatherGPT Live', text, url: 'https://weather-gpt-yuvi.vercel.app/' }).catch(console.warn);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 3000);
    }
  };

  // Next 24 hours
  const next24Hours = (hourly.time || []).slice(0, 16).map((timeStr, idx) => {
    const d = new Date(timeStr);
    const hourLabel = idx === 0 ? (activeLanguage === 'ta' ? 'இப்போது' : 'Now') : d.toLocaleTimeString([], { hour: 'numeric' });
    const hTemp = Math.round(hourly.temperature_2m?.[idx] ?? tempC);
    const hRainProb = hourly.precipitation_probability?.[idx] ?? Math.min(100, Math.round((hourly.precipitation?.[idx] || 0) * 20));
    const hWind = Math.round(hourly.wind_speed_10m?.[idx] ?? windKmh);
    const hCode = hourly.weather_code?.[idx] ?? 0;
    const hWmo = getWeatherDescription(hCode, activeLanguage);
    return { hourLabel, hTemp, hRainProb, hWind, hWmo };
  });

  // Next 7 days
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
    ? `${getLocalizedPlaceName(currentLocation.rawName || currentLocation.name, activeLanguage) || currentLocation.name}`
    : 'Chennai';

  const displaySpecificPlace = currentLocation?.specificPlace
    ? `${getLocalizedPlaceName(currentLocation.rawSpecificPlace || currentLocation.specificPlace, activeLanguage) || currentLocation.specificPlace}`
    : '';

  const displayDistrict = currentLocation?.district && currentLocation.district !== currentLocation.name
    ? `${getLocalizedPlaceName(currentLocation.rawDistrict || currentLocation.district, activeLanguage) || currentLocation.district}`
    : '';

  const displayRegion = currentLocation
    ? `${displayDistrict ? `${displayDistrict}, ` : ''}${getLocalizedPlaceName(currentLocation.rawAdmin1 || currentLocation.admin1, activeLanguage) || currentLocation.admin1 || ''}, ${getLocalizedPlaceName(currentLocation.rawCountry || currentLocation.country, activeLanguage) || currentLocation.country || 'India'}`
    : 'Tamil Nadu, India';

  return (
    <div className="w-full max-w-xl mx-auto pb-20 space-y-3 font-sans text-slate-800 animate-fadeIn">
      {/* 1. Top Sub-Bar: Quick Location Search / Directory & Share */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => onOpenLocationModal ? onOpenLocationModal() : onDetectLocation && onDetectLocation(activeLanguage)}
          className="flex items-center space-x-2 text-left group cursor-pointer"
          title="Browse Cities Directory (A-Z)"
        >
          <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm sm:text-base font-black text-slate-900 truncate max-w-[180px] group-hover:text-sky-600 leading-tight">
                {displayLocation}
              </span>
              <span className="text-[9px] text-sky-600 font-bold px-1.5 py-0.2 rounded-md bg-sky-100/90 border border-sky-200 flex-shrink-0">
                A-Z ▾
              </span>
            </div>
            {/* Specific street/place shown right underneath the place name */}
            {displaySpecificPlace ? (
              <p className="text-[11px] font-bold text-sky-700 truncate max-w-[220px] leading-tight">
                📍 {displaySpecificPlace}
              </p>
            ) : null}
          </div>
        </button>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onDetectLocation && onDetectLocation(activeLanguage)}
            disabled={isLocating}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl border text-[11px] font-bold flex items-center space-x-1 transition-all shadow-2xs cursor-pointer ${
              isLocating
                ? 'bg-sky-100 text-sky-700 border-sky-400 animate-pulse'
                : 'bg-white/90 hover:bg-sky-50 border-sky-200/80 text-sky-700 hover:border-sky-300'
            }`}
            title={activeLanguage === 'ta' ? 'நேரலை ஜிபிஎஸ் இடம் கண்டறி (Live GPS)' : 'Lock Current Live GPS Location'}
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-600' : 'text-sky-600'}`} />
            <span className="hidden xs:inline">{isLocating ? (activeLanguage === 'ta' ? 'கண்டறிகிறது...' : 'Locating...') : (activeLanguage === 'ta' ? 'ஜிபிஎஸ்' : 'Live GPS')}</span>
          </button>

          <button
            onClick={handleShareWeather}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white/90 hover:bg-sky-50 border border-sky-200/80 text-slate-700 text-[11px] font-bold flex items-center space-x-1 transition-all shadow-2xs cursor-pointer"
            title="Share weather bulletin"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden xs:inline">{activeLanguage === 'ta' ? 'பகிர்' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {sharedToast && (
        <div className="p-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold text-center animate-fadeIn shadow-sm">
          ✓ {activeLanguage === 'ta' ? 'வானிலை அறிக்கை நகலெடுக்கப்பட்டது!' : 'Weather bulletin copied to clipboard!'}
        </div>
      )}

      {/* 2. Active Severe Weather Alert Warning Banner (Only if red/orange/yellow active) */}
      {alerts && alerts.length > 0 && alerts[0].level !== 'green' && (
        <div
          onClick={onOpenAlerts}
          className={`p-3 rounded-2xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            alerts[0].level === 'red'
              ? 'bg-rose-50/95 border-rose-300 text-rose-950'
              : alerts[0].level === 'orange'
              ? 'bg-orange-50/95 border-orange-300 text-orange-950'
              : 'bg-amber-50/95 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`p-1.5 rounded-xl flex-shrink-0 ${
              alerts[0].level === 'red' ? 'bg-rose-600 text-white' : 'bg-orange-500 text-white'
            }`}>
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black truncate">{alerts[0].title}</h4>
              <p className="text-[10px] text-slate-700 truncate">{alerts[0].message}</p>
            </div>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-white/90 border text-slate-800 flex-shrink-0 ml-2">
            {activeLanguage === 'ta' ? 'பார்க்க ▾' : 'View ▾'}
          </span>
        </div>
      )}

      {/* 3. HERO WEATHER GLASS CARD (Mild, Soft & Pleasant Palette) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e0f1fe] via-[#ecf6fe] to-[#f4f9ff] text-slate-800 p-5 sm:p-6 shadow-md shadow-sky-900/5 space-y-4 border border-sky-200/90">
        {/* Subtle Mild Ambient Background Glows */}
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full bg-cyan-200/30 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 rounded-full bg-sky-200/30 blur-3xl pointer-events-none"></div>

        {/* Top Hero Row */}
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
              {activeLanguage === 'ta' ? 'நேரடி வானிலை' : 'Live Conditions'}
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center space-x-1.5">
              <span>{displayLocation}</span>
            </h2>
            {displaySpecificPlace && (
              <p className="text-xs font-bold text-sky-700">
                📍 {displaySpecificPlace}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-sky-200/80 text-[11px] font-bold text-sky-800 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {rainProbNow > 40 ? (
              <CloudRain className="w-3.5 h-3.5 text-sky-600" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>{rainProbNow > 40 ? `${rainProbNow}% Rain` : wmo.label}</span>
          </div>
        </div>

        {/* Main Temperature Display */}
        <div className="flex items-baseline justify-between relative z-10">
          <div>
            <div className="flex items-baseline">
              <span className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-900">
                {tempC}
              </span>
              <span className="text-2xl sm:text-3xl font-light text-sky-600 ml-1">°C</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
              {wmo.label} • {activeLanguage === 'ta' ? `உணர்வு ${feelsLike}°C` : `Feels like ${feelsLike}°C`}
            </p>
          </div>

          {/* High / Low & Quick Stats */}
          <div className="text-right space-y-1">
            <div className="text-xs font-mono font-bold text-slate-500">
              H: <span className="text-slate-900 font-extrabold">{todayMax}°</span> • L: <span className="text-slate-900 font-extrabold">{todayMin}°</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium flex items-center justify-end space-x-2">
              <span className="flex items-center space-x-1">
                <Wind className="w-3 h-3 text-slate-400" />
                <span>{windKmh} km/h</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Droplets className="w-3 h-3 text-sky-500" />
                <span>{humidity}%</span>
              </span>
            </div>
            <div className="text-[10px] text-emerald-700 font-extrabold">
              AQI {aqiVal} (Good)
            </div>
          </div>
        </div>

        {/* Quick 1-Tap Action Pills */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/60 relative z-10">
          <button
            onClick={() => onOpenChat && onOpenChat()}
            className="py-2.5 px-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>{activeLanguage === 'ta' ? 'AI அரட்டை வழிகாட்டி' : 'Ask AI Weather Assistant'}</span>
          </button>

          <button
            onClick={onOpenRadar}
            className="py-2.5 px-3 rounded-2xl bg-white/95 hover:bg-white border border-sky-200/80 text-sky-800 text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-2xs cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>{activeLanguage === 'ta' ? 'டாப்ளர் ரேடார் வரைபடம்' : 'Live Doppler Radar'}</span>
          </button>
        </div>
      </div>

      {/* 4. CLEAN CATEGORY SEGMENTED TABS (Sleek, No-Clutter Switcher with Professional Icons) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold text-slate-600">
        {[
          { id: 'hourly', label: activeLanguage === 'ta' ? '24h முன்னறிவிப்பு' : '24h Hourly', icon: Clock },
          { id: '7day', label: activeLanguage === 'ta' ? '7-நாள் வானிலை' : '7-Day Trend', icon: TrendingUp },
          { id: 'tools', label: activeLanguage === 'ta' ? 'AI கருவிகள்' : 'AI Innovation', icon: Sparkles },
          { id: 'agri', label: activeLanguage === 'ta' ? 'விவசாய வழிகாட்டி' : 'Agri & Soil', icon: Wheat },
          { id: 'health', label: activeLanguage === 'ta' ? 'காற்று தரம்' : 'AQI & Health', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-2xl flex-shrink-0 transition-all cursor-pointer flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-white/85 hover:bg-white text-slate-700 border border-sky-100 hover:border-sky-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-sky-600'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: 24-HOUR HOURLY FORECAST SLIDER */}
      {activeTab === 'hourly' && (
        <div className="bg-white/90 backdrop-blur-xl border border-sky-200/70 rounded-3xl p-4 shadow-2xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900">
                {activeLanguage === 'ta' ? '24 மணி நேர முன்னறிவிப்பு' : '24-Hour Hourly Forecast'}
              </h3>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center space-x-1 bg-sky-100/70 p-0.5 rounded-xl text-[10px] font-bold text-slate-600">
              <button
                onClick={() => setActiveHourlyMetric('temp')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  activeHourlyMetric === 'temp' ? 'bg-white text-sky-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setActiveHourlyMetric('rain')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  activeHourlyMetric === 'rain' ? 'bg-white text-sky-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Rain %
              </button>
              <button
                onClick={() => setActiveHourlyMetric('wind')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  activeHourlyMetric === 'wind' ? 'bg-white text-sky-700 shadow-2xs' : 'hover:text-slate-900'
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
                className={`flex-shrink-0 w-16 p-2.5 rounded-2xl border text-center space-y-1 transition-all ${
                  idx === 0
                    ? 'bg-sky-50 border-sky-300 text-sky-950 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-100 text-slate-700 hover:bg-sky-50/50'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-500 block">{h.hourLabel}</span>
                
                {activeHourlyMetric === 'temp' && (
                  <div className="text-sm font-extrabold text-slate-900">{h.hTemp}°</div>
                )}
                {activeHourlyMetric === 'rain' && (
                  <div className="text-xs font-black text-sky-600 font-mono">{h.hRainProb}%</div>
                )}
                {activeHourlyMetric === 'wind' && (
                  <div className="text-xs font-black text-blue-600 font-mono">{h.hWind}k</div>
                )}

                <div className="w-full bg-slate-200/80 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full"
                    style={{ width: `${Math.max(8, h.hRainProb)}%` }}
                  />
                </div>
                <span className="text-[9px] font-semibold text-sky-600 block">{h.hRainProb}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: 7-DAY EXTENDED FORECAST */}
      {activeTab === '7day' && (
        <div className="bg-white/90 backdrop-blur-xl border border-sky-200/70 rounded-3xl p-4 shadow-2xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">
                {activeLanguage === 'ta' ? '7 நாள் நீட்டிக்கப்பட்ட வானிலை' : '7-Day Extended Forecast'}
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">ECMWF / GFS</span>
          </div>

          <div className="space-y-1.5 divide-y divide-sky-100/70">
            {next7Days.map((d, idx) => (
              <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 w-16">{d.dayLabel}</span>
                <div className="flex items-center space-x-1.5 text-slate-600 flex-1 px-2">
                  <span className="text-[11px] font-medium truncate max-w-[130px]">{d.dWmo.label}</span>
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
      )}

      {/* TAB CONTENT 3: AI INNOVATION SUITE (4 Killer Features) */}
      {activeTab === 'tools' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900">
                {activeLanguage === 'ta' ? 'AI புதிய கண்டுபிடிப்புகள்' : 'AI Innovation Suite'}
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">4 Intelligent Tools</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Tool 1: Route Planner */}
            <button
              onClick={onOpenRoutePlanner}
              className="p-3.5 rounded-3xl bg-white/90 hover:bg-white border border-sky-200/80 hover:border-sky-400 text-left transition-all shadow-2xs space-y-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 inline-flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-sky-600" />
                </span>
                <span className="text-[9px] font-bold text-sky-700 bg-sky-100/90 px-1.5 py-0.5 rounded">
                  GIS
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  {activeLanguage === 'ta' ? 'பயணப் பாதை வானிலை' : 'Route Planner'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {activeLanguage === 'ta' ? 'நெடுஞ்சாலை மழை & புறப்படும் நேரம்' : 'Highway rain forecast & safe hours.'}
                </p>
              </div>
            </button>

            {/* Tool 2: Event Weather Score */}
            <button
              onClick={onOpenEventScore}
              className="p-3.5 rounded-3xl bg-white/90 hover:bg-white border border-rose-200/80 hover:border-rose-400 text-left transition-all shadow-2xs space-y-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-500" />
                </span>
                <span className="text-[9px] font-bold text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded">
                  Score
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  {activeLanguage === 'ta' ? 'சுபகாரிய விழா கணிப்பு' : 'Event Score'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {activeLanguage === 'ta' ? 'திருமணம் & பந்தல் காற்று கணிப்பு' : 'Wedding & outdoor event feasibility.'}
                </p>
              </div>
            </button>

            {/* Tool 3: Community Spotter */}
            <button
              onClick={onOpenSpotter}
              className="p-3.5 rounded-3xl bg-white/90 hover:bg-white border border-teal-200/80 hover:border-teal-400 text-left transition-all shadow-2xs space-y-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-teal-100 text-teal-700 border border-teal-200 inline-flex items-center justify-center">
                  <Users className="w-4 h-4 text-teal-600" />
                </span>
                <span className="text-[9px] font-bold text-teal-700 bg-teal-100/90 px-1.5 py-0.5 rounded">
                  Feed
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                  {activeLanguage === 'ta' ? 'மக்கள் நேரடி சமூகம்' : 'Sky Spotter'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {activeLanguage === 'ta' ? 'தெரு வாரியாக தண்ணீர் தேக்கம் & மழை' : 'Crowdsourced street waterlogging.'}
                </p>
              </div>
            </button>

            {/* Tool 4: Emergency SOS */}
            <button
              onClick={onOpenEmergencySOS}
              className="p-3.5 rounded-3xl bg-rose-50/90 hover:bg-rose-100/90 border border-rose-300 text-left transition-all shadow-2xs space-y-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-rose-200 text-rose-800 border border-rose-300 inline-flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
                </span>
                <span className="text-[9px] font-black text-rose-800 bg-rose-200/80 px-1.5 py-0.5 rounded">
                  SOS
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-950 group-hover:text-rose-700 transition-colors">
                  {activeLanguage === 'ta' ? 'புயல் வெள்ள SOS' : 'Disaster SOS'}
                </h4>
                <p className="text-[10px] text-rose-800 mt-0.5">
                  {activeLanguage === 'ta' ? 'முன்கூட்டிய எச்சரிக்கை & அவசர உதவி' : 'Predictive hazard alert & 1-tap SOS.'}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: AGRICULTURE & SOWING GUIDANCE */}
      {activeTab === 'agri' && (
        <div className="bg-white/90 backdrop-blur-xl border border-emerald-200/80 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wheat className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  {activeLanguage === 'ta' ? 'விவசாய விதை & பயிர் வழிகாட்டி' : 'Smart Climate Seed & Crop Selection'}
                </h3>
                <p className="text-[10px] text-emerald-700 font-medium">
                  {activeLanguage === 'ta' ? 'மண் ஈரப்பதம் மற்றும் விதைப்பு நேரம்' : 'Recommended sowing window based on current weather'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {cropSeedAdvisory?.sowingStatusLabel || 'Optimal Sowing'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
              <span className="text-[10px] font-semibold text-slate-500 block">{activeLanguage === 'ta' ? 'மேல்மண் ஈரப்பதம்' : 'Topsoil Moisture'}</span>
              <span className="text-lg font-black text-emerald-800">{soilMoistureVal}%</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
              <span className="text-[10px] font-semibold text-slate-500 block">{activeLanguage === 'ta' ? 'மண் வெப்பநிலை' : 'Soil Temperature'}</span>
              <span className="text-lg font-black text-emerald-800">{soilTempVal}°C</span>
            </div>
          </div>

          {/* Seeds list */}
          <div className="space-y-1.5">
            {(cropSeedAdvisory?.recommendedSeeds || []).slice(0, 2).map((seed, idx) => (
              <div key={idx} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-0.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{activeLanguage === 'ta' ? seed.cropTa : seed.cropEn}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">{seed.suitability}</span>
                </div>
                <p className="text-[10px] text-slate-600">{activeLanguage === 'ta' ? seed.reasonTa : seed.reasonEn}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onOpenChat && onOpenChat(activeLanguage === 'ta' ? 'இந்த வானிலைக்கு எந்த விதை விதைக்கலாம்? விவசாய ஆலோசனை கூறவும்' : 'Which seeds should I sow in this climate? Give crop advice')}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <span>{activeLanguage === 'ta' ? 'AI விவசாய அரட்டை ஆலோசனை' : 'Ask AI Crop Advice'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB CONTENT 5: AQI & HEALTH TELEMETRY */}
      {activeTab === 'health' && (
        <div className="bg-white/90 backdrop-blur-xl border border-sky-200/70 rounded-3xl p-4 shadow-2xs space-y-3 animate-fadeIn">
          <div className="flex items-center space-x-1.5">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900">
              {activeLanguage === 'ta' ? 'காற்று தரம் மற்றும் உடல்நலப் பாதுகாப்பு' : 'Air Quality & Environmental Health'}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {/* AQI */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">US AQI PM2.5</span>
              <div className="text-xl font-black text-emerald-700">{aqiVal}</div>
              <p className="text-[10px] text-slate-600">{activeLanguage === 'ta' ? 'தூய்மையான காற்று; பாதுகாப்பானது.' : 'Good air quality for outdoor activity.'}</p>
            </div>

            {/* UV */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">UV Index</span>
              <div className="text-xl font-black text-amber-700">UV {uvVal}</div>
              <p className="text-[10px] text-slate-600">{activeLanguage === 'ta' ? 'நண்பகலில் தொப்பி அணியவும்.' : 'Moderate UV; sunglasses advised.'}</p>
            </div>
          </div>

          {/* Sun Cycle */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Sunrise className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-[10px] text-slate-500 block">{activeLanguage === 'ta' ? 'சூரிய உதயம்' : 'Sunrise'}</span>
                <span className="font-bold text-slate-900">{sunriseStr}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Sunset className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-[10px] text-slate-500 block">{activeLanguage === 'ta' ? 'சூரிய அஸ்தமனம்' : 'Sunset'}</span>
                <span className="font-bold text-slate-900">{sunsetStr}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. 4 KEY TELEMETRY BADGES (Always visible for quick glance) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Wind */}
        <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-md border border-sky-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <Wind className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-semibold text-slate-400">10m</span>
          </div>
          <div className="text-base font-black text-slate-900">
            {windKmh} <span className="text-[10px] font-bold text-slate-500">km/h</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium">
            Gust {windGust} km/h
          </div>
        </div>

        {/* Humidity */}
        <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-md border border-sky-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <Droplets className="w-3.5 h-3.5 text-teal-500" />
            <span className="text-[10px] font-semibold text-slate-400">RH</span>
          </div>
          <div className="text-base font-black text-slate-900">
            {humidity}%
          </div>
          <div className="text-[9px] text-slate-500 font-medium">
            Dew point {dewPoint}°C
          </div>
        </div>

        {/* Rain */}
        <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-md border border-sky-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <CloudRain className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[10px] font-semibold text-sky-600 font-mono">Today</span>
          </div>
          <div className="text-base font-black text-slate-900">
            {rainToday} <span className="text-[10px] font-bold text-slate-500">mm</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium">
            {rainProbNow}% chance
          </div>
        </div>

        {/* Air Quality */}
        <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-md border border-sky-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-semibold text-emerald-600 font-bold">Good</span>
          </div>
          <div className="text-base font-black text-slate-900">
            {aqiVal} <span className="text-[10px] font-bold text-slate-500">AQI</span>
          </div>
          <div className="text-[9px] text-slate-500 font-medium">
            PM2.5 Clean
          </div>
        </div>
      </div>
    </div>
  );
}
