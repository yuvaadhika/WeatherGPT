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
  ShieldAlert,
  Zap,
  Search,
  RotateCw,
  Compass
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../services/languages';
import { notificationService } from '../services/notificationService';
import { reverseGeocode, getLocalizedPlaceName } from '../services/weatherService';

const POPULAR_TN_DISTRICTS = [
  { name: 'Chennai', ta: 'சென்னை', lat: 13.0827, lon: 80.2707, admin: 'Tamil Nadu' },
  { name: 'Coimbatore', ta: 'கோயம்புத்தூர்', lat: 11.0168, lon: 76.9558, admin: 'Tamil Nadu' },
  { name: 'Madurai', ta: 'மதுரை', lat: 9.9252, lon: 78.1198, admin: 'Tamil Nadu' },
  { name: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி', lat: 10.7905, lon: 78.7047, admin: 'Tamil Nadu' },
  { name: 'Salem', ta: 'சேலம்', lat: 11.6643, lon: 78.1460, admin: 'Tamil Nadu' },
  { name: 'Tirunelveli', ta: 'திருநெல்வேலி', lat: 8.7139, lon: 77.7567, admin: 'Tamil Nadu' },
  { name: 'Erode', ta: 'ஈரோடு', lat: 11.3410, lon: 77.7172, admin: 'Tamil Nadu' },
  { name: 'Vellore', ta: 'வேலூர்', lat: 12.9165, lon: 79.1325, admin: 'Tamil Nadu' },
  { name: 'Thanjavur', ta: 'தஞ்சாவூர்', lat: 10.7870, lon: 79.1378, admin: 'Tamil Nadu' },
  { name: 'Kanyakumari', ta: 'கன்னியாகுமரி', lat: 8.0883, lon: 77.5385, admin: 'Tamil Nadu' },
  { name: 'Tiruppur', ta: 'திருப்பூர்', lat: 11.1085, lon: 77.3411, admin: 'Tamil Nadu' },
  { name: 'Dindigul', ta: 'திண்டுக்கல்', lat: 10.3673, lon: 77.9803, admin: 'Tamil Nadu' },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLocationSpotlight, setShowLocationSpotlight] = useState(false);
  const [locationJustGranted, setLocationJustGranted] = useState(false);

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
          setShowLocationSpotlight(true);
          if (err2.code === 1) {
            setGpsErrorMsg(
              activeLanguage === 'ta'
                ? 'உங்கள் உலாவியில் ஜிபிஎஸ் அனுமதி ஆஃப் செய்யப்பட்டுள்ளது. மேலே உள்ள 🔒 பூட்டு ஐகானைத் தட்டி Location-ஐ "Allow" செய்யவும்:'
                : 'Browser GPS is turned off or blocked. Click the 🔒 lock icon at top-left to Allow Location:'
            );
          } else {
            setGpsErrorMsg(
              activeLanguage === 'ta'
                ? 'ஜிபிஎஸ் சிக்னல் பெற முடியவில்லை. கீழே உள்ள உடனடி வழியைப் பயன்படுத்தி தொடரவும்:'
                : 'Could not acquire GPS fix. Choose any instant option below to proceed:'
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

  // 1-Click Instant Network / IP Location Detector (Bypasses browser GPS block)
  const handleAutoDetectNetwork = async () => {
    setIsRequesting(true);
    setGpsErrorMsg('');
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const ipData = await res.json();
        if (ipData && ipData.latitude && ipData.longitude) {
          const loc = await reverseGeocode(ipData.latitude, ipData.longitude, activeLanguage);
          const finalLoc = loc || {
            name: ipData.city || 'Your Location',
            rawName: ipData.city || 'Your Location',
            admin1: ipData.region || '',
            rawAdmin1: ipData.region || '',
            country: ipData.country_name || 'India',
            rawCountry: ipData.country_name || 'India',
            latitude: ipData.latitude,
            longitude: ipData.longitude,
          };
          try {
            localStorage.setItem('weathergpt_saved_location', JSON.stringify(finalLoc));
          } catch {}
          if (onAllowPermissions) {
            await onAllowPermissions(true, enableAlerts, finalLoc);
          }
          setIsRequesting(false);
          onClose();
          return;
        }
      }
    } catch (err) {
      console.warn('Network location detection error:', err);
    }

    // Default fallback
    const def = {
      name: 'Chennai',
      rawName: 'Chennai',
      admin1: 'Tamil Nadu',
      rawAdmin1: 'Tamil Nadu',
      country: 'India',
      rawCountry: 'India',
      latitude: 13.0827,
      longitude: 80.2707,
    };
    if (onAllowPermissions) {
      await onAllowPermissions(true, enableAlerts, def);
    }
    setIsRequesting(false);
    onClose();
  };

  // 1-Tap Quick Select Place & Proceed to Alerts
  const handleSelectPlace = async (place) => {
    const localizedName = activeLanguage === 'ta' && place.ta ? place.ta : (getLocalizedPlaceName(place.name, activeLanguage) || place.name);
    const finalLoc = {
      name: localizedName,
      rawName: place.name,
      admin1: place.admin || 'Tamil Nadu',
      rawAdmin1: place.admin || 'Tamil Nadu',
      country: 'India',
      rawCountry: 'India',
      latitude: place.lat,
      longitude: place.lon,
    };

    try {
      localStorage.setItem('weathergpt_saved_location', JSON.stringify(finalLoc));
    } catch {}

    if (onAllowPermissions) {
      await onAllowPermissions(true, enableAlerts, finalLoc);
    }
    onClose();
  };

  // Search places
  const handleSearchPlaces = async (query) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${activeLanguage}&format=json`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDismiss = () => {
    if (onSkip) onSkip();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp text-slate-800 max-h-[92vh] flex flex-col">
        {/* Top Gradient Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-500 text-white relative overflow-hidden flex-shrink-0">
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

          <p className="text-xs text-sky-100 mt-2.5 leading-relaxed font-medium">
            {activeLanguage === 'ta'
              ? 'உங்கள் பகுதிக்குரிய துல்லியமான நேரடி மழைப்பொழிவு, புயல் மற்றும் வெள்ள முன்னெச்சரிக்கைகளைப் பெற அனுமதியை இயக்கவும்.'
              : 'Enable GPS & extreme weather alerts to receive hyperlocal forecasts and automated flood/cyclone warnings.'}
          </p>
        </div>

        {/* Content & Permission Toggles (Scrollable) */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 min-h-0">
          {/* Permission 1: GPS Location */}
          <div
            onClick={() => setEnableLocation(!enableLocation)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
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
                  {activeLanguage === 'ta' ? 'துல்லியமான நேரடி இருப்பிடம் (Live Location)' : 'Hyperlocal Live Location'}
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
                  ? 'உங்கள் ஊரின் நேரடி வானிலை மற்றும் டாப்ளர் ரேடார் வரைபடத்தைக் காட்டுகிறது.'
                  : 'Delivers pinpoint local temperature, rain chances, and Doppler radar echoes for your place.'}
              </p>
            </div>
          </div>

          {/* Permission 2: Extreme Weather Alerts */}
          <div
            onClick={() => setEnableAlerts(!enableAlerts)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
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
                  ? 'திடீர் கனமழை, புயல், மின்னல் மற்றும் வெள்ள அபாய எச்சரிக்கைகளை உடனுக்குடன் அனுப்புகிறது.'
                  : 'Sends instant sirens before severe thunderstorms, flash floods, or high winds occur.'}
              </p>
            </div>
          </div>

          {/* Browser Permission Guidance Banner while Requesting */}
          {isRequesting && (
            <div className="p-3.5 rounded-2xl bg-sky-500/10 border-2 border-sky-500/40 text-sky-900 animate-pulse space-y-1.5 text-center">
              <div className="flex items-center justify-center space-x-2 font-black text-xs text-sky-700">
                <Navigation className="w-4 h-4 animate-spin text-sky-600" />
                <span>
                  {activeLanguage === 'ta'
                    ? '1. உங்கள் திரையின் மேலே உள்ள "Allow" பட்டனை அழுத்தவும்'
                    : '1. Tap "Allow" on the browser popup at top'}
                </span>
              </div>
              <p className="text-[11px] text-sky-800 font-medium leading-relaxed">
                {activeLanguage === 'ta'
                  ? 'நேரடி ஜிபிஎஸ் பெற "Allow only for this website" அல்லது "Allow while using site" என்பதைத் தேர்ந்தெடுக்கவும்.'
                  : 'Select "Allow only for this site" or "While using site" to lock onto your live coordinates.'}
              </p>
            </div>
          )}

          {/* ⚡ ACTIVE LOCATION RESOLVER (When location is off or permission was denied) */}
          {(gpsErrorMsg || gpsStatus === 'error') && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 text-slate-800 space-y-3 animate-fadeIn">
              <div className="flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-rose-950">
                    {activeLanguage === 'ta' ? 'இருப்பிடம் ஆஃப் செய்யப்பட்டுள்ளது' : 'Location Permission Denied / Off'}
                  </h5>
                  <p className="text-[11px] text-slate-700 leading-snug mt-0.5">
                    {activeLanguage === 'ta'
                      ? 'கீழே உள்ள ஏதேனும் ஒரு வழியில் உடனடியாக உங்கள் இருப்பிடத்தை ஆன் செய்து அடுத்த எச்சரிக்கை திரைக்கு செல்லலாம்:'
                      : 'Choose any instant access method below to enable location and jump to Alert Setup:'}
                  </p>
                </div>
              </div>

              {/* Action 1: 1-Click Auto-Detect via Network (Instant & No block) */}
              <button
                type="button"
                onClick={handleAutoDetectNetwork}
                disabled={isRequesting}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-sky-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {activeLanguage === 'ta'
                    ? '⚡ நேரடி இருப்பிடத்தை உடனே இயக்கு (Auto-Detect Live)'
                    : '⚡ Instant Auto-Detect Live Location & Proceed'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Action 2: Retry Browser GPS */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleGrant}
                  className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCw className="w-3.5 h-3.5 text-sky-600" />
                  <span>{activeLanguage === 'ta' ? '🔄 ஜிபிஎஸ் அனுமதி மீண்டும் கேள்' : '🔄 Retry Browser GPS'}</span>
                </button>
              </div>

              {/* Action 3: Quick 1-Tap Popular Districts */}
              <div className="pt-1 space-y-1.5 border-t border-amber-200/60">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>{activeLanguage === 'ta' ? '📍 அல்லது உங்கள் மாவட்டத்தை 1-கிளிக் செய்யவும்:' : '📍 Or select your district (1-tap):'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-0.5">
                  {POPULAR_TN_DISTRICTS.map((dist) => (
                    <button
                      key={dist.name}
                      type="button"
                      onClick={() => handleSelectPlace(dist)}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-sky-600 hover:text-white border border-sky-200 text-slate-800 text-[11px] font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                    >
                      {activeLanguage === 'ta' ? dist.ta : dist.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action 4: Quick Search Any City / Village */}
              <div className="relative pt-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchPlaces(e.target.value)}
                    placeholder={activeLanguage === 'ta' ? 'உங்கள் ஊரின் பெயரை தட்டச்சு செய்க...' : 'Search your town / village...'}
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 divide-y divide-slate-100 max-h-36 overflow-y-auto">
                    {searchResults.map((item) => (
                      <button
                        key={`${item.id}-${item.latitude}`}
                        type="button"
                        onClick={() => handleSelectPlace({ name: item.name, lat: item.latitude, lon: item.longitude, admin: item.admin1 })}
                        className="w-full px-3 py-2 text-left hover:bg-sky-50 text-xs flex items-center justify-between text-slate-800 cursor-pointer"
                      >
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className="text-[10px] text-slate-500">{item.admin1 || item.country}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                ? 'உங்கள் இருப்பிடத் தகவல்கள் சேமிக்கப்படாது, நேரடி வானிலை தகவலுக்கு மட்டுமே பயன்படும்.'
                : 'No tracking. Weather calculations happen directly on-device.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center space-x-2 flex-shrink-0">
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

      {/* 🚀 FULLSCREEN BLINKING LOCATION SPOTLIGHT OVERLAY */}
      {showLocationSpotlight && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex flex-col items-start justify-start p-3 sm:p-6 text-white animate-fadeIn overflow-y-auto">
          {/* Top Pointer Beam Pointing Directly UP to Browser Address Bar */}
          <div className="w-full flex flex-col items-start relative animate-bounce mt-1 sm:mt-2">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-300 font-black text-xs sm:text-sm">
              <span className="text-xl animate-ping">⬆️</span>
              <span className="text-xl">🔒</span>
              <span>
                {activeLanguage === 'ta'
                  ? '1. மேலே உள்ள பிரவுசர் முகவரிப் பட்டியில் 🔒 ஐகானை அழுத்தவும்'
                  : '1. Click the 🔒 Lock Icon in your Address Bar at the top'}
              </span>
            </div>
            {/* Animated Light Beam */}
            <div className="ml-8 w-1 h-8 bg-gradient-to-b from-amber-400 to-transparent"></div>
          </div>

          {/* Central Animated Interactive Guide Card */}
          <div className="self-center bg-slate-900/95 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 max-w-md w-full mt-3 shadow-2xl space-y-4 text-center">
            {/* Blinking Target Beacon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center animate-pulse shadow-lg">
              <Compass className="w-7 h-7 animate-spin" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                {activeLanguage === 'ta'
                  ? 'பிரவுசர் அமைப்புகளில் இருப்பிடத்தை (Location) ஆன் செய்யவும்'
                  : 'Enable Location in Browser Settings'}
              </h3>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                {activeLanguage === 'ta'
                  ? 'பிரவுசரின் மேல் இடது மூலையில் உள்ள 🔒 ஐகானைக் கிளிக் செய்து "Location" என்பதை "Allow" செய்யவும்.'
                  : 'Click the 🔒 lock icon at top-left of the URL bar and change Location to "Allow".'}
              </p>
            </div>

            {/* Simulated Setting Mockup */}
            <div className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700 space-y-2 text-left shadow-inner font-mono text-xs">
              <div className="flex items-center space-x-2 text-slate-400 text-[11px] pb-1 border-b border-slate-700">
                <span>🔒 Site Permissions</span>
                <span className="text-amber-400 font-sans ml-auto font-bold animate-pulse">👈 Select Here</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2 font-sans font-semibold text-slate-200">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Location</span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-black text-xs animate-pulse">
                  <span>ALLOW</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGrant}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-white font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 cursor-pointer transition-all animate-pulse"
              >
                <RotateCw className="w-4 h-4" />
                <span>
                  {activeLanguage === 'ta'
                    ? '🔄 ஆன் செய்துவிட்டேன் - மீண்டும் ஜிபிஎஸ் இயக்கு'
                    : '🔄 I Enabled It - Retry Live GPS'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleAutoDetectNetwork}
                className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {activeLanguage === 'ta'
                    ? '⚡ நெட்வொர்க் மூலம் நேரடி இடத்தை இயக்கு (Auto-Detect)'
                    : '⚡ Auto-Detect Location (Network/WiFi)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowLocationSpotlight(false)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                {activeLanguage === 'ta' ? 'மூடு (Close)' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
