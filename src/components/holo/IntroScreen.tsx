'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import { audio } from '@/lib/audio';
import HoloCanvas from './HoloCanvas';
import type { HoloRef } from './HoloCanvas';

type Phase = 'eagle' | 'pad' | 'holo' | 'done';

// ── SFX ElevenLabs (placer les mp3 dans /public/sfx/) ──
const SFX: Record<string, HTMLAudioElement | null> = {};
function loadSFX(name: string, src: string) {
  if (typeof window === 'undefined') return;
  const a = new Audio(src); a.preload = 'auto'; SFX[name] = a;
}
function playSFX(name: string, vol = 0.65) {
  const s = SFX[name]; if (!s) return;
  const clone = s.cloneNode() as HTMLAudioElement;
  clone.volume = vol; clone.play().catch(() => {});
}

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

// Eagle outline points (normalized)
const EP: [number, number][] = [
  [0.08,-0.34],[0.14,-0.32],[0.19,-0.27],[0.21,-0.20],
  [0.29,-0.20],[0.34,-0.17],[0.22,-0.13],
  [0.19,-0.13],[0.13,-0.06],[0.23,-0.03],
  [0.40,-0.14],[0.60,-0.22],[0.80,-0.19],[1.00,-0.10],[1.10,0.04],
  [1.07,0.11],[0.90,0.18],[0.68,0.17],[0.46,0.13],[0.22,0.09],
  [0.13,0.16],[0.08,0.25],[0.05,0.33],
  [0.16,0.47],[0.07,0.38],[0.00,0.43],[-0.07,0.38],[-0.16,0.47],
  [-0.05,0.33],[-0.08,0.25],[-0.13,0.16],[-0.22,0.09],
  [-0.46,0.13],[-0.68,0.17],[-0.90,0.18],[-1.07,0.11],
  [-1.10,0.04],[-1.00,-0.10],[-0.80,-0.19],[-0.60,-0.22],[-0.40,-0.14],
  [-0.23,-0.03],[-0.13,-0.06],[-0.19,-0.13],[-0.22,-0.20],
  [-0.21,-0.27],[-0.14,-0.32],[-0.08,-0.34],
];

function pathLength(pts: [number,number][], S: number) {
  let total = 0;
  for (let i = 1; i < pts.length; i++)
    total += Math.hypot((pts[i][0]-pts[i-1][0])*S, (pts[i][1]-pts[i-1][1])*S);
  return total;
}

// ═══════════════════════════════════════════════════
// MAIN CANVAS — Globe + Eagle, full screen
// Duration: 2800ms implosion, then stable globe
// ═══════════════════════════════════════════════════
function GlobeEagleCanvas({ phase, onEagleDone }: { phase: Phase; onEagleDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const t0Ref     = useRef<number>(0);
  const doneRef   = useRef(false);
  const rotRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    setSize(); window.addEventListener('resize', setSize);
    t0Ref.current = performance.now(); doneRef.current = false;

    // ── Fibonacci sphere points ──
    const N = 220, GR = (1+Math.sqrt(5))/2;
    type SP = { lat:number; lon:number; sz:number; hub:boolean };
    const SPTS: SP[] = Array.from({length:N},(_,i)=>({
      lat: Math.acos(1-2*(i+.5)/N), lon: 2*Math.PI*i/GR,
      sz: Math.random()<.07?3.2:Math.random()<.22?1.8:1.0,
      hub: Math.random()<.07,
    }));

    // ── Implosion particles (from screen edges → globe) ──
    const PART_N = 280;
    type Particle = {
      sx:number; sy:number;           // source (screen edge)
      tx:number; ty:number;           // globe surface target
      color:string; sz:number;
      delay:number;                   // stagger [0..0.45]
      shape:0|1|2; angle:number;
    };
    const rand01 = () => Math.random();
    const particles: Particle[] = Array.from({length:PART_N},(_,i) => {
      const edge = Math.floor(rand01()*4) as 0|1|2|3;
      let sx=0,sy=0;
      // source on edge — will be remapped in draw() using current W/H
      switch(edge){
        case 0:sx=rand01()*2-1;sy=-1.1;break;   // top
        case 1:sx=1.1;sy=rand01()*2-1;break;    // right
        case 2:sx=rand01()*2-1;sy=1.1;break;    // bottom
        default:sx=-1.1;sy=rand01()*2-1;break;  // left
      }
      const isGold = i < 90;
      return {
        sx, sy,
        tx:(rand01()-.5)*2, ty:(rand01()-.5)*2,  // normalized target (rescaled in draw)
        color: isGold?'201,168,76':'80,200,200',
        sz: 1.0+rand01()*2.5,
        delay: rand01()*0.45,
        shape: (Math.floor(rand01()*3)) as 0|1|2,
        angle: rand01()*Math.PI*2,
      };
    });

    // ── Easings ──
    const eO  = (t:number) => 1 - Math.pow(Math.max(0,Math.min(1,1-t)), 3);
    const eIO = (t:number) => {
      t=Math.max(0,Math.min(1,t));
      return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    };
    const c01 = (t:number,a:number,b:number)=>eO(Math.max(0,Math.min(1,(t-a)/(b-a))));
    const c01L = (t:number,a:number,b:number)=>Math.max(0,Math.min(1,(t-a)/(b-a)));

    // ── Soft radial glow ──
    const rGlow = (cx2:number,cy2:number,r0:number,r1:number,R:number,G:number,B:number,a:number) => {
      if(a<.005) return;
      const g=ctx.createRadialGradient(cx2,cy2,r0,cx2,cy2,r1);
      g.addColorStop(0,`rgba(${R},${G},${B},${a})`);
      g.addColorStop(.5,`rgba(${R},${G},${B},${a*.30})`);
      g.addColorStop(.82,`rgba(${R},${G},${B},${a*.08})`);
      g.addColorStop(1,`rgba(${R},${G},${B},0)`);
      ctx.beginPath(); ctx.arc(cx2,cy2,r1,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
    };

    const IMPLOSION_DURATION = 2800; // ms — implosion + sphere build
    const EAGLE_DELAY        = 1800; // ms — eagle trace starts at
    const EAGLE_DURATION     =  900; // ms — eagle trace duration
    const TOTAL = phase==='eagle' ? IMPLOSION_DURATION + EAGLE_DURATION + 300 : 999_999;

    const draw = (ts:number) => {
      const W=canvas.width, H=canvas.height;
      const cx=W/2, cy=H/2;
      const R = Math.min(W,H)*0.270;
      const el = ts-t0Ref.current;
      const t  = el/TOTAL;
      ctx.clearRect(0,0,W,H);
      rotRef.current += 0.003;
      const ga = rotRef.current;
      const TILT = 0.30;

      const proj = (lat:number,lon:number) => {
        const cL=Math.sin(lat),sL=Math.cos(lat);
        const x3=cL*Math.cos(lon+ga),z3=cL*Math.sin(lon+ga),y3=sL;
        const y2=y3*Math.cos(TILT)-z3*Math.sin(TILT);
        const z2=y3*Math.sin(TILT)+z3*Math.cos(TILT);
        return {px:cx+x3*R, py:cy-y2*R, z:z2, vis:(z2+1)/2};
      };

      // ── Timeline ──
      const implosionP = c01L(el/IMPLOSION_DURATION, 0, 1); // raw 0→1 over 2.8s
      const globeP     = eIO(implosionP);
      const bgP        = globeP;                             // bg energy follows globe
      const eagleP     = eO(c01L((el-EAGLE_DELAY)/EAGLE_DURATION, 0, 1));
      const mergeP     = eO(c01L((el-(EAGLE_DELAY+EAGLE_DURATION))/400, 0, 1));
      const stable     = phase!=='eagle';

      const gA = stable ? 0.95 : globeP;

      // ══ 1. FULL SCREEN BACKGROUND ENERGY FIELD ══
      // Dark base
      if (bgP > 0.01 || stable) {
        // Soft outer field — covers the whole screen
        const fieldA = stable ? 0.22 : bgP * 0.22;
        rGlow(cx,cy, 0, Math.max(W,H)*0.72, 20,100,180, fieldA);
        rGlow(cx,cy, 0, Math.max(W,H)*0.55, 30,130,200, fieldA*0.5);

        // Corner energy pulses (4 corners, flowing inward)
        const corners = [[0,0],[W,0],[0,H],[W,H]];
        corners.forEach(([cornX,cornY]) => {
          const cpA = (stable ? 0.10 : bgP*0.10) * (0.6+Math.sin(el/800+cornX*0.001)*0.4);
          rGlow(cornX,cornY, 0, Math.min(W,H)*0.55, 30,120,200, cpA);
        });

        // Horizontal band (center)
        const bandGrad = ctx.createLinearGradient(0,cy-2,0,cy+2);
        bandGrad.addColorStop(0,'transparent');
        bandGrad.addColorStop(.5,`rgba(80,200,200,${stable?0.04:bgP*0.04})`);
        bandGrad.addColorStop(1,'transparent');
        ctx.fillStyle=bandGrad;
        ctx.fillRect(0,cy-60,W,120);
      }

      // ══ 2. DOT GRID (full screen, subtle) ══
      const gridA = stable ? 0.022 : globeP*0.022;
      if (gridA > 0.005) {
        const GS = 38;
        for (let gx=GS/2; gx<W; gx+=GS) {
          for (let gy=GS/2; gy<H; gy+=GS) {
            const d = Math.hypot(gx-cx, gy-cy);
            // Fade: weaker at center (globe takes over), stronger on edges
            const edgeFade = Math.min(1, d/(R*0.8));
            const fade = 0.3 + edgeFade*0.7;
            ctx.globalAlpha = gridA * fade;
            ctx.fillStyle = '#50C8C8';
            ctx.beginPath(); ctx.arc(gx,gy,0.75,0,Math.PI*2); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        // Radial lines from center — very faint
        ctx.globalAlpha = gridA * 0.35;
        ctx.strokeStyle = 'rgba(80,200,200,1)'; ctx.lineWidth=0.35;
        for (let a=0;a<Math.PI*2;a+=Math.PI/18) {
          ctx.beginPath();
          ctx.moveTo(cx+Math.cos(a)*R*1.05, cy+Math.sin(a)*R*1.05);
          ctx.lineTo(cx+Math.cos(a)*W*0.85,  cy+Math.sin(a)*H*0.85);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // ══ 3. IMPLOSION PARTICLES ══
      if (implosionP > 0 && !stable) {
        particles.forEach(p => {
          const lP = c01L((implosionP-p.delay)/(1-p.delay), 0, 1);
          if (lP<=0) return;
          const eP = 1-Math.pow(1-lP,3.5);

          // Convert normalized coords to screen
          const srcX=cx+p.sx*(W*0.62), srcY=cy+p.sy*(H*0.62);
          const tgtX=cx+p.tx*(R*0.55), tgtY=cy+p.ty*(R*0.55);

          // Organic curved path
          const curve = Math.sin(lP*Math.PI)*(0.12+Math.random()*0.0)*Math.min(W,H)*0.15;
          const perp  = Math.atan2(tgtY-srcY,tgtX-srcX)+Math.PI/2;
          const fx = srcX+(tgtX-srcX)*eP + Math.cos(perp)*curve*(1-eP);
          const fy = srcY+(tgtY-srcY)*eP + Math.sin(perp)*curve*(1-eP);

          // Trail
          if (lP < 0.85 && lP > 0.05) {
            const trailPts = 6;
            for (let ti=1;ti<=trailPts;ti++) {
              const tp = lP - ti*0.025;
              if (tp<0) break;
              const tep = 1-Math.pow(1-tp,3.5);
              const tfx=srcX+(tgtX-srcX)*tep+Math.cos(perp)*Math.sin(tp*Math.PI)*(0.12+0)*Math.min(W,H)*0.15*(1-tep);
              const tfy=srcY+(tgtY-srcY)*tep+Math.sin(perp)*Math.sin(tp*Math.PI)*(0.12+0)*Math.min(W,H)*0.15*(1-tep);
              ctx.globalAlpha=(1-ti/trailPts)*0.18*(1-lP*0.5);
              ctx.beginPath();
              ctx.arc(tfx,tfy,p.sz*0.6,0,Math.PI*2);
              ctx.fillStyle=`rgba(${p.color},1)`;
              ctx.fill();
            }
            ctx.globalAlpha=1;
          }

          const al = Math.min(1,lP*3)*(lP<0.92?1:1-(lP-0.92)/0.08);
          ctx.globalAlpha=al*0.72;
          const col=`rgba(${p.color},1)`;
          if (p.shape===0) {
            ctx.beginPath(); ctx.arc(fx,fy,p.sz,0,Math.PI*2);
            ctx.fillStyle=col; ctx.fill();
          } else if (p.shape===1) {
            ctx.beginPath(); ctx.arc(fx,fy,p.sz*4.2, p.angle, p.angle+Math.PI*0.5);
            ctx.strokeStyle=col; ctx.lineWidth=0.9; ctx.stroke();
          } else {
            const dx2=Math.cos(p.angle)*p.sz*4,dy2=Math.sin(p.angle)*p.sz*4;
            ctx.beginPath(); ctx.moveTo(fx-dx2,fy-dy2); ctx.lineTo(fx+dx2,fy+dy2);
            ctx.strokeStyle=col; ctx.lineWidth=0.9; ctx.stroke();
          }
          ctx.globalAlpha=1;
        });
      }

      // ══ 4. ATMOSPHERE GLOBE ══
      rGlow(cx,cy, 0, R*2.8, 20,120,200, 0.12*gA);
      rGlow(cx,cy, 0, R*1.8, 50,150,220, 0.08*gA);
      rGlow(cx-R*.12,cy-R*.08, 0, R*0.9, 90,200,240, 0.055*gA);
      if (mergeP>0) rGlow(cx,cy, 0,R*2.2, 201,168,76, 0.13*mergeP);

      // ══ 5. GRID lat/lon ══
      ctx.lineWidth=0.42;
      const gridReveal = stable ? 1.0 : globeP;
      for (let ld=-75;ld<=75;ld+=15) {
        ctx.globalAlpha=(0.05+(ld===0?.04:0))*gridReveal;
        ctx.strokeStyle=ld===0?'#50C8C8':'rgba(80,200,200,1)';
        ctx.beginPath(); let first=true;
        for (let lo=0;lo<=360*gridReveal;lo+=2.5) {
          const {px,py,z}=proj(ld*Math.PI/180,lo*Math.PI/180);
          if(z<-.04){first=true;continue;}
          if(first){ctx.moveTo(px,py);first=false;}else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
      for (let lo=0;lo<360;lo+=15) {
        ctx.globalAlpha=0.042*gridReveal;
        ctx.strokeStyle='rgba(80,200,200,1)';
        ctx.beginPath(); let first=true;
        for (let ld=-86;ld<=86;ld+=3) {
          const {px,py,z}=proj(ld*Math.PI/180,lo*Math.PI/180);
          if(z<-.04){first=true;continue;}
          if(first){ctx.moveTo(px,py);first=false;}else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha=1;

      // ══ 6. GLOBE NODES ══
      const visN = stable ? N : Math.min(N,Math.floor(N*Math.pow(globeP,0.5)));
      type PP={px:number;py:number;z:number;vis:number;hub:boolean;sz:number};
      const pps:PP[]=[];
      for(let i=0;i<visN;i++){const sp=SPTS[i];const pp=proj(sp.lat,sp.lon);pps.push({...pp,hub:sp.hub,sz:sp.sz});}
      pps.sort((a,b)=>a.z-b.z);

      for(let i=0;i<pps.length;i++){
        const a=pps[i]; if(a.z<0) continue;
        for(let j=i+1;j<pps.length;j++){
          const b=pps[j]; if(b.z<0) continue;
          const d=Math.hypot(a.px-b.px,a.py-b.py);
          const md=R*.22;
          if(d<md){
            ctx.globalAlpha=Math.min(a.vis,b.vis)*0.18*(1-d/md);
            ctx.strokeStyle='rgba(80,200,200,1)';ctx.lineWidth=0.38;
            ctx.beginPath();ctx.moveTo(a.px,a.py);ctx.lineTo(b.px,b.py);ctx.stroke();
          }
        }
      }
      ctx.globalAlpha=1;

      const hubs=pps.filter(p=>p.hub&&p.z>0.04);
      for(let i=0;i<hubs.length;i++){
        for(let j=i+1;j<hubs.length;j++){
          const a=hubs[i],b=hubs[j];
          const d=Math.hypot(a.px-b.px,a.py-b.py);
          if(d<R*.70){
            const al=Math.min(a.vis,b.vis)*.42*(1-d/(R*.70));
            const lg=ctx.createLinearGradient(a.px,a.py,b.px,b.py);
            lg.addColorStop(0,`rgba(201,168,76,${al})`);
            lg.addColorStop(.5,`rgba(80,200,200,${al*.6})`);
            lg.addColorStop(1,`rgba(201,168,76,${al})`);
            ctx.beginPath();ctx.strokeStyle=lg;ctx.lineWidth=0.9;
            ctx.moveTo(a.px,a.py);ctx.lineTo(b.px,b.py);ctx.stroke();
            const tp=((el/1200)+i*.28+j*.16)%1;
            const mx=a.px+(b.px-a.px)*tp,my=a.py+(b.py-a.py)*tp;
            ctx.beginPath();ctx.arc(mx,my,1.7,0,Math.PI*2);
            ctx.fillStyle=`rgba(201,168,76,${al*2.2})`;
            ctx.shadowColor='#C9A84C';ctx.shadowBlur=9;ctx.fill();ctx.shadowBlur=0;
          }
        }
      }

      for(const p of pps){
        if(p.z<-.12) continue;
        if(p.hub){
          const pulse=1+Math.sin(el/650+p.px*.05)*.45;
          ctx.beginPath();ctx.arc(p.px,p.py,p.sz*1.5*pulse,0,Math.PI*2);
          ctx.fillStyle=`rgba(201,168,76,${p.vis*.88*(0.6+mergeP*.4)})`;
          ctx.shadowColor='#C9A84C';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
          ctx.save();ctx.translate(p.px,p.py);ctx.rotate(el/1400);
          ctx.beginPath();ctx.arc(0,0,p.sz*3,0,Math.PI*1.3);
          ctx.strokeStyle=`rgba(201,168,76,${p.vis*.28})`;ctx.lineWidth=0.8;ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();ctx.arc(p.px,p.py,p.sz*.88,0,Math.PI*2);
          ctx.fillStyle=`rgba(80,200,200,${p.vis*.72})`;
          ctx.shadowColor='rgba(80,200,200,0.9)';ctx.shadowBlur=p.sz*5;
          ctx.fill();ctx.shadowBlur=0;
        }
      }

      // ══ 7. ORBITAL RINGS ══
      const orbA = stable ? 0.85 : eO(c01L(implosionP,.35,1));
      if(orbA>.02){
        const rings=[
          {rx:R*1.28,ry:R*0.26,rot:0.32,speed:0.9,gold:false},
          {rx:R*1.42,ry:R*0.22,rot:0.95,speed:-0.6,gold:true},
          {rx:R*1.58,ry:R*0.18,rot:-0.45,speed:0.5,gold:false},
        ];
        rings.forEach(ring=>{
          const c=ring.gold?'201,168,76':'80,200,200';
          ctx.save();ctx.translate(cx,cy);ctx.rotate(ring.rot);
          [[7,0.025],[3.5,0.055],[1.3,0.14]].forEach(([lw,la])=>{
            ctx.beginPath();ctx.ellipse(0,0,ring.rx,ring.ry,0,0,Math.PI*2);
            ctx.strokeStyle=`rgba(${c},${(la as number)*orbA})`;
            ctx.lineWidth=lw as number;ctx.stroke();
          });
          ctx.restore();
          // animated dot
          const a=el/1000*ring.speed;
          const dx=Math.cos(a)*ring.rx,dy=Math.sin(a)*ring.ry;
          const dxF=cx+dx*Math.cos(ring.rot)-dy*Math.sin(ring.rot);
          const dyF=cy+dx*Math.sin(ring.rot)+dy*Math.cos(ring.rot);
          ctx.beginPath();ctx.arc(dxF,dyF,2.8,0,Math.PI*2);
          ctx.fillStyle=`rgba(${c},${orbA*.88})`;
          ctx.shadowColor=`rgba(${c},0.9)`;ctx.shadowBlur=14;
          ctx.fill();ctx.shadowBlur=0;
        });
      }

      // ══ 8. EAGLE TRACE ══
      const eagleVis = (phase==='eagle') ? eagleP*(1-mergeP) : 0;
      if(eagleVis>.004){
        const S=R*.68;
        const pLen=pathLength(EP,S);
        ctx.save(); ctx.translate(cx,cy);
        // soft halo
        rGlow(0,0, 0,S*1.7, 201,168,76, eagleVis*.10);
        ctx.setLineDash([pLen]);
        ctx.lineDashOffset=pLen*(1-Math.min(eagleP,1));
        ctx.lineCap='round';ctx.lineJoin='round';
        [[9,.032],[4.5,.068],[2.2,.14]].forEach(([lw,la])=>{
          ctx.lineWidth=lw as number;ctx.strokeStyle=`rgba(201,168,76,${(la as number)*eagleVis})`;
          ctx.beginPath();EP.forEach(([x,y],i)=>i===0?ctx.moveTo(x*S,y*S):ctx.lineTo(x*S,y*S));ctx.stroke();
        });
        ctx.lineWidth=1.6;ctx.strokeStyle=`rgba(240,210,90,${eagleVis*.92})`;
        ctx.beginPath();EP.forEach(([x,y],i)=>i===0?ctx.moveTo(x*S,y*S):ctx.lineTo(x*S,y*S));ctx.stroke();
        ctx.setLineDash([]);
        // key nodes
        [[0.08,-0.34],[0.34,-0.17],[1.10,0.04],[-1.10,0.04],[0.00,0.43],[0.00,0.00]].forEach(([nx,ny],ni)=>{
          const np=Math.max(0,eagleP*5-ni*.6); if(np<=0) return;
          ctx.beginPath();ctx.arc(nx*S,ny*S,3.0+Math.sin(el/480+ni)*.8,0,Math.PI*2);
          ctx.fillStyle=`rgba(201,168,76,${Math.min(1,np)*eagleVis})`;
          ctx.shadowColor='#C9A84C';ctx.shadowBlur=20;ctx.fill();ctx.shadowBlur=0;
        });
        ctx.restore();
      }

      if(mergeP>.0) rGlow(cx,cy,R*.9,R*2.0, 201,168,76, .14*mergeP);

      if(phase==='eagle' && el>=(IMPLOSION_DURATION+EAGLE_DURATION+200) && !doneRef.current){
        doneRef.current=true; onEagleDone();
      }
      rafRef.current=requestAnimationFrame(draw);
    };

    rafRef.current=requestAnimationFrame(draw);
    return ()=>{ cancelAnimationFrame(rafRef.current); window.removeEventListener('resize',setSize); };
  }, [phase, onEagleDone]);

  return (
    <canvas ref={canvasRef} style={{
      position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none',
      opacity: phase==='holo' ? 0.18 : 1,
      transition:'opacity 1.4s ease',
    }}/>
  );
}

// ── CodeBox ──
function CodeBox({index,entered,status}:{index:number;entered:string;status:'idle'|'ok'|'err'}) {
  const isFilled=index<entered.length,isActive=index===entered.length&&status==='idle';
  const bc=status==='err'?'rgba(192,57,43,0.85)':status==='ok'?'rgba(180,160,80,0.80)':isFilled?'rgba(201,168,76,0.55)':isActive?'rgba(201,168,76,0.85)':'rgba(201,168,76,0.15)';
  const gc=status==='err'?'rgba(192,57,43,0.30)':status==='ok'?'rgba(201,168,76,0.40)':isActive?'rgba(201,168,76,0.25)':'transparent';
  return (
    <motion.div animate={status==='err'?{x:[-8,8,-6,6,-3,3,0]}:{}} transition={{duration:.4}}
      style={{width:54,height:66,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:4,border:`1.5px solid ${bc}`,background:isActive?'rgba(201,168,76,0.06)':'rgba(201,168,76,0.02)',position:'relative',boxShadow:`0 0 18px ${gc}`,transition:'border-color .2s, box-shadow .3s'}}>
      <div style={{position:'absolute',top:3,left:3,width:6,height:6,borderTop:`1px solid ${bc}`,borderLeft:`1px solid ${bc}`,opacity:.7}}/>
      <div style={{position:'absolute',bottom:3,right:3,width:6,height:6,borderBottom:`1px solid ${bc}`,borderRight:`1px solid ${bc}`,opacity:.7}}/>
      {isFilled?<motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400}} style={{width:10,height:10,borderRadius:'50%',background:'#C9A84C',boxShadow:'0 0 12px rgba(201,168,76,0.8)'}}/>
       :isActive?<motion.div animate={{opacity:[1,0,1]}} transition={{duration:.85,repeat:Infinity}} style={{width:2.5,height:26,background:'#C9A84C',borderRadius:2,boxShadow:'0 0 8px rgba(201,168,76,0.8)'}}/>:null}
    </motion.div>
  );
}

// ── NumKey ──
function NumKey({digit,onClick}:{digit:string;onClick:()=>void}) {
  const [p,setP]=useState(false);
  return (
    <motion.button onPointerDown={()=>{setP(true);onClick();}} onPointerUp={()=>setP(false)} onPointerLeave={()=>setP(false)}
      animate={p?{scale:.88}:{scale:1}} transition={{type:'spring',stiffness:600,damping:25}}
      style={{fontFamily:'Share Tech Mono,monospace',fontSize:18,fontWeight:600,padding:'12px 0',borderRadius:4,width:'100%',background:p?'rgba(201,168,76,0.14)':'rgba(201,168,76,0.04)',border:`1px solid ${p?'rgba(201,168,76,0.45)':'rgba(201,168,76,0.14)'}`,color:p?'#E8C97A':'#A89878',cursor:'pointer',userSelect:'none',position:'relative',overflow:'hidden',transition:'box-shadow .12s, color .12s'}}>
      {p&&<motion.div initial={{scale:0,opacity:.6}} animate={{scale:3,opacity:0}} transition={{duration:.4}} style={{position:'absolute',top:'50%',left:'50%',width:30,height:30,borderRadius:'50%',background:'rgba(201,168,76,0.3)',transform:'translate(-50%,-50%)',pointerEvents:'none'}}/>}
      {digit}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════
// INTRO SCREEN
// ═══════════════════════════════════════════════════
export default function IntroScreen() {
  const { setMode } = useDossier();
  const [phase,setPhase]=useState<Phase>('eagle');
  const [entered,setEntered]=useState('');
  const [status,setStatus]=useState<'idle'|'ok'|'err'>('idle');
  const [statusMsg,setStatusMsg]=useState('');
  const [gStat,setGStat]=useState("Analyse du protocole d'accès...");
  const [showVBox,setShowVBox]=useState(false);
  const [showStamp,setShowStamp]=useState(false);
  const [attempts,setAttempts]=useState(0);
  const holoRef=useRef<HoloRef>(null);
  const audioInit=useRef(false);
  const busy=useRef(false);

  // Preload ElevenLabs SFX
  useEffect(()=>{
    loadSFX('slide','/sfx/slide.mp3');
    loadSFX('key','/sfx/key.mp3');
    loadSFX('err','/sfx/err.mp3');
    loadSFX('ok','/sfx/ok.mp3');
  },[]);

  const handleEagleDone=useCallback(()=>{ setTimeout(()=>setPhase('pad'),400); },[]);

  useEffect(()=>{
    const t=setTimeout(()=>{ if(phase==='eagle') setPhase('pad'); },8000);
    return ()=>clearTimeout(t);
  },[phase]);

  const initAudio=()=>{ if(!audioInit.current){audio.init();audioInit.current=true;} };

  const addDigit=(d:string)=>{
    if(busy.current||entered.length>=4) return;
    initAudio();
    // Try ElevenLabs SFX first, fallback Web Audio
    if(SFX['key']) playSFX('key',0.55); else audio.key();
    const next=entered+d; setEntered(next);
    if(next.length===4){ busy.current=true; setTimeout(()=>checkCode(next),380); }
  };
  const delDigit=()=>{
    if(busy.current) return; initAudio();
    audio.del(); setEntered(e=>e.slice(0,-1)); setStatusMsg('');
  };
  const checkCode=(code:string)=>{
    const isA=code===CONFIG.codes.admin, isV=code===CONFIG.codes.visiteur;
    if(isA||isV){
      if(SFX['ok']) playSFX('ok',0.65); else audio.ok();
      setStatus('ok');
      setStatusMsg(isA?'✓ ACCÈS ADMINISTRATEUR — ÉDITION ACTIVÉE':'✓ ACCÈS VISITEUR — LECTURE SEULE');
      setTimeout(()=>startHolo(isA?'admin':'visitor'),1000);
    } else {
      if(SFX['err']) playSFX('err',0.7); else audio.err();
      setStatus('err'); setAttempts(a=>a+1);
      setStatusMsg('✗ CODE INCORRECT — ACCÈS REFUSÉ');
      setTimeout(()=>{ setStatus('idle'); setStatusMsg(''); setEntered(''); busy.current=false; },1400);
    }
  };
  const startHolo=(m:'admin'|'visitor')=>{
    setPhase('holo');
    [0,155,295,420,530,625,705,772,828,872,908,934,952,963].forEach(d=>setTimeout(()=>audio.tick(),d+260));
    setTimeout(()=>{ holoRef.current?.lock(); audio.lock(); setGStat('Déclassification en cours...'); },1620);
    setTimeout(()=>{ audio.voice(); setShowVBox(true); },2700);
    setTimeout(()=>{ setShowStamp(true); audio.stamp(); },4200);
    setTimeout(()=>{ audio.reveal(); launchConfetti(); setPhase('done'); setMode(m); },6500);
  };

  if(phase==='done') return null;
  const mono:React.CSSProperties={fontFamily:'"Share Tech Mono",monospace'};

  return (
    <motion.div exit={{opacity:0,scale:1.04}} transition={{duration:.9}}
      style={{position:'fixed',inset:0,zIndex:9999,background:'#020810',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>

      <GlobeEagleCanvas phase={phase} onEagleDone={handleEagleDone}/>

      {/* Scan line */}
      <motion.div animate={{y:['-4px','100vh']}} transition={{duration:9,repeat:Infinity,ease:'linear',repeatDelay:3}}
        style={{position:'absolute',left:0,right:0,height:2,pointerEvents:'none',background:'linear-gradient(90deg,transparent,rgba(80,200,200,0.08),transparent)',zIndex:2}}/>

      {/* HUD corners */}
      {[{top:12,left:12,borderTop:'1.5px solid rgba(201,168,76,0.38)',borderLeft:'1.5px solid rgba(201,168,76,0.38)'},{top:12,right:12,borderTop:'1.5px solid rgba(201,168,76,0.38)',borderRight:'1.5px solid rgba(201,168,76,0.38)'},{bottom:12,left:12,borderBottom:'1.5px solid rgba(201,168,76,0.38)',borderLeft:'1.5px solid rgba(201,168,76,0.38)'},{bottom:12,right:12,borderBottom:'1.5px solid rgba(201,168,76,0.38)',borderRight:'1.5px solid rgba(201,168,76,0.38)'}].map((s,i)=>(
        <motion.div key={i} initial={{opacity:0,scale:.4}} animate={{opacity:1,scale:1}} transition={{delay:.2+i*.08}}
          style={{position:'absolute',...s,width:44,height:44,zIndex:25,pointerEvents:'none'}}/>
      ))}

      {/* Eagle phase labels */}
      {phase==='eagle'&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.8}}
          style={{position:'absolute',bottom:'15%',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,pointerEvents:'none',zIndex:10}}>
          <div style={{...mono,fontSize:9,letterSpacing:6,color:'rgba(201,168,76,0.28)',textTransform:'uppercase',whiteSpace:'nowrap'}}>
            Département des Finances — Los Santos
          </div>
          <motion.div animate={{opacity:[.14,.52,.14]}} transition={{duration:1.6,repeat:Infinity}}
            style={{...mono,fontSize:8,letterSpacing:5,color:'rgba(80,200,200,0.18)',textTransform:'uppercase'}}>
            ◈ Initialisation du système sécurisé...
          </motion.div>
        </motion.div>
      )}

      {/* PAD phase */}
      {phase==='pad'&&(
        <motion.div key="pad" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.55,ease:[.22,1,.36,1]}}
          style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',position:'relative',zIndex:10}}>

          {attempts>0&&<motion.div initial={{opacity:0}} animate={{opacity:1}} style={{position:'absolute',top:-30,right:0,...mono,fontSize:9,letterSpacing:3,color:'rgba(192,57,43,0.62)',textTransform:'uppercase'}}>TENTATIVES : {attempts}</motion.div>}

          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.10,duration:.7,ease:[.22,1,.36,1]}} style={{width:320,height:1,background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.55),transparent)',marginBottom:14}}/>

          <motion.div initial={{scale:.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:.20,type:'spring',stiffness:160}} style={{marginBottom:12,position:'relative'}}>
            <motion.div animate={{opacity:[.20,.55,.20],scale:[.92,1.08,.92]}} transition={{duration:3.8,repeat:Infinity}} style={{position:'absolute',inset:-18,borderRadius:'50%',background:'radial-gradient(circle,rgba(80,200,200,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
            <div style={{width:70,height:70,borderRadius:'50%',border:'2px solid rgba(201,168,76,0.65)',background:'radial-gradient(circle,#1A2438 60%,#020810)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,boxShadow:'0 0 28px rgba(201,168,76,0.12)'}}>🦅</div>
          </motion.div>

          <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:.28}} style={{fontFamily:'Cinzel,serif',fontSize:7.5,letterSpacing:6,color:'#7A5910',textTransform:'uppercase',marginBottom:3}}>Département des Finances — Los Santos</motion.div>
          <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:.36}} style={{fontFamily:'Cinzel,serif',fontSize:19,fontWeight:700,color:'#C9A84C',textTransform:'uppercase',letterSpacing:3,marginBottom:4}}>Dossier Confidentiel</motion.div>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.44}} style={{...mono,fontSize:7.5,letterSpacing:3,color:'rgba(201,168,76,0.20)',textTransform:'uppercase',marginBottom:18}}>Code Visiteur — Lecture &nbsp;/&nbsp; Code Admin — Édition</motion.div>
          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.44,duration:.7,ease:[.22,1,.36,1]}} style={{width:180,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',marginBottom:18}}/>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.54}} style={{...mono,fontSize:8,letterSpacing:4,color:'rgba(201,168,76,0.42)',textTransform:'uppercase',marginBottom:12}}>◈ &nbsp; Entrez le code d'accès &nbsp; ◈</motion.div>

          <motion.div initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} transition={{delay:.60,type:'spring'}} style={{display:'flex',gap:10,marginBottom:16}}>
            {[0,1,2,3].map(i=><CodeBox key={i} index={i} entered={entered} status={status}/>)}
          </motion.div>

          <AnimatePresence mode="wait">
            {statusMsg?<motion.div key="msg" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.18}} style={{...mono,fontSize:8,letterSpacing:2,textTransform:'uppercase',height:17,marginBottom:12,color:status==='ok'?'rgba(180,160,80,0.92)':'rgba(192,57,43,0.88)'}}>{statusMsg}</motion.div>:<div style={{height:17,marginBottom:12}}/>}
          </AnimatePresence>

          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.65}} style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,width:182,marginBottom:12,position:'relative',zIndex:10}}>
            {['1','2','3','4','5','6','7','8','9'].map(d=><NumKey key={d} digit={d} onClick={()=>addDigit(d)}/>)}
            <div/>
            <NumKey digit="0" onClick={()=>addDigit('0')}/>
            <motion.button whileHover={{background:'rgba(192,57,43,0.10)'}as any} whileTap={{scale:.88}} onClick={delDigit} style={{...mono,fontSize:16,padding:'12px 0',borderRadius:4,background:'rgba(192,57,43,0.04)',border:'1px solid rgba(192,57,43,0.16)',color:'rgba(192,57,43,0.58)',cursor:'pointer',userSelect:'none'}}>⌫</motion.button>
          </motion.div>

          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.72,duration:.6,ease:[.22,1,.36,1]}} style={{width:260,height:1,background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.18),transparent)',marginBottom:8}}/>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.80}} style={{...mono,fontSize:7,letterSpacing:4,color:'rgba(201,168,76,0.12)',textTransform:'uppercase'}}>SYSTÈME SÉCURISÉ ◈ NIVEAU ALPHA CONFIDENTIEL</motion.div>
        </motion.div>
      )}

      {/* HOLO phase */}
      {phase==='holo'&&(
        <motion.div key="holo" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.4}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,position:'relative',zIndex:10}}>
          <HoloCanvas ref={holoRef}/>
          <div style={{...mono,fontSize:9,letterSpacing:3,color:'rgba(201,168,76,0.3)',textTransform:'uppercase'}}>{gStat}</div>
          {showVBox&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} style={{textAlign:'center'}}>
            <div style={{...mono,fontSize:9,letterSpacing:4,color:'rgba(201,168,76,0.36)',textTransform:'uppercase',marginBottom:5}}>Identification confirmée — Dossier</div>
            <div style={{fontFamily:'Cinzel,serif',fontSize:18,color:'#C9A84C',letterSpacing:5,textTransform:'uppercase'}}>{CONFIG.candidat.nomComplet}</div>
            <div style={{width:180,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',margin:'8px auto 0'}}/>
          </motion.div>)}
          {showStamp&&(<motion.div className="stamp-slam" style={{border:'5px solid rgba(192,57,43,0.86)',padding:'14px 34px',transform:'rotate(-8deg)',position:'relative'}}>
            <div style={{position:'absolute',inset:4,border:'2px solid rgba(192,57,43,0.26)'}}/>
            <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:32,letterSpacing:8,textTransform:'uppercase',color:'rgba(192,57,43,0.9)'}}>Déclassifié</div>
          </motion.div>)}
        </motion.div>
      )}
    </motion.div>
  );
}
