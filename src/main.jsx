import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerServiceWorker } from './registerServiceWorker';

// Register Service Worker for 100% offline edge caching and PWA installation
registerServiceWorker((registration) => {
  console.log('[PWA] WeatherGPT service worker updated with new cache version.');
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

