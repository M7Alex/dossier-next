import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getKVConfig() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
  };
}

async function kv(path: string, body?: any) {
  const { url, token } = getKVConfig();
  if (!url || !token) throw new Error('KV not configured');
  const r = await fetch(`${url}${path}`, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return r.json();
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('adminKey');
  if (key !== CONFIG.codes.adminStats) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }
  try {
    const [totalRes, sessionsRes] = await Promise.all([
      kv('/get/total_visits'),
      kv('/lrange/sessions/0/49'),
    ]);
    const total = totalRes.result ? JSON.parse(totalRes.result) : 0;
    const sessions = (sessionsRes.result || [])
      .map((v: string) => { try { return JSON.parse(v); } catch { return null; } })
      .filter(Boolean);
    return NextResponse.json({ total, sessions }, { headers: CORS });
  } catch {
    return NextResponse.json({ total: 0, sessions: [], error: 'KV not configured' }, { headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  const { event, sessionId, data } = await req.json();
  try {
    if (event === 'open') {
      const session = {
        id: sessionId,
        startedAt: new Date().toISOString(),
        slides: {}, duration: 0, lastSlide: 0,
      };
      await kv(`/set/session:${sessionId}`, JSON.stringify(session));
      const totalRes = await kv('/get/total_visits');
      const total = totalRes.result ? JSON.parse(totalRes.result) : 0;
      await kv('/set/total_visits', JSON.stringify(total + 1));
    }
    if (event === 'slide') {
      const res = await kv(`/get/session:${sessionId}`);
      if (res.result) {
        const session = JSON.parse(res.result);
        session.slides[data.slide] = (session.slides[data.slide] || 0) + data.duration;
        session.lastSlide = data.slide;
        await kv(`/set/session:${sessionId}`, JSON.stringify(session));
      }
    }
    if (event === 'close') {
      const res = await kv(`/get/session:${sessionId}`);
      if (res.result) {
        const session = JSON.parse(res.result);
        session.duration = data.duration;
        session.endedAt = new Date().toISOString();
        await kv('/lpush/sessions', JSON.stringify(session));
      }
    }
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch {
    // Silently fail si KV pas configuré
    return NextResponse.json({ ok: false }, { headers: CORS });
  }
}
