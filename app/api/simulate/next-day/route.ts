import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://n8n.srv1348908.hstgr.cloud/webhook';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { closeItEnabled, ...payload } = body;

  const path = closeItEnabled === false ? '/closeit/next-day-manual' : '/closeit/next-day';
  const url = `${BASE}${path}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return NextResponse.json({ ok: res.ok, status: res.status, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
