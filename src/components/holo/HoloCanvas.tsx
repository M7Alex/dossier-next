'use client';
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface HoloRef { lock: () => void; }

const HoloCanvas = forwardRef<HoloRef>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0, phase: 0, lkP: 0, flash: 0, pts: [] as any[], data: [] as any[], id: 0 });

  useImperativeHandle(ref, () => ({
    lock: () => { stateRef.current.phase = 1; setTimeout(() => { stateRef.current.phase = 2; stateRef.current.flash = 1.0; }, 1200); }
  }));

  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    const W = cvs.width, H = cvs.height, cx = W/2, cy = H/2;
    const HEX = '0123456789ABCDEF';
    const s = stateRef.current;
    s.pts = Array.from({length:28},(_,i)=>({a:(i/28)*Math.PI*2,r:82+(i%4)*22,spd:0.007+(i%5)*0.0025,dir:i%2?1:-1,sz:1.1+(i%3)*0.5,al:0.38+(i%3)*0.14}));
    s.data = Array.from({length:7},()=>({txt:Array.from({length:14},()=>HEX[Math.floor(Math.random()*16)]).join(' '),al:0.1+Math.random()*0.09}));

    let last = 0;
    const loop = (now: number) => {
      const dt = Math.min(now - last, 50); last = now; s.t += dt;
      const sf = s.phase===0?1:s.phase===1?Math.max(0.02,1-s.lkP):0.015;
      if (s.phase>=1) s.lkP = Math.min(1, s.lkP+dt/1200);
      s.pts.forEach((p:any) => p.a += p.spd*p.dir*sf);
      if (s.flash>0) s.flash -= 0.02;
      if (Math.random()<0.07) { const i=Math.floor(Math.random()*s.data.length); s.data[i].txt=Array.from({length:14},()=>HEX[Math.floor(Math.random()*16)]).join(' '); }
      const t = s.t*0.001, lk = s.phase===2;
      ctx.clearRect(0,0,W,H);
      const ag=ctx.createRadialGradient(cx,cy,0,cx,cy,165);
      ag.addColorStop(0,lk?'rgba(201,168,76,0.1)':'rgba(201,168,76,0.055)');
      ag.addColorStop(0.5,'rgba(60,130,210,0.022)'); ag.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ag; ctx.fillRect(0,0,W,H);
      ctx.font='8px "Share Tech Mono",monospace';
      s.data.forEach((d:any,i:number)=>{
        ctx.fillStyle=`rgba(90,185,255,${d.al})`; ctx.textAlign='left'; ctx.fillText(d.txt,8,16+i*15);
        ctx.fillStyle=`rgba(201,168,76,${d.al*0.7})`; ctx.textAlign='right'; ctx.fillText(d.txt,W-8,16+i*15);
      });
      [{r:155,spd:.5,dir:1,dash:[10,7],col:'rgba(201,168,76,',w:2},{r:125,spd:.95,dir:-1,dash:[6,5],col:'rgba(80,185,255,',w:1.5},{r:97,spd:1.7,dir:1,dash:[4,6],col:'rgba(201,168,76,',w:1.5},{r:68,spd:2.6,dir:-1,dash:[3,5],col:'rgba(80,185,255,',w:1}].forEach((rg,ri)=>{
        const ang=t*rg.spd*rg.dir*sf, al=lk?0.9:0.42-ri*0.04;
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(ang); ctx.strokeStyle=rg.col+al+')'; ctx.lineWidth=rg.w; ctx.setLineDash(rg.dash);
        ctx.beginPath(); ctx.arc(0,0,rg.r,0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]); ctx.strokeStyle=rg.col+(al+0.3)+')'; ctx.lineWidth=rg.w+0.5;
        ctx.beginPath(); ctx.moveTo(rg.r-8,0); ctx.lineTo(rg.r+8,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-rg.r-8,0); ctx.lineTo(-rg.r+8,0); ctx.stroke();
        ctx.fillStyle=rg.col+(al*0.8)+')'; ctx.fillRect(-2,rg.r-3,4,6); ctx.fillRect(-2,-rg.r-3,4,6);
        ctx.restore();
      });
      s.pts.forEach((p:any)=>{
        const x=cx+Math.cos(p.a)*p.r, y=cy+Math.sin(p.a)*p.r, al=lk?Math.min(0.95,p.al*1.6):p.al;
        const pg=ctx.createRadialGradient(x,y,0,x,y,p.sz*3.5);
        pg.addColorStop(0,`rgba(201,168,76,${al})`); pg.addColorStop(1,'rgba(201,168,76,0)');
        ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(x,y,p.sz*3.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgba(230,200,110,${al*1.1})`; ctx.beginPath(); ctx.arc(x,y,p.sz,0,Math.PI*2); ctx.fill();
      });
      const prog=Math.min(1,s.t/4500);
      ctx.strokeStyle=lk?'rgba(201,168,76,0.72)':'rgba(80,185,255,0.3)'; ctx.lineWidth=2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx,cy,48,-Math.PI/2,-Math.PI/2+prog*Math.PI*2); ctx.stroke();
      ctx.strokeStyle=lk?'rgba(201,168,76,0.8)':'rgba(201,168,76,0.25)'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(cx,cy,38,0,Math.PI*2); ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      if (lk) { ctx.font='bold 22px sans-serif'; ctx.fillStyle=`rgba(201,168,76,${0.85+Math.sin(s.t*0.003)*0.1})`; ctx.fillText('✓',cx,cy+1); }
      else { ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*0.75*sf); ctx.font='24px sans-serif'; ctx.fillStyle='rgba(201,168,76,0.6)'; ctx.fillText('⚙',0,1); ctx.restore(); }
      ctx.strokeStyle='rgba(201,168,76,0.09)'; ctx.lineWidth=0.5; ctx.setLineDash([4,5]);
      ctx.beginPath(); ctx.moveTo(cx,8); ctx.lineTo(cx,cy-42); ctx.moveTo(cx,cy+42); ctx.lineTo(cx,H-8);
      ctx.moveTo(8,cy); ctx.lineTo(cx-42,cy); ctx.moveTo(cx+42,cy); ctx.lineTo(W-8,cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.font='7px "Share Tech Mono",monospace'; ctx.fillStyle='rgba(201,168,76,0.22)'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
      ctx.fillText(`SYS.AUTH / LVL.ALPHA / ${(Math.floor(s.t/100)*100).toString().padStart(6,'0')}ms`,8,H-8);
      ctx.textAlign='right'; ctx.fillText(`LS.GOV / SECURE / V${Math.floor(s.t/600)%9+1}.${Math.floor(s.t/80)%9}`,W-8,H-8);
      for(let y=0;y<H;y+=3){ctx.fillStyle='rgba(0,0,0,0.025)';ctx.fillRect(0,y,W,1);}
      if (s.flash>0) { ctx.fillStyle=`rgba(215,185,95,${s.flash*0.38})`; ctx.fillRect(0,0,W,H); }
      s.id = requestAnimationFrame(loop);
    };
    s.id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.id);
  }, []);

  return <canvas ref={canvasRef} width={400} height={400} className="block" />;
});
HoloCanvas.displayName = 'HoloCanvas';
export default HoloCanvas;
