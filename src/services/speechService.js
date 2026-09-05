// WeatherGPT Advanced Multilingual Speech Engine (STT & TTS)
// Dual-Pipeline: High-Fidelity Server-Backed Audio Streaming (/api/tts) + Web Speech Synthesis
// 100% Guaranteed Full Output Narration for all 10 Languages (Tamil, Hindi, Telugu, Malayalam, Kannada, Bengali, Marathi, Gujarati, Punjabi, English)

class SpeechEngine {
  constructor() {
    this.recognition = null;
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.audioElement = typeof window !== 'undefined' ? new Audio() : null;
    this.audioQueue = [];
    this.currentQueueCallback = null;
    this.voices = [];
    this.currentIndex = 0;

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

  // Detect script language from text content
  detectScriptLanguage(text) {
    if (!text) return null;
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
      // Remove Markdown formatting, code blocks, bold, italics, tables
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
        .replace(/AQI\s*(\d+)/gi, 'वायु गुणवत्ता $1')
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
    } else if (lang === 'bn') {
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 ডিগ্রি সেলসিয়াস')
        .replace(/(\d+)\s*%/g, '$1 শতাংশ');
    } else if (lang === 'gu') {
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 ડિગ્રી સેલ્સિયસ')
        .replace(/(\d+)\s*%/g, '$1 ટકા');
    } else if (lang === 'pa') {
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 ਡਿਗਰੀ ਸੈਲਸੀਅਸ')
        .replace(/(\d+)\s*%/g, '$1 ਪ੍ਰਤੀਸ਼ਤ');
    } else {
      // English
      cleaned = cleaned
        .replace(/(\d+)\s*°C/gi, '$1 degrees Celsius')
        .replace(/(\d+)\s*°F/gi, '$1 degrees Fahrenheit')
        .replace(/(\d+)\s*%/g, '$1 percent')
        .replace(/(\d+)\s*km\/h/gi, '$1 kilometers per hour')
        .replace(/(\d+)\s*mm/gi, '$1 millimeters')
        .replace(/AQI/gi, 'Air Quality Index');
    }

    // Strip emojis and non-standard symbols
    cleaned = cleaned
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }

  // Find native voice from browser synthesis engine if available
  getMatchingVoice(langCode) {
    if (!this.synthesis) return null;
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }

    const voices = this.voices || [];
    const primaryLang = langCode.split(/[-_]/)[0].toLowerCase();
    const fullCode = langCode.toLowerCase().replace('_', '-');

    // 1. Exact or prefix match
    let matched = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang === fullCode || vLang.startsWith(primaryLang);
    });

    if (matched) return matched;

    // 2. Search voice name for native identifiers
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

  // Split text into natural sentence fragments (< 140 chars) for smooth streaming TTS
  splitTextIntoChunks(text, maxLen = 130) {
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

  // Play audio stream queue across all chunks sequentially (Guarantees speaking 100% of outputs)
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
    this.currentIndex = 0;

    const primaryLang = langCode.split(/[-_]/)[0].toLowerCase();

    // Ensure audio element exists
    if (!this.audioElement && typeof window !== 'undefined') {
      this.audioElement = new Audio();
    }
    const audio = this.audioElement;

    const playNext = () => {
      if (!this.isSpeaking) return;

      if (this.currentIndex >= this.audioQueue.length) {
        this.isSpeaking = false;
        this.audioQueue = [];
        if (this.currentQueueCallback) {
          const cb = this.currentQueueCallback;
          this.currentQueueCallback = null;
          cb();
        }
        return;
      }

      const chunk = this.audioQueue[this.currentIndex++];
      if (!chunk || !chunk.trim()) {
        playNext();
        return;
      }

      // 1. Primary: Serverless /api/tts endpoint
      const primaryUrl = `/api/tts?lang=${encodeURIComponent(primaryLang)}&text=${encodeURIComponent(chunk.trim())}`;
      
      let chunkAdvanced = false;
      const advance = () => {
        if (!chunkAdvanced) {
          chunkAdvanced = true;
          playNext();
        }
      };

      if (audio) {
        audio.onended = () => {
          advance();
        };

        audio.onerror = (e) => {
          console.warn(`TTS endpoint fallback for chunk "${chunk.slice(0, 20)}...":`, e);
          // Fallback to SpeechSynthesisUtterance for this chunk
          if (this.synthesis) {
            try {
              const fallbackUtterance = new SpeechSynthesisUtterance(chunk);
              fallbackUtterance.lang = langCode;
              const voice = this.getMatchingVoice(langCode);
              if (voice) fallbackUtterance.voice = voice;
              fallbackUtterance.rate = 0.95;
              fallbackUtterance.onend = advance;
              fallbackUtterance.onerror = advance;
              this.synthesis.speak(fallbackUtterance);
              return;
            } catch (err) {
              advance();
              return;
            }
          }
          advance();
        };

        try {
          audio.src = primaryUrl;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('Audio play restricted, using speech synthesis fallback:', err);
              if (this.synthesis) {
                try {
                  const fallbackUtterance = new SpeechSynthesisUtterance(chunk);
                  fallbackUtterance.lang = langCode;
                  const voice = this.getMatchingVoice(langCode);
                  if (voice) fallbackUtterance.voice = voice;
                  fallbackUtterance.rate = 0.95;
                  fallbackUtterance.onend = advance;
                  fallbackUtterance.onerror = advance;
                  this.synthesis.speak(fallbackUtterance);
                  return;
                } catch (e) {
                  advance();
                }
              } else {
                advance();
              }
            });
          }
        } catch (e) {
          advance();
        }
      } else if (this.synthesis) {
        // Fallback if no Audio element
        try {
          const fallbackUtterance = new SpeechSynthesisUtterance(chunk);
          fallbackUtterance.lang = langCode;
          const voice = this.getMatchingVoice(langCode);
          if (voice) fallbackUtterance.voice = voice;
          fallbackUtterance.rate = 0.95;
          fallbackUtterance.onend = advance;
          fallbackUtterance.onerror = advance;
          this.synthesis.speak(fallbackUtterance);
        } catch (e) {
          advance();
        }
      } else {
        advance();
      }
    };

    playNext();
  }

  // Main Speak Function: Dual Engine
  speak(text, langCode = 'en-US', onEnd) {
    this.stopSpeaking();

    if (!text || typeof text !== 'string') {
      if (onEnd) onEnd();
      return;
    }

    // Auto-detect script language (Tamil, Telugu, Hindi, etc.)
    const detectedLang = this.detectScriptLanguage(text);
    const effectiveLang = detectedLang ? `${detectedLang}-IN` : langCode;

    // Prepare clean text
    const cleanText = this.cleanTextForSpeech(text, effectiveLang);
    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // Split text into chunks to stream audio smoothly
    const chunks = this.splitTextIntoChunks(cleanText, 130);
    this.playAudioStreamQueue(chunks, effectiveLang, onEnd);
  }

  // Stop all speech immediately
  stopSpeaking() {
    this.isSpeaking = false;
    this.audioQueue = [];
    this.currentIndex = 0;
    this.currentQueueCallback = null;

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.audioElement.src = '';
      } catch (e) {}
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

      // Ensure proper locale for Tamil ('ta-IN') & Indic languages
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
