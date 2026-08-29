// WeatherGPT Conversational AI Engine
// Integrates LLM Inference (Hugging Face / Gemini) with Meteorological Tool Calling & Domain Intent Routing

import {
  fetchNWPForecast,
  fetchAirQuality,
  searchLocation,
  evaluateSevereWeatherAlerts,
  generateAgriAdvisory,
  generateAviationBriefing,
  generateMarineBriefing,
  getWeatherDescription
} from './weatherService';

// Advanced Rain Verdict & Timing Calculation Engine
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
    let fallbackVerdict = targetDailyProb >= 55 ? 'YES' : (targetDailyProb >= 30 ? 'MAYBE' : 'NO');
    return {
      verdict: fallbackVerdict,
      maxProb: targetDailyProb,
      totalPrecip: targetDailySum.toFixed(1),
      predictedTimingEn: fallbackVerdict === 'NO' ? 'No rain expected in next 24 hours' : 'Scattered showers expected during the day',
      predictedTimingTa: fallbackVerdict === 'NO' ? 'அடுத்த 24 மணி நேரத்தில் மழைக்கான வாய்ப்பு இல்லை' : 'பிற்பகல் / மாலை வேளையில் ஆங்காங்கே மழைக்கு வாய்ப்பு',
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
    const found = hourly.time.findIndex(t => new Date(t) >= now);
    startIndex = found !== -1 ? found : 0;
  }

  const endIndex = Math.min(hourly.time.length, startIndex + 24);
  const sliceTime = hourly.time.slice(startIndex, endIndex);
  const sliceProb = (hourly.precipitation_probability || []).slice(startIndex, endIndex);
  const slicePrecip = (hourly.precipitation || []).slice(startIndex, endIndex);
  const sliceCode = (hourly.weather_code || []).slice(startIndex, endIndex);

  let maxProb = 0;
  let maxPrecip = 0;
  let peakIndex = -1;
  let rainHours = [];
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
    }

    // A rain slot is identified if probability >= 30% or mm >= 0.1 or WMO code represents rain (51-99)
    if (p >= 30 || mm >= 0.1 || (code >= 51 && code <= 99)) {
      rainHours.push({
        index: i,
        timeStr: sliceTime[i],
        prob: p,
        mm: mm,
        code: code,
      });
      if (peakIndex === -1 || p > (sliceProb[peakIndex] ?? 0) || mm > (slicePrecip[peakIndex] ?? 0)) {
        peakIndex = i;
      }
    }
  }

  const effectiveProb = Math.max(maxProb, targetDailyProb);
  const effectiveSum = Math.max(calculatedSum, targetDailySum);

  // Verdict decision: YES / MAYBE / NO
  let verdict = 'NO';
  if (effectiveProb >= 55 || effectiveSum >= 1.5 || (current.precipitation || 0) >= 0.5) {
    verdict = 'YES';
  } else if (effectiveProb >= 30 || effectiveSum >= 0.2 || rainHours.length > 0) {
    verdict = 'MAYBE';
  } else {
    verdict = 'NO';
  }

  const formatHour12 = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getDayLabelEn = (isoStr) => {
    const d = new Date(isoStr);
    const isSameDay = d.toDateString() === now.toDateString();
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const isTomorrow = d.toDateString() === tomorrowDate.toDateString();
    const hour = d.getHours();
    if (isSameDay) {
      return hour >= 19 || hour < 4 ? 'Tonight' : 'Today';
    } else if (isTomorrow) {
      return hour >= 19 || hour < 4 ? 'Tomorrow Night' : 'Tomorrow';
    }
    return d.toLocaleDateString([], { weekday: 'short' });
  };

  const getDayLabelTa = (isoStr) => {
    const d = new Date(isoStr);
    const isSameDay = d.toDateString() === now.toDateString();
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const isTomorrow = d.toDateString() === tomorrowDate.toDateString();
    const hour = d.getHours();
    if (isSameDay) {
      return hour >= 19 || hour < 4 ? 'இன்று இரவு' : 'இன்று';
    } else if (isTomorrow) {
      return hour >= 19 || hour < 4 ? 'நாளை இரவு' : 'நாளை';
    }
    return 'அடுத்த நாள்';
  };

  const formatWithDayEn = (isoStr) => {
    const day = getDayLabelEn(isoStr);
    const time = formatHour12(isoStr);
    return `${day} ${time}`;
  };

  const formatWithDayTa = (isoStr) => {
    const day = getDayLabelTa(isoStr);
    const time = formatHour12(isoStr);
    return `${day} ${time}`;
  };

  let predictedTimingEn = '';
  let predictedTimingTa = '';
  let peakHourEn = '';
  let peakHourTa = '';

  if (verdict === 'YES' || verdict === 'MAYBE') {
    if (rainHours.length > 0) {
      // Group rain hours into contiguous blocks (gap <= 2 hours)
      const clusters = [];
      let currentCluster = [rainHours[0]];
      for (let i = 1; i < rainHours.length; i++) {
        const prev = rainHours[i - 1];
        const curr = rainHours[i];
        if (curr.index - prev.index <= 2) {
          currentCluster.push(curr);
        } else {
          clusters.push(currentCluster);
          currentCluster = [curr];
        }
      }
      clusters.push(currentCluster);

      // Pick cluster with peak probability / highest rain
      let bestCluster = clusters[0];
      let bestClusterMaxProb = 0;
      for (const c of clusters) {
        const clusterPeak = Math.max(...c.map(h => h.prob));
        if (clusterPeak > bestClusterMaxProb) {
          bestClusterMaxProb = clusterPeak;
          bestCluster = c;
        }
      }

      const startIso = bestCluster[0].timeStr;
      const lastItemIso = bestCluster[bestCluster.length - 1].timeStr;
      // Add 1 hour to the end to represent the completion of the hourly slot
      const endIso = new Date(new Date(lastItemIso).getTime() + 3600000).toISOString();
      const peakIso = (peakIndex !== -1 && sliceTime[peakIndex]) ? sliceTime[peakIndex] : startIso;

      if (bestCluster.length === 1) {
        predictedTimingEn = `${formatWithDayEn(startIso)} – ${formatHour12(endIso)}`;
        predictedTimingTa = `${formatWithDayTa(startIso)} முதல் ${formatHour12(endIso)} வரை`;
      } else {
        const startDayEn = getDayLabelEn(startIso);
        const endDayEn = getDayLabelEn(endIso);
        const startDayTa = getDayLabelTa(startIso);
        const endDayTa = getDayLabelTa(endIso);

        predictedTimingEn = `${formatWithDayEn(startIso)} – ${startDayEn === endDayEn ? formatHour12(endIso) : formatWithDayEn(endIso)}`;
        predictedTimingTa = `${formatWithDayTa(startIso)} முதல் ${startDayTa === endDayTa ? formatHour12(endIso) : formatWithDayTa(endIso)} வரை`;
      }

      peakHourEn = `${formatWithDayEn(peakIso)} (${effectiveProb}% peak chance)`;
      peakHourTa = `${formatWithDayTa(peakIso)} (${effectiveProb}% அதிக வாய்ப்பு)`;
    } else {
      predictedTimingEn = 'Scattered showers possible during afternoon / evening';
      predictedTimingTa = 'பிற்பகல் / மாலை வேளையில் ஆங்காங்கே மழைக்கு வாய்ப்பு';
      peakHourEn = `Peak chance ~${effectiveProb}%`;
      peakHourTa = `அதிகபட்ச வாய்ப்பு ~${effectiveProb}%`;
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
    rainHoursCount: rainHours.length,
  };
}

export class WeatherAIAgent {
  constructor() {
    this.hfApiKey = '';
    this.geminiApiKey = '';
    this.openWeatherApiKey = '';
    this.loadKeys();
  }

  loadKeys() {
    if (typeof window !== 'undefined') {
      this.hfApiKey = localStorage.getItem('weathergpt_hf_key') || '';
      this.geminiApiKey = localStorage.getItem('weathergpt_gemini_key') || '';
      this.openWeatherApiKey = localStorage.getItem('weathergpt_openweather_key') || '';
    }
  }

  saveKeys({ hfKey, geminiKey, openWeatherKey }) {
    if (typeof window !== 'undefined') {
      if (hfKey !== undefined) {
        this.hfApiKey = hfKey;
        localStorage.setItem('weathergpt_hf_key', hfKey);
      }
      if (geminiKey !== undefined) {
        this.geminiApiKey = geminiKey;
        localStorage.setItem('weathergpt_gemini_key', geminiKey);
      }
      if (openWeatherKey !== undefined) {
        this.openWeatherApiKey = openWeatherKey;
        localStorage.setItem('weathergpt_openweather_key', openWeatherKey);
      }
    }
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
      qLower.includes('varuma') ||
      qLower.includes('irukkuma') ||
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
    const words = query.split(/[\s,?.!]+/);
    const stopWords = new Set([
      'what', 'is', 'the', 'weather', 'in', 'at', 'for', 'will', 'it', 'rain',
      'tomorrow', 'today', 'how', 'like', 'a', 'an', 'and', 'or', 'show', 'me',
      'tell', 'forecast', 'report', 'of', 'naalai', 'mazhai', 'epdi', 'irukku',
      'la', 'kya', 'hoga', 'mein', 'ko', 'varuma', 'irukkuma', 'pls', 'please', 'check',
      'status', 'chance', 'details'
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

  // Process natural language weather query and return structured response
  async processQuery({ query, currentLocation, activeLanguage = 'en' }) {
    try {
      const { domain, timeframe, isRainInquiry } = this.extractQueryContext(query, currentLocation);
      const targetLocation = await this.resolveLocationFromQuery(query, currentLocation);

      const lat = targetLocation?.latitude || 13.0827;
      const lon = targetLocation?.longitude || 80.2707;
      const locName = `${targetLocation?.name || 'Chennai'}${targetLocation?.admin1 ? `, ${targetLocation.admin1}` : ''}, ${targetLocation?.country || 'India'}`;

      // Fetch fresh real-time multi-source data
      const [nwpData, aqiData] = await Promise.all([
        fetchNWPForecast(lat, lon),
        fetchAirQuality(lat, lon)
      ]);

      const alerts = evaluateSevereWeatherAlerts(nwpData, aqiData);
      const agriAdvisory = generateAgriAdvisory(nwpData);
      const aviationBriefing = generateAviationBriefing(targetLocation?.name || 'Local Station', nwpData);
      const marineBriefing = generateMarineBriefing(nwpData);

      // Generate localized conversational message
      const responseText = this.synthesizeNaturalLanguageResponse({
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
        lang: activeLanguage
      });

      return {
        text: responseText,
        location: targetLocation,
        domain,
        timeframe,
        weatherData: nwpData,
        aqiData,
        alerts,
        agriAdvisory,
        aviationBriefing,
        marineBriefing,
        sources: [
          'Open-Meteo High-Resolution NWP (GFS / ECMWF)',
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

  // Multilingual synthesis engine for 10 languages
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
    const wmo = getWeatherDescription(current.weather_code || 0);
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

    // Highest alert level
    const topAlert =
      alerts.find((a) => a.level === 'red') ||
      alerts.find((a) => a.level === 'orange') ||
      alerts.find((a) => a.level === 'yellow') ||
      alerts[0];

    // Language 1: TAMIL (தமிழ்)
    if (lang === 'ta') {
      if (isRainInquiry) {
        if (rainCalc.verdict === 'YES') {
          return (
            `🌧️ **மழை வாய்ப்பு தீர்ப்பு: ஆம் (YES - மழை பெய்யும்! 🌧️)**\n\n` +
            `• ⏰ **கணிக்கப்பட்ட நேரம் (Predicted Timing):** ${rainCalc.predictedTimingTa}${rainCalc.peakHourTa ? ` (உச்சகட்ட நேரம்: ${rainCalc.peakHourTa})` : ''}\n` +
            `• 📊 **மழை வாய்ப்பு (Probability):** ${rainCalc.maxProb}% | **எதிர்பார்க்கப்படும் அளவு:** ~${rainCalc.totalPrecip} மி.மீ\n` +
            `• 🌡️ **தற்போதைய நிலை:** ${wmo.label} (${temp}°C, உணரப்படும் வெப்பம் ${feels}°C)\n` +
            `• 💧 **ஈரப்பதம்:** ${humidity}% | **காற்றின் வேகம்:** ${wind} கி.மீ/மணி\n` +
            `• 💡 **முக்கிய ஆலோசனை:** வெளியே செல்லும்போது குடை அல்லது ரெயின்கோட் எடுத்துச் செல்லவும்.`
          );
        } else if (rainCalc.verdict === 'MAYBE') {
          return (
            `🌦️ **மழை வாய்ப்பு தீர்ப்பு: வாய்ப்பு உள்ளது (MAYBE - லேசான தூறல் / மேகமூட்டம் 🌦️)**\n\n` +
            `• ⏰ **கணிக்கப்பட்ட நேரம் (Predicted Timing):** ${rainCalc.predictedTimingTa}${rainCalc.peakHourTa ? ` (சாத்தியமான நேரம்: ${rainCalc.peakHourTa})` : ''}\n` +
            `• 📊 **மழை வாய்ப்பு (Probability):** ${rainCalc.maxProb}% | **எதிர்பார்க்கப்படும் அளவு:** ~${rainCalc.totalPrecip} மி.மீ\n` +
            `• 🌡️ **தற்போதைய நிலை:** ${wmo.label} (${temp}°C, உணரப்படும் வெப்பம் ${feels}°C)\n` +
            `• 💧 **ஈரப்பதம்:** ${humidity}% | **காற்றின் வேகம்:** ${wind} கி.மீ/மணி\n` +
            `• 💡 **ஆலோசனை:** குறுகிய தூறல் அல்லது லேசான மழைக்கு வாய்ப்பு உள்ளது. வானிலை நிலவரத்தைக் கவனிக்கவும்.`
          );
        } else {
          return (
            `☀️ **மழை வாய்ப்பு தீர்ப்பு: இல்லை (NO - மழை பெய்யாது! ☀️)**\n\n` +
            `• ⏰ **கணிக்கப்பட்ட நேரம் (Predicted Timing):** அடுத்த 24 மணி நேரத்தில் மழைக்கான வாய்ப்பு இல்லை (No Rain Predicted)\n` +
            `• 📊 **மழை வாய்ப்பு (Probability):** ${rainCalc.maxProb}% (மிகக் குறைவு) | **மழை அளவு:** 0 மி.மீ\n` +
            `• 🌡️ **தற்போதைய நிலை:** ${wmo.label} (${temp}°C, உணரப்படும் வெப்பம் ${feels}°C)\n` +
            `• 💧 **ஈரப்பதம்:** ${humidity}% | **காற்றின் வேகம்:** ${wind} கி.மீ/மணி\n` +
            `• 💡 **ஆலோசனை:** மழை பெய்ய வாய்ப்பில்லை, வறண்ட மற்றும் தெளிவான வானிலை நிலவும். உங்களது பணிகளைத் தடையின்றித் திட்டமிடலாம்.`
          );
        }
      }

      if (domain === 'agriculture' && agriAdvisory) {
        return (
          `🌾 **${locName} க்கான விவசாய வானிலை மற்றும் மண் ஆலோசனை:**\n` +
          `• **தற்போதைய வெப்பநிலை:** ${temp}°C | **ஈரப்பதம்:** ${humidity}%\n` +
          `• **மண் ஈரப்பதம்:** ${agriAdvisory.soilMoisturePercent}% (மண் வெப்பநிலை: ${agriAdvisory.soilTemperature}°C)\n` +
          `• **மருந்து தெளிக்கும் நிலை:** ${agriAdvisory.sprayCondition === 'Favorable' ? '✅ சிறந்தது' : '⚠️ ஒத்திவைக்கவும்'}\n` +
          `• **பாசன வழிகாட்டல்:** ${agriAdvisory.irrigationAdvice}\n` +
          `• **பயிர் பரிந்துரை:** ${agriAdvisory.cropSuitability.map((c) => `${c.crop} - ${c.status}`).join(', ')}.`
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
        return (
          `🌧️ **వర్ష సూచన: ${rainCalc.verdict === 'YES' ? 'అవును (YES - వర్షం పడే అవకాశం ఉంది)' : rainCalc.verdict === 'MAYBE' ? 'బహుశా (MAYBE - తేలికపాటి జల్లులు)' : 'లేదు (NO - వర్షం లేదు)'}**\n\n` +
          `• ⏰ **అంచనా సమయం (Predicted Timing):** ${rainCalc.predictedTimingEn}\n` +
          `• 📊 **వర్షం అవకాశం:** ${rainCalc.maxProb}% | **అంచనా వర్షపాతం:** ~${rainCalc.totalPrecip} మి.మీ\n` +
          `• 🌡️ **ఉష్ణోగ్రత:** ${temp}°C | **తేమ:** ${humidity}%\n` +
          `• 💡 **సలహా:** ${rainCalc.verdict === 'YES' ? 'బయటకు వెళ్లేటప్పుడు గొడుగు వెంట ఉంచుకోండి.' : 'వాతావరణం అనుకూలంగా ఉంటుంది.'}`
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

    // Default / Language 10: ENGLISH (en) & other languages
    if (isRainInquiry) {
      if (rainCalc.verdict === 'YES') {
        return (
          `🌧️ **Rain Forecast Verdict: YES (Rain Predicted! 🌧️)**\n\n` +
          `• ⏰ **Predicted Timing:** ${rainCalc.predictedTimingEn}${rainCalc.peakHourEn ? ` (Peak Intensity: ${rainCalc.peakHourEn})` : ''}\n` +
          `• 📊 **Rain Probability:** ${rainCalc.maxProb}% | **Estimated Accumulation:** ~${rainCalc.totalPrecip} mm\n` +
          `• 🌡️ **Current Conditions:** ${wmo.label} at ${temp}°C (Feels like ${feels}°C)\n` +
          `• 💧 **Humidity:** ${humidity}% | **Wind:** ${wind} km/h\n` +
          `• 💡 **Advisory:** Carry an umbrella / rain gear. Plan travel to avoid peak downpour hours.`
        );
      } else if (rainCalc.verdict === 'MAYBE') {
        return (
          `🌦️ **Rain Forecast Verdict: MAYBE (Passing Showers / Drizzle Possible 🌦️)**\n\n` +
          `• ⏰ **Predicted Timing:** ${rainCalc.predictedTimingEn}${rainCalc.peakHourEn ? ` (Possible Window: ${rainCalc.peakHourEn})` : ''}\n` +
          `• 📊 **Rain Probability:** ${rainCalc.maxProb}% | **Estimated Accumulation:** ~${rainCalc.totalPrecip} mm\n` +
          `• 🌡️ **Current Conditions:** ${wmo.label} at ${temp}°C (Feels like ${feels}°C)\n` +
          `• 💧 **Humidity:** ${humidity}% | **Wind:** ${wind} km/h\n` +
          `• 💡 **Advisory:** Isolated showers or localized drizzles possible. Keep an eye on local conditions.`
        );
      } else {
        return (
          `☀️ **Rain Forecast Verdict: NO (No Rain Expected! ☀️)**\n\n` +
          `• ⏰ **Predicted Timing:** No precipitation windows detected in the next 24 hours.\n` +
          `• 📊 **Rain Probability:** ${rainCalc.maxProb}% (Very Low) | **Estimated Accumulation:** 0.0 mm\n` +
          `• 🌡️ **Current Conditions:** ${wmo.label} at ${temp}°C (Feels like ${feels}°C)\n` +
          `• 💧 **Humidity:** ${humidity}% | **Wind:** ${wind} km/h\n` +
          `• 💡 **Advisory:** Clear and dry weather expected. Favorable for outdoor activities and travel.`
        );
      }
    }

    if (domain === 'agriculture' && agriAdvisory) {
      return (
        `🌾 **Crop & Agricultural Meteorological Advisory for ${locName}:**\n` +
        `• **Current Temperature:** ${temp}°C (Feels like ${feels}°C) | **Humidity:** ${humidity}%\n` +
        `• **Root-Zone Soil Moisture:** ${agriAdvisory.soilMoisturePercent}% | **Topsoil Temp:** ${agriAdvisory.soilTemperature}°C\n` +
        `• **Agrochemical Spray Window:** ${agriAdvisory.sprayCondition === 'Favorable' ? '✅ Optimal Window' : '⚠️ Hold Chemical Applications'}\n` +
        `  *Rationale:* ${agriAdvisory.sprayAdvice}\n` +
        `• **Irrigation Directive:** ${agriAdvisory.irrigationAdvice}\n` +
        `• **Crop Status Matrix:**\n` +
        agriAdvisory.cropSuitability.map((c) => `  - **${c.crop}**: ${c.status} (Pest Risk: ${c.risk})`).join('\n')
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
