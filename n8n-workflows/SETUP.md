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
2. `WF2-next-day.json`
3. `WF4-sales-agent.json`
4. `WF5-follow-up-agent.json`

> **Note on WF3:** There is no separate WF3 file. Lead scoring (originally spec'd as WF3) is chained inline inside WF1 — immediately after saving the lead, WF1 calls OpenAI to compute the score and writes it back to Sheets before responding. This keeps registration synchronous: the frontend gets the scored lead in a single round trip.

---

## Step 4 — Configure each workflow after import

After importing, every workflow needs two things configured:

### A. Set your OpenAI API key

Find every **HTTP Request** node that calls OpenAI. Click the node → **Headers** → find the `Authorization` entry. Replace `PASTE_YOUR_OPENAI_KEY_HERE` with `Bearer sk-proj-YOUR_ACTUAL_KEY`.

Node names to look for:
- WF1: **"OpenAI Score Lead"**
- WF2: **"OpenAI Follow-up Draft"**
- WF4: **"OpenAI Chat"**
- WF5: **"OpenAI Analyze"**

### B. Select your Google Sheets credential

Any Google Sheets node will show a red warning about missing credentials.
Click the node → **Credentials** → select **"Google Sheets"**.

Google Sheets nodes per workflow:
- WF1: "Save to Leads Sheet" and "Update Score in Sheet"
- WF2: "Append to Activity Log"
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
1. Receives lead registration (name, email, phone, company, budget, timeline, intent signal)
2. Deduplicates by email in Sheets (append new, update existing)
3. Calls OpenAI to compute weighted lead score using the visitor's configured weights
4. Returns `{ lead: Lead }` with score and classification attached

### WF2 — Next Day Engine
1. Receives `{ day, leads, config }`
2. For each lead:
   - Day +1 from registration: sends onboarding email, scores lead, assigns rep
   - Scripted story events (customer replies, meetings, closes) fire on seeded days
   - Automated follow-ups fire on `nextReminderDay` if `remindersSent < maxReminders`
   - After `maxReminders` with no reply: moves lead to Nurture
3. Appends every action to Activity Log sheet
4. Returns `{ day, actions: Action[], leadUpdates: { [leadId]: Partial<Lead> } }`

### WF4 — Sales Agent Q&A
1. Receives `{ leadName, thread, question }`
2. Thread is the concatenated text of all actions for that lead (built client-side)
3. Calls OpenAI with the thread and question as context
4. Returns `{ answer: string }`

### WF5 — Follow-up Agent (Autonomous)
1. Receives `{ lead, thread }` — triggered automatically when a lead is selected
2. Calls OpenAI with a structured prompt asking it to:
   - Determine who has the ball: `"lead"` / `"staff"` / `"none"`
   - State the single most important next action
   - Write 2–3 sentences of reasoning
   - Draft the appropriate message (email to lead, or internal note to rep)
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
2. Click Next Day twice → should see onboarding email on Day 1, staff call on Day 2
3. Click Next Day until Day 4–5 → Hot lead should show a customer reply and meeting scheduled
4. Select the lead → agent panel should auto-analyze and show "Staff action needed" with a prep brief
5. Ask the agent "summarize this lead's thread" → should get a coherent AI response

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| 401 on all webhook calls | Wrong or missing `N8N_WEBHOOK_SECRET` |
| Workflow executes but Sheets not updated | Google Sheets credential not selected on the node |
| OpenAI node returns 401 | API key placeholder not replaced, or key revoked |
| Frontend shows mock data despite `MOCK_N8N=false` | `N8N_BASE_URL` missing or Vercel redeploy not triggered |
| Agent panel never loads analysis | `N8N_WEBHOOK_AGENT_ANALYZE` env var missing in Vercel |
