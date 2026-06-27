'use client';
import { useSimulatorStore } from '@/store/simulatorStore';
import { Lead } from '@/lib/types';
import { isCritical, scoreLabel } from '@/lib/scoring';
import { ScoreBadge, StatusPill } from '@/components/ui/Badge';
import { useState, useRef, useEffect } from 'react';
import { generateMoMAnalysis } from '@/lib/demoScript';

// ─── Navbar ──────────────────────────────────────────────────────────────────

function NavBar() {
  const { day, nextDay, closeItEnabled, toggleCloseIt, unreadCount, markNotificationsRead, notifications, isAdvancing } = useSimulatorStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = unreadCount();

  return (
    <nav className="h-[54px] flex items-center justify-between px-6 bg-surface-2 border-b border-ink/6 shrink-0 relative z-10">
      <div className="font-display font-bold text-base tracking-tight">
        Close<span className="text-pulse">It</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Day counter + Next Day */}
        <div className="flex items-center gap-3 pr-3 border-r border-ink/10">
          <div className="text-right">
            <div className="text-[10px] font-mono text-ink/40 uppercase tracking-wider">Current</div>
            <div className="text-[18px] font-display font-bold leading-none">{day === 0 ? 'Day 0' : `Day ${day}`}</div>
          </div>
          <button
            onClick={() => useSimulatorStore.getState().nextDay()}
            disabled={isAdvancing}
            className="bg-pulse text-paper text-xs font-semibold px-4 py-2 rounded-full disabled:opacity-50 hover:bg-pulse/80 transition-colors"
          >
            {isAdvancing ? 'Advancing…' : 'Next Day →'}
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(o => !o); if (!notifOpen) markNotificationsRead(); }}
            className="relative w-9 h-9 flex items-center justify-center bg-ink/5 border border-ink/10 rounded-xl text-ink/60 hover:bg-ink/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-ember text-paper text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-paper">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-paper border border-ink/10 rounded-2xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-ink/6 text-xs font-bold text-ink/40 uppercase tracking-wider">Notifications</div>
              {notifications.length === 0
                ? <div className="px-4 py-4 text-xs text-ink/30">No notifications yet.</div>
                : <div className="max-h-64 overflow-y-auto">
                    {[...notifications].reverse().map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-ink/5 last:border-0">
                        <p className="text-xs text-ink leading-snug">{n.message}</p>
                        <span className="text-[10px] font-mono text-ink/30 mt-1 block">Day {n.day}</span>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
        </div>

        {/* CloseIt toggle */}
        <button
          onClick={toggleCloseIt}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border transition-colors ${
            closeItEnabled
              ? 'bg-signal/10 border-signal/25 text-signal'
              : 'bg-ink/5 border-ink/15 text-ink/50'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${closeItEnabled ? 'bg-signal' : 'bg-ink/30'}`} />
          CloseIt: {closeItEnabled ? 'On' : 'Off'}
        </button>
      </div>
    </nav>
  );
}

// ─── Lead Sidebar ─────────────────────────────────────────────────────────────

function LeadCard({ lead, active }: { lead: Lead; active: boolean }) {
  const selectLead = useSimulatorStore(s => s.selectLead);
  const critical = isCritical(lead.score);

  return (
    <div
      onClick={() => selectLead(lead.id)}
      className={`rounded-xl p-3 cursor-pointer border-l-[3px] transition-colors ${
        active
          ? 'bg-pulse/8 border-l-pulse border border-pulse/20'
          : critical
          ? 'bg-ember/6 border-l-ember border border-ember/15 hover:bg-ember/10'
          : 'bg-paper border-l-transparent border border-ink/8 hover:bg-ink/3'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink truncate">{lead.name}</div>
          <div className="text-[11px] text-ink/40 truncate">{lead.company}</div>
        </div>
        <ScoreBadge score={lead.score} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <StatusPill status={lead.status} />
      </div>
      {critical && (
        <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-ember">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Needs attention
        </div>
      )}
      <div className="text-[10px] font-mono text-ink/30 mt-1">Day {lead.registeredOnDay}</div>
    </div>
  );
}

function LeadSidebar() {
  const { leads, selectedLeadId, day } = useSimulatorStore();
  const upcoming = useSimulatorStore(s => s.leadSchedule[day + 1]?.length ?? 0);

  return (
    <aside className="w-[248px] shrink-0 border-r border-ink/6 bg-surface-2 flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-ink/6 shrink-0">
        <h2 className="text-[13px] font-bold text-ink">Leads</h2>
        <span className="bg-pulse/10 text-pulse text-[11px] font-bold px-2 py-0.5 rounded-full">{leads.length}</span>
        {upcoming > 0 && (
          <span className="ml-auto text-[10px] text-ink/40 font-mono">+{upcoming} tomorrow</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {leads.length === 0
          ? <div className="text-center py-8 text-xs text-ink/30">Leads will arrive as days advance.</div>
          : leads.map(l => <LeadCard key={l.id} lead={l} active={l.id === selectedLeadId} />)
        }
      </div>
    </aside>
  );
}

// ─── Thread Panel ─────────────────────────────────────────────────────────────

function ThreadMsg({ msg }: { msg: { from: string; body: string; day: number } }) {
  const from = msg.from;
  const bubbleClass =
    from === 'agent' ? 'self-start bg-pulse/8 border border-pulse/20'
    : from === 'lead' ? 'self-end bg-paper border border-ink/12'
    : 'self-start bg-glacier/8 border border-glacier/20';
  const metaColor = from === 'agent' ? 'text-pulse' : from === 'lead' ? 'text-ink/50' : 'text-glacier';
  const label = from === 'agent' ? '🤖 CloseIt Agent' : from === 'lead' ? '💬 Lead' : '👤 You';

  return (
    <div className={`max-w-[65%] rounded-xl px-4 py-3 ${bubbleClass}`}>
      <div className={`flex justify-between items-center text-[10.5px] font-bold mb-1.5 ${metaColor}`}>
        <span>{label}</span>
        <span className="font-mono font-normal text-ink/30 ml-3">Day {msg.day}</span>
      </div>
      <p className="text-[13px] leading-relaxed text-ink whitespace-pre-wrap">{msg.body}</p>
    </div>
  );
}

function ThreadPanel() {
  const { selectedLeadId, leads, threadForLead, userSendMessage, openMomPanel, tasks, closeItEnabled } = useSimulatorStore();
  const lead = leads.find(l => l.id === selectedLeadId);
  const thread = selectedLeadId ? threadForLead(selectedLeadId) : [];
  const [compose, setCompose] = useState('');
  const [drafting, setDrafting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingTask = tasks.find(t => t.leadId === selectedLeadId && t.status === 'pending');

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.length]);

  if (!lead) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
        <div className="text-4xl">💬</div>
        <p className="text-sm text-ink/40">Select a lead to open their thread.</p>
      </div>
    );
  }

  const startBadgeClass = lead.startType === 'cold'
    ? 'bg-glacier/10 text-glacier'
    : 'bg-signal/10 text-signal';

  const generateDraft = async () => {
    setDrafting(true);
    const lastLeadMsg = [...thread].reverse().find(m => m.from === 'lead');
    const res = await fetch('/api/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadName: lead.name,
        thread: thread.map(m => `[${m.from.toUpperCase()}] ${m.body}`).join('\n\n'),
        question: 'Draft a natural, concise reply from the sales person. Reply only with the email body, no subject line.',
      }),
    });
    const { answer } = await res.json();
    setCompose(answer);
    setDrafting(false);
  };

  const send = () => {
    if (!compose.trim()) return;
    userSendMessage(lead.id, compose.trim());
    setCompose('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Thread header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-ink/6 bg-surface-2">
        <div className="min-w-0">
          <div className="text-[14.5px] font-bold text-ink">{lead.name}</div>
          <div className="text-[11px] text-ink/40">{lead.company} · {lead.industry}</div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${startBadgeClass}`}>
          {lead.startType === 'cold' ? 'Cold start' : 'Warm start'}
        </span>
        <StatusPill status={lead.status} />
        {!closeItEnabled && (
          <span className="ml-auto text-[10px] bg-amber/10 text-amber-700 font-semibold px-2 py-1 rounded-full border border-amber/20">
            Manual mode
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3 bg-paper">
        {thread.length === 0
          ? <div className="text-center py-8 text-xs text-ink/30 font-mono">No messages yet. Advance to Day {lead.registeredOnDay + 1} to see the first contact.</div>
          : thread.map((m, i) => <ThreadMsg key={i} msg={m} />)
        }
        <div ref={bottomRef} />
      </div>

      {/* Locked overlay when discovery task pending */}
      {pendingTask && (
        <div className="shrink-0 flex items-center gap-4 px-6 py-4 bg-amber/5 border-t border-amber/20">
          <div className="w-10 h-10 rounded-xl bg-amber/15 border border-amber/25 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB627" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="2"/>
              <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-ink">Discovery call task pending</p>
            <span className="text-[11px] text-ink/50">Complete the MoM before composing further messages</span>
          </div>
          <button
            onClick={() => openMomPanel(lead.id)}
            className="bg-amber text-[#5A3800] text-[12px] font-bold px-4 py-2 rounded-xl hover:bg-amber/80 transition-colors"
          >
            Enter MoM →
          </button>
        </div>
      )}

      {/* Compose */}
      {!pendingTask && (
        <div className="shrink-0 border-t border-ink/6 bg-surface-2 px-6 pt-3 pb-4">
          <textarea
            value={compose}
            onChange={e => setCompose(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) send(); }}
            placeholder={`Write a message to ${lead.name.split(' ')[0]}…`}
            rows={3}
            className="w-full bg-paper border border-ink/10 rounded-xl px-4 py-3 text-[13px] font-mono resize-none focus:outline-none focus:border-pulse placeholder:text-ink/25"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-ink/30">⌘ + Enter to send</span>
            <div className="flex gap-2">
              <button
                onClick={generateDraft}
                disabled={drafting}
                className="bg-pulse/10 text-pulse border border-pulse/25 text-[12px] font-semibold px-3 py-2 rounded-xl hover:bg-pulse/15 transition-colors disabled:opacity-50"
              >
                {drafting ? 'Generating…' : '✨ Generate AI Response'}
              </button>
              <button
                onClick={send}
                disabled={!compose.trim()}
                className="bg-pulse text-paper text-[12px] font-semibold px-4 py-2 rounded-xl hover:bg-pulse/80 transition-colors disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Right panel — Agent Actions + Tasks + Stats ───────────────────────────

function AgentActionsPanel() {
  const { todayActions, day, tasks, leads, openMomPanel } = useSimulatorStore();
  const actions = todayActions();
  const todayOnlyActions = actions.filter(a => a.type === 'initial_email_sent' || a.type === 'discovery_call_booked');
  const pendingTask = tasks.find(t => t.status === 'pending');

  const closedWon = leads.filter(l => l.status === 'Closed Won').length;
  const closedLost = leads.filter(l => l.status === 'Closed Lost').length;
  const nurture = leads.filter(l => l.status === 'Nurture').length;
  const booked = leads.filter(l => l.status === 'Discovery Booked').length;

  const dotColor = (type: string) =>
    type === 'initial_email_sent' ? 'bg-signal' : 'bg-pulse';

  return (
    <aside className="w-[272px] shrink-0 border-l border-ink/6 bg-surface-2 flex flex-col min-h-0">

      {/* Agent actions — today only */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-ink/6">
        <span className="text-[11px] font-bold text-ink/40 uppercase tracking-wider">Agent actions — Day {day}</span>
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-signal" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {todayOnlyActions.length === 0
          ? <div className="text-[11px] text-ink/30 italic px-4 py-3">No agent actions today.</div>
          : todayOnlyActions.map(a => (
            <div key={a.id} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-ink/3 transition-colors">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColor(a.type)}`} />
              <div>
                <p className="text-[12px] text-ink leading-snug">{a.summary}</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Open task */}
      {pendingTask && (
        <div className="shrink-0 border-t border-ink/6">
          <div className="px-4 py-3 text-[11px] font-bold text-ink/40 uppercase tracking-wider flex items-center justify-between">
            Open tasks
            <span className="text-ember font-mono text-[10px] normal-case">1 pending</span>
          </div>
          <div className="mx-3 mb-3 bg-paper border border-amber/35 rounded-xl p-3 shadow-[0_0_0_3px_rgba(255,182,39,0.08)]">
            <div className="text-[13px] font-bold text-ink mb-1">{pendingTask.leadName}</div>
            <div className="text-[11px] text-ink/50 mb-2 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>
              </svg>
              Discovery call · Day {pendingTask.callDay}
            </div>
            <button
              onClick={() => openMomPanel(pendingTask.leadId)}
              className="w-full bg-amber text-[#5A3800] font-bold text-[12px] py-2 rounded-xl hover:bg-amber/80 transition-colors"
            >
              Complete & Enter MoM →
            </button>
          </div>
        </div>
      )}

      {/* Session stats */}
      <div className="shrink-0 border-t border-ink/6 p-3">
        <div className="text-[11px] font-bold text-ink/40 uppercase tracking-wider mb-2">This session</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { v: leads.length, l: 'total leads' },
            { v: booked, l: 'calls booked', c: 'text-pulse' },
            { v: closedWon, l: 'closed won', c: 'text-signal' },
            { v: nurture + closedLost, l: 'dropped', c: 'text-ink/40' },
          ].map(({ v, l, c }) => (
            <div key={l} className="bg-paper border border-ink/8 rounded-xl p-2.5">
              <div className={`text-[18px] font-display font-bold leading-none ${c ?? 'text-ink'}`}>{v}</div>
              <div className="text-[10px] text-ink/40 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── MoM Panel ────────────────────────────────────────────────────────────────

function MomPanel() {
  const { showMomPanel, momLeadId, leads, threadForLead, completeMomTask, closeMomPanel } = useSimulatorStore();
  const [mom, setMom] = useState('');

  if (!showMomPanel || !momLeadId) return null;
  const lead = leads.find(l => l.id === momLeadId);
  if (!lead) return null;

  const thread = threadForLead(momLeadId);
  const analysis = generateMoMAnalysis(lead, thread);

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-6">
      <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-ink/10">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-ink/8 shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg text-ink">Discovery Call — {lead.name}</h2>
            <p className="text-xs text-ink/40">{lead.company} · {lead.industry}</p>
          </div>
          <button onClick={closeMomPanel} className="ml-auto text-ink/30 hover:text-ink text-lg">✕</button>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* Left: AI analysis */}
          <div className="flex-1 overflow-y-auto px-6 py-5 border-r border-ink/8 space-y-5">
            <div className="bg-pulse/5 border border-pulse/15 rounded-xl p-4">
              <div className="text-[11px] font-bold text-pulse uppercase tracking-wider mb-2">🤖 Conversation summary</div>
              <p className="text-[13px] text-ink leading-relaxed">{analysis.summary}</p>
            </div>

            <div className="bg-ink/3 border border-ink/8 rounded-xl p-4">
              <div className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-2">📋 Customer profile</div>
              <pre className="text-[12px] text-ink/70 font-mono whitespace-pre-wrap leading-relaxed">{analysis.customerProfile}</pre>
            </div>

            <div className="bg-amber/5 border border-amber/20 rounded-xl p-4">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2">🎯 Intent analysis</div>
              <p className="text-[13px] text-ink leading-relaxed">{analysis.intentAnalysis}</p>
            </div>

            <div className="bg-signal/5 border border-signal/15 rounded-xl p-4">
              <div className="text-[11px] font-bold text-signal uppercase tracking-wider mb-2">✅ Suggested actions</div>
              <ul className="space-y-1.5">
                {analysis.suggestedActions.map((a, i) => (
                  <li key={i} className="text-[13px] text-ink flex gap-2">
                    <span className="text-signal font-bold shrink-0">{i + 1}.</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-glacier/5 border border-glacier/15 rounded-xl p-4">
              <div className="text-[11px] font-bold text-glacier uppercase tracking-wider mb-2">💡 Key talking points</div>
              <ul className="space-y-1.5">
                {analysis.keyTalkingPoints.map((p, i) => (
                  <li key={i} className="text-[13px] text-ink flex gap-2">
                    <span className="text-glacier shrink-0">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: MoM entry */}
          <div className="w-[340px] shrink-0 flex flex-col px-6 py-5">
            <h3 className="font-display font-bold text-sm text-ink mb-1">Minutes of Meeting</h3>
            <p className="text-[11px] text-ink/40 mb-4">Enter what was discussed, key decisions, and next steps.</p>
            <textarea
              value={mom}
              onChange={e => setMom(e.target.value)}
              placeholder={`What was discussed in the call with ${lead.name.split(' ')[0]}?\n\nKey decisions:\n\nAgreed next steps:\n\nOutcome:`}
              className="flex-1 w-full bg-ink/3 border border-ink/10 rounded-xl px-4 py-3 text-[13px] font-mono resize-none focus:outline-none focus:border-pulse placeholder:text-ink/20 leading-relaxed"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={closeMomPanel} className="flex-1 bg-ink/5 text-ink/60 text-sm font-semibold py-2.5 rounded-xl hover:bg-ink/10 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { if (mom.trim()) completeMomTask(lead.id, mom); }}
                disabled={!mom.trim()}
                className="flex-1 bg-pulse text-paper text-sm font-semibold py-2.5 rounded-xl hover:bg-pulse/80 transition-colors disabled:opacity-40"
              >
                Complete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function PlaygroundShell() {
  const { closeItEnabled } = useSimulatorStore();

  return (
    <div className="flex flex-col h-[860px] bg-paper overflow-hidden rounded-2xl border border-ink/10">
      <NavBar />
      {!closeItEnabled && (
        <div className="flex items-center gap-2 px-6 py-2 bg-amber/8 border-b border-amber/20 text-[12px] text-amber-700 font-medium shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          CloseIt is disabled — no automated emails or scoring will fire. You're managing leads manually.
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        <LeadSidebar />
        <ThreadPanel />
        <AgentActionsPanel />
      </div>
      <MomPanel />
    </div>
  );
}
