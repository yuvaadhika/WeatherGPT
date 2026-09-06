import React, { useState } from 'react';
import {
  MapPin,
  Bell,
  BellRing,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  X,
  Globe,
  Radio,
  Navigation,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../services/languages';
import { notificationService } from '../services/notificationService';
import { reverseGeocode } from '../services/weatherService';

export default function OnboardingPermissionModal({
  isOpen,
  onClose,
  activeLanguage = 'en',
  setActiveLanguage,
  onAllowPermissions,
  onSkip
}) {
  const [enableLocation, setEnableLocation] = useState(true);
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(''); // 'prompting' | 'resolving' | 'error' | ''
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');

  if (!isOpen) return null;

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  const requestGpsPosition = (options) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation not supported'));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const handleGrant = async () => {
    setIsRequesting(true);
    setGpsErrorMsg('');
    setGpsStatus('prompting');

    if (enableLocation && typeof window !== 'undefined' && navigator.geolocation) {
      let position = null;
      try {
        // Stage 1: High accuracy GPS lock (12s timeout)
        position = await requestGpsPosition({
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        });
      } catch (err1) {
        console.warn('High accuracy GPS timed out, trying standard network location...', err1);
        try {
          // Stage 2: Standard cellular / WiFi triangulation fallback (8s timeout)
          position = await requestGpsPosition({
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 120000,
          });
        } catch (err2) {
          console.warn('Geolocation failed or denied:', err2);
          setGpsStatus('error');
          if (err2.code === 1) {
            setGpsErrorMsg(
              activeLanguage === 'ta'
                ? 'உங்கள் உலாவியில் இருப்பிட அனுமதி நிராகரிக்கப்பட்டுள்ளது. முகவரிப் பட்டியில் உள்ள 🔒 ஐகானைத் தட்டி "Allow Location" செய்யவும்.'
                : 'Location permission was denied in your browser. Click the 🔒 lock icon in the address bar to Allow Location.'
            );
          } else {
            setGpsErrorMsg(
              activeLanguage === 'ta'
                ? 'ஜிபிஎஸ் சிக்னல் பெற முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
                : 'Could not acquire GPS fix. Please ensure device location is turned ON.'
            );
          }
          setIsRequesting(false);
          return;
        }
      }

      if (position && position.coords) {
        setGpsStatus('resolving');
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        let resolvedLoc = null;

        try {
          resolvedLoc = await reverseGeocode(lat, lon, activeLanguage);
        } catch (e) {
          console.warn('Geocoding error:', e);
        }

        const finalLoc = resolvedLoc || {
          name: 'Live GPS Location',
          rawName: 'Live GPS Location',
          admin1: '',
          rawAdmin1: '',
          country: 'India',
          rawCountry: 'India',
          latitude: lat,
          longitude: lon,
        };

        try {
          localStorage.setItem('weathergpt_saved_location', JSON.stringify(finalLoc));
        } catch {}

        if (onAllowPermissions) {
          await onAllowPermissions(true, enableAlerts, finalLoc);
        }
        setIsRequesting(false);
        onClose();
      }
    } else {
      if (onAllowPermissions) {
        await onAllowPermissions(enableLocation, enableAlerts);
      }
      setIsRequesting(false);
      onClose();
    }
  };

  const handleDismiss = () => {
    if (onSkip) onSkip();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp text-slate-800">
        {/* Top Gradient Banner */}
        <div className="p-5 bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-500 text-white relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Navigation className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  WeatherGPT AI • SIH 2026
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  {activeLanguage === 'ta' ? 'வானிலை & எச்சரிக்கை அனுமதி' : 'Enable Live Weather & Alerts'}
                </h3>
              </div>
            </div>

            {/* Language Switcher in Modal */}
            <div className="flex items-center space-x-1 bg-black/20 backdrop-blur-md px-2 py-1 rounded-xl border border-white/20">
              <Globe className="w-3.5 h-3.5 text-sky-200" />
              <select
                value={activeLanguage}
                onChange={(e) => setActiveLanguage && setActiveLanguage(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-white focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-sky-100 mt-3 leading-relaxed font-medium">
            {activeLanguage === 'ta'
              ? 'உங்கள் பகுதிக்குரிய துல்லியமான நேரடி மழைப்பொழிவு, புயல் மற்றும் வெள்ள முன்னெச்சரிக்கைகளைப் பெற அனுமதிகளை இயக்கவும்.'
              : 'Enable GPS & extreme weather alerts to receive hyperlocal forecasts and automated flood/cyclone warnings.'}
          </p>
        </div>

        {/* Content & Permission Toggles */}
        <div className="p-5 space-y-4">
          {/* Permission 1: GPS Location */}
          <div
            onClick={() => setEnableLocation(!enableLocation)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
              enableLocation
                ? 'bg-sky-50/80 border-sky-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${enableLocation ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">
                  {activeLanguage === 'ta' ? 'துல்லியமான ஜிபிஎஸ் இருப்பிடம் (GPS Location)' : 'Hyperlocal GPS Location'}
                </h4>
                <input
                  type="checkbox"
                  checked={enableLocation}
                  onChange={() => {}}
                  className="h-4 w-4 rounded accent-sky-600 pointer-events-none"
                />
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                {activeLanguage === 'ta'
                  ? 'உங்கள் கிராமம்/நகரத்தின் நேரடி வானிலை மற்றும் டாப்ளர் ரேடார் வரைபடத்தைக் காட்டுகிறது.'
                  : 'Delivers pinpoint local temperature, rain chances, and Doppler radar echoes for your exact village/city.'}
              </p>
            </div>
          </div>

          {/* Permission 2: Extreme Weather Alerts */}
          <div
            onClick={() => setEnableAlerts(!enableAlerts)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
              enableAlerts
                ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${enableAlerts ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <BellRing className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">
                  {activeLanguage === 'ta' ? 'தீவிர பேரிடர் & புயல் எச்சரிக்கைகள் (Alerts)' : 'Live Disaster & Cyclone Alerts'}
                </h4>
                <input
                  type="checkbox"
                  checked={enableAlerts}
                  onChange={() => {}}
                  className="h-4 w-4 rounded accent-rose-600 pointer-events-none"
                />
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                {activeLanguage === 'ta'
                  ? 'திடீர் கனமழை, சூறாவளி காற்று மற்றும் வெள்ள அபாய எச்சரிக்கை அறிவிப்புகளை உடனுக்குடன் அனுப்புகிறது.'
                  : 'Sends instant browser & push sirens before severe thunderstorms, flash floods, or high winds occur.'}
              </p>
            </div>
          </div>

          {/* Browser Permission Guidance Banner while Requesting */}
          {isRequesting && (
            <div className="p-3.5 rounded-2xl bg-sky-500/10 border-2 border-sky-500/40 text-sky-900 animate-pulse space-y-1 text-center">
              <div className="flex items-center justify-center space-x-2 font-black text-xs text-sky-700">
                <Navigation className="w-4 h-4 animate-spin text-sky-600" />
                <span>
                  {activeLanguage === 'ta'
                    ? '1. உங்கள் திரையின் மேலே உள்ள "Allow" பட்டனை அழுத்தவும்'
                    : '1. Tap "Allow" on the browser popup at top'}
                </span>
              </div>
              <p className="text-[11px] text-sky-800 font-medium">
                {activeLanguage === 'ta'
                  ? 'நேரடி ஜிபிஎஸ் வானிலை பெற "Allow only for this website" என்பதைத் தேர்ந்தெடுக்கவும்.'
                  : 'Select "Allow only for this site" or "While using site" to lock onto your live coordinates.'}
              </p>
            </div>
          )}

          {/* Error / Denied Diagnostic Banner */}
          {gpsErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">{gpsErrorMsg}</p>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleGrant}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {activeLanguage === 'ta' ? '🔄 மீண்டும் முயற்சி செய்' : '🔄 Retry GPS'}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-slate-700 text-xs font-medium hover:bg-rose-50 transition-all cursor-pointer"
                >
                  {activeLanguage === 'ta' ? 'இயல்பு நிலையில் தொடரவும்' : 'Continue with Default'}
                </button>
              </div>
            </div>
          )}

          {/* Highlights */}
          <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{activeLanguage === 'ta' ? '100% இலவசம் & உங்கள் தனியுரிமை பாதுகாப்பானது' : '100% Free & Privacy Focused'}</span>
            </div>
            <p className="text-[10px] text-slate-400 pl-5 leading-tight">
              {activeLanguage === 'ta'
                ? 'உங்கள் இருப்பிடத் தகவல்கள் சேமிக்கப்படாது, வானிலை தகவலுக்கு மட்டுமே பயன்படும்.'
                : 'No tracking. Telemetry calculations happen directly on-device.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center space-x-2">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            {activeLanguage === 'ta' ? 'பிறகு செய்' : 'Maybe Later'}
          </button>

          <button
            onClick={handleGrant}
            disabled={isRequesting}
            className="flex-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-sky-600/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>
              {isRequesting
                ? activeLanguage === 'ta'
                  ? 'ஜிபிஎஸ் இணைக்கிறது...'
                  : 'Acquiring GPS...'
                : activeLanguage === 'ta'
                ? 'அனுமதித்து தொடங்கவும்'
                : 'Allow & Get Live Weather'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
