// Matches the lead structure returned by n8n
export interface Lead {
  lead_id: string;
  name: string;
  company: string;
  industry: string;
  email: string;
  startType: 'cold' | 'warm';
  replyFrequencyDays: number;
  inboundMessage: string | null;
  // Added by the Rate Threads node
  classification?: 'Hot' | 'Warm' | 'Cold';
  final_score?: number;
  intent_score?: number;
  recency_score?: number;
  rationale?: string | null;
  callScheduled?: 'Y' | 'N';
  callDay?: string | null;
}

export interface ThreadMessage {
  id: string;
  day: number;
  from: string;
  body: string;
  timestamp: string;
}

export type Threads = Record<string, ThreadMessage[]>;

export interface SimulatorConfig {
  scoring: {
    budgetWeight: number;
    intentWeight: number;
    timelineWeight: number;
  };
  reminders: {
    frequencyDays: number;
    maxReminders: number;
  };
}

export interface UserReminder {
  id: string;
  leadId: string;
  leadName: string;
  text: string;
  dueDay: number;
  done: boolean;
}

export interface UserMessage {
  lead_id: string;
  lead_name: string;
  message: string;
}

export interface ScheduledCall {
  lead_id: string;
  lead_name: string;
  company: string;
  callDay: number;
  callDayLabel: string;
  scheduledOnDay: number;
  bossSummary?: string;
  completed?: boolean;
}
