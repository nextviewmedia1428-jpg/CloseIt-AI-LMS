'use client';
import { useSimulatorStore } from '@/store/simulatorStore';
import { Action, ActionType, ActionActor } from '@/lib/types';

const actorColor: Record<ActionActor, string> = {
  system: 'text-signal',
  ai: 'text-pulse',
  team: 'text-glacier',
  customer: 'text-amber',
};

const actorLabel: Record<ActionActor, string> = {
  system: 'System',
  ai: 'AI',
  team: 'Team',
  customer: 'Lead',
};

const typeIcon: Partial<Record<ActionType, string>> = {
  email_sent: '✉️',
  slack_alert: '🔔',
  score_update: '🎯',
  reply_received: '💬',
  meeting_scheduled: '📅',
  rep_assigned: '👤',
  proposal_sent: '📄',
  call_logged: '📞',
  closed_won: '🎉',
  closed_lost: '❌',
  moved_to_nurture: '🌱',
  chat_summary_ready: '🤖',
  error: '⚠️',
};

function ActionRow({ action, isMeetingNudge }: { action: Action; isMeetingNudge?: boolean }) {
  const { setDetailAction, setSelectedLead } = useSimulatorStore();
  return (
    <div
      className="group flex items-start gap-3 px-4 py-3 hover:bg-ink/3 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-ink/8"
      onClick={() => setDetailAction(action)}
    >
      <span className="text-base mt-0.5 shrink-0">{typeIcon[action.type] ?? '•'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink leading-snug">{action.summary}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-mono font-semibold ${actorColor[action.actor]}`}>
            {actorLabel[action.actor]}
          </span>
          <span className="text-ink/30 text-xs">·</span>
          <span className="text-xs font-mono text-ink/40">Day {action.day}</span>
        </div>
        {isMeetingNudge && (
          <button
            className="mt-1.5 text-xs text-pulse underline underline-offset-2 hover:text-pulse/70"
            onClick={e => { e.stopPropagation(); setSelectedLead(action.leadId); }}
          >
            Ask the Sales Agent to prep a brief →
          </button>
        )}
      </div>
    </div>
  );
}

export function ActionFeed() {
  const { allActions, day } = useSimulatorStore();
  const actions = allActions();

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-ink/40 text-sm">No actions yet.</p>
        <p className="text-ink/30 text-xs mt-1">Register 3+ leads then click "Next Day".</p>
      </div>
    );
  }

  // Group by day
  const byDay: Record<number, Action[]> = {};
  for (const a of actions) {
    byDay[a.day] = byDay[a.day] ?? [];
    byDay[a.day].push(a);
  }
  const days = Object.keys(byDay).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      {days.map(d => (
        <div key={d}>
          <div className="text-xs font-mono font-bold text-ink/40 uppercase tracking-widest px-4 mb-1">
            Day {d} {d === day - 1 ? '— latest' : ''}
          </div>
          {byDay[d].map(a => (
            <ActionRow
              key={a.id}
              action={a}
              isMeetingNudge={a.type === 'meeting_scheduled'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
