'use client';
import { motion } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import Chibi from '../chibi/Chibi';

interface Props { isActive: boolean; }

export default function CoverSlide({ isActive }: Props) {
  const { content, setContent, mode } = useDossier();
  const editable = mode === 'admin';
  const get = (k: string, def: string) => content[k] ?? def;
  const set = (k: string) => (e: React.FormEvent<HTMLDivElement>) => {
    setContent(k, (e.target as HTMLDivElement).innerHTML);
  };

  return (
    <div className="absolute inset-0 bg-slide-cover overflow-hidden flex flex-col items-center justify-center">
      {/* Grid bg */}
      <div className="absolute inset-0 animate-breathe pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)',
        backgroundSize: '60px 60px', opacity: 0.03,
      }}/>
      {/* Scan line */}
      <div className="absolute left-0 right-0 h-[3px] pointer-events-none" style={{
        background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.1),transparent)',
        animation: 'scan 5s linear infinite',
      }}/>
      {/* Decorative SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {[0,1,2,3,4,5,6,7].map((i) => (
          <rect key={i} x={1700+i*20} y={910-i*40} width="15" height={50+i*40} fill="#C9A84C" opacity={0.25+Math.floor(i/2)*0.04} rx="2"/>
        ))}
        <polyline points="1555,950 1598,858 1642,788 1690,668" fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" opacity="0.26" strokeDasharray="300" style={{ strokeDashoffset: 0, animation: 'none' }}/>
        <circle cx="1690" cy="668" r="6" fill="#C9A84C" opacity="0.3"/>
        <circle cx="960" cy="540" r="520" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.025"/>
        <circle cx="960" cy="540" r="720" fill="none" stroke="#C9A84C" strokeWidth="0.5" opacity="0.015"/>
        <line x1="0" y1="964" x2="1920" y2="964" stroke="#C9A84C" strokeWidth="0.7" opacity="0.05"/>
      </svg>

      {/* Corners */}
      {[['top-4 left-4','border-t border-l'],['top-4 right-4','border-t border-r'],['bottom-4 left-4','border-b border-l'],['bottom-4 right-4','border-b border-r']].map(([pos,brd],i)=>(
        <div key={i} className={`absolute ${pos} w-8 h-8 pointer-events-none`} style={{ borderWidth:1, borderColor:'rgba(201,168,76,0.18)', borderStyle: brd.includes('border-t')&&brd.includes('border-l') ? 'solid' : brd.includes('border-t')&&brd.includes('border-r') ? 'solid' : 'solid' }}/>
      ))}

      {/* Badge */}
      <motion.div initial={{scale:0.8,opacity:0}} animate={{opacity:1,scale:1}} transition={{delay:0.2}}
        className="animate-glow-pulse mb-7 relative flex items-center justify-center text-6xl z-10"
        style={{ width:130, height:130, borderRadius:'50%', border:'2px solid #C9A84C', background:'radial-gradient(circle,#1C2535 60%,#0D1117)' }}>
        🦅
      </motion.div>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
        contentEditable={editable} suppressContentEditableWarning onInput={set('c0')}
        className="font-cinzel text-[13px] tracking-[6px] uppercase mb-3.5 z-10 relative"
        style={{ color: '#8B6914' }}
        dangerouslySetInnerHTML={{ __html: get('c0', `${CONFIG.candidat.departement} — ${CONFIG.candidat.ville}`) }}
      />

      <motion.h1 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
        contentEditable={editable} suppressContentEditableWarning onInput={set('c1')}
        className="font-cinzel font-bold text-[70px] uppercase leading-tight tracking-wider text-center z-10 relative animate-glitch"
        style={{ color: '#C9A84C', textShadow:'0 4px 30px rgba(201,168,76,0.2)' }}
        dangerouslySetInnerHTML={{ __html: get('c1', 'Dossier de Candidature') }}
      />

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
        contentEditable={editable} suppressContentEditableWarning onInput={set('c2')}
        className="text-[16px] tracking-[5px] uppercase z-10 relative mb-9"
        style={{ color: '#A89878' }}
        dangerouslySetInnerHTML={{ __html: get('c2', CONFIG.candidat.poste) }}
      />

      <div className="w-44 h-px mb-9 z-10" style={{ background:'linear-gradient(90deg,transparent,#C9A84C,transparent)' }}/>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.6}}
        className="flex gap-20 z-10">
        {[['c3','Candidat',CONFIG.candidat.nomComplet],['c4','Poste visé','Head of Consulting'],['c5','Département',CONFIG.candidat.departement.split('—')[0].trim()],['c6','Date',CONFIG.candidat.annee]].map(([k,lbl,def])=>(
          <div key={k} className="text-center">
            <div className="font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color:'#8B6914' }}>{lbl}</div>
            <div contentEditable={editable} suppressContentEditableWarning onInput={set(k)}
              className="font-cinzel text-[15px] font-semibold" style={{ color:'#F0E8D0' }}
              dangerouslySetInnerHTML={{ __html: get(k, def) }}
            />
          </div>
        ))}
      </motion.div>

      <Chibi type="wand" visible={isActive}/>
    </div>
  );
}
