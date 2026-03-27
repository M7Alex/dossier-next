import dossierData from '../../dossier.json';

export const CONFIG = {
  site: {
    title: 'Dossier RP',
    subtitle: 'Présentation',
    author: 'Alex Stark',
    year: '2026',
  },

  candidat: {
    nomComplet: 'Alex Stark',
    poste: 'Poste visé',
    departement: 'Organisation / Gouvernement',
  },

  presentation: {
    accroche: 'Candidature immersive et structurée',
    objectif: 'Présenter une vision claire, cohérente et professionnelle.',
  },

  slides: [
    { id: 'cover', type: 'cover' },
    { id: 'intro', type: 'chapter' },
    { id: 'parcours', type: 'chapter' },
    { id: 'vision', type: 'chapter' },
    { id: 'systemes', type: 'chapter' },
    { id: 'leadership', type: 'chapter' },
    { id: 'conclusion', type: 'chapter' },
    { id: 'legacy', type: 'legacy' },
  ] as const,

  stats: {
    enabled: true,
  },

  ai: {
    enabled: true,
  },

  // ⚠️ AJOUTÉ pour corriger /api/stats/route.ts
  codes: {
    adminStats: 'admin123',
  },

  initialContent: dossierData,
} as const;
