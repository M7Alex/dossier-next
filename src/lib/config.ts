// ═══════════════════════════════════════════════════════
// dossier.config — seul fichier à modifier pour un nouveau candidat
// ═══════════════════════════════════════════════════════
export const CONFIG = {
  candidat: {
    prenom: "Alex", nom: "Stark", nomComplet: "Alex Stark",
    poste: "Chef du Pôle Conseil d'Entreprises",
    departement: "Département des Finances", ville: "Los Santos", annee: "2025",
  },
  codes: { visiteur: "0707", admin: "1234", adminStats: "STARK_ADMIN_2025" },
  slides: [
    { id: "cover", type: "cover" as const, label: "Couverture" },
    {
      id: "intro", type: "chapter" as const, label: "Introduction",
      numero: "I", icon: "✦", bg: "b1", chibi: "pointer",
      content: {
        titre: "Introduction",
        blocs: [
          { key: "pos", titre: "Positionnement", texte: "Ce document constitue ma candidature formelle au poste de Chef du Pôle Conseil d'Entreprises au sein du Département des Finances de Los Santos. Il ne s'agit pas d'une simple lettre de motivation — c'est une proposition stratégique portée par plusieurs années d'expérience.\n\nJe ne postule pas pour rejoindre un département. Je postule pour le structurer, l'élever, et en faire une référence institutionnelle incontournable." },
          { key: "ctx", titre: "Contexte & Ambition", texte: "Le Pôle Conseil représente une opportunité unique : professionnaliser l'accompagnement des entreprises à un niveau comparable aux standards du monde réel.\n\nC'est précisément ce rôle que je suis en mesure de tenir — et que je suis prêt à assumer pleinement." },
          { key: "eng", titre: "Engagement", texte: "Mon engagement envers ce poste est total. Chaque décision sera guidée par une seule priorité : faire du Pôle Conseil le pilier économique le plus solide de Los Santos." },
        ],
      },
    },
    {
      id: "parcours", type: "chapter" as const, label: "Parcours",
      numero: "II", icon: "📋", bg: "b2", chibi: "scroll",
      content: {
        titre: "Parcours & Expérience",
        timeline: [
          { role: "Directeur Général", org: "Globe Oil", desc: "Direction complète, structuration des systèmes internes, planification financière long terme." },
          { role: "Co-Directeur (×2)", org: "Globe Oil", desc: "Rôle exercé à deux reprises — adaptabilité et légitimité constante auprès des équipes." },
          { role: "Directeur Associé", org: "LS Avocat", desc: "Conseil stratégique et juridique, gestion de dossiers complexes." },
          { role: "Patron / Co-Patron", org: "Plusieurs entreprises — Secteur Production", desc: "Gestion multi-entreprises, restructuration, plans financiers, optimisation logistique." },
          { role: "Employé", org: "Hen House — Début de parcours", desc: "Maîtrise du terrain et des mécaniques économiques depuis les fondations." },
        ],
        stats: [{ valeur: "6+", label: "Entreprises gérées" }, { valeur: "3", label: "Postes de direction" }],
        competences: ["Direction opérationnelle et stratégique", "Conseil juridique et structurel (LS Avocat)", "Gestion simultanée de plusieurs dossiers", "Création de plans financiers et économiques", "Restructuration d'organisations en difficulté"],
      },
    },
    {
      id: "vision", type: "chapter" as const, label: "Vision",
      numero: "III", icon: "◈", bg: "b3", chibi: "telescope",
      content: {
        titre: "Vision pour le Pôle Conseil",
        objectif: "Le Pôle Conseil doit devenir le pivot central de l'écosystème économique de Los Santos. Ma vision est de le transformer en une institution de référence capable d'accompagner des entreprises à toutes les étapes de leur développement.",
        axes: ["Professionnalisation des méthodes de conseil", "Création d'un référentiel de bonnes pratiques", "Segmentation des clients selon leur maturité", "Suivi post-intervention systématique", "Développement de partenariats stratégiques", "Élévation de l'image du Département"],
        piliers: [
          { titre: "Rigueur", desc: "Méthodes structurées, livrables précis, engagements tenus." },
          { titre: "Impact", desc: "Chaque intervention produit des résultats mesurables et durables." },
          { titre: "Vision", desc: "Anticiper les besoins avant qu'ils deviennent des crises." },
          { titre: "Cohérence", desc: "Un standard uniforme appliqué à chaque dossier sans exception." },
        ],
      },
    },
    {
      id: "systemes", type: "chapter" as const, label: "Systèmes",
      numero: "IV", icon: "⚙", bg: "b4", chibi: "calculator",
      content: {
        titre: "Stratégie & Systèmes",
        diagnostic: "Chaque entreprise fera l'objet d'un audit structuré couvrant trois dimensions : financière, organisationnelle et stratégique. Ce rapport sera remis dans un délai contractuellement défini.",
        segments: [
          { titre: "Niveau Standard", desc: "Petites structures, accompagnement ponctuel, accès aux outils de base.", premium: false },
          { titre: "Niveau Stratégique", desc: "Partenaires prioritaires, suivi régulier, expertise complète du pôle.", premium: true },
        ],
        systemes: ["Planification financière — projections 30/60/90j", "Système contractuel — standards Globe Oil", "Optimisation logistique — flux de production", "Protocole de restructuration — étapes actionnables", "Tableau de bord — KPIs post-intervention", "Rapport standardisé — livrables mesurables"],
      },
    },
    {
      id: "leadership", type: "chapter" as const, label: "Leadership",
      numero: "V", icon: "◆", bg: "b5", chibi: "clipboard",
      content: {
        titre: "Leadership & Équipe",
        structure: "Le Pôle sera organisé autour d'une hiérarchie claire : Chef de Pôle, Conseillers Senior et Conseillers Junior.",
        philosophie: "Je dirige en donnant l'exemple. Je construis des équipes autonomes — pas des exécutants, mais des professionnels qui comprennent pleinement le sens de leur mission.",
        methodes: ["Protocole d'intervention standardisé pour chaque conseiller", "Validation interne avant remise des livrables", "Sessions de formation régulières", "Système de retour d'expérience continu", "Évaluation périodique par indicateurs définis"],
      },
    },
    {
      id: "conclusion", type: "chapter" as const, label: "Conclusion",
      numero: "VI", icon: "★", bg: "b6", chibi: "trophy",
      content: {
        titre: "Impact & Conclusion",
        impacts: ["Réduction des entreprises en difficulté par accompagnement préventif", "Élévation de la qualité du roleplay économique global", "Renforcement du rôle institutionnel du Département", "Création d'un écosystème plus stable et interconnecté", "Valorisation des joueurs engagés dans des parcours ambitieux"],
        conclusion: "Ce dossier n'est pas une promesse. C'est le reflet d'un travail déjà accompli et la projection logique de ce que ce département peut devenir entre des mains expérimentées.\n\nJe suis prêt à prendre ce rôle, à en porter l'exigence.",
        citation: "Je ne suis pas là pour suivre des systèmes. Je suis là pour construire ceux sur lesquels les autres s'appuient.",
        signataire: "Alex Stark · Chef du Pôle Conseil d'Entreprises",
      },
    },
  ,
    {
      id: "legacy", type: "legacy" as const, label: "Legacy",
      numero: "VII", icon: "★", bg: "b1", chibi: "trophy",
      content: { titre: "LEGACY" },
    },
  ],
} as const;
