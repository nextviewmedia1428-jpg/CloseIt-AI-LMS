import { SignalBar } from '@/components/ui/SignalBar';

export function CTASection() {
  return (
    <section className="py-24 px-6 bg-ink text-paper">
      <div className="max-w-2xl mx-auto text-center">
        <SignalBar className="h-1 w-32 mx-auto mb-8 opacity-60" />
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
          Want this running for your business?
        </h2>
        <p className="text-paper/60 text-lg mb-10 leading-relaxed">
          This entire stack — lead capture, AI scoring, automated follow-ups, sales agent briefing — is built on n8n. I can have a custom version live for your business in days, not months.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:nextviewmedia1428@gmail.com?subject=CloseIt%20Demo%20Enquiry"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-ember text-paper rounded-2xl font-semibold text-base hover:bg-ember/80 transition-colors"
          >
            Book a Discovery Call →
          </a>
          <a
            href="https://www.upwork.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-paper/20 text-paper rounded-2xl font-semibold text-base hover:bg-paper/5 transition-colors"
          >
            Hire on Upwork
          </a>
        </div>
        <p className="text-paper/30 text-sm mt-8 font-mono">
          Built with n8n · Claude AI · Google Sheets · Next.js
        </p>
      </div>
    </section>
  );
}
