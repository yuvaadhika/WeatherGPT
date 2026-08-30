import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, ChevronDown, ChevronUp, BellRing, Share2 } from 'lucide-react';

export const ALERT_STYLES = {
  red: {
    bg: 'bg-rose-950/40 border-rose-600/40 text-rose-100',
    badge: 'bg-rose-600 text-white',
    icon: ShieldAlert,
    glow: '',
    accent: 'text-rose-400',
    title: 'RED ALERT: Severe Meteorological Hazard',
  },
  orange: {
    bg: 'bg-amber-950/40 border-amber-600/40 text-amber-100',
    badge: 'bg-amber-600 text-slate-950',
    icon: AlertTriangle,
    glow: '',
    accent: 'text-amber-400',
    title: 'ORANGE ALERT: Be Prepared & Alert',
  },
  yellow: {
    bg: 'bg-yellow-950/30 border-yellow-600/30 text-yellow-100',
    badge: 'bg-yellow-500 text-slate-950',
    icon: Info,
    glow: '',
    accent: 'text-yellow-400',
    title: 'YELLOW ALERT: Watch Weather Conditions',
  },
  green: {
    bg: 'bg-emerald-950/30 border-emerald-600/30 text-emerald-100',
    badge: 'bg-emerald-600 text-white',
    icon: CheckCircle2,
    glow: '',
    accent: 'text-emerald-400',
    title: 'GREEN: Normal Atmospheric Conditions',
  },
};

export default function WeatherAlertBanner({ alerts = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  const topAlert = alerts[0];
  const style = ALERT_STYLES[topAlert.level] || ALERT_STYLES.green;
  const IconComponent = style.icon;

  const handleShare = () => {
    const text = `🚨 WeatherGPT Disaster Alert for ${topAlert.category}:\n${topAlert.title}\n${topAlert.message}\nAction Directive: ${topAlert.action}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`w-full rounded-2xl border p-3.5 sm:p-4 mb-4 transition-all backdrop-blur-md shadow-xl ${style.bg} ${style.glow}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-black/40 border border-white/10 flex-shrink-0">
            <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${style.accent}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
                {topAlert.level.toUpperCase()} WARNING
              </span>
              <span className="text-xs font-semibold text-slate-300">
                Category: {topAlert.category}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold mt-0.5 text-white">
              {topAlert.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
              {topAlert.message}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={handleShare}
            title="Copy / Broadcast Alert Directive"
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/10 text-slate-300 hover:text-white transition-all text-xs flex items-center space-x-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{copied ? 'Copied!' : 'Share'}</span>
          </button>
          {alerts.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/10 text-slate-300 hover:text-white transition-all"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Recommended Action / Directive */}
      {topAlert.action && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-start space-x-2 text-xs">
          <span className="font-bold text-white uppercase tracking-wider flex-shrink-0">Safety Advisory:</span>
          <span className="text-slate-200 font-medium">{topAlert.action}</span>
        </div>
      )}

      {/* Additional Collapsible Alerts */}
      {expanded && alerts.length > 1 && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Additional Hazard Advisories ({alerts.length - 1}):</h4>
          {alerts.slice(1).map((alt, idx) => {
            const subStyle = ALERT_STYLES[alt.level] || ALERT_STYLES.yellow;
            return (
              <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-start space-x-2.5 text-xs">
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${subStyle.badge}`}>
                  {alt.level}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-white">{alt.title}</div>
                  <div className="text-slate-300 mt-0.5">{alt.message}</div>
                  {alt.action && <div className="text-slate-400 mt-0.5 text-[11px]">→ {alt.action}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
