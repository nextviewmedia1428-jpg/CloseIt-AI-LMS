import { SignalBar } from '@/components/ui/SignalBar';

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ember/5 via-paper to-paper pointer-events-none" />

      {/* Signal bar — hero version */}
      <SignalBar className="h-1 w-48 mb-8 opacity-90" />

      <div className="relative max-w-3xl">
        <p className="font-mono text-sm text-ink/50 uppercase tracking-widest mb-4">Lead Automation · Powered by n8n + Claude AI</p>

        <h1 className="font-display text-5xl md:text-7xl font-bold text-ink leading-tight mb-6">
          Every lead tracked.<br />
          <span className="text-ember">Nothing left behind.</span>
        </h1>

        <p className="text-lg text-ink/60 leading-relaxed max-w-xl mx-auto mb-10">
          CloseIt captures leads, scores them with AI, follows up automatically, and briefs your sales team — so no deal falls through the cracks because of a forgotten email.
        </p>

        {/* Score legend */}
        <div className="flex items-center justify-center gap-6 mb-10">
          {[
            { label: 'Hot lead', color: '#FF5A36', score: '8–10' },
            { label: 'Warm lead', color: '#FFB627', score: '4–7' },
            { label: 'Cold lead', color: '#3E7CB1', score: '0–3' },
          ].map(({ label, color, score }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-ink/60">{label}</span>
              <span className="font-mono text-xs text-ink/40">{score}</span>
            </div>
          ))}
        </div>

        <a
          href="#playground"
          className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-paper rounded-2xl font-semibold text-base hover:bg-ink/80 transition-colors"
        >
          Try the Live Demo ↓
        </a>
      </div>

      {/* Floating stat pills */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 flex-wrap justify-center">
        {[
          { val: '< 2s', label: 'Score & route' },
          { val: 'Zero', label: 'Manual follow-ups' },
          { val: '100%', label: 'Actions logged' },
        ].map(({ val, label }) => (
          <div key={label} className="bg-paper border border-ink/10 rounded-xl px-4 py-2 shadow-sm">
            <span className="font-display font-bold text-ink">{val}</span>
            <span className="font-mono text-xs text-ink/50 ml-2">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
