'use client';
import { motion } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import SlideLayout from './SlideLayout';
import Chibi from '../chibi/Chibi';

type Chapter = typeof CONFIG.slides[1] & { type: 'chapter' };

interface Props { slide: any; isActive: boolean; }

const fadeUp = (i: number) => ({ initial:{opacity:0,y:16}, animate:{opacity:1,y:0}, transition:{delay:i*0.08, ease:[0.22,1,0.36,1]} });

function Block({ titre, children, delay=0 }: { titre:string; children:React.ReactNode; delay?:number }) {
  return (
    <motion.div {...fadeUp(delay)} className="p-5 flex-shrink-0" style={{ background:'rgba(255,255,255,0.012)', border:'1px solid rgba(201,168,76,0.082)', borderLeft:'3px solid #8B6914', borderRadius:2 }}>
      <div className="font-cinzel text-[11px] tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color:'#C9A84C' }}>
        {titre}
        <div className="flex-1 h-px" style={{ background:'rgba(201,168,76,0.088)' }}/>
      </div>
      {children}
    </motion.div>
  );
}

function EditableText({ sk, html, className, style }: any) {
  const { content, setContent, mode } = useDossier();
  const editable = mode === 'admin';
  const val = content[sk] ?? html;
  return (
    <div contentEditable={editable} suppressContentEditableWarning
      onInput={e => setContent(sk, (e.target as HTMLDivElement).innerHTML)}
      className={className} style={style}
      dangerouslySetInnerHTML={{ __html: val }}
    />
  );
}

export default function ChapterSlide({ slide, isActive }: Props) {
  const c = slide.content;

  return (
    <div className={`absolute inset-0 bg-${slide.bg} overflow-hidden`}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.022) 3px,rgba(0,0,0,0.022) 4px)' }}/>
      {[['top-4 left-4','top left'],['top-4 right-4','top right'],['bottom-4 left-4','bottom left'],['bottom-4 right-4','bottom right']].map(([pos],i)=>(
        <div key={i} className={`absolute ${pos} w-8 h-8 pointer-events-none`} style={{ border:'1px solid rgba(201,168,76,0.16)', borderRadius:0 }}/>
      ))}

      {/* Chapter header */}
      <div className="relative flex flex-col justify-center px-24 h-[185px]" style={{ borderBottom:'1px solid rgba(201,168,76,0.1)' }}>
        <div className="font-cinzel text-[12px] tracking-[4px] uppercase mb-2.5" style={{ color:'#8B6914' }}>Chapitre {slide.numero}</div>
        <EditableText sk={`h${slide.numero}`} html={c.titre}
          className="font-cinzel font-semibold text-[42px] uppercase tracking-wide animate-glitch" style={{ color:'#C9A84C' }}/>
        <div className="absolute right-24 top-1/2 -translate-y-1/2 text-[60px] pointer-events-none" style={{ opacity:0.12 }}>{slide.icon}</div>
        <div className="absolute bottom-0 left-0 right-0 h-px shimmer opacity-20"/>
      </div>

      {/* Content — rendered per slide type */}
      <div className="px-24 pt-10 pb-8" style={{ height:'calc(100% - 185px)', overflow:'hidden' }}>
        {slide.id === 'intro' && <IntroContent slide={slide}/>}
        {slide.id === 'parcours' && <ParcoursContent slide={slide}/>}
        {slide.id === 'vision' && <VisionContent slide={slide}/>}
        {slide.id === 'systemes' && <SystemesContent slide={slide}/>}
        {slide.id === 'leadership' && <LeadershipContent slide={slide}/>}
        {slide.id === 'conclusion' && <ConclusionContent slide={slide}/>}
      </div>

      <Chibi type={slide.chibi} visible={isActive}/>
    </div>
  );
}

function IntroContent({ slide }: any) {
  return (
    <div className="grid grid-cols-2 gap-7 h-full">
      <div className="flex flex-col gap-5">
        {slide.content.blocs.slice(0,1).map((b:any, i:number) => (
          <Block key={b.key} titre={b.titre} delay={i}>
            <EditableText sk={`intro_${b.key}`} html={b.texte.replace(/\n\n/g,'<br/><br/>')}
              className="text-[17px] leading-[1.75] font-light" style={{ color:'#F0E8D0', whiteSpace:'pre-wrap' }}/>
          </Block>
        ))}
      </div>
      <div className="flex flex-col gap-5">
        {slide.content.blocs.slice(1).map((b:any, i:number) => (
          <Block key={b.key} titre={b.titre} delay={i+1}>
            <EditableText sk={`intro_${b.key}`} html={b.texte.replace(/\n\n/g,'<br/><br/>')}
              className="text-[17px] leading-[1.75] font-light" style={{ color:'#F0E8D0' }}/>
          </Block>
        ))}
      </div>
    </div>
  );
}

function ParcoursContent({ slide }: any) {
  const c = slide.content;
  return (
    <div className="grid grid-cols-2 gap-7 h-full">
      <Block titre="Trajectoire Professionnelle" delay={0}>
        <div className="relative pl-6">
          <div className="absolute left-1.5 top-0 bottom-0 w-px" style={{ background:'linear-gradient(180deg,#8B6914,transparent)' }}/>
          {c.timeline.map((t:any, i:number) => (
            <div key={i} className="relative mb-5">
              <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full dot-glow" style={{ background:'#C9A84C', border:'1px solid #8B6914', animationDelay:`${i*0.6}s` }}/>
              <EditableText sk={`parc_r${i}`} html={t.role} className="text-[15px] font-semibold" style={{ color:'#E8C97A' }}/>
              <EditableText sk={`parc_o${i}`} html={t.org} className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color:'#8B6914' }}/>
              <EditableText sk={`parc_d${i}`} html={t.desc} className="text-[14px]" style={{ color:'#A89878', lineHeight:1.5 }}/>
            </div>
          ))}
        </div>
      </Block>
      <div className="flex flex-col gap-5">
        <Block titre="Chiffres Clés" delay={1}>
          <div className="flex gap-4">
            {c.stats.map((s:any,i:number)=>(
              <div key={i} className="flex-1 p-4 text-center" style={{ background:'rgba(201,168,76,0.03)', border:'1px solid rgba(201,168,76,0.088)', borderTop:'2px solid #C9A84C' }}>
                <EditableText sk={`parc_sv${i}`} html={s.valeur} className="font-cinzel text-[38px] font-bold" style={{ color:'#C9A84C' }}/>
                <EditableText sk={`parc_sl${i}`} html={s.label} className="font-mono text-[10px] tracking-widest uppercase mt-1.5" style={{ color:'#A89878' }}/>
              </div>
            ))}
          </div>
        </Block>
        <Block titre="Compétences Clés" delay={2}>
          <ul style={{ listStyle:'none' }}>
            {c.competences.map((ck:string,i:number)=>(
              <li key={i} className="py-2 pl-5 relative text-[16px] font-light border-b" style={{ color:'#F0E8D0', borderColor:'rgba(201,168,76,0.045)', lineHeight:1.55 }}>
                <span className="absolute left-0 text-[11px]" style={{ color:'#C9A84C' }}>▸</span>
                <EditableText sk={`parc_ck${i}`} html={ck} className="inline" style={{}}/>
              </li>
            ))}
          </ul>
        </Block>
      </div>
    </div>
  );
}

function VisionContent({ slide }: any) {
  const c = slide.content;
  return (
    <div className="flex flex-col gap-5 h-full">
      <Block titre="Objectif Stratégique" delay={0}>
        <EditableText sk="vision_obj" html={c.objectif} className="text-[17px] leading-[1.75] font-light" style={{ color:'#F0E8D0' }}/>
      </Block>
      <div className="grid grid-cols-2 gap-5 flex-1">
        <Block titre="Axes de Développement" delay={1}>
          <ul style={{ listStyle:'none' }}>
            {c.axes.map((a:string,i:number)=>(
              <li key={i} className="py-2 pl-5 relative text-[15px] font-light border-b" style={{ color:'#F0E8D0', borderColor:'rgba(201,168,76,0.045)' }}>
                <span className="absolute left-0 text-[11px]" style={{ color:'#C9A84C' }}>▸</span>
                <EditableText sk={`vis_ax${i}`} html={a} className="inline" style={{}}/>
              </li>
            ))}
          </ul>
        </Block>
        <Block titre="Piliers Fondateurs" delay={2}>
          <div className="grid grid-cols-2 gap-3">
            {c.piliers.map((p:any,i:number)=>(
              <div key={i} className="p-4" style={{ border:'1px solid rgba(201,168,76,0.11)', borderRadius:2 }}>
                <div className="font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color:'#C9A84C' }}>{p.titre}</div>
                <EditableText sk={`vis_pi${i}`} html={p.desc} className="text-[14px]" style={{ color:'#A89878', lineHeight:1.55 }}/>
              </div>
            ))}
          </div>
        </Block>
      </div>
    </div>
  );
}

function SystemesContent({ slide }: any) {
  const c = slide.content;
  return (
    <div className="grid grid-cols-2 gap-7 h-full">
      <div className="flex flex-col gap-5">
        <Block titre="Diagnostic d'Entreprise" delay={0}>
          <EditableText sk="sys_diag" html={c.diagnostic} className="text-[17px] leading-[1.75] font-light" style={{ color:'#F0E8D0' }}/>
        </Block>
        <Block titre="Segmentation Clients" delay={1}>
          <div className="grid grid-cols-2 gap-3">
            {c.segments.map((s:any,i:number)=>(
              <div key={i} className="p-4" style={{ border:`1px solid rgba(201,168,76,${s.premium?'0.2':'0.088'})`, borderTop:`2px solid ${s.premium?'#C9A84C':'#8B6914'}`, borderRadius:2 }}>
                <div className="font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color: s.premium?'#C9A84C':'#A89878' }}>{s.titre}</div>
                <EditableText sk={`sys_seg${i}`} html={s.desc} className="text-[14px]" style={{ color:'#F0E8D0', lineHeight:1.5 }}/>
              </div>
            ))}
          </div>
        </Block>
      </div>
      <Block titre="Systèmes Déployés" delay={2}>
        <ul style={{ listStyle:'none' }}>
          {c.systemes.map((s:string,i:number)=>(
            <li key={i} className="py-2.5 pl-5 relative text-[16px] font-light border-b" style={{ color:'#F0E8D0', borderColor:'rgba(201,168,76,0.045)', lineHeight:1.55 }}>
              <span className="absolute left-0 text-[11px]" style={{ color:'#C9A84C' }}>▸</span>
              <EditableText sk={`sys_s${i}`} html={s} className="inline" style={{}}/>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

function LeadershipContent({ slide }: any) {
  const c = slide.content;
  return (
    <div className="grid grid-cols-2 gap-7 h-full">
      <div className="flex flex-col gap-5">
        <Block titre="Structure de l'Équipe" delay={0}>
          <EditableText sk="lead_struct" html={c.structure} className="text-[17px] leading-[1.75] font-light" style={{ color:'#F0E8D0' }}/>
        </Block>
        <Block titre="Philosophie de Leadership" delay={1}>
          <EditableText sk="lead_phil" html={c.philosophie} className="text-[17px] leading-[1.75] font-light" style={{ color:'#F0E8D0' }}/>
        </Block>
      </div>
      <Block titre="Standards & Méthodes" delay={2}>
        <ul style={{ listStyle:'none' }}>
          {c.methodes.map((m:string,i:number)=>(
            <li key={i} className="py-2.5 pl-5 relative text-[16px] font-light border-b" style={{ color:'#F0E8D0', borderColor:'rgba(201,168,76,0.045)', lineHeight:1.55 }}>
              <span className="absolute left-0 text-[11px]" style={{ color:'#C9A84C' }}>▸</span>
              <EditableText sk={`lead_m${i}`} html={m} className="inline" style={{}}/>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

function ConclusionContent({ slide }: any) {
  const c = slide.content;
  return (
    <div className="flex flex-col gap-5 pb-4" style={{ height:'100%' }}>
      <div className="grid grid-cols-2 gap-5">
        <Block titre="Impact sur le Serveur" delay={0}>
          <ul style={{ listStyle:'none' }}>
            {c.impacts.map((im:string,i:number)=>(
              <li key={i} className="py-2 pl-5 relative text-[15px] font-light border-b" style={{ color:'#F0E8D0', borderColor:'rgba(201,168,76,0.045)' }}>
                <span className="absolute left-0 text-[11px]" style={{ color:'#C9A84C' }}>▸</span>
                <EditableText sk={`conc_im${i}`} html={im} className="inline" style={{}}/>
              </li>
            ))}
          </ul>
        </Block>
        <Block titre="Conclusion" delay={1}>
          <EditableText sk="conc_txt" html={c.conclusion.replace(/\n\n/g,'<br/><br/>')} className="text-[16px] leading-[1.75] font-light" style={{ color:'#F0E8D0' }}/>
        </Block>
      </div>
      <motion.div {...fadeUp(3)} className="p-7 mt-auto" style={{ background:'linear-gradient(135deg,rgba(201,168,76,0.045),rgba(201,168,76,0.016))', border:'1px solid rgba(201,168,76,0.16)', borderLeft:'4px solid #C9A84C' }}>
        <EditableText sk="conc_cit" html={c.citation}
          className="font-cinzel text-[20px] italic mb-3.5" style={{ color:'#E8C97A', lineHeight:1.55 }}/>
        <EditableText sk="conc_sig" html={c.signataire}
          className="font-mono text-[11px] tracking-widest uppercase" style={{ color:'#8B6914' }}/>
      </motion.div>
    </div>
  );
}
