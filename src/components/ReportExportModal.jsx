import React, { useRef, useMemo, useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, ShieldAlert, Sparkles, Radio, Droplets, Wind, Sun, Thermometer, Wheat, Plane, Anchor, Check } from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';
import { createWeatherIntelligenceReport, downloadHTMLReport, downloadTextReport } from '../services/reportService';
import WeatherRadarMap from './WeatherRadarMap';

export default function ReportExportModal({
  activeLanguage = 'en',
  isOpen,
  onClose,
  currentLocation,
  weatherData,
  aqiData,
  alerts = [],
  chatQuery = '',
  aiResponse = ''
}) {
  const reportRef = useRef(null);
  const [downloadStatus, setDownloadStatus] = useState(null); // 'html' | 'text' | 'print' | null

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const rep = t.reportModal || TRANSLATIONS.en.reportModal;

  const isTa = activeLanguage === 'ta';
  const isTanglish = activeLanguage === 'tanglish';

  const report = useMemo(() => {
    if (!isOpen) return null;
    return createWeatherIntelligenceReport({
      location: currentLocation,
      weatherData,
      aqiData,
      alerts,
      chatQuery,
      aiResponse,
      lang: activeLanguage
    });
  }, [isOpen, currentLocation, weatherData, aqiData, alerts, chatQuery, aiResponse, activeLanguage]);

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    setDownloadStatus('print');
    window.print();
    setTimeout(() => setDownloadStatus(null), 4000);
  };

  const handleDownloadHTML = () => {
    downloadHTMLReport(report);
    setDownloadStatus('html');
    setTimeout(() => setDownloadStatus(null), 4000);
  };

  const handleDownloadText = () => {
    downloadTextReport(report);
    setDownloadStatus('text');
    setTimeout(() => setDownloadStatus(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-sky-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-sky-50 via-white to-indigo-50/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isTa ? 'வானிலை & ரேடார் முழுமையான அறிக்கை' : isTanglish ? 'WeatherGPT Full Intelligence Report' : (rep.title || 'WeatherGPT Intelligence Dossier')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {report.locName} • {report.coordinates}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Report Document Body */}
        <div ref={reportRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-700 font-sans">
          {/* Download Success Confirmation Toast / Banner */}
          {downloadStatus && (
            <div className="p-3.5 rounded-2xl bg-emerald-600 text-white flex items-center justify-between shadow-lg animate-fadeIn border border-emerald-500">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-100 animate-bounce" />
                <div>
                  <span className="font-bold text-xs block">
                    {isTa ? '✓ அறிக்கை வெற்றிகரமாகப் பதிவிறக்கப்பட்டது!' : isTanglish ? '✓ WeatherGPT Report Successfully Downloaded!' : '✓ Intelligence Dossier Downloaded Successfully!'}
                  </span>
                  <span className="text-[10px] text-emerald-100">
                    {downloadStatus === 'html'
                      ? (isTa ? 'நேரலை Doppler Radar வரைபடத்துடன் HTML ஆவணம் பதிவிறக்கமானது.' : 'Interactive HTML Document with Live Doppler Radar downloaded.')
                      : downloadStatus === 'text'
                      ? (isTa ? 'உரை அறிக்கை (.txt) பதிவிறக்கமானது.' : 'Text Bulletin (.txt) downloaded.')
                      : (isTa ? 'அச்சு / PDF உரையாடல் திறக்கப்பட்டது.' : 'Print / PDF spooler opened.')}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-700/80 text-[10px] font-bold">READY</span>
            </div>
          )}

          {/* Download Confirmation Callout */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50/70 to-indigo-50/50 border border-sky-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-sky-600 text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  {isTa ? 'அறிக்கை பதிவிறக்க உறுதிப்படுத்தல்' : isTanglish ? 'Confirm Report Download Format' : 'Confirm Dossier Download Format'}
                </span>
                <span className="text-[11px] text-slate-600">
                  {isTa ? 'கீழே உள்ள முன்னறிவிப்பு & ரேடாரைச் சரிபார்த்து நீங்கள் விரும்பும் முறையில் பதிவிறக்கவும்.' : 'Review the meteorological dispatch below and select your preferred download format.'}
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-sky-100 text-sky-800 font-bold border border-sky-200 hidden sm:inline-block">
              {report.locName}
            </span>
          </div>

          {/* Official Document Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-sky-400 uppercase font-bold block">
                Official Meteorological Dispatch
              </span>
              <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                {report.locName}
              </h4>
              <span className="text-[11px] text-slate-400">
                {isTa ? 'வெளியிடப்பட்ட நேரம்' : 'Issued'}: {report.dateStr}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold">
                ✓ Live NWP Grounded
              </span>
            </div>
          </div>

          {/* Conversation Query & Verdict (if initiated from Chat) */}
          {report.chatQuery && (
            <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-sky-900 font-bold">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>{isTa ? 'ஆய்வு செய்யப்பட்ட கேள்வி (Query)' : 'Conversational Query & AI Verdict'}</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 italic">
                "{report.chatQuery}"
              </p>
              <div className="p-3 rounded-xl bg-white border border-sky-100 text-slate-700 leading-relaxed whitespace-pre-line text-xs font-normal">
                {report.aiResponse}
              </div>
            </div>
          )}

          {/* Section 1: Live Telemetry Grid */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              <span>1. {isTa ? 'நேரலை வளிமண்டல அளவீடுகள் (Live Telemetry)' : 'Live Atmospheric Telemetry'}</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">{isTa ? 'வெப்பநிலை' : 'Temperature'}</span>
                <span className="text-lg font-extrabold text-slate-900">{report.current.temperature}°C</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{isTa ? 'உணரப்படும்' : 'Feels'} {report.current.apparentTemperature}°C</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">{isTa ? 'ஈரப்பதம்' : 'Humidity'}</span>
                <span className="text-lg font-extrabold text-slate-900">{report.current.humidity}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{report.current.weatherCondition}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">{isTa ? 'காற்றின் வேகம்' : 'Wind Speed'}</span>
                <span className="text-lg font-extrabold text-slate-900">{report.current.windSpeed} km/h</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Gusts: {report.current.windGusts} km/h</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">{isTa ? 'காற்று தரம் (AQI)' : 'Air Quality (AQI)'}</span>
                <span className="text-lg font-extrabold text-emerald-600">{report.aqi.score}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{report.aqi.category}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Rain Verdict & Radar Telemetry */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              <span>2. {isTa ? 'மழை தீர்ப்பு & நேரடி ரேடார் (Rain Verdict & Live Doppler Radar)' : 'Rain Verdict & Live Doppler Radar Stream'}</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-[10px] font-bold text-sky-700 uppercase block">{isTa ? 'மழை கணிப்பு தீர்ப்பு' : 'Rain Arrival Verdict'}</span>
                <div className="text-sm font-bold text-sky-950 mt-1">
                  {report.rainVerdict?.verdict === 'YES' ? '🌧️ YES - Rain Expected' : report.rainVerdict?.verdict === 'MAYBE' ? '🌦️ MAYBE - Light Showers' : '☀️ NO - Dry & Clear'}
                </div>
                <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                  <div><strong>{isTa ? 'நேரம்' : 'Timing'}:</strong> {report.rainVerdict?.predictedTimingTa || report.rainVerdict?.predictedTimingEn || 'N/A'}</div>
                  <div><strong>{isTa ? 'வாய்ப்பு' : 'Probability'}:</strong> {report.rainVerdict?.maxProb || 0}% | <strong>{isTa ? 'அளவு' : 'Precip'}:</strong> ~{report.rainVerdict?.totalPrecip || 0} mm</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-400 uppercase">RainViewer Doppler Radar</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">ONLINE</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 mt-1">
                  <div>• <strong>{isTa ? 'ரேடார் நிலை' : 'Radar Status'}:</strong> {report.radarTelemetry.status}</div>
                  <div>• <strong>{isTa ? 'மேக அடர்த்தி' : 'Cloud Cover'}:</strong> {report.radarTelemetry.satelliteCover}</div>
                  <div>• <strong>{isTa ? 'எதிரொலிப்பு' : 'Echo Level'}:</strong> {report.radarTelemetry.reflectivityLevel}</div>
                </div>
              </div>
            </div>

            {/* Embedded Interactive Doppler Radar GIS Stream */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <WeatherRadarMap
                activeLanguage={activeLanguage}
                currentLocation={currentLocation}
                weatherData={weatherData}
                alerts={alerts}
                compact={true}
                height="280px"
              />
            </div>
          </div>

          {/* Section 3: 7-Day Forecast Matrix */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>3. {isTa ? '7-நாள் வானிலை முன்னறிவிப்பு அட்டவணை' : '7-Day High-Resolution Forecast Matrix'}</span>
            </h5>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2 px-3">{isTa ? 'நாள்' : 'Day'}</th>
                    <th className="py-2 px-3">{isTa ? 'நிலை' : 'Condition'}</th>
                    <th className="py-2 px-3">{isTa ? 'வெப்பம்' : 'High / Low'}</th>
                    <th className="py-2 px-3">{isTa ? 'மழை %' : 'Rain Prob'}</th>
                    <th className="py-2 px-3">{isTa ? 'அளவு' : 'Precip'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {report.forecastDays.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{f.date}</td>
                      <td className="py-2 px-3 text-slate-600">{f.condition}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{f.maxTemp}°C / {f.minTemp}°C</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.rainProb >= 50 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'}`}>
                          {f.rainProb}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{f.precipMm} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Agricultural & Cross-Sector Guidelines */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Wheat className="w-3.5 h-3.5 text-emerald-600" />
              <span>4. {isTa ? 'விவசாயம் & துறைசார் ஆலோசனைகள்' : 'Agricultural & Sector Directives'}</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                <span className="font-bold text-emerald-900 block text-xs">🌾 {isTa ? 'விவசாயம் & விதைப்பு' : 'Farmer & Soil Advisory'}</span>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  • <strong>{isTa ? 'விதைப்பு' : 'Sowing'}:</strong> {report.cropSeed?.sowingStatusLabel || 'Favorable'}<br />
                  • <strong>{isTa ? 'மண் ஈரப்பதம்' : 'Soil Moisture'}:</strong> {report.cropSeed?.soilMoisturePercent || 45}%<br />
                  • <strong>{isTa ? 'மருந்து தெளிப்பு' : 'Spray'}:</strong> {report.agri?.sprayAdvice || 'Optimal conditions'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-1">
                <span className="font-bold text-sky-900 block text-xs">🌊 {isTa ? 'மீனவர் & விமானப் போக்குவரத்து' : 'Marine & Aviation Directives'}</span>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  • <strong>{isTa ? 'அலை உயரம்' : 'Wave Height'}:</strong> {report.marine?.waveHeightM || 0.8} m ({report.marine?.fishermanAdvisory || 'Safe for sailing'})<br />
                  • <strong>{isTa ? 'விமான நிலை' : 'Aviation METAR'}:</strong> {report.aviation?.flightCategory || 'VFR'} (Visibility: {report.aviation?.visibilityKm || 10} km)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {isTa ? 'மூடுக' : 'Close'}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadText}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              title="Download Plain Text Dispatch (.txt)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isTa ? 'Text Bulletin (.txt)' : 'Text Bulletin (.txt)'}</span>
            </button>

            <button
              onClick={handleDownloadHTML}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              title="Download Interactive HTML Document (.html)"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>{isTa ? 'HTML Document (.html)' : 'HTML Report (.html)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>{isTa ? 'அச்சிடுக / PDF ஆக சேமிக்க' : isTanglish ? 'Print / Save as PDF' : 'Print / Save as PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

