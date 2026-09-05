import React from 'react';
import {
  X,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Wind,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';

export default function ImpactRiskEngineModal({
  isOpen,
  onClose,
  activeLanguage = 'en',
  riskData,
  currentLocationName = 'Chennai'
}) {
  if (!isOpen || !riskData) return null;

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const { score, level, badgeText, summary, confidence, factors = [], actions = [], sources = [] } = riskData;

  const getScoreColor = (s) => {
    if (s >= 80) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (s >= 65) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (s >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getStrokeColor = (s) => {
    if (s >= 80) return '#e11d48';
    if (s >= 65) return '#ea580c';
    if (s >= 40) return '#d97706';
    return '#059669';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-sky-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {activeLanguage === 'ta' ? 'விளக்கக்கூடிய AI (XAI) இடர் பகுப்பாய்வு' : 'Explainable AI (XAI) Risk Decomposition'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  {confidence || '96.8%'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {activeLanguage === 'ta' ? `${currentLocationName} பகுதிக்கான நிகழ்நேர வானிலை இடர் அளவீடு` : `Real-time hazard impact calculation for ${currentLocationName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Main Risk Overview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            {/* SVG Circular Gauge */}
            <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-200"
                  strokeWidth="9"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={getStrokeColor(score)}
                  strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">{score}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">/ 100</span>
              </div>
            </div>

            {/* Risk Label & Description */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${getScoreColor(score)}`}>
                  {badgeText}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {activeLanguage === 'ta' ? 'மதிப்பீடு: ' : 'Confidence: '} <strong>{confidence}</strong>
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">{summary}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeLanguage === 'ta'
                  ? 'வானிலை மாதிரிகள் (GFS/ECMWF), ரேடார் மழைப்பொழிவு மற்றும் காற்றின் வேகத்தை இணைத்து கணக்கிடப்பட்ட ஒருங்கிணைந்த ஆபத்துக் குறியீடு.'
                  : 'Fuses high-resolution NWP atmospheric telemetry, Doppler precipitation radar, and convective instability indicators.'}
              </p>
            </div>
          </div>

          {/* Factor Breakdown (Feature Importance) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                <span>{activeLanguage === 'ta' ? 'காரணி முக்கியத்துவப் பகுப்பாய்வு (Why this risk?)' : 'Risk Factor Decomposition (Why this risk?)'}</span>
              </h4>
              <span className="text-[10px] text-slate-400">{activeLanguage === 'ta' ? 'எடை சதவீதம்' : 'Weighted Contribution'}</span>
            </div>

            <div className="space-y-2">
              {factors.map((f, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 font-semibold text-slate-800">
                      <span className="text-slate-400 font-mono text-[10px]">{f.weight}</span>
                      <span>{f.name}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-mono text-slate-500">{f.raw}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        f.score >= 70 ? 'bg-rose-50 border-rose-200 text-rose-700' :
                        f.score >= 40 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        f.score >= 70 ? 'bg-rose-500' : f.score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(8, f.score)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Guidance */}
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
            <h4 className="text-xs font-bold text-sky-900 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'பரிந்துரைக்கப்பட்ட முன்னெச்சரிக்கை நடவடிக்கைகள்' : 'Recommended Proactive Actions'}</span>
            </h4>
            <ul className="space-y-1 text-xs text-sky-950">
              {actions.map((act, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-sky-500 font-bold">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Grounding & Data Sources */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center space-x-1 font-semibold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'நம்பகமான தரவு மூலங்கள் (RAG Grounding)' : 'Verified Data Streams (RAG Grounding)'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {sources.map((src, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-700 text-[10px]">
                  ✓ {src}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            {activeLanguage === 'ta' ? 'புரிந்தது / மூடு' : 'Got It / Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
