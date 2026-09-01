import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  BellRing,
  Smartphone,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Volume2,
  RefreshCw,
  Trash2,
  Radio,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { TRANSLATIONS } from '../services/languages';

const COUNTRY_CODES = [
  { code: '+91', country: 'India 🇮🇳', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada 🇺🇸', flag: '🇺🇸' },
  { code: '+44', country: 'UK 🇬🇧', flag: '🇬🇧' },
  { code: '+971', country: 'UAE 🇦🇪', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore 🇸🇬', flag: '🇸🇬' },
  { code: '+94', country: 'Sri Lanka 🇱🇰', flag: '🇱🇰' },
  { code: '+60', country: 'Malaysia 🇲🇾', flag: '🇲🇾' },
  { code: '+61', country: 'Australia 🇦🇺', flag: '🇦🇺' },
  { code: '+49', country: 'Germany 🇩🇪', flag: '🇩🇪' },
];

const ALERT_MODAL_I18N = {
  en: {
    title: 'Alert & Notification Channels',
    liveDispatch: 'Live Dispatch',
    subtitle: (loc) => `Receive instant severe weather warnings via SMS, Email & Browser Push for ${loc}`,
    smsTab: 'SMS Alerts',
    emailTab: 'Email Alerts',
    pushTab: 'Browser Push',
    logsTab: (count) => `Dispatch Logs (${count})`,
    smsTitle: 'SMS Mobile Alerts',
    smsDesc: 'Receive urgent SMS warnings directly to your mobile phone',
    smsPhoneLabel: 'Mobile Phone Number (SMS Recipient)',
    smsPlaceholder: 'Enter 10-digit mobile number (e.g. 9876543210)',
    smsCarrierNote: 'WeatherGPT delivers high-priority meteorological alerts directly to your mobile phone.',
    smsTriggersLabel: 'SMS Alert Triggers:',
    smsRedAlert: '🔴 RED Alerts (Severe)',
    smsRedDesc: 'Cyclones, heavy flash floods, extreme gales',
    smsOrangeAlert: '🟠 ORANGE Rain Warnings',
    smsOrangeDesc: 'Intense rain & thunderstorm arrivals',
    smsAqiAlert: '🌫️ Air Quality Hazards',
    smsAqiDesc: 'PM2.5 / AQI > 250 toxic smog spikes',
    smsStatusActive: (num) => `● Active for ${num}`,
    smsNotConfigured: 'Not configured',
    sendTestSms: 'Send Test SMS',
    sending: 'Sending...',
    emailTitle: 'Email Weather Bulletins',
    emailDesc: 'Receive comprehensive meteorological advisories & morning digests',
    emailLabel: 'Email Address / Login Email',
    emailPlaceholder: 'Enter your email address (e.g. farmer.weather@gmail.com)',
    emailNote: 'Formatted HTML forecasts, 48h rain onset timelines, and radar images will be delivered.',
    emailTriggersLabel: 'Email Bulletin Subscriptions:',
    emailStormAlert: '🚨 Emergency Storm Alerts',
    emailStormDesc: 'Immediate dispatch upon severe hazard trigger',
    emailMorningDigest: '🌅 Daily Morning Digest (7 AM)',
    emailMorningDesc: "Day's max temp, rain probability, hourly chart",
    emailAgri: '🌾 Agro-Crop Soil Advisory',
    emailAgriDesc: 'Root-zone moisture, pesticide spray windows',
    emailMarine: '🌊 Marine & High-Seas',
    emailMarineDesc: 'Wave height, wind swell & squall warnings',
    emailStatusActive: (email) => `● Active for ${email}`,
    sendTestEmail: 'Send Test Email',
    dispatching: 'Dispatching...',
    pushStatusGranted: 'Browser Push Status: GRANTED & ACTIVE',
    pushGrantedDesc: 'Native system notifications will display on your desktop/phone even when tab is minimized.',
    pushDeniedDesc: 'Click below to allow notification permissions in your browser.',
    allowPermissions: 'Allow Permissions',
    audioChime: 'Emergency Audio Chime',
    audioChimeDesc: 'Plays distinct two-tone frequencies for severe storms',
    target: 'Target',
    sendTestPush: 'Send Test Push & Sound',
    activityStream: 'Real-Time Dispatch Activity Stream',
    clearHistory: 'Clear History',
    noDispatches: 'No alert dispatches yet.',
    noDispatchesDesc: 'Dispatched SMS, Email and Push warnings will appear here in real-time.',
    gatewayFooter: 'NWP Ensemble & WAQI Air Hazard Gateway',
    done: 'Done',
    pushGrantedToast: '✅ Browser Push Notifications enabled successfully!',
    pushWarningToast: '⚠️ Please allow notification permission in your browser settings.',
    smsPhoneWarningToast: '⚠️ Please enter your mobile phone number first.',
    smsSentToast: (num) => `📱 Test SMS dispatched to ${num}!`,
    emailWarningToast: '⚠️ Please enter a valid email address.',
    emailSentToast: (email) => `📧 Test Email bulletin dispatched to ${email}!`,
    pushSentToast: (loc) => `🔔 Live Push alert dispatched to browser for ${loc}!`,
    logsClearedToast: 'Delivery logs cleared.',
  },
  ta: {
    title: 'எச்சரிக்கை & அறிவிப்பு அமைப்புகள்',
    liveDispatch: 'நேரலை அனுப்புதல்',
    subtitle: (loc) => `${loc} பகுதியில் ஏற்படும் தீவிர வானிலை, புயல் மற்றும் மழை எச்சரிக்கைகளை SMS, மின்னஞ்சல் மற்றும் புஷ் மூலம் உடனுக்குடன் பெறுங்கள்.`,
    smsTab: 'SMS எச்சரிக்கைகள்',
    emailTab: 'மின்னஞ்சல் எச்சரிக்கைகள்',
    pushTab: 'பிரவுசர் புஷ்',
    logsTab: (count) => `அனுப்பிய பதிவுகள் (${count})`,
    smsTitle: 'மொபைல் SMS எச்சரிக்கைகள்',
    smsDesc: 'அவசர வானிலை எச்சரிக்கைகளை உங்கள் மொபைல் போனிலேயே நேரடியாகப் பெறுங்கள்',
    smsPhoneLabel: 'மொபைல் போன் எண் (SMS பெறுநர்)',
    smsPlaceholder: '10 இலக்க மொபைல் எண்ணை உள்ளிடவும் (எ.கா: 9876543210)',
    smsCarrierNote: 'வெதர் ஜிபிடி தீவிர வானிலை எச்சரிக்கைகளை உங்கள் மொபைல் எண்ணுக்கு உடனடியாக அனுப்புகிறது.',
    smsTriggersLabel: 'SMS எச்சரிக்கை காரணங்கள்:',
    smsRedAlert: '🔴 சிவப்பு எச்சரிக்கைகள் (தீவிர புயல், பெருவெள்ளம்)',
    smsRedDesc: 'புயல்கள், திடீர் வெள்ளப்பெருக்கு, தீவிர சூறாவளி காற்று',
    smsOrangeAlert: '🟠 ஆரஞ்சு எச்சரிக்கைகள் (கனமழை, இடி மின்னல்)',
    smsOrangeDesc: 'தீவிர கனமழை மற்றும் இடி மின்னல் தொடக்கம்',
    smsAqiAlert: '🌫️ காற்று மாசுபாடு அபாயம்',
    smsAqiDesc: 'PM2.5 / AQI > 250 நச்சுப் புகை அதிகரிப்பு',
    smsStatusActive: (num) => `● ${num} எண்ணிற்கு இயக்கப்பட்டுள்ளது`,
    smsNotConfigured: 'அமைக்கப்படவில்லை',
    sendTestSms: 'சோதனை SMS அனுப்பு',
    sending: 'அனுப்பப்படுகிறது...',
    emailTitle: 'மின்னஞ்சல் வானிலை அறிக்கைகள்',
    emailDesc: 'விரிவான வானிலை அறிக்கைகள் மற்றும் காலை செய்தி சுருக்கத்தைப் பெறுங்கள்',
    emailLabel: 'மின்னஞ்சல் முகவரி (Email ID)',
    emailPlaceholder: 'மின்னஞ்சல் முகவரியை உள்ளிடவும் (எ.கா: user@gmail.com)',
    emailNote: 'வானிலை முன்னறிவிப்பு, 48 மணி நேர மழை அட்டவணை மற்றும் ரேடார் வரைபடங்கள் அனுப்பப்படும்.',
    emailTriggersLabel: 'மின்னஞ்சல் சந்தா விவரங்கள்:',
    emailStormAlert: '🚨 அவசர புயல் / கனமழை எச்சரிக்கைகள்',
    emailStormDesc: 'தீவிர அபாய எச்சரிக்கை ஏற்பட்டவுடன் உடனுக்குடன் அனுப்பப்படும்',
    emailMorningDigest: '🌅 தினசரி காலை 7 மணி வானிலை சுருக்கம்',
    emailMorningDesc: 'அன்றைய அதிகபட்ச வெப்பம், மழை வாய்ப்பு, மணிநேர வரைபடம்',
    emailAgri: '🌾 விவசாய பயிர் & மண் ஈரப்பதம் வழிகாட்டல்',
    emailAgriDesc: 'மண் ஈரப்பதம், மருந்து தெளிப்பதற்கான உகந்த நேரம்',
    emailMarine: '🌊 கடல் அலை & மீனவர் பாதுகாப்பு',
    emailMarineDesc: 'அலை உயரம், காற்று வேகம் மற்றும் கடல் கொந்தளிப்பு எச்சரிக்கைகள்',
    emailStatusActive: (email) => `● ${email} முகவரிக்கு இயக்கப்பட்டுள்ளது`,
    sendTestEmail: 'சோதனை மின்னஞ்சல் அனுப்பு',
    dispatching: 'அனுப்பப்படுகிறது...',
    pushStatusGranted: 'பிரவுசர் புஷ் நிலைமை: இயக்கப்பட்டது (ACTIVE)',
    pushGrantedDesc: 'பிரவுசர் மூடப்பட்டிருந்தாலும் டெஸ்க்டாப் / மொபைல் திரையில் நேரலை எச்சரிக்கை தோன்றும்.',
    pushDeniedDesc: 'உங்கள் பிரவுசரில் அறிவிப்பு அனுமதியை (Notification Permission) இயக்க கீழே கிளிக் செய்யவும்.',
    allowPermissions: 'அனுமதியை இயக்கு',
    audioChime: 'அவசரகால எச்சரிக்கை ஒலி (Siren Sound)',
    audioChimeDesc: 'தீவிர புயல்களின் போது கவனத்தை ஈர்க்கும் இரண்டு-தொனி எச்சரிக்கை ஒலியை இயக்கும்',
    target: 'இடம்',
    sendTestPush: 'சோதனை புஷ் & ஒலி அனுப்பு',
    activityStream: 'நேரடி எச்சரிக்கை அனுப்பிய வரலாற்றுப் பதிவுகள்',
    clearHistory: 'பதிவுகளை அழி',
    noDispatches: 'இதுவரை எச்சரிக்கைகள் எதுவும் அனுப்பப்படவில்லை.',
    noDispatchesDesc: 'அனுப்பப்படும் SMS, மின்னஞ்சல் மற்றும் புஷ் எச்சரிக்கைகள் நிகழ்நேரத்தில் இங்கே தோன்றும்.',
    gatewayFooter: 'NWP மாதிரி & WAQI காற்று மாசு எச்சரிக்கை தளம்',
    done: 'முடிந்தது',
    pushGrantedToast: '✅ பிரவுசர் புஷ் அறிவிப்புகள் வெற்றிகரமாக இயக்கப்பட்டன!',
    pushWarningToast: '⚠️ உங்கள் பிரவுசர் அமைப்புகளில் அறிவிப்பு அனுமதியை இயக்கவும்.',
    smsPhoneWarningToast: '⚠️ முதலில் உங்கள் மொபைல் போன் எண்ணை உள்ளிடவும்.',
    smsSentToast: (num) => `📱 சோதனை SMS ${num} எண்ணிற்கு வெற்றிகரமாக அனுப்பப்பட்டது!`,
    emailWarningToast: '⚠️ சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.',
    emailSentToast: (email) => `📧 சோதனை மின்னஞ்சல் அறிக்கை ${email} முகவரிக்கு அனுப்பப்பட்டது!`,
    pushSentToast: (loc) => `🔔 ${loc} இடத்திற்கான நேரலை புஷ் எச்சரிக்கை திரையில் அனுப்பப்பட்டது!`,
    logsClearedToast: 'எச்சரிக்கை பதிவுகள் அழிக்கப்பட்டன.',
  }
};

export default function AlertNotificationModal({
  isOpen,
  onClose,
  activeLanguage = 'en',
  currentLocationName = 'Chennai',
  onSettingsUpdated
}) {
  const [activeTab, setActiveTab] = useState('sms'); // 'sms' | 'email' | 'push' | 'logs'
  const [settings, setSettings] = useState(() => notificationService.getSettings());
  const [logs, setLogs] = useState(() => notificationService.getDeliveryLogs());
  const [toastMessage, setToastMessage] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [pushPermission, setPushPermission] = useState(() => notificationService.getPermission());

  const txt = ALERT_MODAL_I18N[activeLanguage] || ALERT_MODAL_I18N.en;

  useEffect(() => {
    if (isOpen) {
      setSettings(notificationService.getSettings());
      setLogs(notificationService.getDeliveryLogs());
      setPushPermission(notificationService.getPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = (updatedSettings) => {
    setSettings(updatedSettings);
    notificationService.saveSettings(updatedSettings);
    if (onSettingsUpdated) onSettingsUpdated(updatedSettings);
  };

  // Push Permission Request
  const handleRequestPushPermission = async () => {
    const perm = await notificationService.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      const updated = {
        ...settings,
        push: { ...settings.push, enabled: true },
      };
      handleSave(updated);
      notificationService.sendTestAlert(currentLocationName);
      showToast(txt.pushGrantedToast);
      setLogs(notificationService.getDeliveryLogs());
    } else {
      showToast(txt.pushWarningToast, 'warning');
    }
  };

  // Send Test SMS
  const handleTestSms = () => {
    if (!settings.sms.phoneNumber?.trim()) {
      showToast(txt.smsPhoneWarningToast, 'warning');
      return;
    }
    setIsTesting(true);
    setTimeout(() => {
      notificationService.sendTestSms(
        `${settings.sms.countryCode} ${settings.sms.phoneNumber}`,
        currentLocationName
      );
      setLogs(notificationService.getDeliveryLogs());
      setIsTesting(false);
      showToast(txt.smsSentToast(`${settings.sms.countryCode} ${settings.sms.phoneNumber}`));
    }, 600);
  };

  // Send Test Email
  const handleTestEmail = () => {
    if (!settings.email.emailAddress?.trim() || !settings.email.emailAddress.includes('@')) {
      showToast(txt.emailWarningToast, 'warning');
      return;
    }
    setIsTesting(true);
    setTimeout(() => {
      notificationService.sendTestEmail(settings.email.emailAddress, currentLocationName);
      setLogs(notificationService.getDeliveryLogs());
      setIsTesting(false);
      showToast(txt.emailSentToast(settings.email.emailAddress));
    }, 600);
  };

  // Send Test Push
  const handleTestPush = () => {
    if (pushPermission !== 'granted') {
      handleRequestPushPermission();
      return;
    }
    notificationService.sendTestAlert(currentLocationName);
    setLogs(notificationService.getDeliveryLogs());
    showToast(txt.pushSentToast(currentLocationName));
  };

  const handleClearLogs = () => {
    notificationService.clearDeliveryLogs();
    setLogs([]);
    showToast(txt.logsClearedToast);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50/50 to-indigo-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{txt.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold uppercase">
                  {txt.liveDispatch}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {txt.subtitle(currentLocationName)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-4 pt-2 bg-slate-50/70 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sms')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 flex-shrink-0 ${
              activeTab === 'sms'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{txt.smsTab}</span>
            {settings.sms.enabled && settings.sms.phoneNumber && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 flex-shrink-0 ${
              activeTab === 'email'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>{txt.emailTab}</span>
            {settings.email.enabled && settings.email.emailAddress && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('push')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 flex-shrink-0 ${
              activeTab === 'push'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{txt.pushTab}</span>
            {settings.push.enabled && pushPermission === 'granted' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center space-x-1.5 flex-shrink-0 ml-auto ${
              activeTab === 'logs'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{txt.logsTab(logs.length)}</span>
          </button>
        </div>

        {/* Toast Alert Notice */}
        {toastMessage && (
          <div
            className={`mx-4 mt-3 p-3 rounded-2xl text-xs font-medium flex items-center space-x-2 transition-all ${
              toastMessage.type === 'warning'
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: SMS ALERTS */}
          {activeTab === 'sms' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Toggle Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{txt.smsTitle}</h3>
                    <p className="text-xs text-slate-500">{txt.smsDesc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sms.enabled}
                    onChange={(e) => {
                      const updated = {
                        ...settings,
                        sms: { ...settings.sms, enabled: e.target.checked },
                      };
                      handleSave(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {txt.smsPhoneLabel}
                </label>
                <div className="flex items-center space-x-2">
                  {/* Country Code Dropdown */}
                  <select
                    value={settings.sms.countryCode}
                    onChange={(e) => {
                      const updated = {
                        ...settings,
                        sms: { ...settings.sms, countryCode: e.target.value },
                      };
                      handleSave(updated);
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-sm"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.country})
                      </option>
                    ))}
                  </select>

                  {/* Phone Input */}
                  <input
                    type="tel"
                    value={settings.sms.phoneNumber}
                    onChange={(e) => {
                      const updated = {
                        ...settings,
                        sms: { ...settings.sms, phoneNumber: e.target.value },
                      };
                      handleSave(updated);
                    }}
                    placeholder={txt.smsPlaceholder}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {txt.smsCarrierNote}
                </p>
              </div>

              {/* Triggers */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">{txt.smsTriggersLabel}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                    <input
                      type="checkbox"
                      checked={settings.sms.triggers.redAlert}
                      onChange={(e) => {
                        const updated = {
                          ...settings,
                          sms: {
                            ...settings.sms,
                            triggers: { ...settings.sms.triggers, redAlert: e.target.checked },
                          },
                        };
                        handleSave(updated);
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-rose-700 block">{txt.smsRedAlert}</span>
                      <span className="text-[11px] text-slate-500">{txt.smsRedDesc}</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                    <input
                      type="checkbox"
                      checked={settings.sms.triggers.orangeRain}
                      onChange={(e) => {
                        const updated = {
                          ...settings,
                          sms: {
                            ...settings.sms,
                            triggers: { ...settings.sms.triggers, orangeRain: e.target.checked },
                          },
                        };
                        handleSave(updated);
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-amber-700 block">{txt.smsOrangeAlert}</span>
                      <span className="text-[11px] text-slate-500">{txt.smsOrangeDesc}</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                    <input
                      type="checkbox"
                      checked={settings.sms.triggers.aqiHazard}
                      onChange={(e) => {
                        const updated = {
                          ...settings,
                          sms: {
                            ...settings.sms,
                            triggers: { ...settings.sms.triggers, aqiHazard: e.target.checked },
                          },
                        };
                        handleSave(updated);
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">{txt.smsAqiAlert}</span>
                      <span className="text-[11px] text-slate-500">{txt.smsAqiDesc}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Status: {settings.sms.enabled && settings.sms.phoneNumber ? (
                    <span className="text-emerald-600 font-bold">{txt.smsStatusActive(`${settings.sms.countryCode} ${settings.sms.phoneNumber}`)}</span>
                  ) : (
                    <span className="text-slate-400">{txt.smsNotConfigured}</span>
                  )}
                </span>
                <button
                  onClick={handleTestSms}
                  disabled={isTesting || !settings.sms.phoneNumber}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTesting ? txt.sending : txt.sendTestSms}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL ALERTS */}
          {activeTab === 'email' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Toggle Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{txt.emailTitle}</h3>
                    <p className="text-xs text-slate-500">{txt.emailDesc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.enabled}
                    onChange={(e) => {
                      const updated = {
                        ...settings,
                        email: { ...settings.email, enabled: e.target.checked },
                      };
                      handleSave(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {/* Email Address Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {txt.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={settings.email.emailAddress}
                    onChange={(e) => {
                      const updated = {
                        ...settings,
                        email: { ...settings.email, emailAddress: e.target.value },
                      };
                      handleSave(updated);
                    }}
                    placeholder={txt.emailPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {txt.emailNote}
                </p>
              </div>

              {/* Triggers */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">{txt.emailTriggersLabel}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                    <input
                      type="checkbox"
                      checked={settings.email.triggers.severeEarlyWarning}
                      onChange={(e) => {
                        const updated = {
                          ...settings,
                          email: {
                            ...settings.email,
                            triggers: { ...settings.email.triggers, severeEarlyWarning: e.target.checked },
                          },
                        };
                        handleSave(updated);
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-rose-700 block">{txt.emailStormAlert}</span>
                      <span className="text-[11px] text-slate-500">{txt.emailStormDesc}</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                    <input
                      type="checkbox"
                      checked={settings.email.triggers.morningDailyDigest}
                      onChange={(e) => {
                        const updated = {
                          ...settings,
                          email: {
                            ...settings.email,
                            triggers: { ...settings.email.triggers, morningDailyDigest: e.target.checked },
                          },
                        };
                        handleSave(updated);
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">{txt.emailMorningDigest}</span>
                      <span className="text-[11px] text-slate-500">{txt.emailMorningDesc}</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                    <input
                      type="checkbox"
                      checked={settings.email.triggers.cropFarmAdvisory}
                      onChange={(e) => {
                        const updated = {
                          ...settings,
                          email: {
                            ...settings.email,
                            triggers: { ...settings.email.triggers, cropFarmAdvisory: e.target.checked },
                          },
                        };
                        handleSave(updated);
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-emerald-700 block">{txt.emailAgri}</span>
                      <span className="text-[11px] text-slate-500">{txt.emailAgriDesc}</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                    <input
                      type="checkbox"
                      checked={settings.email.triggers.marineAdvisory}
                      onChange={(e) => {
                        const updated = {
                          ...settings,
                          email: {
                            ...settings.email,
                            triggers: { ...settings.email.triggers, marineAdvisory: e.target.checked },
                          },
                        };
                        handleSave(updated);
                      }}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-sky-700 block">{txt.emailMarine}</span>
                      <span className="text-[11px] text-slate-500">{txt.emailMarineDesc}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Status: {settings.email.enabled && settings.email.emailAddress ? (
                    <span className="text-emerald-600 font-bold">{txt.emailStatusActive(settings.email.emailAddress)}</span>
                  ) : (
                    <span className="text-slate-400">{txt.smsNotConfigured}</span>
                  )}
                </span>
                <button
                  onClick={handleTestEmail}
                  disabled={isTesting || !settings.email.emailAddress}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTesting ? txt.dispatching : txt.sendTestEmail}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: BROWSER PUSH ALERTS */}
          {activeTab === 'push' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Permission Banner */}
              <div className={`p-4 rounded-2xl border ${
                pushPermission === 'granted'
                  ? 'bg-emerald-50 border-emerald-200'
                  : pushPermission === 'denied'
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      pushPermission === 'granted' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {pushPermission === 'granted' ? txt.pushStatusGranted : `Browser Push: ${pushPermission.toUpperCase()}`}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {pushPermission === 'granted'
                          ? txt.pushGrantedDesc
                          : txt.pushDeniedDesc}
                      </p>
                    </div>
                  </div>

                  {pushPermission !== 'granted' && (
                    <button
                      onClick={handleRequestPushPermission}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      {txt.allowPermissions}
                    </button>
                  )}
                </div>
              </div>

              {/* Sound Settings */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Volume2 className="w-4 h-4 text-sky-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{txt.audioChime}</span>
                      <span className="text-[11px] text-slate-500">{txt.audioChimeDesc}</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push.sound !== false}
                      onChange={(e) => {
                        const updated = {
                          ...settings,
                          push: { ...settings.push, sound: e.target.checked },
                        };
                        handleSave(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {txt.target}: {currentLocationName}
                </span>
                <button
                  onClick={handleTestPush}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{txt.sendTestPush}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DISPATCH LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{txt.activityStream}</span>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center space-x-1 font-semibold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{txt.clearHistory}</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Radio className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p>{txt.noDispatches}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{txt.noDispatchesDesc}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {logs.map((log) => (
                    <div key={log.id} className="pt-2 pb-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                            log.channel === 'sms'
                              ? 'bg-sky-100 text-sky-800'
                              : log.channel === 'email'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {log.channel}
                          </span>
                          <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {log.target}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono">
                        {log.message || log.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <ShieldAlert className="w-4 h-4 text-sky-600" />
            <span>{txt.gatewayFooter}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            {txt.done}
          </button>
        </div>
      </div>
    </div>
  );
}
