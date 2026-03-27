'use client';
import { useEffect, useRef } from 'react';
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
  const {
    mode,
    currentSlide,
    content,
    extraPages,
    addPage,
    removePage,
    setContent,
  } = useDossier();

  const totalSlides = CONFIG.slides.length + extraPages.length;
  const initialLoadDone = useRef(false);

  // Nettoyage des pages dynamiques fantômes au démarrage
  useEffect(() => {
    const store = useDossier.getState();
    if (store.extraPages.length > 0) {
      store.extraPages.forEach((p) => store.removePage(p.id));
    }
  }, []);

  // Préload audio
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'audio';
    link.href = '/legacy_theme.mp3';
    document.head.appendChild(link);
  }, []);

  // Chargement intelligent des données :
  // priorité = #share > serveur > localStorage
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadData = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      let loadedData: any = null;

      // 1. Priorité au lien partagé
      if (hash && hash.startsWith('#share=')) {
        try {
          const dec = LZString.decompressFromEncodedURIComponent(hash.slice(7));
          if (dec) {
            loadedData = JSON.parse(dec);
            localStorage.setItem('rp_data', JSON.stringify(loadedData));
            console.log('📦 Chargé depuis lien partagé');
          }
        } catch (e) {
          console.error('Erreur chargement share', e);
        }
      }

      // 2. Sinon depuis le serveur
      if (!loadedData) {
        try {
          const res = await fetch(`/api/save?t=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
          });

          const data = await res.json();
          console.log('🌍 Données serveur reçues :', data);

          if (data?.content && Object.keys(data.content).length > 0) {
            loadedData = data.content;
            localStorage.setItem('rp_data', JSON.stringify(loadedData));
            console.log('📦 Chargé depuis serveur');
          }
        } catch (e) {
          console.error('Erreur chargement serveur', e);
        }
      }

      // 3. Sinon fallback localStorage
      if (!loadedData) {
        const saved = localStorage.getItem('rp_data');
        if (saved) {
          try {
            loadedData = JSON.parse(saved);
            console.log('📦 Chargé depuis localStorage');
          } catch (e) {
            console.error('Erreur localStorage', e);
          }
        }
      }

      // 4. Appliquer les données
      if (loadedData) {
        Object.entries(loadedData).forEach(([k, v]) => {
          setContent(k, v as string);
        });
      }
    };

    loadData();
  }, [setContent]);

  // Stats tracking
  useEffect(() => {
    if (mode === 'locked' || typeof window === 'undefined' || window.location.protocol === 'file:') return;

    const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);

    fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'open', sessionId: sid }),
    });

    const t = Date.now();

    return () => {
      navigator.sendBeacon(
        '/api/stats',
        JSON.stringify({
          event: 'close',
          sessionId: sid,
          data: {
            duration: Math.round((Date.now() - t) / 1000),
            lastSlide: currentSlide,
          },
        })
      );
    };
  }, [mode, currentSlide]);

  const handleAddPage = () => {
    const BG = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'];
    const id = `dyn_${Date.now()}`;

    addPage({
      id,
      type: 'custom',
      label: 'Nouveau Chapitre',
      numero: String(totalSlides),
      icon: '◆',
      bg: BG[totalSlides % 6],
      chibi: 'pointer',
      content: {
        titre: 'Nouveau Chapitre',
        blocs: [
          { key: 'a', titre: 'Section A', texte: 'Contenu...' },
          { key: 'b', titre: 'Section B', texte: 'Contenu...' },
        ],
      },
    });

    toast.success('+ Page ajoutée');
  };

  const handleRemovePage = () => {
    const all = [...CONFIG.slides, ...extraPages];
    const slide = all[currentSlide];

    if (all.length <= 1) {
      toast.error('Impossible de supprimer la dernière page');
      return;
    }

    if (!slide?.id?.startsWith('dyn_')) {
      toast.error('Impossible de supprimer une page intégrée');
      return;
    }

    if (!confirm('Supprimer cette page ?')) return;

    removePage(slide.id);
    toast.success('Page supprimée');
  };

  const handleShare = () => {
    try {
      const comp = LZString.compressToEncodedURIComponent(JSON.stringify(content));
      const url = `${window.location.origin}${window.location.pathname}#share=${comp}`;

      navigator.clipboard?.writeText(url).then(() => {
        toast.success('🔗 Lien copié !');
      }) ?? window.prompt('Lien :', url);
    } catch {
      toast.error('Erreur de partage');
    }
  };

  const handleExport = () => {
    toast('Utilisez Ctrl+P pour imprimer en PDF');
  };

  return (
    <>
      <CustomCursor />
      <Toast />

      {mode === 'locked' && <IntroScreen />}

      {mode !== 'locked' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            background: '#050810',
            overflow: 'hidden',
          }}
        >
          <Toolbar
            totalSlides={totalSlides}
            onAddPage={handleAddPage}
            onRemovePage={handleRemovePage}
            onExport={handleExport}
            onShare={handleShare}
          />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
            <SlideEngine />
          </div>
        </div>
      )}

      <StatsPanel />
    </>
  );
}
