'use client';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Chibi from '../chibi/Chibi';
import { useDossier } from '@/store';

interface Props {
  bg: string;
  chibi?: string;
  children: ReactNode;
  isActive: boolean;
}

export default function SlideLayout({ bg, chibi, children, isActive }: Props) {
  const { mode } = useDossier();

  return (
    <div className={`absolute inset-0 bg-${bg} overflow-hidden`}>
      {/* Scan line overlay */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px)',
      }}/>
      {/* Corner decorations */}
      {[['top-4 left-4','border-t border-l'],['top-4 right-4','border-t border-r'],['bottom-4 left-4','border-b border-l'],['bottom-4 right-4','border-b border-r']].map(([pos, border], i) => (
        <div key={i} className={`absolute ${pos} w-8 h-8 ${border} pointer-events-none z-10`} style={{ borderColor: 'rgba(201,168,76,0.18)' }}/>
      ))}
      {/* Content */}
      <div className="relative z-20 w-full h-full">{children}</div>
      {/* Chibi */}
      {chibi && <div className="absolute bottom-0 right-0 z-30 pointer-events-none"><Chibi type={chibi} visible={isActive}/></div>}
    </div>
  );
}
