interface Props {
  channel: string;
  icon: string;
  color: string;
  preview: { label: string; content: string }[];
  badge?: string;
}

export function ChannelPreviewCard({ channel, icon, color, preview, badge }: Props) {
  return (
    <div className="bg-paper border border-ink/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-display font-semibold text-ink">{channel}</span>
        </div>
        {badge && (
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-ink/10 text-ink/50">{badge}</span>
        )}
      </div>
      <div className="space-y-2">
        {preview.map(({ label, content }) => (
          <div key={label} className="bg-ink/3 rounded-xl p-3">
            <p className="text-xs font-mono text-ink/40 mb-1">{label}</p>
            <p className="text-sm text-ink/70 leading-relaxed">{content}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-mono text-ink/40">Preview only — no messages sent in demo</span>
      </div>
    </div>
  );
}
