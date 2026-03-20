'use client';
import { useEffect, useState, useRef } from 'react';

interface Props {
  text: string;
  speed?: number; // ms per char
  delay?: number; // initial delay ms
  className?: string;
  style?: React.CSSProperties;
  contentEditable?: boolean;
  onInput?: (e: React.FormEvent<HTMLDivElement>) => void;
}

export default function Typewriter({ text, speed=28, delay=120, className, style, contentEditable, onInput }: Props) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const prevText = useRef('');

  useEffect(() => {
    if (text === prevText.current) return;
    prevText.current = text;
    setDone(false);
    setDisplayed('');
    let i = 0;
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); setDone(true); }
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(start);
  }, [text, speed, delay]);

  if (contentEditable) {
    // In edit mode, skip animation and show full text
    return (
      <div contentEditable suppressContentEditableWarning onInput={onInput}
        className={className} style={style}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  return (
    <span className={className} style={style}>
      {displayed}
      {!done && <span style={{ opacity: Math.round(Date.now()/500)%2===0 ? 1 : 0, color:'#C9A84C', transition:'opacity 0.1s' }}>|</span>}
    </span>
  );
}
