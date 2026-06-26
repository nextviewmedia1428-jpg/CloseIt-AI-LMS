import { NextRequest, NextResponse } from 'next/server';

const MOCK = process.env.MOCK_N8N === 'true' || !process.env.N8N_BASE_URL;

const mockSummary = (leadName: string, thread: string, question: string) => {
  if (question.toLowerCase().includes('status'))
    return `${leadName} is currently engaged and moving through the pipeline. The last activity shows strong buying signals based on their reply.`;
  if (question.toLowerCase().includes('summar'))
    return `**Thread Summary for ${leadName}:**\n\nInitial outreach sent on Day 1 — intro + proposal. ${leadName} replied expressing strong interest and urgency. A discovery call was booked. The rep completed the call and noted a strong fit. Lead is now Closed Won.\n\n**Key signals:** High budget ($${Math.floor(Math.random() * 3000 + 1000)}), short timeline, high intent score.`;
  if (question.toLowerCase().includes('draft') || question.toLowerCase().includes('reply'))
    return `Here's a suggested reply:\n\n"Hi ${leadName},\n\nThank you for your time on our last call — it was great to understand your needs in depth. I'm putting together the final agreement now and will have it with you by tomorrow.\n\nLooking forward to working together!\n\n— Your Team"`;
  return `Based on the thread with ${leadName}: they showed strong interest after the initial proposal, replied quickly, and booked a call. The conversation has been positive throughout. Current status reflects active engagement.`;
};

export async function POST(req: NextRequest) {
  const { leadName, thread, question } = await req.json();

  if (MOCK) {
    await new Promise(r => setTimeout(r, 800)); // simulate latency
    return NextResponse.json({ answer: mockSummary(leadName, thread, question) });
  }

  try {
    const res = await fetch(
      `${process.env.N8N_BASE_URL}${process.env.N8N_WEBHOOK_CHAT_QUERY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET ?? '',
        },
        body: JSON.stringify({ leadName, thread, question }),
      }
    );
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ answer: mockSummary(leadName, thread, question) });
  }
}
