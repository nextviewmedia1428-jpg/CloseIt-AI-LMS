'use client';
import { create } from 'zustand';
import { Lead, Threads, SimulatorConfig, UserReminder, UserMessage, ScheduledCall } from '@/lib/types';

export const SIMULATION_MAX_DAYS = 12;
export const SIMULATION_MAX_SECONDS = 30 * 60; // 30 minutes

export interface MorningBriefData {
  processedDay: number;
  newDay: number;
  totalLeads: number;
  newLeadsCount: number;
  hot: number;
  warm: number;
  cold: number;
  followUpsSent: { lead_id: string; lead_name: string }[];
  queriesResolved: { lead_id: string; lead_name: string }[];
  callsScheduledYesterday: ScheduledCall[];
  meetingsToday: ScheduledCall[];
  reminders: string[];
}

export interface EndScore {
  totalScore: number;
  callsScore: number;
  speedScore: number;
  intentScore: number;
  callsCount: number;
  daysUsed: number;
  avgIntentScore: number;
  timeUsedSeconds: number;
  endReason: 'day_cap' | 'timer';
}

function computeGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

export function computeScore(
  leads: Lead[],
  scheduledCalls: ScheduledCall[],
  daysUsed: number,
  timeUsedSeconds: number,
  endReason: 'day_cap' | 'timer'
): EndScore {
  const callsScore = Math.min(scheduledCalls.length * 10, 40);
  const speedScore = Math.round(Math.max(0, (1 - timeUsedSeconds / SIMULATION_MAX_SECONDS)) * 20);
  const scored = leads.filter((l) => l.final_score != null);
  const avgIntentScore =
    scored.length > 0
      ? Math.round((scored.reduce((s, l) => s + (l.final_score ?? 0), 0) / scored.length) * 10) / 10
      : 0;
  const intentScore = Math.round((avgIntentScore / 10) * 40);
  return {
    totalScore: callsScore + speedScore + intentScore,
    callsScore, speedScore, intentScore,
    callsCount: scheduledCalls.length,
    daysUsed, avgIntentScore,
    timeUsedSeconds, endReason,
  };
}

export { computeGrade };

interface SimulatorStore {
  day: number;
  leads: Lead[];
  threads: Threads;
  config: SimulatorConfig;
  selectedLeadId: string | null;
  closeItEnabled: boolean;
  reminders: UserReminder[];
  userMessages: UserMessage[];
  scheduledCalls: ScheduledCall[];
  selectedCalendarDay: number | null;
  meetingModalDay: number | null;
  morningBrief: MorningBriefData | null;
  timerStartedAt: number | null;
  simulationEnded: boolean;
  endScore: EndScore | null;

  setDay: (d: number) => void;
  addLeads: (newLeads: Lead[], newThreads: Threads) => void;
  setSelectedLead: (id: string | null) => void;
  toggleCloseIt: () => void;
  setConfig: (c: SimulatorConfig) => void;
  addReminder: (r: UserReminder) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  setUserMessages: (msgs: UserMessage[]) => void;
  setScheduledCalls: (calls: ScheduledCall[]) => void;
  setSelectedCalendarDay: (day: number | null) => void;
  setMeetingModalDay: (day: number | null) => void;
  markCallCompleted: (leadId: string) => void;
  addThreadMessage: (leadId: string, msg: import('@/lib/types').ThreadMessage) => void;
  setMorningBrief: (data: MorningBriefData | null) => void;
  startTimer: () => void;
  endSimulation: (score: EndScore) => void;
  resetSimulation: () => void;
}

const DEFAULT_CONFIG: SimulatorConfig = {
  scoring: { budgetWeight: 40, intentWeight: 35, timelineWeight: 25 },
  reminders: { frequencyDays: 4, maxReminders: 2 },
};

const INITIAL_STATE = {
  day: 0,
  leads: [] as Lead[],
  threads: {} as Threads,
  config: DEFAULT_CONFIG,
  selectedLeadId: null as string | null,
  closeItEnabled: true,
  reminders: [] as UserReminder[],
  userMessages: [] as UserMessage[],
  scheduledCalls: [] as ScheduledCall[],
  selectedCalendarDay: null as number | null,
  meetingModalDay: null as number | null,
  morningBrief: null as MorningBriefData | null,
  timerStartedAt: null as number | null,
  simulationEnded: false,
  endScore: null as EndScore | null,
};

export const useSimulatorStore = create<SimulatorStore>((set) => ({
  ...INITIAL_STATE,

  setDay: (d) => set({ day: d }),

  addLeads: (newLeads, newThreads) =>
    set((s) => {
      const incomingMap = Object.fromEntries(newLeads.map((l) => [l.lead_id, l]));
      const existingIds = new Set(s.leads.map((l) => l.lead_id));
      const updated = s.leads.map((l) => incomingMap[l.lead_id] ? { ...l, ...incomingMap[l.lead_id] } : l);
      const toAdd = newLeads.filter((l) => !existingIds.has(l.lead_id));
      return {
        leads: [...updated, ...toAdd],
        threads: { ...s.threads, ...newThreads },
        selectedLeadId: s.selectedLeadId ?? (toAdd[0]?.lead_id ?? null),
      };
    }),

  setSelectedLead: (id) => set({ selectedLeadId: id }),
  toggleCloseIt: () => set((s) => ({ closeItEnabled: !s.closeItEnabled })),
  setConfig: (c) => set({ config: c }),
  addReminder: (r) => set((s) => ({ reminders: [...s.reminders, r] })),
  toggleReminder: (id) =>
    set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)) })),
  deleteReminder: (id) =>
    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),
  setUserMessages: (msgs) => set({ userMessages: msgs }),
  setScheduledCalls: (calls) => set({ scheduledCalls: calls }),
  setSelectedCalendarDay: (day) => set({ selectedCalendarDay: day }),
  setMeetingModalDay: (day) => set({ meetingModalDay: day }),
  markCallCompleted: (leadId) =>
    set((s) => ({
      scheduledCalls: s.scheduledCalls.map((c) =>
        c.lead_id === leadId ? { ...c, completed: true } : c
      ),
    })),
  addThreadMessage: (leadId, msg) =>
    set((s) => ({
      threads: { ...s.threads, [leadId]: [...(s.threads[leadId] ?? []), msg] },
    })),
  setMorningBrief: (data) => set({ morningBrief: data }),
  startTimer: () => set({ timerStartedAt: Date.now() }),
  endSimulation: (score) => set({ simulationEnded: true, endScore: score, morningBrief: null, meetingModalDay: null }),
  resetSimulation: () => set({ ...INITIAL_STATE }),
}));
