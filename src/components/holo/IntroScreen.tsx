'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import { audio } from '@/lib/audio';
import HoloCanvas from './HoloCanvas';
import FingerprintScan from './FingerprintScan';
import type { HoloRef } from './HoloCanvas';

type Phase = 'fingerprint' | 'eagle' | 'pad' | 'holo' | 'done';

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

// Eagle outline points
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
  let t = 0;
  for (let i = 1; i < pts.length; i++)
    t += Math.hypot((pts[i][0]-pts[i-1][0])*S,(pts[i][1]-pts[i-1][1])*S);
  return t;
}

// ═══════════════════════════════════════════════════════
// GLOBE + EAGLE CANVAS
// ═══════════════════════════════════════════════════════
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

    // Fibonacci sphere
    const N = 220, GR = (1+Math.sqrt(5))/2;
    type SP = { lat:number; lon:number; sz:number; hub:boolean };
    const SPTS: SP[] = Array.from({length:N},(_,i)=>({
      lat:Math.acos(1-2*(i+.5)/N), lon:2*Math.PI*i/GR,
      sz:Math.random()<.07?3.2:Math.random()<.22?1.8:1.0,
      hub:Math.random()<.07,
    }));

    // Implosion particles
    const PART_N = 300;
    type Particle = { sx:number; sy:number; tx:number; ty:number; color:string; sz:number; delay:number; shape:0|1|2; angle:number; noiseMag:number };
    const particles: Particle[] = Array.from({length:PART_N},(_,i)=>{
      const edge = Math.floor(Math.random()*4) as 0|1|2|3;
      let sx=0, sy=0;
      switch(edge){
        case 0: sx=Math.random()*2-1; sy=-1.12; break;
        case 1: sx=1.12; sy=Math.random()*2-1; break;
        case 2: sx=Math.random()*2-1; sy=1.12; break;
        default:sx=-1.12; sy=Math.random()*2-1; break;
      }
      return {
        sx, sy,
        tx:(Math.random()-.5)*1.1, ty:(Math.random()-.5)*1.1,
        color:i<100?'201,168,76':'80,200,200',
        sz:1.0+Math.random()*2.8,
        delay:Math.random()*0.42,
        shape:(Math.floor(Math.random()*3)) as 0|1|2,
        angle:Math.random()*Math.PI*2,
        noiseMag:0.08+Math.random()*0.12,
      };
    });

    // Pad phase: flowing dots from edges → center (continuous, always)
    const FLOW_N = 180;
    type FlowDot = { edge:number; pos:number; speed:number; sz:number; color:string; offset:number };
    const flowDots: FlowDot[] = Array.from({length:FLOW_N},()=>({
      edge:Math.floor(Math.random()*4),
      pos:Math.random(),
      speed:0.0008+Math.random()*0.0016,
      sz:0.9+Math.random()*2.0,
      color:Math.random()<0.35?'201,168,76':'80,200,200',
      offset:Math.random(),
    }));

    const eO  = (t:number) => 1-Math.pow(Math.max(0,Math.min(1,1-t)),3);
    const eIO = (t:number) => { t=Math.max(0,Math.min(1,t)); return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; };
    const c01 = (t:number,a:number,b:number) => eO(Math.max(0,Math.min(1,(t-a)/(b-a))));
    const c01L = (t:number,a:number,b:number) => Math.max(0,Math.min(1,(t-a)/(b-a)));

    const rGlow = (cx2:number,cy2:number,r0:number,r1:number,R:number,G:number,B:number,a:number) => {
      if(a<.004) return;
      const g=ctx.createRadialGradient(cx2,cy2,r0,cx2,cy2,r1);
      g.addColorStop(0,`rgba(${R},${G},${B},${a})`);
      g.addColorStop(.45,`rgba(${R},${G},${B},${a*.30})`);
      g.addColorStop(.80,`rgba(${R},${G},${B},${a*.07})`);
      g.addColorStop(1,`rgba(${R},${G},${B},0)`);
      ctx.beginPath(); ctx.arc(cx2,cy2,r1,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
    };

    const IMP_DUR = 2800, EAGLE_DELAY = 1800, EAGLE_DUR = 900;
    const TOTAL = phase==='eagle' ? IMP_DUR+EAGLE_DUR+350 : 999_999;

    const draw = (ts:number) => {
      const W=canvas.width, H=canvas.height;
      const cx=W/2, cy=H/2;
      const R=Math.min(W,H)*0.270;
      const el=ts-t0Ref.current;
      const t=el/TOTAL;
      ctx.clearRect(0,0,W,H);
      rotRef.current+=0.003;
      const ga=rotRef.current;
      const TILT=0.30;
      const isEagle=phase==='eagle';
      const isStable=!isEagle;

      const proj=(lat:number,lon:number)=>{
        const cL=Math.sin(lat),sL=Math.cos(lat);
        const x3=cL*Math.cos(lon+ga),z3=cL*Math.sin(lon+ga),y3=sL;
        const y2=y3*Math.cos(TILT)-z3*Math.sin(TILT);
        const z2=y3*Math.sin(TILT)+z3*Math.cos(TILT);
        return {px:cx+x3*R, py:cy-y2*R, z:z2, vis:(z2+1)/2};
      };

      const implosionP = isEagle ? c01L(el/IMP_DUR,0,1) : 1;
      const globeP     = isEagle ? eIO(implosionP) : 1;
      const eagleP     = isEagle ? eO(c01L((el-EAGLE_DELAY)/EAGLE_DUR,0,1)) : 0;
      const mergeP     = isEagle ? eO(c01L((el-(EAGLE_DELAY+EAGLE_DUR))/400,0,1)) : 0;
      const gA         = globeP;

      // ══ 1. FULL SCREEN BACKGROUND FIELD ══
      {
        const fA = isStable ? 0.18 : implosionP*0.18;
        rGlow(cx,cy, 0,Math.max(W,H)*.75, 15,90,170, fA);
        rGlow(cx,cy, 0,Math.max(W,H)*.50, 25,115,195, fA*.45);
        // Coin pulses
        [[0,0],[W,0],[0,H],[W,H]].forEach(([cornX,cornY])=>{
          const cpA=(isStable?.08:implosionP*.08)*(0.6+Math.sin(el/900+cornX*.001)*.4);
          rGlow(cornX as number,cornY as number, 0,Math.min(W,H)*.50, 25,110,190, cpA);
        });
      }

      // ══ 2. BACKGROUND PATTERN (toujours visible sur pad) ══
      // Hexagonal circuit board grid
      {
        const patA = isStable ? 1 : implosionP;
        if(patA > 0.02) {
          const HEX = 48; // hexagon size
          ctx.globalAlpha = 0.028 * patA;
          ctx.strokeStyle = 'rgba(80,200,200,1)';
          ctx.lineWidth = 0.4;
          // Hex grid
          for(let row = -2; row < H/HEX+2; row++) {
            for(let col = -2; col < W/(HEX*0.866)*0.5+2; col++) {
              const hx = col * HEX * 1.732 + (row%2)*HEX*0.866;
              const hy = row * HEX * 1.5;
              // Distance from center → fade near globe
              const distC = Math.hypot(hx-cx, hy-cy);
              const fade = distC < R*1.2 ? distC/(R*1.2) : 1;
              ctx.globalAlpha = 0.022 * patA * (0.3 + fade*0.7);
              ctx.beginPath();
              for(let k=0;k<6;k++){
                const a=k*Math.PI/3;
                const hpx=hx+HEX*.5*Math.cos(a), hpy=hy+HEX*.5*Math.sin(a);
                k===0?ctx.moveTo(hpx,hpy):ctx.lineTo(hpx,hpy);
              }
              ctx.closePath(); ctx.stroke();
              // Node dots at intersections
              if(Math.random()<0.015){
                ctx.beginPath(); ctx.arc(hx,hy,0.8,0,Math.PI*2);
                ctx.fillStyle=`rgba(80,200,200,${0.15*patA*fade})`;
                ctx.fill();
              }
            }
          }
          // Circuit lines (horizontal + vertical faint)
          ctx.globalAlpha = 0.012 * patA;
          ctx.strokeStyle = 'rgba(201,168,76,1)';
          ctx.lineWidth = 0.35;
          for(let y=0; y<H; y+=HEX*1.5){
            ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
          }
          for(let x=0; x<W; x+=HEX*1.732){
            ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      }

      // ══ 3. FLOWING DOTS (edges → center, permanent on pad) ══
      {
        const flowA = isStable ? 1 : implosionP;
        if(flowA > 0.01) {
          const now = el;
          flowDots.forEach(dot => {
            // Progress: 0 = at edge, 1 = at center
            const p = ((now*dot.speed + dot.offset) % 1);
            const ep = 1 - Math.pow(1-p, 2.5); // ease in

            // Source on edge → center
            let srcX=cx, srcY=cy;
            switch(dot.edge){
              case 0: srcX=dot.pos*W; srcY=0; break;
              case 1: srcX=W; srcY=dot.pos*H; break;
              case 2: srcX=dot.pos*W; srcY=H; break;
              default: srcX=0; srcY=dot.pos*H; break;
            }
            const fx = srcX + (cx-srcX)*ep;
            const fy = srcY + (cy-srcY)*ep;

            // Fade: appear quickly, fade near center
            const distFromCenter = Math.hypot(fx-cx,fy-cy);
            const centerFade = Math.min(1, distFromCenter/(R*0.85));
            const alpha = Math.min(p*4, 1) * centerFade * flowA * 0.55;
            if(alpha < 0.01) return;

            ctx.beginPath();
            ctx.arc(fx,fy,dot.sz,0,Math.PI*2);
            ctx.fillStyle=`rgba(${dot.color},${alpha})`;
            ctx.shadowColor=`rgba(${dot.color},${alpha*0.8})`;
            ctx.shadowBlur=dot.sz*4;
            ctx.fill();
            ctx.shadowBlur=0;

            // Short trail
            if(p>0.08){
              const prevP = p - 0.04;
              const prevEp = 1-Math.pow(1-prevP,2.5);
              const pfx=srcX+(cx-srcX)*prevEp, pfy=srcY+(cy-srcY)*prevEp;
              ctx.globalAlpha=alpha*0.25;
              ctx.strokeStyle=`rgba(${dot.color},1)`;
              ctx.lineWidth=dot.sz*0.6;
              ctx.beginPath(); ctx.moveTo(pfx,pfy); ctx.lineTo(fx,fy); ctx.stroke();
              ctx.globalAlpha=1;
            }
          });
        }
      }

      // ══ 4. IMPLOSION PARTICLES (eagle phase only) ══
      if(isEagle && implosionP > 0) {
        particles.forEach(p=>{
          const lP=c01L((implosionP-p.delay)/(1-p.delay),0,1);
          if(lP<=0) return;
          const eP=1-Math.pow(1-lP,3.5);
          const srcX=cx+p.sx*(W*.62), srcY=cy+p.sy*(H*.62);
          const tgtX=cx+p.tx*(R*.55), tgtY=cy+p.ty*(R*.55);
          const curve=Math.sin(lP*Math.PI)*p.noiseMag*Math.min(W,H);
          const perp=Math.atan2(tgtY-srcY,tgtX-srcX)+Math.PI/2;
          const fx=srcX+(tgtX-srcX)*eP+Math.cos(perp)*curve*(1-eP);
          const fy=srcY+(tgtY-srcY)*eP+Math.sin(perp)*curve*(1-eP);
          // Trail
          if(lP>.06&&lP<.88){
            for(let ti=1;ti<=5;ti++){
              const tp=Math.max(0,lP-ti*.022);
              const tep=1-Math.pow(1-tp,3.5);
              const tfx=srcX+(tgtX-srcX)*tep+Math.cos(perp)*Math.sin(tp*Math.PI)*p.noiseMag*Math.min(W,H)*(1-tep);
              const tfy=srcY+(tgtY-srcY)*tep+Math.sin(perp)*Math.sin(tp*Math.PI)*p.noiseMag*Math.min(W,H)*(1-tep);
              ctx.globalAlpha=(1-ti/5)*0.16*(1-lP*.5);
              ctx.beginPath(); ctx.arc(tfx,tfy,p.sz*.6,0,Math.PI*2);
              ctx.fillStyle=`rgba(${p.color},1)`; ctx.fill();
            }
            ctx.globalAlpha=1;
          }
          const al=Math.min(1,lP*3)*(lP<.92?1:1-(lP-.92)/.08);
          ctx.globalAlpha=al*.75;
          if(p.shape===0){
            ctx.beginPath(); ctx.arc(fx,fy,p.sz,0,Math.PI*2);
            ctx.fillStyle=`rgba(${p.color},1)`; ctx.fill();
          } else if(p.shape===1){
            ctx.beginPath(); ctx.arc(fx,fy,p.sz*4.2,p.angle,p.angle+Math.PI*.5);
            ctx.strokeStyle=`rgba(${p.color},1)`; ctx.lineWidth=.9; ctx.stroke();
          } else {
            const dx2=Math.cos(p.angle)*p.sz*4,dy2=Math.sin(p.angle)*p.sz*4;
            ctx.beginPath(); ctx.moveTo(fx-dx2,fy-dy2); ctx.lineTo(fx+dx2,fy+dy2);
            ctx.strokeStyle=`rgba(${p.color},1)`; ctx.lineWidth=.9; ctx.stroke();
          }
          ctx.globalAlpha=1;
        });
      }

      // ══ 5. ATMOSPHERE ══
      rGlow(cx,cy,0,R*2.8,20,110,195,0.10*gA);
      rGlow(cx,cy,0,R*1.8,50,150,225,0.07*gA);
      rGlow(cx-R*.1,cy-R*.08,0,R*.9,80,195,240,0.05*gA);
      if(mergeP>0) rGlow(cx,cy,0,R*2.2,201,168,76,0.12*mergeP);

      // ══ 6. GRID lat/lon ══
      ctx.lineWidth=.40;
      const gridR = isStable?1.0:globeP;
      for(let ld=-75;ld<=75;ld+=15){
        ctx.globalAlpha=(0.046+(ld===0?.038:0))*gridR;
        ctx.strokeStyle=ld===0?'#50C8C8':'rgba(80,200,200,1)';
        ctx.beginPath(); let first=true;
        for(let lo=0;lo<=360*gridR;lo+=2.5){
          const {px,py,z}=proj(ld*Math.PI/180,lo*Math.PI/180);
          if(z<-.04){first=true;continue;}
          if(first){ctx.moveTo(px,py);first=false;}else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
      for(let lo=0;lo<360;lo+=15){
        ctx.globalAlpha=0.038*gridR;
        ctx.strokeStyle='rgba(80,200,200,1)';
        ctx.beginPath(); let first=true;
        for(let ld=-86;ld<=86;ld+=3){
          const {px,py,z}=proj(ld*Math.PI/180,lo*Math.PI/180);
          if(z<-.04){first=true;continue;}
          if(first){ctx.moveTo(px,py);first=false;}else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha=1;

      // ══ 7. SPHERE NODES ══
      const visN=isStable?N:Math.min(N,Math.floor(N*Math.pow(globeP,.5)));
      type PP={px:number;py:number;z:number;vis:number;hub:boolean;sz:number};
      const pps:PP[]=[];
      for(let i=0;i<visN;i++){const sp=SPTS[i];const pp=proj(sp.lat,sp.lon);pps.push({...pp,hub:sp.hub,sz:sp.sz});}
      pps.sort((a,b)=>a.z-b.z);
      for(let i=0;i<pps.length;i++){
        const a=pps[i]; if(a.z<0) continue;
        for(let j=i+1;j<pps.length;j++){
          const b=pps[j]; if(b.z<0) continue;
          const d=Math.hypot(a.px-b.px,a.py-b.py), md=R*.22;
          if(d<md){ ctx.globalAlpha=Math.min(a.vis,b.vis)*.17*(1-d/md); ctx.strokeStyle='rgba(80,200,200,1)'; ctx.lineWidth=.38; ctx.beginPath(); ctx.moveTo(a.px,a.py); ctx.lineTo(b.px,b.py); ctx.stroke(); }
        }
      }
      ctx.globalAlpha=1;
      const hubs=pps.filter(p=>p.hub&&p.z>.04);
      for(let i=0;i<hubs.length;i++) for(let j=i+1;j<hubs.length;j++){
        const a=hubs[i],b=hubs[j],d=Math.hypot(a.px-b.px,a.py-b.py);
        if(d<R*.70){
          const al=Math.min(a.vis,b.vis)*.40*(1-d/(R*.70));
          const lg=ctx.createLinearGradient(a.px,a.py,b.px,b.py);
          lg.addColorStop(0,`rgba(201,168,76,${al})`); lg.addColorStop(.5,`rgba(80,200,200,${al*.6})`); lg.addColorStop(1,`rgba(201,168,76,${al})`);
          ctx.beginPath(); ctx.strokeStyle=lg; ctx.lineWidth=.9; ctx.moveTo(a.px,a.py); ctx.lineTo(b.px,b.py); ctx.stroke();
          const tp=((el/1200)+i*.28+j*.16)%1, mx=a.px+(b.px-a.px)*tp, my=a.py+(b.py-a.py)*tp;
          ctx.beginPath(); ctx.arc(mx,my,1.7,0,Math.PI*2); ctx.fillStyle=`rgba(201,168,76,${al*2.2})`; ctx.shadowColor='#C9A84C'; ctx.shadowBlur=9; ctx.fill(); ctx.shadowBlur=0;
        }
      }
      for(const p of pps){
        if(p.z<-.12) continue;
        if(p.hub){
          const pulse=1+Math.sin(el/650+p.px*.05)*.45;
          ctx.beginPath(); ctx.arc(p.px,p.py,p.sz*1.5*pulse,0,Math.PI*2);
          ctx.fillStyle=`rgba(201,168,76,${p.vis*.88*(0.6+mergeP*.4)})`; ctx.shadowColor='#C9A84C'; ctx.shadowBlur=14; ctx.fill(); ctx.shadowBlur=0;
          ctx.save(); ctx.translate(p.px,p.py); ctx.rotate(el/1400);
          ctx.beginPath(); ctx.arc(0,0,p.sz*3,0,Math.PI*1.3); ctx.strokeStyle=`rgba(201,168,76,${p.vis*.26})`; ctx.lineWidth=.75; ctx.stroke(); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(p.px,p.py,p.sz*.88,0,Math.PI*2);
          ctx.fillStyle=`rgba(80,200,200,${p.vis*.72})`; ctx.shadowColor='rgba(80,200,200,0.9)'; ctx.shadowBlur=p.sz*5; ctx.fill(); ctx.shadowBlur=0;
        }
      }

      // ══ 8. ORBITAL RINGS ══
      const orbA=isStable?.88:eO(c01L(implosionP,.35,1));
      if(orbA>.02){
        [{rx:R*1.28,ry:R*.26,rot:.32,spd:.9,gold:false},{rx:R*1.42,ry:R*.22,rot:.95,spd:-.6,gold:true},{rx:R*1.58,ry:R*.18,rot:-.45,spd:.5,gold:false}].forEach(ring=>{
          const c=ring.gold?'201,168,76':'80,200,200';
          ctx.save(); ctx.translate(cx,cy); ctx.rotate(ring.rot);
          [[7,.022],[3.5,.050],[1.3,.13]].forEach(([lw,la])=>{
            ctx.beginPath(); ctx.ellipse(0,0,ring.rx,ring.ry,0,0,Math.PI*2); ctx.strokeStyle=`rgba(${c},${(la as number)*orbA})`; ctx.lineWidth=lw as number; ctx.stroke();
          });
          ctx.restore();
          const a2=el/1000*ring.spd, dx=Math.cos(a2)*ring.rx, dy=Math.sin(a2)*ring.ry;
          const dxF=cx+dx*Math.cos(ring.rot)-dy*Math.sin(ring.rot), dyF=cy+dx*Math.sin(ring.rot)+dy*Math.cos(ring.rot);
          ctx.beginPath(); ctx.arc(dxF,dyF,2.8,0,Math.PI*2); ctx.fillStyle=`rgba(${c},${orbA*.88})`; ctx.shadowColor=`rgba(${c},0.9)`; ctx.shadowBlur=14; ctx.fill(); ctx.shadowBlur=0;
        });
      }

      // ══ 9. EAGLE TRACE ══
      if(isEagle && eagleP>.004){
        const S=R*.68, pLen=pathLength(EP,S);
        ctx.save(); ctx.translate(cx,cy);
        rGlow(0,0,0,S*1.8,201,168,76,eagleP*.10);
        ctx.setLineDash([pLen]); ctx.lineDashOffset=pLen*(1-Math.min(eagleP,1)); ctx.lineCap='round'; ctx.lineJoin='round';
        [[9,.030],[4.5,.065],[2.2,.13]].forEach(([lw,la])=>{ ctx.lineWidth=lw as number; ctx.strokeStyle=`rgba(201,168,76,${(la as number)*eagleP})`; ctx.beginPath(); EP.forEach(([x,y],i)=>i===0?ctx.moveTo(x*S,y*S):ctx.lineTo(x*S,y*S)); ctx.stroke(); });
        ctx.lineWidth=1.5; ctx.strokeStyle=`rgba(240,210,90,${eagleP*.92})`; ctx.beginPath(); EP.forEach(([x,y],i)=>i===0?ctx.moveTo(x*S,y*S):ctx.lineTo(x*S,y*S)); ctx.stroke();
        ctx.setLineDash([]);
        [[.08,-.34],[.34,-.17],[1.10,.04],[-1.10,.04],[.00,.43],[.00,.00]].forEach(([nx,ny],ni)=>{
          const np=Math.max(0,eagleP*5-ni*.6); if(np<=0) return;
          ctx.beginPath(); ctx.arc(nx*S,ny*S,3.0+Math.sin(el/480+ni)*.8,0,Math.PI*2);
          ctx.fillStyle=`rgba(201,168,76,${Math.min(1,np)*eagleP})`; ctx.shadowColor='#C9A84C'; ctx.shadowBlur=20; ctx.fill(); ctx.shadowBlur=0;
        });
        ctx.restore();
      }
      if(mergeP>0) rGlow(cx,cy,R*.85,R*2.0,201,168,76,.14*mergeP);

      if(isEagle && el>=(IMP_DUR+EAGLE_DUR+200) && !doneRef.current){ doneRef.current=true; onEagleDone(); }
      rafRef.current=requestAnimationFrame(draw);
    };

    rafRef.current=requestAnimationFrame(draw);
    return ()=>{ cancelAnimationFrame(rafRef.current); window.removeEventListener('resize',setSize); };
  },[phase,onEagleDone]);

  return <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:phase==='holo'?.18:1,transition:'opacity 1.4s ease'}}/>;
}

// CodeBox
function CodeBox({index,entered,status}:{index:number;entered:string;status:'idle'|'ok'|'err'}) {
  const isFilled=index<entered.length,isActive=index===entered.length&&status==='idle';
  const bc=status==='err'?'rgba(192,57,43,0.85)':status==='ok'?'rgba(180,160,80,0.80)':isFilled?'rgba(201,168,76,0.55)':isActive?'rgba(201,168,76,0.85)':'rgba(201,168,76,0.15)';
  const gc=status==='err'?'rgba(192,57,43,0.28)':status==='ok'?'rgba(201,168,76,0.38)':isActive?'rgba(201,168,76,0.22)':'transparent';
  return (
    <motion.div animate={status==='err'?{x:[-8,8,-6,6,-3,3,0]}:{}} transition={{duration:.4}}
      style={{width:54,height:66,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:4,border:`1.5px solid ${bc}`,background:isActive?'rgba(201,168,76,0.06)':'rgba(201,168,76,0.02)',position:'relative',boxShadow:`0 0 16px ${gc}`,transition:'border-color .2s, box-shadow .3s'}}>
      <div style={{position:'absolute',top:3,left:3,width:6,height:6,borderTop:`1px solid ${bc}`,borderLeft:`1px solid ${bc}`,opacity:.7}}/>
      <div style={{position:'absolute',bottom:3,right:3,width:6,height:6,borderBottom:`1px solid ${bc}`,borderRight:`1px solid ${bc}`,opacity:.7}}/>
      {isFilled?<motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400}} style={{width:10,height:10,borderRadius:'50%',background:'#C9A84C',boxShadow:'0 0 12px rgba(201,168,76,0.8)'}}/>
       :isActive?<motion.div animate={{opacity:[1,0,1]}} transition={{duration:.85,repeat:Infinity}} style={{width:2.5,height:26,background:'#C9A84C',borderRadius:2,boxShadow:'0 0 8px rgba(201,168,76,0.8)'}}/>:null}
    </motion.div>
  );
}

// NumKey
function NumKey({digit,onClick}:{digit:string;onClick:()=>void}) {
  const [p,setP]=useState(false);
  return (
    <motion.button onPointerDown={()=>{setP(true);onClick();}} onPointerUp={()=>setP(false)} onPointerLeave={()=>setP(false)}
      animate={p?{scale:.88}:{scale:1}} transition={{type:'spring',stiffness:600,damping:25}}
      style={{fontFamily:'Share Tech Mono,monospace',fontSize:18,fontWeight:600,padding:'12px 0',borderRadius:4,width:'100%',background:p?'rgba(201,168,76,0.14)':'rgba(201,168,76,0.04)',border:`1px solid ${p?'rgba(201,168,76,0.45)':'rgba(201,168,76,0.14)'}`,color:p?'#E8C97A':'#A89878',cursor:'pointer',userSelect:'none',position:'relative',overflow:'hidden',transition:'box-shadow .12s'}}>
      {p&&<motion.div initial={{scale:0,opacity:.6}} animate={{scale:3,opacity:0}} transition={{duration:.4}} style={{position:'absolute',top:'50%',left:'50%',width:30,height:30,borderRadius:'50%',background:'rgba(201,168,76,0.3)',transform:'translate(-50%,-50%)',pointerEvents:'none'}}/>}
      {digit}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════
// INTRO SCREEN
// ═══════════════════════════════════════════════════════
export default function IntroScreen() {
  const { setMode } = useDossier();
  const [phase,setPhase]=useState<Phase>('fingerprint');
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
  const holoSoundPlayed=useRef(false);

  // ── Son holographique de démarrage (Web Audio, unique) ──
  useEffect(()=>{
    if(holoSoundPlayed.current) return;
    holoSoundPlayed.current=true;
    // Délai léger pour laisser le navigateur se préparer
    const t=setTimeout(()=>{
      try {
        const ctx2=new (window.AudioContext||(window as any).webkitAudioContext)();
        const master=ctx2.createGain(); master.gain.value=0.28; master.connect(ctx2.destination);
        // Réverb plate
        const rev=ctx2.createConvolver();
        const rl=Math.floor(ctx2.sampleRate*2.2), rb=ctx2.createBuffer(2,rl,ctx2.sampleRate);
        for(let ch=0;ch<2;ch++){const d=rb.getChannelData(ch);for(let i=0;i<rl;i++) d[i]=(Math.random()*2-1)*Math.exp(-5*i/rl);}
        rev.buffer=rb; const rg=ctx2.createGain(); rg.gain.value=0.55; rev.connect(rg); rg.connect(master);
        // Layer 1: fond drone montant
        const drone=ctx2.createOscillator(); drone.type='sine'; drone.frequency.setValueAtTime(55,0); drone.frequency.exponentialRampToValueAtTime(110,2.0);
        const dg=ctx2.createGain(); dg.gain.setValueAtTime(0,0); dg.gain.linearRampToValueAtTime(0.22,0.35); dg.gain.linearRampToValueAtTime(0.10,2.8); dg.gain.linearRampToValueAtTime(0,3.5);
        drone.connect(dg); dg.connect(master); dg.connect(rev); drone.start(); drone.stop(3.6);
        // Layer 2: sweep synthétique
        const sweep=ctx2.createOscillator(); sweep.type='triangle'; sweep.frequency.setValueAtTime(320,0); sweep.frequency.exponentialRampToValueAtTime(1800,1.2); sweep.frequency.exponentialRampToValueAtTime(880,2.5);
        const sg=ctx2.createGain(); sg.gain.setValueAtTime(0,0); sg.gain.linearRampToValueAtTime(0.08,0.12); sg.gain.linearRampToValueAtTime(0.04,1.8); sg.gain.linearRampToValueAtTime(0,3.0);
        const lp=ctx2.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3200; lp.Q.value=1.2;
        sweep.connect(lp); lp.connect(sg); sg.connect(master); sg.connect(rev); sweep.start(); sweep.stop(3.1);
        // Layer 3: shimmer haute fréquence
        [660,880,1320].forEach((f,i)=>{
          const o=ctx2.createOscillator(); o.type='sine'; o.frequency.value=f;
          const g2=ctx2.createGain(); g2.gain.setValueAtTime(0,0); g2.gain.linearRampToValueAtTime(0.030,0.5+i*.25); g2.gain.linearRampToValueAtTime(0.015,2.0+i*.15); g2.gain.linearRampToValueAtTime(0,3.2);
          o.connect(g2); g2.connect(master); g2.connect(rev); o.start(); o.stop(3.3);
        });
        // Layer 4: bruit de texture numérique
        const noiseLen=Math.floor(ctx2.sampleRate*.8);
        const nb=ctx2.createBuffer(1,noiseLen,ctx2.sampleRate); const nd=nb.getChannelData(0);
        for(let i=0;i<noiseLen;i++) nd[i]=(Math.random()*2-1);
        const ns=ctx2.createBufferSource(); ns.buffer=nb;
        const nbp=ctx2.createBiquadFilter(); nbp.type='bandpass'; nbp.frequency.value=2400; nbp.Q.value=8;
        const ng=ctx2.createGain(); ng.gain.setValueAtTime(0,0); ng.gain.linearRampToValueAtTime(0.06,.05); ng.gain.exponentialRampToValueAtTime(0.001,.8);
        ns.connect(nbp); nbp.connect(ng); ng.connect(master); ns.start(); ns.stop(.9);
      } catch(e){ /* ignore */ }
    },200);
    return ()=>clearTimeout(t);
  },[]);

  const handleFingerprintDone=useCallback(()=>{ setPhase('eagle'); },[]);
  const handleEagleDone=useCallback(()=>{ setTimeout(()=>setPhase('pad'),400); },[]);
  useEffect(()=>{ const t=setTimeout(()=>{ if(phase==='fingerprint') setPhase('eagle'); },4500); return ()=>clearTimeout(t); },[phase]);
  useEffect(()=>{ const t=setTimeout(()=>{ if(phase==='eagle') setPhase('pad'); },8500); return ()=>clearTimeout(t); },[phase]);

  const initAudio=()=>{ if(!audioInit.current){audio.init();audioInit.current=true;} };
  const addDigit=(d:string)=>{ if(busy.current||entered.length>=4) return; initAudio(); audio.key(); const next=entered+d; setEntered(next); if(next.length===4){busy.current=true;setTimeout(()=>checkCode(next),380);} };
  const delDigit=()=>{ if(busy.current) return; initAudio(); audio.del(); setEntered(e=>e.slice(0,-1)); setStatusMsg(''); };
  const checkCode=(code:string)=>{
    const isA=code===CONFIG.codes.admin,isV=code===CONFIG.codes.visiteur;
    if(isA||isV){ initAudio(); audio.ok(); setStatus('ok'); setStatusMsg(isA?'✓ ACCÈS ADMINISTRATEUR — ÉDITION ACTIVÉE':'✓ ACCÈS VISITEUR — LECTURE SEULE'); setTimeout(()=>startHolo(isA?'admin':'visitor'),1000); }
    else { audio.err(); setStatus('err'); setAttempts(a=>a+1); setStatusMsg('✗ CODE INCORRECT — ACCÈS REFUSÉ'); setTimeout(()=>{ setStatus('idle'); setStatusMsg(''); setEntered(''); busy.current=false; },1400); }
  };
  const startHolo=(m:'admin'|'visitor')=>{
    initAudio();
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

      {phase!=='fingerprint'&&<GlobeEagleCanvas phase={phase} onEagleDone={handleEagleDone}/>}

      {/* Scan line */}
      <motion.div animate={{y:['-4px','100vh']}} transition={{duration:9,repeat:Infinity,ease:'linear',repeatDelay:3}}
        style={{position:'absolute',left:0,right:0,height:2,pointerEvents:'none',background:'linear-gradient(90deg,transparent,rgba(80,200,200,0.07),transparent)',zIndex:2}}/>

      {/* HUD corners */}
      {[{top:12,left:12,borderTop:'1.5px solid rgba(201,168,76,0.38)',borderLeft:'1.5px solid rgba(201,168,76,0.38)'},{top:12,right:12,borderTop:'1.5px solid rgba(201,168,76,0.38)',borderRight:'1.5px solid rgba(201,168,76,0.38)'},{bottom:12,left:12,borderBottom:'1.5px solid rgba(201,168,76,0.38)',borderLeft:'1.5px solid rgba(201,168,76,0.38)'},{bottom:12,right:12,borderBottom:'1.5px solid rgba(201,168,76,0.38)',borderRight:'1.5px solid rgba(201,168,76,0.38)'}].map((s,i)=>(
        <motion.div key={i} initial={{opacity:0,scale:.4}} animate={{opacity:1,scale:1}} transition={{delay:.2+i*.08}}
          style={{position:'absolute',...s,width:44,height:44,zIndex:25,pointerEvents:'none'}}/>
      ))}

      {/* ── FINGERPRINT PHASE ── */}
      {phase==='fingerprint'&&(
        <motion.div key="fp" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.4}}
          style={{position:'absolute',inset:0,zIndex:10,pointerEvents:'none'}}>
          <FingerprintScan onComplete={handleFingerprintDone}/>
        </motion.div>
      )}

      {phase==='eagle'&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.9}}
          style={{position:'absolute',bottom:'15%',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,pointerEvents:'none',zIndex:10}}>
          <div style={{...mono,fontSize:9,letterSpacing:6,color:'rgba(201,168,76,0.28)',textTransform:'uppercase',whiteSpace:'nowrap'}}>Département des Finances — Los Santos</div>
          <motion.div animate={{opacity:[.13,.50,.13]}} transition={{duration:1.6,repeat:Infinity}} style={{...mono,fontSize:8,letterSpacing:5,color:'rgba(80,200,200,0.18)',textTransform:'uppercase'}}>◈ Initialisation du système sécurisé...</motion.div>
        </motion.div>
      )}

      {phase==='pad'&&(
        <motion.div key="pad" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.55,ease:[.22,1,.36,1]}}
          style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',position:'relative',zIndex:10}}>

          {attempts>0&&<motion.div initial={{opacity:0}} animate={{opacity:1}} style={{position:'absolute',top:-30,right:0,...mono,fontSize:9,letterSpacing:3,color:'rgba(192,57,43,0.62)',textTransform:'uppercase'}}>TENTATIVES : {attempts}</motion.div>}

          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.10,duration:.7,ease:[.22,1,.36,1]}} style={{width:320,height:1,background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.55),transparent)',marginBottom:14}}/>

          <motion.div initial={{scale:.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:.20,type:'spring',stiffness:160}} style={{marginBottom:12,position:'relative'}}>
            <motion.div animate={{opacity:[.18,.52,.18],scale:[.92,1.08,.92]}} transition={{duration:3.8,repeat:Infinity}} style={{position:'absolute',inset:-18,borderRadius:'50%',background:'radial-gradient(circle,rgba(80,200,200,0.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
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
