import React, { useState } from 'react';
import {
  CloudSun,
  CloudRain,
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  Radio,
  Wheat
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../services/languages';
import { userRegistryService } from '../services/userRegistryService';

export default function AuthScreen({
  onLogin,
  activeLanguage = 'en',
  setActiveLanguage
}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && !name.trim()) {
      setError(activeLanguage === 'ta' ? 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்' : 'Please enter your name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError(activeLanguage === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்' : 'Please enter a valid email address');
      return;
    }

    if (!password || password.length < 4) {
      setError(activeLanguage === 'ta' ? 'கடவுச்சொல் குறைந்தது 4 எழுத்துக்கள் இருக்க வேண்டும்' : 'Password must be at least 4 characters');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const authUser = {
        name: mode === 'signup' ? name.trim() : (email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'WeatherGPT Member'),
        email: email.trim(),
        avatarType: 'initials',
        avatar: '',
        provider: mode === 'signup' ? 'email_signup' : 'email_signin',
        role: 'Standard Member',
        joinedAt: new Date().toISOString()
      };

      // Store in Accessor Database
      userRegistryService.recordUserSession(authUser, mode === 'signup' ? 'email_signup' : 'email_signin');

      if (rememberMe) {
        localStorage.setItem('weathergpt_auth_user', JSON.stringify(authUser));
      } else {
        sessionStorage.setItem('weathergpt_auth_user', JSON.stringify(authUser));
      }
      setIsLoading(false);
      onLogin(authUser);
    }, 400);
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const guestUser = {
        name: activeLanguage === 'ta' ? 'விருந்தினர் (Guest)' : 'Guest User',
        email: 'guest@weathergpt.ai',
        avatarType: 'guest',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GuestWeatherGPT',
        provider: 'guest',
        role: 'Guest Access',
        joinedAt: new Date().toISOString()
      };

      userRegistryService.recordUserSession(guestUser, 'guest');
      localStorage.setItem('weathergpt_auth_user', JSON.stringify(guestUser));
      setIsLoading(false);
      onLogin(guestUser);
    }, 300);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-gradient-to-br from-[#edf6fd] via-[#f7faff] to-[#e6f1fc] text-slate-800 relative overflow-x-hidden font-sans select-none">
      {/* Subtle Mild Ambient Background Clouds & Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-sky-200/40 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[480px] h-[480px] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[35%] right-[15%] w-[320px] h-[320px] rounded-full bg-cyan-100/40 blur-[90px] pointer-events-none"></div>

      {/* Top Bar: Brand + Multi-Language Selector */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
          <img
            src="/wyndra-logo.png"
            alt="WYNDRA Weather Intelligence"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain flex-shrink-0 drop-shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-heading">
                WeatherGPT
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-500 font-medium truncate">
              {activeLanguage === 'ta' ? 'அதிநவீன நேரடி வானிலை தளம்' : 'Hyperlocal Weather Intelligence'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Language Selector Dropdown */}
          <div className="flex items-center space-x-1.5 bg-white/90 hover:bg-white border border-sky-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs transition-all">
            <Globe className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
            <select
              value={activeLanguage}
              onChange={(e) => setActiveLanguage && setActiveLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white text-slate-800 font-medium">
                  {l.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* MAIN AUTHENTICATION CARD */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-3 sm:py-6 flex flex-col items-center justify-center my-auto">
        <div className="w-full bg-white/95 backdrop-blur-xl border border-sky-200/80 rounded-3xl p-5 sm:p-7 shadow-xl shadow-sky-900/5 space-y-4">
          {/* Header text */}
          <div className="text-center space-y-1">
            <div className="inline-flex p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/20 mb-1">
              <CloudSun className="w-6 h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-heading">
              {mode === 'signin'
                ? (activeLanguage === 'ta' ? 'உள்நுழைக' : 'Welcome Back')
                : (activeLanguage === 'ta' ? 'புதிய கணக்கு' : 'Create Account')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'signin'
                ? (activeLanguage === 'ta' ? 'வானிலை நுண்ணறிவை அணுக உங்கள் கணக்கில் நுழைக' : 'Sign in to access your weather intelligence')
                : (activeLanguage === 'ta' ? 'இலவசமாக கணக்கை உருவாக்கி தொடரவும்' : 'Create a free account to get started')}
            </p>
          </div>

          {/* Tab Pill Switcher (Sign In / Create Account) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-sky-700 shadow-2xs border border-sky-100'
                  : 'hover:text-slate-900'
              }`}
            >
              {activeLanguage === 'ta' ? 'உள்நுழைவு' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-sky-700 shadow-2xs border border-sky-100'
                  : 'hover:text-slate-900'
              }`}
            >
              {activeLanguage === 'ta' ? 'புதிய கணக்கு' : 'Create Account'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2 animate-fadeIn">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name field (Sign up only) */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {activeLanguage === 'ta' ? 'முழு பெயர்' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={activeLanguage === 'ta' ? 'எ.கா: சுரேஷ் குமார்' : 'e.g. John Doe'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {activeLanguage === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {activeLanguage === 'ta' ? 'கடவுச்சொல்' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => alert(activeLanguage === 'ta' ? 'கடவுச்சொல் மீட்டமைப்பு மின்னஞ்சல் அனுப்பப்பட்டது.' : 'Password reset link sent to email.')}
                    className="text-[10px] text-sky-600 hover:text-sky-700 font-semibold underline cursor-pointer"
                  >
                    {activeLanguage === 'ta' ? 'மறந்துவிட்டதா?' : 'Forgot?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 bg-white h-3.5 w-3.5 cursor-pointer"
                />
                <span>{activeLanguage === 'ta' ? 'என்னை நினைவில் கொள்க' : 'Remember me'}</span>
              </label>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md shadow-sky-600/20 hover:shadow-lg cursor-pointer disabled:opacity-60"
            >
              <span>
                {isLoading
                  ? (activeLanguage === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying...')
                  : mode === 'signin'
                  ? (activeLanguage === 'ta' ? 'உள்நுழைக' : 'Sign In')
                  : (activeLanguage === 'ta' ? 'கணக்கை உருவாக்குங்கள்' : 'Create Free Account')}
              </span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Guest Access Button */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2.5">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200/80 text-sky-800 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <User className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'விருந்தினராக தொடரவும்' : 'Continue as Guest'}</span>
            </button>
          </div>
        </div>

        {/* 4 Value Pillars */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 text-center text-xs">
          {[
            { icon: Radio, text: activeLanguage === 'ta' ? 'டாப்ளர் ரேடார்' : 'Doppler Radar' },
            { icon: CloudRain, text: activeLanguage === 'ta' ? 'மழை முன்னறிவிப்பு' : 'Rain Nowcast' },
            { icon: Wheat, text: activeLanguage === 'ta' ? 'விவசாய வழிகாட்டி' : 'Farmer Advisory' },
            { icon: Sparkles, text: activeLanguage === 'ta' ? '10 மொழிகள்' : '10 Languages' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-2.5 rounded-2xl bg-white/70 border border-sky-100 flex flex-col items-center justify-center space-y-1 shadow-2xs"
              >
                <Icon className="w-4 h-4 text-sky-600" />
                <span className="text-[10px] text-slate-600 font-bold">{item.text}</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full py-3 text-center text-[11px] text-slate-400 border-t border-sky-100/60 bg-white/30 backdrop-blur-xs">
        WeatherGPT &copy; {new Date().getFullYear()} • Hyperlocal Meteorological Intelligence Platform
      </footer>
    </div>
  );
}
