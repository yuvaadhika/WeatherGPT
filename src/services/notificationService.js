// WeatherGPT Multi-Channel Alert & Notification Service (SMS, Email, Browser Push)
// Manages alert preferences, phone numbers for SMS, email logins, delivery logging, and test dispatches.

const SETTINGS_KEY = 'weathergpt_alert_channels_v2';
const LOGS_KEY = 'weathergpt_alert_delivery_logs';

export const notificationService = {
  // Default Settings Schema
  getDefaultSettings: () => ({
    push: {
      enabled: false,
      sound: true,
      severeOnly: false,
    },
    sms: {
      enabled: false,
      phoneNumber: '',
      countryCode: '+91',
      triggers: {
        redAlert: true,
        cycloneFlood: true,
        orangeRain: true,
        aqiHazard: false,
      },
    },
    email: {
      enabled: false,
      emailAddress: '',
      triggers: {
        severeEarlyWarning: true,
        morningDailyDigest: true,
        cropFarmAdvisory: false,
        marineAdvisory: false,
      },
    },
  }),

  // Get current stored settings
  getSettings: () => {
    if (typeof window === 'undefined') return notificationService.getDefaultSettings();
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...notificationService.getDefaultSettings(),
          ...parsed,
          push: { ...notificationService.getDefaultSettings().push, ...(parsed.push || {}) },
          sms: { ...notificationService.getDefaultSettings().sms, ...(parsed.sms || {}) },
          email: { ...notificationService.getDefaultSettings().email, ...(parsed.email || {}) },
        };
      }
    } catch (e) {
      console.warn('Error reading alert settings:', e);
    }
    return notificationService.getDefaultSettings();
  },

  // Save updated settings
  saveSettings: (settings) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving alert settings:', e);
    }
  },

  // Get recent delivery logs
  getDeliveryLogs: () => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(LOGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  // Log a dispatched alert
  addDeliveryLog: ({ channel, target, title, message, level = 'orange' }) => {
    if (typeof window === 'undefined') return;
    try {
      const logs = notificationService.getDeliveryLogs();
      const newEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        channel, // 'push' | 'sms' | 'email'
        target,
        title,
        message,
        level,
        status: 'Delivered',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString(),
      };
      const updated = [newEntry, ...logs.slice(0, 49)];
      localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
      return newEntry;
    } catch (e) {
      console.warn('Error saving delivery log:', e);
    }
  },

  // Clear delivery logs
  clearDeliveryLogs: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOGS_KEY);
  },

  // Check if browser notifications are supported
  isSupported: () => {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission: () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  },

  requestPermission: async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      const settings = notificationService.getSettings();
      if (permission === 'granted') {
        settings.push.enabled = true;
        notificationService.saveSettings(settings);
      }
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  },

  // Check if any notification channel is active
  hasAnyChannelActive: () => {
    const s = notificationService.getSettings();
    const pushOk = s.push.enabled && notificationService.getPermission() === 'granted';
    const smsOk = s.sms.enabled && !!s.sms.phoneNumber?.trim();
    const emailOk = s.email.enabled && !!s.email.emailAddress?.trim();
    return pushOk || smsOk || emailOk;
  },

  // Audio chime alert
  playChime: (type = 'alert') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type === 'severe' ? 'sawtooth' : 'sine';
      if (type === 'severe') {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(880, now + 0.3);
      } else {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.debug('Audio chime skipped:', e);
    }
  },

  // Dispatch Browser Push
  sendPushAlert: (alert, locationName = 'Your Area') => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }
    try {
      const icons = { red: '🚨', orange: '⚠️', yellow: '⚡' };
      const prefix = icons[alert.level] || '📢';
      const title = `${prefix} WeatherGPT Alert: ${alert.title} (${locationName})`;
      const body = `${alert.message}\nSafety Directive: ${alert.action || 'Stay updated.'}`;

      const n = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `weather-alert-${alert.id || 'general'}`,
        requireInteraction: alert.level === 'red',
      });

      n.onclick = () => {
        window.focus();
        n.close();
      };

      const s = notificationService.getSettings();
      if (s.push.sound !== false) {
        notificationService.playChime(alert.level === 'red' ? 'severe' : 'alert');
      }

      notificationService.addDeliveryLog({
        channel: 'push',
        target: 'Browser Desktop/Mobile',
        title,
        message: alert.message,
        level: alert.level,
      });

      return true;
    } catch (err) {
      console.warn('Push alert error:', err);
      return false;
    }
  },

  // Dispatch SMS Alert (Simulated Gateway with instant phone delivery log)
  sendSmsAlert: (alert, locationName = 'Your Area') => {
    const s = notificationService.getSettings();
    if (!s.sms.enabled || !s.sms.phoneNumber?.trim()) return false;

    const fullPhone = `${s.sms.countryCode} ${s.sms.phoneNumber.trim()}`;
    const smsContent = `[WeatherGPT ${alert.level?.toUpperCase()} ALERT] ${alert.title} in ${locationName}. ${alert.message}. Action: ${alert.action || 'Stay Safe'}.`;

    notificationService.addDeliveryLog({
      channel: 'sms',
      target: fullPhone,
      title: `SMS to ${fullPhone}`,
      message: smsContent,
      level: alert.level,
    });

    return {
      success: true,
      recipient: fullPhone,
      text: smsContent,
    };
  },

  // Dispatch Email Alert (Simulated Gateway with instant email delivery log)
  sendEmailAlert: (alert, locationName = 'Your Area') => {
    const s = notificationService.getSettings();
    if (!s.email.enabled || !s.email.emailAddress?.trim()) return false;

    const email = s.email.emailAddress.trim();
    const emailSubject = `⚠️ WeatherGPT Alert for ${locationName}: ${alert.title}`;
    const emailBody = `Dear WeatherGPT User,\n\nA ${alert.level?.toUpperCase()} weather warning has been issued for ${locationName}.\n\nAlert Details: ${alert.message}\nRecommended Action: ${alert.action}\n\nStay protected with real-time NWP Doppler GIS alerts.\n- WeatherGPT Meteorological System`;

    notificationService.addDeliveryLog({
      channel: 'email',
      target: email,
      title: emailSubject,
      message: emailBody,
      level: alert.level,
    });

    return {
      success: true,
      recipient: email,
      subject: emailSubject,
      body: emailBody,
    };
  },

  // Dispatch to all active channels
  sendMultiChannelAlert: (alert, locationName = 'Your Area') => {
    const s = notificationService.getSettings();
    const results = { push: false, sms: null, email: null };

    if (s.push.enabled) {
      results.push = notificationService.sendPushAlert(alert, locationName);
    }
    if (s.sms.enabled) {
      results.sms = notificationService.sendSmsAlert(alert, locationName);
    }
    if (s.email.enabled) {
      results.email = notificationService.sendEmailAlert(alert, locationName);
    }

    return results;
  },

  // Test Dispatches
  sendTestAlert: (locationName = 'Chennai') => {
    const alertObj = {
      id: 'test-multichannel',
      level: 'orange',
      category: 'Emergency Warning Test',
      title: 'Multi-Channel Alert System Active',
      message: `WeatherGPT alert broadcasting is verified for ${locationName}. You will receive instant warnings for severe storms, heavy precipitation, and air hazards.`,
      action: 'All configured notification channels (SMS, Email, Push) are active.',
    };
    return notificationService.sendMultiChannelAlert(alertObj, locationName);
  },

  sendTestSms: (phoneNumber, locationName = 'Chennai') => {
    const alertObj = {
      id: 'test-sms',
      level: 'red',
      category: 'SMS Gateway Test',
      title: 'Severe Weather Warning SMS',
      message: `Thunderstorm & squall line detected over ${locationName}. Wind gusts up to 65 km/h expected.`,
      action: 'Seek indoor shelter immediately.',
    };
    const s = notificationService.getSettings();
    const fullPhone = phoneNumber || `${s.sms.countryCode} ${s.sms.phoneNumber}`;
    const smsContent = `[WeatherGPT RED ALERT] Thunderstorm warning in ${locationName}. Wind gusts up to 65 km/h. Seek indoor shelter.`;

    notificationService.addDeliveryLog({
      channel: 'sms',
      target: fullPhone,
      title: `SMS to ${fullPhone}`,
      message: smsContent,
      level: 'red',
    });

    return {
      success: true,
      recipient: fullPhone,
      text: smsContent,
    };
  },

  sendTestEmail: (emailAddress, locationName = 'Chennai') => {
    const alertObj = {
      id: 'test-email',
      level: 'orange',
      category: 'Email Bulletin Test',
      title: 'Daily Meteorological & Disaster Advisory',
      message: `Forecast summary for ${locationName}: Moderate precipitation expected between 3:00 PM – 6:00 PM. Topsoil moisture index: 0.38 m³/m³.`,
      action: 'Check live Doppler radar in WeatherGPT dashboard.',
    };
    const email = emailAddress || notificationService.getSettings().email.emailAddress;
    const emailSubject = `🌦️ WeatherGPT Daily Bulletin for ${locationName}`;

    notificationService.addDeliveryLog({
      channel: 'email',
      target: email,
      title: emailSubject,
      message: `Weather advisory dispatched successfully to ${email}. Precipitation & agro-telemetry active.`,
      level: 'orange',
    });

    return {
      success: true,
      recipient: email,
      subject: emailSubject,
    };
  },
};
