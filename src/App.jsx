import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WeatherAlertBanner from './components/WeatherAlertBanner';
import ChatInterface from './components/ChatInterface';
import WeatherRadarMap from './components/WeatherRadarMap';
import DecisionSupportModes from './components/DecisionSupportModes';
import ClimateAnalyticsChart from './components/ClimateAnalyticsChart';
import ApiKeyModal from './components/ApiKeyModal';
import ReportExportModal from './components/ReportExportModal';
import {
  fetchNWPForecast,
  fetchAirQuality,
  evaluateSevereWeatherAlerts,
  reverseGeocode,
  getWeatherDescription
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
  Settings,
  Download,
  PlusCircle,
  ChevronLeft
} from 'lucide-react';

export default function App() {
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'radar' | 'decision' | 'climate'
  const [activeSector, setActiveSector] = useState('agriculture');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentLocation, setCurrentLocation] = useState({
    name: 'Chennai',
    admin1: 'Tamil Nadu',
    country: 'India',
    latitude: 13.0827,
    longitude: 80.2707,
  });

  const [weatherData, setWeatherData] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [initialChatQuery, setInitialChatQuery] = useState('');

  const getInitialWelcome = (lang) => {
    const welcomeTexts = {
      en: `👋 Hello! I am **WeatherGPT**, your meteorological AI platform.\n\nAsk me about live forecasts, rainfall probability, cyclone/flood early warnings, crop-soil advisories, aviation METAR, and marine high-seas reports in natural language.`,
      ta: `👋 வணக்கம்! நான் **வெதர் ஜிபிடி (WeatherGPT)**.\n\nநேரலை வானிலை முன்னறிவிப்பு, மழை வாய்ப்பு, புயல் எச்சரிக்கைகள், விவசாய பயிர் மற்றும் மண் ஆலோசனைகள், விமானம் மற்றும் மீனவர் வழிகாட்டல்களை என்னிடம் கேட்கலாம்.`,
      hi: `👋 नमस्ते! मैं **वेदर जीपीटी (WeatherGPT)** हूँ।\n\nलाइव मौसम पूर्वानुमान, वर्षा की संभावना, आपदा अलर्ट, कृषि सलाह और समुद्री सुरक्षा के बारे में कुछ भी पूछें।`,
    };
    return [
      {
        id: 'welcome-1',
        sender: 'ai',
        text: welcomeTexts[lang] || welcomeTexts.en,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  };

  const [chatMessages, setChatMessages] = useState(() => getInitialWelcome(activeLanguage));

  const handleNewChat = () => {
    setChatMessages(getInitialWelcome(activeLanguage));
    setActiveView('chat');
    setInitialChatQuery('');
    setSidebarOpen(false);
  };

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  const detectUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const loc = await reverseGeocode(lat, lon);
            setCurrentLocation(loc);
          } catch (e) {
            console.warn(e);
          }
        },
        (err) => {
          console.warn('Geolocation denied/unavailable:', err);
        }
      );
    }
  };

  useEffect(() => {
    detectUserLocation();
  }, []);

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

        const computedAlerts = evaluateSevereWeatherAlerts(nwp, aqi);
        setAlerts(computedAlerts);
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

  const topAlert = alerts.length > 0 ? alerts[0] : null;
  const current = weatherData?.current || {};
  const wmo = getWeatherDescription(current.weather_code || 0);

  const handlePromptChat = (query) => {
    setActiveView('chat');
    setInitialChatQuery(query);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen w-screen flex bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      {/* 1. Sleek Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-sm font-bold">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-slate-900">
                  WeatherGPT
                </h1>
                <span className="text-[10px] text-sky-600 font-semibold tracking-wide">
                  Live Weather & Radar
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Query / Clear Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full mt-4 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Weather Search</span>
          </button>
        </div>

        {/* Navigation & Suite Shortcuts */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Main Views */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              Weather Studio
            </div>
            <button
              onClick={() => {
                setActiveView('chat');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'chat'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span>Forecast & Assistant</span>
            </button>

            <button
              onClick={() => {
                setActiveView('radar');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'radar'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>Live Doppler Radar Map</span>
            </button>

            <button
              onClick={() => {
                setActiveView('climate');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'climate'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Climate & 7-Day Trends</span>
            </button>
          </div>

          {/* Decision Support Suites */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
              Sector Advisories
            </div>
            {[
              { id: 'agriculture', label: '🌾 Farmers & Agriculture', icon: Wheat },
              { id: 'aviation', label: '✈️ Aviation METAR / TAF', icon: Plane },
              { id: 'marine', label: '🌊 Marine & Fishermen', icon: Anchor },
              { id: 'smartCity', label: '🏙️ Smart City & Disaster', icon: Building2 },
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
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
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

          {/* 3 Active Feeds Info Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5">
            <div className="font-semibold text-slate-700 flex items-center justify-between">
              <span>Live Data Streams</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              • Open-Meteo GFS / ECMWF<br />
              • Air Quality WAQI PM2.5<br />
              • RainViewer Radar GIS
            </p>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50">
          {/* 10 Languages Selector */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
            <span className="text-xs">🌐</span>
            <select
              value={activeLanguage}
              onChange={(e) => setActiveLanguage(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white text-slate-800">
                  {l.flag} {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Bulletin</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>API Keys</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc]">
        {/* Top Navbar */}
        <Header
          activeLanguage={activeLanguage}
          setActiveLanguage={setActiveLanguage}
          currentLocation={currentLocation}
          onSelectLocation={(loc) => setCurrentLocation(loc)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          topAlert={topAlert}
          onDetectLocation={detectUserLocation}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {/* View Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col max-w-6xl w-full mx-auto">
          {/* Main View: Clean AI Chat (Preserved across view transitions) */}
          <div className={activeView === 'chat' ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>
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
            />
          </div>

          {/* Specialized View: Live GIS Radar */}
          {activeView === 'radar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('chat')}
                  className="flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Forecast</span>
                </button>
                <span className="text-xs text-slate-400">Live Satellite & Radar Stream</span>
              </div>
              <WeatherRadarMap
                currentLocation={currentLocation}
                weatherData={weatherData}
                alerts={alerts}
              />
            </div>
          )}

          {/* Specialized View: Decision Support Suites */}
          {activeView === 'decision' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('chat')}
                  className="flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Forecast</span>
                </button>
                <span className="text-xs text-slate-400">Decision Support Advisory</span>
              </div>
              <DecisionSupportModes
                currentLocation={currentLocation}
                weatherData={weatherData}
                aqiData={aqiData}
                activeSector={activeSector}
                onSelectSector={(sec) => setActiveSector(sec)}
                onPromptChat={handlePromptChat}
              />
            </div>
          )}

          {/* Specialized View: Climate Trends */}
          {activeView === 'climate' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('chat')}
                  className="flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Forecast</span>
                </button>
                <span className="text-xs text-slate-400">7-Day & Historical Weather Analytics</span>
              </div>
              <ClimateAnalyticsChart
                weatherData={weatherData}
                currentLocation={currentLocation}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ApiKeyModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ReportExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        currentLocation={currentLocation}
        weatherData={weatherData}
        aqiData={aqiData}
        alerts={alerts}
      />
    </div>
  );
}
