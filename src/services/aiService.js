import {
  fetchNWPForecast,
  fetchAirQuality,
  searchLocation,
  evaluateSevereWeatherAlerts,
  generateAgriAdvisory,
  generateCropSeedAdvisory,
  generateAviationBriefing,
  generateMarineBriefing,
  getWeatherDescription,
  getLocalizedPlaceName
} from './weatherService';
import { dbService } from './dbService';

// 🌐 Universal Multi-Language & Tanglish Auto-Detector Engine
// Detects Tamil script, Indic Unicode scripts, Tanglish Romanized phonetics, and English queries
export function detectLanguageFromQuery(query, defaultLang = 'en') {
  if (!query || typeof query !== 'string') return defaultLang;
  const q = query.trim();
  const qLower = q.toLowerCase();

  // 1. Script checks (Unicode ranges) - Tamil script ALWAYS takes highest priority
  if (/[\u0B80-\u0BFF]/.test(q)) return 'ta'; // Tamil script (தமிழ்)
  if (/[\u0900-\u097F]/.test(q)) {
    if (/\b(आहे|नाही|पाऊस|कसा|काय|करावे|होय|सांगा)\b/i.test(q)) return 'mr'; // Marathi
    return 'hi'; // Hindi
  }
  if (/[\u0C00-\u0C7F]/.test(q)) return 'te'; // Telugu
  if (/[\u0D00-\u0D7F]/.test(q)) return 'ml'; // Malayalam
  if (/[\u0C80-\u0CFF]/.test(q)) return 'kn'; // Kannada
  if (/[\u0980-\u09FF]/.test(q)) return 'bn'; // Bengali
  if (/[\u0A80-\u0AFF]/.test(q)) return 'gu'; // Gujarati
  if (/[\u0A00-\u0A7F]/.test(q)) return 'pa'; // Punjabi

  // 2. Tanglish Detection (Conversational Tamil written in English alphabets)
  const tanglishPatterns = [
    /\b(mazhai|malai|mazha|varuma|varum|peyyuma|peiyuma|peiyum|peyyum|irukku|erukku|iruku|eruku|irukkaa|erukkaa|irukkuma|erukkuma|irukkum|erukkum|irukka|eruka)\b/i,
    /\b(eppadi|epdi|ippo|eppo|enga|nalaiku|naalaikku|naalaiku|naalai|iniku|innikku|inniku|indha|intha|enta|solla|sollu|sollunga|solunga|sollungalen)\b/i,
    /\b(vidhai|vitha|vithai|seed|payir|vivasaayam|vivasayam|vivasayi|panlama|pannalama|podalama|podanum|podalaama|podunga|koodum|neram|veliya|kaathu|kaatru|veiyil|veyil|vanam|megam|kulir|thaneer|thanneer|oothe|aagum|theriyuma|kidaikkuma)\b/i,
    /\b(weather epdi|climate epdi|rain varuma|today weather|tomorrow rain|weather sollunga|climate sollunga|ennaku|enakku|ungala|ungalluku|ungalukku|romba|konjam|paathu|kudutha|varanum|pannu|pannalam|kudu|thappu|solra|mathiri)\b/i,
    /\b(kudai|raincoat|umbrella thevaya|umbrella theva|veliya poga|thittam|keka|pesu|paaru|parkalam|paarkalam|theerpu|marundhu|uram|thelikkalam|adikkuma|adikkum|eduthuttu|pogalama|pogalaama|vaikanum|vaikalam|vacha)\b/i,
    /\b(chennai|madurai|coimbatore|kovai|trichy|salem|ooty|nellai|tirunelveli|vellore|thanjavur|erode|tiruppur|dindigul|cuddalore|kanchipuram|villupuram|nagar|tamilnadu|tn)\s*(la|le|kku|ku)\b/i
  ];

  for (const pattern of tanglishPatterns) {
    if (pattern.test(qLower)) {
      return 'tanglish';
    }
  }

  // 3. Hinglish Detection
  const hinglishPatterns = [
    /\b(kya|hoga|hai|hogi|barish|barsat|hogi kya|kab|aayegi|kaisa|mausam|aaj ka|kal ka|batao|bataiye|kheti|fasal|beej)\b/i
  ];
  for (const pattern of hinglishPatterns) {
    if (pattern.test(qLower)) {
      return 'hi';
    }
  }

  // If user explicitly picked a non-English language in UI and query has no other script
  if (defaultLang && defaultLang !== 'en') {
    return defaultLang;
  }

  return 'en';
}

// Resolves Tamil and Tanglish city references to standard English query names for Open-Meteo geocoding
export function resolveTamilAndTanglishCityName(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim();
  const qLower = q.toLowerCase();

  // 1. Direct Tamil Unicode city map
  const tamilCityMap = [
    { pattern: /(?:சென்னை|சென்னையில|சென்னையில்|சென்னைல|சென்னையிலா)/, name: 'Chennai' },
    { pattern: /(?:மதுரை|மதுரையில|மதுரையில்|மதுரைல)/, name: 'Madurai' },
    { pattern: /(?:கோவை|கோவையில|கோவையில்|கோயம்புத்தூர்|கோயம்புத்தூரில்)/, name: 'Coimbatore' },
    { pattern: /(?:திருச்சி|திருச்சியில|திருச்சியில்|திருச்சிராப்பள்ளி)/, name: 'Tiruchirappalli' },
    { pattern: /(?:சேலம்|சேலத்துல|சேலத்தில்)/, name: 'Salem' },
    { pattern: /(?:நெல்லை|நெல்லையில|நெல்லையில்|திருநெல்வேலி|திருநெல்வேலியில்)/, name: 'Tirunelveli' },
    { pattern: /(?:வேலூர்|வேலூரில்|வேலூர்ல)/, name: 'Vellore' },
    { pattern: /(?:ஈரோடு|ஈரோட்டில்|ஈரோடுல)/, name: 'Erode' },
    { pattern: /(?:தஞ்சாவூர்|தஞ்சாவூரில்|தஞ்சை|தஞ்சையில்)/, name: 'Thanjavur' },
    { pattern: /(?:தூத்துக்குடி|தூத்துக்குடியில்)/, name: 'Thoothukudi' },
    { pattern: /(?:திண்டுக்கல்|திண்டுக்கல்லில்)/, name: 'Dindigul' },
    { pattern: /(?:கன்னியாகுமரி|கன்னியாகுமரியில்)/, name: 'Kanyakumari' },
    { pattern: /(?:ஊட்டி|ஊட்டியில்|உதகை)/, name: 'Ooty' },
    { pattern: /(?:புதுச்சேரி|புதுச்சேரியில்|பாண்டிச்சேரி)/, name: 'Puducherry' },
    { pattern: /(?:தில்லி|புது தில்லி|டெல்லி)/, name: 'Delhi' },
    { pattern: /(?:மும்பை|மும்பையில்)/, name: 'Mumbai' },
    { pattern: /(?:பெங்களூரு|பெங்களூர்|பெங்களூரில்)/, name: 'Bengaluru' },
    { pattern: /(?:ஹைதராபாத்|ஐதராபாத்)/, name: 'Hyderabad' },
    { pattern: /(?:கொல்கத்தா|கொல்கத்தாவில்)/, name: 'Kolkata' },
  ];

  for (const item of tamilCityMap) {
    if (item.pattern.test(q)) {
      return item.name;
    }
  }

  // 2. Tanglish Romanized city matching with suffixes like "chennai la", "chennaila", "madurai kku", etc.
  const tanglishCityMap = [
    { pattern: /\b(chennai|madras)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Chennai' },
    { pattern: /\b(madurai)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Madurai' },
    { pattern: /\b(coimbatore|kovai)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Coimbatore' },
    { pattern: /\b(trichy|tiruchirappalli)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Tiruchirappalli' },
    { pattern: /\b(salem)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Salem' },
    { pattern: /\b(nellai|tirunelveli)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Tirunelveli' },
    { pattern: /\b(vellore)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Vellore' },
    { pattern: /\b(erode)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Erode' },
    { pattern: /\b(thanjavur|tanjore)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Thanjavur' },
    { pattern: /\b(thoothukudi|tuticorin)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Thoothukudi' },
    { pattern: /\b(dindigul)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Dindigul' },
    { pattern: /\b(kanyakumari|nagercoil)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Kanyakumari' },
    { pattern: /\b(ooty|udhagamandalam)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Ooty' },
    { pattern: /\b(pondicherry|puducherry)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Puducherry' },
    { pattern: /\b(delhi|new delhi)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Delhi' },
    { pattern: /\b(mumbai|bombay)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Mumbai' },
    { pattern: /\b(bangalore|bengaluru)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Bengaluru' },
    { pattern: /\b(hyderabad)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Hyderabad' },
    { pattern: /\b(kolkata|calcutta)(?:la|le|kku|ku|\s+la|\s+le|\s+kku|\s+ku)?\b/i, name: 'Kolkata' },
  ];

  for (const item of tanglishCityMap) {
    if (item.pattern.test(qLower)) {
      return item.name;
    }
  }

  return null;
}

// Advanced Rain Verdict & Timing Calculation Engine - Precision Rain Arrival & Peak Window
export function calculateRainVerdict(nwpData, timeframe = 'current') {
  const hourly = nwpData?.hourly;
  const current = nwpData?.current || {};
  const daily = nwpData?.daily || {};

  const dailyProbToday = daily.precipitation_probability_max?.[0] ?? (current.precipitation ? 80 : 10);
  const dailyProbTomorrow = daily.precipitation_probability_max?.[1] ?? 10;
  const dailySumToday = daily.precipitation_sum?.[0] ?? (current.precipitation || 0);
  const dailySumTomorrow = daily.precipitation_sum?.[1] ?? 0;

  const targetDailyProb = timeframe === 'tomorrow' ? dailyProbTomorrow : dailyProbToday;
  const targetDailySum = timeframe === 'tomorrow' ? dailySumTomorrow : dailySumToday;

  if (!hourly || !hourly.time || hourly.time.length === 0) {
    const fallbackVerdict = targetDailyProb >= 50 ? 'YES' : (targetDailyProb >= 30 ? 'MAYBE' : 'NO');
    return {
      verdict: fallbackVerdict,
      maxProb: targetDailyProb,
      totalPrecip: targetDailySum.toFixed(1),
      predictedTimingEn: fallbackVerdict === 'NO' ? 'No rain expected in next 24 hours' : 'Possible showers today around 3:00 PM – 5:00 PM',
      predictedTimingTa: fallbackVerdict === 'NO' ? 'அடுத்த 24 மணி நேரத்தில் மழை வாய்ப்பு இல்லை' : 'இன்று மாலை சுமார் 3:00 PM – 5:00 PM வேளையில் மழைக்கு வாய்ப்பு',
      peakHourEn: null,
      peakHourTa: null,
    };
  }

  const now = new Date();
  let startIndex = 0;

  if (timeframe === 'tomorrow') {
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
    const found = hourly.time.findIndex(t => t.startsWith(tomorrowStr));
    startIndex = found !== -1 ? found : Math.min(hourly.time.length - 24, 24);
  } else {
    // Current / upcoming 24 hours: start from the current hour onwards
    const found = hourly.time.findIndex(t => new Date(t).getTime() >= now.getTime() - 1800000);
    startIndex = found !== -1 ? found : 0;
  }

  const endIndex = Math.min(hourly.time.length, startIndex + 24);
  const sliceTime = hourly.time.slice(startIndex, endIndex);
  const sliceProb = (hourly.precipitation_probability || []).slice(startIndex, endIndex);
  const slicePrecip = (hourly.precipitation || []).slice(startIndex, endIndex);
  const sliceCode = (hourly.weather_code || []).slice(startIndex, endIndex);

  let maxProb = 0;
  let maxPrecip = 0;
  let firstRainIdx = -1;
  let heaviestIdx = -1;
  let calculatedSum = 0;

  for (let i = 0; i < sliceTime.length; i++) {
    const p = sliceProb[i] ?? 0;
    const mm = slicePrecip[i] ?? 0;
    const code = sliceCode[i] ?? 0;
    calculatedSum += mm;

    if (p > maxProb) {
      maxProb = p;
    }
    if (mm > maxPrecip) {
      maxPrecip = mm;
      heaviestIdx = i;
    }

    // Identify the first upcoming hour where rain arrives
    if (p >= 35 || mm >= 0.2 || (code >= 51 && code <= 99)) {
      if (firstRainIdx === -1) {
        firstRainIdx = i;
      }
    }
  }

  // If no precipitation max index was explicitly set, use the highest probability index
  if (heaviestIdx === -1 && maxProb >= 35) {
    heaviestIdx = sliceProb.findIndex(p => p === maxProb);
  }

  const effectiveProb = Math.max(maxProb, targetDailyProb);
  const effectiveSum = Math.max(calculatedSum, targetDailySum);

  // Verdict decision: YES / MAYBE / NO
  let verdict = 'NO';
  if (effectiveProb >= 50 || effectiveSum >= 0.8 || (current.precipitation || 0) >= 0.5) {
    verdict = 'YES';
  } else if (effectiveProb >= 30 || effectiveSum >= 0.2 || firstRainIdx !== -1) {
    verdict = 'MAYBE';
  } else {
    verdict = 'NO';
  }

  const formatHour12 = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getTimePeriodTa = (hour) => {
    if (hour >= 4 && hour < 12) return 'காலை';
    if (hour >= 12 && hour < 16) return 'பிற்பகல்';
    if (hour >= 16 && hour < 20) return 'மாலை';
    if (hour >= 20 || hour < 4) return 'இரவு';
    return '';
  };

  const getDayPrefixTa = (isoStr) => {
    const d = new Date(isoStr);
    const isToday = d.toDateString() === now.toDateString();
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const isTomorrow = d.toDateString() === tomorrowDate.toDateString();
    const period = getTimePeriodTa(d.getHours());
    if (isToday) return `இன்று ${period}`;
    if (isTomorrow) return `நாளை ${period}`;
    return `${d.toLocaleDateString([], { weekday: 'short' })} ${period}`;
  };

  const getDayPrefixEn = (isoStr) => {
    const d = new Date(isoStr);
    const isToday = d.toDateString() === now.toDateString();
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const isTomorrow = d.toDateString() === tomorrowDate.toDateString();
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return d.toLocaleDateString([], { weekday: 'short' });
  };

  let predictedTimingEn = '';
  let predictedTimingTa = '';
  let peakHourEn = '';
  let peakHourTa = '';

  if (verdict === 'YES' || verdict === 'MAYBE') {
    const primaryIdx = firstRainIdx !== -1 ? firstRainIdx : heaviestIdx;

    if (primaryIdx !== -1 && sliceTime[primaryIdx]) {
      const onsetIso = sliceTime[primaryIdx];
      const onsetDate = new Date(onsetIso);
      const onsetProb = sliceProb[primaryIdx] ?? effectiveProb;
      const heavyIso = (heaviestIdx !== -1 && sliceTime[heaviestIdx]) ? sliceTime[heaviestIdx] : onsetIso;
      const heavyProb = sliceProb[heaviestIdx] ?? effectiveProb;

      // Concentrated 2-hour window starting from rain arrival
      const endWindowIso = new Date(onsetDate.getTime() + 2 * 3600000).toISOString();

      const dayTa = getDayPrefixTa(onsetIso);
      const dayEn = getDayPrefixEn(onsetIso);
      const startTimeStr = formatHour12(onsetIso);
      const endTimeStr = formatHour12(endWindowIso);
      const heavyTimeStr = formatHour12(heavyIso);

      if (primaryIdx === heaviestIdx || heavyTimeStr === startTimeStr) {
        predictedTimingEn = `${dayEn} around ${startTimeStr} – ${endTimeStr} (${onsetProb}% chance)`;
        predictedTimingTa = `${dayTa} ${startTimeStr} – ${endTimeStr} வேளையில் (${onsetProb}% வாய்ப்பு)`;
      } else {
        predictedTimingEn = `${dayEn} around ${startTimeStr} – ${endTimeStr} (Heaviest rain: ~${heavyTimeStr}, ${heavyProb}% chance)`;
        predictedTimingTa = `${dayTa} ${startTimeStr} – ${endTimeStr} வேளையில் மழை தொடங்கும் (அதிக மழை: ${heavyTimeStr}, ${heavyProb}%)`;
      }

      peakHourEn = `${dayEn} around ${startTimeStr}`;
      peakHourTa = `${dayTa} ${startTimeStr}`;
    } else {
      predictedTimingEn = 'Today during afternoon / evening hours (brief isolated showers)';
      predictedTimingTa = 'இன்று பிற்பகல் / மாலை வேளையில் லேசான தூறல் வாய்ப்பு';
      peakHourEn = `Peak chance ~${effectiveProb}%`;
      peakHourTa = `வாய்ப்பு ~${effectiveProb}%`;
    }
  } else {
    predictedTimingEn = 'No rain expected in the next 24 hours';
    predictedTimingTa = 'அடுத்த 24 மணி நேரத்தில் மழைக்கான வாய்ப்பு இல்லை';
  }

  return {
    verdict,
    maxProb: effectiveProb,
    totalPrecip: effectiveSum.toFixed(1),
    predictedTimingEn,
    predictedTimingTa,
    peakHourEn,
    peakHourTa,
  };
}

export class WeatherAIAgent {
  constructor() {
    this.hfApiKey = '';
    this.geminiApiKey = '';
    this.openaiApiKey = '';
    this.llamaApiKey = '';
    this.openWeatherApiKey = '';
    this.selectedModel = 'gemini'; // 'gemini' (Default Best #1 LLM) | 'hybrid' | 'openai' | 'llama'
    this.loadKeys();
  }

  loadKeys() {
    if (typeof window !== 'undefined') {
      this.hfApiKey = localStorage.getItem('weathergpt_hf_key') || '';
      this.geminiApiKey = localStorage.getItem('weathergpt_gemini_key') || '';
      this.openaiApiKey = localStorage.getItem('weathergpt_openai_key') || '';
      this.llamaApiKey = localStorage.getItem('weathergpt_llama_key') || '';
      this.openWeatherApiKey = localStorage.getItem('weathergpt_openweather_key') || '';
      this.selectedModel = localStorage.getItem('weathergpt_selected_model') || 'gemini';
    }
  }

  setModel(model) {
    this.selectedModel = model;
    if (typeof window !== 'undefined') {
      localStorage.setItem('weathergpt_selected_model', model);
    }
  }

  getModel() {
    return this.selectedModel;
  }

  saveKeys({ hfKey, geminiKey, openaiKey, llamaKey, openWeatherKey, model }) {
    if (typeof window !== 'undefined') {
      if (hfKey !== undefined) {
        this.hfApiKey = hfKey;
        localStorage.setItem('weathergpt_hf_key', hfKey);
      }
      if (geminiKey !== undefined) {
        this.geminiApiKey = geminiKey;
        localStorage.setItem('weathergpt_gemini_key', geminiKey);
      }
      if (openaiKey !== undefined) {
        this.openaiApiKey = openaiKey;
        localStorage.setItem('weathergpt_openai_key', openaiKey);
      }
      if (llamaKey !== undefined) {
        this.llamaApiKey = llamaKey;
        localStorage.setItem('weathergpt_llama_key', llamaKey);
      }
      if (openWeatherKey !== undefined) {
        this.openWeatherApiKey = openWeatherKey;
        localStorage.setItem('weathergpt_openweather_key', openWeatherKey);
      }
      if (model !== undefined) {
        this.selectedModel = model;
        localStorage.setItem('weathergpt_selected_model', model);
      }
    }
  }

  // Active OpenAI GPT-4o inference engine
  async callOpenAI({ prompt, systemPrompt }) {
    if (!this.openaiApiKey) throw new Error('No OpenAI API key provided');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 800,
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI request failed (${res.status})`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content;
  }

  // Active OpenAI GPT-4o Vision inference engine
  async callOpenAIVision({ prompt, systemPrompt, imageBase64, mimeType = 'image/jpeg' }) {
    if (!this.openaiApiKey) throw new Error('No OpenAI API key provided');
    const dataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt || 'Analyze this weather/sky/cloud/crop image in detail with meteorological explanation.' },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ],
        max_tokens: 1000,
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI Vision failed (${res.status})`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content;
  }

  // Active Google Gemini 2.0 / 1.5 Flash inference engine (Best #1 LLM)
  async callGemini({ prompt, systemPrompt }) {
    if (!this.geminiApiKey) throw new Error('No Gemini API key provided');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini request failed (${res.status})`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  // Active Google Gemini 2.0 / 1.5 Flash Multimodal Vision Engine
  async callGeminiVision({ prompt, systemPrompt, imageBase64, mimeType = 'image/jpeg' }) {
    if (!this.geminiApiKey) throw new Error('No Gemini API key provided');
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUser Question/Instruction: ${prompt || 'Analyze this meteorological image (cloud formation, rain intensity, sky conditions, crop moisture, or flood status) and provide clear advisory.'}` },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini Vision request failed (${res.status})`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  // Active Meta Llama 3.3 70B inference engine (via Groq / OpenRouter)
  async callLlama({ prompt, systemPrompt }) {
    if (!this.llamaApiKey) throw new Error('No Llama/Groq API key provided');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.llamaApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 800,
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Llama request failed (${res.status})`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content;
  }

  // Parse location and intent from conversational query
  extractQueryContext(query, currentLocation) {
    const qLower = query.toLowerCase();

    // Persona / Domain intent
    let domain = 'general';
    let isRainInquiry = false;

    if (
      qLower.includes('rain') ||
      qLower.includes('drizzle') ||
      qLower.includes('shower') ||
      qLower.includes('precipitation') ||
      qLower.includes('மழை') ||
      qLower.includes('mazhai') ||
      qLower.includes('mazha') ||
      qLower.includes('malai') ||
      qLower.includes('varuma') ||
      qLower.includes('peyyuma') ||
      qLower.includes('peiyuma') ||
      qLower.includes('peyyum') ||
      qLower.includes('peiyum') ||
      qLower.includes('irukkuma') ||
      qLower.includes('kudai') ||
      qLower.includes('umbrella') ||
      qLower.includes('raincoat') ||
      qLower.includes('மழை வருமா') ||
      qLower.includes('बारिश') ||
      qLower.includes('वर्षा') ||
      qLower.includes('వర్షం') ||
      qLower.includes('বৃষ্টি') ||
      qLower.includes('पाऊस') ||
      qLower.includes('વરસાદ') ||
      qLower.includes('ಮಳೆ') ||
      qLower.includes('മഴ') ||
      qLower.includes('ਮੀਂਹ')
    ) {
      isRainInquiry = true;
    }

    if (
      qLower.includes('crop') ||
      qLower.includes('farm') ||
      qLower.includes('soil') ||
      qLower.includes('spray') ||
      qLower.includes('irrigation') ||
      qLower.includes('paddy') ||
      qLower.includes('விவசாயம்') ||
      qLower.includes('பயிர்') ||
      qLower.includes('vivasaayam') ||
      qLower.includes('vivasayam') ||
      qLower.includes('vidhai') ||
      qLower.includes('vitha') ||
      qLower.includes('payir') ||
      qLower.includes('फसल') ||
      qLower.includes('किसान')
    ) {
      domain = 'agriculture';
    } else if (
      qLower.includes('flight') ||
      qLower.includes('aviation') ||
      qLower.includes('metar') ||
      qLower.includes('taf') ||
      qLower.includes('pilot') ||
      qLower.includes('ceiling') ||
      qLower.includes('turbulence') ||
      qLower.includes('விமானம்') ||
      qLower.includes('vimanam')
    ) {
      domain = 'aviation';
    } else if (
      qLower.includes('sea') ||
      qLower.includes('marine') ||
      qLower.includes('wave') ||
      qLower.includes('fish') ||
      qLower.includes('tide') ||
      qLower.includes('boat') ||
      qLower.includes('மீனவர்') ||
      qLower.includes('கடல்') ||
      qLower.includes('meenavar') ||
      qLower.includes('kadal') ||
      qLower.includes('मछुआर')
    ) {
      domain = 'marine';
    } else if (
      qLower.includes('aqi') ||
      qLower.includes('pollution') ||
      qLower.includes('smog') ||
      qLower.includes('air quality') ||
      qLower.includes('காற்று தரம்') ||
      qLower.includes('kaatru') ||
      qLower.includes('वायु गुणवत्ता')
    ) {
      domain = 'air_quality';
    } else if (
      qLower.includes('alert') ||
      qLower.includes('warning') ||
      qLower.includes('cyclone') ||
      qLower.includes('flood') ||
      qLower.includes('storm') ||
      qLower.includes('எச்சரிக்கை') ||
      qLower.includes('புயல்') ||
      qLower.includes('puyal') ||
      qLower.includes('चेतावनी')
    ) {
      domain = 'disaster_alert';
    } else if (
      qLower.includes('climate') ||
      qLower.includes('trend') ||
      qLower.includes('historical') ||
      qLower.includes('decade') ||
      qLower.includes('change') ||
      qLower.includes('ஆண்டு') ||
      qLower.includes('வரலாறு')
    ) {
      domain = 'climate_trends';
    }

    // Days / Timeframe
    let timeframe = 'current';
    if (
      qLower.includes('now') ||
      qLower.includes('இப்போது') ||
      qLower.includes('இப்போ') ||
      qLower.includes('ippo') ||
      qLower.includes('அடுத்த 10') ||
      qLower.includes('10 min') ||
      qLower.includes('अभी')
    ) {
      timeframe = 'now';
    } else if (
      qLower.includes('tomorrow') ||
      qLower.includes('நாளை') ||
      qLower.includes('naalai') ||
      qLower.includes('nalaiku') ||
      qLower.includes('naalaikku') ||
      qLower.includes('कल')
    ) {
      timeframe = 'tomorrow';
    } else if (
      qLower.includes('48 hour') ||
      qLower.includes('2 day') ||
      qLower.includes('அடுத்த 2 நாள்')
    ) {
      timeframe = '48h';
    } else if (
      qLower.includes('week') ||
      qLower.includes('7 day') ||
      qLower.includes('வாரம்') ||
      qLower.includes('सप्ताह')
    ) {
      timeframe = '7days';
    }

    return { domain, timeframe, isRainInquiry };
  }

  // Find location mentions or fallback to current selected location
  async resolveLocationFromQuery(query, fallbackLocation) {
    // 1. Check known Tamil & Tanglish city patterns first
    const knownCity = resolveTamilAndTanglishCityName(query);
    if (knownCity) {
      const results = await searchLocation(knownCity);
      if (results && results.length > 0) {
        return results[0];
      }
    }

    const words = query.split(/[\s,?.!]+/);
    const stopWords = new Set([
      'what', 'is', 'the', 'weather', 'in', 'at', 'for', 'will', 'it', 'rain',
      'tomorrow', 'today', 'how', 'like', 'a', 'an', 'and', 'or', 'show', 'me',
      'tell', 'forecast', 'report', 'of', 'naalai', 'nalaiku', 'naalaikku', 'mazhai', 'malai', 'mazha', 'epdi', 'irukku', 'erukku',
      'iruku', 'eruku', 'irukka', 'eruka', 'la', 'le', 'kku', 'ku', 'kya', 'hoga', 'mein', 'ko', 'varuma', 'irukkuma', 'pls', 'please', 'check',
      'status', 'chance', 'details', 'peyyuma', 'peiyuma', 'peyyum', 'peiyum', 'kudutha', 'sollu', 'sollunga', 'solunga', 'kudu',
      'kudai', 'umbrella', 'thevaya', 'theva', 'eduthuttu', 'pogalama', 'pogalaama', 'vaikalam', 'vacha', 'pannu', 'pannalam'
    ]);

    // Look for preposition clues like "in Chennai", "at Delhi", "for Mumbai"
    let candidateLocation = null;
    for (let i = 0; i < words.length; i++) {
      const w = words[i].toLowerCase();
      if ((w === 'in' || w === 'at' || w === 'for' || w === 'near' || w === 'around') && i + 1 < words.length) {
        const potential = words.slice(i + 1, i + 3).join(' ').replace(/[^\w\s]/gi, '');
        if (potential && !stopWords.has(potential.toLowerCase())) {
          candidateLocation = potential;
          break;
        }
      }
    }

    // Try finding named entity if candidate found
    if (candidateLocation) {
      const results = await searchLocation(candidateLocation);
      if (results && results.length > 0) {
        return results[0];
      }
    }

    // Fallback: check all individual non-stop words
    for (const word of words) {
      if (word.length > 2 && !stopWords.has(word.toLowerCase())) {
        const results = await searchLocation(word);
        if (results && results.length > 0) {
          return results[0];
        }
      }
    }

    return fallbackLocation;
  }

  // Client-side Visual Meteorological Diagnostic Engine (Canvas-based pixel analysis)
  async analyzeImageTelemetry(imageDataUrl) {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !imageDataUrl) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const width = 120;
          const height = Math.round((img.height / img.width) * 120) || 120;
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          let totalLuminance = 0;
          let skyBluePixels = 0;
          let grayCloudPixels = 0;
          let darkStormPixels = 0;
          let warmSunsetPixels = 0;
          let greenVegetationPixels = 0;
          const pixelCount = data.length / 4;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLuminance += lum;

            // Sky Blue
            if (b > r + 15 && b > g + 8 && lum > 70) {
              skyBluePixels++;
            }
            // Gray/White Clouds
            const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            if (maxDiff < 25 && lum > 80) {
              grayCloudPixels++;
            }
            // Dark Storm Clouds
            if (lum < 75 && maxDiff < 35) {
              darkStormPixels++;
            }
            // Warm Sunset/Sunrise
            if (r > b + 40 && r > 110) {
              warmSunsetPixels++;
            }
            // Vegetation/Crop Green
            if (g > r + 12 && g > b + 12) {
              greenVegetationPixels++;
            }
          }

          const avgLum = Math.round(totalLuminance / pixelCount);
          const blueRatio = Math.round((skyBluePixels / pixelCount) * 100);
          const cloudRatio = Math.round((grayCloudPixels / pixelCount) * 100);
          const stormRatio = Math.round((darkStormPixels / pixelCount) * 100);
          const sunsetRatio = Math.round((warmSunsetPixels / pixelCount) * 100);
          const greenRatio = Math.round((greenVegetationPixels / pixelCount) * 100);

          let classification = 'Partly Cloudy Sky';
          let cloudType = 'Cumulus / Altocumulus';
          let visualRainRisk = 15;
          let visualAdvisoryEn = 'Normal ambient conditions. Suitable for daily activities and travel.';
          let visualAdvisoryTa = 'இயல்பான வெளிப்புற சூழல். அன்றாட பணிகளுக்கு ஏற்றது.';

          if (stormRatio > 35 || (cloudRatio > 40 && avgLum < 85)) {
            classification = 'Dense Storm & Rain Cloud Mass';
            cloudType = 'Cumulonimbus / Nimbostratus (கார்மேகம் / மழை மேகம்)';
            visualRainRisk = Math.min(95, 60 + Math.round(stormRatio * 0.8));
            visualAdvisoryEn = 'High probability of imminent precipitation or thunderstorm. Carry rain gear and stay clear of waterlogging.';
            visualAdvisoryTa = 'கனமழை அல்லது இடியுடன் கூடிய மழைக்கு அதிக வாய்ப்பு உள்ளது. குடை/ரெயின்கோட் எடுத்துச்செல்லவும்.';
          } else if (cloudRatio > 45) {
            classification = 'Overcast & Low Cloud Ceiling';
            cloudType = 'Stratocumulus / Stratus (மந்தாரமான மேகம்)';
            visualRainRisk = 45;
            visualAdvisoryEn = 'Overcast sky with light showers or drizzle probability. Sun exposure is low.';
            visualAdvisoryTa = 'மந்தாரமான வானிலை. லேசான தூறல் பெய்ய வாய்ப்பு உண்டு.';
          } else if (sunsetRatio > 25) {
            classification = 'Twilight / Golden Hour Horizon';
            cloudType = 'Cirrus / Atmospheric Scattering (அந்தி மாலை / விடியல்)';
            visualRainRisk = 10;
            visualAdvisoryEn = 'Stable atmospheric scattering during twilight. Clear conditions expected through the evening.';
            visualAdvisoryTa = 'அந்தி மாலை ஒளிச்சிதறல். மாலை வேளையில் தெளிவான வானிலை நிலவும்.';
          } else if (greenRatio > 30) {
            classification = 'Agricultural Field & Crop Canopy';
            cloudType = 'Farmland Observation (பயிர் / விவசாய நிலம்)';
            visualRainRisk = 20;
            visualAdvisoryEn = 'Vegetation canopy detected. Ground moisture levels appear supportive for active farming.';
            visualAdvisoryTa = 'பயிர்கள் மற்றும் விளைநிலம் கண்டறியப்பட்டுள்ளது. தற்போதைய ஈரப்பதம் விவசாய பணிகளுக்கு உகந்தது.';
          } else if (blueRatio > 40) {
            classification = 'Clear Sunny & Fair Sky';
            cloudType = 'Fair Weather Cumulus (தெளிவான வானம்)';
            visualRainRisk = 5;
            visualAdvisoryEn = 'Clear blue sky with abundant solar radiation. Excellent for travel and outdoor operations.';
            visualAdvisoryTa = 'தெளிவான நீல வானம். நேரடி வெயில் இருக்கும், வெளிப்புற பயணங்களுக்கு சிறந்தது.';
          }

          resolve({
            avgLuminance: avgLum,
            blueRatio,
            cloudRatio,
            stormRatio,
            sunsetRatio,
            greenRatio,
            classification,
            cloudType,
            visualRainRisk,
            visualAdvisoryEn,
            visualAdvisoryTa
          });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageDataUrl;
    } catch {
      resolve(null);
    }
  });
}

  // Synthesize Visual Meteorological Intelligence Response
  synthesizeVisionResponse({ query, locName, imageTelemetry, nwpData, aqiData, alerts, lang = 'en' }) {
    const current = nwpData?.current || {};
    const daily = nwpData?.daily || {};
    const temp = current.temperature_2m ?? 28;
    const feels = current.apparent_temperature ?? temp;
    const humidity = current.relative_humidity_2m ?? 70;
    const wind = current.wind_speed_10m ?? 12;
    const groundRainProb = daily?.precipitation_probability_max?.[0] ?? (current.precipitation ? 75 : 10);
    const effectiveRainRisk = imageTelemetry ? Math.max(imageTelemetry.visualRainRisk, groundRainProb) : groundRainProb;
    const topAlert = alerts && alerts.length > 0 ? alerts[0] : null;

    if (lang === 'ta') {
      return (
        `📸 **வானிலை பார்வை & பட ஆய்வு (Weather Vision Report):**\n\n` +
        `• ☁️ **கண்டறியப்பட்ட மேக அமைப்பு:** ${imageTelemetry?.cloudType || 'வளிமண்டல மேகங்கள் (Atmospheric Clouds)'}\n` +
        `• 🔍 **பட நிலை:** ${imageTelemetry?.classification || 'வானிலை பார்வை பகுப்பாய்வு செய்யப்பட்டது'}\n` +
        `• 🌧️ **மழை சாத்தியக்கூறு:** **${effectiveRainRisk}%** (பார்வை ஆய்வு + ரேடார் முன்னறிவிப்பு)\n` +
        `• 📍 **${locName} நேரடி அளவீடு:** வெப்பநிலை: **${temp}°C** (உணர்வு: ${feels}°C) | காற்றின் வேகம்: **${wind} km/h** | ஈரப்பதம்: **${humidity}%**\n` +
        `• 💡 **பரிந்துரை:** ${imageTelemetry?.visualAdvisoryTa || 'வானிலை நிலவரத்தை கவனித்து வெளிப்புற பணிகளை திட்டமிடுங்கள்.'}`
      );
    }

    if (lang === 'tanglish') {
      return (
        `📸 **WeatherGPT Image Vision Analysis:**\n\n` +
        `• ☁️ **Cloud Type & Sky:** ${imageTelemetry?.cloudType || 'Sky / Cloud Pattern'}\n` +
        `• 🔍 **Visual Status:** ${imageTelemetry?.classification || 'Cloud & Atmosphere analyzed'}\n` +
        `• 🌧️ **Rain Chance:** **${effectiveRainRisk}%** (Visual scan + Radar Telemetry)\n` +
        `• 📍 **Current ${locName} Ground Data:** Temp: **${temp}°C** (Feels: ${feels}°C) | Wind: **${wind} km/h** | Humidity: **${humidity}%**\n` +
        `• 💡 **Advisory:** ${imageTelemetry?.visualAdvisoryTa ? (effectiveRainRisk >= 50 ? 'Mazhai vara vaaipu irukku, umbrella eduthuttu ponga.' : 'Climate steady ah irukku, normal ah veliya polam.') : 'Keep track of sky conditions.'}`
      );
    }

    if (lang === 'hi') {
      return (
        `📸 **मौसम दृष्टि विश्लेषण (Weather Vision Report):**\n\n` +
        `• ☁️ **पहचाने गए बादल:** ${imageTelemetry?.cloudType || 'वायुमंडलीय बादल'}\n` +
        `• 🔍 **दृश्य स्थिति:** ${imageTelemetry?.classification || 'आसमान की स्थिति'}\n` +
        `• 🌧️ **बारिश की संभावना:** **${effectiveRainRisk}%** (छवि विश्लेषण + रडार पूर्वानुमान)\n` +
        `• 📍 **${locName} का तापमान:** **${temp}°C** (महसूस: ${feels}°C) | हवा: **${wind} किमी/घंटा** | नमी: **${humidity}%**\n` +
        `• 💡 **सलाह:** ${effectiveRainRisk >= 50 ? 'बारिश की संभावना है, छाता साथ रखें।' : 'मौसम सामान्य रहेगा, यात्रा के लिए अनुकूल है।'}`
      );
    }

    if (lang === 'te') {
      return (
        `📸 **వాతావరణ చిత్ర విశ్లేషణ (Weather Vision Report):**\n\n` +
        `• ☁️ **మేఘాల రకం:** ${imageTelemetry?.cloudType || 'ఆకాశ మేఘాలు'}\n` +
        `• 🔍 **స్థితి:** ${imageTelemetry?.classification || 'వాతావరణ పరిశీలన'}\n` +
        `• 🌧️ **వర్షం అవకాశం:** **${effectiveRainRisk}%**\n` +
        `• 📍 **${locName} ఉష్ణోగ్రత:** **${temp}°C** | గాలి: **${wind} km/h** | తేమ: **${humidity}%**\n` +
        `• 💡 **సలహా:** ${imageTelemetry?.visualAdvisoryEn || 'వాతావరణాన్ని గమనించి ప్రయాణించండి.'}`
      );
    }

    // Default English
    return (
      `📸 **WeatherGPT Multimodal Vision Intelligence Report:**\n\n` +
      `• ☁️ **Detected Cloud System:** ${imageTelemetry?.cloudType || 'Atmospheric Cloud Layer'}\n` +
      `• 🔍 **Visual Sky Assessment:** ${imageTelemetry?.classification || 'Visual Telemetry Analyzed'}\n` +
      `• 🌧️ **Estimated Rain Probability:** **${effectiveRainRisk}%** (Visual Analysis + NWP Radar Blend)\n` +
      `• 📍 **Live Ground Station at ${locName}:** ${temp}°C (Feels like ${feels}°C) | Wind: ${wind} km/h | Humidity: ${humidity}%\n` +
      `• 💡 **Meteorological Advisory:** ${imageTelemetry?.visualAdvisoryEn || 'Normal ambient weather conditions. Plan activities accordingly.'}`
    );
  }

  // Process natural language weather query and return structured response (Supports Text, Voice, & Image Vision)
  async processQuery({ query = '', currentLocation, activeLanguage = 'en', image = null, mimeType = 'image/jpeg' }) {
    try {
      const q = query.trim();
      const effectiveLang = detectLanguageFromQuery(q || 'weather report', activeLanguage);
      const isTanglish = effectiveLang === 'tanglish';
      const targetLangForData = isTanglish ? 'ta' : effectiveLang;

      const { domain, timeframe, isRainInquiry } = this.extractQueryContext(q, currentLocation);
      const targetLocation = await this.resolveLocationFromQuery(q, currentLocation);

      const lat = targetLocation?.latitude || 13.0827;
      const lon = targetLocation?.longitude || 80.2707;
      const rawCity = targetLocation?.rawName || targetLocation?.name || 'Chennai';
      const rawAdmin = targetLocation?.rawAdmin1 || targetLocation?.admin1 || '';
      const rawCountry = targetLocation?.rawCountry || targetLocation?.country || 'India';
      const localizedCity = getLocalizedPlaceName(rawCity, targetLangForData);
      const localizedAdmin = rawAdmin ? getLocalizedPlaceName(rawAdmin, targetLangForData) : '';
      const localizedCountry = getLocalizedPlaceName(rawCountry, targetLangForData);
      const locName = `${localizedCity}${localizedAdmin ? `, ${localizedAdmin}` : ''}, ${localizedCountry}`;

      // Fetch fresh real-time multi-source data
      const [nwpData, aqiData] = await Promise.all([
        fetchNWPForecast(lat, lon),
        fetchAirQuality(lat, lon)
      ]);

      const alerts = evaluateSevereWeatherAlerts(nwpData, aqiData, targetLangForData);
      const agriAdvisory = generateAgriAdvisory(nwpData, targetLangForData);
      const aviationBriefing = generateAviationBriefing(targetLocation?.name || 'Local Station', nwpData, targetLangForData);
      const marineBriefing = generateMarineBriefing(nwpData, targetLangForData);

      let responseText = '';
      let modelUsedLabel = image ? 'Weather Vision Neural Engine' : 'Hybrid Neural RAG';

      const current = nwpData?.current || {};
      const daily = nwpData?.daily || {};
      const rainProb = daily?.precipitation_probability_max?.[0] ?? current.precipitation ?? 0;
      const temp = current.temperature_2m ?? 28;
      const humidity = current.relative_humidity_2m ?? 70;
      const wind = current.wind_speed_10m ?? 12;
      const aqi = aqiData?.current?.us_aqi || 50;

      const ragSystemPrompt = `You are WeatherGPT, an advanced Meteorological Vision AI Assistant.
Location: ${locName}
Current Temperature: ${temp}°C (Feels like: ${current.apparent_temperature || temp}°C)
Humidity: ${humidity}%
Wind Speed: ${wind} km/h (Direction: ${current.wind_direction_10m || 0}°)
Rain Probability: ${rainProb}% | Accumulation: ${daily?.precipitation_sum?.[0] || 0} mm
AQI: ${aqi} (US AQI Standard)
Alert Status: ${alerts[0]?.title || 'Normal Stable Weather'}
Respond in the language matching the user's prompt (Detected: ${effectiveLang}). Explain cloud formations, rain likelihood, and actionable advice clearly.`;

      // 📸 MULTIMODAL IMAGE QUERY HANDLING
      let imageTelemetry = null;
      if (image) {
        imageTelemetry = await this.analyzeImageTelemetry(image);

        if (this.selectedModel === 'gemini' && this.geminiApiKey) {
          try {
            responseText = await this.callGeminiVision({
              prompt: q || 'Analyze this weather/sky/cloud/crop image and give detailed meteorological insights.',
              systemPrompt: ragSystemPrompt,
              imageBase64: image,
              mimeType
            });
            modelUsedLabel = 'Google Gemini 1.5 Flash Vision';
          } catch (e) {
            console.warn('Gemini Vision call failed, falling back to local vision telemetry:', e);
          }
        } else if (this.selectedModel === 'openai' && this.openaiApiKey) {
          try {
            responseText = await this.callOpenAIVision({
              prompt: q || 'Analyze this weather/sky/cloud/crop image and give detailed meteorological insights.',
              systemPrompt: ragSystemPrompt,
              imageBase64: image,
              mimeType
            });
            modelUsedLabel = 'OpenAI GPT-4o Vision';
          } catch (e) {
            console.warn('OpenAI Vision call failed, falling back to local vision telemetry:', e);
          }
        }

        if (!responseText) {
          responseText = this.synthesizeVisionResponse({
            query: q,
            locName,
            imageTelemetry,
            nwpData,
            aqiData,
            alerts,
            lang: effectiveLang
          });
          modelUsedLabel = 'WeatherGPT Vision Telemetry Engine';
        }
      } else {
        // Standard Text / Voice Query Flow
        if (this.selectedModel === 'openai' && this.openaiApiKey) {
          try {
            responseText = await this.callOpenAI({ prompt: q, systemPrompt: ragSystemPrompt });
            modelUsedLabel = 'OpenAI GPT-4o-mini';
          } catch (e) {
            console.warn('OpenAI call failed, falling back to synthesis:', e);
          }
        } else if (this.selectedModel === 'gemini' && this.geminiApiKey) {
          try {
            responseText = await this.callGemini({ prompt: q, systemPrompt: ragSystemPrompt });
            modelUsedLabel = 'Google Gemini 1.5 Flash';
          } catch (e) {
            console.warn('Gemini call failed, falling back to synthesis:', e);
          }
        } else if (this.selectedModel === 'llama' && this.llamaApiKey) {
          try {
            responseText = await this.callLlama({ prompt: q, systemPrompt: ragSystemPrompt });
            modelUsedLabel = 'Meta Llama 3.3 70B';
          } catch (e) {
            console.warn('Llama call failed, falling back to synthesis:', e);
          }
        }

        if (!responseText) {
          responseText = this.synthesizeNaturalLanguageResponse({
            query: q,
            locName,
            domain,
            timeframe,
            isRainInquiry,
            nwpData,
            aqiData,
            alerts,
            agriAdvisory,
            aviationBriefing,
            marineBriefing,
            lang: effectiveLang
          });
          modelUsedLabel = 'Smart Hybrid Neural RAG';
        }
      }

      // Persist session to SQL database table
      dbService.insertChatLog({
        sessionId: `sql_sess_${Date.now()}`,
        sender: 'ai',
        text: responseText,
        detectedLanguage: effectiveLang,
        modelUsed: modelUsedLabel,
        locationName: locName,
        hasImage: !!image
      });

      return {
        text: responseText,
        location: targetLocation,
        domain,
        timeframe,
        detectedLanguage: effectiveLang,
        weatherData: nwpData,
        aqiData,
        alerts,
        agriAdvisory,
        aviationBriefing,
        marineBriefing,
        modelUsed: modelUsedLabel,
        sources: [
          'Open-Meteo High-Resolution NWP (GFS / WRF / ECMWF)',
          'WAQI Global Air Quality Telemetry',
          'RainViewer Real-Time Radar & Satellite GIS Stream'
        ]
      };
    } catch (err) {
      console.error('Weather AI agent error:', err);
      return {
        text: `I encountered an issue fetching live meteorological telemetry: ${err.message}. Please check network or try again.`,
        error: true
      };
    }
  }

  // Multilingual synthesis engine for 10 languages + Tanglish
  synthesizeNaturalLanguageResponse({
    query,
    locName,
    domain,
    timeframe,
    isRainInquiry,
    nwpData,
    aqiData,
    alerts,
    agriAdvisory,
    aviationBriefing,
    marineBriefing,
    lang
  }) {
    const current = nwpData?.current || {};
    const daily = nwpData?.daily || {};
    const effectiveLangForWmo = lang === 'tanglish' ? 'ta' : lang;
    const wmo = getWeatherDescription(current.weather_code || 0, effectiveLangForWmo);
    const temp = current.temperature_2m ?? '--';
    const feels = current.apparent_temperature ?? temp;
    const humidity = current.relative_humidity_2m ?? '--';
    const wind = current.wind_speed_10m ?? '--';
    const rainProb = daily?.precipitation_probability_max?.[0] ?? current.precipitation ?? 0;
    const tomorrowRainProb = daily?.precipitation_probability_max?.[1] ?? 0;
    const tomorrowTempMax = daily?.temperature_2m_max?.[1] ?? '--';
    const aqi = aqiData?.current?.us_aqi || 55;

    // Calculate detailed Rain Verdict & Predicted Timing
    const rainCalc = calculateRainVerdict(nwpData, timeframe);
    const cropSeedAdvisory = generateCropSeedAdvisory(nwpData, lang);

    // Highest alert level
    const topAlert =
      alerts.find((a) => a.level === 'red') ||
      alerts.find((a) => a.level === 'orange') ||
      alerts.find((a) => a.level === 'yellow') ||
      alerts[0];

    // 🌟 Special Language: TANGLISH (Conversational Tamil in English letters)
    if (lang === 'tanglish') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **Mazhai Theerpu: Aam (YES - Mazhai Kandippa Peyyum! 🌧️)**\n\n` +
            `• ⏰ **Kaanikkapatta Neram (Predicted Time):** ${rainCalc.predictedTimingTa}\n` +
            `• 📊 **Mazhai Vaippu:** ${rainCalc.maxProb}% | **Ethirpaarkappadum Alavu:** ~${rainCalc.totalPrecip} mm\n` +
            `• 🌡️ **Tharpodhaya Nilai:** ${wmo.label} (${temp}°C, Feel aaguradhu ${feels}°C)\n` +
            `• 💧 **Eerapatham:** ${humidity}% | **Kaatru Vegam:** ${wind} km/h\n` +
            `• 💡 **Mukkiya Advice:** Veliya kelambura appo kandippa Kudai (Umbrella) allathu Raincoat eduthuttu ponga!`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **Mazhai Theerpu: Vaippu Irukku (MAYBE - Lesana Thooral / Megamootam 🌦️)**\n\n` +
            `• ⏰ **Kaanikkapatta Neram (Predicted Time):** ${rainCalc.predictedTimingTa}\n` +
            `• 📊 **Mazhai Vaippu:** ${rainCalc.maxProb}% | **Ethirpaarkappadum Alavu:** ~${rainCalc.totalPrecip} mm\n` +
            `• 🌡️ **Tharpodhaya Nilai:** ${wmo.label} (${temp}°C, Feel aaguradhu ${feels}°C)\n` +
            `• 💧 **Eerapatham:** ${humidity}% | **Kaatru Vegam:** ${wind} km/h\n` +
            `• 💡 **Advice:** Sila idangalil lesana thooral varalaam. Veli velai irundha pathu thittam pottukonga.`
          );
        } else {
          return (
            `☀️ **Mazhai Theerpu: Illai (NO - Mazhai Peyya Vaippu Illai! ☀️)**\n\n` +
            `• ⏰ **Predicted Time:** Adutha 24 mani nerathil mazhai vaippu illa.\n` +
            `• 📊 **Mazhai Vaippu:** ${rainCalc.maxProb}% (Romba Kuraivu) | **Mazhai Alavu:** 0 mm\n` +
            `• 🌡️ **Tharpodhaya Nilai:** ${wmo.label} (${temp}°C, Feel aaguradhu ${feels}°C)\n` +
            `• 💧 **Eerapatham:** ${humidity}% | **Kaatru Vegam:** ${wind} km/h\n` +
            `• 💡 **Advice:** Mazhai peyya vaippe illa. Thelivana veyil & nalla climate irukum. Unga velaiya thairiyama pannalam!`
          );
        }
      }

      if (domain === 'agriculture' && cropSeedAdvisory) {
        return (
          `🌾 **${locName} - Vivasaya Vidhai & Payir Valikaatti (Farmer Climate Advice):**\n\n` +
          `• 🌡️ **Ippodhaiya Climate:** ${temp}°C | **Eerapatham:** ${humidity}% | **Mann Eerapatham:** ${cropSeedAdvisory.soilMoisturePercent}%\n` +
          `• 🚜 **Vidhaippu Thaguthi (Sowing Status):** ✅ **${cropSeedAdvisory.sowingStatusLabel}**\n\n` +
          `🌱 **Intha Climate-ku Yetha Vidhaigal (Recommended Seeds):**\n` +
          cropSeedAdvisory.recommendedSeeds.map((s, idx) => `  ${idx + 1}. **${s.cropTanglish || s.cropEn}** (${s.variety})\n     *Kaalam:* ${s.duration} | *Yethadhu:* ${s.suitability}\n     *Karanam:* ${s.reasonTanglish || s.reasonEn}`).join('\n\n') +
          `\n\n• 💧 **Paasana Vazhikaattal:** ${agriAdvisory?.irrigationAdvice || 'Mannil nalla eerapatham irukku, thevaikku yetrappa paasanam seyyavum.'}\n` +
          `• 🧪 **Marundhu / Uram Thelippu:** ${agriAdvisory?.sprayCondition === 'Favorable' ? '✅ Nalla neram, thelikkalam' : '⚠️ Mazhai & kaatru irupadhal thelippai thallipodavum.'}\n` +
          `• 🛡️ **${cropSeedAdvisory.pestWarning}**\n` +
          `• 💡 **${cropSeedAdvisory.seedTreatmentTip}**`
        );
      }

      if (domain === 'marine' && marineBriefing) {
        return (
          `🌊 **${locName} Kadal & Meenavar Pathukaappu Arikkai:**\n` +
          `• **Kadal Nilai:** ${marineBriefing.seaState} (Alai Uyarathil: ${marineBriefing.waveHeightM} m)\n` +
          `• **Kaatru Vegam:** ${wind} km/h | **Kadal Veppam:** ${marineBriefing.seaSurfaceTemp}°C\n` +
          `• **Meenavargal Echarikkai:** ${marineBriefing.fishermanAdvisory}\n` +
          `• **Uyar Alai Neram:** ${marineBriefing.tideInfo.nextHighTide}`
        );
      }

      if (domain === 'aviation' && aviationBriefing) {
        return (
          `✈️ **${locName} Vimaana Pokkuvarathu Vaanilai Kurippu (Aviation METAR):**\n` +
          `\`${aviationBriefing.metar}\`\n` +
          `• **Flight Category:** ${aviationBriefing.flightCategory}\n` +
          `• **Paarvai Dhooram (Visibility):** ${aviationBriefing.visibilityKm} km | **Megam Ceiling:** ${aviationBriefing.ceilingFeet} ft\n` +
          `• **Kaatru Vegam:** ${aviationBriefing.windKnots} knots (Direction: ${aviationBriefing.windDirection}°)`
        );
      }

      if (domain === 'air_quality') {
        return (
          `🍃 **${locName} Kaatru Tharam (Air Quality AQI):**\n` +
          `• **AQI Level:** ${aqi} (${aqiData?.current?.dominant_pollutant || 'PM2.5'})\n` +
          `• **Kaatru Soolai:** ${aqi <= 50 ? 'Nalla Kaatru (Good)' : aqi <= 100 ? 'Madhamaana Kaatru (Moderate)' : 'Maasupatta Kaatru (Unhealthy)'}\n` +
          `• **Mukkiya Advice:** ${aqi > 100 ? 'Veliya porappa Mask podunga.' : 'Kaatru nallave irukku, veli velai thairiyama seyyalaam.'}`
        );
      }

      if (timeframe === 'tomorrow') {
        return (
          `☀️ **${locName} - Naalaya Vaanilai Munnarivippu:**\n` +
          `• **Adhigabatcha Veppam:** ${tomorrowTempMax}°C\n` +
          `• **Mazhai Peyya Vaippu:** ${tomorrowRainProb}%\n` +
          `• **Kaatru Vegam:** ${wind} km/h | **Kaatru Tharam (AQI):** ${aqi}\n` +
          `• **Echarikkai Nilai:** ${topAlert?.title || 'Iyalbaana Vaanilai'}`
        );
      }

      return (
        `📍 **${locName} Neralai Vaanilai Thagaval (Live Weather):**\n` +
        `• **Vaanilai Nilai:** ${wmo.label} (${temp}°C, Feel aaguradhu ${feels}°C)\n` +
        `• **Eerapatham:** ${humidity}% | **Kaatru Vegam:** ${wind} km/h\n` +
        `• **Mazhai Vaippu:** ${rainProb}% | **Kaatru Tharam (AQI):** ${aqi}\n` +
        `• **Echarikkai Kurippu:** ${topAlert?.message || 'Vaanilai seeraaga ulladhu.'}`
      );
    }

    // Language 1: TAMIL (தமிழ்)
    if (lang === 'ta') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **மழை வாய்ப்பு தீர்ப்பு: ஆம் (YES - மழை பெய்யும்! 🌧️)**\n\n` +
            `• ⏰ **கணிக்கப்பட்ட நேரம் (Predicted Time):** ${rainCalc.predictedTimingTa}\n` +
            `• 📊 **மழை வாய்ப்பு (Probability):** ${rainCalc.maxProb}% | **எதிர்பார்க்கப்படும் அளவு:** ~${rainCalc.totalPrecip} மி.மீ\n` +
            `• 🌡️ **தற்போதைய நிலை:** ${wmo.label} (${temp}°C, உணரப்படும் வெப்பம் ${feels}°C)\n` +
            `• 💧 **ஈரப்பதம்:** ${humidity}% | **காற்றின் வேகம்:** ${wind} கி.மீ/மணி\n` +
            `• 💡 **முக்கிய ஆலோசனை:** வெளியே செல்லும்போது குடை அல்லது ரெயின்கோட் எடுத்துச் செல்லவும்.`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **மழை வாய்ப்பு தீர்ப்பு: வாய்ப்பு உள்ளது (MAYBE - லேசான தூறல் / மேகமூட்டம் 🌦️)**\n\n` +
            `• ⏰ **கணிக்கப்பட்ட நேரம் (Predicted Time):** ${rainCalc.predictedTimingTa}\n` +
            `• 📊 **மழை வாய்ப்பு (Probability):** ${rainCalc.maxProb}% | **எதிர்பார்க்கப்படும் அளவு:** ~${rainCalc.totalPrecip} மி.மீ\n` +
            `• 🌡️ **தற்போதைய நிலை:** ${wmo.label} (${temp}°C, உணரப்படும் வெப்பம் ${feels}°C)\n` +
            `• 💧 **ஈரப்பதம்:** ${humidity}% | **காற்றின் வேகம்:** ${wind} கி.மீ/மணி\n` +
            `• 💡 **ஆலோசனை:** குறுகிய தூறல் அல்லது லேசான மழைக்கு வாய்ப்பு உள்ளது. வானிலை நிலவரத்தைக் கவனிக்கவும்.`
          );
        } else {
          return (
            `☀️ **மழை வாய்ப்பு தீர்ப்பு: இல்லை (NO - மழை பெய்யாது! ☀️)**\n\n` +
            `• ⏰ **கணிக்கப்பட்ட நேரம் (Predicted Time):** அடுத்த 24 மணி நேரத்தில் மழைக்கான வாய்ப்பு இல்லை\n` +
            `• 📊 **மழை வாய்ப்பு (Probability):** ${rainCalc.maxProb}% (மிகக் குறைவு) | **மழை அளவு:** 0 மி.மீ\n` +
            `• 🌡️ **தற்போதைய நிலை:** ${wmo.label} (${temp}°C, உணரப்படும் வெப்பம் ${feels}°C)\n` +
            `• 💧 **ஈரப்பதம்:** ${humidity}% | **காற்றின் வேகம்:** ${wind} கி.மீ/மணி\n` +
            `• 💡 **ஆலோசனை:** மழை பெய்ய வாய்ப்பில்லை, வறண்ட மற்றும் தெளிவான வானிலை நிலவும். உங்களது பணிகளைத் தடையின்றித் திட்டமிடலாம்.`
          );
        }
      }

      if (domain === 'agriculture' && cropSeedAdvisory) {
        return (
          `🌾 **${locName} - விவசாய விதை & பயிர் வழிகாட்டி (Crop & Seed Advisory):**\n\n` +
          `• 🌡️ **வானிலை நிலை:** ${temp}°C | **ஈரப்பதம்:** ${humidity}% | **மண் ஈரப்பதம்:** ${cropSeedAdvisory.soilMoisturePercent}%\n` +
          `• 🚜 **விதைப்பு தகுதி:** ✅ **${cropSeedAdvisory.sowingStatusLabel}**\n\n` +
          `🌱 **இந்த தட்பவெப்பத்திற்கு ஏற்ற உகந்த விதைகள் (Recommended Seeds):**\n` +
          cropSeedAdvisory.recommendedSeeds.map((s, idx) => `  ${idx + 1}. **${s.cropTa}** (${s.variety})\n     *பயிர் காலம்:* ${s.duration} | *ஏற்புத்திறன்:* ${s.suitability}\n     *காரணம்:* ${s.reasonTa}`).join('\n\n') +
          `\n\n• 💧 **பாசன வழிகாட்டல்:** ${agriAdvisory?.irrigationAdvice || 'மண்ணில் போதுமான ஈரப்பதம் உள்ளது.'}\n` +
          `• 🧪 **உரம் / மருந்து தெளிப்பு:** ${agriAdvisory?.sprayCondition === 'Favorable' ? '✅ சிறந்தது, இன்று தெளிக்கலாம்' : '⚠️ காற்று/மழை காரணமாக ஒத்திவைக்கவும்.'}\n` +
          `• 🛡️ **${cropSeedAdvisory.pestWarning}**\n` +
          `• 💡 **${cropSeedAdvisory.seedTreatmentTip}**`
        );
      }
      if (domain === 'marine' && marineBriefing) {
        return (
          `🌊 **${locName} கடலோர மற்றும் மீனவர் பாதுகாப்பு அறிக்கை:**\n` +
          `• **கடல் நிலை:** ${marineBriefing.seaState} (அலை உயரம்: ${marineBriefing.waveHeightM} மீ)\n` +
          `• **காற்றின் வேகம்:** ${wind} கி.மீ/மணி | **கடல் பரப்பு வெப்பம்:** ${marineBriefing.seaSurfaceTemp}°C\n` +
          `• **மீனவர்களுக்கான எச்சரிக்கை:** ${marineBriefing.fishermanAdvisory}\n` +
          `• **அலை நேரங்கள்:** உயர் அலை: ${marineBriefing.tideInfo.nextHighTide}.`
        );
      }
      if (domain === 'aviation' && aviationBriefing) {
        return (
          `✈️ **${locName} விமானப் போக்குவரத்து வானிலை குறிப்பு (METAR/TAF):**\n` +
          `\`${aviationBriefing.metar}\`\n` +
          `• **விமான வகை:** ${aviationBriefing.flightCategory}\n` +
          `• **பார்வை தூரம்:** ${aviationBriefing.visibilityKm} கி.மீ | **மேக தளம்:** ${aviationBriefing.ceilingFeet} அடி\n` +
          `• **காற்று வேகம்:** ${aviationBriefing.windKnots} முடிச்சுகள் (திசை: ${aviationBriefing.windDirection}°)`
        );
      }
      if (timeframe === 'tomorrow') {
        return (
          `☀️ **${locName} - நாளைய வானிலை முன்னறிவிப்பு:**\n` +
          `• **அதிகபட்ச வெப்பநிலை:** ${tomorrowTempMax}°C\n` +
          `• **மழை பெய்வதற்கான வாய்ப்பு:** ${tomorrowRainProb}%\n` +
          `• **காற்றின் வேகம்:** ${wind} கி.மீ/மணி | **காற்று தரம் (AQI):** ${aqi}\n` +
          `• **வானிலை எச்சரிக்கை நிலை:** ${topAlert?.title || 'இயல்பு'}`
        );
      }
      return (
        `📍 **${locName} நேரலை வானிலை தகவல்:**\n` +
        `• **வானிலை நிலை:** ${wmo.label} (${temp}°C, உணரப்படும் வெப்பம் ${feels}°C)\n` +
        `• **ஈரப்பதம்:** ${humidity}% | **காற்றின் வேகம்:** ${wind} கி.மீ/மணி\n` +
        `• **மழை வாய்ப்பு:** ${rainProb}% | **காற்று தரம் (AQI):** ${aqi}\n` +
        `• **எச்சரிக்கை குறிப்பு:** ${topAlert?.message || 'வானிலை சீராக உள்ளது.'}`
      );
    }

    // Language 2: HINDI (हिन्दी)
    if (lang === 'hi') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **वर्षा पूर्वानुमान: हाँ (YES - बारिश होगी! 🌧️)**\n\n` +
            `• ⏰ **अनुमानित समय (Predicted Timing):** ${rainCalc.predictedTimingEn}${rainCalc.peakHourEn ? ` (अधिकतम: ${rainCalc.peakHourEn})` : ''}\n` +
            `• 📊 **बारिश की संभावना:** ${rainCalc.maxProb}% | **अनुमानित वर्षा:** ~${rainCalc.totalPrecip} मिमी\n` +
            `• 🌡️ **वर्तमान मौसम:** ${wmo.label} (${temp}°C, महसूस: ${feels}°C)\n` +
            `• 💧 **आर्द्रता:** ${humidity}% | **हवा की गति:** ${wind} किमी/घंटा\n` +
            `• 💡 **सलाह:** बाहर निकलते समय छाता या रेनकोट साथ रखें।`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **वर्षा पूर्वानुमान: संभावना है (MAYBE - हल्की बूंदाबांदी संभव 🌦️)**\n\n` +
            `• ⏰ **अनुमानित समय (Predicted Timing):** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **बारिश की संभावना:** ${rainCalc.maxProb}% | **अनुमानित वर्षा:** ~${rainCalc.totalPrecip} मिमी\n` +
            `• 🌡️ **वर्तमान मौसम:** ${wmo.label} (${temp}°C, महसूस: ${feels}°C)\n` +
            `• 💧 **आर्द्रता:** ${humidity}% | **हवा की गति:** ${wind} किमी/घंटा\n` +
            `• 💡 **सलाह:** कुछ समय के लिए हल्की बारिश या बूंदाबांदी हो सकती है।`
          );
        } else {
          return (
            `☀️ **वर्षा पूर्वानुमान: नहीं (NO - बारिश की संभावना नहीं है! ☀️)**\n\n` +
            `• ⏰ **अनुमानित समय (Predicted Timing):** अगले 24 घंटों में बारिश का कोई अनुमान नहीं है।\n` +
            `• 📊 **बारिश की संभावना:** ${rainCalc.maxProb}% (नगण्य) | **वर्षा मात्रा:** 0 मिमी\n` +
            `• 🌡️ **वर्तमान मौसम:** ${wmo.label} (${temp}°C, महसूस: ${feels}°C)\n` +
            `• 💧 **आर्द्रता:** ${humidity}% | **हवा की गति:** ${wind} किमी/घंटा\n` +
            `• 💡 **सलाह:** मौसम साफ और शुष्क रहेगा, आप अपनी बाहरी योजनाएं बना सकते हैं।`
          );
        }
      }
      if (domain === 'agriculture' && agriAdvisory) {
        return (
          `🌾 **${locName} हेतु कृषि एवं मौसम परामर्श:**\n` +
          `• **वर्तमान तापमान:** ${temp}°C | **नमी:** ${humidity}%\n` +
          `• **मिट्टी की नमी:** ${agriAdvisory.soilMoisturePercent}% (मिट्टी का तापमान: ${agriAdvisory.soilTemperature}°C)\n` +
          `• **छिड़काव अनुकूलता:** ${agriAdvisory.sprayCondition === 'Favorable' ? '✅ अनुकूल' : '⚠️ टालें'}\n` +
          `• **सिंचाई सलाह:** ${agriAdvisory.irrigationAdvice}`
        );
      }
      if (domain === 'marine' && marineBriefing) {
        return (
          `🌊 **${locName} समुद्री एवं मछुआरा सुरक्षा रिपोर्ट:**\n` +
          `• **समुद्र की स्थिति:** ${marineBriefing.seaState} (लहरों की ऊंचाई: ${marineBriefing.waveHeightM} मी)\n` +
          `• **हवा की गति:** ${wind} किमी/घंटा | **सतह तापमान:** ${marineBriefing.seaSurfaceTemp}°C\n` +
          `• **मछुआरों के लिए सलाह:** ${marineBriefing.fishermanAdvisory}`
        );
      }
      if (timeframe === 'tomorrow') {
        return (
          `☀️ **${locName} - कल का मौसम पूर्वानुमान:**\n` +
          `• **अधिकतम तापमान:** ${tomorrowTempMax}°C\n` +
          `• **बारिश की संभावना:** ${tomorrowRainProb}%\n` +
          `• **वायु गुणवत्ता सूचकांक (AQI):** ${aqi}\n` +
          `• **सतर्कता स्तर:** ${topAlert?.title || 'सामान्य'}`
        );
      }
      return (
        `📍 **${locName} का लाइव मौसम विवरण:**\n` +
        `• **मौसम:** ${wmo.label} (${temp}°C, महसूस: ${feels}°C)\n` +
        `• **आर्द्रता:** ${humidity}% | **हवा की गति:** ${wind} किमी/घंटा\n` +
        `• **वर्षा की संभावना:** ${rainProb}% | **वायु गुणवत्ता (AQI):** ${aqi}\n` +
        `• **आपदा/मौसम अलर्ट:** ${topAlert?.message || 'मौसम अनुकूल है।'}`
      );
    }

    // Language 3: TELUGU (తెలుగు)
    if (lang === 'te') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **వర్ష సూచన తీర్పు: అవును (YES - వర్షం పడే అవకాశం ఉంది! 🌧️)**\n\n` +
            `• ⏰ **అంచనా సమయం (Predicted Time):** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **వర్షం అవకాశం:** ${rainCalc.maxProb}% | **అంచనా వర్షపాతం:** ~${rainCalc.totalPrecip} మి.మీ\n` +
            `• 🌡️ **ప్రస్తుత ఉష్ణోగ్రత:** ${wmo.label} (${temp}°C, అనిపించేది ${feels}°C)\n` +
            `• 💧 **తేమ:** ${humidity}% | **గాలి వేగం:** ${wind} కి.మీ/గం\n` +
            `• 💡 **సలహా:** బయటకు వెళ్లేటప్పుడు గొడుగు వెంట ఉంచుకోండి.`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **వర్ష సూచన తీర్పు: అవకాశం ఉంది (MAYBE - తేలికపాటి జల్లులు 🌦️)**\n\n` +
            `• ⏰ **అంచనా సమయం (Predicted Time):** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **వర్షం అవకాశం:** ${rainCalc.maxProb}% | **అంచనా వర్షపాతం:** ~${rainCalc.totalPrecip} మి.మీ\n` +
            `• 🌡️ **ప్రస్తుత స్థితి:** ${wmo.label} (${temp}°C, అనిపించేది ${feels}°C)\n` +
            `• 💧 **తేమ:** ${humidity}% | **గాలి వేగం:** ${wind} కి.మీ/గం\n` +
            `• 💡 **సలహా:** స్వల్ప జల్లులు పడే అవకాశం ఉంది.`
          );
        } else {
          return (
            `☀️ **వర్ష సూచన తీర్పు: లేదు (NO - వర్షం లేదు! ☀️)**\n\n` +
            `• ⏰ **అంచనా సమయం (Predicted Time):** వచ్చే 24 గంటల్లో వర్షం అవకాశం లేదు.\n` +
            `• 📊 **వర్షం అవకాశం:** ${rainCalc.maxProb}% (చాలా తక్కువ) | **వర్షపాతం:** 0 మి.మీ\n` +
            `• 🌡️ **ప్రస్తుత స్థితి:** ${wmo.label} (${temp}°C, అనిపించేది ${feels}°C)\n` +
            `• 💧 **తేమ:** ${humidity}% | **గాలి వేగం:** ${wind} కి.మీ/గం\n` +
            `• 💡 **సలహా:** వాతావరణం పొడిగా మరియు నిర్మలంగా ఉంటుంది.`
          );
        }
      }
      if (domain === 'agriculture' && agriAdvisory) {
        return (
          `🌾 **${locName} వ్యవసాయ మరియు పంట సలహా:**\n` +
          `• **ఉష్ణోగ్రత:** ${temp}°C | **తేమ:** ${humidity}%\n` +
          `• **నేల తేమ:** ${agriAdvisory.soilMoisturePercent}% (నేల ఉష్ణోగ్రత: ${agriAdvisory.soilTemperature}°C)\n` +
          `• **మందుల పిచికారీ:** ${agriAdvisory.sprayCondition === 'Favorable' ? '✅ అనుకూలం' : '⚠️ వాయిదా వేయండి'}\n` +
          `• **సాగునీటి సలహా:** ${agriAdvisory.irrigationAdvice}`
        );
      }
      if (domain === 'marine' && marineBriefing) {
        return (
          `🌊 **${locName} సముద్ర మరియు మత్స్యకారుల రక్షణ నివేదిక:**\n` +
          `• **సముద్ర స్థితి:** ${marineBriefing.seaState} (అలల ఎత్తు: ${marineBriefing.waveHeightM} మీ)\n` +
          `• **గాలి వేగం:** ${wind} కి.మీ/గం | **ఉపరితల ఉష్ణోగ్రత:** ${marineBriefing.seaSurfaceTemp}°C\n` +
          `• **మత్స్యకారుల హెచ్చరిక:** ${marineBriefing.fishermanAdvisory}`
        );
      }
      if (timeframe === 'tomorrow') {
        return (
          `☀️ **${locName} - రేపటి వాతావరణ సమాచారం:**\n` +
          `• **గరిష్ట ఉష్ణోగ్రత:** ${tomorrowTempMax}°C\n` +
          `• **వర్షం అవకాశం:** ${tomorrowRainProb}%\n` +
          `• **గాలి నాణ్యత (AQI):** ${aqi}\n` +
          `• **హెచ్చరిక:** ${topAlert?.title || 'సాధారణం'}`
        );
      }
      return (
        `📍 **${locName} తాజా వాతావరణ సమాచారం:**\n` +
        `• **స్థితి:** ${wmo.label} (${temp}°C, అనిపించేది: ${feels}°C)\n` +
        `• **తేమ:** ${humidity}% | **గాలి వేగం:** ${wind} కి.మీ/గం\n` +
        `• **వర్షం అవకాశం:** ${rainProb}% | **గాలి నాణ్యత (AQI):** ${aqi}\n` +
        `• **హెచ్చరిక:** ${topAlert?.message || 'వాతావరణం అనుకూలంగా ఉంది.'}`
      );
    }

    // Language 4: MALAYALAM (മലയാളം)
    if (lang === 'ml') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **മഴ പ്രവചനം: ഉണ്ട് (YES - മഴയ്ക്ക് സാധ്യതയുണ്ട്! 🌧️)**\n\n` +
            `• ⏰ **പ്രതീക്ഷിക്കുന്ന സമയം:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **മഴ സാധ്യത:** ${rainCalc.maxProb}% | **പ്രതീക്ഷിക്കുന്ന മഴ:** ~${rainCalc.totalPrecip} മി.മീ\n` +
            `• 🌡️ **നിലവിലെ അന്തരീക്ഷം:** ${wmo.label} (${temp}°C, അനുഭവപ്പെടുന്നത് ${feels}°C)\n` +
            `• 💧 **ഈർപ്പം:** ${humidity}% | **കാറ്റിന്റെ വേഗത:** ${wind} കി.മീ/മണിക്കൂർ\n` +
            `• 💡 **നിർദ്ദേശം:** പുറത്തിറങ്ങുമ്പോൾ കുടയോ റെയിൻകോട്ടോ കരുതുക.`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **മഴ പ്രവചനം: സാധ്യതയുണ്ട് (MAYBE - നേരിയ ചാറ്റൽ മഴ 🌦️)**\n\n` +
            `• ⏰ **പ്രതീക്ഷിക്കുന്ന സമയം:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **മഴ സാധ്യത:** ${rainCalc.maxProb}% | **പ്രതീക്ഷിക്കുന്ന മഴ:** ~${rainCalc.totalPrecip} മി.മീ\n` +
            `• 🌡️ **നിലവിലെ അന്തരീക്ഷം:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **നിർദ്ദേശം:** നേരിയ മഴയ്ക്ക് സാധ്യതയുണ്ട്.`
          );
        } else {
          return (
            `☀️ **മഴ പ്രവചനം: ഇല്ല (NO - മഴയ്ക്ക് സാധ്യതയില്ല! ☀️)**\n\n` +
            `• ⏰ **പ്രതീക്ഷിക്കുന്ന സമയം:** അടുത്ത 24 മണിക്കൂറിൽ മഴയ്ക്ക് സാധ്യതയില്ല.\n` +
            `• 📊 **മഴ സാധ്യത:** ${rainCalc.maxProb}% | **മഴ അളവ്:** 0 മി.മീ\n` +
            `• 🌡️ **നിലവിലെ അന്തരീക്ഷം:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **നിർദ്ദേശം:** വരണ്ട കാലാവസ്ഥയായിരിക്കും.`
          );
        }
      }
      return (
        `📍 **${locName} തത്സമയ കാലാവസ്ഥ വിവരങ്ങൾ:**\n` +
        `• **അവസ്ഥ:** ${wmo.label} (${temp}°C, അനുഭവപ്പെടുന്നത് ${feels}°C)\n` +
        `• **ഈർപ്പം:** ${humidity}% | **കാറ്റിന്റെ വേഗത:** ${wind} കി.മീ/മണിക്കൂർ\n` +
        `• **മഴ സാധ്യത:** ${rainProb}% | **വായു ഗുണനിലവാരം (AQI):** ${aqi}\n` +
        `• **മുന്നറിയിപ്പ്:** ${topAlert?.message || 'കാലാവസ്ഥ അനുകൂലമാണ്.'}`
      );
    }

    // Language 5: KANNADA (ಕನ್ನಡ)
    if (lang === 'kn') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **ಮಳೆಯ ಮುನ್ಸೂಚನೆ: ಹೌದು (YES - ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆ ಇದೆ! 🌧️)**\n\n` +
            `• ⏰ **ಅಂದಾಜು ಸಮಯ:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **ಮಳೆಯ ಸಂಭವನೀಯತೆ:** ${rainCalc.maxProb}% | **ಅಂದಾಜು ಮಳೆ:** ~${rainCalc.totalPrecip} ಮಿ.ಮೀ\n` +
            `• 🌡️ **ಪ್ರಸ್ತುತ ಹವಾಮಾನ:** ${wmo.label} (${temp}°C, ಅನುಭವ: ${feels}°C)\n` +
            `• 💧 **ಆರ್ದ್ರತೆ:** ${humidity}% | **ಗಾಳಿಯ ವೇಗ:** ${wind} ಕಿ.ಮೀ/ಗಂಟೆ\n` +
            `• 💡 **ಸಲಹೆ:** ಹೊರಡುವಾಗ ಛತ್ರಿ ಅಥವಾ ರೇನ್‌ಕೋಟ್ ಜೊತೆಯಲ್ಲಿಡಿ.`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **ಮಳೆಯ ಮುನ್ಸೂಚನೆ: ಸಾಧ್ಯತೆ ಇದೆ (MAYBE - ಹಗುರ ತುಂತುರು ಮಳೆ 🌦️)**\n\n` +
            `• ⏰ **ಅಂದಾಜು ಸಮಯ:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **ಮಳೆಯ ಸಂಭವನೀಯತೆ:** ${rainCalc.maxProb}% | **ಅಂದಾಜು ಮಳೆ:** ~${rainCalc.totalPrecip} ಮಿ.ಮೀ\n` +
            `• 🌡️ **ಪ್ರಸ್ತುತ ಹವಾಮಾನ:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **ಸಲಹೆ:** ಹಗುರ ತುಂತುರು ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆ ಇದೆ.`
          );
        } else {
          return (
            `☀️ **ಮಳೆಯ ಮುನ್ಸೂಚನೆ: ಇಲ್ಲ (NO - ಮಳೆಯ ಸಾಧ್ಯತೆ ಇಲ್ಲ! ☀️)**\n\n` +
            `• ⏰ **ಅಂದಾಜು ಸಮಯ:** ಮುಂದಿನ 24 ಗಂಟೆಗಳಲ್ಲಿ ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆ ಇಲ್ಲ.\n` +
            `• 📊 **ಮಳೆಯ ಸಂಭವನೀಯತೆ:** ${rainCalc.maxProb}% | **ಮಳೆ ಪ್ರಮಾಣ:** 0 ಮಿ.ಮೀ\n` +
            `• 🌡️ **ಪ್ರಸ್ತುತ ಹವಾಮಾನ:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **ಸಲಹೆ:** ಹವಾಮಾನ ಒಣಹವೆಯಿಂದ ಕೂಡಿರುತ್ತದೆ.`
          );
        }
      }
      return (
        `📍 **${locName} ನೇರ ಹವಾಮಾನ ಮಾಹಿತಿ:**\n` +
        `• **ಸ್ಥಿತಿ:** ${wmo.label} (${temp}°C, ಅನುಭವ: ${feels}°C)\n` +
        `• **ಆರ್ದ್ರತೆ:** ${humidity}% | **ಗಾಳಿಯ ವೇಗ:** ${wind} ಕಿ.ಮೀ/ಗಂಟೆ\n` +
        `• **ಮಳೆಯ ಸಾಧ್ಯತೆ:** ${rainProb}% | **ವಾಯು ಗುಣಮಟ್ಟ (AQI):** ${aqi}\n` +
        `• **ಎಚ್ಚರಿಕೆ:** ${topAlert?.message || 'ಹವಾಮಾನ ಸ್ಥಿರವಾಗಿದೆ.'}`
      );
    }

    // Language 6: BENGALI (বাংলা)
    if (lang === 'bn') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **বৃষ্টিপাতের পূর্বাভাস: হ্যাঁ (YES - বৃষ্টি হবে! 🌧️)**\n\n` +
            `• ⏰ **সম্ভাব্য সময়:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **বৃষ্টির সম্ভাবনা:** ${rainCalc.maxProb}% | **সম্ভাব্য বৃষ্টিপাত:** ~${rainCalc.totalPrecip} মিমি\n` +
            `• 🌡️ **বর্তমান আবহাওয়া:** ${wmo.label} (${temp}°C, অনুভূতি: ${feels}°C)\n` +
            `• 💧 **আর্দ্রতা:** ${humidity}% | **বাতাসের গতি:** ${wind} কিমি/ঘণ্টা\n` +
            `• 💡 **পরামর্শ:** বাইরে বেরোনোর সময় ছাতা সঙ্গে রাখুন।`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **বৃষ্টিপাতের পূর্বাভাস: সম্ভাবনা আছে (MAYBE - হালকা গুঁড়ি গুঁড়ি বৃষ্টি 🌦️)**\n\n` +
            `• ⏰ **সম্ভাব্য সময়:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **বৃষ্টির সম্ভাবনা:** ${rainCalc.maxProb}% | **সম্ভাব্য বৃষ্টিপাত:** ~${rainCalc.totalPrecip} মিমি\n` +
            `• 🌡️ **বর্তমান আবহাওয়া:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **পরামর্শ:** সাময়িক হালকা বৃষ্টির সম্ভাবনা রয়েছে।`
          );
        } else {
          return (
            `☀️ **বৃষ্টিপাতের পূর্বাভাস: না (NO - বৃষ্টির সম্ভাবনা নেই! ☀️)**\n\n` +
            `• ⏰ **সম্ভাব্য সময়:** আগামী ২৪ ঘণ্টায় বৃষ্টির কোনো সম্ভাবনা নেই।\n` +
            `• 📊 **বৃষ্টির সম্ভাবনা:** ${rainCalc.maxProb}% | **বৃষ্টিপাত:** ০ মিমি\n` +
            `• 🌡️ **বর্তমান আবহাওয়া:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **পরামর্শ:** আবহাওয়া শুষ্ক ও পরিষ্কার থাকবে।`
          );
        }
      }
      return (
        `📍 **${locName} লাইভ আবহাওয়া আপডেট:**\n` +
        `• **অবস্থা:** ${wmo.label} (${temp}°C, অনুভূতি: ${feels}°C)\n` +
        `• **আর্দ্রতা:** ${humidity}% | **বাতাসের গতিবেগ:** ${wind} কিমি/ঘণ্টা\n` +
        `• **বৃষ্টির সম্ভাবনা:** ${rainProb}% | **বায়ুর মান (AQI):** ${aqi}\n` +
        `• **সতর্কতা:** ${topAlert?.message || 'আবহাওয়া স্বাভাবিক রয়েছে।'}`
      );
    }

    // Language 7: MARATHI (मराठी)
    if (lang === 'mr') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **पाऊस अंदाज: होय (YES - पाऊस पडेल! 🌧️)**\n\n` +
            `• ⏰ **अंदाजित वेळ:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **पावसाची शक्यता:** ${rainCalc.maxProb}% | **अंदाजित पाऊस:** ~${rainCalc.totalPrecip} मिमी\n` +
            `• 🌡️ **सध्याचे तापमान:** ${wmo.label} (${temp}°C, जाणवणारे: ${feels}°C)\n` +
            `• 💧 **आर्द्रता:** ${humidity}% | **वाऱ्याचा वेग:** ${wind} किमी/तास\n` +
            `• 💡 **सल्ला:** बाहेर पडताना छत्री किंवा रेनकोट सोबत ठेवा.`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **पाऊस अंदाज: शक्यता आहे (MAYBE - हलक्या सरी संभव 🌦️)**\n\n` +
            `• ⏰ **अंदाजित वेळ:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **पावसाची शक्यता:** ${rainCalc.maxProb}% | **अंदाजित पाऊस:** ~${rainCalc.totalPrecip} मिमी\n` +
            `• 🌡️ **सध्याचे तापमान:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **सल्ला:** काही वेळ हलका पाऊस पडू शकतो.`
          );
        } else {
          return (
            `☀️ **पाऊस अंदाज: नाही (NO - पाऊस पडणार नाही! ☀️)**\n\n` +
            `• ⏰ **अंदाजित वेळ:** पुढील २४ तासांत पावसाची शक्यता नाही.\n` +
            `• 📊 **पावसाची शक्यता:** ${rainCalc.maxProb}% | **पाऊस:** ० मिमी\n` +
            `• 🌡️ **सध्याचे तापमान:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **सल्ला:** हवामान कोरडे आणि स्वच्छ राहील.`
          );
        }
      }
      return (
        `📍 **${locName} थेट हवामान माहिती:**\n` +
        `• **स्थिती:** ${wmo.label} (${temp}°C, जाणवणारे: ${feels}°C)\n` +
        `• **आर्द्रता:** ${humidity}% | **वाऱ्याचा वेग:** ${wind} किमी/तास\n` +
        `• **पावसाची शक्यता:** ${rainProb}% | **हवेची गुणवत्ता (AQI):** ${aqi}\n` +
        `• **इशारा:** ${topAlert?.message || 'हवामान अनुकूल आहे.'}`
      );
    }

    // Language 8: GUJARATI (ગુજરાતી)
    if (lang === 'gu') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **વરસાદની આગાહી: હા (YES - વરસાદ પડશે! 🌧️)**\n\n` +
            `• ⏰ **અંદાજિત સમય:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **વરસાદની સંભાવના:** ${rainCalc.maxProb}% | **અંદાજિત વરસાદ:** ~${rainCalc.totalPrecip} મીમી\n` +
            `• 🌡️ **વર્તમાન હવામાન:** ${wmo.label} (${temp}°C, અનુભવાતું: ${feels}°C)\n` +
            `• 💧 **ભેજ:** ${humidity}% | **પવનની ગતિ:** ${wind} કિમી/કલાક\n` +
            `• 💡 **સલાહ:** બહાર નીકળતી વખતે છત્રી અથવા રેઈનકોટ સાથે રાખો.`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **વરસાદની આગાહી: સંભાવના છે (MAYBE - હળવા ઝાપટાં 🌦️)**\n\n` +
            `• ⏰ **અંદાજિત સમય:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **વરસાદની સંભાવના:** ${rainCalc.maxProb}% | **અંદાજિત વરસાદ:** ~${rainCalc.totalPrecip} મીમી\n` +
            `• 🌡️ **વર્તમાન હવામાન:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **સલાહ:** હળવો વરસાદ પડી શકે છે.`
          );
        } else {
          return (
            `☀️ **વરસાદની આગાહી: ના (NO - વરસાદની શક્યતા નથી! ☀️)**\n\n` +
            `• ⏰ **અંદાજિત સમય:** આગામી 24 કલાકમાં વરસાદની કોઈ શક્યતા નથી.\n` +
            `• 📊 **વરસાદની સંભાવના:** ${rainCalc.maxProb}% | **વરસાદ:** 0 મીમી\n` +
            `• 🌡️ **વર્તમાન હવામાન:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **સલાહ:** હવામાન શુષ્ક અને સ્વચ્છ રહેશે.`
          );
        }
      }
      return (
        `📍 **${locName} લાઇવ હવામાન માહિતી:**\n` +
        `• **સ્થિતિ:** ${wmo.label} (${temp}°C, અનુભવાતું: ${feels}°C)\n` +
        `• **ભેજ:** ${humidity}% | **પવનની ઝડપ:** ${wind} કિમી/કલાક\n` +
        `• **વરસાદની શક્યતા:** ${rainProb}% | **હવાની ગુણવત્તા (AQI):** ${aqi}\n` +
        `• **ચેતવણી:** ${topAlert?.message || 'હવામાન અનુકૂળ છે.'}`
      );
    }

    // Language 9: PUNJABI (ਪੰਜਾਬੀ)
    if (lang === 'pa') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ: ਹਾਂ (YES - ਮੀਂਹ ਪਵੇਗਾ! 🌧️)**\n\n` +
            `• ⏰ **ਅਨੁਮਾਨਿਤ ਸਮਾਂ:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ:** ${rainCalc.maxProb}% | **ਅਨੁਮਾਨਿਤ ਮੀਂਹ:** ~${rainCalc.totalPrecip} ਮਿਲੀਮੀਟਰ\n` +
            `• 🌡️ **ਮੌਜੂਦਾ ਤਾਪਮਾਨ:** ${wmo.label} (${temp}°C, ਮਹਿਸੂਸ: ${feels}°C)\n` +
            `• 💧 **ਨਮੀ:** ${humidity}% | **ਹਵਾ ਦੀ ਰਫ਼ਤਾਰ:** ${wind} ਕਿਲੋਮੀਟਰ/ਘੰਟਾ\n` +
            `• 💡 **ਸਲਾਹ:** ਬਾਹਰ ਜਾਣ ਸਮੇਂ ਛਤਰੀ ਜਾਂ ਰੇਨਕੋਟ ਨਾਲ ਰੱਖੋ।`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ: ਸੰਭਾਵਨਾ ਹੈ (MAYBE - ਹਲਕੀ ਬੂੰਦਾਬਾਂਦੀ 🌦️)**\n\n` +
            `• ⏰ **ਅਨੁਮਾਨਿਤ ਸਮਾਂ:** ${rainCalc.predictedTimingEn}\n` +
            `• 📊 **ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ:** ${rainCalc.maxProb}% | **ਅਨੁਮਾਨਿਤ ਮੀਂਹ:** ~${rainCalc.totalPrecip} ਮਿਲੀਮੀਟਰ\n` +
            `• 🌡️ **ਮੌਜੂਦਾ ਤਾਪਮਾਨ:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **ਸਲਾਹ:** ਹਲਕਾ ਮੀਂਹ ਪੈ ਸਕਦਾ ਹੈ।`
          );
        } else {
          return (
            `☀️ **ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ: ਨਹੀਂ (NO - ਮੀਂਹ ਨਹੀਂ ਪਵੇਗਾ! ☀️)**\n\n` +
            `• ⏰ **ਅਨੁਮਾਨਿਤ ਸਮਾਂ:** ਅਗਲੇ 24 ਘੰਟਿਆਂ ਵਿੱਚ ਮੀਂਹ ਦੀ ਕੋਈ ਸੰਭਾਵਨਾ ਨਹੀਂ।\n` +
            `• 📊 **ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ:** ${rainCalc.maxProb}% | **ਮੀਂਹ:** 0 ਮਿਲੀਮੀਟਰ\n` +
            `• 🌡️ **ਮੌਜੂਦਾ ਤਾਪਮਾਨ:** ${wmo.label} (${temp}°C)\n` +
            `• 💡 **ਸਲਾਹ:** ਮੌਸਮ ਸਾਫ਼ ਅਤੇ ਖੁਸ਼ਕ ਰਹੇਗਾ।`
          );
        }
      }
      return (
        `📍 **${locName} ਲਾਈਵ ਮੌਸਮ ਰਿਪੋਰਟ:**\n` +
        `• **ਸਥਿਤੀ:** ${wmo.label} (${temp}°C, ਮਹਿਸੂਸ: ${feels}°C)\n` +
        `• **ਨਮੀ:** ${humidity}% | **ਹਵਾ ਦੀ ਗਤੀ:** ${wind} ਕਿਲੋਮੀਟਰ/ਘੰਟਾ\n` +
        `• **ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ:** ${rainProb}% | **ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ (AQI):** ${aqi}\n` +
        `• **ਚੇਤਾਵਨੀ:** ${topAlert?.message || 'ਮੌਸਮ ਠੀਕ ਹੈ।'}`
      );
    }

    // Default / Language 10: ENGLISH (en) & other languages
    if (isRainInquiry) {
      if (rainCalc.verdict === 'YES') {
        return (
          `🌧️ **Rain Forecast Verdict: YES (Rain Predicted! 🌧️)**\n\n` +
          `• ⏰ **Predicted Time:** ${rainCalc.predictedTimingEn}\n` +
          `• 📊 **Rain Probability:** ${rainCalc.maxProb}% | **Estimated Accumulation:** ~${rainCalc.totalPrecip} mm\n` +
          `• 🌡️ **Current Conditions:** ${wmo.label} at ${temp}°C (Feels like ${feels}°C)\n` +
          `• 💧 **Humidity:** ${humidity}% | **Wind:** ${wind} km/h\n` +
          `• 💡 **Advisory:** Carry an umbrella / rain gear. Plan outdoor tasks accordingly.`
        );
      } else if (rainCalc.verdict === 'MAYBE') {
        return (
          `🌦️ **Rain Forecast Verdict: MAYBE (Passing Showers / Drizzle Possible 🌦️)**\n\n` +
          `• ⏰ **Predicted Time:** ${rainCalc.predictedTimingEn}\n` +
          `• 📊 **Rain Probability:** ${rainCalc.maxProb}% | **Estimated Accumulation:** ~${rainCalc.totalPrecip} mm\n` +
          `• 🌡️ **Current Conditions:** ${wmo.label} at ${temp}°C (Feels like ${feels}°C)\n` +
          `• 💧 **Humidity:** ${humidity}% | **Wind:** ${wind} km/h\n` +
          `• 💡 **Advisory:** Isolated showers or localized drizzles possible. Keep an eye on local conditions.`
        );
      } else {
        return (
          `☀️ **Rain Forecast Verdict: NO (No Rain Expected! ☀️)**\n\n` +
          `• ⏰ **Predicted Time:** No rain expected in the next 24 hours.\n` +
          `• 📊 **Rain Probability:** ${rainCalc.maxProb}% (Very Low) | **Estimated Accumulation:** 0.0 mm\n` +
          `• 🌡️ **Current Conditions:** ${wmo.label} at ${temp}°C (Feels like ${feels}°C)\n` +
          `• 💧 **Humidity:** ${humidity}% | **Wind:** ${wind} km/h\n` +
          `• 💡 **Advisory:** Clear and dry weather expected. Favorable for outdoor activities and travel.`
        );
      }
    }

    if (domain === 'agriculture' && cropSeedAdvisory) {
      return (
        `🌾 **Smart Agricultural Crop & Seed Selection Advisory for ${locName}:**\n\n` +
        `• 🌡️ **Microclimate:** ${temp}°C (Feels like ${feels}°C) | **Humidity:** ${humidity}% | **Topsoil Moisture:** ${cropSeedAdvisory.soilMoisturePercent}%\n` +
        `• 🚜 **Sowing Readiness:** ✅ **${cropSeedAdvisory.sowingStatusLabel}**\n\n` +
        `🌱 **Recommended Seeds for Current Climate:**\n` +
        cropSeedAdvisory.recommendedSeeds.map((s, idx) => `  ${idx + 1}. **${s.cropEn}** (${s.variety})\n     *Crop Duration:* ${s.duration} | *Suitability:* ${s.suitability}\n     *Agronomic Reason:* ${s.reasonEn}`).join('\n\n') +
        `\n\n• 💧 **Irrigation Strategy:** ${agriAdvisory?.irrigationAdvice || 'Moderate irrigation to maintain root-zone saturation.'}\n` +
        `• 🧪 **Agrochemical Spray Window:** ${agriAdvisory?.sprayCondition === 'Favorable' ? '✅ Optimal for foliar application' : '⚠️ Postpone due to wind/rain.'}\n` +
        `• 🛡️ **${cropSeedAdvisory.pestWarning}**\n` +
        `• 💡 **${cropSeedAdvisory.seedTreatmentTip}**`
      );
    }

    if (domain === 'marine' && marineBriefing) {
      return (
        `🌊 **Oceanographic & Marine Safety Briefing for ${locName}:**\n` +
        `• **Sea State:** ${marineBriefing.seaState} (${marineBriefing.waveHeightM}m significant wave height)\n` +
        `• **Swell Period:** ${marineBriefing.swellPeriodSec}s | **Sea Surface Temperature:** ${marineBriefing.seaSurfaceTemp}°C\n` +
        `• **Wind Field:** ${wind} km/h sustained gusts\n` +
        `• **Fishermen Advisory:** ${marineBriefing.fishermanAdvisory}\n` +
        `• **Astronomical Tides:** High Tide at ${marineBriefing.tideInfo.nextHighTide}`
      );
    }

    if (domain === 'aviation' && aviationBriefing) {
      return (
        `✈️ **Aviation Meteorological Dispatch & Flight Briefing (${locName}):**\n` +
        `\`${aviationBriefing.metar}\`\n\n` +
        `• **Flight Category:** ${aviationBriefing.flightCategory}\n` +
        `• **Surface Visibility:** ${aviationBriefing.visibilityKm} km\n` +
        `• **Lowest Cloud Ceiling:** ${aviationBriefing.ceilingFeet} ft AGL\n` +
        `• **Surface Wind:** ${aviationBriefing.windKnots} KT from ${aviationBriefing.windDirection}° (Gusts: ${aviationBriefing.gustKnots} KT)\n` +
        `• **Altimeter Setting (QNH):** ${aviationBriefing.altimeterHpa} hPa\n` +
        `• **Low-Level Turbulence:** ${aviationBriefing.turbulenceRisk}`
      );
    }

    if (timeframe === 'tomorrow') {
      return (
        `☀️ **Forecast for ${locName} (Tomorrow):**\n` +
        `• **Expected Maximum Temperature:** ${tomorrowTempMax}°C\n` +
        `• **Precipitation Probability:** ${tomorrowRainProb}%\n` +
        `• **Sustained Winds:** ${wind} km/h | **Air Quality Index:** ${aqi} (US AQI)\n` +
        `• **Disaster & Alert Status:** ${topAlert?.title}`
      );
    }

    return (
      `📍 **Real-time Meteorological Intelligence for ${locName}:**\n` +
      `• **Current Sky & Condition:** ${wmo.label} at **${temp}°C** (Feels like **${feels}°C**)\n` +
      `• **Atmospheric Moisture:** Relative Humidity **${humidity}%** | Pressure **${current.pressure_msl || 1013} hPa**\n` +
      `• **Wind Dynamics:** **${wind} km/h** from ${current.wind_direction_10m || 0}°\n` +
      `• **Precipitation Outlook:** **${rainProb}%** probability today\n` +
      `• **Air Quality & UV:** AQI **${aqi}** | UV Index **${current.uv_index || 5}**\n` +
      `• **Early Warning Ticker:** ${topAlert?.title} — *${topAlert?.message}*`
    );
  }
}

export const weatherAI = new WeatherAIAgent();
