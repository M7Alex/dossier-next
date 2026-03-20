'use client';
import { useEffect, useState } from 'react';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import { toast } from 'sonner';

interface Props { totalSlides: number; onAddPage:()=>void; onRemovePage:()=>void; onExport:()=>void; onShare:()=>void; }

export default function Toolbar({ totalSlides, onAddPage, onRemovePage, onExport, onShare }: Props) {
  const { currentSlide, setSlide, mode, toggleMute, isMuted, toggleStats, toggleWatermark } = useDossier();
  const [clock, setClock] = useState('');
  const [timer, setTimer] = useState('00:00');
  const [timerStart] = useState(Date.now());
  const isAdmin = mode === 'admin';

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setClock(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      const s = Math.floor((Date.now()-timerStart)/1000);
      setTimer(`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(id);
  }, [timerStart]);

  const labels = CONFIG.slides.map(s => s.label);
  const label  = labels[currentSlide] || `Page ${currentSlide+1}`;

  const btn = (color='rgba(201,168,76,0.3)', textColor='rgba(201,168,76,0.75)') => ({
    border: `1px solid ${color}`,
    background: 'rgba(201,168,76,0.06)',
    color: textColor,
    borderRadius: 2,
    fontFamily: '"Share Tech Mono",monospace',
    fontSize: 11,
    letterSpacing: '1px',
    padding: '5px 12px',
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    transition: 'all .2s',
    whiteSpace: 'nowrap' as const,
  });

  const arrBtn = {
    border: '1px solid rgba(201,168,76,0.2)',
    background: 'rgba(201,168,76,0.04)',
    color: 'rgba(201,168,76,0.7)',
    borderRadius: 2, width: 32, height: 32,
    cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .2s',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: 52, padding: '0 14px', gap: 8,
      background: 'rgba(6,10,18,0.98)',
      borderBottom: '1px solid rgba(201,168,76,0.12)',
      position: 'sticky', top: 0, zIndex: 200,
      backdropFilter: 'blur(12px)',
    }}>
      {/* Navigation */}
      <button style={arrBtn} onClick={() => setSlide(Math.max(0, currentSlide-1))}>◀</button>
      <button style={arrBtn} onClick={() => setSlide(Math.min(totalSlides-1, currentSlide+1))}>▶</button>

      <span style={{ fontFamily:'Cinzel,serif', fontSize:12, color:'#C9A84C', letterSpacing:2, minWidth:130, whiteSpace:'nowrap' }}>
        {label} — {currentSlide+1}/{totalSlides}
      </span>

      {/* Dots */}
      <div style={{ width:1, height:20, background:'rgba(201,168,76,0.1)', flexShrink:0 }}/>
      <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
        {Array.from({ length: totalSlides }).map((_,i) => (
          <button key={i} onClick={() => setSlide(i)} style={{
            width:8, height:8, borderRadius:'50%', border:'none', cursor:'pointer',
            background: i===currentSlide ? '#C9A84C' : 'rgba(201,168,76,0.2)',
            transform: i===currentSlide ? 'scale(1.35)' : 'scale(1)',
            transition: 'all .3s',
            boxShadow: i===currentSlide ? '0 0 8px rgba(201,168,76,0.6)' : 'none',
          }}/>
        ))}
      </div>

      <div style={{ width:1, height:20, background:'rgba(201,168,76,0.1)', flexShrink:0 }}/>
      <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'rgba(201,168,76,0.4)', letterSpacing:1 }}>{timer}</span>
      <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'rgba(201,168,76,0.28)', letterSpacing:1 }}>{clock}</span>

      <div style={{ flex:1 }}/>

      {/* Right buttons */}
      <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
        {/* Mode badge */}
        <span style={{
          ...btn(isAdmin ? 'rgba(201,168,76,0.4)' : 'rgba(80,200,200,0.35)',
                 isAdmin ? '#C9A84C' : 'rgba(80,200,200,0.9)'),
          fontSize:10, padding:'4px 10px',
        }}>
          {isAdmin ? '⚙ ADMIN' : '👁 VISITEUR'}
        </span>

        <div style={{ width:1, height:20, background:'rgba(201,168,76,0.1)' }}/>
        <button onClick={toggleMute} style={{ ...arrBtn, fontSize:13 }}>{isMuted?'🔇':'🔊'}</button>

        {isAdmin && <button onClick={onAddPage}    style={btn('rgba(80,200,120,0.35)','rgba(80,200,120,0.85)')}>+ Page</button>}
        {isAdmin && <button onClick={onRemovePage} style={btn('rgba(192,57,43,0.35)','rgba(192,57,43,0.75)')}>− Page</button>}

        <div style={{ width:1, height:20, background:'rgba(201,168,76,0.1)' }}/>
        <button onClick={toggleWatermark} style={btn()}>🔏</button>
        <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()} style={btn()}>⊞</button>
        {isAdmin && <button onClick={toggleStats} style={btn('rgba(80,200,200,0.35)','rgba(80,200,200,0.85)')}>📊 Stats</button>}
        <button onClick={onShare}  style={btn('rgba(80,185,255,0.35)','rgba(80,185,255,0.85)')}>🔗 Partager</button>
        <button onClick={onExport} style={btn('rgba(201,168,76,0.4)','#C9A84C')}>⬇ PDF</button>
      </div>
    </div>
  );
}
