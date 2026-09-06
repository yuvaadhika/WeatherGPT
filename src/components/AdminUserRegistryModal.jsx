import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Users,
  Search,
  Download,
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Mail,
  Lock,
  Globe,
  Filter,
  Sparkles
} from 'lucide-react';
import { userRegistryService } from '../services/userRegistryService';

export default function AdminUserRegistryModal({
  isOpen,
  onClose,
  activeLanguage = 'en'
}) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    googleCount: 0,
    emailCount: 0,
    guestCount: 0,
    lastActive: 'Just now'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'google' | 'email' | 'guest'
  const [copiedToast, setCopiedToast] = useState(false);

  const loadData = () => {
    const list = userRegistryService.getAllUsers();
    const st = userRegistryService.getStats();
    setUsers(list);
    setStats(st);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.provider || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.device || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'google') return (u.provider || '').includes('Google');
    if (filterType === 'email') return (u.provider || '').includes('Email');
    if (filterType === 'guest') return (u.provider || '').includes('Guest');
    return true;
  });

  const handleExport = () => {
    userRegistryService.exportToCSV();
  };

  const handleClear = () => {
    if (window.confirm(activeLanguage === 'ta' ? 'அனைத்து பயனர் பதிவுகளையும் அழிக்கவா?' : 'Are you sure you want to clear the user database?')) {
      userRegistryService.clearDatabase();
      loadData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-sky-100 flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {activeLanguage === 'ta' ? '🔐 அணுகல் பயனர் தரவுத்தளம் (Accessor DB)' : '🔐 Accessor User Registry Database'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500 text-white tracking-wide shadow-xs">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80">
                {activeLanguage === 'ta'
                  ? 'யார் யார் லாகின் / கூகுள் சைன் இன் / மின்னஞ்சல் பதிவு செய்தார்கள் என்ற நேரடி விபரம்'
                  : 'Real-time database of all user signups, Google logins, email auth & sessions'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accessor Notice Banner */}
        <div className="bg-sky-50/90 border-b border-sky-100 px-5 py-2.5 flex items-center justify-between text-xs text-sky-900 flex-wrap gap-2">
          <div className="flex items-center space-x-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>
              {activeLanguage === 'ta'
                ? '🔒 இந்த தரவுத்தளம் தள அணுகலாளருக்கு (Accessor) மட்டுமே காண்பிக்கப்படுகிறது. பயனர்களுக்குத் தெரியாது.'
                : '🔒 This database is private & restricted strictly to the accessor/admin. Not accessible to standard users.'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              title="Download Excel / CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{activeLanguage === 'ta' ? 'எக்செல் CSV பதிவிறக்கம்' : 'Export CSV / Excel'}</span>
            </button>

            <button
              onClick={loadData}
              className="p-1.5 rounded-xl bg-white border border-sky-200 text-slate-700 hover:bg-sky-50 text-[11px] font-semibold transition-all cursor-pointer"
              title="Refresh Database"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8fbfe] border-b border-slate-100">
          <div className="p-3 rounded-2xl bg-white border border-sky-100/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>{activeLanguage === 'ta' ? 'மொத்த பயனர்கள்' : 'Total Registered'}</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{stats.totalUsers}</div>
            <div className="text-[10px] text-sky-600 font-medium">
              {stats.totalSessions} {activeLanguage === 'ta' ? 'மொத்த அமர்வுகள்' : 'Total Sessions'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-sky-100/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Google Logins</span>
              <span className="text-xs">🌐</span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{stats.googleCount}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Google Auth</div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-sky-100/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Email Signups</span>
              <Mail className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{stats.emailCount}</div>
            <div className="text-[10px] text-indigo-600 font-medium">Direct Email</div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-sky-100/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Guest Logins</span>
              <span className="text-xs">👤</span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{stats.guestCount}</div>
            <div className="text-[10px] text-amber-600 font-medium">Quick Access</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 px-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeLanguage === 'ta' ? 'பெயர், மின்னஞ்சல், சாதனம் தேடுக...' : 'Search by name, email, device...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
            {[
              { id: 'all', label: activeLanguage === 'ta' ? 'அனைத்தும்' : 'All Users' },
              { id: 'google', label: 'Google 🌐' },
              { id: 'email', label: 'Email ✉️' },
              { id: 'guest', label: 'Guest 👤' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[260px] bg-slate-50/50">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                {activeLanguage === 'ta' ? 'பயனர் பதிவுகள் ஏதும் கிடைக்கவில்லை' : 'No user records match your search'}
              </p>
              <p className="text-[11px] text-slate-400">
                {activeLanguage === 'ta' ? 'தேடலை மாற்றி முயற்சிக்கவும்' : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider rounded-xl">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-xl">User Details</th>
                    <th className="py-2.5 px-3">Auth Method</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Device & Browser</th>
                    <th className="py-2.5 px-3">Registered / Last Active</th>
                    <th className="py-2.5 px-3 text-center">Logins</th>
                    <th className="py-2.5 px-3 rounded-r-xl text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
                            {(u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]">
                              {u.name || 'WeatherGPT Member'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[140px] sm:max-w-[180px]">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            (u.provider || '').includes('Google')
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : (u.provider || '').includes('Email')
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {u.provider || 'Email ✉️'}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {u.role || 'Member'}
                        </span>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3 px-3">
                        <div className="text-[11px] text-slate-700 font-semibold">{u.device || 'Desktop PC'}</div>
                        <div className="text-[10px] text-slate-400">{u.browser || 'Chrome'}</div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3">
                        <div className="text-[11px] text-slate-800 font-semibold">{u.formattedTime || 'Recently'}</div>
                        <div className="text-[9px] text-slate-400">
                          {new Date(u.timestamp || Date.now()).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Login Count */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-extrabold text-[11px]">
                          {u.loginCount || 1}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClear}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{activeLanguage === 'ta' ? 'தரவுத்தளத்தை அழி' : 'Clear Database'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {activeLanguage === 'ta' ? 'மூடு' : 'Close Dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
