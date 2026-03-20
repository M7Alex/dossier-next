'use client';
import { useEffect, useState } from 'react';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import { toast } from 'sonner';

interface ToolbarProps {
  totalSlides: number;
  onAddPage: () => void;
  onRemovePage: () => void;
  onExport: () => void;
  onShare: () => void;
}

const btn = (extra = '') => `font-mono text-[9px] tracking-widest px-3 py-1.5 rounded-sm border transition-all duration-200 cursor-pointer ${extra}`;

export default function Toolbar({ totalSlides, onAddPage, onRemovePage, onExport, onShare }: ToolbarProps) {
  const { currentSlide, setSlide, mode, toggleMute, isMuted, toggleStats, toggleWatermark, showStats } = useDossier();
  const [clock, setClock] = useState('');
  const [timer, setTimer] = useState('');
  const [timerStart] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setClock(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
      const s = Math.floor((Date.now() - timerStart) / 1000);
      setTimer(`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(id);
  }, [timerStart]);

  const labels = CONFIG.slides.map(s => s.label);
  const label = labels[currentSlide] || `Page ${currentSlide + 1}`;

  const isAdmin = mode === 'admin';
  const locked = mode === 'locked';

  const tbtn = (style: string) => ({ border: `1px solid ${style}`, background: 'rgba(201,168,76,0.06)', color: '#A89878', borderRadius: 2, fontFamily: '"Share Tech Mono",monospace', fontSize: 9, letterSpacing: '1px', padding: '4px 9px', cursor: 'pointer', textTransform: 'uppercase' as const, transition: 'all .2s' });

  return (
    <div className="flex items-center h-12 px-3 gap-1.5 sticky top-0 z-[200]" style={{ background: '#090d12', borderBottom: '1px solid #1a1500' }}>
      {/* Navigation */}
      <button onClick={() => setSlide(Math.max(0, currentSlide-1))} style={{ ...tbtn('rgba(201,168,76,0.17)'), width: 27, height: 27, display:'flex', alignItems:'center', justifyContent:'center' }}>◀</button>
      <button onClick={() => setSlide(Math.min(totalSlides-1, currentSlide+1))} style={{ ...tbtn('rgba(201,168,76,0.17)'), width: 27, height: 27, display:'flex', alignItems:'center', justifyContent:'center' }}>▶</button>
      <span className="font-cinzel text-[10px] tracking-widest min-w-[110px] whitespace-nowrap" style={{ color: '#C9A84C' }}>{label} — {currentSlide+1}/{totalSlides}</span>

      {/* Dots */}
      <div className="w-px h-4 mx-1" style={{ background: 'rgba(201,168,76,0.1)' }}/>
      <div className="flex gap-1 items-center flex-wrap">
        {Array.from({length: totalSlides}).map((_,i) => (
          <button key={i} onClick={() => setSlide(i)}
            className="rounded-full transition-all duration-300 dot-glow"
            style={{ width: 6, height: 6, borderRadius:'50%', background: i===currentSlide ? '#C9A84C' : 'rgba(201,168,76,0.2)', transform: i===currentSlide?'scale(1.3)':'scale(1)', border:'none', cursor:'pointer' }}
          />
        ))}
      </div>

      {/* Timer & Clock */}
      <div className="w-px h-4 mx-1" style={{ background: 'rgba(201,168,76,0.1)' }}/>
      <span className="font-mono text-[10px]" style={{ color: 'rgba(201,168,76,0.32)', letterSpacing:'1px' }}>{timer}</span>
      <span className="font-mono text-[10px]" style={{ color: 'rgba(201,168,76,0.22)', letterSpacing:'1px' }}>{clock}</span>

      <div className="flex-1"/>

      {/* Right buttons */}
      <div className="flex gap-1 items-center flex-wrap">
        {/* Mode badge */}
        <span className="font-mono text-[9px] tracking-widest px-2 py-1" style={{
          border: `1px solid ${isAdmin ? 'rgba(201,168,76,0.35)' : 'rgba(80,200,200,0.3)'}`,
          color: isAdmin ? '#C9A84C' : 'rgba(80,200,200,0.8)', borderRadius: 2
        }}>{isAdmin ? '⚙ ADMIN' : '👁 VISITEUR'}</span>

        <div className="w-px h-4 mx-0.5" style={{ background: 'rgba(201,168,76,0.1)' }}/>

        <button onClick={toggleMute} style={{ ...tbtn('rgba(201,168,76,0.13)'), width:27, height:27, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>{isMuted?'🔇':'🔊'}</button>
        {isAdmin && <button onClick={onAddPage} style={{ ...tbtn('rgba(80,200,120,0.28)'), color:'rgba(80,200,120,0.75)' }}>+ Page</button>}
        {isAdmin && <button onClick={onRemovePage} style={{ ...tbtn('rgba(192,57,43,0.28)'), color:'rgba(192,57,43,0.65)' }}>− Page</button>}

        <div className="w-px h-4 mx-0.5" style={{ background: 'rgba(201,168,76,0.1)' }}/>

        <button onClick={toggleWatermark} style={tbtn('rgba(201,168,76,0.13)')}>🔏</button>
        <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()} style={tbtn('rgba(201,168,76,0.13)')}>⊞</button>
        {isAdmin && <button onClick={toggleStats} style={{ ...tbtn('rgba(80,200,200,0.28)'), color:'rgba(80,200,200,0.75)' }}>📊 Stats</button>}
        <button onClick={onShare} style={{ ...tbtn('rgba(80,185,255,0.28)'), color:'rgba(80,185,255,0.72)' }}>🔗 Partager</button>
        <button onClick={onExport} style={{ ...tbtn('rgba(201,168,76,0.28)'), color:'#C9A84C' }}>⬇ PDF</button>
      </div>
    </div>
  );
}
