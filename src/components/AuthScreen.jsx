import React, { useState, useEffect } from 'react';
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
  Wheat,
  X,
  Plus,
  ChevronRight,
  Check,
  ShieldCheck
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

  // Dynamic Google Sign In State - Strictly user's own device accounts
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState([]);
  const [isAddingNewGoogleAccount, setIsAddingNewGoogleAccount] = useState(false);
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState('');

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;

  // Load only accounts that THIS specific user has previously logged into on this device
  useEffect(() => {
    try {
      const stored = localStorage.getItem('weathergpt_saved_google_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(a => a.email && !a.email.includes('example.com'));
          setSavedGoogleAccounts(cleaned);
        } else {
          setSavedGoogleAccounts([]);
        }
      } else {
        setSavedGoogleAccounts([]);
      }
    } catch (e) {
      console.warn('Failed to load saved Google accounts', e);
      setSavedGoogleAccounts([]);
    }
  }, []);

  // Google OAuth 2.0 Client Trigger
  const triggerOfficialGoogleOAuth = () => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const GOOGLE_CLIENT_ID =
          import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
          '1047648398188-469b0s6g2b0o8d207tghc5d60v60k46f.apps.googleusercontent.com';

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              setIsLoading(true);
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const profile = await res.json();
                if (profile?.email) {
                  handleCompleteGoogleLogin(profile.email, profile.name || profile.given_name, profile.picture);
                  return;
                }
              } catch (err) {
                console.warn('Google userinfo fetch error:', err);
              }
            }
          },
          error_callback: (error) => {
            console.warn('Google OAuth prompt error:', error);
            // Fallback to in-app Google modal
            setIsAddingNewGoogleAccount(savedGoogleAccounts.length === 0);
            setIsGoogleModalOpen(true);
          }
        });

        client.requestAccessToken({ prompt: 'select_account' });
        return true;
      } catch (e) {
        console.warn('Google initTokenClient exception:', e);
      }
    }
    return false;
  };

  const handleOpenGoogleSignIn = () => {
    setError('');
    setGoogleError('');
    setGoogleEmailInput('');
    setGoogleNameInput('');
    setSelectedGoogleEmail('');

    // First attempt official Google popup with select_account
    const launched = triggerOfficialGoogleOAuth();
    if (!launched) {
      setIsAddingNewGoogleAccount(savedGoogleAccounts.length === 0);
      setIsGoogleModalOpen(true);
    }
  };

  const handleCompleteGoogleLogin = (userEmail, userName, avatarUrl = '') => {
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setGoogleError(
        activeLanguage === 'ta'
          ? 'சரியான Google மின்னஞ்சல் முகவரியை உள்ளிடவும்'
          : 'Please enter a valid Google email address'
      );
      return;
    }

    let cleanName = (userName || '').trim();
    if (!cleanName) {
      const prefix = cleanEmail.split('@')[0];
      cleanName =
        prefix
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Google User';
    }

    setSelectedGoogleEmail(cleanEmail);
    setIsLoading(true);
    setGoogleError('');

    setTimeout(() => {
      const googleUser = {
        name: cleanName,
        email: cleanEmail,
        avatarType: 'google',
        avatar: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=0284c7,0ea5e9,38bdf8`,
        provider: 'Google 🌐',
        role: 'Pro Member',
        joinedAt: new Date().toISOString()
      };

      // Save to saved accounts list for fast 1-click access
      try {
        const existing = savedGoogleAccounts.filter((a) => a.email !== cleanEmail);
        const updated = [{ name: cleanName, email: cleanEmail, avatar: googleUser.avatar }, ...existing].slice(0, 6);
        setSavedGoogleAccounts(updated);
        localStorage.setItem('weathergpt_saved_google_accounts', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save google account', e);
      }

      // Store in Accessor Database
      userRegistryService.recordUserSession(googleUser, 'google');

      if (rememberMe) {
        localStorage.setItem('weathergpt_auth_user', JSON.stringify(googleUser));
      } else {
        sessionStorage.setItem('weathergpt_auth_user', JSON.stringify(googleUser));
      }

      setIsLoading(false);
      setIsGoogleModalOpen(false);
      onLogin(googleUser);
    }, 280);
  };

  const handleRemoveSavedAccount = (e, emailToRemove) => {
    e.stopPropagation();
    const updated = savedGoogleAccounts.filter((a) => a.email !== emailToRemove);
    setSavedGoogleAccounts(updated);
    try {
      localStorage.setItem('weathergpt_saved_google_accounts', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
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

        {/* Language Selector Dropdown */}
        <div className="flex-shrink-0 flex items-center space-x-1.5 bg-white/90 hover:bg-white border border-sky-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs transition-all">
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
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleOpenGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-sky-50 active:scale-[0.99] border border-slate-200 hover:border-sky-300 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center space-x-3 transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-70 group"
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
            <span className="group-hover:text-slate-950 font-bold">
              {activeLanguage === 'ta' ? 'Google மூலம் தொடரவும்' : 'Continue with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center space-x-3 text-slate-400 text-xs">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              {activeLanguage === 'ta' ? 'அல்லது' : 'or with email'}
            </span>
            <div className="flex-1 h-px bg-slate-200"></div>
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

          {/* Quick Demo / Guest Access Button */}
          <div className="pt-2 border-t border-slate-100 text-center space-y-2">
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
        WeatherGPT &copy; {new Date().getFullYear()} • Powered by ECMWF, GFS & IMD Meteorological Models
      </footer>

      {/* ========================================================= */}
      {/* DYNAMIC GOOGLE SIGN-IN DIALOG / ACCOUNT CHOOSER MODAL     */}
      {/* ========================================================= */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                {/* Google G Logo */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {activeLanguage === 'ta' ? 'Google கணக்கு மூலம் உள்நுழைக' : 'Sign in with Google'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeLanguage === 'ta' ? 'WeatherGPT-ல் தொடர' : 'to continue to WeatherGPT'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {googleError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 animate-ping"></span>
                  <span>{googleError}</span>
                </div>
              )}

              {/* Google Accounts Selection List */}
              {!isAddingNewGoogleAccount ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {activeLanguage === 'ta' ? 'Google கணக்கைத் தேர்ந்தெடுக்கவும்' : 'Choose a Google account'}
                    </p>
                    <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      {activeLanguage === 'ta' ? 'ஒரே கிளிக்கில் உள்நுழைவு' : '1-Click Fast Login'}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                    {savedGoogleAccounts.map((account, idx) => {
                      const isSelected = selectedGoogleEmail === account.email.toLowerCase() && isLoading;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (!isLoading) {
                              handleCompleteGoogleLogin(account.email, account.name);
                            }
                          }}
                          className={`group p-3 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/90 ring-2 ring-sky-400/30'
                              : 'border-slate-200/90 hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                                {(account.name || account.email).charAt(0).toUpperCase()}
                              </div>
                              {/* Mini Google Logo badge on avatar */}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white shadow-xs p-0.5 flex items-center justify-center border border-slate-100">
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-900">
                                  {account.name}
                                </p>
                                {account.badge && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                    {account.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {account.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {isSelected ? (
                              <span className="text-[10px] font-extrabold text-sky-600 flex items-center space-x-1 bg-sky-100/90 px-2 py-1 rounded-xl animate-pulse">
                                <span>{activeLanguage === 'ta' ? 'நுழைகிறது...' : 'Signing in...'}</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveSavedAccount(e, account.email)}
                                  title="Remove account from device"
                                  className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-sky-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all">
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Another Google Account Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleError('');
                      setIsAddingNewGoogleAccount(true);
                    }}
                    className="w-full mt-1 py-2.5 px-3 rounded-2xl border border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50 text-sky-700 text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {activeLanguage === 'ta' ? 'வேறு Google கணக்கை சேர்க்கவும்' : 'Use another Google account'}
                    </span>
                  </button>
                </div>
              ) : (
                /* Dynamic Google Account Form (Sign in with any email) */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCompleteGoogleLogin(googleEmailInput, googleNameInput);
                  }}
                  className="space-y-3.5"
                >
                  <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-sky-900 leading-relaxed">
                      {activeLanguage === 'ta'
                        ? 'உங்கள் சொந்த Google (@gmail.com) மின்னஞ்சலை உள்ளிட்டு உடனடியாக தொடரலாம்.'
                        : 'Enter your own Google (@gmail.com or Workspace) email to sign in instantly.'}
                    </p>
                  </div>

                  {/* Google Email Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      {activeLanguage === 'ta' ? 'Google மின்னஞ்சல் முகவரி' : 'Google Email Address'} *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={googleEmailInput}
                        onChange={(e) => setGoogleEmailInput(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Optional Full Name */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        {activeLanguage === 'ta' ? 'உங்கள் பெயர் (விருப்பமானது)' : 'Full Name (Optional)'}
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {activeLanguage === 'ta' ? 'தானாக கண்டறியப்படும்' : 'Auto-detected if blank'}
                      </span>
                    </div>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={googleNameInput}
                        onChange={(e) => setGoogleNameInput(e.target.value)}
                        placeholder={activeLanguage === 'ta' ? 'எ.கா: சுந்தர் பிச்சை' : 'e.g. Alex Morgan'}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center space-x-2">
                    {savedGoogleAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleError('');
                          setIsAddingNewGoogleAccount(false);
                        }}
                        className="py-2.5 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        {activeLanguage === 'ta' ? 'பின்செல்' : 'Back'}
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-60"
                    >
                      <span>
                        {isLoading
                          ? (activeLanguage === 'ta' ? 'உள்நுழைகிறது...' : 'Signing in...')
                          : (activeLanguage === 'ta' ? 'Google உடன் உள்நுழைக' : 'Sign In with Google')}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer Note */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>WeatherGPT Secure OAuth Session</span>
              <span className="text-sky-600 font-semibold">256-bit Encrypted</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
