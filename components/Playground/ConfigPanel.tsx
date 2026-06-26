'use client';
import { useSimulatorStore } from '@/store/simulatorStore';

function WeightSlider({
  label, value, onChange, color,
}: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className="text-ink/60">{label}</span>
        <span style={{ color }} className="font-bold">{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} step={5} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-current h-1.5 rounded-full cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  );
}

export function ConfigPanel() {
  const { config, setConfig } = useSimulatorStore();
  const { scoring, reminders } = config;
  const total = scoring.budgetWeight + scoring.intentWeight + scoring.timelineWeight;

  const updateWeight = (key: keyof typeof scoring, val: number) => {
    setConfig({ ...config, scoring: { ...scoring, [key]: val } });
  };

  return (
    <div className="bg-paper border border-ink/10 rounded-2xl p-5 space-y-5">
      <h3 className="font-display font-semibold text-sm text-ink/70 uppercase tracking-widest">Scoring Weights</h3>
      <div className="space-y-4">
        <WeightSlider label="Budget" value={scoring.budgetWeight} color="#FF5A36" onChange={v => updateWeight('budgetWeight', v)} />
        <WeightSlider label="Intent" value={scoring.intentWeight} color="#7C5CFF" onChange={v => updateWeight('intentWeight', v)} />
        <WeightSlider label="Timeline" value={scoring.timelineWeight} color="#FFB627" onChange={v => updateWeight('timelineWeight', v)} />
        <div className={`text-xs font-mono text-right ${total === 100 ? 'text-signal' : 'text-ember'}`}>
          Total: {total}/100 {total !== 100 && '⚠ must sum to 100'}
        </div>
      </div>

      <div className="border-t border-ink/10 pt-4 space-y-3">
        <h3 className="font-display font-semibold text-sm text-ink/70 uppercase tracking-widest">Follow-up Cadence</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-ink/60">Every N days</span>
          <input
            type="number" min={1} max={14} value={reminders.frequencyDays}
            onChange={e => setConfig({ ...config, reminders: { ...reminders, frequencyDays: Number(e.target.value) } })}
            className="w-14 text-center font-mono text-sm bg-ink/5 rounded-lg px-2 py-1 border border-ink/10 focus:outline-none focus:border-pulse"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-ink/60">Max follow-ups</span>
          <input
            type="number" min={1} max={5} value={reminders.maxReminders}
            onChange={e => setConfig({ ...config, reminders: { ...reminders, maxReminders: Number(e.target.value) } })}
            className="w-14 text-center font-mono text-sm bg-ink/5 rounded-lg px-2 py-1 border border-ink/10 focus:outline-none focus:border-pulse"
          />
        </div>
      </div>
    </div>
  );
}
