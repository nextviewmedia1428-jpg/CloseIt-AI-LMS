# CloseIt — Project Specification & Implementation Record

**Last updated:** 2026-06-28 (Sprint 1 complete - merged closeit + closeit2.0)

---

## 1. What This Project Is

CloseIt is a **demo/portfolio web app** built to win freelance n8n automation contracts on Upwork. It proves that a full lead-gen automation stack (lead generation → AI scoring → follow-up sequencing → call scheduling → sales meeting workflow) can be built on n8n + OpenAI + Google Sheets.

**Live URL:** https://closeit-topaz.vercel.app

The app has three core sections:
1. **Hero** — pitch the value proposition
2. **Business Simulator** — interactive playground where visitors click "Next Day" to advance a simulated 12-day sequence. Each day fires n8n webhooks that generate leads, simulate replies, score threads by AI, and schedule discovery calls in real time.
3. **Communication Layer + CTA** — show generated messages and final call-to-action

**Nothing sends real messages.** All communication is simulated inside the thread view.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16.2.9 (App Router), TypeScript | Single page at `/` with sections |
| Styling | Tailwind CSS 4 + CSS variables | 7-colour design system |
| State | Zustand | Single in-memory store, no persistence |
| AI | OpenAI gpt-4o-mini | Called only from n8n, never from Next.js |
| Automation | n8n self-hosted on Hostinger | Two active workflows |
| Database | Google Sheets | Audit log only |
| Hosting | Vercel | Deployed from GitHub |
| Auth | None | Single public demo |

---

## 3. Architecture

```
Single-page app (Hero → Playground → Communications → CTA)
    ↓
Next.js API route /api/simulate/next-day
    ↓
n8n webhook (Hostinger)
    ├── closeit/next-day (CloseIt ON — full AI)
    └── closeit/next-day-manual (CloseIt OFF — manual mode)
    ↓
Google Sheets (audit trail only)
```

**Key decision:** Frontend reads only the **synchronous JSON webhook response**. Google Sheets is a backstage audit trail for credibility, not a data source.

---

## 4. Data Models (`lib/types.ts`)

### Lead

```typescript
interface Lead {
  lead_id: string;
  name: string;
  company: string;
  industry: string;
  email: string;
  startType: 'cold' | 'warm';
  replyFrequencyDays: number;
  inboundMessage: string | null;
  // Populated after scoring:
  classification?: 'Hot' | 'Warm' | 'Cold';
  final_score?: number;      // 0–10
  intent_score?: number;
  recency_score?: number;
  rationale?: string | null;
  callScheduled?: 'Y' | 'N';
  callDay?: string | null;   // "Day 7"
}
```

### ThreadMessage

```typescript
interface ThreadMessage {
  id: string;
  day: number;
  from: string;  // lead name, 'Agent', or 'User'
  body: string;
  timestamp: string;
}
```

### ScheduledCall

```typescript
interface ScheduledCall {
  lead_id: string;
  lead_name: string;
  company: string;
  callDay: number;
  callDayLabel: string;
  scheduledOnDay: number;
  bossSummary?: string;   // AI-generated thread summary
  completed?: boolean;
}
```

---

## 5. Simulator Lifecycle

### Constants

```typescript
SIMULATION_MAX_DAYS = 12     // User can advance up to 12 days
SIMULATION_MAX_SECONDS = 1800 // 30 minutes wall-clock time
```

### Timer

- Starts on first "Next Day" click
- Counts down from 30:00
- When `secondsLeft === 0`: simulation ends, final score is computed

### Day cap

- After `handleNextDay` receives response: if `newDay >= 12` → `endSimulation(score)`

### Lead cap

- Checked in n8n `Prepare Lead Gen Prompt`: if `totalLeads >= 30`, returns trivial prompt (no malformed OpenAI request)

### Meeting gate

- When pending calls exist for today: "Next Day" button replaced by "📞 Complete Meetings"
- MeetingModal must be completed before day can advance

---

## 6. Zustand Store (`store/simulatorStore.ts`)

### State shape

```typescript
{
  day: number;
  leads: Lead[];
  threads: Record<lead_id, ThreadMessage[]>;
  config: SimulatorConfig;
  selectedLeadId: string | null;
  closeItEnabled: boolean;        // ON = AI replies, OFF = manual
  reminders: UserReminder[];
  userMessages: UserMessage[];
  scheduledCalls: ScheduledCall[];
  selectedCalendarDay: number | null;
  meetingModalDay: number | null;
  morningBrief: MorningBriefData | null;
  timerStartedAt: number | null;  // Date.now() on first Next Day
  simulationEnded: boolean;
  endScore: EndScore | null;
}
```

### Key actions

- `addLeads(newLeads, newThreads)` — merges by `lead_id`
- `addThreadMessage(leadId, msg)` — appends message to thread
- `toggleCloseIt()` — switches between AI and manual mode
- `markCallCompleted(leadId)` — marks call done
- `endSimulation(score)` — triggers final screen
- `resetSimulation()` — back to Day 0

---

## 7. Playground Layout (3 columns)

```
┌──────────────┬─────────────────────────┬──────────────┐
│   Sidebar    │   ThreadPanel           │   RightPanel │
│ (lead list)  │ (active thread + compose)│ (stats/calls)│
└──────────────┴─────────────────────────┴──────────────┘
```

**Navbar** — Day counter (X/12), 30-min timer, "Next Day" button, CloseIt toggle, notifications bell.

**Sidebar** — Lead cards, sorted by classification (Hot/Warm/Cold), selected state highlighted in violet.

**ThreadPanel** — Messages from agent, user, and leads; compose textarea (`Enter` to send, `Shift+Enter` for newlines).

**RightPanel** — Three sections:
- Agent Actions (what the AI did yesterday)
- Action Required (manual tasks if CloseIt OFF, or boss messages if CloseIt ON)
- Stats (leads, calls, user/agent action count)

**CalendarView** — Horizontal strip showing call days.

**MeetingModal** — Tabbed by lead; complete calls before advancing day.

**MorningBrief** — Summary after each successful day advance.

**SimulationEnd** — Final score screen with grade.

---

## 8. CloseIt ON vs OFF Mode

### CloseIt ON (full AI)

- Agent generates replies (simulating lead responses per n8n prompt rules)
- Agent sends follow-ups every 2+ days when lead goes quiet
- Agent proposes meeting days
- `userMessages` shows AI-drafted nudges for the user

### CloseIt OFF (manual mode)

- Only lead replies are simulated; no agent follow-ups generated
- Sidebar shows `useManualActionGroups()` — a client-side breakdown of what the user needs to do manually
- `userMessages` is empty; user sees their own action requirements

---

## 9. API Route (`app/api/simulate/next-day/route.ts`)

```typescript
POST /api/simulate/next-day

Body:
{
  "day": number,
  "leads": Lead[],
  "threads": Record<lead_id, ThreadMessage[]>,
  "closeItEnabled": boolean,
  "totalLeads": number,
  ...other state
}

Response:
{
  "day": number,
  "leads": Lead[],
  "threads": Record<lead_id, ThreadMessage[]>,
  "userMessages": UserMessage[],
  "scheduledCalls": ScheduledCall[]
}
```

The route routes to the correct n8n webhook based on `closeItEnabled` (secret stripped before forwarding to n8n).

---

## 10. n8n Workflows

| File | Webhook | Mode |
|---|---|---|
| `My workflow.json` | `closeit/next-day` | CloseIt ON (full AI) |
| `My workflow 5.json` | `closeit/next-day-manual` | CloseIt OFF (manual only) |

Base URL: `https://n8n.srv1348908.hstgr.cloud/webhook`

Both workflows:
1. Generate 1–3 new leads per day
2. Simulate lead replies (if they're ready to respond)
3. Rate threads by AI (score, classification, call scheduling decision)
4. Generate follow-ups / nudges (ON only)
5. Return JSON to Next.js

---

## 11. Design System

**Colors** — defined in `app/globals.css` as CSS variables:

- `--bg` #FAF7F2 — page background (Paper)
- `--text` #221F1A — primary text (Ink)
- `--ember` #FF5A36 — Hot leads, danger, alerts
- `--amber` #FFB627 — Warm leads, caution
- `--glacier` #3E7CB1 — Cold leads
- `--signal` #2F9E44 — success, user actions (green)
- `--pulse` #7C5CFF — AI-generated, selected state (violet)

Each colour has `-soft` (background tint) and `-border` variants.

**Typography:**

- Display: Space Grotesk (`font-display`)
- Body: Inter (default `font-sans`)
- Mono: IBM Plex Mono (`font-mono`)

**Signature element:** Signal Bar gradient (Ember → Amber → Glacier), used in Hero section.

---

## 12. File Structure

```
app/
  globals.css                   CSS variables + Tailwind directives
  layout.tsx                    Root layout, font imports
  page.tsx                      Hero → Playground section → Communications → CTA
  api/simulate/next-day/route.ts  Server proxy to n8n

components/
  Hero.tsx                      Hero pitch section
  Playground/
    Navbar.tsx                  Day counter, timer, Next Day button
    Sidebar.tsx                 Lead list with badges
    ThreadPanel.tsx             Active lead thread + compose
    RightPanel.tsx              Stats, agent actions, action required
    CalendarView.tsx            Horizontal call calendar
    MeetingModal.tsx            Tabbed call completion
    MorningBrief.tsx            Post-day summary
    SimulationEnd.tsx           Final score screen
  CommunicationLayer/
    CommunicationLayer.tsx      Message preview cards
    ChannelPreviewCard.tsx      Individual channel card
  CTASection.tsx                Final CTA section
  ui/
    Badge.tsx                   Classification, score badges
    SignalBar.tsx               Gradient bar component
    Modal.tsx                   Shared modal primitive

lib/
  types.ts                      TypeScript interfaces
  demoScript.ts                 (Empty — data from n8n)

store/
  simulatorStore.ts             Zustand store (in-memory, no persistence)
```

---

## 13. Environment Variables

`.env.local`:
```
N8N_BASE_URL=https://n8n.srv1348908.hstgr.cloud/webhook
N8N_WEBHOOK_NEXT_DAY=/closeit/next-day
N8N_WEBHOOK_NEXT_DAY_MANUAL=/closeit/next-day-manual
N8N_WEBHOOK_SECRET=closeit_secret_2026
```

The secret is checked by n8n on every webhook call.

---

## 14. Deployment

**Vercel:**
- Project: closeit-topaz
- Repo: GitHub (nextviewmedia1428-jpg)
- Branch: main
- Auto-deployed on push

**n8n:**
- Hostinger self-hosted
- Base URL: `https://n8n.srv1348908.hstgr.cloud`
- Workflows updated manually via n8n UI

---

## 15. Session-Only State (No Persistence)

All data lives in Zustand in-memory. On page reload:
- Everything resets to Day 0
- No localStorage, no cookies for simulator state
- Google Sheets audit log survives (n8n-side only)
- This is intentional: each visitor gets a fresh simulation

---

## 16. Status

| Component | Status |
|---|---|
| Frontend (all sections) | ✅ Complete |
| Playground (merged from closeit2.0) | ✅ Complete |
| Design system (closeit branding) | ✅ Complete |
| Store (12-day cap) | ✅ Complete |
| API route | ✅ Complete |
| Vercel deployment | ✅ Live |
| n8n workflows | ✅ Working |
| Loom demo video | 🟡 Pending |

---

## 17. Known Gaps / Open Items

- ~~Playground layout~~ ✅ Merged
- ~~Design system integration~~ ✅ Integrated
- Config panel (scoring weights) — currently hardcoded, not user-editable in UI
- localStorage persistence — intentionally skipped (session-only by design)
- Error handling for n8n timeouts — falls back to store state
- Loom demo video — to be recorded

---

## 18. How to Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

The app will try to hit n8n on the first "Next Day" click. If n8n is down, falls back to mock responses.

---

## 19. How to Deploy to Vercel

```bash
git add .
git commit -m "Merge closeit2.0 playground into closeit UI"
git push origin main
# Vercel auto-deploys
```

View live: https://closeit-topaz.vercel.app

---

*Merged by Claude Code on 2026-06-28. closeit (Hero/CTA/CommsLayer) + closeit2.0 (Playground). Session-only state, 12-day simulator cap, OpenAI-powered n8n workflows.*
