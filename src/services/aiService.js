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
import { offlineVaultService } from './offlineVaultService';

// 🌐 Universal Multi-Language & Tanglish Auto-Detector Engine
// Detects Tamil script, Indic Unicode scripts, Tanglish Romanized phonetics, and English queries
export function detectLanguageFromQuery(query, defaultLang = 'en') {
  if (!query || typeof query !== 'string') return defaultLang;
  const q = query.trim();
  // Strip dots, multiple spaces, and special symbols into clean tokens
  const qClean = q.replace(/[^a-zA-Z0-9\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF\u0A80-\u0AFF\u0A00-\u0A7F\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const qLower = qClean.toLowerCase();

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

  // 2. Comprehensive Tanglish Detection (Conversational Tamil written in English alphabets)
  const tanglishKeywords = [
    // Tamil Question words (e.g. epdi, eppadi, enna, yenna, eppo, enga, etc.)
    /\b(eppadi|epdi|epudee|epadi|eppidi|epdiyiruku|eppadiiruku|eppadiirruku|epdiirruku|epdiiruku|yenna|yethana|yeppo|yenga|yaaru|yedhu|ennapa|ennada)\b/i,
    /\b(enna|ethana|eppo|ippo|enga|yar|edhu)\b/i,
    // Tamil Verbs & State markers (e.g. irukku, iruku, varuma, peyyuma, sollunga, etc.)
    /\b(irukku|erukku|iruku|eruku|irruku|erruku|irukkaa|erukkaa|irukkuma|erukkuma|irukkum|erukkum|irukka|eruka|irundha|erundha|irukudhu|irukkudhu|irundhadhu)\b/i,
    /\b(mazhai|malai|mazha|thooral|varuma|varum|varudhu|varuthu|peyyuma|peiyuma|peiyum|peyyum|kottuma|adikkuma|adikkum|adikuma|adikum)\b/i,
    /\b(solla|sollu|sollunga|solunga|sollungalen|solra|solradhu|sonna|sonnanga|sonnadhu|ketta|kettanga|kudutha|kudu|kudunga|kudungalen|kelunga|keka|kekuran|pesu|paaru|parkalam|paarkalam|theerpu)\b/i,
    // Daily needs, weather elements & atmosphere
    /\b(veliya|veetula|kaathu|kaatru|veiyil|veyil|vanam|megam|kulir|thaneer|thanneer|thanni|oothe|aagum|aaguma|theriyuma|kidaikkuma|puriyuma|mudiyuma|mudiyum|vellam|puyal)\b/i,
    // Farming & agriculture in Tamil
    /\b(vidhai|vitha|vithai|payir|vivasaayam|vivasayam|vivasayi|panlama|pannalama|podalama|podanum|podalaama|podunga|vaikanum|vaikalam|vacha|thelikkalam|marundhu|uram|paasanam)\b/i,
    // Time & day indicators in Tamil
    /\b(iniku|inniku|innikku|innaiku|nalaiku|naalaiku|naalaikku|naalai|nethu|netthu)\b/i,
    // Personal pronouns & qualifiers
    /\b(ennaku|enakku|ungala|ungalluku|ungalukku|romba|konjam|paathu|pathu|paathuttu|pathuttu|pannu|pannalam|thappu|mathiri|maathiri|maari|mari)\b/i,
    // Umbrella & clothing in Tanglish (e.g. kudai thevaya, thuni kaayuma)
    /\b(kudai|koda|thevaya|theva|thevai|thevaiya|thevapadum|thevapaduma|pogalama|pogalaama|polama|thuni|kaayuma)\b/i,
    // Conversational markers
    /\b(aana|analum|aama|illa|illaye|illaya|seri|sari|okva|supera|semma|nalla|nallava|yedhavadhu|edhavadhu)\b/i,
    // Contextual Tanglish pairs (e.g. "climate epdi", "weather la", "chengalpattu la", "umbrella thevaya")
    /\b(climate|weather|today|tomorrow)\s+(la|le|kku|ku|epdi|eppadi|iruku|irruku|irukku|varuma|varum)\b/i,
    /\b(epdi|eppadi|epadi|eppidi)\s+(climate|weather|today|tomorrow)\b/i,
    /\b(la|le)\s+(epdi|eppadi|iruku|irruku|irukku|climate|weather|mazhai|malai|varuma)\b/i,
    /\b(umbrella)\s+(theva|thevaya|thevai|thevaiya|thevapadum|venuma)\b/i,
    /\b(theva|thevaya|thevai|thevaiya|venuma)\s+(umbrella|kudai)\b/i,
    // Tamil Nadu City / Locality WITH Tamil locative suffix attached (e.g. chengalpattula, chennaile, maduraila, etc.)
    /\b(chengalpattu|chengalpet|chennai|madras|coimbatore|kovai|madurai|trichy|tiruchirappalli|salem|ooty|nilgiris|nellai|tirunelveli|vellore|thanjavur|tanjore|erode|tiruppur|dindigul|cuddalore|kanchipuram|villupuram|tiruvannamalai|dharmapuri|krishnagiri|hosur|namakkal|karur|perambalur|ariyalur|nagapattinam|mayiladuthurai|tiruvarur|pudukkottai|sivaganga|ramanathapuram|virudhunagar|theni|tenkasi|ranipet|tirupattur|kallakurichi|tambaram|avadi|ambattur|velachery|guindy|porur|chromepet|pallavaram|poonamallee|puducherry|pondicherry|kanyakumari|nagercoil)(?:la|le|kku|ku|oda|laa|il)\b/i,
    // Tamil Nadu City followed by locative particle / Tamil verb (e.g. "chengalpattu la", "chennai kku", "madurai epdi")
    /\b(chengalpattu|chengalpet|chennai|madras|coimbatore|kovai|madurai|trichy|tiruchirappalli|salem|ooty|nilgiris|nellai|tirunelveli|vellore|thanjavur|tanjore|erode|tiruppur|dindigul|cuddalore|kanchipuram|villupuram|tiruvannamalai|dharmapuri|krishnagiri|hosur|namakkal|karur|perambalur|ariyalur|nagapattinam|mayiladuthurai|tiruvarur|pudukkottai|sivaganga|ramanathapuram|virudhunagar|theni|tenkasi|ranipet|tirupattur|kallakurichi|tambaram|avadi|ambattur|velachery|guindy|porur|chromepet|pallavaram|poonamallee|puducherry|pondicherry|kanyakumari|nagercoil)\s+(la|le|kku|ku|oda|laa|il|epdi|eppadi|iruku|irruku|irukku|mazhai|malai|varuma)\b/i
  ];

  for (const pattern of tanglishKeywords) {
    if (pattern.test(qLower) || pattern.test(qClean)) {
      return 'tanglish';
    }
  }

  // If user explicitly picked Tamil in UI and typed in Roman script without full English words
  if (defaultLang === 'tanglish') {
    return 'tanglish';
  }

  // 3. Hinglish Detection
  const hinglishPatterns = [
    /\b(kya|hoga|hai|hogi|barish|barsat|hogi kya|kab|aayegi|kaisa|mausam|aaj ka|kal ka|batao|bataiye|kheti|fasal|beej)\b/i
  ];
  for (const pattern of hinglishPatterns) {
    if (pattern.test(qLower) || pattern.test(qClean)) {
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
  // Clean dots and excessive spaces (e.g., "Today.. Chengalpattu.. La" -> "Today Chengalpattu La")
  const q = query.replace(/\.{2,}/g, ' ').replace(/\s+/g, ' ').trim();
  const qLower = q.toLowerCase();

  // 1. Direct Tamil Unicode city map (All 38 TN Districts + Major Localities)
  const tamilCityMap = [
    { pattern: /(?:செங்கல்பட்டு|செங்கல்பட்டுல|செங்கல்பட்டில்|செங்கை|செங்கல்பட்டில)/, name: 'Chengalpattu' },
    { pattern: /(?:சென்னை|சென்னையில|சென்னையில்|சென்னைல|சென்னையிலா|மதராஸ்)/, name: 'Chennai' },
    { pattern: /(?:காஞ்சிபுரம்|காஞ்சிபுரத்துல|காஞ்சிபுரத்தில்|காஞ்சி)/, name: 'Kanchipuram' },
    { pattern: /(?:திருவள்ளூர்|திருவள்ளூர்ல|திருவள்ளூரில்)/, name: 'Tiruvallur' },
    { pattern: /(?:தாம்பரம்|தாம்பரத்துல|தாம்பரத்தில்)/, name: 'Tambaram' },
    { pattern: /(?:ஆவடி|ஆவடியில|ஆவடியில்|ஆவடில)/, name: 'Avadi' },
    { pattern: /(?:மதுரை|மதுரையில|மதுரையில்|மதுரைல)/, name: 'Madurai' },
    { pattern: /(?:கோவை|கோவையில|கோவையில்|கோயம்புத்தூர்|கோயம்புத்தூரில்)/, name: 'Coimbatore' },
    { pattern: /(?:திருச்சி|திருச்சியில|திருச்சியில்|திருச்சிராப்பள்ளி)/, name: 'Tiruchirappalli' },
    { pattern: /(?:சேலம்|சேலத்துல|சேலத்தில்)/, name: 'Salem' },
    { pattern: /(?:நெல்லை|நெல்லையில|நெல்லையில்|திருநெல்வேலி|திருநெல்வேலியில்)/, name: 'Tirunelveli' },
    { pattern: /(?:வேலூர்|வேலூரில்|வேலூர்ல)/, name: 'Vellore' },
    { pattern: /(?:ஈரோடு|ஈரோட்டில்|ஈரோடுல)/, name: 'Erode' },
    { pattern: /(?:தஞ்சாவூர்|தஞ்சாவூரில்|தஞ்சை|தஞ்சையில்)/, name: 'Thanjavur' },
    { pattern: /(?:தூத்துக்குடி|தூத்துக்குடியில்|டியூட்டிகாரின்)/, name: 'Thoothukudi' },
    { pattern: /(?:திண்டுக்கல்|திண்டுக்கல்லில்|திண்டுக்கல்ல)/, name: 'Dindigul' },
    { pattern: /(?:கன்னியாகுமரி|கன்னியாகுமரியில்|நாகர்கோவில்)/, name: 'Kanyakumari' },
    { pattern: /(?:ஊட்டி|ஊட்டியில்|உதகை|உதகமண்டலம்|நீலகிரி)/, name: 'Ooty' },
    { pattern: /(?:கடலூர்|கடலூரில்|கடலூர்ல)/, name: 'Cuddalore' },
    { pattern: /(?:விழுப்புரம்|விழுப்புரத்துல|விழுப்புரத்தில்)/, name: 'Villupuram' },
    { pattern: /(?:திருவண்ணாமலை|திருவண்ணாமலையில|திருவண்ணாமலையில்)/, name: 'Tiruvannamalai' },
    { pattern: /(?:தருமபுரி|தர்மபுரி|தருமபுரியில)/, name: 'Dharmapuri' },
    { pattern: /(?:கிருஷ்ணகிரி|கிருஷ்ணகிரியில|கிருஷ்ணகிரியில்)/, name: 'Krishnagiri' },
    { pattern: /(?:ஓசூர்|ஓசூரில்|ஓசூர்ல)/, name: 'Hosur' },
    { pattern: /(?:நாமக்கல்|நாமக்கல்லில்|நாமக்கல்ல)/, name: 'Namakkal' },
    { pattern: /(?:கரூர்|கரூரில்|கரூர்ல)/, name: 'Karur' },
    { pattern: /(?:பெரம்பலூர்|பெரம்பலூரில்)/, name: 'Perambalur' },
    { pattern: /(?:அரியலூர்|அரியலூரில்)/, name: 'Ariyalur' },
    { pattern: /(?:நாகப்பட்டினம்|நாகையில்|நாகை)/, name: 'Nagapattinam' },
    { pattern: /(?:மயிலாடுதுறை|மயிலாடுதுறையில|மயூரம்)/, name: 'Mayiladuthurai' },
    { pattern: /(?:திருவாரூர்|திருவாரூரில்)/, name: 'Tiruvarur' },
    { pattern: /(?:புதுக்கோட்டை|புதுக்கோட்டையில்)/, name: 'Pudukkottai' },
    { pattern: /(?:சிவகங்கை|சிவகங்கையில்)/, name: 'Sivaganga' },
    { pattern: /(?:இராமநாதபுரம்|ராமநாதபுரம்|ராமேஸ்வரம்)/, name: 'Ramanathapuram' },
    { pattern: /(?:விருதுநகர்|விருதுநகரில்)/, name: 'Virudhunagar' },
    { pattern: /(?:தேனி|தேனியில்|போடி)/, name: 'Theni' },
    { pattern: /(?:தென்காசி|தென்காசியில)/, name: 'Tenkasi' },
    { pattern: /(?:திருப்பூர்|திருப்பூரில்)/, name: 'Tiruppur' },
    { pattern: /(?:ராணிப்பேட்டை|ராணிப்பேட்டையில்)/, name: 'Ranipet' },
    { pattern: /(?:திருப்பத்தூர்|திருப்பத்தூரில்)/, name: 'Tirupattur' },
    { pattern: /(?:கள்ளக்குறிச்சி|கள்ளக்குறிச்சியில்)/, name: 'Kallakurichi' },
    { pattern: /(?:புதுச்சேரி|புதுச்சேரியில்|பாண்டிச்சேரி|பாண்டி)/, name: 'Puducherry' },
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

  // 2. Tanglish Romanized city matching with optional locative suffixes (e.g. "chengalpattula", "chennai kku", "kovaila")
  const tanglishCityMap = [
    { pattern: /\b(chengalpattu|chengalpet|chengalpetu|chengalpatt)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Chengalpattu' },
    { pattern: /\b(chennai|madras)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Chennai' },
    { pattern: /\b(kanchipuram|kancheepuram|kanchi)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Kanchipuram' },
    { pattern: /\b(tiruvallur|thiruvallur)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Tiruvallur' },
    { pattern: /\b(tambaram)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Tambaram' },
    { pattern: /\b(avadi)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Avadi' },
    { pattern: /\b(madurai)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Madurai' },
    { pattern: /\b(coimbatore|kovai)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Coimbatore' },
    { pattern: /\b(trichy|tiruchirappalli|tiruchi)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Tiruchirappalli' },
    { pattern: /\b(salem)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Salem' },
    { pattern: /\b(nellai|tirunelveli)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Tirunelveli' },
    { pattern: /\b(vellore)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Vellore' },
    { pattern: /\b(erode)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Erode' },
    { pattern: /\b(thanjavur|tanjore|thanjai)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Thanjavur' },
    { pattern: /\b(thoothukudi|tuticorin)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Thoothukudi' },
    { pattern: /\b(dindigul|dindigallu)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Dindigul' },
    { pattern: /\b(kanyakumari|nagercoil)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Kanyakumari' },
    { pattern: /\b(ooty|udhagamandalam|nilgiris|coonoor)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Ooty' },
    { pattern: /\b(cuddalore)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Cuddalore' },
    { pattern: /\b(villupuram|viluppuram)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Villupuram' },
    { pattern: /\b(tiruvannamalai|thiruvannamalai)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Tiruvannamalai' },
    { pattern: /\b(dharmapuri)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Dharmapuri' },
    { pattern: /\b(krishnagiri)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Krishnagiri' },
    { pattern: /\b(hosur)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Hosur' },
    { pattern: /\b(namakkal)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Namakkal' },
    { pattern: /\b(karur)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Karur' },
    { pattern: /\b(perambalur)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Perambalur' },
    { pattern: /\b(ariyalur)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Ariyalur' },
    { pattern: /\b(nagapattinam|nagai)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Nagapattinam' },
    { pattern: /\b(mayiladuthurai)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Mayiladuthurai' },
    { pattern: /\b(tiruvarur|thiruvarur)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Tiruvarur' },
    { pattern: /\b(pudukkottai|pudukottai)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Pudukkottai' },
    { pattern: /\b(sivaganga|sivagangai)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Sivaganga' },
    { pattern: /\b(ramanathapuram|ramnad|rameshwaram)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Ramanathapuram' },
    { pattern: /\b(virudhunagar)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Virudhunagar' },
    { pattern: /\b(theni)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Theni' },
    { pattern: /\b(tenkasi)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Tenkasi' },
    { pattern: /\b(tiruppur|tirupur)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Tiruppur' },
    { pattern: /\b(ranipet)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Ranipet' },
    { pattern: /\b(tirupattur|tirupathur)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Tirupattur' },
    { pattern: /\b(kallakurichi)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Kallakurichi' },
    { pattern: /\b(pondicherry|puducherry|pondy)(?:la|le|kku|ku|il|oda|laa)?\b/i, name: 'Puducherry' },
    { pattern: /\b(delhi|new delhi)\b/i, name: 'Delhi' },
    { pattern: /\b(mumbai|bombay)\b/i, name: 'Mumbai' },
    { pattern: /\b(bangalore|bengaluru)\b/i, name: 'Bengaluru' },
    { pattern: /\b(hyderabad)\b/i, name: 'Hyderabad' },
    { pattern: /\b(kolkata|calcutta)\b/i, name: 'Kolkata' },
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

// 🎯 Multilingual Conversational Intent Classifier & Domain Guardrail Engine
// Strictly filters queries into: 'WEATHER', 'GREETING', 'GRATITUDE', 'OFF_TOPIC'
export function classifyQueryIntent(query, hasImage = false) {
  if (hasImage) {
    return { intent: 'WEATHER', reason: 'image_vision' };
  }
  if (!query || typeof query !== 'string') {
    return { intent: 'GREETING', reason: 'empty_prompt' };
  }

  const q = query.trim();
  const qLower = q.toLowerCase();

  // 1. SOS & Disaster Emergency Helplines (Strict Priority 1)
  const sosPattern = /\b(sos|helpline|phone|emergency|collector|ambulance|police|fire|boat|tnsdma|1077|1070|112|108|101|பேரிடர் உதவி|அவசர உதவி|மீட்பு|ஆட்சியர்|துயர்)\b/i;
  if (sosPattern.test(qLower)) {
    return { intent: 'WEATHER', reason: 'disaster_sos' };
  }

  // 2. Weather & Meteorology Domain Keywords (Multilingual & Tanglish)
  const weatherKeywords = [
    // English
    'weather', 'rain', 'raining', 'rainy', 'rainfall', 'drizzle', 'shower', 'showers', 'pour', 'pouring',
    'precipitation', 'storm', 'storms', 'thunder', 'thunderstorm', 'lightning', 'cyclone', 'tornado', 'gale',
    'temp', 'temperature', 'humidity', 'humid', 'wind', 'winds', 'windy', 'breeze', 'gust', 'gusts',
    'heat', 'hot', 'warm', 'cold', 'cool', 'chill', 'chilly', 'sunny', 'sunshine', 'sun', 'cloud', 'clouds',
    'cloudy', 'overcast', 'umbrella', 'raincoat', 'fog', 'foggy', 'mist', 'smog', 'haze', 'aqi', 'air quality',
    'pollution', 'pressure', 'barometer', 'uv index', 'uv', 'forecast', 'radar', 'satellite', 'metar', 'taf',
    'aviation', 'flight', 'visibility', 'ceiling', 'crosswind', 'crop', 'crops', 'sowing', 'seed', 'seeds',
    'farm', 'farmer', 'farming', 'agriculture', 'irrigation', 'spray', 'paddy', 'soil moisture',
    'marine', 'sea state', 'sea', 'ocean', 'wave', 'waves', 'tide', 'tides', 'fisherman', 'fishermen',
    'monsoon', 'winter', 'summer', 'autumn', 'spring', 'climate', 'flood', 'floods', 'flooding', 'inundation',
    'waterlogging', 'waterlog', 'alert', 'warning', 'advisory', 'dew point', 'meteorology', 'meteorological',
    'celsius', 'fahrenheit',

    // Tamil Unicode
    'மழை', 'மழைக்காலம்', 'மழைத்துளி', 'தூறல்', 'கார்மேகம்', 'மேகம்', 'மேகமூட்டம்', 'வானிலை', 'தட்பவெப்பம்',
    'வெப்பநிலை', 'வெப்பம்', 'வெயில்', 'குளிர்', 'காற்று', 'காற்றின் வேகம்', 'காற்றழுத்தம்', 'ஈரப்பதம்',
    'புயல்', 'சூறாவளி', 'வெள்ளம்', 'இடி', 'மின்னல்', 'காற்றின் தரம்', 'விவசாயம்', 'விதை', 'பயிர்', 'பாசனம்',
    'உரம்', 'மருந்து தெளிப்பு', 'மீனவர்', 'கடல்', 'அலை', 'விமானம்', 'வானூர்தி', 'குடை', 'ரெயின்கோட்',
    'எச்சரிக்கை', 'பேரிடர்', 'பனி', 'பனிமூட்டம்', 'வெப்ப அலை', 'மழை வருமா', 'மழை பெய்யுமா', 'மழை பெய்யும்',
    'மழை இருக்கா', 'மழை வாய்ப்பு', 'வெயில் அடிக்குமா', 'எப்போ மழை', 'நாளை மழை', 'இன்று மழை',

    // Tanglish Romanized
    'mazhai', 'malai', 'mazha', 'thooral', 'kar megam', 'megam', 'megamootam', 'vaanilaye', 'vaanilai',
    'climate', 'weather', 'veppam', 'veppanilai', 'veyil', 'veiyil', 'kulir', 'kaathu', 'kaatru', 'kaathalavu',
    'eerapatham', 'puyal', 'vellam', 'idi', 'minnal', 'kaatru tharam', 'aqi', 'vivasayam', 'vivasaayam',
    'vidhai', 'vitha', 'vithai', 'payir', 'paasanam', 'uram', 'marundhu', 'meenavar', 'kadal', 'alai',
    'kudai', 'umbrella theva', 'umbrella thevaya', 'raincoat theva', 'peyyuma', 'peiyuma', 'peiyum', 'peyyum',
    'varuma', 'varum', 'irukkuma', 'erukkuma', 'adikkuma', 'adikkum', 'kottuma', 'oothe', 'ooru weather',
    'iniku climate', 'naalaikku mazhai', 'nalaiku mazhai', 'nalaiku weather', 'today weather', 'tomorrow weather',
    'weather epdi', 'climate epdi', 'weather sollunga', 'climate sollunga',

    // Hindi / Hinglish
    'मौसम', 'बारिश', 'वर्षा', 'बूंदाबांदी', 'बादल', 'धूप', 'ठंड', 'गर्मी', 'तापमान', 'आर्द्रता', 'हवा',
    'तूफान', 'चक्रवात', 'बाढ़', 'बिजली', 'वायु गुणवत्ता', 'प्रदूषण', 'खेती', 'फसल', 'बीज', 'सिंचाई',
    'खाद', 'मछुआरे', 'समुद्र', 'लहरें', 'छाता', 'रेनकोट', 'अलर्ट', 'चेतावनी', 'कोहरा', 'mausam', 'barish',
    'barsat', 'badal', 'dhoop', 'thand', 'garmi', 'hava', 'toofan', 'aandhi', 'fasal', 'kheti', 'chata',
    'kaisa mausam', 'barish hogi', 'barsaat',

    // Telugu
    'వాతావరణం', 'వర్షం', 'ఎండ', 'చలి', 'గాలి', 'తుఫాను', 'వరద', 'పిడుగు', 'మేఘాలు', 'వ్యవసాయం', 'పంట',
    'విత్తనాలు', 'చేపల వేట', 'సముద్రం', 'గొడుగు', 'మంచు', 'vaathavaranam', 'varsham',

    // Malayalam
    'കാലാവസ്ഥ', 'മഴ', 'വെയിൽ', 'തണുപ്പ്', 'കാറ്റ്', 'ചുഴലിക്കാറ്റ്', 'വെള്ളപ്പൊക്കം', 'ഇടിമിന്നൽ',
    'മേഘങ്ങൾ', 'കൃഷി', 'വിത്ത്', 'കുട', 'മഞ്ഞ്', 'kalavastha', 'mazha',

    // Kannada
    'ಹವಾಮಾನ', 'ಮಳೆ', 'ಬಿಸಿಲು', 'ಚಳಿ', 'ಗಾಳಿ', 'ಬಿರುಗಾಳಿ', 'ಪ್ರವಾಹ', 'ಮಿಂಚು', 'ಮೋಡ', 'ಕೃಷಿ', 'ಬೆಳೆ',
    'ಛತ್ರಿ', 'ಮಂಜು', 'havamana', 'male',

    // Bengali
    'আবহাওয়া', 'বৃষ্টি', 'রোদ', 'ঠান্ডা', 'গরম', 'বাতাস', 'ঝড়', 'ঘূর্ণিঝড়', 'বন্যা', 'মেঘ',
    'কৃষি', 'ফসল', 'ছাতা', 'কুয়াশা', 'abohawa', 'brishti',

    // Marathi
    'हवामान', 'पाऊस', 'ऊन', 'थंडी', 'वारा', 'वादळ', 'पूर', 'ढग', 'शेती', 'पीक', 'छत्री', 'धुके', 'havaman', 'paus',

    // Gujarati
    'હવામાન', 'વરસાદ', 'તાપમાન', 'પવન', 'વાવાઝોડું', 'વાદળ', 'ખેતી', 'છત્રી', 'ઝાકળ', 'havaman', 'varsad',

    // Punjabi
    'ਮੌਸਮ', 'ਮੀਂਹ', 'ਬਾਰਿਸ਼', 'ਹਵਾ', 'ਤੂਫ਼ਾਨ', 'ਬੱਦਲ', 'ਖੇਤੀ', 'ਫਸਲ', 'ਛਤਰੀ', 'ਧੁੰਦ', 'mausam', 'meeh',

    // French, Spanish, German, Italian, Russian
    'meteo', 'météo', 'pluie', 'temps', 'clima', 'tiempo', 'lluvia', 'wetter', 'regen', 'temperatura',
    'tempo', 'pioggia', 'pogoda', 'deszcz', 'погода', 'дождь'
  ];

  const hasWeatherKeyword = weatherKeywords.some((kw) => {
    if (kw.includes(' ')) {
      return qLower.includes(kw);
    }
    const regex = new RegExp(`(^|[^a-zA-Z0-9\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF\u0A80-\u0AFF\u0A00-\u0A7F])${kw}([^a-zA-Z0-9\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF\u0A80-\u0AFF\u0A00-\u0A7F]|$)`, 'i');
    return regex.test(qLower);
  });

  if (hasWeatherKeyword) {
    return { intent: 'WEATHER', reason: 'weather_keywords_found' };
  }

  // Check known city mentions with location inquiry indicators
  const knownCity = resolveTamilAndTanglishCityName(q);
  if (knownCity && /\b(in|at|for|near|la|le|kku|ku|epdi|irukku|erukku|status|report|how|kya|mein|ka)\b/i.test(qLower)) {
    return { intent: 'WEATHER', reason: 'city_weather_inquiry' };
  }

  // 3. Gratitude & Courtesies (Pure Gratitude without weather inquiry)
  const gratitudePatterns = [
    /\b(thank\s*you|thanks|thanku|thx|tysm|thank\s*u|thanks\s*a\s*lot|thanks\s*much|many\s*thanks)\b/i,
    /\b(nandri|romba\s*nandri|mikka\s*nandri|mika\s*nandri|nanri|thanks\s*pa|thanks\s*bro|thanks\s*da)\b/i,
    /(?:நன்றி|மிக்க நன்றி|ரொம்ப நன்றி|நன்றிகள்|நன்றிங்க|நன்றி பா)/,
    /\b(dhanyavad|dhanyavadamulu|dhanyawad|shukriya|bahut\s*dhanyavad)\b/i,
    /(?:धन्यवाद|बहुत धन्यवाद|शुक्रिया|ਧੰਨਵਾਦ|ಧನ್ಯವಾದಗಳು|ಧನ್ಯವಾದ|నమస్కారాలు|ధన్యవాదాలు|നന്ദി|ধন্যবাদ|આભાર)/,
    /\b(bye|goodbye|good\s*bye|see\s*you|tata|ta\s*ta|good\s*night|gn|poitu\s*varen|varata|alvida)\b/i,
    /\b(ok\s*thanks|seri\s*thanks|super\s*thanks|nice\s*thanks|got\s*it\s*thanks|super\s*bro|semma\s*bro|thank\s*you\s*so\s*much)\b/i
  ];

  if (gratitudePatterns.some((pattern) => pattern.test(qLower))) {
    return { intent: 'GRATITUDE', reason: 'gratitude_closing' };
  }

  // 4. Greetings & Salutations (Pure Greeting without weather inquiry)
  const greetingPatterns = [
    /^(hi|hello|hey|heyy|hii|hiii|hlo|hola|bonjour|namaste|namaskar|namaskaram|vanakkam|vaanakkam|vanakam|yo|sup|greetings)$/i,
    /^(hi|hello|hey|vanakkam|namaste|namaskar)\s+[\w\s]{0,20}$/i,
    /\b(good\s*morning|good\s*afternoon|good\s*evening|good\s*day)\b/i,
    /\b(how\s*are\s*you|how\s*r\s*u|who\s*are\s*you|who\s*r\s*u|what\s*is\s*your\s*name|what\s*are\s*you|tell\s*me\s*about\s*yourself|introduce\s*yourself|what\s*can\s*you\s*do|what\s*do\s*you\s*do)\b/i,
    /\b(epdi\s*irukinga|eppadi\s*irukinga|epdi\s*irukka|eppadi\s*iruka|nalama|neenga\s*yaaru|neenga\s*yar|yaaru\s*neenga|un\s*peru\s*enna|unga\s*name\s*enna|enna\s*panna\s*mudiyum|enna\s*seiya\s*mudiyum|enna\s*pannuva|introduce\s*pannu)\b/i,
    /(?:வணக்கம்|வணக்கங்கள்|ஹலோ|ஹாய்|நீ யார்|நீங்க யாரு|உன் பெயர் என்ன|உங்க பெயர் என்ன|எப்படி இருக்கீங்க|எப்படி இருக்க|நலமா|உன்னால் என்ன செய்ய முடியும்|என்ன உதவி செய்ய முடியும்)/,
    /(?:नमस्ते|नमस्कार|प्रणाम|हेलो|हाय|आप कौन हैं|तुम कौन हो|आपका नाम क्या है|आप क्या कर सकते हैं|कैसे हो|कैसे हैं आप|નમસ્તે|നമസ്കാരം|నమస్కారం|ನಮಸ್ಕಾರ|নমস্কার|ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ)/,
    /\b(kaisa\s*hai|kaise\s*ho|aap\s*kaun\s*ho|kya\s*kar\s*sakte\s*ho|ela\s*unnaru|meeru\s*evaru|sukhamano|hegiddeera|kemon\s*achen)\b/i,
    /^(test|testing|check|hi\s*there|hello\s*there)$/i
  ];

  if (greetingPatterns.some((pattern) => pattern.test(qLower))) {
    return { intent: 'GREETING', reason: 'salutation_greeting' };
  }

  // 5. If substantive non-weather query, classify as OFF_TOPIC
  return { intent: 'OFF_TOPIC', reason: 'non_weather_query' };
}

// 💬 Localized Greeting Responses (10 Languages + Tanglish)
export function getGreetingResponse(lang = 'en') {
  if (lang === 'ta') {
    return (
      `👋 **வணக்கம்!** நான் **WeatherGPT** - உங்கள் நேரலை வானிலை மற்றும் பேரிடர் முன்னறிவிப்பு AI உதவியாளர் 🌦️.\n\n` +
      `• 🌧️ **மழை வாய்ப்பு & கணிக்கப்பட்ட நேரம்**\n` +
      `• 🌡️ **வெப்பநிலை, காற்று & ஈரப்பதம்**\n` +
      `• 🌀 **புயல் & வெள்ள பேரிடர் எச்சரிக்கைகள்**\n` +
      `• 🌾 **விவசாய விதை & பயிர் வழிகாட்டுதல்**\n` +
      `• 🍃 **காற்றின் தரம் (AQI) & கடல்/விமான வானிலை**\n\n` +
      `உங்களுக்கு எந்த ஊரின் அல்லது பகுதியின் வானிலை நிலவரம் தேவை? தாராளமாகக் கேளுங்கள்!`
    );
  }

  if (lang === 'tanglish') {
    return (
      `👋 **Vanakkam!** Naan unga **WeatherGPT** - Live Weather & Disaster Forecast AI Assistant 🌦️.\n\n` +
      `• 🌧️ **Mazhai varuma & predicted timing**\n` +
      `• 🌡️ **Live temperature, veyil & humidity**\n` +
      `• 🌀 **Cyclone, flood & emergency alerts**\n` +
      `• 🌾 **Vivasaya vidhai & payir advisory**\n` +
      `• 🍃 **Kaatru tharam (AQI), marine & aviation METAR**\n\n` +
      `Ungalukku entha ooru-oda weather details theriyanum nu kelunga, accurate ah solren!`
    );
  }

  if (lang === 'hi') {
    return (
      `👋 **नमस्ते!** मैं **WeatherGPT** - आपका मौसम एवं आपदा पूर्वानुमान AI सहायक हूँ 🌦️।\n\n` +
      `• 🌧️ **सटीक वर्षा पूर्वानुमान एवं समय**\n` +
      `• 🌡️ **तापमान, धूप एवं आर्द्रता**\n` +
      `• 🌀 **चक्रवात, बाढ़ एवं मौसम चेतावनियाँ**\n` +
      `• 🌾 **कृषि, बीज एवं फसल परामर्श**\n` +
      `• 🍃 **वायु गुणवत्ता सूचकांक (AQI) एवं समुद्री स्थिति**\n\n` +
      `आप किस शहर या स्थान का मौसम जानना चाहते हैं? कृपया पूछें!`
    );
  }

  if (lang === 'te') {
    return (
      `👋 **నమస్కారం!** నేను **WeatherGPT** - మీ వాతావరణ మరియు విపత్తు నిర్వహణ AI అసిస్టెంట్ 🌦️.\n\n` +
      `• 🌧️ **వర్ష సూచన & సమయం**\n` +
      `• 🌡️ **ఉష్ణోగ్రత & తేమ**\n` +
      `• 🌀 **తుఫాను & వరద హెచ్చరికలు**\n` +
      `• 🌾 **వ్యవసాయం & పంట సలహాలు**\n` +
      `• 🍃 **గాలి నాణ్యత (AQI)**\n\n` +
      `మీకు ఏ ప్రదేశం యొక్క వాతావరణ వివరాలు కావాలో అడగండి!`
    );
  }

  if (lang === 'ml') {
    return (
      `👋 **നമസ്കാരം!** ഞാൻ **WeatherGPT** - നിങ്ങളുടെ കാലാവസ്ഥാ AI സഹായി 🌦️.\n\n` +
      `• 🌧️ **മഴ സാധ്യത & സമയം**\n` +
      `• 🌡️ **താപനില & കാറ്റിന്റെ വേഗത**\n` +
      `• 🌀 **ചുഴലിക്കാറ്റ് & ദുരന്ത മുന്നറിയിപ്പുകൾ**\n` +
      `• 🌾 **കാർഷിക ഉപദേശങ്ങൾ**\n\n` +
      `ഏത് സ്ഥലത്തെ കാലാവസ്ഥയാണ് അറിയേണ്ടത്? ചോദിക്കൂ!`
    );
  }

  if (lang === 'kn') {
    return (
      `👋 **ನಮಸ್ಕಾರ!** ನಾನು **WeatherGPT** - ನಿಮ್ಮ ಹವಾಮಾನ AI ಸಹಾಯಕ 🌦️.\n\n` +
      `• 🌧️ **ಮಳೆ ಮುನ್ಸೂಚನೆ & ಸಮಯ**\n` +
      `• 🌡️ **ತಾಪಮಾನ & ಆರ್ದ್ರತೆ**\n` +
      `• 🌀 **ಚಂಡಮಾರುತ & ವಿಪತ್ತು ಎಚ್ಚರಿಕೆಗಳು**\n` +
      `• 🌾 **ಕೃಷಿ & ಬೆಳೆ ಸಲಹೆಗಳು**\n\n` +
      `ಯಾವ ಊರಿನ ಹವಾಮಾನ ಮಾಹಿತಿ ಬೇಕು ಎಂದು ಕೇಳಿ!`
    );
  }

  if (lang === 'bn') {
    return (
      `👋 **নমস্কার!** আমি **WeatherGPT** - আপনার আবহাওয়া ও দুর্যোগ পূর্বাভাস এআই সহকারী 🌦️।\n\n` +
      `• 🌧️ **বৃষ্টির সম্ভাবনা ও সময়**\n` +
      `• 🌡️ **তাপমাত্রা ও আর্দ্রতা**\n` +
      `• 🌀 **ঘূর্ণিঝড় ও বন্যা সতর্কতা**\n` +
      `• 🌾 **কৃষি ও ফসল সংক্রান্ত পরামর্শ**\n\n` +
      `কোন জায়গার আবহাওয়া জানতে চান? জিজ্ঞাসা করুন!`
    );
  }

  if (lang === 'mr') {
    return (
      `👋 **नमस्कार!** मी **WeatherGPT** - आपला हवामान व आपत्ती व्यवस्थापन AI सहाय्यक 🌦️.\n\n` +
      `• 🌧️ **पाऊस अंदाज व वेळ**\n` +
      `• 🌡️ **तापमान व आर्द्रता**\n` +
      `• 🌀 **वादळ व पूर इशारे**\n` +
      `• 🌾 **कृषी व पीक सल्ला**\n\n` +
      `कोणत्या शहराचे किंवा गावाचे हवामान जाणून घ्यायचे आहे? विचारा!`
    );
  }

  if (lang === 'gu') {
    return (
      `👋 **નમસ્તે!** હું **WeatherGPT** - તમારો હવામાન AI સહાયક 🌦️.\n\n` +
      `• 🌧️ **વરસાદની આગાહી અને સમય**\n` +
      `• 🌡️ **તાપમાન અને ભેજ**\n` +
      `• 🌀 **વાવાઝોડાની ચેતવણી**\n` +
      `• 🌾 **કૃષિ અને પાક સલાહ**\n\n` +
      `તમે કયા સ્થળનું હવામાન જાણવા માંગો છો? પૂછો!`
    );
  }

  if (lang === 'pa') {
    return (
      `👋 **ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ!** ਮੈਂ **WeatherGPT** - ਤੁਹਾਡਾ ਮੌਸਮ AI ਸਹਾਇਕ 🌦️।\n\n` +
      `• 🌧️ **ਮੀਂਹ ਦੀ ਭਵਿੱਖਬਾਣੀ ਅਤੇ ਸਮਾਂ**\n` +
      `• 🌡️ **ਤਾਪਮਾਨ ਅਤੇ ਨਮੀ**\n` +
      `• 🌀 **ਤੂਫ਼ਾਨ ਦੀ ਚੇਤਾਵਨੀ**\n` +
      `• 🌾 **ਖੇਤੀਬਾੜੀ ਸਲਾਹ**\n\n` +
      `ਤੁਸੀਂ ਕਿਸ ਸ਼ਹਿਰ ਦਾ ਮੌਸਮ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ? ਪੁੱਛੋ!`
    );
  }

  // Default English
  return (
    `👋 **Hello!** I am **WeatherGPT**, your specialized Meteorological & Severe Disaster AI Assistant 🌦️.\n\n` +
    `• 🌧️ **Live Rain Probability & Precision Timing**\n` +
    `• 🌡️ **Temperature, Humidity & Atmospheric Trends**\n` +
    `• 🌀 **Cyclone, Flood & Emergency Disaster Warnings**\n` +
    `• 🌾 **Agricultural Crop, Seed & Sowing Advisories**\n` +
    `• 🍃 **Air Quality Index (AQI), Marine & Aviation METAR**\n\n` +
    `Which city, town, or location's weather would you like to explore today? Just ask in any language!`
  );
}

// 💖 Localized Gratitude Responses (10 Languages + Tanglish)
export function getGratitudeResponse(lang = 'en') {
  if (lang === 'ta') {
    return `மிக்க மகிழ்ச்சி! 😊 உங்களுக்கு வானிலை தொடர்பான வேறு ஏதேனும் தகவல்கள், மழை நிலவரம் அல்லது அவசர உதவிகள் தேவைப்பட்டால் எப்போது வேண்டுமானாலும் கேளுங்கள். பாதுகாப்பாக இருங்கள்! 🌦️✨`;
  }
  if (lang === 'tanglish') {
    return `Romba sandhosham! 😊 Vera edhavadhu weather updates, mazhai report, illa cyclone status theva patta kandippa kelunga. Stay safe and have a great day! 🌦️✨`;
  }
  if (lang === 'hi') {
    return `आपका बहुत-बहुत स्वागत है! 😊 अगर आपको मौसम, बारिश, वायु गुणवत्ता या अलर्ट से जुड़ी कोई और जानकारी चाहिए तो जरूर पूछें। सुरक्षित रहें और आपका दिन शुभ हो! 🌦️✨`;
  }
  if (lang === 'te') {
    return `చాలా ధన్యవాదాలు! 😊 మీకు వాతావరణం లేదా వర్షం గురించి మరిన్ని వివరాలు కావాలంటే ఎప్పుడైనా అడగండి. క్షేమంగా ఉండండి! 🌦️✨`;
  }
  if (lang === 'ml') {
    return `സ്വാഗതം! 😊 കൂടുതൽ കാലാവസ്ഥാ വിവരങ്ങൾക്ക് എപ്പോൾ വേണമെങ്കിലും ചോദിക്കാം. സുരക്ഷിതരായിരിക്കുക! 🌦️✨`;
  }
  if (lang === 'kn') {
    return `ಧನ್ಯವಾದಗಳು! 😊 ಹವಾಮಾನದ ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಯಾವಾಗ ಬೇಕಾದರೂ ಕೇಳಬಹುದು. ಸುರಕ್ಷಿತವಾಗಿರಿ! 🌦️✨`;
  }
  if (lang === 'bn') {
    return `আপনাকে অনেক ধন্যবাদ! 😊 আবহাওয়া সংক্রান্ত যেকোনো তথ্যের জন্য যেকোনো সময় জিজ্ঞাসা করতে পারেন। নিরাপদে থাকুন! 🌦️✨`;
  }
  if (lang === 'mr') {
    return `आपले मनापासून स्वागत! 😊 हवामानाबद्दल आणखी काही माहिती हवी असल्यास नक्की विचारा. सुरक्षित राहा! 🌦️✨`;
  }
  if (lang === 'gu') {
    return `આપનું ખૂબ ખૂબ સ્વાગત છે! 😊 હવામાન અંગેની વધુ માહિતી માટે ગમે ત્યારે પૂછી શકો છો. સુરક્ષિત રહો! 🌦️✨`;
  }
  if (lang === 'pa') {
    return `ਤੁਹਾਡਾ ਬਹੁਤ ਧੰਨਵਾਦ! 😊 ਮੌਸਮ ਸੰਬੰਧੀ ਕਿਸੇ ਵੀ ਜਾਣਕਾਰੀ ਲਈ ਕਦੇ ਵੀ ਪੁੱਛ ਸਕਦੇ ਹੋ। ਸੁਰੱਖਿਅਤ ਰਹੋ! 🌦️✨`;
  }
  return `You're very welcome! 😊 Feel free to ask anytime if you need weather forecasts, rain updates, agricultural climate guidance, or disaster alerts. Stay safe and have a wonderful day! 🌦️✨`;
}

// 🛡️ Localized Domain Guardrail Responses for Non-Weather Queries (10 Languages + Tanglish)
export function getOffTopicResponse(lang = 'en') {
  if (lang === 'ta') {
    return (
      `⚠️ **வானிலை தொடர்பான கேள்விகளை மட்டுமே கேட்கவும்:**\n\n` +
      `மன்னிக்கவும்! நான் ஒரு சிறப்பு **வானிலை, மழை மற்றும் பேரிடர் முன்னறிவிப்பு AI (WeatherGPT)** மட்டுமே 🌦️.\n\n` +
      `என்னால் வானிலை நிலவரம், மழை வாய்ப்பு, வெப்பநிலை, புயல்/வெள்ள எச்சரிக்கைகள், காற்றின் தரம் (AQI), விவசாயம், கடல்சார் மற்றும் விமானப் போக்குவரத்து வானிலை தொடர்பான கேள்விகளுக்கு மட்டுமே பதிலளிக்க முடியும்.\n\n` +
      `💡 **தயவுசெய்து ஏதேனும் ஒரு ஊரின் வானிலை அல்லது மழை நிலவரம் பற்றிக் கேளுங்கள்!**\n*(எ.கா: "சென்னையில் இன்று மழை வருமா?" அல்லது "மதுரையில் வெப்பநிலை எப்படி இருக்கும்?")*`
    );
  }

  if (lang === 'tanglish') {
    return (
      `⚠️ **Weather related kelvigal mattum kelunga:**\n\n` +
      `Mannikavum! Naan oru dedicated **Weather, Rain & Disaster Forecast AI (WeatherGPT)** mattum dhaan 🌦️.\n\n` +
      `Ennala live weather, mazhai vaippu, temperature, cyclone/flood alerts, kaatru tharam (AQI), vivasayam, and climate related questions-ku mattum dhaan accurate ah answer panna mudiyum.\n\n` +
      `💡 **Weather related ah edhavadhu kelunga!**\n*(Eg: "Chennai la iniku mazhai varuma?" illa "Madurai weather epdi irukku?")*`
    );
  }

  if (lang === 'hi') {
    return (
      `⚠️ **केवल मौसम संबंधी प्रश्न पूछें:**\n\n` +
      `क्षमा करें! मैं केवल एक समर्पित **मौसम, वर्षा एवं आपदा पूर्वानुमान AI (WeatherGPT)** हूँ 🌦️।\n\n` +
      `मैं केवल मौसम, बारिश की संभावना, तापमान, चक्रवात/बाढ़ अलर्ट, वायु गुणवत्ता (AQI) और कृषि मौसम सलाह से जुड़े प्रश्नों के उत्तर दे सकता हूँ।\n\n` +
      `💡 **कृपया किसी स्थान का मौसम या बारिश संबंधी प्रश्न पूछें!**\n*(उदा: "क्या आज दिल्ली में बारिश होगी?" या "मुंबई का तापमान क्या है?")*`
    );
  }

  if (lang === 'te') {
    return (
      `⚠️ **దయచేసి వాతావరణ సంబంధిత ప్రశ్నలు మాత్రమే అడగండి:**\n\n` +
      `నన్ను క్షమించండి! నేను ప్రత్యేకంగా **వాతావరణ మరియు విపత్తు నిర్వహణ AI (WeatherGPT)** మాత్రమే 🌦️.\n\n` +
      `వాతావరణం, వర్షం, ఉష్ణోగ్రత, గాలి నాణ్యత (AQI) లేదా తుఫాను హెచ్చరికలకు సంబంధించిన ప్రశ్నలను మాత్రమే అడగండి.`
    );
  }

  if (lang === 'ml') {
    return (
      `⚠️ **ദയവായി കാലാവസ്ഥ സംബന്ധമായ ചോദ്യങ്ങൾ മാത്രം ചോദിക്കുക:**\n\n` +
      `ക്ഷമിക്കണം! ഞാൻ ഒരു പ്രത്യേക **കാലാവസ്ഥാ AI (WeatherGPT)** മാത്രമാണ് 🌦️.\n\n` +
      `കാലാവസ്ഥ, മഴ സാധ്യത, താപനില, ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പുകൾ എന്നിവയെക്കുറിച്ച് മാത്രം ചോദിക്കുക.`
    );
  }

  if (lang === 'kn') {
    return (
      `⚠️ **ದಯವಿಟ್ಟು ಹವಾಮಾನ ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಗಳನ್ನು ಮಾತ್ರ ಕೇಳಿ:**\n\n` +
      `ಕ್ಷಮಿಸಿ! ನಾನು ಕೇವಲ **ಹವಾಮಾನ ಮತ್ತು ವಿಪತ್ತು AI (WeatherGPT)** ಆಗಿದ್ದೇನೆ 🌦️.\n\n` +
      `ಹವಾಮಾನ, ಮಳೆ, ತಾಪಮಾನ ಅಥವಾ ಚಂಡಮಾರುತಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳನ್ನು ಮಾತ್ರ ಕೇಳಿ.`
    );
  }

  if (lang === 'bn') {
    return (
      `⚠️ **অনুগ্রহ করে কেবল আবহাওয়া সংক্রান্ত প্রশ্ন জিজ্ঞাসা করুন:**\n\n` +
      `ক্ষমা করবেন! আমি একটি নিবেদিত **আবহাওয়া এআই (WeatherGPT)** 🌦️।\n\n` +
      `কেবল আবহাওয়া, বৃষ্টিপাত, তাপমাত্রা, বায়ুমান বা দুর্যোগ সতর্কতা সংক্রান্ত প্রশ্ন জিজ্ঞাসা করুন।`
    );
  }

  if (lang === 'mr') {
    return (
      `⚠️ **कृपया केवळ हवामान संबंधित प्रश्न विचारा:**\n\n` +
      `माफ करा! मी केवळ एक समर्पित **हवामान AI (WeatherGPT)** आहे 🌦️।\n\n` +
      `हवामान, पाऊस, तापमान किंवा आपत्ती इशाऱ्यांशी संबंधित प्रश्न विचारा.`
    );
  }

  if (lang === 'gu') {
    return (
      `⚠️ **કૃપા કરીને માત્ર હવામાન સંબંધિત પ્રશ્નો પૂછો:**\n\n` +
      `માફ કરશો! હું માત્ર એક સમર્પિત **હવામાન AI (WeatherGPT)** છું 🌦️.\n\n` +
      `હવામાન, વરસાદ અથવા વાવાઝોડા સંબંધિત પ્રશ્નો પૂછો.`
    );
  }

  if (lang === 'pa') {
    return (
      `⚠️ **ਕਿਰਪਾ ਕਰਕੇ ਸਿਰਫ਼ ਮੌਸਮ ਸੰਬੰਧੀ ਸਵਾਲ ਪੁੱਛੋ:**\n\n` +
      `ਮਾਫ਼ ਕਰਨਾ! ਮੈਂ ਸਿਰਫ਼ ਇੱਕ ਸਮਰਪਿਤ **ਮੌਸਮ AI (WeatherGPT)** ਹਾਂ 🌦️।\n\n` +
      `ਕਿਰਪਾ ਕਰਕੇ ਮੌਸਮ, ਮੀਂਹ ਜਾਂ ਤੂਫ਼ਾਨ ਸੰਬੰਧੀ ਸਵਾਲ ਪੁੱਛੋ।`
    );
  }

  return (
    `⚠️ **Weather & Meteorology Inquiries Only:**\n\n` +
    `I apologize! As **WeatherGPT**, I am a specialized AI Assistant dedicated strictly to **Meteorology, Weather Forecasting, Rain Predictions, Climate Analytics, and Severe Disaster Early Warnings** 🌦️.\n\n` +
    `I can only assist with weather forecasts, rain probabilities, storm alerts, air quality (AQI), agricultural climate advisories, marine sea states, and aviation briefings in any language.\n\n` +
    `💡 **Please ask a weather-related question for any location!**\n*(e.g., "Will it rain in Chennai today?" or "What is the temperature in Delhi?")*`
  );
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
  async processQuery({ query = '', currentLocation, previousLocation = null, activeLanguage = 'en', image = null, mimeType = 'image/jpeg' }) {
    try {
      const rawQ = query.trim();
      const q = rawQ.replace(/\.{2,}/g, ' ').replace(/\s+/g, ' ').trim();
      const effectiveLang = detectLanguageFromQuery(q || 'weather report', activeLanguage);
      const isTanglish = effectiveLang === 'tanglish';
      const targetLangForData = isTanglish ? 'ta' : effectiveLang;

      // 🛑 STRICT CONVERSATIONAL INTENT & DOMAIN GUARDRAILS
      const { intent } = classifyQueryIntent(q, !!image);

      if (intent === 'GREETING') {
        const greetingText = getGreetingResponse(effectiveLang);
        dbService.insertChatLog({
          sessionId: `sql_sess_${Date.now()}`,
          sender: 'ai',
          text: greetingText,
          detectedLanguage: effectiveLang,
          modelUsed: 'WeatherGPT AI Assistant',
          locationName: null,
          hasImage: false
        });
        return {
          text: greetingText,
          location: null,
          domain: 'general',
          timeframe: 'current',
          detectedLanguage: effectiveLang,
          weatherData: null,
          aqiData: null,
          alerts: [],
          modelUsed: 'WeatherGPT AI Assistant',
          isWeatherQuery: false,
          sources: ['WeatherGPT Meteorological Assistant']
        };
      }

      if (intent === 'GRATITUDE') {
        const gratitudeText = getGratitudeResponse(effectiveLang);
        dbService.insertChatLog({
          sessionId: `sql_sess_${Date.now()}`,
          sender: 'ai',
          text: gratitudeText,
          detectedLanguage: effectiveLang,
          modelUsed: 'WeatherGPT AI Assistant',
          locationName: null,
          hasImage: false
        });
        return {
          text: gratitudeText,
          location: null,
          domain: 'general',
          timeframe: 'current',
          detectedLanguage: effectiveLang,
          weatherData: null,
          aqiData: null,
          alerts: [],
          modelUsed: 'WeatherGPT AI Assistant',
          isWeatherQuery: false,
          sources: ['WeatherGPT Meteorological Assistant']
        };
      }

      if (intent === 'OFF_TOPIC') {
        const offTopicText = getOffTopicResponse(effectiveLang);
        dbService.insertChatLog({
          sessionId: `sql_sess_${Date.now()}`,
          sender: 'ai',
          text: offTopicText,
          detectedLanguage: effectiveLang,
          modelUsed: 'WeatherGPT Domain Guardrail',
          locationName: null,
          hasImage: false
        });
        return {
          text: offTopicText,
          location: null,
          domain: 'general',
          timeframe: 'current',
          detectedLanguage: effectiveLang,
          weatherData: null,
          aqiData: null,
          alerts: [],
          modelUsed: 'WeatherGPT Domain Guardrail',
          isWeatherQuery: false,
          sources: ['WeatherGPT Domain Guardrail']
        };
      }

      // If device is offline / tower down, use Edge AI Disaster Vault immediately
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const offlineResult = offlineVaultService.processOfflineQuery(q, effectiveLang, currentLocation, previousLocation);
        return {
          text: offlineResult.text,
          detectedLanguage: effectiveLang,
          modelUsed: '📡 Offline Disaster Edge AI (Zero Tower Signal)',
          isOffline: true,
          isWeatherQuery: offlineResult.isWeatherQuery !== false,
          sources: ['Offline Disaster Vault', 'TNSDMA Emergency Protocols']
        };
      }

      // Proceed with Weather-Specific Query Execution
      const { domain, timeframe, isRainInquiry } = this.extractQueryContext(q, currentLocation);
      const targetLocation = await this.resolveLocationFromQuery(q, previousLocation || currentLocation);

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

      // Save live snapshot into local offline disaster vault
      offlineVaultService.saveLiveWeatherSnapshot(targetLocation, nwpData, aqiData, alerts);

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
CRITICAL DOMAIN RULES:
1. You ONLY answer queries related to weather, rainfall, storm, cyclone, flood, temperatures, winds, humidity, cloud formations, air quality (AQI), disaster early warnings, agriculture/crop climate advisories, marine sea states, and aviation briefings.
2. If the user asks a completely non-weather question (e.g. coding, history, politics, cinema, math, recipes), politely decline in the detected language (${effectiveLang}) stating that you are WeatherGPT and only answer weather questions.
3. For weather inquiries in ANY language, provide rich, accurate, and actionable meteorological guidance based on the live station data below.

Location: ${locName}
Current Temperature: ${temp}°C (Feels like: ${current.apparent_temperature || temp}°C)
Humidity: ${humidity}%
Wind Speed: ${wind} km/h (Direction: ${current.wind_direction_10m || 0}°)
Rain Probability: ${rainProb}% | Accumulation: ${daily?.precipitation_sum?.[0] || 0} mm
AQI: ${aqi} (US AQI Standard)
Alert Status: ${alerts[0]?.title || 'Normal Stable Weather'}`;

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
        isWeatherQuery: true,
        sources: [
          'Open-Meteo High-Resolution NWP (GFS / WRF / ECMWF)',
          'WAQI Global Air Quality Telemetry',
          'RainViewer Real-Time Radar & Satellite GIS Stream'
        ]
      };
    } catch (err) {
      console.warn('Network / Tower outage during AI query, switching to Offline Disaster Vault:', err);
      const effectiveLang = detectLanguageFromQuery(query || '', activeLanguage);
      const offlineResult = offlineVaultService.processOfflineQuery(query, effectiveLang, currentLocation, previousLocation);
      return {
        text: offlineResult.text,
        detectedLanguage: effectiveLang,
        modelUsed: '📡 Offline Disaster Edge AI (Network / Tower Outage)',
        isOffline: true,
        isWeatherQuery: offlineResult.isWeatherQuery !== false,
        sources: ['Offline Disaster Vault', 'TNSDMA Emergency Protocols']
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

    // 📆 Real-time Dynamic Date & Day Calculation
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const dayNamesTa = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
    const monthNamesTa = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const todayDateTa = `${dayNamesTa[now.getDay()]}, ${now.getDate()} ${monthNamesTa[now.getMonth()]}`;
    const tomorrowDateTa = `${dayNamesTa[tomorrow.getDay()]}, ${tomorrow.getDate()} ${monthNamesTa[tomorrow.getMonth()]}`;
    const todayDateEn = `${dayNamesEn[now.getDay()]}, ${now.getDate()} ${monthNamesEn[now.getMonth()]}`;
    const tomorrowDateEn = `${dayNamesEn[tomorrow.getDay()]}, ${tomorrow.getDate()} ${monthNamesEn[tomorrow.getMonth()]}`;

    // 🌟 Special Language: TANGLISH (Conversational Tamil in English letters)
    if (lang === 'tanglish') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `👋 **Kandippa! ${locName}-la innaiku (${todayDateTa}) mazhai theerpu & timing idho:**\n\n` +
            `🌧️ **Mazhai Theerpu: Aam (YES - Mazhai Kandippa Peyyum! 🌧️)**\n` +
            `• ⏰ **Kaanikkapatta Neram (Predicted Time):** ${rainCalc.predictedTimingTa}\n` +
            `• 📊 **Mazhai Vaippu:** ${rainCalc.maxProb}% | **Ethirpaarkappadum Alavu:** ~${rainCalc.totalPrecip} mm\n` +
            `• 🌡️ **Tharpodhaya Nilai:** ${wmo.label} (${temp}°C, Feel aaguradhu ${feels}°C)\n` +
            `• 💧 **Eerapatham:** ${humidity}% | **Kaatru Vegam:** ${wind} km/h\n` +
            `• 💡 **Mukkiya Advice:** Veliya kelambura appo kandippa Kudai (Umbrella) allathu Raincoat eduthuttu ponga!`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `👋 **Kandippa! ${locName}-la innaiku (${todayDateTa}) mazhai status idho:**\n\n` +
            `🌦️ **Mazhai Theerpu: Vaippu Irukku (MAYBE - Lesana Thooral / Megamootam 🌦️)**\n` +
            `• ⏰ **Kaanikkapatta Neram (Predicted Time):** ${rainCalc.predictedTimingTa}\n` +
            `• 📊 **Mazhai Vaippu:** ${rainCalc.maxProb}% | **Ethirpaarkappadum Alavu:** ~${rainCalc.totalPrecip} mm\n` +
            `• 🌡️ **Tharpodhaya Nilai:** ${wmo.label} (${temp}°C, Feel aaguradhu ${feels}°C)\n` +
            `• 💧 **Eerapatham:** ${humidity}% | **Kaatru Vegam:** ${wind} km/h\n` +
            `• 💡 **Advice:** Sila idangalil lesana thooral varalaam. Veli velai irundha pathu thittam pottukonga.`
          );
        } else {
          return (
            `👋 **Kandippa! ${locName}-la innaiku (${todayDateTa}) mazhai status idho:**\n\n` +
            `☀️ **Mazhai Theerpu: Illai (NO - Mazhai Peyya Vaippu Illai! ☀️)**\n` +
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
          `🌾 **Vanakkam! ${locName} vivasaya & vidhaippu valikaatti (Farmer Climate Advice):**\n\n` +
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
          `👋 **Kandippa! ${locName}-la naalaiya (${tomorrowDateTa}) weather forecast idho:**\n\n` +
          `• ☀️ **Adhigabatcha Veppam:** ${tomorrowTempMax}°C\n` +
          `• 🌧️ **Mazhai Peyya Vaippu:** ${tomorrowRainProb}%\n` +
          `• 💨 **Kaatru Vegam:** ${wind} km/h | **Kaatru Tharam (AQI):** ${aqi}\n` +
          `• 💡 **Advice:** ${tomorrowRainProb >= 50 ? 'Nalaiku veliya porappa kudai eduthuttu ponga.' : 'Nalaiku climate steady ah nalla irukum.'}\n` +
          `• 🛡️ **Echarikkai Nilai:** ${topAlert?.title || 'Iyalbaana Vaanilai'}`
        );
      }

      return (
        `👋 **Kandippa! ${locName}-la innaiku (${todayDateTa}) live weather update idho:**\n\n` +
        `• 🌡️ **Vaanilai Nilai:** ${wmo.label} (${temp}°C, Feel aaguradhu ${feels}°C)\n` +
        `• 🌧️ **Mazhai Vaippu:** ${rainProb}% ${rainProb >= 50 ? '(Mazhai peyya vaaipu irukku 🌧️)' : '(Mazhai vaippu kuraivu ☀️)'}\n` +
        `• 💧 **Eerapatham:** ${humidity}% | **Kaatru Vegam:** ${wind} km/h\n` +
        `• 🍃 **Kaatru Tharam (AQI):** ${aqi}\n` +
        `• 📆 **Naalai (${tomorrowDateTa}):** Veppam ~${tomorrowTempMax}°C | Mazhai ~${tomorrowRainProb}%\n` +
        `• 💡 **Advice:** ${topAlert?.message || (rainProb >= 50 ? 'Mazhai vara vaaipu irukku, kudai eduthukonga.' : 'Climate nallave irukku, veli velai thairiyama seyyalaam.')}`
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
          `👋 **நிச்சயமாக! ${locName} பகுதிக்கான நாளைய (${tomorrowDateTa}) வானிலை முன்னறிவிப்பு:**\n\n` +
          `• ☀️ **அதிகபட்ச வெப்பநிலை:** ${tomorrowTempMax}°C\n` +
          `• 🌧️ **மழை பெய்வதற்கான வாய்ப்பு:** ${tomorrowRainProb}%\n` +
          `• 💨 **காற்றின் வேகம்:** ${wind} கி.மீ/மணி | **காற்று தரம் (AQI):** ${aqi}\n` +
          `• 💡 **பாதுகாப்பு குறிப்பு:** ${tomorrowRainProb >= 50 ? 'நாளை வெளியே செல்லும்போது மறக்காமல் குடை எடுத்துச் செல்லவும்.' : 'வானிலை பொதுவாக இயல்பாக நிலவும்.'}\n` +
          `• 🛡️ **வானிலை எச்சரிக்கை நிலை:** ${topAlert?.title || 'இயல்பு'}`
        );
      }
      return (
        `👋 **நிச்சயமாக! ${locName} பகுதிக்கான இன்றைய (${todayDateTa}) நேரலை வானிலை தகவல்:**\n\n` +
        `• 🌡️ **வானிலை நிலை:** ${wmo.label} (${temp}°C, உணரப்படும் வெப்பம் ${feels}°C)\n` +
        `• 🌧️ **மழை வாய்ப்பு:** ${rainProb}% | **காற்று தரம் (AQI):** ${aqi}\n` +
        `• 💧 **ஈரப்பதம்:** ${humidity}% | **காற்றின் வேகம்:** ${wind} கி.மீ/மணி\n` +
        `• 📆 **நாளை (${tomorrowDateTa}):** அதிகபட்சம் ~${tomorrowTempMax}°C | மழை வாய்ப்பு ~${tomorrowRainProb}%\n` +
        `• 💡 **ஆலோசனை:** ${topAlert?.message || (rainProb >= 50 ? 'மழைக்கு வாய்ப்பு உள்ளது, குடை எடுத்துச் செல்லவும்.' : 'வானிலை சீராக உள்ளது, பணிகளைத் தடையின்றித் திட்டமிடலாம்.')}`
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
        `👋 **Sure! Here is the tomorrow forecast for ${locName} (${tomorrowDateEn}):**\n\n` +
        `• ☀️ **Expected Maximum Temperature:** ${tomorrowTempMax}°C\n` +
        `• 🌧️ **Precipitation Probability:** ${tomorrowRainProb}%\n` +
        `• 💨 **Sustained Winds:** ${wind} km/h | **Air Quality Index:** ${aqi} (US AQI)\n` +
        `• 💡 **Advisory:** ${tomorrowRainProb >= 50 ? 'Rain gear recommended when heading outside.' : 'Ambient conditions steady and favorable for outdoor activities.'}\n` +
        `• 🛡️ **Disaster & Alert Status:** ${topAlert?.title || 'Normal Stable Conditions'}`
      );
    }

    return (
      `👋 **Sure! Here is the real-time meteorological briefing for ${locName} (${todayDateEn}):**\n\n` +
      `• 🌡️ **Current Sky & Condition:** ${wmo.label} at **${temp}°C** (Feels like **${feels}°C**)\n` +
      `• 🌧️ **Precipitation Outlook:** **${rainProb}%** probability today\n` +
      `• 💧 **Atmospheric Moisture:** Relative Humidity **${humidity}%** | Pressure **${current.pressure_msl || 1013} hPa**\n` +
      `• 💨 **Wind Dynamics:** **${wind} km/h** from ${current.wind_direction_10m || 0}°\n` +
      `• 🍃 **Air Quality & UV:** AQI **${aqi}** | UV Index **${current.uv_index || 5}**\n` +
      `• 📆 **Tomorrow (${tomorrowDateEn}):** Max ~${tomorrowTempMax}°C | Rain ~${tomorrowRainProb}%\n` +
      `• 💡 **Advisory:** ${topAlert?.message || (rainProb >= 50 ? 'Rain expected in the region, keep an umbrella handy.' : 'Clear and steady weather conditions.')}`
    );
  }
}

export const weatherAI = new WeatherAIAgent();
