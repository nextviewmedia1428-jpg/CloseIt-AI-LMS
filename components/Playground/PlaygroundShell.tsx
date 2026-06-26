'use client';
import { useSimulatorStore } from '@/store/simulatorStore';
import { DayHeader } from './DayHeader';
import { ConfigPanel } from './ConfigPanel';
import { LeadRegistrationForm } from './LeadRegistrationForm';
import { LeadList } from './LeadList';
import { ActionFeed } from './ActionFeed';
import { ActionDetailModal } from './ActionDetailModal';
import { SalesAgentChatPanel } from './SalesAgentChatPanel';

export function PlaygroundShell() {
  const { day, leads, config, setDay, setActions, updateLead, setAdvancing } = useSimulatorStore();

  const handleNextDay = async () => {
    if (leads.length < 3) return;
    setAdvancing(true);
    try {
      const res = await fetch('/api/simulate/next-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, leads, config }),
      });
      const data = await res.json();
      setActions(day, data.actions ?? []);
      // Apply lead updates returned by the engine
      if (data.leadUpdates) {
        for (const [id, updates] of Object.entries(data.leadUpdates)) {
          updateLead(id, updates as any);
        }
      }
      setDay(day + 1);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="space-y-6">
      <DayHeader onNextDay={handleNextDay} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col — controls */}
        <div className="space-y-4">
          <ConfigPanel />
          <LeadRegistrationForm />
          <LeadList />
        </div>

        {/* Center col — action feed */}
        <div className="lg:col-span-1">
          <div className="bg-paper border border-ink/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-ink/70 uppercase tracking-widest">Event Feed</h3>
              <span className="text-xs font-mono text-ink/30">{useSimulatorStore.getState().allActions().length} events</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto py-2">
              <ActionFeed />
            </div>
          </div>
        </div>

        {/* Right col — sales agent */}
        <div>
          <SalesAgentChatPanel />
        </div>
      </div>

      <ActionDetailModal />
    </div>
  );
}
