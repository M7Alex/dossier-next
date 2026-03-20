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
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    const sz = 4 + Math.random() * 6;
    el.style.cssText = `position:fixed;left:${30+Math.random()*40}%;top:-10px;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:2px;pointer-events:none;z-index:99999;transform:rotate(${Math.random()*360}deg);animation:confettiFall ${1.5+Math.random()*2}s ${Math.random()*0.8}s ease-in forwards;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

// Eagle SVG component
function AnimatedEagle() {
  return (
    <motion.div style={{ position:'relative', width:140, height:140, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* Rotating rings */}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease:'linear' }}
        style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(201,168,76,0.2)' }}/>
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease:'linear' }}
        style={{ position:'absolute', inset:10, borderRadius:'50%', border:'1px solid rgba(201,168,76,0.1)' }}/>
      {/* Glow */}
      <motion.div animate={{ boxShadow:['0 0 20px rgba(201,168,76,0.08)','0 0 45px rgba(201,168,76,0.22)','0 0 20px rgba(201,168,76,0.08)'] }}
        transition={{ duration:2.5, repeat:Infinity }}
        style={{ position:'absolute', inset:0, borderRadius:'50%' }}/>
      {/* Badge circle */}
      <motion.div initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
        transition={{ delay:0.2, duration:0.7, type:'spring', stiffness:200 }}
        style={{ width:110, height:110, borderRadius:'50%', border:'2px solid #C9A84C', background:'radial-gradient(circle,#1C2535 60%,#050810)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
        {/* Eagle SVG */}
        <motion.svg viewBox="0 0 80 80" width="66" height="66"
          animate={{ y:[-2,2,-2] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}>
          {/* Wings left */}
          <motion.path d="M40 36 C26 27 10 25 4 31" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.3, duration:0.7 }}/>
          {/* Wings right */}
          <motion.path d="M40 36 C54 27 70 25 76 31" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.5, duration:0.7 }}/>
          {/* Wing detail left */}
          <motion.path d="M26 37 C18 34 10 34 6 36" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.8, duration:0.5 }}/>
          {/* Wing detail right */}
          <motion.path d="M54 37 C62 34 70 34 74 36" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.9, duration:0.5 }}/>
          {/* Body */}
          <motion.ellipse cx="40" cy="46" rx="9" ry="12" fill="rgba(201,168,76,0.12)" stroke="#C9A84C" strokeWidth="1.5"
            initial={{ scaleY:0, opacity:0 }} animate={{ scaleY:1, opacity:1 }} transition={{ delay:0.6, duration:0.5 }}/>
          {/* Head */}
          <motion.circle cx="40" cy="29" r="8" fill="rgba(201,168,76,0.18)" stroke="#C9A84C" strokeWidth="1.5"
            initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.7, duration:0.4, type:'spring' }}/>
          {/* Beak */}
          <motion.path d="M44 28 L50 31 L44 32 Z" fill="#C9A84C"
            initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.9, duration:0.3 }}/>
          {/* Eye */}
          <motion.circle cx="43" cy="27" r="1.5" fill="#C9A84C"
            animate={{ opacity:[1,0.3,1] }} transition={{ duration:3.5, repeat:Infinity, delay:2 }}/>
          {/* Tail */}
          <motion.path d="M37 57 L35 64 M40 58 L40 65 M43 57 L45 64"
            fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }} transition={{ delay:0.8, duration:0.5 }}/>
          {/* Orbit dots */}
          {[0,1,2,3].map(i => {
            const a = (i/4)*Math.PI*2, r = 35;
            return <motion.circle key={i} cx={40+Math.cos(a)*r} cy={40+Math.sin(a)*r} r={1.2}
              fill="#C9A84C" animate={{ opacity:[0.2,0.7,0.2], r:[0.8,1.6,0.8] }}
              transition={{ duration:2, repeat:Infinity, delay:i*0.4 }}/>;
          })}
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}

export default function IntroScreen() {
  const { setMode } = useDossier();
  const [phase, setPhase] = useState<Phase>('eagle');
  const [entered, setEntered] = useState('');
  const [status, setStatus] = useState<'idle'|'ok'|'err'>('idle');
  const [statusMsg, setStatusMsg] = useState('_ _ _ _');
  const [gStat, setGStat] = useState("Analyse du protocole d'accès...");
  const [showVBox, setShowVBox] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const holoRef = useRef<HoloRef>(null);
  const audioInit = useRef(false);
  const busy = useRef(false);

  // Eagle → Pad transition
  useEffect(() => {
    const t = setTimeout(() => setPhase('pad'), 3200);
    return () => clearTimeout(t);
  }, []);

  const initAudio = () => {
    if (!audioInit.current) { audio.init(); audioInit.current = true; }
  };

  const addDigit = (d: string) => {
    if (busy.current || entered.length >= 4) return;
    initAudio(); audio.key();
    const next = entered + d;
    setEntered(next);
    if (next.length === 4) {
      busy.current = true;
      setTimeout(() => checkCode(next), 380);
    }
  };

  const delDigit = () => {
    if (busy.current) return;
    initAudio(); audio.del();
    setEntered(e => e.slice(0, -1));
  };

  const checkCode = (code: string) => {
    const isAdmin   = code === CONFIG.codes.admin;
    const isVisitor = code === CONFIG.codes.visiteur;
    if (isAdmin || isVisitor) {
      audio.ok();
      setStatus('ok');
      setStatusMsg(isAdmin ? '✓ Accès ADMIN — Édition activée' : '✓ Accès Visiteur — Lecture seule');
      setTimeout(() => startHolo(isAdmin ? 'admin' : 'visitor'), 920);
    } else {
      audio.err();
      setStatus('err');
      setStatusMsg('✗ Code incorrect — Accès refusé');
      setTimeout(() => {
        setStatus('idle'); setStatusMsg('_ _ _ _'); setEntered('');
        busy.current = false;
      }, 1300);
    }
  };

  const startHolo = (accessMode: 'admin' | 'visitor') => {
    setPhase('holo');
    const ticks = [0,155,295,420,530,625,705,772,828,872,908,934,952,963];
    ticks.forEach(d => setTimeout(() => audio.tick(), d + 260));
    setTimeout(() => { holoRef.current?.lock(); audio.lock(); setGStat('Déclassification en cours...'); }, 1620);
    setTimeout(() => { audio.voice(); setShowVBox(true); }, 2700);
    setTimeout(() => { setShowStamp(true); audio.stamp(); }, 4200);
    setTimeout(() => { audio.reveal(); launchConfetti(); setPhase('done'); setMode(accessMode); }, 6500);
  };

  if (phase === 'done') return null;

  const mono: React.CSSProperties = { fontFamily: '"Share Tech Mono",monospace' };

  // Code box color
  const boxColor = (i: number) => {
    if (status === 'err') return 'rgba(192,57,43,0.62)';
    if (status === 'ok')  return 'rgba(180,160,80,0.65)';
    if (i < entered.length) return 'rgba(201,168,76,0.3)';
    if (i === entered.length) return 'rgba(201,168,76,0.52)';
    return 'rgba(201,168,76,0.17)';
  };

  return (
    // Single motion.div — no nested AnimatePresence conflicts
    <motion.div exit={{ opacity:0, scale:1.04 }} transition={{ duration:0.9 }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'#050810', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>

      {/* Bg grid */}
      <div style={{ position:'absolute', inset:0, opacity:.03, backgroundImage:'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)', backgroundSize:'50px 50px', pointerEvents:'none' }}/>
      {/* Scan */}
      <div style={{ position:'absolute', left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.1),transparent)', animation:'scanMove 5s linear infinite', pointerEvents:'none' }}/>
      {/* Corners */}
      {[['top-4 left-4'],['top-4 right-4'],['bottom-4 left-4'],['bottom-4 right-4']].map(([cls],i)=>(
        <div key={i} className={`absolute ${cls} w-9 h-9`} style={{ border:'1px solid rgba(201,168,76,0.22)', pointerEvents:'none' }}/>
      ))}

      {/* ── EAGLE PHASE ── */}
      {phase === 'eagle' && (
        <motion.div key="eagle" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          // pointer-events:none so it never blocks anything underneath
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, pointerEvents:'none' }}>
          <AnimatedEagle/>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
            style={{ ...mono, fontSize:10, letterSpacing:6, color:'rgba(201,168,76,0.3)', textTransform:'uppercase' }}>
            Département des Finances — Los Santos
          </motion.div>
          <motion.div animate={{ opacity:[0.2,0.7,0.2] }} transition={{ duration:1.2, repeat:Infinity }}
            style={{ ...mono, fontSize:9, letterSpacing:4, color:'rgba(201,168,76,0.2)', textTransform:'uppercase' }}>
            Initialisation du système...
          </motion.div>
        </motion.div>
      )}

      {/* ── PAD PHASE ── */}
      {phase === 'pad' && (
        <motion.div key="pad" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>

          <div style={{ ...mono, fontSize:10, letterSpacing:4, color:'rgba(201,168,76,0.28)', textTransform:'uppercase', marginBottom:5 }}>
            Système sécurisé — Niveau Alpha Confidentiel
          </div>
          <div style={{ ...mono, fontSize:10, letterSpacing:6, color:'rgba(192,57,43,0.4)', textTransform:'uppercase', marginBottom:22 }}>
            ⬛ Accès Restreint ⬛
          </div>

          {/* Badge */}
          <div style={{ width:72, height:72, borderRadius:'50%', border:'2px solid rgba(201,168,76,0.5)', background:'radial-gradient(circle,#1C2535 60%,#050810)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, marginBottom:14, boxShadow:'0 0 28px rgba(201,168,76,0.1)' }}>🦅</div>

          <div style={{ fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:5, color:'#8B6914', textTransform:'uppercase', marginBottom:4 }}>
            Département des Finances — Los Santos
          </div>
          <div style={{ fontFamily:'Cinzel,serif', fontSize:22, fontWeight:700, color:'#C9A84C', textTransform:'uppercase', letterSpacing:3, marginBottom:3 }}>
            Dossier Confidentiel
          </div>
          <div style={{ ...mono, fontSize:9, letterSpacing:3, color:'rgba(201,168,76,0.24)', textTransform:'uppercase', marginBottom:22 }}>
            Code Visiteur — Lecture &nbsp;/&nbsp; Code Admin — Édition
          </div>
          <div style={{ width:136, height:1, background:'linear-gradient(90deg,transparent,#C9A84C,transparent)', marginBottom:18 }}/>
          <div style={{ ...mono, fontSize:9, letterSpacing:3, color:'rgba(201,168,76,0.35)', textTransform:'uppercase', marginBottom:9 }}>
            Entrez le code d'accès
          </div>

          {/* Code boxes */}
          <div style={{ display:'flex', gap:10, marginBottom:12 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width:46, height:56, display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Share Tech Mono,monospace', fontSize:24, borderRadius:2, transition:'border-color .2s, background .2s',
                border:`1px solid ${boxColor(i)}`,
                background: i === entered.length ? 'rgba(201,168,76,0.07)' : 'rgba(201,168,76,0.02)',
                color:'#C9A84C',
                animation: status === 'err' ? 'shake 0.4s ease' : undefined,
              }}>
                {i < entered.length
                  ? '•'
                  : i === entered.length
                    ? <div style={{ width:2, height:22, background:'#C9A84C', animation:'blink 0.85s infinite' }}/>
                    : null}
              </div>
            ))}
          </div>

          {/* Numpad — z-index explicite pour éviter tout blocage */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, width:162, marginBottom:12, position:'relative', zIndex:10 }}>
            {['1','2','3','4','5','6','7','8','9'].map(d => (
              <button key={d} onClick={() => addDigit(d)} style={{ ...mono, fontSize:15, padding:'10px', borderRadius:2,
                background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.12)', color:'#A89878',
                cursor:'pointer', transition:'background .12s', userSelect:'none' }}>
                {d}
              </button>
            ))}
            <div/>
            <button onClick={() => addDigit('0')} style={{ ...mono, fontSize:15, padding:'10px', borderRadius:2,
              background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.12)', color:'#A89878', cursor:'pointer' }}>
              0
            </button>
            <button onClick={delDigit} style={{ ...mono, fontSize:15, padding:'10px', borderRadius:2,
              background:'rgba(192,57,43,0.04)', border:'1px solid rgba(192,57,43,0.14)', color:'rgba(192,57,43,0.5)', cursor:'pointer' }}>
              ⌫
            </button>
          </div>

          {/* Status */}
          <div style={{ ...mono, fontSize:10, letterSpacing:2, textTransform:'uppercase', height:18, transition:'color .3s',
            color: status==='ok' ? 'rgba(180,160,80,0.82)' : status==='err' ? 'rgba(192,57,43,0.78)' : 'rgba(201,168,76,0.25)' }}>
            {statusMsg}
          </div>
        </motion.div>
      )}

      {/* ── HOLO PHASE ── */}
      {phase === 'holo' && (
        <motion.div key="holo" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.4 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <HoloCanvas ref={holoRef}/>
          <div style={{ ...mono, fontSize:9, letterSpacing:3, color:'rgba(201,168,76,0.3)', textTransform:'uppercase' }}>
            {gStat}
          </div>
          {showVBox && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center' }}>
              <div style={{ ...mono, fontSize:9, letterSpacing:4, color:'rgba(201,168,76,0.36)', textTransform:'uppercase', marginBottom:5 }}>
                Identification confirmée — Dossier
              </div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:18, color:'#C9A84C', letterSpacing:5, textTransform:'uppercase' }}>
                {CONFIG.candidat.nomComplet}
              </div>
              <div style={{ width:180, height:1, background:'linear-gradient(90deg,transparent,#C9A84C,transparent)', margin:'8px auto 0' }}/>
            </motion.div>
          )}
          {showStamp && (
            <motion.div className="stamp-slam"
              style={{ border:'5px solid rgba(192,57,43,0.86)', padding:'14px 34px', transform:'rotate(-8deg)', position:'relative' }}>
              <div style={{ position:'absolute', inset:4, border:'2px solid rgba(192,57,43,0.26)' }}/>
              <div style={{ fontFamily:'Cinzel,serif', fontWeight:700, fontSize:32, letterSpacing:8, textTransform:'uppercase', color:'rgba(192,57,43,0.9)' }}>
                Déclassifié
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
