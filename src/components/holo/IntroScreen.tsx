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

// ────────────────────────────────────────────────────────
// GLOBE CANVAS — Animation planétaire réseau financier
// Inspiré du GIF : globe numérique avec connexions
// ────────────────────────────────────────────────────────
function GlobeCanvas({ opacity = 1, scale = 1 }: { opacity?: number; scale?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Génération des points sur la sphère (Fibonacci lattice)
    const N = 220;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    type SpherePoint = { lat: number; lon: number; size: number; isHub: boolean };
    const spherePoints: SpherePoint[] = Array.from({ length: N }, (_, i) => ({
      lat: Math.acos(1 - 2 * (i + 0.5) / N),
      lon: 2 * Math.PI * i / goldenRatio,
      size: Math.random() < 0.08 ? 3.5 : Math.random() < 0.2 ? 2 : 1.2,
      isHub: Math.random() < 0.08,
    }));

    // Points "villes" hubs (nœuds financiers)
    const hubIndices = spherePoints
      .map((p, i) => ({ p, i }))
      .filter(x => x.p.isHub)
      .map(x => x.i);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      angleRef.current += 0.004;
      const angle = angleRef.current;

      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.30;

      // Projection 3D → 2D
      type Proj = { px: number; py: number; z: number; vis: number; idx: number; isHub: boolean; size: number };
      const proj: Proj[] = spherePoints.map((p, idx) => {
        const cosLat = Math.sin(p.lat);
        const sinLat = Math.cos(p.lat);
        const x = cosLat * Math.cos(p.lon + angle);
        const z = cosLat * Math.sin(p.lon + angle);
        const y = sinLat;
        // Légère inclinaison de l'axe (23.5° comme la Terre)
        const tilt = 0.41;
        const yt = y * Math.cos(tilt) - z * Math.sin(tilt);
        const zt = y * Math.sin(tilt) + z * Math.cos(tilt);
        return {
          px: cx + x * R,
          py: cy - yt * R,
          z: zt,
          vis: (zt + 1) / 2,
          idx, isHub: p.isHub, size: p.size,
        };
      });

      // Trier back→front
      proj.sort((a, b) => a.z - b.z);

      // ── Cercle globe (hémisphère sombre) ──
      const grad = ctx.createRadialGradient(cx - R*0.2, cy - R*0.2, R*0.1, cx, cy, R*1.1);
      grad.addColorStop(0, 'rgba(10,20,45,0.0)');
      grad.addColorStop(0.6, 'rgba(5,12,28,0.0)');
      grad.addColorStop(1, 'rgba(0,8,20,0.0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI*2);
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Lignes de latitude/longitude (grille sphérique) ──
      ctx.globalAlpha = 0.07;
      ctx.strokeStyle = '#50C8C8';
      ctx.lineWidth = 0.5;
      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath();
        let first = true;
        for (let lonD = 0; lonD <= 360; lonD += 3) {
          const lonR = (lonD * Math.PI / 180) + angle;
          const latR = lat * Math.PI / 180;
          const cosLat = Math.cos(latR);
          const x = cosLat * Math.cos(lonR);
          const z = cosLat * Math.sin(lonR);
          const y = Math.sin(latR);
          const tilt = 0.41;
          const yt = y * Math.cos(tilt) - z * Math.sin(tilt);
          const zt = y * Math.sin(tilt) + z * Math.cos(tilt);
          if (zt < -0.05) { first = true; continue; }
          const px = cx + x * R, py = cy - yt * R;
          if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      for (let lonD = 0; lonD < 360; lonD += 20) {
        ctx.beginPath();
        let first = true;
        for (let latD = -90; latD <= 90; latD += 3) {
          const lonR = (lonD * Math.PI / 180) + angle;
          const latR = latD * Math.PI / 180;
          const cosLat = Math.cos(latR);
          const x = cosLat * Math.cos(lonR);
          const z = cosLat * Math.sin(lonR);
          const y = Math.sin(latR);
          const tilt = 0.41;
          const yt = y * Math.cos(tilt) - z * Math.sin(tilt);
          const zt = y * Math.sin(tilt) + z * Math.cos(tilt);
          if (zt < -0.05) { first = true; continue; }
          const px = cx + x * R, py = cy - yt * R;
          if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── Connexions entre hubs financiers ──
      const visHubs = proj.filter(p => p.isHub && p.z > -0.1);
      for (let i = 0; i < visHubs.length; i++) {
        for (let j = i+1; j < visHubs.length; j++) {
          const a = visHubs[i], b = visHubs[j];
          const dist = Math.hypot(a.px - b.px, a.py - b.py);
          if (dist < R * 0.75) {
            const alpha = Math.min(a.vis, b.vis) * 0.55 * (1 - dist/(R*0.75));
            // Ligne gold pour les hubs
            const lineGrad = ctx.createLinearGradient(a.px, a.py, b.px, b.py);
            lineGrad.addColorStop(0, `rgba(201,168,76,${alpha})`);
            lineGrad.addColorStop(0.5, `rgba(80,200,200,${alpha * 0.8})`);
            lineGrad.addColorStop(1, `rgba(201,168,76,${alpha})`);
            ctx.beginPath();
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 0.8;
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();

            // Particule animée sur la ligne
            const t = ((Date.now() / 1500) + i * 0.3 + j * 0.17) % 1;
            const mx = a.px + (b.px - a.px) * t;
            const my = a.py + (b.py - a.py) * t;
            ctx.beginPath();
            ctx.arc(mx, my, 1.5, 0, Math.PI*2);
            ctx.fillStyle = `rgba(201,168,76,${alpha * 1.5})`;
            ctx.shadowColor = '#C9A84C';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // ── Connexions réseau normaux ──
      for (let i = 0; i < proj.length; i++) {
        const a = proj[i];
        if (a.z < 0) continue;
        for (let j = i+1; j < proj.length; j++) {
          const b = proj[j];
          if (b.z < 0) continue;
          const dist = Math.hypot(a.px - b.px, a.py - b.py);
          const maxDist = R * 0.28;
          if (dist < maxDist) {
            const alpha = Math.min(a.vis, b.vis) * 0.28 * (1 - dist/maxDist);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(80,200,200,${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();
          }
        }
      }

      // ── Points ──
      for (const p of proj) {
        if (p.z < -0.15) continue;
        const alpha = p.vis;
        if (p.isHub) {
          // Hub — point doré avec halo
          const haloSize = p.size * (2.5 + Math.sin(Date.now()/800 + p.idx) * 0.8);
          ctx.beginPath();
          ctx.arc(p.px, p.py, haloSize * 2, 0, Math.PI*2);
          ctx.fillStyle = `rgba(201,168,76,${alpha * 0.10})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.px, p.py, p.size * 1.4, 0, Math.PI*2);
          ctx.fillStyle = `rgba(201,168,76,${alpha * 0.9})`;
          ctx.shadowColor = '#C9A84C';
          ctx.shadowBlur = 14;
          ctx.fill();
          ctx.shadowBlur = 0;
          // Losange sur les hubs
          ctx.save();
          ctx.translate(p.px, p.py);
          ctx.rotate(Math.PI/4);
          ctx.beginPath();
          ctx.rect(-p.size*0.7, -p.size*0.7, p.size*1.4, p.size*1.4);
          ctx.strokeStyle = `rgba(201,168,76,${alpha * 0.6})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        } else {
          // Point standard cyan
          ctx.beginPath();
          ctx.arc(p.px, p.py, p.size * 0.9, 0, Math.PI*2);
          ctx.fillStyle = `rgba(80,200,200,${alpha * 0.75})`;
          ctx.shadowColor = 'rgba(80,200,200,0.9)';
          ctx.shadowBlur = p.size * 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // ── Anneau orbital autour du globe ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.3);
      ctx.scale(1, 0.28);
      const ringGrad = ctx.createLinearGradient(-R*1.25, 0, R*1.25, 0);
      ringGrad.addColorStop(0, 'transparent');
      ringGrad.addColorStop(0.3, 'rgba(201,168,76,0.25)');
      ringGrad.addColorStop(0.5, 'rgba(201,168,76,0.08)');
      ringGrad.addColorStop(0.7, 'rgba(201,168,76,0.25)');
      ringGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.ellipse(0, 0, R*1.25, R*1.25, 0, 0, Math.PI*2);
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // ── Halo global ──
      const outerGlow = ctx.createRadialGradient(cx, cy, R*0.7, cx, cy, R*1.5);
      outerGlow.addColorStop(0, 'rgba(80,200,200,0.0)');
      outerGlow.addColorStop(0.7, 'rgba(80,200,200,0.04)');
      outerGlow.addColorStop(1, 'rgba(80,200,200,0.0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R*1.5, 0, Math.PI*2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      animate={{ opacity, scale }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
    />
  );
}

// ────────────────────────────────────────────────────────
// EAGLE CONSTELLATION — L'aigle se forme depuis des
// particules éparpillées (comme le globe se constitue)
// ────────────────────────────────────────────────────────
function EagleConstellation({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Points clés de la silhouette de l'aigle (normalisés -1 à 1)
    const eagleShape = [
      // Corps
      [0,0],[0.08,0.1],[0.06,0.22],[0,0.28],[-0.06,0.22],[-0.08,0.1],
      // Tête
      [0,-0.18],[0.06,-0.12],[0.04,-0.25],[0,-0.3],[-0.04,-0.25],[-0.06,-0.12],
      // Bec
      [0.12,-0.15],[0.18,-0.18],[0.12,-0.20],
      // Aile gauche
      [-0.45,-0.05],[-0.55,-0.02],[-0.65,0.05],[-0.70,0.10],
      [-0.50,0.04],[-0.40,0.00],[-0.30,-0.02],
      [-0.60,0.12],[-0.52,0.08],[-0.42,0.05],
      // Aile droite
      [0.45,-0.05],[0.55,-0.02],[0.65,0.05],[0.70,0.10],
      [0.50,0.04],[0.40,0.00],[0.30,-0.02],
      [0.60,0.12],[0.52,0.08],[0.42,0.05],
      // Queue
      [-0.10,0.35],[-0.05,0.42],[0,0.45],[0.05,0.42],[0.10,0.35],
      // Serres
      [-0.04,0.40],[0.04,0.40],
      // Points déco supplémentaires
      [-0.35,0.02],[0.35,0.02],[-0.20,-0.08],[0.20,-0.08],
      [-0.15,0.15],[0.15,0.15],
    ];

    const R = Math.min(canvas.width, canvas.height) * 0.22;

    // Particules : position initiale aléatoire, cible = forme aigle
    const particles = eagleShape.map(([tx, ty]) => ({
      x: (Math.random() - 0.5) * canvas.width,
      y: (Math.random() - 0.5) * canvas.height + cy,
      tx: cx + tx * R * 1.8,
      ty: cy + ty * R * 1.8,
      size: 1.2 + Math.random() * 2,
      alpha: 0,
      speed: 0.018 + Math.random() * 0.015,
      isHub: Math.random() < 0.15,
    }));

    // Particules de fond (résidu globe → pad)
    const bgParticles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random()-0.5)*0.4,
      vy: (Math.random()-0.5)*0.4,
      alpha: Math.random()*0.3,
      size: Math.random()*1.5+0.5,
    }));

    let startTime = Date.now();
    const ASSEMBLE_DURATION = 2800;
    let completed = false;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ASSEMBLE_DURATION, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      // Bg particules
      bgParticles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(80,200,200,${p.alpha * (1-progress*0.5)})`;
        ctx.fill();
      });

      // Assembler les particules vers la forme aigle
      particles.forEach((p, i) => {
        const delay = i / particles.length * 0.4;
        const localP = Math.max(0, Math.min((progress - delay) / (1 - delay), 1));
        const eLocal = 1 - Math.pow(1 - localP, 2.5);

        p.x = p.x + (p.tx - p.x) * p.speed * 3;
        p.y = p.y + (p.ty - p.y) * p.speed * 3;
        p.alpha = Math.min(p.alpha + 0.025, eLocal);

        if (p.isHub) {
          // Hub doré
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI*2);
          ctx.fillStyle = `rgba(201,168,76,${p.alpha * 0.9})`;
          ctx.shadowColor = '#C9A84C';
          ctx.shadowBlur = 16;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
          ctx.fillStyle = `rgba(80,200,200,${p.alpha * 0.85})`;
          ctx.shadowColor = 'rgba(80,200,200,0.8)';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Connexions entre points proches une fois assemblés
      if (progress > 0.5) {
        const connAlpha = (progress - 0.5) * 2;
        for (let i = 0; i < particles.length; i++) {
          if (particles[i].alpha < 0.3) continue;
          for (let j = i+1; j < particles.length; j++) {
            if (particles[j].alpha < 0.3) continue;
            const dist = Math.hypot(particles[i].x-particles[j].x, particles[i].y-particles[j].y);
            if (dist < 60) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(80,200,200,${connAlpha * 0.3 * (1-dist/60)})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Cercle de halo au centre quand assemblé
      if (progress > 0.7) {
        const haloAlpha = (progress - 0.7) * 3.33;
        const haloR = R * 1.3 * ease;
        const haloGrad = ctx.createRadialGradient(cx, cy, haloR*0.4, cx, cy, haloR);
        haloGrad.addColorStop(0, `rgba(201,168,76,0)`);
        haloGrad.addColorStop(0.7, `rgba(201,168,76,${haloAlpha * 0.06})`);
        haloGrad.addColorStop(1, 'rgba(201,168,76,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, haloR, 0, Math.PI*2);
        ctx.fillStyle = haloGrad;
        ctx.fill();
      }

      if (progress >= 1 && !completed) {
        completed = true;
        setTimeout(onComplete, 400);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [onComplete]);

  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}/>;
}

// ────────────────────────────────────────────────────────
// CODE BOX redessinée
// ────────────────────────────────────────────────────────
function CodeBox({ index, entered, status }: { index:number; entered:string; status:'idle'|'ok'|'err' }) {
  const isFilled = index < entered.length;
  const isActive = index === entered.length && status === 'idle';
  const borderColor = status==='err' ? 'rgba(192,57,43,0.85)' : status==='ok' ? 'rgba(180,160,80,0.80)' : isFilled ? 'rgba(201,168,76,0.55)' : isActive ? 'rgba(201,168,76,0.85)' : 'rgba(201,168,76,0.15)';
  const glowColor = status==='err' ? 'rgba(192,57,43,0.3)' : status==='ok' ? 'rgba(201,168,76,0.4)' : isActive ? 'rgba(201,168,76,0.25)' : 'transparent';
  return (
    <motion.div animate={status==='err' ? { x:[-8,8,-6,6,-3,3,0] } : {}} transition={{ duration:0.4 }}
      style={{ width:54, height:66, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, border:`1.5px solid ${borderColor}`, background:isActive?'rgba(201,168,76,0.06)':'rgba(201,168,76,0.02)', color:'#C9A84C', position:'relative', boxShadow:`0 0 18px ${glowColor}`, transition:'border-color .2s, box-shadow .3s' }}>
      <div style={{ position:'absolute', top:3, left:3, width:6, height:6, borderTop:`1px solid ${borderColor}`, borderLeft:`1px solid ${borderColor}`, opacity:0.7 }}/>
      <div style={{ position:'absolute', bottom:3, right:3, width:6, height:6, borderBottom:`1px solid ${borderColor}`, borderRight:`1px solid ${borderColor}`, opacity:0.7 }}/>
      {isFilled
        ? <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:400 }}
            style={{ width:10, height:10, borderRadius:'50%', background:'#C9A84C', boxShadow:'0 0 12px rgba(201,168,76,0.8)' }}/>
        : isActive
          ? <motion.div animate={{ opacity:[1,0,1] }} transition={{ duration:0.85, repeat:Infinity }}
              style={{ width:2.5, height:26, background:'#C9A84C', borderRadius:2, boxShadow:'0 0 8px rgba(201,168,76,0.8)' }}/>
          : null}
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────
// NUM KEY avec ripple
// ────────────────────────────────────────────────────────
function NumKey({ digit, onClick }: { digit:string; onClick:()=>void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <motion.button
      onPointerDown={() => { setPressed(true); onClick(); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      animate={pressed ? { scale:0.88 } : { scale:1 }}
      transition={{ type:'spring', stiffness:600, damping:25 }}
      style={{ fontFamily:'Share Tech Mono,monospace', fontSize:18, fontWeight:600, padding:'12px 0', borderRadius:4, width:'100%', background:pressed?'rgba(201,168,76,0.14)':'rgba(201,168,76,0.04)', border:`1px solid ${pressed?'rgba(201,168,76,0.45)':'rgba(201,168,76,0.14)'}`, color:pressed?'#E8C97A':'#A89878', cursor:'pointer', userSelect:'none', position:'relative', overflow:'hidden', boxShadow:pressed?'0 0 14px rgba(201,168,76,0.18)':'none', transition:'box-shadow .12s, color .12s' }}>
      {pressed && <motion.div initial={{ scale:0, opacity:0.6 }} animate={{ scale:3, opacity:0 }} transition={{ duration:0.4 }}
        style={{ position:'absolute', top:'50%', left:'50%', width:30, height:30, borderRadius:'50%', background:'rgba(201,168,76,0.3)', transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>}
      {digit}
    </motion.button>
  );
}

// ────────────────────────────────────────────────────────
// INTRO SCREEN PRINCIPAL
// ────────────────────────────────────────────────────────
export default function IntroScreen() {
  const { setMode } = useDossier();
  const [phase, setPhase] = useState<Phase>('eagle');
  const [eagleDone, setEagleDone] = useState(false);
  const [entered, setEntered] = useState('');
  const [status, setStatus] = useState<'idle'|'ok'|'err'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [gStat, setGStat] = useState("Analyse du protocole d'accès...");
  const [showVBox, setShowVBox] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const holoRef = useRef<HoloRef>(null);
  const audioInit = useRef(false);
  const busy = useRef(false);

  // Eagle → Pad (après que la constellation soit formée)
  const handleEagleDone = useCallback(() => {
    setEagleDone(true);
    setTimeout(() => setPhase('pad'), 900);
  }, []);

  // Fallback timer si l'animation dure trop longtemps
  useEffect(() => {
    const t = setTimeout(() => { if (phase === 'eagle') setPhase('pad'); }, 5000);
    return () => clearTimeout(t);
  }, [phase]);

  const initAudio = () => { if (!audioInit.current) { audio.init(); audioInit.current = true; } };

  const addDigit = (d: string) => {
    if (busy.current || entered.length >= 4) return;
    initAudio(); audio.key();
    const next = entered + d; setEntered(next);
    if (next.length === 4) { busy.current = true; setTimeout(() => checkCode(next), 380); }
  };

  const delDigit = () => { if (busy.current) return; initAudio(); audio.del(); setEntered(e => e.slice(0,-1)); setStatusMsg(''); };

  const checkCode = (code: string) => {
    const isAdmin = code === CONFIG.codes.admin;
    const isVisitor = code === CONFIG.codes.visiteur;
    if (isAdmin || isVisitor) {
      audio.ok(); setStatus('ok');
      setStatusMsg(isAdmin ? '✓ ACCÈS ADMINISTRATEUR — ÉDITION ACTIVÉE' : '✓ ACCÈS VISITEUR — LECTURE SEULE');
      setTimeout(() => startHolo(isAdmin ? 'admin' : 'visitor'), 1000);
    } else {
      audio.err(); setStatus('err'); setAttempts(a => a+1);
      setStatusMsg('✗ CODE INCORRECT — ACCÈS REFUSÉ');
      setTimeout(() => { setStatus('idle'); setStatusMsg(''); setEntered(''); busy.current = false; }, 1400);
    }
  };

  const startHolo = (accessMode: 'admin'|'visitor') => {
    setPhase('holo');
    const ticks = [0,155,295,420,530,625,705,772,828,872,908,934,952,963];
    ticks.forEach(d => setTimeout(() => audio.tick(), d+260));
    setTimeout(() => { holoRef.current?.lock(); audio.lock(); setGStat('Déclassification en cours...'); }, 1620);
    setTimeout(() => { audio.voice(); setShowVBox(true); }, 2700);
    setTimeout(() => { setShowStamp(true); audio.stamp(); }, 4200);
    setTimeout(() => { audio.reveal(); launchConfetti(); setPhase('done'); setMode(accessMode); }, 6500);
  };

  if (phase === 'done') return null;

  const mono: React.CSSProperties = { fontFamily:'"Share Tech Mono",monospace' };

  return (
    <motion.div exit={{ opacity:0, scale:1.04 }} transition={{ duration:0.9 }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'#020810', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>

      {/* ── Globe animé en fond — présent dans toutes les phases ── */}
      <GlobeCanvas
        opacity={phase === 'eagle' ? 0.4 : phase === 'pad' ? 0.85 : 0.2}
        scale={phase === 'eagle' ? 0.85 : 1}
      />

      {/* Grille terminale */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(201,168,76,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.018) 1px,transparent 1px)', backgroundSize:'40px 40px' }}/>

      {/* Scan line */}
      <motion.div animate={{ y:['-4px','100vh'] }} transition={{ duration:8, repeat:Infinity, ease:'linear', repeatDelay:3 }}
        style={{ position:'absolute', left:0, right:0, height:2, pointerEvents:'none', background:'linear-gradient(90deg,transparent,rgba(80,200,200,0.10),rgba(80,200,200,0.05),transparent)', zIndex:2 }}/>

      {/* Coins HUD */}
      {[
        {top:12,left:12,borderTop:'1.5px solid rgba(201,168,76,0.4)',borderLeft:'1.5px solid rgba(201,168,76,0.4)'},
        {top:12,right:12,borderTop:'1.5px solid rgba(201,168,76,0.4)',borderRight:'1.5px solid rgba(201,168,76,0.4)'},
        {bottom:12,left:12,borderBottom:'1.5px solid rgba(201,168,76,0.4)',borderLeft:'1.5px solid rgba(201,168,76,0.4)'},
        {bottom:12,right:12,borderBottom:'1.5px solid rgba(201,168,76,0.4)',borderRight:'1.5px solid rgba(201,168,76,0.4)'},
      ].map((s,i) => (
        <motion.div key={i} initial={{ opacity:0, scale:0.4 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3+i*0.1 }}
          style={{ position:'absolute', ...s, width:44, height:44, zIndex:25, pointerEvents:'none' }}/>
      ))}

      {/* Tentatives */}
      {phase==='pad' && attempts>0 && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ position:'absolute', top:18, right:24, zIndex:30, ...mono, fontSize:9, letterSpacing:3, color:'rgba(192,57,43,0.65)', textTransform:'uppercase' }}>
          TENTATIVES : {attempts}
        </motion.div>
      )}

      {/* ── EAGLE PHASE — constellation qui se forme ── */}
      {phase === 'eagle' && (
        <motion.div key="eagle" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ position:'relative', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:0, pointerEvents:'none' }}>
          {/* Constellation aigle */}
          <EagleConstellation onComplete={handleEagleDone} />

          {/* Textes en bas */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity: eagleDone ? 0 : 1 }} transition={{ delay:1.5, duration:0.8 }}
            style={{ position:'absolute', bottom: '22%', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <div style={{ ...mono, fontSize:10, letterSpacing:6, color:'rgba(201,168,76,0.35)', textTransform:'uppercase', whiteSpace:'nowrap' }}>
              Département des Finances — Los Santos
            </div>
            <motion.div animate={{ opacity:[0.2,0.7,0.2] }} transition={{ duration:1.4, repeat:Infinity }}
              style={{ ...mono, fontSize:8, letterSpacing:5, color:'rgba(80,200,200,0.25)', textTransform:'uppercase' }}>
              ◈ Initialisation du système sécurisé...
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* ── PAD PHASE ── */}
      {phase==='pad' && (
        <motion.div key="pad" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.55, ease:[0.22,1,0.36,1] }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', position:'relative', zIndex:10 }}>

          {/* Séparateur haut */}
          <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.1, duration:0.7, ease:[0.22,1,0.36,1] }}
            style={{ width:320, height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.55),transparent)', marginBottom:14 }}/>

          {/* Badge aigle compact */}
          <motion.div initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.2, type:'spring', stiffness:160 }}
            style={{ marginBottom:12, position:'relative' }}>
            <motion.div animate={{ opacity:[0.25,0.65,0.25], scale:[0.92,1.08,0.92] }} transition={{ duration:3.5, repeat:Infinity }}
              style={{ position:'absolute', inset:-18, borderRadius:'50%', background:'radial-gradient(circle,rgba(80,200,200,0.10) 0%,transparent 70%)', pointerEvents:'none' }}/>
            <div style={{ width:70, height:70, borderRadius:'50%', border:'2px solid rgba(201,168,76,0.65)', background:'radial-gradient(circle,#1A2438 60%,#020810)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, position:'relative', boxShadow:'0 0 28px rgba(201,168,76,0.12), 0 0 60px rgba(80,200,200,0.06)' }}>🦅</div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            style={{ fontFamily:'Cinzel,serif', fontSize:7.5, letterSpacing:6, color:'#7A5910', textTransform:'uppercase', marginBottom:3 }}>
            Département des Finances — Los Santos
          </motion.div>
          <motion.div initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.38 }}
            style={{ fontFamily:'Cinzel,serif', fontSize:19, fontWeight:700, color:'#C9A84C', textTransform:'uppercase', letterSpacing:3, marginBottom:4 }}>
            Dossier Confidentiel
          </motion.div>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.46 }}
            style={{ ...mono, fontSize:7.5, letterSpacing:3, color:'rgba(201,168,76,0.20)', textTransform:'uppercase', marginBottom:18 }}>
            Code Visiteur — Lecture &nbsp;/&nbsp; Code Admin — Édition
          </motion.div>

          {/* Divider */}
          <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.45, duration:0.7, ease:[0.22,1,0.36,1] }}
            style={{ width:180, height:1, background:'linear-gradient(90deg,transparent,#C9A84C,transparent)', marginBottom:18 }}/>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.55 }}
            style={{ ...mono, fontSize:8, letterSpacing:4, color:'rgba(201,168,76,0.42)', textTransform:'uppercase', marginBottom:12 }}>
            ◈ &nbsp; Entrez le code d'accès &nbsp; ◈
          </motion.div>

          {/* Code boxes */}
          <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.6, type:'spring' }}
            style={{ display:'flex', gap:10, marginBottom:16 }}>
            {[0,1,2,3].map(i => <CodeBox key={i} index={i} entered={entered} status={status}/>)}
          </motion.div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {statusMsg ? (
              <motion.div key="msg" initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.18 }}
                style={{ ...mono, fontSize:8, letterSpacing:2, textTransform:'uppercase', height:17, marginBottom:12, color:status==='ok'?'rgba(180,160,80,0.92)':'rgba(192,57,43,0.88)' }}>
                {statusMsg}
              </motion.div>
            ) : <div style={{ height:17, marginBottom:12 }}/>}
          </AnimatePresence>

          {/* Numpad */}
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.65 }}
            style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, width:182, marginBottom:12, position:'relative', zIndex:10 }}>
            {['1','2','3','4','5','6','7','8','9'].map(d => <NumKey key={d} digit={d} onClick={() => addDigit(d)}/>)}
            <div/>
            <NumKey digit="0" onClick={() => addDigit('0')}/>
            <motion.button whileHover={{ background:'rgba(192,57,43,0.10)' } as any} whileTap={{ scale:0.88 }} onClick={delDigit}
              style={{ ...mono, fontSize:16, padding:'12px 0', borderRadius:4, background:'rgba(192,57,43,0.04)', border:'1px solid rgba(192,57,43,0.16)', color:'rgba(192,57,43,0.58)', cursor:'pointer', userSelect:'none' }}>⌫</motion.button>
          </motion.div>

          {/* Bas */}
          <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.72, duration:0.6, ease:[0.22,1,0.36,1] }}
            style={{ width:260, height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.18),transparent)', marginBottom:8 }}/>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.80 }}
            style={{ ...mono, fontSize:7, letterSpacing:4, color:'rgba(201,168,76,0.12)', textTransform:'uppercase' }}>
            SYSTÈME SÉCURISÉ ◈ NIVEAU ALPHA CONFIDENTIEL
          </motion.div>
        </motion.div>
      )}

      {/* ── HOLO PHASE ── */}
      {phase==='holo' && (
        <motion.div key="holo" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.4 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, position:'relative', zIndex:10 }}>
          <HoloCanvas ref={holoRef}/>
          <div style={{ ...mono, fontSize:9, letterSpacing:3, color:'rgba(201,168,76,0.3)', textTransform:'uppercase' }}>{gStat}</div>
          {showVBox && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center' }}>
              <div style={{ ...mono, fontSize:9, letterSpacing:4, color:'rgba(201,168,76,0.36)', textTransform:'uppercase', marginBottom:5 }}>Identification confirmée — Dossier</div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:18, color:'#C9A84C', letterSpacing:5, textTransform:'uppercase' }}>{CONFIG.candidat.nomComplet}</div>
              <div style={{ width:180, height:1, background:'linear-gradient(90deg,transparent,#C9A84C,transparent)', margin:'8px auto 0' }}/>
            </motion.div>
          )}
          {showStamp && (
            <motion.div className="stamp-slam" style={{ border:'5px solid rgba(192,57,43,0.86)', padding:'14px 34px', transform:'rotate(-8deg)', position:'relative' }}>
              <div style={{ position:'absolute', inset:4, border:'2px solid rgba(192,57,43,0.26)' }}/>
              <div style={{ fontFamily:'Cinzel,serif', fontWeight:700, fontSize:32, letterSpacing:8, textTransform:'uppercase', color:'rgba(192,57,43,0.9)' }}>Déclassifié</div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
