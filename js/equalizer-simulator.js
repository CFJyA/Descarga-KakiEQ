/**
 * KAKI EQ - Interactive 10-Band DSP Equalizer Simulator
 * Provides real-time Web Audio API processing, canvas spline curve visualization,
 * presets, and tone enhancements.
 */

(function () {
  'use strict';

  // Equalizer Frequencies in Hz
  const FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const FREQ_LABELS = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];

  // Presets definition matching Kaki EQ profiles
  const PRESETS = {
    plano: {
      name: 'Plano (0 dB)',
      preamp: 0,
      gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    bass: {
      name: 'Refuerzo de Bajos',
      preamp: -1.5,
      gains: [6.0, 5.5, 4.0, 2.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0]
    },
    rock: {
      name: 'Rock',
      preamp: -1.0,
      gains: [4.5, 3.5, 2.0, -1.0, -1.5, 0.5, 2.5, 3.5, 4.5, 5.0]
    },
    vocal: {
      name: 'Claridad Vocal',
      preamp: 0,
      gains: [-2.0, -1.5, 0.0, 1.5, 3.0, 4.0, 3.5, 2.0, 0.5, 0.0]
    },
    treble: {
      name: 'Brillo & Aire',
      preamp: -1.0,
      gains: [0.0, 0.0, 0.0, 0.5, 1.0, 2.0, 3.5, 5.0, 6.0, 6.5]
    },
    club: {
      name: 'Club / Electrónica',
      preamp: -1.5,
      gains: [5.5, 5.0, 3.0, 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 4.5]
    },
    pop: {
      name: 'Pop',
      preamp: 0,
      gains: [1.5, 2.5, 3.0, 1.0, 0.0, -0.5, 1.5, 2.5, 3.5, 2.5]
    },
    jazz: {
      name: 'Jazz',
      preamp: 0,
      gains: [3.0, 2.5, 1.5, 1.5, -1.0, -1.0, 0.0, 1.5, 3.0, 3.5]
    }
  };

  // State
  let eqEnabled = true;
  let preampGain = 0;
  let bandGains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let activePresetKey = 'plano';

  // Web Audio Context & Nodes
  let audioCtx = null;
  let isAudioPlaying = false;
  let preampNode = null;
  let filterNodes = [];
  let masterGain = null;
  let synthInterval = null;

  // DOM Elements
  const canvas = document.getElementById('dspCurveCanvas');
  const eqToggle = document.getElementById('eqToggleSwitch');
  const resetBtn = document.getElementById('btnResetEq');
  const audioPreviewBtn = document.getElementById('btnAudioPreview');
  const preampSlider = document.getElementById('preampSlider');
  const preampBadge = document.getElementById('preampGainBadge');
  const bandSlidersContainer = document.getElementById('bandSlidersRow');
  const presetChips = document.querySelectorAll('.preset-chip');

  // Tone quick enhancement buttons
  const btnEnhanceBass = document.getElementById('btnEnhanceBass');
  const btnEnhanceVocal = document.getElementById('btnEnhanceVocal');
  const btnEnhanceTreble = document.getElementById('btnEnhanceTreble');

  /**
   * Initialize Equalizer Simulator
   */
  function init() {
    buildBandSliders();
    attachEventListeners();
    setupCanvas();
    drawDspCurve();

    window.addEventListener('resize', () => {
      setupCanvas();
      drawDspCurve();
    });
  }

  /**
   * Dynamically build the 10 frequency sliders matching WinUI template
   */
  function buildBandSliders() {
    if (!bandSlidersContainer) return;
    bandSlidersContainer.innerHTML = '';

    FREQUENCIES.forEach((freq, index) => {
      const col = document.createElement('div');
      col.className = 'band-slider-column';

      const badge = document.createElement('div');
      badge.className = 'band-db-badge';
      badge.id = `badgeBand_${index}`;
      badge.textContent = '0 dB';

      const sliderWrap = document.createElement('div');
      sliderWrap.className = 'vertical-slider-wrapper';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'vertical-eq-slider';
      slider.id = `sliderBand_${index}`;
      slider.min = '-15';
      slider.max = '15';
      slider.step = '0.5';
      slider.value = '0';
      slider.setAttribute('orient', 'vertical');

      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        updateBandGain(index, val);
      });

      sliderWrap.appendChild(slider);

      const label = document.createElement('div');
      label.className = 'slider-freq-label';
      label.textContent = FREQ_LABELS[index];

      col.appendChild(badge);
      col.appendChild(sliderWrap);
      col.appendChild(label);

      bandSlidersContainer.appendChild(col);
    });
  }

  /**
   * Update gain for a single band
   */
  function updateBandGain(index, val) {
    bandGains[index] = val;
    const badge = document.getElementById(`badgeBand_${index}`);
    if (badge) {
      badge.textContent = formatGain(val);
      badge.style.color = val > 0 ? 'var(--accent-primary)' : val < 0 ? 'var(--danger-coral)' : 'var(--accent-text)';
    }

    // Apply to Web Audio filter if running
    if (filterNodes[index]) {
      filterNodes[index].gain.setTargetAtTime(eqEnabled ? val : 0, audioCtx.currentTime, 0.05);
    }

    // Unset active preset chip if manual tweak
    setActivePresetChip(null);

    drawDspCurve();
  }

  /**
   * Format dB string (+3.5 dB / -2.0 dB / 0 dB)
   */
  function formatGain(val) {
    if (val > 0) return `+${val.toFixed(1)} dB`;
    if (val < 0) return `${val.toFixed(1)} dB`;
    return '0 dB';
  }

  /**
   * Apply a preset
   */
  function applyPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;

    activePresetKey = key;
    preampGain = preset.preamp;

    if (preampSlider) {
      preampSlider.value = preampGain;
    }
    if (preampBadge) {
      preampBadge.textContent = formatGain(preampGain);
    }
    if (preampNode && audioCtx) {
      const linearGain = Math.pow(10, (eqEnabled ? preampGain : 0) / 20);
      preampNode.gain.setTargetAtTime(linearGain, audioCtx.currentTime, 0.05);
    }

    preset.gains.forEach((gain, i) => {
      bandGains[i] = gain;
      const slider = document.getElementById(`sliderBand_${i}`);
      const badge = document.getElementById(`badgeBand_${i}`);
      if (slider) slider.value = gain;
      if (badge) {
        badge.textContent = formatGain(gain);
        badge.style.color = gain > 0 ? 'var(--accent-primary)' : gain < 0 ? 'var(--danger-coral)' : 'var(--accent-text)';
      }
      if (filterNodes[i] && audioCtx) {
        filterNodes[i].gain.setTargetAtTime(eqEnabled ? gain : 0, audioCtx.currentTime, 0.05);
      }
    });

    setActivePresetChip(key);
    drawDspCurve();
  }

  function setActivePresetChip(key) {
    presetChips.forEach((chip) => {
      if (chip.getAttribute('data-preset') === key) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  /**
   * Attach UI event listeners
   */
  function attachEventListeners() {
    // EQ Toggle
    if (eqToggle) {
      eqToggle.addEventListener('change', (e) => {
        eqEnabled = e.target.checked;
        applyBypassState();
        drawDspCurve();
      });
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        applyPreset('plano');
      });
    }

    // Preamp Slider
    if (preampSlider) {
      preampSlider.addEventListener('input', (e) => {
        preampGain = parseFloat(e.target.value);
        if (preampBadge) {
          preampBadge.textContent = formatGain(preampGain);
        }
        if (preampNode && audioCtx) {
          const linearGain = Math.pow(10, (eqEnabled ? preampGain : 0) / 20);
          preampNode.gain.setTargetAtTime(linearGain, audioCtx.currentTime, 0.05);
        }
        drawDspCurve();
      });
    }

    // Presets chips click
    presetChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const key = chip.getAttribute('data-preset');
        applyPreset(key);
      });
    });

    // Quick Tone Enhancements
    if (btnEnhanceBass) {
      btnEnhanceBass.addEventListener('click', () => {
        // Boost 32Hz, 64Hz, 125Hz by +6 dB
        updateBandGain(0, 6.0);
        updateBandGain(1, 6.0);
        updateBandGain(2, 5.0);
        const slider0 = document.getElementById('sliderBand_0');
        const slider1 = document.getElementById('sliderBand_1');
        const slider2 = document.getElementById('sliderBand_2');
        if (slider0) slider0.value = 6.0;
        if (slider1) slider1.value = 6.0;
        if (slider2) slider2.value = 5.0;
      });
    }

    if (btnEnhanceVocal) {
      btnEnhanceVocal.addEventListener('click', () => {
        // Boost 1kHz, 2kHz, 4kHz by +4 dB
        updateBandGain(5, 4.0);
        updateBandGain(6, 4.0);
        updateBandGain(7, 3.5);
        const slider5 = document.getElementById('sliderBand_5');
        const slider6 = document.getElementById('sliderBand_6');
        const slider7 = document.getElementById('sliderBand_7');
        if (slider5) slider5.value = 4.0;
        if (slider6) slider6.value = 4.0;
        if (slider7) slider7.value = 3.5;
      });
    }

    if (btnEnhanceTreble) {
      btnEnhanceTreble.addEventListener('click', () => {
        // Boost 8kHz, 16kHz by +5 dB
        updateBandGain(8, 5.0);
        updateBandGain(9, 6.0);
        const slider8 = document.getElementById('sliderBand_8');
        const slider9 = document.getElementById('sliderBand_9');
        if (slider8) slider8.value = 5.0;
        if (slider9) slider9.value = 6.0;
      });
    }

    // Audio preview toggle
    if (audioPreviewBtn) {
      audioPreviewBtn.addEventListener('click', toggleAudioPreview);
    }
  }

  function applyBypassState() {
    if (!audioCtx) return;
    const pGain = eqEnabled ? Math.pow(10, preampGain / 20) : 1;
    if (preampNode) {
      preampNode.gain.setTargetAtTime(pGain, audioCtx.currentTime, 0.05);
    }
    filterNodes.forEach((node, i) => {
      node.gain.setTargetAtTime(eqEnabled ? bandGains[i] : 0, audioCtx.currentTime, 0.05);
    });
  }

  /**
   * Setup Canvas resolution for crisp High-DPI rendering
   */
  function setupCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  /**
   * Draw the DSP Frequency Response Curve with Spline Interpolation & Glow
   */
  function drawDspCurve() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Draw horizontal dB grid lines (+15, 0, -15)
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';

    // 0 dB center line
    const zeroY = h / 2;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    // +7.5 dB line
    ctx.beginPath();
    ctx.moveTo(0, h * 0.25);
    ctx.lineTo(w, h * 0.25);
    ctx.stroke();

    // -7.5 dB line
    ctx.beginPath();
    ctx.moveTo(0, h * 0.75);
    ctx.lineTo(w, h * 0.75);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dashed

    // Map 10 bands to points (X evenly distributed, Y mapped from -15dB to +15dB)
    const points = [];
    const paddingX = w * 0.04;
    const stepX = (w - paddingX * 2) / (FREQUENCIES.length - 1);

    FREQUENCIES.forEach((_, i) => {
      const gain = eqEnabled ? bandGains[i] : 0;
      const x = paddingX + i * stepX;
      // -15dB is bottom (h - 6), +15dB is top (6), 0dB is center (h/2)
      const clampedGain = Math.max(-15, Math.min(15, gain));
      const y = zeroY - (clampedGain / 15) * (zeroY - 10);
      points.push({ x, y, gain });
    });

    if (points.length === 0) return;

    // Render smooth Hermite / Catmull-Rom spline curve
    ctx.beginPath();
    ctx.moveTo(0, eqEnabled ? points[0].y : zeroY);
    ctx.lineTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      // Catmull-Rom to Cubic Bézier control points
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.lineTo(w, eqEnabled ? points[points.length - 1].y : zeroY);

    // Save stroke path for gradient fill
    const path = new Path2D();
    // Replay curve onto path
    path.moveTo(0, eqEnabled ? points[0].y : zeroY);
    path.lineTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    path.lineTo(w, eqEnabled ? points[points.length - 1].y : zeroY);
    path.lineTo(w, h);
    path.lineTo(0, h);
    path.closePath();

    // Fill area below curve with soft translucent glow gradient
    const fillGradient = ctx.createLinearGradient(0, 0, 0, h);
    fillGradient.addColorStop(0, 'rgba(187, 134, 252, 0.28)');
    fillGradient.addColorStop(0.5, 'rgba(3, 218, 198, 0.12)');
    fillGradient.addColorStop(1, 'rgba(18, 18, 24, 0.0)');
    ctx.fillStyle = fillGradient;
    ctx.fill(path);

    // Stroke the neon line with glow
    ctx.save();
    ctx.shadowColor = eqEnabled ? '#bb86fc' : '#757575';
    ctx.shadowBlur = eqEnabled ? 12 : 2;
    ctx.lineWidth = 3;

    const strokeGrad = ctx.createLinearGradient(0, 0, w, 0);
    strokeGrad.addColorStop(0, '#bb86fc');
    strokeGrad.addColorStop(0.5, '#03dac6');
    strokeGrad.addColorStop(1, '#ffb74d');

    ctx.strokeStyle = eqEnabled ? strokeGrad : 'rgba(150, 150, 150, 0.4)';
    ctx.stroke();
    ctx.restore();

    // Draw band node circular handles
    points.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = eqEnabled ? '#ffffff' : '#888888';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = eqEnabled ? '#bb86fc' : '#555555';
      ctx.stroke();
    });
  }

  /**
   * Web Audio API Synthesizer Preview Demo
   * Generates a mellow chord and rhythmic groove so users hear the real EQ adjustments
   */
  function toggleAudioPreview() {
    if (isAudioPlaying) {
      stopAudioPreview();
    } else {
      startAudioPreview();
    }
  }

  function startAudioPreview() {
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Preamp Node
      preampNode = audioCtx.createGain();
      const pLinear = eqEnabled ? Math.pow(10, preampGain / 20) : 1;
      preampNode.gain.value = pLinear;

      // 10 BiquadFilterNodes (peaking filters)
      filterNodes = [];
      let lastNode = preampNode;

      FREQUENCIES.forEach((freq, i) => {
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4; // standard 1-octave bandwidth
        filter.gain.value = eqEnabled ? bandGains[i] : 0;

        lastNode.connect(filter);
        lastNode = filter;
        filterNodes.push(filter);
      });

      // Master output volume gain
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.25; // comfortable volume
      lastNode.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      // Start Synthesizer Loop (Rich electronic chord pad + sub kick/bass)
      playSynthGroove();

      isAudioPlaying = true;
      if (audioPreviewBtn) {
        audioPreviewBtn.classList.add('playing');
        audioPreviewBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
          Pausar Audio Demo
        `;
      }
    } catch (err) {
      console.warn('Web Audio could not start:', err);
    }
  }

  function stopAudioPreview() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }

    if (masterGain && audioCtx) {
      masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
      setTimeout(() => {
        if (audioCtx) {
          audioCtx.suspend();
        }
      }, 80);
    }

    isAudioPlaying = false;
    if (audioPreviewBtn) {
      audioPreviewBtn.classList.remove('playing');
      audioPreviewBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        Escuchar Audio Demo con EQ
      `;
    }
  }

  // Chord progression & bass groove generator
  const chords = [
    [130.81, 164.81, 196.00, 246.94], // C maj7
    [110.00, 130.81, 164.81, 196.00], // A min7
    [146.83, 174.61, 220.00, 261.63], // D min7
    [98.00, 123.47, 146.83, 174.61]   // G 7
  ];

  let chordIndex = 0;

  function playSynthGroove() {
    triggerChord(chords[chordIndex]);

    synthInterval = setInterval(() => {
      chordIndex = (chordIndex + 1) % chords.length;
      triggerChord(chords[chordIndex]);
    }, 1800);
  }

  function triggerChord(chordFreqs) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;

    // Sub Bass tone
    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(chordFreqs[0] / 2, now);
    bassGain.gain.setValueAtTime(0.3, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    bassOsc.connect(bassGain);
    bassGain.connect(preampNode);
    bassOsc.start(now);
    bassOsc.stop(now + 1.7);

    // Warm Chord Pad
    chordFreqs.forEach((freq) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);

      osc.connect(gain);
      gain.connect(preampNode);

      osc.start(now);
      osc.stop(now + 1.8);
    });

    // Percussive click / high hat sparkle
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 7000;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(preampNode);
    whiteNoise.start(now);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
