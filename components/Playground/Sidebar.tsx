'use client';
import { useSimulatorStore } from '@/store/simulatorStore';
import { Lead } from '@/lib/types';
import { ClassificationBadge, ScoreBadge } from '@/components/ui/Badge';

function LeadCard({ lead, active }: { lead: Lead; active: boolean }) {
  const { setSelectedLead, threads, scheduledCalls } = useSimulatorStore();

  const lastMsg = threads[lead.lead_id]?.slice(-1)[0];
  const callCompleted = scheduledCalls.some((c) => c.lead_id === lead.lead_id && c.completed);
  const needsReply = callCompleted && lastMsg && lastMsg.from !== 'Agent' && lastMsg.from !== 'User';

  const borderColor =
    lead.classification === 'Hot' ? 'border-l-[var(--ember)] border-[var(--ember-border)] bg-[var(--ember-soft)]' :
    lead.classification === 'Warm' ? 'border-l-[var(--amber)] border-[var(--amber-border)] bg-[var(--amber-soft)]' :
    lead.classification === 'Cold' ? 'border-l-[var(--glacier)] border-[rgba(62,124,177,0.2)] bg-[var(--glacier-soft)]' :
    'border-l-transparent border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-med)]';

  return (
    <div
      onClick={() => setSelectedLead(lead.lead_id)}
      className={`
        relative rounded-xl p-[11px_12px] cursor-pointer border-l-[3px] border transition-all
        ${active
          ? 'border-[var(--pulse-border)] border-l-[var(--pulse)] bg-[var(--pulse-soft)]'
          : borderColor
        }
      `}
    >
      {needsReply && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--ember)] text-white text-[9px] font-bold flex items-center justify-center leading-none">!</span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[var(--text)] truncate">{lead.name}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{lead.company}</div>
        </div>
        {lead.final_score != null
          ? <ScoreBadge score={lead.final_score} />
          : <span className="text-[10px] font-mono text-[var(--text-muted)]">—</span>
        }
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {lead.classification ? <ClassificationBadge c={lead.classification} /> : null}
        <span className="text-[10px] text-[var(--text-muted)]">{lead.industry}</span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { leads, selectedLeadId } = useSimulatorStore();
  return (
    <div className="w-[248px] flex-shrink-0 border-r border-[var(--border-soft)] bg-[var(--surface-2)] flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-soft)] flex-shrink-0">
        <h2 className="text-[13px] font-bold text-[var(--text)]">Leads</h2>
        <span className="bg-[var(--pulse-soft)] text-[var(--pulse)] text-[11px] font-bold px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
        {leads.length === 0 ? (
          <p className="text-[11px] text-[var(--text-muted)] italic px-2 py-3">
            No leads yet. Click Next Day to generate.
          </p>
        ) : (
          leads.map((l) => (
            <LeadCard key={l.lead_id} lead={l} active={l.lead_id === selectedLeadId} />
          ))
        )}
      </div>
    </div>
  );
}
