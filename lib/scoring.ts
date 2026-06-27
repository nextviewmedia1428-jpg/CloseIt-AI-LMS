import { Lead, ThreadMessage } from './types';

// Called at the start of every day for every active lead.
// Reads the full thread for intent, adjusts for reply frequency and recency.
export function recomputeScore(
  lead: Lead,
  thread: ThreadMessage[],
  today: number,
): { score: number; scoreDelta: number } {
  const prev = lead.score;

  // 1. Intent from lead messages
  const leadMessages = thread.filter(m => m.from === 'lead').map(m => m.body.toLowerCase());

  const positiveSignals = [
    'interested', 'sounds good', "let's do", "let's talk", 'love to', 'keen',
    'budget', 'timeline', 'when can', 'book', 'schedule', 'call', 'demo',
    'how much', 'pricing', 'next step', 'move forward', 'yes', 'absolutely',
    'great', 'perfect', 'looking forward', 'exactly what', 'fits', 'quarter',
  ];
  const negativeSignals = [
    'not right now', 'not interested', 'too expensive', 'no budget',
    'maybe later', 'not a priority', 'pass', 'no thanks', 'not for us',
    'build in-house', 'already have', 'went with another',
  ];

  let posHits = 0;
  let negHits = 0;
  for (const msg of leadMessages) {
    for (const s of positiveSignals) if (msg.includes(s)) posHits++;
    for (const s of negativeSignals) if (msg.includes(s)) negHits++;
  }
  const intentScore = Math.min(10, Math.max(1, 5 + posHits - negHits * 2));

  // 2. Recency penalty — silence beyond expected window
  const daysSinceLast =
    lead.lastReplyDay !== null ? today - lead.lastReplyDay : today - lead.registeredOnDay;
  const silence = Math.max(0, daysSinceLast - lead.replyFrequencyDays);
  const recencyPenalty = Math.min(3, silence);

  // 3. Frequency bonus — replied faster than expected
  const frequencyBonus = daysSinceLast < lead.replyFrequencyDays && lead.lastReplyDay !== null ? 1 : 0;

  // 4. Discovery call booked is a strong positive signal
  const callBonus = lead.discoveryCallDay !== null ? 2 : 0;

  const raw = intentScore - recencyPenalty + frequencyBonus + callBonus;
  const score = Math.min(10, Math.max(0, Math.round(raw)));
  return { score, scoreDelta: score - prev };
}

export const CRITICAL_THRESHOLD = 4;
export const DEFAULT_SCORE = 6;

export function isCritical(score: number): boolean {
  return score < CRITICAL_THRESHOLD;
}

export function scoreLabel(score: number): 'Hot' | 'Warm' | 'Cool' | 'Critical' {
  if (score >= 8) return 'Hot';
  if (score >= 6) return 'Warm';
  if (score >= CRITICAL_THRESHOLD) return 'Cool';
  return 'Critical';
}
