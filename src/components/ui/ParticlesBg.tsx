'use client';
import { useEffect, useRef } from 'react';

type BgType = 'particles' | 'waves' | 'matrix' | 'constellation' | 'pulse' | 'flow';

interface Props { type?: BgType; slideId?: string; }

export default function ParticlesBg({ type = 'particles', slideId = '' }: Props) {
  const cvs = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    let W = c.offsetWidth || 1920;
    let H = c.offsetHeight || 1080;
    c.width = W; c.height = H;
    let af: number;
    let t = 0;

    const resize = () => {
      W = c.offsetWidth || 1920; H = c.offsetHeight || 1080;
      c.width = W; c.height = H;
    };
    window.addEventListener('resize', resize);

    const G = 'rgba(201,168,76,';
    const T = 'rgba(80,200,200,';
    const P = 'rgba(160,80,220,';

    // ── PARTICLES (Cover + Intro) ──
    if (type === 'particles') {
      const pts = Array.from({ length:45 }, () => ({
        x: Math.random()*1920, y: Math.random()*1080,
        vx: (Math.random()-.5)*.35, vy: (Math.random()-.5)*.35,
        r: .6+Math.random()*1.5, al: .08+Math.random()*.3,
      }));
      const draw = () => {
        ctx.clearRect(0,0,W,H);
        pts.forEach(p => {
          p.x+=p.vx; p.y+=p.vy;
          if(p.x<0)p.x=W; if(p.x>W)p.x=0;
          if(p.y<0)p.y=H; if(p.y>H)p.y=0;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
          ctx.fillStyle=G+p.al+')'; ctx.fill();
        });
        for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
          const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
          if(d<160){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
            ctx.strokeStyle=G+(0.055*(1-d/160))+')'; ctx.lineWidth=.6; ctx.stroke(); }
        }
        af=requestAnimationFrame(draw);
      };
      draw();
    }

    // ── WAVES (Parcours) ──
    else if (type === 'waves') {
      const draw = () => {
        ctx.clearRect(0,0,W,H); t+=0.008;
        for(let layer=0;layer<4;layer++){
          const amp=18+layer*12, freq=0.0012+layer*.0004, spd=t*(0.6+layer*.2);
          const alpha=0.04+layer*.025;
          ctx.beginPath();
          for(let x=0;x<=W;x+=4){
            const y=H*.38+layer*90+Math.sin(x*freq+spd)*amp+Math.sin(x*freq*2.3-spd*.7)*amp*.4;
            x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
          }
          ctx.strokeStyle=G+alpha+')'; ctx.lineWidth=1.5; ctx.stroke();
        }
        // Floating dots on waves
        for(let i=0;i<12;i++){
          const x=(i/12)*W, freq2=0.0012, spd2=t*.6;
          const y=H*.38+Math.sin(x*freq2+spd2)*18;
          const pulse=(Math.sin(t*2+i)*.5+.5)*.25+.1;
          ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2);
          ctx.fillStyle=G+pulse+')'; ctx.fill();
        }
        af=requestAnimationFrame(draw);
      };
      draw();
    }

    // ── MATRIX (Systèmes) ──
    else if (type === 'matrix') {
      const cols = Math.floor(W/22);
      const drops = Array.from({length:cols}, () => Math.random()*H/14);
      const chars = '01ABCDEF$€⚙▸◆★✦░▒▓'.split('');
      const draw = () => {
        ctx.fillStyle='rgba(5,8,16,0.06)'; ctx.fillRect(0,0,W,H);
        ctx.font='12px "Share Tech Mono",monospace';
        drops.forEach((y,i) => {
          const ch=chars[Math.floor(Math.random()*chars.length)];
          const alpha=Math.random()*.18+.04;
          ctx.fillStyle=`rgba(201,168,76,${alpha})`; ctx.fillText(ch,i*22,y*14);
          if(y*14>H && Math.random()>.97) drops[i]=0;
          drops[i]+=.3+Math.random()*.3;
        });
        af=requestAnimationFrame(draw);
      };
      draw();
    }

    // ── CONSTELLATION (Vision) ──
    else if (type === 'constellation') {
      const stars = Array.from({length:55}, () => ({
        x:Math.random()*1920, y:Math.random()*1080,
        r:.4+Math.random()*1.8, al:.12+Math.random()*.4,
        phase:Math.random()*Math.PI*2,
      }));
      const draw = () => {
        ctx.clearRect(0,0,W,H); t+=0.012;
        // Nebula glow
        const gr=ctx.createRadialGradient(960,540,0,960,540,700);
        gr.addColorStop(0,T+'0.015)'); gr.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
        // Stars twinkle
        stars.forEach(s=>{
          const twinkle=Math.sin(t*1.8+s.phase)*.5+.5;
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r*(0.7+twinkle*.6),0,Math.PI*2);
          ctx.fillStyle=G+(s.al*twinkle+.05)+')'; ctx.fill();
        });
        // Connect nearby stars
        for(let i=0;i<stars.length;i++) for(let j=i+1;j<stars.length;j++){
          const dx=stars[i].x-stars[j].x, dy=stars[i].y-stars[j].y, d=Math.sqrt(dx*dx+dy*dy);
          if(d<180){ ctx.beginPath(); ctx.moveTo(stars[i].x,stars[i].y); ctx.lineTo(stars[j].x,stars[j].y);
            ctx.strokeStyle=T+(0.04*(1-d/180))+')'; ctx.lineWidth=.5; ctx.stroke(); }
        }
        // Shooting star
        const ss = Math.sin(t*.15);
        if(ss>0.98){
          const sx=(t*80)%1920, sy=200+Math.random()*200;
          ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx-60,sy+20);
          ctx.strokeStyle=G+'0.7)'; ctx.lineWidth=1.5; ctx.stroke();
        }
        af=requestAnimationFrame(draw);
      };
      draw();
    }

    // ── PULSE (Leadership) ──
    else if (type === 'pulse') {
      const nodes = Array.from({length:8}, (_,i) => ({
        x:200+Math.random()*1520, y:150+Math.random()*780,
        phase:i/8*Math.PI*2,
      }));
      const draw = () => {
        ctx.clearRect(0,0,W,H); t+=0.014;
        // Pulsing rings from center
        for(let r=0;r<4;r++){
          const radius=120+r*130+Math.sin(t+r)*15;
          const al=Math.max(0,(1-r/4)*.06);
          ctx.beginPath(); ctx.arc(960,540,radius,0,Math.PI*2);
          ctx.strokeStyle=G+al+')'; ctx.lineWidth=1; ctx.stroke();
        }
        // Nodes with connections
        nodes.forEach((n,i)=>{
          const pulse=(Math.sin(t*1.5+n.phase)*.5+.5);
          ctx.beginPath(); ctx.arc(n.x,n.y,3+pulse*4,0,Math.PI*2);
          ctx.fillStyle=G+(0.1+pulse*.2)+')'; ctx.fill();
          // Line to center
          ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(960,540);
          ctx.strokeStyle=G+(0.04+pulse*.04)+')'; ctx.lineWidth=.8; ctx.stroke();
        });
        af=requestAnimationFrame(draw);
      };
      draw();
    }

    // ── FLOW (Conclusion) ──
    else if (type === 'flow') {
      const lines = Array.from({length:20}, () => ({
        x:Math.random()*1920, y:Math.random()*1080,
        len:80+Math.random()*120, angle:Math.random()*Math.PI*2,
        speed:.4+Math.random()*.6, al:.04+Math.random()*.1,
      }));
      const draw = () => {
        ctx.clearRect(0,0,W,H); t+=0.01;
        // Golden glow at bottom
        const gr=ctx.createLinearGradient(0,H*.6,0,H);
        gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,G+'0.04)');
        ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
        lines.forEach(l=>{
          l.x+=Math.cos(l.angle)*l.speed; l.y+=Math.sin(l.angle)*l.speed;
          if(l.x<-200)l.x=W+100; if(l.x>W+200)l.x=-100;
          if(l.y<-200)l.y=H+100; if(l.y>H+200)l.y=-100;
          ctx.beginPath();
          ctx.moveTo(l.x,l.y);
          ctx.lineTo(l.x+Math.cos(l.angle)*l.len, l.y+Math.sin(l.angle)*l.len);
          const grad=ctx.createLinearGradient(l.x,l.y,l.x+Math.cos(l.angle)*l.len,l.y+Math.sin(l.angle)*l.len);
          grad.addColorStop(0,'rgba(0,0,0,0)'); grad.addColorStop(.5,G+l.al+')'); grad.addColorStop(1,'rgba(0,0,0,0)');
          ctx.strokeStyle=grad; ctx.lineWidth=1.2; ctx.stroke();
        });
        af=requestAnimationFrame(draw);
      };
      draw();
    }

    return () => { cancelAnimationFrame(af); window.removeEventListener('resize', resize); };
  }, [type]);

  return (
    <canvas ref={cvs} style={{
      position:'absolute', inset:0, width:'100%', height:'100%',
      pointerEvents:'none', zIndex:0,
    }}/>
  );
}
