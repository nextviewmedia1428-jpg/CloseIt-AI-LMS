# CloseIt — AI Lead Management Demo

A portfolio/demo web app that proves an end-to-end AI-powered lead capture, scoring, and follow-up automation stack. Built to win n8n automation freelance contracts on Upwork.

**Live demo:** https://closeit-topaz.vercel.app

---

## What it does

Visitors walk through a simulated sales pipeline:

1. **Register leads** via a form (name, email, budget, timeline)
2. **Advance days** — each click fires n8n workflows that score leads with AI, send automated follow-ups, and simulate customer replies
3. **Inspect the feed** — every action (email sent, reply received, score update, meeting booked) appears in a real-time event feed with full detail
4. **Open the AI Agent** — select any lead to see the autonomous follow-up agent analyze the communication thread, decide who has the ball (staff or lead), and draft the right message

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
| Audit log | Google Sheets (3 tabs: Leads, Activity Log, Error Log) |
| Hosting | Vercel |

---

## Architecture

```
Browser (Next.js on Vercel)
  │
  │  POST via server-side API routes (secrets never reach the client)
  ▼
/api/leads/register        →  n8n WF1  (lead capture + AI scoring)
/api/simulate/next-day     →  n8n WF2  (day engine: onboarding, follow-ups, story events)
/api/chat/query            →  n8n WF4  (sales agent Q&A)
/api/agent/analyze         →  n8n WF5  (autonomous follow-up agent)
  │
  ▼
Google Sheets (audit trail only — UI reads from webhook responses, not Sheets)
```

All AI calls happen inside n8n nodes. The Next.js app only sends and receives JSON — it never holds an OpenAI key.

### Mock mode

`MOCK_N8N=true` (default) makes every API route return deterministic fake data. The full demo runs on Vercel with zero n8n configuration. Set `false` to wire real workflows.

---

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The default `.env.local` has `MOCK_N8N=true` so no n8n setup is needed to run locally.

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

For Vercel deployment, add all of these under **Project Settings → Environment Variables**.

---

## Project structure

```
app/
  page.tsx                        # Single-page layout (Hero → Playground → Comms → CTA)
  api/
    leads/register/route.ts       # Proxies to n8n WF1
    simulate/next-day/route.ts    # Proxies to n8n WF2
    chat/query/route.ts           # Proxies to n8n WF4
    agent/analyze/route.ts        # Proxies to n8n WF5 (AgentAnalysis interface exported here)

components/
  Hero.tsx
  CTASection.tsx
  Playground/
    PlaygroundShell.tsx           # Orchestrates the simulator columns
    ConfigPanel.tsx               # Scoring weights + follow-up cadence sliders
    DayHeader.tsx                 # Day counter + "Next Day" button
    LeadRegistrationForm.tsx      # Lead intake form (min 3 leads to unlock Next Day)
    LeadList.tsx                  # Lead cards with score/status badges
    ActionFeed.tsx                # Chronological event feed
    ActionDetailModal.tsx         # Full detail view for any action
    SalesAgentChatPanel.tsx       # Autonomous follow-up agent + Q&A chat
  CommunicationLayer/
    CommunicationLayer.tsx
    ChannelPreviewCard.tsx
  ui/                             # Shared badge, modal, button primitives

lib/
  types.ts                        # All shared TypeScript types (Lead, Action, SimulatorConfig…)
  scoring.ts                      # Weighted score formula (budget × weight + intent × weight + timeline × weight)
  demoScript.ts                   # Per-lead deterministic story engine (seeded by lead ID hash)

store/
  simulatorStore.ts               # Zustand store: day, leads, actionsByDay, config, selectedLeadId

n8n-workflows/
  WF1-lead-capture.json
  WF2-next-day.json
  WF4-sales-agent.json
  WF5-follow-up-agent.json
  SETUP.md                        # Step-by-step n8n import + configuration guide
```

---

## Design system

Seven semantic colors — lead temperature drives the palette:

| Token | Hex | Used for |
|---|---|---|
| `paper` | `#FAF7F2` | Page background |
| `ink` | `#221F1A` | Primary text |
| `ember` | `#FF5A36` | Hot leads, hero accent |
| `amber` | `#FFB627` | Warm leads |
| `glacier` | `#3E7CB1` | Cold leads |
| `signal` | `#2F9E44` | Success / sent / system actions |
| `pulse` | `#7C5CFF` | AI-generated content (scores, drafts, agent panel) |

Fonts: Space Grotesk (display) · Inter (body/UI) · IBM Plex Mono (data/code)

---

## n8n workflows

See [`n8n-workflows/SETUP.md`](n8n-workflows/SETUP.md) for full import and configuration instructions.

| Workflow | Webhook path | What it does |
|---|---|---|
| WF1 Lead Capture | `/closeit/register-lead` | Deduplicates by email, writes to Sheets, chains into AI scoring |
| WF2 Next Day | `/closeit/next-day` | Fires onboarding emails, follow-ups, and story events for each lead |
| WF4 Sales Agent | `/closeit/chat-query` | Answers free-text questions about a lead's thread |
| WF5 Follow-up Agent | `/closeit/agent-analyze` | Analyzes thread, determines who has the ball, drafts the right message |

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

Weights are configurable live in the Config panel (must sum to 100).

---

## Simulator story engine

Each lead gets a deterministic story seeded by a hash of its ID — same lead always follows the same arc, but different leads behave differently. See [`lib/demoScript.ts`](lib/demoScript.ts).

- **Hot leads (≥7):** staff call on day +2, customer replies day +2–4, closes day +2 after reply
- **Warm leads (4–6):** staff call on day +3, 60% chance of reply, 50% of replies close
- **Cold leads (<4):** automated follow-ups only, moves to Nurture after `maxReminders` exhausted

---

## Deploying to Vercel

1. Push to a GitHub repo (or use Vercel CLI: `vercel --prod`)
2. Add all environment variables in Vercel dashboard
3. Set `MOCK_N8N=true` for a fully self-contained demo, or `false` to wire real n8n workflows
4. Deploy
