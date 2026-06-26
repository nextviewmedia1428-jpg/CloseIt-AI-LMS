'use client';
import { useSimulatorStore } from '@/store/simulatorStore';
import { ClassificationBadge, ScoreBadge, StatusBadge } from '@/components/ui/Badge';

export function LeadList() {
  const { leads, selectedLeadId, setSelectedLead } = useSimulatorStore();

  if (leads.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-display font-semibold text-sm text-ink/70 uppercase tracking-widest">Leads</h3>
      {leads.map(lead => (
        <div
          key={lead.id}
          onClick={() => setSelectedLead(selectedLeadId === lead.id ? null : lead.id)}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            selectedLeadId === lead.id
              ? 'border-pulse/40 bg-pulse/5'
              : 'border-ink/10 bg-paper hover:border-ink/20'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{lead.name}</p>
              <p className="text-xs font-mono text-ink/40 truncate">{lead.company || lead.email}</p>
            </div>
            <ClassificationBadge c={lead.classification} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <ScoreBadge score={lead.score} classification={lead.classification} />
            <StatusBadge status={lead.status} />
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-mono text-ink/40">Rep: {lead.assignedRep}</span>
            <span className="text-ink/20">·</span>
            <span className="text-xs font-mono text-ink/40">${lead.formInputs.budget} · {lead.formInputs.timelineDays}d</span>
          </div>
        </div>
      ))}
    </div>
  );
}
