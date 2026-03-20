'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import { audio } from '@/lib/audio';
import HoloCanvas from './HoloCanvas';
import type { HoloRef } from './HoloCanvas';

type Phase = 'eagle' | 'pad' | 'holo' | 'done';

// Confetti
function launchConfetti() {
  const colors=['#C9A84C','#E8C97A','#8B6914','rgba(80,200,200,0.9)'];
  for(let i=0;i<60;i++){
    const el=document.createElement('div');
    const sz=4+Math.random()*6;
    el.style.cssText=`position:fixed;left:${30+Math.random()*40}%;top:-10px;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:2px;pointer-events:none;z-index:99999;transform:rotate(${Math.random()*360}deg);animation:confettiFall ${1.5+Math.random()*2}s ${Math.random()*0.8}s ease-in forwards;`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),4000);
  }
}

// Animated eagle SVG
function EagleLogo({ phase }: { phase: 'idle' | 'flying' | 'landing' }) {
  return (
    <motion.div style={{ position:'relative', width:160, height:160, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* Outer ring */}
      <motion.div
        initial={{ rotate:0, scale:0 }}
        animate={{ rotate:360, scale:1 }}
        transition={{ duration:2, ease:'easeOut', rotate:{ duration:8, repeat:Infinity, ease:'linear' } }}
        style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(201,168,76,0.2)' }}
      />
      {/* Inner ring */}
      <motion.div
        initial={{ rotate:0, scale:0 }}
        animate={{ rotate:-360, scale:1 }}
        transition={{ delay:0.3, duration:1.8, ease:'easeOut', rotate:{ duration:5, repeat:Infinity, ease:'linear', delay:0 } }}
        style={{ position:'absolute', inset:8, borderRadius:'50%', border:'1px solid rgba(201,168,76,0.12)' }}
      />
      {/* Glow pulse */}
      <motion.div
        animate={{ boxShadow:['0 0 20px rgba(201,168,76,0.1)', '0 0 50px rgba(201,168,76,0.28)', '0 0 20px rgba(201,168,76,0.1)'] }}
        transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
        style={{ position:'absolute', inset:0, borderRadius:'50%' }}
      />
      {/* Eagle circle */}
      <motion.div
        initial={{ scale:0, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        transition={{ delay:0.2, duration:0.8, type:'spring', stiffness:200 }}
        style={{ width:120, height:120, borderRadius:'50%', border:'2px solid #C9A84C', background:'radial-gradient(circle,#1C2535 60%,#050810)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
        {/* Eagle SVG animated */}
        <motion.svg viewBox="0 0 80 80" width="72" height="72"
          animate={phase === 'flying' ? { y:[-3,3,-3] } : { y:0 }}
          transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}>
          {/* Wings */}
          <motion.path
            d="M40 38 C25 28 8 26 4 32 C8 30 20 34 28 40"
            fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }}
            animate={{ pathLength:1, opacity:1 }}
            transition={{ delay:0.4, duration:0.8 }}
          />
          <motion.path
            d="M40 38 C55 28 72 26 76 32 C72 30 60 34 52 40"
            fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }}
            animate={{ pathLength:1, opacity:1 }}
            transition={{ delay:0.6, duration:0.8 }}
          />
          {/* Body */}
          <motion.ellipse cx="40" cy="44" rx="10" ry="13"
            fill="rgba(201,168,76,0.15)" stroke="#C9A84C" strokeWidth="1.5"
            initial={{ scaleY:0, opacity:0 }}
            animate={{ scaleY:1, opacity:1 }}
            transition={{ delay:0.8, duration:0.5 }}
          />
          {/* Head */}
          <motion.circle cx="40" cy="28" r="8"
            fill="rgba(201,168,76,0.2)" stroke="#C9A84C" strokeWidth="1.5"
            initial={{ scale:0, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            transition={{ delay:1.0, duration:0.4, type:'spring' }}
          />
          {/* Beak */}
          <motion.path d="M44 27 L50 30 L44 31 Z"
            fill="#C9A84C" opacity="0.9"
            initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ delay:1.2, duration:0.3 }}
          />
          {/* Eye */}
          <motion.circle cx="43" cy="26" r="1.5" fill="#C9A84C"
            animate={{ opacity:[1,0.4,1] }}
            transition={{ duration:3, repeat:Infinity, delay:2 }}
          />
          {/* Tail */}
          <motion.path d="M36 56 L34 64 M40 57 L40 65 M44 56 L46 64"
            fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"
            initial={{ pathLength:0 }} animate={{ pathLength:1 }}
            transition={{ delay:1.0, duration:0.6 }}
          />
          {/* Wing feather details */}
          <motion.path d="M28 40 C24 36 16 34 10 36" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }}
            transition={{ delay:1.2, duration:0.5 }}
          />
          <motion.path d="M52 40 C56 36 64 34 70 36" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1" strokeLinecap="round"
            initial={{ pathLength:0, opacity:0 }} animate={{ pathLength:1, opacity:1 }}
            transition={{ delay:1.3, duration:0.5 }}
          />
          {/* Stars around */}
          {[0,1,2,3].map(i=>{
            const a=i/4*Math.PI*2, r=34;
            return <motion.circle key={i} cx={40+Math.cos(a)*r} cy={40+Math.sin(a)*r} r={1.2}
              fill="#C9A84C" opacity={0.5}
              animate={{ opacity:[0.3,0.8,0.3], r:[1,1.8,1] }}
              transition={{ duration:2, repeat:Infinity, delay:i*0.5 }}
            />;
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
  const [eaglePhase, setEaglePhase] = useState<'idle'|'flying'|'landing'>('idle');
  const holoRef = useRef<HoloRef>(null);
  const audioInit = useRef(false);

  // Eagle intro sequence
  useEffect(() => {
    const t1 = setTimeout(() => setEaglePhase('flying'), 600);
    const t2 = setTimeout(() => setEaglePhase('landing'), 2200);
    const t3 = setTimeout(() => setPhase('pad'), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const initAudio = () => { if (!audioInit.current) { audio.init(); audioInit.current = true; } };

  const addDigit = (d: string) => {
    if (status === 'err' || entered.length >= 4) return;
    initAudio(); audio.key();
    const next = entered + d;
    setEntered(next);
    if (next.length === 4) setTimeout(() => checkCode(next), 380);
  };
  const delDigit = () => { if (status === 'err') return; initAudio(); audio.del(); setEntered(e => e.slice(0,-1)); };

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
      setTimeout(() => { setStatus('idle'); setStatusMsg('_ _ _ _'); setEntered(''); }, 1300);
    }
  };

  const startHolo = (accessMode: 'admin' | 'visitor') => {
    setPhase('holo');
    const ticks=[0,155,295,420,530,625,705,772,828,872,908,934,952,963];
    ticks.forEach(d=>setTimeout(()=>audio.tick(),d+260));
    setTimeout(()=>{ holoRef.current?.lock(); audio.lock(); setGStat('Déclassification en cours...'); },1620);
    setTimeout(()=>{ audio.voice(); setShowVBox(true); },2700);
    setTimeout(()=>{ setShowStamp(true); audio.stamp(); },4200);
    setTimeout(()=>{ audio.reveal(); launchConfetti(); setPhase('done'); setMode(accessMode); },6500);
  };

  if (phase === 'done') return null;

  const base: React.CSSProperties = { fontFamily:'"Share Tech Mono",monospace' };

  return (
    <AnimatePresence>
      <motion.div initial={{opacity:1}} exit={{opacity:0,scale:1.04}} transition={{duration:0.9}}
        style={{ position:'fixed', inset:0, zIndex:9999, background:'#050810', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>

        {/* Animated grid bg */}
        <div style={{ position:'absolute', inset:0, opacity:.03, backgroundImage:'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)', backgroundSize:'50px 50px', animation:'breathe 4s ease-in-out infinite' }}/>

        {/* Scan line */}
        <div style={{ position:'absolute', left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.1),transparent)', animation:'scanMove 5s linear infinite', pointerEvents:'none' }}/>

        {/* Corners */}
        {[['top-4 left-4','border-t border-l'],['top-4 right-4','border-t border-r'],['bottom-4 left-4','border-b border-l'],['bottom-4 right-4','border-b border-r']].map(([pos,brd],i)=>(
          <div key={i} className={`absolute ${pos} w-9 h-9 ${brd}`} style={{ borderColor:'rgba(201,168,76,0.24)', pointerEvents:'none' }}/>
        ))}

        {/* ── EAGLE PHASE ── */}
        <AnimatePresence>
          {phase === 'eagle' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:0.9,y:-20}} transition={{duration:0.5}}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
              <EagleLogo phase={eaglePhase}/>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2}}
                style={{ ...base, fontSize:10, letterSpacing:6, color:'rgba(201,168,76,0.35)', textTransform:'uppercase' }}>
                Département des Finances — Los Santos
              </motion.div>
              <motion.div initial={{opacity:0}} animate={{opacity:[0,1,0]}} transition={{delay:2.5,duration:0.8,repeat:Infinity}}
                style={{ ...base, fontSize:9, letterSpacing:4, color:'rgba(201,168,76,0.2)', textTransform:'uppercase' }}>
                Initialisation...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PAD PHASE ── */}
        <AnimatePresence>
          {phase === 'pad' && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.5}}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:0 }}>
              <div style={{ ...base, fontSize:10, letterSpacing:4, color:'rgba(201,168,76,0.3)', textTransform:'uppercase', marginBottom:6 }}>Système sécurisé — Niveau Alpha Confidentiel</div>
              <div style={{ ...base, fontSize:10, letterSpacing:6, color:'rgba(192,57,43,0.42)', textTransform:'uppercase', marginBottom:24 }}>⬛ Accès Restreint ⬛</div>

              {/* Compact badge */}
              <div style={{ width:72, height:72, borderRadius:'50%', border:'2px solid rgba(201,168,76,0.48)', background:'radial-gradient(circle,#1C2535 60%,#050810)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, marginBottom:16, boxShadow:'0 0 30px rgba(201,168,76,0.12)' }}>🦅</div>

              <div style={{ fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:5, color:'#8B6914', textTransform:'uppercase', marginBottom:5 }}>Département des Finances — Los Santos</div>
              <div style={{ fontFamily:'Cinzel,serif', fontSize:22, fontWeight:700, color:'#C9A84C', textTransform:'uppercase', letterSpacing:3, marginBottom:3 }}>Dossier Confidentiel</div>
              <div style={{ ...base, fontSize:9, letterSpacing:4, color:'rgba(201,168,76,0.26)', textTransform:'uppercase', marginBottom:24 }}>Code Visiteur — Lecture / Code Admin — Édition</div>

              <div style={{ width:140, height:1, background:'linear-gradient(90deg,transparent,#C9A84C,transparent)', marginBottom:20 }}/>
              <div style={{ ...base, fontSize:9, letterSpacing:3, color:'rgba(201,168,76,0.36)', textTransform:'uppercase', marginBottom:10 }}>Entrez le code d'accès</div>

              {/* Code boxes */}
              <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                {[0,1,2,3].map(i=>(
                  <div key={i} style={{ width:46, height:58, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Share Tech Mono,monospace', fontSize:24, borderRadius:2, transition:'all .2s',
                    border:`1px solid ${status==='err'?'rgba(192,57,43,0.62)':status==='ok'?'rgba(180,160,80,0.65)':i<entered.length?'rgba(201,168,76,0.28)':i===entered.length?'rgba(201,168,76,0.5)':'rgba(201,168,76,0.17)'}`,
                    background:i===entered.length?'rgba(201,168,76,0.07)':'rgba(201,168,76,0.02)', color:'#C9A84C',
                    animation:status==='err'?'shake 0.4s ease':undefined }}>
                    {i<entered.length?'•':i===entered.length?<div style={{width:2,height:22,background:'#C9A84C',animation:'blink 0.85s infinite'}}/>:null}
                  </div>
                ))}
              </div>

              {/* Numpad */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, width:160, marginBottom:12 }}>
                {['1','2','3','4','5','6','7','8','9'].map(d=>(
                  <button key={d} onClick={()=>addDigit(d)} style={{ ...base, fontSize:15, padding:'9px', borderRadius:2, background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.1)', color:'#A89878', cursor:'pointer', transition:'all .12s' }}>
                    {d}
                  </button>
                ))}
                <div/>
                <button onClick={()=>addDigit('0')} style={{ ...base, fontSize:15, padding:'9px', borderRadius:2, background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.1)', color:'#A89878', cursor:'pointer' }}>0</button>
                <button onClick={delDigit} style={{ ...base, fontSize:15, padding:'9px', borderRadius:2, background:'rgba(192,57,43,0.04)', border:'1px solid rgba(192,57,43,0.14)', color:'rgba(192,57,43,0.5)', cursor:'pointer' }}>⌫</button>
              </div>

              <div style={{ ...base, fontSize:10, letterSpacing:2, textTransform:'uppercase', height:18, transition:'color .3s',
                color:status==='ok'?'rgba(180,160,80,0.82)':status==='err'?'rgba(192,57,43,0.78)':'rgba(201,168,76,0.26)' }}>
                {statusMsg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HOLO PHASE ── */}
        <AnimatePresence>
          {phase === 'holo' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
              <HoloCanvas ref={holoRef}/>
              <div style={{ ...base, fontSize:9, letterSpacing:3, color:'rgba(201,168,76,0.3)', textTransform:'uppercase' }}>{gStat}</div>
              <AnimatePresence>
                {showVBox && (
                  <motion.div initial={{opacity:0,letterSpacing:'8px'}} animate={{opacity:1,letterSpacing:'4px'}} style={{ textAlign:'center' }}>
                    <div style={{ ...base, fontSize:9, letterSpacing:4, color:'rgba(201,168,76,0.36)', textTransform:'uppercase', marginBottom:6 }}>Identification confirmée — Dossier</div>
                    <div style={{ fontFamily:'Cinzel,serif', fontSize:18, color:'#C9A84C', letterSpacing:5, textTransform:'uppercase' }}>{CONFIG.candidat.nomComplet}</div>
                    <div style={{ width:180, height:1, background:'linear-gradient(90deg,transparent,#C9A84C,transparent)', margin:'8px auto 0' }}/>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showStamp && (
                  <motion.div className="stamp-slam" style={{ border:'5px solid rgba(192,57,43,0.86)', padding:'14px 34px', transform:'rotate(-8deg)', position:'relative' }}>
                    <div style={{ position:'absolute', inset:4, border:'2px solid rgba(192,57,43,0.26)' }}/>
                    <div style={{ fontFamily:'Cinzel,serif', fontWeight:700, fontSize:32, letterSpacing:8, textTransform:'uppercase', color:'rgba(192,57,43,0.9)' }}>Déclassifié</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
