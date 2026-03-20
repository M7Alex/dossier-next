'use client';
import { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import Counter from '../ui/Counter';
import RadarChart from '../ui/RadarChart';

const G = '#C9A84C';

// Typewriter hook
function useTypewriter(text: string, active: boolean, speed=22, delay=200) {
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) return;
    setOut(''); setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) { setDone(true); clearInterval(iv); }
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, active]);
  return { out, done };
}

// Editable text helper
function E({ sk, html, className, style, tag='div' }: { sk:string; html:string; className?:string; style?:React.CSSProperties; tag?:string }) {
  const { content, setContent, mode } = useDossier();
  const editable = mode === 'admin';
  const val = content[sk] ?? html;
  const Tag = tag as any;
  return (
    <Tag contentEditable={editable} suppressContentEditableWarning
      onInput={(e:any) => setContent(sk, (e.target as HTMLElement).innerHTML)}
      className={className} style={style}
      dangerouslySetInnerHTML={{ __html: val }}
    />
  );
}

// Block wrapper
function Block({ titre, children, delay=0, flex=false }: { titre:string; children:React.ReactNode; delay?:number; flex?:boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true });
  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y:18 }} animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ delay: delay*0.09, ease:[0.22,1,0.36,1] }}
      style={{ padding:'22px 26px', background:'rgba(255,255,255,0.012)', border:'1px solid rgba(201,168,76,0.08)', borderLeft:'3px solid #8B6914', borderRadius:2, flexShrink:0, ...(flex ? { flex:1 } : {}) }}>
      <div style={{ fontFamily:'Cinzel,serif', fontSize:11, color:G, letterSpacing:2, textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
        {titre}<div style={{ flex:1, height:1, background:'rgba(201,168,76,0.08)' }}/>
      </div>
      {children}
    </motion.div>
  );
}

const BX = { fontSize:17, lineHeight:1.78, color:'#F0E8D0', fontWeight:300, fontFamily:'Raleway,sans-serif' };
const LI_STYLE = { padding:'9px 0 9px 22px', position:'relative' as const, fontSize:16, color:'#F0E8D0', fontWeight:300, borderBottom:'1px solid rgba(201,168,76,0.045)', lineHeight:1.55, fontFamily:'Raleway,sans-serif' };

export default function ChapterSlide({ slide, isActive }: { slide:any; isActive:boolean }) {
  const c = slide.content;
  const { mode, content, setContent } = useDossier();
  const editable = mode === 'admin';
  const rawTitle = (content[`h${slide.numero}`] || c.titre).replace(/<[^>]*>/g,'');
  const { out: twTitle, done: twDone } = useTypewriter(rawTitle, isActive);

  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', background:'transparent' }}>

      {/* Scan lines overlay */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
        backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.022) 3px,rgba(0,0,0,0.022) 4px)' }}/>



      {/* Header */}
      <div style={{ position:'relative', zIndex:3, height:185, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 100px', borderBottom:'1px solid rgba(201,168,76,0.1)' }}>
        <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.05 }}
          style={{ fontFamily:'Cinzel,serif', fontSize:12, color:'#8B6914', letterSpacing:4, textTransform:'uppercase', marginBottom:10 }}>
          Chapitre {slide.numero}
        </motion.div>
        {/* Typewriter on title */}
        <div style={{ fontFamily:'Cinzel,serif', fontSize:42, color:G, fontWeight:600, textTransform:'uppercase', letterSpacing:2 }}>
          {isActive ? twTitle : rawTitle}
          {!twDone && isActive && <span style={{ opacity:0.7, color:G }}>|</span>}
        </div>
        <div style={{ position:'absolute', right:100, top:'50%', transform:'translateY(-50%)', fontSize:60, opacity:0.1, pointerEvents:'none' }}>{slide.icon}</div>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${G},transparent)`, opacity:0.2 }}/>
      </div>

      {/* Content */}
      <div style={{ position:'relative', zIndex:3, padding:'40px 100px', height:'calc(100% - 185px)', overflow:'hidden' }}>
        {slide.id === 'intro'      && <IntroContent c={c} editable={editable}/>}
        {slide.id === 'parcours'   && <ParcoursContent c={c} editable={editable}/>}
        {slide.id === 'vision'     && <VisionContent c={c} editable={editable}/>}
        {slide.id === 'systemes'   && <SystemesContent c={c} editable={editable}/>}
        {slide.id === 'leadership' && <LeadershipContent c={c} editable={editable}/>}
        {slide.id === 'conclusion' && <ConclusionContent c={c} editable={editable}/>}
        {slide.id === 'custom'     && <CustomContent c={c} editable={editable} id={slide.id}/>}
      </div>

    </div>
  );
}

function IntroContent({ c, editable }: any) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, height:'100%' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <Block titre="Positionnement" delay={0}>
          <E sk="intro_pos" html={c.blocs[0].texte.replace(/\n\n/g,'<br/><br/>')} style={BX}/>
        </Block>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <Block titre="Contexte & Ambition" delay={1}>
          <E sk="intro_ctx" html={c.blocs[1].texte.replace(/\n\n/g,'<br/><br/>')} style={BX}/>
        </Block>
        <Block titre="Engagement" delay={2}>
          <E sk="intro_eng" html={c.blocs[2].texte} style={BX}/>
        </Block>
      </div>
    </div>
  );
}

function ParcoursContent({ c, editable }: any) {
  const { content, setContent } = useDossier();
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, height:'100%' }}>
      <Block titre="Trajectoire Professionnelle" delay={0} flex>
        <div style={{ position:'relative', paddingLeft:26 }}>
          <div style={{ position:'absolute', left:7, top:0, bottom:0, width:1, background:'linear-gradient(180deg,#8B6914,transparent)' }}/>
          {c.timeline.map((_: any, i: number) => (
            <div key={i} style={{ position:'relative', marginBottom:18 }}>
              <div style={{ position:'absolute', left:-19, top:5, width:10, height:10, borderRadius:'50%', background:G, border:'1px solid #8B6914', boxShadow:`0 0 8px rgba(201,168,76,0.5)` }}/>
              <E sk={`parc_r${i}`} html={c.timeline[i].role} style={{ fontSize:15, fontWeight:600, color:'#E8C97A', fontFamily:'Raleway,sans-serif' }}/>
              <E sk={`parc_o${i}`} html={c.timeline[i].org} style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#8B6914', letterSpacing:2, textTransform:'uppercase', marginBottom:3 }}/>
              <E sk={`parc_d${i}`} html={c.timeline[i].desc} style={{ fontSize:14, color:'#A89878', lineHeight:1.5, fontFamily:'Raleway,sans-serif' }}/>
            </div>
          ))}
        </div>
      </Block>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <Block titre="Chiffres Clés" delay={1}>
          <div style={{ display:'flex', gap:16 }}>
            {c.stats.map((s: any, i: number) => (
              <Counter key={i} value={content[`parc_sv${i}`] || s.valeur} label={content[`parc_sl${i}`] || s.label} delay={i*200} editable={editable}
                onValueChange={v => setContent(`parc_sv${i}`, v)} onLabelChange={v => setContent(`parc_sl${i}`, v)}/>
            ))}
          </div>
        </Block>
        <Block titre="Compétences" delay={2} flex>
          <ul style={{ listStyle:'none', margin:0, padding:0 }}>
            {c.competences.map((_: any, i: number) => (
              <li key={i} style={LI_STYLE}>
                <span style={{ position:'absolute', left:0, color:G, fontSize:11, top:11 }}>▸</span>
                <E sk={`parc_ck${i}`} html={c.competences[i]} style={{ display:'inline' }}/>
              </li>
            ))}
          </ul>
        </Block>
      </div>
    </div>
  );
}

function VisionContent({ c, editable }: any) {
  const { content, setContent } = useDossier();
  // Radar chart axes with editable values
  const defaultAxes = [
    { label:'Rigueur',     key:'rad_0', value: parseInt(content['rad_0'] || '88') },
    { label:'Impact',      key:'rad_1', value: parseInt(content['rad_1'] || '92') },
    { label:'Vision',      key:'rad_2', value: parseInt(content['rad_2'] || '85') },
    { label:'Cohérence',   key:'rad_3', value: parseInt(content['rad_3'] || '90') },
    { label:'Leadership',  key:'rad_4', value: parseInt(content['rad_4'] || '87') },
    { label:'Innovation',  key:'rad_5', value: parseInt(content['rad_5'] || '80') },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <Block titre="Objectif Stratégique" delay={0}>
        <E sk="vision_obj" html={c.objectif} style={BX}/>
      </Block>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, flex:1 }}>
        <Block titre="Axes de Développement" delay={1}>
          <ul style={{ listStyle:'none', margin:0, padding:0 }}>
            {c.axes.map((_: any, i: number) => (
              <li key={i} style={LI_STYLE}>
                <span style={{ position:'absolute', left:0, color:G, fontSize:11, top:11 }}>▸</span>
                <E sk={`vis_ax${i}`} html={c.axes[i]} style={{ display:'inline' }}/>
              </li>
            ))}
          </ul>
        </Block>
        <Block titre="Profil de Compétences" delay={2}>
          <RadarChart axes={defaultAxes} editable={editable} onUpdate={(key, val) => setContent(key, String(val))}/>
        </Block>
      </div>
    </div>
  );
}

function SystemesContent({ c, editable }: any) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, height:'100%' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <Block titre="Diagnostic d'Entreprise" delay={0}>
          <E sk="sys_diag" html={c.diagnostic} style={BX}/>
        </Block>
        <Block titre="Segmentation Clients" delay={1}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {c.segments.map((s: any, i: number) => (
              <div key={i} style={{ padding:'16px 20px', border:`1px solid rgba(201,168,76,${s.premium?'0.22':'0.09'})`, borderTop:`2px solid ${s.premium?G:'#8B6914'}`, borderRadius:2 }}>
                <E sk={`sys_seg${i*2}`} html={s.titre} style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, letterSpacing:1, textTransform:'uppercase', marginBottom:6, color: s.premium?G:'#A89878' }}/>
                <E sk={`sys_seg${i*2+1}`} html={s.desc} style={{ fontSize:14, color:'#F0E8D0', lineHeight:1.5, fontFamily:'Raleway,sans-serif' }}/>
              </div>
            ))}
          </div>
        </Block>
      </div>
      <Block titre="Systèmes Déployés" delay={2} flex>
        <ul style={{ listStyle:'none', margin:0, padding:0 }}>
          {c.systemes.map((_: any, i: number) => (
            <li key={i} style={LI_STYLE}>
              <span style={{ position:'absolute', left:0, color:G, fontSize:11, top:11 }}>▸</span>
              <E sk={`sys_s${i}`} html={c.systemes[i]} style={{ display:'inline' }}/>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

function LeadershipContent({ c, editable }: any) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, height:'100%' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <Block titre="Structure de l'Équipe" delay={0}>
          <E sk="lead_struct" html={c.structure} style={BX}/>
        </Block>
        <Block titre="Philosophie" delay={1}>
          <E sk="lead_phil" html={c.philosophie} style={BX}/>
        </Block>
      </div>
      <Block titre="Standards & Méthodes" delay={2} flex>
        <ul style={{ listStyle:'none', margin:0, padding:0 }}>
          {c.methodes.map((_: any, i: number) => (
            <li key={i} style={LI_STYLE}>
              <span style={{ position:'absolute', left:0, color:G, fontSize:11, top:11 }}>▸</span>
              <E sk={`lead_m${i}`} html={c.methodes[i]} style={{ display:'inline' }}/>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

function ConclusionContent({ c, editable }: any) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Block titre="Impact sur le Serveur" delay={0}>
          <ul style={{ listStyle:'none', margin:0, padding:0 }}>
            {c.impacts.map((_: any, i: number) => (
              <li key={i} style={LI_STYLE}>
                <span style={{ position:'absolute', left:0, color:G, fontSize:11, top:11 }}>▸</span>
                <E sk={`conc_im${i}`} html={c.impacts[i]} style={{ display:'inline' }}/>
              </li>
            ))}
          </ul>
        </Block>
        <Block titre="Conclusion" delay={1}>
          <E sk="conc_txt" html={c.conclusion.replace(/\n\n/g,'<br/><br/>')} style={BX}/>
        </Block>
      </div>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
        style={{ marginTop:'auto', padding:'28px 36px', background:'linear-gradient(135deg,rgba(201,168,76,0.05),rgba(201,168,76,0.015))', border:'1px solid rgba(201,168,76,0.18)', borderLeft:'4px solid #C9A84C' }}>
        <E sk="conc_cit" html={`"${c.citation}"`} style={{ fontFamily:'Cinzel,serif', fontSize:20, color:'#E8C97A', fontStyle:'italic', lineHeight:1.55, marginBottom:14, display:'block' }}/>
        <E sk="conc_sig" html={c.signataire} style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, letterSpacing:3, color:'#8B6914', textTransform:'uppercase' }}/>
      </motion.div>
    </div>
  );
}

function CustomContent({ c, editable, id }: any) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, height:'100%' }}>
      {c.blocs?.map((b: any, i: number) => (
        <Block key={b.key} titre={b.titre} delay={i}>
          <E sk={`dyn-${id}-${b.key}`} html={b.texte} style={BX}/>
        </Block>
      ))}
    </div>
  );
}
