import { Lead, Action, SimulatorConfig, LeadClassification } from './types';
import { computeScore } from './scoring';

let _idCounter = 0;
function uid() { return `a${Date.now()}${++_idCounter}`; }
function ts() { return new Date().toISOString(); }

// Deterministic pseudo-random from lead ID + salt — same lead always gets same story
function seeded(leadId: string, salt: string): number {
  const str = leadId + salt;
  let hash = 0;
  for (const c of str) hash = ((hash << 5) - hash) + c.charCodeAt(0);
  return (Math.abs(hash) % 10000) / 10000; // 0–1
}

interface LeadStory {
  staffCallDay: number | null;
  customerReplyDay: number | null;
  meetingDay: number | null;
  closeDay: number | null;
}

function getStory(lead: Lead): LeadStory {
  if (lead.score >= 7) {
    const replyRel = 2 + Math.floor(seeded(lead.id, 'reply') * 3); // rel 2, 3, or 4
    return {
      staffCallDay: 2,
      customerReplyDay: replyRel,
      meetingDay: replyRel,
      closeDay: replyRel + 2,
    };
  } else if (lead.score >= 4) {
    const replies = seeded(lead.id, 'replies') < 0.6;
    const closes = replies && seeded(lead.id, 'closes') < 0.5;
    const replyRel = 4 + Math.floor(seeded(lead.id, 'reply') * 4); // rel 4, 5, 6, or 7
    return {
      staffCallDay: 3,
      customerReplyDay: replies ? replyRel : null,
      meetingDay: closes ? replyRel : null,
      closeDay: closes ? replyRel + 2 : null,
    };
  } else {
    return { staffCallDay: null, customerReplyDay: null, meetingDay: null, closeDay: null };
  }
}

export function actionsForLeadOnDay(
  lead: Lead,
  day: number,
  config: SimulatorConfig,
): { actions: Action[]; leadUpdates: Partial<Lead> } {
  const rel = day - lead.registeredOnDay;
  const actions: Action[] = [];
  const updates: Partial<Lead> = {};
  const story = getStory(lead);
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
    updates.nextReminderDay = day + freq;

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
      detail: { rep: lead.assignedRep, note: `${classification} lead — ${score}/10. Assigned based on availability.` },
      timestamp: ts(),
    });

    if (score >= 4) {
      actions.push({
        id: uid(), day, type: 'proposal_sent', leadId: lead.id, leadName: lead.name,
        actor: 'team',
        summary: `${lead.assignedRep} mailed proposal to ${lead.name}`,
        detail: {
          rep: lead.assignedRep,
          subject: 'Project Proposal — CloseIt Automation',
          body: `Hi ${lead.name},\n\nGreat to connect! Here's a quick scope based on your brief:\n\n• Budget: $${lead.formInputs.budget}\n• Timeline: ${lead.formInputs.timelineDays} days\n• Recommended package: AI Lead Automation Suite\n\nLet me know if you'd like to jump on a call.\n\n— ${lead.assignedRep}`,
        },
        timestamp: ts(),
      });
    }
  }

  // --- Staff call log (warm/hot leads, seeded day) ---
  if (story.staffCallDay !== null && rel === story.staffCallDay &&
      !['Closed Won', 'Closed Lost', 'Nurture'].includes(lead.status)) {
    actions.push({
      id: uid(), day, type: 'call_logged', leadId: lead.id, leadName: lead.name,
      actor: 'team',
      summary: `${lead.assignedRep} called ${lead.name} — left voicemail`,
      detail: {
        rep: lead.assignedRep,
        notes: `Called ${lead.name} to follow up on proposal. No answer — left voicemail. Will track email response.`,
      },
      timestamp: ts(),
    });
  }

  // --- Customer reply (seeded day per lead) ---
  const alreadyReplied = ['Replied', 'Meeting Scheduled', 'Closed Won', 'Nurture'].includes(lead.status);

  if (story.customerReplyDay !== null && rel === story.customerReplyDay && !alreadyReplied) {
    const isHot = lead.score >= 7;
    const replySummary = isHot
      ? `${lead.name} replied: "Ready to move — can we jump on a call?"`
      : `${lead.name} replied: "Interested but swamped — follow up next week"`;
    const replyBody = isHot
      ? `Hi! This looks exactly like what we need. Can we schedule a call this week? We're ready to move fast on this.`
      : `Hey, I'm interested but things are hectic right now. Can you follow up with me in a week or so?`;

    actions.push({
      id: uid(), day, type: 'reply_received', leadId: lead.id, leadName: lead.name,
      actor: 'customer',
      summary: replySummary,
      detail: { from: lead.email, body: replyBody },
      timestamp: ts(),
    });

    const aiReplyBody = isHot
      ? `Hi ${lead.name},\n\nAbsolutely — I've sent a booking link below. Looking forward to connecting and getting things moving.\n\n— ${lead.assignedRep} (via CloseIt AI)`
      : `Understood ${lead.name} — no rush at all. I'll check back in a week. In the meantime, here's a quick overview of what we'd build for you.\n\n— ${lead.assignedRep} (via CloseIt AI)`;

    actions.push({
      id: uid(), day, type: 'email_sent', leadId: lead.id, leadName: lead.name,
      actor: 'ai',
      summary: `AI drafted reply sent to ${lead.name}`,
      detail: { subject: 'Re: Project Proposal', body: aiReplyBody },
      timestamp: ts(),
    });

    if (story.meetingDay === rel) {
      actions.push({
        id: uid(), day, type: 'meeting_scheduled', leadId: lead.id, leadName: lead.name,
        actor: 'system',
        summary: `Discovery call booked with ${lead.name}`,
        detail: { date: `Day ${day + 1}`, duration: '30 min', rep: lead.assignedRep, nudge: true },
        timestamp: ts(),
      });
      updates.status = 'Meeting Scheduled';
    } else {
      updates.status = 'Replied';
    }

    updates.nextReminderDay = null; // stop follow-ups — lead is engaged
    updates.lastActionDay = day;
  }

  // --- Close (seeded day per lead) ---
  if (story.closeDay !== null && rel === story.closeDay &&
      !['Closed Won', 'Closed Lost'].includes(lead.status)) {
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
    updates.lastActionDay = day;
  }

  // --- Automated follow-up reminders (only for unengaged leads) ---
  const engagedStatuses = ['Replied', 'Meeting Scheduled', 'Closed Won', 'Closed Lost', 'Nurture'];
  const onReplyDay = story.customerReplyDay === rel;
  const onCloseDay = story.closeDay === rel;

  if (
    !engagedStatuses.includes(lead.status) &&
    !onReplyDay &&
    !onCloseDay &&
    lead.nextReminderDay === day &&
    lead.remindersSent < maxR
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
      updates.status = 'Nurture';
      updates.nextReminderDay = null;
      actions.push({
        id: uid(), day, type: 'moved_to_nurture', leadId: lead.id, leadName: lead.name,
        actor: 'system',
        summary: `${lead.name} moved to Nurture — max follow-ups reached`,
        detail: { reason: `${maxR} follow-ups sent with no response. Sequence paused.` },
        timestamp: ts(),
      });
    } else {
      updates.nextReminderDay = day + freq;
      updates.status = 'Awaiting Reply';
    }
  }

  return { actions, leadUpdates: updates };
}
