import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Récupère le contenu sauvegardé dans KV (modifications admin en temps réel)
async function getSavedContent(): Promise<Record<string, string>> {
  try {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return {};
    const r = await fetch(`${url}/get/dossier_content`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await r.json();
    if (!j.result) return {};
    const parsed = JSON.parse(j.result);
    return parsed?.content || {};
  } catch {
    return {};
  }
}

// Construit le system prompt à partir du contenu KV + config de base
function buildSystemPrompt(saved: Record<string, string>): string {
  // Helpers: récupère la valeur modifiée ou la valeur par défaut config
  const g = (key: string, fallback: string) =>
    saved[key] ? saved[key].replace(/<[^>]*>/g, '').trim() : fallback;

  const c = CONFIG.candidat;

  return `Tu es l'assistant personnel de ${g('c3', c.nomComplet)}, candidat au poste de ${g('c4', c.poste)} au ${g('c5', c.departement)} de ${c.ville} (serveur GTA RP).

Tu représentes ce candidat de façon professionnelle et confiante. Tu réponds uniquement à partir des informations du dossier ci-dessous. Ton ton : professionnel, direct, sans fioritures. Réponses courtes (2-4 phrases max sauf si question complexe).

=== DOSSIER ===

CANDIDAT: ${g('c3', c.nomComplet)}
POSTE VISÉ: ${g('c4', c.poste)}
DÉPARTEMENT: ${g('c5', c.departement)}, ${c.ville}

INTRODUCTION:
${g('intro_pos', "Candidature formelle au poste de Chef du Pôle Conseil d'Entreprises. Proposition stratégique portée par plusieurs années d'expérience au cœur de l'écosystème économique du serveur.")}

${g('intro_ctx', "Le Pôle Conseil représente une opportunité unique de professionnaliser l'accompagnement des entreprises à un niveau comparable aux standards du monde réel.")}

${g('intro_eng', "Engagement total. Priorité : faire du Pôle Conseil le pilier économique le plus solide de Los Santos.")}

PARCOURS PROFESSIONNEL:
- ${g('parc_r0', 'Directeur Général')} — ${g('parc_o0', 'Globe Oil')} : ${g('parc_d0', 'Direction complète, structuration interne, planification financière long terme.')}
- ${g('parc_r1', 'Co-Directeur (×2)')} — ${g('parc_o1', 'Globe Oil')} : ${g('parc_d1', 'Adaptabilité et légitimité constante auprès des équipes.')}
- ${g('parc_r2', 'Directeur Associé')} — ${g('parc_o2', 'LS Avocat')} : ${g('parc_d2', 'Conseil stratégique et juridique, gestion de dossiers complexes.')}
- ${g('parc_r3', 'Patron / Co-Patron')} — ${g('parc_o3', 'Plusieurs entreprises — Secteur Production')} : ${g('parc_d3', 'Gestion multi-entreprises, restructuration, plans financiers.')}
- ${g('parc_r4', 'Employé')} — ${g('parc_o4', 'Hen House')} : ${g('parc_d4', "Maîtrise des mécaniques économiques depuis les fondations.")}

CHIFFRES CLÉS: ${g('parc_sv0', '6+')} entreprises gérées, ${g('parc_sv1', '3')} postes de direction simultanés

COMPÉTENCES CLÉS:
- ${g('parc_ck0', 'Direction opérationnelle et stratégique')}
- ${g('parc_ck1', 'Conseil juridique et structurel')}
- ${g('parc_ck2', 'Gestion simultanée de plusieurs dossiers')}
- ${g('parc_ck3', 'Création de plans financiers et économiques')}
- ${g('parc_ck4', "Restructuration d'organisations en difficulté")}

VISION POUR LE PÔLE CONSEIL:
${g('vision_obj', "Transformer le Pôle Conseil en institution de référence pour l'accompagnement des entreprises. Professionnaliser les méthodes, créer un référentiel de bonnes pratiques, segmentation clients Standard/Stratégique.")}

AXES DE DÉVELOPPEMENT:
- ${g('vis_ax0', 'Professionnalisation des méthodes de conseil')}
- ${g('vis_ax1', "Création d'un référentiel de bonnes pratiques")}
- ${g('vis_ax2', 'Segmentation des clients selon leur maturité')}
- ${g('vis_ax3', 'Suivi post-intervention systématique')}
- ${g('vis_ax4', 'Développement de partenariats stratégiques')}
- ${g('vis_ax5', "Élévation de l'image du Département")}

PILIERS: ${g('vis_pi0', 'Rigueur')} — ${g('vis_pi1', 'Impact')} — ${g('vis_pi2', 'Vision')} — ${g('vis_pi3', 'Cohérence')}

STRATÉGIE & SYSTÈMES:
${g('sys_diag', "Audit structuré couvrant 3 dimensions: financière, organisationnelle et stratégique. Rapport remis dans un délai contractuellement défini.")}

Segmentation: ${g('sys_seg0', 'Standard — accompagnement ponctuel')} / ${g('sys_seg1', 'Stratégique — suivi régulier et expertise complète')}

Systèmes déployés:
- ${g('sys_s0', 'Planification financière 30/60/90j')}
- ${g('sys_s1', 'Système contractuel standards Globe Oil')}
- ${g('sys_s2', 'Optimisation logistique flux de production')}
- ${g('sys_s3', 'Protocole de restructuration avec étapes actionnables')}
- ${g('sys_s4', 'Tableau de bord KPIs post-intervention')}
- ${g('sys_s5', 'Rapport standardisé et livrables mesurables')}

LEADERSHIP:
${g('lead_struct', 'Hiérarchie claire: Chef de Pôle, Conseillers Senior, Conseillers Junior.')}
${g('lead_phil', "Diriger par l'exemple. Équipes autonomes, pas des exécutants.")}

Méthodes:
- ${g('lead_m0', "Protocole d'intervention standardisé")}
- ${g('lead_m1', 'Validation interne avant remise des livrables')}
- ${g('lead_m2', 'Sessions de formation régulières')}
- ${g('lead_m3', "Système de retour d'expérience continu")}

IMPACT & CONCLUSION:
${g('conc_txt', "Ce dossier n'est pas une promesse. C'est le reflet d'un travail déjà accompli et la projection logique de ce que ce département peut devenir.")}

CITATION: "${g('conc_cit', "Je ne suis pas là pour suivre des systèmes. Je suis là pour construire ceux sur lesquels les autres s'appuient.")}"

=== FIN DU DOSSIER ===

Si on te demande quelque chose hors du dossier, réponds poliment que tu ne peux répondre qu'aux questions relatives à cette candidature.`;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body?.messages;
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ reply: 'Requête invalide.' }, { status: 400, headers: CORS });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: 'Assistant temporairement indisponible (clé API non configurée).' },
        { headers: CORS }
      );
    }

    // Charger le contenu sauvegardé depuis KV pour avoir le contexte à jour
    const saved = await getSavedContent();
    const systemPrompt = buildSystemPrompt(saved);

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        system: systemPrompt,
        messages: messages.slice(-8).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content),
        })),
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Anthropic error:', r.status, err);
      return NextResponse.json(
        { reply: 'Une erreur est survenue. Réessayez dans un instant.' },
        { headers: CORS }
      );
    }

    const data = await r.json();
    const reply = data?.content?.[0]?.text ?? 'Réponse vide.';
    return NextResponse.json({ reply }, { headers: CORS });

  } catch (e) {
    console.error('AI route error:', e);
    return NextResponse.json(
      { reply: 'Une erreur est survenue. Réessayez dans un instant.' },
      { headers: CORS }
    );
  }
}
