import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ✅ Définition du chemin du fichier temporaire
const FILE_PATH = path.join('/tmp', 'dossier.json');

// CORS pour que le front puisse faire des fetch
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS pour préflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// POST pour sauvegarder le contenu
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = JSON.stringify({ ...body, savedAt: new Date().toISOString() });

    // Écriture du fichier dans /tmp
    fs.writeFileSync(FILE_PATH, payload, 'utf-8');

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: e.message }, { headers: CORS });
  }
}

// GET pour récupérer le contenu
export async function GET() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      return NextResponse.json({ content: {}, extraPages: [] }, { headers: CORS });
    }

    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(raw), { headers: CORS });
  } catch {
    return NextResponse.json({ content: {}, extraPages: [] }, { headers: CORS });
  }
}
