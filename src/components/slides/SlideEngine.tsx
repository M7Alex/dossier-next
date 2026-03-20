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
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
};

export default function SlideEngine() {
  const { currentSlide, setSlide, mode, showWatermark, content, extraPages } = useDossier();
  const [dir, setDir] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const allSlides = [...CONFIG.slides, ...extraPages];
  const total = allSlides.length;

  // Responsive scale — fit inside available space (width AND height)
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const W = containerRef.current.offsetWidth;
      // Available height = window minus toolbar (~48px)
      const H = window.innerHeight - 48;
      const scaleW = W / 1920;
      const scaleH = H / 1080;
      // Use the smaller scale so the slide always fits without cropping
      setScale(Math.min(scaleW, scaleH));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Navigate
  const go = useCallback((i: number) => {
    if (i < 0 || i >= total || i === currentSlide) return;
    setDir(i > currentSlide ? 1 : -1);
    audio.slide();
    setSlide(i);
  }, [currentSlide, total, setSlide]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement;
      if (active?.contentEditable === 'true') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(currentSlide + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(currentSlide - 1);
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveNow(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentSlide, go]);

  // Touch/swipe
  useEffect(() => {
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? go(currentSlide+1) : go(currentSlide-1);
    };
    window.addEventListener('touchstart', ts, { passive: true });
    window.addEventListener('touchend', te, { passive: true });
    return () => { window.removeEventListener('touchstart', ts); window.removeEventListener('touchend', te); };
  }, [currentSlide, go]);

  // Auto-save (real-time) — debounced 800ms
  useEffect(() => {
    const tid = setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
        fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, extraPages }),
        }).catch(() => {});
      }
    }, 800);
    return () => clearTimeout(tid);
  }, [content, extraPages]);

  const saveNow = async () => {
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, extraPages }),
      });
      toast.success('✦ Sauvegardé');
    } catch { toast.error('Erreur de sauvegarde'); }
  };

  const slide = allSlides[currentSlide];

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center overflow-hidden"
      style={{ height: Math.round(1080 * scale), background: '#050810' }}>
      <div style={{
        width: 1920, height: 1080,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'relative',
        flexShrink: 0,
      }}>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 z-50 prog-pulse"
          style={{ height: 3, background: 'linear-gradient(90deg,#8B6914,#C9A84C,#E8C97A)', boxShadow: '0 0 8px rgba(201,168,76,0.5)' }}
          animate={{ width: `${((currentSlide + 1) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />

        {/* Watermark */}
        <AnimatePresence>
          {showWatermark && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div className="font-cinzel font-bold select-none" style={{ fontSize: 180, color: 'rgba(192,57,43,0.1)', transform: 'rotate(-35deg)', letterSpacing: 20, textTransform: 'uppercase' }}>
                CONFIDENTIEL
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slides */}
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={currentSlide}
            custom={dir}
            variants={VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {slide?.type === 'cover' && <CoverSlide isActive={true}/>}
            {slide?.type === 'chapter' && <ChapterSlide slide={slide} isActive={true}/>}
            {slide?.type === 'custom' && <ChapterSlide slide={slide} isActive={true}/>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
