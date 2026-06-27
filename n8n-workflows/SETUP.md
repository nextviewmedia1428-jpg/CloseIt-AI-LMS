# n8n Workflow Setup — CloseIt

## Prerequisites

1. n8n running at https://n8n.srv1348908.hstgr.cloud
2. Google Sheets credential configured in n8n (Step 1 below)
3. Your OpenAI API key ready (never paste it into chat — enter it directly in n8n)

---

## Step 1 — Set up Google Sheets credential in n8n

1. Go to n8n → **Settings → Credentials → New**
2. Search for **Google Sheets OAuth2 API**
3. Enter your Google Cloud OAuth2 Client ID and Secret
   - Redirect URI must be: `https://n8n.srv1348908.hstgr.cloud/rest/oauth2-credential/callback`
4. Click **Connect** and authorise with your Google account
5. Name the credential **"Google Sheets"** (the workflow JSONs reference this exact name)

---

## Step 2 — Set up Google Sheet headers

Open your sheet: https://docs.google.com/spreadsheets/d/12jrapE2Qnmvb9DbVDnLVuAwnzgQOUnWEq9ESrOhXcdQ

**Tab: Leads** — Row 1 headers:
```
id | name | email | phone | company | source | budget | timeline_days | intent_signal | score | classification | status | reminders_sent | next_reminder_day | registered_on_day | last_action_day | thread_summary | assigned_rep | created_at
```

**Tab: Activity Log** — Row 1 headers:
```
lead_id | day | action_type | actor | summary | detail_json | timestamp
```

**Tab: Error Log** — Row 1 headers:
```
workflow | node | error_message | day | timestamp | resolved
```

---

## Step 3 — Import workflows

In n8n, go to **Workflows → Import from file** and import each JSON in order:

1. `WF1-lead-capture.json`
2. `WF2-next-day-v2.json`  ← **active file, not the old WF2-next-day.json**
3. `WF4-sales-agent.json`
4. `WF5-follow-up-agent.json`

> **Note on WF3:** There is no WF3 file. Lead scoring is chained inline inside WF1.
>
> **Note on WF2:** WF2 is currently being rebuilt manually in n8n. The JSON file (`WF2-next-day-v2.json`) contains the full intended node configuration. Read `WF2-DOCUMENTATION.md` for the complete spec before rebuilding.

---

## Step 4 — Configure each workflow after import

### A. Set your OpenAI API key

Find every **HTTP Request** node that calls OpenAI. Click the node → **Headers** → find the `Authorization` entry. Replace `PASTE_YOUR_OPENAI_KEY_HERE` with `Bearer sk-proj-YOUR_ACTUAL_KEY`.

**WF2 node names** (HTTP Request nodes calling OpenAI):
- **"OpenAI: Generate Leads"**
- **"OpenAI: Generate Lead Replies"**
- **"OpenAI: Generate Follow-ups & Nudges"**
- **"OpenAI: Initial Emails"**

**Other workflows:**
- WF1: **"OpenAI Score Lead"**
- WF4: **"OpenAI Chat"**
- WF5: **"OpenAI Analyze"**

### B. Select your Google Sheets credential

Any Google Sheets node will show a red warning about missing credentials.
Click the node → **Credentials** → select **"Google Sheets"**.

Google Sheets nodes per workflow:
- WF1: "Save to Leads Sheet" and "Update Score in Sheet"
- WF2: "Log to Sheets (Leads tab)" and "Write Activity Log"
- WF4: no Sheets node
- WF5: no Sheets node

---

## Step 5 — Activate all workflows

Toggle each workflow to **Active** (switch in top-right of the workflow editor).
The webhook URLs go live immediately upon activation.

---

## Step 6 — Switch the frontend to live mode

In Vercel dashboard → **Project Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `MOCK_N8N` | `false` |
| `N8N_BASE_URL` | `https://n8n.srv1348908.hstgr.cloud/webhook` |
| `N8N_WEBHOOK_REGISTER_LEAD` | `/closeit/register-lead` |
| `N8N_WEBHOOK_NEXT_DAY` | `/closeit/next-day` |
| `N8N_WEBHOOK_CHAT_QUERY` | `/closeit/chat-query` |
| `N8N_WEBHOOK_AGENT_ANALYZE` | `/closeit/agent-analyze` |
| `N8N_WEBHOOK_SECRET` | `closeit_secret_2026` |

Redeploy after saving.

---

## Webhook reference

| Workflow | Webhook path | Triggered by |
|---|---|---|
| WF1 Lead Capture | `/webhook/closeit/register-lead` | Lead registration form submit |
| WF2 Next Day | `/webhook/closeit/next-day` | "Next Day" button click |
| WF4 Sales Agent | `/webhook/closeit/chat-query` | Chat question in agent panel |
| WF5 Follow-up Agent | `/webhook/closeit/agent-analyze` | Lead selected in agent panel (auto) |

All requests include the header: `x-webhook-secret: closeit_secret_2026`

---

## What each workflow does

### WF1 — Lead Capture
1. Receives lead registration (name, email, company, budget, timeline, intent signal)
2. Deduplicates by email in Sheets (append new, update existing)
3. Calls OpenAI to compute weighted lead score
4. Returns `{ lead: Lead }` with score attached

### WF2 — Next Day Engine

> Full specification in **`WF2-DOCUMENTATION.md`**. Summary below.

Receives `{ day, closeItEnabled, leads, threads, tasks, scheduledLeads }`.

**21-node sequential chain. Each node reads prior nodes via `$('Node Name').first().json`.**

1. **Validate Secret** — 401 if header missing or wrong
2. **Parse State** — segments leads into action groups (auto-replies, follow-ups, post-discovery, post-MoM)
3. **Generate Leads** — creates 1–3 new B2B leads (cap: 30 active leads max)
4. **Generate Lead Replies** — simulates probabilistic replies from active leads
5. **Generate Follow-ups & Nudges** — writes 4 email types: auto_reply, pre_discovery_followup, post_discovery, post_mom
6. **Assemble Response** — merges all outputs, applies booking gate, priority-dedupes status updates
7. **Initial Emails** — writes day-0 outreach for new leads
8. **Log to Sheets** — writes leads + activity log rows

**Returns:**
```json
{
  "newLeads": [],
  "threadMessages": [],
  "statusUpdates": [],
  "scoreUpdates": [],
  "leadUpdates": [],
  "tasks": [],
  "taskUpdates": [],
  "agentActions": [],
  "notifications": []
}
```

**Key rules:**
- Status priority: `Discovery Booked(5) > Replied(4) > Awaiting Reply(3) > Contacted(2) > New(1)`
- Booking gate: `containsBookingSignal=true` + message threshold OR explicit booking keywords
- `momFollowUpSent: true` in taskUpdates prevents post-MoM email from re-firing
- Post-discovery: agent does NOT auto-reply; user nudge fires every day when lead message is last

### WF4 — Sales Agent Q&A
1. Receives `{ leadName, thread, question }`
2. Calls OpenAI with the thread and question as context
3. Returns `{ answer: string }`

### WF5 — Follow-up Agent (Autonomous)
1. Receives `{ lead, thread }` — triggered automatically when a lead is selected
2. Calls OpenAI to determine who has the ball and draft the right message
3. Returns `AgentAnalysis` JSON:
```json
{
  "pendingFrom": "lead" | "staff" | "none",
  "pendingAction": "string",
  "reasoning": "string",
  "draftMessage": {
    "to": "string",
    "recipientType": "lead" | "staff",
    "subject": "string",
    "body": "string"
  } | null
}
```

---

## Testing the setup

1. Register a lead with budget >$2000 and timeline ≤7 days → should score Hot (≥7)
2. Click Next Day twice → should see new leads arriving and initial emails sent
3. Continue clicking Next Day → watch lead replies arrive, follow-ups trigger, discovery calls book
4. After discovery call booked, enter MoM → next Next Day should send post-MoM email
5. Select a lead → agent panel should auto-analyze and show who has the ball

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| 401 on all webhook calls | Wrong or missing `N8N_WEBHOOK_SECRET` |
| Workflow executes but Sheets not updated | Google Sheets credential not selected on the node |
| OpenAI node returns 401 | API key placeholder not replaced, or key revoked |
| Frontend shows mock data despite `MOCK_N8N=false` | `N8N_BASE_URL` missing or Vercel redeploy not triggered |
| Agent panel never loads analysis | `N8N_WEBHOOK_AGENT_ANALYZE` env var missing in Vercel |
| WF2 returns empty/null response | Node using JSON body mode instead of Code+Raw pattern |
| WF2 Merge node errors | n8n Merge node v3 only accepts 2 inputs — use sequential chaining |
