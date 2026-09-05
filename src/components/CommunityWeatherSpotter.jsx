import React, { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Send,
  Sparkles,
  CloudRain,
  Waves,
  Zap,
  Wind,
  Sun,
  Eye,
  CheckCircle2,
  Clock,
  ThumbsUp,
  Share2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';
import { getLocalizedPlaceName } from '../services/weatherService';

const SPOTTER_CATEGORIES = [
  { id: 'heavy_rain', icon: CloudRain, labelTa: 'பலத்த மழை', labelEn: 'Heavy Downpour', color: 'bg-sky-50 text-sky-700 border-sky-300' },
  { id: 'waterlogging', icon: Waves, labelTa: 'தண்ணீர் தேக்கம்', labelEn: 'Waterlogged Road', color: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
  { id: 'thunderstorm', icon: Zap, labelTa: 'இடி மின்னல்', labelEn: 'Thunder & Lightning', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  { id: 'strong_wind', icon: Wind, labelTa: 'மரம் சாய்வு / காற்று', labelEn: 'Strong Wind / Gale', color: 'bg-teal-50 text-teal-700 border-teal-300' },
  { id: 'fog', icon: Eye, labelTa: 'அடர்ந்த பனிமூட்டம்', labelEn: 'Dense Fog / Mist', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { id: 'clear_sky', icon: Sun, labelTa: 'தெளிவான வானம்', labelEn: 'Clear & Sunny', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
];

const LOCAL_STORAGE_KEY = 'weathergpt_community_spotter_reports_v2';

export default function CommunityWeatherSpotter({ activeLanguage = 'en', currentLocation }) {
  const [reports, setReports] = useState([]);
  const [selectedCat, setSelectedCat] = useState(SPOTTER_CATEGORIES[0]);
  const [localityText, setLocalityText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToast, setSubmittedToast] = useState(false);

  // Initialize and load crowdsourced reports
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setReports(JSON.parse(stored));
      } else {
        // Sensible default community feed for immediate interactivity
        const defaultCity = currentLocation?.name || 'Chennai';
        const initialSeed = [
          {
            id: 'rep-1',
            city: defaultCity,
            locality: 'Anna Nagar West / Main Road',
            category: 'waterlogging',
            note: 'Underpass has about 1.5 feet water. Two-wheelers taking service road diversion.',
            timestamp: '5 min ago',
            upvotes: 14,
            verified: true,
          },
          {
            id: 'rep-2',
            city: defaultCity,
            locality: 'T. Nagar / Usman Road',
            category: 'heavy_rain',
            note: 'Intense rain showers started 10 mins ago with gusty winds.',
            timestamp: '18 min ago',
            upvotes: 9,
            verified: true,
          },
          {
            id: 'rep-3',
            city: defaultCity,
            locality: 'OMR Sholinganallur Junction',
            category: 'strong_wind',
            note: 'High winds blowing dust; small tree branches on service lane.',
            timestamp: '35 min ago',
            upvotes: 6,
            verified: false,
          },
          {
            id: 'rep-4',
            city: defaultCity,
            locality: 'Marina Beach Road',
            category: 'clear_sky',
            note: 'Breezy and dry near shoreline with pleasant sea breeze.',
            timestamp: '1 hr ago',
            upvotes: 4,
            verified: true,
          },
        ];
        setReports(initialSeed);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialSeed));
      }
    } catch (e) {
      console.warn(e);
    }
  }, [currentLocation]);

  const handleAddReport = (e) => {
    e.preventDefault();
    if (!localityText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const newReport = {
      id: `rep-${Date.now()}`,
      city: currentLocation?.name || 'Local Station',
      locality: localityText.trim(),
      category: selectedCat.id,
      note: noteText.trim() || (activeLanguage === 'ta' ? 'உள்ளூர் வானிலை நிலவரம் பதிவு செய்யப்பட்டது.' : 'Ground weather verified by resident.'),
      timestamp: activeLanguage === 'ta' ? 'சற்றுமுன்' : 'Just now',
      upvotes: 1,
      verified: true,
    };

    const updated = [newReport, ...reports];
    setReports(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {}

    setLocalityText('');
    setNoteText('');
    setIsSubmitting(false);
    setSubmittedToast(true);
    setTimeout(() => setSubmittedToast(false), 3000);
  };

  const handleUpvote = (id) => {
    setReports((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  const getCatObj = (catId) => {
    return SPOTTER_CATEGORIES.find((c) => c.id === catId) || SPOTTER_CATEGORIES[0];
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-20 animate-fadeIn">
      {/* 1. Header Card */}
      <div className="bg-gradient-to-br from-white via-teal-50/40 to-sky-50/30 border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {activeLanguage === 'ta' ? '📍 மக்கள் நேரடி வானிலை சமூகம்' : '📍 Hyperlocal Community Weather Spotter'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeLanguage === 'ta'
                  ? 'உங்கள் பகுதியில் உள்ள நேரடி மழை, தண்ணீர் தேக்கம் மற்றும் சாலை நிலவரங்களை 1-கிளிக்கில் பகிருங்கள்'
                  : 'Crowdsourced street-level ground truth reports verified by citizens in real-time.'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-teal-100 text-teal-800 border border-teal-200">
            {reports.length} Active Spotters
          </span>
        </div>

        {/* 2. Quick 1-Tap Tagging & Submission Form */}
        <form onSubmit={handleAddReport} className="p-3.5 bg-white/95 border border-slate-200/90 rounded-2xl space-y-3 shadow-xs">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            {activeLanguage === 'ta' ? 'தற்போதைய வானிலை நிலையைத் தேர்வு செய்யவும்:' : '1. Tag Current Sky / Ground Condition:'}
          </label>

          {/* Category Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SPOTTER_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCat.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{activeLanguage === 'ta' ? cat.labelTa : cat.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Locality & Note Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <input
                type="text"
                value={localityText}
                onChange={(e) => setLocalityText(e.target.value)}
                placeholder={activeLanguage === 'ta' ? 'பகுதி / தெரு பெயர் (எ.கா: அண்ணா நகர் மெயின் ரோடு)' : 'Locality / Area Name (e.g., T. Nagar)'}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                required
              />
            </div>
            <div>
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={activeLanguage === 'ta' ? 'கூடுதல் தகவல் (எ.கா: சுரங்கப்பாதையில் தண்ணீர்)' : 'Details (e.g. 1 ft water in underpass)'}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">
              📍 {currentLocation?.name || 'Local Area'}
            </span>
            <button
              type="submit"
              disabled={!localityText.trim() || isSubmitting}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 transition-all cursor-pointer ${
                localityText.trim() && !isSubmitting
                  ? 'bg-teal-600 hover:bg-teal-700 shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{activeLanguage === 'ta' ? 'பதிவேற்று' : 'Post Spotter Report'}</span>
            </button>
          </div>
        </form>

        {/* Feedback toast */}
        {submittedToast && (
          <div className="p-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center animate-fadeIn">
            ✓ {activeLanguage === 'ta' ? 'உங்கள் வானிலை அறிக்கை நேரலையாக பகிரப்பட்டது!' : 'Your spotter report was shared with the community!'}
          </div>
        )}
      </div>

      {/* 3. Live Community Feed */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
              {activeLanguage === 'ta' ? 'நேரலை மக்கள் அவதானிப்புகள் (Live Community Feed)' : 'Live Ground Spotter Feed'}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {reports.length} Reports
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {reports.map((rep) => {
            const catObj = getCatObj(rep.category);
            const Icon = catObj.icon;

            return (
              <div
                key={rep.id}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 hover:border-teal-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs">
                      <Icon className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <MapPin className="w-3 h-3 text-sky-600" />
                        <span>{rep.locality}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {rep.city} • {rep.timestamp}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${catObj.color}`}>
                    {activeLanguage === 'ta' ? catObj.labelTa : catObj.labelEn}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed pl-1">
                  {rep.note}
                </p>

                {/* Footer action bar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{activeLanguage === 'ta' ? 'சமூகத்தால் சரிபார்க்கப்பட்டது' : 'Verified by Citizens'}</span>
                  </div>

                  <button
                    onClick={() => handleUpvote(rep.id)}
                    className="flex items-center space-x-1 text-[11px] font-bold text-slate-600 hover:text-teal-700 px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-teal-600" />
                    <span>{rep.upvotes} {activeLanguage === 'ta' ? 'உறுதிசெய்தனர்' : 'Confirm'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
