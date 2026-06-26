'use client';
import { useState } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

interface Message { role: 'user' | 'ai'; text: string }

export function SalesAgentChatPanel() {
  const { selectedLeadId, leads, actionsForLead, setSelectedLead } = useSimulatorStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const lead = leads.find(l => l.id === selectedLeadId);

  if (!lead) {
    return (
      <div className="bg-pulse/5 border border-pulse/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-64">
        <div className="text-3xl mb-2">🤖</div>
        <p className="text-sm text-ink/60">Select a lead from the feed to open the Sales Agent.</p>
        <p className="text-xs text-ink/40 mt-1">Ask it to summarize a thread, draft a reply, or check status.</p>
      </div>
    );
  }

  const buildThread = () => {
    const actions = actionsForLead(lead.id);
    return actions.map(a => {
      const d = a.detail;
      const body = (d.body ?? d.message ?? a.summary) as string;
      return `[Day ${a.day}] [${a.actor.toUpperCase()}] ${a.summary}\n${body}`;
    }).join('\n\n');
  };

  const send = async () => {
    if (!input.trim()) return;
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

  return (
    <div className="bg-paper border border-pulse/20 rounded-2xl overflow-hidden flex flex-col h-[420px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-pulse/20 bg-pulse/5">
        <div>
          <p className="text-xs font-mono font-bold text-pulse">SALES AGENT</p>
          <p className="text-sm font-semibold text-ink">{lead.name}</p>
        </div>
        <button onClick={() => { setSelectedLead(null); setMessages([]); }}
          className="text-ink/30 hover:text-ink text-lg">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2 pt-4">
            {['Summarize this lead\'s thread', 'What\'s the status of this lead?', 'Draft a follow-up reply'].map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="block w-full text-left text-xs font-mono px-3 py-2 rounded-lg bg-pulse/5 border border-pulse/15 text-pulse/70 hover:bg-pulse/10 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-ink text-paper font-mono'
                : 'bg-pulse/10 text-ink border border-pulse/20'
            }`}>
              {m.role === 'ai' && <span className="text-xs font-mono text-pulse font-bold block mb-1">🤖 AI Agent</span>}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-pulse/10 border border-pulse/20 px-3 py-2 rounded-xl">
              <span className="text-pulse text-xs font-mono animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-pulse/20 p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about this lead…"
          className="flex-1 bg-ink/5 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-pulse placeholder:text-ink/30"
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-4 py-2 bg-pulse text-paper rounded-lg text-sm font-semibold hover:bg-pulse/80 transition-colors disabled:opacity-40">
          →
        </button>
      </div>
    </div>
  );
}
