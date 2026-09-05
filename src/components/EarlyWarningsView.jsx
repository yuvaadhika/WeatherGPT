import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Bell,
  BellRing,
  Info,
  Radio,
  ExternalLink,
  LifeBuoy,
  Flame,
  Droplets,
  Wind,
  Zap,
  ChevronRight
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';

export default function EarlyWarningsView({
  activeLanguage = 'en',
  alerts = [],
  riskData,
  currentLocation,
  onOpenXAI,
  onOpenAlertModal,
  notificationsEnabled
}) {
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const locationName = currentLocation?.name || 'Chennai';

  const sosContacts = [
    { title: activeLanguage === 'ta' ? 'தேசிய அவசர எண்' : 'National Emergency', number: '112', desc: 'Police / Fire / Medical', color: 'bg-rose-600' },
    { title: activeLanguage === 'ta' ? 'மாநில பேரிடர் உதவி' : 'State Disaster Helpline', number: '1070', desc: 'SDMA Emergency Response', color: 'bg-orange-600' },
    { title: activeLanguage === 'ta' ? 'மாவட்ட பேரிடர் உதவி' : 'District Helpline', number: '1077', desc: 'Collectorate Control Room', color: 'bg-amber-600' },
    { title: activeLanguage === 'ta' ? 'ஆம்புலன்ஸ் அவசரம்' : 'Medical Ambulance', number: '108', desc: 'Emergency Healthcare', color: 'bg-emerald-600' },
  ];

  const safetyProtocols = [
    {
      title: activeLanguage === 'ta' ? 'கனமழை & திடீர் வெள்ள பாதுகாப்பு' : 'Heavy Rain & Flash Flood Protocol',
      dos: activeLanguage === 'ta'
        ? ['சுரங்கப்பாதைகள் மற்றும் தாழ்வான நீர் தேங்கும் பகுதிகளைத் தவிர்க்கவும்.', 'குடிநீரைக் காய்ச்சி குடிக்கவும்; அவசர உணவுகளைப் பாதுகாப்பாக வைக்கவும்.', 'மின் சாதனங்கள் மற்றும் மின்கம்பங்களிலிருந்து பாதுகாப்பான இடைவெளி பேணவும்.']
        : ['Avoid low-lying subways, bridges, and submerged roads.', 'Drink boiled water and store emergency provisions on upper floors.', 'Stay clear of fallen power lines and submerged electrical poles.'],
      donts: activeLanguage === 'ta'
        ? ['நீர் நிறைந்த சாலைகளில் வாகனங்களை வேகமாக இயக்க வேண்டாம்.', 'தேங்கி நிற்கும் மழைநீரில் குழந்தைகள் விளையாட அனுமதிக்க வேண்டாம்.']
        : ['Do not drive through flowing floodwaters (Turn Around, Don\'t Drown).', 'Do not touch wet electrical switches with bare hands.'],
    },
    {
      title: activeLanguage === 'ta' ? 'இடிமின்னல் & புயல் காற்று பாதுகாப்பு' : 'Thunderstorm & Lightning Protocol',
      dos: activeLanguage === 'ta'
        ? ['உறுதியான கான்கிரீட் கட்டடங்கள் அல்லது வாகனங்களுக்குள் தஞ்சமடையவும்.', 'கணினி மற்றும் மின்னணு சாதனங்களை சுவரிலிருந்து அணைத்து வைக்கவும்.']
        : ['Seek shelter inside a sturdy building or metal-roofed vehicle.', 'Unplug sensitive electronics and stay away from open windows.'],
      donts: activeLanguage === 'ta'
        ? ['தனித்து நிற்கும் உயரமான மரங்களின் அடியில் நிற்க வேண்டாம்.', 'திறந்தவெளி மைதானங்கள் அல்லது நீர்நிலைகளில் இருக்க வேண்டாம்.']
        : ['Never take shelter under isolated tall trees.', 'Do not use corded phones or stay in open metallic structures.'],
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto pb-24 space-y-4 font-sans text-slate-800 animate-fadeIn">
      {/* 1. Header Card */}
      <div className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 text-white rounded-3xl p-5 shadow-lg shadow-rose-600/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {activeLanguage === 'ta' ? 'முன்னெச்சரிக்கை & பேரிடர் மேலாண்மை மையம்' : 'Early Warning & Disaster Safety Hub'}
              </h2>
              <p className="text-[11px] text-rose-100 font-medium">
                {activeLanguage === 'ta' ? `${locationName} மண்டலத்திற்கான நேரடி எச்சரிக்கைகள்` : `Live Meteorological Hazard Feeds for ${locationName}`}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAlertModal}
            className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors cursor-pointer"
            title="Configure Alert Channels"
          >
            {notificationsEnabled ? <BellRing className="w-4 h-4 animate-pulse" /> : <Bell className="w-4 h-4" />}
          </button>
        </div>

        {/* Risk Score Summary Pill */}
        {riskData && (
          <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-rose-200">
                {activeLanguage === 'ta' ? 'இடர் குறியீடு நிலை' : 'Impact Risk Status'}
              </div>
              <div className="text-sm font-extrabold">{riskData.badgeText} ({riskData.score}/100)</div>
            </div>
            <button
              onClick={onOpenXAI}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'XAI விவரம்' : 'Why this risk?'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Active Severe Alerts Feed */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1 flex items-center space-x-1.5">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <span>{activeLanguage === 'ta' ? 'செயலில் உள்ள எச்சரிக்கைகள்' : 'Active Meteorological Alerts'}</span>
        </h3>

        {alerts.length > 0 ? (
          alerts.map((al, idx) => (
            <div
              key={al.id || idx}
              className={`p-4 rounded-3xl border shadow-sm space-y-2.5 transition-all ${
                al.level === 'red'
                  ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                  : al.level === 'orange'
                  ? 'bg-orange-50/90 border-orange-300 text-orange-950'
                  : al.level === 'yellow'
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase text-white ${
                    al.level === 'red' ? 'bg-rose-600' :
                    al.level === 'orange' ? 'bg-orange-500' :
                    al.level === 'yellow' ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}>
                    {al.level} ALERT
                  </span>
                  <span className="text-xs font-bold">{al.category}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {al.validTime || (activeLanguage === 'ta' ? 'இன்று இரவு 11:30 வரை' : 'Valid till 11:30 PM')}
                </span>
              </div>

              <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{al.title}</h4>
              <p className="text-xs text-slate-700 leading-relaxed">{al.message}</p>

              {al.action && (
                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-800 font-medium flex items-start space-x-2">
                  <span className="text-rose-600 font-bold">⚡ {activeLanguage === 'ta' ? 'நடவடிக்கை:' : 'Action:'}</span>
                  <span>{al.action}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold">
              {activeLanguage === 'ta' ? 'இயல்பான நிலை — எச்சரிக்கைகள் இல்லை' : 'Nominal Conditions — No Active Severe Warnings'}
            </h4>
            <p className="text-xs text-emerald-700">
              {activeLanguage === 'ta' ? 'அனைத்து வளிமண்டல அளவீடுகளும் பாதுகாப்பான வரம்பில் உள்ளன.' : 'All atmospheric and precipitation parameters are within safe nominal thresholds.'}
            </p>
          </div>
        )}
      </div>

      {/* 3. Emergency SOS Hotline Contacts */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
          <PhoneCall className="w-4 h-4 text-rose-600" />
          <span>{activeLanguage === 'ta' ? 'அவசர SOS உதவி எண்கள்' : 'Emergency SOS Hotlines (Quick Dial)'}</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {sosContacts.map((c, idx) => (
            <a
              key={idx}
              href={`tel:${c.number}`}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all text-left group block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-rose-600 truncate">
                  {c.title}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-white font-mono font-black text-xs ${c.color}`}>
                  {c.number}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-medium truncate">{c.desc}</div>
            </a>
          ))}
        </div>
      </div>

      {/* 4. Disaster Management Do's & Don'ts */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1 flex items-center space-x-1.5">
          <LifeBuoy className="w-4 h-4 text-sky-600" />
          <span>{activeLanguage === 'ta' ? 'பேரிடர் வழிகாட்டு நெறிமுறைகள் (NDRF / SDMA)' : 'Official Safety Guidelines (NDRF / SDMA)'}</span>
        </h3>

        {safetyProtocols.map((proto, idx) => (
          <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              {proto.title}
            </h4>

            {/* Do's */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{activeLanguage === 'ta' ? 'செய்ய வேண்டியவை (DOs)' : 'Recommended Actions (DOs)'}</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc">
                {proto.dos.map((d, dIdx) => (
                  <li key={dIdx} className="leading-relaxed">{d}</li>
                ))}
              </ul>
            </div>

            {/* Don'ts */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-rose-700 flex items-center space-x-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{activeLanguage === 'ta' ? 'தவிர்க்க வேண்டியவை (DONTs)' : 'Avoid (DONTs)'}</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc">
                {proto.donts.map((d, dIdx) => (
                  <li key={dIdx} className="leading-relaxed">{d}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Notification Setup Banner */}
      <div className="p-4 rounded-3xl bg-sky-50 border border-sky-200 text-sky-950 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold">
            {activeLanguage === 'ta' ? 'பல சேனல் அவசர அறிவிப்புகள் (Push, SMS, Email)' : 'Multi-Channel Early Warnings (Push / SMS / Email)'}
          </h4>
          <p className="text-[11px] text-sky-700 mt-0.5">
            {notificationsEnabled
              ? (activeLanguage === 'ta' ? 'அறிவிப்புகள் செயலில் உள்ளன.' : 'Multi-channel notifications are currently enabled.')
              : (activeLanguage === 'ta' ? 'புயல் மற்றும் கனமழை அறிவிப்புகளைப் பெற இயக்கவும்.' : 'Enable real-time push notifications for extreme weather.')}
          </p>
        </div>
        <button
          onClick={onOpenAlertModal}
          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors flex-shrink-0 cursor-pointer ml-2"
        >
          {notificationsEnabled ? (activeLanguage === 'ta' ? 'அமைப்புகள்' : 'Settings') : (activeLanguage === 'ta' ? 'இயக்கு' : 'Enable')}
        </button>
      </div>
    </div>
  );
}
