'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';

const SLIDE_NAMES = CONFIG.slides.map(s => s.label);

export default function StatsPanel() {
  const { showStats, toggleStats } = useDossier();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showStats) load();
  }, [showStats]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/stats?action=get&adminKey=${CONFIG.codes.adminStats}`);
      if (r.ok) setData(await r.json());
    } catch {}
    setLoading(false);
  };

  const avgDur = data?.sessions?.length > 0
    ? Math.round(data.sessions.reduce((a: number, s: any) => a + (s.duration || 0), 0) / data.sessions.length)
    : 0;

  return (
    <AnimatePresence>
      {showStats && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9500] flex flex-col items-center overflow-y-auto py-10 px-4"
          style={{ background: 'rgba(4,6,14,0.97)' }}
        >
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-cinzel text-lg tracking-widest" style={{ color: '#C9A84C' }}>📊 TABLEAU DE BORD — CONSULTATIONS</h2>
              <button onClick={toggleStats} className="font-mono text-[10px] tracking-widest px-3 py-2" style={{ border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(201,168,76,0.5)', background: 'none', borderRadius: 2 }}>✕ FERMER</button>
            </div>

            {loading && <div className="font-mono text-xs tracking-widest" style={{ color: 'rgba(201,168,76,0.3)' }}>CHARGEMENT...</div>}

            {data && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { val: data.total || 0, label: 'Consultations totales' },
                    { val: data.sessions?.length || 0, label: 'Sessions archivées' },
                    { val: `${avgDur}s`, label: 'Durée moyenne' },
                  ].map((k, i) => (
                    <div key={i} className="p-5 text-center" style={{ border: '1px solid rgba(201,168,76,0.15)', borderTop: '2px solid #C9A84C' }}>
                      <div className="font-cinzel text-3xl" style={{ color: '#C9A84C' }}>{k.val}</div>
                      <div className="font-mono text-[9px] tracking-widest mt-2 uppercase" style={{ color: '#A89878' }}>{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Sessions */}
                <div className="font-mono text-[9px] tracking-widest uppercase mb-3 pb-2" style={{ color: '#8B6914', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>Dernières sessions</div>
                {(data.sessions?.length === 0 || !data.sessions) && (
                  <div className="font-mono text-xs" style={{ color: 'rgba(201,168,76,0.25)' }}>Aucune session archivée pour l'instant.</div>
                )}
                {data.sessions?.slice(0, 10).map((s: any, i: number) => {
                  const date = s.startedAt ? new Date(s.startedAt).toLocaleString('fr-FR') : '—';
                  const topEntry = s.slides ? Object.entries(s.slides).sort((a: any, b: any) => b[1] - a[1])[0] : null;
                  const topName = topEntry ? (SLIDE_NAMES[Number(topEntry[0])] || `Slide ${topEntry[0]}`) : '—';
                  return (
                    <div key={i} className="grid gap-4 items-center p-3 mb-2" style={{ border: '1px solid rgba(201,168,76,0.09)', borderLeft: '3px solid rgba(201,168,76,0.3)', gridTemplateColumns: '1fr auto auto' }}>
                      <div>
                        <div className="text-[10px]" style={{ color: '#F0E8D0' }}>{date}</div>
                        <div className="font-mono text-[9px] mt-1" style={{ color: '#A89878' }}>Slide la plus vue : <span style={{ color: '#C9A84C' }}>{topName}</span>{topEntry ? ` — ${topEntry[1]}s` : ''}</div>
                      </div>
                      <div className="text-center"><div className="font-cinzel text-sm" style={{ color: '#C9A84C' }}>{s.duration || 0}s</div><div className="font-mono text-[8px]" style={{ color: '#A89878' }}>durée</div></div>
                      <div className="text-center"><div className="font-mono text-[9px]" style={{ color: '#C9A84C' }}>{SLIDE_NAMES[s.lastSlide] || '—'}</div><div className="font-mono text-[8px]" style={{ color: '#A89878' }}>dernière</div></div>
                    </div>
                  );
                })}
              </>
            )}

            {!data && !loading && (
              <div className="font-mono text-xs" style={{ color: 'rgba(192,57,43,0.7)' }}>Erreur — KV configuré ? Vérifiez les variables d'environnement.</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
