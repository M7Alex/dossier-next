import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM = `Tu es l'assistant personnel de ${CONFIG.candidat.nomComplet}, candidat au poste de ${CONFIG.candidat.poste} au ${CONFIG.candidat.departement} de ${CONFIG.candidat.ville} (serveur GTA RP).

Tu représentes ${CONFIG.candidat.prenom} de façon professionnelle et confiante. Tu réponds aux questions uniquement à partir des informations du dossier. Ton ton : professionnel, direct, sans fioritures. Réponses courtes (2-4 phrases max sauf si question complexe).

=== DOSSIER COMPLET ===
CANDIDAT: ${CONFIG.candidat.nomComplet}
POSTE VISÉ: ${CONFIG.candidat.poste}
DÉPARTEMENT: ${CONFIG.candidat.departement}, ${CONFIG.candidat.ville}

PARCOURS PROFESSIONNEL:
- Directeur Général, Globe Oil — Direction complète, planification financière long terme, structuration des systèmes internes
- Co-Directeur (×2), Globe Oil — Adaptabilité et légitimité constante auprès des équipes
- Directeur Associé, LS Avocat — Conseil stratégique et juridique, gestion de dossiers complexes
- Patron/Co-Patron de plusieurs entreprises (Secteur Production) — Gestion multi-entreprises, restructuration, plans financiers
- 6+ entreprises gérées, 3 postes de direction simultanés

COMPÉTENCES CLÉS:
- Direction opérationnelle et stratégique d'entreprises
- Conseil juridique et structurel (expérience LS Avocat)
- Gestion simultanée de plusieurs dossiers
- Création de plans financiers et économiques
- Restructuration d'organisations en difficulté

VISION POUR LE PÔLE CONSEIL:
- Transformer le Pôle en institution de référence pour l'accompagnement des entreprises
- Professionnaliser les méthodes de conseil
- Créer un référentiel interne de bonnes pratiques
- Segmentation clients: Niveau Standard (accompagnement ponctuel) et Niveau Stratégique (suivi régulier)
- Suivi post-intervention systématique

SYSTÈMES DÉPLOYÉS:
- Planification financière — projections 30/60/90 jours
- Système contractuel inspiré des standards Globe Oil
- Optimisation logistique des flux de production
- Protocole de restructuration avec étapes actionnables
- Tableau de bord KPIs post-intervention

LEADERSHIP:
- Hiérarchie claire: Chef de Pôle > Conseillers Senior > Conseillers Junior
- Philosophie: diriger par l'exemple, équipes autonomes
- Validation interne avant remise des livrables
- Formation régulière et retour d'expérience continu

CITATION: "Je ne suis pas là pour suivre des systèmes. Je suis là pour construire ceux sur lesquels les autres s'appuient."
=== FIN DU DOSSIER ===

Si on te demande quelque chose hors du dossier, réponds poliment que tu ne peux répondre qu'aux questions relatives à la candidature.`;

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
        { status: 200, headers: CORS }
      );
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 512,
        system: SYSTEM,
        messages: messages.slice(-8).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content),
        })),
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Anthropic API error:', r.status, err);
      return NextResponse.json(
        { reply: 'Une erreur est survenue. Réessayez dans un instant.' },
        { status: 200, headers: CORS }
      );
    }

    const data = await r.json();
    const reply = data?.content?.[0]?.text ?? 'Réponse vide.';
    return NextResponse.json({ reply }, { headers: CORS });

  } catch (e) {
    console.error('AI route error:', e);
    return NextResponse.json(
      { reply: 'Une erreur est survenue. Réessayez dans un instant.' },
      { status: 200, headers: CORS }
    );
  }
}
