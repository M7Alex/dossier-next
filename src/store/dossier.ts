import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CONFIG } from '@/lib/config';

type AccessMode = 'locked' | 'visitor' | 'admin';

interface DossierState {
  mode: AccessMode;
  setMode: (m: AccessMode) => void;
  currentSlide: number;
  setSlide: (i: number) => void;
  // content = overrides admins UNIQUEMENT — les visiteurs voient toujours CONFIG.defaults
  content: Record<string, string>;
  setContent: (key: string, value: string) => void;
  resetContent: () => void;
  extraPages: any[];
  addPage: (page: any) => void;
  removePage: (id: string) => void;
  isMuted: boolean;
  toggleMute: () => void;
  volumeLevel: number;
  setVolumeLevel: (v: number) => void;
  showChat: boolean;
  toggleChat: () => void;
  showStats: boolean;
  toggleStats: () => void;
  showWatermark: boolean;
  toggleWatermark: () => void;
}

export const useDossier = create<DossierState>()(
  persist(
    (set) => ({
      mode: 'locked',
      setMode: (m) => set({ mode: m }),
      currentSlide: 0,
      setSlide: (i) => set({ currentSlide: i }),
      // content vide par défaut — les composants lisent CONFIG.defaults via getVal()
      content: {},
      setContent: (key, value) => set((s) => ({ content: { ...s.content, [key]: value } })),
      resetContent: () => set({ content: {} }),
      extraPages: [],
      addPage: (page) => set((s) => ({ extraPages: [...s.extraPages, page] })),
      removePage: (id) => set((s) => ({ extraPages: s.extraPages.filter((p) => p.id !== id) })),
      isMuted: false,
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      volumeLevel: 70,
      setVolumeLevel: (v) => set({ volumeLevel: v }),
      showChat: false,
      toggleChat: () => set((s) => ({ showChat: !s.showChat })),
      showStats: false,
      toggleStats: () => set((s) => ({ showStats: !s.showStats })),
      showWatermark: false,
      toggleWatermark: () => set((s) => ({ showWatermark: !s.showWatermark })),
    }),
    {
      name: 'dossier-rp-v11', // ← clé changée : efface l'ancien localStorage automatiquement
      partialize: (s) => ({
        // On ne persiste PAS content — tout le monde voit CONFIG.defaults
        // Seuls volume et mode (non-sensible) sont gardés
        volumeLevel: s.volumeLevel,
      }),
      merge: (_persisted: any, current: any) => ({
        ...current,
        content: {}, // toujours vide au chargement → utilise CONFIG.defaults
        volumeLevel: (_persisted as any)?.volumeLevel ?? 70,
        extraPages: [],
      }),
    }
  )
);

// ── Helper global : lit le store puis fallback sur CONFIG.defaults ────────────
// Utilisable dans tous les composants comme alternative à useDossier()
export function getVal(content: Record<string, string>, sk: string, fallback: string): string {
  return content[sk] ?? CONFIG.defaults[sk] ?? fallback;
}
