import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  X,
  Navigation,
  Globe,
  Building2,
  Map,
  Sparkles,
  Check,
  ChevronRight,
  Compass
} from 'lucide-react';
import {
  ALL_AVAILABLE_PLACES_ALPHABETICAL,
  ALPHABET_LETTERS,
  getAlphabeticalPlacesFiltered,
  getLocalizedPlaceName,
  searchLocation
} from '../services/weatherService';
import { TRANSLATIONS } from '../services/languages';

export default function AlphabeticalLocationModal({
  isOpen,
  onClose,
  activeLanguage = 'en',
  currentLocation,
  onSelectLocation,
  onDetectGps
}) {
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | 'district_tn' | 'locality_tn' | 'metro_in' | 'global'
  const [liveApiResults, setLiveApiResults] = useState([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  const searchInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    } else {
      setSearchQuery('');
      setSelectedLetter('ALL');
      setSelectedCategory('ALL');
      setLiveApiResults([]);
    }
  }, [isOpen]);

  // Live Open-Meteo search if query has > 2 characters
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setLiveApiResults([]);
      setIsSearchingApi(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const results = await searchLocation(q, activeLanguage);
        setLiveApiResults(results || []);
      } catch (err) {
        console.warn('Geocoding live search error:', err);
      } finally {
        setIsSearchingApi(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, activeLanguage]);

  // Filtered preset list
  const filteredPlaces = useMemo(() => {
    return getAlphabeticalPlacesFiltered({
      query: searchQuery,
      letter: selectedLetter,
      category: selectedCategory,
      lang: activeLanguage,
    });
  }, [searchQuery, selectedLetter, selectedCategory, activeLanguage]);

  // Group places by first letter for alphabetical directory display
  const groupedPlaces = useMemo(() => {
    const groups = {};
    for (const place of filteredPlaces) {
      const firstChar = place.name.charAt(0).toUpperCase();
      if (!groups[firstChar]) groups[firstChar] = [];
      groups[firstChar].push(place);
    }
    return groups;
  }, [filteredPlaces]);

  const sortedLettersInGroups = useMemo(() => {
    return Object.keys(groupedPlaces).sort();
  }, [groupedPlaces]);

  if (!isOpen) return null;

  const handleSelect = (place) => {
    const rawName = place.rawName || place.name;
    const localizedName = getLocalizedPlaceName(rawName, activeLanguage) || place.name;
    onSelectLocation({
      ...place,
      rawName,
      name: localizedName,
    });
    onClose();
  };

  const handleGpsClick = () => {
    if (onDetectGps) {
      onDetectGps(activeLanguage);
    }
    onClose();
  };

  const categoryTabs = [
    { id: 'ALL', label: activeLanguage === 'ta' ? 'அனைத்து இடங்கள் (A-Z)' : 'All Places (A-Z)' },
    { id: 'district_tn', label: activeLanguage === 'ta' ? 'தமிழ்நாடு மாவட்டங்கள் (38)' : 'TN Districts (38)' },
    { id: 'locality_tn', label: activeLanguage === 'ta' ? 'தமிழக நகரங்கள் & பகுதிகள்' : 'TN Localities' },
    { id: 'metro_in', label: activeLanguage === 'ta' ? 'இந்திய பெருநகரங்கள்' : 'India Metros' },
    { id: 'global', label: activeLanguage === 'ta' ? 'உலக நகரங்கள்' : 'Global Hubs' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-blue-50">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {activeLanguage === 'ta' ? 'இடங்கள் அகரவரிசை பட்டியல் (A-Z)' : 'Available Places Directory (A-Z)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activeLanguage === 'ta'
                    ? '38 தமிழ்நாடு மாவட்டங்கள், இந்திய & உலக நகரங்கள்'
                    : 'All 38 TN Districts, Indian Capitals & Global Metros'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedLetter !== 'ALL') setSelectedLetter('ALL');
              }}
              placeholder={activeLanguage === 'ta' ? 'ஊர், மாவட்டம் அல்லது நகரம் தேடவும்...' : 'Type any district, city, or village...'}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 shadow-sm transition-all"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick GPS Location Detect Button */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button
              onClick={handleGpsClick}
              className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.99]"
            >
              <Navigation className="w-3.5 h-3.5 animate-pulse" />
              <span>
                {activeLanguage === 'ta' ? '🎯 எனது தற்போதைய ஜிபிஎஸ் இடத்தை தேர்ந்தெடுக்கவும்' : '🎯 Use My Current GPS Location'}
              </span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedCategory(tab.id);
                setSelectedLetter('ALL');
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sticky Alphabet Jump Strip (A to Z) */}
        <div className="px-2 py-1.5 bg-white border-b border-slate-100 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar shadow-xs">
          {ALPHABET_LETTERS.map((letter) => {
            const isSelected = selectedLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => {
                  setSelectedLetter(letter);
                  setSearchQuery('');
                }}
                className={`min-w-[26px] h-7 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm scale-105'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-sky-600'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* Places Scroll Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-5 divide-y divide-slate-100"
        >
          {/* Live Geocoding API Results if user is searching */}
          {searchQuery.trim().length >= 2 && liveApiResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-sky-700">
                <Globe className="w-3.5 h-3.5" />
                <span>
                  {activeLanguage === 'ta' ? 'நேரலை தேடல் முடிவுகள் (Open-Meteo)' : 'Live Global Search Results'}
                </span>
                {isSearchingApi && <span className="text-[10px] text-slate-400">...</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {liveApiResults.map((item) => {
                  const localizedCity = getLocalizedPlaceName(item.name, activeLanguage) || item.name;
                  const localizedCountry = getLocalizedPlaceName(item.country, activeLanguage) || item.country;
                  const adminStr = item.admin1 ? `${getLocalizedPlaceName(item.admin1, activeLanguage) || item.admin1}, ` : '';

                  return (
                    <button
                      key={`api-${item.id || item.latitude}-${item.longitude}`}
                      onClick={() => handleSelect(item)}
                      className="p-3 rounded-2xl bg-sky-50/50 hover:bg-sky-100/70 border border-sky-200/70 text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="w-8 h-8 rounded-xl bg-sky-600/10 text-sky-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-sky-600 truncate">
                            {localizedCity}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {adminStr}{localizedCountry}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grouped Alphabetical List */}
          {sortedLettersInGroups.length > 0 ? (
            sortedLettersInGroups.map((letter) => {
              const placesInLetter = groupedPlaces[letter] || [];
              return (
                <div key={letter} className="pt-3 first:pt-0 space-y-2.5">
                  <div className="sticky top-0 z-10 flex items-center space-x-2 bg-white/95 backdrop-blur-sm py-1">
                    <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center shadow-xs">
                      {letter}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ({placesInLetter.length} {activeLanguage === 'ta' ? 'இடங்கள்' : 'places'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {placesInLetter.map((place) => {
                      const localizedName = getLocalizedPlaceName(place.name, activeLanguage);
                      const isCurrent = currentLocation?.rawName === place.rawName || currentLocation?.name === place.name;

                      let categoryBadge = 'District';
                      let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      if (place.category === 'district_tn') {
                        categoryBadge = activeLanguage === 'ta' ? 'மாவட்டம்' : 'TN District';
                        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      } else if (place.category === 'locality_tn') {
                        categoryBadge = activeLanguage === 'ta' ? 'தமிழக ஊர்' : 'TN Locality';
                        badgeColor = 'bg-teal-50 text-teal-700 border-teal-200';
                      } else if (place.category === 'metro_in' || place.category === 'capital_in') {
                        categoryBadge = activeLanguage === 'ta' ? 'இந்திய பெருநகரம்' : 'India Metro';
                        badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      } else if (place.category === 'global') {
                        categoryBadge = activeLanguage === 'ta' ? 'உலக நகரம்' : 'Global Hub';
                        badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                      }

                      return (
                        <button
                          key={place.id}
                          onClick={() => handleSelect(place)}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                            isCurrent
                              ? 'bg-sky-50 border-sky-400 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <span className="text-lg flex-shrink-0">{place.flag || '📍'}</span>
                            <div className="truncate">
                              <div className="flex items-center space-x-1.5 truncate">
                                <span className="text-sm font-bold text-slate-900 group-hover:text-sky-600 truncate">
                                  {localizedName !== place.name ? `${localizedName} (${place.name})` : place.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500 truncate">
                                <span className="truncate">{place.state}, {place.country}</span>
                                <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-semibold border ${badgeColor}`}>
                                  {categoryBadge}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isCurrent ? (
                            <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 flex-shrink-0 transition-colors" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {activeLanguage === 'ta' ? 'இடங்கள் எதுவும் கிடைக்கவில்லை' : 'No places found matching criteria'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLetter('ALL');
                  setSelectedCategory('ALL');
                }}
                className="text-xs text-sky-600 font-bold hover:underline"
              >
                {activeLanguage === 'ta' ? 'அனைத்து இடங்களையும் காட்டவும்' : 'Reset Filters & Show All'}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">
            {activeLanguage === 'ta'
              ? `மொத்தம் ${filteredPlaces.length} இடங்கள் தயார் நிலையில் உள்ளன`
              : `${filteredPlaces.length} places available alphabetically`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors"
          >
            {activeLanguage === 'ta' ? 'மூடுக' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
