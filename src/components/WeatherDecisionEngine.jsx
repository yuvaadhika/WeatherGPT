import React, { useState } from 'react';
import {
  Wheat,
  Car,
  Anchor,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Clock,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Wind,
  CloudRain,
  Droplets,
  Thermometer,
  Layers,
  ChevronRight
} from 'lucide-react';

export const DECISION_MODES = [
  { id: 'farm', labelEn: 'Farm Spraying', labelTa: 'பூச்சிக்கொல்லி தெளிப்பு', icon: Wheat },
  { id: 'commute', labelEn: 'Travel & Commute', labelTa: 'பயணம் & சாலை', icon: Car },
  { id: 'marine', labelEn: 'Marine & Fishing', labelTa: 'கடல் & படகு', icon: Anchor },
  { id: 'flood', labelEn: 'Urban Flood Risk', labelTa: 'நகர்ப்புற வெள்ளம்', icon: Building2 },
  { id: 'event', labelEn: 'Outdoor Events', labelTa: 'வெளிப்புற நிகழ்வுகள்', icon: Calendar },
];

export default function WeatherDecisionEngine({
  activeLanguage = 'en',
  weatherData,
  currentLocation,
  onOpenExplainability,
  onOpenSimulator,
  onPromptChat
}) {
  const [selectedMode, setSelectedMode] = useState('farm');
  const isTa = activeLanguage === 'ta';

  const current = weatherData?.current || {};
  const daily = weatherData?.daily || {};
  const hourly = weatherData?.hourly || {};

  const temp = current.temperature_2m ?? 30;
  const windSpeed = current.wind_speed_10m ?? 14;
  const windGust = current.wind_gusts_10m ?? windSpeed * 1.35;
  const rainCurrent = current.precipitation ?? 0;
  const rainToday = daily.precipitation_sum?.[0] ?? rainCurrent;
  const rainProb = daily.precipitation_probability_max?.[0] ?? (rainCurrent > 0 ? 80 : 20);
  const humidity = current.relative_humidity_2m ?? 72;

  // Compute Scientific Decision Support for Each Sector
  const computeDecision = () => {
    switch (selectedMode) {
      case 'farm': {
        // Spraying constraints: Rain < 30%, Wind < 15km/h, Humidity 40-70%
        const isRainHigh = rainProb >= 40 || rainToday > 2;
        const isWindHigh = windGust >= 20;
        const isHumidityExtreme = humidity > 85;

        if (isRainHigh || isWindHigh) {
          return {
            verdict: 'not_recommended',
            verdictTitle: isTa ? '❌ இப்போது மருந்து தெளிக்க வேண்டாம்' : '❌ SPRAYING NOT RECOMMENDED',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
            reasons: [
              isRainHigh ? (isTa ? `மழை வாய்ப்பு அதிகம் (${rainProb}% / ${rainToday.toFixed(1)} mm)` : `High rain probability (${rainProb}% / ${rainToday.toFixed(1)} mm)`) : null,
              isWindHigh ? (isTa ? `பலத்த காற்று வீசுகிறது (${windGust.toFixed(0)} km/h)` : `High wind gusts (${windGust.toFixed(0)} km/h)`) : null,
              isHumidityExtreme ? (isTa ? `அதிக ஈரப்பதம் (${humidity}%)` : `High relative humidity (${humidity}%)`) : null,
            ].filter(Boolean),
            impacts: [
              isTa ? 'கரைசல் காற்றில் அடித்துச் செல்லப்பட்டு வீணாகும் (Spray Drift Risk: HIGH)' : 'High spray drift risk to adjacent fields & non-target crops',
              isTa ? 'மழையினால் மருந்து அடித்துச் செல்லப்படும் (Wash-Off Risk: CRITICAL)' : 'Chemical active ingredients wash-off risk: CRITICAL'
            ],
            recommendedWindow: isTa ? 'நாளை காலை 7:00 AM – 10:30 AM (காற்று < 12 km/h இருக்கும்போது)' : 'Tomorrow 7:00 AM – 10:30 AM (Wind < 12 km/h)',
            riskChain: {
              weather: `${rainProb}% Rain Prob • ${windGust.toFixed(0)} km/h Gust`,
              hazard: 'Spray Inversion & Chemical Drift',
              impact: 'Zero absorption & environmental runoff',
              action: isTa ? 'தெளிப்பை ஒத்திவைக்கவும்; வடிகால்களை தயார் செய்யவும்' : 'Postpone spraying; inspect drainage channels'
            }
          };
        }
        return {
          verdict: 'recommended',
          verdictTitle: isTa ? '✅ மருந்து தெளிக்க உகந்த நேரம்' : '✅ OPTIMAL SPRAY WINDOW ACTIVE',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          reasons: [
            isTa ? `மிதமான காற்று (${windSpeed.toFixed(0)} km/h)` : `Calm wind speed (${windSpeed.toFixed(0)} km/h)`,
            isTa ? `மழை வாய்ப்பு குறைவு (${rainProb}%)` : `Low precipitation probability (${rainProb}%)`,
            isTa ? `சீரான ஈரப்பதம் (${humidity}%)` : `Favorable humidity (${humidity}%)`
          ],
          impacts: [
            isTa ? 'மருந்து இலைகளில் சீராக தங்கி 100% பலன் தரும்' : 'Optimal droplet deposition and leaf absorption'
          ],
          recommendedWindow: isTa ? 'இன்று மாலை 5:30 PM வரை தொடரலாம்' : 'Favorable window open until 5:30 PM today',
          riskChain: {
            weather: 'Wind < 15 km/h • Rain Prob < 25%',
            hazard: 'Atmosphere Stable (Low Drift)',
            impact: 'Maximized crop protection efficiency',
            action: isTa ? 'பரிந்துரைக்கப்பட்ட அளவுகளில் தெளிக்கவும்' : 'Proceed with calibrated sprayer nozzles'
          }
        };
      }

      case 'commute': {
        const isSevereRain = rainToday >= 30 || rainCurrent >= 5;
        const isModerateRain = rainToday >= 10 || rainProb >= 60;
        if (isSevereRain) {
          return {
            verdict: 'not_recommended',
            verdictTitle: isTa ? '⚠️ அவசியமற்ற பயணங்களைத் தவிர்க்கவும்' : '⚠️ HIGH TRANSIT DELAY RISK',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
            reasons: [
              isTa ? `தீவிர கனமழை தாக்கம் (${rainToday.toFixed(0)} mm)` : `Heavy rain accumulation (> ${rainToday.toFixed(0)} mm)`,
              isTa ? 'சுரங்கப்பாதைகளில் நீர் தேங்கும் வாய்ப்பு' : 'Low-lying road & underpass inundation vulnerability'
            ],
            impacts: [
              isTa ? 'GST ரோடு, வியாசர்பாடி சுரங்கப்பாதைகளில் போக்குவரத்து நெரிசல்' : 'Arterial underpass waterlogging and vehicle stalling risk',
              isTa ? 'வாகன நிறுத்த தூரம் அதிகரிக்கும் (Braking Distance +40%)' : 'Wet asphalt skid hazard (Braking distance increases +40%)'
            ],
            recommendedWindow: isTa ? 'மழை தணிந்த பிறகு (2 மணி நேரம் கழித்து) பயணிக்கவும்' : 'Prefer travel after storm cell passes (Approx +2 hours)',
            riskChain: {
              weather: `> ${rainToday.toFixed(0)} mm Torrential Rain`,
              hazard: 'Surface Runoff Exceeding Gutter Capacity',
              impact: 'Slow traffic & low-lying gridlocks',
              action: isTa ? 'மேம்பால வழிகளைத் தேர்ந்தெடுக்கவும்' : 'Use flyover bypass routes; avoid underpasses'
            }
          };
        }
        return {
          verdict: 'recommended',
          verdictTitle: isTa ? '✅ சீரான போக்குவரத்து நிலை' : '✅ SAFE TRAVEL CONDITIONS',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          reasons: [
            isTa ? 'தெளிவான பார்வைத்திறன் (> 8 km)' : 'Clear atmospheric visibility (> 8 km)',
            isTa ? 'சாலைகளில் நீர் தேக்கம் இல்லை' : 'Dry pavement with nominal traction'
          ],
          impacts: [
            isTa ? 'வழக்கமான பயண நேரங்களில் சென்றடையலாம்' : 'Normal highway & arterial travel times expected'
          ],
          recommendedWindow: isTa ? 'அனைத்து நேரங்களிலும் பயணிக்கலாம்' : 'Safe for all-day commutes',
          riskChain: {
            weather: 'Clear Visibility • Normal Pavement',
            hazard: 'None (Stable Transit)',
            impact: 'Zero traffic delays',
            action: isTa ? 'வழக்கமான வேகத்தில் பாதுகாப்பாக இயக்கவும்' : 'Maintain standard speed limits'
          }
        };
      }

      case 'marine': {
        const isMarineStorm = windGust >= 45 || rainToday >= 35;
        if (isMarineStorm) {
          return {
            verdict: 'not_recommended',
            verdictTitle: isTa ? '❌ ஆழ்கடலுக்குச் செல்ல வேண்டாம்' : '❌ MARINE VENTURING NOT ADVISED',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
            reasons: [
              isTa ? `பலத்த சூறைக்காற்று (${windGust.toFixed(0)} km/h gusts)` : `Squally winds reaching ${windGust.toFixed(0)} km/h`,
              isTa ? 'அலைகளின் உயரம் 2.5 - 3.5 மீட்டர் வரை உயரும் வாய்ப்பு' : 'Wave heights elevated up to 2.5 - 3.5 meters (INCOIS alert)'
            ],
            impacts: [
              isTa ? 'நாட்டுப்படகுகள் கவிழும் அபாயம் (Small Craft Capsize Risk)' : 'High capsize risk for artisanal & mechanized fishing boats',
              isTa ? 'கரையில் கடல் அரிப்பு மற்றும் சீற்றம்' : 'Rough to very rough sea state along the coast'
            ],
            recommendedWindow: isTa ? 'காற்றின் வேகம் குறைந்த பிறகு (அடுத்த புல்லட்டின் வரை)' : 'Await official INCOIS / IMD marine clearance',
            riskChain: {
              weather: `${windGust.toFixed(0)} km/h Squall • High Swell`,
              hazard: 'Steep Wave Breaking in Coastal Inlets',
              impact: 'Severe vessel instability & engine drift',
              action: isTa ? 'படகுகளை பாதுகாப்பாகக் கட்டி வைக்கவும்' : 'Anchor all vessels securely at harbor berths'
            }
          };
        }
        return {
          verdict: 'recommended',
          verdictTitle: isTa ? '✅ கடல் தொழில் செய்ய உகந்தது' : '✅ SAFE MARINE NAVIGATION',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          reasons: [
            isTa ? `சீரான காற்று (${windSpeed.toFixed(0)} km/h)` : `Gentle coastal breeze (${windSpeed.toFixed(0)} km/h)`,
            isTa ? 'அலை உயரம் < 1.2 மீட்டர் (அமைதியான கடல்)' : 'Nominal swell height < 1.2 meters'
          ],
          impacts: [
            isTa ? 'மீன்பிடி மற்றும் படகு இயக்கத்திற்கு பாதுகாப்பானது' : 'Safe for coastal & deep-sea fishing trawlers'
          ],
          recommendedWindow: isTa ? 'அடுத்த 24 மணி நேரத்திற்கு உகந்தது' : 'Favorable 24-hour marine window',
          riskChain: {
            weather: 'Wind < 20 km/h • Sea State Smooth',
            hazard: 'None (Nominal Swell)',
            impact: 'Stable boat operations',
            action: isTa ? 'வழக்கமான பாதுகாப்பு கருவிகளுடன் செல்லவும்' : 'Carry standard VHF marine transponders'
          }
        };
      }

      case 'flood': {
        const isFloodVulnerable = rainToday >= 40 || rainCurrent >= 8;
        if (isFloodVulnerable) {
          return {
            verdict: 'not_recommended',
            verdictTitle: isTa ? '🚨 தாழ்வான பகுதிகளில் வெள்ள அபாயம்' : '🚨 LOW-LYING WATERLOGGING RISK',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
            reasons: [
              isTa ? `கனமழை பொழிவு (${rainToday.toFixed(0)} mm) வடிகால் கொள்ளளவை விட அதிகம்` : `Rain accumulation (${rainToday.toFixed(0)} mm) exceeds micro-drainage threshold`,
              isTa ? 'மண் ஈரப்பதம் 90% அடைந்து நீர் உறிஞ்சும் திறன் குறைந்துள்ளது' : 'Soil saturation index high; surface runoff rate: 85%'
            ],
            impacts: [
              isTa ? 'வேளச்சேரி, பெருங்குடி, தாம்பரம் தாழ்வான பகுதிகளில் நீர் தேங்கலாம்' : 'Vulnerable zones: Low-lying sub-basins & culvert junctions',
              isTa ? 'தரைத்தள வீடுகள் மற்றும் வாகனங்கள் பாதிக்கப்படலாம்' : 'Basement / ground-floor ingress risk in flood-prone wards'
            ],
            recommendedWindow: isTa ? 'அவசர உதவிகளுக்கு 1077 / 112 எண்களைத் தொடர்பு கொள்ளவும்' : 'Keep emergency contacts (1077 / 112) ready',
            riskChain: {
              weather: `> ${rainToday.toFixed(0)} mm Rainfall Intensity`,
              hazard: 'Exceeding Local Urban Drainage Capacity',
              impact: 'Waterlogging at underpasses & ground floors',
              action: isTa ? 'பொருட்களை முதல் தளத்திற்கு மாற்றவும்' : 'Move valuables to higher elevations; avoid basements'
            }
          };
        }
        return {
          verdict: 'recommended',
          verdictTitle: isTa ? '🟢 வெள்ள அபாயம் இல்லை' : '🟢 DRAINAGE SYSTEM NOMINAL',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          reasons: [
            isTa ? 'நீர்வரத்து வடிகால் கொள்ளளவுக்குள் உள்ளது' : 'Precipitation within municipality stormwater capacity',
            isTa ? 'நீர் தேங்கும் அபாயம் இல்லை' : 'Zero localized stagnation detected'
          ],
          impacts: [
            isTa ? 'அனைத்து குடியிருப்பு மற்றும் வணிகப் பகுதிகள் சீராக உள்ளன' : 'No urban waterlogging threat in this sector'
          ],
          recommendedWindow: isTa ? 'இயல்பு நிலை தொடர்கிறது' : 'Stormwater channels flowing normally',
          riskChain: {
            weather: 'Rain < Drainage Threshold',
            hazard: 'None (Nominal Absorption)',
            impact: 'Zero flooding',
            action: isTa ? 'வழக்கமான பணிகளைத் தொடரவும்' : 'Normal routine operations'
          }
        };
      }

      case 'event': {
        const isEventDisrupted = rainProb >= 50 || rainToday >= 5 || temp >= 38 || windGust >= 35;
        if (isEventDisrupted) {
          return {
            verdict: 'not_recommended',
            verdictTitle: isTa ? '⚠️ வெளிப்புற நிகழ்வுகளுக்கு மாற்று ஏற்பாடு தேவை' : '⚠️ OUTDOOR EVENT CAUTION',
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
            reasons: [
              rainProb >= 50 ? (isTa ? `மழை வாய்ப்பு ${rainProb}%` : `Rain probability ${rainProb}%`) : null,
              temp >= 38 ? (isTa ? `அதிக வெப்பம் ${temp.toFixed(1)}°C` : `High ambient heat ${temp.toFixed(1)}°C`) : null,
              windGust >= 35 ? (isTa ? `காற்று வேகம் ${windGust.toFixed(0)} km/h` : `Wind gusts ${windGust.toFixed(0)} km/h`) : null,
            ].filter(Boolean),
            impacts: [
              isTa ? 'பந்தல், தற்காலிக கூடாரங்கள் சேதமடையலாம்' : 'Waterproof canopies and tent anchors required',
              isTa ? 'வருகையாளர்களுக்கு அசௌகரியம் ஏற்படலாம்' : 'Guest thermal / rain discomfort index elevated'
            ],
            recommendedWindow: isTa ? 'மழை இல்லாத நேரத்தை உறுதி செய்யவும்' : 'Opt for air-conditioned indoor banquet or covered arena',
            riskChain: {
              weather: `${rainProb}% Rain Prob • ${temp.toFixed(0)}°C Temp`,
              hazard: 'Atmospheric Instability for Open Gatherings',
              impact: 'Guest discomfort & tent instability',
              action: isTa ? 'கூடுதல் மழைக்கால பந்தல் அமைக்கவும்' : 'Deploy waterproof side-tarps and industrial coolers'
            }
          };
        }
        return {
          verdict: 'recommended',
          verdictTitle: isTa ? '✅ வெளிப்புற நிகழ்வுகளுக்கு உகந்த சூழல்' : '✅ EXCELLENT OUTDOOR EVENT WEATHER',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          reasons: [
            isTa ? 'சீரான வெப்பநிலை & மிதமான தென்றல்' : 'Pleasant ambient temperatures and mild breeze',
            isTa ? 'மழை பொழிவு வாய்ப்பு மிகக் குறைவு' : 'Negligible rain risk (< 15%)'
          ],
          impacts: [
            isTa ? 'திருமணம், விளையாட்டு, பொதுக் கூட்டங்களுக்கு ஏற்றது' : 'Ideal for weddings, sports, and open-air ceremonies'
          ],
          recommendedWindow: isTa ? 'முழு நாளும் உகந்தது' : 'Optimal all-day event window',
          riskChain: {
            weather: 'Clear Skies • Comfortable Humidity',
            hazard: 'None (Stable)',
            impact: '100% Guest Comfort',
            action: isTa ? 'திட்டமிட்டபடி நிகழ்வை நடத்தலாம்' : 'Proceed with outdoor schedule'
          }
        };
      }

      default:
        return null;
    }
  };

  const decision = computeDecision();

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-sky-100 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* 1. Header: "What do you want to decide?" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sky-50">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-2xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              {isTa ? '🎯 நீங்கள் என்ன முடிவெடுக்க விரும்புகிறீர்கள்?' : '🎯 What do you want to decide?'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {isTa ? 'வானிலை தரவு ➔ நேரடி செயல் திட்டம் (Decision Support Engine)' : 'Weather Data ➔ Actionable Decision Support'}
            </p>
          </div>
        </div>

        {/* Quick Simulator & Explainability Triggers */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          {onOpenSimulator && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
              title="Test What-If Weather Scenarios"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              <span>{isTa ? 'வாட்-இஃப் சிமுலேட்டர்' : 'What-If Simulator'}</span>
            </button>
          )}

          {onOpenExplainability && (
            <button
              type="button"
              onClick={onOpenExplainability}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
              title="Inspect Why AI is Making This Recommendation"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isTa ? 'AI ஏன் கூறுகிறது?' : 'Why?'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 5-Button Decision Selector */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {DECISION_MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm scale-102'
                  : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-300' : 'text-slate-500'}`} />
              <span>{isTa ? mode.labelTa : mode.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Decision Verdict Card */}
      {decision && (
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-sky-50/50 p-4 space-y-3.5">
          {/* Verdict Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60">
            <div className="flex items-center space-x-2.5">
              {decision.verdict === 'recommended' ? (
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : decision.verdict === 'not_recommended' ? (
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <XCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900">{decision.verdictTitle}</h4>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {currentLocation?.name || 'Your Location'} • {isTa ? 'வானிலை மாதிரி ஆய்வு' : 'NWP Model Forecast Constraints'}
                </p>
              </div>
            </div>

            {decision.recommendedWindow && (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-100/80 border border-sky-300/60 text-sky-900 text-xs font-bold self-start sm:self-auto shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-sky-700 flex-shrink-0" />
                <span className="truncate max-w-[280px]">{decision.recommendedWindow}</span>
              </div>
            )}
          </div>

          {/* Reasons & Sector Impacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5 bg-white/80 p-3 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {isTa ? 'வானிலை காரணிகள் (Forecast Reasons)' : 'Forecast Conditions'}
              </span>
              <ul className="space-y-1 text-slate-700 font-medium">
                {decision.reasons.map((r, i) => (
                  <li key={i} className="flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 flex-shrink-0"></span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5 bg-white/80 p-3 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {isTa ? 'எதிர்பார்க்கப்படும் தாக்கம் (Expected Impact)' : 'Field / Transit Impact'}
              </span>
              <ul className="space-y-1 text-slate-700 font-medium">
                {decision.impacts.map((imp, i) => (
                  <li key={i} className="flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0"></span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4. THE 4-STEP RISK CHAIN (Weather -> Hazard -> Impact -> Action) */}
          <div className="pt-2 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isTa ? 'இடர் சங்கிலி (Weather ➔ Hazard ➔ Impact ➔ Action)' : '4-Step Risk Chain (Decision Flow)'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Judge Defensible Model</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {/* Step 1: Weather */}
              <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200/70 space-y-0.5">
                <span className="text-[9px] font-black uppercase text-sky-700 block">1. Weather</span>
                <p className="text-[11px] font-bold text-slate-800 line-clamp-2">{decision.riskChain.weather}</p>
              </div>

              {/* Step 2: Hazard */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 space-y-0.5">
                <span className="text-[9px] font-black uppercase text-amber-700 block">2. Hazard</span>
                <p className="text-[11px] font-bold text-slate-800 line-clamp-2">{decision.riskChain.hazard}</p>
              </div>

              {/* Step 3: Impact */}
              <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/70 space-y-0.5">
                <span className="text-[9px] font-black uppercase text-rose-700 block">3. Impact</span>
                <p className="text-[11px] font-bold text-slate-800 line-clamp-2">{decision.riskChain.impact}</p>
              </div>

              {/* Step 4: Action */}
              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 space-y-0.5">
                <span className="text-[9px] font-black uppercase text-emerald-700 block">4. Action</span>
                <p className="text-[11px] font-bold text-slate-800 line-clamp-2">{decision.riskChain.action}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
