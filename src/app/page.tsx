'use client';
import { useEffect, useState } from 'react';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import { toast } from 'sonner';
import LZString from 'lz-string';
import IntroScreen from '@/components/holo/IntroScreen';
import SlideEngine from '@/components/slides/SlideEngine';
import Toolbar from '@/components/slides/Toolbar';
import ChatPanel from '@/components/chat/ChatPanel';
import StatsPanel from '@/components/stats/StatsPanel';
import CustomCursor from '@/components/ui/CustomCursor';
import Toast from '@/components/ui/Toast';

export default function Home() {
  const { mode, currentSlide, content, extraPages, addPage, removePage, setContent, setMode } = useDossier();
  const [loaded, setLoaded] = useState(false);
  const totalSlides = CONFIG.slides.length + extraPages.length;

  // Load saved content from KV on first visit (real-time sync)
  useEffect(() => {
    if (mode === 'locked') return;
    const loadFromServer = async () => {
      try {
        const r = await fetch('/api/save');
        const data = await r.json();
        if (data.content && Object.keys(data.content).length > 0) {
          Object.entries(data.content).forEach(([k, v]) => setContent(k, v as string));
        }
      } catch {}
    };
    loadFromServer();
  }, [mode]);

  // Check URL share param
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const dec = LZString.decompressFromEncodedURIComponent(hash.slice(7));
        if (dec) {
          const data = JSON.parse(dec);
          Object.entries(data).forEach(([k, v]) => setContent(k, v as string));
          setMode('visitor');
          window.location.hash = '';
        }
      } catch {}
    }
    setLoaded(true);
  }, []);

  // Stats tracking
  useEffect(() => {
    if (mode === 'locked' || typeof window === 'undefined' || window.location.protocol === 'file:') return;
    const sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    fetch('/api/stats', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'open', sessionId }) });
    const startTime = Date.now();
    return () => {
      navigator.sendBeacon('/api/stats', JSON.stringify({
        event:'close', sessionId, data:{ duration: Math.round((Date.now()-startTime)/1000), lastSlide: currentSlide }
      }));
    };
  }, [mode]);

  const handleAddPage = () => {
    const BG = ['b1','b2','b3','b4','b5','b6'];
    const id = `dyn_${Date.now()}`;
    addPage({
      id, type:'custom', label:'Nouveau Chapitre',
      numero: String(totalSlides),
      icon:'◆', bg: BG[totalSlides % 6], chibi:'pointer',
      content: {
        titre:'Nouveau Chapitre',
        blocs:[
          { key:'a', titre:'Section A', texte:'Contenu à modifier...' },
          { key:'b', titre:'Section B', texte:'Contenu à modifier...' },
        ],
      },
    });
    toast.success('+ Page ajoutée');
  };

  const handleRemovePage = () => {
    const allSlides = [...CONFIG.slides, ...extraPages];
    const slide = allSlides[currentSlide];
    if (allSlides.length <= 1) { toast.error('Impossible de supprimer la dernière page'); return; }
    if (!slide?.id?.startsWith('dyn_')) { toast.error('Impossible de supprimer une page intégrée'); return; }
    if (!confirm('Supprimer cette page ?')) return;
    removePage(slide.id);
    toast.success('Page supprimée');
  };

  const handleShare = () => {
    try {
      const comp = LZString.compressToEncodedURIComponent(JSON.stringify(content));
      const url = `${window.location.origin}${window.location.pathname}#share=${comp}`;
      navigator.clipboard?.writeText(url).then(() => toast.success('🔗 Lien copié !')) ?? window.prompt('Lien :', url);
    } catch { toast.error('Erreur de partage'); }
  };

  const handleExport = async () => {
    toast('Génération PDF...');
    // jsPDF export — dynamic import
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf') as any,
        import('html2canvas') as any,
      ]);
      // Simplified export notification — full impl via print CSS
      window.print();
    } catch { toast.error('Erreur PDF'); }
  };

  return (
    <>
      <CustomCursor/>
      <Toast/>

      {/* Intro screen */}
      {mode === 'locked' && <IntroScreen/>}

      {/* Main app */}
      {mode !== 'locked' && (
        <div className="flex flex-col" style={{ height:'100dvh', background:'#050810', overflow:'hidden' }}>
          <Toolbar
            totalSlides={totalSlides}
            onAddPage={handleAddPage}
            onRemovePage={handleRemovePage}
            onExport={handleExport}
            onShare={handleShare}
          />
          <div className="flex-1 overflow-hidden flex items-center justify-center">
            <SlideEngine/>
          </div>
        </div>
      )}

      <ChatPanel/>
      <StatsPanel/>

      {/* Keyboard hint */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 font-mono text-[8px] tracking-widest pointer-events-none" style={{ color:'rgba(201,168,76,0.15)', zIndex:100 }}>
        ← → NAVIGATION &nbsp;|&nbsp; CTRL+S SAUVEGARDER
      </div>
    </>
  );
}
