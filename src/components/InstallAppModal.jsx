import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  WifiOff,
  Zap,
  ShieldCheck,
  Globe,
  Radio,
  Monitor
} from 'lucide-react';
import { pwaService } from '../services/pwaService';

export default function InstallAppModal({ isOpen, onClose, activeLanguage = 'en' }) {
  const [pwaState, setPwaState] = useState(() => ({
    canInstall: false,
    isInstalled: pwaService.isStandalone(),
    platform: pwaService.getPlatform()
  }));
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaService.subscribe((state) => {
      setPwaState(state);
      if (state.isInstalled) {
        setInstallSuccess(true);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const result = await pwaService.promptInstall();
      if (result.outcome === 'accepted') {
        setInstallSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsInstalling(false);
    }
  };

  const isTa = activeLanguage === 'ta';
  const platform = pwaState.platform;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#f5faff] via-white to-[#edf6fd] border border-sky-200/90 rounded-3xl shadow-2xl overflow-hidden text-slate-850 animate-scaleUp">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-600"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-white/90 hover:bg-sky-50 text-slate-400 hover:text-slate-800 border border-slate-200/80 transition-all cursor-pointer z-10 shadow-2xs"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* App Brand & Header */}
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src="/wyndra-logo.png"
                alt="WeatherGPT App"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-md border border-sky-200 p-1.5 bg-white object-contain"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">WeatherGPT</h3>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-300 text-[10px] font-extrabold uppercase">
                  PWA App
                </span>
              </div>
              <p className="text-xs text-sky-800 font-semibold">
                {isTa
                  ? 'நெட்வொர்க் டவர் இல்லாத போதும் ஆஃப்லைனில் இயங்கும் செயலி'
                  : 'Zero-Tower Offline Capable Weather & Disaster App'}
              </p>
            </div>
          </div>

          {/* Key Advantages Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/90 border border-sky-100 shadow-2xs space-y-1">
              <div className="flex items-center space-x-1.5 text-sky-700 font-bold text-xs">
                <WifiOff className="w-3.5 h-3.5 text-sky-600" />
                <span>{isTa ? '100% ஆஃப்லைன்' : 'Zero-Signal Edge'}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {isTa ? 'டவர் சிக்னல் இல்லை என்றாலும் உடனே ஓபன் ஆகும்.' : 'Launches instantly even with no cell network.'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/90 border border-emerald-100 shadow-2xs space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isTa ? '1-Tap வேகம்' : 'Instant Launch'}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {isTa ? 'ஹோம் ஸ்கிரீன் ஐகானில் இருந்து நேரடி முழுத்திரை.' : 'Full standalone app experience without URL bars.'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/90 border border-indigo-100 shadow-2xs space-y-1">
              <div className="flex items-center space-x-1.5 text-indigo-700 font-bold text-xs">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isTa ? 'லிங்க் சப்போர்ட்' : 'Link & App Dual'}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {isTa ? 'லிங்க் வழியேயும் திறக்கும், ஆப் ஆகவும் இயங்கும்.' : 'Open anytime via URL or installed app.'}
              </p>
            </div>
          </div>

          {/* Success or Action Status */}
          {installSuccess || pwaState.isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center space-x-3 shadow-2xs">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm text-emerald-900">
                  {isTa ? 'WeatherGPT செயலி வெற்றிகரமாக நிறுவப்பட்டது!' : 'WeatherGPT is Installed!'}
                </h4>
                <p className="text-xs text-emerald-800">
                  {isTa
                    ? 'உங்கள் மொபைல் ஹோம் ஸ்கிரீன் அல்லது ஆப் மெனுவில் இருந்து எப்போது வேண்டுமானாலும் திறக்கலாம்.'
                    : 'You can launch it anytime directly from your Home Screen or App Menu.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Primary 1-Click Install Button (Always clickable) */}
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-800 text-white font-black text-sm sm:text-base flex items-center justify-center space-x-2 shadow-md shadow-sky-600/20 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-5 h-5 animate-bounce" />
                <span>
                  {isInstalling
                    ? (isTa ? 'நிறுவப்படுகிறது...' : 'Installing...')
                    : (isTa ? '📲 WeatherGPT செயலியை நிறுவு (Install App)' : '📲 Install WeatherGPT App (1-Click)')}
                </span>
              </button>

              {/* OS-Specific Guided Instructions */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-sky-800">
                  {platform === 'ios' ? <Smartphone className="w-4 h-4 text-sky-600" /> : platform === 'windows' || platform === 'mac' ? <Monitor className="w-4 h-4 text-sky-600" /> : <Smartphone className="w-4 h-4 text-sky-600" />}
                  <span>
                    {platform === 'ios'
                      ? (isTa ? 'iPhone / iPad (Safari) நிறுவும் முறை:' : 'iPhone / iPad (Safari) Installation Steps:')
                      : platform === 'windows' || platform === 'mac'
                      ? (isTa ? 'கணினி / PC (Chrome / Edge) நிறுவும் முறை:' : 'Desktop / PC (Chrome or Edge) Installation:')
                      : (isTa ? 'Android (Chrome / Browser) நிறுவும் முறை:' : 'Android (Chrome / Browser) Installation:')}
                  </span>
                </div>

                {platform === 'ios' ? (
                  <ol className="text-xs text-slate-700 space-y-2 pl-1 list-none">
                    <li className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 font-bold flex items-center justify-center text-[11px] flex-shrink-0">1</span>
                      <span>
                        Safari பிரவுசரின் கீழே உள்ள <Share2 className="w-3.5 h-3.5 inline text-sky-600 mx-1" /> <strong>Share</strong> ஐகானை தட்டவும்.
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 font-bold flex items-center justify-center text-[11px] flex-shrink-0">2</span>
                      <span>
                        கீழே ஸ்க்ரோல் செய்து <PlusSquare className="w-3.5 h-3.5 inline text-sky-600 mx-1" /> <strong>'Add to Home Screen'</strong> என்பதை தேர்ந்தெடுக்கவும்.
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 font-bold flex items-center justify-center text-[11px] flex-shrink-0">3</span>
                      <span>மேலே உள்ள <strong>'Add'</strong> என்பதை அழுத்தவும். இப்போது ஆப் தயாராகிவிடும்!</span>
                    </li>
                  </ol>
                ) : (
                  <ol className="text-xs text-slate-700 space-y-2 pl-1 list-none">
                    <li className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 font-bold flex items-center justify-center text-[11px] flex-shrink-0">1</span>
                      <span>
                        மேலே உள்ள <strong>'Install App'</strong> பட்டனை கிளிக் செய்யவும் (அல்லது முகவரிப் பட்டியில் உள்ள <strong>Install ⊕</strong> ஐகானை அழுத்தவும்).
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 font-bold flex items-center justify-center text-[11px] flex-shrink-0">2</span>
                      <span>திரையில் தோன்றும் <strong>'Install'</strong> என்பதை உறுதிசெய்யவும்.</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 font-bold flex items-center justify-center text-[11px] flex-shrink-0">3</span>
                      <span>இப்போது டவர் நெட்வொர்க் இல்லாவிட்டாலும் ஆப் ஐகானை கிளிக் செய்து பயன்படுத்தலாம்!</span>
                    </li>
                  </ol>
                )}
              </div>
            </div>
          )}

          {/* Footer Close */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTa ? 'பாதுகாப்பானது & குறைந்த மெமரி' : 'Lightweight & Safe PWA'}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/90 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
            >
              {isTa ? 'மூடு (Close)' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
