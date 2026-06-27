import { create } from 'zustand';
import { Lead, Action, ThreadMessage, OpenTask, Notification } from '@/lib/types';
import { generateLeadSchedule } from '@/lib/leadGenerator';
import { actionsForLeadOnDay } from '@/lib/demoScript';
import { recomputeScore } from '@/lib/scoring';

const TOTAL_DAYS = 30;

// Applies the structured response returned by n8n WF2 to the store state.
function applyN8nResponse(
  get: () => SimulatorStore,
  set: (partial: Partial<SimulatorStore> | ((s: SimulatorStore) => Partial<SimulatorStore>)) => void,
  newDay: number,
  data: {
    newLeads?: Lead[];
    threadMessages?: { leadId: string; from: 'agent' | 'lead' | 'user'; body: string; day: number }[];
    scoreUpdates?: { leadId: string; score: number; delta: number }[];
    statusUpdates?: { leadId: string; status: Lead['status']; agentFollowUpCount?: number; lastAgentFollowUpDay?: number; agentNudgeCount?: number; lastAgentNudgeDay?: number; discoveryCallDay?: number }[];
    agentActions?: Action[];
    notifications?: { type: Notification['type']; message: string }[];
    tasks?: { leadId: string; leadName: string; company: string; callDay: number }[];
  }
) {
  const s = get();

  // Merge new leads
  const existingIds = new Set(s.leads.map(l => l.id));
  const brandNewLeads: Lead[] = (data.newLeads ?? []).filter(l => !existingIds.has(l.id));
  let leads = [...s.leads, ...brandNewLeads];

  // Apply score updates
  if (data.scoreUpdates?.length) {
    const scoreMap = Object.fromEntries(data.scoreUpdates.map(u => [u.leadId, u]));
    leads = leads.map(l => scoreMap[l.id] ? { ...l, score: scoreMap[l.id].score, scoreDelta: scoreMap[l.id].delta } : l);
  }

  // Apply status + field updates — priority-based merge so Discovery Booked isn't overwritten by Awaiting Reply
  if (data.statusUpdates?.length) {
    const STATUS_PRIORITY: Record<string, number> = { 'Discovery Booked': 5, 'Replied': 4, 'Awaiting Reply': 3, 'Contacted': 2, 'New': 1 };
    const statusMap: Record<string, typeof data.statusUpdates[0]> = {};
    for (const u of data.statusUpdates) {
      const existing = statusMap[u.leadId];
      if (!existing || (STATUS_PRIORITY[u.status ?? ''] ?? 0) > (STATUS_PRIORITY[existing.status ?? ''] ?? 0)) {
        statusMap[u.leadId] = u;
      }
    }
    leads = leads.map(l => statusMap[l.id] ? { ...l, ...statusMap[l.id], id: l.id } : l);
  }

  // Apply counter/field updates from leadUpdates (agentFollowUpCount, agentNudgeCount, etc.)
  if ((data as { leadUpdates?: { leadId: string; [k: string]: unknown }[] }).leadUpdates?.length) {
    const updMap = Object.fromEntries((data as { leadUpdates: { leadId: string; [k: string]: unknown }[] }).leadUpdates.map((u: { leadId: string; [k: string]: unknown }) => [u.leadId, u]));
    leads = leads.map(l => updMap[l.id] ? { ...l, ...updMap[l.id], id: l.id } : l);
  }

  // Apply thread messages
  const threadUpdates = { ...s.threadsByLead };
  for (const [idx, msg] of (data.threadMessages ?? []).entries()) {
    const tm: ThreadMessage = { id: `n8n_${msg.leadId}_${newDay}_${msg.from}_${idx}`, day: msg.day, from: msg.from, body: msg.body, timestamp: new Date().toISOString() };
    threadUpdates[msg.leadId] = [...(threadUpdates[msg.leadId] ?? []), tm];
  }

  // Tasks
  const incomingTasks: OpenTask[] = (data.tasks ?? []).map(t => ({ ...t, status: 'pending' as const }));
  const existingTaskIds = new Set(s.tasks.map(t => t.leadId));
  const newTasks = incomingTasks.filter(t => !existingTaskIds.has(t.leadId));
  // Apply taskUpdates (e.g. momFollowUpSent: true after post-MoM email sent)
  type TaskUpdate = { leadId: string; [k: string]: unknown };
  const taskUpdateMap = Object.fromEntries(
    ((data as { taskUpdates?: TaskUpdate[] }).taskUpdates ?? []).map(u => [u.leadId, u])
  );
  const updatedExistingTasks = s.tasks.map(t => taskUpdateMap[t.leadId] ? { ...t, ...taskUpdateMap[t.leadId] } : t);

  // Notifications
  const notifsWithId: Notification[] = (data.notifications ?? []).map((n, idx) => ({ ...n, id: `n8n_notif_${newDay}_${idx}`, day: newDay, read: false }));

  set({
    day: newDay,
    leads,
    threadsByLead: threadUpdates,
    actionsByDay: { ...s.actionsByDay, [newDay]: data.agentActions ?? [] },
    tasks: [...updatedExistingTasks, ...newTasks],
    notifications: [...s.notifications, ...notifsWithId],
    isAdvancing: false,
  });
}

interface SimulatorStore {
  day: number;
  leads: Lead[];
  // leadSchedule[d] = leads arriving on day d (pre-computed on page load)
  leadSchedule: Record<number, Lead[]>;
  // threadsByLead[leadId] = ordered messages
  threadsByLead: Record<string, ThreadMessage[]>;
  // actionsByDay[day] = actions from that day
  actionsByDay: Record<number, Action[]>;
  tasks: OpenTask[];
  notifications: Notification[];
  selectedLeadId: string | null;
  showMomPanel: boolean;
  momLeadId: string | null;
  closeItEnabled: boolean;
  winCount: number;
  lossCount: number;
  isAdvancing: boolean;

  // Actions
  nextDay: () => Promise<void>;
  selectLead: (id: string | null) => void;
  openMomPanel: (leadId: string) => void;
  closeMomPanel: () => void;
  completeMomTask: (leadId: string, mom: string) => void;
  userSendMessage: (leadId: string, body: string) => void;
  toggleCloseIt: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'read'>) => void;
  markNotificationsRead: () => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;

  // Selectors
  todayActions: () => Action[];
  threadForLead: (leadId: string) => ThreadMessage[];
  unreadCount: () => number;
  openTask: () => OpenTask | null;
}

export const useSimulatorStore = create<SimulatorStore>((set, get) => {
  const leadSchedule = generateLeadSchedule(TOTAL_DAYS);

  return {
    day: 0,
    leads: [],
    leadSchedule,
    threadsByLead: {},
    actionsByDay: {},
    tasks: [],
    notifications: [],
    selectedLeadId: null,
    showMomPanel: false,
    momLeadId: null,
    closeItEnabled: true,
    winCount: 0,
    lossCount: 0,
    isAdvancing: false,

    nextDay: async () => {
      const { day, leads, leadSchedule, threadsByLead, closeItEnabled } = get();
      const newDay = day + 1;
      set({ isAdvancing: true });

      // Pre-scheduled leads from local generator (used as fallback seed data)
      const scheduledLeads = leadSchedule[newDay] ?? [];

      try {
        // Call n8n with full current state — n8n does all computation + AI
        const res = await fetch('/api/simulate/next-day', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day: newDay,
            closeItEnabled,
            leads,
            threads: threadsByLead,
            tasks: get().tasks,
            scheduledLeads,
          }),
        });

        const data = await res.json();

        // If n8n is live and responded with real data, apply it
        if (!data.mock && data.newLeads !== undefined) {
          applyN8nResponse(get, set, newDay, data);
          return;
        }
      } catch {
        // n8n unreachable — fall through to local fallback
      }

      // ── Local fallback (mock / n8n down) ────────────────────────────────
      const arrivingLeads = scheduledLeads;
      const allNewLeads = [...leads, ...arrivingLeads];

      const rescored = allNewLeads.map(lead => {
        if (['Nurture', 'Closed Won', 'Closed Lost'].includes(lead.status)) return lead;
        const thread = threadsByLead[lead.id] ?? [];
        const { score, scoreDelta } = recomputeScore(lead, thread, newDay);
        return { ...lead, score, scoreDelta };
      });

      const newNotifications: Omit<Notification, 'id' | 'read'>[] = arrivingLeads.map(l => ({
        day: newDay, type: 'lead_arrived' as const,
        message: `New lead: ${l.name} from ${l.company} (${l.startType === 'warm' ? 'warm inbound' : 'cold outreach'})`,
      }));

      let allDayActions: Action[] = [];
      const threadUpdates: Record<string, ThreadMessage[]> = { ...threadsByLead };
      let updatedLeads = rescored;

      if (closeItEnabled) {
        for (const lead of rescored) {
          if (['Closed Won', 'Closed Lost'].includes(lead.status)) continue;
          const thread = threadUpdates[lead.id] ?? [];
          const { actions, messages, leadUpdates } = actionsForLeadOnDay(lead, newDay, thread);
          allDayActions = [...allDayActions, ...actions];
          if (messages.length) threadUpdates[lead.id] = [...thread, ...messages];
          if (Object.keys(leadUpdates).length)
            updatedLeads = updatedLeads.map(l => l.id === lead.id ? { ...l, ...leadUpdates } : l);

          if (actions.some(a => a.type === 'discovery_call_booked')) {
            const bl = updatedLeads.find(l => l.id === lead.id)!;
            const task: OpenTask = { leadId: lead.id, leadName: bl.name, company: bl.company, callDay: bl.discoveryCallDay ?? newDay + 1, status: 'pending' };
            set(s => ({ tasks: [...s.tasks.filter(t => t.leadId !== lead.id), task] }));
            newNotifications.push({ day: newDay, type: 'call_booked', message: `Discovery call booked with ${lead.name} (${lead.company})` });
          }
          const ul = updatedLeads.find(l => l.id === lead.id);
          if (ul && ul.score < 4 && lead.score >= 4)
            newNotifications.push({ day: newDay, type: 'score_critical', message: `${lead.name}'s score dropped to ${ul.score} — needs attention` });
        }
      }

      const notifsWithId: Notification[] = newNotifications.map((n, idx) => ({ ...n, id: `notif_${newDay}_${idx}`, read: false }));
      set(s => ({ day: newDay, leads: updatedLeads, threadsByLead: threadUpdates, actionsByDay: { ...s.actionsByDay, [newDay]: allDayActions }, notifications: [...s.notifications, ...notifsWithId], isAdvancing: false }));
    },

    selectLead: (id) => set({ selectedLeadId: id }),

    openMomPanel: (leadId) => set({ showMomPanel: true, momLeadId: leadId }),
    closeMomPanel: () => set({ showMomPanel: false, momLeadId: null }),

    completeMomTask: (leadId, mom) => set(s => ({
      tasks: s.tasks.map(t => t.leadId === leadId ? { ...t, status: 'completed', mom, momFollowUpSent: false } : t),
      showMomPanel: false,
      momLeadId: null,
    })),

    userSendMessage: (leadId, body) => {
      const { day, threadsByLead } = get();
      const msg: ThreadMessage = {
        id: `um_${Date.now()}`,
        day,
        from: 'user',
        body,
        timestamp: new Date().toISOString(),
      };
      const thread = threadsByLead[leadId] ?? [];
      set(s => ({
        threadsByLead: { ...s.threadsByLead, [leadId]: [...thread, msg] },
        leads: s.leads.map(l =>
          l.id === leadId ? { ...l, lastUserReplyDay: day, status: 'Awaiting Reply' } : l
        ),
      }));
    },

    toggleCloseIt: () => set(s => ({ closeItEnabled: !s.closeItEnabled })),

    addNotification: (n) => set(s => ({
      notifications: [...s.notifications, { ...n, id: `n_${Date.now()}`, read: false }],
    })),

    markNotificationsRead: () => set(s => ({
      notifications: s.notifications.map(n => ({ ...n, read: true })),
    })),

    updateLead: (id, updates) => set(s => ({
      leads: s.leads.map(l => l.id === id ? { ...l, ...updates } : l),
    })),

    todayActions: () => get().actionsByDay[get().day] ?? [],

    threadForLead: (leadId) => get().threadsByLead[leadId] ?? [],

    unreadCount: () => get().notifications.filter(n => !n.read).length,

    openTask: () => get().tasks.find(t => t.status === 'pending') ?? null,
  };
});
