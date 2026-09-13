/**
 * ==========================================================================
 * WEATHERGPT CINEMATIC SIMULATION ENGINE (SIH 2026 - Problem Statement 26068)
 * ==========================================================================
 * Fully automated real-life story simulation:
 * Scene 1: Outdoor Shopping Street (8s)
 * Scene 2: WeatherGPT AI Neural Radar (5.5s)
 * Scene 3: Hyperlocal Phone Alert (7s)
 * Scene 4: Person Decides to Return (6s)
 * Scene 5: Arrives Home & Realization (7s)
 * Scene 6: Collecting Clothes on Terrace (8s)
 * Scene 7: Heavy Downpour Arrives (8s)
 * Scene 8: WeatherGPT Success (7s)
 * Final Screen: SIH 2026 Summary & Replay
 */

(function () {
  'use strict';

  // State
  let currentSceneIndex = 0;
  let isPlaying = false;
  let isMuted = false;
  let sceneTimer = null;
  let progressInterval = null;
  let totalElapsedMs = 0;

  // Scene definitions with precise timing
  const SCENES = [
    { id: 'scene-1', duration: 8000, title: 'Scene 1 — Outdoor Shopping Street', num: 'SCENE 1 / 8', weatherType: 'clear' },
    { id: 'scene-2', duration: 5500, title: 'Scene 2 — WeatherGPT Neural Analysis', num: 'SCENE 2 / 8', weatherType: 'radar' },
    { id: 'scene-3', duration: 7000, title: 'Scene 3 — Hyperlocal Phone Alert', num: 'SCENE 3 / 8', weatherType: 'cloudy' },
    { id: 'scene-4', duration: 6000, title: 'Scene 4 — Person Acts Promptly', num: 'SCENE 4 / 8', weatherType: 'breezy' },
    { id: 'scene-5', duration: 7000, title: 'Scene 5 — Arrival & Sudden Realization', num: 'SCENE 5 / 8', weatherType: 'overcast' },
    { id: 'scene-6', duration: 8000, title: 'Scene 6 — Protecting Household Assets', num: 'SCENE 6 / 8', weatherType: 'heavy_wind' },
    { id: 'scene-7', duration: 8000, title: 'Scene 7 — Heavy Downpour Arrives', num: 'SCENE 7 / 8', weatherType: 'downpour' },
    { id: 'scene-8', duration: 7000, title: 'Scene 8 — Peace of Mind & Protection', num: 'SCENE 8 / 8', weatherType: 'interior_rain' },
    { id: 'scene-final', duration: 0, title: 'WeatherGPT — SIH 2026 Summary', num: 'COMPLETED', weatherType: 'none' }
  ];

  const totalSimulationDuration = SCENES.slice(0, 8).reduce((acc, s) => acc + s.duration, 0);

  // DOM Elements
  const sceneElements = SCENES.map(s => document.getElementById(s.id));
  const sceneNumEl = document.getElementById('scene-num');
  const sceneTitleEl = document.getElementById('scene-title-text');
  const progressBarEl = document.getElementById('story-progress-bar');
  const timelineNodes = document.querySelectorAll('.t-node');
  const replayBtn = document.getElementById('replay-simulation-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const soundStatusText = document.getElementById('sound-status-text');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const lightningLayer = document.getElementById('lightning-flash');
  const audioHint = document.getElementById('audio-consent-hint');

  // =========================================================================
  // WEB AUDIO PROCEDURAL SOUND ENGINE (Zero external dependencies)
  // =========================================================================
  let audioCtx = null;
  let masterGain = null;
  let ambientSourceNodes = [];

  function initAudio() {
    if (audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : 0.45, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  function ensureAudioUnlocked() {
    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        if (audioHint) audioHint.classList.add('hidden');
      });
    }
  }

  function stopAllAmbientSounds() {
    ambientSourceNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    ambientSourceNodes = [];
  }

  // Synthesize procedural noise (for rain, wind, crowd)
  function createNoiseBuffer(durationSec = 5) {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * durationSec;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter approximation
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
    }
    return buffer;
  }

  function playSceneSound(sceneIndex) {
    if (!audioCtx || isMuted) return;
    stopAllAmbientSounds();

    const t = audioCtx.currentTime;

    switch (sceneIndex) {
      case 0: // Scene 1: Shopping Street Ambient
        playWarmTone(220, 'sine', 6, 0.08);
        playWarmTone(330, 'sine', 6, 0.05);
        break;

      case 1: // Scene 2: AI Radar Scanning
        playRadarBeep(880, 0.15);
        setTimeout(() => playRadarBeep(1174, 0.2), 600);
        setTimeout(() => playRadarBeep(1760, 0.3), 1400);
        break;

      case 2: // Scene 3: Phone Vibration & Alert Chime
        playPhoneVibration();
        setTimeout(() => playNotificationChime(), 1000);
        break;

      case 3: // Scene 4: Decision & Outdoor Ambience
        playWindSound(0.12, 400);
        break;

      case 4: // Scene 5: Arriving Home & Realization
        playRealizationChord();
        break;

      case 5: // Scene 6: Pre-storm Gusty Wind
        playWindSound(0.35, 750);
        break;

      case 6: // Scene 7: Heavy Downpour Rain & Thunder
        playRainSound(0.5);
        setTimeout(() => triggerThunderEffect(), 800);
        setTimeout(() => triggerThunderEffect(), 4200);
        break;

      case 7: // Scene 8: Cozy Safe Inside Rain
        playRainSound(0.18, 300); // Filtered gentle rain against glass
        playWarmTone(261.63, 'sine', 7, 0.15); // C4
        playWarmTone(329.63, 'sine', 7, 0.12); // E4
        playWarmTone(392.00, 'sine', 7, 0.1);  // G4
        playWarmTone(493.88, 'sine', 7, 0.08); // B4
        break;

      case 8: // Final Screen: SIH Brand Chord
        playFinalChord();
        break;
    }
  }

  function playWarmTone(freq, type = 'sine', duration = 3, gainVal = 0.1) {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainVal, audioCtx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    ambientSourceNodes.push(osc);
  }

  function playRadarBeep(freq, duration = 0.1) {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playPhoneVibration() {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, audioCtx.currentTime);

    // Vibration pulse pattern: buzz... buzz...
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime + 0.6);
    gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.9);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
  }

  function playNotificationChime() {
    if (!audioCtx || isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!audioCtx || isMuted) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      }, idx * 120);
    });
  }

  function playRealizationChord() {
    if (!audioCtx || isMuted) return;
    playWarmTone(349.23, 'sine', 3.5, 0.12); // F4
    playWarmTone(440.00, 'sine', 3.5, 0.12); // A4
    playWarmTone(523.25, 'sine', 3.5, 0.15); // C5
  }

  function playWindSound(gainVal = 0.2, cutoff = 500) {
    if (!audioCtx || isMuted) return;
    const noiseBuffer = createNoiseBuffer(8);
    if (!noiseBuffer) return;
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(cutoff, audioCtx.currentTime);
    filter.Q.setValueAtTime(2.0, audioCtx.currentTime);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + 1.5);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noiseSource.start();
    ambientSourceNodes.push(noiseSource);
  }

  function playRainSound(gainVal = 0.4, cutoff = 1800) {
    if (!audioCtx || isMuted) return;
    const noiseBuffer = createNoiseBuffer(8);
    if (!noiseBuffer) return;
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, audioCtx.currentTime);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + 0.8);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noiseSource.start();
    ambientSourceNodes.push(noiseSource);
  }

  function triggerThunderEffect() {
    if (!audioCtx || isMuted) return;
    // Visual flash
    if (lightningLayer) {
      lightningLayer.classList.add('flash');
      setTimeout(() => lightningLayer.classList.remove('flash'), 80);
      setTimeout(() => {
        lightningLayer.classList.add('flash');
        setTimeout(() => lightningLayer.classList.remove('flash'), 120);
      }, 140);
    }

    // Audio thunder rumble
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 2.5);

    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.0);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 3.2);
  }

  function playFinalChord() {
    if (!audioCtx || isMuted) return;
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25]; // C Major triumph
    chord.forEach((freq, idx) => {
      setTimeout(() => {
        playWarmTone(freq, 'sine', 6.0, 0.12);
      }, idx * 100);
    });
  }

  // =========================================================================
  // DYNAMIC HTML5 CANVAS PARTICLE SYSTEM (Rain, Wind, Splashes)
  // =========================================================================
  const canvas = document.getElementById('weather-particle-canvas');
  const ctx = canvas.getContext('2d');
  let animationFrameId = null;
  let particles = [];
  let splashes = [];
  let currentParticleMode = 'none';

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class RainDrop {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * (canvas.width + 300) - 150;
      this.y = Math.random() * -canvas.height;
      this.length = Math.random() * 25 + 15;
      this.speed = Math.random() * 18 + 22;
      this.angle = 0.22; // Slanted storm angle
      this.opacity = Math.random() * 0.4 + 0.3;
      this.thickness = Math.random() * 1.5 + 0.8;
    }
    update() {
      this.x += Math.sin(this.angle) * this.speed;
      this.y += Math.cos(this.angle) * this.speed;

      // Ground impact splash trigger
      if (this.y >= canvas.height - 40) {
        if (Math.random() < 0.25 && splashes.length < 80) {
          splashes.push(new Splash(this.x, canvas.height - 40 + Math.random() * 30));
        }
        this.reset();
        this.y = 0;
      }
    }
    draw() {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + Math.sin(this.angle) * this.length, this.y + Math.cos(this.angle) * this.length);
      ctx.strokeStyle = `rgba(186, 230, 253, ${this.opacity})`;
      ctx.lineWidth = this.thickness;
      ctx.stroke();
    }
  }

  class Splash {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 1;
      this.maxRadius = Math.random() * 8 + 4;
      this.opacity = 0.7;
    }
    update() {
      this.radius += 0.6;
      this.opacity -= 0.05;
    }
    draw() {
      if (this.opacity <= 0) return;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.radius * 2, this.radius * 0.8, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(224, 242, 254, ${this.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  class WindStreak {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * -200;
      this.y = Math.random() * canvas.height;
      this.length = Math.random() * 120 + 80;
      this.speed = Math.random() * 12 + 10;
      this.opacity = Math.random() * 0.15 + 0.05;
    }
    update() {
      this.x += this.speed;
      if (this.x > canvas.width + 200) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.length, this.y - 4);
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  function setParticleMode(mode) {
    currentParticleMode = mode;
    particles = [];
    splashes = [];

    if (mode === 'heavy_rain' || mode === 'downpour') {
      for (let i = 0; i < 280; i++) {
        particles.push(new RainDrop());
      }
    } else if (mode === 'breezy' || mode === 'heavy_wind') {
      for (let i = 0; i < 45; i++) {
        particles.push(new WindStreak());
      }
    }
  }

  function particleLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    for (let i = splashes.length - 1; i >= 0; i--) {
      splashes[i].update();
      splashes[i].draw();
      if (splashes[i].opacity <= 0) {
        splashes.splice(i, 1);
      }
    }

    animationFrameId = requestAnimationFrame(particleLoop);
  }
  particleLoop();

  // =========================================================================
  // SIMULATION TIMELINE & SCENE TRANSITION ENGINE
  // =========================================================================

  function showScene(index) {
    if (index < 0 || index >= SCENES.length) return;
    currentSceneIndex = index;
    const sceneConfig = SCENES[index];

    // Toggle active class on scenes
    sceneElements.forEach((el, i) => {
      if (el) {
        if (i === index) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    // Update Header HUD tracker
    if (sceneNumEl) sceneNumEl.textContent = sceneConfig.num;
    if (sceneTitleEl) sceneTitleEl.textContent = sceneConfig.title.replace(/^Scene \d — /, '');

    // Update timeline node buttons
    timelineNodes.forEach((btn, i) => {
      if (i === index) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update particle weather layer
    if (sceneConfig.weatherType === 'downpour') {
      setParticleMode('downpour');
    } else if (sceneConfig.weatherType === 'heavy_wind') {
      setParticleMode('heavy_wind');
    } else if (sceneConfig.weatherType === 'breezy') {
      setParticleMode('breezy');
    } else {
      setParticleMode('none');
    }

    // Play scene ambient soundscape
    playSceneSound(index);

    // Schedule next scene if not on final screen
    if (sceneConfig.duration > 0) {
      if (sceneTimer) clearTimeout(sceneTimer);
      sceneTimer = setTimeout(() => {
        showScene(index + 1);
      }, sceneConfig.duration);
    }
  }

  function startProgressTracker() {
    if (progressInterval) clearInterval(progressInterval);
    const startTime = performance.now();

    progressInterval = setInterval(() => {
      if (currentSceneIndex >= 8) {
        if (progressBarEl) progressBarEl.style.width = '100%';
        clearInterval(progressInterval);
        return;
      }

      // Calculate elapsed time across scenes
      let priorScenesDuration = 0;
      for (let i = 0; i < currentSceneIndex; i++) {
        priorScenesDuration += SCENES[i].duration;
      }

      const elapsedInCurrentScene = (performance.now() - startTime) % SCENES[currentSceneIndex].duration;
      const currentTotalElapsed = priorScenesDuration + elapsedInCurrentScene;
      const progressPercent = Math.min(100, (currentTotalElapsed / totalSimulationDuration) * 100);

      if (progressBarEl) {
        progressBarEl.style.width = `${progressPercent.toFixed(1)}%`;
      }
    }, 100);
  }

  function startSimulation() {
    isPlaying = true;
    totalElapsedMs = 0;
    showScene(0);
    startProgressTracker();
  }

  function restartSimulation() {
    if (sceneTimer) clearTimeout(sceneTimer);
    if (progressInterval) clearInterval(progressInterval);
    if (progressBarEl) progressBarEl.style.width = '0%';
    startSimulation();
  }

  // =========================================================================
  // USER CONTROLS & EVENT LISTENERS
  // =========================================================================

  // Sound toggle button
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      ensureAudioUnlocked();
      isMuted = !isMuted;

      if (isMuted) {
        if (masterGain && audioCtx) masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
        if (soundIconOn) soundIconOn.classList.add('hidden');
        if (soundIconOff) soundIconOff.classList.remove('hidden');
        if (soundStatusText) soundStatusText.textContent = 'Muted';
      } else {
        if (masterGain && audioCtx) masterGain.gain.setValueAtTime(0.45, audioCtx.currentTime);
        if (soundIconOn) soundIconOn.classList.remove('hidden');
        if (soundIconOff) soundIconOff.classList.add('hidden');
        if (soundStatusText) soundStatusText.textContent = 'Audio ON';
        playSceneSound(currentSceneIndex);
      }
    });
  }

  // Fullscreen button
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });
  }

  // Timeline node click jump (judges can preview specific scenes if desired)
  timelineNodes.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      ensureAudioUnlocked();
      const targetIndex = parseInt(btn.getAttribute('data-scene-index'), 10);
      if (!isNaN(targetIndex)) {
        if (sceneTimer) clearTimeout(sceneTimer);
        showScene(targetIndex);
      }
    });
  });

  // Replay button on final screen
  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      ensureAudioUnlocked();
      restartSimulation();
    });
  }

  // Audio unlock listener on first click anywhere
  window.addEventListener('click', () => {
    ensureAudioUnlocked();
  }, { once: true });

  window.addEventListener('touchstart', () => {
    ensureAudioUnlocked();
  }, { once: true });

  // =========================================================================
  // AUTOMATIC INITIALIZATION (CRITICAL: WAIT 1 SECOND & AUTOPLAY)
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      startSimulation();
    }, 1000);
  });

})();
