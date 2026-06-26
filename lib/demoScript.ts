import { Lead, Action, SimulatorConfig, LeadClassification } from './types';
import { computeScore } from './scoring';

let _idCounter = 0;
function uid() { return `a${Date.now()}${++_idCounter}`; }
function ts() { return new Date().toISOString(); }

// Returns all actions that fire for a given lead on a given absolute day
export function actionsForLeadOnDay(
  lead: Lead,
  day: number,
  config: SimulatorConfig,
  allLeads: Lead[]
): { actions: Action[]; leadUpdates: Partial<Lead> } {
  const rel = day - lead.registeredOnDay; // days since this lead registered
  const actions: Action[] = [];
  const updates: Partial<Lead> = {};

  const freq = config.reminders.frequencyDays;
  const maxR = config.reminders.maxReminders;

  // --- Day +1: Onboarding ---
  if (rel === 1) {
    const { score, classification, rationale } = computeScore(
      lead.formInputs.budget,
      lead.formInputs.timelineDays,
      lead.intentSignal,
      config
    );
    updates.score = score;
    updates.classification = classification;
    updates.status = 'Contacted';
    updates.lastActionDay = day;

    actions.push({
      id: uid(), day, type: 'email_sent', leadId: lead.id, leadName: lead.name,
      actor: 'system',
      summary: `Onboarding email sent to ${lead.name}`,
      detail: {
        channel: 'Email',
        subject: `Welcome — let's talk about your project`,
        body: `Hi ${lead.name},\n\nThanks for reaching out! Based on your requirements (budget $${lead.formInputs.budget}, timeline ${lead.formInputs.timelineDays} days), we think we can deliver real results.\n\nI'd love to understand your goals better. Book a quick call below or just reply here.\n\n— ${lead.assignedRep}`,
      },
      timestamp: ts(),
    });

    actions.push({
      id: uid(), day, type: 'score_update', leadId: lead.id, leadName: lead.name,
      actor: 'ai',
      summary: `Lead scored ${score}/10 — ${classification}`,
      detail: { score, classification, rationale, weights: config.scoring },
      timestamp: ts(),
    });

    actions.push({
      id: uid(), day, type: 'rep_assigned', leadId: lead.id, leadName: lead.name,
      actor: 'team',
      summary: `${lead.assignedRep} assigned to ${lead.name}`,
      detail: { rep: lead.assignedRep, note: `Assigned based on availability. ${classification} lead — ${score}/10.` },
      timestamp: ts(),
    });

    if (score >= 7) {
      actions.push({
        id: uid(), day, type: 'slack_alert', leadId: lead.id, leadName: lead.name,
        actor: 'system',
        summary: `🔥 Hot lead alert: ${lead.name} (${score}/10)`,
        detail: { channel: '#sales-alerts', message: `🔥 Hot lead captured: *${lead.name}* — score ${score}/10. Budget $${lead.formInputs.budget}, timeline ${lead.formInputs.timelineDays} days. Assigned to ${lead.assignedRep}. Act fast.` },
        timestamp: ts(),
      });
    } else if (score < 4) {
      actions.push({
        id: uid(), day, type: 'slack_alert', leadId: lead.id, leadName: lead.name,
        actor: 'system',
        summary: `🔵 Cold lead flagged: ${lead.name} (${score}/10)`,
        detail: { channel: '#sales-alerts', message: `🔵 Low-priority lead: *${lead.name}* — score ${score}/10. Auto follow-up sequence started. No immediate action needed.` },
        timestamp: ts(),
      });
    }

    // Rep sends proposal on Day+1 for hot/warm leads
    if (score >= 4) {
      actions.push({
        id: uid(), day, type: 'proposal_sent', leadId: lead.id, leadName: lead.name,
        actor: 'team',
        summary: `${lead.assignedRep} mailed proposal to ${lead.name}`,
        detail: {
          rep: lead.assignedRep,
          subject: 'Project Proposal — CloseIt Automation',
          body: `Hi ${lead.name},\n\nGreat to connect! I've put together a quick scope based on your brief:\n\n• Budget: $${lead.formInputs.budget}\n• Timeline: ${lead.formInputs.timelineDays} days\n• Recommended package: AI Lead Automation Suite\n\nLet me know if you'd like to adjust scope or book a call to walk through it.\n\n— ${lead.assignedRep}`,
        },
        timestamp: ts(),
      });
    }

    updates.nextReminderDay = day + freq;
  }

  // --- Relative Day +3: Scripted customer reply for first lead (Hot path) ---
  // We identify the "hot path" lead as the one with score >= 7 and lowest registeredOnDay
  const hotLead = [...allLeads]
    .filter(l => l.score >= 7)
    .sort((a, b) => a.registeredOnDay - b.registeredOnDay)[0];

  const warmLead = [...allLeads]
    .filter(l => l.score >= 4 && l.score < 7)
    .sort((a, b) => a.registeredOnDay - b.registeredOnDay)[0];

  if (hotLead && lead.id === hotLead.id && rel === 3) {
    updates.status = 'Replied';
    actions.push({
      id: uid(), day, type: 'reply_received', leadId: lead.id, leadName: lead.name,
      actor: 'customer',
      summary: `${lead.name} replied: "Ready to move — can we jump on a call?"`,
      detail: { from: lead.email, body: `Hi! This looks exactly like what we need. Can we schedule a call this week? We're ready to move fast on this.` },
      timestamp: ts(),
    });
    actions.push({
      id: uid(), day, type: 'email_sent', leadId: lead.id, leadName: lead.name,
      actor: 'ai',
      summary: `AI drafted reply sent to ${lead.name}`,
      detail: { subject: 'Re: Project Proposal', body: `Hi ${lead.name},\n\nAbsolutely — I've sent a booking link below. Looking forward to connecting and getting things moving.\n\n— ${lead.assignedRep} (via CloseIt AI)` },
      timestamp: ts(),
    });
    actions.push({
      id: uid(), day, type: 'meeting_scheduled', leadId: lead.id, leadName: lead.name,
      actor: 'system',
      summary: `Discovery call booked with ${lead.name}`,
      detail: { date: `Day ${day + 1}`, duration: '30 min', rep: lead.assignedRep, nudge: true },
      timestamp: ts(),
    });
    actions.push({
      id: uid(), day, type: 'slack_alert', leadId: lead.id, leadName: lead.name,
      actor: 'system',
      summary: `📅 Meeting booked — ${lead.name}`,
      detail: { channel: '#sales-alerts', message: `📅 Meeting booked with *${lead.name}*. Day ${day + 1}. ${lead.assignedRep} — prep your deck.` },
      timestamp: ts(),
    });
    updates.status = 'Meeting Scheduled';
    updates.nextReminderDay = null;
  }

  // Hot lead closes on rel 5
  if (hotLead && lead.id === hotLead.id && rel === 5) {
    actions.push({
      id: uid(), day, type: 'call_logged', leadId: lead.id, leadName: lead.name,
      actor: 'team',
      summary: `${lead.assignedRep} completed discovery call with ${lead.name}`,
      detail: { rep: lead.assignedRep, notes: `Strong fit. ${lead.name} confirmed budget and timeline. Proceeding to agreement.` },
      timestamp: ts(),
    });
    actions.push({
      id: uid(), day, type: 'closed_won', leadId: lead.id, leadName: lead.name,
      actor: 'team',
      summary: `🎉 ${lead.name} closed won by ${lead.assignedRep}`,
      detail: { rep: lead.assignedRep, value: `$${lead.formInputs.budget}`, note: 'Agreement signed. Onboarding starts next week.' },
      timestamp: ts(),
    });
    updates.status = 'Closed Won';
    updates.nextReminderDay = null;
  }

  // --- Warm lead: replies on rel+5 (if they exist) ---
  if (warmLead && lead.id === warmLead.id && rel === 5) {
    updates.status = 'Replied';
    actions.push({
      id: uid(), day, type: 'reply_received', leadId: lead.id, leadName: lead.name,
      actor: 'customer',
      summary: `${lead.name} replied: "Interested but swamped — follow up next week"`,
      detail: { from: lead.email, body: `Hey, I'm interested but things are hectic right now. Can you follow up with me in a week or so?` },
      timestamp: ts(),
    });
    actions.push({
      id: uid(), day, type: 'email_sent', leadId: lead.id, leadName: lead.name,
      actor: 'ai',
      summary: `AI replied — reminder clock reset for ${lead.name}`,
      detail: { subject: 'Re: Project Proposal', body: `Understood ${lead.name} — no rush at all. I'll check back in a week. In the meantime, here's a quick overview of what we'd build for you.\n\n— ${lead.assignedRep} (via CloseIt AI)` },
      timestamp: ts(),
    });
    updates.remindersSent = 0; // reset on reply
    updates.nextReminderDay = day + freq;
  }

  // --- Standard reminder logic (for all leads not on scripted reply days) ---
  const isHotOnReplyDay = hotLead && lead.id === hotLead.id && rel === 3;
  const isWarmOnReplyDay = warmLead && lead.id === warmLead.id && rel === 5;
  const isHotOnCloseDay = hotLead && lead.id === hotLead.id && rel === 5;

  if (
    lead.nextReminderDay === day &&
    lead.remindersSent < maxR &&
    !isHotOnReplyDay &&
    !isWarmOnReplyDay &&
    !isHotOnCloseDay &&
    lead.status !== 'Meeting Scheduled' &&
    lead.status !== 'Closed Won' &&
    lead.status !== 'Closed Lost' &&
    lead.status !== 'Nurture'
  ) {
    const reminderNum = lead.remindersSent + 1;
    actions.push({
      id: uid(), day, type: 'email_sent', leadId: lead.id, leadName: lead.name,
      actor: 'ai',
      summary: `Follow-up #${reminderNum} sent to ${lead.name} (AI-drafted)`,
      detail: {
        subject: reminderNum === 1 ? `Quick check-in — ${lead.name}` : `Last note from us — ${lead.name}`,
        body: reminderNum === 1
          ? `Hi ${lead.name},\n\nJust checking in — did you get a chance to look at the proposal? Happy to answer any questions or adjust the scope.\n\n— ${lead.assignedRep} (via CloseIt AI)`
          : `Hi ${lead.name},\n\nThis is our final note for now. If the timing isn't right, no worries — we'll be here when you're ready. You can reply any time.\n\n— ${lead.assignedRep} (via CloseIt AI)`,
      },
      timestamp: ts(),
    });
    updates.remindersSent = lead.remindersSent + 1;
    updates.lastActionDay = day;

    if (lead.remindersSent + 1 >= maxR) {
      // Max reminders hit — move to Nurture
      updates.status = 'Nurture';
      updates.nextReminderDay = null;
      actions.push({
        id: uid(), day, type: 'moved_to_nurture', leadId: lead.id, leadName: lead.name,
        actor: 'system',
        summary: `${lead.name} moved to Nurture — max follow-ups reached`,
        detail: { reason: `${maxR} follow-ups sent, no response. Sequence paused.` },
        timestamp: ts(),
      });
      actions.push({
        id: uid(), day, type: 'slack_alert', leadId: lead.id, leadName: lead.name,
        actor: 'system',
        summary: `⚠️ Lead gone cold: ${lead.name}`,
        detail: { channel: '#sales-alerts', message: `⚠️ *${lead.name}* moved to Nurture after ${maxR} unanswered follow-ups. No further auto-outreach.` },
        timestamp: ts(),
      });
    } else {
      updates.nextReminderDay = day + freq;
      updates.status = 'Awaiting Reply';
    }
  }

  return { actions, leadUpdates: updates };
}
