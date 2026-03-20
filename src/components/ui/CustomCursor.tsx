'use client';
import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mx = 0, my = 0, tx = 0, ty = 0;
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const down = () => cursorRef.current?.classList.add('clicking');
    const up = () => cursorRef.current?.classList.remove('clicking');
    document.addEventListener('mousemove', move);
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup', up);
    let af: number;
    const animate = () => {
      tx += (mx - tx) * 0.12; ty += (my - ty) * 0.12;
      if (cursorRef.current) { cursorRef.current.style.left = mx + 'px'; cursorRef.current.style.top = my + 'px'; }
      if (trailRef.current) { trailRef.current.style.left = tx + 'px'; trailRef.current.style.top = ty + 'px'; }
      af = requestAnimationFrame(animate);
    };
    af = requestAnimationFrame(animate);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mousedown', down); document.removeEventListener('mouseup', up); cancelAnimationFrame(af); };
  }, []);

  return (
    <>
      <div id="custom-cursor" ref={cursorRef} style={{ position: 'fixed', pointerEvents: 'none', zIndex: 99999 }}>
        <svg width="20" height="20" viewBox="0 0 20 20">
          <line x1="10" y1="0" x2="10" y2="7" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
          <line x1="10" y1="13" x2="10" y2="20" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
          <line x1="0" y1="10" x2="7" y2="10" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
          <line x1="13" y1="10" x2="20" y2="10" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
          <circle cx="10" cy="10" r="2.5" fill="none" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8"/>
          <circle cx="10" cy="10" r="0.8" fill="#C9A84C"/>
        </svg>
      </div>
      <div id="cursor-trail" ref={trailRef} style={{ position: 'fixed', pointerEvents: 'none', zIndex: 99998, width: 6, height: 6, borderRadius: '50%', background: 'rgba(201,168,76,0.4)', transform: 'translate(-50%,-50%)' }}/>
    </>
  );
}
