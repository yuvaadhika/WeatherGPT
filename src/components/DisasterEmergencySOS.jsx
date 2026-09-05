import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  Bell,
  BellRing,
  AlertTriangle,
  Waves,
  Wind,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  LifeBuoy,
  BatteryCharging,
  Droplet,
  FileText,
  Car,
  HeartPulse,
  Flashlight,
  Radio
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';
import { notificationService } from '../services/notificationService';

const EMERGENCY_HELPLINES = [
  { id: '112', nameEn: 'National Emergency (Police/Fire/Med)', nameTa: 'தேசிய அவசர உதவி (அனைத்து)', number: '112', color: 'bg-rose-600' },
  { id: '1070', nameEn: 'State Disaster Management (SDMA)', nameTa: 'மாநில பேரிடர் மேலாண்மை ஆணையம்', number: '1070', color: 'bg-red-700' },
  { id: '1077', nameEn: 'District Collector Disaster Control', nameTa: 'மாவட்ட ஆட்சியர் பேரிடர் மையம்', number: '1077', color: 'bg-amber-600' },
  { id: '1912', nameEn: 'Electricity Board (EB Shock/Line)', nameTa: 'மின்துறை அவசர பிரிவு (EB)', number: '1912', color: 'bg-blue-600' },
  { id: '108', nameEn: 'Emergency Medical Ambulance', nameTa: 'மருத்துவ ஆம்புலன்ஸ் சேவை', number: '108', color: 'bg-emerald-600' },
  { id: '101', nameEn: 'Fire & Water Flood Rescue', nameTa: 'தீயணைப்பு & வெள்ள மீட்பு பணி', number: '101', color: 'bg-orange-600' },
];

const SURVIVAL_CHECKLIST_KEY = 'weathergpt_disaster_survival_checklist';

export default function DisasterEmergencySOS({
  activeLanguage = 'en',
  currentLocation,
  weatherData,
  aqiData,
  alerts = [],
  notificationsEnabled,
  onOpenAlertModal
}) {
  const [threatData, setThreatData] = useState(null);
  const [notificationDispatched, setNotificationDispatched] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    // Run predictive hazard engine
    if (weatherData) {
      const threat = notificationService.predictEarlyHazardAndNotify(
        weatherData,
        aqiData,
        currentLocation?.name || 'Your Location',
        activeLanguage
      );
      setThreatData(threat);
    }
  }, [weatherData, aqiData, currentLocation, activeLanguage]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SURVIVAL_CHECKLIST_KEY);
      if (stored) {
        setCheckedItems(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const handleToggleCheck = (id) => {
    setCheckedItems((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(SURVIVAL_CHECKLIST_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleTriggerBeforeAwareness = () => {
    const locName = currentLocation?.name || 'Chennai';
    const alertObj = {
      id: `manual-before-awareness-${Date.now()}`,
      level: threatData?.level || 'red',
      title: activeLanguage === 'ta'
        ? `🚨 முன்கூட்டிய பேரிடர் எச்சரிக்கை (${locName})`
        : `🚨 Early Predictive Disaster Warning (${locName})`,
      message: threatData?.message || (activeLanguage === 'ta'
        ? `அடுத்த 3 மணி நேரத்தில் ${locName} பகுதியில் தீவிர மழை & வெள்ள அபாயம் கணிக்கப்பட்டுள்ளது.`
        : `Severe rainfall and flash waterlogging predicted over ${locName} in next 3 hours.`),
      action: activeLanguage === 'ta'
        ? 'வாகனங்களை மேடான இடத்திற்கு மாற்றவும்; அவசர பொருட்களை தயார் நிலையில் வைக்கவும்.'
        : 'Move vehicles to high grounds, charge power banks, and store clean drinking water.',
    };

    notificationService.sendMultiChannelAlert(alertObj, locName);
    notificationService.playChime('severe');
    setNotificationDispatched(true);
    setTimeout(() => setNotificationDispatched(false), 4000);
  };

  const checklistItems = [
    { id: 'chk_power', labelTa: 'ஸ்மார்ட்போன் & பவர் பேங்க் 100% சார்ஜ் செய்தல்', labelEn: 'Charge smartphones & power banks to 100%' },
    { id: 'chk_water', labelTa: '10-20 லிட்டர் சுத்தமான குடிநீர் சேமித்து வைத்தல்', labelEn: 'Store 10-20 Liters of potable drinking water' },
    { id: 'chk_med', labelTa: 'அத்தியாவசிய மருந்துகள் & முதலுதவி பெட்டி தயார்', labelEn: 'Pack essential medicines & emergency first aid' },
    { id: 'chk_docs', labelTa: 'ஆவணங்களை வாட்டர்ப்ரூப் கவரில் பத்திரப்படுத்துதல்', labelEn: 'Seal important documents/certificates in waterproof zip bags' },
    { id: 'chk_car', labelTa: 'வாகனங்களை மேடான பகுதி / மேல் தளத்தில் நிறுத்துதல்', labelEn: 'Park vehicles in elevated areas / upper parking floors' },
    { id: 'chk_food', labelTa: 'உலர் உணவுகள் & பிஸ்கட் பாக்கெட்டுகள் வாங்குதல்', labelEn: 'Stock non-perishable dry rations & ready-to-eat foods' },
    { id: 'chk_torch', labelTa: 'எமர்ஜென்சி டார்ச் லைட் & மெழுகுவர்த்தி எடுத்தல்', labelEn: 'Keep emergency LED lanterns & batteries handy' },
  ];

  const completedCount = checklistItems.filter((i) => checkedItems[i.id]).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-20 animate-fadeIn font-sans">
      {/* 1. Header Card */}
      <div className="bg-gradient-to-br from-rose-900 via-slate-900 to-slate-950 text-white border border-rose-500/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 bg-rose-500/10 rounded-full blur-2xl"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/40 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {activeLanguage === 'ta' ? '🚨 புயல் & வெள்ள அவசர பேரிடர் தற்காப்பு மையம்' : '🚨 Cyclone & Flood Emergency SOS Hub'}
                </h2>
              </div>
              <p className="text-xs text-rose-200/80 font-medium">
                {activeLanguage === 'ta'
                  ? 'நிகழ்நேர முன்கூட்டிய எச்சரிக்கை, SOS அவசர அழைப்புகள் & தற்காப்பு வழிகாட்டி'
                  : 'Predictive before-awareness warnings, 1-tap SOS hotlines & disaster survival protocols.'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30">
            {currentLocation?.name || 'Chennai'}
          </span>
        </div>

        {/* 2. Live Predictive Threat Assessment Countdown Banner */}
        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-black text-rose-300 uppercase tracking-wider">
                {activeLanguage === 'ta' ? 'நேரடி முன்கூட்டிய அச்சுறுத்தல் கணிப்பு' : 'Live Predictive Threat Assessment'}
              </span>
            </div>
            {threatData?.leadTimeHours && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-600 text-white flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{activeLanguage === 'ta' ? `இன்னும் ~${threatData.leadTimeHours} மணி நேரத்தில்` : `Peak in ~${threatData.leadTimeHours} hrs`}</span>
              </span>
            )}
          </div>

          <div className="text-xs sm:text-sm font-bold text-white leading-relaxed">
            {threatData?.title || (activeLanguage === 'ta' ? 'வானிலை தரவு பகுப்பாய்வு செய்யப்படுகிறது...' : 'Analyzing real-time atmospheric telemetry...')}
          </div>
          <p className="text-xs text-slate-300 leading-normal">
            {threatData?.message}
          </p>

          {threatData?.action && (
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-[11px] text-rose-200 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong>{activeLanguage === 'ta' ? 'பாதுகாப்பு நடவடிக்கை:' : 'Immediate Action:'}</strong> {threatData.action}</span>
            </div>
          )}

          {/* Action to trigger push alert */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <span className="text-[10px] text-slate-300">
              {notificationsEnabled ? '✓ Auto-Alert Push Active' : 'Push notifications standby'}
            </span>
            <button
              onClick={handleTriggerBeforeAwareness}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{activeLanguage === 'ta' ? '🔔 எச்சரிக்கை அறிவிப்பை அனுப்பு' : '🔔 Trigger Before-Awareness Alert'}</span>
            </button>
          </div>
        </div>

        {notificationDispatched && (
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold text-center animate-fadeIn">
            ✓ {activeLanguage === 'ta' ? 'முன்கூட்டிய எச்சரிக்கை அறிவிப்பு அனுப்பப்பட்டது!' : 'Predictive before-awareness notification dispatched to device!'}
          </div>
        )}
      </div>

      {/* 2. 1-Tap Direct SOS Emergency Hotline Calling Grid */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
              {activeLanguage === 'ta' ? 'அவசர பேரிடர் உதவி எண்கள் (1-Tap Direct Dial)' : '1-Tap Direct Emergency Helplines'}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            24x7 Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {EMERGENCY_HELPLINES.map((hl) => (
            <a
              key={hl.id}
              href={`tel:${hl.number}`}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all flex items-center justify-between group cursor-pointer shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl ${hl.color} text-white flex items-center justify-center font-black text-xs shadow-sm group-hover:scale-105 transition-transform`}>
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                    {activeLanguage === 'ta' ? hl.nameTa : hl.nameEn}
                  </div>
                  <div className="text-xs font-mono font-black text-rose-600">
                    {hl.number}
                  </div>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                {activeLanguage === 'ta' ? 'அழை' : 'Call'} 📞
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* 3. Pre-Cached Offline Disaster Survival Checklist */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
              {activeLanguage === 'ta' ? 'பேரிடர் தற்காப்பு சரிபார்ப்புப் பட்டியல் (Survival Checklist)' : 'Offline Disaster Preparedness Checklist'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {activeLanguage === 'ta' ? 'புயல்/வெள்ளத்திற்கு முன் செய்ய வேண்டிய முக்கிய ஏற்பாடுகள்' : 'Essential items to secure before storm/flood landfall.'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-sky-700">{completedCount}/{checklistItems.length}</span>
            <div className="w-16 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {checklistItems.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => handleToggleCheck(item.id)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  isChecked
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3 text-xs font-semibold">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                    isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                  }`}>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={isChecked ? 'line-through text-slate-400 font-normal' : ''}>
                    {activeLanguage === 'ta' ? item.labelTa : item.labelEn}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
