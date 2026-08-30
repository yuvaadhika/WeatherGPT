// WeatherGPT Browser Push & Audio Notification Engine

export const notificationService = {
  // Check if browser notifications are supported
  isSupported: () => {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  // Get current permission status: 'granted' | 'denied' | 'default' | 'unsupported'
  getPermission: () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  },

  // Request user permission for notifications
  requestPermission: async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('weather_notifications_enabled', 'true');
      }
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  },

  // Check if user has enabled notifications in preferences
  isEnabled: () => {
    if (typeof window === 'undefined') return false;
    return (
      'Notification' in window &&
      Notification.permission === 'granted' &&
      localStorage.getItem('weather_notifications_enabled') !== 'false'
    );
  },

  // Set enabled preference
  setEnabled: (val) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('weather_notifications_enabled', val ? 'true' : 'false');
  },

  // Play audio alert chime using Web Audio API (no external asset needed)
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
        // Two-tone emergency alert frequency
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
        osc.frequency.setValueAtTime(880, now + 0.3);
      } else {
        // Gentle notification chime
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      // Audio context might be restricted before user gesture
      console.debug('Audio chime skipped:', e);
    }
  },

  // Trigger a native weather push notification
  sendAlert: (alert, locationName = 'Your Area') => {
    if (!notificationService.isEnabled()) return false;
    if (!alert || alert.level === 'green') return false;

    try {
      const icons = {
        red: '🚨',
        orange: '⚠️',
        yellow: '⚡',
      };
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

      // Play alert chime
      notificationService.playChime(alert.level === 'red' ? 'severe' : 'alert');
      return true;
    } catch (err) {
      console.warn('Failed to display native notification:', err);
      return false;
    }
  },

  // Send a test notification
  sendTestAlert: (locationName = 'Chennai') => {
    if (notificationService.getPermission() !== 'granted') {
      return false;
    }
    notificationService.sendAlert(
      {
        id: 'test-alert',
        level: 'orange',
        category: 'Test Warning System',
        title: 'Weather Alert Notifications Active',
        message: `Live meteorological push notifications are enabled for ${locationName}. You will receive instant warnings for storms, rainfall, heatwaves, and air quality hazards.`,
        action: 'Notifications configured successfully.',
      },
      locationName
    );
    return true;
  },
};
