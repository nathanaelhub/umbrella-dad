/* ============ UMBRELLA DAD · audio.js — AudioManager ============ */
/* Placeholder sound design, synthesized live with the WebAudio API so the
   game ships with zero audio assets. Every cue is a short procedural blip —
   swap these for real samples later by replacing the play() cases.

   Browsers block audio until a user gesture, so the context is created
   lazily on the first key/click (UD.audio.unlock()).                       */
(function (UD) {
  'use strict';

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ambienceOn: false,
    _ambNodes: null,
  };

  // ---- lazy boot on first user gesture ----------------------------------
  audio.unlock = function () {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;
    this.master.connect(this.ctx.destination);
  };

  audio.toggleMute = function () {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
    return this.muted;
  };

  // ---- tiny synth helpers ------------------------------------------------
  // a single enveloped oscillator tone
  function tone(a, { type = 'square', f0 = 440, f1 = f0, t = 0.12, vol = 0.3, dest }) {
    const ctx = a.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, now);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + t);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    o.connect(g); g.connect(dest || a.master);
    o.start(now); o.stop(now + t + 0.02);
  }

  // a burst of filtered noise (fizz / whoosh / impact texture)
  function noise(a, { t = 0.2, vol = 0.3, type = 'bandpass', f = 1200, q = 1, sweep = 0, dest }) {
    const ctx = a.ctx, now = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * t);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = type; filt.frequency.value = f; filt.Q.value = q;
    if (sweep) filt.frequency.exponentialRampToValueAtTime(Math.max(40, f + sweep), now + t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    src.connect(filt); filt.connect(g); g.connect(dest || a.master);
    src.start(now); src.stop(now + t);
  }

  // ---- the cue library ---------------------------------------------------
  audio.play = function (name) {
    if (!this.ctx || this.muted) return;
    const a = this;
    switch (name) {
      case 'grunt':       // dad takes a hit — short low "oof"
        tone(a, { type: 'sawtooth', f0: 230, f1: 90, t: 0.18, vol: 0.34 });
        break;
      case 'swing':       // umbrella whoosh
        noise(a, { type: 'bandpass', f: 900, q: 0.7, t: 0.22, vol: 0.32, sweep: 2200 });
        break;
      case 'hit':         // umbrella/soda connects — cartoon thwack + star ping
        noise(a, { type: 'lowpass', f: 500, t: 0.1, vol: 0.4 });
        tone(a, { type: 'square', f0: 880, f1: 1500, t: 0.1, vol: 0.22 });
        break;
      case 'fizz':        // soda thrown / fizz explosion
        noise(a, { type: 'highpass', f: 2600, t: 0.32, vol: 0.3 });
        tone(a, { type: 'sine', f0: 520, f1: 1100, t: 0.14, vol: 0.18 });
        break;
      case 'gull':        // seagull scream
        tone(a, { type: 'sawtooth', f0: 1400, f1: 900, t: 0.1, vol: 0.22 });
        tone(a, { type: 'sawtooth', f0: 1700, f1: 1100, t: 0.13, vol: 0.18 });
        break;
      case 'steal':       // gull yoinks a soda — descending "nyoom"
        tone(a, { type: 'triangle', f0: 1200, f1: 200, t: 0.3, vol: 0.3 });
        break;
      case 'whistle':     // coach whistle
        tone(a, { type: 'sine', f0: 2300, f1: 2500, t: 0.18, vol: 0.16 });
        break;
      case 'slip':        // ice-cream slick — wobbly slide
        tone(a, { type: 'sine', f0: 700, f1: 300, t: 0.35, vol: 0.2 });
        break;
      case 'panic':       // hot-sand hop
        tone(a, { type: 'square', f0: 1000, f1: 1300, t: 0.06, vol: 0.18 });
        break;
      case 'cooler':      // soda refill pickup — happy arpeggio
        [523, 659, 784, 1047].forEach((f, i) =>
          setTimeout(() => tone(a, { type: 'square', f0: f, t: 0.1, vol: 0.22 }), i * 60));
        break;
      case 'ui':          // menu move / select
        tone(a, { type: 'square', f0: 660, f1: 880, t: 0.06, vol: 0.18 });
        break;
      case 'lose':        // sad descending trombone-ish
        [392, 330, 262, 196].forEach((f, i) =>
          setTimeout(() => tone(a, { type: 'sawtooth', f0: f, t: 0.28, vol: 0.26 }), i * 160));
        break;
      case 'win':         // triumphant fanfare
        [523, 659, 784, 1047, 1319].forEach((f, i) =>
          setTimeout(() => {
            tone(a, { type: 'square', f0: f, t: 0.18, vol: 0.28 });
            tone(a, { type: 'triangle', f0: f * 2, t: 0.18, vol: 0.12 });
          }, i * 110));
        break;
    }
  };

  // ---- looping beach ambience (soft surf + distant crowd hush) ----------
  audio.startAmbience = function () {
    if (!this.ctx || this.ambienceOn) return;
    const ctx = this.ctx, now = ctx.currentTime;
    // surf: looping brown-ish noise through a slow low-pass
    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + (Math.random() * 2 - 1) * 0.04) * 0.96; ch[i] = last; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 600;
    const g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(0.5, now + 1.5);
    // slow swell LFO on the surf volume — feels like waves rolling in/out
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.12; lfoG.gain.value = 0.18;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(filt); filt.connect(g); g.connect(this.master);
    src.start(now); lfo.start(now);
    this._ambNodes = { src, lfo, g };
    this.ambienceOn = true;
  };

  audio.stopAmbience = function () {
    if (!this.ambienceOn || !this._ambNodes) return;
    const { src, lfo, g } = this._ambNodes, now = this.ctx.currentTime;
    g.gain.linearRampToValueAtTime(0, now + 0.5);
    try { src.stop(now + 0.55); lfo.stop(now + 0.55); } catch (e) {}
    this._ambNodes = null; this.ambienceOn = false;
  };

  UD.audio = audio;
})(window.UD);
