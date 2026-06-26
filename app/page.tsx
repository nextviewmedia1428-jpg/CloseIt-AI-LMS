import { Hero } from '@/components/Hero';
import { PlaygroundShell } from '@/components/Playground/PlaygroundShell';
import { CommunicationLayer } from '@/components/CommunicationLayer/CommunicationLayer';
import { CTASection } from '@/components/CTASection';
import { SignalBar } from '@/components/ui/SignalBar';

export default function Home() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      <Hero />

      <section id="playground" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-mono text-sm text-ink/50 uppercase tracking-widest mb-3">Business Simulator</p>
            <h2 className="font-display text-4xl font-bold text-ink mb-4">See it work — live</h2>
            <p className="text-ink/60 max-w-xl mx-auto">
              Register 3+ leads, configure scoring weights, then click "Next Day" to watch the automation fire in real time.
            </p>
          </div>
          <SignalBar className="h-0.5 mb-10 opacity-30" />
          <PlaygroundShell />
        </div>
      </section>

      <CommunicationLayer />
      <CTASection />
    </main>
  );
}
