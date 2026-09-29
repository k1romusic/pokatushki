/* ============================================================
   audio.js — звук на WebAudio (никаких файлов)
   ============================================================ */
const SFX = (() => {
  let ac, master, eng, eng2, engFilter, engGain, noiseBuf, muted = false, engOn = false;
  try { muted = localStorage.getItem('gazel-muted') === '1'; } catch (e) {}

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    eng = ac.createOscillator(); eng.type = 'sawtooth'; eng.frequency.value = 45;
    eng2 = ac.createOscillator(); eng2.type = 'square'; eng2.frequency.value = 22;
    engFilter = ac.createBiquadFilter(); engFilter.type = 'lowpass'; engFilter.frequency.value = 300;
    engGain = ac.createGain(); engGain.gain.value = 0;
    const g2 = ac.createGain(); g2.gain.value = 0.5;
    eng.connect(engFilter); eng2.connect(g2).connect(engFilter);
    engFilter.connect(engGain).connect(master);
    eng.start(); eng2.start(); engOn = true;
  }
  function tone(freq, dur, type = 'square', vol = .08, when = 0, slideTo) {
    if (!ac) return;
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, vol = .2, freq = 800, when = 0, type = 'lowpass') {
    if (!ac) return;
    const t = ac.currentTime + when, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + .02);
  }
  return {
    init,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('gazel-muted', muted ? '1' : '0'); } catch (e) {}
      if (master) master.gain.value = muted ? 0 : 0.8;
      return muted;
    },
    /* ratio 0..1 — скорость; off — мотор выключен; loud — сломан глушитель; rough — дребезг */
    engine(ratio, o = {}) {
      if (!ac || !engOn) return;
      const t = ac.currentTime;
      const f = 34 + ratio * 66 + (o.rough ? Math.sin(t * 40) * 4 : 0);
      eng.frequency.setTargetAtTime(f, t, .05); eng2.frequency.setTargetAtTime(f / 2, t, .05);
      engFilter.frequency.setTargetAtTime(220 + ratio * 500 + (o.loud ? 900 : 0), t, .1);
      engGain.gain.setTargetAtTime(o.off ? 0 : 0.09 + ratio * 0.05 + (o.loud ? .07 : 0), t, .1);
    },
    engineOff() { if (ac && engOn) engGain.gain.setTargetAtTime(0, ac.currentTime, .05); },
    tick() { tone(1700, .035, 'square', .04); },
    pickup() { tone(700, .08, 'triangle', .1); tone(1050, .12, 'triangle', .1, .07); },
    hit() { noise(.25, .35, 500); tone(110, .25, 'sawtooth', .18, 0, 50); },
    thud() { noise(.18, .25, 300); tone(80, .2, 'sine', .25, 0, 40); },
    splash() { noise(.35, .2, 1500, 0, 'bandpass'); },
    honk() { tone(380, .35, 'sawtooth', .12); tone(480, .35, 'sawtooth', .1); },
    moo() { tone(180, .7, 'sawtooth', .12, 0, 110); },
    bang() { noise(.3, .3, 1200); tone(160, .2, 'square', .15, 0, 60); },
    sputter() { for (let i = 0; i < 4; i++) tone(90 - i * 8, .08, 'sawtooth', .12, i * .12); },
    step() { tone(500 + Math.random() * 200, .05, 'square', .05); },
    ok() { [523, 659, 784].forEach((f, i) => tone(f, .12, 'triangle', .12, i * .09)); },
    fail() { tone(220, .25, 'sawtooth', .12, 0, 110); },
    fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? .5 : .16, 'triangle', .12, i * .13)); },
    boom() {
      noise(1.4, .7, 700); noise(.8, .5, 3000, 0, 'highpass'); tone(90, 1.2, 'sawtooth', .4, 0, 25);
    },
    whistle() { tone(2200, .15, 'sine', .1); tone(2200, .3, 'sine', .1, .2); },
    sigh() { tone(260, .9, 'sine', .09, 0, 120); },
  };
})();
