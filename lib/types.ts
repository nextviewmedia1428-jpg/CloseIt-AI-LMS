export type LeadClassification = 'Hot' | 'Warm' | 'Cold';
export type LeadStatus =
  | 'New' | 'Contacted' | 'Awaiting Reply' | 'Replied'
  | 'Meeting Scheduled' | 'Nurture' | 'Closed Won' | 'Closed Lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectName: string;
  projectDescription: string;
  source: 'simulator_form';
  formInputs: {
    budget: number;
    timelineDays: number;
  };
  intentSignal: 'low' | 'medium' | 'high';
  score: number;
  classification: LeadClassification;
  status: LeadStatus;
  remindersSent: number;
  nextReminderDay: number | null;
  registeredOnDay: number;
  lastActionDay: number;
  threadSummary?: string;
  assignedRep: string;
}

export type ActionType =
  | 'email_sent' | 'score_update' | 'reply_received' | 'meeting_scheduled'
  | 'rep_assigned' | 'proposal_sent' | 'call_logged' | 'closed_won'
  | 'closed_lost' | 'moved_to_nurture' | 'staff_nudge' | 'meeting_minutes' | 'error';

export type ActionActor = 'system' | 'ai' | 'team' | 'customer';

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

export const STAFF_POOL = ['Arjun', 'Priya', 'Sam'] as const;
export type StaffName = typeof STAFF_POOL[number];
