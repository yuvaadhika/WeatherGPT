import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  Search,
  Radio,
  Settings,
  Download,
  CheckCircle2,
  Compass
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
  onOpenSidebar
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
    <header className="w-full border-b border-slate-800/80 bg-[#090f22]/90 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0 z-30">
      {/* Left: Mobile Menu & Location */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Location Pill */}
        <button
          onClick={onDetectLocation}
          title="Auto-detect GPS Location"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 transition-all shadow-sm"
        >
          <MapPin className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
          <span className="truncate max-w-[120px] sm:max-w-[180px]">
            {currentLocation ? `${currentLocation.name}` : 'Detecting...'}
          </span>
          <span className="text-[10px] text-cyan-400 font-normal hidden sm:inline">(GPS)</span>
        </button>
      </div>

      {/* Center: Search City Bar */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any city, village..."
            className="w-full pl-8 pr-16 py-1.5 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1 top-1 px-2 py-0.5 text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            {isSearching ? '...' : 'Find'}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full mt-1.5 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
            {searchResults.map((item) => (
              <button
                key={`${item.id}-${item.latitude}`}
                onClick={() => handleSelectCity(item)}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 text-xs flex items-center justify-between text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="font-semibold text-white">{item.name}</span>
                  <span className="text-[10px] text-slate-400 truncate">
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
        {/* Early Warning Status Pill */}
        {topAlert && (
          <div className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center space-x-1.5 ${
            topAlert.level === 'red'
              ? 'bg-rose-950/80 border-rose-600/70 text-rose-300'
              : topAlert.level === 'orange'
              ? 'bg-amber-950/80 border-amber-600/70 text-amber-300'
              : topAlert.level === 'yellow'
              ? 'bg-yellow-950/80 border-yellow-600/70 text-yellow-300'
              : 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
            <span className="uppercase text-[10px] tracking-wider">{topAlert.level} Status</span>
          </div>
        )}
      </div>
    </header>
  );
}
