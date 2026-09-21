// Vercel Serverless Function: High-Fidelity Multilingual TTS Audio Streamer
// Serves crystal-clear Tamil (தமிழ்), Hindi, Telugu, Malayalam, etc. audio without browser Referer / CORS restrictions

export default async function handler(req, res) {
  const { text, lang = 'ta' } = req.query;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text query parameter is required' });
  }

  const primaryLang = String(lang).split(/[-_]/)[0].toLowerCase();
  // Safe chunk size for Google TTS endpoints (max 100 chars to avoid 404/400)
  const cleanChunk = text.slice(0, 110).trim();
  const encodedText = encodeURIComponent(cleanChunk);

  const googleEndpoints = [
    `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${encodeURIComponent(primaryLang)}&q=${encodedText}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(primaryLang)}&client=dict-chrome-ex&q=${encodedText}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(primaryLang)}&client=tw-ob&q=${encodedText}`
  ];

  for (const targetUrl of googleEndpoints) {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
          'Accept': '*/*',
        },
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(Buffer.from(audioBuffer));
      }
    } catch (e) {
      // Try next endpoint
      console.warn(`TTS fetch failed for ${targetUrl}:`, e);
    }
  }

  return res.status(500).json({ error: 'All TTS upstream providers unavailable' });
}
