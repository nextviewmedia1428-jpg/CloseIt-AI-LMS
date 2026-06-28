'use client';
import { useState, useRef, useEffect } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { ThreadMessage } from '@/lib/types';
import { ClassificationBadge, StartTypeBadge, ScoreBadge } from '@/components/ui/Badge';

function msgStyle(from: string) {
  if (from === 'Agent') return {
    align: 'self-end', cls: 'bg-[var(--pulse-soft)] border border-[var(--pulse-border)]',
    metaCls: 'text-[var(--pulse)]', label: '🤖 Agent',
  };
  if (from === 'User') return {
    align: 'self-end', cls: 'bg-[var(--signal-soft)] border border-[rgba(47,158,68,0.25)]',
    metaCls: 'text-[var(--signal)]', label: '👤 You',
  };
  // Lead's own message — left side
  return {
    align: 'self-start', cls: 'bg-[var(--surface)] border border-[var(--border-med)]',
    metaCls: 'text-[var(--text-secondary)]', label: `💬 ${from}`,
  };
}

function Message({ msg }: { msg: ThreadMessage }) {
  const { align, cls, metaCls, label } = msgStyle(msg.from);
  return (
    <div className={`max-w-[65%] rounded-xl p-[11px_14px] ${cls} ${align}`}>
      <div className={`flex justify-between gap-4 text-[10.5px] font-bold mb-1.5 ${metaCls}`}>
        <span>{label}</span>
        <span className="font-normal text-[var(--text-muted)] font-mono">Day {msg.day}</span>
      </div>
      <p className="text-[13px] leading-[1.55] text-[var(--text)]">{msg.body}</p>
    </div>
  );
}

export default function ThreadPanel() {
  const { leads, selectedLeadId, threads, day, addThreadMessage } = useSimulatorStore();
  const lead = leads.find((l) => l.lead_id === selectedLeadId);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages: ThreadMessage[] = threads[lead?.lead_id ?? ''] ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend() {
    if (!draft.trim() || !lead) return;
    addThreadMessage(lead.lead_id, {
      id: `msg_user_${lead.lead_id}_${Date.now()}`,
      day,
      from: 'User',
      body: draft.trim(),
      timestamp: new Date().toISOString(),
    });
    setDraft('');
  }

  if (!lead) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
        <span className="text-2xl">👈</span>
        <span className="text-[13px]">Select a lead to view their thread</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-[var(--border-soft)] bg-[var(--surface-2)] flex items-center gap-3">
        <div>
          <div className="text-[14.5px] font-bold text-[var(--text)]">{lead.name}</div>
          <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {lead.company} · {lead.industry}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(34,31,26,0.07)] text-[var(--text-secondary)]">
            {lead.email}
          </span>
          <StartTypeBadge type={lead.startType} />
          {lead.classification
            ? <ClassificationBadge c={lead.classification} />
            : null
          }
          {lead.final_score != null
            ? <ScoreBadge score={lead.final_score} />
            : null
          }
          {lead.callScheduled === 'Y' && lead.callDay && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--signal-soft)] text-[var(--signal)] border border-[rgba(47,158,68,0.25)]">
              📞 {lead.callDay}
            </span>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-[var(--bg)]">
        {messages.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)] italic">
            No messages yet — this is a cold start lead. Thread will populate as the workflow runs.
          </p>
        ) : (
          messages.map((m) => (
            <Message key={m.id} msg={m} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="flex-shrink-0 border-t border-[var(--border-soft)] bg-[var(--surface-2)] px-5 py-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={`Write a message to ${lead.name.split(' ')[0]}…`}
          className="w-full bg-[var(--surface)] border border-[var(--border-med)] rounded-xl px-3 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none h-14 outline-none font-sans"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[11px] text-[var(--text-muted)]">Enter to send · Shift+Enter for new line</span>
          <div className="flex gap-2">
            <button className="text-[12px] font-semibold px-3 py-1.5 rounded-[10px] bg-[var(--pulse-soft)] text-[var(--pulse)] border border-[var(--pulse-border)]">
              ✨ Generate AI Response
            </button>
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-[10px] bg-[var(--pulse)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
