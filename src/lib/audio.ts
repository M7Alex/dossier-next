// ── Audio Engine v2 — Cinematic Web Audio API ──
let ctx: AudioContext | null = null;
let rvNode: ConvolverNode | null = null;
let voiceBuffer: AudioBuffer | null = null;
let ambienceNodes: { osc?: OscillatorNode; gain?: GainNode; lfo?: OscillatorNode }[] = [];
let ambienceRunning = false;
let ambienceMaster: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (ctx.state === 'running' && !rvNode) buildReverb();
  return ctx;
}

function buildReverb() {
  if (rvNode || !ctx) return;
  const sr = ctx.sampleRate, dur = 3.8, len = Math.floor(sr * dur);
  const b = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let e = 1;
    for (let i = 0; i < len; i++) { e *= 0.9997; d[i] = (Math.random() * 2 - 1) * e * Math.pow(1 - i / len, 1.6); }
    [[8,.72],[13,.58],[19,.50],[26,.44],[34,.38],[42,.32]].forEach(([ms,amp]) => {
      const off = Math.floor(sr * (ms as number) / 1000);
      for (let j = 0; j < Math.min(120, len - off); j++) d[off + j] += (ch===0?1:-1) * (amp as number) * (Math.random()*2-1);
    });
    for (let i = 2; i < len; i++) d[i] = d[i]*0.82 + d[i-1]*0.12 + d[i-2]*0.06;
  }
  rvNode = ctx.createConvolver(); rvNode.buffer = b;
  const mg = ctx.createGain(); mg.gain.value = 0.52;
  rvNode.connect(mg); mg.connect(ctx.destination);
}

function buildPlateRV(c: AudioContext): ConvolverNode {
  const sr = c.sampleRate, len = Math.floor(sr * 1.8);
  const buf = c.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1)*Math.exp(-5*i/len);
    [[8,.72],[13,.58],[19,.50],[26,.44]].forEach(([ms,amp]) => {
      const off = Math.floor(sr*(ms as number)/1000);
      for (let j = 0; j < Math.min(80, len-off); j++) d[off+j] += (ch===0?1:-1)*(amp as number)*(Math.random()*2-1);
    });
    for (let i = 2; i < len; i++) d[i] = d[i]*0.82 + d[i-1]*0.12 + d[i-2]*0.06;
  }
  const rv = c.createConvolver(); rv.buffer = buf; return rv;
}

function tone(f1:number,f2:number,dur:number,vol:number,wave:OscillatorType,atk:number,dcy:number,rv=0,delay=0) {
  const c=getCtx(); if(!c) return;
  const t=c.currentTime+delay;
  const o=c.createOscillator(), g=c.createGain();
  o.type=wave; o.frequency.setValueAtTime(f1,t);
  if(f2!==f1) o.frequency.exponentialRampToValueAtTime(Math.max(f2,1),t+dur);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+atk);
  g.gain.exponentialRampToValueAtTime(0.001,t+atk+dcy);
  o.connect(g); g.connect(c.destination);
  if(rv>0&&rvNode){const s=c.createGain();s.gain.value=rv;g.connect(s);s.connect(rvNode);}
  o.start(t); o.stop(t+atk+dcy+0.5);
}

function noise(bpf:number,Q:number,dur:number,vol:number,atk:number,dcy:number,rv=0,delay=0) {
  const c=getCtx(); if(!c) return;
  const t=c.currentTime+delay, sr=c.sampleRate;
  const len=Math.max(4,Math.floor(sr*(dur+0.15)));
  const buf=c.createBuffer(1,len,sr), d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  const src=c.createBufferSource(); src.buffer=buf;
  const flt=c.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=bpf; flt.Q.value=Q;
  const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+atk);
  g.gain.exponentialRampToValueAtTime(0.001,t+atk+dcy);
  src.connect(flt); flt.connect(g); g.connect(c.destination);
  if(rv>0&&rvNode){const s=c.createGain();s.gain.value=rv;g.connect(s);s.connect(rvNode);}
  src.start(t); src.stop(t+dur+0.25);
}

// ── Bande sonore ambiante orchestrale (slides 1-7) ──
function startAmbience() {
  const c = getCtx(); if (!c || ambienceRunning) return;
  ambienceRunning = true;
  ambienceNodes = [];

  const master = c.createGain();
  master.gain.setValueAtTime(0, c.currentTime);
  master.gain.linearRampToValueAtTime(0.16, c.currentTime + 5);
  master.connect(c.destination);
  ambienceMaster = master;

  const ambiRv = buildPlateRV(c);
  const rvG = c.createGain(); rvG.gain.value = 0.65;
  ambiRv.connect(rvG); rvG.connect(c.destination);

  // Drones fondamentaux — accord Dm7 (D-F-A-C)
  [36.7, 54.9, 73.4, 87.3, 110.0].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    // Légère dérive de pitch pour vie organique
    const drift = c.createOscillator(); drift.frequency.value = 0.04 + i*0.01;
    const driftG = c.createGain(); driftG.gain.value = 0.04 + i*0.01;
    drift.connect(driftG); driftG.connect(osc.frequency); drift.start();
    const g = c.createGain(); g.gain.value = 0.055 / (i+1);
    osc.connect(g); g.connect(master); g.connect(ambiRv);
    osc.start();
    ambienceNodes.push({ osc, gain: g, lfo: drift });
  });

  // Harmoniques triangle (plus doux)
  [146.8, 220.0, 293.7, 392.0].forEach((freq, i) => {
    const osc = c.createOscillator(); osc.type = 'triangle'; osc.frequency.value = freq;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07 + i*0.025;
    const lfoG = c.createGain(); lfoG.gain.value = 0.014;
    lfo.connect(lfoG); lfoG.connect(osc.frequency); lfo.start();
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.020 - i*0.003, c.currentTime + 8 + i*2);
    osc.connect(g); g.connect(master); g.connect(ambiRv);
    osc.start();
    ambienceNodes.push({ osc, gain: g, lfo });
  });

  // Shimmer haute fréquence (très subtil)
  const shim = c.createOscillator(); shim.type = 'sine'; shim.frequency.value = 880;
  const shimVib = c.createOscillator(); shimVib.frequency.value = 0.15;
  const shimVibG = c.createGain(); shimVibG.gain.value = 8;
  shimVib.connect(shimVibG); shimVibG.connect(shim.frequency); shimVib.start();
  const shimG = c.createGain(); shimG.gain.value = 0.0035;
  shim.connect(shimG); shimG.connect(ambiRv);
  shim.start();
  ambienceNodes.push({ osc: shim, gain: shimG, lfo: shimVib });
}

function stopAmbience(fadeTime = 3.5) {
  if (!ctx || !ambienceMaster) return;
  ambienceRunning = false;
  const c = ctx; const now = c.currentTime;
  ambienceMaster.gain.cancelScheduledValues(now);
  ambienceMaster.gain.setValueAtTime(ambienceMaster.gain.value, now);
  ambienceMaster.gain.linearRampToValueAtTime(0, now + fadeTime);
  ambienceNodes.forEach(({ osc, lfo }) => {
    setTimeout(() => { try { osc?.stop(); lfo?.stop(); } catch {} }, (fadeTime + 0.5) * 1000);
  });
  setTimeout(() => { ambienceNodes = []; ambienceMaster = null; }, (fadeTime + 1) * 1000);
}

const VOICE_B64 = "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";

export const audio = {
  init: () => getCtx(),

  // ── Touche numpad — clavier mécanique holographique ──
  key: () => {
    // Clic mécanique précis (impact + sustain)
    noise(4800, 14, 0.004, 0.13, 0.0005, 0.003, 0);
    noise(1100, 5,  0.014, 0.07, 0.001, 0.012, 0);
    // Tonalité holographique montante
    tone(2400, 1900, 0.020, 0.058, 'sine', 0.001, 0.018, 0.10);
    tone(1200, 950,  0.024, 0.040, 'triangle', 0.001, 0.022, 0.08);
    // Sub discret
    tone(58, 44, 0.018, 0.025, 'sine', 0.002, 0.015, 0);
  },

  // ── Suppression de chiffre ──
  del: () => {
    noise(3400, 9, 0.006, 0.085, 0.001, 0.005, 0);
    noise(600, 3, 0.010, 0.042, 0.001, 0.008, 0);
    tone(1500, 1150, 0.018, 0.050, 'sine', 0.001, 0.016, 0.06);
    tone(300, 240, 0.013, 0.030, 'triangle', 0.001, 0.011, 0);
  },

  // ── Erreur code — alarme basse imposante ──
  err: () => {
    tone(46, 30, 1.2, 0.155, 'sawtooth', 0.018, 1.1, 0.58);
    tone(92, 60, 0.9, 0.085, 'sawtooth', 0.012, 0.82, 0.48, 0.08);
    tone(50, 34, 1.0, 0.065, 'square', 0.022, 0.95, 0.40, 0.04);
    noise(56, 0.5, 0.9, 0.105, 0.025, 0.85, 0.45);
    noise(6000, 18, 0.003, 0.095, 0.0005, 0.002, 0); // clic d'alerte
  },

  // ── Code correct — accord pentatonique ascendant ──
  ok: () => {
    tone(554, 554,  0.15, 0.068, 'sine', 0.007, 0.14, 0.48);
    tone(740, 740,  0.19, 0.062, 'sine', 0.007, 0.18, 0.55, 0.12);
    tone(1109, 1109, 0.25, 0.046, 'sine', 0.007, 0.24, 0.63, 0.24);
    tone(1480, 1480, 0.32, 0.030, 'sine', 0.007, 0.31, 0.68, 0.36);
    noise(4200, 0.4, 0.32, 0.042, 0.04, 0.28, 0.58, 0.24);
  },

  // ── Tick horloge (phase holo) ──
  tick: () => {
    noise(255, 20, 0.011, 0.115, 0.001, 0.010, 0);
    tone(112, 82,  0.017, 0.070, 'triangle', 0.001, 0.015, 0);
    tone(445, 330, 0.008, 0.020, 'sine', 0.001, 0.007, 0.14, 0.003);
  },

  // ── Verrouillage ──
  lock: () => {
    noise(72, 1.8, 0.30, 0.165, 0.003, 0.28, 0.28);
    tone(46, 32, 0.40, 0.152, 'triangle', 0.005, 0.38, 0.30);
    tone(285, 285, 1.3, 0.085, 'sine', 0.008, 1.25, 0.72, 0.05);
    tone(570, 570, 0.85, 0.048, 'sine', 0.006, 0.82, 0.60, 0.10);
    tone(185, 460, 0.50, 0.042, 'sine', 0.01, 0.48, 0.52, 0.02);
  },

  // ── Stamp ──
  stamp: () => {
    noise(55, 1.8, 0.34, 0.185, 0.003, 0.32, 0.28);
    tone(38, 26, 0.46, 0.162, 'sawtooth', 0.004, 0.44, 0.22);
    tone(92, 92, 0.85, 0.058, 'sine', 0.015, 0.83, 0.48, 0.08);
  },

  // ── Reveal ──
  reveal: () => {
    tone(102, 920, 1.5, 0.075, 'sine', 0.08, 1.4, 0.72);
    noise(290, 0.4, 1.25, 0.062, 0.06, 1.18, 0.68, 0.10);
    tone(230, 460, 1.0, 0.038, 'triangle', 0.10, 0.92, 0.58, 0.05);
  },

  // ── Slide — whoosh cinématique directionnel ──
  slide: (direction: 'right' | 'left' = 'right') => {
    const f1 = direction === 'right' ? 380 : 560;
    const f2 = direction === 'right' ? 140 : 220;
    noise(f1 * 1.4, 0.65, 0.34, 0.090, 0.005, 0.32, 0.35);
    tone(f1, f2, 0.32, 0.048, 'sine', 0.008, 0.30, 0.25);
    noise(5800, 22, 0.003, 0.090, 0.0005, 0.002, 0); // snap
    tone(62, 46, 0.30, 0.038, 'triangle', 0.01, 0.28, 0.20);
  },

  // ── Bande sonore ambiante (slides 1-7) ──
  startAmbience,
  stopAmbience,

  // ── Voice synthétisée ──
  voice: async () => {
    const c = getCtx(); if (!c) return;
    audio.ambience();
    if (!voiceBuffer) {
      try {
        const bin = atob(VOICE_B64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        voiceBuffer = await c.decodeAudioData(bytes.buffer.slice(0));
      } catch { return; }
    }
    const src = c.createBufferSource(); src.buffer = voiceBuffer;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90; hp.Q.value = 0.7;
    const pres = c.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 3000; pres.gain.value = 2.5; pres.Q.value = 1.2;
    src.connect(hp); hp.connect(pres);
    const master = c.createGain(); master.gain.value = 0.21; pres.connect(master);
    const dry = c.createGain(); dry.gain.value = 0.82; master.connect(dry); dry.connect(c.destination);
    const plate = buildPlateRV(c);
    const pre = c.createDelay(0.12); pre.delayTime.value = 0.055;
    const wet = c.createGain(); wet.gain.value = 0.22;
    master.connect(pre); pre.connect(wet); wet.connect(plate);
    const pg = c.createGain(); pg.gain.value = 0.70; plate.connect(pg); pg.connect(c.destination);
    if (rvNode) { const tail = c.createGain(); tail.gain.value = 0.07; master.connect(tail); tail.connect(rvNode); }
    src.start(c.currentTime + 0.05);
  },

  ambience: () => {
    tone(36, 36, 5.5, 0.068, 'sine', 0.65, 4.8, 0.88);
    tone(72, 72, 4.5, 0.038, 'sine', 0.5, 3.8, 0.78, 0.22);
    noise(500, 0.3, 3.8, 0.030, 0.55, 3.2, 0.90, 0.3);
  },
};
