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
  Check
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';
import { getWeatherDescription } from '../services/weatherService';

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
  weatherData,
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

  const daily = weatherData?.daily || {};
  const hourly = weatherData?.hourly || {};

  useEffect(() => {
    evaluateEventFeasibility();
  }, [selectedType, selectedDayIndex, selectedSlot, weatherData, activeLanguage]);

  const evaluateEventFeasibility = () => {
    if (!hourly.time || hourly.time.length === 0) return;

    const startIndex = selectedDayIndex * 24 + selectedSlot.startHour;
    const endIndex = selectedDayIndex * 24 + selectedSlot.endHour;

    const sliceTimes = (hourly.time || []).slice(startIndex, endIndex);
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

    // Compute Feasibility Score (0 - 100)
    let score = 100;

    // Rain Penalty
    if (maxRainProb > selectedType.rainThreshold) {
      const diff = maxRainProb - selectedType.rainThreshold;
      score -= Math.min(50, diff * 0.8);
    }
    if (totalPrecip > 2) {
      score -= Math.min(30, totalPrecip * 6);
    }

    // Wind Penalty for pandal/tent
    if (maxWind > selectedType.windThreshold) {
      const wDiff = maxWind - selectedType.windThreshold;
      score -= Math.min(25, wDiff * 1.5);
    }

    // Extreme Temperature Penalty
    if (avgTemp > 37 || avgTemp < 12) {
      score -= 15;
    }

    const finalScore = Math.max(15, Math.min(99, Math.round(score)));
    setFeasibilityScore(finalScore);

    // AI Checklists & Action Items
    const recs = [];
    if (maxRainProb >= 35 || totalPrecip > 0.5) {
      recs.push({
        type: 'warning',
        text: activeLanguage === 'ta'
          ? `மழை வாய்ப்பு ${maxRainProb}% உள்ளதால், வாட்டர்ப்ரூப் பந்தல் அல்லது மாற்று உள்அரங்கம் ஏற்பாடு செய்யவும்.`
          : `Rain probability is ${maxRainProb}%. Keep waterproof canopies or an indoor banquet backup ready.`,
      });
    } else {
      recs.push({
        type: 'success',
        text: activeLanguage === 'ta'
          ? 'மழை அச்சுறுத்தல் இல்லை. திறந்தவெளி மேடை மற்றும் அலங்காரங்களுக்கு உகந்தது.'
          : 'Zero rain risk in this slot. Perfect for open-air lawn stages and lawns.',
      });
    }

    if (maxWind >= 28) {
      recs.push({
        type: 'warning',
        text: activeLanguage === 'ta'
          ? `காற்றின் வேகம் ${maxWind} km/h வரை வீசக்கூடும். பந்தல் கால்களை வலுவாக நங்கூரமிடவும்.`
          : `Wind gusts up to ${maxWind} km/h. Secure shamiyana anchors and heavy truss lighting.`,
      });
    }

    if (avgTemp >= 33) {
      recs.push({
        type: 'info',
        text: activeLanguage === 'ta'
          ? `வெப்பநிலை ${avgTemp}°C உள்ளதால், விருந்தினர்களுக்கு ஏர் கூலர் மற்றும் குளிர்பானங்கள் வழங்கவும்.`
          : `Warm temperatures (~${avgTemp}°C). Provide mist fans and hydration stations.`,
      });
    }

    if (selectedType.id === 'construction') {
      if (totalPrecip > 1) {
        recs.push({
          type: 'danger',
          text: activeLanguage === 'ta'
            ? 'கான்கிரீட் போடுவதை ஒத்திவைப்பது நல்லது; நீர் கலவை விகிதம் பாதிக்கப்படலாம்.'
            : 'Postpone major concrete slab casting; excess precipitation weakens cement hydration.',
        });
      } else {
        recs.push({
          type: 'success',
          text: activeLanguage === 'ta'
            ? 'கான்கிரீட் க்யூரிங் மற்றும் செட்டிங்கிற்கு உகந்த வானிலை.'
            : 'Favorable atmospheric humidity for standard concrete curing.',
        });
      }
    }

    setRecommendations(recs);
  };

  const getScoreColor = (sc) => {
    if (sc >= 85) return 'text-emerald-600';
    if (sc >= 65) return 'text-sky-600';
    if (sc >= 45) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBadgeClass = (sc) => {
    if (sc >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (sc >= 65) return 'bg-sky-100 text-sky-800 border-sky-300';
    if (sc >= 45) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-20 animate-fadeIn">
      {/* 1. Header & Event Type Picker */}
      <div className="bg-gradient-to-br from-white via-rose-50/40 to-amber-50/30 border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {activeLanguage === 'ta' ? '🎪 சுபகாரிய & விழா வானிலை கணிப்பான்' : '🎪 Event & Wedding Feasibility Weather Score'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeLanguage === 'ta'
                  ? 'திருமணம், விளையாட்டு, திருவிழா பந்தல் மற்றும் திறந்தவெளி நிகழ்வுகளுக்கான AI வானிலை சாத்தியக்கூறு'
                  : 'Predict event feasibility, pandal wind safety, rain risk, and optimal time windows.'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-200">
            {currentLocation?.name || 'Chennai'}
          </span>
        </div>

        {/* 5 Event Type Selector Cards */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {activeLanguage === 'ta' ? 'நிகழ்வு வகையைத் தேர்ந்தெடுக்கவும்:' : 'Select Event Category:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {EVENT_TYPES.map((ev) => {
              const Icon = ev.icon;
              const isSelected = selectedType.id === ev.id;
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedType(ev)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-1 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md shadow-slate-900/20 border-slate-900'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold leading-tight line-clamp-2">
                    {activeLanguage === 'ta' ? ev.labelTa : ev.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date and Time Slot Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Day Selector (Today, Tomorrow, Day +2...+6) */}
          <div className="p-3 bg-white/90 border border-slate-200/80 rounded-2xl space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'நிகழ்வு நாள்:' : 'Event Date:'}</span>
            </label>
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                const d = new Date(Date.now() + dayIdx * 86400000);
                const dayLabel = dayIdx === 0
                  ? (activeLanguage === 'ta' ? 'இன்று' : 'Today')
                  : dayIdx === 1
                  ? (activeLanguage === 'ta' ? 'நாளை' : 'Tomorrow')
                  : d.toLocaleDateString(activeLanguage === 'ta' ? 'ta-IN' : 'en-US', { weekday: 'short' });

                const isSelected = selectedDayIndex === dayIdx;
                return (
                  <button
                    key={dayIdx}
                    onClick={() => setSelectedDayIndex(dayIdx)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {dayLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Selector */}
          <div className="p-3 bg-white/90 border border-slate-200/80 rounded-2xl space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'நேர இடைவெளி:' : 'Time Window:'}</span>
            </label>
            <select
              value={selectedSlot.id}
              onChange={(e) => {
                const found = TIME_SLOTS.find((s) => s.id === e.target.value);
                if (found) setSelectedSlot(found);
              }}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {activeLanguage === 'ta' ? slot.labelTa : slot.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Feasibility Score & Risk Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Main Feasibility Score */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'நிகழ்வு சாத்தியக்கூறு குறியீடு' : 'Feasibility Score'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-4xl font-black ${getScoreColor(feasibilityScore)}`}>
              {feasibilityScore}
            </span>
            <span className="text-sm text-slate-400 font-bold">/ 100</span>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border self-start ${getScoreBadgeClass(feasibilityScore)}`}>
            {feasibilityScore >= 85
              ? (activeLanguage === 'ta' ? '🌟 சிறந்தது (Highly Optimal)' : '🌟 Highly Optimal')
              : feasibilityScore >= 65
              ? (activeLanguage === 'ta' ? '👍 மிதமானது (Good Condition)' : '👍 Good Condition')
              : feasibilityScore >= 45
              ? (activeLanguage === 'ta' ? '⚠️ கவனத்துடன் திட்டமிடவும்' : '⚠️ Moderate Risk')
              : (activeLanguage === 'ta' ? '⛔ ஒத்திவைக்க பரிந்துரை' : '⛔ High Hazard Risk')}
          </span>
        </div>

        {/* Rain Probability & Accumulation */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'மழை குறுக்கீடு வாய்ப்பு' : 'Rain Interruption Risk'}</span>
            <CloudRain className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{eventMetrics.maxRainProb}% Rain</div>
            <div className="text-xs text-slate-500 font-medium">~{eventMetrics.totalPrecip} mm volume</div>
          </div>
          <p className="text-[10px] text-slate-400">
            {eventMetrics.maxRainProb < 20
              ? (activeLanguage === 'ta' ? 'திறந்தவெளி பந்தலுக்கு பாதுகாப்பானது.' : 'Nominal rain probability.')
              : (activeLanguage === 'ta' ? 'மழைக்கான வாய்ப்புள்ளது; கூரை பந்தல் தேவை.' : 'Raincover canopy strongly advised.')}
          </p>
        </div>

        {/* Guest Comfort & Wind Gusts */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'விருந்தினர் சௌகரியம் & காற்று' : 'Guest Comfort & Wind'}</span>
            <Wind className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{eventMetrics.avgTemp}°C</div>
            <div className="text-xs text-slate-500 font-medium">{eventMetrics.comfortLabel} | {eventMetrics.maxWind} km/h wind</div>
          </div>
          <p className="text-[10px] text-slate-400">
            {eventMetrics.maxWind <= 25
              ? (activeLanguage === 'ta' ? 'பந்தல் மற்றும் மேடைக்கு உகந்த காற்று.' : 'Safe wind for outdoor trusses & audio.')
              : (activeLanguage === 'ta' ? 'பலத்த காற்று வீசலாம்; பந்தலை பலப்படுத்தவும்.' : 'Higher wind gusts; anchor structures.')}
          </p>
        </div>
      </div>

      {/* 3. AI Recommendations & Preparation Checklist */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
              {activeLanguage === 'ta' ? 'AI நிகழ்வு தயார்நிலை வழிகாட்டுதல் (Checklist)' : 'AI Actionable Preparation Checklist'}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {selectedSlot.labelEn.split('(')[0]}
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl text-xs font-medium flex items-start space-x-2.5 border ${
                rec.type === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : rec.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : rec.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {rec.type === 'danger' || rec.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="leading-relaxed">{rec.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
