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

    const raw = await res.json();
    // n8n returns an array when the webhook fires multiple times (rapid clicks before button disables)
    // Merge all items: deduplicate by ID, union all arrays
    const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : [raw];
    if (items.length === 1) return NextResponse.json(items[0]);

    const seenLeads = new Set<string>();
    const seenMsgs = new Set<string>(); // leadId+from+body key
    const seenActions = new Set<string>();
    const seenTasks = new Set<string>();
    const seenTaskUpdates = new Set<string>();
    const merged: Record<string, unknown[]> = { newLeads: [], threadMessages: [], scoreUpdates: [], statusUpdates: [], leadUpdates: [], agentActions: [], notifications: [], tasks: [], taskUpdates: [] };

    for (const item of items) {
      for (const l of (item.newLeads as {id:string}[] ?? [])) { if (!seenLeads.has(l.id)) { seenLeads.add(l.id); (merged.newLeads as unknown[]).push(l); } }
      for (const m of (item.threadMessages as {leadId:string;from:string;body:string}[] ?? [])) {
        const k = `${m.leadId}|${m.from}|${m.body.slice(0,40)}`;
        if (!seenMsgs.has(k)) { seenMsgs.add(k); (merged.threadMessages as unknown[]).push(m); }
      }
      for (const u of (item.scoreUpdates as {leadId:string}[] ?? [])) {
        if (!(merged.scoreUpdates as {leadId:string}[]).some(x => x.leadId === u.leadId)) (merged.scoreUpdates as unknown[]).push(u);
      }
      for (const u of (item.statusUpdates as {leadId:string}[] ?? [])) (merged.statusUpdates as unknown[]).push(u);
      for (const u of (item.leadUpdates as {leadId:string}[] ?? [])) (merged.leadUpdates as unknown[]).push(u);
      for (const a of (item.agentActions as {id:string}[] ?? [])) { if (!seenActions.has(a.id)) { seenActions.add(a.id); (merged.agentActions as unknown[]).push(a); } }
      for (const n of (item.notifications as unknown[] ?? [])) (merged.notifications as unknown[]).push(n);
      for (const t of (item.tasks as {leadId:string}[] ?? [])) { if (!seenTasks.has(t.leadId)) { seenTasks.add(t.leadId); (merged.tasks as unknown[]).push(t); } }
      for (const t of (item.taskUpdates as {leadId:string}[] ?? [])) { if (!seenTaskUpdates.has(t.leadId)) { seenTaskUpdates.add(t.leadId); (merged.taskUpdates as unknown[]).push(t); } }
    }

    return NextResponse.json(merged);
  } catch (err) {
    console.error('[next-day] fetch failed:', err);
    return NextResponse.json({ ok: false, error: String(err), mock: true });
  }
}
