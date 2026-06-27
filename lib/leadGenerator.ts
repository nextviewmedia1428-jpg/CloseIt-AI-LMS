import { Lead } from './types';
import { LEAD_PROFILES } from './leadProfiles';
import { DEFAULT_SCORE } from './scoring';
import { pickWarmInbound } from './emailTemplates';

// Deterministic seeded random — same seed always produces same output
function seeded(seed: string): number {
  let h = 0;
  for (const c of seed) h = ((h << 5) - h) + c.charCodeAt(0);
  return (Math.abs(h) % 10000) / 10000;
}

// Returns a map of day → leads arriving that day.
// Called once on page load. Total days to pre-plan = 30.
// Adaptive: more wins → more leads; more losses → fewer leads.
export function generateLeadSchedule(
  totalDays: number,
  winCount = 0,
  lossCount = 0,
): Record<number, Lead[]> {
  const schedule: Record<number, Lead[]> = {};
  const usedProfileIndices = new Set<number>();

  // Base rate adapts to win/loss history
  const rateModifier = 1 + winCount * 0.1 - lossCount * 0.1;
  const clampedRate = Math.max(0.5, Math.min(2.0, rateModifier));

  let profileCursor = 0;

  for (let day = 0; day < totalDays; day++) {
    // Each day gets 1–4 leads, modulated by win/loss rate
    const baseSeed = seeded(`day${day}schedule`);
    const raw = 1 + Math.floor(baseSeed * 4 * clampedRate);
    const count = Math.min(4, Math.max(1, raw));

    schedule[day] = [];

    for (let i = 0; i < count; i++) {
      const profileSeed = seeded(`day${day}lead${i}profile`);
      // Pick a profile not recently used
      let profileIdx = Math.floor(profileSeed * LEAD_PROFILES.length);
      let attempts = 0;
      while (usedProfileIndices.has(profileIdx) && attempts < LEAD_PROFILES.length) {
        profileIdx = (profileIdx + 1) % LEAD_PROFILES.length;
        attempts++;
      }
      usedProfileIndices.add(profileIdx);
      // Reset pool when all profiles used
      if (usedProfileIndices.size >= LEAD_PROFILES.length) usedProfileIndices.clear();

      const profile = LEAD_PROFILES[profileIdx];
      const id = `lead_d${day}_${i}_${profileIdx}`;

      const lead: Lead = {
        id,
        name: profile.name,
        email: `${profile.name.toLowerCase().replace(/\s+/g, '.')}@${profile.company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        company: profile.company,
        industry: profile.industry,
        startType: profile.startType,
        inboundMessage: profile.startType === 'warm' && profile.inboundKey
          ? pickWarmInbound(profile.inboundKey!, id)
          : undefined,
        intentSignal: profile.intentSignal,
        score: DEFAULT_SCORE,
        scoreDelta: 0,
        status: 'New',
        registeredOnDay: day,
        lastReplyDay: null,
        lastUserReplyDay: null,
        replyFrequencyDays: profile.replyFrequencyDays,
        discoveryCallDay: null,
      };

      schedule[day].push(lead);
    }
  }

  return schedule;
}
