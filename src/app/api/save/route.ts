import { NextRequest, NextResponse } from 'next/server';
import dossierData from '../../../../dossier.json';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let memoryData = dossierData;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    memoryData = {
      content: body.content || {},
      extraPages: body.extraPages || [],
      savedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { headers: CORS });
  }
}

export async function GET() {
  try {
    return NextResponse.json(memoryData, {
      headers: {
        ...CORS,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch {
    return NextResponse.json({ content: {}, extraPages: [] }, { headers: CORS });
  }
}
