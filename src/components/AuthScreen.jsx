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
  setActiveLanguage,
  onOpenTechStack
}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  const handleGoogleLogin = (chosenEmail = 'user@gmail.com', chosenName = 'Google Member') => {
    setIsLoading(true);
    setShowGoogleModal(false);
    setTimeout(() => {
      const gUser = {
        name: chosenName,
        email: chosenEmail,
        avatarType: 'google',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(chosenName)}&backgroundColor=0284c7`,
        provider: 'google_oauth',
        role: 'Verified Member',
        joinedAt: new Date().toISOString()
      };

      userRegistryService.recordUserSession(gUser, 'google_oauth');
      localStorage.setItem('weathergpt_auth_user', JSON.stringify(gUser));
      setIsLoading(false);
      onLogin(gUser);
    }, 400);
  };

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

      // Store in Accessor Database
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

      {/* Top Bar: Brand + Multi-Language Selector + PS Tech Stack */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
          <img
            src="/wyndra-logo.png"
            alt="WYNDRA Weather Intelligence"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain flex-shrink-0 drop-shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 truncate">WeatherGPT</span>
              <span className="hidden xs:inline text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex-shrink-0">
                Live
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-500 font-medium truncate">
              {activeLanguage === 'ta' ? 'அதிநவீன நேரடி வானிலை தளம்' : 'Hyperlocal Weather Intelligence'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* PS 2026 Tech Stack Pill */}
          {onOpenTechStack && (
            <button
              type="button"
              onClick={onOpenTechStack}
              className="flex items-center space-x-1 bg-gradient-to-r from-indigo-50 to-sky-50 hover:from-indigo-100 hover:to-sky-100 border border-indigo-200/80 rounded-xl px-2.5 py-1.5 text-indigo-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span className="hidden xs:inline">PS Tech Stack</span>
            </button>
          )}

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

      {/* Main Authentication Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-2 flex-1 flex flex-col justify-center items-center">
        <div className="w-full bg-white/90 backdrop-blur-2xl border border-sky-100/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-sky-900/5 space-y-4">
          
          {/* Streamlined Header Title */}
          <div className="text-center pt-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {mode === 'signin'
                ? (activeLanguage === 'ta' ? 'உள்நுழைக' : 'Sign In')
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

          {/* Quick Demo / Google / Guest Access Buttons */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2.5">
            {/* Google Fast Sign-in */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              disabled={isLoading}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{activeLanguage === 'ta' ? 'Google உடன் உள்நுழைக (1-Click)' : 'Continue with Google (1-Click)'}</span>
            </button>

            {/* Guest Access Button */}
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

        {/* Google 1-Click Fast Account Chooser Modal */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <h3 className="text-sm font-black text-slate-900">
                    {activeLanguage === 'ta' ? 'Google கணக்கைத் தேர்வுசெய்க' : 'Choose a Google Account'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>

              {/* 1-Click Fast Accounts */}
              <div className="space-y-2">
                {[
                  { name: 'Yuvaadhika', email: 'yuvaadhika@gmail.com', role: 'Team Lead' },
                  { name: 'WeatherGPT User', email: 'user.weather@gmail.com', role: 'Verified' }
                ].map((acc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleGoogleLogin(acc.email, acc.name)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 flex items-center justify-between text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-sky-900">{acc.name}</p>
                        <p className="text-[10px] text-slate-500">{acc.email}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              {/* Custom Google Email */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {activeLanguage === 'ta' ? 'அல்லது உங்கள் ஜிமெயிலை உள்ளிடுக' : 'Or enter any Gmail address'}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customGoogleEmail && customGoogleEmail.includes('@')) {
                        const extractedName = customGoogleEmail.split('@')[0];
                        handleGoogleLogin(customGoogleEmail, extractedName);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer"
                  >
                    {activeLanguage === 'ta' ? 'நுழை' : 'Go'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
        WeatherGPT &copy; {new Date().getFullYear()} • Powered by ECMWF, GFS & IMD Meteorological Models
      </footer>
    </div>
  );
}
