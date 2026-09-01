import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

const ttsDevPlugin = () => ({
  name: 'tts-dev-server',
  configureServer(server) {
    server.middlewares.use('/api/tts', (req, res) => {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const text = parsedUrl.searchParams.get('text');
      const lang = parsedUrl.searchParams.get('lang') || 'ta';

      if (!text) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Text parameter is required' }));
        return;
      }

      const primaryLang = lang.split(/[-_]/)[0].toLowerCase();
      const cleanText = text.slice(0, 180).trim();
      const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(primaryLang)}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

      https.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
      }).on('error', (err) => {
        console.error('Dev TTS proxy error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      });
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ttsDevPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
