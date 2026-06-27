# CloseIt — AI Lead Management Demo

A portfolio/demo web app proving an end-to-end AI-powered lead capture, scoring, and follow-up automation stack. Built to win n8n automation freelance contracts on Upwork.

**Live demo:** https://closeit-topaz.vercel.app

---

## What it does

Visitors walk through a simulated sales pipeline:

1. **Register leads** via a form (name, email, budget, timeline, intent signal)
2. **Advance days** — each click fires n8n WF2 which generates new leads, simulates lead replies, sends follow-ups, and scores every active lead
3. **Inspect the thread** — select any lead to see the full conversation and interact with the Sales Agent
4. **Open the AI Agent** — analyzes the thread, determines who has the ball (user or lead), and drafts the right next message

Everything runs on n8n + OpenAI + Google Sheets. The frontend never calls OpenAI directly.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript |
| Styling | Tailwind CSS (custom design system) |
| State | Zustand (in-memory, resets on reload) |
| Forms | React Hook Form + Zod |
| Automation | n8n (self-hosted on Hostinger) |
| AI | OpenAI gpt-4o-mini, called only from n8n |
| Audit log | Google Sheets (write-only — UI never reads from it) |
| Hosting | Vercel |

---

## Architecture

```
Browser (Next.js on Vercel)
  │
  │  POST via server-side API routes (secrets never reach the client)
  ▼
/api/leads/register        →  n8n WF1  (lead capture + AI scoring)
/api/simulate/next-day     →  n8n WF2  (day engine: leads, replies, follow-ups, scoring)
/api/chat/query            →  n8n WF4  (sales agent Q&A)
/api/agent/analyze         →  n8n WF5  (autonomous follow-up agent)
  │
  ▼
Google Sheets (audit trail only — UI reads from webhook responses, not Sheets)
```

All AI calls happen inside n8n nodes. The Next.js app only sends and receives JSON — it never holds an OpenAI key.

### Mock mode

`MOCK_N8N=true` (default on Vercel) makes every API route return deterministic fake data. The full demo runs without any n8n configuration. Set `false` to wire real workflows.

---

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. The default `.env.local` has `MOCK_N8N=true` so no n8n setup is needed locally.

---

## Environment variables

| Variable | Description |
|---|---|
| `MOCK_N8N` | `true` = use built-in mock data, `false` = call real n8n |
| `N8N_BASE_URL` | Base URL of your n8n instance, e.g. `https://n8n.srv1348908.hstgr.cloud/webhook` |
| `N8N_WEBHOOK_REGISTER_LEAD` | Path for WF1, e.g. `/closeit/register-lead` |
| `N8N_WEBHOOK_NEXT_DAY` | Path for WF2, e.g. `/closeit/next-day` |
| `N8N_WEBHOOK_CHAT_QUERY` | Path for WF4, e.g. `/closeit/chat-query` |
| `N8N_WEBHOOK_AGENT_ANALYZE` | Path for WF5, e.g. `/closeit/agent-analyze` |
| `N8N_WEBHOOK_SECRET` | Shared secret sent as `x-webhook-secret` header |

For Vercel deployment, add all under **Project Settings → Environment Variables**.

---

## Project structure

```
app/
  page.tsx                        # Single-page layout
  api/
    leads/register/route.ts       # Proxies to n8n WF1
    simulate/next-day/route.ts    # Proxies to n8n WF2 (merges+dedupes multi-fire)
    chat/query/route.ts           # Proxies to n8n WF4
    agent/analyze/route.ts        # Proxies to n8n WF5 (AgentAnalysis interface exported here)

components/
  Hero.tsx
  CTASection.tsx
  Playground/
    PlaygroundShell.tsx           # Orchestrates the 3-column simulator layout
    DayHeader.tsx                 # Day counter + "Next Day" button
    LeadRegistrationForm.tsx      # Lead intake form
    LeadList.tsx                  # Lead cards with score/status badges
    SalesAgentChatPanel.tsx       # Autonomous follow-up agent + Q&A chat
    MomPanel.tsx                  # Minutes of Meeting entry after discovery call
  CommunicationLayer/
    CommunicationLayer.tsx
    ChannelPreviewCard.tsx
  ui/                             # Shared badge, modal, button primitives

lib/
  types.ts                        # All shared TypeScript types — Lead, ThreadMessage, OpenTask, Notification, Action
  scoring.ts                      # Weighted score formula
  demoScript.ts                   # Local fallback story engine (seeded by lead ID hash)

store/
  simulatorStore.ts               # Zustand: day, leads, threadsByLead, tasks, notifications, actionsByDay

n8n-workflows/
  WF1-lead-capture.json
  WF2-next-day-v2.json            # Active file — see WF2-DOCUMENTATION.md
  WF4-sales-agent.json
  WF5-follow-up-agent.json
  WF2-DOCUMENTATION.md            # Complete WF2 specification — read before modifying
  SETUP.md                        # n8n import + configuration guide
```

---

## Design system

Seven semantic colors — lead temperature drives the palette:

| Token | Hex | Used for |
|---|---|---|
| `paper` | `#FAF7F2` | Page background |
| `ink` | `#221F1A` | Primary text |
| `ember` | `#FF5A36` | Hot leads, hero accent, user nudges |
| `amber` | `#FFB627` | Warm leads, open tasks |
| `glacier` | `#3E7CB1` | Cold leads |
| `signal` | `#2F9E44` | Success / sent / system actions |
| `pulse` | `#7C5CFF` | AI-generated content (scores, drafts, agent panel) |

Fonts: Space Grotesk (display) · Inter (body/UI) · IBM Plex Mono (data/code)

---

## Lead lifecycle

```
New → Contacted → Awaiting Reply → Replied → Discovery Booked
                                                    ↓
                                          [User enters MoM]
                                                    ↓
                                          Post-MoM email sent

At any point: → Nurture (6 follow-ups exhausted) | Closed Won | Closed Lost
```

**Pre-discovery:** agent fully autonomous — sends outreach, auto-replies to leads, and proposes calls after 2–3 exchanges.

**Post-discovery:** user takes over — agent nudges user daily when lead is waiting. User composes replies from the thread panel.

---

## n8n workflows

See [`n8n-workflows/SETUP.md`](n8n-workflows/SETUP.md) for import instructions and [`n8n-workflows/WF2-DOCUMENTATION.md`](n8n-workflows/WF2-DOCUMENTATION.md) for the complete WF2 spec.

| Workflow | File | Webhook path | What it does |
|---|---|---|---|
| WF1 Lead Capture | WF1-lead-capture.json | `/closeit/register-lead` | Capture, dedup by email, AI score, write to Sheets |
| WF2 Next Day Engine | WF2-next-day-v2.json | `/closeit/next-day` | Generate leads, simulate replies, send follow-ups, score all active leads |
| WF4 Sales Agent | WF4-sales-agent.json | `/closeit/chat-query` | Answers free-text questions about a lead's thread |
| WF5 Follow-up Agent | WF5-follow-up-agent.json | `/closeit/agent-analyze` | Analyzes thread, determines who has the ball, drafts next message |

---

## Lead scoring formula

```
score = round(
  (budgetScore × budgetWeight +
   intentScore × intentWeight +
   timelineScore × timelineWeight) / 100
)

Budget tiers:   <$500 → 3  |  $500–$2000 → 6  |  >$2000 → 10
Intent signal:  low → 3    |  medium → 6       |  high → 9
Timeline:       ≤7d → 10   |  ≤21d → 6         |  >21d → 3

Hot: score ≥ 7  |  Warm: 4–6  |  Cold: < 4
```

---

## Deploying to Vercel

1. Push to GitHub repo
2. Add all environment variables in Vercel dashboard
3. Set `MOCK_N8N=true` for a self-contained demo, or `false` to wire real n8n
4. Deploy
