'use client';
import { useState, useCallback } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

interface Message { role: 'user' | 'ai'; text: string }

export function SalesAgentChatPanel() {
  const { selectedLeadId, leads, actionsForLead, setSelectedLead } = useSimulatorStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const lead = leads.find(l => l.id === selectedLeadId);

  const buildThread = useCallback(() => {
    if (!lead) return '';
    return actionsForLead(lead.id).map(a => {
      const d = a.detail as Record<string, string>;
      const body = d.body ?? d.draftBody ?? d.mom ?? a.summary;
      return `[Day ${a.day}] [${a.actor.toUpperCase()}] ${a.summary}\n${body}`;
    }).join('\n\n');
  }, [lead, actionsForLead]);

  const send = async () => {
    if (!input.trim() || !lead) return;
    const question = input.trim();
    setMessages(m => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    const res = await fetch('/api/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadName: lead.name, thread: buildThread(), question }),
    });
    const { answer } = await res.json();
    setMessages(m => [...m, { role: 'ai', text: answer }]);
    setLoading(false);
  };

  if (!lead) {
    return (
      <div className="bg-pulse/5 border border-pulse/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-64">
        <div className="text-3xl mb-2">🤖</div>
        <p className="text-sm text-ink/60">Select a lead to open the AI Agent.</p>
        <p className="text-xs text-ink/40 mt-1">Ask about the thread, request a draft, or get a status summary.</p>
      </div>
    );
  }

  const QUICK = [
    'Summarize this lead\'s full thread',
    'Who currently has the ball and what should happen next?',
    'Draft a re-engagement message for this lead',
    'What\'s the risk of losing this deal?',
  ];

  return (
    <div className="bg-paper border border-pulse/20 rounded-2xl overflow-hidden flex flex-col" style={{ height: 520 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-pulse/20 bg-pulse/5 shrink-0">
        <div>
          <p className="text-xs font-mono font-bold text-pulse">AI AGENT</p>
          <p className="text-sm font-semibold text-ink">{lead.name}
            <span className="ml-2 text-xs font-mono text-ink/40">· {lead.projectName}</span>
          </p>
        </div>
        <button onClick={() => setSelectedLead(null)} className="text-ink/30 hover:text-ink text-lg">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-mono text-ink/30 mb-2">Suggested questions</p>
            {QUICK.map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="block w-full text-left text-xs font-mono px-3 py-2 rounded-lg bg-ink/3 border border-ink/8 text-ink/50 hover:bg-ink/8 hover:text-ink/70 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-ink text-paper font-mono'
                : 'bg-pulse/8 text-ink border border-pulse/15'
            }`}>
              {m.role === 'ai' && <span className="text-pulse font-bold block mb-1 font-mono">🤖 Agent</span>}
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-pulse/8 border border-pulse/15 px-3 py-2 rounded-xl">
              <span className="text-pulse text-xs font-mono animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-pulse/20 p-3 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about this lead…"
          className="flex-1 bg-ink/5 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-pulse placeholder:text-ink/30"
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-4 py-2 bg-pulse text-paper rounded-lg text-sm font-semibold hover:bg-pulse/80 transition-colors disabled:opacity-40">
          →
        </button>
      </div>
    </div>
  );
}
