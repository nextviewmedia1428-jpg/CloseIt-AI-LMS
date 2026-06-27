// In the new architecture the store's nextDay() runs the day engine client-side
// (MOCK_N8N mode) or calls n8n via this route (live mode).
// For now this is a passthrough stub — live n8n wiring comes in Phase 7.
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: true });
}
