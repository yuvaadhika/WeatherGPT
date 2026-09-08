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
  Sparkles,
  Key,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  Unlock,
  LogOut,
  Check,
  Code2,
  Play,
  FileCode,
  Table
} from 'lucide-react';
import { userRegistryService } from '../services/userRegistryService';
import { dbService, SQL_SCHEMAS } from '../services/dbService';

export default function AdminUserRegistryModal({
  isOpen,
  onClose,
  activeLanguage = 'en'
}) {
  // Authentication Gate State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Active Admin View Tab: 'users' | 'sql'
  const [activeAdminTab, setActiveAdminTab] = useState('users');

  // Database Data State
  const [users, setUsers] = useState([]);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
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

  // SQL Interactive Console State
  const [sqlInput, setSqlInput] = useState('SELECT * FROM weather_stations WHERE district = \'Chennai\';');
  const [sqlResult, setSqlResult] = useState(null);
  const [selectedSchemaTable, setSelectedSchemaTable] = useState('weather_stations');

  const loadData = async () => {
    setIsSyncingCloud(true);
    try {
      const list = await userRegistryService.fetchCloudUsers();
      const st = userRegistryService.getStats();
      setUsers(list);
      setStats(st);
    } catch (e) {
      const list = userRegistryService.getAllUsers();
      const st = userRegistryService.getStats();
      setUsers(list);
      setStats(st);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  useEffect(() => {
    let interval = null;
    if (isOpen) {
      if (isAuthenticated) {
        loadData();
        // Auto-sync Central Cloud Database every 6 seconds while admin modal is open
        interval = setInterval(() => {
          loadData();
        }, 6000);
      } else {
        // Reset login fields on open
        setAdminUsername('');
        setAdminPassword('');
        setAuthError('');
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  // Handle Admin Credentials Verification
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    setIsVerifying(true);

    setTimeout(async () => {
      const cleanUser = adminUsername.trim().toLowerCase();
      const cleanPass = adminPassword.trim();

      // VALIDATION: Accept 'xxxx' (or 'wyndra') with password '1234'
      if ((cleanUser === 'xxxx' || cleanUser === 'wyndra' || cleanUser === 'admin') && (cleanPass === '1234' || cleanPass === 'xxxx')) {
        setIsAuthenticated(true);
        setAuthError('');
        await loadData();
      } else {
        setAuthError(
          activeLanguage === 'ta'
            ? '❌ தவறான பயனர் பெயர் அல்லது கடவுச்சொல்! அணுகல் மறுக்கப்பட்டது.'
            : '❌ Invalid username or password! Access denied.'
        );
      }
      setIsVerifying(false);
    }, 300);
  };

  // Lock / Sign Out of Admin
  const handleLock = () => {
    setIsAuthenticated(false);
    setAdminUsername('');
    setAdminPassword('');
    setAuthError('');
  };

  const handleCloseModal = () => {
    setIsAuthenticated(false);
    setAdminUsername('');
    setAdminPassword('');
    setAuthError('');
    onClose();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.provider || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.device || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'google') return (u.provider || '').includes('Google');
    if (filterType === 'email') return (u.provider || '').includes('Email');
    if (filterType === 'guest') return (u.provider || '').includes('Guest') || (u.provider || '').includes('Visitor');
    return true;
  });

  const handleExport = () => {
    userRegistryService.exportToCSV();
  };

  const handleClear = async () => {
    if (
      window.confirm(
        activeLanguage === 'ta'
          ? 'மத்திய தரவுத்தளத்தில் உள்ள அனைத்து பயனர் பதிவுகளையும் அழிக்கவா?'
          : 'Are you sure you want to clear the central user database?'
      )
    ) {
      await userRegistryService.clearDatabase();
      await loadData();
    }
  };

  const handleRunSQL = async () => {
    if (!sqlInput.trim()) return;
    if (sqlInput.toUpperCase().includes('CHAT_CONVERSATIONS')) {
      await dbService.fetchCloudChatLogs();
    }
    const res = dbService.executeSQL(sqlInput);
    setSqlResult(res);
  };

  const handleDownloadSQLDump = () => {
    const sqlDump = dbService.generateSQLDump();
    const blob = new Blob([sqlDump], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `weathergpt_postgresql_dump_${Date.now()}.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      {/* 1. AUTHENTICATION GATE */}
      {!isAuthenticated ? (
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {activeLanguage === 'ta' ? 'அணுகல் தரவுத்தளம்' : 'Accessor Database Portal'}
                </h3>
                <p className="text-[10px] font-mono text-slate-400">PostgreSQL + SQLite SQL Engine</p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              {activeLanguage === 'ta' ? 'அணுகல் அங்கீகாரம் தேவை' : 'Restricted Accessor Login'}
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {activeLanguage === 'ta'
                ? 'பயனர் பதிவுகள் மற்றும் SQL தரவுத்தளத்தைக் காண உங்கள் login மற்றும் password-ஐ உள்ளிடவும்.'
                : 'Enter your Accessor username and password to view real-time SQL database, tables and user sessions.'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {activeLanguage === 'ta' ? 'பயனர் பெயர் (Login Username)' : 'Login Username'} *
              </label>
              <div className="relative">
                <Database className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="xxxx"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {activeLanguage === 'ta' ? 'கடவுச்சொல் (Password)' : 'Password'} *
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{activeLanguage === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>{activeLanguage === 'ta' ? 'தரவுத்தளத்தைத் திற' : 'Unlock SQL Database'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* 2. AUTHENTICATED ACCESSOR DASHBOARD & SQL CONSOLE */
        <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
          {/* Dashboard Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-300">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {activeLanguage === 'ta' ? 'அணுகல் முதன்மை SQL தரவுத்தளம்' : 'Accessor Primary SQL Database Engine'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/40">
                    <Check className="w-3 h-3 inline mr-1" />
                    SQL ENGINE ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-sky-200/80">
                  PostgreSQL with PostGIS + SQLite Relational Database Engine
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleLock}
                title="Lock database & Sign out of admin"
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{activeLanguage === 'ta' ? 'பூட்டு' : 'Lock DB'}</span>
              </button>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs: Users Log vs SQL Relational Database */}
          <div className="flex items-center justify-between px-4 pt-2 border-b border-slate-200 bg-slate-50 overflow-x-auto flex-shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveAdminTab('users')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeAdminTab === 'users'
                    ? 'bg-white text-sky-700 border-t-2 border-sky-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{activeLanguage === 'ta' ? 'பயனர் பதிவுகள் & அமர்வுகள்' : 'User Accounts & Sessions'}</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('sql')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeAdminTab === 'sql'
                    ? 'bg-white text-sky-700 border-t-2 border-sky-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{activeLanguage === 'ta' ? 'SQL அட்டவணைகள் & வினவல்' : 'SQL Tables & Query Engine'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 py-1">
              <button
                onClick={handleDownloadSQLDump}
                className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
                title="Download PostgreSQL DDL & Seed SQL Dump"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Download .SQL Dump</span>
              </button>
            </div>
          </div>

          {/* TAB 1: USER REGISTRY */}
          {activeAdminTab === 'users' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* 4 KPI Summary Cards */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8fbfe] border-b border-slate-100 flex-shrink-0">
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
                  <div className="text-[10px] text-indigo-600 font-medium">Email Accounts</div>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-sky-100/90 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
                    <span>Guest Access</span>
                    <Smartphone className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">{stats.guestCount}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Direct Access</div>
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">User & Email</th>
                      <th className="py-2.5 px-3">Auth Method</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Device / Platform</th>
                      <th className="py-2.5 px-3">Last Active</th>
                      <th className="py-2.5 px-3 text-center">Logins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-sky-50/50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            {u.provider || 'Google'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{u.role || 'Member'}</td>
                        <td className="py-3 px-3 text-slate-600">{u.device || 'Desktop PC'}</td>
                        <td className="py-3 px-3 text-slate-600">{u.formattedTime || 'Recently'}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{u.loginCount || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SQL ENGINE & SCHEMAS */}
          {activeAdminTab === 'sql' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* SQL Query Runner Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-xs text-slate-900">
                    <Code2 className="w-4 h-4 text-sky-600" />
                    <span>Live SQL Relational Query Runner</span>
                  </div>
                  <button
                    onClick={handleRunSQL}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Query</span>
                  </button>
                </div>

                <textarea
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="SELECT * FROM weather_stations WHERE district = 'Chennai';"
                />

                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-slate-400 text-[10px] font-bold">Presets:</span>
                  {[
                    "SELECT * FROM weather_stations;",
                    "SELECT * FROM chat_conversations;",
                    "SELECT * FROM telemetry_logs;"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSqlInput(preset)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* SQL Execution Result Table */}
                {sqlResult && (
                  <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Result: {sqlResult.rowCount} rows returned</span>
                      <span className="text-[10px] font-mono text-slate-500">{sqlResult.executionTimeMs} ms</span>
                    </div>
                    {sqlResult.rows && sqlResult.rows.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[11px] font-mono">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              {sqlResult.columns?.map((col) => (
                                <th key={col} className="p-2 text-slate-600 font-bold">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sqlResult.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-sky-50/60">
                                {sqlResult.columns?.map((col) => (
                                  <td key={col} className="p-2 text-slate-800">{String(row[col] ?? '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-3 text-xs text-slate-500 text-center">No rows returned.</div>
                    )}
                  </div>
                )}
              </div>

              {/* SQL Relational DDL Schemas */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2 font-bold text-xs text-slate-900">
                    <Table className="w-4 h-4 text-blue-600" />
                    <span>Relational Database Table DDL Schemas (PostgreSQL / SQLite)</span>
                  </div>
                  <select
                    value={selectedSchemaTable}
                    onChange={(e) => setSelectedSchemaTable(e.target.value)}
                    className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {Object.keys(SQL_SCHEMAS).map((tbl) => (
                      <option key={tbl} value={tbl}>{tbl}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  <pre className="text-sky-300">{SQL_SCHEMAS[selectedSchemaTable]}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="p-3.5 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClear}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{activeLanguage === 'ta' ? 'தரவுத்தளத்தை அழி' : 'Clear User Logs'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {activeLanguage === 'ta' ? 'மூடு' : 'Close Portal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
