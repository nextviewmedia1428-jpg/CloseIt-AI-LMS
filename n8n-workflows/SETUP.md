# n8n Workflow Setup — CloseIt

## Prerequisites
1. n8n running at https://n8n.srv1348908.hstgr.cloud
2. Google Sheets credential configured in n8n (see Step 1)
3. Your new OpenAI API key ready

---

## Step 1 — Set up Google Sheets credential in n8n

1. Go to n8n → **Settings → Credentials → New**
2. Search for **Google Sheets OAuth2 API**
3. Enter your Google Cloud OAuth2 Client ID and Secret
   - Redirect URI must be: `https://n8n.srv1348908.hstgr.cloud/rest/oauth2-credential/callback`
4. Click **Connect** and authorise with your Google account
5. Note the **credential name** you set (e.g. "Google Sheets")

---

## Step 2 — Set up Google Sheet headers

Open your sheet: https://docs.google.com/spreadsheets/d/12jrapE2Qnmvb9DbVDnLVuAwnzgQOUnWEq9ESrOhXcdQ

**Tab: Leads** — Add these headers in Row 1:
```
id | name | email | phone | company | source | budget | timeline_days | intent_signal | score | classification | status | reminders_sent | next_reminder_day | registered_on_day | last_action_day | thread_summary | assigned_rep | created_at
```

**Tab: Activity Log** — Add these headers in Row 1:
```
lead_id | day | action_type | actor | summary | detail_json | timestamp
```

**Tab: Error Log** — Add these headers in Row 1:
```
workflow | node | error_message | day | timestamp | resolved
```

---

## Step 3 — Import workflows

In n8n, go to **Workflows → Import from file** and import each JSON:

1. `WF1-lead-capture.json`
2. `WF2-next-day.json`
3. `WF4-sales-agent.json`

---

## Step 4 — Configure each workflow after import

For each workflow, you need to do **two things**:

### A. Set your OpenAI API key
Find every node named **"OpenAI Score Lead"** or **"OpenAI Chat"**.
In the HTTP Request node → Headers → find `Authorization`.
Replace `PASTE_YOUR_OPENAI_KEY_HERE` with `Bearer sk-proj-YOUR_NEW_KEY`.

### B. Select your Google Sheets credential
Any Google Sheets node will show a red warning about missing credentials.
Click the node → Credentials → select **"Google Sheets"** (the one you set up in Step 1).

Do this for all 3 Google Sheets nodes:
- WF1: "Save to Leads Sheet" and "Update Score in Sheet"
- WF2: "Append to Activity Log"

---

## Step 5 — Activate all workflows

Toggle each workflow to **Active** (top right of workflow editor).
The webhook URLs will become live immediately.

---

## Step 6 — Switch the frontend off mock mode

In Vercel dashboard → Project Settings → Environment Variables:
- Change `MOCK_N8N` from `true` to `false`
- Redeploy

---

## Webhook URLs (already configured in the JSON)

| Workflow | Webhook path |
|---|---|
| WF1 Lead Capture | `/webhook/closeit/register-lead` |
| WF2 Next Day | `/webhook/closeit/next-day` |
| WF4 Sales Agent | `/webhook/closeit/chat-query` |

Secret header: `x-webhook-secret: closeit_secret_2026`
