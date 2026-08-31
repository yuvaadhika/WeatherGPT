import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Droplets,
  Wind,
  Sun,
  ShieldAlert,
  Thermometer,
  CloudRain,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Compass,
  ArrowRight,
  Wheat,
  Plane,
  Anchor,
  Radio
} from 'lucide-react';
import { weatherAI } from '../services/aiService';
import { speechEngine } from '../services/speechService';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../services/languages';
import { getWeatherDescription } from '../services/weatherService';

export default function ChatInterface({
  activeLanguage = 'en',
  currentLocation,
  onLocationFound,
  initialQuery = '',
  onClearInitialQuery,
  weatherData,
  aqiData,
  messages: externalMessages,
  setMessages: externalSetMessages,
  onOpenRadar,
  onOpenDecision
}) {
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage) || SUPPORTED_LANGUAGES[0];

  const [inputQuery, setInputQuery] = useState('');
  const [internalMessages, setInternalMessages] = useState([]);
  const messages = externalMessages || internalMessages;
  const setMessages = externalSetMessages || setInternalMessages;

  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  // Initial welcome greeting - only if no messages exist yet
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting = t.chat?.welcomeGreeting || TRANSLATIONS.en.chat.welcomeGreeting;
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [activeLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  const handleSendMessage = async (queryText = inputQuery) => {
    const q = queryText.trim();
    if (!q || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await weatherAI.processQuery({
        query: q,
        currentLocation,
        activeLanguage,
      });

      if (response.location && onLocationFound) {
        onLocationFound(response.location);
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.text,
        weatherData: response.weatherData,
        aqiData: response.aqiData,
        alerts: response.alerts,
        domain: response.domain,
        timeframe: response.timeframe,
        sources: response.sources,
        locationName: response.location ? `${response.location.name}, ${response.location.country || 'India'}` : null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ ${t.chat?.queryError || 'Meteorological query error'}: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
    } else {
      const success = speechEngine.startListening({
        langCode: activeLangObj.voiceCode || 'en-US',
        onResult: (transcript) => {
          setInputQuery(transcript);
          handleSendMessage(transcript);
        },
        onError: (err) => {
          console.warn(err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
      if (success) setIsListening(true);
    }
  };

  const handleSpeak = (msgId, text) => {
    if (speakingMsgId === msgId) {
      speechEngine.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msgId);
      speechEngine.speak(text, activeLangObj.voiceCode || 'en-US', () => {
        setSpeakingMsgId(null);
      });
    }
  };

  const handleCopy = (id, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-5">
        {/* Welcome Cards for Empty/New Conversations */}
        {messages.length <= 1 && (
          <div className="max-w-2xl mx-auto my-6 space-y-6 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 shadow-sm">
              <Sun className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t.chat?.welcomeTitle || 'WeatherGPT Forecast & Live Studio'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {t.chat?.welcomeSubtitle || 'Real-time weather reports, hourly rain forecasts, atmospheric telemetry, and sector advisories.'}
              </p>
            </div>

            {/* 4 Feature Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <button
                onClick={() => handleSendMessage(t.chat?.promptRainQuery || 'Will it rain in Chennai over the next 48 hours?')}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all group shadow-sm"
              >
                <div className="flex items-center space-x-2 text-sky-600 font-semibold text-xs">
                  <CloudRain className="w-4 h-4" />
                  <span>{t.chat?.promptRainTitle || 'Rain & 48h Forecast'}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-normal">
                  {t.chat?.promptRainQuery || 'Will it rain in Chennai over the next 48 hours?'}
                </p>
              </button>

              <button
                onClick={() => handleSendMessage(t.chat?.promptFarmerQuery || 'Agricultural crop advisory for paddy and soil moisture status')}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all group shadow-sm"
              >
                <div className="flex items-center space-x-2 text-emerald-600 font-semibold text-xs">
                  <Wheat className="w-4 h-4" />
                  <span>{t.chat?.promptFarmerTitle || 'Farmer Advisory'}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-normal">
                  {t.chat?.promptFarmerQuery || 'Agricultural crop advisory for paddy and soil moisture status'}
                </p>
              </button>

              <button
                onClick={() => handleSendMessage(t.chat?.promptAviationQuery || 'Aviation weather briefing: METAR, cloud ceiling and crosswinds')}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group shadow-sm"
              >
                <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs">
                  <Plane className="w-4 h-4" />
                  <span>{t.chat?.promptAviationTitle || 'Aviation METAR'}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-normal">
                  {t.chat?.promptAviationQuery || 'Aviation weather briefing: METAR, cloud ceiling and crosswinds'}
                </p>
              </button>

              <button
                onClick={() => handleSendMessage(t.chat?.promptMarineQuery || 'Marine high-seas advisory and wave height for fishermen')}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-300 transition-all group shadow-sm"
              >
                <div className="flex items-center space-x-2 text-amber-600 font-semibold text-xs">
                  <Anchor className="w-4 h-4" />
                  <span>{t.chat?.promptMarineTitle || 'Marine & Fishermen'}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-normal">
                  {t.chat?.promptMarineQuery || 'Marine high-seas advisory and wave height for fishermen'}
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          const isSpeakingThis = speakingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 max-w-3xl mx-auto ${
                isAi ? 'justify-start' : 'justify-end flex-row-reverse space-x-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-medium text-xs shadow-sm ${
                  isAi
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-600 text-white'
                }`}
              >
                {isAi ? <Sun className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`rounded-2xl p-4 shadow-sm text-xs sm:text-sm leading-relaxed max-w-[88%] ${
                  isAi
                    ? 'bg-white border border-slate-200 text-slate-800'
                    : 'bg-sky-600 text-white font-normal'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-line space-y-1">
                  {msg.text.split('\n').map((line, idx) => {
                    if (line.startsWith('•')) {
                      return (
                        <div key={idx} className="pl-2 border-l-2 border-sky-400 text-slate-700 my-0.5 font-medium">
                          {line}
                        </div>
                      );
                    }
                    return <div key={idx}>{line}</div>;
                  })}
                </div>

                {/* Compact Weather Metrics Strip (if AI message has telemetry) */}
                {isAi && msg.weatherData?.current && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-sky-700">
                      <span>Live Telemetry ({msg.locationName || currentLocation?.name || 'Location'})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-[10px] text-slate-500 block">{t.sidebar?.temperature || 'Temp'}</span>
                          <span className="font-bold text-slate-800">{msg.weatherData.current.temperature_2m}°C</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                        <Droplets className="w-4 h-4 text-sky-500" />
                        <div>
                          <span className="text-[10px] text-slate-500 block">{t.sidebar?.humidity || 'Humidity'}</span>
                          <span className="font-bold text-slate-800">{msg.weatherData.current.relative_humidity_2m}%</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-blue-500" />
                        <div>
                          <span className="text-[10px] text-slate-500 block">{t.sidebar?.windSpeed || 'Wind'}</span>
                          <span className="font-bold text-slate-800">{msg.weatherData.current.wind_speed_10m} km/h</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-emerald-500" />
                        <div>
                          <span className="text-[10px] text-slate-500 block">{t.sidebar?.airQuality || 'Air Quality'}</span>
                          <span className="font-bold text-emerald-600">{msg.aqiData?.current?.us_aqi || 50} AQI</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick navigation to interactive maps */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={onOpenRadar}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-sky-700 border border-slate-200 flex items-center space-x-1 transition-all"
                      >
                        <Radio className="w-3 h-3" />
                        <span>{t.chat?.viewRadar || 'View Live Radar Map'} →</span>
                      </button>
                      <button
                        onClick={() => onOpenDecision(msg.domain || 'agriculture')}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center space-x-1 transition-all"
                      >
                        <span>{t.chat?.agriAdvisory || 'Open Sector Advisory'} →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Footer Buttons */}
                {isAi && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono text-[10px] text-slate-400">{msg.timestamp}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        title={isSpeakingThis ? (t.chat?.voiceStop || 'Stop Voice') : (t.chat?.voiceSpeak || 'Read Aloud')}
                        className={`p-1 rounded-lg hover:bg-slate-100 flex items-center space-x-1 transition-colors ${
                          isSpeakingThis ? 'text-sky-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{isSpeakingThis ? (t.chat?.voiceStop || 'Stop') : (t.chat?.voiceSpeak || 'Listen')}</span>
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start space-x-3 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white text-xs">
              <Sun className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center space-x-2 shadow-sm">
              <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />
              <span>Fetching live meteorological data & forecasts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="max-w-3xl w-full mx-auto px-2 sm:px-4 pb-3 pt-2">
        {/* Quick prompt chip bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-1 text-xs">
          {[
            t.chat?.promptRainQuery,
            t.chat?.promptFarmerQuery,
            t.chat?.promptAviationQuery,
            t.chat?.promptMarineQuery,
          ].filter(Boolean).slice(0, 4).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] transition-all truncate max-w-[240px] shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center bg-white border border-slate-300 rounded-2xl shadow-md p-1.5 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all"
        >
          {/* Voice Input Mic */}
          <button
            type="button"
            onClick={handleToggleVoice}
            title={isListening ? (t.chat?.voiceListening || 'Listening...') : 'Speak with Voice (10 Languages)'}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md'
                : 'text-slate-500 hover:text-sky-600 hover:bg-slate-100'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={isListening ? (t.chat?.voiceListening || 'Listening...') : (t.chat?.inputPlaceholder || 'Ask WeatherGPT anything...')}
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />

          {/* Language Badge */}
          <span className="text-xs px-2 text-slate-500 hidden sm:inline font-medium">
            {activeLangObj.nativeName}
          </span>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className={`p-2.5 rounded-xl font-medium flex items-center justify-center transition-all flex-shrink-0 ${
              inputQuery.trim() && !isLoading
                ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
