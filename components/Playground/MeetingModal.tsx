'use client';
import { useState, useEffect } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

export default function MeetingModal() {
  const { meetingModalDay, setMeetingModalDay, scheduledCalls, day, markCallCompleted, addThreadMessage } = useSimulatorStore();

  const [activeTab, setActiveTab] = useState(0);
  const [pitch, setPitch] = useState('');
  const [allDone, setAllDone] = useState(false);

  const callsForDay = scheduledCalls.filter((c) => c.callDay === meetingModalDay);

  // Reset local state whenever the modal opens for a different day
  useEffect(() => {
    setActiveTab(0);
    setPitch('');
    setAllDone(false);
  }, [meetingModalDay]);

  // Reset pitch when switching tabs
  useEffect(() => {
    setPitch('');
  }, [activeTab]);

  if (meetingModalDay === null || callsForDay.length === 0) return null;

  const currentCall = callsForDay[activeTab];
  const isLastTab = activeTab === callsForDay.length - 1;

  function handleSubmit() {
    if (!pitch.trim()) return;

    addThreadMessage(currentCall.lead_id, {
      id: `msg_meeting_${currentCall.lead_id}_${Date.now()}`,
      day: meetingModalDay!,
      from: 'User',
      body: pitch.trim(),
      timestamp: new Date().toISOString(),
    });

    markCallCompleted(currentCall.lead_id);

    if (isLastTab) {
      setAllDone(true);
    } else {
      setActiveTab((t) => t + 1);
    }
  }

  // All-done completion screen
  if (allDone) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-[var(--surface)] rounded-2xl p-12 flex flex-col items-center gap-4 shadow-2xl max-w-sm text-center">
          <div className="text-5xl">✅</div>
          <div className="text-[18px] font-bold text-[var(--text)]">All meetings completed</div>
          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
            All calls for Day {meetingModalDay} are logged. You can now proceed to the next day.
          </p>
          <button
            onClick={() => setMeetingModalDay(null)}
            className="mt-2 bg-[var(--pulse)] text-white text-[13px] font-semibold px-8 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="bg-[var(--surface)] rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl" style={{ maxHeight: '85vh' }}>

        {/* Header + tabs */}
        <div className="flex-shrink-0 px-6 pt-5 border-b border-[var(--border-soft)]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[10.5px] text-[var(--text-muted)] uppercase tracking-[.06em]">
                Meetings · Day {meetingModalDay}{meetingModalDay === day ? ' (Today)' : ''}
              </div>
            </div>
            <button
              onClick={() => setMeetingModalDay(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] text-lg leading-none -mt-1"
            >
              ✕
            </button>
          </div>

          {/* Literal tabs */}
          <div className="flex gap-1">
            {callsForDay.map((call, i) => {
              const isDone = call.completed;
              const isActive = i === activeTab;
              return (
                <button
                  key={call.lead_id}
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-2 text-[12px] font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-[var(--pulse)] text-[var(--pulse)] bg-[var(--pulse-soft)]'
                      : isDone
                        ? 'border-[var(--signal)] text-[var(--signal)] opacity-80'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {isDone ? '✓ ' : ''}{call.lead_name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* Left: customer summary */}
          <div className="w-1/2 border-r border-[var(--border-soft)] p-5 overflow-y-auto flex flex-col gap-3">
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[.05em]">
              📋 Customer Summary
            </div>
            <div className="text-[12px] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">{currentCall.lead_name}</span>
              {' · '}{currentCall.company}
            </div>
            {currentCall.bossSummary ? (
              <pre className="text-[12.5px] text-[var(--text)] leading-[1.7] whitespace-pre-wrap font-sans">
                {currentCall.bossSummary}
              </pre>
            ) : (
              <p className="text-[12px] text-[var(--text-muted)] italic">
                No summary available — call was scheduled before summary generation was active.
              </p>
            )}
          </div>

          {/* Right: pitch */}
          <div className="w-1/2 p-5 flex flex-col gap-3">
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[.05em]">
              🎯 Your Pitch
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">
              Enter your product pitch for <strong>{currentCall.lead_name}</strong>. This will be logged in their thread as a meeting note.
            </p>
            <textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder={`Write your pitch for ${currentCall.lead_name}…`}
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border-med)] rounded-xl px-3.5 py-3 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none outline-none focus:border-[var(--pulse)] font-sans"
              style={{ minHeight: '200px' }}
            />
            <div className="flex items-center justify-between mt-1">
              <span className={`text-[11px] ${pitch.trim() ? 'text-[var(--text-muted)]' : 'text-[var(--ember)]'}`}>
                {pitch.trim() ? `${pitch.trim().length} chars` : 'Pitch is required to proceed'}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!pitch.trim()}
                className="bg-[var(--pulse)] text-white text-[13px] font-semibold px-6 py-2.5 rounded-full disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {isLastTab ? 'Submit & Finish ✓' : 'Submit & Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
