import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  Search,
  Radio,
  Settings,
  Download,
  CheckCircle2,
  Compass,
  Bell,
  BellRing,
  BellOff
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../services/languages';

export default function Header({
  activeLanguage,
  setActiveLanguage,
  currentLocation,
  onSelectLocation,
  onOpenSettings,
  onOpenExport,
  topAlert,
  onDetectLocation,
  onOpenSidebar,
  notificationsEnabled,
  onToggleNotifications,
  onTestNotification
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCity = (city) => {
    onSelectLocation(city);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0 z-30 shadow-sm">
      {/* Left: Mobile Menu & Location */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Location Pill */}
        <button
          onClick={onDetectLocation}
          title={t.header?.detectGps || 'Auto-detect GPS Location'}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 hover:border-sky-500/50 text-xs font-medium text-slate-800 transition-all shadow-sm"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          <span className="truncate max-w-[120px] sm:max-w-[180px] font-semibold">
            {currentLocation ? `${currentLocation.name}` : (t.header?.detecting || 'Detecting...')}
          </span>
          <span className="text-[10px] text-sky-600 font-normal hidden sm:inline">(GPS)</span>
        </button>
      </div>

      {/* Center: Search City Bar */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.header?.searchPlaceholder || 'Search any city, village...'}
            className="w-full pl-8 pr-16 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-sm"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1 top-1 px-2.5 py-0.5 text-[10px] font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
          >
            {isSearching ? (t.header?.searching || '...') : (t.header?.searchBtn || 'Search')}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100">
            {searchResults.map((item) => (
              <button
                key={`${item.id}-${item.latitude}`}
                onClick={() => handleSelectCity(item)}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 text-xs flex items-center justify-between text-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {item.admin1 ? `${item.admin1}, ` : ''}{item.country}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Weather Alert Push Notification Bell */}
        <button
          onClick={onToggleNotifications}
          title={notificationsEnabled ? (t.header?.alertsOnTooltip || 'Weather Alert Push Notifications Active') : (t.header?.alertsOffTooltip || 'Click to enable Live Weather Alert Notifications')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all shadow-sm ${
            notificationsEnabled
              ? 'bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100'
              : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
          }`}
        >
          {notificationsEnabled ? (
            <BellRing className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          ) : (
            <Bell className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="text-[11px] font-semibold hidden md:inline">
            {notificationsEnabled ? (t.header?.alertsOn || 'Alerts ON') : (t.header?.alertsOff || 'Alerts OFF')}
          </span>
        </button>

        {/* Early Warning Status Pill */}
        {topAlert && (
          <div className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border flex items-center space-x-1.5 ${
            topAlert.level === 'red'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : topAlert.level === 'orange'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : topAlert.level === 'yellow'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
            <span className="text-[10px] font-semibold">
              {topAlert.level.toUpperCase()} {t.header?.alertWarningBadge || 'Alert'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
