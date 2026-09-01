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
      showToast('✅ Browser Push Notifications enabled successfully!');
      setLogs(notificationService.getDeliveryLogs());
    } else {
      showToast('⚠️ Please allow notification permission in your browser settings.', 'warning');
    }
  };

  // Send Test SMS
  const handleTestSms = () => {
    if (!settings.sms.phoneNumber?.trim()) {
      showToast('⚠️ Please enter your mobile phone number first.', 'warning');
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
      showToast(`📱 Test SMS dispatched to ${settings.sms.countryCode} ${settings.sms.phoneNumber}!`);
    }, 600);
  };

  // Send Test Email
  const handleTestEmail = () => {
    if (!settings.email.emailAddress?.trim() || !settings.email.emailAddress.includes('@')) {
      showToast('⚠️ Please enter a valid email address.', 'warning');
      return;
    }
    setIsTesting(true);
    setTimeout(() => {
      notificationService.sendTestEmail(settings.email.emailAddress, currentLocationName);
      setLogs(notificationService.getDeliveryLogs());
      setIsTesting(false);
      showToast(`📧 Test Email bulletin dispatched to ${settings.email.emailAddress}!`);
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
    showToast(`🔔 Live Push alert dispatched to browser for ${currentLocationName}!`);
  };

  const handleClearLogs = () => {
    notificationService.clearDeliveryLogs();
    setLogs([]);
    showToast('Delivery logs cleared.');
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
                <span>Alert & Notification Channels</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold uppercase">
                  Live Dispatch
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Receive instant severe weather warnings via SMS, Email & Browser Push for <span className="font-semibold text-slate-700">{currentLocationName}</span>
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
            <span>SMS Alerts</span>
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
            <span>Email Alerts</span>
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
            <span>Browser Push</span>
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
            <span>Dispatch Logs ({logs.length})</span>
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
                    <h3 className="text-sm font-bold text-slate-900">SMS Mobile Alerts</h3>
                    <p className="text-xs text-slate-500">Receive urgent SMS warnings directly to your mobile phone</p>
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
                  Mobile Phone Number (SMS Recipient)
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
                    placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Carrier charges may apply depending on your network operator. WeatherGPT delivers high-priority meteorological alerts.
                </p>
              </div>

              {/* Triggers */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">SMS Alert Triggers:</span>
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
                      <span className="font-semibold text-rose-700 block">🔴 RED Alerts (Severe)</span>
                      <span className="text-[11px] text-slate-500">Cyclones, heavy flash floods, extreme gales</span>
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
                      <span className="font-semibold text-amber-700 block">🟠 ORANGE Rain Warnings</span>
                      <span className="text-[11px] text-slate-500">Intense rain & thunderstorm arrivals</span>
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
                      <span className="font-semibold text-slate-800 block">🌫️ Air Quality Hazards</span>
                      <span className="text-[11px] text-slate-500">PM2.5 / AQI &gt; 250 toxic smog spikes</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Status: {settings.sms.enabled && settings.sms.phoneNumber ? (
                    <span className="text-emerald-600 font-bold">● Active for {settings.sms.countryCode} {settings.sms.phoneNumber}</span>
                  ) : (
                    <span className="text-slate-400">Not configured</span>
                  )}
                </span>
                <button
                  onClick={handleTestSms}
                  disabled={isTesting || !settings.sms.phoneNumber}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Sending...' : 'Send Test SMS'}</span>
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
                    <h3 className="text-sm font-bold text-slate-900">Email Weather Bulletins</h3>
                    <p className="text-xs text-slate-500">Receive comprehensive meteorological advisories & morning digests</p>
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
                  Email Address / Login Email
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
                    placeholder="Enter your email address (e.g. farmer.weather@gmail.com)"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Formatted HTML forecasts, 48h rain onset timelines, and radar images will be delivered.
                </p>
              </div>

              {/* Triggers */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">Email Bulletin Subscriptions:</span>
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
                      <span className="font-semibold text-rose-700 block">🚨 Emergency Storm Alerts</span>
                      <span className="text-[11px] text-slate-500">Immediate dispatch upon severe hazard trigger</span>
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
                      <span className="font-semibold text-slate-800 block">🌅 Daily Morning Digest (7 AM)</span>
                      <span className="text-[11px] text-slate-500">Day's max temp, rain probability, hourly chart</span>
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
                      <span className="font-semibold text-emerald-700 block">🌾 Agro-Crop Soil Advisory</span>
                      <span className="text-[11px] text-slate-500">Root-zone moisture, pesticide spray windows</span>
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
                      <span className="font-semibold text-sky-700 block">🌊 Marine & High-Seas</span>
                      <span className="text-[11px] text-slate-500">Wave height, wind swell & squall warnings</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Status: {settings.email.enabled && settings.email.emailAddress ? (
                    <span className="text-emerald-600 font-bold">● Active for {settings.email.emailAddress}</span>
                  ) : (
                    <span className="text-slate-400">Not configured</span>
                  )}
                </span>
                <button
                  onClick={handleTestEmail}
                  disabled={isTesting || !settings.email.emailAddress}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Dispatching...' : 'Send Test Email'}</span>
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
                        Browser Push Status: {pushPermission === 'granted' ? 'GRANTED & ACTIVE' : pushPermission.toUpperCase()}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {pushPermission === 'granted'
                          ? 'Native system notifications will display on your desktop/phone even when tab is minimized.'
                          : 'Click below to allow notification permissions in your browser.'}
                      </p>
                    </div>
                  </div>

                  {pushPermission !== 'granted' && (
                    <button
                      onClick={handleRequestPushPermission}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      Allow Permissions
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
                      <span className="text-xs font-bold text-slate-800 block">Emergency Audio Chime</span>
                      <span className="text-[11px] text-slate-500">Plays distinct two-tone frequencies for severe storms</span>
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
                  Target: {currentLocationName}
                </span>
                <button
                  onClick={handleTestPush}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Send Test Push & Sound</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DISPATCH LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Real-Time Dispatch Activity Stream</span>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center space-x-1 font-semibold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Radio className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p>No alert dispatches yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Dispatched SMS, Email and Push warnings will appear here in real-time.</p>
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
            <span>NWP Ensemble & WAQI Air Hazard Gateway</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
