'use client';
import { LeadClassification, LeadStatus } from '@/lib/types';

const classMap: Record<LeadClassification, string> = {
  Hot: 'bg-ember/15 text-ember border border-ember/30',
  Warm: 'bg-amber/15 text-amber border border-amber/30',
  Cold: 'bg-glacier/15 text-glacier border border-glacier/30',
};

export function ClassificationBadge({ c }: { c: LeadClassification }) {
  const emoji = c === 'Hot' ? '🔥' : c === 'Warm' ? '☀️' : '❄️';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${classMap[c]}`}>
      {emoji} {c}
    </span>
  );
}

export function ScoreBadge({ score, classification }: { score: number; classification: LeadClassification }) {
  const color = classification === 'Hot' ? '#FF5A36' : classification === 'Warm' ? '#FFB627' : '#3E7CB1';
  const pct = (score / 10) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-ink/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono text-xs font-bold" style={{ color }}>{score}/10</span>
    </div>
  );
}

const statusColors: Partial<Record<LeadStatus, string>> = {
  'New': 'bg-ink/10 text-ink/60',
  'Contacted': 'bg-signal/15 text-signal border border-signal/30',
  'Awaiting Reply': 'bg-amber/15 text-amber border border-amber/30',
  'Replied': 'bg-glacier/15 text-glacier border border-glacier/30',
  'Meeting Scheduled': 'bg-pulse/15 text-pulse border border-pulse/30',
  'Nurture': 'bg-ink/10 text-ink/50',
  'Closed Won': 'bg-signal/20 text-signal border border-signal/40 font-bold',
  'Closed Lost': 'bg-ember/10 text-ember/60',
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-mono ${statusColors[status] ?? 'bg-ink/10 text-ink/60'}`}>
      {status}
    </span>
  );
}
