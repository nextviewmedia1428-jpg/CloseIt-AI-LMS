import { create } from 'zustand';
import { Lead, Action, ThreadMessage, OpenTask, Notification } from '@/lib/types';
import { generateLeadSchedule } from '@/lib/leadGenerator';
import { actionsForLeadOnDay } from '@/lib/demoScript';
import { recomputeScore } from '@/lib/scoring';

const TOTAL_DAYS = 30;

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
  nextDay: () => void;
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

    nextDay: () => {
      const { day, leads, leadSchedule, threadsByLead, closeItEnabled } = get();
      const newDay = day + 1;

      // 1. Bring in leads scheduled for the new day
      const arrivingLeads = leadSchedule[newDay] ?? [];
      const allNewLeads = [...leads, ...arrivingLeads];

      // 2. Re-score ALL active leads at day start (silent background process)
      const rescored = allNewLeads.map(lead => {
        if (['Nurture', 'Closed Won', 'Closed Lost'].includes(lead.status)) return lead;
        const thread = threadsByLead[lead.id] ?? [];
        const { score, scoreDelta } = recomputeScore(lead, thread, newDay);
        return { ...lead, score, scoreDelta };
      });

      // 3. Notify for new arrivals
      const newNotifications: Omit<Notification, 'id' | 'read'>[] = arrivingLeads.map(l => ({
        day: newDay,
        type: 'lead_arrived' as const,
        message: `New lead: ${l.name} from ${l.company} (${l.startType === 'warm' ? 'warm inbound' : 'cold outreach'})`,
      }));

      // 4. If CloseIt is on, run day actions for each lead
      let allDayActions: Action[] = [];
      const threadUpdates: Record<string, ThreadMessage[]> = { ...threadsByLead };
      let updatedLeads = rescored;

      if (closeItEnabled) {
        for (const lead of rescored) {
          if (['Closed Won', 'Closed Lost'].includes(lead.status)) continue;
          const thread = threadUpdates[lead.id] ?? [];
          const { actions, messages, leadUpdates } = actionsForLeadOnDay(lead, newDay, thread);

          allDayActions = [...allDayActions, ...actions];

          if (messages.length) {
            threadUpdates[lead.id] = [...thread, ...messages];
          }

          if (Object.keys(leadUpdates).length) {
            updatedLeads = updatedLeads.map(l =>
              l.id === lead.id ? { ...l, ...leadUpdates } : l
            );
          }

          // Create tasks for booked discovery calls
          if (actions.some(a => a.type === 'discovery_call_booked')) {
            const bookedLead = updatedLeads.find(l => l.id === lead.id)!;
            const task: OpenTask = {
              leadId: lead.id,
              leadName: bookedLead.name,
              company: bookedLead.company,
              callDay: bookedLead.discoveryCallDay ?? newDay + 1,
              status: 'pending',
            };
            set(s => ({ tasks: [...s.tasks.filter(t => t.leadId !== lead.id), task] }));
            newNotifications.push({
              day: newDay,
              type: 'call_booked',
              message: `Discovery call booked with ${lead.name} (${lead.company})`,
            });
          }

          // Notify for critical score drops
          const updatedLead = updatedLeads.find(l => l.id === lead.id);
          if (updatedLead && updatedLead.score < 4 && lead.score >= 4) {
            newNotifications.push({
              day: newDay,
              type: 'score_critical',
              message: `${lead.name}'s score dropped to ${updatedLead.score} — needs attention`,
            });
          }
        }
      }

      // 5. Commit all state
      const notifsWithId: Notification[] = newNotifications.map((n, idx) => ({
        ...n,
        id: `notif_${newDay}_${idx}`,
        read: false,
      }));

      set(s => ({
        day: newDay,
        leads: updatedLeads,
        threadsByLead: threadUpdates,
        actionsByDay: { ...s.actionsByDay, [newDay]: allDayActions },
        notifications: [...s.notifications, ...notifsWithId],
        isAdvancing: false,
      }));
    },

    selectLead: (id) => set({ selectedLeadId: id }),

    openMomPanel: (leadId) => set({ showMomPanel: true, momLeadId: leadId }),
    closeMomPanel: () => set({ showMomPanel: false, momLeadId: null }),

    completeMomTask: (leadId, mom) => set(s => ({
      tasks: s.tasks.map(t => t.leadId === leadId ? { ...t, status: 'completed', mom } : t),
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
