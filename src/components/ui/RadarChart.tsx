'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Axis { label: string; value: number; key: string; }

interface Props {
  axes: Axis[];
  editable?: boolean;
  onUpdate?: (key: string, value: number) => void;
}

const G = '#C9A84C';

export default function RadarChart({ axes, editable, onUpdate }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let p = 0;
    const iv = setInterval(() => {
      p += 0.022;
      if (p >= 1) { setProgress(1); clearInterval(iv); }
      else setProgress(p);
    }, 16);
    return () => clearInterval(iv);
  }, [inView]);

  const N = axes.length;
  const cx = 140, cy = 140, R = 110;
  const angles = axes.map((_, i) => (i / N) * Math.PI * 2 - Math.PI / 2);

  const pt = (i: number, r: number) => ({
    x: cx + Math.cos(angles[i]) * r,
    y: cy + Math.sin(angles[i]) * r,
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const polyPts = axes.map((a, i) => {
    const p = pt(i, R * (a.value / 100) * progress);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div ref={ref} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      <svg width={280} height={280} viewBox="0 0 280 280">
        {/* Grid rings */}
        {gridLevels.map((level, li) => (
          <polygon key={li}
            points={axes.map((_,i) => { const p = pt(i, R*level); return `${p.x},${p.y}`; }).join(' ')}
            fill="none" stroke={`rgba(201,168,76,${0.06 + li*0.04})`} strokeWidth="1"
          />
        ))}
        {/* Axes */}
        {axes.map((_, i) => { const p = pt(i, R); return (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(201,168,76,0.15)" strokeWidth="1"/>
        );})}
        {/* Filled area */}
        <polygon points={polyPts} fill="rgba(201,168,76,0.12)" stroke={G} strokeWidth="1.5" strokeLinejoin="round"/>
        {/* Dots */}
        {axes.map((a, i) => {
          const p = pt(i, R * (a.value / 100) * progress);
          return <circle key={i} cx={p.x} cy={p.y} r={4} fill={G} opacity={progress}/>;
        })}
        {/* Labels */}
        {axes.map((a, i) => {
          const p = pt(i, R + 20);
          const anchor = p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle';
          return (
            <text key={i} x={p.x} y={p.y + 4} textAnchor={anchor}
              fontFamily='"Share Tech Mono",monospace' fontSize={9} fill="rgba(201,168,76,0.7)">
              {a.label}
            </text>
          );
        })}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill={G} opacity={0.4}/>
      </svg>

      {/* Editable sliders */}
      {editable && (
        <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%', padding:'0 8px' }}>
          {axes.map(a => (
            <div key={a.key} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, letterSpacing:1, color:'rgba(201,168,76,0.6)', minWidth:90, textTransform:'uppercase' }}>{a.label}</span>
              <input type="range" min={0} max={100} value={a.value}
                onChange={e => onUpdate?.(a.key, Number(e.target.value))}
                style={{ flex:1, accentColor:'#C9A84C', height:3 }}
              />
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#C9A84C', minWidth:28 }}>{a.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
