import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WeatherAlertBanner from './components/WeatherAlertBanner';
import MobileDashboard from './components/MobileDashboard';
import BottomNavBar from './components/BottomNavBar';
import ImpactRiskEngineModal from './components/ImpactRiskEngineModal';
import EarlyWarningsView from './components/EarlyWarningsView';
import ChatInterface from './components/ChatInterface';
import WeatherRadarMap from './components/WeatherRadarMap';
import DecisionSupportModes from './components/DecisionSupportModes';
import ClimateAnalyticsChart from './components/ClimateAnalyticsChart';
import AuthScreen from './components/AuthScreen';
import ReportExportModal from './components/ReportExportModal';
import AlertNotificationModal from './components/AlertNotificationModal';
import OnboardingPermissionModal from './components/OnboardingPermissionModal';
import AlphabeticalLocationModal from './components/AlphabeticalLocationModal';
import RouteWeatherPlanner from './components/RouteWeatherPlanner';
import EventWeatherScore from './components/EventWeatherScore';
import CommunityWeatherSpotter from './components/CommunityWeatherSpotter';
import DisasterEmergencySOS from './components/DisasterEmergencySOS';
import AdminUserRegistryModal from './components/AdminUserRegistryModal';
import EmergencyNetworkBanner from './components/EmergencyNetworkBanner';
import {
  fetchNWPForecast,
  fetchAirQuality,
  evaluateSevereWeatherAlerts,
  calculateImpactRiskScore,
  reverseGeocode,
  getWeatherDescription,
  getLocalizedPlaceName
} from './services/weatherService';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from './services/languages';
import {
  MessageSquare,
  Radio,
  Briefcase,
  TrendingUp,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  ShieldAlert,
  MapPin,
  Sparkles,
  CloudRain,
  Eye,
  Menu,
  X,
  Wheat,
  Plane,
  Anchor,
  Building2,
  Download,
  PlusCircle,
  ChevronLeft,
  Globe,
  Bell,
  BellRing,
  Activity,
  Layers,
  Home,
  Mic,
  Navigation,
  Heart,
  Users,
  Cpu,
  LogOut
} from 'lucide-react';
import { notificationService } from './services/notificationService';
import { userRegistryService } from './services/userRegistryService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('weathergpt_auth_user') || sessionStorage.getItem('weathergpt_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeLanguage, setActiveLanguage] = useState('en');
  const [activeView, setActiveView] = useState('home'); // 'home' | 'radar' | 'alerts' | 'chat' | 'decision' | 'climate' | 'route' | 'event' | 'spotter' | 'sos'
  const [activeSector, setActiveSector] = useState('agriculture');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isXaiOpen, setIsXaiOpen] = useState(false);

  const [currentLocation, setCurrentLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('weathergpt_saved_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.latitude && parsed.longitude) return parsed;
      }
    } catch {}
    return {
      name: 'Chennai',
      specificPlace: '',
      district: 'Chennai',
      rawName: 'Chennai',
      rawSpecificPlace: '',
      rawDistrict: 'Chennai',
      admin1: 'Tamil Nadu',
      rawAdmin1: 'Tamil Nadu',
      country: 'India',
      rawCountry: 'India',
      latitude: 13.0827,
      longitude: 80.2707,
    };
  });

  const [weatherData, setWeatherData] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportReportParams, setExportReportParams] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return localStorage.getItem('weather_onboarding_shown') !== 'true';
  });
  const [initialChatQuery, setInitialChatQuery] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => notificationService.hasAnyChannelActive());

  // Automatically register and sync any friend / user who opens the link
  useEffect(() => {
    userRegistryService.autoRegisterVisitor(currentUser, currentLocation);
  }, [currentUser, currentLocation?.name]);

  const handleSignOut = () => {
    localStorage.removeItem('weathergpt_auth_user');
    sessionStorage.removeItem('weathergpt_auth_user');
    setCurrentUser(null);
  };

  const handleToggleNotifications = async () => {
    setIsAlertModalOpen(true);
  };

  const handleAllowPermissions = async (allowLocation, allowAlerts, resolvedLoc) => {
    localStorage.setItem('weather_onboarding_shown', 'true');
    setIsOnboardingOpen(false);

    if (resolvedLoc && resolvedLoc.latitude && resolvedLoc.longitude) {
      setCurrentLocation(resolvedLoc);
      try {
        localStorage.setItem('weathergpt_saved_location', JSON.stringify(resolvedLoc));
      } catch {}
    } else if (allowLocation) {
      detectUserLocation(activeLanguage);
    }

    if (allowAlerts) {
      setNotificationsEnabled(true);
      try {
        await notificationService.requestBrowserPermission();
      } catch {}
      notificationService.sendTestAlert(resolvedLoc?.name || currentLocation?.name || 'Your Location');
      setIsAlertModalOpen(true);
    }
  };

  // Multi-channel weather alerts when severe alert is detected
  useEffect(() => {
    if (alerts && alerts.length > 0 && notificationsEnabled) {
      const severeAlert = alerts.find((a) => a.level === 'red' || a.level === 'orange');
      if (severeAlert) {
        notificationService.sendMultiChannelAlert(severeAlert, currentLocation.name || 'Your Location');
      }
    }
  }, [alerts, notificationsEnabled, currentLocation]);

  const getInitialWelcome = (lang) => {
    const currentT = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return [
      {
        id: 'welcome-1',
        sender: 'ai',
        text: currentT?.chat?.welcomeGreeting || TRANSLATIONS.en.chat.welcomeGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  };

  const [chatMessages, setChatMessages] = useState(() => getInitialWelcome(activeLanguage));

  useEffect(() => {
    setChatMessages((prev) => {
      const hasUserMessage = prev.some((m) => m.sender === 'user');
      if (!hasUserMessage) {
        return getInitialWelcome(activeLanguage);
      }
      return prev;
    });
  }, [activeLanguage]);

  const handleNewChat = () => {
    setChatMessages(getInitialWelcome(activeLanguage));
    setActiveView('chat');
    setInitialChatQuery('');
    setSidebarOpen(false);
  };

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  const [isLocating, setIsLocating] = useState(false);

  const detectUserLocation = (lang) => {
    const targetLang = typeof lang === 'string' && lang ? lang : activeLanguage;
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);

      const handleSuccess = async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const loc = await reverseGeocode(lat, lon, targetLang);
          const finalLoc = loc && loc.name ? loc : {
            name: 'Live GPS Location',
            specificPlace: '',
            district: '',
            rawName: 'Live GPS Location',
            rawSpecificPlace: '',
            rawDistrict: '',
            admin1: 'Tamil Nadu',
            rawAdmin1: 'Tamil Nadu',
            country: 'India',
            rawCountry: 'India',
            latitude: lat,
            longitude: lon,
          };
          setCurrentLocation(finalLoc);
          try {
            localStorage.setItem('weathergpt_saved_location', JSON.stringify(finalLoc));
          } catch {}
        } catch (e) {
          console.warn('Reverse geocode error:', e);
        } finally {
          setIsLocating(false);
        }
      };

      const handleError = (err) => {
        console.warn('High-accuracy GPS fix failed or timed out, trying standard positioning...', err);
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (err2) => {
            console.warn('Standard GPS failed:', err2);
            setIsLocating(false);
            // If we already have a saved location, keep it!
            try {
              const saved = localStorage.getItem('weathergpt_saved_location');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.latitude) {
                  setCurrentLocation(parsed);
                  return;
                }
              }
            } catch {}
            // Last resort IP fallback
            fetch('https://ipapi.co/json/')
              .then((res) => res.json())
              .then(async (ipData) => {
                if (ipData && ipData.latitude && ipData.longitude) {
                  const loc = await reverseGeocode(ipData.latitude, ipData.longitude, targetLang);
                  if (loc) {
                    setCurrentLocation(loc);
                  }
                }
              })
              .catch(console.warn);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      };

      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('weathergpt_saved_location');
    if (!saved) {
      detectUserLocation(activeLanguage);
    }
  }, []);

  // Update localized city & specific locality names on language switch
  useEffect(() => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      const raw = currentLocation.rawName || currentLocation.name || 'Chennai';
      const rawSpec = currentLocation.rawSpecificPlace || currentLocation.specificPlace || '';
      const rawDist = currentLocation.rawDistrict || currentLocation.district || '';
      const rawAdm = currentLocation.rawAdmin1 || currentLocation.admin1 || 'Tamil Nadu';
      const rawCnt = currentLocation.rawCountry || currentLocation.country || 'India';

      const localName = getLocalizedPlaceName(raw, activeLanguage) || currentLocation.name;
      const localSpec = rawSpec ? rawSpec.split(', ').map(s => getLocalizedPlaceName(s, activeLanguage) || s).join(', ') : '';
      const localDist = rawDist ? (getLocalizedPlaceName(rawDist, activeLanguage) || rawDist) : '';
      const localState = getLocalizedPlaceName(rawAdm, activeLanguage) || currentLocation.admin1;
      const localCountry = getLocalizedPlaceName(rawCnt, activeLanguage) || currentLocation.country;

      setCurrentLocation((prev) => ({
        ...prev,
        name: localName,
        specificPlace: localSpec,
        district: localDist,
        admin1: localState,
        country: localCountry,
        rawName: raw,
        rawSpecificPlace: rawSpec,
        rawDistrict: rawDist,
        rawAdmin1: rawAdm,
        rawCountry: rawCnt,
      }));

      reverseGeocode(currentLocation.latitude, currentLocation.longitude, activeLanguage)
        .then((loc) => {
          if (loc && loc.name) {
            setCurrentLocation((prev) => ({
              ...prev,
              name: loc.name,
              specificPlace: loc.specificPlace || prev.specificPlace,
              district: loc.district || prev.district,
              admin1: loc.admin1,
              country: loc.country,
              rawName: loc.rawName || prev.rawName,
              rawSpecificPlace: loc.rawSpecificPlace || prev.rawSpecificPlace,
              rawDistrict: loc.rawDistrict || prev.rawDistrict,
              rawAdmin1: loc.rawAdmin1 || prev.rawAdmin1,
              rawCountry: loc.rawCountry || prev.rawCountry,
            }));
          }
        })
        .catch(console.warn);
    }
  }, [activeLanguage]);

  useEffect(() => {
    let isMounted = true;
    const loadWeatherData = async () => {
      setIsLoadingWeather(true);
      try {
        const [nwp, aqi] = await Promise.all([
          fetchNWPForecast(currentLocation.latitude, currentLocation.longitude),
          fetchAirQuality(currentLocation.latitude, currentLocation.longitude),
        ]);

        if (!isMounted) return;
        setWeatherData(nwp);
        setAqiData(aqi);

        const computedAlerts = evaluateSevereWeatherAlerts(nwp, aqi, activeLanguage);
        setAlerts(computedAlerts);

        const computedRisk = calculateImpactRiskScore(nwp, aqi, activeLanguage);
        setRiskData(computedRisk);

        // Run autonomous predictive before-awareness alert engine
        notificationService.predictEarlyHazardAndNotify(nwp, aqi, currentLocation.name, activeLanguage);
      } catch (err) {
        console.error('Failed to load weather data:', err);
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    };

    loadWeatherData();
    return () => {
      isMounted = false;
    };
  }, [currentLocation]);

  useEffect(() => {
    if (weatherData && aqiData) {
      const recomputedAlerts = evaluateSevereWeatherAlerts(weatherData, aqiData, activeLanguage);
      setAlerts(recomputedAlerts);
      const recomputedRisk = calculateImpactRiskScore(weatherData, aqiData, activeLanguage);
      setRiskData(recomputedRisk);

      // Autonomous predictive check on language switch / data update
      notificationService.predictEarlyHazardAndNotify(weatherData, aqiData, currentLocation.name, activeLanguage);
    }
  }, [activeLanguage, weatherData, aqiData]);

  const severeAlerts = (alerts || []).filter((a) => a.level === 'red' || a.level === 'orange' || a.level === 'yellow');
  const topAlert = severeAlerts.length > 0 ? severeAlerts[0] : null;

  const handlePromptChat = (query) => {
    setActiveView('chat');
    setInitialChatQuery(query);
    setSidebarOpen(false);
  };

  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={(user) => {
          setCurrentUser(user);
          setIsOnboardingOpen(true);
        }}
        activeLanguage={activeLanguage}
        setActiveLanguage={setActiveLanguage}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex bg-gradient-to-b from-[#eef6fc] via-[#f2f8fe] to-[#e8f4fd] text-slate-800 overflow-hidden font-sans">
      {/* 1. Desktop Left Sidebar (Visible on Tablet/Desktop, Drawer on Mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#f8fbff]/95 backdrop-blur-xl border-r border-sky-100 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-sky-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="px-2.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-black tracking-wider uppercase">
                WeatherGPT
              </div>
              <div>
                <span className="text-[10px] text-sky-600 font-bold tracking-wide block">
                  {t.sidebar?.liveWeatherRadar || 'Live Weather & Radar'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Query / Clear Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full mt-4 py-2.5 px-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.sidebar?.newWeatherSearch || 'New Weather Search'}</span>
          </button>
        </div>

        {/* Navigation & Suite Shortcuts */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Main Navigation Views */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              {t.sidebar?.weatherStudio || 'Weather Studio'}
            </div>

            {/* 1. Home Dashboard */}
            <button
              onClick={() => {
                setActiveView('home');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'home'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Home className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'முகப்பு டாஷ்போர்டு' : 'Home Dashboard'}</span>
            </button>

            {/* 2. Forecast & Assistant */}
            <button
              onClick={() => {
                setActiveView('chat');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'chat'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span>{t.sidebar?.forecastAssistant || 'Forecast & AI Chatbot'}</span>
            </button>

            {/* 3. Live Doppler Radar Map */}
            <button
              onClick={() => {
                setActiveView('radar');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'radar'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>{t.sidebar?.liveRadarMap || 'Live Doppler Radar Map'}</span>
            </button>

            {/* 4. Early Warnings & Disaster Hub */}
            <button
              onClick={() => {
                setActiveView('alerts');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'alerts'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>{activeLanguage === 'ta' ? 'முன்னெச்சரிக்கை மையம்' : 'Early Warnings & Alerts'}</span>
              {alerts.length > 0 && (
                <span className="ml-auto px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* 5. Climate Trends */}
            <button
              onClick={() => {
                setActiveView('climate');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'climate'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>{t.sidebar?.climateTrends || 'Climate & 7-Day Trends'}</span>
            </button>
          </div>

          {/* AI INNOVATION TOOLS SECTION */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider px-2.5 mb-1.5 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{activeLanguage === 'ta' ? 'புதிய கண்டுபிடிப்புகள்' : 'AI Innovation Suite'}</span>
            </div>

            {/* Tool 1: Route Planner */}
            <button
              onClick={() => {
                setActiveView('route');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'route'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'பயணப் பாதை வானிலை' : 'Route Weather Planner'}</span>
            </button>

            {/* Tool 2: Event & Wedding Score */}
            <button
              onClick={() => {
                setActiveView('event');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'event'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500" />
              <span>{activeLanguage === 'ta' ? 'சுபகாரிய விழா கணிப்பு' : 'Event & Wedding Score'}</span>
            </button>

            {/* Tool 3: Community Spotter */}
            <button
              onClick={() => {
                setActiveView('spotter');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'spotter'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>{activeLanguage === 'ta' ? 'மக்கள் நேரடி சமூகம்' : 'Community Sky Spotter'}</span>
            </button>

            {/* Tool 4: Emergency SOS */}
            <button
              onClick={() => {
                setActiveView('sos');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'sos'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300 font-bold'
                  : 'text-rose-600 hover:bg-rose-50 hover:text-rose-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>{activeLanguage === 'ta' ? 'புயல் வெள்ள SOS மையம்' : 'Disaster SOS & Alerts'}</span>
            </button>
          </div>

          {/* Decision Support Suites */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              {t.sidebar?.sectorAdvisories || 'Sector Advisories'}
            </div>
            {[
              { id: 'agriculture', label: t.sidebar?.agriculture || 'Farmers & Agriculture', icon: Wheat },
              { id: 'aviation', label: t.sidebar?.aviation || 'Aviation METAR / TAF', icon: Plane },
              { id: 'marine', label: t.sidebar?.marine || 'Marine & Fishermen', icon: Anchor },
              { id: 'smartCity', label: t.sidebar?.smartCity || 'Smart City & Disaster', icon: Building2 },
            ].map((s) => {
              const Icon = s.icon;
              const isSelected = activeView === 'decision' && activeSector === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSector(s.id);
                    setActiveView('decision');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Explainable AI Banner */}
          <div
            onClick={() => setIsXaiOpen(true)}
            className="p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50/60 border border-sky-200 text-xs space-y-1.5 cursor-pointer hover:border-sky-300 transition-all shadow-xs"
          >
            <div className="font-bold text-sky-900 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'விளக்கக்கூடிய AI (XAI)' : 'Explainable AI Engine'}</span>
            </div>
            <p className="text-[10px] text-sky-800 leading-relaxed">
              {activeLanguage === 'ta'
                ? `தற்போதைய இடர் குறியீடு: ${riskData?.score || 75}/100. காரணிகளை அறிய கிளிக் செய்யவும்.`
                : `Current Hazard Risk: ${riskData?.score || 75}/100. Click to inspect XAI factor decomposition.`}
            </p>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-sky-100 space-y-2 bg-sky-50/50">
          {/* 10 Languages Selector */}
          <div className="flex items-center space-x-2 bg-white/90 border border-sky-200/70 rounded-2xl px-2.5 py-1.5 shadow-2xs">
            <Globe className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <select
              value={activeLanguage}
              onChange={(e) => setActiveLanguage(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white text-slate-800">
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExportOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-white/90 hover:bg-white border border-sky-200/70 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer hover:border-sky-300"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>{t.sidebar?.bulletin || 'Export Weather Bulletin'}</span>
            </button>
          </div>

          {/* User Account & Sign Out in Sidebar */}
          {currentUser && (
            <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser.email || 'Member'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                title={activeLanguage === 'ta' ? 'வெளியேறு (Sign Out)' : 'Sign Out'}
                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer flex-shrink-0 flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        {/* Emergency Network / Tower Signal Outage Monitor & Auto-Disappearing Banner */}
        <EmergencyNetworkBanner
          activeLanguage={activeLanguage}
          onOpenSOS={() => setActiveView('sos')}
        />

        {/* Top Navbar */}
        <Header
          activeLanguage={activeLanguage}
          setActiveLanguage={setActiveLanguage}
          currentLocation={currentLocation}
          onSelectLocation={(loc) => setCurrentLocation(loc)}
          onOpenExport={() => setIsExportOpen(true)}
          topAlert={topAlert}
          onDetectLocation={detectUserLocation}
          isLocating={isLocating}
          onOpenSidebar={() => setSidebarOpen(true)}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
          onTestNotification={() => notificationService.sendTestAlert(currentLocation.name)}
          onOpenAlertModal={() => setIsAlertModalOpen(true)}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onOpenAdminDatabase={() => setIsAdminModalOpen(true)}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />

        {/* View Content Area */}
        <div className={`flex-1 flex flex-col max-w-5xl w-full mx-auto relative min-h-0 ${activeView === 'chat' ? 'overflow-hidden px-1 sm:px-4 pt-1 sm:pt-4 h-full' : 'overflow-y-auto p-2 sm:p-4 md:p-5 pb-6'}`}>
          {/* Active Hazard Early Warning Banner (on non-home screens) */}
          {activeView !== 'home' && activeView !== 'chat' && (
            <WeatherAlertBanner
              activeLanguage={activeLanguage}
              alerts={alerts}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
              onOpenAlertModal={() => setIsAlertModalOpen(true)}
            />
          )}

          {/* VIEW 1: Modern Mobile Dashboard (Default Showcase) */}
          {activeView === 'home' && (
            <MobileDashboard
              activeLanguage={activeLanguage}
              currentLocation={currentLocation}
              weatherData={weatherData}
              aqiData={aqiData}
              alerts={alerts}
              riskData={riskData}
              onOpenRadar={() => setActiveView('radar')}
              onOpenChat={() => setActiveView('chat')}
              onOpenAlerts={() => setActiveView('alerts')}
              onOpenXAI={() => setIsXaiOpen(true)}
              onOpenAlertModal={() => setIsAlertModalOpen(true)}
              onDetectLocation={detectUserLocation}
              isLocating={isLocating}
              onSelectCity={(city) => setCurrentLocation(city)}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
              onOpenRoutePlanner={() => setActiveView('route')}
              onOpenEventScore={() => setActiveView('event')}
              onOpenSpotter={() => setActiveView('spotter')}
              onOpenEmergencySOS={() => setActiveView('sos')}
              notificationsEnabled={notificationsEnabled}
            />
          )}

          {/* VIEW 2: Clean AI Chat (Preserved state across navigation) */}
          <div className={activeView === 'chat' ? 'flex-1 flex flex-col min-h-0 h-full overflow-hidden' : 'hidden'}>
            <ChatInterface
              activeLanguage={activeLanguage}
              currentLocation={currentLocation}
              onLocationFound={(loc) => setCurrentLocation(loc)}
              initialQuery={initialChatQuery}
              onClearInitialQuery={() => setInitialChatQuery('')}
              weatherData={weatherData}
              aqiData={aqiData}
              messages={chatMessages}
              setMessages={setChatMessages}
              onOpenRadar={() => setActiveView('radar')}
              onOpenDecision={(sec) => {
                setActiveSector(sec || 'agriculture');
                setActiveView('decision');
              }}
              onOpenExport={(msg) => {
                setExportReportParams(msg);
                setIsExportOpen(true);
              }}
            />
          </div>

          {/* VIEW 3: Early Warnings & Disaster Command Center */}
          {activeView === 'alerts' && (
            <EarlyWarningsView
              activeLanguage={activeLanguage}
              alerts={alerts}
              riskData={riskData}
              currentLocation={currentLocation}
              weatherData={weatherData}
              onOpenXAI={() => setIsXaiOpen(true)}
              onOpenAlertModal={() => setIsAlertModalOpen(true)}
              notificationsEnabled={notificationsEnabled}
            />
          )}

          {/* VIEW 4: Specialized Live GIS Radar */}
          {activeView === 'radar' && (
            <div className="space-y-3 pb-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('home')}
                  className="flex items-center space-x-1.5 text-xs text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{activeLanguage === 'ta' ? 'முகப்புக்குச் செல்' : 'Back to Home'}</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {t.radar?.subtitle || 'Live Satellite & Radar Stream'}
                </span>
              </div>
              <WeatherRadarMap
                activeLanguage={activeLanguage}
                currentLocation={currentLocation}
                weatherData={weatherData}
                alerts={alerts}
              />
            </div>
          )}

          {/* VIEW 5: Decision Support Suites (Agriculture, Marine, Aviation, Smart City) */}
          {activeView === 'decision' && (
            <div className="space-y-3 pb-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('home')}
                  className="flex items-center space-x-1.5 text-xs text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{activeLanguage === 'ta' ? 'முகப்புக்குச் செல்' : 'Back to Home'}</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {t.decision?.decisionTitle || 'Decision Support Advisory'}
                </span>
              </div>
              <DecisionSupportModes
                activeLanguage={activeLanguage}
                currentLocation={currentLocation}
                weatherData={weatherData}
                aqiData={aqiData}
                activeSector={activeSector}
                onSelectSector={(sec) => setActiveSector(sec)}
                onPromptChat={handlePromptChat}
              />
            </div>
          )}

          {/* VIEW 6: Climate Trends */}
          {activeView === 'climate' && (
            <div className="space-y-3 pb-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('home')}
                  className="flex items-center space-x-1.5 text-xs text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{activeLanguage === 'ta' ? 'முகப்புக்குச் செல்' : 'Back to Home'}</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {t.climate?.title || '7-Day & Historical Weather Analytics'}
                </span>
              </div>
              <ClimateAnalyticsChart
                activeLanguage={activeLanguage}
                weatherData={weatherData}
                currentLocation={currentLocation}
              />
            </div>
          )}

          {/* ✨ VIEW 7: Smart Travel & Route Weather Planner */}
          {activeView === 'route' && (
            <div className="space-y-3 pb-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('home')}
                  className="flex items-center space-x-1.5 text-xs text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{activeLanguage === 'ta' ? 'முகப்புக்குச் செல்' : 'Back to Home'}</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {activeLanguage === 'ta' ? 'நெடுஞ்சாலை வழித்தட வானிலை' : 'Highway Waypoint Weather'}
                </span>
              </div>
              <RouteWeatherPlanner
                activeLanguage={activeLanguage}
                currentLocation={currentLocation}
              />
            </div>
          )}

          {/* ✨ VIEW 8: Event & Wedding Feasibility Score */}
          {activeView === 'event' && (
            <div className="space-y-3 pb-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('home')}
                  className="flex items-center space-x-1.5 text-xs text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{activeLanguage === 'ta' ? 'முகப்புக்குச் செல்' : 'Back to Home'}</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {activeLanguage === 'ta' ? 'நிகழ்வு சாத்தியக்கூறு கணிப்பான்' : 'Event Weather Feasibility'}
                </span>
              </div>
              <EventWeatherScore
                activeLanguage={activeLanguage}
                currentLocation={currentLocation}
                weatherData={weatherData}
                aqiData={aqiData}
              />
            </div>
          )}

          {/* ✨ VIEW 9: Hyperlocal Community Weather Spotter */}
          {activeView === 'spotter' && (
            <div className="space-y-3 pb-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('home')}
                  className="flex items-center space-x-1.5 text-xs text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{activeLanguage === 'ta' ? 'முகப்புக்குச் செல்' : 'Back to Home'}</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {activeLanguage === 'ta' ? 'மக்கள் நேரடி வானிலை சமூகம்' : 'Crowdsourced Ground Spotter'}
                </span>
              </div>
              <CommunityWeatherSpotter
                activeLanguage={activeLanguage}
                currentLocation={currentLocation}
              />
            </div>
          )}

          {/* ✨ VIEW 10: Cyclone & Flood Emergency SOS Hub */}
          {activeView === 'sos' && (
            <div className="space-y-3 pb-20">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('home')}
                  className="flex items-center space-x-1.5 text-xs text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{activeLanguage === 'ta' ? 'முகப்புக்குச் செல்' : 'Back to Home'}</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {activeLanguage === 'ta' ? 'அவசர பேரிடர் தற்காப்பு மையம்' : 'Emergency Disaster SOS Hub'}
                </span>
              </div>
              <DisasterEmergencySOS
                activeLanguage={activeLanguage}
                currentLocation={currentLocation}
                weatherData={weatherData}
                aqiData={aqiData}
                alerts={alerts}
                notificationsEnabled={notificationsEnabled}
                onOpenAlertModal={() => setIsAlertModalOpen(true)}
              />
            </div>
          )}
        </div>

        {/* Floating Quick Voice / Chat Assistant Button (When on non-chat views) */}
        {activeView !== 'chat' && (
          <button
            onClick={() => setActiveView('chat')}
            className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-30 p-3.5 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-xl shadow-sky-600/30 hover:scale-110 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer group"
            title="Talk with WeatherGPT Voice Assistant"
          >
            <Mic className="w-5 h-5 group-hover:animate-bounce" />
            <span className="text-xs font-bold hidden sm:inline">
              {activeLanguage === 'ta' ? 'குரல் உதவி' : 'Voice Assistant'}
            </span>
          </button>
        )}

        {/* 5-Tab Mobile Bottom Navigation Bar (Always visible on mobile & tablets) */}
        <BottomNavBar
          activeView={activeView}
          setActiveView={setActiveView}
          activeLanguage={activeLanguage}
          alertCount={severeAlerts.length}
        />
      </div>

      {/* Modals & Drawers */}
      <ImpactRiskEngineModal
        isOpen={isXaiOpen}
        onClose={() => setIsXaiOpen(false)}
        activeLanguage={activeLanguage}
        riskData={riskData}
        currentLocationName={currentLocation?.name || 'Chennai'}
        weatherData={weatherData}
      />

      <ReportExportModal
        activeLanguage={exportReportParams?.detectedLanguage || activeLanguage}
        isOpen={isExportOpen}
        onClose={() => {
          setIsExportOpen(false);
          setExportReportParams(null);
        }}
        currentLocation={currentLocation}
        weatherData={exportReportParams?.weatherData || weatherData}
        aqiData={exportReportParams?.aqiData || aqiData}
        alerts={exportReportParams?.alerts || alerts}
        chatQuery={exportReportParams ? (chatMessages.slice().reverse().find(m => m.sender === 'user')?.text || '') : ''}
        aiResponse={exportReportParams?.text || ''}
      />

      <AlertNotificationModal
        activeLanguage={activeLanguage}
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        currentLocationName={currentLocation?.name || 'Chennai'}
        onSettingsUpdated={() => setNotificationsEnabled(notificationService.hasAnyChannelActive())}
      />

      <OnboardingPermissionModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        activeLanguage={activeLanguage}
        setActiveLanguage={setActiveLanguage}
        onAllowPermissions={handleAllowPermissions}
        onSkip={() => localStorage.setItem('weather_onboarding_shown', 'true')}
      />

      <AlphabeticalLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        activeLanguage={activeLanguage}
        currentLocation={currentLocation}
        isLocating={isLocating}
        onSelectLocation={(loc) => {
          setCurrentLocation(loc);
          setIsLocationModalOpen(false);
        }}
        onDetectGps={(lang) => {
          detectUserLocation(lang);
          setIsLocationModalOpen(false);
        }}
      />

      <AdminUserRegistryModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        activeLanguage={activeLanguage}
      />
    </div>
  );
}
