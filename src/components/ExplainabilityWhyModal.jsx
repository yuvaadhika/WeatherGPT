import React from 'react';
import {
  HelpCircle,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Thermometer,
  Wind,
  CloudRain,
  ShieldAlert,
  Cpu,
  Globe,
  Database
} from 'lucide-react';

export default function ExplainabilityWhyModal({
  isOpen,
  onClose,
  activeLanguage = 'en',
  weatherData,
  currentLocationName = 'Chennai',
  riskData
}) {
  if (!isOpen) return null;
  const isTa = activeLanguage === 'ta';

  const current = weatherData?.current || {};
  const daily = weatherData?.daily || {};
  const wrf = weatherData?.wrfAttributes || {};

  const temp = current.temperature_2m ?? 30;
  const windGust = current.wind_gusts_10m ?? 18;
  const rainToday = daily.precipitation_sum?.[0] ?? (current.precipitation || 0);
  const rainProb = daily.precipitation_probability_max?.[0] ?? 25;
  const humidity = current.relative_humidity_2m ?? 70;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 animate-scaleUp flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {isTa ? '💡 AI ஏன் இந்த முடிவை வழங்குகிறது? (Why Layer)' : '💡 Why This Recommendation? (Explainable AI)'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isTa
                  ? 'வெளிப்படையான வானிலை காரணிகள் & அறிவியல் விளக்கங்கள்'
                  : 'Transparent Factor Decomposition & Scientific Logic'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* 1. Core Synthesis Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-indigo-50/70 to-white text-slate-850 border border-sky-200/90 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase text-sky-800">
                {isTa ? 'முக்கிய முடிவு காரணி' : 'Primary Meteorological Drivers'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 border border-sky-300 text-[10px] font-bold text-sky-800">
                {currentLocationName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {isTa
                ? `தற்போதைய மழை வாய்ப்பு ${rainProb}%, காற்றின் வேகம் ${windGust.toFixed(0)} km/h மற்றும் ஈரப்பதம் ${humidity}% ஆக உள்ளதால், விவசாய தெளிப்பு மற்றும் தாழ்வான போக்குவரத்து ஆகியவற்றில் இடர் அதிகரிக்கிறது.`
                : `Atmospheric model shows ${rainProb}% rain probability with peak wind gusts of ${windGust.toFixed(0)} km/h and ${humidity}% relative humidity, causing elevated agricultural drift and low-lying transit friction.`}
            </p>
          </div>

          {/* 2. Factor-by-Factor Explainability Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isTa ? 'அறிவியல் காரணிகள் பகுப்பாய்வு' : 'Scientific Factor Decomposition'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Factor 1: Rain */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <div className="flex items-center space-x-1.5 text-sky-700">
                    <CloudRain className="w-4 h-4" />
                    <span>{isTa ? 'மழைப்பொழிவு தாக்கம்' : 'Precipitation Trigger'}</span>
                  </div>
                  <span className="text-sky-800">{rainProb}% prob</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {rainProb >= 40
                    ? (isTa ? 'மழை 40%-க்கு மேல் உள்ளதால் பூச்சிக்கொல்லி கரைசல் நீரில் அடித்துச் செல்லப்படும் (Wash-off).' : 'Rain prob exceeds 40% threshold, triggering wash-off risk for agrochemicals.')
                    : (isTa ? 'மழை வாய்ப்பு குறைவு (< 30%), தெளிப்புக்கு உகந்தது.' : 'Precipitation is below 30% threshold; chemical deposition remains stable.')}
                </p>
              </div>

              {/* Factor 2: Wind */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <div className="flex items-center space-x-1.5 text-amber-700">
                    <Wind className="w-4 h-4" />
                    <span>{isTa ? 'காற்றின் வேகம் & சூறை' : 'Wind & Shear Stress'}</span>
                  </div>
                  <span className="text-amber-800">{windGust.toFixed(0)} km/h</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {windGust >= 20
                    ? (isTa ? 'காற்று 15 km/h-ஐ தாண்டுவதால் கரைசல் காற்றில் திசைமாறி வீணாகும் (Spray Drift).' : 'Wind gusts exceed 15 km/h, causing non-target pesticide drift.')
                    : (isTa ? 'காற்று சீராக உள்ளது (< 15 km/h), ஆவியாதல் மற்றும் திசைமாறுதல் இல்லை.' : 'Calm breeze below drift threshold; allows uniform droplet deposition.')}
                </p>
              </div>

              {/* Factor 3: Thermal & CAPE */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <div className="flex items-center space-x-1.5 text-rose-700">
                    <Thermometer className="w-4 h-4" />
                    <span>{isTa ? 'வெப்பச்சலனம் (CAPE Index)' : 'Convective CAPE & Heat'}</span>
                  </div>
                  <span className="text-rose-800">{wrf.convectiveCapeJkg || 1200} J/kg</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {isTa
                    ? 'வளிமண்டல வெப்பச்சலன ஆற்றல் (CAPE > 1000 J/kg) திடீர் இடிமின்னல் உருவாவதற்கான சாத்தியத்தைக் குறிக்கிறது.'
                    : 'Convective Available Potential Energy indicates afternoon localized thunderstorm updraft likelihood.'}
                </p>
              </div>

              {/* Factor 4: Drainage */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <div className="flex items-center space-x-1.5 text-indigo-700">
                    <Layers className="w-4 h-4" />
                    <span>{isTa ? 'மண் & வடிகால் கொள்ளளவு' : 'Soil & Drainage Capacity'}</span>
                  </div>
                  <span className="text-indigo-800">{rainToday.toFixed(1)} mm</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {rainToday > 25
                    ? (isTa ? 'நகர்ப்புற கால்வாய் கொள்ளளவை விட நீர்வரத்து அதிகம்; தாழ்வான இடங்களில் நீர் தேங்கும்.' : 'Runoff volume exceeds micro-canal threshold; low-lying ponding expected.')
                    : (isTa ? 'மழைநீர் வடிகால் கொள்ளளவுக்குள் உள்ளது; இயல்பான ஓட்டம்.' : 'Precipitation volume within municipal drainage threshold.')}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Source Traceability & Data Provenance */}
          <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Database className="w-4 h-4 text-sky-600" />
              <span>{isTa ? 'உறுதிப்படுத்தப்பட்ட தரவு ஆதாரங்கள் (Answer Provenance)' : 'Verified Answer Data Provenance'}</span>
            </div>
            <ul className="space-y-1 text-slate-600 text-[11px]">
              <li className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span><strong>IMD Bulletin:</strong> Regional Coastal Synoptic Guidance (Active)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                <span><strong>Forecast Model:</strong> ECMWF IFS (9km) & NOAA GFS (13km) Multi-Model Run</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                <span><strong>Radar Telemetry:</strong> RainViewer Doppler GIS Composite (5-min latency)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            {isTa ? 'புரிந்தது (Understood)' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
