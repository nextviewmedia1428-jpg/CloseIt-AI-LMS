@AGENTS.md

# CloseIt — Claude Code Context

## What this project is

A portfolio demo web app proving an AI-powered lead management and follow-up automation stack. Not a production CRM — built to win n8n automation freelance contracts on Upwork.

**Live:** https://closeit-topaz.vercel.app  
**Sprint:** Sprint 1 complete (Day 5 of 15). All portfolio pieces built.

---

## Architecture in one paragraph

Next.js 14 App Router frontend on Vercel. Visitor actions (register lead, advance day, chat with agent) POST to server-side API routes that proxy to n8n webhooks on Hostinger. n8n does all AI work (OpenAI gpt-4o-mini). Google Sheets is a write-only audit log — the UI never reads from it. `MOCK_N8N=true` makes every route return deterministic fake data so the demo runs fully on Vercel without n8n.

---

## Key files and what they own

| File | Owns |
|---|---|
| `lib/types.ts` | All shared types: Lead, Action, SimulatorConfig, LeadClassification, LeadStatus, ActionType, ActionActor |
| `lib/scoring.ts` | Weighted score formula. Budget tiers: <$500→3, $500–2000→6, >$2000→10. Intent: low/med/high→3/6/9. Timeline: ≤7d→10, ≤21d→6, >21d→3 |
| `lib/demoScript.ts` | Per-lead deterministic story engine. `seeded(leadId, salt)` → 0–1 float. Hot: closes in ~6 days. Warm: 60% reply, 50% close. Cold: nurture only |
| `store/simulatorStore.ts` | Zustand: day, leads, actionsByDay, config, selectedLeadId. `actionsForLead(leadId)` returns actions sorted asc by day |
| `app/api/agent/analyze/route.ts` | **Exports `AgentAnalysis` interface.** Mock branches on lead.status. WF5 proxy when `MOCK_N8N=false` |
| `components/Playground/SalesAgentChatPanel.tsx` | Auto-analyzes on lead selection, shows AgentAnalysis card + collapsible draft message + Q&A chat below |

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

## Design system

Colors defined in `app/globals.css` as `@theme inline` CSS variables:
- `paper` #FAF7F2 — background
- `ink` #221F1A — text
- `ember` #FF5A36 — Hot leads / hero accent
- `amber` #FFB627 — Warm leads
- `glacier` #3E7CB1 — Cold leads
- `signal` #2F9E44 — success / system actions
- `pulse` #7C5CFF — all AI-generated content

Use these as Tailwind classes: `bg-pulse`, `text-ember`, `border-glacier/20`, etc.

---

## Non-obvious constraints

- **`z.coerce.number()` breaks react-hook-form** — budget and timeline form fields use `z.string()` and are converted with `Number()` in `onSubmit`.
- **`actionsForLeadOnDay` takes 3 args only** — `(lead, day, config)`. No `allLeads` param — was removed in a refactor; don't add it back.
- **OpenAI key is never in any file** — workflow JSONs contain `PASTE_YOUR_OPENAI_KEY_HERE`. Always keep it that way.
- **Google Sheets spreadsheet ID:** `12jrapE2Qnmvb9DbVDnLVuAwnzgQOUnWEq9ESrOhXcdQ`
- **n8n base URL:** `https://n8n.srv1348908.hstgr.cloud`
- **STAFF_POOL** in `lib/types.ts`: `['Arjun', 'Priya', 'Sam']`

---

## n8n workflows (in `n8n-workflows/`)

| File | Webhook | Does |
|---|---|---|
| WF1-lead-capture.json | `/closeit/register-lead` | Capture, dedup by email, AI score |
| WF2-next-day.json | `/closeit/next-day` | Day engine: onboarding, follow-ups, story events |
| WF4-sales-agent.json | `/closeit/chat-query` | Q&A on lead thread |
| WF5-follow-up-agent.json | `/closeit/agent-analyze` | Autonomous: who has the ball + draft message |

Full setup guide: `n8n-workflows/SETUP.md`

---

## Status

| Component | Status |
|---|---|
| Frontend (all sections) | ✅ Complete |
| Lead scoring engine | ✅ Complete |
| Demo story engine | ✅ Complete |
| Sales Agent panel (upgraded to autonomous agent) | ✅ Complete |
| n8n WF1 Lead Capture | ✅ Complete |
| n8n WF2 Next Day Engine | ✅ Complete |
| n8n WF4 Sales Agent | ✅ Complete |
| n8n WF5 Follow-up Agent | ✅ Complete |
| Vercel deployment | ✅ Live |
| Loom demo video | 🟡 Clips built, ElevenLabs audio pending |
| n8n live mode wired (`MOCK_N8N=false`) | ⬜ Not done — do this before filming with real n8n |
