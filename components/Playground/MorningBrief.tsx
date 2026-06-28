'use client';
import { useSimulatorStore } from '@/store/simulatorStore';

function Section({ title }: { title: string }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[.06em] text-[var(--text-muted)] mt-4 mb-1.5 first:mt-0">
      {title}
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[10px] px-3 py-2 flex flex-col">
      <div className={`text-[22px] font-bold leading-none ${color ?? 'text-[var(--text)]'}`}>{value}</div>
      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</div>
    </div>
  );
}

function LeadList({ items }: { items: { lead_id: string; lead_name: string }[] }) {
  const setSelectedLead = useSimulatorStore((s) => s.setSelectedLead);
  const setMorningBrief = useSimulatorStore((s) => s.setMorningBrief);
  if (items.length === 0) return <p className="text-[11px] text-[var(--text-muted)] italic">None</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.lead_id}
          onClick={() => { setSelectedLead(item.lead_id); setMorningBrief(null); }}
          className="text-[11.5px] text-[var(--pulse)] bg-[var(--pulse-soft)] border border-[var(--pulse-border)] px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
        >
          {item.lead_name}
        </button>
      ))}
    </div>
  );
}

export default function MorningBrief() {
  const { morningBrief, setMorningBrief, setMeetingModalDay } = useSimulatorStore();
  if (!morningBrief) return null;
  const d = morningBrief;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div
        className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[var(--border-soft)]">
          <div className="text-[10.5px] text-[var(--text-muted)] uppercase tracking-[.06em] mb-0.5">
            Starting Day {d.newDay}
          </div>
          <div className="text-[18px] font-bold text-[var(--text)] font-display">☀️ Morning Brief</div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Lead snapshot */}
          <Section title="Lead Snapshot" />
          <div className="grid grid-cols-3 gap-2 mb-1">
            <Stat value={d.totalLeads} label="total leads" />
            <Stat value={d.newLeadsCount} label={`new yesterday`} />
            <Stat value={0} label="placeholder" color="text-transparent" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat value={d.hot}  label="🔥 hot"  color="text-[var(--ember)]" />
            <Stat value={d.warm} label="🌤 warm" color="text-[#7A5500]" />
            <Stat value={d.cold} label="❄️ cold" color="text-[var(--glacier)]" />
          </div>

          {/* Agent actions yesterday */}
          <Section title={`Agent Actions · Day ${d.processedDay}`} />
          <div className="flex flex-col gap-2.5">
            <div>
              <div className="text-[11px] font-semibold text-[var(--signal)] mb-1">
                ✉️ Follow-ups sent ({d.followUpsSent.length})
              </div>
              <LeadList items={d.followUpsSent} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[var(--pulse)] mb-1">
                ✅ Queries resolved ({d.queriesResolved.length})
              </div>
              <LeadList items={d.queriesResolved} />
            </div>
            {d.callsScheduledYesterday.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-[var(--amber)] mb-1">
                  📞 Calls scheduled ({d.callsScheduledYesterday.length})
                </div>
                <LeadList items={d.callsScheduledYesterday.map((c) => ({ lead_id: c.lead_id, lead_name: c.lead_name }))} />
              </div>
            )}
          </div>

          {/* Meetings today */}
          {d.meetingsToday.length > 0 && (
            <>
              <Section title={`Meetings Today · Day ${d.newDay}`} />
              <div className="flex flex-col gap-1.5">
                {d.meetingsToday.map((c) => (
                  <button
                    key={c.lead_id}
                    onClick={() => { setMeetingModalDay(d.newDay); setMorningBrief(null); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--ember-soft)] border border-[var(--ember-border)] text-left hover:opacity-80 transition-opacity"
                  >
                    <span className="text-[13px]">📞</span>
                    <div>
                      <div className="text-[12px] font-semibold text-[var(--text)]">{c.lead_name}</div>
                      <div className="text-[10.5px] text-[var(--text-muted)]">{c.company} · {c.callDayLabel}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Reminders */}
          {d.reminders.length > 0 && (
            <>
              <Section title="Important Reminders" />
              <div className="flex flex-col gap-1.5">
                {d.reminders.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[var(--amber-soft)] border border-[var(--amber-border)]">
                    <span className="text-[12px] mt-0.5">⚠️</span>
                    <p className="text-[12px] text-[var(--text)] leading-snug">{r}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border-soft)] flex justify-end">
          <button
            onClick={() => setMorningBrief(null)}
            className="bg-[var(--pulse)] text-white text-[13px] font-semibold px-8 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Start Day {d.newDay} →
          </button>
        </div>
      </div>
    </div>
  );
}
