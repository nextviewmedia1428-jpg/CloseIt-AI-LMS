'use client';
import { useSimulatorStore } from '@/store/simulatorStore';
import { Modal } from '@/components/ui/Modal';
import { Action } from '@/lib/types';

function DetailBody({ action }: { action: Action }) {
  const d = action.detail as Record<string, string | number | undefined>;
  return (
    <div className="space-y-3">
      {d.channel && (
        <div className="flex gap-2 text-sm">
          <span className="text-ink/40 font-mono w-20 shrink-0">Channel</span>
          <span className="font-semibold">{d.channel as string}</span>
        </div>
      )}
      {d.rep && (
        <div className="flex gap-2 text-sm">
          <span className="text-ink/40 font-mono w-20 shrink-0">Rep</span>
          <span className="font-semibold">{d.rep as string}</span>
        </div>
      )}
      {d.subject && (
        <div className="flex gap-2 text-sm">
          <span className="text-ink/40 font-mono w-20 shrink-0">Subject</span>
          <span className="font-semibold">{d.subject as string}</span>
        </div>
      )}
      {d.body && (
        <div className="bg-ink/5 rounded-xl p-3">
          <pre className="text-xs font-mono text-ink/80 whitespace-pre-wrap leading-relaxed">{d.body as string}</pre>
        </div>
      )}
      {d.message && (
        <div className="bg-ink/5 rounded-xl p-3">
          <p className="text-xs font-mono text-ink/80">{d.message as string}</p>
        </div>
      )}
      {d.score !== undefined && (
        <div className="bg-pulse/5 rounded-xl p-3 space-y-1">
          <p className="text-xs font-mono text-pulse font-bold">AI Score Breakdown</p>
          <p className="text-xs font-mono text-ink/70">{d.rationale as string}</p>
        </div>
      )}
      {d.notes && (
        <div className="bg-ink/5 rounded-xl p-3">
          <p className="text-xs font-mono text-ink/70 italic">{d.notes as string}</p>
        </div>
      )}
      {d.value && (
        <div className="flex gap-2 text-sm">
          <span className="text-ink/40 font-mono w-20 shrink-0">Deal value</span>
          <span className="font-bold text-signal">{d.value as string}</span>
        </div>
      )}
      {d.note && (
        <p className="text-xs font-mono text-ink/50 italic">{d.note as string}</p>
      )}
      {d.reason && (
        <p className="text-xs font-mono text-ink/50">{d.reason as string}</p>
      )}
    </div>
  );
}

export function ActionDetailModal() {
  const { showDetailAction, setDetailAction } = useSimulatorStore();
  if (!showDetailAction) return null;
  const a = showDetailAction;

  return (
    <Modal onClose={() => setDetailAction(null)}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-ink">{a.summary}</h3>
            <p className="text-xs font-mono text-ink/40 mt-0.5">
              Day {a.day} · {a.actor.toUpperCase()} · {a.leadName}
            </p>
          </div>
          <button onClick={() => setDetailAction(null)} className="text-ink/30 hover:text-ink text-xl leading-none">✕</button>
        </div>
        <DetailBody action={a} />
        <div className="mt-5 pt-4 border-t border-ink/10">
          <p className="text-xs font-mono text-ink/30">Action ID: {a.id}</p>
          <p className="text-xs font-mono text-ink/30">Logged: {a.timestamp}</p>
        </div>
      </div>
    </Modal>
  );
}
