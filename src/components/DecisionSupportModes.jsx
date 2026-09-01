import React, { useState, useEffect } from 'react';
import {
  Wheat,
  Plane,
  Anchor,
  Building2,
  TrendingUp,
  Droplets,
  Wind,
  Sun,
  ShieldCheck,
  AlertOctagon,
  Gauge,
  Activity,
  CheckCircle,
  FileText,
  ThermometerSnowflake,
  Flame,
  Waves
} from 'lucide-react';
import { generateAgriAdvisory, generateAviationBriefing, generateMarineBriefing } from '../services/weatherService';
import { TRANSLATIONS } from '../services/languages';

export default function DecisionSupportModes({
  activeLanguage = 'en',
  currentLocation,
  weatherData,
  aqiData,
  activeSector = 'agriculture',
  onSelectSector,
  onPromptChat
}) {
  const [activeTab, setActiveTab] = useState(activeSector || 'agriculture');

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const d = t.decision || TRANSLATIONS.en.decision;

  useEffect(() => {
    if (activeSector) {
      setActiveTab(activeSector);
    }
  }, [activeSector]);

  const locName = currentLocation?.name || 'Current Location';
  const current = weatherData?.current || {};
  const daily = weatherData?.daily || {};
  const hourly = weatherData?.hourly || {};

  const agriAdvisory = generateAgriAdvisory(weatherData, activeLanguage);
  const aviationBriefing = generateAviationBriefing(locName, weatherData, activeLanguage);
  const marineBriefing = generateMarineBriefing(weatherData, activeLanguage);

  const aqi = aqiData?.current?.us_aqi || 55;
  const pm25 = aqiData?.current?.pm2_5 || 15.4;
  const pm10 = aqiData?.current?.pm10 || 32.8;
  const no2 = aqiData?.current?.nitrogen_dioxide || 18.2;
  const o3 = aqiData?.current?.ozone || 45.0;

  const rainSum48h = ((daily.precipitation_sum?.[0] || 0) + (daily.precipitation_sum?.[1] || 0));

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
      {/* Sector Selection Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'agriculture', label: d.tabs?.agriculture || '🌾 Agriculture & Farmers', icon: Wheat },
          { id: 'aviation', label: d.tabs?.aviation || '✈️ Aviation METAR / TAF', icon: Plane },
          { id: 'marine', label: d.tabs?.marine || '🌊 Marine & Fishermen', icon: Anchor },
          { id: 'smartCity', label: d.tabs?.smartCity || '🏙️ Smart City & Disaster', icon: Building2 },
          { id: 'climate', label: d.tabs?.climate || '📊 Climate Trend Analytics', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (onSelectSector) onSelectSector(tab.id);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Agriculture / Farmer Decision Support Suite */}
      {activeTab === 'agriculture' && agriAdvisory && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>{d.agri?.title || 'Agro-Meteorological Advisory for'} {locName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                  {d.agri?.badge || 'Precision Farming'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {d.agri?.desc || 'Crop microclimate, root-zone soil telemetry, spray window, and pest risk mitigation.'}
              </p>
            </div>
            <button
              onClick={() => onPromptChat && onPromptChat(`Provide detailed crop advisory and irrigation plan for ${locName}`)}
              className="text-xs px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-medium transition-all"
            >
              {d.agri?.askBtn || 'Ask Farm Advisory →'}
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.agri?.soilMoisture || 'Root Soil Moisture'}</div>
              <div className="text-xl font-bold text-sky-600 mt-1">
                {agriAdvisory.soilMoisturePercent}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{d.agri?.soilMoistureDepth || 'Depth: 0-7 cm profile'}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.agri?.topsoilTemp || 'Topsoil Temperature'}</div>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {agriAdvisory.soilTemperature}°C
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{d.agri?.topsoilOptimal || 'Optimal for germination'}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.agri?.sprayWindow || 'Foliar Spray Window'}</div>
              <div className={`text-sm font-bold mt-1.5 ${agriAdvisory.sprayCondition === 'Favorable' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {agriAdvisory.sprayCondition === 'Favorable' ? (d.agri?.sprayOptimal || '✅ Optimal') : (d.agri?.sprayHold || '⚠️ Hold Spray')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{d.agri?.sprayConditionDesc || 'Wind & rain evaluated'}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.agri?.rain48h || '48h Rain Inflow'}</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {rainSum48h.toFixed(1)} mm
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{d.agri?.nwpSum || 'NWP Ensemble Sum'}</div>
            </div>
          </div>

          {/* Directives & Advisories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-sky-700 flex items-center space-x-1.5">
                <Droplets className="w-4 h-4" />
                <span>{d.agri?.irrigationDirective || 'Irrigation & Soil Moisture Directive'}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {agriAdvisory.irrigationAdvice}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-amber-700 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>{d.agri?.spraySuitabilityDirective || 'Agrochemical & Pesticide Rationale'}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {agriAdvisory.sprayAdvice}
              </p>
            </div>
          </div>

          {/* Crop Suitability Matrix Table */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {d.agri?.cropPhenologyDirective || 'Major Regional Crop Phenological Status'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">{d.agri?.crop || 'Crop'}</th>
                    <th className="pb-2">{d.agri?.suitability || 'Advisory Status'}</th>
                    <th className="pb-2">{d.agri?.riskLevel || 'Pest / Disease Vulnerability'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="text-slate-700">
                    <td className="py-2.5 font-bold text-slate-900">{d.agri?.paddy || 'Paddy / Rice'}</td>
                    <td className="py-2.5">{rainSum48h > 15 ? (d.agri?.paddyAdviceRain || 'Excellent for transplanting') : (d.agri?.paddyAdviceDry || 'Normal vegetative care')}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {d.agri?.lowRisk || 'Low'}
                      </span>
                    </td>
                  </tr>
                  <tr className="text-slate-700">
                    <td className="py-2.5 font-bold text-slate-900">{d.agri?.cotton || 'Cotton / Groundnut'}</td>
                    <td className="py-2.5">{agriAdvisory.sprayCondition === 'Favorable' ? (d.agri?.cottonAdviceFavorable || 'Optimal for nutrient spray') : (d.agri?.cottonAdviceHold || 'Hold spray applications')}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        current.relative_humidity_2m > 80 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {current.relative_humidity_2m > 80 ? (d.agri?.fungalRisk || 'Fungal Risk') : (d.agri?.lowRisk || 'Low')}
                      </span>
                    </td>
                  </tr>
                  <tr className="text-slate-700">
                    <td className="py-2.5 font-bold text-slate-900">{d.agri?.vegetables || 'Vegetables & Pulses'}</td>
                    <td className="py-2.5">{d.agri?.vegAdviceDrainage || 'Ensure proper drainage in beds'}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        rainSum48h > 30 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {rainSum48h > 30 ? (d.agri?.rootRotRisk || 'Root rot alert') : (d.agri?.lowRisk || 'Low')}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Aviation Weather Briefing (METAR/TAF) */}
      {activeTab === 'aviation' && aviationBriefing && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>{d.aviation?.title || 'Aviation Meteorological Dispatch (ICAO Briefing)'} {locName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 border border-slate-200 ${aviationBriefing.categoryColor}`}>
                  {aviationBriefing.flightCategory}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {d.aviation?.desc || 'Standardized METAR generator, crosswind computation, and flight ceiling analytics.'}
              </p>
            </div>
            <button
              onClick={() => onPromptChat && onPromptChat(`Provide complete METAR and aviation weather briefing for ${locName}`)}
              className="text-xs px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-medium transition-all"
            >
              {d.aviation?.terminalBriefing ? `${d.aviation.terminalBriefing} →` : 'Ask Aviation Dispatch →'}
            </button>
          </div>

          {/* Raw METAR Code Block */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 font-mono text-emerald-400 text-xs sm:text-sm overflow-x-auto shadow-inner">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-sans mb-1 font-bold">
              {d.aviation?.metarHeader || 'Raw Automated METAR Telemetry:'}
            </div>
            <code>{aviationBriefing.metar}</code>
          </div>

          {/* Aviation Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.aviation?.visibility || 'Surface Visibility'}</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {aviationBriefing.visibilityKm} km
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unrestricted Runway Visual</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.aviation?.ceilingHeight || 'Lowest Cloud Ceiling'}</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {aviationBriefing.ceilingFeet} ft
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Above Ground Level (AGL)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.aviation?.crosswind || 'Surface Winds'}</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {aviationBriefing.windKnots} KT
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Dir: {aviationBriefing.windDirection}° | Gusts: {aviationBriefing.gustKnots} KT
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">Altimeter (QNH)</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {aviationBriefing.altimeterHpa} hPa
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Standard Datum: 1013.25</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
            <Plane className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">{d.aviation?.turbRisk || 'Low-Level Turbulence & Shear Assessment'}</div>
              <div className="text-xs text-slate-700 mt-1">{aviationBriefing.turbulenceRisk}</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Marine & Fishermen Safety Suite */}
      {activeTab === 'marine' && marineBriefing && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>{d.marine?.title || 'Marine & Coastal Oceanographic Dispatch'} ({locName})</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 border border-slate-200 ${marineBriefing.seaColor}`}>
                  {marineBriefing.seaState}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {d.marine?.desc || 'Significant wave height, swell period, gale warnings, and astronomical tide forecast.'}
              </p>
            </div>
            <button
              onClick={() => onPromptChat && onPromptChat(`Marine safety advisory, wave height and fishing zone safety for ${locName}`)}
              className="text-xs px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-medium transition-all"
            >
              {t.chat?.marineAdvisory ? `${t.chat.marineAdvisory} →` : 'Ask Marine Advisory →'}
            </button>
          </div>

          {/* Fishermen Warning Banner */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
            marineBriefing.waveHeightM > 2.5
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <Waves className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-slate-900">{d.marine?.fishermanAdvisory || 'Fishermen & Vessel Advisory:'}</div>
              <div className="text-xs mt-1 leading-relaxed">{marineBriefing.fishermanAdvisory}</div>
            </div>
          </div>

          {/* Marine Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.marine?.waveHeight || 'Wave Height'}</div>
              <div className="text-xl font-bold text-sky-600 mt-1">
                {marineBriefing.waveHeightM} m
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Significant Wave Amplitude</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.marine?.swellPeriod || 'Swell Period'}</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {marineBriefing.swellPeriodSec} s
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Wave Cycle Interval</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{d.marine?.seaTemp || 'Sea Surface Temp'}</div>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {marineBriefing.seaSurfaceTemp}°C
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pelagic Fish Habitat Index</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">{t.sidebar?.windSpeed || 'Wind Gusts'}</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {current.wind_gusts_10m || current.wind_speed_10m || 15} km/h
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Coastal Boundary Layer</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">{d.marine?.tideInfo || 'Astronomical Tide Tables'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm">
                🌊 <span className="font-semibold text-sky-700">{d.marine?.highTide || 'High Tide'}:</span> {marineBriefing.tideInfo.nextHighTide}
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm">
                🏖️ <span className="font-semibold text-sky-700">{d.marine?.lowTide || 'Low Tide'}:</span> {marineBriefing.tideInfo.nextLowTide}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Smart City & Disaster Management Suite */}
      {activeTab === 'smartCity' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>{d.smartCity?.title || 'Smart City Urban Resilience & Disaster Monitoring'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-semibold">
                  {d.smartCity?.badge || 'Municipal Early Warning'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {d.smartCity?.desc || 'Waterlogging susceptibility, Urban Heat Island, Air Quality Telemetry, and emergency helpline routing.'}
              </p>
            </div>
            <button
              onClick={() => onPromptChat && onPromptChat(`Smart city disaster management and flood waterlogging alert for ${locName}`)}
              className="text-xs px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-medium transition-all"
            >
              Ask City Response →
            </button>
          </div>

          {/* Air Quality Pollutant Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {d.smartCity?.aqi || 'Source 2: Air Quality Index & Telemetry'} (US AQI: {aqi})
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                aqi <= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : aqi <= 100 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <div className="text-slate-500">{d.smartCity?.pm25 || 'PM2.5 Particulate'}</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{pm25} µg/m³</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <div className="text-slate-500">PM10 Coarse Dust</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{pm10} µg/m³</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <div className="text-slate-500">Nitrogen Dioxide (NO₂)</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{no2} µg/m³</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                <div className="text-slate-500">Ozone (O₃)</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{o3} µg/m³</div>
              </div>
            </div>
          </div>

          {/* Waterlogging & Urban Heat Island Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-sky-700 flex items-center space-x-1.5">
                <Building2 className="w-4 h-4" />
                <span>{d.smartCity?.floodDirective || 'Urban Drainage & Waterlogging Risk Index'}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {(daily.precipitation_sum?.[0] || 0) > 30
                  ? (activeLanguage === 'ta' ? 'பிரதான சாலைகளில் வெள்ளப்பெருக்கு மற்றும் சுரங்கப்பாதைகளில் நீர் தேங்கும் அதிக அபாயம். நகராட்சி மோட்டார்கள் தயார் நிலையில் உள்ளன.' : 'High risk of arterial road waterlogging and subway underpass inundation. Municipal storm-pumps on standby.')
                  : (activeLanguage === 'ta' ? 'வெள்ள அபாயம் குறைவு. மழைநீர் வடிகால்கள் சீராக இயங்குகின்றன.' : 'Low waterlogging risk. Stormwater drainage operating well within design retention capacity.')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-amber-700 flex items-center space-x-1.5">
                <Flame className="w-4 h-4" />
                <span>{d.smartCity?.heatDirective || 'Urban Heat Island (UHI) Thermal Load'}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {(current.temperature_2m || 25) > 38
                  ? (activeLanguage === 'ta' ? 'கான்கிரீட் கட்டடங்களால் தீவிர வெப்ப ஈர்ப்பு. கிராமப்புறங்களை விட இரவு நேர வெப்பம் 3.2°C அதிகமாக இருக்கும்.' : 'Severe concrete thermal retention. Nighttime cooling rate attenuated by 3.2°C compared to rural periphery.')
                  : (activeLanguage === 'ta' ? 'மிதமான காற்றோட்டத்துடன் இயல்பான வெப்ப சூழல் நிலவுகிறது.' : 'Normal thermal comfort index with moderate urban ventilation.')}
              </p>
            </div>
          </div>

          {/* Emergency Support Directory */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {d.smartCity?.healthDirective || 'Emergency Response Dissemination Contacts'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                <span className="text-slate-500 block text-[10px]">
                  {activeLanguage === 'ta' ? 'தேசிய பேரிடர் மீட்புப் படை (NDRF)' : 'National Disaster (NDRF)'}
                </span>
                <span className="font-bold text-sky-700">1078 / 011-24363260</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                <span className="text-slate-500 block text-[10px]">
                  {activeLanguage === 'ta' ? 'மாநில பேரிடர் ஆணையம் (SDMA)' : 'State Disaster Control (SDMA)'}
                </span>
                <span className="font-bold text-sky-700">1070</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                <span className="text-slate-500 block text-[10px]">
                  {activeLanguage === 'ta' ? 'தீயணைப்பு & மீட்புப்பணி' : 'Fire & Flood Rescue'}
                </span>
                <span className="font-bold text-sky-700">101</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                <span className="text-slate-500 block text-[10px]">
                  {activeLanguage === 'ta' ? 'ஆம்புலன்ஸ் & அவசர உதவி' : 'Ambulance & Emergency'}
                </span>
                <span className="font-bold text-sky-700">108</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Climate Analytics & NWP Models Suite */}
      {activeTab === 'climate' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>{t.climate?.title || 'Numerical Weather Prediction (NWP) & Climate Intelligence'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-semibold">
                  {activeLanguage === 'ta' ? '10 ஆண்டு அறிவியல்' : 'Decadal Science'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {t.climate?.decadalText || 'Model ensemble comparisons (NOAA GFS vs ECMWF IFS vs DWD ICON) and decadal baseline anomalies.'}
              </p>
            </div>
            <button
              onClick={() => onPromptChat && onPromptChat(`Analyze decadal climate trends and NWP model variance for ${locName}`)}
              className="text-xs px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-medium transition-all"
            >
              {activeLanguage === 'ta' ? 'காலநிலை ஆய்வு கேள் →' : 'Ask Climate Analysis →'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-sm">
              <div className="text-xs font-bold text-sky-700">NOAA GFS (0.25° Global)</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeLanguage === 'ta' ? 'அமெரிக்க உலகளாவிய உயர் துல்லிய மாதிரி. புயல் பாதையைக் கணிப்பதில் சிறந்தது.' : 'Global high-resolution spectral model. Excels in synoptic-scale cyclone trajectory forecasting.'}
              </p>
              <div className="text-[10px] text-slate-400">
                {activeLanguage === 'ta' ? 'புதுப்பிப்பு: தினசரி 4 முறை' : 'Update cycle: 4x daily (00, 06, 12, 18 UTC)'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-sm">
              <div className="text-xs font-bold text-blue-700">ECMWF IFS (9 km Integrated)</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeLanguage === 'ta' ? 'ஐரோப்பிய வளிமண்டல மாதிரி. மழை மற்றும் பருவமழை கணிப்பில் மிகத் துல்லியமானது.' : 'Gold-standard medium-range atmospheric physics engine. High precision for convective precipitation.'}
              </p>
              <div className="text-[10px] text-slate-400">
                {activeLanguage === 'ta' ? 'புதுப்பிப்பு: தினசரி 2 முறை' : 'Update cycle: 2x daily (00, 12 UTC)'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-sm">
              <div className="text-xs font-bold text-purple-700">DWD ICON (13 km Global)</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeLanguage === 'ta' ? 'ஜெர்மன் வானிலை மாதிரி. தரைமட்ட ஈரப்பதம் மற்றும் காற்று சுழற்சியை துல்லியமாகக் கணிக்கும்.' : 'Non-hydrostatic icosahedral grid. Superb boundary layer moisture and localized wind dynamics.'}
              </p>
              <div className="text-[10px] text-slate-400">
                {activeLanguage === 'ta' ? 'புதுப்பிப்பு: தினசரி 4 முறை' : 'Update cycle: 4x daily'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t.climate?.decadalTitle || 'Decadal Climate Anomaly Insights'}</div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {t.climate?.decadalText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
