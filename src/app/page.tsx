'use client';
import { useEffect, useState, useRef } from 'react';
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

  // Force clear any persisted extra pages on mount (page 8 ghost fix)
  useEffect(() => {
    const store = useDossier.getState();
    if (store.extraPages.length > 0) {
      store.extraPages.forEach(p => store.removePage(p.id));
    }
  }, []);
  const totalSlides = CONFIG.slides.length + extraPages.length;

  // Preload legacy audio silently in background to avoid lag on slide 8
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'audio';
    link.href = '/legacy_theme .mp3';
    document.head.appendChild(link);
  }, []);

  // Load from KV on first unlock — merge with any local content
  const kvLoaded = useRef(false);
  useEffect(() => {
    if (mode === 'locked' || kvLoaded.current) return;
    kvLoaded.current = true;
    fetch('/api/save').then(r => r.json()).then(data => {
      if (data.content && Object.keys(data.content).length > 0) {
        // KV content takes priority (it's the admin's last saved version)
        Object.entries(data.content).forEach(([k, v]) => setContent(k, v as string));
      }
    }).catch(() => {});
  }, [mode]);

  // URL share param
  useEffect(() => {
    if (typeof window === 'undefined') return;

  const DEFAULT_SHARE = "https://dossier-next-7lls.vercel.app/#share=N4IgxgjCBcICIHsDOSCWBTATgAgCbuwGEBDAO11V2IBcBXTdAHgoDcA+AMmIFsAHAbmy9MCXslTVUCUngLCEAK3TVGAelZsQAGnAAmGCEIIAtHADyAMWwAKALLTqxAOYFctIQBeANgTDSk6KheeADk6KTUDMKoAQCU2uAAbAa6AAy6yTpgACwGRhGY3uj02ABmMWDEwVx8goRmppY2YkjUBKW0dJjxWQCsBnDovNQAdLJI2BaopGRg6EgJ05EIAPoteXLKEkIImG2lCF5S2H6krRK0BNzEJ2QUVF0E4diOEdgAjpdEDoU+JeVISrBZTYLw3YQAS4CERoUhkbiEIiU1FCtHhEN4xD26G44RR0zAXloZBRPhO-kCwVwYQKQ0wMQIxHcAWmeHccAxWLauLe+AmUxmpDmEzGAElgqQwq0hMQJp95pJpKjSAQ0HwyT5qJFXFcEJIWLCldcYsq5CIWhI4dgWDESdgAAfYHgQo67LDYEG8CEMUikBk4LyATAIIX4kABPVoAC9x2BD0gQ3FQ8pGjAARpg2GmMwApAgqnatWhkzETAJFnF4nYlJYQpwMHBovCc7E80ZabDGiZiEpeEIu9AsLDt3uiSSJgI4EHPUrEVAMbBogh1u4ETAQ0re8JzEYJMCpAbN7mVvmTaazebYQAoBNgADLIbAAZRJyEWBVWYGoAA8DDeCAAFIpvjOSlsCiNdoTaBd82XcgCFEMQ9jRCQIWwaBEQQUp5jQaQZiOCdQRCYgwD8PhnBVVtxg9WlogCCZHUbP1ByZclSMwYhUzJJlP2wVo7ixXAJnwUFwW9KQhKE3tZgwX1XDndAPytBFKlTaYQWpYgWAQSpqHbWczlQD4vgkuQEFoFB3WoUyFFMzAuyJCYvAQaYRg4UhUyQAQs0zdM2EIVcii0Vz3IEbAlB4rBZxRZ5cSQegdVBAg2j9ScUWpMNyTOIj6zZF4cV4LsbKELBcS1eckBuccnhkXgwW3ZhUHYAA5CEyG4JyznbMLhHCXAEtAwChNOSIin+CoqkSzBIzok5AGVAEpa3GijeFoGJPhCIIPWlLC8QwYJHV7cIAm4DjXHcXhALjUgEyTL41NVJVcAhQdHN4XgKwiFy3I8-g1A0er2FzMoIu2XBpDAF5TJRNrquQNATqrHBiFen1cHnOYOwhSR3U9YrlG1UIqi8Wt3SoA0YRcE4sEcaZSwjahozg9wDiFRUZKWrE8FQUoNx9NoJkoCELzUwjNLnHjUHVd6UUXIrbJw+KarMz7gp+9QGs0HQlhEFZwicAx7BkXXnClqjB1symC0gicbksxwvDGQhAwVPqy2CbsA3QeVgjC2KTWEAArlFHSNlwcBqwJyMraHcr4JB2xilivSS4UPShi8GBQGzhR3HRMUwMAViQFh91gXoAGoEjzgui6gWAAA5K6xAvMFyWAAFF1QQMMUOMbBbDIY2cF7oxjD-GgRFIILvuwKeQtn-hsxWmQ0l0ABmbBVCbOZjoYRv85WBBW5AAAJZ5j9MgIr2wDlU06WQZXzmyFlzpuVlwI-+4kelL4kvsWEjSOERdrtl-rKN6H4yhniFBgRGNMDLynvmCbALhzgPRCDLCEnxUBvVTqaKi2oaJVWtEEHwytvp7wLggVeBg-z2QwPQCYeIwIMmfiAKuKxMDUNgGPZYMhN4jx4RPeeM8eAhSWFgQcgpqDCJkV9Oecj+AWCevSd0K9sgb2wNmMgNpVHpH6C-feuAuEgAAOIKitNwIskhjBMLpCw9sGdIi0A-PQQ0pB2w1TIBMcogowAwLjtgUcEtbSs0QTcRyTgYiSGTCMFMGgACCqYaCWTnO2G8NxMKYBjDeB87YABCABvsAAALLA-h2wmMcqmAgZggjthIGGBARBUBOCxOgdsf4WnujvE4c4YAAl-mKXqBAy5eClMRA1CEFS2JjKie07AABVRiWA0DUBQjk-J6AyB9yIsU1S7Zj5YmhulAASkMWcmB2xnLAGGSopBYkpjVuwChb99CwBOYBdAn4sBgBQo6fAtBuLMNou2GCQliBUGGOxIIyEHEQl2K0v05VQm-1sYQoQdDijmwODEdsYA1xuPvqs+ZKDQk+KkpGBgHjzTiBRb4H4NAAkMGZpBCJUSbroDIQIF5mA3mGBMHAOSH4sU2E-LoWI2Be6CoYMKkoJiISkG9FUWRKsZ4KPiQgApKI1GSs0domB2AV6ZDYa-XAtdDAEtCSCUlikzoDQIPkFkVIaQEO-vMMYZjUEyFsFYgyiAUD+PvorNAWLSxaVQJjKEVFxaWK8K8KNBIiR2hPENNi1BBITQ0rOLwDj0AsrgpgRFIS4Qqi8D4XN+bKKTScD4VsGaCJorde2ZqThw2Es9DS1Zik5CYoYS8MMb162psZffY0ERwjnhzia-eCA+WVIQNU7AtSvA8vNdK+SbQSjxMzn4iELyEDmpydgeJmltI8pLiAeJLj0BlpNr3ExMy9mtAIBYBgN7zwiNqEBJ1RNQiNoZJMN9YIhToH3Re196B30gZebgC9D6kZPsgqUIDH7rD4paqE0ZeyEGsBWegWI7YQSnB-ShKgZxhLIPMUqPSaBDIEBHIWsgxaHr3V3WspAU72FgAANYXvXQpJUoglWs1LWSEErQ021g5ffCg3NNzjrDWxqELyePmsdSBBQ9BKDSfE04lxDBghoctbazwZJiMgWpP+uIKnuNzqozINUViyCCyDb282oMA0rJs8YwgxmWOczk7zOyXinRwLo5Rbkni+aQN8YGkEl1rrylYVx7jR8zkSecV0Ql1IEVMeRXCRhMMu3+dk+UMAViIRcv4AkG02FSAH1TAoAw-02BwFFA+QgN54milsG3E5qFsAABVIYWywZtfEZx8UgxC+jDzIaw7FBRIHecCE1kOg7AgWTqBtIFcCe4Ygmnn11uwAAQnbBtfMSBCKRKijIJk5WZCVEEug-M+BriwXW34XgBrN5+FvTgTseD5AWjpRlDLAnqr2SdEKNc4W5i3qdNe29Dt5IGUxsmiQeLXCwwNcRyQdACD7QyU5KCeAcck18HcSgNA4odlnBMBatbKxzC1GaUQtKrR+OMKmzl89frqxa15fn7BfymfpcBDab13D4EkWLRsYKhANT1HgELvY4zhijDGBEj085Hl5BeAU54OM7OIXVsJ4s6DtulEJbsoscCRC8QcLJ7oDrAWOmSQaeMCA03x50K0zwZZrh5luSnmJ4bqWIgmTETgVT28hheHwhXXUsPW5ZToCeLzo8HYgkVj1nrwSlrpMLCDJKR9IjHk2ZGHIXnJSBodxSiIy00kWO0C6kpy4cytG0VWasxBWMQT8F6-wiEwgGnCVRmPwlkoFvEF5uCYyGSeQaFIggcd70gfvn5zUnqcg2TvDUDInisxePOwlqmGbmHsLmEb2xIAvjxegg4SHnnbI6b+MSRg9BALVzffK25CghQYAohPDrEjEHEKwfiSixFQBoCdEHHBjJACHQ0cHpFgPEzbXtmaAJVq06jMkkDKzcQeS-x-wH2MXiVoAoFShdWBVVB7BuF5mhSODWWHBCFyyRUJXEUwBVGHBryJG4jZXOHlGHBuB1x6g-QS0TA-3X03yPg5Hz1ekrzkC5AnVQPTR4gdzWUiSS1wWpEbA13pi11XAhDcAh1CAlnOhRBtHYjJGsC+Rqm20JV9h0WIL7wH36FgAADUJ8HgrRN5mUzI9snRXoVoFYkRlBnsvkko6sON54Eg2JcAVgL065qEdB4iVhzUABOfcVIiFFYPlAAdgyLiNyOMQyP0RADSKPjrnKLSPcJAHyJSJAA1zfhgL1lgFF1vlSlkjImQGiUuD3yqmT0vjemdy6KrDt1jEcA4g7wxW2RBCbxiCtHdh4mo1lxwFMhWLuzL2j0AVSgxDEP1wShKDexXECIkhuCSUvnR2mN5wUQSGaICCcHNT-C2Gi3B0eACSIhIh2JNjEBZkuBzURzACmidEBT20kC8HrUuM5ViXuIjELgvROWMMyytHMOQGsIIDQheNGPxkdEv2phVCTxoIgNK22wqyDVMgmNTAVXXG2wNV0PzEqmjSzTeC+TmGGBLRvXLQ9G+UllQj5x8hvGoLsUvmeCS1CWYiOGKBkxxBXBwBPFilTEkVCWpMVTKwwBynkGXG4BjC5x535IUS8mMA4CcGoEEDT0gmP0YU-DaC4LNAnTeEbGHRRA0nkkplZxWKU3W11zFgZMpj2D0nChWkMwABIJVL4zY2JsBVTaS-ESYXsCAkkYgf56MRU0TisZBbDSAbQJ5sBegABSc3O-HU9oM8D3ejdaPgDnaQWIKrI0k0s07AJE2KONWAtCV3IYohcUq0J6CQCKCjE4j7ISRU5UuEFgyIrAaCMifswPZE0w2KAMG4I6PSeZNXU4a6JcKpcacKKM0oIkbTcoQWFMHyAAKjmD8XG1JzVHDh5Lyh8BPK8jhI30eOMTHmxBmDki7HpF2AkAuXmFvy7wMjXCcCLBgUI0-BGMkEvm+K8EjEgnOM9IjTWwCEchkDMwZRRGuKOCnQeL5TMA5PHEJQEL6IIBqBCjYMn1E3QFiJ0AePNQfDpgZgygdyRwG14nIH4gmCknCF2NBO4g0i0kZRwvhKQFfJEEsj+3ikcUwEy1cVCSsMoizwvCIhEwxNYQeLqKfMLiPkGwxOYiElTF2F6jQgAGk-xRQCpWhjBODRylRrARiSoKNypaBBxWlMBxJSySlA0kZJoJhpLZK00rQFyLd8MEgfBcj3jmsNBRcAJED+yKKkAUImQ095SEzsA9klV849lfAwQ5JQSmxdcDSVZhdMwNB+NN15S7V0KJdATzMSF3REq-Rdg8UV9-tQokJdhHk-oNAHwDJmYIdeK0SAy3hoA+cnlSr1Zyrc8qrxcnVdIA12KUQ6r-t6lWqfAcBGqpBLlv1KR1r2qmrMASqwqtkEjZkV12j2hIpR0B5Q4oICBMEVocFnhQZfQ7QDpeTw4xhAY8cZKTQTwHrsFlLOh4wYp2wxtvifQVQ3h0Y1pV8ygHBcF3ZPgSc4ayQWV2wHczgSp8Y9CBKxZljbdd9woH9MASwJwxgOi75rZtgSItcQtGxygvBuATgrECAAAdEAJZGUKgAAdzICeGlm9WIAADvtQOb2wVIxSvgyQOax5eb+aOahAVpzIipOhjBltXBORzIPY6dRb5xGxrJ6AqtsBxQeJrsQZ2hOgSh5BR86tS05QVpE5IbKxw5VIKI4ryNjIShxw6sp1wqEjuAh9xKtJDhXB1px1MBbKYYSgSliAEFlr1rjrcjuA+UHwsJdshIndrhQlgLQLKV5gk6A7jEGLNcpLlBCpLMILRIQ9mLphaBC6VhuAj4ABJg0JNUJL0b8igBBawPJIIbZXOqU9zejcEEQOsdOtBAGp6sYpBVZYkVmL-U4AuCWREuculIkkUoWeELmMrck0-L4qPacpaNcUc0oRGkfCemSFdLIMGFYCWc1ZuomA0UHJBT4CfNbBEc6dCyWKKF0hSG0D+hqFZa-QWVhJeu+lOgwM5UgJ3beY8dwX4b3M4X3ETG9HKDkXXQvPqToyY5NGkMoP8u60CdceTOYXcW+iWI+Lwxyb+bLZS2Vc2EOKNKvSiKuJ+J0Y6S0Yob8G+oUCBnzPzeEF7WMUMRimMYNdQjE3BTg04FUD8PdXhguL8agDYMnTzHASUZ2EsIh684sEQGKUUtCwiOcFHC852SWtC1cPNTUZUF4NiA0DaR6BQR0A+9UAyEEJBeQJQUwtlHDXwAgeOzWzBpaRbWQNY6NIaOuvBp6Q4foh+SiOwqmCApBbO1AfO48jMLyQGX2L8wOb0ykoml62PUdJUOw6ukDHQ3UGQSLAqGOtnZEAmNYuJAXHyEqlreywqGMSRVGAgRsKXDFAIn2ZW0CMgbjTmHgO0YK9MYgHmrwBvMtCqenIh2Oip4K3QcLMKPc0QWII6xRlYPxFR2ADmwGS7YZ7RrwR0ZYpw-WhzMR-8unP2QqSSSgd0R0GJokbGJa-wJxPKuYME4KxPL2avLizoDOM2pGZaaSUYDm8hvhtANoy9HwbiB8FAsZgAduPWgWeAEu0gJm5j-ImDIsEAoBlQqr-WojdTXwAF8gA";

  const hash = window.location.hash;

  // Si pas de share → redirection automatique
  if (!hash || !hash.startsWith('#share=')) {
    window.location.href = DEFAULT_SHARE;
    return;
  }

  // Si share présent → charger les données
  try {
    const dec = LZString.decompressFromEncodedURIComponent(hash.slice(7));
    if (dec) {
      const data = JSON.parse(dec);
      Object.entries(data).forEach(([k, v]) => setContent(k, v));
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
