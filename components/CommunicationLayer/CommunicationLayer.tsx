import { ChannelPreviewCard } from './ChannelPreviewCard';

const CHANNELS = [
  {
    channel: 'Email',
    icon: '✉️',
    color: '#2F9E44',
    preview: [
      { label: 'Onboarding', content: 'Hi Sarah,\n\nThanks for reaching out! Based on your requirements, we can deliver real results. Book a quick call or reply here.\n\n— Arjun' },
      { label: 'AI Follow-up', content: 'Hi Sarah, just checking in — did you get a chance to review the proposal? Happy to adjust the scope.\n\n— Arjun (via CloseIt AI)' },
    ],
  },
  {
    channel: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    badge: 'Preview only',
    preview: [
      { label: 'Follow-up nudge', content: '👋 Hi Sarah! Quick note from Arjun at CloseIt — just wanted to check if you had any questions about the proposal we sent. Happy to jump on a 10-min call!' },
    ],
  },
  {
    channel: 'SMS',
    icon: '📱',
    color: '#3E7CB1',
    badge: 'Preview only',
    preview: [
      { label: 'Reminder', content: 'Hi Sarah, Arjun from CloseIt here. Following up on your enquiry — reply YES to schedule a quick call or STOP to unsubscribe.' },
    ],
  },
  {
    channel: 'Slack',
    icon: '🔔',
    color: '#7C5CFF',
    preview: [
      { label: '#sales-alerts', content: '🔥 Hot lead captured: *Sarah Chen* — score 9/10. Budget $3,500, timeline 7 days. Assigned to Arjun. Act fast.' },
      { label: '#sales-alerts', content: '📅 Meeting booked with *Sarah Chen*. Day 4. Arjun — prep your deck.' },
    ],
  },
];

export function CommunicationLayer() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-ink/50 uppercase tracking-widest mb-3">Communication Layer</p>
          <h2 className="font-display text-4xl font-bold text-ink mb-4">Every channel, one engine</h2>
          <p className="text-ink/60 max-w-lg mx-auto">
            CloseIt drives outreach across Email, WhatsApp, SMS, and Slack — all triggered by n8n, all AI-drafted, all logged to the audit trail.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHANNELS.map(c => <ChannelPreviewCard key={c.channel} {...c} />)}
        </div>
      </div>
    </section>
  );
}
