import { NextRequest, NextResponse } from 'next/server';
import { actionsForLeadOnDay } from '@/lib/demoScript';
import { Lead, SimulatorConfig } from '@/lib/types';

const MOCK = process.env.MOCK_N8N === 'true' || !process.env.N8N_BASE_URL;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { day, leads, config }: { day: number; leads: Lead[]; config: SimulatorConfig } = body;

  if (MOCK) {
    const allActions: ReturnType<typeof actionsForLeadOnDay>[] = [];
    const leadUpdates: Record<string, Partial<Lead>> = {};

    for (const lead of leads) {
      const result = actionsForLeadOnDay(lead, day, config, leads);
      allActions.push(result);
      if (Object.keys(result.leadUpdates).length > 0) {
        leadUpdates[lead.id] = result.leadUpdates;
      }
    }

    return NextResponse.json({
      day,
      actions: allActions.flatMap(r => r.actions),
      leadUpdates,
    });
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
    // fallback
    const allActions = leads.flatMap(l => actionsForLeadOnDay(l, day, config, leads).actions);
    const leadUpdates: Record<string, Partial<Lead>> = {};
    for (const lead of leads) {
      const r = actionsForLeadOnDay(lead, day, config, leads);
      if (Object.keys(r.leadUpdates).length) leadUpdates[lead.id] = r.leadUpdates;
    }
    return NextResponse.json({ day, actions: allActions, leadUpdates });
  }
}
