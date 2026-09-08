// WeatherGPT Accessor & Admin Central User Registry Database Service
// Tracks all user logins, signups, Google authentications, and guest accesses globally across ALL devices & friends.

const DB_STORAGE_KEY = 'weathergpt_accessor_database';
const USER_REGISTRY_CLOUD_ID = 'ff808181a067127101a0816a838f4ad4';
const CLOUD_API_BASE = 'https://api.restful-api.dev/objects';

// Helper to get device info
function getClientDeviceInfo() {
  if (typeof window === 'undefined') return { device: 'Unknown', browser: 'Unknown' };
  const ua = navigator.userAgent || '';
  let device = 'Desktop PC 🖥️';
  if (/Android/i.test(ua)) device = 'Android Phone 🤖';
  else if (/iPhone/i.test(ua)) device = 'iPhone 🍎';
  else if (/iPad/i.test(ua)) device = 'iPad 📱';
  else if (/Macintosh/i.test(ua)) device = 'MacBook 💻';
  else if (/Windows/i.test(ua)) device = 'Windows PC 🖥️';
  else if (/Linux/i.test(ua)) device = 'Linux PC 🐧';

  let browser = 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  return { device, browser };
}

class UserRegistryService {
  constructor() {
    this.initDatabase();
    // Auto-fetch cloud users in background upon service initialization
    if (typeof window !== 'undefined') {
      setTimeout(() => this.fetchCloudUsers().catch(() => {}), 1000);
    }
  }

  initDatabase() {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.warn('UserRegistryService init error:', e);
    }
  }

  // Synchronous getter for current cached users
  getAllUsers() {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          return list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        }
      }
    } catch (e) {
      console.warn('Error reading user database:', e);
    }
    return [];
  }

  // Fetch ALL users and friends across all devices from Central Cloud Database
  async fetchCloudUsers() {
    try {
      let cloudUsers = [];

      // 1. Try local serverless API first
      try {
        const apiRes = await fetch('/api/db?action=get_users', { cache: 'no-cache' });
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (Array.isArray(data.users) && data.users.length > 0) {
            cloudUsers = data.users;
          }
        }
      } catch (e) {
        // Fallback to direct cloud store
      }

      // 2. Direct cloud fallback if serverless proxy is empty
      if (cloudUsers.length === 0) {
        try {
          const directRes = await fetch(`${CLOUD_API_BASE}/${USER_REGISTRY_CLOUD_ID}`, { cache: 'no-cache' });
          if (directRes.ok) {
            const data = await directRes.json();
            if (Array.isArray(data.data?.users)) {
              cloudUsers = data.data.users;
            }
          }
        } catch (e) {}
      }

      // Merge cloud users with local users
      const localUsers = this.getAllUsers();
      const userMap = new Map();

      // Put cloud users first
      cloudUsers.forEach((u) => {
        if (u.id || u.email) {
          const key = u.email ? u.email.toLowerCase() : u.id;
          userMap.set(key, u);
        }
      });

      // Merge local users (if newer)
      localUsers.forEach((u) => {
        if (u.id || u.email) {
          const key = u.email ? u.email.toLowerCase() : u.id;
          if (!userMap.has(key)) {
            userMap.set(key, u);
          } else {
            const existing = userMap.get(key);
            if (new Date(u.timestamp) > new Date(existing.timestamp)) {
              userMap.set(key, { ...existing, ...u });
            }
          }
        }
      });

      const merged = Array.from(userMap.values()).sort(
        (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
      );

      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.warn('fetchCloudUsers error, returning local cache:', err);
      return this.getAllUsers();
    }
  }

  // Push user record to Central Cloud Database asynchronously
  async syncUserToCloud(userRecord) {
    if (!userRecord) return;
    try {
      // 1. Post via /api/db endpoint
      fetch('/api/db?action=record_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userRecord })
      }).catch(() => {});

      // 2. Also push direct to Cloud Object Store for redundancy
      const getRes = await fetch(`${CLOUD_API_BASE}/${USER_REGISTRY_CLOUD_ID}`);
      let existingUsers = [];
      if (getRes.ok) {
        const json = await getRes.json();
        existingUsers = json.data?.users || [];
      }

      const userEmail = (userRecord.email || '').trim().toLowerCase();
      const userId = userRecord.id || '';
      const visitorId = userRecord.visitorId || '';

      // Match by email, id, or visitor device ID to update seamlessly
      const existingIdx = existingUsers.findIndex(
        (u) =>
          (userEmail && u.email && u.email.toLowerCase() === userEmail) ||
          (userId && u.id === userId) ||
          (visitorId && (u.id === visitorId || u.visitorId === visitorId || u.email?.includes(visitorId)))
      );

      if (existingIdx >= 0) {
        existingUsers[existingIdx] = {
          ...existingUsers[existingIdx],
          ...userRecord,
          loginCount: (existingUsers[existingIdx].loginCount || 1) + 1
        };
      } else {
        existingUsers.unshift(userRecord);
      }

      const trimmed = existingUsers.slice(0, 200);

      await fetch(`${CLOUD_API_BASE}/${USER_REGISTRY_CLOUD_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'WeatherGPT_Global_Users',
          data: { users: trimmed }
        })
      });
    } catch (e) {
      console.warn('Direct cloud user sync warning:', e);
    }
  }

  // Record a user session (Login, Signup, Google, Guest)
  recordUserSession(user, authMethod = 'email') {
    if (!user) return;
    try {
      const users = this.getAllUsers();
      const { device, browser } = getClientDeviceInfo();
      const userEmail = (user.email || '').trim().toLowerCase();
      const userName = (user.name || 'WeatherGPT User').trim();
      const visitorId = localStorage.getItem('weathergpt_visitor_id') || `dev_${Math.random().toString(36).substr(2, 6)}`;
      const now = new Date();

      let providerLabel = 'Email ✉️';
      if (authMethod === 'google' || user.provider === 'google') providerLabel = 'Google 🌐';
      else if (authMethod === 'guest' || user.provider === 'guest') providerLabel = 'Guest Access 👤';
      else if (authMethod === 'email_signup') providerLabel = 'Email Signup ✉️';
      else if (authMethod === 'email_signin') providerLabel = 'Email Sign In ✉️';
      else if (authMethod === 'auto_visitor') providerLabel = 'Live Link Visitor 🚀';

      // Match existing record by email, id, or visitorId
      const existingIdx = users.findIndex(
        (u) =>
          (userEmail && u.email && u.email.toLowerCase() === userEmail) ||
          (u.visitorId && u.visitorId === visitorId) ||
          (u.id && u.id === visitorId)
      );

      let recordToSave = null;

      if (existingIdx >= 0) {
        const existing = users[existingIdx];
        recordToSave = {
          ...existing,
          name: userName || existing.name,
          email: user.email || existing.email,
          provider: providerLabel,
          role: user.role || existing.role || 'Member',
          timestamp: now.toISOString(),
          formattedTime: now.toLocaleString(),
          device: device,
          browser: browser,
          location: user.location || existing.location || 'Online Visitor',
          loginCount: (existing.loginCount || 1) + 1,
          status: 'Active Now 🟢',
          visitorId: visitorId
        };
        users[existingIdx] = recordToSave;
      } else {
        recordToSave = {
          id: user.id || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: userName,
          email: user.email || `guest_${visitorId}@weathergpt.live`,
          provider: providerLabel,
          role: user.role || 'Standard Member',
          timestamp: now.toISOString(),
          formattedTime: now.toLocaleString(),
          device: device,
          browser: browser,
          location: user.location || 'Online Visitor',
          loginCount: 1,
          status: 'Active Now 🟢',
          visitorId: visitorId
        };
        users.unshift(recordToSave);
      }

      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(users));

      // Push to Central Cloud Database for Admin View
      this.syncUserToCloud(recordToSave);

      return users;
    } catch (err) {
      console.warn('Failed to record user in database:', err);
    }
  }

  // Automatically register and sync any friend who opens the link
  autoRegisterVisitor(currentUser = null, currentLocation = null) {
    if (typeof window === 'undefined') return;
    try {
      const locStr = currentLocation?.name ? `${currentLocation.name}, ${currentLocation.country || 'India'}` : 'Live Web Visitor';

      if (currentUser) {
        this.recordUserSession({
          ...currentUser,
          location: locStr
        }, currentUser.provider || 'authenticated');
      } else {
        // Unique persistent visitor ID per device
        let visitorId = localStorage.getItem('weathergpt_visitor_id');
        if (!visitorId) {
          visitorId = `v_${Math.random().toString(36).substr(2, 6)}`;
          localStorage.setItem('weathergpt_visitor_id', visitorId);
        }

        const { device } = getClientDeviceInfo();
        const visitorName = `Online Visitor (${device.split(' ')[0]})`;
        const visitorEmail = `visitor_${visitorId}@weathergpt.live`;

        this.recordUserSession({
          name: visitorName,
          email: visitorEmail,
          role: 'Live Visitor',
          location: locStr,
          provider: 'auto_visitor'
        }, 'auto_visitor');
      }
    } catch (e) {
      console.warn('Auto register visitor error:', e);
    }
  }

  // Compute summary stats for the Accessor Dashboard
  getStats() {
    const users = this.getAllUsers();
    const totalRegistrations = users.length;
    const totalSessions = users.reduce((acc, u) => acc + (u.loginCount || 1), 0);
    const googleCount = users.filter((u) => u.provider?.includes('Google')).length;
    const emailCount = users.filter((u) => u.provider?.includes('Email')).length;
    const guestCount = users.filter((u) => u.provider?.includes('Guest') || u.provider?.includes('Visitor')).length;

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
    const headers = ['User ID', 'Full Name', 'Email Address', 'Auth Provider', 'Role', 'Registration / Last Login', 'Device', 'Browser', 'Location', 'Login Count'];

    const rows = users.map((u) => [
      `"${u.id || ''}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${(u.provider || '').replace(/"/g, '""')}"`,
      `"${u.role || 'Member'}"`,
      `"${u.formattedTime || u.timestamp || ''}"`,
      `"${u.device || ''}"`,
      `"${u.browser || ''}"`,
      `"${u.location || ''}"`,
      u.loginCount || 1
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WeatherGPT_Global_User_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Clear database (accessor only)
  async clearDatabase() {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify([]));
      // Clear cloud store
      fetch('/api/db?action=clear', { method: 'POST' }).catch(() => {});
      fetch(`${CLOUD_API_BASE}/${USER_REGISTRY_CLOUD_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'WeatherGPT_Global_Users', data: { users: [] } })
      }).catch(() => {});
    } catch (e) {
      console.warn(e);
    }
  }
}

export const userRegistryService = new UserRegistryService();
