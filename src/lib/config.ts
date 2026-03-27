// ═══════════════════════════════════════════════════════
// dossier.config — seul fichier à modifier pour un nouveau candidat
// Contenu mis à jour depuis localStorage (dossier-rp-v10) — 2026-03-26
// ═══════════════════════════════════════════════════════
export const CONFIG = {
  candidat: {
    prenom: "Alex", nom: "Stark", nomComplet: "Alex Stark",
    poste: "Co-DOF (Montage du pôle conseil d'entreprise)",
    departement: "Département des Finances", ville: "Los Santos", annee: "2026",
  },
  codes: { visiteur: "0707", admin: "1234", adminStats: "STARK_ADMIN_2025" },

  // ── Valeurs par défaut des champs éditables (clés du store) ──────────────
  // Ces valeurs sont utilisées quand le store est vide (= tous les visiteurs)
  defaults: {
    c0: "Département des Finances — Los Santos",
    c1: "Dossier de Candidature<div>&amp; proposition de projet</div>",
    c2: "Co-DOF (Montage du pôle conseil d'entreprise)",
    c3: "Alex Stark",
    c4: "Contrôleur fiscal &amp; CO-DOF (poste futur)",
    c5: "Dept. des Finances",
    c6: "2026",

    // Intro
    intro_pos: `Ce petit portefolio constitue ma candidature en tant que Contrôleur fiscal et la présentation du projet d'un département incluant le conseil d'entreprise au sein du Département des Finances . Il n'est pas question d'une simple lettre de motivation mais d'une proposition visant à améliorer et pérenniser l'écosystème économique.<br><br>Je ne postule pas seulement pour intégrer un département., mais pour l'élever, l'optimiser et en faire une grande référence.`,
    intro_ctx: `Le Pôle Conseil représente une grande opportunité : professionnaliser l'accompagnement des entreprises à un niveau comparable aux standards de la période de l'ancienne direction du cabinet d'avocat, ainsi que de le pousser toujours plus loin.&nbsp;<br><br>Ce rôle,&nbsp; je serait en mesure de le tenir et d'y consacrer du temps pour permettre sa mise en place.<div>Néanmoins, je prend le rôle de contrôleur fiscale très à cœur également puisqu'il est essentiel à l'ensemble du pôle économique et de son développement.&nbsp;</div><div>Je ferait donc tout mon possible pour apprendre ce métier et permettre d'alléger davantage certains système ou fonctionnement par différentes idées et d'avoir simplement une personne de plus.&nbsp;</div>`,
    intro_eng: `Mon engagement envers ce poste sera total. C'est le seul pour lequel je suis prêt à engager pleinement mon temps, mes compétences et mes ressources.`,

    // Parcours — timeline
    parc_sv0: "6+", parc_sv1: "",
    parc_o0: "Freelance",
    parc_r0: "Actuellement - Graphiste Freelance &amp; Conseillé d'entreprise Freelance",
    parc_d0: "Graphiste freelance (création graphique diverse), et conseillé dans la gestion ainsi que l'organisation de sociétés.",
    parc_o1: "LS Avocat",
    parc_r1: "Directeur Associé",
    parc_d1: "Création et gestion du pôle de Conseil d'entreprises. Gestion Multi Dossiers de plusieurs sociétés en simultanés incluant des contrats de travail, refonte organisationnelle, refonte des règlements de l'entreprise, Négociation et proposition de plusieurs types de contrats de maintenance.",
    parc_o2: "Globe Oil",
    parc_r2: "Co-Directeur (x2) - Directeur Général&nbsp; &nbsp; &nbsp;Août 2024 - Janvier 2026",
    parc_d2: "Rôle exercé à deux reprises, grande adaptabilité, réorganisation de l'entreprise plusieurs fois, création de site, gestion financière, proposition de contrats, refonte logistique.&nbsp;",
    parc_o3: "Plusieurs entreprises",
    parc_r3: "Patron / Co-Patron&nbsp; &amp; intervenant&nbsp; &nbsp; &nbsp; &nbsp;Février 2024 / Janvier 2025",
    parc_d3: "Gestion multi-entreprises, restructuration, plans financiers, optimisation de la logistique...<div>Abattoir, La ferme LS, Bûcherons, Globe Oil, Cayo Cigare, Piger Logstics, Photographe privé, Graphiste, Université LS, Bean Machine, Harmony Repair, Recycan...</div>",
    parc_o4: "Hen House — Début de parcours",
    parc_r4: "Employé - Manager - Co-Patron&nbsp; &nbsp; &nbsp;Juin 2023 / décembre 2023",
    parc_d4: "Maitrise de l'évènementiel, de l'aspect financier ainsi que de la gestion d'une équipe et d'une entreprise en ville.&nbsp;",
    parc_ck0: "Direction opérationnelle et stratégique de différentes sociétés",
    parc_ck1: "Conseil juridique et structurel (création du pôle conseil d'entreprise)",
    parc_ck2: "Gestion simultanée de plusieurs dossiers",
    parc_ck3: "Création de différents plans ainsi que des templates financiers et économiques",
    parc_ck4: "Restructuration d'organisations en position de difficulté.&nbsp;",

    // Vision
    vision_obj: `<div>DISCLAIMER : Tout ce qui est inscrit dans ce dossier peut être porté à modifications ou ajustements !, il ne s'agit en aucun cas d'une demande à copier / coller mais d'une proposition de construction plus ancré que celle actuelle. Ceci étant dit, ce dossier constitue à la foi un dossier de candidature mais également cette proposition ci-contre.&nbsp;</div><div><br></div>Le pôle conseil peu devenir un grand pivot dans l'écosystème du département des Finances. Ma vision de la situation est de pouvoir transformer l'ensemble de cette institution en une référence capable d'accompagner toutes les entreprises à toutes les étapes de leur développement, ainsi que l'accompagnement dans les finances de chacune voulant obtenir un suivi.&nbsp;`,
    vis_ax0: "Professionnalisation de différentes méthodes de conseils.",
    vis_ax1: "Avoir un suivi des entreprises par label (certifié, sous surveillance, à risque...)",
    vis_ax2: "Encadrement des grèves en partenariat avec le secrétariat et social. (préavis, justification...)",
    vis_ax3: "Audit d'entreprise sur la rentabilité, l'organisation interne, les flux logistique, la dépendance économique...",
    vis_ax4: "Développement de partenariats stratégiques et d'un système de réduction d'impôt viable (explication suivie)",
    vis_ax5: "Validation / refus ou appuie de projets d'extensions.&nbsp;",

    // Radar
    rad_0: "83", rad_1: "90", rad_2: "79", rad_3: "95", rad_4: "85", rad_5: "73",

    // Systèmes
    sys_diag: "Le but de diagnostiquer une entreprise permet de pouvoir établir un plan et une vision pour son avenir ou son accompagnement dépendant de leur demande ou de la base établie.&nbsp;",
    sys_seg0: "Niveau Standard",
    sys_seg1: "Petites structures, accompagnement ponctuel, accès aux outils de base...",
    sys_seg2: "Niveau Stratégique",
    sys_seg3: "Partenaires prioritaires, suivi régulier, expertise complète de la société selon le contrat établi.",
    sys_s0: `Réduction imposable : Permettre à certaines entreprises en difficulté de pouvoir bénéficier d'une mise en avant exceptionnelle, exemple :&nbsp;<br>L'entreprise en question au lieu de demander des subvention bénéficie du programme ci-contre :&nbsp;<br>-&gt; toute entreprises externe prenant un contrat avec cette société à partir d'un certain seuil ($) se verra bénéficier d'une baisse de leur imposition (environ 5% de la somme finale de l'imposition).&nbsp;<br>-&gt; Résultat : l'entreprise en question évitera la demande de subvention, l'externe gagnera une réduction sur la semaine, l'économie globale sera fluidifiée.<br>*ceci est un simple exemple*<br>`,
    sys_s1: "Système contractuel : standards anciennement aux avocats.",
    sys_s2: "Optimisation logistique &amp; organisationnelle&nbsp;",
    sys_s3: "Protocole de restructuration via des étapes actionnables",
    sys_s4: "Tableau de bord : KPIs post-intervention (permet la sauvegarde de fichiers après restructuration sur site)",
    sys_s5: "",

    // Leadership
    lead_struct: `<div>Le Pôle sera organisé autour d'une hiérarchie claire au départ :&nbsp;</div><div>Directeur du pôle conseil, conseiller sénior, conseiller junior.</div><div>Si fonctionnement important :&nbsp;</div><div>Directeur du pôle conseil, assistant conseiller, Conseiller sénior, Conseiller junior</div>`,
    lead_phil: `Le fait de manager une équipe en donnant l'exemple. Je construis des équipes autonomes, qui comprennent ce qu'ils font et pourquoi ils le font, transmettre un savoir pour pouvoir se surpasser. Le but serait comme dans un film culte "Un padawane et un Maître", bien que le "Padawane" puisse peut-être dépasser le maître un jour.&nbsp; Il s'agit de futur professionnels qui comprennent pleinement le sens de leur mission.`,
    lead_m0: "Protocole d'intervention pour chaque conseiller",
    lead_m1: "Validation interne avant remise des livrables",
    lead_m2: "Sessions de formation régulières",
    lead_m3: "Système de retour d'expérience continu",
    lead_m4: "Évaluation périodique (Bilan réguliers de la progression d'équipe et de la situation)",

    // Conclusion
    conc_im0: "Réduction des entreprises en difficulté par accompagnement préventif et professionnel",
    conc_im1: "Élévation de la qualité du pôle complet et activité diversifiées",
    conc_im2: "Renforcement du rôle institutionnel du Département, le but étant d'en faire une référence",
    conc_im3: "Création d'un écosystème plus stable et interconnecté",
    conc_im4: "Valorisation des acteurs engagés dans des parcours ambitieux",
    conc_txt: `Ce dossier n'est pas une simple promesse en l'air. Ceci est bien le reflet d'un travail déjà accompli et la projection logique de ce que ce département peut devenir en continuant d'évoluer par des experts en la matière.<br><br>Je suis prêt à pouvoir donner de mon expérience et de mon temps pour ce projet d'avenir.<div><br></div><div>(pour me vendre un peu plus je suis rank diamant sur brawlhalla mais une chance sur 2 que je flop)</div>`,
    conc_cit: `"Je ne suis pas là pour suivre un systèmes, mais pour l'aider à évoluer et construire ceux sur lesquels les autres s'appuient."`,
    conc_sig: "Alex Stark · Ancien avocat d'affaires &amp; directeur d'entreprises.",
  } as Record<string, string>,

  slides: [
    { id: "cover", type: "cover" as const, label: "Couverture" },
    {
      id: "intro", type: "chapter" as const, label: "Introduction",
      numero: "I", icon: "✦", bg: "b1", chibi: "pointer",
      content: {
        titre: "Introduction",
        blocs: [
          { key: "pos", titre: "Positionnement", texte: "Ce petit portefolio constitue ma candidature en tant que Contrôleur fiscal et la présentation du projet d'un département incluant le conseil d'entreprise au sein du Département des Finances." },
          { key: "ctx", titre: "Contexte & Ambition", texte: "Le Pôle Conseil représente une grande opportunité : professionnaliser l'accompagnement des entreprises à un niveau comparable aux standards de la période de l'ancienne direction du cabinet d'avocat." },
          { key: "eng", titre: "Engagement", texte: "Mon engagement envers ce poste sera total. C'est le seul pour lequel je suis prêt à engager pleinement mon temps, mes compétences et mes ressources." },
        ],
      },
    },
    {
      id: "parcours", type: "chapter" as const, label: "Parcours",
      numero: "II", icon: "📋", bg: "b2", chibi: "scroll",
      content: {
        titre: "Parcours & Expérience",
        timeline: [
          { role: "Actuellement - Graphiste Freelance & Conseillé d'entreprise Freelance", org: "Freelance", desc: "Graphiste freelance (création graphique diverse), et conseillé dans la gestion ainsi que l'organisation de sociétés." },
          { role: "Directeur Associé", org: "LS Avocat", desc: "Création et gestion du pôle de Conseil d'entreprises. Gestion Multi Dossiers de plusieurs sociétés en simultanés incluant des contrats de travail, refonte organisationnelle, refonte des règlements de l'entreprise, Négociation et proposition de plusieurs types de contrats de maintenance." },
          { role: "Co-Directeur (x2) - Directeur Général — Août 2024 - Janvier 2026", org: "Globe Oil", desc: "Rôle exercé à deux reprises, grande adaptabilité, réorganisation de l'entreprise plusieurs fois, création de site, gestion financière, proposition de contrats, refonte logistique." },
          { role: "Patron / Co-Patron & intervenant — Février 2024 / Janvier 2025", org: "Plusieurs entreprises", desc: "Gestion multi-entreprises, restructuration, plans financiers, optimisation de la logistique... Abattoir, La ferme LS, Bûcherons, Globe Oil, Cayo Cigare, Piger Logstics, Graphiste, Université LS, Bean Machine, Harmony Repair, Recycan..." },
          { role: "Employé - Manager - Co-Patron — Juin 2023 / décembre 2023", org: "Hen House — Début de parcours", desc: "Maitrise de l'évènementiel, de l'aspect financier ainsi que de la gestion d'une équipe et d'une entreprise en ville." },
        ],
        stats: [{ valeur: "6+", label: "Entreprises gérées" }, { valeur: "", label: "" }],
        competences: [
          "Direction opérationnelle et stratégique de différentes sociétés",
          "Conseil juridique et structurel (création du pôle conseil d'entreprise)",
          "Gestion simultanée de plusieurs dossiers",
          "Création de différents plans ainsi que des templates financiers et économiques",
          "Restructuration d'organisations en position de difficulté.",
        ],
      },
    },
    {
      id: "vision", type: "chapter" as const, label: "Vision",
      numero: "III", icon: "◈", bg: "b3", chibi: "telescope",
      content: {
        titre: "Vision pour le Pôle Conseil",
        objectif: "Le pôle conseil peu devenir un grand pivot dans l'écosystème du département des Finances. Ma vision de la situation est de pouvoir transformer l'ensemble de cette institution en une référence capable d'accompagner toutes les entreprises à toutes les étapes de leur développement.",
        axes: [
          "Professionnalisation de différentes méthodes de conseils.",
          "Avoir un suivi des entreprises par label (certifié, sous surveillance, à risque...)",
          "Encadrement des grèves en partenariat avec le secrétariat et social. (préavis, justification...)",
          "Audit d'entreprise sur la rentabilité, l'organisation interne, les flux logistique, la dépendance économique...",
          "Développement de partenariats stratégiques et d'un système de réduction d'impôt viable (explication suivie)",
          "Validation / refus ou appuie de projets d'extensions.",
        ],
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
        diagnostic: "Le but de diagnostiquer une entreprise permet de pouvoir établir un plan et une vision pour son avenir ou son accompagnement dépendant de leur demande ou de la base établie.",
        segments: [
          { titre: "Niveau Standard", desc: "Petites structures, accompagnement ponctuel, accès aux outils de base...", premium: false },
          { titre: "Niveau Stratégique", desc: "Partenaires prioritaires, suivi régulier, expertise complète de la société selon le contrat établi.", premium: true },
        ],
        systemes: [
          "Réduction imposable : programme d'accompagnement préventif des entreprises en difficulté",
          "Système contractuel : standards anciennement aux avocats.",
          "Optimisation logistique & organisationnelle",
          "Protocole de restructuration via des étapes actionnables",
          "Tableau de bord : KPIs post-intervention (permet la sauvegarde de fichiers après restructuration sur site)",
          "",
        ],
      },
    },
    {
      id: "leadership", type: "chapter" as const, label: "Leadership",
      numero: "V", icon: "◆", bg: "b5", chibi: "clipboard",
      content: {
        titre: "Leadership & Équipe",
        structure: "Le Pôle sera organisé autour d'une hiérarchie claire au départ : Directeur du pôle conseil, conseiller sénior, conseiller junior. Si fonctionnement important : Directeur du pôle conseil, assistant conseiller, Conseiller sénior, Conseiller junior",
        philosophie: `Le fait de manager une équipe en donnant l'exemple. Je construis des équipes autonomes, qui comprennent ce qu'ils font et pourquoi ils le font, transmettre un savoir pour pouvoir se surpasser. Le but serait comme dans un film culte "Un padawane et un Maître", bien que le "Padawane" puisse peut-être dépasser le maître un jour. Il s'agit de futur professionnels qui comprennent pleinement le sens de leur mission.`,
        methodes: [
          "Protocole d'intervention pour chaque conseiller",
          "Validation interne avant remise des livrables",
          "Sessions de formation régulières",
          "Système de retour d'expérience continu",
          "Évaluation périodique (Bilan réguliers de la progression d'équipe et de la situation)",
        ],
      },
    },
    {
      id: "conclusion", type: "chapter" as const, label: "Conclusion",
      numero: "VI", icon: "★", bg: "b6", chibi: "trophy",
      content: {
        titre: "Impact & Conclusion",
        impacts: [
          "Réduction des entreprises en difficulté par accompagnement préventif et professionnel",
          "Élévation de la qualité du pôle complet et activité diversifiées",
          "Renforcement du rôle institutionnel du Département, le but étant d'en faire une référence",
          "Création d'un écosystème plus stable et interconnecté",
          "Valorisation des acteurs engagés dans des parcours ambitieux",
        ],
        conclusion: "Ce dossier n'est pas une simple promesse en l'air. Ceci est bien le reflet d'un travail déjà accompli et la projection logique de ce que ce département peut devenir en continuant d'évoluer par des experts en la matière.\n\nJe suis prêt à pouvoir donner de mon expérience et de mon temps pour ce projet d'avenir.\n\n(pour me vendre un peu plus je suis rank diamant sur brawlhalla mais une chance sur 2 que je flop)",
        citation: "Je ne suis pas là pour suivre un systèmes, mais pour l'aider à évoluer et construire ceux sur lesquels les autres s'appuient.",
        signataire: "Alex Stark · Ancien avocat d'affaires & directeur d'entreprises.",
      },
    },
    {
      id: "legacy", type: "legacy" as const, label: "Legacy",
      numero: "VII", icon: "★", bg: "b1", chibi: "trophy",
      content: { titre: "LEGACY" },
    },
  ],
} as const;
