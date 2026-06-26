import { create } from 'zustand';
import { Lead, Action, SimulatorConfig, STAFF_POOL } from '@/lib/types';

interface SimulatorStore {
  day: number;
  leads: Lead[];
  actionsByDay: Record<number, Action[]>;
  config: SimulatorConfig;
  selectedLeadId: string | null;
  isAdvancing: boolean;
  showDetailAction: Action | null;

  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  setDay: (day: number) => void;
  setActions: (day: number, actions: Action[]) => void;
  setConfig: (config: SimulatorConfig) => void;
  setSelectedLead: (id: string | null) => void;
  setAdvancing: (v: boolean) => void;
  setDetailAction: (a: Action | null) => void;
  randomRep: () => string;
  randomIntent: () => 'low' | 'medium' | 'high';
  allActions: () => Action[];
  actionsForLead: (leadId: string) => Action[];
}

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  day: 0,
  leads: [],
  actionsByDay: {},
  config: {
    scoring: { budgetWeight: 40, intentWeight: 30, timelineWeight: 30 },
    reminders: { frequencyDays: 2, maxReminders: 2 },
  },
  selectedLeadId: null,
  isAdvancing: false,
  showDetailAction: null,

  addLead: (lead) => set(s => ({ leads: [...s.leads, lead] })),
  updateLead: (id, updates) =>
    set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, ...updates } : l) })),
  setDay: (day) => set({ day }),
  setActions: (day, actions) =>
    set(s => ({ actionsByDay: { ...s.actionsByDay, [day]: [...(s.actionsByDay[day] ?? []), ...actions] } })),
  setConfig: (config) => set({ config }),
  setSelectedLead: (id) => set({ selectedLeadId: id }),
  setAdvancing: (v) => set({ isAdvancing: v }),
  setDetailAction: (a) => set({ showDetailAction: a }),

  randomRep: () => STAFF_POOL[Math.floor(Math.random() * STAFF_POOL.length)],
  randomIntent: () => {
    const r = Math.random();
    return r < 0.33 ? 'low' : r < 0.66 ? 'medium' : 'high';
  },

  allActions: () => {
    const { actionsByDay } = get();
    return Object.values(actionsByDay).flat().sort((a, b) =>
      a.day !== b.day ? b.day - a.day : b.timestamp.localeCompare(a.timestamp)
    );
  },

  actionsForLead: (leadId) => {
    const { actionsByDay } = get();
    return Object.values(actionsByDay).flat()
      .filter(a => a.leadId === leadId)
      .sort((a, b) => a.day - b.day || a.timestamp.localeCompare(b.timestamp));
  },
}));
