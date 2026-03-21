'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import CoverSlide from './CoverSlide';
import ChapterSlide from './ChapterSlide';
import LegacySlide from './LegacySlide';
import ParticlesBg from '../ui/ParticlesBg';
import Chibi from '../chibi/Chibi';
import { audio } from '@/lib/audio';
import { toast } from 'sonner';

const VARIANTS = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
};

const SLIDE_BG: Record<string, string> = {
  cover:      'linear-gradient(160deg,#0D1117 0%,#141B24 45%,#1a2235 75%,#0D1117)',
  intro:      'linear-gradient(135deg,#141B24,#1a2535,#0f1620)',
  parcours:   'linear-gradient(135deg,#151a20,#1a2030,#101520)',
  vision:     'linear-gradient(135deg,#131c1a,#182522,#0e1815)',
  systemes:   'linear-gradient(135deg,#1a1520,#231a2e,#130f18)',
  leadership: 'linear-gradient(135deg,#1a1815,#2a2218,#13110e)',
  conclusion: 'linear-gradient(135deg,#151a1a,#1a2520,#0e1815)',
  legacy:     'linear-gradient(160deg,#000 0%,#0a0a0a 100%)',
};

const BG_TYPE: Record<string, string> = {
  intro:'particles', parcours:'waves', vision:'constellation',
  systemes:'matrix', leadership:'pulse', conclusion:'flow', cover:'particles',
};

const CHIBI_TYPE: Record<string, string> = {
  cover:'wand', intro:'pointer', parcours:'scroll', vision:'telescope',
  systemes:'calculator', leadership:'clipboard', conclusion:'trophy',
};

// Cover-specific decorative SVG elements — rendered at screen level
function CoverDeco() {
  return (
    <>
      {/* Full-screen grid */}
      <div style={{
        position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(201,168,76,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.06) 1px,transparent 1px)',
        backgroundSize:'60px 60px',
      }}/>
      {/* Full-screen decorative SVG — uses % so it always fills the viewport */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', zIndex:3, pointerEvents:'none' }}
        viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Bar chart bottom-right — in % coords */}
        {[0,1,2,3,4,5,6,7].map(i=>(
          <rect key={i}
            x={88+i*1.1} y={84-i*3.7}
            width="0.85" height={4.5+i*3.7}
            fill="#C9A84C" opacity={0.22+i*0.025} rx="0.15"/>
        ))}
        {/* Line graph bottom-right */}
        <polyline
          points="80,88 83,82 86.5,76 88.5,62"
          fill="none" stroke="#C9A84C" strokeWidth="0.2" strokeLinecap="round" opacity="0.22"/>
        <circle cx="88.5" cy="62" r="0.5" fill="#C9A84C" opacity="0.28"/>
        {/* Large circle rings - centered */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="#C9A84C" strokeWidth="0.08" opacity="0.06"/>
        <circle cx="50" cy="50" r="52" fill="none" stroke="#C9A84C" strokeWidth="0.06" opacity="0.04"/>
        {/* Horizontal rule */}
        <line x1="0" y1="89" x2="100" y2="89" stroke="#C9A84C" strokeWidth="0.06" opacity="0.08"/>
      </svg>
    </>
  );
}

export default function SlideEngine() {
  const { currentSlide, setSlide, showWatermark, content, extraPages } = useDossier();
  const [dir, setDir] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const allSlides = [...CONFIG.slides, ...extraPages];
  const total = allSlides.length;

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const W = containerRef.current.offsetWidth;
      const H = containerRef.current.offsetHeight;
      setScale(Math.min(W / 1920, H / 1080));
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const go = useCallback((i: number) => {
    if (i < 0 || i >= total || i === currentSlide) return;
    setDir(i > currentSlide ? 1 : -1);
    audio.slide();
    setSlide(i);
  }, [currentSlide, total, setSlide]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement;
      if (el?.contentEditable === 'true') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(currentSlide + 1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   go(currentSlide - 1);
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        fetch('/api/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content, extraPages }) })
          .then(() => toast.success('✦ Sauvegardé')).catch(() => toast.error('Erreur'));
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [currentSlide, go, content, extraPages]);

  // ── Auto-save to KV — debounced 1.2s after any content change ──
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.protocol === 'file:') return;
    const t = setTimeout(() => {
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, extraPages }),
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [content, extraPages]);

  useEffect(() => {
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? go(currentSlide + 1) : go(currentSlide - 1);
    };
    window.addEventListener('touchstart', ts, { passive: true });
    window.addEventListener('touchend',   te, { passive: true });
    return () => { window.removeEventListener('touchstart', ts); window.removeEventListener('touchend', te); };
  }, [currentSlide, go]);

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.protocol === 'file:') return;
    const t = setTimeout(() =>
      fetch('/api/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content, extraPages }) }).catch(() => {})
    , 800);
    return () => clearTimeout(t);
  }, [content, extraPages]);

  const slide = allSlides[currentSlide];
  const slideId = (slide as any)?.id || 'cover';
  const bgGradient = SLIDE_BG[slideId] || SLIDE_BG.cover;
  const bgType = (BG_TYPE[slideId] || 'particles') as any;
  const chibiType = (slide as any)?.chibi || CHIBI_TYPE[slideId] || 'pointer';
  const isCover = slideId === 'cover';

  return (
    <div ref={containerRef} style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden' }}>

      {/* ── LAYER 0: Full-bleed animated background ── */}
      <AnimatePresence mode="wait">
        <motion.div key={`bg-${currentSlide}`}
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.3 }}
          style={{ position:'absolute', inset:0, zIndex:0, background: bgGradient }}>
          <ParticlesBg type={bgType}/>
        </motion.div>
      </AnimatePresence>

      {/* ── LAYER 1: Cover-specific full-screen decorations ── */}
      <AnimatePresence>
        {isCover && (
          <motion.div key="cover-deco"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.4 }}
            style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none' }}>
            <CoverDeco/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LAYER 2: Always-visible screen-level UI ── */}

      {/* CRT scan lines — full screen, always visible */}
      <div style={{ position:'absolute', inset:0, zIndex:20, pointerEvents:'none',
        backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.018) 3px,rgba(0,0,0,0.018) 4px)' }}/>

      {/* Moving scan line — full screen */}
      <div style={{ position:'absolute', left:0, right:0, height:2, zIndex:21, pointerEvents:'none',
        background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.07),transparent)',
        animation:'scan 6s linear infinite' }}/>

      {/* Chapter slides: subtle grid overlay */}
      {!isCover && (
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
          backgroundImage:'linear-gradient(rgba(201,168,76,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.025) 1px,transparent 1px)',
          backgroundSize:'80px 80px' }}/>
      )}

      {/* 4 corners at true screen edges */}
      {[
        { top:10, left:10, borderTop:'1.5px solid rgba(201,168,76,0.45)', borderLeft:'1.5px solid rgba(201,168,76,0.45)' },
        { top:10, right:10, borderTop:'1.5px solid rgba(201,168,76,0.45)', borderRight:'1.5px solid rgba(201,168,76,0.45)' },
        { bottom:10, left:10, borderBottom:'1.5px solid rgba(201,168,76,0.45)', borderLeft:'1.5px solid rgba(201,168,76,0.45)' },
        { bottom:10, right:10, borderBottom:'1.5px solid rgba(201,168,76,0.45)', borderRight:'1.5px solid rgba(201,168,76,0.45)' },
      ].map((s, i) => (
        <div key={i} style={{ position:'absolute', ...s, width:40, height:40, zIndex:25, pointerEvents:'none' }}/>
      ))}

      {/* Progress bar — full screen width */}
      <motion.div style={{
        position:'absolute', bottom:0, left:0, zIndex:25, height:3,
        background:'linear-gradient(90deg,#8B6914,#C9A84C,#E8C97A)',
        boxShadow:'0 0 10px rgba(201,168,76,0.5)',
      }}
        animate={{ width:`${((currentSlide+1)/total)*100}%` }}
        transition={{ duration:0.4, ease:'easeInOut' }}
      />

      {/* Chibi — true screen bottom-right */}
      <div style={{ position:'absolute', bottom:0, right:16, zIndex:25, pointerEvents:'none' }}>
        <Chibi type={chibiType} visible={true}/>
      </div>

      {/* Watermark */}
      <AnimatePresence>
        {showWatermark && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:'absolute', inset:0, zIndex:22, display:'flex', alignItems:'center',
              justifyContent:'center', pointerEvents:'none' }}>
            <div style={{ fontFamily:'Cinzel,serif', fontWeight:700, fontSize:'12vw',
              color:'rgba(192,57,43,0.1)', transform:'rotate(-35deg)', letterSpacing:20,
              textTransform:'uppercase', userSelect:'none' }}>
              CONFIDENTIEL
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LAYER 3: Scaled slide content ── */}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
        justifyContent:'center', zIndex:10, pointerEvents:'none' }}>
        <div style={{
          width:1920, height:1080,
          transform:`scale(${scale})`, transformOrigin:'center center',
          flexShrink:0, position:'relative', pointerEvents:'auto',
        }}>
          <AnimatePresence custom={dir} mode="wait">
            <motion.div key={currentSlide} custom={dir} variants={VARIANTS}
              initial="enter" animate="center" exit="exit"
              transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
              style={{ position:'absolute', inset:0 }}>
              {slide?.type === 'cover' && <CoverSlide isActive={true}/>}
              {(slide?.type === 'chapter' || slide?.type === 'custom') && <ChapterSlide slide={slide} isActive={true}/>}
              {slide?.type === 'legacy' && <LegacySlide isActive={true}/>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
