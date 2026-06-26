import { NextRequest, NextResponse } from 'next/server';
import { Lead } from '@/lib/types';

const MOCK = process.env.MOCK_N8N === 'true' || !process.env.N8N_BASE_URL;

export interface AgentAnalysis {
  pendingFrom: 'lead' | 'staff' | 'none';
  pendingAction: string;
  reasoning: string;
  draftMessage: {
    to: string;
    recipientType: 'lead' | 'staff';
    subject: string;
    body: string;
  } | null;
}

function mockAnalysis(lead: Lead): AgentAnalysis {
  const { status, assignedRep, name, score, classification, formInputs, company, remindersSent } = lead;
  const first = name.split(' ')[0];

  if (['Closed Won', 'Closed Lost'].includes(status)) {
    return {
      pendingFrom: 'none',
      pendingAction: 'Lead is closed — no action required.',
      reasoning: `${name} has been marked as ${status}. The thread is complete.`,
      draftMessage: null,
    };
  }

  if (status === 'Meeting Scheduled') {
    return {
      pendingFrom: 'staff',
      pendingAction: `${assignedRep} needs to prep for the discovery call with ${name}`,
      reasoning: `${name} booked a call — the ball is now with ${assignedRep} to prepare and run the meeting. Acting now on prep increases close probability significantly.`,
      draftMessage: {
        to: assignedRep,
        recipientType: 'staff',
        subject: `Prep brief: Discovery call with ${name}`,
        body: `Hi ${assignedRep},\n\nYour discovery call with ${name} is coming up. Here's the brief:\n\n• Budget: $${formInputs.budget}\n• Timeline: ${formInputs.timelineDays} days\n• Score: ${score}/10 (${classification})\n• Company: ${company || 'Not specified'}\n\nKey talking points:\n1. Understand their exact pain points around lead management\n2. Demo the AI scoring and automated follow-up sequence\n3. Propose a 30-day pilot — tie the ROI to their current manual follow-up cost\n\nClose move: Get a verbal yes on scope before the call ends, then send the agreement that evening.\n\n— CloseIt AI Agent`,
      },
    };
  }

  if (status === 'Replied') {
    return {
      pendingFrom: 'staff',
      pendingAction: `${assignedRep} must respond to ${name}'s reply and book the call`,
      reasoning: `${name} has replied and is showing intent. Every hour of delay reduces conversion probability. ${assignedRep} needs to respond and lock in a call.`,
      draftMessage: {
        to: assignedRep,
        recipientType: 'staff',
        subject: `🔥 Action needed now: ${name} replied`,
        body: `Hi ${assignedRep},\n\n${name} has replied and is waiting on you. Don't let this cool off.\n\nSend them this immediately:\n\n---\nHi ${first},\n\nLove the enthusiasm — let's make this happen. Here's a booking link for a quick 30-min call this week:\n\n[YOUR_BOOKING_LINK]\n\nLooking forward to showing you what we can build together.\n\n— ${assignedRep}\n---\n\nAfter booking, add their details to your CRM and prep the proposal.\n\n— CloseIt AI Agent`,
      },
    };
  }

  if (status === 'Nurture') {
    return {
      pendingFrom: 'staff',
      pendingAction: `${assignedRep} should attempt a manual re-engagement — automation has been exhausted`,
      reasoning: `${name} didn't respond to ${remindersSent} automated follow-ups. A personalised, human message from ${assignedRep} is the only remaining lever — automated messages clearly haven't worked.`,
      draftMessage: {
        to: name,
        recipientType: 'lead',
        subject: `A different kind of check-in, ${first}`,
        body: `Hi ${first},\n\nI know you've seen a few emails from us and haven't replied — so I'll be direct and keep it short.\n\nI'm ${assignedRep}, personally reaching out. We've helped businesses automate their lead follow-up and close more without adding headcount. Based on your brief (budget $${formInputs.budget}, ${formInputs.timelineDays}-day window), I think we could genuinely move the needle for you.\n\nIf there's a better time or you're curious what this actually looks like for a business like yours — 15 minutes is all I'm asking.\n\nNo pressure either way.\n\n— ${assignedRep}`,
      },
    };
  }

  // Contacted / Awaiting Reply / New — ball is with the lead
  return {
    pendingFrom: 'lead',
    pendingAction: `Waiting for ${name} to respond — automated sequence running`,
    reasoning: `${name} has received outreach but hasn't responded yet. The automated sequence is handling follow-ups, but a personal message from ${assignedRep} at this stage often breaks through where automation doesn't.`,
    draftMessage: {
      to: name,
      recipientType: 'lead',
      subject: `Quick question, ${first}`,
      body: `Hi ${first},\n\nI wanted to reach out personally rather than send another automated message.\n\nWe put together an approach specific to your situation — $${formInputs.budget} budget, ${formInputs.timelineDays}-day timeline. I think you'd find it genuinely useful to see.\n\nWould a 20-minute call this week work? I'll show you exactly what we'd build, no fluff.\n\n— ${assignedRep}`,
    },
  };
}

export async function POST(req: NextRequest) {
  const { lead, thread } = await req.json() as { lead: Lead; thread: string };

  if (MOCK) {
    await new Promise(r => setTimeout(r, 1200));
    return NextResponse.json(mockAnalysis(lead));
  }

  try {
    const res = await fetch(
      `${process.env.N8N_BASE_URL}${process.env.N8N_WEBHOOK_AGENT_ANALYZE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET ?? '',
        },
        body: JSON.stringify({ lead, thread }),
      }
    );
    return NextResponse.json(await res.json());
  } catch {
    await new Promise(r => setTimeout(r, 800));
    return NextResponse.json(mockAnalysis(lead));
  }
}
