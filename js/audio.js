'use strict';

(function () {
  // Procedural ambient soundscape for the yacht: ocean swell + wind, synthesized
  // live with the Web Audio API. No audio files, no dependencies — filtered noise
  // shaped by slow LFOs. Playback must be started from a user gesture (the
  // Mac/PC choice) or the browser will keep the audio context suspended.

  var ctx = null;
  var master = null;
  var started = false;
  var muted = false;
  var TARGET_VOLUME = 0.45;

  function AudioContextClass() {
    return window.AudioContext || window.webkitAudioContext || null;
  }

  // A looping noise buffer. type 'brown' is deep and rounded (good for water);
  // 'white' is bright and airy (good for wind).
  function makeNoiseBuffer(type) {
    var seconds = 4;
    var length = ctx.sampleRate * seconds;
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    if (type === 'brown') {
      var last = 0;
      for (var i = 0; i < length; i++) {
        var w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.5;
      }
    } else {
      for (var j = 0; j < length; j++) {
        data[j] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  function noiseSource(type) {
    var src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(type);
    src.loop = true;
    return src;
  }

  // A slow oscillator that drives an AudioParam between (center - depth) and
  // (center + depth), used to make gains and filters breathe over time.
  function lfo(rate, center, depth, param) {
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = rate;
    var gain = ctx.createGain();
    gain.gain.value = depth;
    osc.connect(gain);
    gain.connect(param);
    param.value = center;
    osc.start();
    return osc;
  }

  function buildOcean() {
    // Brown noise → gentle lowpass → swell gain, so the wash rises and falls
    // like waves breaking against the hull.
    var src = noiseSource('brown');
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 550;
    lp.Q.value = 0.4;

    var swell = ctx.createGain();
    swell.gain.value = 0.5;

    src.connect(lp);
    lp.connect(swell);
    swell.connect(master);

    lfo(0.09, 0.42, 0.3, swell.gain);   // long primary swell
    lfo(0.23, 0, 0.12, swell.gain);     // shorter ripple on top
    src.start();
  }

  function buildWind() {
    // White noise → sweeping bandpass → soft gain, producing an airy wind that
    // rises and thins as it moves across the deck.
    var src = noiseSource('white');
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 0.7;

    var gust = ctx.createGain();
    gust.gain.value = 0.16;

    src.connect(bp);
    bp.connect(gust);
    gust.connect(master);

    lfo(0.05, 750, 350, bp.frequency);  // filter drifts → wind changes pitch
    lfo(0.07, 0.16, 0.1, gust.gain);    // gusts swell and fade
    src.start();
  }

  function start() {
    if (started) return;
    var Ctx = AudioContextClass();
    if (!Ctx) return; // Web Audio unavailable — game stays fully playable, just silent.
    started = true;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    buildOcean();
    buildWind();

    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    // Fade the sea in gently rather than snapping on.
    var now = ctx.currentTime;
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(muted ? 0 : TARGET_VOLUME, now + 4);
  }

  function toggleMute() {
    muted = !muted;
    if (master && ctx) {
      var now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(muted ? 0 : TARGET_VOLUME, now + 0.6);
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  window.Ambience = { start: start, toggleMute: toggleMute, isMuted: isMuted };
})();
