// ============================================================================
// WeatherGPT Emergency Offline Disaster Vault & Low-Signal Edge AI Engine
// Operates with Zero Network / Cell Tower Down / Disaster Blackout Conditions
// ============================================================================

import {
  detectLanguageFromQuery,
  resolveTamilAndTanglishCityName,
  classifyQueryIntent,
  getGreetingResponse,
  getGratitudeResponse,
  getOffTopicResponse
} from './aiService';
import { getWeatherDescription, getLocalizedPlaceName } from './weatherService';

const VAULT_STORAGE_KEY = 'weathergpt_offline_disaster_vault_v1';
const RECENT_WEATHER_KEY = 'weathergpt_last_known_weather_cache';

// Verified Disaster Helplines & Rapid Emergency Contacts (Tamil Nadu & National)
export const EMERGENCY_HELPLINES = [
  { name: 'State Disaster Management Control Room', number: '1070', type: 'Disaster', ta: 'மாநில பேரிடர் கட்டுப்பாட்டு அறை' },
  { name: 'District Collector Disaster Helpline', number: '1077', type: 'Collector', ta: 'மாவட்ட ஆட்சியர் பேரிடர் உதவி மையம்' },
  { name: 'National Emergency Helpline (All-in-One)', number: '112', type: 'Police/Emergency', ta: 'தேசிய அவசர உதவி எண்' },
  { name: 'Ambulance & Emergency Medical Response', number: '108', type: 'Medical', ta: 'அவசர ஆம்புலன்ஸ் சேவை' },
  { name: 'Fire & Rescue Services', number: '101', type: 'Rescue', ta: 'தீயணைப்பு மற்றும் மீட்புப் படை' },
  { name: 'TNSDMA WhatsApp Disaster Help', number: '9445869848', type: 'WhatsApp', ta: 'பேரிடர் வாட்ஸ்அப் உதவி' },
  { name: 'Electricity Disruption / Wire Snap (TANGEDCO)', number: '9498794987', type: 'Power', ta: 'மின்னழுத்தம் / மின்தடை உதவி' },
  { name: 'Coast Guard & Maritime Rescue', number: '1554', type: 'Marine', ta: 'கடலோர காவல்படை மீட்பு' },
];

export const DISASTER_PROTOCOLS = {
  flood: {
    titleEn: '🌊 Flood & Inundation Safety Protocol',
    titleTa: '🌊 வெள்ளம் மற்றும் தண்ணீர் தேக்க பாதுகாப்பு விதிமுறைகள்',
    rulesEn: [
      '1. Cut off main electricity circuit breaker to prevent electric shock.',
      '2. Do NOT walk or drive through flowing water (6 inches can sweep you off feet).',
      '3. Boil drinking water or consume packaged water to avoid waterborne infections.',
      '4. Move valuable documents and family to first floor or designated disaster relief shelters.',
      '5. Call 1077 (District Collector) or 1070 for immediate NDRF boat rescue.'
    ],
    rulesTa: [
      '1. மின் அதிர்ச்சியைத் தவிர்க்க வீட்டின் பிரதான மின் இணைப்பை (Main Switch) அணைக்கவும்.',
      '2. ஓடும் வெள்ள நீரில் நடக்கவோ அல்லது வாகனங்களை இயக்கவோ வேண்டாம்.',
      '3. தொற்றுநோய்களைத் தவிர்க்க நீரைக் கொதிக்க வைத்து மட்டுமே குடிக்கவும்.',
      '4. முக்கியமான ஆவணங்கள் மற்றும் குடும்பத்தினருடன் பாதுகாப்பான மேடான இடங்கள்/முகாம்களுக்கு செல்லவும்.',
      '5. மீட்புப் படைகளின் உதவிக்கு 1077 (மாவட்ட ஆட்சியர்) அல்லது 1070-ஐ அழைக்கவும்.'
    ]
  },
  cyclone: {
    titleEn: '🌀 Severe Cyclone & Gale Wind Safety Protocol',
    titleTa: '🌀 புயல் மற்றும் பலத்த காற்று பாதுகாப்பு விதிமுறைகள்',
    rulesEn: [
      '1. Stay indoors in strong concrete structures away from glass doors and windows.',
      '2. Keep mobile phones and power banks fully charged; keep emergency battery torches ready.',
      '3. Secure loose roof tiles, tin sheets, and outdoor objects.',
      '4. Never venture under tall old trees, electric poles, or weak hoardings.',
      '5. Fishermen must strictly remain ashore; anchor all boats safely inland.'
    ],
    rulesTa: [
      '1. கண்ணாடி ஜன்னல்கள் மற்றும் கதவுகளிலிருந்து விலகி கான்கிரீட் கட்டிடங்களுக்குள் இருக்கவும்.',
      '2. மொபைல் மற்றும் பவர் பேங்க்களை முன்கூட்டியே சார்ஜ் செய்து, டார்ச் விளக்குகளை தயாராக வைக்கவும்.',
      '3. காற்றில் பறக்கக்கூடிய தகரக் கூரைகள் மற்றும் பொருட்களைப் பாதுகாப்பாகக் கட்டவும்.',
      '4. உயரமான பழைய மரங்கள் மற்றும் மின்கம்பங்களின் கீழ் நிற்க வேண்டாம்.',
      '5. மீனவர்கள் கடலுக்குச் செல்வதை முழுமையாகத் தவிர்த்து படகுகளைப் பாதுகாப்பாக நிறுத்தவும்.'
    ]
  },
  lightning: {
    titleEn: '⚡ Thunderstorm & Severe Lightning Safety Protocol',
    titleTa: '⚡ இடி மின்னல் பாதுகாப்பு விதிமுறைகள்',
    rulesEn: [
      '1. Follow the 30-30 Rule: Seek indoor shelter immediately upon hearing thunder.',
      '2. Avoid open fields, metal fences, and water bodies.',
      '3. Unplug electrical appliances, computers, and TV antennas during storms.'
    ],
    rulesTa: [
      '1. இடி சத்தம் கேட்டவுடனேயே திறந்தவெளியை விட்டு பாதுகாப்பான கட்டிடத்திற்குள் செல்லவும்.',
      '2. திறந்தவெளிகள், உலோக வேலி மற்றும் நீர்நிலைகளின் அருகில் நிற்க வேண்டாம்.',
      '3. வீட்டின் மின்சாதனங்களின் இணைப்புகளை துண்டித்து வைக்கவும்.'
    ]
  }
};

class OfflineDisasterVaultService {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = [];
    this.initNetworkMonitoring();
  }

  initNetworkMonitoring() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners({ status: 'online', msg: 'Network Connection Restored' });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners({
        status: 'offline_emergency',
        msg: '📡 Low Signal / Tower Down: Emergency Offline Mode Active'
      });
    });
  }

  subscribeNetworkStatus(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.warn('Network listener error:', err);
      }
    });
  }

  // Persist Live Weather Snapshot to Offline Disaster Vault
  saveLiveWeatherSnapshot(location, nwpData, aqiData, alerts = []) {
    try {
      if (!location || !nwpData) return;
      const snapshot = {
        location: {
          name: location.name || 'Local Station',
          admin1: location.admin1 || 'Tamil Nadu',
          latitude: location.latitude,
          longitude: location.longitude,
        },
        current: nwpData.current || {},
        daily: nwpData.daily || {},
        hourly: nwpData.hourly ? {
          time: nwpData.hourly.time?.slice(0, 48),
          temperature_2m: nwpData.hourly.temperature_2m?.slice(0, 48),
          precipitation_probability: nwpData.hourly.precipitation_probability?.slice(0, 48),
          precipitation: nwpData.hourly.precipitation?.slice(0, 48),
          weather_code: nwpData.hourly.weather_code?.slice(0, 48),
          wind_speed_10m: nwpData.hourly.wind_speed_10m?.slice(0, 48),
        } : null,
        aqi: aqiData?.current?.us_aqi || 50,
        alerts: alerts.map(a => ({ title: a.title, severity: a.severity, description: a.description })),
        cachedAt: new Date().toISOString(),
        cachedTimestamp: Date.now()
      };

      localStorage.setItem(RECENT_WEATHER_KEY, JSON.stringify(snapshot));
    } catch (err) {
      console.warn('Offline vault save error:', err);
    }
  }

  // Retrieve Last Cached Weather Snapshot
  getLastKnownWeather() {
    try {
      const stored = localStorage.getItem(RECENT_WEATHER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    // Fallback emergency seed
    return {
      location: { name: 'Tamil Nadu Region', admin1: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
      current: { temperature_2m: 29.5, relative_humidity_2m: 75, wind_speed_10m: 14, precipitation: 0 },
      daily: { precipitation_probability_max: [40, 60], temperature_2m_max: [32, 31], precipitation_sum: [2.5, 8.0] },
      cachedAt: new Date().toISOString(),
      isEmergencySeed: true
    };
  }

  // Answer user queries completely OFFLINE using Edge Intelligence & Disaster Knowledge Vault
  processOfflineQuery(query, activeLanguage = 'en', currentLocation = null) {
    const q = (query || '').trim();
    const effectiveLang = detectLanguageFromQuery(q, activeLanguage);
    const isTanglish = effectiveLang === 'tanglish';
    const isTamil = effectiveLang === 'ta' || isTanglish;

    // 🛑 Intent Classification in Offline Engine
    const { intent } = classifyQueryIntent(q, false);

    if (intent === 'GREETING') {
      return {
        text: getGreetingResponse(effectiveLang),
        isOffline: true,
        isWeatherQuery: false,
        mode: 'Offline Conversational Engine'
      };
    }

    if (intent === 'GRATITUDE') {
      return {
        text: getGratitudeResponse(effectiveLang),
        isOffline: true,
        isWeatherQuery: false,
        mode: 'Offline Conversational Engine'
      };
    }

    if (intent === 'OFF_TOPIC') {
      return {
        text: getOffTopicResponse(effectiveLang),
        isOffline: true,
        isWeatherQuery: false,
        mode: 'Offline Domain Guardrail'
      };
    }

    const snapshot = this.getLastKnownWeather();
    const locName = snapshot.location?.name || currentLocation?.name || 'Local Area';
    const temp = snapshot.current?.temperature_2m ?? 29;
    const rainProb = snapshot.daily?.precipitation_probability_max?.[0] ?? 35;
    const tomorrowRain = snapshot.daily?.precipitation_probability_max?.[1] ?? 45;
    const cachedTimeStr = new Date(snapshot.cachedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. SOS / Emergency Helpline Inquiry
    if (/\b(sos|helpline|phone|emergency|collector|ambulance|police|fire|boat|tnsdma|call|help|number|contact)\b/i.test(q)) {
      if (isTamil) {
        return {
          text: `🚨 **வானிலை அவசர கால உதவி எண்கள் (Offline Emergency SOS Vault):**\n\n` +
            `• 🏛️ **மாவட்ட ஆட்சியர் பேரிடர் உதவி மையம்:** \`1077\`\n` +
            `• 🏢 **மாநில பேரிடர் கட்டுப்பாட்டு அறை:** \`1070\`\n` +
            `• 🚨 **தேசிய அவசர உதவி எண்:** \`112\`\n` +
            `• 🚑 **அவசர ஆம்புலன்ஸ் சேவை:** \`108\`\n` +
            `• 🚒 **தீயணைப்பு மற்றும் மீட்புப் படை:** \`101\`\n` +
            `• 📱 **TNSDMA வாட்ஸ்அப் உதவி:** \`+91 94458 69848\`\n` +
            `• ⚡ **மின்தடை / அறுந்த மின்கம்பி உதவி (TANGEDCO):** \`94987 94987\`\n\n` +
            `*(டவர் சிக்னல் குறைவாக இருந்தாலும் 112 / 108 / 1077 எண்களுக்கு இலவசமாக நேரடியாக அவசர அழைப்பு மேற்கொள்ள முடியும்.)*`,
          isOffline: true,
          mode: 'Disaster SOS Vault'
        };
      }
      return {
        text: `🚨 **Critical Emergency SOS Contacts (Offline Disaster Vault):**\n\n` +
          `• 🏛️ **District Collector Disaster Control:** \`1077\`\n` +
          `• 🏢 **State Disaster Management (TNSDMA):** \`1070\`\n` +
          `• 🚨 **National Emergency All-in-One:** \`112\`\n` +
          `• 🚑 **Medical Ambulance:** \`108\`\n` +
          `• 🚒 **Fire & Rescue Services:** \`101\`\n` +
          `• ⚡ **Electricity Disruption / Wire Snap:** \`94987 94987\`\n` +
          `• 📱 **Disaster WhatsApp Help:** \`+91 94458 69848\`\n\n` +
          `*(Note: Emergency calls to 112 / 108 connect directly on any available mobile carrier frequency even with zero balance / weak tower.)*`,
        isOffline: true,
        mode: 'Disaster SOS Vault'
      };
    }

    // 2. Flood / Waterlogging / Cyclone Safety Rules Inquiry
    if (/\b(flood|waterlog|vellam|puyal|cyclone|safe|precaution|shelter|mudhugam|safety|protect|kaathu|gale)\b/i.test(q)) {
      if (isTamil) {
        return {
          text: `🛡️ **அவசர கால பேரிடர் பாதுகாப்பு வழிகாட்டுதல்கள் (Offline Disaster Safety):**\n\n` +
            `• ⚡ **மின் பாதுகாப்பு:** வீட்டில் தண்ணீர் தேங்கினால் உடனே மெயின் சுவிட்சை (Main Switch) அணைக்கவும்.\n` +
            `• 🚶 **வெள்ள நீர்:** ஓடும் வெள்ள நீரில் நடக்கவோ அல்லது இருசக்கர வாகனங்களை இயக்கவோ கூடாது.\n` +
            `• 💧 **குடிநீர்:** காய்ச்சிய குடிநீரை மட்டுமே பருகவும் அல்லது சுத்தமான பாட்டில் நீரைப் பயன்படுத்தவும்.\n` +
            `• 🔋 **முன்னெச்சரிக்கை:** மொபைல், பவர் பேங்க், டார்ச் விளக்குகளை தயாராக வைக்கவும்.\n` +
            `• 🏠 **மீட்பு முகாம்:** ஆபத்தான தாழ்வான பகுதிகளில் இருந்தால் அருகிலுள்ள அரசு நிவாரண முகாம்களுக்குச் செல்லவும் (உதவிக்கு: 1077).`,
          isOffline: true,
          mode: 'Disaster Safety Vault'
        };
      }
      return {
        text: `🛡️ **Offline Disaster & Severe Weather Safety Protocols:**\n\n` +
          `• ⚡ **Electrical Safety:** Switch off main power breaker immediately if water enters premises.\n` +
          `• 🚶 **Flood Hazards:** Never attempt to drive or walk through flooded roadways or underpasses.\n` +
          `• 💧 **Safe Water:** Drink boiled or sealed bottled water to prevent waterborne contamination.\n` +
          `• 🔋 **Preparedness:** Keep power banks, emergency flashlights, and vital identity documents sealed in plastic bags.\n` +
          `• 🏠 **Shelter Access:** Relocate to nearest cyclone/flood relief shelter if water levels rise (Dial: 1077 / 1070).`,
        isOffline: true,
        mode: 'Disaster Safety Vault'
      };
    }

    // 3. Rain / Weather Inquiries (Tanglish, Tamil, English)
    if (isTanglish) {
      return {
        text: `📡 **WeatherGPT Offline Emergency Telemetry (${locName}):**\n\n` +
          `• 🌡️ **வெப்பநிலை (Temperature):** ${temp}°C (சேமிக்கப்பட்ட கடைசி தகவல்: ${cachedTimeStr})\n` +
          `• 🌧️ **மழை வாய்ப்பு (Rain Risk):** ${rainProb >= 50 ? 'அதிக மழை பெய்ய வாய்ப்புள்ளது (High Rain Prob)' : 'மிதமான மேகமூட்டம் / லேசான சாரல்'}\n` +
          `• 📅 **நாளைய வானிலை (Tomorrow):** மழை வாய்ப்பு ~${tomorrowRain}%\n` +
          `• 💡 **பரிந்துரை (Advisory):** ${rainProb >= 50 ? 'வெளியே செல்லும் போது குடை எடுத்துச் செல்லவும். தாழ்வான சாலைகளில் தண்ணீர் தேங்க வாய்ப்புள்ளது.' : 'வானிலை பொதுவாக சீராக உள்ளது. அவசர உதவிக்கு 1077 அழைக்கலாம்.'}\n\n` +
          `*(டவர் சிக்னல் இல்லாத நேரத்திலும் ஆஃப்லைன் கேச் மூலம் துல்லியமாக கணக்கிடப்பட்டது.)*`,
        isOffline: true,
        mode: 'Offline Edge AI'
      };
    }

    if (effectiveLang === 'ta') {
      return {
        text: `📡 **WeatherGPT அவசர ஆஃப்லைன் வானிலை அறிக்கை (${locName}):**\n\n` +
          `• 🌡️ **வெப்பநிலை:** ${temp}°C (கடைசி நேரலை பதிவு: ${cachedTimeStr})\n` +
          `• 🌧️ **இன்றைய மழை வாய்ப்பு:** ${rainProb}%\n` +
          `• 📅 **நாளைய முன்னறிவிப்பு:** மழை வாய்ப்பு ${tomorrowRain}%\n` +
          `• 🛡️ **பாதுகாப்பு குறிப்பு:** ${rainProb >= 50 ? 'மழைக்கான வாய்ப்பு அதிகம் உள்ளதால் தேவையின்றி வெளியே செல்வதை தவிர்க்கவும்.' : 'சாதாரண தட்பவெப்ப நிலை. பயணங்களை மேற்கொள்ளலாம்.'}\n\n` +
          `*(டவர் சிக்னல் இல்லாத போதும் ஆஃப்லைன் எட்ஜ் இன்ஜின் மூலம் பதிலளிக்கப்பட்டது.)*`,
        isOffline: true,
        mode: 'Offline Edge AI'
      };
    }

    return {
      text: `📡 **WeatherGPT Offline Emergency Telemetry (${locName}):**\n\n` +
        `• 🌡️ **Temperature:** ${temp}°C (From last local sync at ${cachedTimeStr})\n` +
        `• 🌧️ **Rain Probability:** ${rainProb}% | Tomorrow: ${tomorrowRain}%\n` +
        `• 💨 **Wind Conditions:** ${snapshot.current?.wind_speed_10m || 14} km/h\n` +
        `• 💡 **Advisory:** ${rainProb >= 50 ? 'Rainfall expected in the region. Carry rain gear and exercise caution on waterlogged corridors.' : 'Ambient conditions steady. Emergency SOS numbers available offline anytime.'}\n\n` +
        `*(Served via Offline Edge AI Disaster Vault during network disruption.)*`,
      isOffline: true,
      mode: 'Offline Edge AI'
    };
  }
}

export const offlineVaultService = new OfflineDisasterVaultService();
