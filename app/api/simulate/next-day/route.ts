import { NextRequest, NextResponse } from 'next/server';
import { actionsForLeadOnDay } from '@/lib/demoScript';
import { Lead, SimulatorConfig } from '@/lib/types';

const MOCK = process.env.MOCK_N8N === 'true' || !process.env.N8N_BASE_URL;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { day, leads, config }: { day: number; leads: Lead[]; config: SimulatorConfig } = body;

  if (MOCK) {
    const leadUpdates: Record<string, Partial<Lead>> = {};
    const allActions = leads.flatMap(lead => {
      const result = actionsForLeadOnDay(lead, day, config);
      if (Object.keys(result.leadUpdates).length > 0) leadUpdates[lead.id] = result.leadUpdates;
      return result.actions;
    });
    return NextResponse.json({ day, actions: allActions, leadUpdates });
  }

  try {
    const res = await fetch(
      `${process.env.N8N_BASE_URL}${process.env.N8N_WEBHOOK_NEXT_DAY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET ?? '',
        },
        body: JSON.stringify({ day, leads, config }),
      }
    );
    return NextResponse.json(await res.json());
  } catch {
    const leadUpdates: Record<string, Partial<Lead>> = {};
    const allActions = leads.flatMap(lead => {
      const r = actionsForLeadOnDay(lead, day, config);
      if (Object.keys(r.leadUpdates).length) leadUpdates[lead.id] = r.leadUpdates;
      return r.actions;
    });
    return NextResponse.json({ day, actions: allActions, leadUpdates });
  }
}
