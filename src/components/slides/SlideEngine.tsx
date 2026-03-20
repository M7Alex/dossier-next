'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import CoverSlide from './CoverSlide';
import ChapterSlide from './ChapterSlide';
import { audio } from '@/lib/audio';
import { toast } from 'sonner';

const VARIANTS = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
};

export default function SlideEngine() {
  const { currentSlide, setSlide, showWatermark, content, extraPages } = useDossier();
  const [dir, setDir] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const allSlides = [...CONFIG.slides, ...extraPages];
  const total = allSlides.length;

  // Scale so the slide fills the container completely (cover mode)
  // but text stays readable by using contain when on small screens
  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const W = containerRef.current.offsetWidth;
      const H = containerRef.current.offsetHeight;
      // Use contain so nothing gets cropped
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

  return (
    // Container fills ALL available space
    <div ref={containerRef} style={{ width:'100%', height:'100%', position:'relative', background:'#050810', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>

      {/* Slide at native 1920×1080, scaled to fit */}
      <div style={{
        width: 1920, height: 1080,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Progress bar */}
        <motion.div style={{ position:'absolute', bottom:0, left:0, zIndex:50, height:3,
          background:'linear-gradient(90deg,#8B6914,#C9A84C,#E8C97A)', boxShadow:'0 0 8px rgba(201,168,76,0.6)' }}
          animate={{ width:`${((currentSlide+1)/total)*100}%` }}
          transition={{ duration:0.4, ease:'easeInOut' }}
        />
        {/* Watermark */}
        <AnimatePresence>
          {showWatermark && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{ position:'absolute', inset:0, zIndex:40, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ fontFamily:'Cinzel,serif', fontWeight:700, fontSize:180, color:'rgba(192,57,43,0.1)', transform:'rotate(-35deg)', letterSpacing:20, textTransform:'uppercase', userSelect:'none' }}>
                CONFIDENTIEL
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Slides */}
        <AnimatePresence custom={dir} mode="wait">
          <motion.div key={currentSlide} custom={dir} variants={VARIANTS}
            initial="enter" animate="center" exit="exit"
            transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
            style={{ position:'absolute', inset:0 }}>
            {slide?.type === 'cover' && <CoverSlide isActive={true}/>}
            {(slide?.type === 'chapter' || slide?.type === 'custom') && <ChapterSlide slide={slide} isActive={true}/>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Black letterbox areas — fill with matching bg so no ugly bars */}
      <div style={{ position:'absolute', inset:0, zIndex:-1, background:'#050810' }}/>
    </div>
  );
}
