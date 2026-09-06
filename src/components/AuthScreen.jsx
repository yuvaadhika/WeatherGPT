import React, { useState } from 'react';
import {
  Sun,
  CloudRain,
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Globe,
  Radio,
  Wheat,
  Zap
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../services/languages';

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

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const googleUser = {
        name: 'Yuva Adhika',
        email: 'yuvaadhika@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        provider: 'google',
        role: 'Pro Member',
        joinedAt: new Date().toISOString()
      };
      if (rememberMe) {
        localStorage.setItem('weathergpt_auth_user', JSON.stringify(googleUser));
      } else {
        sessionStorage.setItem('weathergpt_auth_user', JSON.stringify(googleUser));
      }
      setIsLoading(false);
      onLogin(googleUser);
    }, 600);
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
        name: mode === 'signup' ? name.trim() : (email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'WeatherGPT User'),
        email: email.trim(),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        provider: 'email',
        role: 'Standard Member',
        joinedAt: new Date().toISOString()
      };

      if (rememberMe) {
        localStorage.setItem('weathergpt_auth_user', JSON.stringify(authUser));
      } else {
        sessionStorage.setItem('weathergpt_auth_user', JSON.stringify(authUser));
      }
      setIsLoading(false);
      onLogin(authUser);
    }, 500);
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const guestUser = {
        name: activeLanguage === 'ta' ? 'விருந்தினர்' : 'Guest User',
        email: 'guest@weathergpt.ai',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GuestWeatherGPT',
        provider: 'guest',
        role: 'Guest Access',
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem('weathergpt_auth_user', JSON.stringify(guestUser));
      setIsLoading(false);
      onLogin(guestUser);
    }, 300);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-gradient-to-br from-[#0b192e] via-[#0f2d4a] to-[#071322] text-white relative overflow-x-hidden font-sans select-none">
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/20 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-cyan-400/15 blur-[100px] pointer-events-none"></div>

      {/* Top Bar: Brand + Multi-Language Selector */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 via-cyan-400 to-indigo-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/25">
            <Sun className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">WeatherGPT</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                AI v2.0
              </span>
            </div>
            <p className="text-[11px] text-sky-200/70 font-medium">
              {activeLanguage === 'ta' ? 'அதிநவீன வானிலை நுண்ணறிவு தளம்' : 'Next-Gen Meteorological Intelligence'}
            </p>
          </div>
        </div>

        {/* Language Selector Dropdown */}
        <div className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/15 rounded-2xl px-3 py-1.5 shadow-lg transition-all">
          <Globe className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <select
            value={activeLanguage}
            onChange={(e) => setActiveLanguage && setActiveLanguage(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white font-medium">
                {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-2 flex-1 flex flex-col justify-center items-center">
        <div className="w-full bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 space-y-5">
          
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[11px] font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{activeLanguage === 'ta' ? 'வானிலை தகவல்களை உடனடியாக அணுகவும்' : 'Instant Meteorological Access'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {mode === 'signin'
                ? (activeLanguage === 'ta' ? 'மீண்டும் வருக!' : 'Welcome Back')
                : (activeLanguage === 'ta' ? 'புதிய கணக்கு தொடங்குங்கள்' : 'Create an Account')}
            </h2>
            <p className="text-xs text-sky-100/70">
              {mode === 'signin'
                ? (activeLanguage === 'ta' ? 'வானிலை மற்றும் ரேடார் அறிக்கைகளை பெற உள்நுழையவும்' : 'Sign in to access radar forecasts, smart alerts & AI chatbots')
                : (activeLanguage === 'ta' ? 'இலவசமாக இணைந்து நேரடி முன்னறிவிப்புகளைப் பெறுங்கள்' : 'Join free for live Doppler radar, storm SOS & crop advisories')}
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center space-x-3 transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-70 group"
          >
            {/* Google G Logo SVG */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="group-hover:text-slate-950 font-extrabold">
              {activeLanguage === 'ta' ? 'Google கணக்கு மூலம் தொடரவும்' : 'Continue with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center space-x-3 text-slate-400 text-xs">
            <div className="flex-1 h-px bg-white/15"></div>
            <span className="text-[11px] uppercase tracking-wider text-sky-200/50 font-medium">
              {activeLanguage === 'ta' ? 'அல்லது மின்னஞ்சல் மூலம்' : 'or with email'}
            </span>
            <div className="flex-1 h-px bg-white/15"></div>
          </div>

          {/* Tab Pill Switcher (Sign In / Create Account) */}
          <div className="flex bg-black/25 p-1 rounded-2xl border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {activeLanguage === 'ta' ? 'உள்நுழைவு (Sign In)' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {activeLanguage === 'ta' ? 'புதிய கணக்கு (Sign Up)' : 'Create Account'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-medium flex items-center space-x-2 animate-fadeIn">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name field (Sign up only) */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-sky-200 uppercase tracking-wider">
                  {activeLanguage === 'ta' ? 'முழு பெயர்' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-sky-300/60" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={activeLanguage === 'ta' ? 'எ.கா: யுவ ஆதிகா' : 'e.g. John Doe'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-sky-400 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-sky-200 uppercase tracking-wider">
                {activeLanguage === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-sky-300/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-sky-400 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-sky-200 uppercase tracking-wider">
                  {activeLanguage === 'ta' ? 'கடவுச்சொல்' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => alert(activeLanguage === 'ta' ? 'கடவுச்சொல் மீட்டமைப்பு மின்னஞ்சல் அனுப்பப்பட்டது.' : 'Password reset link sent to email.')}
                    className="text-[10px] text-sky-300 hover:text-sky-200 underline cursor-pointer"
                  >
                    {activeLanguage === 'ta' ? 'மறந்துவிட்டதா?' : 'Forgot?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-sky-300/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-sky-400 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-sky-300/60 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-sky-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 text-sky-500 focus:ring-sky-400 bg-white/10 h-3.5 w-3.5 cursor-pointer"
                />
                <span>{activeLanguage === 'ta' ? 'என்னை நினைவில் கொள்க' : 'Remember me'}</span>
              </label>

              <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SSL 256-bit</span>
              </span>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.99] text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 cursor-pointer disabled:opacity-60"
            >
              <span>
                {isLoading
                  ? (activeLanguage === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying...')
                  : mode === 'signin'
                  ? (activeLanguage === 'ta' ? 'உள்நுழைக' : 'Sign In to WeatherGPT')
                  : (activeLanguage === 'ta' ? 'கணக்கை உருவாக்குங்கள்' : 'Create Free Account')}
              </span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo / Guest Access Button */}
          <div className="pt-2 border-t border-white/10 text-center space-y-2">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-sky-200 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeLanguage === 'ta' ? '⚡ விருந்தினராக உடனடியாக தொடரவும் (Guest Mode)' : '⚡ Continue as Guest (Instant Access)'}</span>
            </button>
          </div>
        </div>

        {/* 4 Value Pillars */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 text-center text-xs">
          {[
            { icon: Radio, text: activeLanguage === 'ta' ? 'டாப்ளர் ரேடார்' : 'Doppler Radar GIS' },
            { icon: CloudRain, text: activeLanguage === 'ta' ? 'மழை முன்னறிவிப்பு' : 'AI Rain Nowcast' },
            { icon: Wheat, text: activeLanguage === 'ta' ? 'விவசாய வழிகாட்டி' : 'Farmer Advisory' },
            { icon: Sparkles, text: activeLanguage === 'ta' ? '10 மொழிகள் AI' : '10 Languages' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center space-y-1 backdrop-blur-sm"
              >
                <Icon className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] text-slate-300 font-semibold">{item.text}</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-3 text-center text-[11px] text-sky-200/50 border-t border-white/10">
        WeatherGPT &copy; {new Date().getFullYear()} • Powered by ECMWF, GFS & IMD Meteorologic Intelligence
      </footer>
    </div>
  );
}
