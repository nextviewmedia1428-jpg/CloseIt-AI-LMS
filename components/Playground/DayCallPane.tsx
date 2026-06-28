'use client';
import { useSimulatorStore } from '@/store/simulatorStore';
import { ClassificationBadge } from '@/components/ui/Badge';

export default function DayCallPane() {
  const { selectedCalendarDay, scheduledCalls, leads, setSelectedCalendarDay } = useSimulatorStore();

  if (selectedCalendarDay === null) return null;

  const callsForDay = scheduledCalls.filter((c) => c.callDay === selectedCalendarDay);
  if (callsForDay.length === 0) return null;

  return (
    <div className="flex-shrink-0 border-t border-[var(--ember-border)] bg-[var(--ember-soft)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--ember-border)]">
        <span className="text-[11px] font-bold text-[var(--ember)] uppercase tracking-[.05em]">
          🔔 Calls on Day {selectedCalendarDay}
        </span>
        <button
          onClick={() => setSelectedCalendarDay(null)}
          className="text-[var(--ember)] opacity-60 hover:opacity-100 text-xs leading-none"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-3 px-4 py-3 overflow-x-auto">
        {callsForDay.map((call) => {
          const lead = leads.find((l) => l.lead_id === call.lead_id);
          return (
            <div
              key={call.lead_id}
              className="flex-shrink-0 w-52 bg-[var(--surface)] border border-[var(--ember-border)] rounded-xl p-3"
            >
              <div className="text-[13px] font-bold text-[var(--text)] truncate">{call.lead_name}</div>
              <div className="text-[11px] text-[var(--text-muted)] truncate mb-2">{call.company}</div>
              <div className="flex items-center gap-2">
                {lead?.classification && <ClassificationBadge c={lead.classification} />}
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  booked Day {call.scheduledOnDay}
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--border-soft)]">
                <span className="text-[10px] text-[var(--text-muted)] italic">Actions coming soon</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
