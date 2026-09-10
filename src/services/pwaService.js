// ============================================================================
// WeatherGPT PWA & Native Install Service
// Manages BeforeInstallPrompt, 1-Click Install Flow, Standalone Status & OS Helpers
// ============================================================================

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.isAppInstalled = false;
    this.listeners = new Set();

    if (typeof window !== 'undefined') {
      // 1. Check if running as installed standalone app
      this.isAppInstalled =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');

      // 2. Listen for display-mode changes
      window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
        this.isAppInstalled = evt.matches;
        this.notifyListeners();
      });

      // 3. Capture native beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        console.log('[PWA] beforeinstallprompt captured, ready for 1-click install.');
        this.notifyListeners();
      });

      // 4. Listen for app installed event
      window.addEventListener('appinstalled', () => {
        this.isAppInstalled = true;
        this.deferredPrompt = null;
        console.log('[PWA] WeatherGPT was successfully installed!');
        this.notifyListeners();
      });
    }
  }

  // Subscribe to install prompt availability changes
  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      canInstall: !!this.deferredPrompt,
      isInstalled: this.isAppInstalled,
      platform: this.getPlatform()
    });
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const state = {
      canInstall: !!this.deferredPrompt,
      isInstalled: this.isAppInstalled,
      platform: this.getPlatform()
    };
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('[PWA] Listener callback error:', err);
      }
    });
  }

  // Trigger native 1-click installation prompt
  async promptInstall() {
    if (!this.deferredPrompt) {
      return { outcome: 'unavailable', platform: this.getPlatform() };
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      console.log('[PWA] User response to install prompt:', choiceResult.outcome);
      if (choiceResult.outcome === 'accepted') {
        this.isAppInstalled = true;
      }
      this.deferredPrompt = null;
      this.notifyListeners();
      return choiceResult;
    } catch (err) {
      console.warn('[PWA] Error during promptInstall:', err);
      return { outcome: 'dismissed', error: err };
    }
  }

  // Detect client platform
  getPlatform() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';

    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      return 'ios';
    }
    if (/android/i.test(ua)) {
      return 'android';
    }
    if (/Win/i.test(ua)) {
      return 'windows';
    }
    if (/Mac/i.test(ua)) {
      return 'mac';
    }
    return 'other';
  }

  // Check if iOS Safari (where manual "Add to Home Screen" is required)
  isIOSSafari() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isWebKit = /WebKit/i.test(ua);
    const isCriOS = /CriOS/i.test(ua);
    const isFxiOS = /FxiOS/i.test(ua);
    return isIOS && isWebKit && !isCriOS && !isFxiOS;
  }

  // Check if current session is running inside standalone PWA window
  isStandalone() {
    return this.isAppInstalled;
  }
}

export const pwaService = new PWAService();
