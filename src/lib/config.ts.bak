import dossierData from '../../dossier.json';

export const CONFIG = {
  site: {
    title: 'Dossier RP',
    subtitle: 'Présentation',
    author: 'Alex Stark',
    year: '2026',
  },

  // ⬇️ AJOUT IMPORTANT : ancien format attendu par ton app
  candidat: {
    nomComplet: 'Alex Stark',
    poste: 'Poste visé',
    departement: 'Organisation / Gouvernement',
  },

  // ⬇️ AJOUT IMPORTANT : ancien format attendu par certaines slides / IA
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

  // ⬇️ C'est TON export figé depuis Chrome
  initialContent: dossierData,
} as const;
