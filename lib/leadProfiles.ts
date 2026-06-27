import { LeadStartType } from './types';

export interface LeadProfile {
  name: string;
  company: string;
  industry: string;
  startType: LeadStartType;
  intentSignal: 'low' | 'medium' | 'high';
  replyFrequencyDays: number; // 2–6
  // warm-start: the lead's inbound message (template key)
  inboundKey?: string;
}

// 12 profiles — seeded so the same day always produces the same lead
export const LEAD_PROFILES: LeadProfile[] = [
  { name: 'Marcus Webb',    company: 'Webb & Co',              industry: 'Sales Consulting',      startType: 'cold', intentSignal: 'high',   replyFrequencyDays: 2 },
  { name: 'Riya Shah',      company: 'Quantify Labs',          industry: 'SaaS / Analytics',      startType: 'cold', intentSignal: 'high',   replyFrequencyDays: 2 },
  { name: 'Elena Torres',   company: 'BrightPath Consulting',  industry: 'Business Consulting',   startType: 'warm', intentSignal: 'high',   replyFrequencyDays: 3, inboundKey: 'warm_struggling_followup' },
  { name: 'Devon Cole',     company: 'Coastline Goods',        industry: 'E-commerce',            startType: 'cold', intentSignal: 'low',    replyFrequencyDays: 6 },
  { name: 'Priya Nair',     company: 'Fernhill Analytics',     industry: 'Data & BI',             startType: 'cold', intentSignal: 'medium', replyFrequencyDays: 3 },
  { name: 'Sam Okafor',     company: 'Okafor & Reed',          industry: 'Legal Services',        startType: 'warm', intentSignal: 'medium', replyFrequencyDays: 4, inboundKey: 'warm_heard_about' },
  { name: 'Yuki Tanaka',    company: 'Helix Systems',          industry: 'Enterprise IT',         startType: 'cold', intentSignal: 'low',    replyFrequencyDays: 5 },
  { name: 'Amara Diallo',   company: 'GreenBridge Ventures',   industry: 'VC / Investment',       startType: 'warm', intentSignal: 'high',   replyFrequencyDays: 2, inboundKey: 'warm_portfolio_use' },
  { name: 'Chris Holt',     company: 'Holt Manufacturing',     industry: 'Manufacturing',         startType: 'cold', intentSignal: 'medium', replyFrequencyDays: 4 },
  { name: 'Leila Mahmoud',  company: 'Novatek Solutions',      industry: 'Systems Integration',   startType: 'cold', intentSignal: 'high',   replyFrequencyDays: 2 },
  { name: 'Tom Fraser',     company: 'Fraser Retail Group',    industry: 'Retail / Omnichannel',  startType: 'warm', intentSignal: 'medium', replyFrequencyDays: 3, inboundKey: 'warm_referral' },
  { name: 'Sneha Kulkarni', company: 'Axiom Healthtech',       industry: 'Health Tech',           startType: 'cold', intentSignal: 'low',    replyFrequencyDays: 5 },
];
