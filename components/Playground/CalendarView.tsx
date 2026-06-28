'use client';
import { useSimulatorStore } from '@/store/simulatorStore';

export default function CalendarView() {
  const { day, scheduledCalls, meetingModalDay, setMeetingModalDay } = useSimulatorStore();

  const totalDays = day + 7;
  const days = Array.from({ length: totalDays + 1 }, (_, i) => i);

  const callDaySet = new Set(scheduledCalls.map((c) => c.callDay));

  return (
    <div className="flex-shrink-0 border-t border-[var(--border-soft)] bg-[var(--surface-2)]">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border-soft)]">
        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[.05em]">📅 Call Calendar</span>
        <span className="text-[10px] text-[var(--text-muted)]">{scheduledCalls.length} scheduled</span>
      </div>

      <div className="overflow-x-auto px-4 py-2.5">
        <div className="flex gap-1.5" style={{ minWidth: 'max-content' }}>
          {days.map((d) => {
            const hasCall = callDaySet.has(d);
            const isToday = d === day;
            const isPast = d < day;
            const isOpen = meetingModalDay === d;
            const allDone = hasCall && scheduledCalls.filter(c => c.callDay === d).every(c => c.completed);

            return (
              <button
                key={d}
                onClick={() => hasCall && setMeetingModalDay(isOpen ? null : d)}
                disabled={!hasCall}
                className={`
                  relative flex flex-col items-center justify-center w-10 h-12 rounded-[10px] border text-[11px] font-semibold transition-all flex-shrink-0
                  ${isOpen
                    ? 'bg-[var(--pulse)] border-[var(--pulse)] text-white shadow-sm'
                    : allDone
                      ? 'bg-[var(--signal-soft)] border-[rgba(47,158,68,0.3)] text-[var(--signal)] cursor-pointer'
                      : hasCall
                        ? 'bg-[var(--ember-soft)] border-[var(--ember-border)] text-[var(--ember)] hover:bg-[var(--ember)] hover:text-white cursor-pointer'
                        : isPast
                          ? 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-40 cursor-default'
                          : isToday
                            ? 'bg-[var(--pulse-soft)] border-[var(--pulse-border)] text-[var(--pulse)] cursor-default'
                            : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] cursor-default'
                  }
                `}
              >
                <span className="text-[9px] font-normal opacity-70">Day</span>
                <span>{d}</span>
                {hasCall && (
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isOpen ? 'bg-white' : allDone ? 'bg-[var(--signal)]' : 'bg-[var(--ember)]'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
