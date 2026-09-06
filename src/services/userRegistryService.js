// WeatherGPT Accessor & Admin User Registry Database Service
// Tracks all user logins, signups, Google authentications, and guest accesses exclusively for the accessor/admin.

const DB_STORAGE_KEY = 'weathergpt_accessor_database';

// Helper to get device info
function getClientDeviceInfo() {
  if (typeof window === 'undefined') return { device: 'Unknown', browser: 'Unknown' };
  const ua = navigator.userAgent || '';
  let device = 'Desktop PC';
  if (/Android/i.test(ua)) device = 'Android Phone 🤖';
  else if (/iPhone/i.test(ua)) device = 'iPhone 🍎';
  else if (/iPad/i.test(ua)) device = 'iPad 📱';
  else if (/Macintosh/i.test(ua)) device = 'MacBook 💻';
  else if (/Windows/i.test(ua)) device = 'Windows PC 🖥️';

  let browser = 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';

  return { device, browser };
}

// Initial seed users: empty by default so only real authenticated users on this device are tracked
const INITIAL_SEED_USERS = [];

class UserRegistryService {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(INITIAL_SEED_USERS));
      }
    } catch (e) {
      console.warn('UserRegistryService init error:', e);
    }
  }

  // Get all users from accessor database
  getAllUsers() {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
      }
    } catch (e) {
      console.warn('Error reading user database:', e);
    }
    return INITIAL_SEED_USERS;
  }

  // Record a user session (Login, Signup, Google, Guest)
  recordUserSession(user, authMethod = 'email') {
    if (!user) return;
    try {
      const users = this.getAllUsers();
      const { device, browser } = getClientDeviceInfo();
      const userEmail = (user.email || '').trim().toLowerCase();
      const userName = (user.name || 'WeatherGPT User').trim();
      const now = new Date();

      let providerLabel = 'Email ✉️';
      if (authMethod === 'google' || user.provider === 'google') providerLabel = 'Google 🌐';
      else if (authMethod === 'guest' || user.provider === 'guest') providerLabel = 'Guest Access 👤';
      else if (authMethod === 'email_signup') providerLabel = 'Email Signup ✉️';
      else if (authMethod === 'email_signin') providerLabel = 'Email Sign In ✉️';

      // Check if user already exists in registry
      const existingIdx = users.findIndex(
        (u) => u.email && u.email.toLowerCase() === userEmail && userEmail !== 'guest@weathergpt.ai'
      );

      if (existingIdx >= 0) {
        // Update existing user record
        const existing = users[existingIdx];
        const updatedRecord = {
          ...existing,
          name: userName || existing.name,
          provider: providerLabel,
          role: user.role || existing.role || 'Member',
          timestamp: now.toISOString(),
          formattedTime: now.toLocaleString(),
          device: device,
          browser: browser,
          loginCount: (existing.loginCount || 1) + 1,
          status: 'Active Now 🟢'
        };
        users[existingIdx] = updatedRecord;
      } else {
        // Create new user record
        const newRecord = {
          id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: userName,
          email: user.email || `user_${Date.now()}@weathergpt.ai`,
          provider: providerLabel,
          role: user.role || 'Standard Member',
          timestamp: now.toISOString(),
          formattedTime: now.toLocaleString(),
          device: device,
          browser: browser,
          loginCount: 1,
          status: 'Active Now 🟢'
        };
        users.unshift(newRecord);
      }

      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(users));
      console.log('✅ Accessor Database: Recorded user session for', userEmail, `(${providerLabel})`);
      return users;
    } catch (err) {
      console.warn('Failed to record user in database:', err);
    }
  }

  // Compute summary stats for the Accessor Dashboard
  getStats() {
    const users = this.getAllUsers();
    const totalRegistrations = users.length;
    const totalSessions = users.reduce((acc, u) => acc + (u.loginCount || 1), 0);
    const googleCount = users.filter((u) => u.provider?.includes('Google')).length;
    const emailCount = users.filter((u) => u.provider?.includes('Email')).length;
    const guestCount = users.filter((u) => u.provider?.includes('Guest')).length;

    return {
      totalUsers: totalRegistrations,
      totalSessions,
      googleCount,
      emailCount,
      guestCount,
      lastActive: users[0]?.formattedTime || 'Just now'
    };
  }

  // Export full database to CSV for Excel / Accessor download
  exportToCSV() {
    const users = this.getAllUsers();
    const headers = ['User ID', 'Full Name', 'Email Address', 'Auth Provider', 'Role', 'Registration / Last Login', 'Device', 'Browser', 'Login Count'];

    const rows = users.map((u) => [
      `"${u.id || ''}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${(u.provider || '').replace(/"/g, '""')}"`,
      `"${u.role || 'Member'}"`,
      `"${u.formattedTime || u.timestamp || ''}"`,
      `"${u.device || ''}"`,
      `"${u.browser || ''}"`,
      u.loginCount || 1
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WeatherGPT_User_Registry_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Clear database (accessor only)
  clearDatabase() {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn(e);
    }
  }
}

export const userRegistryService = new UserRegistryService();
