import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Globe
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
    <div className="min-h-screen w-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 text-slate-800 relative overflow-x-hidden font-sans select-none">
      {/* Subtle Background Accent */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-sky-200/30 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-100/30 blur-[120px] pointer-events-none"></div>

      {/* Top Bar with Language Chooser */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <img
            src="/wyndra-logo.png"
            alt="WeatherGPT"
            className="w-8 h-8 object-contain"
          />
          <span className="text-base font-black text-slate-900 tracking-tight font-heading">
            WeatherGPT
          </span>
        </div>

        {/* Language Selector Dropdown */}
        <div className="flex items-center space-x-1.5 bg-white/90 border border-slate-200 hover:border-sky-300 rounded-xl px-2.5 py-1.5 shadow-2xs transition-all">
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
      </header>

      {/* CLEAN & SIMPLE AUTHENTICATION CARD */}
      <main className="relative z-10 w-full max-w-sm mx-auto px-4 py-6 flex flex-col items-center justify-center my-auto">
        <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-900/5 space-y-4">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-sky-700 shadow-2xs border border-slate-200/60'
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
                  ? 'bg-white text-sky-700 shadow-2xs border border-slate-200/60'
                  : 'hover:text-slate-900'
              }`}
            >
              {activeLanguage === 'ta' ? 'பதிவு செய்க' : 'Sign Up'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2 animate-fadeIn">
              <span>{error}</span>
            </div>
          )}

          {/* Clean Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  {activeLanguage === 'ta' ? 'பெயர்' : 'Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={activeLanguage === 'ta' ? 'உங்கள் பெயர்' : 'Full name'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">
                {activeLanguage === 'ta' ? 'மின்னஞ்சல்' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  {activeLanguage === 'ta' ? 'கடவுச்சொல்' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => alert(activeLanguage === 'ta' ? 'கடவுச்சொல் மீட்டமைப்பு இணைப்பு அனுப்பப்பட்டது.' : 'Password reset link sent.')}
                    className="text-[10px] text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
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
            <div className="flex items-center pt-0.5">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              <span>
                {isLoading
                  ? (activeLanguage === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying...')
                  : mode === 'signin'
                  ? (activeLanguage === 'ta' ? 'உள்நுழைக' : 'Sign In')
                  : (activeLanguage === 'ta' ? 'கணக்கை உருவாக்கு' : 'Create Account')}
              </span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Guest Direct Access */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeLanguage === 'ta' ? 'விருந்தினராக தொடரவும்' : 'Continue as Guest'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 w-full py-3 text-center text-[11px] text-slate-400">
        WeatherGPT &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
