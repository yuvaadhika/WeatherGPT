// Vercel Serverless Function: High-Fidelity Multilingual TTS Audio Streamer
// Serves crystal-clear Tamil (தமிழ்), Hindi, Telugu, Malayalam, etc. audio without browser Referer / CORS restrictions

export default async function handler(req, res) {
  const { text, lang = 'ta' } = req.query;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text query parameter is required' });
  }

  const primaryLang = String(lang).split(/[-_]/)[0].toLowerCase();
  const cleanChunk = text.slice(0, 180).trim();
  const encodedText = encodeURIComponent(cleanChunk);
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(primaryLang)}&client=tw-ob&q=${encodedText}`;

  try {
    const response = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      // Try secondary endpoint
      const fallbackUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${encodeURIComponent(primaryLang)}&q=${encodedText}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://translate.google.com/',
        },
      });

      if (!fallbackRes.ok) {
        return res.status(response.status).json({ error: 'TTS upstream provider unavailable' });
      }

      const fallbackBuffer = await fallbackRes.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(Buffer.from(fallbackBuffer));
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('Serverless TTS stream error:', err);
    return res.status(500).json({ error: err.message || 'TTS Generation Failed' });
  }
}
