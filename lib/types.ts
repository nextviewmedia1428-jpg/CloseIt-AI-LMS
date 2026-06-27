export type LeadStartType = 'cold' | 'warm';

export type LeadStatus =
  | 'New'
  | 'Contacted'         // CloseIt sent first email
  | 'Awaiting Reply'    // ball is with lead
  | 'Replied'           // lead replied, ball is with user
  | 'Discovery Booked'  // discovery call scheduled, task pending
  | 'Nurture'
  | 'Closed Won'
  | 'Closed Lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: string;
  startType: LeadStartType;
  // warm-start leads have an initial inbound message
  inboundMessage?: string;
  intentSignal: 'low' | 'medium' | 'high';
  // scores are re-computed at the start of every day
  score: number;           // 0–10, starts at 6
  scoreDelta: number;      // +/- vs yesterday, for badge animation
  status: LeadStatus;
  registeredOnDay: number;
  lastReplyDay: number | null;    // last day lead sent a message
  lastUserReplyDay: number | null; // last day user sent a message
  replyFrequencyDays: number;     // expected reply cadence (2–6), seeded per lead
  discoveryCallDay: number | null;
  agentFollowUpCount: number;     // pre-discovery call follow-ups sent (max 4)
  lastAgentFollowUpDay: number | null;
  agentNudgeCount: number;        // post-user-reply nudges sent (max 4, every 2 days)
  lastAgentNudgeDay: number | null;
  threadSummary?: string;
}

export type ActionType =
  | 'initial_email_sent'     // CloseIt's one autonomous email per lead
  | 'discovery_call_booked'  // agent detects agreement and books the call
  | 'lead_arrived'           // warm-start: lead's inbound message
  | 'lead_replied'           // any subsequent lead reply
  | 'user_replied'           // user sent a message via compose
  | 'score_updated'          // silent daily score recompute
  | 'closed_won'
  | 'closed_lost'
  | 'moved_to_nurture'
  | 'error';

export type ActionActor = 'system' | 'ai' | 'user' | 'lead';

export interface Action {
  id: string;
  day: number;
  type: ActionType;
  leadId: string;
  leadName: string;
  summary: string;
  actor: ActionActor;
  detail: Record<string, unknown>;
  timestamp: string;
}

// A message in the thread panel
export interface ThreadMessage {
  id: string;
  day: number;
  from: 'agent' | 'lead' | 'user';
  body: string;
  timestamp: string;
}

export interface OpenTask {
  leadId: string;
  leadName: string;
  company: string;
  callDay: number;
  status: 'pending' | 'completed';
  mom?: string;
}

export interface Notification {
  id: string;
  day: number;
  type: 'lead_arrived' | 'score_critical' | 'call_booked' | 'closed_won' | 'closed_lost';
  message: string;
  read: boolean;
}

export interface SimulatorState {
  closeItEnabled: boolean;
  winCount: number;
  lossCount: number;
}
