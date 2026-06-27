import { NextRequest, NextResponse } from 'next/server';

const N8N_URL = process.env.N8N_BASE_URL
  ? `${process.env.N8N_BASE_URL}${process.env.N8N_WEBHOOK_NEXT_DAY ?? '/closeit/next-day'}`
  : null;

const SECRET = process.env.N8N_WEBHOOK_SECRET ?? 'closeit_secret_2026';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!N8N_URL || process.env.MOCK_N8N === 'true') {
    return NextResponse.json({ ok: true, mock: true });
  }

  try {
    const res = await fetch(N8N_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': SECRET,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000), // n8n can be slow with multiple OpenAI calls
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[next-day] n8n error:', res.status, text);
      return NextResponse.json({ ok: false, error: `n8n ${res.status}`, mock: true });
    }

    return NextResponse.json(await res.json());
  } catch (err) {
    console.error('[next-day] fetch failed:', err);
    return NextResponse.json({ ok: false, error: String(err), mock: true });
  }
}
