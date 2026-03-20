'use client';
import { useEffect, useState } from 'react';
import { useDossier } from '@/store';
import { CONFIG } from '@/lib/config';
import { toast } from 'sonner';
import LZString from 'lz-string';
import dynamic from 'next/dynamic';
import IntroScreen from '@/components/holo/IntroScreen';
import SlideEngine from '@/components/slides/SlideEngine';
import Toolbar from '@/components/slides/Toolbar';
import StatsPanel from '@/components/stats/StatsPanel';
import Toast from '@/components/ui/Toast';

const CustomCursor = dynamic(() => import('@/components/ui/CustomCursor'), { ssr: false });

export default function Home() {
  const { mode, currentSlide, content, extraPages, addPage, removePage, setContent, setMode } = useDossier();
  const totalSlides = CONFIG.slides.length + extraPages.length;

  // Load from KV when admin
  useEffect(() => {
    if (mode === 'locked') return;
    fetch('/api/save').then(r => r.json()).then(data => {
      if (data.content && Object.keys(data.content).length > 0)
        Object.entries(data.content).forEach(([k, v]) => setContent(k, v as string));
    }).catch(() => {});
  }, [mode]);

  // URL share param
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
  }, []);

  // Stats tracking
  useEffect(() => {
    if (mode === 'locked' || typeof window === 'undefined' || window.location.protocol === 'file:') return;
    const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    fetch('/api/stats', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'open', sessionId:sid }) });
    const t = Date.now();
    return () => {
      navigator.sendBeacon('/api/stats', JSON.stringify({ event:'close', sessionId:sid, data:{ duration: Math.round((Date.now()-t)/1000), lastSlide:currentSlide } }));
    };
  }, [mode]);

  const handleAddPage = () => {
    const BG = ['b1','b2','b3','b4','b5','b6'];
    const id = `dyn_${Date.now()}`;
    addPage({ id, type:'custom', label:'Nouveau Chapitre', numero:String(totalSlides), icon:'◆', bg:BG[totalSlides%6], chibi:'pointer',
      content: { titre:'Nouveau Chapitre', blocs:[{ key:'a', titre:'Section A', texte:'Contenu...' },{ key:'b', titre:'Section B', texte:'Contenu...' }] } });
    toast.success('+ Page ajoutée');
  };

  const handleRemovePage = () => {
    const all = [...CONFIG.slides, ...extraPages];
    const slide = all[currentSlide];
    if (all.length <= 1) { toast.error('Impossible de supprimer la dernière page'); return; }
    if (!slide?.id?.startsWith('dyn_')) { toast.error('Impossible de supprimer une page intégrée'); return; }
    if (!confirm('Supprimer cette page ?')) return;
    removePage(slide.id); toast.success('Page supprimée');
  };

  const handleShare = () => {
    try {
      const comp = LZString.compressToEncodedURIComponent(JSON.stringify(content));
      const url = `${window.location.origin}${window.location.pathname}#share=${comp}`;
      navigator.clipboard?.writeText(url).then(() => toast.success('🔗 Lien copié !')) ?? window.prompt('Lien :', url);
    } catch { toast.error('Erreur de partage'); }
  };

  const handleExport = () => { toast('Utilisez Ctrl+P pour imprimer en PDF'); };

  return (
    <>
      <CustomCursor/>
      <Toast/>
      {mode === 'locked' && <IntroScreen/>}
      {mode !== 'locked' && (
        <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#050810', overflow:'hidden' }}>
          <Toolbar totalSlides={totalSlides} onAddPage={handleAddPage} onRemovePage={handleRemovePage} onExport={handleExport} onShare={handleShare}/>
          <div style={{ flex:1, minHeight:0, display:'flex', overflow:'hidden' }}>
            <SlideEngine/>
          </div>
        </div>
      )}
      <StatsPanel/>
    </>
  );
}
