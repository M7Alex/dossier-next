import { NextRequest, NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const NO_CACHE = {
  ...CORS,
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
};

// Compatible Upstash Redis REST API + ancien @vercel/kv
function getKVConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
  };
}

async function kvSet(key: string, value: string) {
  const { url, token } = getKVConfig();
  if (!url || !token) throw new Error('KV not configured');

  const r = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
    cache: 'no-store',
  });

  return r.json();
}

async function kvGet(key: string) {
  const { url, token } = getKVConfig();
  if (!url || !token) throw new Error('KV not configured');

  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const j = await r.json();
  return j.result;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: NO_CACHE });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload = JSON.stringify({
      ...body,
      savedAt: new Date().toISOString(),
    });

    await kvSet('dossier_content', payload);

    return NextResponse.json(
      { ok: true, savedAt: new Date().toISOString() },
      { headers: NO_CACHE }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, reason: 'KV not configured or save failed' },
      { headers: NO_CACHE }
    );
  }
}

export async function GET() {
  try {
    const raw = await kvGet('dossier_content');

    if (!raw) {
      return NextResponse.json(
        { content: {}, extraPages: [], savedAt: null },
        { headers: NO_CACHE }
      );
    }

    return NextResponse.json(JSON.parse(raw), { headers: NO_CACHE });
  } catch {
    return NextResponse.json(
      { content: {}, extraPages: [], savedAt: null },
      { headers: NO_CACHE }
    );
  }
}
