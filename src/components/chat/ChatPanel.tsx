'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';

interface Msg { role: 'user' | 'assistant'; text: string; }

export default function ChatPanel() {
  const { showChat, toggleChat, mode } = useDossier();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{role:string,content:string}[]>([]);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChat && msgs.length === 0) {
      setMsgs([{ role: 'assistant', text: `Bonjour. Je suis l'assistant du dossier ${CONFIG.candidat.nomComplet}. Posez-moi vos questions sur sa candidature.` }]);
    }
  }, [showChat]);

  useEffect(() => { msgsRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim(); setInput('');
    const newMsg: Msg = { role: 'user', text: txt };
    setMsgs(m => [...m, newMsg]);
    const newHistory = [...history, { role: 'user', content: txt }];
    setHistory(newHistory);
    setLoading(true);
    try {
      const r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newHistory }) });
      const { reply } = await r.json();
      setMsgs(m => [...m, { role: 'assistant', text: reply }]);
      setHistory(h => [...h, { role: 'assistant', content: reply }]);
    } catch { setMsgs(m => [...m, { role: 'assistant', text: 'Une erreur est survenue.' }]); }
    setLoading(false);
  };

  return (
    <>
      {/* Bouton flottant */}
      <AnimatePresence>
        {mode !== 'locked' && (
          <motion.button
            onClick={toggleChat}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-[8000] font-mono text-[11px] tracking-widest px-4 py-3"
            style={{ background: 'rgba(8,12,18,0.96)', border: '1px solid rgba(201,168,76,0.38)', color: '#C9A84C', borderRadius: 3, boxShadow: '0 0 20px rgba(201,168,76,0.12)' }}
          >
            {showChat ? '✕ Fermer' : '✦ Assistant'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.97 }}
            className="fixed z-[8001] flex flex-col"
            style={{ bottom: 80, right: 24, width: 340, maxHeight: 480, background: 'rgba(6,10,16,0.98)', border: '1px solid rgba(201,168,76,0.28)', borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
              <span className="font-cinzel text-[10px] tracking-widest" style={{ color: '#C9A84C' }}>✦ ASSISTANT — DOSSIER {CONFIG.candidat.nom.toUpperCase()}</span>
              <button onClick={toggleChat} style={{ color: 'rgba(201,168,76,0.4)', background: 'none', border: 'none', fontSize: 14 }}>✕</button>
            </div>
            <div ref={msgsRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ minHeight: 200, maxHeight: 320 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%', padding: '9px 13px', borderRadius: 3,
                  fontSize: 12, lineHeight: 1.55, fontFamily: 'Raleway, sans-serif',
                  ...(m.role === 'user'
                    ? { background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#F0E8D0' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.09)', borderLeft: '2px solid rgba(201,168,76,0.4)', color: '#F0E8D0' })
                }}>
                  {m.text}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', color: 'rgba(201,168,76,0.4)', fontSize: 12, fontStyle: 'italic', padding: '6px 12px' }}>...</div>
              )}
            </div>
            <div className="flex gap-2 p-3" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Posez une question..."
                className="flex-1 text-[10px] px-3 py-2 font-mono"
                style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', color: '#F0E8D0', borderRadius: 2, outline: 'none' }}
              />
              <button onClick={send} className="px-3 py-2 text-xs" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.28)', color: '#C9A84C', borderRadius: 2 }}>→</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
