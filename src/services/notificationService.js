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

  // Autonomous Predictive Before-Awareness Hazard Detection Engine
  predictEarlyHazardAndNotify: (weatherData, aqiData, locationName = 'Your Area', lang = 'en') => {
    if (!weatherData?.hourly) return null;

    const hourly = weatherData.hourly;
    const current = weatherData.current || {};
    const now = new Date();

    // Check hourly data for the next 24 hours
    const times = hourly.time || [];
    const precips = hourly.precipitation || [];
    const probs = hourly.precipitation_probability || [];
    const winds = hourly.wind_speed_10m || [];
    const gusts = hourly.wind_gusts_10m || [];
    const codes = hourly.weather_code || [];
    const temps = hourly.temperature_2m || [];
    const pressures = hourly.surface_pressure || [];
    const aqi = aqiData?.current?.us_aqi || 45;

    let peakHazard = null;
    let hazardType = null;
    let peakIndex = -1;
    let highestScore = 0;

    for (let i = 0; i < Math.min(times.length, 24); i++) {
      const p = precips[i] || 0;
      const prob = probs[i] || 0;
      const w = winds[i] || 0;
      const g = gusts[i] || w * 1.3;
      const c = codes[i] || 0;
      const t = temps[i] || 28;
      const press = pressures[i] || 1012;

      // 1. Heavy Rainfall / Urban Flash Flood risk
      if (p >= 15 || (p >= 5 && prob >= 70)) {
        const score = p * 4 + prob * 0.5;
        if (score > highestScore) {
          highestScore = score;
          peakIndex = i;
          hazardType = 'heavy_rain';
          peakHazard = {
            level: p >= 30 ? 'red' : 'orange',
            category: 'Predictive Heavy Rain & Flood Warning',
            amount: p.toFixed(1),
            probability: prob,
            timeStr: times[i],
          };
        }
      }

      // 2. Severe Gale / Cyclone Gusts
      if (g >= 55 || (w >= 40 && press < 1004)) {
        const score = g * 2;
        if (score > highestScore) {
          highestScore = score;
          peakIndex = i;
          hazardType = 'gale_cyclone';
          peakHazard = {
            level: g >= 75 || press < 998 ? 'red' : 'orange',
            category: 'Predictive Gale & Cyclone Alert',
            gustSpeed: Math.round(g),
            pressure: Math.round(press),
            timeStr: times[i],
          };
        }
      }

      // 3. Severe Thunderstorm & Lightning (WMO 95, 96, 99)
      if (c >= 95 && c <= 99) {
        const score = 85;
        if (score > highestScore) {
          highestScore = score;
          peakIndex = i;
          hazardType = 'thunderstorm';
          peakHazard = {
            level: 'orange',
            category: 'Predictive Severe Thunderstorm Alert',
            weatherCode: c,
            timeStr: times[i],
          };
        }
      }
    }

    if (!peakHazard && aqi >= 180) {
      hazardType = 'severe_aqi';
      peakHazard = {
        level: 'orange',
        category: 'Predictive Severe Air Hazard Alert',
        aqiVal: aqi,
      };
    }

    if (!peakHazard) {
      // Default safe/nominal status
      return {
        hasThreat: false,
        level: 'green',
        title: lang === 'ta' ? 'அவசர ஆபத்துகள் இல்லை' : 'No Immediate Severe Hazard',
        message: lang === 'ta' ? 'அடுத்த 24 மணி நேரத்திற்கு வளிமண்டல நிலைமைகள் சீராக உள்ளன.' : 'Atmospheric conditions stable for the next 24 hours.',
        leadTimeHours: null,
      };
    }

    // Calculate lead-time
    const peakDate = peakHazard.timeStr ? new Date(peakHazard.timeStr) : new Date();
    const leadTimeMs = Math.max(0, peakDate.getTime() - now.getTime());
    const leadTimeHours = Math.max(1, Math.round(leadTimeMs / (1000 * 60 * 60)));
    const peakTimeStr = peakDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    let title = '';
    let message = '';
    let action = '';

    if (hazardType === 'heavy_rain') {
      title = lang === 'ta'
        ? `🚨 தீவிர கனமழை & நீர் தேக்க முன்னெச்சரிக்கை (~${leadTimeHours} மணி நேரத்தில்)`
        : `🚨 Severe Rain & Inundation Warning (In ~${leadTimeHours} hrs at ${peakTimeStr})`;
      message = lang === 'ta'
        ? `${locationName} பகுதியில் அடுத்த ${leadTimeHours} மணி நேரத்தில் சுமார் ${peakHazard.amount} மி.மீ கனமழை மற்றும் சாலைகளில் தண்ணீர் தேங்க வாய்ப்பு உள்ளது.`
        : `High-intensity precipitation (~${peakHazard.amount}mm) predicted over ${locationName} around ${peakTimeStr}. Low-lying road waterlogging expected.`;
      action = lang === 'ta'
        ? 'தாழ்வான பகுதிகளில் உள்ள வாகனங்களை மேடான இடத்திற்கு மாற்றவும்; அத்தியாவசிய பொருட்களைப் பாதுகாக்கவும்.'
        : 'Move vehicles to elevated parking; charge communication devices; avoid underpasses.';
    } else if (hazardType === 'gale_cyclone') {
      title = lang === 'ta'
        ? `⚠️ பலத்த சூறாவளிக் காற்று எச்சரிக்கை (${peakHazard.gustSpeed} km/h)`
        : `⚠️ Severe Gale & Squall Warning (${peakHazard.gustSpeed} km/h Gusts)`;
      message = lang === 'ta'
        ? `${locationName} பகுதியில் ${peakTimeStr} வேளையில் ${peakHazard.gustSpeed} km/h வேகத்தில் பலத்த காற்று வீசக்கூடும்.`
        : `Damaging wind gusts up to ${peakHazard.gustSpeed} km/h predicted around ${peakTimeStr} over ${locationName}.`;
      action = lang === 'ta'
        ? 'திறந்தவெளிகளில் நிற்பதைத் தவிர்க்கவும்; விளம்பரப் பலகைகள் மற்றும் மரங்களுக்கு அருகில் நிற்க வேண்டாம்.'
        : 'Secure loose outdoor structures; stay clear of old trees and tin roofs.';
    } else if (hazardType === 'thunderstorm') {
      title = lang === 'ta'
        ? `⚡ இடி மின்னல் & ஆலங்கட்டி மழை எச்சரிக்கை`
        : `⚡ Severe Thunderstorm & Lightning Warning`;
      message = lang === 'ta'
        ? `${locationName} பகுதியில் தீவிர இடி மின்னலுடன் கூடிய புயல் மேகங்கள் உருவாகின்றன.`
        : `Convective storm cells with intense cloud-to-ground lightning forming near ${locationName}.`;
      action = lang === 'ta'
        ? 'மின் சாதனங்களைப் பிரித்து வைக்கவும்; பாதுகாப்பான கான்கிரீட் கட்டடங்களுக்குள் இருக்கவும்.'
        : 'Disconnect electronic appliances; seek indoor shelter away from open windows.';
    } else {
      title = lang === 'ta' ? `😷 தீவிர காற்று மாசுபாடு எச்சரிக்கை` : `😷 Severe Air Quality Hazard`;
      message = lang === 'ta'
        ? `${locationName} பகுதியில் காற்று தரம் ${peakHazard.aqiVal} AQI ஆக மோசமடைந்துள்ளது.`
        : `Hazardous particulate AQI (${peakHazard.aqiVal}) detected across ${locationName}.`;
      action = lang === 'ta' ? 'N95 முகக்கவசம் அணியவும்; வெளியில் செல்வதைத் தவிர்க்கவும்.' : 'Wear N95 masks; avoid outdoor cardio.';
    }

    const threatObj = {
      hasThreat: true,
      hazardType,
      level: peakHazard.level,
      title,
      message,
      action,
      leadTimeHours,
      peakTimeStr,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Autonomous Proactive Dispatch: Check cooldown (dispatch once per 2 hours to avoid spam)
    const LAST_NOTIFIED_KEY = 'weathergpt_last_early_awareness_time';
    const lastNotified = localStorage.getItem(LAST_NOTIFIED_KEY);
    const nowTime = Date.now();

    if (!lastNotified || nowTime - parseInt(lastNotified, 10) > 2 * 60 * 60 * 1000) {
      localStorage.setItem(LAST_NOTIFIED_KEY, nowTime.toString());
      // Proactively send multi-channel push & play alert chime
      notificationService.sendMultiChannelAlert(
        {
          id: `early-hazard-${hazardType}-${Date.now()}`,
          level: peakHazard.level,
          title: threatObj.title,
          message: threatObj.message,
          action: threatObj.action,
        },
        locationName
      );
    }

    return threatObj;
  },
};

