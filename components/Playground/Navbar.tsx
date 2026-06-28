'use client';
import { useState, useRef, useEffect } from 'react';
import { useSimulatorStore, computeScore, SIMULATION_MAX_DAYS, SIMULATION_MAX_SECONDS } from '@/store/simulatorStore';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Navbar() {
  const {
    day, setDay, closeItEnabled, toggleCloseIt,
    leads, threads, scheduledCalls, userMessages,
    addLeads, setUserMessages, setScheduledCalls,
    setMeetingModalDay, setSelectedLead, setMorningBrief,
    timerStartedAt, startTimer, endSimulation, simulationEnded,
  } = useSimulatorStore();

  const hasPendingMeetings = scheduledCalls.some((c) => c.callDay === day && !c.completed);
  const [loading, setLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SIMULATION_MAX_SECONDS);
  const notifRef = useRef<HTMLDivElement>(null);
  const endedRef = useRef(false); // prevent double-firing

  // Timer tick
  useEffect(() => {
    if (!timerStartedAt || simulationEnded) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      const left = Math.max(0, SIMULATION_MAX_SECONDS - elapsed);
      setSecondsLeft(left);
      if (left === 0 && !endedRef.current) {
        endedRef.current = true;
        const timeUsed = SIMULATION_MAX_SECONDS;
        endSimulation(computeScore(leads, scheduledCalls, day, timeUsed, 'timer'));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerStartedAt, simulationEnded]); // eslint-disable-line

  const timerWarning = timerStartedAt && secondsLeft <= 5 * 60 && !simulationEnded;

  // close notif dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // notification counts
  const pendingMeetingsToday = scheduledCalls.filter((c) => c.callDay === day && !c.completed);
  const actionRequired = userMessages.filter((m) => !m.message.startsWith('📞'));
  const leadsNeedingReply = leads.filter((l) => {
    const lastMsg = threads[l.lead_id]?.slice(-1)[0];
    const callDone = scheduledCalls.some((c) => c.lead_id === l.lead_id && c.completed);
    return callDone && lastMsg && lastMsg.from !== 'Agent' && lastMsg.from !== 'User';
  });
  const totalNotifs = pendingMeetingsToday.length + actionRequired.length + leadsNeedingReply.length;

  async function handleNextDay() {
    if (simulationEnded) return;
    // Start timer on very first Next Day click
    if (day === 0 && !timerStartedAt) startTimer();
    setLoading(true);
    try {
      const res = await fetch('/api/simulate/next-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day,
          closeItEnabled,
          totalLeads: leads.length,
          existingLeads: leads.map((l) => ({ name: l.name, company: l.company })),
          leads,
          threads,
          scheduledCalls,
        }),
      });

      const result = await res.json();
      const payload = result.data;

      // If n8n returned valid leads, merge them in and use n8n's day
      if (payload?.leads?.length) {
        const processedDay = day;
        const newDay = payload.day;
        const allLeads = payload.leads ?? [];
        const allThreads = payload.threads ?? {};
        const allCalls = payload.scheduledCalls ?? [];

        // Compute morning brief before merging into store
        const existingIds = new Set(leads.map((l) => l.lead_id));
        const newLeadsCount = allLeads.filter((l: { lead_id: string }) => !existingIds.has(l.lead_id)).length;
        const hot  = allLeads.filter((l: { classification?: string }) => l.classification === 'Hot').length;
        const warm = allLeads.filter((l: { classification?: string }) => l.classification === 'Warm').length;
        const cold = allLeads.filter((l: { classification?: string }) => l.classification === 'Cold').length;

        const nameOf: Record<string, string> = {};
        allLeads.forEach((l: { lead_id: string; name: string }) => { nameOf[l.lead_id] = l.name; });

        const followUpsSent: { lead_id: string; lead_name: string }[] = [];
        const queriesResolved: { lead_id: string; lead_name: string }[] = [];
        Object.entries(allThreads as Record<string, { day: number; from: string; body: string }[]>).forEach(([lead_id, msgs]) => {
          const dayMsgs = msgs.filter((m) => m.day === processedDay);
          const hasLeadMsg = dayMsgs.some((m) => m.from !== 'Agent' && m.from !== 'User');
          const hasAgentMsg = dayMsgs.some((m) => m.from === 'Agent' && !m.body.startsWith('Great news!'));
          if (hasLeadMsg && hasAgentMsg) {
            queriesResolved.push({ lead_id, lead_name: nameOf[lead_id] ?? lead_id });
          } else if (hasAgentMsg) {
            followUpsSent.push({ lead_id, lead_name: nameOf[lead_id] ?? lead_id });
          }
        });

        const callsScheduledYesterday = allCalls.filter((c: { scheduledOnDay: number }) => c.scheduledOnDay === processedDay);
        const meetingsToday = allCalls.filter((c: { callDay: number }) => c.callDay === newDay);

        const reminders: string[] = [];
        allLeads.forEach((l: { lead_id: string; name: string }) => {
          const lastMsg = (allThreads as Record<string, { from: string }[]>)[l.lead_id]?.slice(-1)[0];
          const callDone = allCalls.some((c: { lead_id: string; completed?: boolean }) => c.lead_id === l.lead_id && c.completed);
          if (callDone && lastMsg && lastMsg.from !== 'Agent' && lastMsg.from !== 'User') {
            reminders.push(`Reply to ${l.name} — they responded after your call`);
          }
        });
        if (meetingsToday.length > 0) {
          reminders.push(`${meetingsToday.length} meeting(s) scheduled for today — complete them before advancing`);
        }

        addLeads(allLeads, allThreads);
        setDay(newDay);
        setUserMessages(payload.userMessages ?? []);
        setScheduledCalls(allCalls);

        // Check day cap — if we've just completed day 14 (newDay = 15) trigger end
        if (newDay >= SIMULATION_MAX_DAYS && !endedRef.current) {
          endedRef.current = true;
          const timeUsed = timerStartedAt
            ? Math.min(Math.floor((Date.now() - timerStartedAt) / 1000), SIMULATION_MAX_SECONDS)
            : SIMULATION_MAX_SECONDS;
          endSimulation(computeScore(allLeads, allCalls, newDay, timeUsed, 'day_cap'));
          return;
        }

        setMorningBrief({
          processedDay,
          newDay,
          totalLeads: allLeads.length,
          newLeadsCount,
          hot, warm, cold,
          followUpsSent,
          queriesResolved,
          callsScheduledYesterday,
          meetingsToday,
          reminders,
        });
      } else {
        // n8n returned nothing useful — still advance day locally
        setDay(day + 1);
      }
    } catch {
      setDay(day + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="h-[54px] flex-shrink-0 flex items-center justify-between px-5 bg-[var(--surface-2)] border-b border-[var(--border-soft)] relative z-10">
        <div className="text-[16px] font-bold tracking-[-0.3px] text-[var(--text)] font-display">
          Close<span className="text-[var(--pulse)]">It</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          {timerStartedAt && !simulationEnded && (
            <div className={`flex flex-col items-center px-3 border-r border-[var(--border-med)] ${timerWarning ? 'text-[var(--ember)]' : 'text-[var(--text-muted)]'}`}>
              <div className="text-[10px] uppercase tracking-[.06em]">Time Left</div>
              <div className={`text-[18px] font-bold font-mono leading-none ${timerWarning ? 'text-[var(--ember)] animate-pulse' : 'text-[var(--text)]'}`}>
                {fmt(secondsLeft)}
              </div>
            </div>
          )}

          {/* Day counter + Next Day */}
          <div className="flex items-center gap-3 pr-3 border-r border-[var(--border-med)]">
            <div className="text-right">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-[.06em]">Day</div>
              <div className="text-[18px] font-bold font-mono leading-none text-[var(--text)]">{day} <span className="text-[12px] text-[var(--text-muted)] font-normal">/ {SIMULATION_MAX_DAYS}</span></div>
            </div>
            {hasPendingMeetings ? (
              <button
                onClick={() => setMeetingModalDay(day)}
                className="bg-[var(--ember)] text-white text-[12.5px] font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-[0_1px_0_rgba(255,90,54,0.3)] hover:opacity-90 transition-opacity"
              >
                📞 Complete Meetings
              </button>
            ) : (
              <button
                onClick={handleNextDay}
                disabled={loading || day >= SIMULATION_MAX_DAYS}
                className="bg-[var(--pulse)] text-white text-[12.5px] font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-[0_1px_0_rgba(124,92,255,0.3)] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? '…' : day >= SIMULATION_MAX_DAYS ? 'Final Day' : 'Next Day →'}
              </button>
            )}
          </div>

          {/* Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-9 h-9 rounded-[10px] bg-[var(--surface-3)] border border-[var(--border-med)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            >
              <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {totalNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--ember)] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {totalNotifs}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 w-[280px] bg-[var(--surface)] border border-[var(--border-med)] rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[var(--border-soft)]">
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[.05em]">Notifications</span>
                </div>

                {totalNotifs === 0 ? (
                  <p className="text-[12px] text-[var(--text-muted)] italic px-4 py-4">All clear — no pending items.</p>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-[var(--border-soft)]">

                    {leadsNeedingReply.length > 0 && (
                      <div className="px-3 py-2">
                        <div className="text-[10px] font-bold text-[var(--ember)] uppercase tracking-[.05em] mb-1.5">⚠️ Reply needed</div>
                        {leadsNeedingReply.map((l) => (
                          <button
                            key={l.lead_id}
                            onClick={() => { setSelectedLead(l.lead_id); setNotifOpen(false); }}
                            className="w-full text-left text-[12px] text-[var(--text)] py-1 px-1.5 rounded hover:bg-[var(--surface-3)] truncate"
                          >
                            → {l.name} <span className="text-[var(--text-muted)] text-[10px]">({l.company})</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {pendingMeetingsToday.length > 0 && (
                      <div className="px-3 py-2">
                        <div className="text-[10px] font-bold text-[var(--amber)] uppercase tracking-[.05em] mb-1.5">📞 Meetings today</div>
                        {pendingMeetingsToday.map((c) => (
                          <button
                            key={c.lead_id}
                            onClick={() => { setMeetingModalDay(day); setNotifOpen(false); }}
                            className="w-full text-left text-[12px] text-[var(--text)] py-1 px-1.5 rounded hover:bg-[var(--surface-3)] truncate"
                          >
                            → {c.lead_name} <span className="text-[var(--text-muted)] text-[10px]">({c.callDayLabel})</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {actionRequired.length > 0 && (
                      <div className="px-3 py-2">
                        <div className="text-[10px] font-bold text-[#7A5500] uppercase tracking-[.05em] mb-1.5">📬 Action required</div>
                        {actionRequired.map((m, i) => (
                          <button
                            key={i}
                            onClick={() => { setSelectedLead(m.lead_id); setNotifOpen(false); }}
                            className="w-full text-left text-[12px] text-[var(--text)] py-1 px-1.5 rounded hover:bg-[var(--surface-3)] truncate"
                          >
                            → {m.lead_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CloseIt toggle */}
          <button
            onClick={toggleCloseIt}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all
              ${closeItEnabled
                ? 'bg-[var(--signal-soft)] border-[rgba(47,158,68,0.25)] text-[var(--signal)]'
                : 'bg-[rgba(34,31,26,0.06)] border-[rgba(34,31,26,0.12)] text-[var(--text-secondary)]'
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${closeItEnabled ? 'bg-[var(--signal)]' : 'bg-[var(--text-muted)]'}`} />
            CloseIt: {closeItEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {!closeItEnabled && (
        <div className="flex items-center gap-2 bg-[var(--amber-soft)] border-b border-[var(--amber-border)] px-5 py-2 text-[12px] text-[#7A5500] font-medium">
          <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          CloseIt is disabled — you are managing all follow-ups manually. No AI mails or nudges will fire.
        </div>
      )}
    </>
  );
}
