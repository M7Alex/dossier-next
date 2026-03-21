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

// ─────────────────────────────────────────────────────────
// DESSIN AIGLE (fonction standalone, bezier holographique)
// ─────────────────────────────────────────────────────────
function strokeEagle(ctx: CanvasRenderingContext2D, s: number) {
  // Corps principal
  ctx.beginPath();
  // Aile gauche — top
  ctx.moveTo(-s*1.08, s*0.07);
  ctx.bezierCurveTo(-s*0.80, -s*0.13, -s*0.46, -s*0.21, -s*0.20, -s*0.07);
  // Vers le cou
  ctx.bezierCurveTo(-s*0.10, -s*0.02, -s*0.04, s*0.02, 0, s*0.04);
  // Aile droite — top
  ctx.bezierCurveTo(s*0.04, s*0.02, s*0.10, -s*0.02, s*0.20, -s*0.07);
  ctx.bezierCurveTo(s*0.46, -s*0.21, s*0.80, -s*0.13, s*1.08, s*0.07);
  // Aile droite — bottom
  ctx.bezierCurveTo(s*0.80, s*0.19, s*0.50, s*0.17, s*0.20, s*0.11);
  // Corps bas
  ctx.bezierCurveTo(s*0.10, s*0.15, s*0.06, s*0.22, s*0.05, s*0.30);
  // Queue droite
  ctx.lineTo(s*0.16, s*0.46);
  ctx.lineTo(0, s*0.36);
  // Queue gauche
  ctx.lineTo(-s*0.16, s*0.46);
  ctx.lineTo(-s*0.05, s*0.30);
  // Corps bas gauche
  ctx.bezierCurveTo(-s*0.06, s*0.22, -s*0.10, s*0.15, -s*0.20, s*0.11);
  // Aile gauche — bottom
  ctx.bezierCurveTo(-s*0.50, s*0.17, -s*0.80, s*0.19, -s*1.08, s*0.07);
  ctx.stroke();
  // Tête
  ctx.beginPath();
  ctx.arc(s*0.10, -s*0.23, s*0.10, 0, Math.PI*2);
  ctx.stroke();
  // Bec
  ctx.beginPath();
  ctx.moveTo(s*0.20, -s*0.22);
  ctx.lineTo(s*0.31, -s*0.18);
  ctx.lineTo(s*0.20, -s*0.14);
  ctx.stroke();
  // Cou
  ctx.beginPath();
  ctx.moveTo(s*0.04, -s*0.14);
  ctx.quadraticCurveTo(s*0.02, -s*0.05, 0, s*0.04);
  ctx.stroke();
}

// ─────────────────────────────────────────────────────────
// GLOBE + AIGLE UNIFIÉ — animation de constitution 3D
// ─────────────────────────────────────────────────────────
function GlobeEagleCanvas({
  phase, onEagleDone,
}: {
  phase: Phase;
  onEagleDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const startRef  = useRef<number>(0);
  const doneRef   = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    startRef.current = performance.now();
    doneRef.current  = false;

    // ── Paramètres globe (Fibonacci lattice) ──
    const N  = 200;
    const GR = (1 + Math.sqrt(5)) / 2;
    type SP  = { lat:number; lon:number; size:number; hub:boolean };
    const pts: SP[] = Array.from({ length: N }, (_, i) => ({
      lat:  Math.acos(1 - 2*(i+0.5)/N),
      lon:  2*Math.PI*i/GR,
      size: Math.random() < 0.08 ? 3.2 : Math.random() < 0.22 ? 1.9 : 1.0,
      hub:  Math.random() < 0.08,
    }));

    let globeAngle = 0;
    // Eagle path reveal — longueur totale approximative
    const EAGLE_DASH_LEN = 8000;

    // ease
    const eO  = (t:number) => 1 - Math.pow(1-t, 3);
    const eIO = (t:number) => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    const c01 = (v:number, a:number, b:number) => Math.max(0, Math.min(1, (v-a)/(b-a)));

    // ── Halo doux (sans bord dur) ──
    const softGlow = (
      rcx:number, rcy:number, r0:number, r1:number,
      R:number, G:number, B:number, maxA:number
    ) => {
      const g = ctx.createRadialGradient(rcx,rcy,r0, rcx,rcy,r1);
      g.addColorStop(0,   `rgba(${R},${G},${B},0)`);
      g.addColorStop(0.45,`rgba(${R},${G},${B},${maxA*0.45})`);
      g.addColorStop(0.75,`rgba(${R},${G},${B},${maxA*0.18})`);
      g.addColorStop(1,   `rgba(${R},${G},${B},0)`);
      ctx.beginPath();
      ctx.arc(rcx, rcy, r1, 0, Math.PI*2);
      ctx.fillStyle = g;
      ctx.fill();
    };

    const draw = (now: number) => {
      const W  = canvas.width;
      const H  = canvas.height;
      const cx = W/2, cy = H/2;
      const R  = Math.min(W,H) * 0.285;
      const elapsed = now - startRef.current;
      const TOTAL   = phase==='eagle' ? 6200 : 99999999;
      const t       = elapsed / TOTAL; // 0→1

      ctx.clearRect(0,0,W,H);
      globeAngle += 0.003;
      const ga = globeAngle;
      const tilt = 0.30;

      // Projeter un point 3D sphère → 2D canvas
      const proj = (lat:number, lon:number) => {
        const cL = Math.sin(lat), sL = Math.cos(lat);
        const x3 = cL*Math.cos(lon+ga);
        const z3 = cL*Math.sin(lon+ga);
        const y3 = sL;
        const y2 = y3*Math.cos(tilt) - z3*Math.sin(tilt);
        const z2 = y3*Math.sin(tilt) + z3*Math.cos(tilt);
        return { px: cx + x3*R, py: cy - y2*R, z: z2, vis:(z2+1)/2 };
      };

      // ── Timeline (pendant phase eagle uniquement) ──
      const globeP  = eO(c01(t, 0,    0.42));  // 0→0.42 globe build
      const gridP   = eO(c01(t, 0.02, 0.40));  // grid draw
      const eagleP  = eO(c01(t, 0.12, 0.52));  // 0.12→0.52 aigle se forme
      const moveP   = eIO(c01(t, 0.38, 0.70)); // 0.38→0.70 aigle se déplace
      const mergeP  = eIO(c01(t, 0.62, 0.88)); // 0.62→0.88 fusion
      const holdP   = eO(c01(t,  0.88, 1.0));  // hold final

      // Opacité globe (toujours visible, plus discret en pad)
      const globeAlpha = phase==='eagle' ? globeP : 0.85;
      const eagleAlpha = phase==='eagle' ? Math.max(0, eagleP * (1 - mergeP*0.95)) : 0;

      // ── 1. Halos atmosphériques DOUX ──
      softGlow(cx,cy, R*0.15, R*2.4, 30,150,200, 0.11*globeAlpha);
      softGlow(cx,cy, 0, R*1.2, 60,120,200, 0.07*globeAlpha);
      // Halo doré (apparaît pendant fusion aigle)
      if (phase==='eagle' && mergeP > 0) {
        softGlow(cx,cy, R*0.2, R*1.8, 201,168,76, 0.10*mergeP);
      }

      // ── 2. Grille lat/lon (se dessine progressivement) ──
      ctx.globalAlpha = 0.055 * (phase==='eagle' ? gridP : 1);
      ctx.strokeStyle = '#50C8C8';
      ctx.lineWidth   = 0.45;
      const drawLine = (latDeg:number, fixedLon:boolean) => {
        ctx.beginPath();
        let first = true;
        const maxAngle = 360 * (phase==='eagle' ? gridP : 1);
        for (let a=0; a<=maxAngle; a+=2) {
          const la = fixedLon ? a * Math.PI/180 - Math.PI/2 : latDeg * Math.PI/180;
          const lo = fixedLon ? latDeg * Math.PI/180 : a * Math.PI/180;
          const {px,py,z} = proj(la, lo);
          if (z < -0.04) { first=true; continue; }
          if (first) { ctx.moveTo(px,py); first=false; } else ctx.lineTo(px,py);
        }
        ctx.stroke();
      };
      for (let lat=-80;lat<=80;lat+=20) drawLine(lat, false);
      for (let lon=0;lon<360;lon+=20) drawLine(lon, true);
      ctx.globalAlpha = 1;

      // ── 3. Points + connexions ──
      const visible = Math.floor(N * (phase==='eagle' ? globeP : 1));
      type PP = { px:number;py:number;z:number;vis:number;hub:boolean;size:number };
      const pps: PP[] = [];
      for (let i=0;i<visible;i++) {
        const p   = pts[i];
        const {px,py,z,vis} = proj(p.lat,p.lon);
        pps.push({px,py,z,vis,hub:p.hub,size:p.size});
      }
      pps.sort((a,b)=>a.z-b.z);

      // Connexions normales
      for (let i=0;i<pps.length;i++) {
        const a=pps[i]; if(a.z<0) continue;
        for (let j=i+1;j<pps.length;j++) {
          const b=pps[j]; if(b.z<0) continue;
          const d=Math.hypot(a.px-b.px,a.py-b.py);
          const md=R*0.25;
          if (d<md) {
            const al=Math.min(a.vis,b.vis)*0.22*(1-d/md)*globeAlpha;
            ctx.beginPath();
            ctx.strokeStyle=`rgba(80,200,200,${al})`;
            ctx.lineWidth=0.4;
            ctx.moveTo(a.px,a.py); ctx.lineTo(b.px,b.py);
            ctx.stroke();
          }
        }
      }

      // Connexions hubs (dorées + particule animée)
      const hubs = pps.filter(p=>p.hub&&p.z>0);
      for (let i=0;i<hubs.length;i++) {
        for (let j=i+1;j<hubs.length;j++) {
          const a=hubs[i],b=hubs[j];
          const d=Math.hypot(a.px-b.px,a.py-b.py);
          if (d<R*0.62) {
            const al=Math.min(a.vis,b.vis)*0.45*(1-d/(R*0.62))*globeAlpha*(0.5+mergeP*0.5);
            const lg=ctx.createLinearGradient(a.px,a.py,b.px,b.py);
            lg.addColorStop(0,`rgba(201,168,76,${al})`);
            lg.addColorStop(.5,`rgba(80,200,200,${al*0.7})`);
            lg.addColorStop(1,`rgba(201,168,76,${al})`);
            ctx.beginPath(); ctx.strokeStyle=lg; ctx.lineWidth=0.9;
            ctx.moveTo(a.px,a.py); ctx.lineTo(b.px,b.py); ctx.stroke();
            const tp=((elapsed/1400)+i*0.3+j*0.18)%1;
            const mx=a.px+(b.px-a.px)*tp,my=a.py+(b.py-a.py)*tp;
            ctx.beginPath(); ctx.arc(mx,my,1.6,0,Math.PI*2);
            ctx.fillStyle=`rgba(201,168,76,${al*2})`;
            ctx.shadowColor='#C9A84C'; ctx.shadowBlur=7;
            ctx.fill(); ctx.shadowBlur=0;
          }
        }
      }

      // Points sphère
      for (const p of pps) {
        if (p.z < -0.12) continue;
        const bonusGold = mergeP * 0.4; // les hubs deviennent plus dorés lors de la fusion
        if (p.hub) {
          ctx.beginPath();
          ctx.arc(p.px,p.py, p.size*1.5+bonusGold*2, 0, Math.PI*2);
          ctx.fillStyle=`rgba(201,168,76,${p.vis*(0.75+bonusGold)})`;
          ctx.shadowColor='#C9A84C'; ctx.shadowBlur=14;
          ctx.fill(); ctx.shadowBlur=0;
          // Losange
          ctx.save(); ctx.translate(p.px,p.py); ctx.rotate(Math.PI/4);
          ctx.strokeStyle=`rgba(201,168,76,${p.vis*0.5})`;
          ctx.lineWidth=0.7;
          const r=p.size*0.8;
          ctx.strokeRect(-r,-r,r*2,r*2);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.px,p.py, p.size*0.88, 0, Math.PI*2);
          ctx.fillStyle=`rgba(80,200,200,${p.vis*0.72})`;
          ctx.shadowColor='rgba(80,200,200,0.9)'; ctx.shadowBlur=p.size*4;
          ctx.fill(); ctx.shadowBlur=0;
        }
      }

      // ── 4. AIGLE HOLOGRAPHIQUE DORÉ ──
      if (phase==='eagle' && eagleAlpha > 0.005 && eagleP > 0) {
        // Position : arrive depuis en haut à gauche
        const startX = cx - W*0.40, startY = cy - H*0.34;
        const ax = startX + (cx - startX) * moveP;
        const ay = startY + (cy - startY) * moveP;
        // Taille : grandit à mesure qu'il se rapproche et se fond
        const s  = R * (0.22 + moveP*0.58);

        ctx.save();
        ctx.translate(ax, ay);

        // Halo doré DOUX autour de l'aigle (pas de bord dur)
        const halo = ctx.createRadialGradient(0,0,s*0.1, 0,0,s*1.6);
        halo.addColorStop(0,   `rgba(201,168,76,${eagleAlpha*0.14})`);
        halo.addColorStop(0.5, `rgba(201,168,76,${eagleAlpha*0.07})`);
        halo.addColorStop(1,   'rgba(201,168,76,0)');
        ctx.beginPath(); ctx.arc(0,0,s*1.6,0,Math.PI*2);
        ctx.fillStyle=halo; ctx.fill();

        // Couches de glow (soft, SANS bord dur)
        const glowLayers = [
          { width:9, alpha:0.05 },
          { width:5, alpha:0.09 },
          { width:2.5, alpha:0.14 },
        ];
        ctx.lineCap='round'; ctx.lineJoin='round';

        // Reveal progressif via lineDashOffset
        const revealOffset = EAGLE_DASH_LEN*(1-Math.min(eagleP,1));
        ctx.setLineDash([EAGLE_DASH_LEN]);
        ctx.lineDashOffset = revealOffset;

        for (const gl of glowLayers) {
          ctx.lineWidth = gl.width;
          ctx.strokeStyle = `rgba(201,168,76,${gl.alpha*eagleAlpha})`;
          strokeEagle(ctx, s);
        }

        // Trait principal net (gold clair)
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = `rgba(235,200,90,${eagleAlpha*0.90})`;
        strokeEagle(ctx, s);

        ctx.setLineDash([]);

        // Nœuds clés (points lumineux sur l'aigle)
        const nodes = [
          {x:0, y:0.04},        // centre corps
          {x:-0.52, y:0.00},    // milieu aile gauche
          {x: 0.52, y:0.00},    // milieu aile droite
          {x:-1.05, y:0.07},    // bout aile gauche
          {x: 1.05, y:0.07},    // bout aile droite
          {x: 0.10, y:-0.23},   // tête
          {x:0,    y: 0.40},    // queue
        ];
        nodes.forEach(({x,y},i) => {
          const nodeReveal = Math.max(0, eagleP*6 - i*0.3);
          if (nodeReveal<=0) return;
          const na = Math.min(1,nodeReveal)*eagleAlpha;
          ctx.beginPath();
          ctx.arc(x*s, y*s, 3.5+Math.sin(elapsed/600+i)*0.8, 0, Math.PI*2);
          ctx.fillStyle=`rgba(201,168,76,${na})`;
          ctx.shadowColor='#C9A84C'; ctx.shadowBlur=18;
          ctx.fill(); ctx.shadowBlur=0;
        });

        // Connexions entre nœuds de l'aigle
        if (eagleP > 0.4) {
          const connAlpha = (eagleP-0.4)*1.67*eagleAlpha*0.35;
          [[0,1],[0,2],[1,3],[2,4],[0,5],[0,6]].forEach(([a,b]) => {
            const na=nodes[a], nb=nodes[b];
            ctx.beginPath();
            ctx.strokeStyle=`rgba(201,168,76,${connAlpha})`;
            ctx.lineWidth=0.7;
            ctx.moveTo(na.x*s,na.y*s); ctx.lineTo(nb.x*s,nb.y*s);
            ctx.stroke();
          });
        }

        ctx.restore();
      }

      // ── 5. Anneau orbital DOUX ──
      if ((phase==='eagle' ? globeP : 1) > 0.55) {
        const ringAlpha = phase==='eagle'
          ? (globeP-0.55)*2.22*(0.4+mergeP*0.6)
          : 0.9;
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(0.28);
        ctx.scale(1, 0.24);
        // Gradient linéaire → fondu sur les côtés = PAS de bord dur
        const rg = ctx.createLinearGradient(-R*1.22,0, R*1.22,0);
        rg.addColorStop(0,    'rgba(201,168,76,0)');
        rg.addColorStop(0.18, `rgba(201,168,76,${ringAlpha*0.28})`);
        rg.addColorStop(0.5,  `rgba(201,168,76,${ringAlpha*0.07})`);
        rg.addColorStop(0.82, `rgba(201,168,76,${ringAlpha*0.28})`);
        rg.addColorStop(1,    'rgba(201,168,76,0)');
        ctx.beginPath();
        ctx.ellipse(0,0, R*1.22,R*1.22, 0,0,Math.PI*2);
        ctx.strokeStyle=rg; ctx.lineWidth=1.8; ctx.stroke();
        ctx.restore();
      }

      // ── Done? ──
      if (phase==='eagle' && t>=1 && !doneRef.current) {
        doneRef.current = true;
        onEagleDone();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [phase, onEagleDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:'absolute', inset:0,
        width:'100%', height:'100%',
        pointerEvents:'none',
        opacity: phase==='holo' ? 0.25 : 1,
        transition:'opacity 1s ease',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────
// CODE BOX
// ─────────────────────────────────────────────────────────
function CodeBox({ index, entered, status }: {
  index:number; entered:string; status:'idle'|'ok'|'err';
}) {
  const isFilled = index < entered.length;
  const isActive = index === entered.length && status==='idle';
  const bc = status==='err'?'rgba(192,57,43,0.85)':status==='ok'?'rgba(180,160,80,0.80)':isFilled?'rgba(201,168,76,0.55)':isActive?'rgba(201,168,76,0.85)':'rgba(201,168,76,0.15)';
  const gc = status==='err'?'rgba(192,57,43,0.3)':status==='ok'?'rgba(201,168,76,0.4)':isActive?'rgba(201,168,76,0.25)':'transparent';
  return (
    <motion.div
      animate={status==='err'?{x:[-8,8,-6,6,-3,3,0]}:{}}
      transition={{duration:0.4}}
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

// ─────────────────────────────────────────────────────────
// NUM KEY
// ─────────────────────────────────────────────────────────
function NumKey({ digit, onClick }: { digit:string; onClick:()=>void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <motion.button
      onPointerDown={()=>{setPressed(true);onClick();}}
      onPointerUp={()=>setPressed(false)}
      onPointerLeave={()=>setPressed(false)}
      animate={pressed?{scale:0.88}:{scale:1}}
      transition={{type:'spring',stiffness:600,damping:25}}
      style={{fontFamily:'Share Tech Mono,monospace',fontSize:18,fontWeight:600,padding:'12px 0',borderRadius:4,width:'100%',background:pressed?'rgba(201,168,76,0.14)':'rgba(201,168,76,0.04)',border:`1px solid ${pressed?'rgba(201,168,76,0.45)':'rgba(201,168,76,0.14)'}`,color:pressed?'#E8C97A':'#A89878',cursor:'pointer',userSelect:'none',position:'relative',overflow:'hidden',transition:'box-shadow .12s, color .12s'}}>
      {pressed&&<motion.div initial={{scale:0,opacity:0.6}} animate={{scale:3,opacity:0}} transition={{duration:0.4}} style={{position:'absolute',top:'50%',left:'50%',width:30,height:30,borderRadius:'50%',background:'rgba(201,168,76,0.3)',transform:'translate(-50%,-50%)',pointerEvents:'none'}}/>}
      {digit}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────
// INTRO SCREEN PRINCIPAL
// ─────────────────────────────────────────────────────────
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

  // Eagle done → transition vers pad
  const handleEagleDone = useCallback(() => {
    setTimeout(() => setPhase('pad'), 500);
  }, []);

  // Fallback si animation trop longue
  useEffect(() => {
    const t = setTimeout(()=>{ if(phase==='eagle') setPhase('pad'); }, 7000);
    return () => clearTimeout(t);
  }, [phase]);

  const initAudio = () => { if(!audioInit.current){audio.init();audioInit.current=true;} };

  const addDigit = (d:string) => {
    if(busy.current||entered.length>=4) return;
    initAudio(); audio.key();
    const next=entered+d; setEntered(next);
    if(next.length===4){ busy.current=true; setTimeout(()=>checkCode(next),380); }
  };
  const delDigit = () => {
    if(busy.current) return;
    initAudio(); audio.del();
    setEntered(e=>e.slice(0,-1)); setStatusMsg('');
  };
  const checkCode = (code:string) => {
    const isAdmin   = code===CONFIG.codes.admin;
    const isVisitor = code===CONFIG.codes.visiteur;
    if(isAdmin||isVisitor) {
      audio.ok(); setStatus('ok');
      setStatusMsg(isAdmin?'✓ ACCÈS ADMINISTRATEUR — ÉDITION ACTIVÉE':'✓ ACCÈS VISITEUR — LECTURE SEULE');
      setTimeout(()=>startHolo(isAdmin?'admin':'visitor'), 1000);
    } else {
      audio.err(); setStatus('err'); setAttempts(a=>a+1);
      setStatusMsg('✗ CODE INCORRECT — ACCÈS REFUSÉ');
      setTimeout(()=>{ setStatus('idle'); setStatusMsg(''); setEntered(''); busy.current=false; }, 1400);
    }
  };
  const startHolo = (accessMode:'admin'|'visitor') => {
    setPhase('holo');
    const ticks=[0,155,295,420,530,625,705,772,828,872,908,934,952,963];
    ticks.forEach(d=>setTimeout(()=>audio.tick(), d+260));
    setTimeout(()=>{ holoRef.current?.lock(); audio.lock(); setGStat('Déclassification en cours...'); }, 1620);
    setTimeout(()=>{ audio.voice(); setShowVBox(true); }, 2700);
    setTimeout(()=>{ setShowStamp(true); audio.stamp(); }, 4200);
    setTimeout(()=>{ audio.reveal(); launchConfetti(); setPhase('done'); setMode(accessMode); }, 6500);
  };

  if(phase==='done') return null;

  const mono:React.CSSProperties = { fontFamily:'"Share Tech Mono",monospace' };

  return (
    <motion.div exit={{opacity:0,scale:1.04}} transition={{duration:0.9}}
      style={{position:'fixed',inset:0,zIndex:9999,background:'#020810',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>

      {/* ── Globe + Aigle (toujours monté) ── */}
      <GlobeEagleCanvas phase={phase} onEagleDone={handleEagleDone}/>

      {/* Grille terminale */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(201,168,76,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.016) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>

      {/* Ligne de scan */}
      <motion.div animate={{y:['-4px','100vh']}} transition={{duration:9,repeat:Infinity,ease:'linear',repeatDelay:3}}
        style={{position:'absolute',left:0,right:0,height:2,pointerEvents:'none',background:'linear-gradient(90deg,transparent,rgba(80,200,200,0.09),transparent)',zIndex:2}}/>

      {/* Coins HUD */}
      {[{top:12,left:12,borderTop:'1.5px solid rgba(201,168,76,0.38)',borderLeft:'1.5px solid rgba(201,168,76,0.38)'},{top:12,right:12,borderTop:'1.5px solid rgba(201,168,76,0.38)',borderRight:'1.5px solid rgba(201,168,76,0.38)'},{bottom:12,left:12,borderBottom:'1.5px solid rgba(201,168,76,0.38)',borderLeft:'1.5px solid rgba(201,168,76,0.38)'},{bottom:12,right:12,borderBottom:'1.5px solid rgba(201,168,76,0.38)',borderRight:'1.5px solid rgba(201,168,76,0.38)'}].map((s,i)=>(
        <motion.div key={i} initial={{opacity:0,scale:0.4}} animate={{opacity:1,scale:1}} transition={{delay:0.3+i*0.1}}
          style={{position:'absolute',...s,width:44,height:44,zIndex:25,pointerEvents:'none'}}/>
      ))}

      {/* ── EAGLE PHASE — textes ── */}
      {phase==='eagle' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          style={{position:'absolute',bottom:'18%',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:10,pointerEvents:'none',zIndex:10}}>
          <div style={{...mono,fontSize:9,letterSpacing:6,color:'rgba(201,168,76,0.32)',textTransform:'uppercase',whiteSpace:'nowrap'}}>
            Département des Finances — Los Santos
          </div>
          <motion.div animate={{opacity:[0.18,0.65,0.18]}} transition={{duration:1.5,repeat:Infinity}}
            style={{...mono,fontSize:8,letterSpacing:5,color:'rgba(80,200,200,0.22)',textTransform:'uppercase'}}>
            ◈ Initialisation du système sécurisé...
          </motion.div>
        </motion.div>
      )}

      {/* ── PAD PHASE ── */}
      {phase==='pad' && (
        <motion.div key="pad" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:0.55,ease:[0.22,1,0.36,1]}}
          style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',position:'relative',zIndex:10}}>

          {/* Tentatives */}
          {attempts>0 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}}
              style={{position:'absolute',top:-34,right:0,...mono,fontSize:9,letterSpacing:3,color:'rgba(192,57,43,0.62)',textTransform:'uppercase'}}>
              TENTATIVES : {attempts}
            </motion.div>
          )}

          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:0.1,duration:0.7,ease:[0.22,1,0.36,1]}}
            style={{width:320,height:1,background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.55),transparent)',marginBottom:14}}/>

          {/* Badge */}
          <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:0.2,type:'spring',stiffness:160}}
            style={{marginBottom:12,position:'relative'}}>
            <motion.div animate={{opacity:[0.22,0.58,0.22],scale:[0.92,1.08,0.92]}} transition={{duration:3.8,repeat:Infinity}}
              style={{position:'absolute',inset:-18,borderRadius:'50%',background:'radial-gradient(circle,rgba(80,200,200,0.09) 0%,transparent 70%)',pointerEvents:'none'}}/>
            <div style={{width:70,height:70,borderRadius:'50%',border:'2px solid rgba(201,168,76,0.65)',background:'radial-gradient(circle,#1A2438 60%,#020810)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,boxShadow:'0 0 28px rgba(201,168,76,0.12)'}}>🦅</div>
          </motion.div>

          <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:0.30}}
            style={{fontFamily:'Cinzel,serif',fontSize:7.5,letterSpacing:6,color:'#7A5910',textTransform:'uppercase',marginBottom:3}}>
            Département des Finances — Los Santos
          </motion.div>
          <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:0.38}}
            style={{fontFamily:'Cinzel,serif',fontSize:19,fontWeight:700,color:'#C9A84C',textTransform:'uppercase',letterSpacing:3,marginBottom:4}}>
            Dossier Confidentiel
          </motion.div>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.46}}
            style={{...mono,fontSize:7.5,letterSpacing:3,color:'rgba(201,168,76,0.20)',textTransform:'uppercase',marginBottom:18}}>
            Code Visiteur — Lecture &nbsp;/&nbsp; Code Admin — Édition
          </motion.div>

          <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:0.44,duration:0.7,ease:[0.22,1,0.36,1]}}
            style={{width:180,height:1,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',marginBottom:18}}/>

          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.54}}
            style={{...mono,fontSize:8,letterSpacing:4,color:'rgba(201,168,76,0.42)',textTransform:'uppercase',marginBottom:12}}>
            ◈ &nbsp; Entrez le code d'accès &nbsp; ◈
          </motion.div>

          {/* Code boxes */}
          <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} transition={{delay:0.60,type:'spring'}}
            style={{display:'flex',gap:10,marginBottom:16}}>
            {[0,1,2,3].map(i=><CodeBox key={i} index={i} entered={entered} status={status}/>)}
          </motion.div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {statusMsg
              ? <motion.div key="msg" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.18}}
                  style={{...mono,fontSize:8,letterSpacing:2,textTransform:'uppercase',height:17,marginBottom:12,color:status==='ok'?'rgba(180,160,80,0.92)':'rgba(192,57,43,0.88)'}}>
                  {statusMsg}
                </motion.div>
              : <div style={{height:17,marginBottom:12}}/>
            }
          </AnimatePresence>

          {/* Numpad */}
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

      {/* ── HOLO PHASE ── */}
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
