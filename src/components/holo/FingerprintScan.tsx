'use client';
import { useEffect, useRef } from 'react';

// ─── Fingerprint SVG data — lignes de crêtes papillaires ───
// 28 arcs concentriques simulant une vraie empreinte
function buildRidges() {
  const ridges: { d: string; opacity: number }[] = [];
  const cx = 120, cy = 140;
  for (let i = 0; i < 28; i++) {
    const r = 18 + i * 6.5;
    const squeeze = 0.72 + i * 0.009;
    const wobble = 1 + i * 0.018;
    // Arc partiel avec irrégularités (simule les bifurcations)
    const startAngle = -Math.PI * 0.88 + i * 0.012;
    const endAngle   =  Math.PI * 0.88 - i * 0.012;
    const pts: string[] = [];
    const steps = 48;
    for (let j = 0; j <= steps; j++) {
      const a = startAngle + (endAngle - startAngle) * (j / steps);
      // Légère déformation organique
      const rLocal = r * (1 + Math.sin(a * 3.1 + i * 0.7) * 0.028 * wobble);
      const x = cx + Math.cos(a) * rLocal;
      const y = cy + Math.sin(a) * rLocal * squeeze;
      pts.push(j === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    // Quelques bifurcations
    if (i % 4 === 2 && r < 140) {
      const a2 = startAngle + (endAngle - startAngle) * 0.35;
      const rB = r * 1.08;
      const x2 = cx + Math.cos(a2) * rB * 1.04;
      const y2 = cy + Math.sin(a2) * rB * squeeze;
      pts.push(`M ${x2.toFixed(1)} ${y2.toFixed(1)} L ${(x2 + Math.cos(a2+0.3)*10).toFixed(1)} ${(y2 + Math.sin(a2+0.3)*10*squeeze).toFixed(1)}`);
    }
    ridges.push({
      d: pts.join(' '),
      opacity: 0.55 + (i / 28) * 0.35,
    });
  }
  return ridges;
}

const RIDGES = buildRidges();

interface Props {
  onComplete: () => void;
}

export default function FingerprintScan({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef    = useRef<SVGSVGElement>(null);
  const rafRef    = useRef<number>(0);
  const t0Ref     = useRef<number>(0);
  const doneRef   = useRef(false);

  useEffect(() => {
    t0Ref.current = performance.now();

    // Phases :
    // 0.0 → 0.30  — apparition progressive des lignes (reveal top→bottom)
    // 0.30 → 0.65 — ligne de scan verte qui descend
    // 0.65 → 0.85 — flash vert + "IDENTITÉ CONFIRMÉE"
    // 0.85 → 1.0  — fade out

    const TOTAL = 3200; // ms

    const eO = (t: number) => 1 - Math.pow(Math.max(0, Math.min(1, 1 - t)), 3);
    const c01 = (t: number, a: number, b: number) =>
      Math.max(0, Math.min(1, (t - a) / (b - a)));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const draw = (ts: number) => {
      const el = ts - t0Ref.current;
      const t  = el / TOTAL;
      const W  = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;

      ctx.clearRect(0, 0, W, H);

      const revealP = eO(c01(t, 0.00, 0.30)); // ridges appear
      const scanP   = c01(t, 0.30, 0.65);      // scan line moves
      const flashP  = eO(c01(t, 0.65, 0.80));  // validation flash
      const fadeP   = c01(t, 0.82, 1.00);      // fade out

      const globalA = 1 - fadeP;
      const scale   = 1.55;
      const offX    = cx - 120 * scale;
      const offY    = cy - 145 * scale;

      ctx.save();
      ctx.globalAlpha = globalA;
      ctx.translate(offX, offY);
      ctx.scale(scale, scale);

      // ── Outer glow ──
      if (revealP > 0) {
        const glow = ctx.createRadialGradient(120, 140, 20, 120, 140, 160);
        glow.addColorStop(0, `rgba(80,200,200,${revealP * 0.08})`);
        glow.addColorStop(0.6, `rgba(80,200,200,${revealP * 0.03})`);
        glow.addColorStop(1, 'rgba(80,200,200,0)');
        ctx.beginPath(); ctx.arc(120, 140, 160, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
      }

      // ── Fingerprint ridges (reveal top→bottom) ──
      const revealY = 20 + revealP * 260; // pixels revealed
      RIDGES.forEach((ridge, i) => {
        // Parse path to get y coords for clipping
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 240, revealY);
        ctx.clip();

        // Gold glow layer
        ctx.beginPath();
        const p = new Path2D(ridge.d);
        ctx.strokeStyle = `rgba(201,168,76,${ridge.opacity * revealP * 0.22})`;
        ctx.lineWidth = 2.2;
        ctx.stroke(p);

        // Main cyan line
        ctx.beginPath();
        ctx.strokeStyle = `rgba(80,200,200,${ridge.opacity * revealP * 0.72})`;
        ctx.lineWidth = 0.85;
        ctx.stroke(p);

        ctx.restore();
      });

      // ── Scan line (descend) ──
      if (scanP > 0 && scanP < 1) {
        const sy = 20 + scanP * 240;
        const sg = ctx.createLinearGradient(0, sy - 18, 0, sy + 18);
        sg.addColorStop(0,   'rgba(80,255,180,0)');
        sg.addColorStop(0.4, `rgba(80,255,180,${0.55})`);
        sg.addColorStop(0.6, `rgba(80,255,180,${0.80})`);
        sg.addColorStop(1,   'rgba(80,255,180,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, sy - 18, 240, 36);
        // Bright center line
        ctx.strokeStyle = `rgba(120,255,200,0.90)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(240, sy); ctx.stroke();

        // Scan reveals ridges gold in passed area
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, 240, sy);
        ctx.clip();
        RIDGES.forEach(ridge => {
          ctx.beginPath();
          const p = new Path2D(ridge.d);
          ctx.strokeStyle = `rgba(201,168,76,${ridge.opacity * 0.60})`;
          ctx.lineWidth = 0.95; ctx.stroke(p);
        });
        ctx.restore();
      }

      // ── Validation flash ──
      if (flashP > 0) {
        const flashGlow = ctx.createRadialGradient(120, 140, 0, 120, 140, 180);
        flashGlow.addColorStop(0, `rgba(80,255,180,${flashP * 0.22})`);
        flashGlow.addColorStop(0.5, `rgba(80,255,180,${flashP * 0.10})`);
        flashGlow.addColorStop(1, 'rgba(80,255,180,0)');
        ctx.beginPath(); ctx.arc(120, 140, 180, 0, Math.PI * 2);
        ctx.fillStyle = flashGlow; ctx.fill();

        // Check mark circle
        ctx.beginPath();
        ctx.arc(120, 140, 155, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(80,255,180,${flashP * 0.55})`;
        ctx.lineWidth = 1.8 + flashP;
        ctx.stroke();
      }

      ctx.restore();

      // ── Scan label ──
      ctx.save();
      ctx.globalAlpha = globalA;
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.letterSpacing = '4px';
      ctx.textAlign = 'center';

      if (scanP > 0.05 && scanP < 0.95) {
        ctx.fillStyle = `rgba(80,200,200,${0.45})`;
        ctx.fillText('SCAN EN COURS...', cx, cy + 175 * scale * 0.72);
      }
      if (flashP > 0.15) {
        ctx.fillStyle = `rgba(80,255,180,${flashP * 0.85})`;
        ctx.fillText('✓ IDENTITÉ CONFIRMÉE', cx, cy + 175 * scale * 0.72);
      }

      // Department label
      if (revealP > 0.3) {
        ctx.fillStyle = `rgba(201,168,76,${(revealP - 0.3) * 1.43 * 0.35})`;
        ctx.font = '9px "Share Tech Mono", monospace';
        ctx.letterSpacing = '6px';
        ctx.fillText('DÉPARTEMENT DES FINANCES', cx, cy - 165);
        ctx.fillText('SYSTÈME D\'IDENTIFICATION BIOMÉTRIQUE', cx, cy - 150);
      }
      ctx.restore();

      if (t >= 1 && !doneRef.current) {
        doneRef.current = true;
        onComplete();
        return;
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
