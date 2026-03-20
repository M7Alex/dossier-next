'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import { audio } from '@/lib/audio';
import HoloCanvas from './HoloCanvas';
import type { HoloRef } from './HoloCanvas';

type Phase = 'pad' | 'holo' | 'done';

function launchConfetti() {
  const colors = ['#C9A84C','#E8C97A','#8B6914','rgba(80,200,200,0.9)'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    const size = 4 + Math.random() * 6;
    el.style.cssText = `position:fixed;left:${30+Math.random()*40}%;top:-10px;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:2px;pointer-events:none;z-index:99999;transform:rotate(${Math.random()*360}deg);animation:confettiFall ${1.5+Math.random()*2}s ${Math.random()*0.8}s ease-in forwards;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

export default function IntroScreen() {
  const { setMode, mode } = useDossier();
  const [phase, setPhase] = useState<Phase>('pad');
  const [entered, setEntered] = useState('');
  const [status, setStatus] = useState<'idle'|'ok'|'err'>('idle');
  const [statusMsg, setStatusMsg] = useState('_ _ _ _');
  const [gStat, setGStat] = useState("Analyse du protocole d'accès...");
  const [showVoiceBox, setShowVoiceBox] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const holoRef = useRef<HoloRef>(null);
  const audioInit = useRef(false);

  const initAudio = () => { if (!audioInit.current) { audio.init(); audioInit.current = true; } };

  const addDigit = (d: string) => {
    if (status === 'err' || entered.length >= 4) return;
    initAudio(); audio.key();
    const next = entered + d;
    setEntered(next);
    if (next.length === 4) setTimeout(() => checkCode(next), 380);
  };

  const delDigit = () => {
    if (status === 'err') return;
    initAudio(); audio.del();
    setEntered(e => e.slice(0, -1));
  };

  const checkCode = (code: string) => {
    const isAdmin = code === CONFIG.codes.admin;
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
    const ticks = [0,155,295,420,530,625,705,772,828,872,908,934,952,963];
    ticks.forEach(d => setTimeout(() => audio.tick(), d + 260));
    setTimeout(() => { holoRef.current?.lock(); audio.lock(); setGStat('Déclassification en cours...'); }, 1620);
    setTimeout(() => { audio.voice(); setShowVoiceBox(true); }, 2700);
    setTimeout(() => { setShowStamp(true); audio.stamp(); }, 4200);
    setTimeout(() => {
      audio.reveal();
      launchConfetti();
      setPhase('done');
      setMode(accessMode);
    }, 6500);
  };

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.04 }}
        transition={{ duration: 0.9 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: '#050810' }}
      >
        {/* Grid bg */}
        <div className="absolute inset-0 animate-breathe pointer-events-none" style={{
          backgroundImage: 'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)',
          backgroundSize: '50px 50px', opacity: 0.03,
        }}/>
        {/* Scan */}
        <div className="absolute left-0 right-0 h-[3px]" style={{
          background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.1),transparent)',
          animation:'scan 5s linear infinite', pointerEvents:'none'
        }}/>
        {/* Corners */}
        {[['top-4 left-4','border-t border-l'],['top-4 right-4','border-t border-r'],['bottom-4 left-4','border-b border-l'],['bottom-4 right-4','border-b border-r']].map(([pos,brd],i)=>(
          <div key={i} className={`absolute ${pos} w-9 h-9 ${brd} pointer-events-none`} style={{ borderColor:'rgba(201,168,76,0.24)' }}/>
        ))}
        {/* Mute */}
        <button onClick={() => { initAudio(); audio.key(); }}
          className="absolute top-3 right-12 font-mono text-[10px] tracking-widest px-3 py-1.5 z-10"
          style={{ background:'none', border:'1px solid rgba(201,168,76,0.16)', color:'rgba(201,168,76,0.35)', borderRadius:2 }}>
          🔊
        </button>

        {/* PAD phase */}
        <AnimatePresence>
          {phase === 'pad' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center">
              <div className="font-mono text-[10px] tracking-[4px] uppercase mb-1.5" style={{ color:'rgba(201,168,76,0.3)' }}>Système sécurisé — Niveau Alpha Confidentiel</div>
              <div className="font-mono text-[10px] tracking-[6px] uppercase mb-7" style={{ color:'rgba(192,57,43,0.42)' }}>⬛ Accès Restreint ⬛</div>
              {/* Badge */}
              <motion.div className="animate-glow-pulse relative flex items-center justify-center text-4xl mb-5"
                style={{ width:82, height:82, borderRadius:'50%', border:'2px solid rgba(201,168,76,0.48)', background:'radial-gradient(circle,#1C2535 60%,#050810)' }}>
                🦅
                <div className="absolute animate-spin-slow" style={{ inset:-8, borderRadius:'50%', border:'1px solid rgba(201,168,76,0.13)' }}/>
              </motion.div>
              <div className="font-cinzel text-[10px] tracking-[5px] uppercase mb-2" style={{ color:'#8B6914' }}>Département des Finances — Los Santos</div>
              <div className="font-cinzel font-bold text-[24px] uppercase tracking-widest mb-1" style={{ color:'#C9A84C' }}>Dossier Confidentiel</div>
              <div className="font-mono text-[9px] tracking-[4px] uppercase mb-7" style={{ color:'rgba(201,168,76,0.26)' }}>Code Visiteur — Lecture / Code Admin — Édition</div>
              <div className="w-36 h-px mb-6" style={{ background:'linear-gradient(90deg,transparent,#C9A84C,transparent)' }}/>
              <div className="font-mono text-[9px] tracking-widest uppercase mb-3" style={{ color:'rgba(201,168,76,0.36)' }}>Entrez le code d'accès</div>
              {/* Code boxes */}
              <div className="flex gap-3 mb-3.5">
                {[0,1,2,3].map(i => (
                  <div key={i} className="w-12 h-14 flex items-center justify-center font-mono text-[26px] rounded-sm transition-all duration-200"
                    style={{
                      border: `1px solid ${status==='err'?'rgba(192,57,43,0.62)':status==='ok'?'rgba(180,160,80,0.65)':i<entered.length?'rgba(201,168,76,0.28)':i===entered.length?'rgba(201,168,76,0.48)':'rgba(201,168,76,0.17)'}`,
                      background: i===entered.length?'rgba(201,168,76,0.06)':'rgba(201,168,76,0.023)',
                      color:'#C9A84C',
                      animation: status==='err'?'shake 0.4s ease':undefined,
                    }}>
                    {i < entered.length ? '•' : i === entered.length ? <div style={{ width:2, height:24, background:'#C9A84C', animation:'blink 0.85s infinite' }}/> : null}
                  </div>
                ))}
              </div>
              {/* Numpad */}
              <div className="grid gap-2 mb-4" style={{ gridTemplateColumns:'repeat(3,1fr)', width:166 }}>
                {['1','2','3','4','5','6','7','8','9'].map(d=>(
                  <button key={d} onClick={()=>addDigit(d)}
                    className="font-mono text-[15px] py-2.5 rounded-sm transition-all duration-100 active:scale-90"
                    style={{ background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.1)', color:'#A89878' }}>
                    {d}
                  </button>
                ))}
                <div/>
                <button onClick={()=>addDigit('0')} className="font-mono text-[15px] py-2.5 rounded-sm transition-all duration-100 active:scale-90" style={{ background:'rgba(201,168,76,0.04)', border:'1px solid rgba(201,168,76,0.1)', color:'#A89878' }}>0</button>
                <button onClick={delDigit} className="font-mono text-[15px] py-2.5 rounded-sm transition-all duration-100 active:scale-90" style={{ background:'rgba(192,57,43,0.04)', border:'1px solid rgba(192,57,43,0.14)', color:'rgba(192,57,43,0.5)' }}>⌫</button>
              </div>
              <div className="font-mono text-[10px] tracking-widest uppercase h-4.5 transition-colors duration-300"
                style={{ color: status==='ok'?'rgba(180,160,80,0.82)':status==='err'?'rgba(192,57,43,0.78)':'rgba(201,168,76,0.26)' }}>
                {statusMsg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HOLO phase */}
        <AnimatePresence>
          {phase === 'holo' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3.5">
              <HoloCanvas ref={holoRef}/>
              <div className="font-mono text-[9px] tracking-widest uppercase" style={{ color:'rgba(201,168,76,0.3)', animation:'statBlink 1.6s ease-in-out infinite' }}>
                {gStat}
              </div>
              <AnimatePresence>
                {showVoiceBox && (
                  <motion.div initial={{ opacity:0, letterSpacing:'8px' }} animate={{ opacity:1, letterSpacing:'4px' }} className="text-center">
                    <div className="font-mono text-[9px] tracking-[4px] uppercase mb-1.5" style={{ color:'rgba(201,168,76,0.36)' }}>Identification confirmée — Dossier</div>
                    <div className="font-cinzel text-[18px] tracking-[5px] uppercase" style={{ color:'#C9A84C' }}>{CONFIG.candidat.nomComplet}</div>
                    <div className="w-44 h-px mt-2 mx-auto" style={{ background:'linear-gradient(90deg,transparent,#C9A84C,transparent)' }}/>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showStamp && (
                  <motion.div className="stamp-slam" style={{ border:'5px solid rgba(192,57,43,0.86)', padding:'14px 34px', transform:'rotate(-8deg)', position:'relative' }}>
                    <div style={{ position:'absolute', inset:4, border:'2px solid rgba(192,57,43,0.26)' }}/>
                    <div className="font-cinzel font-bold text-[32px] tracking-[8px] uppercase" style={{ color:'rgba(192,57,43,0.9)' }}>Déclassifié</div>
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
