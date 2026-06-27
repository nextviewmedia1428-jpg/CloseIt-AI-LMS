@AGENTS.md

# CloseIt — Claude Code Context

## What this project is

A portfolio demo web app proving an AI-powered lead management and follow-up automation stack. Not a production CRM — built to win n8n automation freelance contracts on Upwork.

**Live:** https://closeit-topaz.vercel.app
**GitHub:** https://github.com/nextviewmedia1428-jpg/CloseIt-AI-LMS.git
**Sprint:** Sprint 2 in progress (Upwork profile + first proposals)

---

## Architecture in one paragraph

Next.js 14 App Router frontend on Vercel. Visitor actions (register lead, advance day, chat with agent) POST to server-side API routes that proxy to n8n webhooks on Hostinger. n8n does all AI work (OpenAI gpt-4o-mini). Google Sheets is a write-only audit log — the UI never reads from it. `MOCK_N8N=true` makes every route return deterministic fake data so the demo runs fully on Vercel without n8n.

---

## Key files and what they own

| File | Owns |
|---|---|
| `lib/types.ts` | All shared types — Lead, ThreadMessage, OpenTask, Notification, Action, SimulatorState |
| `lib/scoring.ts` | Weighted score formula. Budget tiers: <$500→3, $500–2000→6, >$2000→10. Intent: low/med/high→3/6/9. Timeline: ≤7d→10, ≤21d→6, >21d→3 |
| `lib/demoScript.ts` | Local fallback story engine used when n8n is unreachable. `seeded(leadId, salt)` → 0–1 float. |
| `store/simulatorStore.ts` | Zustand: day, leads, threadsByLead, tasks, notifications, actionsByDay. `nextDay()` calls n8n then applies `applyN8nResponse()`. Falls back to local mock if n8n unreachable. |
| `app/api/simulate/next-day/route.ts` | Proxies to n8n WF2. Merges array responses (deduplicates by ID) if n8n fires multiple times. |
| `app/api/agent/analyze/route.ts` | Exports `AgentAnalysis` interface. Mock branches on lead.status. WF5 proxy when `MOCK_N8N=false`. |
| `components/Playground/PlaygroundShell.tsx` | Orchestrates the entire 3-column simulator layout. Contains NavBar, LeadSidebar, ThreadPanel, AgentActionsPanel, MomPanel. |
| `components/Playground/SalesAgentChatPanel.tsx` | Auto-analyzes on lead selection, shows AgentAnalysis card + Q&A chat. |
| `n8n-workflows/WF2-DOCUMENTATION.md` | Full WF2 specification — input shape, node-by-node logic, output contract. Read this before touching WF2. |

---

## API routes

| Route | n8n Workflow | Env var for path |
|---|---|---|
| `POST /api/leads/register` | WF1 | `N8N_WEBHOOK_REGISTER_LEAD` |
| `POST /api/simulate/next-day` | WF2 | `N8N_WEBHOOK_NEXT_DAY` |
| `POST /api/chat/query` | WF4 | `N8N_WEBHOOK_CHAT_QUERY` |
| `POST /api/agent/analyze` | WF5 | `N8N_WEBHOOK_AGENT_ANALYZE` |

Secret header on all requests: `x-webhook-secret: closeit_secret_2026`

---

## Core data types (current — from lib/types.ts)

```ts
type LeadStatus =
  'New' | 'Contacted' | 'Awaiting Reply' | 'Replied' |
  'Discovery Booked' | 'Nurture' | 'Closed Won' | 'Closed Lost'

interface Lead {
  id: string                    // "n8n_lead_d{day}_{i}"
  name, email, company, industry: string
  startType: 'cold' | 'warm'
  inboundMessage?: string       // warm leads only
  intentSignal: 'low' | 'medium' | 'high'
  score: number                 // 0–10, starts at 6
  scoreDelta: number
  status: LeadStatus
  registeredOnDay: number
  replyFrequencyDays: number    // 2–3
  discoveryCallDay: number | null
  agentFollowUpCount: number    // max 6 before lead → Nurture
  lastAgentFollowUpDay: number | null
  agentNudgeCount: number
  lastAgentNudgeDay: number | null
}

interface ThreadMessage {
  id: string
  day: number
  from: 'agent' | 'lead' | 'user'
  body: string
  timestamp: string
}

interface OpenTask {
  leadId: string
  leadName, company: string
  callDay: number
  status: 'pending' | 'completed'
  mom?: string
  momFollowUpSent?: boolean     // false after MoM saved, true after post-MoM email sent
}

type Notification = {
  id, message: string
  day: number
  type: 'lead_arrived' | 'score_critical' | 'call_booked' | 'closed_won' | 'closed_lost' | 'lead_replied'
  read: boolean
}
```

---

## Design system

Colors defined in `app/globals.css` as `@theme inline` CSS variables:
- `paper` #FAF7F2 — background
- `ink` #221F1A — text
- `ember` #FF5A36 — Hot leads, hero accent, user nudges
- `amber` #FFB627 — Warm leads, open tasks
- `glacier` #3E7CB1 — Cold leads
- `signal` #2F9E44 — success / system actions / agent emails
- `pulse` #7C5CFF — AI-generated content (scores, drafts, agent panel)

Use as Tailwind classes: `bg-pulse`, `text-ember`, `border-glacier/20`, etc.

---

## Non-obvious constraints

- **`z.coerce.number()` breaks react-hook-form** — budget and timeline form fields use `z.string()` and are converted with `Number()` in `onSubmit`.
- **OpenAI key never in any file** — workflow JSONs contain `PASTE_YOUR_OPENAI_KEY_HERE`. Keep it that way.
- **n8n Merge node v3 only accepts 2 inputs** — use sequential chaining, not parallel branches feeding into a Merge node.
- **All OpenAI HTTP nodes use Code+Raw pattern** — Code node builds `JSON.stringify(body)`, HTTP node uses `specifyBody: raw`, `rawBody: ={{ $json.body }}`. Do not use JSON body mode.
- **Respond node** — use `={{ $('Node Name').first().json }}` directly, no `JSON.stringify()` wrapper.
- **applyN8nResponse status merge is priority-based** — `Discovery Booked(5) > Replied(4) > Awaiting Reply(3) > Contacted(2) > New(1)`. Higher priority wins per leadId.
- **Thread message IDs** assigned by frontend as `n8n_{leadId}_{day}_{from}_{idx}`.
- **Google Sheets spreadsheet ID:** `12jrapE2Qnmvb9DbVDnLVuAwnzgQOUnWEq9ESrOhXcdQ`
- **n8n base URL:** `https://n8n.srv1348908.hstgr.cloud`
- **next-day route merges array responses** — if n8n fires multiple times (rapid clicks), `route.ts` deduplicates by ID across all items before returning to the store.

---

## n8n workflows

| File | Webhook | Status | Does |
|---|---|---|---|
| WF1-lead-capture.json | `/closeit/register-lead` | ✅ Built | Capture, dedup by email, AI score |
| WF2-next-day-v2.json | `/closeit/next-day` | 🔴 Needs rebuild | Day engine — see WF2-DOCUMENTATION.md |
| WF4-sales-agent.json | `/closeit/chat-query` | ✅ Built | Q&A on lead thread |
| WF5-follow-up-agent.json | `/closeit/agent-analyze` | ✅ Built | Autonomous: who has the ball + draft message |

**WF2 is being rebuilt manually.** Full specification in `n8n-workflows/WF2-DOCUMENTATION.md`.

---

## Playground layout (3 columns)

```
┌─────────────────┬──────────────────────────┬──────────────────┐
│  Lead Sidebar   │      Thread Panel        │  Right Panel     │
│  (w-[248px])    │      (flex-1)            │  (w-[272px])     │
│                 │                          │                  │
│  Lead cards     │  Selected lead thread    │  Agent actions   │
│  sorted by      │  + compose box           │  (h-40, scroll)  │
│  score desc     │  + MoM task banner       │                  │
│                 │                          │  User nudges     │
│                 │                          │  (h-40, scroll)  │
│                 │                          │                  │
│                 │                          │  Open tasks      │
│                 │                          │                  │
│                 │                          │  Session stats   │
└─────────────────┴──────────────────────────┴──────────────────┘
```

**User nudges panel** shows today's `lead_replied` notifications — fires every day when a Discovery Booked lead has replied and user hasn't responded.

---

## Agent behaviour (pre vs post discovery)

**Pre-discovery (agent fully autonomous):**
- Sends initial outreach email (cold) or responds to inbound (warm)
- Auto-replies to lead messages next day (direct answer, no booking pitch)
- Sends follow-up emails every 2+ days when lead goes quiet (max 6)
- Pitches discovery call naturally after 2–3 message rounds

**Post-discovery (user takes over):**
- Agent does NOT auto-reply to leads
- User nudge fires every day until user responds (no day gate)
- Agent sends email to lead if user/agent has been quiet ≥ 2 days
- After user enters MoM → agent sends post-call follow-up email once

---

## Status

| Component | Status |
|---|---|
| Frontend (all sections) | ✅ Complete |
| Lead scoring (in-browser) | ✅ Complete |
| Local fallback story engine | ✅ Complete |
| Sales Agent panel | ✅ Complete |
| WF1 Lead Capture | ✅ Complete |
| WF2 Next Day Engine | 🔴 Needs manual rebuild in n8n |
| WF4 Sales Agent | ✅ Complete |
| WF5 Follow-up Agent | ✅ Complete |
| Vercel deployment | ✅ Live |
| n8n live mode (`MOCK_N8N=false`) | ⬜ Pending WF2 rebuild |
| Loom demo video | 🟡 Clips built, ElevenLabs audio pending |
