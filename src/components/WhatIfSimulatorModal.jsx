import React, { useState } from 'react';
import {
  Sliders,
  X,
  Sparkles,
  AlertTriangle,
  CloudRain,
  Wind,
  Navigation,
  Layers,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

export default function WhatIfSimulatorModal({
  isOpen,
  onClose,
  activeLanguage = 'en',
  weatherData,
  currentLocationName = 'Chennai'
}) {
  const [rainModifier, setRainModifier] = useState(50); // +50% rain by default
  const [windModifier, setWindModifier] = useState(20); // +20 km/h wind
  const [cycloneTrackShift, setCycloneTrackShift] = useState('central'); // 'west' | 'central' | 'east'

  if (!isOpen) return null;
  const isTa = activeLanguage === 'ta';

  const baseRain = weatherData?.daily?.precipitation_sum?.[0] || weatherData?.current?.precipitation || 15;
  const baseWind = weatherData?.current?.wind_speed_10m || 15;

  const simulatedRain = Math.max(0, Math.round(baseRain * (1 + rainModifier / 100)));
  const simulatedWind = Math.max(5, Math.round(baseWind + windModifier));

  // Determine Cascading Sector Impacts
  const getSimulatedImpacts = () => {
    let floodRisk = 'Low';
    let floodColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let floodDesc = isTa ? 'நீர் வடிகால் கொள்ளளவுக்குள் உள்ளது.' : 'Municipal drainage channels flow with nominal capacity.';

    if (simulatedRain >= 70) {
      floodRisk = isTa ? 'தீவிர வெள்ளப்பெருக்கு (Critical)' : 'Critical Inundation';
      floodColor = 'text-rose-700 bg-rose-50 border-rose-200';
      floodDesc = isTa ? 'வேளச்சேரி, தாம்பரம், வியாசர்பாடி சுரங்கப்பாதைகளில் 2-3 அடி வரை நீர் தேங்கும்.' : 'Severe waterlogging (2-3 ft) at underpasses, arterial road subways & basin floors.';
    } else if (simulatedRain >= 35) {
      floodRisk = isTa ? 'மிதமான வெள்ள அபாயம் (Moderate)' : 'Moderate Ponding';
      floodColor = 'text-amber-700 bg-amber-50 border-amber-200';
      floodDesc = isTa ? 'தாழ்வான பகுதிகளில் ஆங்காங்கே நீர் தேங்கி போக்குவரத்து நெரிசல் ஏற்படும்.' : 'Localized street ponding with 30-45 min traffic slowdowns.';
    }

    let windRisk = isTa ? 'இயல்பு (Nominal)' : 'Nominal';
    let windColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let windDesc = isTa ? 'மரங்கள் மற்றும் மின்கம்பங்களுக்கு பாதிப்பில்லை.' : 'Zero structural damage or power grid disruption.';

    if (simulatedWind >= 65) {
      windRisk = isTa ? 'தீவிர சூறைக்காற்று (Severe)' : 'Severe Squall';
      windColor = 'text-rose-700 bg-rose-50 border-rose-200';
      windDesc = isTa ? 'பழைய மரக்கிளைகள் முறிதல், மின்தடை மற்றும் தகரக்கூரைகள் பறக்கும் அபாயம்.' : 'Tree falls, overhead wire snaps & tin sheet hazard. Suspend all two-wheeler travel.';
    } else if (simulatedWind >= 40) {
      windRisk = isTa ? 'பலத்த காற்று (High)' : 'High Squall';
      windColor = 'text-amber-700 bg-amber-50 border-amber-200';
      windDesc = isTa ? 'நெடுஞ்சாலைகளில் வாகனங்கள் நிலைதடுமாறும் வாய்ப்பு.' : 'Crosswind drift on open bridges and elevated highways.';
    }

    let farmRisk = isTa ? 'தெளிப்புக்கு உகந்தது' : 'Favorable Sowing/Spraying';
    let farmColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (simulatedRain >= 25 || simulatedWind >= 30) {
      farmRisk = isTa ? 'விவசாய சேதம் / மருந்து வீணாகும்' : 'Severe Spray Wash-Off & Lodging';
      farmColor = 'text-rose-700 bg-rose-50 border-rose-200';
    }

    return { floodRisk, floodColor, floodDesc, windRisk, windColor, windDesc, farmRisk, farmColor };
  };

  const impacts = getSimulatedImpacts();

  const handleReset = () => {
    setRainModifier(0);
    setWindModifier(0);
    setCycloneTrackShift('central');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 animate-scaleUp flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 via-cyan-50/50 to-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-600 text-white shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {isTa ? '🧪 "வாட்-இஃப்" வானிலை மாதிரி சிமுலேட்டர்' : '🧪 "What-If" Weather Scenario Simulator'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isTa ? 'வானிலை மாறினால் ஏற்படும் விளைவுகளை முன்கூட்டியே சோதிக்கவும்' : 'Simulate & Explore Extreme Meteorological Variations'}
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

        {/* Disclaimer Banner */}
        <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center space-x-2 text-[11px] text-amber-800 font-bold">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            {isTa
              ? '⚠️ கவனத்திற்கு: இது ஒரு மாதிரி பரிசோதனை கருவி (Scenario Simulator), நேரடி வானிலை முன்னறிவிப்பு அல்ல.'
              : '⚠️ Disclaimer: This is a stress-testing simulation model, not an operational forecast.'}
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Controls / Sliders */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                {isTa ? 'வானிலை அளவீடுகளை மாற்றவும்' : 'Scenario Parameter Controls'}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center space-x-1 text-xs text-sky-600 font-bold hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isTa ? 'ரீசெட்' : 'Reset'}</span>
              </button>
            </div>

            {/* Slider 1: Rainfall */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center space-x-1.5 text-slate-700">
                  <CloudRain className="w-4 h-4 text-sky-600" />
                  <span>{isTa ? 'மழை அளவு மாற்றம் (Rainfall Variance)' : 'Rainfall Variance'}</span>
                </span>
                <span className="text-sky-700 font-black">
                  {rainModifier >= 0 ? `+${rainModifier}%` : `${rainModifier}%`} ➔ ({simulatedRain} mm)
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="150"
                step="10"
                value={rainModifier}
                onChange={(e) => setRainModifier(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Slider 2: Wind Speed */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center space-x-1.5 text-slate-700">
                  <Wind className="w-4 h-4 text-amber-600" />
                  <span>{isTa ? 'காற்றின் வேகம் மாற்றம் (Wind Variance)' : 'Wind Gust Variance'}</span>
                </span>
                <span className="text-amber-700 font-black">
                  {windModifier >= 0 ? `+${windModifier} km/h` : `${windModifier} km/h`} ➔ ({simulatedWind} km/h)
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="60"
                step="5"
                value={windModifier}
                onChange={(e) => setWindModifier(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Cyclone Track Option */}
            <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
              <span className="text-xs font-bold text-slate-700 block">
                {isTa ? 'புயல் வழித்தட திசைமாற்றம் (Cyclone Track Shift)' : 'Cyclone Track Offset Simulation'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'west', label: isTa ? '50 km மேற்கு (Landfall)' : '50 km West (Direct)' },
                  { id: 'central', label: isTa ? 'கணிக்கப்பட்ட பாதை' : 'Forecast Path' },
                  { id: 'east', label: isTa ? '50 km கிழக்கு (Offshore)' : '50 km East (Sea)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCycloneTrackShift(t.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer truncate ${
                      cycloneTrackShift === t.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simulated Cascading Impacts */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>{isTa ? 'உருவகப்படுத்தப்பட்ட விளைவுகள் (Simulated Impacts)' : 'Simulated Multi-Sector Impacts'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Flood Impact Card */}
              <div className={`p-3.5 rounded-2xl border ${impacts.floodColor} space-y-1.5 shadow-2xs`}>
                <div className="flex items-center justify-between font-black">
                  <span>{isTa ? '🏙️ நகர்ப்புற வெள்ள அபாயம்' : '🏙️ Urban Inundation'}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/80 border text-[10px] font-black">{impacts.floodRisk}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{impacts.floodDesc}</p>
              </div>

              {/* Wind Impact Card */}
              <div className={`p-3.5 rounded-2xl border ${impacts.windColor} space-y-1.5 shadow-2xs`}>
                <div className="flex items-center justify-between font-black">
                  <span>{isTa ? '💨 காற்று & உட்கட்டமைப்பு' : '💨 Wind & Infrastructure'}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/80 border text-[10px] font-black">{impacts.windRisk}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{impacts.windDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">{currentLocationName} Synthetic Stress Model</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
          >
            {isTa ? 'மூடு (Close)' : 'Close Simulator'}
          </button>
        </div>
      </div>
    </div>
  );
}
