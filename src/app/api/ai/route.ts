import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getSavedContent(): Promise<Record<string, string>> {
  try {
    const url   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || '';
    const token = process.env.KV_REST_API_TOKEN  || process.env.UPSTASH_REDIS_REST_TOKEN || '';
    if (!url || !token) return {};
    const r = await fetch(`${url}/get/dossier_content`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const j = await r.json();
    if (!j.result) return {};
    const parsed = JSON.parse(j.result);
    return parsed?.content || {};
  } catch { return {}; }
}

function strip(h: string) { return h.replace(/<[^>]*>/g, '').trim(); }

function buildSystem(saved: Record<string, string>): string {
  const g = (k: string, fb: string) => saved[k] ? strip(saved[k]) : fb;
  const c = CONFIG.candidat;
  return `Tu es l'assistant de ${g('c3', c.nomComplet)}, candidat au poste de ${g('c4', c.poste)} au ${g('c5', c.departement)} (GTA RP).
Réponds en français, professionnellement, en 2-4 phrases max. Tu ne connais que le contenu du dossier ci-dessous.

CANDIDAT: ${g('c3', c.nomComplet)} | POSTE: ${g('c4', c.poste)} | DEPT: ${g('c5', c.departement)}

INTRODUCTION: ${g('intro_pos', "Candidature stratégique au poste de Chef du Pôle Conseil d'Entreprises.")} ${g('intro_ctx', "Objectif: professionnaliser l'accompagnement des entreprises.")} ${g('intro_eng', "Engagement total pour faire du Pôle le pilier économique de Los Santos.")}

PARCOURS: ${g('parc_r0','DG')} @ ${g('parc_o0','Globe Oil')} — ${g('parc_d0','Direction complète.')} | ${g('parc_r1','Co-Dir')} @ ${g('parc_o1','Globe Oil')} — ${g('parc_d1','Adaptabilité.')} | ${g('parc_r2','Dir. Associé')} @ ${g('parc_o2','LS Avocat')} — ${g('parc_d2','Conseil juridique.')} | ${g('parc_r3','Patron')} @ ${g('parc_o3','Secteur Production')} — ${g('parc_d3','Multi-entreprises.')}
STATS: ${g('parc_sv0','6+')} entreprises, ${g('parc_sv1','3')} postes de direction.
COMPÉTENCES: ${g('parc_ck0','Direction stratégique')} | ${g('parc_ck1','Conseil juridique')} | ${g('parc_ck2','Multi-dossiers')} | ${g('parc_ck3','Plans financiers')} | ${g('parc_ck4','Restructuration')}

VISION: ${g('vision_obj','Transformer le Pôle en institution de référence.')}
AXES: ${g('vis_ax0','Professionnalisation')} | ${g('vis_ax1','Référentiel')} | ${g('vis_ax2','Segmentation')} | ${g('vis_ax3','Suivi post-intervention')}

SYSTÈMES: ${g('sys_diag','Audit 3 dimensions: financier, organisationnel, stratégique.')}
Segments: ${g('sys_seg0','Standard — ponctuel')} / ${g('sys_seg1','Stratégique — suivi régulier')}
Outils: ${g('sys_s0','Plan 30/60/90j')} | ${g('sys_s1','Contractuel')} | ${g('sys_s2','Logistique')} | ${g('sys_s3','Restructuration')} | ${g('sys_s4','KPIs')}

LEADERSHIP: ${g('lead_struct','Chef > Senior > Junior.')} ${g('lead_phil',"Diriger par l'exemple.")}

CONCLUSION: ${g('conc_txt','Dossier = reflet du travail accompli.')}
CITATION: "${g('conc_cit',"Je ne suis pas là pour suivre des systèmes. Je suis là pour construire ceux sur lesquels les autres s'appuient.")}"`;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: 'Requête invalide.' }, { headers: CORS });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: 'Assistant non configuré — clé API manquante.' },
        { headers: CORS }
      );
    }

    // Clean messages: ensure alternating user/assistant, no empty content
    const cleaned: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const m of messages.slice(-8)) {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      const content = String(m.content || '').trim();
      if (!content) continue;
      // Avoid consecutive same roles
      if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === role) continue;
      cleaned.push({ role, content });
    }
    // Must start with user
    if (cleaned.length === 0 || cleaned[0].role !== 'user') {
      return NextResponse.json({ reply: 'Posez votre question.' }, { headers: CORS });
    }

    const saved  = await getSavedContent();
    const system = buildSystem(saved);

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system,
        messages: cleaned,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('Anthropic error:', r.status, JSON.stringify(data));
      return NextResponse.json(
        { reply: `Erreur API (${r.status}). Réessayez.` },
        { headers: CORS }
      );
    }

    const reply = data?.content?.[0]?.text ?? 'Réponse vide.';
    return NextResponse.json({ reply }, { headers: CORS });

  } catch (e: any) {
    console.error('AI route crash:', e?.message);
    return NextResponse.json({ reply: 'Erreur serveur. Réessayez.' }, { headers: CORS });
  }
}
