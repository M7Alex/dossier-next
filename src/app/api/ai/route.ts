import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

const SYSTEM = `Tu es l'assistant personnel de ${CONFIG.candidat.nomComplet}, candidat au poste de ${CONFIG.candidat.poste} au ${CONFIG.candidat.departement} de ${CONFIG.candidat.ville} (serveur GTA RP).

Tu représentes ${CONFIG.candidat.prenom} de façon professionnelle et confiante. Tu réponds aux questions uniquement à partir des informations du dossier ci-dessous. Ton ton : professionnel, direct, sans fioritures. Réponses courtes (2-4 phrases max).

=== DOSSIER ===
PARCOURS: Directeur Général Globe Oil, Co-Directeur Globe Oil (x2), Directeur Associé LS Avocat, Patron/Co-Patron plusieurs entreprises production, 6+ entreprises gérées, 3 postes de direction.
COMPÉTENCES: Direction stratégique, conseil juridique, gestion multi-dossiers, plans financiers, restructuration.
VISION: Transformer le Pôle Conseil en institution de référence, professionnaliser l'accompagnement, créer un référentiel de bonnes pratiques, segmentation clients Standard/Stratégique.
SYSTÈMES: Planification 30/60/90j, protocole contractuel, optimisation logistique, protocole restructuration, tableau de bord KPIs.
LEADERSHIP: Hiérarchie Chef/Senior/Junior, diriger par l'exemple, équipes autonomes, formation régulière.
CITATION: "Je ne suis pas là pour suivre des systèmes. Je suis là pour construire ceux sur lesquels les autres s'appuient."
=== FIN ===`;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ reply: 'API non configurée.' }, { status: 500, headers: CORS });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, system: SYSTEM, messages: (messages || []).slice(-6) }),
    });
    const data = await r.json();
    return NextResponse.json({ reply: data.content?.[0]?.text || '' }, { headers: CORS });
  } catch {
    return NextResponse.json({ reply: 'Erreur de connexion.' }, { status: 502, headers: CORS });
  }
}
