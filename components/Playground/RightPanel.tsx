'use client';
import { useState } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

// ── helpers ────────────────────────────────────────────────────────────────

function useLastDayCategories() {
  const { day, leads, threads, scheduledCalls, userMessages } = useSimulatorStore();
  const lastDay = day - 1;

  // build name lookup
  const nameOf: Record<string, string> = {};
  leads.forEach((l) => { nameOf[l.lead_id] = l.name; });

  const followUpsSent: { lead_id: string; lead_name: string }[] = [];
  const queriesResolved: { lead_id: string; lead_name: string }[] = [];

  if (lastDay >= 0) {
    Object.entries(threads).forEach(([lead_id, msgs]) => {
      const dayMsgs = msgs.filter((m) => m.day === lastDay);
      const hasLeadMsg = dayMsgs.some((m) => m.from !== 'Agent' && m.from !== 'User');
      const hasAgentMsg = dayMsgs.some(
        (m) => m.from === 'Agent' && !m.body.startsWith('Great news! Your call')
      );
      // query resolved takes priority: lead messaged AND agent replied same day
      if (hasLeadMsg && hasAgentMsg) {
        queriesResolved.push({ lead_id, lead_name: nameOf[lead_id] ?? lead_id });
      } else if (hasAgentMsg) {
        // pure follow-up: agent sent a message but lead didn't message that day
        followUpsSent.push({ lead_id, lead_name: nameOf[lead_id] ?? lead_id });
      }
    });
  }

  const callsScheduled = lastDay >= 0
    ? scheduledCalls.filter((c) => c.scheduledOnDay === lastDay)
    : [];

  const callConfirmations = lastDay >= 0
    ? userMessages.filter((m) => m.message.startsWith('📞'))
    : userMessages.filter((m) => m.message.startsWith('📞'));

  const bossMessages = userMessages.filter((m) => !m.message.startsWith('📞'));

  return { lastDay, followUpsSent, queriesResolved, callsScheduled, callConfirmations, bossMessages };
}

// ── collapsible category row ───────────────────────────────────────────────

function Category({
  label, count, color, items, onLeadClick,
}: {
  label: string;
  count: number;
  color: string;
  items: { lead_id: string; lead_name: string }[];
  onLeadClick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <div className="border-b border-[var(--border-soft)] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-3)] transition-colors text-left"
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />
        <span className="text-[12px] text-[var(--text)] flex-1">{label}</span>
        <span className="text-[10px] font-bold text-[var(--text-muted)] font-mono">{count}</span>
        <span className="text-[10px] text-[var(--text-muted)] ml-0.5">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="pb-1">
          {items.map((item) => (
            <button
              key={item.lead_id}
              onClick={() => onLeadClick(item.lead_id)}
              className="w-full text-left px-5 py-1.5 text-[11.5px] text-[var(--pulse)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors truncate"
            >
              → {item.lead_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── manual action groups (CloseIt OFF) ────────────────────────────────────

function useManualActionGroups() {
  const { day, leads, threads, scheduledCalls } = useSimulatorStore();

  const coldOutreach: { lead_id: string; lead_name: string }[] = [];
  const followUp: { lead_id: string; lead_name: string }[] = [];
  const replyToQuery: { lead_id: string; lead_name: string }[] = [];
  const confirmCall: { lead_id: string; lead_name: string }[] = [];

  leads.forEach((lead) => {
    const thread = threads[lead.lead_id] ?? [];
    const callScheduled = scheduledCalls.some(
      (c) => c.lead_id === lead.lead_id && !c.completed
    );

    if (thread.length === 0) {
      coldOutreach.push({ lead_id: lead.lead_id, lead_name: lead.name });
      return;
    }

    const last = thread[thread.length - 1];
    const lastFrom = last.from === 'Agent' ? 'agent'
      : last.from === 'User' ? 'user'
      : 'lead';
    const daysSinceLast = last.day != null ? day - last.day : 999;

    if (lastFrom === 'lead') {
      if (callScheduled) {
        confirmCall.push({ lead_id: lead.lead_id, lead_name: lead.name });
      } else {
        replyToQuery.push({ lead_id: lead.lead_id, lead_name: lead.name });
      }
    } else if ((lastFrom === 'agent' || lastFrom === 'user') && daysSinceLast >= 2 && !callScheduled) {
      // check if any agent messages exist (not cold)
      const hasAnyAgentMsg = thread.some((m) => m.from === 'Agent' || m.from === 'User');
      if (hasAnyAgentMsg) {
        followUp.push({ lead_id: lead.lead_id, lead_name: lead.name });
      } else {
        coldOutreach.push({ lead_id: lead.lead_id, lead_name: lead.name });
      }
    }
  });

  return { coldOutreach, followUp, replyToQuery, confirmCall };
}

// ── action required panel ──────────────────────────────────────────────────

function ActionRequiredPanel() {
  const { closeItEnabled, userMessages, setSelectedLead } = useSimulatorStore();
  const manual = useManualActionGroups();

  if (!closeItEnabled) {
    const total = manual.coldOutreach.length + manual.followUp.length +
      manual.replyToQuery.length + manual.confirmCall.length;
    return (
      <div className="flex-1 overflow-y-auto min-h-0">
        {total === 0 ? (
          <p className="text-[11px] text-[var(--text-muted)] italic px-3 py-2">
            All leads are up to date.
          </p>
        ) : (
          <>
            <Category
              label="Send cold outreach"
              count={manual.coldOutreach.length}
              color="bg-[var(--glacier)]"
              items={manual.coldOutreach}
              onLeadClick={setSelectedLead}
            />
            <Category
              label="Follow up with lead"
              count={manual.followUp.length}
              color="bg-[var(--amber)]"
              items={manual.followUp}
              onLeadClick={setSelectedLead}
            />
            <Category
              label="Reply to lead's query"
              count={manual.replyToQuery.length}
              color="bg-[var(--pulse)]"
              items={manual.replyToQuery}
              onLeadClick={setSelectedLead}
            />
            <Category
              label="Confirm call with lead"
              count={manual.confirmCall.length}
              color="bg-[var(--signal)]"
              items={manual.confirmCall}
              onLeadClick={setSelectedLead}
            />
          </>
        )}
      </div>
    );
  }

  const bossMessages = userMessages.filter((m) => !m.message.startsWith('📞'));
  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2 min-h-0">
      {bossMessages.length === 0 ? (
        <p className="text-[11px] text-[var(--text-muted)] italic px-2 py-1">
          No messages yet.
        </p>
      ) : (
        bossMessages.map((m, i) => (
          <button
            key={i}
            onClick={() => setSelectedLead(m.lead_id)}
            className="w-full text-left px-2.5 py-2.5 rounded-[10px] bg-[var(--amber-soft)] border border-[var(--amber-border)] hover:opacity-80 transition-opacity"
          >
            <div className="text-[10.5px] font-bold text-[#7A5500] mb-1">Re: {m.lead_name}</div>
            <p className="text-[12px] leading-[1.5] text-[var(--text)]">{m.message}</p>
          </button>
        ))
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────

export default function RightPanel() {
  const { closeItEnabled, leads, threads, scheduledCalls, userMessages, setSelectedLead } = useSimulatorStore();
  const { lastDay, followUpsSent, queriesResolved, callsScheduled, callConfirmations, bossMessages } = useLastDayCategories();
  const manual = useManualActionGroups();

  const hot = leads.filter((l) => l.classification === 'Hot').length;
  const warm = leads.filter((l) => l.classification === 'Warm').length;
  const cold = leads.filter((l) => l.classification === 'Cold').length;

  const totalAgentActions = Object.values(threads).reduce(
    (sum, msgs) => sum + msgs.filter((m) => m.from === 'Agent').length,
    0
  );
  const totalUserActions = Object.values(threads).reduce(
    (sum, msgs) => sum + msgs.filter((m) => m.from === 'User').length,
    0
  );

  const pendingActionCount = closeItEnabled
    ? bossMessages.length
    : manual.coldOutreach.length + manual.followUp.length + manual.replyToQuery.length + manual.confirmCall.length;

  return (
    <div className="w-[272px] flex-shrink-0 border-l border-[var(--border-soft)] bg-[var(--surface-2)] flex flex-col min-h-0">

      {/* Agent Actions */}
      <div className="flex flex-col min-h-0" style={{ flex: '1 1 0' }}>
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-[11px] border-b border-[var(--border-soft)]">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[.05em]">Agent Actions</span>
          <span className="text-[10px] text-[var(--text-muted)] ml-auto">Day {lastDay >= 0 ? lastDay : '—'}</span>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {lastDay < 0 ? (
            <p className="text-[11px] text-[var(--text-muted)] italic px-3 py-2">Click Next Day to run automation.</p>
          ) : (
            <>
              <Category
                label="Follow-ups sent"
                count={followUpsSent.length}
                color="bg-[var(--signal)]"
                items={followUpsSent}
                onLeadClick={setSelectedLead}
              />
              <Category
                label="Queries resolved"
                count={queriesResolved.length}
                color="bg-[var(--pulse)]"
                items={queriesResolved}
                onLeadClick={setSelectedLead}
              />
              <Category
                label="Calls scheduled"
                count={callsScheduled.length}
                color="bg-[var(--amber)]"
                items={callsScheduled.map((c) => ({ lead_id: c.lead_id, lead_name: c.lead_name }))}
                onLeadClick={setSelectedLead}
              />
              <Category
                label="Call confirmations sent"
                count={callConfirmations.length}
                color="bg-[var(--ember)]"
                items={callConfirmations.map((m) => ({ lead_id: m.lead_id, lead_name: m.lead_name }))}
                onLeadClick={setSelectedLead}
              />
              {followUpsSent.length === 0 && queriesResolved.length === 0 &&
               callsScheduled.length === 0 && callConfirmations.length === 0 && (
                <p className="text-[11px] text-[var(--text-muted)] italic px-3 py-2">No agent actions on Day {lastDay}.</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Required */}
      <div className="flex flex-col min-h-0 border-t border-[var(--border-soft)]" style={{ flex: '1 1 0' }}>
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-[11px] border-b border-[var(--border-soft)]">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[.05em]">📬 Action Required</span>
          {pendingActionCount > 0 && (
            <span className="ml-auto text-[10px] font-bold text-[#7A5500]">{pendingActionCount} pending</span>
          )}
        </div>
        <ActionRequiredPanel />
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 border-t border-[var(--border-soft)] p-4">
        <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[.05em] mb-2">This session</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { v: leads.length,        l: 'total leads',      color: '' },
            { v: hot,                 l: '🔥 hot',           color: 'text-[var(--ember)]' },
            { v: warm,                l: '🌤 warm',          color: 'text-[#7A5500]' },
            { v: cold,                l: '❄️ cold',          color: 'text-[var(--glacier)]' },
            { v: scheduledCalls.length, l: '📞 calls sched.', color: 'text-[var(--signal)]' },
            closeItEnabled
              ? { v: totalAgentActions, l: '🤖 agent actions', color: 'text-[var(--pulse)]' }
              : { v: totalUserActions,  l: '👤 user actions',  color: 'text-[var(--glacier)]' },
          ].map((s) => (
            <div key={s.l} className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] px-2.5 py-2">
              <div className={`text-[18px] font-bold leading-none ${s.color || 'text-[var(--text)]'}`}>{s.v}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
