'use client';
import { useState } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { SIMULATION_MAX_DAYS, SIMULATION_MAX_SECONDS } from '@/store/simulatorStore';

const STEPS = [
  {
    id: 'what',
    icon: '🤖',
    title: "What you're about to see",
    bullets: [
      'Each "Next Day" click fires a real n8n webhook. OpenAI generates new leads, simulates prospect replies, and scores each thread by intent and recency.',
      'When a lead is ready, the AI proposes and confirms a discovery call automatically — watch the conversation happen in the Thread Panel.',
      'Toggle CloseIt On/Off to switch between fully autonomous AI follow-ups and manual mode where you decide every next action.',
    ],
  },
  {
    id: 'rules',
    icon: '📋',
    title: 'The Rules',
    items: [
      { label: `${SIMULATION_MAX_DAYS} Days`, desc: `The simulation ends after Day ${SIMULATION_MAX_DAYS}.` },
      { label: `${SIMULATION_MAX_SECONDS / 60} Minutes`, desc: 'Real-time clock. Starts on your first Next Day click.' },
      { label: 'Score = 100pts', desc: 'Calls Scheduled (40) + Speed (20) + Lead Quality (40).' },
      { label: 'Meeting Gate', desc: 'Calls scheduled for today must be completed before advancing.' },
      { label: 'CloseIt On/Off', desc: 'On = AI handles follow-ups. Off = you own every action manually.' },
    ],
  },
  {
    id: 'howto',
    icon: '🕹️',
    title: 'How to play',
    items: [
      { icon: '→', label: 'Next Day', desc: 'Fires the n8n AI pipeline — leads arrive, replies happen, scores update.' },
      { icon: '👤', label: 'Sidebar', desc: 'All leads, colour-coded by score. Click any to open their thread.' },
      { icon: '💬', label: 'Thread Panel', desc: 'Every AI-drafted message and lead reply, live. Type to engage manually.' },
      { icon: '🔔', label: 'Bell', desc: 'Pending meetings, replies, and action items. Clear before advancing.' },
      { icon: '🏆', label: 'Leaderboard', desc: 'Your rank on the global board is revealed when the simulation ends.' },
    ],
  },
];

export default function PlaygroundGate() {
  const { playerName, setPlayerName } = useSimulatorStore();
  const [step, setStep] = useState(0); // 0=welcome, 1=what, 2=rules, 3=howto
  const [name, setName] = useState('');

  if (playerName !== null) return null;

  const isWelcome = step === 0;
  const infoStep = STEPS[step - 1];
  const isLast = step === STEPS.length; // step 3

  function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlayerName(trimmed);
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-paper">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--border-med) 1px, transparent 1px), linear-gradient(90deg, var(--border-med) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md mx-auto px-6">

        {/* Welcome step */}
        {isWelcome && (
          <div className="flex flex-col items-center text-center gap-6">
            {/* Signal bar */}
            <div className="h-1 w-24 rounded-full" style={{ background: 'linear-gradient(90deg, #FF5A36, #FFB627, #3E7CB1)' }} />

            <div>
              <p className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-2">Lead Management Simulator</p>
              <h1 className="font-display text-4xl font-bold text-ink leading-tight">
                Close<span className="text-ember">It</span>
              </h1>
              <p className="text-ink/60 mt-3 text-base leading-relaxed">
                Watch an AI-powered n8n pipeline generate leads, score them, follow up, and book discovery calls — all in real time.
              </p>
            </div>

            {/* Score legend pills */}
            <div className="flex items-center gap-4 text-sm">
              {[
                { dot: '#FF5A36', label: 'Hot' },
                { dot: '#FFB627', label: 'Warm' },
                { dot: '#3E7CB1', label: 'Cold' },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                  <span className="text-ink/50 text-xs">{label}</span>
                </div>
              ))}
            </div>

            {/* Name input */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-ink/50 mb-2 text-left font-mono uppercase tracking-wider">
                Enter your player name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setStep(1); }}
                placeholder="e.g. Kaustav"
                maxLength={32}
                className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-paper text-ink placeholder:text-ink/30 outline-none focus:border-pulse focus:ring-2 focus:ring-pulse/10 transition-all text-base font-sans"
                autoFocus
              />
            </div>

            <button
              onClick={() => name.trim() && setStep(1)}
              disabled={!name.trim()}
              className="w-full bg-ink text-paper py-3.5 rounded-2xl font-semibold text-base hover:bg-ink/80 transition-colors disabled:opacity-30"
            >
              Let's go →
            </button>

            <p className="text-xs text-ink/30 font-mono">No sign-up · Session only · No data stored</p>
          </div>
        )}

        {/* Info steps (1, 2, 3) */}
        {!isWelcome && infoStep && (
          <div className="flex flex-col gap-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{ background: i < step ? '#FF5A36' : i === step - 1 ? '#FFB627' : 'rgba(34,31,26,0.12)' }}
                />
              ))}
            </div>

            <div>
              <div className="text-2xl mb-2">{infoStep.icon}</div>
              <h2 className="font-display text-2xl font-bold text-ink">{infoStep.title}</h2>
            </div>

            {/* Bullets (what step) */}
            {'bullets' in infoStep && infoStep.bullets && (
              <div className="flex flex-col gap-3">
                {infoStep.bullets.map((b, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-ember/10 text-ember text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-ink/70 leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Items (rules / howto steps) */}
            {'items' in infoStep && infoStep.items && (
              <div className="flex flex-col gap-2">
                {infoStep.items.map((item) => (
                  <div key={item.label} className="flex items-start gap-3 bg-ink/3 rounded-xl px-4 py-3">
                    {'icon' in item && (
                      <span className="text-sm font-mono text-ink/40 w-5 flex-shrink-0 mt-0.5">{item.icon}</span>
                    )}
                    <div>
                      <span className="text-sm font-semibold text-ink">{item.label}</span>
                      <span className="text-sm text-ink/60"> — {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-ink/15 text-ink/60 py-3 rounded-2xl font-semibold text-sm hover:bg-ink/5 transition-colors"
              >
                ← Back
              </button>
              {isLast ? (
                <button
                  onClick={handleStart}
                  className="flex-1 bg-ember text-white py-3 rounded-2xl font-semibold text-sm hover:bg-ember/80 transition-colors"
                >
                  Start Simulation 🚀
                </button>
              ) : (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex-1 bg-ink text-paper py-3 rounded-2xl font-semibold text-sm hover:bg-ink/80 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
