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
  Radio,
  FileText,
  Download,
  Printer,
  Camera,
  Image as ImageIcon,
  RotateCw,
  X
} from 'lucide-react';
import { weatherAI } from '../services/aiService';
import { speechEngine } from '../services/speechService';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../services/languages';
import { getWeatherDescription, generateFullSpokenWeatherBulletin } from '../services/weatherService';
import { createWeatherIntelligenceReport, downloadHTMLReport } from '../services/reportService';

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
  onOpenDecision,
  onOpenExport
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
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedModel, setSelectedModel] = useState(() => weatherAI.getModel() || 'gemini');

  // 📸 Multimodal Image Query State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState('');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Stop camera stream on unmount or close
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Open Live Camera
  const handleOpenCamera = async (mode = facingMode) => {
    setCameraError('');
    setIsCameraOpen(true);
    try {
      stopCameraStream();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraError(
        activeLanguage === 'ta'
          ? 'கேமராவை அணுக முடியவில்லை. தயவுசெய்து கேமரா அனுமதியை சரிபார்க்கவும் அல்லது File Upload பயன்படுத்தவும்.'
          : 'Could not access camera. Please allow camera permissions or upload an image file.'
      );
    }
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError('');
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    handleOpenCamera(nextMode);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      setImageMimeType('image/jpeg');
      handleCloseCamera();
    } catch (err) {
      console.error('Snapshot capture failed:', err);
    }
  };

  // Initial welcome greeting - update if no user messages exist yet
  useEffect(() => {
    const hasUserMessage = messages.some((m) => m.sender === 'user');
    if (!hasUserMessage) {
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
  }, [messages, isLoading, speakingMsgId]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  // Handle Image File Selection
  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  };

  // Clipboard Paste Support (Ctrl+V Image)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  };

  const handleSendMessage = async (queryText = inputQuery, imageToSend = selectedImage) => {
    const q = (typeof queryText === 'string' ? queryText : '').trim();
    if ((!q && !imageToSend) || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q || (activeLanguage === 'ta' ? 'வானிலை & பார்வை ஆய்வு (Weather Image Query)' : 'Weather & Vision Query'),
      image: imageToSend || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await weatherAI.processQuery({
        query: q || (activeLanguage === 'ta' ? 'இந்த வானிலை/மேக படத்தை ஆய்வு செய்து நிலவரத்தை கூறவும்' : 'Analyze this weather and sky image in detail'),
        currentLocation,
        activeLanguage,
        image: imageToSend || null,
        mimeType: imageMimeType || 'image/jpeg',
      });

      if (response.location && onLocationFound) {
        onLocationFound(response.location);
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.text,
        detectedLanguage: response.detectedLanguage,
        weatherData: response.weatherData,
        aqiData: response.aqiData,
        alerts: response.alerts,
        domain: response.domain,
        timeframe: response.timeframe,
        sources: response.sources,
        modelUsed: response.modelUsed,
        hasImage: !!imageToSend,
        locationName: response.location ? `${response.location.name}, ${response.location.country || 'India'}` : null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Automatically speak the entire AI output in the detected / selected language
      if (autoSpeak && response.text) {
        handleSpeak(aiMsg.id, response.text, response.detectedLanguage);
      }
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

  const handleSpeak = (msgId, text, msgLang) => {
    if (speakingMsgId === msgId) {
      speechEngine.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msgId);
      let targetVoiceCode = activeLangObj.voiceCode || 'en-US';
      if (msgLang === 'tanglish') {
        targetVoiceCode = 'en-IN';
      } else if (msgLang === 'ta' || /[\u0B80-\u0BFF]/.test(text)) {
        targetVoiceCode = 'ta-IN';
      } else if (msgLang) {
        const foundLang = SUPPORTED_LANGUAGES.find((l) => l.code === msgLang);
        if (foundLang) targetVoiceCode = foundLang.voiceCode;
      }

      speechEngine.speak(text, targetVoiceCode, () => {
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

  const handleDownloadDirectReport = (msg) => {
    const userQuery = messages.slice().reverse().find((m) => m.sender === 'user')?.text || '';
    const reportData = createWeatherIntelligenceReport({
      location: currentLocation,
      weatherData: msg.weatherData || weatherData,
      aqiData: msg.aqiData || aqiData,
      alerts: msg.alerts || [],
      chatQuery: userQuery,
      aiResponse: msg.text,
      lang: msg.detectedLanguage || activeLanguage
    });
    downloadHTMLReport(reportData);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-5">
        {/* Welcome Cards for Empty/New Conversations */}
        {messages.length <= 1 && (
          <div className="max-w-2xl mx-auto my-6 space-y-6 text-center">
            <div className="inline-flex px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-black tracking-wider uppercase">
              WeatherGPT
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
                className="p-3.5 rounded-2xl bg-white/85 hover:bg-white border border-sky-100/90 hover:border-sky-300 transition-all group shadow-2xs"
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
                className="p-3.5 rounded-2xl bg-white/85 hover:bg-white border border-emerald-100/90 hover:border-emerald-300 transition-all group shadow-2xs"
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
                className="p-3.5 rounded-2xl bg-white/85 hover:bg-white border border-sky-100/90 hover:border-sky-300 transition-all group shadow-2xs"
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
                className="p-3.5 rounded-2xl bg-white/85 hover:bg-white border border-amber-100/90 hover:border-amber-300 transition-all group shadow-2xs"
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
              {/* Sender Tag */}
              <div
                className={`px-2 py-0.5 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                  isAi
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                }`}
              >
                {isAi ? 'WeatherGPT' : 'You'}
              </div>

              {/* Bubble */}
              <div
                className={`rounded-2xl p-4 shadow-2xs text-xs sm:text-sm leading-relaxed max-w-[88%] ${
                  isAi
                    ? 'bg-white/90 backdrop-blur-md border border-sky-100/90 text-slate-800'
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
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
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

                {/* 📥 Post-Conversation Comprehensive Intelligence Report Download Card */}
                {isAi && msg.id !== 'welcome-1' && (
                  <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/60 to-sky-50 border border-sky-200/80 shadow-2xs space-y-2">
                    <div className="flex items-start space-x-2.5">
                      <div className="p-1.5 rounded-xl bg-sky-600 text-white shadow-xs flex-shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                          {msg.detectedLanguage === 'ta' || activeLanguage === 'ta'
                            ? '📊 இந்த முன்னறிவிப்பிற்கான முழுமையான வானிலை & ரேடார் அறிக்கையைப் பதிவிறக்க வேண்டுமா?'
                            : msg.detectedLanguage === 'tanglish'
                            ? '📊 Full Weather & Live Radar Report-ஐ Download பண்ணவா?'
                            : '📊 Would you like to download the complete Weather & Radar Intelligence Report?'}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {msg.detectedLanguage === 'ta' || activeLanguage === 'ta'
                            ? 'நேரலை அளவீடுகள், மழை நேரம், GIS ரேடார் வரைபடம், காற்று தரம் & விவசாய வழிகாட்டல்கள் அடங்கியது'
                            : msg.detectedLanguage === 'tanglish'
                            ? 'Includes Live Telemetry, Rain Timing, GIS Radar, AQI & Sector Directives'
                            : 'Includes live telemetry, 48h rain timing, GIS radar stream, AQI & sector advisories'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-sky-100/80">
                      <button
                        onClick={() => onOpenExport ? onOpenExport(msg) : handleDownloadDirectReport(msg)}
                        className="flex-1 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-[11px] font-bold rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        title="Review and Confirm Report Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{msg.detectedLanguage === 'ta' || activeLanguage === 'ta' ? 'அறிக்கையைப் பதிவிறக்கு' : 'Download Intelligence Report'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Action Strip: Audio Speak + Download HTML Report + Copy */}
                {isAi && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-slate-500">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {msg.timestamp}
                    </span>

                    <div className="flex items-center space-x-1">
                      {/* Read Aloud Button */}
                      <button
                        onClick={() => handleSpeak(msg.id, msg.text, msg.detectedLanguage)}
                        title={isSpeakingThis ? "Stop speaking" : "Listen to weather report (Voice Synthesis)"}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isSpeakingThis
                            ? 'bg-sky-100 text-sky-700 animate-pulse'
                            : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5 text-sky-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Download Intelligence HTML Report Dossier */}
                      <button
                        onClick={() => handleDownloadDirectReport(msg)}
                        title="Download Verified Meteorological HTML Report Dossier"
                        className="p-1 rounded-lg hover:bg-sky-50 text-sky-600 hover:text-sky-800 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Text */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
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
            <div className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
              WeatherGPT
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center space-x-2 shadow-sm">
              <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />
              <span>Fetching live meteorological data & vision forecasts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar & Active Voice Equalizer (Elevated above mobile bottom nav bar) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="max-w-3xl w-full mx-auto px-2 sm:px-4 pt-2 pb-2 sm:pb-3 z-30 flex-shrink-0 relative"
      >
        {/* Drag & Drop Visual Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-40 bg-sky-500/90 backdrop-blur-sm rounded-3xl border-2 border-dashed border-white text-white flex flex-col items-center justify-center m-2 shadow-2xl animate-pulse">
            <Camera className="w-8 h-8 mb-1" />
            <span className="font-extrabold text-sm">{activeLanguage === 'ta' ? 'வானிலை படத்தை இங்கே விடவும்' : 'Drop weather image for Vision AI'}</span>
          </div>
        )}

        {/* Active Speaking Indicator Equalizer Banner */}
        {speakingMsgId && (
          <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white px-3.5 py-2.5 rounded-2xl flex items-center justify-between shadow-xl mb-2 border border-sky-500/40 animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 h-4">
                <span className="w-1 bg-sky-400 rounded-full h-3 animate-bounce"></span>
                <span className="w-1 bg-sky-300 rounded-full h-4 animate-pulse"></span>
                <span className="w-1 bg-cyan-300 rounded-full h-2 animate-bounce"></span>
                <span className="w-1 bg-white rounded-full h-3.5 animate-pulse"></span>
              </div>
              <div className="text-xs">
                <span className="font-bold text-sky-200 block">
                  {messages.find(m => m.id === speakingMsgId)?.detectedLanguage === 'tanglish'
                    ? 'WeatherGPT Tanglish Voice (குரல் விளக்கம்)'
                    : (messages.find(m => m.id === speakingMsgId)?.detectedLanguage === 'ta' || activeLanguage === 'ta')
                    ? 'வானிலை AI குரலில் விளக்குகிறது...'
                    : `WeatherGPT Voice Assistant (${activeLangObj.nativeName})`}
                </span>
                <span className="text-[10px] text-slate-300 hidden sm:inline">
                  {activeLanguage === 'ta' ? 'அறிக்கையை குரலில் விவரிக்கிறது' : 'Speaking verified weather bulletin'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                speechEngine.stopSpeaking();
                setSpeakingMsgId(null);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              title="Stop voice"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>{activeLanguage === 'ta' ? 'நிறுத்து' : 'Stop'}</span>
            </button>
          </div>
        )}

        {/* 📸 Attached Image Preview Strip */}
        {selectedImage && (
          <div className="mb-2 p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-sky-400 shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center space-x-2.5 min-w-0">
              <img
                src={selectedImage}
                alt="Selected preview"
                className="w-12 h-12 rounded-xl object-cover border border-sky-300 shadow-2xs flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {activeLanguage === 'ta' ? '📸 வானிலை படம் இணைக்கப்பட்டுள்ளது' : '📸 Weather Image Ready for Vision AI'}
                </span>
                <div className="flex items-center space-x-1.5 mt-1 overflow-x-auto">
                  {[
                    { en: '☁️ Cloud & Rain', ta: '☁️ மேகம் & மழை' },
                    { en: '🌾 Crop Health', ta: '🌾 பயிர் நிலை' },
                    { en: '🌪️ Storm Risk', ta: '🌪️ புயல் அபாயம்' }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const prompt = activeLanguage === 'ta' ? `${chip.ta} பற்றி ஆய்வு செய்` : `Analyze ${chip.en}`;
                        setInputQuery(prompt);
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 cursor-pointer flex-shrink-0 transition-colors"
                    >
                      {activeLanguage === 'ta' ? chip.ta : chip.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-colors cursor-pointer flex-shrink-0"
              title="Remove Image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Prompt Bar + Auto-Voice Toggle */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-1 text-xs">
          {/* Quick Pre-Built Queries + Emergency SOS */}
          <div className="flex items-center space-x-1.5 overflow-x-auto min-w-0">
            <button
              type="button"
              onClick={() => handleSendMessage(activeLanguage === 'ta' ? 'அவசர கால உதவி எண்கள் மற்றும் பேரிடர் வழிகாட்டுதல்கள் என்ன?' : 'Emergency Disaster SOS Helplines & Safety Protocols')}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1"
            >
              <span>🚨</span>
              <span>{activeLanguage === 'ta' ? 'அவசர உதவி (SOS 1077)' : 'Emergency SOS Vault'}</span>
            </button>
            {[
              t.chat?.promptRainQuery,
              t.chat?.promptFarmerQuery,
              t.chat?.promptAviationQuery,
              t.chat?.promptMarineQuery,
            ].filter(Boolean).slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-slate-600 border border-slate-200 text-[10px] transition-all truncate max-w-[200px] shadow-2xs cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Auto-Voice Response Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (autoSpeak && speakingMsgId) {
                speechEngine.stopSpeaking();
                setSpeakingMsgId(null);
              }
              setAutoSpeak(!autoSpeak);
            }}
            className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
              autoSpeak
                ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-2xs'
                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:text-slate-800'
            }`}
            title={autoSpeak ? 'Auto Voice: ON (AI will speak all outputs aloud)' : 'Auto Voice: OFF (AI text only)'}
          >
            {autoSpeak ? <Volume2 className="w-3 h-3 text-sky-600 animate-pulse" /> : <VolumeX className="w-3 h-3 text-slate-400" />}
            <span className="whitespace-nowrap">
              {autoSpeak ? (activeLanguage === 'ta' ? 'குரல்: ஆன்' : 'Voice: ON') : (activeLanguage === 'ta' ? 'குரல்: ஆஃப்' : 'Voice: OFF')}
            </span>
          </button>
        </div>

        {/* Hidden file input for gallery upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          className="hidden"
        />

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center bg-white border-2 border-sky-400/90 rounded-2xl shadow-xl p-1.5 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-200 transition-all"
        >
          {/* Live Camera Button */}
          <button
            type="button"
            onClick={() => handleOpenCamera()}
            title={activeLanguage === 'ta' ? 'நேரடி கேமரா (Live Camera Capture)' : 'Open Live Camera (Take Photo)'}
            className="p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 cursor-pointer mr-1 text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/70 shadow-2xs"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Gallery / File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={activeLanguage === 'ta' ? 'படத்தை பதிவேற்றவும் (Upload from Gallery)' : 'Upload from Gallery / Files'}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 cursor-pointer mr-1 ${
              selectedImage
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/70 shadow-2xs'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Voice Input Mic */}
          <button
            type="button"
            onClick={handleToggleVoice}
            title={isListening ? (t.chat?.voiceListening || 'Listening...') : 'Speak with Voice (10 Languages)'}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 cursor-pointer mr-1 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md'
                : 'text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/70 shadow-2xs'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              selectedImage
                ? (activeLanguage === 'ta' ? 'படத்தைப் பற்றி கேளுங்கள் அல்லது Send அழுத்தவும்...' : 'Ask about this photo or press Send for Vision AI...')
                : isListening
                ? (t.chat?.voiceListening || 'Listening...')
                : (activeLanguage === 'ta' ? 'வானிலை பற்றி கேளுங்கள் அல்லது கேமரா/படத்தை இணைக்கவும்...' : 'Ask WeatherGPT, take camera photo, or upload image...')
            }
            className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />

          {/* Language Badge */}
          <span className="text-xs px-2 text-slate-500 hidden sm:inline font-medium">
            {activeLangObj.nativeName}
          </span>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputQuery.trim() && !selectedImage) || isLoading}
            className={`p-2.5 rounded-xl font-medium flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
              (inputQuery.trim() || selectedImage) && !isLoading
                ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 📸 LIVE CAMERA CAPTURE MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-sky-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Top Bar */}
            <div className="p-3 sm:p-4 bg-slate-900/95 flex items-center justify-between border-b border-slate-800 text-white z-10">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-xs sm:text-sm">
                  {activeLanguage === 'ta' ? 'நேரடி வானிலை கேமரா (Live Weather Camera)' : 'Live Weather Vision Camera'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Viewfinder Container */}
            <div className="relative bg-black aspect-4/3 sm:aspect-16/10 flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-rose-300 text-xs sm:text-sm space-y-3">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{activeLanguage === 'ta' ? 'கோப்பிலிருந்து பதிவேற்று' : 'Upload from Device'}</span>
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* HUD Scanner Overlay */}
                  <div className="absolute inset-4 pointer-events-none border border-sky-400/40 rounded-2xl flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-sky-400 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-sky-400/30">
                        METEOROLOGICAL SCANNER [LIVE]
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-white/90 bg-slate-900/80 px-3 py-1 rounded-full border border-white/20">
                        {activeLanguage === 'ta' ? 'வானம் அல்லது பயிரை திரைக்குள் கொண்டு வாருங்கள்' : 'Align Sky, Clouds or Farm in viewfinder'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end text-[9px] font-mono text-slate-400">
                      <span>AI VISION READY</span>
                      <span>{facingMode === 'environment' ? 'REAR SENSOR' : 'FRONT SENSOR'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Camera Controls Bar */}
            {!cameraError && (
              <div className="p-4 bg-slate-900 flex items-center justify-around border-t border-slate-800">
                {/* Flip Camera Button */}
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex flex-col items-center space-y-1"
                  title="Switch Camera"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[9px] font-semibold">{activeLanguage === 'ta' ? 'மாற்று' : 'Flip'}</span>
                </button>

                {/* Shutter Capture Button */}
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 border-4 border-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30 active:scale-90 transition-all cursor-pointer group"
                  title="Take Photo"
                >
                  <div className="w-12 h-12 rounded-full bg-sky-600 group-hover:bg-sky-500 flex items-center justify-center text-white transition-colors">
                    <Camera className="w-6 h-6" />
                  </div>
                </button>

                {/* Gallery Fallback in Camera Modal */}
                <button
                  type="button"
                  onClick={() => {
                    handleCloseCamera();
                    fileInputRef.current?.click();
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex flex-col items-center space-y-1"
                  title="Upload from gallery"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-[9px] font-semibold">{activeLanguage === 'ta' ? 'கோப்பு' : 'Gallery'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
