import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  MapPin,
  Search,
  Bell,
  BellRing,
  Globe,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  Flower2,
  Database,
  Shield,
  Cpu
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../services/languages';
import { getLocalizedPlaceName } from '../services/weatherService';

export default function Header({
  activeLanguage,
  setActiveLanguage,
  currentLocation,
  onSelectLocation,
  onOpenExport,
  topAlert,
  onDetectLocation,
  onOpenSidebar,
  notificationsEnabled,
  onToggleNotifications,
  onOpenAlertModal,
  onOpenLocationModal,
  onOpenAdminDatabase,
  currentUser,
  onSignOut
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      if (onOpenLocationModal) onOpenLocationModal();
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=6&language=${activeLanguage}&format=json`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCity = (city) => {
    const localizedName = getLocalizedPlaceName(city.name, activeLanguage) || city.name;
    onSelectLocation({
      ...city,
      rawName: city.name,
      name: localizedName,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const displayLocationName = currentLocation
    ? (getLocalizedPlaceName(currentLocation.rawName || currentLocation.name, activeLanguage) || currentLocation.name)
    : (t.header?.detecting || 'Detecting...');

  return (
    <header className="w-full border-b border-sky-200/70 bg-[#f5f9fd]/95 backdrop-blur-xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 z-30 shadow-2xs">
      {/* Left: Mobile Menu & Location */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 sm:p-2 rounded-xl bg-white/90 border border-sky-200/70 text-slate-600 hover:text-slate-900 md:hidden cursor-pointer hover:border-sky-300"
          title="Open Navigation"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Current Location Pill & Directory Opener */}
        <button
          onClick={() => onOpenLocationModal ? onOpenLocationModal() : onDetectLocation && onDetectLocation(activeLanguage)}
          title={activeLanguage === 'ta' ? 'அனைத்து இடங்களையும் (A-Z) காண்க' : 'Browse All Places Directory (A-Z)'}
          className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white/90 hover:bg-sky-50 border border-sky-200/80 hover:border-sky-400 text-xs font-medium text-slate-800 transition-all shadow-2xs cursor-pointer group min-w-0"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span className="truncate max-w-[95px] xs:max-w-[130px] sm:max-w-[180px] font-bold text-slate-900 group-hover:text-sky-700">
            {displayLocationName}
          </span>
          <span className="text-[9px] sm:text-[10px] text-sky-600 font-bold px-1 py-0.2 rounded bg-sky-100/90 border border-sky-200 flex-shrink-0">
            A-Z ▾
          </span>
        </button>
      </div>

      {/* Center: Search City Bar (Tablet/Desktop) */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onClick={() => {
              if (onOpenLocationModal) onOpenLocationModal();
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeLanguage === 'ta' ? 'அனைத்து இடங்கள் (A-Z) தேடுக...' : 'Search all places (A-Z directory)...'}
            className="w-full pl-8 pr-20 py-1.5 text-xs bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all shadow-sm cursor-pointer"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <div className="absolute right-1 top-1 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => onOpenLocationModal && onOpenLocationModal()}
              className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Open Alphabetical A-Z Places Directory"
            >
              A-Z
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 text-[10px] font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              {isSearching ? (t.header?.searching || '...') : (t.header?.searchBtn || 'Search')}
            </button>
          </div>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100">
            {searchResults.map((item) => {
              const itemCity = getLocalizedPlaceName(item.name, activeLanguage) || item.name;
              const itemCountry = getLocalizedPlaceName(item.country, activeLanguage) || item.country;
              const itemAdmin = item.admin1 ? `${getLocalizedPlaceName(item.admin1, activeLanguage) || item.admin1}, ` : '';

              return (
                <button
                  key={`${item.id}-${item.latitude}`}
                  onClick={() => handleSelectCity(item)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 text-xs flex items-center justify-between text-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-900">{itemCity}</span>
                    <span className="text-[10px] text-slate-500 truncate">
                      {itemAdmin}{itemCountry}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
        {/* Language Selector in Header */}
        <div className="flex items-center space-x-1 bg-white/90 border border-slate-200 hover:border-sky-400 rounded-xl px-1.5 sm:px-2 py-1 shadow-2xs transition-all">
          <Globe className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
          <select
            value={activeLanguage}
            onChange={(e) => setActiveLanguage(e.target.value)}
            className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[65px] sm:max-w-none"
            title="Choose Language (10 Languages Supported)"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-white text-slate-800">
                {l.nativeName}
              </option>
            ))}
          </select>
        </div>

        {/* Weather Alert Push & SMS / Email Notification Bell */}
        <button
          onClick={onOpenAlertModal || onToggleNotifications}
          title="Configure Weather Alerts & Notifications"
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer ${
            notificationsEnabled
              ? 'bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100'
              : 'bg-white/90 border-slate-200 text-slate-500 hover:text-slate-800'
          }`}
        >
          {notificationsEnabled ? (
            <BellRing className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          ) : (
            <Bell className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="text-[11px] font-semibold hidden md:inline">
            {notificationsEnabled ? (t.header?.alertsOn || 'Alerts ON') : (t.header?.alertsOff || 'Alerts Setup')}
          </span>
        </button>

        {/* Top Severe Warning Badge if Active (Red / Orange / Yellow) */}
        {topAlert && topAlert.level !== 'green' && (
          <div
            onClick={onOpenAlertModal}
            className={`hidden sm:flex px-2 py-1 rounded-xl text-[10px] font-bold border items-center space-x-1 cursor-pointer ${
              topAlert.level === 'red'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : topAlert.level === 'orange'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
            <span>{topAlert.level.toUpperCase()} Alert</span>
          </div>
        )}

        {/* Logged In User Profile Pill & Dropdown */}
        {currentUser && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/90 hover:bg-sky-50 border border-sky-200/80 hover:border-sky-400 transition-all shadow-2xs cursor-pointer"
              title={currentUser.name || 'User Account'}
            >
              {currentUser.avatarType === 'guest' && currentUser.avatar?.startsWith('http') ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-sky-300"
                />
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 text-white flex items-center justify-center font-black text-[10px] sm:text-xs shadow-2xs">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[80px] truncate">
                {currentUser.name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>

            {/* Profile Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white/95 backdrop-blur-xl border border-sky-100 rounded-2xl shadow-xl p-3 z-50 divide-y divide-sky-100 space-y-2 animate-fadeIn">
                <div className="flex items-center space-x-2.5 pb-2">
                  {currentUser.avatarType === 'guest' && currentUser.avatar?.startsWith('http') ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border border-sky-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200">
                      {currentUser.role || 'Member'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  {/* Accessor-only Database Option */}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onOpenAdminDatabase) onOpenAdminDatabase();
                    }}
                    className="w-full py-1.5 px-2 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-sky-600" />
                    <span>{activeLanguage === 'ta' ? '🔐 அணுகல் தரவுத்தளம்' : '🔐 Accessor Database'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onSignOut) onSignOut();
                    }}
                    className="w-full py-1.5 px-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{activeLanguage === 'ta' ? 'வெளியேறு (Sign Out)' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
