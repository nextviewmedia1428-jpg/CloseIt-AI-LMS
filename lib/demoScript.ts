import { Lead, Action, SimulatorConfig } from './types';
import { computeScore } from './scoring';

let _idCounter = 0;
function uid() { return `a${Date.now()}${++_idCounter}`; }
function ts() { return new Date().toISOString(); }

// Deterministic pseudo-random — same lead always gets the same story
function seeded(leadId: string, salt: string): number {
  const str = leadId + salt;
  let hash = 0;
  for (const c of str) hash = ((hash << 5) - hash) + c.charCodeAt(0);
  return (Math.abs(hash) % 10000) / 10000;
}

function pick<T>(arr: T[], leadId: string, salt: string): T {
  return arr[Math.floor(seeded(leadId, salt) * arr.length)];
}

// --- Fallback project descriptions (when user leaves blank) ---
const PROJECT_DESC_FALLBACKS = [
  'Streamlining internal approval workflows for mid-market finance teams to reduce cycle time from days to minutes.',
  'An AI-powered support ticket triage system that routes issues to the right team before a human even reads them.',
  'Automating lead qualification and follow-up for a B2B outbound sales motion across 3 geographies.',
  'A document intelligence layer for contract review — extraction, red-lining, and compliance flagging in one flow.',
  'Real-time inventory sync and demand forecasting for a multi-channel e-commerce operator.',
  'Employee onboarding automation that connects HRMS, IT provisioning, and L&D into a single guided experience.',
  'API-first payment orchestration layer handling retries, routing, and reconciliation for a marketplace platform.',
  'Compliance monitoring and regulatory reporting for a Series B fintech operating in three regulated markets.',
];

export function resolveProjectDescription(lead: Lead): string {
  return lead.projectDescription?.trim() || pick(PROJECT_DESC_FALLBACKS, lead.id, 'projdesc');
}

// --- Humanised content pools ---

type MsgFn = (name: string, rep: string, proj: string) => string;

const POSITIVE_REPLY_MESSAGES: MsgFn[] = [
  (n, rep, proj) =>
    `Hi ${rep.split(' ')[0]}, thanks for reaching out. We've been evaluating options for ${proj} and your approach looks promising. A couple of questions before we go further — what's the typical onboarding timeline, and do you support custom integrations? Happy to jump on a call if the answers check out.\n\n— ${n}`,

  (n, rep, proj) =>
    `Hey ${rep.split(' ')[0]} — good timing actually. We're mid-sprint on ${proj} and this could be exactly what we need. Can you send over a one-pager or a couple of case studies from similar use cases? I'd like to share with my team before we book anything.\n\n— ${n}`,

  (n, rep, proj) =>
    `Hi ${rep.split(' ')[0]}, ${n.split(' ')[0]} here. We've looked at a few vendors for ${proj} and the gap has always been around flexibility and speed of setup. If you can address those two things, I'm genuinely interested. Can we do a quick 20-min intro call this week?\n\n— ${n}`,

  (n, rep, proj) =>
    `Hi! Yes, ${proj} is actually on our roadmap for this quarter. Your email caught my eye — especially the AI angle. Our CTO will want to see the technical architecture before we commit to a call, but I'm keen. Can you share docs?\n\n— ${n}`,

  (n, rep, proj) =>
    `Hey — sorry for the slow reply, things have been hectic. ${proj} is a priority for us but we've been burned by two vendors already who overpromised. That said, what you're describing sounds different. What does a pilot look like and how quickly can we see results?\n\n— ${n}`,
];

type NegFn = (name: string) => string;
const NEGATIVE_REPLY_MESSAGES: NegFn[] = [
  (n) =>
    `Hi, thanks for the email. We're heads-down on a product launch this quarter and can't take on new vendor evaluations right now. Feel free to follow up in 3 months.\n\n— ${n}`,

  (n) =>
    `Appreciate the outreach. We went with another provider last month for something in this space. Not looking to switch right now, but thanks for thinking of us.\n\n— ${n}`,

  (n) =>
    `Thanks for reaching out. Honestly, we've decided to build this capability in-house for now. If that changes down the road we'll be in touch.\n\n— ${n}`,
];

const STAFF_FOLLOWUP_MESSAGES: MsgFn[] = [
  (n, rep, proj) =>
    `Hi ${n.split(' ')[0]},\n\nThanks so much for getting back to us — really appreciated!\n\nTo answer your questions on ${proj}: most teams are fully onboarded within 10–14 days. Our implementation team handles the heavy lifting — you'd just need to share API access and a few workflow examples to get us started.\n\nI'd love to show you a quick demo tailored to your use case. I have slots open tomorrow and day after — does morning or afternoon work better for you?\n\nLooking forward to connecting!\n\n${rep}`,

  (n, rep, proj) =>
    `Hey ${n.split(' ')[0]},\n\nGreat to hear from you! I pulled together a couple of case studies from teams who've tackled similar challenges in ${proj} — happy to share those ahead of a call.\n\nThe short version: we typically see a 60–70% reduction in manual follow-up time within the first month. I'd love to walk through exactly how that would look for your workflow.\n\nGot 20 minutes this week for a live walkthrough? I'll keep it tight and make it worth your time.\n\n${rep}`,

  (n, rep, proj) =>
    `Hi ${n.split(' ')[0]},\n\nThank you for the kind response! Based on what you've shared about ${proj}, I think there's a strong fit here. I've also looped in our solutions engineer who can speak to the technical integration if you want to get your CTO involved early.\n\nCalendar link below — grab any slot that works for you and I'll send a prep brief beforehand so neither of us is going in cold.\n\n${rep}`,

  (n, rep, proj) =>
    `Hi ${n.split(' ')[0]},\n\nReally glad this landed at the right time for ${proj}. We've worked with a few teams in very similar situations and the pattern is usually the same: the biggest wins come in the first 3 weeks once the automation is live.\n\nI'd love to map that out specifically for your setup. Can we do a 30-min discovery call? I'll come prepared with questions so we use the time well.\n\n${rep}`,
];

const NUDGE_DRAFT_MESSAGES: MsgFn[] = [
  (n, rep, proj) =>
    `Hi ${n.split(' ')[0]},\n\nApologies for the delay in getting back to you — things got hectic on our end this week.\n\n${proj} is exactly the kind of challenge we're built for and I don't want us to lose momentum. Would you still be open to a quick call? I'm flexible on timing.\n\n${rep}`,

  (n, rep, proj) =>
    `Hey ${n.split(' ')[0]},\n\nSorry for going quiet after your reply — that's on me. I wanted to personally follow up because your note on ${proj} stood out and I think there's a real fit here.\n\nWould a 15-minute call work this week?\n\n${rep}`,

  (n, rep, proj) =>
    `Hi ${n.split(' ')[0]},\n\nCircling back after my earlier message. Wanted to make sure your query on ${proj} didn't fall through the cracks on our end. Happy to answer any questions over email too if a call isn't convenient.\n\n${rep}`,
];

const FOLLOWUP_1_MESSAGES: MsgFn[] = [
  (n, rep, proj) =>
    `Hi ${n.split(' ')[0]},\n\nJust checking in — wanted to make sure my earlier note didn't get buried. We've been working with teams on ${proj} challenges very similar to yours and I think there's a fit worth exploring.\n\nWould a quick 15-minute call make sense this week?\n\n${rep}\nvia CloseIt AI`,

  (n, rep, proj) =>
    `Hey ${n.split(' ')[0]},\n\nFollowing up on my note from a few days back — I know inboxes get hectic.\n\nIf ${proj} is still on the radar, I'd love to reconnect. Even a 10-minute chat would help me understand if there's a fit worth exploring further.\n\n${rep}\nvia CloseIt AI`,

  (n, rep, proj) =>
    `Hi ${n.split(' ')[0]},\n\nHoping this finds you well. Following up on ${proj} — we've had a few teams in similar situations recently and the results have been strong. Happy to share specifics.\n\nWhat's the best way to find 20 minutes with you?\n\n${rep}\nvia CloseIt AI`,
];

const FOLLOWUP_2_MESSAGES: MsgFn[] = [
  (n, rep, proj) =>
    `Hi ${n.split(' ')[0]},\n\nThis will be my last note for now — I don't want to clog your inbox.\n\nIf the timing for ${proj} changes or you'd like to revisit, just reply here and we'll pick up right where we left off. Wishing you and the team well.\n\n${rep}\nvia CloseIt AI`,

  (n, rep, proj) =>
    `Hey ${n.split(' ')[0]},\n\nLeaving the ball in your court from here. If ${proj} becomes a priority, I'm easy to reach — just reply to this email.\n\nNo pressure either way. Take care!\n\n${rep}\nvia CloseIt AI`,
];

function generateMoM(lead: Lead, rep: string, day: number): string {
  const proj = lead.projectName;
  const desc = resolveProjectDescription(lead);
  const first = lead.name.split(' ')[0];
  const repFirst = rep.split(' ')[0];

  const painPoints = [
    'manual handoffs between teams causing delays and lost context',
    'lack of pipeline visibility until it was too late to act',
    'inconsistent follow-up leading to leads going cold',
    'too much time spent on tasks that should be automated',
  ];
  const features = [
    'the AI-powered lead scoring and automated nudge system',
    'the context-aware follow-up agent that knows when to escalate vs. wait',
    'the real-time activity feed and CRM audit trail',
    'the ability to configure cadence and scoring weights without touching code',
  ];

  const pain = pick(painPoints, lead.id, 'pain');
  const feature = pick(features, lead.id, 'feature');

  return `DISCOVERY CALL — MINUTES OF MEETING

Date: Day ${day}  |  Duration: 30 minutes
Attendees: ${lead.name} (${lead.company || 'Prospect'}), ${rep} (CloseIt)

─────────────────────────────────────────

PROJECT CONTEXT
${proj}: ${desc}

─────────────────────────────────────────

DISCUSSION SUMMARY

1. Current State
   ${first} walked through their existing workflow for ${proj}. Primary pain point: ${pain}. The team has been managing this manually which has created bottlenecks as they scale.

2. Product Walkthrough
   ${repFirst} demonstrated the AI automation suite. ${first} flagged ${feature} as particularly relevant. Clarifying questions on integration complexity — no blockers identified.

3. Technical Fit
   Integration path mapped. Estimated setup: 10–14 days. ${first} confirmed their CTO would not need to be involved beyond initial API access.

4. Commercial Alignment
   Budget confirmed: $${lead.formInputs.budget}. Go-live target: ${lead.formInputs.timelineDays} days. Both within standard parameters.

─────────────────────────────────────────

AGREED NEXT STEPS

  ☐  ${rep}: Send formal proposal by Day ${day + 1}
  ☐  ${first}: Share current workflow documentation and existing tooling list
  ☐  ${rep}: Schedule technical review call for Day ${day + 3}
  ☐  Both: Confirm go-live date once proposal accepted

─────────────────────────────────────────

OUTCOME
Strong alignment on scope, timeline, and budget. Both parties keen to move forward.
Decision expected by Day ${day + 5}.  Sentiment: Positive ✓`;
}

// --- Story arc (universal probabilities, no Hot/Warm/Cold bearing) ---

interface LeadStory {
  willReply: boolean;       // 60%
  replyIsPositive: boolean; // of replies: 70% positive
  staffDropsBall: boolean;  // of positive: 40% staff misses follow-up
  replyDay: number;         // relative day lead replies
  staffActionDay: number;   // replyDay + 1
  meetingDay: number | null;
  closeDay: number | null;
}

function getStory(lead: Lead): LeadStory {
  const willReply = seeded(lead.id, 'willreply') < 0.6;
  const replyIsPositive = willReply && seeded(lead.id, 'positive') < 0.7;
  const staffDropsBall = replyIsPositive && seeded(lead.id, 'staffdrop') < 0.4;
  const replyDay = 2 + Math.floor(seeded(lead.id, 'replyDay') * 3); // rel 2, 3, or 4
  const staffActionDay = replyDay + 1;

  // Staff follows up (60% of positive) → 60% of those get a meeting
  const hasMeeting = replyIsPositive && !staffDropsBall && seeded(lead.id, 'meeting') < 0.6;
  const meetingDay = hasMeeting ? staffActionDay + 1 + Math.floor(seeded(lead.id, 'meetingday') * 2) : null;
  const closeDay = meetingDay ? meetingDay + 2 : null;

  return { willReply, replyIsPositive, staffDropsBall, replyDay, staffActionDay, meetingDay, closeDay };
}

// --- Main export ---

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
  const rep = lead.assignedRep;
  const n = lead.name;
  const first = n.split(' ')[0];
  const proj = lead.projectName;

  // ── Day +1: Onboarding ────────────────────────────────────────────────────
  if (rel === 1) {
    const { score, classification, rationale } = computeScore(
      lead.formInputs.budget, lead.formInputs.timelineDays, lead.intentSignal, config
    );
    updates.score = score;
    updates.classification = classification;
    updates.status = 'Contacted';
    updates.lastActionDay = day;
    updates.nextReminderDay = day + freq;

    const desc = resolveProjectDescription(lead);

    actions.push({
      id: uid(), day, type: 'email_sent', leadId: lead.id, leadName: n, actor: 'system',
      summary: `Onboarding email sent to ${n}`,
      detail: {
        channel: 'Email', from: rep, to: lead.email,
        subject: `${proj} — let's talk`,
        body: `Hi ${first},\n\nThanks for reaching out. We saw you're working on ${proj} — ${desc.split('.')[0].toLowerCase()}.\n\nWe help teams like yours automate the repetitive parts so your people can focus on what actually moves the needle. I'd love to understand your current workflow and show you what that could look like for ${proj} specifically.\n\nWould a 20-minute call this week work?\n\n${rep}`,
      },
      timestamp: ts(),
    });

    actions.push({
      id: uid(), day, type: 'score_update', leadId: lead.id, leadName: n, actor: 'ai',
      summary: `AI scored ${n} — ${score}/10 (${classification})`,
      detail: { score, classification, rationale, weights: config.scoring },
      timestamp: ts(),
    });

    actions.push({
      id: uid(), day, type: 'rep_assigned', leadId: lead.id, leadName: n, actor: 'system',
      summary: `${rep} assigned to manage ${n}`,
      detail: { rep, note: `${classification} lead (${score}/10) assigned. Project: ${proj}.` },
      timestamp: ts(),
    });

    actions.push({
      id: uid(), day, type: 'proposal_sent', leadId: lead.id, leadName: n, actor: 'team',
      summary: `${rep} sent capability overview to ${n}`,
      detail: {
        rep, subject: `Quick overview — ${proj}`,
        body: `Hi ${first},\n\nFollowing up with a quick overview. Here's what we'd typically build for ${proj}:\n\n• Automated lead capture and AI scoring\n• Contextual follow-up sequences that adapt to reply signals\n• A CRM-layer agent that tells your team who to contact and when\n• Full audit trail with zero manual data entry\n\nBudget: $${lead.formInputs.budget} | Timeline: ${lead.formInputs.timelineDays} days — both look very achievable.\n\n${rep}`,
      },
      timestamp: ts(),
    });
  }

  // ── Lead replies ──────────────────────────────────────────────────────────
  const alreadyEngaged = ['Replied', 'Meeting Scheduled', 'Closed Won', 'Closed Lost', 'Nurture'].includes(lead.status);

  if (story.willReply && rel === story.replyDay && !alreadyEngaged) {
    if (story.replyIsPositive) {
      const msgFn = pick(POSITIVE_REPLY_MESSAGES, lead.id, 'posreply');
      actions.push({
        id: uid(), day, type: 'reply_received', leadId: lead.id, leadName: n, actor: 'customer',
        summary: `${n} replied — interested in ${proj}`,
        detail: { from: lead.email, to: rep, body: msgFn(n, rep, proj) },
        timestamp: ts(),
      });
      updates.status = 'Replied';
      updates.nextReminderDay = null; // ball is with staff — pause automated sequence
      updates.lastActionDay = day;
    } else {
      const msgFn = pick(NEGATIVE_REPLY_MESSAGES, lead.id, 'negreply');
      actions.push({
        id: uid(), day, type: 'reply_received', leadId: lead.id, leadName: n, actor: 'customer',
        summary: `${n} replied — not the right time`,
        detail: { from: lead.email, to: rep, body: msgFn(n) },
        timestamp: ts(),
      });
      actions.push({
        id: uid(), day, type: 'moved_to_nurture', leadId: lead.id, leadName: n, actor: 'system',
        summary: `${n} moved to Nurture after negative reply`,
        detail: { reason: 'Lead replied with a deferral. Sequence paused. Re-activate manually when timing is right.' },
        timestamp: ts(),
      });
      updates.status = 'Nurture';
      updates.nextReminderDay = null;
      updates.lastActionDay = day;
    }
  }

  // ── Staff action day (day after positive reply) ───────────────────────────
  if (story.replyIsPositive && rel === story.staffActionDay && lead.status === 'Replied') {
    if (story.staffDropsBall) {
      const draftFn = pick(NUDGE_DRAFT_MESSAGES, lead.id, 'nudgedraft');
      actions.push({
        id: uid(), day, type: 'staff_nudge', leadId: lead.id, leadName: n, actor: 'system',
        summary: `⚡ Nudge sent to ${rep} — ${n} replied ${day - (lead.registeredOnDay + story.replyDay)} day(s) ago, no action logged`,
        detail: {
          to: rep,
          reason: `${n} sent a positive reply on Day ${lead.registeredOnDay + story.replyDay} but no follow-up has been logged by ${rep}. Draft response provided below.`,
          draftSubject: `Re: ${proj} — following up on ${first}'s reply`,
          draftBody: draftFn(n, rep, proj),
        },
        timestamp: ts(),
      });
      updates.status = 'Awaiting Reply';
      updates.nextReminderDay = day + freq; // system will follow up with lead if staff stays silent
      updates.lastActionDay = day;
    } else {
      const msgFn = pick(STAFF_FOLLOWUP_MESSAGES, lead.id, 'staffreply');
      actions.push({
        id: uid(), day, type: 'email_sent', leadId: lead.id, leadName: n, actor: 'team',
        summary: `${rep} followed up with ${n}`,
        detail: {
          from: rep, to: lead.email,
          subject: `Re: ${proj} — great to hear from you`,
          body: msgFn(n, rep, proj),
        },
        timestamp: ts(),
      });
      updates.status = 'Awaiting Reply';
      updates.nextReminderDay = day + freq; // ball back with lead — reset counter
      updates.lastActionDay = day;
    }
  }

  // ── Meeting ───────────────────────────────────────────────────────────────
  const closedStatuses = ['Closed Won', 'Closed Lost', 'Nurture'];
  if (story.meetingDay && rel === story.meetingDay && !closedStatuses.includes(lead.status)) {
    actions.push({
      id: uid(), day, type: 'reply_received', leadId: lead.id, leadName: n, actor: 'customer',
      summary: `${n} confirmed the discovery call`,
      detail: {
        from: lead.email, to: rep,
        body: `Hi ${rep.split(' ')[0]}, yes — let's do it. Looking forward to the demo.\n\n— ${first}`,
      },
      timestamp: ts(),
    });
    actions.push({
      id: uid(), day, type: 'meeting_scheduled', leadId: lead.id, leadName: n, actor: 'system',
      summary: `Discovery call booked — ${n} × ${rep}`,
      detail: { date: `Day ${day}`, duration: '30 min', rep, lead: n, project: proj },
      timestamp: ts(),
    });
    actions.push({
      id: uid(), day, type: 'meeting_minutes', leadId: lead.id, leadName: n, actor: 'team',
      summary: `MoM logged — ${n} discovery call`,
      detail: { mom: generateMoM(lead, rep, day) },
      timestamp: ts(),
    });
    updates.status = 'Meeting Scheduled';
    updates.nextReminderDay = null;
    updates.lastActionDay = day;
  }

  // ── Close ─────────────────────────────────────────────────────────────────
  if (story.closeDay && rel === story.closeDay && !closedStatuses.includes(lead.status)) {
    actions.push({
      id: uid(), day, type: 'closed_won', leadId: lead.id, leadName: n, actor: 'team',
      summary: `🎉 ${n} closed won — ${proj}`,
      detail: {
        rep, value: `$${lead.formInputs.budget}`,
        note: `Proposal accepted. Agreement signed. ${rep} to kick off onboarding next week.`,
      },
      timestamp: ts(),
    });
    updates.status = 'Closed Won';
    updates.nextReminderDay = null;
    updates.lastActionDay = day;
  }

  // ── Automated follow-ups (system chasing unresponsive leads) ─────────────
  const engagedStatuses = ['Replied', 'Meeting Scheduled', 'Closed Won', 'Closed Lost', 'Nurture'];
  const onSpecialDay = rel === story.replyDay || rel === story.staffActionDay ||
    rel === story.meetingDay || rel === story.closeDay;

  if (
    !engagedStatuses.includes(lead.status) &&
    !onSpecialDay &&
    lead.nextReminderDay === day &&
    lead.remindersSent < maxR
  ) {
    const rn = lead.remindersSent + 1;
    const msgFn = rn === 1
      ? pick(FOLLOWUP_1_MESSAGES, lead.id, 'fu1')
      : pick(FOLLOWUP_2_MESSAGES, lead.id, 'fu2');

    actions.push({
      id: uid(), day, type: 'email_sent', leadId: lead.id, leadName: n, actor: 'ai',
      summary: `Follow-up #${rn} sent to ${n} (AI-drafted)`,
      detail: {
        from: `${rep} via CloseIt AI`, to: lead.email,
        subject: rn === 1 ? `Checking in — ${proj}` : `Last note from us — ${first}`,
        body: msgFn(n, rep, proj),
      },
      timestamp: ts(),
    });
    updates.remindersSent = rn;
    updates.lastActionDay = day;

    if (rn >= maxR) {
      updates.status = 'Nurture';
      updates.nextReminderDay = null;
      actions.push({
        id: uid(), day, type: 'moved_to_nurture', leadId: lead.id, leadName: n, actor: 'system',
        summary: `${n} moved to Nurture — max follow-ups reached`,
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
