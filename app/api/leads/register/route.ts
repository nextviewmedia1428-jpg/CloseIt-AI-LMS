import { NextRequest, NextResponse } from 'next/server';
import { computeScore } from '@/lib/scoring';
import { Lead, STAFF_POOL } from '@/lib/types';

const MOCK = process.env.MOCK_N8N === 'true' || !process.env.N8N_BASE_URL;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, company, budget, timelineDays, intentSignal, currentDay, config } = body;

  const assignedRep = STAFF_POOL[Math.floor(Math.random() * STAFF_POOL.length)];
  const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const { score, classification } = computeScore(budget, timelineDays, intentSignal, config);

  const lead: Lead = {
    id,
    name,
    email,
    phone,
    company,
    source: 'simulator_form',
    formInputs: { budget, timelineDays },
    intentSignal,
    score,
    classification,
    status: 'New',
    remindersSent: 0,
    nextReminderDay: currentDay + 1 + config.reminders.frequencyDays,
    registeredOnDay: currentDay,
    lastActionDay: currentDay,
    assignedRep,
  };

  if (MOCK) {
    return NextResponse.json({ lead });
  }

  try {
    const res = await fetch(
      `${process.env.N8N_BASE_URL}${process.env.N8N_WEBHOOK_REGISTER_LEAD}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET ?? '',
        },
        body: JSON.stringify({ lead, config }),
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // fallback to mock if n8n unreachable
    return NextResponse.json({ lead });
  }
}
