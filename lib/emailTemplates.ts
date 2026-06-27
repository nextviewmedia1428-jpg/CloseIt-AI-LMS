// 100+ humanised email templates for MOCK_N8N mode.
// In live mode (MOCK_N8N=false), these are replaced by OpenAI-generated content from n8n.
// Each template is a function: (name, company, industry) => string

type Tpl = (name: string, company: string, industry: string) => string;

// ─── COLD START — Initial outreach (20 variants) ─────────────────────────────

export const COLD_INITIAL: Tpl[] = [
  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nI'm reaching out from CloseIt — we're an automation platform that helps ${i} teams take the manual work out of their CRM and sales follow-up.\n\nMost teams we speak with lose 20–30% of pipeline simply because follow-ups fall through the cracks. CloseIt handles the entire nurturing layer — from first contact to discovery call booking — so your team only steps in when a lead is genuinely ready.\n\nQuick question: how does ${c} currently manage outbound follow-up across your pipeline?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nI'll keep this short — CloseIt is a CRM automation platform and I think there's a strong fit with what ${c} does in ${i}.\n\nWe help teams stop losing deals to slow follow-up. Our system handles the first 3–5 touches of any lead conversation autonomously, then hands off to your team at exactly the right moment.\n\nWould it make sense to spend 20 minutes exploring whether this could work for your setup?`,

  (n,c,i) => `Hey ${n.split(' ')[0]},\n\nNoticed ${c} is growing its ${i} practice — congrats on that. I'm from CloseIt, an automation platform that helps teams like yours scale their pipeline without scaling the headcount.\n\nThe problem we solve: leads go cold because your team is busy and follow-up is inconsistent. CloseIt makes the process airtight.\n\nCurious — is manual follow-up a bottleneck for you right now?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nCloseIt here — we build CRM automation for ${i} businesses that are serious about their pipeline but stretched thin on bandwidth.\n\nOur platform handles discovery outreach, qualification, and call scheduling without your team lifting a finger. You get the lead when they're warm and the context to close them.\n\nWhat does your current follow-up process look like at ${c}?`,

  (n,c,i) => `${n.split(' ')[0]},\n\nI'll be direct: most ${i} teams we talk to are leaving money on the table because their CRM is a graveyard of contacts nobody followed up with.\n\nCloseIt fixes that. We sit on top of your existing setup and handle the nurturing layer — intelligent outreach, discovery questions, scheduling — until the lead is ready for a real conversation with you.\n\nIs this something ${c} is actively thinking about?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nReaching out from CloseIt — we're an AI-powered CRM automation platform working with a number of ${i} teams.\n\nWhat we do in one sentence: we make sure no lead in your pipeline is ever left waiting more than 24 hours for a thoughtful, contextual follow-up — automatically.\n\nI'd love to understand how ${c} handles this today. Worth a quick chat?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nHope this finds you well. I'm from CloseIt — we help ${i} organisations automate the early stages of their sales pipeline so their teams can focus on closing, not chasing.\n\nWe handle: initial outreach, discovery questioning, qualification, and booking — all contextual and personalised, not templated blasts.\n\nDoes ${c} have a consistent follow-up process today, or is it ad hoc?`,

  (n,c,i) => `${n.split(' ')[0]}, quick question:\n\nHow many leads does ${c} lose each quarter simply because someone forgot to follow up?\n\nI ask because we built CloseIt specifically for ${i} teams who have a great product but a leaky pipeline. We automate the nurturing layer so every lead gets touched, every time, with the right message.\n\nWorth exploring?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nI'm with CloseIt, a CRM automation platform. I'll skip the long pitch — we help ${i} businesses stop losing warm leads to slow or inconsistent follow-up.\n\nWe've seen teams recover 15–25% of stalled pipeline after plugging CloseIt into their existing CRM. The setup takes less than a week.\n\nWould ${c} be open to a quick discovery call to see if there's a fit?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nCloseIt here. We work with ${i} companies to automate the follow-up layer of their pipeline — from first touch to discovery call, handled entirely by our platform.\n\nI'm not going to pretend every business needs this. But if your team is manually tracking follow-ups across 50+ leads at any given time, the cost of doing that — in time, missed deals, and team morale — is significant.\n\nIs that a challenge ${c} is facing?`,

  (n,c,i) => `Hey ${n.split(' ')[0]},\n\nI'm reaching out because ${c} came up as a company doing interesting things in ${i}, and I think CloseIt could be a strong fit.\n\nWe automate the CRM nurturing layer — the part between "lead enters the system" and "lead is ready to talk." It's typically the most time-consuming and the most error-prone part of the pipeline.\n\nHow does your team handle it today?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nI'll make this easy. CloseIt is an automation platform for ${i} teams. We take care of:\n• Personalised first contact\n• Discovery questioning\n• Qualification\n• Booking the meeting\n\nYour team shows up to a warm lead who already understands what you do and is ready to move.\n\nWould a 20-minute call make sense?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nI run growth at CloseIt — we help ${i} businesses automate their CRM pipeline from first touch to qualified meeting.\n\nI came across ${c} and think the fit could be strong, particularly if your team is doing outbound at any scale. Manual follow-up doesn't scale, and we're built to solve exactly that problem.\n\nOpen to a quick call this week?`,

  (n,c,i) => `${n.split(' ')[0]},\n\nBuilding pipeline in ${i} is hard enough. Following up consistently on every lead at the right cadence is a full-time job on its own.\n\nCloseIt automates that job. Our platform handles the first few touchpoints of every lead relationship — personalised, contextual, and timed correctly — so your team can focus on the conversations that matter.\n\nCurious whether this is on your radar at ${c}?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nCloseIt here. We work with ${i} teams on a problem most of them recognise immediately: the pipeline leaks between "new lead" and "first real conversation."\n\nOur platform plugs that leak — it handles outreach, qualification, and scheduling autonomously so nothing falls through the cracks.\n\nI'd love to understand what that journey looks like for ${c} today.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nQuick intro — I'm from CloseIt, a CRM automation platform. We help ${i} businesses ensure every lead in their system gets a timely, relevant follow-up — without relying on a sales rep to remember.\n\nThe outcome is simple: more pipeline gets worked, more meetings get booked, and your team spends time on selling instead of admin.\n\nDoes this sound like something ${c} could use?`,

  (n,c,i) => `Hey ${n.split(' ')[0]},\n\nReaching out on behalf of CloseIt. We're an automation platform specifically focused on the CRM nurturing problem that most ${i} companies deal with.\n\nIn short: we make sure that from the moment a lead enters your system, they receive timely, intelligent follow-up — and only get escalated to your team once they've shown genuine intent.\n\nWould it be worth 20 minutes to walk through whether this fits ${c}?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nI wanted to introduce CloseIt to you — we're a CRM automation platform that handles the prospecting and nurturing layer for ${i} teams.\n\nInstead of your team managing a follow-up spreadsheet or hoping their CRM reminders fire at the right time, CloseIt does it automatically — with context, with the right message, at the right moment.\n\nIs follow-up consistency something ${c} is actively working to improve?`,

  (n,c,i) => `${n.split(' ')[0]},\n\nI'll skip the long opener. CloseIt automates CRM nurturing for ${i} businesses.\n\nIf ${c} has leads in your pipeline that aren't being followed up on consistently — whether because the team is stretched, the CRM reminders get ignored, or the process just isn't defined — we can fix that in under a week.\n\nWant to see how?`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nCloseIt is an automation platform for sales teams, and I believe there's a strong case for why it would work well at ${c}.\n\nWe handle the messy middle of the pipeline — from first contact to discovery booking — so your ${i} team only spends time on leads that are genuinely engaged.\n\nWhat does your current process for nurturing new leads look like?`,
];

// ─── WARM START — Agent replies to inbound (20 variants) ─────────────────────

export const WARM_RESPONSE: Tpl[] = [
  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nThanks for reaching out — great timing.\n\nI'm the CloseIt AI agent. I'll handle the initial scoping so we can get you to the right conversation quickly. A few questions:\n\n1. What does your current follow-up or CRM process look like at ${c}?\n2. Roughly how many new leads or contacts does your team work each month?\n3. Do you have a rough budget range in mind for a tool like this?\n4. Is this something you need running in the next 4 weeks, or are you still in evaluation mode?\n\nNo wrong answers — this just helps us skip the generic demo.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nGreat to hear from you. I'm CloseIt's intake agent — I'll ask a few quick questions so we can tailor the right conversation for you.\n\nTo understand if there's a fit:\n• What's the core problem you're trying to solve? (follow-up, nurturing, CRM hygiene, pipeline visibility?)\n• What's your team size on the sales/BD side?\n• Do you have an existing CRM, and if so, which one?\n• What's your timeline — when would you want something like this live?\n\nHappy to loop in the right person once I have the picture.`,

  (n,c,i) => `Hey ${n.split(' ')[0]},\n\nThanks for the note — we'd love to explore this.\n\nBefore I connect you with the team, a few quick things to make sure we use your time well:\n\n1. What prompted you to look at automation now? Was there a specific pain point or trigger?\n2. What does your current pipeline process look like — manual, CRM-driven, or a mix?\n3. Any sense of budget range? Even a ballpark helps us size the right solution.\n4. How quickly are you looking to get something in place?\n\nOnce I have this, I can set up a tailored discovery call for you.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nThank you for reaching out to CloseIt.\n\nI'm handling intake for the team. To point you in the right direction quickly, could you help me with a few things?\n\n• What specifically brought you to us? (referral, content, search?)\n• What's the scale of your current pipeline — rough lead volume per month?\n• Is there a specific part of the CRM or follow-up process that's most broken right now?\n• What's the urgency — this quarter, next quarter, just exploring?\n\nLooking forward to understanding your setup better.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nExcited to hear from you — CRM automation for ${i} is exactly our wheelhouse.\n\nTo make the most of your time, I'd love to understand a bit more before we get into details:\n\n1. What does the sales or BD team at ${c} look like right now? (Headcount, structure)\n2. Where does the current process break down — top of funnel, nurturing, or closing?\n3. Do you have budget allocated for this, or is this still in the exploratory phase?\n4. What's your ideal go-live timeline?\n\nAnswers here let me prep a much more relevant conversation for you.`,

  (n,c,i) => `Hello ${n.split(' ')[0]},\n\nThanks for getting in touch with CloseIt. We're an AI-powered CRM automation platform and it sounds like there may be a strong fit.\n\nA couple of quick discovery questions to make sure I connect you with the right person:\n\n• What does your CRM landscape look like today? Any existing tools?\n• What's the biggest friction point in your current pipeline process?\n• Rough lead volume per month?\n• Budget range in mind?\n\nThis helps me skip the generic pitch and give you something genuinely useful.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nThank you for reaching out. I'm CloseIt's intake AI — I'll handle the initial scoping and loop in a team member once I have the full picture.\n\nFour quick questions:\n1. What made you reach out now? Any specific trigger or pain point?\n2. How are you currently handling lead follow-up at ${c}?\n3. What's your approximate monthly new lead volume?\n4. Do you have a sense of the budget range you're working with?\n\nI'll get back to you quickly once I have these.`,

  (n,c,i) => `${n.split(' ')[0]},\n\nGreat to hear from you. CloseIt is exactly built for what you're describing.\n\nTo make sure we come prepared with the right things, a few questions:\n• How many people are on your team who'd be using this?\n• Are you replacing an existing tool or building this capability fresh?\n• What outcome matters most — more meetings booked, less manual work, better pipeline visibility?\n• Any hard constraints on timeline or budget?\n\nAnswers don't need to be precise — just a sense of where you are.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nThanks for reaching out — and for the context. That helps.\n\nI'm CloseIt's discovery agent. Before I connect you with the team, a few things:\n\n1. What's the size of your pipeline right now — roughly how many active leads at any given time?\n2. What does your follow-up process look like — is it documented and consistent, or more ad hoc?\n3. What's your budget range for a platform like this? (Monthly or annual, both fine)\n4. Is there a decision-maker beyond yourself who'd need to be involved?\n\nThis sets us up for a much more focused conversation.`,

  (n,c,i) => `Hey ${n.split(' ')[0]},\n\nLoved hearing from you — we work with a number of ${i} companies and there's usually a strong fit.\n\nBefore we get into a demo, let me ask a few questions so we can skip the irrelevant parts:\n\n• What does your outbound or inbound pipeline look like — which channel brings in most leads?\n• How does your team currently track and follow up on those leads?\n• Are you looking for something that plugs into an existing CRM or a standalone solution?\n• What's your budget thinking?\n\nThis helps us come to you with something specific.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nThank you for the message — really appreciate you reaching out.\n\nI'm the CloseIt intake agent. Rather than sending you a generic deck, I'd love to understand your situation first:\n\n1. What's working and what isn't in your current sales follow-up process?\n2. How big is the team that would use this?\n3. What CRM are you currently on, if any?\n4. What does success look like 3 months after going live with something like this?\n\nLet me know and I'll get back to you with something relevant.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nCloseIt here — thanks for the note.\n\nTo give you the most useful response (rather than a generic walkthrough), could you share:\n\n• What specifically prompted you to look at CRM automation right now?\n• What tools is ${c} currently using for pipeline management?\n• Rough sense of monthly lead volume?\n• Timeline and budget in mind?\n\nOnce I have this I can either answer your questions directly or set up the right call.`,

  (n,c,i) => `${n.split(' ')[0]},\n\nThanks for reaching out. I'm handling intake for the CloseIt team.\n\nFour questions that'll take you 2 minutes to answer and save both of us a lot of time:\n\n1. What's the core problem — too many leads to follow up manually, inconsistent process, or something else?\n2. What does your team size look like on the sales side?\n3. What's your budget envelope for this kind of tool?\n4. How quickly do you need a solution in place?\n\nLooking forward to your answers.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nGreat to hear from you — and yes, this is exactly what CloseIt is built for.\n\nBefore I set up a call, a few discovery questions:\n\n• What's the main pain: too many leads falling through the cracks, or inconsistent follow-up quality, or both?\n• Does ${c} have an existing CRM in place?\n• What does your monthly budget for sales tools look like?\n• Who else would be involved in the decision beyond yourself?\n\nAnswers to these help me make sure the first conversation is worth your time.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nThanks for the message. CloseIt is an AI-powered CRM automation platform — it sounds like there's a fit.\n\nA few quick questions before we get into specifics:\n1. What does the end-to-end pipeline look like at ${c} — from lead source to close?\n2. Where does the most time get lost or the most leads go quiet?\n3. Is there an existing tech stack we'd need to integrate with?\n4. What's your timeline for making a decision?\n\nThis helps me come back to you with something specific rather than a generic demo.`,

  (n,c,i) => `Hello ${n.split(' ')[0]},\n\nThank you for reaching out to CloseIt — we're glad you found us.\n\nI'm the intake agent. To make sure we set up the right conversation, I have a few questions:\n\n• What's your current approach to managing new leads — CRM, spreadsheet, email threads?\n• How many people manage follow-ups at ${c}?\n• What's the approximate value of your average deal?\n• Any hard constraints on budget or timeline?\n\nOnce I have a picture I'll get back to you with next steps.`,

  (n,c,i) => `Hey ${n.split(' ')[0]},\n\nThanks for the note. Happy to help — let me understand the situation first.\n\nA few questions:\n1. What's the size of your CRM in terms of active contacts or leads right now?\n2. How do leads come in — inbound, outbound, referral, or a mix?\n3. What's the biggest problem with how follow-up works today at ${c}?\n4. What budget range is ${c} considering for this kind of platform?\n\nTalk soon.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nThanks for reaching out. CloseIt is an automation platform for CRM teams — we handle the nurturing layer so your team shows up to warm, qualified leads.\n\nBefore I set anything up, a few quick questions:\n• What does the ${i} sales cycle look like at ${c} — short transactional, or longer enterprise?\n• How many leads are in your pipeline at any given time?\n• Do you have a CRM today? If so, what?\n• What would make this a success 90 days after going live?\n\nLooking forward to learning more.`,

  (n,c,i) => `${n.split(' ')[0]},\n\nThanks for reaching out to CloseIt.\n\nI want to make sure the first conversation is a good use of your time, so a few discovery questions:\n\n1. What's driving the interest in CRM automation right now — is this a pain that's been building, or a specific recent trigger?\n2. What does your current follow-up process look like, and where does it break?\n3. Do you have a budget range in mind?\n4. How quickly do you need this solved?\n\nFeel free to be direct — I'll give you a direct answer in return.`,

  (n,c,i) => `Hi ${n.split(' ')[0]},\n\nExcited to hear from you. CloseIt is an AI-driven CRM automation platform — and from what you've shared, there's a strong chance we can help.\n\nA few things I'd love to understand:\n• What does the sales or BD motion at ${c} look like today?\n• How many active leads does your team work at any one time?\n• What's the current follow-up process — is it documented, or does it depend on the rep?\n• Any sense of timeline and budget?\n\nOnce I have the context, I'll point you to the right resources or set up the right conversation.`,
];

// ─── LEAD REPLIES — positive (25 variants) ────────────────────────────────────

export const LEAD_REPLY_POSITIVE: Tpl[] = [
  (n,c) => `Hi — thanks for the message. We're doing it manually at ${c} right now and it's not scaling. What does CloseIt actually look like in practice? Happy to jump on a call if the answers are good.`,
  (n,c) => `Hey, good timing on this. We've been evaluating options for a few weeks and haven't found the right fit yet. Can you send over more details on what's included and how setup works?`,
  (n,c) => `Thanks for reaching out. We're at about 80 leads a month and follow-up is definitely inconsistent. How does CloseIt handle leads that go quiet for a while — does it re-engage automatically?`,
  (n,c) => `Appreciate the message. We use HubSpot but the automation side is honestly underused. Is CloseIt a replacement or does it sit on top? And what does onboarding typically look like?`,
  (n,c) => `Hi — yes, this is a real problem for us. How long does setup take and what do you need from us to get started? We're looking at this quarter if the fit is right.`,
  (n,c) => `Good email. We've been burned by two other tools that overpromised. What makes CloseIt different — specifically in terms of the quality of the outreach it generates? Can I see some examples?`,
  (n,c) => `Hey, appreciate the directness. We lose probably 10-15% of our pipeline to slow follow-up every quarter. What kind of results have other ${c.split(' ')[0]}-style companies seen with CloseIt?`,
  (n,c) => `Thanks for the note. I've forwarded it to our head of sales too — she'd want to be involved in this decision. Can we set up a call for both of us?`,
  (n,c) => `Hi — the timing is actually perfect. We're reviewing our sales stack this month. What does a pilot look like and how quickly do you see results?`,
  (n,c) => `Hey. Yes, follow-up is messy right now. We have a CRM but nobody trusts the data in it. Can CloseIt work with an existing but messy CRM, or do we need to clean it up first?`,
  (n,c) => `Thanks — interested. We're about 30 leads a month so probably a smaller use case for you, but curious if there's a plan for companies our size. What does pricing look like?`,
  (n,c) => `Hi! Yes, this is absolutely something we need. Our team is 3 people handling BD and we're all doing this manually. What does the onboarding process look like and how long until it's handling real leads?`,
  (n,c) => `Hey — good pitch. We've been meaning to fix our follow-up process for months. What's the minimum viable setup to get started and how long until we see value?`,
  (n,c) => `Thanks for the message. I'll be honest, we've looked at automation tools before and found them too rigid. How does CloseIt personalise at scale — does it actually sound human?`,
  (n,c) => `Hi. Timing is good — we just lost a deal because nobody followed up. I'd like to understand what CloseIt can and can't do before we go further. Would a 20-minute call work?`,
  (n,c) => `Hey, appreciate the cold email. We're running about 60 new leads a month and manually logging follow-ups. Happy to jump on a call — do you have slots this week?`,
  (n,c) => `Hi — yes, this resonates. Our problem is specifically at the top of funnel — we get leads in but they get stuck waiting for a first response. Does CloseIt handle that, and how quickly?`,
  (n,c) => `Thanks for reaching out. We're in evaluation mode for a few tools right now. What differentiates CloseIt from something like Outreach or Salesloft for a company our size?`,
  (n,c) => `Hey — good find. We've been talking about fixing our CRM process for a while. What does a typical first month with CloseIt look like for a new client?`,
  (n,c) => `Hi. Genuinely interested. We have a decent pipeline but the follow-through is inconsistent. Can we do a quick 15-min call this week to see if it's a fit?`,
  (n,c) => `Thanks — yes, exactly the problem we have. How much does CloseIt cost roughly, and is there a trial period or pilot before committing?`,
  (n,c) => `Hey — good email. I'd want our ops lead involved in this decision too. Can you send a one-pager or overview I can share internally? Then we can get on a call.`,
  (n,c) => `Hi. I run sales at ${c} and this is a genuine pain. We've tried building our own follow-up sequences in our CRM and it's never stuck. How is CloseIt different from that?`,
  (n,c) => `Thanks for reaching out. We have around 100 contacts in our pipeline right now and maybe 20% are being followed up properly. Interested to understand how quickly CloseIt could address that.`,
  (n,c) => `Hey — good timing. We're growing fast and the manual stuff is starting to really slow us down. Can we get on a call this week?`,
];

// ─── LEAD REPLIES — negative (15 variants) ────────────────────────────────────

export const LEAD_REPLY_NEGATIVE: Tpl[] = [
  (n) => `Hi — thanks for reaching out. We're heads-down on a product launch this quarter and can't take on any new vendor evaluations right now. Feel free to follow up in 3–4 months.`,
  (n) => `Appreciate the email. We went with another provider a few weeks ago for this. Not looking to switch right now, but I'll keep CloseIt in mind.`,
  (n) => `Thanks for the note. We've decided to build this capability in-house for now. Will reach out if that changes.`,
  (n) => `Hey — not the right time for us. We're mid-restructure and all external vendor decisions are on hold until Q3. Please reach out again then.`,
  (n) => `Thanks for reaching out. We're a very small team (just 2 people on sales) and this feels like a lot of overhead for our stage. Maybe when we're bigger.`,
  (n) => `Hi. The tool sounds interesting but honestly we don't have the budget for something like this right now. We're bootstrapped and every spend needs to show ROI immediately.`,
  (n) => `Thanks — but we're quite happy with our current setup for now. Not actively looking. Good luck with the product.`,
  (n) => `Hey — appreciate the message but we're in the middle of a hiring push and this kind of project would need a dedicated person to own it. Not the right time.`,
  (n) => `Hi. We evaluated something similar 6 months ago and it didn't work out well for us. We're a bit cautious about automation in our sales motion now. Thanks for reaching out though.`,
  (n) => `Thanks for the email. Our CEO handles all business development personally right now and is happy with the current approach. Not looking to change that.`,
  (n) => `Hey — we already have a system for this that's working reasonably well. Not looking to switch or add to the stack at the moment.`,
  (n) => `Hi. The timing isn't right — we're in a revenue crunch and cutting tools, not adding them. Please follow up in 6 months.`,
  (n) => `Thanks for the message. We outsource our sales function so this kind of platform doesn't really fit our model. Not the right fit.`,
  (n) => `Hey — no thanks, we're all good for now. If anything changes I'll reach out.`,
  (n) => `Thanks for reaching out. We've had a bad experience with over-automating our sales process before — it hurt our conversion rate. We're being much more manual and deliberate now. Not for us at this stage.`,
];

// ─── USER REPLY RESPONSES (lead replies after user sends a message) — 20 variants ─

export const LEAD_REPLY_TO_USER: Tpl[] = [
  (n) => `Thanks for getting back to me. That answers a lot of my questions. Thursday works — let's do 2pm. I'll also have our operations lead join.`,
  (n) => `Appreciate the detailed response. We've discussed internally and there's genuine interest. Can we schedule the discovery call for next week?`,
  (n) => `Good to hear from you. Yes, that makes sense. What does the typical onboarding timeline look like after we decide to go ahead?`,
  (n) => `Thanks — that clears things up. We'd like to move forward with a call. What slots do you have available?`,
  (n) => `Hi — yes, the case studies are helpful. I've shared them with my team. We're ready to do the discovery call whenever works for you.`,
  (n) => `Makes sense. We'll bring our CTO to the call as well — she'll want to understand the integration side. Does Thursday at 11am work?`,
  (n) => `Thanks for the clarification. Pricing looks reasonable for what's included. Let's book the call — I'm free Wednesday afternoon.`,
  (n) => `Okay, that's more reassuring. We've been burned before so I appreciate the transparency. Let's schedule the demo call.`,
  (n) => `Great, that's exactly what I was hoping to hear. Let's move forward. Happy to book the call now — what's your availability?`,
  (n) => `Thanks for following up. We haven't made a final decision yet but CloseIt is still in the running. Can we push the call to next week?`,
  (n) => `Appreciate the patience. We've had some internal priorities come up. Still interested — can we revisit in 2 weeks?`,
  (n) => `Thanks — one more question before we book: does CloseIt integrate with Pipedrive? That's our current CRM. If yes, let's set up the call.`,
  (n) => `That's helpful context. We're ready to go. Can you send over a calendar link and I'll pick a time?`,
  (n) => `Good answer. I've looped in my CEO as well — she'll want to be on the discovery call. Does Friday work?`,
  (n) => `Thanks for the response. We're still evaluating two other options as well. We'll get back to you by end of week.`,
  (n) => `Appreciate the follow-up. We're ready to move forward — let's do the discovery call. I'll send a calendar invite shortly.`,
  (n) => `Good timing on this. We've just finished our Q2 review and CRM automation came up as a priority. Let's do the call next week.`,
  (n) => `That makes sense. One last thing — can you share a brief case study of a company similar to ours before the call? Then we're good to go.`,
  (n) => `Thanks. The pricing is within budget. Let's book the call — I'm available Thursday or Friday morning.`,
  (n) => `Appreciate the quick response. We'll need to involve procurement for anything over $500/mo — but discovery call first. What works for you?`,
];

// ─── WARM START INBOUND MESSAGES (lead's first message) ───────────────────────

export const WARM_INBOUND: Record<string, Tpl[]> = {
  warm_struggling_followup: [
    (n,c) => `Hi — I came across CloseIt and I'm curious about what it does. We're a consulting firm and our sales team is struggling to keep up with follow-ups after initial outreach. Leads are going cold before anyone circles back. Is this something you help with?`,
    (n,c) => `Hello, a colleague mentioned CloseIt might help with our follow-up problem. We have good leads coming in but our team is overwhelmed and things slip through. Can you tell me more?`,
    (n,c) => `Hi, I found CloseIt through a Google search. We're having issues with inconsistent follow-up on our CRM leads. What exactly does your platform do and how would it work for a team like ours?`,
  ],
  warm_heard_about: [
    (n,c) => `Hey — I heard about CloseIt from a peer in the industry and wanted to learn more. We're a legal services firm and follow-up on new client enquiries is a real bottleneck for us. Happy to discuss.`,
    (n,c) => `Hi, someone in my network mentioned CloseIt and it sounds like exactly what we need. We're at about 50 leads a month and struggling to stay on top of them. Can we talk?`,
  ],
  warm_portfolio_use: [
    (n,c) => `Hi — I run a VC fund and one of our portfolio companies is using CloseIt. I'd like to understand if it could work for the fund itself — we have a deal pipeline that could use better follow-up automation. Is this something you work on?`,
    (n,c) => `Hello, I've seen CloseIt mentioned across a few of our portfolio companies. I'd like to explore whether it makes sense for our fund's own deal flow management. Can someone walk me through it?`,
  ],
  warm_referral: [
    (n,c) => `Hi — a friend who runs a retail business recommended I reach out to CloseIt. We operate across 5 locations and our sales follow-up is completely manual and inconsistent. Looking to fix this properly. Can we chat?`,
    (n,c) => `Hey, I was referred to CloseIt by a contact at another company. We run a retail group and our CRM is basically a spreadsheet at this point. I think we need something proper. Happy to discuss.`,
  ],
};

// helper: pick a variant seeded by leadId + salt
function seeded(leadId: string, salt: string): number {
  const str = leadId + salt;
  let h = 0;
  for (const c of str) h = ((h << 5) - h) + c.charCodeAt(0);
  return (Math.abs(h) % 10000) / 10000;
}

export function pickTemplate<T>(arr: T[], leadId: string, salt: string): T {
  return arr[Math.floor(seeded(leadId, salt) * arr.length)];
}

export function pickWarmInbound(key: string, leadId: string): string {
  const pool = WARM_INBOUND[key] ?? WARM_INBOUND['warm_heard_about'];
  const fn = pool[Math.floor(seeded(leadId, 'inbound') * pool.length)];
  return fn('', '', '');
}
