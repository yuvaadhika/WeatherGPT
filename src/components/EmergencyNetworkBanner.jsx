import React, { useState, useEffect } from 'react';
import { WifiOff, Radio, ShieldAlert, Wifi, X, PhoneCall, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { offlineVaultService, EMERGENCY_HELPLINES } from '../services/offlineVaultService';

export default function EmergencyNetworkBanner({ activeLanguage = 'en', onOpenSOS }) {
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('offline'); // 'offline' | 'restored'
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineVaultService.subscribeNetworkStatus(({ status }) => {
      if (status === 'offline_emergency') {
        setIsOffline(true);
        setIsDismissed(false);
        setToastType('offline');
        setToastMessage(
          activeLanguage === 'ta'
            ? '📡 டவர் சிக்னல் இல்லை: அவசர கால ஆஃப்லைன் பயன்முறை செயல்படுத்தப்பட்டது'
            : '📡 Low Signal / Tower Down: Emergency Offline Mode Active'
        );
        setShowToast(true);

        // Auto-disappear after 6 seconds as requested
        const timer = setTimeout(() => {
          setShowToast(false);
        }, 6500);
        return () => clearTimeout(timer);
      } else if (status === 'online') {
        setIsOffline(false);
        setToastType('restored');
        setToastMessage(
          activeLanguage === 'ta'
            ? '🟢 டவர் சிக்னல் மீண்டும் இணைக்கப்பட்டது (Live Network Restored)'
            : '🟢 Network & Live Tower Signal Restored'
        );
        setShowToast(true);

        // Auto-disappear after 4 seconds
        const timer = setTimeout(() => {
          setShowToast(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, [activeLanguage]);

  return (
    <>
      {/* 1. Auto-Disappearing In-App Alert Banner (Toast / Slide Notification) */}
      {showToast && (
        <div className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 z-50 max-w-md animate-bounce-short">
          <div
            className={`p-4 rounded-3xl shadow-2xl border backdrop-blur-xl flex items-start justify-between gap-3 transition-all ${
              toastType === 'offline'
                ? 'bg-gradient-to-r from-slate-900/95 via-rose-950/95 to-slate-900/95 border-rose-500/50 text-white shadow-rose-900/30'
                : 'bg-gradient-to-r from-emerald-900/95 to-teal-950/95 border-emerald-400/50 text-white shadow-emerald-900/30'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`p-2.5 rounded-2xl flex-shrink-0 ${
                  toastType === 'offline' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                }`}
              >
                {toastType === 'offline' ? <WifiOff className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs sm:text-sm font-black tracking-tight">{toastMessage}</h4>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {toastType === 'offline'
                    ? activeLanguage === 'ta'
                      ? 'டவர் சிக்னல் இல்லை என்றாலும் Chatbot, பேரிடர் பாதுகாப்பு விதிகள் & SOS எண்கள் ஆஃப்லைனில் 100% செயல்படும்!'
                      : 'Chatbot, SOS emergency contacts & disaster safety protocols are working 100% offline from local vault!'
                    : activeLanguage === 'ta'
                    ? 'நேரடி Open-Meteo Doppler ரேடார் மற்றும் புதிய வானிலை தரவுகள் ஒத்திசைக்கப்படுகின்றன.'
                    : 'Live Doppler Radar & real-time high-resolution telemetry synced.'}
                </p>
                {toastType === 'offline' && onOpenSOS && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowToast(false);
                      onOpenSOS();
                    }}
                    className="mt-1 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-extrabold shadow-sm transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{activeLanguage === 'ta' ? 'அவசர SOS எண்கள் (Dial 1077 / 112)' : 'Emergency SOS Contacts'}</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="p-1 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Sleek Mini Status Indicator (Always accessible when offline) */}
      {isOffline && !isDismissed && !showToast && (
        <div className="w-full bg-slate-900 border-b border-rose-500/30 text-white px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs animate-fadeIn z-40">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-extrabold text-[11px] text-rose-300 flex items-center space-x-1">
              <Radio className="w-3.5 h-3.5" />
              <span>
                {activeLanguage === 'ta'
                  ? 'டவர் சிக்னல் ஆஃப்லைன் பயன்முறை செயல்படுகிறது (Edge AI Active)'
                  : 'Tower Signal Offline: Edge AI Disaster Vault Active'}
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenSOS && (
              <button
                type="button"
                onClick={onOpenSOS}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer"
              >
                {activeLanguage === 'ta' ? 'அவசர உதவி' : 'SOS Helplines'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white cursor-pointer"
              title="Hide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
