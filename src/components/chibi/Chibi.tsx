'use client';
import { motion, AnimatePresence } from 'framer-motion';

const G = 'rgba(201,168,76,';
const T = 'rgba(80,200,200,';

const arm_L = <rect x="31" y="100" width="18" height="27" rx="7" fill={G+'0.2)'} stroke={G+'0.62)'} strokeWidth="1.5" transform="rotate(12 40 113)"/>;
const arm_R = <rect x="111" y="100" width="18" height="27" rx="7" fill={G+'0.2)'} stroke={G+'0.62)'} strokeWidth="1.5" transform="rotate(-12 120 113)"/>;
const arm_R_up = <rect x="111" y="88" width="18" height="27" rx="7" fill={G+'0.2)'} stroke={G+'0.62)'} strokeWidth="1.5" transform="rotate(-38 120 100)"/>;
const arm_L_up = <rect x="31" y="88" width="18" height="27" rx="7" fill={G+'0.2)'} stroke={G+'0.62)'} strokeWidth="1.5" transform="rotate(38 40 100)"/>;

const props: Record<string, React.ReactNode> = {
  pointer: <>{arm_L}<rect x="108" y="102" width="32" height="11" rx="5.5" fill={G+'0.22)'} stroke={G+'0.65)'} strokeWidth="1.5" transform="rotate(-8 124 107)"/><rect x="136" y="97" width="3" height="26" rx="1.5" fill={G+'0.88)'} transform="rotate(-8 137.5 110)"/><circle cx="147" cy="86" r="3.5" fill="rgba(255,60,60,0.9)"/><line x1="147" y1="86" x2="158" y2="68" stroke="rgba(255,80,80,0.4)" strokeWidth="1" strokeDasharray="3,2"/></>,
  scroll: <>{arm_L}<rect x="112" y="100" width="18" height="28" rx="7" fill={G+'0.2)'} stroke={G+'0.62)'} strokeWidth="1.5" transform="rotate(18 121 114)"/><rect x="28" y="118" width="104" height="56" rx="5" fill={G+'0.14)'} stroke={G+'0.62)'} strokeWidth="1.5"/><ellipse cx="28" cy="146" rx="6" ry="28" fill={G+'0.28)'} stroke={G+'0.65)'} strokeWidth="1.5"/><ellipse cx="132" cy="146" rx="6" ry="28" fill={G+'0.28)'} stroke={G+'0.65)'} strokeWidth="1.5"/><line x1="42" y1="130" x2="118" y2="130" stroke={G+'0.48)'} strokeWidth="1"/><line x1="42" y1="141" x2="100" y2="141" stroke={G+'0.34)'} strokeWidth="1"/><circle cx="42" cy="130" r="3" fill={G+'0.82)'}/><circle cx="42" cy="141" r="3" fill={G+'0.82)'}/></>,
  telescope: <>{arm_L}<rect x="108" y="96" width="18" height="28" rx="7" fill={G+'0.2)'} stroke={G+'0.62)'} strokeWidth="1.5" transform="rotate(-28 117 110)"/><rect x="114" y="68" width="42" height="17" rx="7" fill={G+'0.28)'} stroke={G+'0.72)'} strokeWidth="1.5" transform="rotate(-32 135 76)"/><circle cx="152" cy="50" r="5.5" fill={T+'0.42)'} stroke={T+'0.68)'} strokeWidth="1"/><text x="136" y="36" fontSize="10" fill={G+'0.68)'}>★</text></>,
  calculator: <>{arm_L}<rect x="112" y="100" width="18" height="26" rx="7" fill={G+'0.2)'} stroke={G+'0.62)'} strokeWidth="1.5" transform="rotate(22 121 113)"/><rect x="42" y="118" width="76" height="55" rx="5" fill={G+'0.16)'} stroke={G+'0.62)'} strokeWidth="1.5"/><rect x="50" y="124" width="60" height="16" rx="3" fill={T+'0.18)'} stroke={T+'0.48)'} strokeWidth="1"/><text x="54" y="136" fontFamily="monospace" fontSize="8" fill={T+'0.88)'}>42.0 %</text><rect x="57" y="55" width="19" height="14" rx="4" fill="none" stroke={G+'0.9)'} strokeWidth="2"/><rect x="84" y="55" width="19" height="14" rx="4" fill="none" stroke={G+'0.9)'} strokeWidth="2"/><line x1="76" y1="62" x2="84" y2="62" stroke={G+'0.9)'} strokeWidth="2"/></>,
  clipboard: <>{arm_L}<rect x="18" y="88" width="50" height="68" rx="4" fill={G+'0.16)'} stroke={G+'0.62)'} strokeWidth="1.5"/><rect x="34" y="82" width="18" height="12" rx="3" fill={G+'0.32)'} stroke={G+'0.68)'} strokeWidth="1.5"/><line x1="26" y1="104" x2="61" y2="104" stroke={G+'0.42)'} strokeWidth="1"/><line x1="26" y1="114" x2="55" y2="114" stroke={G+'0.32)'} strokeWidth="1"/><line x1="26" y1="124" x2="58" y2="124" stroke={G+'0.32)'} strokeWidth="1"/><path d="M26 103 l3 3 l5 -6" fill="none" stroke={G+'0.82)'} strokeWidth="1.5" strokeLinecap="round"/><rect x="110" y="98" width="18" height="26" rx="7" fill={G+'0.2)'} stroke={G+'0.62)'} strokeWidth="1.5" transform="rotate(22 119 111)"/><rect x="127" y="118" width="4" height="22" rx="2" fill={G+'0.85)'} transform="rotate(-28 129 129)"/><polygon points="126,140 130,140 128,148" fill={G+'1.0)'} transform="rotate(-28 128 140)"/></>,
  trophy: <>{arm_L_up}{arm_R_up}<path d="M65 35 L95 35 L91 62 Q80 70 69 62 Z" fill={G+'0.32)'} stroke={G+'0.82)'} strokeWidth="1.5"/><path d="M65 43 Q54 48 58 57 Q65 63 69 60" fill="none" stroke={G+'0.78)'} strokeWidth="2"/><path d="M95 43 Q106 48 102 57 Q95 63 91 60" fill="none" stroke={G+'0.78)'} strokeWidth="2"/><rect x="76" y="62" width="8" height="12" rx="2" fill={G+'0.68)'} stroke={G+'0.82)'} strokeWidth="1"/><rect x="68" y="74" width="24" height="7" rx="3.5" fill={G+'0.68)'} stroke={G+'0.82)'} strokeWidth="1.5"/><text x="71" y="55" fontSize="14" fill="rgba(255,220,80,0.92)">★</text></>,
  wand: <>{arm_L}{arm_R_up}<line x1="128" y1="78" x2="148" y2="38" stroke={G+'0.82)'} strokeWidth="2" strokeLinecap="round"/><polygon points="148,14 152,26 164,26 155,33 158,45 148,38 138,45 141,33 132,26 144,26" fill={G+'0.75)'} stroke="rgba(255,220,80,0.9)" strokeWidth="1"/></>,
};

interface ChibiProps { type: string; visible: boolean; }

export default function Chibi({ type, visible }: ChibiProps) {
  const prop = props[type] || props.pointer;
  const id = type + Math.random().toString(36).slice(2,6);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={{ position:'absolute', bottom:0, right:12, width:160, height:195, pointerEvents:'none', zIndex:20 }}
          initial={{ opacity: 0, x: 40, scale: 0.7 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.8 }}
          transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
        >
          <svg className="chibi-float w-full h-full" viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 0 10px rgba(201,168,76,0.22))' }}>
            <defs>
              <filter id={`cg${id}`} x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="2.8" result="b"/>
                <feComposite in="SourceGraphic" in2="b" operator="over"/>
              </filter>
            </defs>
            <ellipse cx="80" cy="196" rx="38" ry="5" fill={G+'0.18)'}/>
            <rect x="55" y="152" width="20" height="34" rx="8" fill={G+'0.2)'} stroke={G+'0.6)'} strokeWidth="1.5"/>
            <rect x="85" y="152" width="20" height="34" rx="8" fill={G+'0.2)'} stroke={G+'0.6)'} strokeWidth="1.5"/>
            <ellipse cx="65" cy="185" rx="14" ry="6" fill={G+'0.28)'} stroke={G+'0.6)'} strokeWidth="1.5"/>
            <ellipse cx="95" cy="185" rx="14" ry="6" fill={G+'0.28)'} stroke={G+'0.6)'} strokeWidth="1.5"/>
            <rect x="47" y="97" width="66" height="58" rx="13" fill={G+'0.18)'} stroke={G+'0.62)'} strokeWidth="1.5"/>
            <rect x="47" y="105" width="66" height="5" rx="2" fill={T+'0.42)'}/>
            <rect x="68" y="89" width="24" height="14" rx="6" fill={G+'0.2)'} stroke={G+'0.6)'} strokeWidth="1.5"/>
            <circle cx="80" cy="64" r="31" fill={G+'0.22)'} stroke={G+'0.7)'} strokeWidth="1.5" filter={`url(#cg${id})`}/>
            <circle cx="53" cy="40" r="11" fill={G+'0.18)'} stroke={G+'0.65)'} strokeWidth="1.5"/>
            <circle cx="107" cy="40" r="11" fill={G+'0.18)'} stroke={G+'0.65)'} strokeWidth="1.5"/>
            <circle cx="53" cy="40" r="5.5" fill={G+'0.36)'}/>
            <circle cx="107" cy="40" r="5.5" fill={G+'0.36)'}/>
            <circle cx="70" cy="61" r="5.5" fill={G+'0.9)'} filter={`url(#cg${id})`}/>
            <circle cx="90" cy="61" r="5.5" fill={G+'0.9)'} filter={`url(#cg${id})`}/>
            <circle cx="71" cy="59" r="2.2" fill="rgba(3,6,16,0.95)"/>
            <circle cx="91" cy="59" r="2.2" fill="rgba(3,6,16,0.95)"/>
            <circle cx="72" cy="58" r="0.9" fill="white" opacity="0.6"/>
            <circle cx="92" cy="58" r="0.9" fill="white" opacity="0.6"/>
            <ellipse cx="80" cy="72" rx="5.5" ry="3.5" fill={G+'0.58)'}/>
            <path d="M73 78 Q80 85 87 78" fill="none" stroke={G+'0.5)'} strokeWidth="1.5" strokeLinecap="round"/>
            {prop}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
