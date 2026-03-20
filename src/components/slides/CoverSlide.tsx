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
  const set = (k: string) => (e: React.FormEvent<HTMLDivElement>) =>
    setContent(k, (e.target as HTMLDivElement).innerHTML);

  return (
    // Fully transparent — full-bleed bg from SlideEngine shows through
    <div style={{ position:'absolute', inset:0, overflow:'hidden', background:'transparent',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>

      {/* Grid overlay */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)',
        backgroundSize:'60px 60px', opacity:0.03 }}/>

      {/* Scan line */}
      <div style={{ position:'absolute', left:0, right:0, height:3, pointerEvents:'none',
        background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.1),transparent)',
        animation:'scan 5s linear infinite' }}/>

      {/* Decorative SVG */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
        viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {[0,1,2,3,4,5,6,7].map(i=>(
          <rect key={i} x={1700+i*20} y={910-i*40} width="15" height={50+i*40}
            fill="#C9A84C" opacity={0.22+Math.floor(i/2)*0.04} rx="2"/>
        ))}
        <polyline points="1555,950 1598,858 1642,788 1690,668"
          fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" opacity="0.22"/>
        <circle cx="1690" cy="668" r="6" fill="#C9A84C" opacity="0.28"/>
        <circle cx="960" cy="540" r="520" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.025"/>
        <circle cx="960" cy="540" r="720" fill="none" stroke="#C9A84C" strokeWidth="0.5" opacity="0.015"/>
        <line x1="0" y1="964" x2="1920" y2="964" stroke="#C9A84C" strokeWidth="0.7" opacity="0.05"/>
      </svg>

      {/* 4 corner decorations */}
      <div style={{ position:'absolute', top:24, left:24, width:36, height:36, pointerEvents:'none',
        borderTop:'1.5px solid rgba(201,168,76,0.35)', borderLeft:'1.5px solid rgba(201,168,76,0.35)' }}/>
      <div style={{ position:'absolute', top:24, right:24, width:36, height:36, pointerEvents:'none',
        borderTop:'1.5px solid rgba(201,168,76,0.35)', borderRight:'1.5px solid rgba(201,168,76,0.35)' }}/>
      <div style={{ position:'absolute', bottom:24, left:24, width:36, height:36, pointerEvents:'none',
        borderBottom:'1.5px solid rgba(201,168,76,0.35)', borderLeft:'1.5px solid rgba(201,168,76,0.35)' }}/>
      <div style={{ position:'absolute', bottom:24, right:24, width:36, height:36, pointerEvents:'none',
        borderBottom:'1.5px solid rgba(201,168,76,0.35)', borderRight:'1.5px solid rgba(201,168,76,0.35)' }}/>

      {/* Badge */}
      <motion.div initial={{scale:0.8,opacity:0}} animate={{opacity:1,scale:1}} transition={{delay:0.2}}
        style={{ width:130, height:130, borderRadius:'50%', border:'2px solid #C9A84C',
          background:'radial-gradient(circle,#1C2535 60%,rgba(13,17,23,0.8))',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:58, marginBottom:28, position:'relative', zIndex:2,
          boxShadow:'0 0 40px rgba(201,168,76,0.15)' }}>
        🦅
      </motion.div>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
        contentEditable={editable} suppressContentEditableWarning onInput={set('c0')}
        style={{ fontFamily:'Cinzel,serif', fontSize:13, letterSpacing:6, textTransform:'uppercase',
          marginBottom:14, zIndex:2, position:'relative', color:'#8B6914',
          outline:'none' }}
        dangerouslySetInnerHTML={{ __html: get('c0', `${CONFIG.candidat.departement} — ${CONFIG.candidat.ville}`) }}
      />

      <motion.h1 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
        contentEditable={editable} suppressContentEditableWarning onInput={set('c1')}
        style={{ fontFamily:'Cinzel,serif', fontSize:70, fontWeight:700, textTransform:'uppercase',
          letterSpacing:4, textAlign:'center', zIndex:2, position:'relative',
          color:'#C9A84C', textShadow:'0 4px 30px rgba(201,168,76,0.2)',
          lineHeight:1.1, marginBottom:0, outline:'none' }}
        dangerouslySetInnerHTML={{ __html: get('c1', 'Dossier de Candidature') }}
      />

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
        contentEditable={editable} suppressContentEditableWarning onInput={set('c2')}
        style={{ fontSize:16, letterSpacing:5, textTransform:'uppercase', zIndex:2, position:'relative',
          marginBottom:36, marginTop:10, color:'#A89878', outline:'none' }}
        dangerouslySetInnerHTML={{ __html: get('c2', CONFIG.candidat.poste) }}
      />

      <div style={{ width:176, height:1, marginBottom:36, zIndex:2, position:'relative',
        background:'linear-gradient(90deg,transparent,#C9A84C,transparent)' }}/>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.6}}
        style={{ display:'flex', gap:80, zIndex:2, position:'relative' }}>
        {([['c3','Candidat',CONFIG.candidat.nomComplet],['c4','Poste visé','Head of Consulting'],['c5','Département',CONFIG.candidat.departement.split('—')[0].trim()],['c6','Date',CONFIG.candidat.annee]] as [string,string,string][]).map(([k,lbl,def])=>(
          <div key={k} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, letterSpacing:3, textTransform:'uppercase', marginBottom:6, color:'#8B6914' }}>{lbl}</div>
            <div contentEditable={editable} suppressContentEditableWarning onInput={set(k)}
              style={{ fontFamily:'Cinzel,serif', fontSize:15, fontWeight:600, color:'#F0E8D0', outline:'none' }}
              dangerouslySetInnerHTML={{ __html: get(k, def) }}/>
          </div>
        ))}
      </motion.div>

      {/* Chibi — fixed bottom-right inside the 1920×1080 slide */}
      <Chibi type="wand" visible={isActive}/>
    </div>
  );
}
