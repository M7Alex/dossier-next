'use client';
import { useState, useRef, useEffect } from 'react';
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

function AnimatedEagle() {
  return (
    <motion.div style={{ position:'relative', width:160, height:160, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease:'linear' }}
        style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(201,168,76,0.18)' }}/>
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 6, repeat: Infinity, ease:'linear' }}
        style={{ position:'absolute', inset:12, borderRadius:'50%', border:'1px solid rgba(201,168,76,0.10)' }}/>
      <motion.div animate={{ boxShadow:['0 0 20px rgba(201,168,76,0.06)','0 0 55px rgba(201,168,76,0.24)','0 0 20px rgba(201,168,76,0.06)'] }}
        transition={{ duration:2.8, repeat:Infinity }}
        style={{ position:'absolute', inset:0, borderRadius:'50%' }}/>
      <motion.div initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
        transition={{ delay:0.2, duration:0.7, type:'spring', stiffness:200 }}
        style={{ width:120, height:120, borderRadius:'50%', border:'2px solid #C9A84C', background:'radial-gradient(circle,#1C2535 60%,#050810)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
        <motion.svg viewBox="0 0 80 80" width="72" height="72"
          animate={{ y:[-2,2,-2] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}>
          <motion.path d="M40 36 C26 27 10 25 4 31" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.3, duration:0.7 }}/>
          <motion.path d="M40 36 C54 27 70 25 76 31" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.5, duration:0.7 }}/>
          <motion.path d="M26 37 C18 34 10 34 6 36" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.8, duration:0.5 }}/>
          <motion.path d="M54 37 C62 34 70 34 74 36" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.9, duration:0.5 }}/>
          <motion.ellipse cx="40" cy="46" rx="9" ry="12" fill="rgba(201,168,76,0.12)" stroke="#C9A84C" strokeWidth="1.5"
            initial={{ scaleY:0, opacity:0 }} animate={{ scaleY:1, opacity:1 }} transition={{ delay:0.6, duration:0.5 }}/>
          <motion.circle cx="40" cy="29" r="8" fill="rgba(201,168,76,0.18)" stroke="#C9A84C" strokeWidth="1.5"
            initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.7, duration:0.4, type:'spring' }}/>
          <motion.path d="M44 28 L50 31 L44 32 Z" fill="#C9A84C" initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.9, duration:0.3 }}/>
          <motion.circle cx="43" cy="27" r="1.5" fill="#C9A84C" animate={{ opacity:[1,0.3,1] }} transition={{ duration:3.5, repeat:Infinity, delay:2 }}/>
          <motion.path d="M37 57 L35 64 M40 58 L40 65 M43 57 L45 64" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.8, duration:0.5 }}/>
          {[0,1,2,3].map(i => { const a=(i/4)*Math.PI*2,r=35; return <motion.circle key={i} cx={40+Math.cos(a)*r} cy={40+Math.sin(a)*r} r={1.2} fill="#C9A84C" animate={{ opacity:[0.2,0.7,0.2], r:[0.8,1.6,0.8] }} transition={{ duration:2, repeat:Infinity, delay:i*0.4 }}/>; })}
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}

function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random()*100, y: Math.random()*100,
    size: 1 + Math.random()*2.2, duration: 9 + Math.random()*14,
    delay: Math.random()*7, opacity: 0.08 + Math.random()*0.22,
  }));
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {particles.map(p => (
        <motion.div key={p.id}
          style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, borderRadius:'50%', background:'#C9A84C', boxShadow:`0 0 ${p.size*3}px rgba(201,168,76,0.6)` }}
          animate={{ y: [0, -80, 0], opacity: [0, p.opacity, 0], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration:p.duration, delay:p.delay, repeat:Infinity, ease:'easeInOut' }}
        />
      ))}
    </div>
  );
}

function CodeBox({ index, entered, status }: { index:number; entered:string; status:'idle'|'ok'|'err' }) {
  const isFilled = index < entered.length;
  const isActive = index === entered.length && status === 'idle';
  const borderColor = status==='err' ? 'rgba(192,57,43,0.85)' : status==='ok' ? 'rgba(180,160,80,0.80)' : isFilled ? 'rgba(201,168,76,0.55)' : isActive ? 'rgba(201,168,76,0.85)' : 'rgba(201,168,76,0.15)';
  const glowColor = status==='err' ? 'rgba(192,57,43,0.3)' : status==='ok' ? 'rgba(201,168,76,0.4)' : isActive ? 'rgba(201,168,76,0.25)' : 'transparent';
  return (
    <motion.div animate={status==='err' ? { x:[-8,8,-6,6,-3,3,0] } : {}} transition={{ duration:0.4 }}
      style={{ width:56, height:68, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, border:`1.5px solid ${borderColor}`, background: status==='err' ? 'rgba(192,57,43,0.06)' : isActive ? 'rgba(201,168,76,0.07)' : 'rgba(201,168,76,0.02)', color:'#C9A84C', position:'relative', boxShadow:`0 0 18px ${glowColor}, inset 0 0 10px ${glowColor}`, transition:'border-color .2s, background .2s, box-shadow .3s' }}>
      <div style={{ position:'absolute', top:3, left:3, width:6, height:6, borderTop:`1px solid ${borderColor}`, borderLeft:`1px solid ${borderColor}`, opacity:0.7 }}/>
      <div style={{ position:'absolute', bottom:3, right:3, width:6, height:6, borderBottom:`1px solid ${borderColor}`, borderRight:`1px solid ${borderColor}`, opacity:0.7 }}/>
      {isFilled
        ? <motion.div initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', stiffness:400, damping:20 }}
            style={{ width:10, height:10, borderRadius:'50%', background:'#C9A84C', boxShadow:'0 0 12px rgba(201,168,76,0.8)' }}/>
        : isActive
          ? <motion.div animate={{ opacity:[1,0,1] }} transition={{ duration:0.85, repeat:Infinity }}
              style={{ width:2.5, height:28, background:'#C9A84C', borderRadius:2, boxShadow:'0 0 8px rgba(201,168,76,0.8)' }}/>
          : null}
    </motion.div>
  );
}

function NumKey({ digit, onClick }: { digit:string; onClick:()=>void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <motion.button
      onPointerDown={() => { setPressed(true); onClick(); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      animate={pressed ? { scale:0.88 } : { scale:1 }}
      transition={{ type:'spring', stiffness:600, damping:25 }}
      whileHover={{ background:'rgba(201,168,76,0.10)', borderColor:'rgba(201,168,76,0.35)' } as any}
      style={{ fontFamily:'Share Tech Mono,monospace', fontSize:18, fontWeight:600, padding:'12px 0', borderRadius:4, width:'100%', background:pressed?'rgba(201,168,76,0.14)':'rgba(201,168,76,0.04)', border:`1px solid ${pressed?'rgba(201,168,76,0.45)':'rgba(201,168,76,0.14)'}`, color:pressed?'#E8C97A':'#A89878', cursor:'pointer', userSelect:'none', position:'relative', overflow:'hidden', boxShadow:pressed?'0 0 14px rgba(201,168,76,0.18)':'none', transition:'box-shadow .12s, color .12s' }}>
      {pressed && <motion.div initial={{ scale:0, opacity:0.6 }} animate={{ scale:3, opacity:0 }} transition={{ duration:0.4 }}
        style={{ position:'absolute', top:'50%', left:'50%', width:30, height:30, borderRadius:'50%', background:'rgba(201,168,76,0.3)', transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>}
      {digit}
    </motion.button>
  );
}

export default function IntroScreen() {
  const { setMode } = useDossier();
  const [phase, setPhase] = useState<Phase>('eagle');
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

  useEffect(() => { const t = setTimeout(() => setPhase('pad'), 3200); return () => clearTimeout(t); }, []);

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
      style={{ position:'fixed', inset:0, zIndex:9999, background:'#050810', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>

      <FloatingParticles/>

      {/* Grille */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(201,168,76,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.022) 1px,transparent 1px)', backgroundSize:'40px 40px' }}/>

      {/* Scan */}
      <motion.div animate={{ y:['-4px','100vh'] }} transition={{ duration:7, repeat:Infinity, ease:'linear', repeatDelay:2 }}
        style={{ position:'absolute', left:0, right:0, height:2, pointerEvents:'none', background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.12),rgba(201,168,76,0.06),transparent)' }}/>

      {/* Coins */}
      {[{top:12,left:12,borderTop:'1.5px solid rgba(201,168,76,0.35)',borderLeft:'1.5px solid rgba(201,168,76,0.35)'},{top:12,right:12,borderTop:'1.5px solid rgba(201,168,76,0.35)',borderRight:'1.5px solid rgba(201,168,76,0.35)'},{bottom:12,left:12,borderBottom:'1.5px solid rgba(201,168,76,0.35)',borderLeft:'1.5px solid rgba(201,168,76,0.35)'},{bottom:12,right:12,borderBottom:'1.5px solid rgba(201,168,76,0.35)',borderRight:'1.5px solid rgba(201,168,76,0.35)'}].map((s,i) => (
        <motion.div key={i} initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3+i*0.1, duration:0.5 }}
          style={{ position:'absolute', ...s, width:44, height:44, zIndex:25, pointerEvents:'none' }}/>
      ))}

      {/* Tentatives */}
      {phase==='pad' && attempts>0 && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          style={{ position:'absolute', top:18, right:24, ...mono, fontSize:9, letterSpacing:3, color:'rgba(192,57,43,0.6)', textTransform:'uppercase' }}>
          TENTATIVES : {attempts}
        </motion.div>
      )}

      {/* ── EAGLE ── */}
      {phase==='eagle' && (
        <motion.div key="eagle" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24, pointerEvents:'none' }}>
          <AnimatedEagle/>
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}
            style={{ ...mono, fontSize:10, letterSpacing:6, color:'rgba(201,168,76,0.3)', textTransform:'uppercase' }}>
            Département des Finances — Los Santos
          </motion.div>
          <motion.div animate={{ opacity:[0.2,0.7,0.2] }} transition={{ duration:1.3, repeat:Infinity }}
            style={{ ...mono, fontSize:9, letterSpacing:4, color:'rgba(201,168,76,0.2)', textTransform:'uppercase' }}>
            ◈ Initialisation du système...
          </motion.div>
        </motion.div>
      )}

      {/* ── PAD ── */}
      {phase==='pad' && (
        <motion.div key="pad" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', position:'relative', zIndex:10 }}>

          <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.1, duration:0.6, ease:[0.22,1,0.36,1] }}
            style={{ width:340, height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent)', marginBottom:16 }}/>

          {/* Badge */}
          <motion.div initial={{ scale:0.6, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.2, type:'spring', stiffness:180 }}
            style={{ marginBottom:14, position:'relative' }}>
            <motion.div animate={{ opacity:[0.3,0.7,0.3], scale:[0.95,1.05,0.95] }} transition={{ duration:3, repeat:Infinity }}
              style={{ position:'absolute', inset:-16, borderRadius:'50%', background:'radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)', pointerEvents:'none' }}/>
            <div style={{ width:76, height:76, borderRadius:'50%', border:'2px solid rgba(201,168,76,0.6)', background:'radial-gradient(circle,#1C2535 60%,#050810)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, position:'relative', boxShadow:'0 0 30px rgba(201,168,76,0.15)' }}>🦅</div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:6, color:'#8B6914', textTransform:'uppercase', marginBottom:4 }}>
            Département des Finances — Los Santos
          </motion.div>
          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
            style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:700, color:'#C9A84C', textTransform:'uppercase', letterSpacing:3, marginBottom:4 }}>
            Dossier Confidentiel
          </motion.div>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            style={{ ...mono, fontSize:8, letterSpacing:3, color:'rgba(201,168,76,0.22)', textTransform:'uppercase', marginBottom:20 }}>
            Code Visiteur — Lecture &nbsp;/&nbsp; Code Admin — Édition
          </motion.div>

          <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.4, duration:0.7, ease:[0.22,1,0.36,1] }}
            style={{ width:200, height:1, background:'linear-gradient(90deg,transparent,#C9A84C,transparent)', marginBottom:20 }}/>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.55 }}
            style={{ ...mono, fontSize:8, letterSpacing:4, color:'rgba(201,168,76,0.40)', textTransform:'uppercase', marginBottom:14 }}>
            ◈ &nbsp; Entrez le code d'accès &nbsp; ◈
          </motion.div>

          {/* Code boxes */}
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.6, type:'spring' }}
            style={{ display:'flex', gap:10, marginBottom:18 }}>
            {[0,1,2,3].map(i => <CodeBox key={i} index={i} entered={entered} status={status}/>)}
          </motion.div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {statusMsg ? (
              <motion.div key="msg" initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:4 }} transition={{ duration:0.2 }}
                style={{ ...mono, fontSize:8, letterSpacing:2, textTransform:'uppercase', height:18, marginBottom:14, color:status==='ok'?'rgba(180,160,80,0.90)':'rgba(192,57,43,0.85)' }}>
                {statusMsg}
              </motion.div>
            ) : (
              <div key="empty" style={{ height:18, marginBottom:14 }}/>
            )}
          </AnimatePresence>

          {/* Numpad */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.65 }}
            style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, width:186, marginBottom:14, position:'relative', zIndex:10 }}>
            {['1','2','3','4','5','6','7','8','9'].map(d => <NumKey key={d} digit={d} onClick={() => addDigit(d)}/>)}
            <div/>
            <NumKey digit="0" onClick={() => addDigit('0')}/>
            <motion.button whileHover={{ background:'rgba(192,57,43,0.10)' } as any} whileTap={{ scale:0.88 }} onClick={delDigit}
              style={{ ...mono, fontSize:16, padding:'12px 0', borderRadius:4, background:'rgba(192,57,43,0.04)', border:'1px solid rgba(192,57,43,0.16)', color:'rgba(192,57,43,0.55)', cursor:'pointer', userSelect:'none' }}>⌫</motion.button>
          </motion.div>

          <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.7, duration:0.6, ease:[0.22,1,0.36,1] }}
            style={{ width:280, height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.2),transparent)', marginBottom:10 }}/>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
            style={{ ...mono, fontSize:7, letterSpacing:4, color:'rgba(201,168,76,0.14)', textTransform:'uppercase' }}>
            SYSTÈME SÉCURISÉ ◈ NIVEAU ALPHA CONFIDENTIEL
          </motion.div>
        </motion.div>
      )}

      {/* ── HOLO ── */}
      {phase==='holo' && (
        <motion.div key="holo" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.4 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
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
