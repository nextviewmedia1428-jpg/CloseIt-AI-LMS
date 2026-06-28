import { Hero } from '@/components/Hero';
import Navbar from '@/components/Playground/Navbar';
import Sidebar from '@/components/Playground/Sidebar';
import ThreadPanel from '@/components/Playground/ThreadPanel';
import RightPanel from '@/components/Playground/RightPanel';
import CalendarView from '@/components/Playground/CalendarView';
import MeetingModal from '@/components/Playground/MeetingModal';
import MorningBrief from '@/components/Playground/MorningBrief';
import SimulationEnd from '@/components/Playground/SimulationEnd';
import { CommunicationLayer } from '@/components/CommunicationLayer/CommunicationLayer';
import { CTASection } from '@/components/CTASection';
import { SignalBar } from '@/components/ui/SignalBar';

export default function Home() {
  return (
    <>
      <Hero />

      <section id="playground" className="py-16 px-6" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-mono text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Business Simulator</p>
            <h2 className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>See it work — live</h2>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Register leads, watch the automation sequence them, score them by AI, and schedule discovery calls — all in real time.
            </p>
          </div>
          <SignalBar className="h-0.5 mb-10 opacity-30" />
        </div>

        {/* Playground fullscreen */}
        <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
          <Navbar />
          <div className="flex flex-1 min-h-0">
            <Sidebar />
            <ThreadPanel />
            <RightPanel />
          </div>
          <CalendarView />
          <MeetingModal />
          <MorningBrief />
          <SimulationEnd />
        </div>
      </section>

      <CommunicationLayer />
      <CTASection />
    </>
  );
}
