// ============================================================================
// Service Worker Registration Handler
// Registers sw.js and enables 100% offline edge caching and PWA installation
// ============================================================================

export function registerServiceWorker(onUpdateFound) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers are not supported in this browser environment.');
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[PWA] ServiceWorker successfully registered with scope:', registration.scope);

        // Check for updates periodically
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[PWA] New content is available and will be used when all tabs are closed.');
                if (onUpdateFound) onUpdateFound(registration);
              } else {
                console.log('[PWA] Content is cached for offline use (100% Zero-Tower Offline Ready).');
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[PWA] Error during ServiceWorker registration:', error);
      });
  });
}
