/**
 * ==========================================================================
 * WEATHERGPT CINEMATIC REAL-LIFE STORY SIMULATION ENGINE
 * Smart India Hackathon 2026 | Problem Statement 26068
 * ==========================================================================
 * 100% Automated Continuous Human-Action Story Simulation:
 * Scene 1: Outdoor Shopping Walk (8s)
 * Scene 2: Atmosphere Shifts & Cloud Observation (7s)
 * Scene 3: Hyperlocal Phone Alert (8s)
 * Scene 4: Decision to Return Home (6.5s)
 * Scene 5: Walking Home Through Residential Area (7.5s)
 * Scene 6: Arrival & Sudden Realization (7s)
 * Scene 7: Protecting Household Assets on Terrace (8.5s)
 * Scene 8: Torrential Downpour Arrives (8s)
 * Scene 9: WeatherGPT SIH 2026 Summary & Replay
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

  // Scene definitions with timing and weather modes
  const SCENES = [
    { id: 'scene-1', duration: 8000, title: 'Scene 1 — Outdoor Shopping Street', num: 'SCENE 1 / 9', weatherType: 'clear' },
    { id: 'scene-2', duration: 7000, title: 'Scene 2 — Atmosphere Shifts & Cloud Observation', num: 'SCENE 2 / 9', weatherType: 'overcast' },
    { id: 'scene-3', duration: 8000, title: 'Scene 3 — Hyperlocal Phone Alert', num: 'SCENE 3 / 9', weatherType: 'breezy' },
    { id: 'scene-4', duration: 6500, title: 'Scene 4 — Person Acts Promptly', num: 'SCENE 4 / 9', weatherType: 'breezy' },
    { id: 'scene-5', duration: 7500, title: 'Scene 5 — Walking Home', num: 'SCENE 5 / 9', weatherType: 'heavy_wind' },
    { id: 'scene-6', duration: 7000, title: 'Scene 6 — Arrival & Realization', num: 'SCENE 6 / 9', weatherType: 'heavy_wind' },
    { id: 'scene-7', duration: 8500, title: 'Scene 7 — Protecting Household Assets', num: 'SCENE 7 / 9', weatherType: 'heavy_wind' },
    { id: 'scene-8', duration: 8000, title: 'Scene 8 — Torrential Downpour Arrives', num: 'SCENE 8 / 9', weatherType: 'downpour' },
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

  function createNoiseBuffer(durationSec = 6) {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * durationSec;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
    }
    return buffer;
  }

  function playSceneSound(sceneIndex) {
    if (!audioCtx || isMuted) return;
    stopAllAmbientSounds();

    switch (sceneIndex) {
      case 0: // Scene 1: Shopping Street Warm Ambience & Footsteps
        playWarmTone(220, 'sine', 7, 0.08);
        playWarmTone(330, 'sine', 7, 0.05);
        playFootstepRhythm(8, 650);
        break;

      case 1: // Scene 2: Atmosphere Shifts & Sky Observation
        playWindSound(0.18, 450);
        playWarmTone(174.61, 'sine', 6, 0.09); // F3
        break;

      case 2: // Scene 3: Phone Vibration & WeatherGPT Alert Chime
        playPhoneVibration();
        setTimeout(() => playNotificationChime(), 1100);
        break;

      case 3: // Scene 4: Decision & Determined Stride
        playWindSound(0.22, 550);
        playWarmTone(261.63, 'sine', 5, 0.08); // C4
        break;

      case 4: // Scene 5: Brisk Power-Walk Home
        playWindSound(0.32, 680);
        playFootstepRhythm(10, 480);
        break;

      case 5: // Scene 6: Arrival & Sudden Realization
        playRealizationChord();
        break;

      case 6: // Scene 7: Terrace Pre-Storm Gale (36 km/h)
        playWindSound(0.48, 850);
        setTimeout(() => triggerThunderEffect(0.5), 2500);
        break;

      case 7: // Scene 8: Torrential Downpour & Thunder
        playRainSound(0.55);
        setTimeout(() => triggerThunderEffect(0.9), 600);
        setTimeout(() => triggerThunderEffect(0.7), 4200);
        break;

      case 8: // Scene 9 / Final Screen: Harmonic Serenity Chord
        playFinalChord();
        break;
    }
  }

  function playFootstepRhythm(count = 6, intervalMs = 600) {
    if (!audioCtx || isMuted) return;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!audioCtx || isMuted) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(95 + Math.random() * 20, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      }, i * intervalMs);
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

  function playPhoneVibration() {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, audioCtx.currentTime);

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.6);
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
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.65);
      }, idx * 110);
    });
  }

  function playRealizationChord() {
    if (!audioCtx || isMuted) return;
    playWarmTone(349.23, 'sine', 3.5, 0.14); // F4
    playWarmTone(440.00, 'sine', 3.5, 0.14); // A4
    playWarmTone(523.25, 'sine', 3.5, 0.18); // C5
  }

  function playWindSound(gainVal = 0.2, cutoff = 500) {
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
    gain.gain.exponentialRampToValueAtTime(gainVal, audioCtx.currentTime + 0.8);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noiseSource.start();
    ambientSourceNodes.push(noiseSource);
  }

  function playRainSound(gainVal = 0.4, cutoff = 1200) {
    if (!audioCtx || isMuted) return;
    const noiseBuffer = createNoiseBuffer(8);
    if (!noiseBuffer) return;
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(cutoff, audioCtx.currentTime);
    filter.Q.setValueAtTime(1.0, audioCtx.currentTime);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainVal, audioCtx.currentTime + 0.5);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noiseSource.start();
    ambientSourceNodes.push(noiseSource);
  }

  function triggerThunderEffect(intensity = 0.8) {
    if (!audioCtx || isMuted) return;

    // Flash Lightning visually
    if (lightningLayer) {
      lightningLayer.classList.add('flash');
      setTimeout(() => lightningLayer.classList.remove('flash'), 120);
      setTimeout(() => lightningLayer.classList.add('flash'), 220);
      setTimeout(() => lightningLayer.classList.remove('flash'), 360);
    }

    // Audio thunder rumble
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + 2.5);

    gain.gain.setValueAtTime(intensity * 0.45, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.8);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, audioCtx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start();
    osc.stop(audioCtx.currentTime + 2.8);
  }

  function playFinalChord() {
    if (!audioCtx || isMuted) return;
    const chords = [261.63, 329.63, 392.00, 523.25]; // C major
    chords.forEach(freq => playWarmTone(freq, 'sine', 6, 0.12));
  }

  // =========================================================================
  // 60 FPS CANVAS PARTICLE ENGINE (Rain, Leaves, Splashes)
  // =========================================================================
  const canvas = document.getElementById('weather-particle-canvas');
  let ctx = null;
  let particles = [];
  let splashes = [];
  let currentMode = 'clear';

  function initCanvas() {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(renderParticles);
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticlesForMode(currentMode);
  }

  function initParticlesForMode(mode) {
    currentMode = mode;
    particles = [];
    splashes = [];
    if (!canvas) return;

    if (mode === 'clear') {
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedY: Math.random() * 0.4 + 0.1,
          speedX: Math.random() * 0.3 - 0.15,
          opacity: Math.random() * 0.35 + 0.1,
          type: 'mote'
        });
      }
    } else if (mode === 'breezy' || mode === 'overcast') {
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 4 + 2,
          speedY: Math.random() * 1.5 + 0.5,
          speedX: Math.random() * 4 + 2,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.08,
          opacity: Math.random() * 0.6 + 0.2,
          type: 'leaf'
        });
      }
    } else if (mode === 'heavy_wind') {
      for (let i = 0; i < 70; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 6 + 3,
          speedY: Math.random() * 2.5 + 1.0,
          speedX: Math.random() * 9 + 5,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          opacity: Math.random() * 0.7 + 0.25,
          type: 'leaf'
        });
      }
    } else if (mode === 'downpour') {
      for (let i = 0; i < 600; i++) {
        particles.push({
          x: Math.random() * (canvas.width + 300) - 150,
          y: Math.random() * canvas.height,
          length: Math.random() * 26 + 18,
          speedY: Math.random() * 18 + 22,
          speedX: Math.random() * 5 + 7, // Slanted rain
          opacity: Math.random() * 0.55 + 0.35,
          type: 'raindrop'
        });
      }
    }
  }

  function renderParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render Particles
    particles.forEach(p => {
      if (p.type === 'raindrop') {
        ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speedX * 0.8, p.y + p.length);
        ctx.stroke();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y > canvas.height - 100 && Math.random() < 0.08) {
          splashes.push({
            x: p.x,
            y: canvas.height - Math.random() * 60,
            radius: 1,
            maxRadius: Math.random() * 8 + 4,
            opacity: 0.7
          });
        }

        if (p.y > canvas.height) {
          p.y = -p.length;
          p.x = Math.random() * (canvas.width + 300) - 150;
        }
      } else if (p.type === 'leaf') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = `rgba(202, 138, 4, ${p.opacity})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        if (p.x > canvas.width + 50 || p.y > canvas.height + 50) {
          p.x = -40;
          p.y = Math.random() * canvas.height * 0.8;
        }
      } else if (p.type === 'mote') {
        ctx.fillStyle = `rgba(254, 240, 138, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y > canvas.height) p.y = 0;
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
      }
    });

    // Render Splashes
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      ctx.strokeStyle = `rgba(186, 230, 253, ${s.opacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.radius * 2, s.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();

      s.radius += 0.8;
      s.opacity -= 0.05;

      if (s.opacity <= 0) splashes.splice(i, 1);
    }

    requestAnimationFrame(renderParticles);
  }

  // =========================================================================
  // SCENE TIMELINE CONTROLLER & 100% AUTOMATED PLAYBACK
  // =========================================================================
  function showScene(index) {
    if (index < 0 || index >= SCENES.length) return;
    currentSceneIndex = index;
    const scene = SCENES[index];

    // Update active class on DOM scenes
    sceneElements.forEach((el, idx) => {
      if (!el) return;
      if (idx === index) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update Header Scene Tracker
    if (sceneNumEl) sceneNumEl.textContent = scene.num;
    if (sceneTitleEl) sceneTitleEl.textContent = scene.title.replace(/^Scene \d — /, '');

    // Update Timeline Nodes
    timelineNodes.forEach((node, idx) => {
      if (idx === index) node.classList.add('active');
      else node.classList.remove('active');
    });

    // Trigger procedural audio & particle mode for scene
    playSceneSound(index);
    initParticlesForMode(scene.weatherType);

    // Schedule next scene automatically
    clearTimeout(sceneTimer);
    if (scene.duration > 0) {
      sceneTimer = setTimeout(() => {
        showScene(index + 1);
      }, scene.duration);
    }
  }

  function startSimulation() {
    isPlaying = true;
    totalElapsedMs = 0;
    showScene(0);

    // Progress bar update loop
    clearInterval(progressInterval);
    const intervalTick = 50;
    progressInterval = setInterval(() => {
      if (!isPlaying) return;
      totalElapsedMs += intervalTick;
      const progressPercent = Math.min(100, (totalElapsedMs / totalSimulationDuration) * 100);
      if (progressBarEl) progressBarEl.style.width = `${progressPercent}%`;

      if (totalElapsedMs >= totalSimulationDuration && currentSceneIndex < 8) {
        showScene(8); // Show Final Screen
      }
    }, intervalTick);
  }

  function restartSimulation() {
    clearTimeout(sceneTimer);
    clearInterval(progressInterval);
    totalElapsedMs = 0;
    if (progressBarEl) progressBarEl.style.width = '0%';
    startSimulation();
  }

  // =========================================================================
  // EVENT LISTENERS & INITIALIZATION
  // =========================================================================
  function setupEventListeners() {
    // Replay Button
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        ensureAudioUnlocked();
        restartSimulation();
      });
    }

    // Audio Mute/Unmute Toggle
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        ensureAudioUnlocked();
        isMuted = !isMuted;
        if (masterGain && audioCtx) {
          masterGain.gain.setValueAtTime(isMuted ? 0 : 0.45, audioCtx.currentTime);
        }
        if (isMuted) {
          if (soundIconOn) soundIconOn.classList.add('hidden');
          if (soundIconOff) soundIconOff.classList.remove('hidden');
          if (soundStatusText) soundStatusText.textContent = 'Muted';
        } else {
          if (soundIconOn) soundIconOn.classList.remove('hidden');
          if (soundIconOff) soundIconOff.classList.add('hidden');
          if (soundStatusText) soundStatusText.textContent = 'Audio ON';
          playSceneSound(currentSceneIndex);
        }
      });
    }

    // Timeline Node Direct Clicks (Manual Skip / Scrub)
    timelineNodes.forEach((node, idx) => {
      node.addEventListener('click', () => {
        ensureAudioUnlocked();
        let elapsed = 0;
        for (let i = 0; i < idx; i++) {
          elapsed += SCENES[i].duration;
        }
        totalElapsedMs = elapsed;
        showScene(idx);
      });
    });

    // Fullscreen Toggle
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // First Click / Touch Unlocks Audio
    document.addEventListener('click', ensureAudioUnlocked, { once: true });
    document.addEventListener('touchstart', ensureAudioUnlocked, { once: true });
  }

  // Auto-init on page load
  window.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    setupEventListeners();
    setTimeout(() => {
      startSimulation();
    }, 400);
  });

})();
