import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Radio,
  Wheat,
  BarChart3,
  MessageSquare,
  Lock,
  ArrowRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Layers,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

const CHAPTERS = [
  {
    id: 'auth',
    time: '0:00 - 0:08',
    startSec: 0,
    endSec: 8,
    titleEn: '1. Login & Instant Authentication',
    titleTa: '1. லாகின் & பயனர் பதிவு முறை',
    descEn: 'Secure sign-in with instant Guest Access, profile persistence, and multi-device cloud synchronization.',
    descTa: 'எளிதான விருந்தினர் மற்றும் பயனர் லாகின், கிளவுட் ஒத்திசைவு மற்றும் பாதுகாப்பு அமைப்புகள்.',
    badge: 'Security & Auth',
    icon: Lock,
    accentColor: 'from-blue-600 to-indigo-600',
    mockBg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
    previewVisual: {
      type: 'auth',
      headline: 'WeatherGPT Multi-Tenant Authentication',
      subline: 'Sign in with One-Click Guest Access or Email Profile',
      tag: 'Verified User Session: Active',
    }
  },
  {
    id: 'chat',
    time: '0:08 - 0:18',
    startSec: 8,
    endSec: 18,
    titleEn: '2. Conversation AI & 3-Column Rain Table',
    titleTa: '2. AI சாட்போட் & 3-Column மழை அட்டவணை',
    descEn: 'Natural Tanglish/Tamil/English queries with our new 3-Column Table (Place | Rain Status YES/NO | Timing Window) & Voice Synthesis.',
    descTa: 'இயல்பான குரல் & உரை வழியே வானிலை அறிக்கை, துல்லியமான மழை YES/NO அட்டவணை மற்றும் நேரப் பகுப்பாய்வு.',
    badge: 'Core Intelligence',
    icon: MessageSquare,
    accentColor: 'from-sky-600 to-blue-600',
    mockBg: 'bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900',
    previewVisual: {
      type: 'chat_table',
      headline: '📍 Specific Locality Rain & Alert Timing Table',
      tableHeaders: ['📍 Place Name', '🌧️ Rain / Alert Status', '⏰ Timing Window'],
      sampleRows: [
        ['Tambaram', '🌧️ YES (Mazhai 85% • ~12.5 mm)', '⏰ Today 2:00 PM – 4:00 PM'],
        ['Guindy', '🌦️ MAYBE (Drizzle / 40%)', '⏰ Evening 4:00 PM – 6:00 PM'],
        ['Velachery', '☀️ NO (Mazhai Illai / Safe)', '⏰ Next 24h Safe'],
      ]
    }
  },
  {
    id: 'radar',
    time: '0:18 - 0:26',
    startSec: 18,
    endSec: 26,
    titleEn: '3. Live GIS Weather Radar & Satellite Stream',
    titleTa: '3. நேரலை GIS வானிலை ரேடார் வரைபடம்',
    descEn: 'Real-time Doppler radar animation, precipitation cloud tracking, and district-level radar overlay for precision monitoring.',
    descTa: 'நேரலை வானிலை ரேடார் அனிமேஷன், மழை மேக நகர்வுகள் மற்றும் GIS செயற்கைக்கோள் வரைபடம்.',
    badge: 'Live Radar GIS',
    icon: Radio,
    accentColor: 'from-cyan-600 to-sky-600',
    mockBg: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900',
    previewVisual: {
      type: 'radar',
      headline: 'RainViewer Real-Time Doppler Stream',
      subline: 'Active Radar Layers: Precipitation Cloud Animation Active (10m Resolution)',
      tag: 'Radar Feed: 100% Live Sync'
    }
  },
  {
    id: 'alerts',
    time: '0:26 - 0:34',
    startSec: 26,
    endSec: 34,
    titleEn: '4. Early Warnings & Disaster Emergency SOS',
    titleTa: '4. பேரிடர் முன்னெச்சரிக்கை & SOS அவசர உதவி',
    descEn: 'Sub-district flood risk scores, cyclone early warnings, and zero-tower offline disaster safety protocols.',
    descTa: 'பகுதிவாரி வெள்ள அபாய மதிப்பீடு, புயல் எச்சரிக்கை மற்றும் டவர் இல்லாத நேரத்திலும் செயல்படும் ஆஃப்லைன் வாலட்.',
    badge: 'Disaster Safety',
    icon: ShieldAlert,
    accentColor: 'from-rose-600 to-amber-600',
    mockBg: 'bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900',
    previewVisual: {
      type: 'alert',
      headline: 'TNSDMA & NWP Disaster Risk Intelligence',
      subline: 'Multi-Hazard Risk Engine: Flood Inundation & Cyclone Alert Shield Active',
      tag: 'Early Warning: Level Orange Monitor'
    }
  },
  {
    id: 'decision',
    time: '0:34 - 0:42',
    startSec: 34,
    endSec: 42,
    titleEn: '5. Farmer Crop Seed & Sector Decision Support',
    titleTa: '5. விவசாய விதை ஆலோசனை & துறை வழிகாட்டல்',
    descEn: 'Agricultural crop seed recommendation, fertilizer spraying windows, marine wave heights, and aviation METAR briefs.',
    descTa: 'விவசாயிகளுக்கு ஏற்ற விதை தேர்வு, மருந்து தெளிப்பு நேரம், மீனவர்களுக்கான அலை உயரம் & விமான வானிலை.',
    badge: 'Farmer & Sectors',
    icon: Wheat,
    accentColor: 'from-emerald-600 to-teal-600',
    mockBg: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900',
    previewVisual: {
      type: 'agri',
      headline: 'Crop & Agro-Climatic Decision Engine',
      subline: 'Soil Moisture 78% | Sowing Status: Highly Favorable (Paddy CR 1009)',
      tag: 'Agricultural Directives: Synchronized'
    }
  },
  {
    id: 'analytics',
    time: '0:42 - 0:50',
    startSec: 42,
    endSec: 50,
    titleEn: '6. Climate Analytics & Verified HTML Report Export',
    titleTa: '6. காலநிலை வரைபடங்கள் & அதிகாரப்பூர்வ அறிக்கை',
    descEn: 'Interactive 7-day temperature/AQI trend charts, route weather planner, and full PDF/HTML report download.',
    descTa: '7-நாள் வெப்பநிலை & காற்றுத் தரம் வரைபடங்கள் மற்றும் விரிவான வானிலை அறிக்கைப் பதிவிறக்கம்.',
    badge: 'Analytics & Reports',
    icon: BarChart3,
    accentColor: 'from-purple-600 to-indigo-600',
    mockBg: 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900',
    previewVisual: {
      type: 'export',
      headline: 'Meteorological Intelligence Dossier',
      subline: 'Instant HTML/PDF Export with Verified Telemetry & Radar Maps',
      tag: 'Export Ready: 7-Day Complete Forecast'
    }
  }
];

export default function FeatureVideoTourModal({
  isOpen,
  onClose,
  activeLanguage = 'en',
  onNavigateView
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSec, setCurrentSec] = useState(0);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const totalDuration = 50; // 50 seconds total
  const timerRef = useRef(null);

  const isTa = activeLanguage === 'ta';
  const currentChapter = CHAPTERS[currentChapterIndex] || CHAPTERS[0];

  useEffect(() => {
    if (isOpen) {
      setCurrentSec(0);
      setCurrentChapterIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isPlaying || !isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentSec((prev) => {
        const next = prev + 0.5;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }

        const foundIdx = CHAPTERS.findIndex(
          (c) => next >= c.startSec && next < c.endSec
        );
        if (foundIdx !== -1 && foundIdx !== currentChapterIndex) {
          setCurrentChapterIndex(foundIdx);
        }
        return next;
      });
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isOpen, currentChapterIndex]);

  const handleSeek = (sec) => {
    setCurrentSec(sec);
    const foundIdx = CHAPTERS.findIndex(
      (c) => sec >= c.startSec && sec < c.endSec
    );
    if (foundIdx !== -1) {
      setCurrentChapterIndex(foundIdx);
    }
  };

  const handleSelectChapter = (idx) => {
    setCurrentChapterIndex(idx);
    setCurrentSec(CHAPTERS[idx].startSec);
  };

  const handleLaunchFeature = () => {
    if (onNavigateView) {
      const viewMap = {
        auth: 'home',
        chat: 'home',
        radar: 'radar',
        alerts: 'alerts',
        decision: 'decision',
        analytics: 'climate',
      };
      onNavigateView(viewMap[currentChapter.id] || 'home');
    }
    onClose();
  };

  if (!isOpen) return null;

  const progressPercent = Math.min(100, (currentSec / totalDuration) * 100);
  const ChapterIcon = currentChapter.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold text-white tracking-tight">
                  {isTa ? 'வானிலைGPT 50-விநாடி வீடியோ விளக்கம்' : 'WeatherGPT 50-Second Product Walkthrough'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  HD 50s Demo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isTa
                  ? 'அனைத்து முக்கிய அம்சங்களின் முழுமையான நேரலை வீடியோ & ஆய்வு விளக்கம்'
                  : 'Complete walkthrough of all features from Login, 3-Column Table AI, Radar, to Disaster SOS'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Walkthrough"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player & Stage Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Main Cinematic Video Screen */}
          <div
            className={`relative rounded-2xl overflow-hidden border border-slate-750 p-5 sm:p-7 shadow-2xl min-h-[260px] sm:min-h-[300px] flex flex-col justify-between ${currentChapter.mockBg} transition-all duration-700`}
          >
            {/* Ambient Lighting FX */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Screen Top Status Bar */}
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-mono font-bold tracking-wider text-emerald-400 text-[11px] uppercase">
                  Feature Review Active
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {Math.floor(currentSec)}s / {totalDuration}s
                </span>
              </div>

              <div className="px-3 py-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white font-bold text-xs flex items-center space-x-1.5">
                <ChapterIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>{currentChapter.badge}</span>
              </div>
            </div>

            {/* Cinematic Center Visual Stage */}
            <div className="relative z-10 my-4 space-y-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest block">
                  Chapter {currentChapterIndex + 1} of 6 • {currentChapter.time}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  {isTa ? currentChapter.titleTa : currentChapter.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
                  {isTa ? currentChapter.descTa : currentChapter.descEn}
                </p>
              </div>

              {/* Specialized Dynamic Visual Display for 3-Column Table */}
              {currentChapter.id === 'chat' && (
                <div className="mt-3 overflow-hidden rounded-xl border border-sky-400/40 bg-slate-900/90 shadow-xl max-w-xl">
                  <div className="bg-sky-950/80 px-3 py-1.5 border-b border-sky-800/40 text-[11px] font-bold text-sky-200 flex items-center space-x-2">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>Live 3-Column Markdown Table Presentation</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse text-white">
                      <thead>
                        <tr className="bg-slate-950/90 text-sky-300 border-b border-slate-800">
                          <th className="py-2 px-3">📍 Place Name</th>
                          <th className="py-2 px-3">🌧️ Rain / Alert Status</th>
                          <th className="py-2 px-3">⏰ Timing Window</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        <tr className="hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-bold text-white">Tambaram</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">
                              🌧️ YES (85% • ~12.5 mm)
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300">Today 2:00 PM – 4:00 PM</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-bold text-white">Guindy</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                              🌦️ MAYBE (Drizzle / 40%)
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300">Evening 4:00 PM – 6:00 PM</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-bold text-white">Velachery</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium">
                              ☀️ NO (Safe / 0 mm)
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300">Next 24h Safe</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Visual Display for Radar / Alert / Agri / Export */}
              {currentChapter.id !== 'chat' && (
                <div className="mt-2 p-3 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-md max-w-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-white/10 text-sky-300">
                      <ChapterIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {currentChapter.previewVisual.headline}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {currentChapter.previewVisual.subline || currentChapter.previewVisual.tag}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    Active
                  </span>
                </div>
              )}
            </div>

            {/* Screen Bottom Action Row */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={handleLaunchFeature}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg transition-all cursor-pointer"
              >
                <span>{isTa ? 'இந்த அம்சத்தை நேரடியாக இயக்கவும்' : 'Try This Feature Live in App'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                WeatherGPT Verified Meteorological Intelligence
              </span>
            </div>
          </div>

          {/* Video Timeline & Playback Controls */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            {/* Progress Bar with Seekable Scrubber */}
            <div className="space-y-1.5">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  handleSeek(ratio * totalDuration);
                }}
                className="relative w-full h-3 bg-slate-800 rounded-full cursor-pointer overflow-hidden group"
              >
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 rounded-full transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>0:00</span>
                <span>{Math.floor(currentSec)}s / 50s</span>
                <span>0:50</span>
              </div>
            </div>

            {/* Play / Pause / Next Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all cursor-pointer"
                  title={isPlaying ? 'Pause Walkthrough' : 'Play Walkthrough'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <button
                  onClick={() => {
                    setCurrentSec(0);
                    setCurrentChapterIndex(0);
                    setIsPlaying(true);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Replay from Beginning"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="text-xs text-slate-300 font-semibold pl-2">
                  <span>{currentChapter.time}</span> • <span className="text-sky-300">{isTa ? currentChapter.titleTa : currentChapter.titleEn}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const nextIdx = (currentChapterIndex + 1) % CHAPTERS.length;
                  handleSelectChapter(nextIdx);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
              >
                <span>{isTa ? 'அடுத்த அத்தியாயம்' : 'Next Chapter'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 6 Chapter Selector Tiles (Click to Jump) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {CHAPTERS.map((ch, idx) => {
              const isSelected = idx === currentChapterIndex;
              const Icon = ch.icon;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChapter(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-sky-500 shadow-md ring-1 ring-sky-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-sky-400">{ch.time}</span>
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                  </div>
                  <span className={`text-xs font-bold block leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {isTa ? ch.titleTa : ch.titleEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>🚀 Live on <strong className="text-white">weather-gpt-yuvi.vercel.app</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            {isTa ? 'மூடு' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
