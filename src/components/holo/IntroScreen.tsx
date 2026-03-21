'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import { audio } from '@/lib/audio';
import HoloCanvas from './HoloCanvas';
import type { HoloRef } from './HoloCanvas';

type Phase = 'eagle' | 'pad' | 'holo' | 'done';

function launchConfetti() {
  const colors = ['#C9A84C','#E8C97A','#8B6914','rgba(80,200,200,0.9)'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    const sz = 4 + Math.random() * 7;
    el.style.cssText = `position:fixed;left:${20+Math.random()*60}%;top:-12px;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:2px;pointer-events:none;z-index:99999;transform:rotate(${Math.random()*360}deg);animation:confettiFall ${1.5+Math.random()*2}s ${Math.random()*0.8}s ease-in forwards;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }
}

// ─── Eagle silhouette (normalized, single closed polyline, top→clockwise) ───
const EP: [number, number][] = [
  // Head arc (approx, top → clockwise)
  [0.08,-0.34],[0.14,-0.32],[0.19,-0.27],[0.21,-0.20],
  // Beak
  [0.29,-0.20],[0.34,-0.17],[0.22,-0.13],
  // Head bottom / neck right
  [0.19,-0.13],[0.13,-0.06],[0.23,-0.03],
  // Right wing top sweep (outer)
  [0.40,-0.14],[0.60,-0.22],[0.80,-0.19],[1.00,-0.10],[1.10,0.04],
  // Right wing tip bottom
  [1.07,0.11],[0.90,0.18],
  // Right wing bottom inward
  [0.68,0.17],[0.46,0.13],[0.22,0.09],
  // Body right
  [0.13,0.16],[0.08,0.25],[0.05,0.33],
  // Right tail feather
  [0.16,0.47],[0.07,0.38],
  // Center bottom
  [0.00,0.43],
  // Left tail feather
  [-0.07,0.38],[-0.16,0.47],
  // Body left
  [-0.05,0.33],[-0.08,0.25],[-0.13,0.16],[-0.22,0.09],
  // Left wing bottom
  [-0.46,0.13],[-0.68,0.17],[-0.90,0.18],[-1.07,0.11],
  // Left wing tip
  [-1.10,0.04],[-1.00,-0.10],[-0.80,-0.19],[-0.60,-0.22],[-0.40,-0.14],
  // Neck left
  [-0.23,-0.03],[-0.13,-0.06],[-0.19,-0.13],[-0.22,-0.20],
  // Head left arc
  [-0.21,-0.27],[-0.14,-0.32],[-0.08,-0.34],
];

// Cumulative path length at each point (for lineDash reveal top→bottom)
function buildPathData(pts: [number,number][], S: number) {
  const lens: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = (pts[i][0] - pts[i-1][0]) * S;
    const dy = (pts[i][1] - pts[i-1][1]) * S;
    lens.push(lens[i-1] + Math.hypot(dx, dy));
  }
  return { total: lens[lens.length-1], lens };
}

// ─────────────────────────────────────────────────────────────
// GLOBE + EAGLE CANVAS — everything in one unified canvas
// ─────────────────────────────────────────────────────────────
function GlobeEagleCanvas({ phase, onEagleDone }: { phase: Phase; onEagleDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const t0Ref     = useRef<number>(0);
  const doneRef   = useRef(false);
  const angleRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    setSize();
    window.addEventListener('resize', setSize);
    t0Ref.current = performance.now();
    doneRef.current = false;

    // ─── Globe sphere points (Fibonacci lattice) ───
    const N  = 200;
    const GR = (1 + Math.sqrt(5)) / 2;
    type SP = { lat: number; lon: number; sz: number; hub: boolean };
    const SPTS: SP[] = Array.from({ length: N }, (_, i) => ({
      lat: Math.acos(1 - 2*(i+0.5)/N),
      lon: 2*Math.PI*i/GR,
      sz:  Math.random() < 0.07 ? 3.0 : Math.random() < 0.22 ? 1.8 : 1.0,
      hub: Math.random() < 0.07,
    }));

    // ─── Fragment seed data (computed once) ───
    // Each fragment: starts on screen edge, flies to globe or eagle target
    type FragSeed = {
      edge: number; edgePos: number;      // which edge + position along it
      noise: number;                       // lateral noise
      isGold: boolean;                     // gold=eagle, cyan=globe
      sptIdx: number; epIdx: number;       // target indices
      delay: number;                       // stagger delay [0..0.40]
      shape: 0|1|2;                        // 0=dot 1=arc 2=line
      angle: number; size: number;
    };
    const FRAG_N = 160;
    const seeds: FragSeed[] = Array.from({ length: FRAG_N }, (_, i) => ({
      edge:    Math.floor(Math.random()*4) as 0|1|2|3,
      edgePos: Math.random(),
      noise:   (Math.random()-0.5)*60,
      isGold:  i < 55,
      sptIdx:  Math.floor(Math.random()*N),
      epIdx:   Math.floor(Math.random()*EP.length),
      delay:   Math.random()*0.38,
      shape:   (Math.floor(Math.random()*3)) as 0|1|2,
      angle:   Math.random()*Math.PI*2,
      size:    1.3 + Math.random()*2.2,
    }));

    // ─── Easing helpers ───
    const eO  = (t: number) => 1 - Math.pow(Math.max(0,Math.min(1,1-t)), 3);
    const eIO = (t: number) => {
      t = Math.max(0,Math.min(1,t));
      return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    };
    const c01 = (t: number, a: number, b: number) =>
      eO(Math.max(0, Math.min(1, (t-a)/(b-a))));

    // ─── Radial soft glow (no hard edge) ───
    const rGlow = (cx2:number,cy2:number,r0:number,r1:number,R:number,G:number,B:number,a:number) => {
      const g = ctx.createRadialGradient(cx2,cy2,r0, cx2,cy2,r1);
      g.addColorStop(0.00, `rgba(${R},${G},${B},${a})`);
      g.addColorStop(0.45, `rgba(${R},${G},${B},${a*0.40})`);
      g.addColorStop(0.75, `rgba(${R},${G},${B},${a*0.12})`);
      g.addColorStop(1.00, `rgba(${R},${G},${B},0)`);
      ctx.beginPath(); ctx.arc(cx2,cy2,r1,0,Math.PI*2);
      ctx.fillStyle = g; ctx.fill();
    };

    // ─── Orbital ring (soft multi-layer stroke) ───
    const softRing = (cx2:number,cy2:number,rx:number,ry:number,rot:number,gold:boolean,a:number) => {
      if (a < 0.005) return;
      const c = gold ? '201,168,76' : '80,200,200';
      ctx.save();
      ctx.translate(cx2,cy2);
      ctx.rotate(rot);
      [[8,0.03],[4,0.06],[1.4,0.16]].forEach(([lw,la]) => {
        ctx.beginPath();
        ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
        ctx.strokeStyle = `rgba(${c},${(la as number)*a})`;
        ctx.lineWidth   = lw as number;
        ctx.stroke();
      });
      ctx.restore();
    };

    const DURATION = phase === 'eagle' ? 8500 : 999_999;

    const draw = (ts: number) => {
      const W  = canvas.width;
      const H  = canvas.height;
      const cx = W/2, cy = H/2;
      const R  = Math.min(W,H) * 0.27;
      const el = ts - t0Ref.current;
      const t  = Math.min(el / DURATION, 1.0);
      ctx.clearRect(0,0,W,H);

      // ─── Timeline (all 0→1) ───
      const globeP = c01(t, 0.00, 0.52);  // globe builds       0–4.4s
      const gridP  = c01(t, 0.02, 0.50);  // grid appears
      const orbP   = c01(t, 0.06, 0.48);  // orbitals
      const fragP  = c01(t, 0.00, 0.52);  // fragments fly in
      const eagleP = c01(t, 0.26, 0.74);  // eagle descends     2.2–6.3s
      const traceP = c01(t, 0.36, 0.82);  // path traces        3.1–7.0s
      const mergeP = eIO(c01(t, 0.76, 0.94)); // fusion          6.5–8.0s
      const holdP  = c01(t, 0.92, 1.00);

      angleRef.current += 0.0028;
      const ga   = angleRef.current;
      const TILT = 0.28;

      // 3D → 2D projection
      const proj = (lat: number, lon: number) => {
        const cL = Math.sin(lat), sL = Math.cos(lat);
        const x3 = cL*Math.cos(lon+ga), z3 = cL*Math.sin(lon+ga), y3 = sL;
        const y2 = y3*Math.cos(TILT) - z3*Math.sin(TILT);
        const z2 = y3*Math.sin(TILT) + z3*Math.cos(TILT);
        return { px: cx+x3*R, py: cy-y2*R, z: z2, vis: (z2+1)/2 };
      };

      // ══ 1. Background: subtle dot grid ══
      if (gridP > 0.01) {
        const GS = 36;
        for (let gx = GS/2; gx < W; gx += GS) {
          for (let gy = GS/2; gy < H; gy += GS) {
            const d = Math.hypot(gx-cx, gy-cy);
            const fade = Math.max(0, 1 - d/(R*3.8));
            if (fade < 0.04) continue;
            ctx.globalAlpha = 0.018 * gridP * fade;
            ctx.fillStyle = 'rgba(80,200,200,1)';
            ctx.beginPath(); ctx.arc(gx,gy,0.85,0,Math.PI*2); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        // Faint radial lines
        ctx.globalAlpha = 0.012 * gridP;
        ctx.strokeStyle = 'rgba(80,200,200,1)'; ctx.lineWidth = 0.38;
        for (let a = 0; a < Math.PI*2; a += Math.PI/14) {
          ctx.beginPath();
          ctx.moveTo(cx+Math.cos(a)*R*0.12, cy+Math.sin(a)*R*0.12);
          ctx.lineTo(cx+Math.cos(a)*R*3.6,  cy+Math.sin(a)*R*3.6);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // ══ 2. Atmospheric glow layers (soft, NO hard arc stroke) ══
      const gA = Math.max(0.18, globeP);
      rGlow(cx,cy, 0,      R*2.6, 30, 150, 200, 0.032*gA);
      rGlow(cx,cy, 0,      R*1.5, 60, 140, 200, 0.055*gA);
      rGlow(cx-R*0.1,cy-R*0.1, 0, R*0.9, 80, 190, 220, 0.04*gA);
      if (mergeP > 0) rGlow(cx,cy, 0, R*2.0, 201,168,76, 0.10*mergeP);

      // ══ 3. Grid lines (lat/lon) — draw progressively ══
      ctx.lineWidth = 0.42;
      const gridReveal = gridP;
      // Latitude
      for (let ld = -75; ld <= 75; ld += 15) {
        const isEq = ld === 0;
        ctx.globalAlpha = (0.048 + (isEq ? 0.04 : 0)) * gridReveal;
        ctx.strokeStyle  = isEq ? '#50C8C8' : 'rgba(80,200,200,1)';
        ctx.beginPath(); let first = true;
        const maxL = 360 * gridReveal;
        for (let lo = 0; lo <= maxL; lo += 2.5) {
          const {px,py,z} = proj(ld*Math.PI/180, lo*Math.PI/180);
          if (z < -0.04) { first=true; continue; }
          if (first) { ctx.moveTo(px,py); first=false; } else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
      // Longitude
      for (let lo = 0; lo < 360; lo += 15) {
        ctx.globalAlpha = 0.042 * gridReveal;
        ctx.strokeStyle = 'rgba(80,200,200,1)';
        ctx.beginPath(); let first = true;
        for (let ld = -86; ld <= 86; ld += 3) {
          const {px,py,z} = proj(ld*Math.PI/180, lo*Math.PI/180);
          if (z < -0.04) { first=true; continue; }
          if (first) { ctx.moveTo(px,py); first=false; } else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ══ 4. Globe nodes & hub connections ══
      const visN = Math.min(N, Math.floor(N * Math.pow(globeP, 0.55)));
      type PP = { px:number; py:number; z:number; vis:number; hub:boolean; sz:number };
      const pps: PP[] = [];
      for (let i = 0; i < visN; i++) {
        const sp = SPTS[i];
        const pp = proj(sp.lat, sp.lon);
        pps.push({ ...pp, hub: sp.hub, sz: sp.sz });
      }
      pps.sort((a,b) => a.z - b.z);

      // Normal connections (cyan, thin)
      for (let i = 0; i < pps.length; i++) {
        const a = pps[i]; if (a.z < 0) continue;
        for (let j = i+1; j < pps.length; j++) {
          const b = pps[j]; if (b.z < 0) continue;
          const d = Math.hypot(a.px-b.px, a.py-b.py);
          const md = R*0.22;
          if (d < md) {
            ctx.globalAlpha = Math.min(a.vis,b.vis)*0.16*(1-d/md);
            ctx.beginPath(); ctx.strokeStyle='rgba(80,200,200,1)'; ctx.lineWidth=0.4;
            ctx.moveTo(a.px,a.py); ctx.lineTo(b.px,b.py); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Hub connections (gold + animated particle)
      const hubs = pps.filter(p => p.hub && p.z > 0.04);
      for (let i = 0; i < hubs.length; i++) {
        for (let j = i+1; j < hubs.length; j++) {
          const a = hubs[i], b = hubs[j];
          const d = Math.hypot(a.px-b.px, a.py-b.py);
          if (d < R*0.68) {
            const al = Math.min(a.vis,b.vis)*0.40*(1-d/(R*0.68));
            const lg = ctx.createLinearGradient(a.px,a.py,b.px,b.py);
            lg.addColorStop(0, `rgba(201,168,76,${al})`);
            lg.addColorStop(.5,`rgba(80,200,200,${al*0.6})`);
            lg.addColorStop(1, `rgba(201,168,76,${al})`);
            ctx.beginPath(); ctx.strokeStyle=lg; ctx.lineWidth=0.95;
            ctx.moveTo(a.px,a.py); ctx.lineTo(b.px,b.py); ctx.stroke();
            const tp = ((el/1300)+i*0.28+j*0.16) % 1;
            const mx = a.px+(b.px-a.px)*tp, my = a.py+(b.py-a.py)*tp;
            ctx.beginPath(); ctx.arc(mx,my,1.7,0,Math.PI*2);
            ctx.fillStyle=`rgba(201,168,76,${al*2.2})`;
            ctx.shadowColor='#C9A84C'; ctx.shadowBlur=9;
            ctx.fill(); ctx.shadowBlur=0;
          }
        }
      }

      // Node points
      for (const p of pps) {
        if (p.z < -0.12) continue;
        if (p.hub) {
          const pulse = 1 + Math.sin(el/650+p.px*0.05)*0.45;
          ctx.beginPath(); ctx.arc(p.px,p.py, p.sz*1.5*pulse, 0, Math.PI*2);
          ctx.fillStyle=`rgba(201,168,76,${p.vis*0.88*(0.65+mergeP*0.35)})`;
          ctx.shadowColor='#C9A84C'; ctx.shadowBlur=14; ctx.fill(); ctx.shadowBlur=0;
          // Rotating partial ring around hub
          ctx.save(); ctx.translate(p.px,p.py); ctx.rotate(el/1400);
          ctx.beginPath(); ctx.arc(0,0,p.sz*3.0, 0, Math.PI*1.3);
          ctx.strokeStyle=`rgba(201,168,76,${p.vis*0.28})`; ctx.lineWidth=0.8; ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(p.px,p.py, p.sz*0.88, 0, Math.PI*2);
          ctx.fillStyle=`rgba(80,200,200,${p.vis*0.72})`;
          ctx.shadowColor='rgba(80,200,200,0.9)'; ctx.shadowBlur=p.sz*5;
          ctx.fill(); ctx.shadowBlur=0;
        }
      }

      // ══ 5. Orbital rings (3 planes, soft multi-layer) ══
      if (orbP > 0.01) {
        const a0 = orbP * (0.7 + mergeP*0.3);
        // Outer cyan ring (slightly tilted)
        softRing(cx,cy, R*1.28, R*0.25, 0.32,  false, a0*0.75);
        // Gold ring (more tilted)
        softRing(cx,cy, R*1.42, R*0.20, 0.95,  true,  a0*0.55);
        // Third ring (opposite tilt)
        softRing(cx,cy, R*1.56, R*0.18, -0.48, false, a0*0.40);

        // Animated dots on each ring
        const rings = [
          {rx:R*1.28,ry:R*0.25,rot:0.32,speed:0.9, gold:false},
          {rx:R*1.42,ry:R*0.20,rot:0.95,speed:-0.6,gold:true},
          {rx:R*1.56,ry:R*0.18,rot:-0.48,speed:0.5,gold:false},
        ];
        rings.forEach(ring => {
          const a = el/1000*ring.speed;
          ctx.save(); ctx.translate(cx,cy); ctx.rotate(ring.rot);
          const dx = Math.cos(a)*ring.rx, dy = Math.sin(a)*ring.ry;
          ctx.restore();
          const dxF = cx + dx*Math.cos(ring.rot) - dy*Math.sin(ring.rot);
          const dyF = cy + dx*Math.sin(ring.rot) + dy*Math.cos(ring.rot);
          ctx.beginPath(); ctx.arc(dxF,dyF,2.8,0,Math.PI*2);
          const c = ring.gold ? '201,168,76' : '80,200,200';
          ctx.fillStyle=`rgba(${c},${a0*0.85})`;
          ctx.shadowColor=`rgba(${c},0.9)`; ctx.shadowBlur=12;
          ctx.fill(); ctx.shadowBlur=0;
        });
      }

      // ══ 6. Fragments flying in from screen edges ══
      if (fragP > 0.005) {
        seeds.forEach((s, idx) => {
          const lP = Math.max(0, (fragP - s.delay) / (1 - s.delay));
          if (lP <= 0) return;
          const eP = 1 - Math.pow(1-lP, 2.8);

          // Source pos (screen edge)
          let sx = 0, sy = 0;
          switch (s.edge) {
            case 0: sx = s.edgePos*W;  sy = -25; break;
            case 1: sx = W+25;         sy = s.edgePos*H; break;
            case 2: sx = s.edgePos*W;  sy = H+25; break;
            default:sx = -25;          sy = s.edgePos*H; break;
          }

          // Target pos
          let tx = cx, ty = cy;
          if (s.isGold) {
            // Eagle outline target
            const ep = EP[s.epIdx];
            tx = cx + ep[0]*R*0.72;
            ty = cy + ep[1]*R*0.72;
          } else {
            // Globe surface target
            const sp = SPTS[s.sptIdx];
            const {px,py,z} = proj(sp.lat, sp.lon);
            if (z > -0.1) { tx=px; ty=py; } else { tx=cx; ty=cy; }
          }

          // Organic path: slight arc via noise
          const curve = Math.sin(lP*Math.PI) * s.noise;
          const perp = Math.atan2(ty-sy, tx-sx) + Math.PI/2;
          const fx = sx + (tx-sx)*eP + Math.cos(perp)*curve*(1-eP);
          const fy = sy + (ty-sy)*eP + Math.sin(perp)*curve*(1-eP);

          const al = Math.min(1, lP*2.5) * (s.isGold ? 0.78 : 0.58);
          const col = s.isGold ? `rgba(201,168,76,${al})` : `rgba(80,200,200,${al})`;
          ctx.globalAlpha = al;
          if (s.shape === 0) {
            ctx.beginPath(); ctx.arc(fx,fy,s.size,0,Math.PI*2);
            ctx.fillStyle=col; ctx.fill();
          } else if (s.shape === 1) {
            ctx.beginPath(); ctx.arc(fx,fy,s.size*4.5, s.angle, s.angle+Math.PI*0.45);
            ctx.strokeStyle=col; ctx.lineWidth=0.95; ctx.stroke();
          } else {
            const dx2=Math.cos(s.angle)*s.size*4.5, dy2=Math.sin(s.angle)*s.size*4.5;
            ctx.beginPath(); ctx.moveTo(fx-dx2,fy-dy2); ctx.lineTo(fx+dx2,fy+dy2);
            ctx.strokeStyle=col; ctx.lineWidth=0.95; ctx.stroke();
          }
          ctx.globalAlpha = 1;
        });
      }

      // ══ 7. EAGLE — descends from above, traces outline ══
      const eagleVis = eagleP * (1 - mergeP);
      if (eagleVis > 0.004) {
        const S = R * 0.70;
        // Descend from above screen
        const startY = cy - H*0.88;
        const desP   = eIO(Math.max(0, Math.min(1, eagleP*1.5)));
        const ay     = startY + (cy - startY) * desP;

        ctx.save();
        ctx.translate(cx, ay);

        // Soft halo around eagle (pure radialGradient, no arc stroke)
        rGlow(0,0, 0, S*1.9, 201,168,76, eagleVis*0.10);
        rGlow(0,0, S*0.2, S*1.2, 201,168,76, eagleVis*0.06);

        // ─ Path reveal via lineDashOffset ─
        const { total: pLen } = buildPathData(EP, S);
        ctx.setLineDash([pLen]);
        ctx.lineDashOffset = pLen * (1 - Math.min(traceP*1.1, 1));
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        // Draw eagle path — glow layers then main
        [[9, 0.035], [5, 0.07], [2.6, 0.13]].forEach(([lw, la]) => {
          ctx.lineWidth   = lw as number;
          ctx.strokeStyle = `rgba(201,168,76,${(la as number)*eagleVis})`;
          ctx.beginPath();
          EP.forEach(([x,y],i) => i===0 ? ctx.moveTo(x*S,y*S) : ctx.lineTo(x*S,y*S));
          ctx.stroke();
        });
        ctx.lineWidth   = 1.5;
        ctx.strokeStyle = `rgba(235,205,90,${eagleVis*0.92})`;
        ctx.beginPath();
        EP.forEach(([x,y],i) => i===0 ? ctx.moveTo(x*S,y*S) : ctx.lineTo(x*S,y*S));
        ctx.stroke();

        ctx.setLineDash([]);

        // Key node dots (appear progressively as path traces)
        const NODES: [number,number][] = [
          [0.08,-0.34],   // head top
          [0.34,-0.17],   // beak tip
          [1.10, 0.04],   // right wing tip
          [-1.10, 0.04],  // left wing tip
          [0.00, 0.43],   // tail bottom
          [0.16, 0.47],   // right tail tip
          [-0.16, 0.47],  // left tail tip
          [0.00, 0.00],   // body center
        ];
        NODES.forEach(([nx,ny], ni) => {
          const np = Math.max(0, traceP*5 - ni*0.5);
          if (np <= 0) return;
          const na = Math.min(1,np)*eagleVis;
          ctx.beginPath();
          ctx.arc(nx*S, ny*S, 3.2 + Math.sin(el/480+ni)*0.9, 0, Math.PI*2);
          ctx.fillStyle=`rgba(201,168,76,${na})`;
          ctx.shadowColor='#C9A84C'; ctx.shadowBlur=18;
          ctx.fill(); ctx.shadowBlur=0;
        });

        ctx.restore();
      }

      // ══ 8. Merge pulse ══
      if (mergeP > 0) {
        const pr = R*(0.95 + mergeP*0.18);
        rGlow(cx,cy, pr*0.7, pr*1.5, 201,168,76, 0.14*mergeP);
        rGlow(cx,cy, 0, pr*0.9, 255,230,120, 0.06*mergeP);
      }

      // ══ Done ══
      if (phase === 'eagle' && t >= 1.0 && !doneRef.current) {
        doneRef.current = true;
        onEagleDone();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', setSize); };
  }, [phase, onEagleDone]);

  return (
    <canvas ref={canvasRef} style={{
      position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none',
      opacity: phase === 'holo' ? 0.20 : 1,
      transition: 'opacity 1.4s ease',
    }}/>
  );
}

// ─── CodeBox ───
function CodeBox({ index, entered, status }: { index:number; entered:string; status:'idle'|'ok'|'err' }) {
  const isFilled = index < entered.length;
  const isActive = index === entered.length && status === 'idle';
  const bc = status==='err'?'rgba(192,57,43,0.85)':status==='ok'?'rgba(180,160,80,0.80)':isFilled?'rgba(201,168,76,0.55)':isActive?'rgba(201,168,76,0.85)':'rgba(201,168,76,0.15)';
  const gc = status==='err'?'rgba(192,57,43,0.30)':status==='ok'?'rgba(201,168,76,0.40)':isActive?'rgba(201,168,76,0.25)':'transparent';
  return (
    <motion.div animate={status==='err'?{x:[-8,8,-6,6,-3,3,0]}:{}} transition={{duration:0.4}}
      style={{width:54,height:66,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:4,border:`1.5px solid ${bc}`,background:isActive?'rgba(201,168,76,0.06)':'rgba(201,168,76,0.02)',position:'relative',boxShadow:`0 0 18px ${gc}`,transition:'border-color .2s, box-shadow .3s'}}>
      <div style={{position:'absolute',top:3,left:3,width:6,height:6,borderTop:`1px solid ${bc}`,borderLeft:`1px solid ${bc}`,opacity:0.7}}/>
      <div style={{position:'absolute',bottom:3,right:3,width:6,height:6,borderBottom:`1px solid ${bc}`,borderRight:`1px solid ${bc}`,opacity:0.7}}/>
      {isFilled
        ? <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400}}
            style={{width:10,height:10,borderRadius:'50%',background:'#C9A84C',boxShadow:'0 0 12px rgba(201,168,76,0.8)'}}/>
        : isActive
          ? <motion.div animate={{opacity:[1,0,1]}} transition={{duration:0.85,repeat:Infinity}}
              style={{width:2.5,height:26,background:'#C9A84C',borderRadius:2,boxShadow:'0 0 8px rgba(201,168,76,0.8)'}}/>
          : null}
    </motion.div>
  );
}

// ─── NumKey ───
function NumKey({ digit, onClick }: { digit:string; onClick:()=>void }) {
  const [p, setP] = useState(false);
  return (
    <motion.button
      onPointerDown={()=>{setP(true);onClick();}} onPointerUp={()=>setP(false)} onPointerLeave={()=>setP(false)}
      animate={p?{scale:0.88}:{scale:1}} transition={{type:'spring',stiffness:600,damping:25}}
      style={{fontFamily:'Share Tech Mono,monospace',fontSize:18,fontWeight:600,padding:'12px 0',borderRadius:4,width:'100%',background:p?'rgba(201,168,76,0.14)':'rgba(201,168,76,0.04)',border:`1px solid ${p?'rgba(201,168,76,0.45)':'rgba(201,168,76,0.14)'}`,color:p?'#E8C97A':'#A89878',cursor:'pointer',userSelect:'none',position:'relative',overflow:'hidden',transition:'box-shadow .12s, color .12s'}}>
      {p&&<motion.div initial={{scale:0,opacity:0.6}} animate={{scale:3,opacity:0}} transition={{duration:0.4}} style={{position:'absolute',top:'50%',left:'50%',width:30,height:30,borderRadius:'50%',background:'rgba(201,168,76,0.3)',transform:'translate(-50%,-50%)',pointerEvents:'none'}}/>}
      {digit}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// INTRO SCREEN
// ─────────────────────────────────────────────────────────────
export default function IntroScreen() {
  const { setMode } = useDossier();
  const [phase,     setPhase]     = useState<Phase>('eagle');
  const [entered,   setEntered]   = useState('');
  const [status,    setStatus]    = useState<'idle'|'ok'|'err'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [gStat,     setGStat]     = useState("Analyse du protocole d'accès...");
  const [showVBox,  setShowVBox]  = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [attempts,  setAttempts]  = useState(0);
  const holoRef   = useRef<HoloRef>(null);
  const audioInit = useRef(false);
  const busy      = useRef(false);

  const handleEagleDone = useCallback(() => {
    setTimeout(() => setPhase('pad'), 500);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (phase==='eagle') setPhase('pad'); }, 10000);
    return () => clearTimeout(t);
  }, [phase]);

  const initAudio = () => { if (!audioInit.current) { audio.init(); audioInit.current=true; } };

  const addDigit = (d:string) => {
    if (busy.current||entered.length>=4) return;
    initAudio(); audio.key();
    const next=entered+d; setEntered(next);
    if (next.length===4) { busy.current=true; setTimeout(()=>checkCode(next),380); }
  };
  const delDigit = () => {
    if (busy.current) return; initAudio(); audio.del();
    setEntered(e=>e.slice(0,-1)); setStatusMsg('');
  };
  const checkCode = (code:string) => {
    const isA=code===CONFIG.codes.admin, isV=code===CONFIG.codes.visiteur;
    if (isA||isV) {
      audio.ok(); setStatus('ok');
      setStatusMsg(isA?'✓ ACCÈS ADMINISTRATEUR — ÉDITION ACTIVÉE':'✓ ACCÈS VISITEUR — LECTURE SEULE');
      setTimeout(()=>startHolo(isA?'admin':'visitor'),1000);
    } else {
      audio.err(); setStatus('err'); setAttempts(a=>a+1);
      setStatusMsg('✗ CODE INCORRECT — ACCÈS REFUSÉ');
      setTimeout(()=>{ setStatus('idle'); setStatusMsg(''); setEntered(''); busy.current=false; },1400);
    }
  };
  const startHolo = (m:'admin'|'visitor') => {
    setPhase('holo');
    [0,155,295,420,530,625,705,772,828,872,908,934,952,963].forEach(d=>setTimeout(()=>audio.tick(),d+260));
    setTimeout(()=>{ holoRef.current?.lock(); audio.lock(); setGStat('Déclassification en cours...'); },1620);
    setTimeout(()=>{ audio.voice(); setShowVBox(true); },2700);
    setTimeout(()=>{ setShowStamp(true); audio.stamp(); },4200);
    setTimeout(()=>{ audio.reveal(); launchConfetti(); setPhase('done'); setMode(m); },6500);
  };

  if (phase==='done') return null;
  const mono: React.CSSProperties = { fontFamily:'"Share Tech Mono",monospace' };

  return (
    <motion.div exit={{opacity:0,scale:1.04}} transition={{duration:0.9}}
      style={{position:'fixed',inset:0,zIndex:9999,background:'#020810',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>

      {/* Canvas (globe + eagle always visible) */}
      <GlobeEagleCanvas phase={phase} onEagleDone={handleEagleDone}/>

      {/* Scan line */}
      <motion.div animate={{y:['-4px','100vh']}} transition={{duration:9,repeat:Infinity,ease:'linear',repeatDelay:3}}
        style={{position:'absolute',left:0,right:0,height:2,pointerEvents:'none',background:'linear-gradient(90deg,transparent,rgba(80,200,200,0.08),transparent)',zIndex:2}}/>

      {/* HUD corners */}
      {[{top:12,left:12,borderTop:'1.5px solid rgba(201,168,76,0.38)',borderLeft:'1.5px solid rgba(201,168,76,0.38)'},{top:12,right:12,borderTop:'1.5px solid rgba(201,168,76,0.38)',borderRight:'1.5px solid rgba(201,168,76,0.38)'},{bottom:12,left:12,borderBottom:'1.5px solid rgba(201,168,76,0.38)',borderLeft:'1.5px solid rgba(201,168,76,0.38)'},{bottom:12,right:12,borderBottom:'1.5px solid rgba(201,168,76,0.38)',borderRight:'1.5px solid rgba(201,168,76,0.38)'}].map((s,i)=>(
        <motion.div key={i} initial={{opacity:0,scale:0.4}} animate={{opacity:1,scale:1}} transition={{delay:0.3+i*0.1}}
          style={{position:'absolute',...s,width:44,height:44,zIndex:25,pointerEvents:'none'}}/>
      ))}

      {/* Eagle phase label */}
      {phase==='eagle' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2}}
          style={{position:'absolute',bottom:'16%',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:10,pointerEvents:'none',zIndex:10}}>
          <div style={{...mono,fontSize:9,letterSpacing:6,color:'rgba(201,168,76,0.28)',textTransform:'uppercase',whiteSpace:'nowrap'}}>
            Département des Finances — Los Santos
          </div>
          <motion.div animate={{opacity:[0.15,0.55,0.15]}} transition={{duration:1.6,repeat:Infinity}}
            style={{...mono,fontSize:8,letterSpacing:5,color:'rgba(80,200,200,0.20)',textTransform:'uppercase'}}>
            ◈ Initialisation du système sécurisé...
          </motion.div>
        </motion.div>
      )}

      {/* PAD phase */}
      {phase==='pad' && (
        <motion.div key="pad" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.55,ease:[0.22,1,0.36,1]}}
          style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',position:'relative',zIndex:10}}>

          {attempts>0&&<motion.div initial={{opacity:0}} animate={{opacity:1}} style={{position:'absolute',top:-30,right:0,...mono,fontSize:9,letterSpacing:3,color:'rgba(192,57,43,0.62)',textTransform:'uppercase'}}>TENTATIVES : {attempts}</motion.div>}

          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:0.10,duration:0.7,ease:[0.22,1,0.36,1]}}
            style={{width:320,height:1,background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.55),transparent)',marginBottom:14}}/>

          <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:0.20,type:'spring',stiffness:160}}
            style={{marginBottom:12,position:'relative'}}>
            <motion.div animate={{opacity:[0.20,0.55,0.20],scale:[0.92,1.08,0.92]}} transition={{duration:3.8,repeat:Infinity}}
              style={{position:'absolute',inset:-18,borderRadius:'50%',background:'radial-gradient(circle,rgba(80,200,200,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
            <div style={{width:70,height:70,borderRadius:'50%',border:'2px solid rgba(201,168,76,0.65)',background:'radial-gradient(circle,#1A2438 60%,#020810)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,boxShadow:'0 0 28px rgba(201,168,76,0.12)'}}>🦅</div>
          </motion.div>

          <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:0.28}}
            style={{fontFamily:'Cinzel,serif',fontSize:7.5,letterSpacing:6,color:'#7A5910',textTransform:'uppercase',marginBottom:3}}>
            Département des Finances — Los Santos
          </motion.div>
          <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:0.36}}
            style={{fontFamily:'Cinzel,serif',fontSize:19,fontWeight:700,color:'#C9A84C',textTransform:'uppercase',letterSpacing:3,marginBottom:4}}>
            Dossier Confidentiel
          </motion.div>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.44}}
            style={{...mono,fontSize:7.5,letterSpacing:3,color:'rgba(201,168,76,0.20)',textTransform:'uppercase',marginBottom:18}}>
            Code Visiteur — Lecture &nbsp;/&nbsp; Code Admin — Édition
          </motion.div>

          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:0.44,duration:0.7,ease:[0.22,1,0.36,1]}}
            style={{width:180,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',marginBottom:18}}/>

          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.54}}
            style={{...mono,fontSize:8,letterSpacing:4,color:'rgba(201,168,76,0.42)',textTransform:'uppercase',marginBottom:12}}>
            ◈ &nbsp; Entrez le code d'accès &nbsp; ◈
          </motion.div>

          <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} transition={{delay:0.60,type:'spring'}}
            style={{display:'flex',gap:10,marginBottom:16}}>
            {[0,1,2,3].map(i=><CodeBox key={i} index={i} entered={entered} status={status}/>)}
          </motion.div>

          <AnimatePresence mode="wait">
            {statusMsg
              ? <motion.div key="msg" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.18}}
                  style={{...mono,fontSize:8,letterSpacing:2,textTransform:'uppercase',height:17,marginBottom:12,color:status==='ok'?'rgba(180,160,80,0.92)':'rgba(192,57,43,0.88)'}}>
                  {statusMsg}
                </motion.div>
              : <div style={{height:17,marginBottom:12}}/>}
          </AnimatePresence>

          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.65}}
            style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,width:182,marginBottom:12,position:'relative',zIndex:10}}>
            {['1','2','3','4','5','6','7','8','9'].map(d=><NumKey key={d} digit={d} onClick={()=>addDigit(d)}/>)}
            <div/>
            <NumKey digit="0" onClick={()=>addDigit('0')}/>
            <motion.button whileHover={{background:'rgba(192,57,43,0.10)'}as any} whileTap={{scale:0.88}} onClick={delDigit}
              style={{...mono,fontSize:16,padding:'12px 0',borderRadius:4,background:'rgba(192,57,43,0.04)',border:'1px solid rgba(192,57,43,0.16)',color:'rgba(192,57,43,0.58)',cursor:'pointer',userSelect:'none'}}>⌫</motion.button>
          </motion.div>

          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:0.72,duration:0.6,ease:[0.22,1,0.36,1]}}
            style={{width:260,height:1,background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.18),transparent)',marginBottom:8}}/>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.80}}
            style={{...mono,fontSize:7,letterSpacing:4,color:'rgba(201,168,76,0.12)',textTransform:'uppercase'}}>
            SYSTÈME SÉCURISÉ ◈ NIVEAU ALPHA CONFIDENTIEL
          </motion.div>
        </motion.div>
      )}

      {/* HOLO phase */}
      {phase==='holo' && (
        <motion.div key="holo" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.4}}
          style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,position:'relative',zIndex:10}}>
          <HoloCanvas ref={holoRef}/>
          <div style={{...mono,fontSize:9,letterSpacing:3,color:'rgba(201,168,76,0.3)',textTransform:'uppercase'}}>{gStat}</div>
          {showVBox&&(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign:'center'}}>
              <div style={{...mono,fontSize:9,letterSpacing:4,color:'rgba(201,168,76,0.36)',textTransform:'uppercase',marginBottom:5}}>Identification confirmée — Dossier</div>
              <div style={{fontFamily:'Cinzel,serif',fontSize:18,color:'#C9A84C',letterSpacing:5,textTransform:'uppercase'}}>{CONFIG.candidat.nomComplet}</div>
              <div style={{width:180,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',margin:'8px auto 0'}}/>
            </motion.div>
          )}
          {showStamp&&(
            <motion.div className="stamp-slam" style={{border:'5px solid rgba(192,57,43,0.86)',padding:'14px 34px',transform:'rotate(-8deg)',position:'relative'}}>
              <div style={{position:'absolute',inset:4,border:'2px solid rgba(192,57,43,0.26)'}}/>
              <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:32,letterSpacing:8,textTransform:'uppercase',color:'rgba(192,57,43,0.9)'}}>Déclassifié</div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
