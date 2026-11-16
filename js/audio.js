/* Tonic — a small Web Audio synth. No samples, no network: an electric-piano
   style voice built from a few sine partials, plus the game's sound effects. */
(function (root) {
  'use strict';
  let ctx = null, master = null, enabled = true;
  let live = []; // currently scheduled voices, so a new phrase can cut the old one off

  function ensure() {
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function voice(m, t, dur, vel, bus) {
    const f = freq(m);
    const out = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(9000, f * 7), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(700, f * 2.2), t + 0.6);
    // softer in the high register, fuller in the low
    const v = vel * Math.min(1, 0.55 + 140 / f);
    const end = t + dur;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(v, t + 0.008);
    out.gain.exponentialRampToValueAtTime(v * 0.42, t + 0.28);
    out.gain.exponentialRampToValueAtTime(v * 0.2, Math.max(t + 0.3, end));
    out.gain.exponentialRampToValueAtTime(0.0001, end + 0.35);
    const oscs = [];
    [[1, 'triangle', 0.6], [2, 'sine', 0.22], [3, 'sine', 0.08], [1.003, 'sine', 0.3]].forEach(([mult, type, g]) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = type; o.frequency.value = f * mult; og.gain.value = g;
      o.connect(og); og.connect(lp);
      o.start(t); o.stop(end + 0.4);
      oscs.push(o);
    });
    lp.connect(out); out.connect(bus || master);
    return { out, oscs, end: end + 0.4 };
  }

  function stop() {
    if (!ctx) return;
    const now = ctx.currentTime;
    live.forEach((v) => {
      try {
        v.out.gain.cancelScheduledValues(now);
        v.out.gain.setValueAtTime(Math.max(0.0001, v.out.gain.value), now);
        v.out.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        v.oscs.forEach((o) => o.stop(now + 0.08));
      } catch (e) { /* already stopped */ }
    });
    live = [];
  }

  // events: [{at, midis:[..], dur}] — returns the phrase length in seconds.
  function play(events, opts) {
    const len = length(events);
    if (!enabled || !ensure()) return len;
    if (!opts || !opts.layer) stop();
    const t0 = ctx.currentTime + 0.06;
    events.forEach((ev) => {
      const vel = 0.5 / Math.sqrt(ev.midis.length);
      ev.midis.forEach((m) => live.push(voice(m, t0 + ev.at, ev.dur, vel)));
    });
    return len;
  }
  const length = (events) => events.reduce((mx, e) => Math.max(mx, e.at + e.dur), 0);
  function note(m, dur) {
    if (!enabled || !ensure()) return;
    live.push(voice(m, ctx.currentTime + 0.01, dur || 0.5, 0.45));
  }

  function blip(f, t, dur, type, gain) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  const SFX = {
    good(combo) {
      const t = ctx.currentTime, lift = Math.min(combo || 0, 8);
      const base = 76 + lift; // rises with your combo
      blip(freq(base), t, 0.16, 'sine', 0.22);
      blip(freq(base + 7), t + 0.08, 0.3, 'sine', 0.22);
      blip(freq(base + 19), t + 0.08, 0.2, 'sine', 0.05);
    },
    bad() {
      const t = ctx.currentTime;
      const o = blip(190, t, 0.3, 'triangle', 0.26);
      o.frequency.exponentialRampToValueAtTime(110, t + 0.28);
    },
    tap() { blip(660, ctx.currentTime, 0.05, 'sine', 0.08); },
    lock() { const t = ctx.currentTime; blip(392, t, 0.1, 'triangle', 0.16); blip(523, t + 0.07, 0.16, 'triangle', 0.16); },
    tick() { blip(1200, ctx.currentTime, 0.03, 'square', 0.03); },
    win() { const t = ctx.currentTime; [72, 76, 79, 84, 88].forEach((m, i) => blip(freq(m), t + i * 0.09, 0.5, 'sine', 0.16)); },
    level() { const t = ctx.currentTime; [60, 67, 72, 76, 79, 84].forEach((m, i) => blip(freq(m), t + i * 0.07, 0.7, 'triangle', 0.14)); },
    deep(score) {
      const t = ctx.currentTime, n = 2 + Math.round((score || 0) / 25);
      for (let i = 0; i < n; i++) blip(freq(67 + i * 4 - (i > 3 ? 1 : 0)), t + i * 0.07, 0.35, 'sine', 0.15);
    },
  };
  function sfx(name, arg) {
    if (!enabled || !ensure()) return;
    SFX[name](arg);
  }

  root.TonicAudio = {
    play, stop, note, sfx, length,
    unlock: ensure,
    setEnabled(v) { enabled = !!v; if (!enabled) stop(); },
    get enabled() { return enabled; },
  };
})(window);
