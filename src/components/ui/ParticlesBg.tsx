'use client';
import { useEffect, useRef } from 'react';

interface Props { color?: string; density?: number; speed?: number; }

export default function ParticlesBg({ color='rgba(201,168,76,', density=38, speed=0.4 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener('resize', resize);

    // Particles
    const pts = Array.from({ length: density }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed,
      r: 0.6 + Math.random() * 1.4,
      al: 0.1 + Math.random() * 0.35,
    }));

    let af: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Update & draw particles
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color + p.al + ')';
        ctx.fill();
      });

      // Connect nearby particles
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = color + (0.06 * (1 - dist / 130)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      af = requestAnimationFrame(draw);
    };
    af = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(af); window.removeEventListener('resize', resize); };
  }, [color, density, speed]);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }}/>
  );
}
