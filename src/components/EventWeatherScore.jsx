import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CloudRain,
  Wind,
  Sun,
  Thermometer,
  Droplets,
  CheckCircle2,
  Heart,
  Trophy,
  Hammer,
  Camera,
  Layers,
  Check,
  MapPin,
  Search,
  RefreshCw
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';
import { getWeatherDescription, searchLocation, fetchNWPForecast } from '../services/weatherService';

const EVENT_TYPES = [
  {
    id: 'wedding',
    icon: Heart,
    labelEn: 'Wedding & Reception',
    labelTa: 'திருமணம் & வரவேற்பு',
    color: 'from-pink-500 to-rose-500',
    windThreshold: 30, // max safe wind km/h for shamiyana/pandal
    rainThreshold: 15, // max safe rain %
  },
  {
    id: 'sports',
    icon: Trophy,
    labelEn: 'Cricket & Outdoor Sports',
    labelTa: 'கிரிக்கெட் & விளையாட்டு போட்டி',
    color: 'from-amber-500 to-emerald-500',
    windThreshold: 40,
    rainThreshold: 25,
  },
  {
    id: 'construction',
    icon: Hammer,
    labelEn: 'Construction & Concreting',
    labelTa: 'கட்டடம் & கான்கிரீட் போடுதல்',
    color: 'from-blue-500 to-indigo-500',
    windThreshold: 45,
    rainThreshold: 10,
  },
  {
    id: 'festival',
    icon: Sparkles,
    labelEn: 'Festival, Pandal & Gathering',
    labelTa: 'திருவிழா, பொதுக்கூட்டம் & பந்தல்',
    color: 'from-purple-500 to-indigo-600',
    windThreshold: 32,
    rainThreshold: 20,
  },
  {
    id: 'photography',
    icon: Camera,
    labelEn: 'Outdoor Photography / Shoot',
    labelTa: 'வெளிப்புற போட்டோ & வீடியோ ஷூட்',
    color: 'from-teal-500 to-sky-500',
    windThreshold: 35,
    rainThreshold: 20,
  },
];

const TIME_SLOTS = [
  { id: 'morning', labelEn: 'Morning (06:00 AM – 11:00 AM)', labelTa: 'காலை (06:00 AM – 11:00 AM)', startHour: 6, endHour: 11 },
  { id: 'afternoon', labelEn: 'Afternoon (12:00 PM – 04:00 PM)', labelTa: 'நண்பகல் (12:00 PM – 04:00 PM)', startHour: 12, endHour: 16 },
  { id: 'evening', labelEn: 'Evening (04:00 PM – 08:00 PM)', labelTa: 'மாலை (04:00 PM – 08:00 PM)', startHour: 16, endHour: 20 },
  { id: 'night', labelEn: 'Night (08:00 PM – 12:00 AM)', labelTa: 'இரவு (08:00 PM – 12:00 AM)', startHour: 20, endHour: 24 },
  { id: 'fullday', labelEn: 'Full Day Event (All Day)', labelTa: 'முழு நாள் நிகழ்வு', startHour: 8, endHour: 22 },
];

export default function EventWeatherScore({
  activeLanguage = 'en',
  currentLocation,
  weatherData: initialWeatherData,
  aqiData,
}) {
  const [selectedType, setSelectedType] = useState(EVENT_TYPES[0]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 = Today, 1 = Tomorrow, 2 = Day 3...
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[2]); // Default: Evening
  const [feasibilityScore, setFeasibilityScore] = useState(92);
  const [eventMetrics, setEventMetrics] = useState({
    avgTemp: 28,
    maxRainProb: 15,
    totalPrecip: 0,
    maxWind: 18,
    humidity: 75,
    comfortLabel: 'Comfortable',
  });
  const [recommendations, setRecommendations] = useState([]);

  // Location Search State for Event Venue
  const [venueQuery, setVenueQuery] = useState('');
  const [venueSuggestions, setVenueSuggestions] = useState([]);
  const [activeVenue, setActiveVenue] = useState(currentLocation);
  const [localWeatherData, setLocalWeatherData] = useState(initialWeatherData);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);

  useEffect(() => {
    if (!activeVenue && currentLocation) {
      setActiveVenue(currentLocation);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (activeVenue?.latitude && activeVenue?.longitude) {
      setIsLoadingForecast(true);
      fetchNWPForecast(activeVenue.latitude, activeVenue.longitude)
        .then((data) => {
          if (data) setLocalWeatherData(data);
        })
        .catch(console.warn)
        .finally(() => setIsLoadingForecast(false));
    }
  }, [activeVenue]);

  const daily = localWeatherData?.daily || initialWeatherData?.daily || {};
  const hourly = localWeatherData?.hourly || initialWeatherData?.hourly || {};

  useEffect(() => {
    evaluateEventFeasibility();
  }, [selectedType, selectedDayIndex, selectedSlot, localWeatherData, initialWeatherData, activeLanguage]);

  const handleVenueSearch = async (val) => {
    setVenueQuery(val);
    if (val.trim().length >= 2) {
      try {
        const results = await searchLocation(val.trim());
        setVenueSuggestions(results.slice(0, 4));
      } catch (e) {
        setVenueSuggestions([]);
      }
    } else {
      setVenueSuggestions([]);
    }
  };

  const evaluateEventFeasibility = () => {
    if (!hourly.time || hourly.time.length === 0) return;

    const startIndex = selectedDayIndex * 24 + selectedSlot.startHour;
    const endIndex = selectedDayIndex * 24 + selectedSlot.endHour;

    const sliceTemps = (hourly.temperature_2m || []).slice(startIndex, endIndex);
    const sliceProbs = (hourly.precipitation_probability || []).slice(startIndex, endIndex);
    const slicePrecips = (hourly.precipitation || []).slice(startIndex, endIndex);
    const sliceWinds = (hourly.wind_speed_10m || []).slice(startIndex, endIndex);
    const sliceHumidities = (hourly.relative_humidity_2m || []).slice(startIndex, endIndex);

    const maxRainProb = sliceProbs.length > 0 ? Math.max(...sliceProbs) : (daily.precipitation_probability_max?.[selectedDayIndex] || 10);
    const totalPrecip = slicePrecips.reduce((acc, val) => acc + (val || 0), 0);
    const maxWind = sliceWinds.length > 0 ? Math.max(...sliceWinds) : 18;
    const avgTemp = sliceTemps.length > 0 ? Math.round(sliceTemps.reduce((a, b) => a + b, 0) / sliceTemps.length) : 29;
    const avgHumidity = sliceHumidities.length > 0 ? Math.round(sliceHumidities.reduce((a, b) => a + b, 0) / sliceHumidities.length) : 70;

    // Thermal comfort index
    let comfortLabel = 'Comfortable';
    if (avgTemp > 35) comfortLabel = activeLanguage === 'ta' ? 'அதிக வெப்பம் (Hot)' : 'Hot & Sunny';
    else if (avgTemp > 31 && avgHumidity > 75) comfortLabel = activeLanguage === 'ta' ? 'புழுக்கம் (Humid)' : 'Humid & Muggy';
    else if (avgTemp < 20) comfortLabel = activeLanguage === 'ta' ? 'குளிர்ச்சியானது (Cool)' : 'Pleasantly Cool';
    else comfortLabel = activeLanguage === 'ta' ? 'மிதமானது (Comfortable)' : 'Optimal Comfort';

    setEventMetrics({
      avgTemp,
      maxRainProb,
      totalPrecip: totalPrecip.toFixed(1),
      maxWind,
      humidity: avgHumidity,
      comfortLabel,
    });

    // Compute Feasibility Score (0-100)
    let score = 100;
    const recs = [];

    // Rain Penalty
    if (maxRainProb > selectedType.rainThreshold) {
      const penalty = Math.min((maxRainProb - selectedType.rainThreshold) * 1.2, 45);
      score -= penalty;
      recs.push({
        type: 'rain',
        icon: CloudRain,
        color: 'text-sky-600 bg-sky-50 border-sky-200',
        text:
          activeLanguage === 'ta'
            ? `மழை வாய்ப்பு ${maxRainProb}% உள்ளதால், நீர் புகா பந்தல் கூரை (Waterproof Shamiyana) அமைக்கவும்.`
            : `Rain probability is ${maxRainProb}%. Setup waterproof shamiyana coverings with side flaps.`,
      });
    }

    // Wind Penalty for Shamiyana / Pandal
    if (maxWind > selectedType.windThreshold) {
      const penalty = Math.min((maxWind - selectedType.windThreshold) * 1.5, 30);
      score -= penalty;
      recs.push({
        type: 'wind',
        icon: Wind,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        text:
          activeLanguage === 'ta'
            ? `காற்றின் வேகம் ${maxWind} km/h உள்ளதால், பந்தல் தூண்கள் மற்றும் அலங்கார மேடைகளை பலமாக கயிறுகளால் பிணைக்கவும்.`
            : `Wind gusts up to ${maxWind} km/h. Secure shamiyana anchor poles with counterweights.`,
      });
    }

    // Temperature & Heat Index Checklist
    if (avgTemp > 34) {
      score -= 10;
      recs.push({
        type: 'heat',
        icon: Sun,
        color: 'text-rose-600 bg-rose-50 border-rose-200',
        text:
          activeLanguage === 'ta'
            ? `வெப்பம் ${avgTemp}°C உள்ளதால், விருந்தினர்களுக்கு ஏர் கூலர் (Mist Fans) மற்றும் பானங்கள் ஏற்பாடு செய்யவும்.`
            : `High ambient temperature ${avgTemp}°C. Arrange outdoor misting fans and hydration counters.`,
      });
    } else {
      recs.push({
        type: 'comfort',
        icon: CheckCircle2,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        text:
          activeLanguage === 'ta'
            ? 'வானிலை அமைதியாகவும், மிதமான வெப்பத்துடனும் உள்ளது; வெளிப்புற நிகழ்ச்சிக்கு மிகவும் சிறந்தது.'
            : 'Pleasant ambient conditions with optimal guest thermal comfort score.',
      });
    }

    setFeasibilityScore(Math.max(Math.round(score), 20));
    setRecommendations(recs);
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* 1. Header & Venue Selector Card */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-50 to-rose-50 text-rose-600 border border-rose-200 shadow-xs">
              <Sparkles className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {activeLanguage === 'ta' ? '🎪 சுபகாரிய & விழா வானிலை சாத்தியக்கூறு கணிப்பான்' : '🎪 Event & Wedding Feasibility Weather Score'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeLanguage === 'ta'
                  ? 'திருமணம், விளையாட்டு, பந்தல் மற்றும் வெளிப்புற நிகழ்வுகளுக்கான 7 நாள் மழை & காற்று பாதுகாப்பு மதிப்பீடு'
                  : 'AI suitability score (0-100), rain window probability, shamiyana wind resistance & guest comfort checklist'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 self-start sm:self-auto flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Venue NWP Forecast</span>
          </span>
        </div>

        {/* Custom Venue / City Search Bar */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-50/70 via-rose-50/70 to-indigo-50/70 border border-rose-100 space-y-2 relative">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>{activeLanguage === 'ta' ? 'நிகழ்ச்சி நடைபெறும் இடம்:' : 'Event Venue / City:'}</span>
            </span>
            <span className="text-[10px] font-extrabold text-rose-700 px-2 py-0.5 rounded bg-white border border-rose-200">
              {activeVenue?.name || 'Chennai'}
            </span>
          </div>

          <div className="relative">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs focus-within:border-rose-500">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 flex-shrink-0" />
              <input
                type="text"
                value={venueQuery}
                onChange={(e) => handleVenueSearch(e.target.value)}
                placeholder={activeLanguage === 'ta' ? 'வேறு ஊரைத் தேட தட்டச்சு செய்யவும் (எ.கா: மதுரை, சேலம்)...' : 'Type to search any city/venue location...'}
                className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />
              {isLoadingForecast && <RefreshCw className="w-3.5 h-3.5 text-rose-600 animate-spin ml-1" />}
            </div>

            {/* Venue Autocomplete Suggestions */}
            {venueSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100">
                {venueSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveVenue(s);
                      setVenueQuery(s.name);
                      setVenueSuggestions([]);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-700 font-medium transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate">{s.name}, {s.admin1 || s.country}</span>
                    <span className="text-[9px] text-rose-600 font-bold">Select Venue</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Category Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            {activeLanguage === 'ta' ? 'நிகழ்ச்சி வகை தேர்வு செய்க:' : 'Select Event Category:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {EVENT_TYPES.map((ev) => {
              const Icon = ev.icon;
              const isSelected = selectedType.id === ev.id;

              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedType(ev)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20 border-rose-400'
                      : 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  <span className="text-xs font-bold leading-tight">
                    {activeLanguage === 'ta' ? ev.labelTa : ev.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7-Day Date Picker Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
            <span>{activeLanguage === 'ta' ? 'நிகழ்ச்சி நாள் தேர்வு (அடுத்த 7 நாட்கள்):' : 'Select Event Date (Next 7 Days):'}</span>
          </label>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {(daily.time || [0, 1, 2, 3, 4, 5, 6]).slice(0, 7).map((dStr, idx) => {
              const dateObj = dStr ? new Date(dStr) : new Date(Date.now() + idx * 86400000);
              const dayName = idx === 0 ? (activeLanguage === 'ta' ? 'இன்று' : 'Today') : idx === 1 ? (activeLanguage === 'ta' ? 'நாளை' : 'Tomorrow') : dateObj.toLocaleDateString([], { weekday: 'short' });
              const dateLabel = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
              const isSelected = selectedDayIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-2xl text-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-bold block opacity-80">{dayName}</span>
                  <span className="text-xs font-black block">{dateLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slot Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            <span>{activeLanguage === 'ta' ? 'நிகழ்ச்சி நேரம் (Time Window):' : 'Event Time Window:'}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedSlot.id === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {activeLanguage === 'ta' ? slot.labelTa : slot.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Feasibility Score & Weather Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Score Card */}
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'சுபகாரிய சாத்தியக்கூறு குறியீடு' : 'Feasibility Weather Score'}</span>
            <ShieldCheck className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-4xl font-black ${
              feasibilityScore >= 80 ? 'text-emerald-600' : feasibilityScore >= 60 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {feasibilityScore}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md self-start ${
            feasibilityScore >= 80
              ? 'bg-emerald-100 text-emerald-800'
              : feasibilityScore >= 60
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {feasibilityScore >= 80
              ? (activeLanguage === 'ta' ? '✅ சுபகாரியத்திற்கு மிகச் சிறந்தது' : '✅ Highly Suitable for Outdoor')
              : feasibilityScore >= 60
              ? (activeLanguage === 'ta' ? '⚠️ சில முன்னெச்சரிக்கைகள் தேவை' : '⚠️ Minor Precautions Advised')
              : (activeLanguage === 'ta' ? '⛔ மழை / காற்று அபாயம்' : '⛔ High Weather Disruption Risk')}
          </span>
        </div>

        {/* Rain & Wind Telemetry */}
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'மழை & காற்று மதிப்பீடு' : 'Precipitation & Wind Risk'}</span>
            <CloudRain className="w-4 h-4 text-sky-600" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Rain Chance</span>
              <span className="text-xl font-black text-slate-900">{eventMetrics.maxRainProb}%</span>
              <span className="text-[9px] text-slate-500 block">~{eventMetrics.totalPrecip} mm</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Max Wind</span>
              <span className="text-xl font-black text-slate-900">{eventMetrics.maxWind} km/h</span>
              <span className="text-[9px] text-slate-500 block">
                {eventMetrics.maxWind > selectedType.windThreshold ? '⚠️ Gusty' : '✅ Calm'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            {activeLanguage === 'ta' ? 'பந்தல் தாங்கும் திறன் அடிப்படையில்' : 'Based on pandal wind resistance'}
          </p>
        </div>

        {/* Guest Comfort Index */}
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'விருந்தினர் சௌகரியம்' : 'Guest Thermal Comfort'}</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{eventMetrics.avgTemp}°C</div>
            <div className="text-xs font-bold text-emerald-700">{eventMetrics.comfortLabel}</div>
          </div>
          <p className="text-[10px] text-slate-500">
            {activeLanguage === 'ta' ? `ஈரப்பதம்: ${eventMetrics.humidity}%. சீரான காற்று.` : `Relative humidity at ${eventMetrics.humidity}%.`}
          </p>
        </div>
      </div>

      {/* 3. Actionable AI Event Preparation Checklist */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{activeLanguage === 'ta' ? 'AI பாதுகாப்பு & ஏற்பாடுகள் வழிகாட்டி (Checklist)' : 'AI Actionable Event Preparation Checklist'}</span>
        </h3>

        <div className="space-y-2">
          {recommendations.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-start space-x-2.5 transition-all ${rec.color}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-snug text-slate-800">{rec.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
