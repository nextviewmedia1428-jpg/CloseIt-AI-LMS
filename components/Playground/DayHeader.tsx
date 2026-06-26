'use client';
import { useSimulatorStore } from '@/store/simulatorStore';
import { SignalBar } from '@/components/ui/SignalBar';

export function DayHeader({ onNextDay }: { onNextDay: () => void }) {
  const { day, leads, isAdvancing } = useSimulatorStore();
  const canAdvance = leads.length >= 3;

  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b border-ink/10">
      <div>
        <div className="flex items-center gap-3">
          <span className="font-display text-4xl font-bold text-ink">Day {day}</span>
          <SignalBar className="h-2 w-24 opacity-70" />
        </div>
        <p className="text-sm text-ink/50 mt-0.5 font-mono">
          {leads.length} lead{leads.length !== 1 ? 's' : ''} in system
          {!canAdvance && ' — register at least 3 leads to advance'}
        </p>
      </div>
      <button
        onClick={onNextDay}
        disabled={!canAdvance || isAdvancing}
        className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
          bg-ink text-paper hover:bg-ink/80
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center gap-2"
      >
        {isAdvancing ? (
          <><span className="animate-spin inline-block w-4 h-4 border-2 border-paper/30 border-t-paper rounded-full" /> Processing…</>
        ) : (
          <>Next Day →</>
        )}
      </button>
    </div>
  );
}
