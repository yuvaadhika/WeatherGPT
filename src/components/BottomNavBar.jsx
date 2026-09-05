import React from 'react';
import {
  Home,
  Map,
  ShieldAlert,
  MessageSquare,
  Briefcase,
  Radio,
  Sparkles,
  Mic,
  Wheat
} from 'lucide-react';
import { TRANSLATIONS } from '../services/languages';

export default function BottomNavBar({
  activeView,
  setActiveView,
  activeLanguage = 'en',
  alertCount = 0
}) {
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  const tabs = [
    {
      id: 'home',
      label: activeLanguage === 'ta' ? 'முகப்பு' : activeLanguage === 'hi' ? 'होम' : 'Home',
      icon: Home,
    },
    {
      id: 'radar',
      label: activeLanguage === 'ta' ? 'ரேடார்' : activeLanguage === 'hi' ? 'रडार' : 'Map',
      icon: Map,
    },
    {
      id: 'alerts',
      label: activeLanguage === 'ta' ? 'எச்சரிக்கை' : activeLanguage === 'hi' ? 'अलर्ट' : 'Alerts',
      icon: ShieldAlert,
      badge: alertCount > 0 ? alertCount : null,
    },
    {
      id: 'chat',
      label: activeLanguage === 'ta' ? 'AI அரட்டை' : activeLanguage === 'hi' ? 'AI चैट' : 'AI Chat',
      icon: MessageSquare,
      highlight: true,
    },
    {
      id: 'decision',
      label: activeLanguage === 'ta' ? 'துறை தாக்கம்' : activeLanguage === 'hi' ? 'प्रभाव' : 'Impact',
      icon: Wheat,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 px-2 py-1.5 max-w-lg mx-auto shadow-2xl transition-all">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-sky-600 font-bold scale-105'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              {/* Highlight background pill for active tab */}
              {isActive && (
                <span className="absolute inset-0 bg-sky-50 rounded-2xl -z-10 border border-sky-200/60 animate-fadeIn"></span>
              )}

              {/* Icon Container */}
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Tab Label */}
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
