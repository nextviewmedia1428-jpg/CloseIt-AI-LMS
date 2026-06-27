// Demo script engine for MOCK_N8N mode.
// In live mode (MOCK_N8N=false), n8n/OpenAI generates all content.
// Here we simulate that using the emailTemplates library (100+ variants, seeded).

import { Lead, Action, ActionType, ThreadMessage } from './types';
import {
  COLD_INITIAL, WARM_RESPONSE,
  LEAD_REPLY_POSITIVE, LEAD_REPLY_NEGATIVE, LEAD_REPLY_TO_USER,
  pickTemplate,
} from './emailTemplates';

let _idCounter = 0;
function uid() { return `a${Date.now()}${++_idCounter}`; }
function ts() { return new Date().toISOString(); }

function seeded(leadId: string, salt: string): number {
  const str = leadId + salt;
  let h = 0;
  for (const c of str) h = ((h << 5) - h) + c.charCodeAt(0);
  return (Math.abs(h) % 10000) / 10000;
}

// Pre-determine the day a lead replies to the INITIAL email (rel day 2–6)
function firstReplyDay(lead: Lead): number {
  return lead.registeredOnDay + lead.replyFrequencyDays;
}

// Will this lead reply positively? Based on intentSignal and seeded chance.
function willReplyPositively(lead: Lead): boolean {
  const base = lead.intentSignal === 'high' ? 0.8 : lead.intentSignal === 'medium' ? 0.5 : 0.2;
  return seeded(lead.id, 'posreply') < base;
}

// Will the lead reply at all?
function willReply(lead: Lead): boolean {
  const base = lead.intentSignal === 'high' ? 0.9 : lead.intentSignal === 'medium' ? 0.6 : 0.3;
  return seeded(lead.id, 'willreply') < base;
}

// Will a discovery call get booked after positive exchange?
function willBook(lead: Lead): boolean {
  return lead.intentSignal !== 'low' && seeded(lead.id, 'willbook') < 0.7;
}

// Day the lead replies to user's follow-up (relative to user's reply day)
function userReplyResponseDay(lead: Lead, userReplyDay: number): number {
  const accel = lead.intentSignal === 'high' ? 1 : 0;
  return userReplyDay + Math.max(1, lead.replyFrequencyDays - accel);
}

function makeAction(
  type: ActionType,
  lead: Lead,
  day: number,
  actor: Action['actor'],
  summary: string,
  detail: Record<string, unknown>,
): Action {
  return { id: uid(), day, type, leadId: lead.id, leadName: lead.name, summary, actor, detail, timestamp: ts() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: what actions fire for a given lead on a given day?
// Called by the store's nextDay() for each lead.
// Returns actions AND thread messages generated that day.
// ─────────────────────────────────────────────────────────────────────────────

export interface DayResult {
  actions: Action[];
  messages: ThreadMessage[];
  leadUpdates: Partial<Lead>;
}

export function actionsForLeadOnDay(
  lead: Lead,
  day: number,
  existingThread: ThreadMessage[],
): DayResult {
  const actions: Action[] = [];
  const messages: ThreadMessage[] = [];
  const updates: Partial<Lead> = {};

  const rel = day - lead.registeredOnDay;
  const n = lead.name;
  const c = lead.company;
  const i = lead.industry;

  // ── Day 0: lead arrives ─────────────────────────────────────────────────
  if (rel === 0) {
    if (lead.startType === 'warm' && lead.inboundMessage) {
      const body = lead.inboundMessage;
      messages.push({ id: uid(), day, from: 'lead', body, timestamp: ts() });
      actions.push(makeAction('lead_arrived', lead, day, 'lead',
        `${n} reached out — warm inbound from ${c}`,
        { from: lead.email, body }
      ));
    }
    // Cold start: agent sends first email next day (rel=1)
  }

  // ── Day 1: CloseIt sends the first email ────────────────────────────────
  if (rel === 1) {
    let body: string;
    if (lead.startType === 'cold') {
      body = pickTemplate(COLD_INITIAL, lead.id, 'coldinit')(n, c, i);
    } else {
      body = pickTemplate(WARM_RESPONSE, lead.id, 'warmresp')(n, c, i);
    }
    messages.push({ id: uid(), day, from: 'agent', body, timestamp: ts() });
    updates.status = 'Contacted';
    actions.push(makeAction('initial_email_sent', lead, day, 'ai',
      `CloseIt sent ${lead.startType === 'cold' ? 'cold outreach' : 'warm start discovery'} email to ${n}`,
      { to: lead.email, body }
    ));
  }

  // ── Lead's first reply ───────────────────────────────────────────────────
  const replyDay = firstReplyDay(lead);
  if (day === replyDay && lead.status === 'Contacted' && !existingThread.find(m => m.from === 'lead' && m.day >= replyDay)) {
    if (willReply(lead)) {
      const positive = willReplyPositively(lead);
      const body = positive
        ? pickTemplate(LEAD_REPLY_POSITIVE, lead.id, 'posreply1')( n, c, i)
        : pickTemplate(LEAD_REPLY_NEGATIVE, lead.id, 'negreply1')(n, c, i);
      messages.push({ id: uid(), day, from: 'lead', body, timestamp: ts() });
      updates.lastReplyDay = day;

      if (positive) {
        updates.status = 'Replied';
        actions.push(makeAction('lead_replied', lead, day, 'lead',
          `${n} replied — positive interest in CloseIt`,
          { from: lead.email, body, sentiment: 'positive' }
        ));
      } else {
        updates.status = 'Nurture';
        actions.push(makeAction('lead_replied', lead, day, 'lead',
          `${n} replied — not the right time`,
          { from: lead.email, body, sentiment: 'negative' }
        ));
        actions.push(makeAction('moved_to_nurture', lead, day, 'system',
          `${n} moved to Nurture — negative reply`,
          { reason: 'Lead replied with a deferral.' }
        ));
      }
    }
  }

  // ── Lead replies to user message ─────────────────────────────────────────
  // If user replied, lead responds after their reply frequency days
  if (
    lead.lastUserReplyDay !== null &&
    day === userReplyResponseDay(lead, lead.lastUserReplyDay) &&
    lead.status === 'Awaiting Reply'
  ) {
    if (willBook(lead)) {
      const body = pickTemplate(LEAD_REPLY_TO_USER, lead.id, `userreply${day}`)(n, c, i);
      messages.push({ id: uid(), day, from: 'lead', body, timestamp: ts() });
      updates.lastReplyDay = day;
      updates.status = 'Replied';
      actions.push(makeAction('lead_replied', lead, day, 'lead',
        `${n} replied to your message`,
        { from: lead.email, body }
      ));

      // If this reply contains booking signals, agent books the call
      const lowerBody = body.toLowerCase();
      const bookingSignals = ['book', 'schedule', 'call', 'thursday', 'friday', 'next week', 'works', 'calendar'];
      const hasBookingSignal = bookingSignals.some(s => lowerBody.includes(s));
      if (hasBookingSignal && seeded(lead.id, `book${day}`) < 0.75) {
        const callDay = day + 1;
        updates.discoveryCallDay = callDay;
        updates.status = 'Discovery Booked';
        actions.push(makeAction('discovery_call_booked', lead, day, 'ai',
          `Discovery call booked with ${n} — Day ${callDay}`,
          { callDay, lead: n, company: c, note: 'Call booked based on lead reply. MoM task created.' }
        ));
      }
    }
  }

  return { actions, messages, leadUpdates: updates };
}

// ─────────────────────────────────────────────────────────────────────────────
// MoM AI analysis — shown in the left panel when user completes a discovery task
// In live mode this is generated by n8n. In MOCK mode, seeded from the thread.
// ─────────────────────────────────────────────────────────────────────────────

export function generateMoMAnalysis(lead: Lead, thread: ThreadMessage[]): {
  summary: string;
  customerProfile: string;
  intentAnalysis: string;
  suggestedActions: string[];
  keyTalkingPoints: string[];
} {
  const leadMessages = thread.filter(m => m.from === 'lead');
  const msgCount = leadMessages.length;

  return {
    summary: `${lead.name} from ${lead.company} (${lead.industry}) initiated contact ${lead.startType === 'warm' ? 'inbound' : 'via cold outreach'}. Over ${thread.length} messages across ${lead.discoveryCallDay ? lead.discoveryCallDay - lead.registeredOnDay : 'several'} days, the conversation progressed from initial introduction to discovery call scheduling. Lead showed ${lead.intentSignal} intent throughout — ${msgCount} replies from their side, with reply frequency of approximately ${lead.replyFrequencyDays} days.`,

    customerProfile: `Company: ${lead.company} | Industry: ${lead.industry}\nContact: ${lead.name}\nIntent signal: ${lead.intentSignal.charAt(0).toUpperCase() + lead.intentSignal.slice(1)}\nEngagement: ${msgCount} messages sent\nReply cadence: ~${lead.replyFrequencyDays} days\nCurrent status: ${lead.status}`,

    intentAnalysis: lead.intentSignal === 'high'
      ? 'Strong buying intent detected. Lead replied quickly, used buying-oriented language (scheduling, pricing, next steps), and proactively involved additional stakeholders. High probability of conversion if call is productive.'
      : lead.intentSignal === 'medium'
      ? 'Moderate intent. Lead is engaged but evaluating options. Questions focused on differentiation and fit. Recommend a consultative approach — understand their specific pain point before pitching features.'
      : 'Low-to-moderate intent. Lead has acknowledged the problem but has not indicated urgency or budget commitment. Use the discovery call to surface a compelling trigger event or quantify the cost of inaction.',

    suggestedActions: [
      'Open with a summary of what you understood from the email exchange — confirm accuracy before presenting.',
      lead.intentSignal === 'high'
        ? 'Move quickly to a concrete pilot or next-step proposal — lead is ready to move.'
        : 'Invest time in discovery before pitching — understand their current process in detail.',
      'Ask directly about decision-making process and who else needs to be involved.',
      'Have a pricing range ready but anchor on value first — ask what ROI would justify the investment.',
      `Follow up within 24 hours of the call with a written summary and clear next step.`,
    ],

    keyTalkingPoints: [
      `CloseIt automates the CRM nurturing layer for ${lead.industry} teams — from first touch to discovery call booking.`,
      'Setup typically takes under a week. No CRM migration required — we sit on top of what you have.',
      'Teams using CloseIt typically see 20–30% more pipeline worked within the first 30 days.',
      `For ${lead.company}'s scale, the relevant plan includes [tailor based on team size discussed].`,
      'We can do a 2-week pilot with a subset of your pipeline before full commitment.',
    ],
  };
}
