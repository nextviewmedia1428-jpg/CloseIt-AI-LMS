'use client';

export function StartTypeBadge({ type }: { type: 'cold' | 'warm' }) {
  return type === 'warm'
    ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(255,182,39,0.15)] text-[#7A5500]">Warm start</span>
    : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(62,124,177,0.12)] text-[var(--glacier)]">Cold start</span>;
}

export function ClassificationBadge({ c }: { c: 'Hot' | 'Warm' | 'Cold' }) {
  if (c === 'Hot') return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,90,54,0.15)] text-[#9A2810] font-mono">
      🔥 Hot
    </span>
  );
  if (c === 'Warm') return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,182,39,0.15)] text-[#7A5500] font-mono">
      🌤 Warm
    </span>
  );
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(62,124,177,0.12)] text-[var(--glacier)] font-mono">
      ❄️ Cold
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color =
    score > 7 ? 'bg-[rgba(255,90,54,0.15)] text-[#9A2810]' :
    score >= 4 ? 'bg-[rgba(255,182,39,0.15)] text-[#7A5500]' :
    'bg-[rgba(62,124,177,0.12)] text-[var(--glacier)]';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}
