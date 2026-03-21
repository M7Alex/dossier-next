import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AccessMode = 'locked' | 'visitor' | 'admin';

interface DossierState {
  mode: AccessMode;
  setMode: (m: AccessMode) => void;
  currentSlide: number;
  setSlide: (i: number) => void;
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
      name: 'dossier-rp-v9',
      partialize: (s) => ({ content: s.content, volumeLevel: s.volumeLevel }),
      // Never restore extraPages from localStorage
      merge: (persisted: any, current: any) => ({
        ...current,
        content: persisted?.content || {},
        volumeLevel: persisted?.volumeLevel ?? 70,
        extraPages: [], // always start with no extra pages
      }),
    }
  )
);
