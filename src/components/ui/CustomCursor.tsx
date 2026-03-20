'use client';
import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef  = useRef<SVGSVGElement>(null);
  const trailRef   = useRef<HTMLDivElement>(null);
  const trail2Ref  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mx = -100, my = -100;
    let t1x = -100, t1y = -100;
    let t2x = -100, t2y = -100;
    let af: number;

    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const down = () => cursorRef.current?.classList.add('scale-75');
    const up   = () => cursorRef.current?.classList.remove('scale-75');

    document.addEventListener('mousemove', move);
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup',   up);

    const loop = () => {
      // Curseur principal — suit instantanément
      if (cursorRef.current) {
        cursorRef.current.style.left = mx + 'px';
        cursorRef.current.style.top  = my + 'px';
      }
      // Trail 1 — suit avec 22% d'inertie (très rapide)
      t1x += (mx - t1x) * 0.22;
      t1y += (my - t1y) * 0.22;
      if (trailRef.current) {
        trailRef.current.style.left = t1x + 'px';
        trailRef.current.style.top  = t1y + 'px';
      }
      // Trail 2 — suit avec 12% d'inertie (légèrement plus lent)
      t2x += (mx - t2x) * 0.12;
      t2y += (my - t2y) * 0.12;
      if (trail2Ref.current) {
        trail2Ref.current.style.left = t2x + 'px';
        trail2Ref.current.style.top  = t2y + 'px';
      }
      af = requestAnimationFrame(loop);
    };
    af = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup',   up);
      cancelAnimationFrame(af);
    };
  }, []);

  return (
    <>
      {/* Curseur crosshair principal — instantané */}
      <svg
        ref={cursorRef}
        width="22" height="22" viewBox="0 0 22 22"
        className="scale-100 transition-transform duration-75"
        style={{ position:'fixed', pointerEvents:'none', zIndex:99999, transform:'translate(-50%,-50%)' }}
      >
        <line x1="11" y1="0"  x2="11" y2="8"  stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
        <line x1="11" y1="14" x2="11" y2="22" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
        <line x1="0"  y1="11" x2="8"  y2="11" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
        <line x1="14" y1="11" x2="22" y2="11" stroke="#C9A84C" strokeWidth="1.2" opacity="0.9"/>
        <circle cx="11" cy="11" r="2.8" fill="none" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8"/>
        <circle cx="11" cy="11" r="0.9" fill="#C9A84C"/>
      </svg>

      {/* Trail 1 — point doré rapide */}
      <div ref={trailRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:99997,
        width:7, height:7, borderRadius:'50%',
        background:'rgba(201,168,76,0.55)',
        transform:'translate(-50%,-50%)',
        boxShadow:'0 0 6px rgba(201,168,76,0.4)',
      }}/>

      {/* Trail 2 — point plus grand et plus lent */}
      <div ref={trail2Ref} style={{
        position:'fixed', pointerEvents:'none', zIndex:99996,
        width:12, height:12, borderRadius:'50%',
        background:'rgba(201,168,76,0.12)',
        border:'1px solid rgba(201,168,76,0.25)',
        transform:'translate(-50%,-50%)',
      }}/>
    </>
  );
}
