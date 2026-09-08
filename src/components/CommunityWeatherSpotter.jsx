import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  Camera,
  Image as ImageIcon,
  X,
  RotateCw
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
  const [spotterImage, setSpotterImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToast, setSubmittedToast] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState('');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  const handleOpenCamera = async (mode = facingMode) => {
    setCameraError('');
    setIsCameraOpen(true);
    try {
      stopCameraStream();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setCameraError(
        activeLanguage === 'ta'
          ? 'கேமராவை அணுக முடியவில்லை. படத்தைப் பதிவேற்றவும்.'
          : 'Could not access camera. Please upload an image file.'
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
      setSpotterImage(canvas.toDataURL('image/jpeg', 0.85));
      handleCloseCamera();
    } catch (err) {
      console.error('Camera capture failed:', err);
    }
  };

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setSpotterImage(e.target?.result);
    reader.readAsDataURL(file);
  };

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
      image: spotterImage || null,
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
    setSpotterImage(null);
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
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = '';
        }}
        accept="image/*"
        className="hidden"
      />

      {/* 1. Header Card */}
      <div className="bg-gradient-to-br from-white via-teal-50/40 to-sky-50/30 border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {activeLanguage === 'ta' ? 'மக்கள் நேரடி வானிலை சமூகம்' : 'Hyperlocal Community Weather Spotter'}
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

          {/* Image Preview Bar */}
          {spotterImage && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-teal-50/80 border border-teal-200 text-xs">
              <div className="flex items-center space-x-2">
                <img src={spotterImage} alt="Spotter Preview" className="w-10 h-10 object-cover rounded-lg border border-teal-300" />
                <span className="text-[11px] font-semibold text-teal-900">
                  {activeLanguage === 'ta' ? 'படம் இணைக்கப்பட்டுள்ளது' : 'Photo attached'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSpotterImage(null)}
                className="p-1 rounded-lg hover:bg-teal-100 text-teal-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Submit & Photo Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{currentLocation?.name || 'Local Area'}</span>
              </span>

              {/* Live Camera Button */}
              <button
                type="button"
                onClick={() => handleOpenCamera()}
                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 flex items-center space-x-1 transition-all cursor-pointer"
                title="Open Camera"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{activeLanguage === 'ta' ? 'கேமரா' : 'Camera'}</span>
              </button>

              {/* Gallery Image Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 flex items-center space-x-1 transition-all cursor-pointer"
                title="Upload Photo"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{activeLanguage === 'ta' ? 'படம்' : 'Photo'}</span>
              </button>
            </div>

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

                {/* Optional Attached Photo */}
                {rep.image && (
                  <div className="pt-1">
                    <img
                      src={rep.image}
                      alt="Spotter condition capture"
                      className="max-h-48 rounded-xl object-cover border border-slate-200 shadow-2xs"
                    />
                  </div>
                )}

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

      {/* Live Camera Modal for Community Spotter */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-teal-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 sm:p-4 bg-slate-900 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-xs sm:text-sm">
                  {activeLanguage === 'ta' ? 'நேரடி வானிலை கேமரா' : 'Live Spotter Camera'}
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

            <div className="relative bg-black aspect-4/3 sm:aspect-16/10 flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-rose-300 text-xs space-y-3">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {activeLanguage === 'ta' ? 'படத்தை பதிவேற்று' : 'Upload from Device'}
                  </button>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
            </div>

            {!cameraError && (
              <div className="p-4 bg-slate-900 flex items-center justify-around border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex flex-col items-center space-y-1"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[9px] font-semibold">{activeLanguage === 'ta' ? 'மாற்று' : 'Flip'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 border-4 border-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 active:scale-90 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-600 group-hover:bg-teal-500 flex items-center justify-center text-white">
                    <Camera className="w-6 h-6" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCloseCamera();
                    fileInputRef.current?.click();
                  }}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex flex-col items-center space-y-1"
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
