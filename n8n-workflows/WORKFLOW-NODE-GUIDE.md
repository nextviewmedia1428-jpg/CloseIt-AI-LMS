# Workflow Node Guide — CloseIt

Plain-English description of every node in every workflow, in execution order, exactly matching the JSON files.

---

## WF1 — Lead Capture + Score

**File:** `WF1-lead-capture.json`  
**Webhook path:** `POST /closeit/register-lead`  
**Triggered by:** Visitor submitting the lead registration form  
**Returns:** `{ lead: { ...all fields, score, classification } }`  
**Node count:** 11

| Step | Node name | Node type | What it does |
|---|---|---|---|
| 1 | **Webhook** | Webhook | Listens on `closeit/register-lead`. Receives the POST from the Next.js API route. Holds the HTTP connection open (`responseMode: responseNode`) — will not send a response until the Respond node fires at the end. |
| 2 | **Check Secret** | IF | Reads `headers['x-webhook-secret']` and checks it equals `closeit_secret_2026`. **True branch (output 1):** secret matches → continue to Build Lead. **False branch (output 2):** secret missing or wrong → go to Reject 401. |
| 3 | **Reject 401** | Respond to Webhook | Dead end on the false branch. Sends `{ "error": "Unauthorized" }` with HTTP 401 and closes the connection. Nothing after this runs. |
| 4 | **Build Lead** | Code | Reads the incoming payload. The frontend sends `{ lead: {...}, config: {...} }` — this node unpacks both, handling whether the data is nested under `.body` or at the root (n8n version differences). Maps the lead's camelCase frontend fields to snake_case column names for Google Sheets (e.g. `formInputs.budget` → `budget`, `formInputs.timelineDays` → `timeline_days`, `intentSignal` → `intent_signal`). Forces `email` to lowercase. Sets `score: 0` and `classification: "Pending"` as placeholders — the real values come from OpenAI later. Outputs a flat row ready to write to Sheets. |
| 5 | **Save to Leads Sheet** | Google Sheets | Writes the flat lead row to the **Leads** tab of the Google Sheet. Operation is `appendOrUpdate` matching on the `email` column — if the email already exists, it updates that row; if new, it appends a new row. This handles deduplication. |
| 6 | **Build Score Request** | Code | Pulls the lead data back from the **Build Lead** node and the visitor's scoring weights from the original webhook body (`config.scoring`). Constructs the full OpenAI API request body: a system prompt telling GPT it is a scoring engine, and a user prompt containing the lead's budget, timeline, intent signal, the tier-to-score rules, the visitor's weights, and the formula. Instructs GPT to return only JSON with `score`, `classification`, and `rationale`. Uses `temperature: 0` (fully deterministic) and `response_format: json_object`. |
| 7 | **OpenAI Score Lead** | HTTP Request | POSTs the request body from Build Score Request to `https://api.openai.com/v1/chat/completions`. Uses `gpt-4o-mini`. Sends `Authorization: Bearer <key>` and `Content-Type: application/json` headers. Configured with retry: up to 3 attempts, 2 seconds between tries, to handle transient OpenAI errors. Returns the raw OpenAI API response. |
| 8 | **Parse Score** | Code | Extracts `choices[0].message.content` from the OpenAI response and parses it as JSON. Pulls out `score`, `classification`, and `rationale`. Also re-fetches `email` and `id` from the Build Lead node so the next Sheets node knows which row to update. Outputs `{ score, classification, rationale, email, id }`. |
| 9 | **Update Score in Sheet** | Google Sheets | Updates the lead row in the **Leads** tab with the AI-computed score and classification. Also uses `appendOrUpdate` matching on `email` — finds the row saved in step 5 and writes the score/classification into it. |
| 10 | **Build Response** | Code | Re-reads the Build Lead node (snake_case flat fields) and the Parse Score node (score, classification, rationale). Assembles the final `lead` object in the camelCase nested shape the frontend expects: re-nests `budget` and `timeline_days` back into `formInputs`, renames `intent_signal` back to `intentSignal`, `assigned_rep` to `assignedRep`, etc. Attaches the real score and classification. Wraps it as `{ lead: { ... } }`. |
| 11 | **Respond** | Respond to Webhook | Sends `{ "lead": { ...finalLead } }` as JSON with HTTP 200. This is what the Next.js API route receives and passes back to the browser. The browser adds this lead to the Zustand simulator store. |

**Connection flow:**  
Webhook → Check Secret → [true] Build Lead → Save to Leads Sheet → Build Score Request → OpenAI Score Lead → Parse Score → Update Score in Sheet → Build Response → Respond  
Check Secret → [false] Reject 401

---

## WF2 — Next Day Engine

**File:** `WF2-next-day.json`  
**Webhook path:** `POST /closeit/next-day`  
**Triggered by:** Visitor clicking "Next Day" in the simulator  
**Returns:** `{ day, actions: [...], leadUpdates: { [leadId]: { ...changes } } }`  
**Node count:** 9

| Step | Node name | Node type | What it does |
|---|---|---|---|
| 1 | **Webhook** | Webhook | Listens on `closeit/next-day`. Receives `{ day, leads, config }` — `day` is the current simulator day being processed, `leads` is the full array of all registered leads with their current state, `config` has scoring weights and reminder settings. Holds connection open for later Respond node. |
| 2 | **Check Secret** | IF | Same secret check as WF1. True → Compute Day Actions. False → Reject 401. |
| 3 | **Reject 401** | Respond to Webhook | Returns 401 and closes connection. Dead end. |
| 4 | **Compute Day Actions** | Code | The main engine of the entire simulator. Loops over every lead in the `leads` array and decides what happens to it on this day. For each lead, it calculates `rel = day - lead.registeredOnDay` (how many days since the lead registered). Then checks five things in order: **(a) Onboarding (rel === 1):** scores the lead using the weighted formula, emits an `email_sent` action (onboarding email), a `score_update` action, a `rep_assigned` action, and if score ≥ 4 a `proposal_sent` action. **(b) Staff call (seeded story day):** for Hot/Warm leads, emits a `call_logged` action on a deterministic day based on a hash of the lead ID. **(c) Customer reply (seeded story day):** emits a `reply_received` action (from the customer) and an `email_sent` action (AI-drafted reply). If the story also says a meeting happens on this same day, emits a `meeting_scheduled` action and sets status to `Meeting Scheduled`; otherwise sets status to `Replied`. **(d) Close (seeded story day):** emits a `call_logged` action (discovery call completed) and a `closed_won` action. Sets status to `Closed Won`. **(e) Automated follow-up:** if none of the above special days match, and the lead hasn't replied, and today equals `nextReminderDay`, and `remindersSent < maxReminders` — emits a follow-up `email_sent` action. If this was the last allowed reminder, also emits `moved_to_nurture` and sets status to `Nurture`. All actions are collected into a flat array. All lead field changes (status, score, nextReminderDay, etc.) are tracked in a `leadUpdates` object keyed by lead ID. Outputs `{ day, actions: [...], leadUpdates: {...} }` as a single item. |
| 5 | **Split to Activity Rows** | Code | Takes the `actions` array from Compute Day Actions and splits it into individual items — one per action — formatted as flat Sheets column names: `lead_id`, `day`, `action_type`, `actor`, `summary`, `detail_json` (the full detail object serialised as a JSON string), `timestamp`. If there are zero actions, outputs one dummy item with `_noActions: true` so the flow doesn't break on empty days. |
| 6 | **Append to Activity Log** | Google Sheets | Appends every action item as a new row to the **Activity Log** tab. Pure append (no deduplication) — each action is a unique event. This is the audit trail visible in Sheets. Because Split to Activity Rows outputs multiple items, this node runs once per action row. |
| 7 | **Collect Results** | Aggregate | After Append to Activity Log has run once per action row, this collapses all those separate items back into a single aggregated item. Required because the next node (Build Response) needs to run once, not once per row. |
| 8 | **Build Response** | Code | Ignores the aggregated Sheets data (which is just row confirmations). Instead re-reads directly from the **Compute Day Actions** node, which still holds the original `day`, `actions`, and `leadUpdates` in memory. Packages these into the response shape. |
| 9 | **Respond** | Respond to Webhook | Sends `{ day, actions: [...], leadUpdates: {...} }` with HTTP 200. The frontend uses `actions` to render the event feed and `leadUpdates` to patch each lead's fields in the Zustand store. |

**Connection flow:**  
Webhook → Check Secret → [true] Compute Day Actions → Split to Activity Rows → Append to Activity Log → Collect Results → Build Response → Respond  
Check Secret → [false] Reject 401

---

## WF4 — Sales Agent Chat

**File:** `WF4-sales-agent.json`  
**Webhook path:** `POST /closeit/chat-query`  
**Triggered by:** Visitor typing a question in the agent chat panel  
**Returns:** `{ answer: string }`  
**Node count:** 7

| Step | Node name | Node type | What it does |
|---|---|---|---|
| 1 | **Webhook** | Webhook | Listens on `closeit/chat-query`. Receives `{ leadName, thread, question }`. The `thread` is the full communication history for that lead — assembled client-side by concatenating all Action summaries and bodies in chronological order. Holds connection open. |
| 2 | **Check Secret** | IF | Secret check. True → Build Request. False → Reject 401. |
| 3 | **Reject 401** | Respond to Webhook | Returns 401. Dead end. |
| 4 | **Build Request** | Code | Reads `leadName`, `thread`, and `question` from the webhook body. Builds the OpenAI request body: a **system prompt** establishing GPT as a sales agent assistant instructed to be concise and actionable; a **user message** combining the lead name, the full thread, and the visitor's question into a single prompt. Uses `gpt-4o-mini`, `temperature: 0.7` (slightly creative, good for drafting), `max_tokens: 600`. Outputs `{ requestBody: {...} }`. |
| 5 | **OpenAI Chat** | HTTP Request | POSTs `requestBody` to `https://api.openai.com/v1/chat/completions`. Sends `Authorization` and `Content-Type` headers. No retry configured on this node. Returns the raw OpenAI API response. |
| 6 | **Parse Response** | Code | Extracts `choices[0].message.content` — the plain text answer string. Outputs `{ answer: "..." }`. |
| 7 | **Respond** | Respond to Webhook | Sends `{ "answer": "..." }` with HTTP 200. The frontend renders this as a chat bubble in the agent panel. |

**Connection flow:**  
Webhook → Check Secret → [true] Build Request → OpenAI Chat → Parse Response → Respond  
Check Secret → [false] Reject 401

---

## WF5 — Follow-up Agent (Autonomous)

**File:** `WF5-follow-up-agent.json`  
**Webhook path:** `POST /closeit/agent-analyze`  
**Triggered by:** A lead being selected in the agent panel — fires automatically, no visitor input needed  
**Returns:** `{ pendingFrom, pendingAction, reasoning, draftMessage }`  
**Node count:** 7

| Step | Node name | Node type | What it does |
|---|---|---|---|
| 1 | **Webhook** | Webhook | Listens on `closeit/agent-analyze`. Receives `{ lead, thread }` — the full lead object and the full communication thread text. `typeVersion: 2`. Holds connection open. |
| 2 | **Check Secret** | IF | Secret check. This node uses `typeVersion: 1` (older IF format) — conditions are structured as `string` comparisons rather than the newer `conditions` array. True → Build Prompt. False → Reject. |
| 3 | **Reject** | Respond to Webhook | Returns `{ "error": "Unauthorized" }` with HTTP 401. `typeVersion: 1`. Dead end. |
| 4 | **Build Prompt** | Code | Reads `lead` and `thread` from `$json.body`. Extracts the lead's key context fields: name, email, company, budget (from `formInputs.budget`), timeline (from `formInputs.timelineDays`), score, classification, assigned rep, current status, and reminders sent. Combines these with the full thread text into a detailed prompt. The prompt instructs GPT to act as an autonomous follow-up agent and return a JSON object with exactly four fields: `pendingFrom` ("lead" / "staff" / "none"), `pendingAction` (one sentence on the immediate next action), `reasoning` (2–3 sentence analysis), and `draftMessage` (object with `to`, `recipientType`, `subject`, `body` — or null if the lead is closed). Outputs `{ prompt, lead, thread }`. |
| 5 | **OpenAI Analyze** | HTTP Request | POSTs to `https://api.openai.com/v1/chat/completions` using `gpt-4o-mini`. `temperature: 0.3` (more analytical and consistent than WF4's 0.7). Sets `response_format: { "type": "json_object" }` to force GPT to return valid JSON rather than prose. 30-second timeout. Uses `typeVersion: 4` (note: one version older than WF1/WF2 which use 4.2). |
| 6 | **Parse Response** | Code | Extracts `choices[0].message.content` and parses it as JSON. If parsing fails for any reason (malformed JSON from GPT), catches the error and returns a safe fallback: `{ pendingFrom: "none", pendingAction: "Unable to analyze thread.", reasoning: "The AI returned an unreadable response.", draftMessage: null }` — so the frontend never crashes regardless of what OpenAI returns. |
| 7 | **Respond** | Respond to Webhook | Sends the parsed JSON object directly (`JSON.stringify($json)`) with HTTP 200. The frontend renders this as the analysis card: pending badge, next action text, reasoning paragraph, and draft message with Approve button. `typeVersion: 1`. |

**Connection flow:**  
Webhook → Check Secret → [true] Build Prompt → OpenAI Analyze → Parse Response → Respond  
Check Secret → [false] Reject

---

## Key differences between workflows

| | WF1 | WF2 | WF4 | WF5 |
|---|---|---|---|---|
| Google Sheets | 2 nodes (write + update) | 1 node (activity log append) | None | None |
| OpenAI calls | 1 (scoring, temp 0) | None (scoring is done in code) | 1 (chat, temp 0.7) | 1 (analysis, temp 0.3) |
| Response format | `{ lead }` | `{ day, actions, leadUpdates }` | `{ answer }` | `{ pendingFrom, pendingAction, reasoning, draftMessage }` |
| IF node version | 2.2 | 2.2 | 2.2 | 1 |
| Respond node version | 1.1 | 1.1 | 1.1 | 1 |
| Retry on OpenAI | Yes (3×, 2s) | N/A | No | No |
