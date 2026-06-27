# WF2 — Next Day Engine: Complete Documentation

## Purpose

Triggered when the user clicks "Next Day" in the simulator. Receives the full current state from the frontend, processes everything that should happen that day (lead replies, follow-ups, scoring, new leads), and returns a structured response the frontend applies to its state.

---

## Input (POST body from frontend)

```json
{
  "day": 5,
  "closeItEnabled": true,
  "leads": [ ...Lead[] ],
  "threads": { "leadId": [ ...ThreadMessage[] ] },
  "tasks": [ ...OpenTask[] ],
  "scheduledLeads": []
}
```

### Lead object shape (what frontend sends)
```json
{
  "id": "n8n_lead_d3_0",
  "name": "Ava Smith",
  "company": "TechCorp",
  "industry": "SaaS/Analytics",
  "email": "ava@techcorp.com",
  "startType": "warm",
  "intentSignal": "high",
  "replyFrequencyDays": 2,
  "inboundMessage": "Hi, I saw your platform...",
  "score": 7,
  "scoreDelta": 0,
  "status": "Awaiting Reply",
  "registeredOnDay": 3,
  "agentFollowUpCount": 1,
  "lastAgentFollowUpDay": 4,
  "discoveryCallDay": null
}
```

### ThreadMessage shape
```json
{
  "id": "n8n_leadId_day_from_idx",
  "from": "lead" | "agent" | "user",
  "body": "Message text",
  "day": 4,
  "timestamp": "ISO string"
}
```

### OpenTask shape
```json
{
  "leadId": "n8n_lead_d3_0",
  "leadName": "Ava Smith",
  "company": "TechCorp",
  "callDay": 6,
  "status": "pending" | "completed",
  "mom": "Notes from the call...",
  "momFollowUpSent": false
}
```

---

## Node-by-Node Flow

```
Webhook
  └─ Validate Secret (IF)
       ├─ FAIL → Reject (respondToWebhook, 401)
       └─ PASS → Parse State
                    └─ Prep Generate Leads Body
                         └─ OpenAI: Generate Leads
                              └─ Process New Leads
                                   └─ Prep Lead Replies Body
                                        └─ OpenAI: Generate Lead Replies
                                             └─ Prep Follow-ups Body
                                                  └─ OpenAI: Generate Follow-ups & Nudges
                                                       └─ Assemble Response
                                                            └─ Prep Initial Email Body
                                                                 └─ OpenAI: Initial Emails
                                                                      └─ Merge Initial Emails
                                                                           ├─ Prep Log Rows
                                                                           │    └─ Write Activity Log (Sheets)
                                                                           └─ Log to Sheets (Leads tab)
                                                                                └─ Respond (respondToWebhook)
```

All nodes run **sequentially**. Later nodes read earlier nodes via `$('Node Name').first().json`.

---

## What Each Node Does

### 1. Parse State
**Reads:** `body.day`, `body.leads`, `body.threads`, `body.tasks`, `body.closeItEnabled`

**Computes and exposes (all used by later nodes):**

| Variable | What it is |
|---|---|
| `day` | Current day number |
| `closeItEnabled` | Whether agent is active |
| `leads` | Full leads array (pass-through) |
| `threads` | All threads keyed by leadId (pass-through) |
| `tasks` | All tasks (pass-through) |
| `existingNames` | lowercase name list (dedup check) |
| `existingEmails` | lowercase email list (dedup check) |
| `existingCompanies` | lowercase company list (dedup check) |
| `activeLeads` | Leads with status in [Contacted, Awaiting Reply, Replied, Discovery Booked] |
| `replyingLeads` | Leads selected to reply today (random probability gate) |
| `preDiscoveryAutoReplies` | Pre-discovery leads where lead spoke last, >= 1 day ago → agent replies directly |
| `preDiscoveryFollowUps` | Pre-discovery leads gone quiet >= 2 days → follow-up email |
| `postDiscoveryNudgeLead` | Discovery Booked leads where last message >= 2 days ago → email to lead |
| `postDiscoveryNudgeUser` | Discovery Booked leads where last message is from lead → notify user (no day gate) |
| `postMomLeads` | Leads with completed task and `momFollowUpSent === false` → send post-MoM email |

**Selection rules for `replyingLeads`:**
- Status must be in ACTIVE_STATUSES
- Status ≠ Discovery Booked, Replied
- Last thread message is NOT from lead (it's their turn to reply)
- Random probability: high intent = 70%, medium = 40%, low = 15%

---

### 2. Prep Generate Leads Body → OpenAI: Generate Leads → Process New Leads

**Generates 1–3 new B2B leads per day.**

**Cap:** If `leads.filter(l => !['Closed Won','Closed Lost'].includes(l.status)).length >= 30`, skip generation (return empty array).

**OpenAI prompt (system):**
> You generate realistic B2B leads for a CRM automation demo. Return ONLY a valid JSON array, no markdown.

**OpenAI prompt (user):**
> Generate {count} B2B leads with: name, company, industry (one of 10 options), email, startType (cold 70%/warm 30%), intentSignal (high 30%/medium 40%/low 30%), replyFrequencyDays (2–3), inboundMessage (if warm). Exclude existing names.

**Process New Leads deduplication:**
- Filters out leads matching existing name, email, or company
- Assigns id: `n8n_lead_d${day}_${i}`
- Sets initial fields: `score: 6`, `status: 'New'`, `agentFollowUpCount: 0`, etc.

---

### 3. Prep Lead Replies Body → OpenAI: Generate Lead Replies

**Simulates lead responses for `replyingLeads`.**

**Data passed per lead:**
- `id`, `name`, `company`, `industry`, `intentSignal`, `startType`
- `leadMsgCount` — how many times this lead has replied so far (counted from thread)
- `thread` — full conversation history as `[FROM] body` text

**OpenAI prompt (system):**
> You simulate realistic B2B sales emails FROM leads evaluating CloseIt. You ARE the lead replying.
> - leadMsgCount 0: Show genuine interest, ask 1-2 questions. containsBookingSignal=false.
> - leadMsgCount 1: Share a pain point/constraint. containsBookingSignal=false.
> - leadMsgCount 2 (warm only): Engage, can express interest in demo. containsBookingSignal may be true if you use booking language.
> - leadMsgCount 3+ (any): If intent medium/high, agree to meet. containsBookingSignal=true only on explicit agreement.
> - Low intent: Always one question more before committing.
> Under 80 words. Return JSON array.

**Returns:** `[{ "leadId": "...", "replyText": "...", "containsBookingSignal": true/false }]`

---

### 4. Prep Follow-ups Body → OpenAI: Generate Follow-ups & Nudges

**Writes 4 types of agent emails:**

**Leads included:** `[...preDiscoveryAutoReplies, ...preDiscoveryFollowUps, ...postDiscoveryNudgeLead, ...postMomLeads]`

**Data passed per lead:**
- `id`, `type`, `name`, `company`, `industry`, `intentSignal`
- `followUpNum` = `agentFollowUpCount + 1`
- `daysSinceLastMessage`
- `leadSharedSoFar` — all lead messages joined
- `momText` — MoM notes (for post_mom type)
- `thread` — full conversation

**OpenAI prompt (system):**
> You are CloseIt, an AI sales assistant writing emails on behalf of a salesperson.
>
> **auto_reply** (PRE-DISCOVERY only): Directly answer the lead's question. Add one CloseIt insight. Ask one follow-up. No booking pitch yet. Under 80 words.
>
> **pre_discovery_followup**: Reference something specific from thread. Summarise their need. Propose 20-min discovery call. followUpNum 1 = warm curiosity, 2+ = mild urgency. Under 90 words.
>
> **post_discovery**: Lead went quiet after discovery. Re-engage. Reference call/discussion. Ask easy question. Under 70 words.
>
> **post_mom**: Call happened. Thank for call. Summarise 1-2 MoM points. Propose next step. Under 100 words.

**Returns:** `[{ "leadId": "...", "type": "auto_reply|pre_discovery_followup|post_discovery|post_mom", "emailBody": "..." }]`

---

### 5. Assemble Response

**The main logic node. Reads from all three OpenAI nodes and assembles the final response.**

Builds the following arrays:

**`threadMessages`** — all messages to add to threads today:
- Warm lead inbound messages (from lead, day of arrival)
- AI-simulated lead replies (from lead)
- Agent follow-up/auto-reply emails (from agent)
- Initial outreach emails (added in Merge Initial Emails)

**`statusUpdates`** — status changes, deduplicated by priority:
```
Discovery Booked (5) > Replied (4) > Awaiting Reply (3) > Contacted (2) > New (1)
```
Higher priority always wins. One update per leadId.

**`leadUpdates`** — counter updates:
- `agentFollowUpCount`: incremented each time agent sends follow-up
- `lastAgentFollowUpDay`: set to today

**`taskUpdates`** — task field updates:
- `momFollowUpSent: true` when post_mom email is sent (prevents repeat firing)

**`tasks`** — new tasks created today:
- Created when discovery call is booked
- Shape: `{ leadId, leadName, company, callDay }`

**`scoreUpdates`** — recalculated for all active leads:
```
base: 6
+ intentScore (keyword hits in lead messages: +max 4)
+ recencyPenalty (days since last lead message: -max 3)
+ freqBonus (replying more than expected: +max 2)
+ callBonus (Discovery Booked: +2)
= clamped to 0–10
```

**`agentActions`** — feed entries for the UI:
- Types used: `initial_email_sent`, `discovery_call_booked`, `lead_replied`
- Each has: `id`, `day`, `type`, `leadId`, `leadName`, `summary`, `actor`, `detail`, `timestamp`

**`notifications`** — toast/bell notifications:
- `lead_arrived`: new lead today
- `call_booked`: discovery call scheduled
- `lead_replied`: lead replied post-discovery (triggers user nudge panel)
- `score_critical`: lead score dropped below 4

**Booking gate:**
```javascript
const hasBookingKeyword = /(schedule|book a call|let's call|let's talk|let's meet|when can we|what time|sounds good|absolutely|yes let|i'd like to)/i.test(replyText);
const canBook = (containsBookingSignal && existingLeadMsgs >= minMsgsToBook) || hasBookingKeyword;
// minMsgsToBook: warm=2, cold=3
```

---

### 6. Prep Initial Email Body → OpenAI: Initial Emails → Merge Initial Emails

**Writes initial outreach/response emails for all new leads.**

**OpenAI prompt (system):**
> You are CloseIt. Write first outreach emails. Under 80 words. Return JSON array.

**OpenAI prompt (user):**
> Cold leads: introduce CloseIt, mention their industry, ask one hook question.
> Warm leads: acknowledge their inbound message and ask 4 discovery questions (budget, timeline, current tooling, main pain point).

**Returns:** `[{ "leadId": "...", "emailBody": "..." }]`

**Merge Initial Emails** adds these to final result:
- Cold leads: `status → Contacted`, thread gets agent message
- Warm leads: thread gets agent message (status already `Replied` from inbound)

---

### 7. Log to Sheets + Write Activity Log

Writes audit trail to Google Sheets (Spreadsheet ID: `12jrapE2Qnmvb9DbVDnLVuAwnzgQOUnWEq9ESrOhXcdQ`):
- **Leads tab**: New lead rows
- **Activity Log tab**: All threadMessages and agentActions from today

---

## ✅ Final Response (WF2 Output — what the frontend expects)

This is the exact JSON shape the `Respond` node must return. **All fields are required** (can be empty arrays, not null/undefined).

```json
{
  "newLeads": [
    {
      "id": "n8n_lead_d5_0",
      "name": "string",
      "company": "string",
      "industry": "string",
      "email": "string",
      "startType": "cold" | "warm",
      "intentSignal": "low" | "medium" | "high",
      "replyFrequencyDays": 2,
      "inboundMessage": "string or null",
      "score": 6,
      "scoreDelta": 0,
      "status": "New",
      "registeredOnDay": 5,
      "agentFollowUpCount": 0,
      "lastAgentFollowUpDay": null,
      "discoveryCallDay": null
    }
  ],

  "threadMessages": [
    {
      "leadId": "n8n_lead_d3_0",
      "from": "lead" | "agent" | "user",
      "body": "Message text",
      "day": 5
    }
  ],

  "statusUpdates": [
    {
      "leadId": "n8n_lead_d3_0",
      "status": "New" | "Contacted" | "Awaiting Reply" | "Replied" | "Discovery Booked" | "Nurture" | "Closed Won" | "Closed Lost",
      "discoveryCallDay": 6
    }
  ],

  "scoreUpdates": [
    {
      "leadId": "n8n_lead_d3_0",
      "score": 7,
      "delta": 1
    }
  ],

  "leadUpdates": [
    {
      "leadId": "n8n_lead_d3_0",
      "agentFollowUpCount": 2,
      "lastAgentFollowUpDay": 5
    }
  ],

  "tasks": [
    {
      "leadId": "n8n_lead_d3_0",
      "leadName": "Ava Smith",
      "company": "TechCorp",
      "callDay": 6
    }
  ],

  "taskUpdates": [
    {
      "leadId": "n8n_lead_d3_0",
      "momFollowUpSent": true
    }
  ],

  "agentActions": [
    {
      "id": "act_5_init_n8n_lead_d5_0",
      "day": 5,
      "type": "initial_email_sent" | "discovery_call_booked" | "lead_replied",
      "leadId": "n8n_lead_d5_0",
      "leadName": "Ava Smith",
      "summary": "One-line description shown in feed",
      "actor": "ai" | "lead" | "system",
      "detail": {},
      "timestamp": "2026-06-28T14:00:00.000Z"
    }
  ],

  "notifications": [
    {
      "type": "lead_arrived" | "call_booked" | "lead_replied" | "score_critical",
      "message": "Human-readable message"
    }
  ]
}
```

---

## Key Rules the Frontend Enforces

1. **Status priority dedup** — if multiple statusUpdates for same lead, highest priority wins:
   `Discovery Booked(5) > Replied(4) > Awaiting Reply(3) > Contacted(2) > New(1)`

2. **leadUpdates are field-merged** — spread onto lead, preserving all other fields

3. **taskUpdates update existing tasks** — `momFollowUpSent: true` prevents post-MoM email firing again next day

4. **threadMessages are appended** — not replaced. ID auto-assigned by frontend as `n8n_{leadId}_{day}_{from}_{idx}`

5. **newLeads are deduped by id** — safe to include leads already in state (frontend skips them)

6. **Notifications get day + id** — frontend adds `id: n8n_notif_{day}_{idx}` and `day: newDay`

7. **User nudge panel** shows only `type: lead_replied` notifications from today's day

---

## Status Lifecycle

```
New
 └─ Contacted      (cold lead: initial email sent)
      └─ Awaiting Reply   (agent sent follow-up or auto-reply)
           └─ Replied           (lead sent a message)
                └─ Discovery Booked   (lead explicitly agreed to call)
                     └─ [user enters MoM] → post-MoM email sent
                          └─ ... (ongoing post-call engagement)

At any point:
 → Nurture    (6 follow-ups exhausted, no response)
 → Closed Won (user marks won)
 → Closed Lost (user marks lost)
```

---

## Webhook Details

- **URL:** `https://n8n.srv1348908.hstgr.cloud/webhook/closeit/next-day`
- **Method:** POST
- **Header:** `x-webhook-secret: closeit_secret_2026`
- **Content-Type:** `application/json`
- **Timeout:** 55 seconds (frontend will fall back to mock on timeout)
