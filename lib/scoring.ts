import { LeadClassification, SimulatorConfig } from './types';

// Budget tiers in USD
function budgetScore(budget: number): number {
  if (budget > 2000) return 10;
  if (budget >= 500) return 6;
  return 3;
}

function intentScore(signal: 'low' | 'medium' | 'high'): number {
  return signal === 'high' ? 9 : signal === 'medium' ? 6 : 3;
}

// Sooner timeline = higher urgency
function timelineScore(days: number): number {
  if (days <= 7) return 10;
  if (days <= 21) return 6;
  return 3;
}

export function computeScore(
  budget: number,
  timeline: number,
  intent: 'low' | 'medium' | 'high',
  config: SimulatorConfig
): { score: number; classification: LeadClassification; rationale: string } {
  const { budgetWeight, intentWeight, timelineWeight } = config.scoring;
  const bs = budgetScore(budget);
  const is = intentScore(intent);
  const ts = timelineScore(timeline);

  const raw = (bs * budgetWeight + is * intentWeight + ts * timelineWeight) / 100;
  const score = Math.round(raw);
  const classification: LeadClassification =
    score >= 7 ? 'Hot' : score >= 4 ? 'Warm' : 'Cold';

  const rationale = `Budget: ${bs}/10 (×${budgetWeight}%) + Intent: ${is}/10 (×${intentWeight}%) + Timeline: ${ts}/10 (×${timelineWeight}%) = ${score}/10 → ${classification}`;
  return { score, classification, rationale };
}
