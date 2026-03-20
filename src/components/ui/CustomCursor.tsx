'use client';
import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<SVGSVGElement>(null);
  const dot1Ref   = useRef<HTMLDivElement>(null);
  const dot2Ref   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mx = -200, my = -200;
    let d1x = -200, d1y = -200;
    let d2x = -200, d2y = -200;
    let af: number;

    // Only hide native cursor once custom cursor is active
    document.body.classList.add('custom-cursor-ready');

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const onDown = () => cursorRef.current?.style.setProperty('opacity','0.6');
    const onUp   = () => cursorRef.current?.style.setProperty('opacity','1');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup',   onUp);

    const tick = () => {
      // Curseur principal — instantané
      if (cursorRef.current) {
        cursorRef.current.style.left = mx + 'px';
        cursorRef.current.style.top  = my + 'px';
      }
      // Trail rapide — 30% par frame
      d1x += (mx - d1x) * 0.30;
      d1y += (my - d1y) * 0.30;
      if (dot1Ref.current) {
        dot1Ref.current.style.left = d1x + 'px';
        dot1Ref.current.style.top  = d1y + 'px';
      }
      // Trail lent — 16% par frame
      d2x += (mx - d2x) * 0.16;
      d2y += (my - d2y) * 0.16;
      if (dot2Ref.current) {
        dot2Ref.current.style.left = d2x + 'px';
        dot2Ref.current.style.top  = d2y + 'px';
      }
      af = requestAnimationFrame(tick);
    };
    af = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      cancelAnimationFrame(af);
    };
  }, []);

  const base: React.CSSProperties = { position:'fixed', pointerEvents:'none', zIndex:99999, transform:'translate(-50%,-50%)' };
  return (
    <>
      <svg ref={cursorRef} width="22" height="22" viewBox="0 0 22 22" style={{ ...base, zIndex:99999 }}>
        <line x1="11" y1="0"  x2="11" y2="7"  stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
        <line x1="11" y1="15" x2="11" y2="22" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
        <line x1="0"  y1="11" x2="7"  y2="11" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
        <line x1="15" y1="11" x2="22" y2="11" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
        <circle cx="11" cy="11" r="3" fill="none" stroke="#C9A84C" strokeWidth="1.2" opacity="0.75"/>
        <circle cx="11" cy="11" r="1" fill="#C9A84C"/>
      </svg>
      <div ref={dot1Ref} style={{ ...base, zIndex:99997, width:7, height:7, borderRadius:'50%', background:'rgba(201,168,76,0.6)', boxShadow:'0 0 6px rgba(201,168,76,0.5)' }}/>
      <div ref={dot2Ref} style={{ ...base, zIndex:99996, width:14, height:14, borderRadius:'50%', background:'transparent', border:'1px solid rgba(201,168,76,0.22)' }}/>
    </>
  );
}
