'use client';
import { useSimulatorStore, computeGrade } from '@/store/simulatorStore';

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 85 ? 'var(--signal)' : score >= 70 ? 'var(--pulse)' : score >= 50 ? 'var(--amber)' : 'var(--ember)';

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="var(--border-med)" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-[32px] font-bold font-display leading-none" style={{ color }}>
          {score}
        </div>
        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">/ 100</div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, max, color, detail }: {
  label: string; value: number; max: number; color: string; detail: string;
}) {
  return (
    <div className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3">
      <div className="text-[11px] text-[var(--text-muted)] mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-[22px] font-bold leading-none ${color}`}>{value}</span>
        <span className="text-[11px] text-[var(--text-muted)]">/ {max}</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-muted)] mt-1.5">{detail}</div>
      {/* bar */}
      <div className="mt-2 h-1 bg-[var(--border-med)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function SimulationEnd() {
  const { simulationEnded, endScore, resetSimulation } = useSimulatorStore();
  if (!simulationEnded || !endScore) return null;

  const grade = computeGrade(endScore.totalScore);
  const gradeColor =
    grade === 'A' ? 'text-[var(--signal)]' :
    grade === 'B' ? 'text-[var(--pulse)]' :
    grade === 'C' ? 'text-[var(--amber)]' :
    'text-[var(--ember)]';

  const endReasonText = endScore.endReason === 'timer'
    ? '⏱ Time ran out'
    : '🏁 Day 15 completed';

  return (
    <div className="fixed inset-0 bg-[var(--bg)] z-[60] flex items-center justify-center p-6">
      <div className="w-full max-w-lg flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-[.06em] mb-1">{endReasonText}</div>
          <div className="text-[28px] font-bold font-display text-[var(--text)]">Simulation Complete</div>
        </div>

        {/* Score ring + grade */}
        <div className="flex items-center justify-center gap-8">
          <ScoreRing score={endScore.totalScore} />
          <div className="text-center">
            <div className={`text-[72px] font-bold font-display leading-none ${gradeColor}`}>{grade}</div>
            <div className="text-[12px] text-[var(--text-muted)] mt-1">Grade</div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="flex gap-3">
          <ScoreCard
            label="📞 Calls"
            value={endScore.callsScore}
            max={40}
            color="text-[var(--signal)]"
            detail={`${endScore.callsCount} call${endScore.callsCount !== 1 ? 's' : ''} scheduled`}
          />
          <ScoreCard
            label="⚡ Speed"
            value={endScore.speedScore}
            max={20}
            color="text-[var(--pulse)]"
            detail={`${fmtTime(endScore.timeUsedSeconds)} used`}
          />
          <ScoreCard
            label="🎯 Intent"
            value={endScore.intentScore}
            max={40}
            color="text-[var(--amber)]"
            detail={`Avg score ${endScore.avgIntentScore}/10`}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { v: endScore.callsCount, l: 'Calls scheduled' },
            { v: `Day ${endScore.daysUsed}`, l: 'Days used' },
            { v: `${endScore.avgIntentScore}/10`, l: 'Avg lead score' },
          ].map((s) => (
            <div key={s.l} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-3">
              <div className="text-[18px] font-bold text-[var(--text)]">{s.v}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            onClick={resetSimulation}
            className="bg-[var(--pulse)] text-white text-[14px] font-semibold px-10 py-3 rounded-full hover:opacity-90 transition-opacity shadow-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
