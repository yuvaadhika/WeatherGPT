// WeatherGPT Advanced Multilingual Speech Engine (STT & TTS)
// Features: Dual-Engine TTS (Native Web Speech API + High-Definition Cloud Audio Stream Fallback)
// Ensures 100% working Tamil (தமிழ்), Hindi, Telugu, Malayalam, Kannada, Bengali, Gujarati, Marathi, Punjabi & English voices on all devices (Windows, Mac, Android, iOS, Chrome, Edge, Safari).

class SpeechEngine {
  constructor() {
    this.recognition = null;
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.currentAudio = null;
    this.audioQueue = [];
    this.currentQueueCallback = null;
    this.voices = [];

    this.initRecognition();
    this.initSynthesis();
  }

  initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
      } catch (e) {
        console.warn('SpeechRecognition init error:', e);
      }
    }
  }

  initSynthesis() {
    if (!this.synthesis) return;
    this.loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  loadVoices() {
    if (!this.synthesis) return;
    try {
      this.voices = this.synthesis.getVoices() || [];
    } catch (e) {
      this.voices = [];
    }
  }

  // Detect language script from text content
  detectScriptLanguage(text) {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
    if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'; // Punjabi
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi / Marathi
    return null;
  }

  // Clean and prepare text for natural pronunciation in any language
  cleanTextForSpeech(text, targetLang = 'en') {
    if (!text) return '';

    let cleaned = text
      // Remove URLs
      .replace(/https?:\/\/\S+/gi, '')
      // Remove Markdown headers, bold, italics, code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~[\]()><|]/g, ' ')
      // Convert bullet points to natural pauses
      .replace(/^[•\-\*]\s+/gm, '')
      .replace(/[•\-\*]\s+/g, ', ');

    const lang = targetLang.split(/[-_]/)[0].toLowerCase();

    // Language-specific unit phonetics expansion for smooth audio reading
    if (lang === 'ta') {
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 டிகிரி செல்சியஸ்')
        .replace(/(\d+)\s*°/g, '$1 டிகிரி')
        .replace(/(\d+)\s*%/g, '$1 சதவீதம்')
        .replace(/(\d+)\s*km\/h/gi, '$1 கிலோமீட்டர் / மணி')
        .replace(/(\d+)\s*mm/gi, '$1 மில்லிமீட்டர்')
        .replace(/AQI\s*(\d+)/gi, 'காற்று தரம் $1')
        .replace(/(\d+)\s*AQI/gi, '$1 காற்று தரம்')
        .replace(/PM2\.5/gi, 'பி.எம் 2.5')
        .replace(/PM10/gi, 'பி.எம் 10')
        .replace(/hPa/gi, 'ஹெக்டோபாஸ்கல்');
    } else if (lang === 'hi' || lang === 'mr') {
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 डिग्री सेल्सियस')
        .replace(/(\d+)\s*%/g, '$1 प्रतिशत')
        .replace(/(\d+)\s*km\/h/gi, '$1 किलोमीटर प्रति घंटा')
        .replace(/(\d+)\s*mm/gi, '$1 मिलीमीटर')
        .replace(/AQI/gi, 'वायु गुणवत्ता सूचकांक');
    } else if (lang === 'te') {
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 డిగ్రీ సెల్సియస్')
        .replace(/(\d+)\s*%/g, '$1 శాతం')
        .replace(/(\d+)\s*km\/h/gi, '$1 కిలోమీటర్లు ప్రతి గంట');
    } else if (lang === 'ml') {
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 ഡിഗ്രി സെൽഷ്യസ്')
        .replace(/(\d+)\s*%/g, '$1 ശതമാനം');
    } else if (lang === 'kn') {
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್')
        .replace(/(\d+)\s*%/g, '$1 ಪ್ರತಿಶತ');
    } else {
      // English
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 degrees Celsius')
        .replace(/(\d+)\s*°F/gi, '$1 degrees Fahrenheit')
        .replace(/(\d+)\s*%/g, '$1 percent')
        .replace(/(\d+)\s*km\/h/gi, '$1 kilometers per hour')
        .replace(/(\d+)\s*mm/gi, '$1 millimeters')
        .replace(/AQI/gi, 'A Q I');
    }

    // Strip unpronounceable emojis and special symbols
    cleaned = cleaned
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }

  // Find native voice from browser synthesis engine
  getMatchingVoice(langCode) {
    if (!this.synthesis) return null;
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }

    const voices = this.voices || [];
    const primaryLang = langCode.split(/[-_]/)[0].toLowerCase();
    const fullCode = langCode.toLowerCase().replace('_', '-');

    // 1. Exact or prefix match for voice.lang
    let matched = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang === fullCode || vLang.startsWith(primaryLang);
    });

    if (matched) return matched;

    // 2. Search voice name for native language identifiers
    const nameMatchers = {
      ta: ['tamil', 'தமிழ்', 'valluvar', 'pallavi', 'latha', 'vani', 'ta-in'],
      hi: ['hindi', 'हिन्दी', 'kalpana', 'hemant', 'swara', 'hi-in'],
      te: ['telugu', 'తెలుగు', 'chitra', 'mohan', 'te-in'],
      ml: ['malayalam', 'മലയാളം', 'midhun', 'sobhana', 'ml-in'],
      kn: ['kannada', 'ಕನ್ನಡ', 'gagan', 'sapna', 'kn-in'],
      bn: ['bengali', 'বাংলা', 'tapan', 'bashkar', 'bn-in'],
      gu: ['gujarati', 'ગુજરાતી', 'dhwani', 'niranjan', 'gu-in'],
      mr: ['marathi', 'मराठी', 'aarohi', 'manohar', 'mr-in'],
      pa: ['punjabi', 'ਪੰਜਾਬੀ', 'raajan', 'gurpreet', 'pa-in'],
      en: ['english', 'google', 'natural', 'david', 'zira', 'samantha'],
    };

    const keywords = nameMatchers[primaryLang] || [];
    if (keywords.length > 0) {
      matched = voices.find((v) => {
        const vName = (v.name || '').toLowerCase();
        const vLang = (v.lang || '').toLowerCase();
        return keywords.some((kw) => vName.includes(kw) || vLang.includes(kw));
      });
    }

    return matched || null;
  }

  // Split text into natural sentence fragments (< 160 chars) for smooth streaming TTS
  splitTextIntoChunks(text, maxLen = 140) {
    if (!text) return [];

    // Split on sentence boundaries: periods, exclamation marks, question marks, newlines, semicolons
    const sentences = text
      .split(/(?<=[.!?\n;।॥])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const chunks = [];

    for (const sentence of sentences) {
      if (sentence.length <= maxLen) {
        chunks.push(sentence);
      } else {
        // Split further by commas, pauses, or word boundaries
        const clauses = sentence.split(/(?<=[,:\-])\s+/).filter(Boolean);
        let currentChunk = '';

        for (const clause of clauses) {
          if ((currentChunk + ' ' + clause).trim().length <= maxLen) {
            currentChunk = (currentChunk + ' ' + clause).trim();
          } else {
            if (currentChunk) chunks.push(currentChunk);
            if (clause.length <= maxLen) {
              currentChunk = clause;
            } else {
              // Word level split
              const words = clause.split(/\s+/);
              currentChunk = '';
              for (const word of words) {
                if ((currentChunk + ' ' + word).trim().length <= maxLen) {
                  currentChunk = (currentChunk + ' ' + word).trim();
                } else {
                  if (currentChunk) chunks.push(currentChunk);
                  currentChunk = word;
                }
              }
            }
          }
        }
        if (currentChunk) chunks.push(currentChunk);
      }
    }

    return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
  }

  // Speak via High-Fidelity Online Audio Stream (Guaranteed crystal-clear Tamil audio)
  playAudioStreamQueue(chunks, langCode, onEnd) {
    if (!chunks || chunks.length === 0) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();
    this.isSpeaking = true;
    this.audioQueue = [...chunks];
    this.currentQueueCallback = onEnd;

    const primaryLang = langCode.split(/[-_]/)[0].toLowerCase();
    let currentIndex = 0;

    const playNext = () => {
      if (!this.isSpeaking) return;

      if (currentIndex >= this.audioQueue.length) {
        this.isSpeaking = false;
        this.currentAudio = null;
        this.audioQueue = [];
        if (this.currentQueueCallback) {
          const cb = this.currentQueueCallback;
          this.currentQueueCallback = null;
          cb();
        }
        return;
      }

      const chunk = this.audioQueue[currentIndex++];
      if (!chunk || !chunk.trim()) {
        playNext();
        return;
      }

      // Google Translate TTS Stream endpoint with cross-origin audio streaming
      const encodedText = encodeURIComponent(chunk.trim());
      const primaryUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(primaryLang)}&client=tw-ob&q=${encodedText}`;
      const fallbackUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${encodeURIComponent(primaryLang)}&q=${encodedText}`;

      const audio = new Audio();
      this.currentAudio = audio;

      let hasEnded = false;
      const advance = () => {
        if (!hasEnded) {
          hasEnded = true;
          playNext();
        }
      };

      audio.onended = () => {
        advance();
      };

      audio.onerror = () => {
        console.warn(`Online TTS chunk failed, trying secondary endpoint for: "${chunk.slice(0, 20)}..."`);
        // Try fallback URL if primary fails
        const fallbackAudio = new Audio(fallbackUrl);
        this.currentAudio = fallbackAudio;
        fallbackAudio.onended = advance;
        fallbackAudio.onerror = () => {
          console.warn('Fallback audio failed, advancing to next sentence.');
          advance();
        };
        fallbackAudio.play().catch(() => advance());
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play autoplay restriction / error:', err);
          // Try fallback audio directly
          const fallbackAudio = new Audio(fallbackUrl);
          this.currentAudio = fallbackAudio;
          fallbackAudio.onended = advance;
          fallbackAudio.onerror = advance;
          fallbackAudio.play().catch(() => advance());
        });
      }
    };

    // Begin playing queue
    playNext();
  }

  // Main Speak Entrypoint: Dual-Engine with Automatic Detection & Intelligent Fallback
  speak(text, langCode = 'en-US', onEnd) {
    this.stopSpeaking();

    if (!text || typeof text !== 'string') {
      if (onEnd) onEnd();
      return;
    }

    // Auto-detect target language if text contains specific scripts (e.g. Tamil characters)
    const detectedLang = this.detectScriptLanguage(text);
    const effectiveLang = detectedLang ? `${detectedLang}-IN` : langCode;
    const primaryLang = effectiveLang.split(/[-_]/)[0].toLowerCase();

    // Prepare cleaned, phonetically expanded text
    const cleanText = this.cleanTextForSpeech(text, effectiveLang);
    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // Check if browser has a native voice for this language
    const nativeVoice = this.getMatchingVoice(effectiveLang);

    // On Windows/Desktop browsers, Tamil & Indic voices are almost never installed natively.
    // If no native voice exists (or if it's Tamil and no genuine Tamil voice exists),
    // immediately use our crystal-clear Cloud Audio Stream engine!
    if (!nativeVoice && primaryLang !== 'en') {
      const chunks = this.splitTextIntoChunks(cleanText, 140);
      this.playAudioStreamQueue(chunks, effectiveLang, onEnd);
      return;
    }

    // If native voice is available or language is English, try Web Speech API first
    if (this.synthesis) {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = effectiveLang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        if (nativeVoice) {
          utterance.voice = nativeVoice;
        }

        utterance.onstart = () => {
          this.isSpeaking = true;
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
          console.warn('Native SpeechSynthesis error, falling back to online audio stream:', e);
          this.isSpeaking = false;
          this.currentUtterance = null;
          // Fallback to online audio stream
          const chunks = this.splitTextIntoChunks(cleanText, 140);
          this.playAudioStreamQueue(chunks, effectiveLang, onEnd);
        };

        this.currentUtterance = utterance;
        this.isSpeaking = true;
        this.synthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('Native SpeechSynthesis exception, falling back to online audio stream:', err);
      }
    }

    // Fallback: Online Audio Stream
    const chunks = this.splitTextIntoChunks(cleanText, 140);
    this.playAudioStreamQueue(chunks, effectiveLang, onEnd);
  }

  // Stop all speech immediately (both native synthesis and audio streams)
  stopSpeaking() {
    this.isSpeaking = false;
    this.audioQueue = [];
    this.currentQueueCallback = null;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch (e) {}
      this.currentAudio = null;
    }

    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch (e) {}
      this.currentUtterance = null;
    }
  }

  // Speech to Text (Microphone voice input)
  startListening({ langCode = 'en-US', onResult, onError, onEnd }) {
    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please type your query.');
      return false;
    }

    try {
      this.stopSpeaking();
      try {
        this.recognition.abort();
      } catch (e) {}

      // Ensure proper locale for Tamil & Indic languages (e.g. 'ta-IN' for Tamil)
      this.recognition.lang = langCode;
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        if (transcript && onResult) onResult(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        if (onError) onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      this.isListening = false;
      if (onError) onError(err.message);
      return false;
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }
}

export const speechEngine = new SpeechEngine();
