'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Props {
  value: string; // e.g. "6+" or "3"
  label: string;
  delay?: number;
  editable?: boolean;
  onValueChange?: (v: string) => void;
  onLabelChange?: (v: string) => void;
}

export default function Counter({ value, label, delay=0, editable, onValueChange, onLabelChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  // Parse numeric part
  const num = parseInt(value.replace(/\D/g, '')) || 0;
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const dur = 1200;
    const step = 16;
    const inc = num / (dur / step);
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        start += inc;
        if (start >= num) { setCount(num); clearInterval(iv); }
        else setCount(Math.floor(start));
      }, step);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [inView, num, delay]);

  return (
    <div ref={ref} className="flex-1 text-center p-5"
      style={{ background:'rgba(201,168,76,0.03)', border:'1px solid rgba(201,168,76,0.1)', borderTop:'2px solid #C9A84C', borderRadius:2 }}>
      <motion.div initial={{ scale:0.5, opacity:0 }} animate={inView ? { scale:1, opacity:1 } : {}}
        transition={{ delay: delay/1000 + 0.1, type:'spring', stiffness:180 }}>
        <div contentEditable={editable} suppressContentEditableWarning
          onInput={e => onValueChange?.((e.target as HTMLDivElement).textContent || '')}
          className="font-cinzel font-bold" style={{ fontSize:44, color:'#C9A84C', lineHeight:1 }}>
          {editable ? value : `${count}${suffix}`}
        </div>
        <div contentEditable={editable} suppressContentEditableWarning
          onInput={e => onLabelChange?.((e.target as HTMLDivElement).textContent || '')}
          className="font-mono uppercase mt-2" style={{ fontSize:10, letterSpacing:2, color:'#A89878' }}>
          {label}
        </div>
      </motion.div>
    </div>
  );
}
