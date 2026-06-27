import { LeadStatus } from '@/lib/types';
import { scoreLabel } from '@/lib/scoring';

export function ScoreBadge({ score }: { score: number }) {
  const label = scoreLabel(score);
  const styles: Record<string, string> = {
    Hot:      'bg-ember/15 text-red-800',
    Warm:     'bg-amber/15 text-yellow-800',
    Cool:     'bg-glacier/15 text-blue-800',
    Critical: 'bg-ember/20 text-ember border border-ember/30',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${styles[label]}`}>
      {score}/10 {label}
    </span>
  );
}

export function StatusPill({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    'New':               'bg-ink/7 text-ink/50',
    'Contacted':         'bg-glacier/10 text-glacier',
    'Awaiting Reply':    'bg-amber/10 text-amber-700',
    'Replied':           'bg-signal/10 text-signal',
    'Discovery Booked':  'bg-signal/15 text-signal',
    'Nurture':           'bg-pulse/10 text-pulse',
    'Closed Won':        'bg-signal/20 text-signal',
    'Closed Lost':       'bg-ember/10 text-ember',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${styles[status] ?? ''}`}>
      {status}
    </span>
  );
}
