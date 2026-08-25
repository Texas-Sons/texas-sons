# Connections Registry — Texas Sons AIOS

This registry tracks the 7 Tier-1 Universal Data Domains for Texas Sons.

| # | Domain | Primary Tool / Service | Mechanism | Status | Notes |
|---|---|---|---|---|---|
| 1 | **Revenue / Financials** | Stripe / Bluevine / Wave | API / Stripe SDK (`STRIPE_SECRET_KEY`) | Connected | Payments, Invoicing, Client Subscriptions |
| 2 | **Customer Interactions** | Gmail (`contact.txsons@gmail.com`) | Direct / Email | Active | Candidate & Business Outreach |
| 3 | **Calendar** | Google Calendar | Google Workspace | Planned | Client Demos & 15-min Discovery Calls |
| 4 | **Communication** | Gmail, SMS/Phone, GitHub | Email / Mobile / GitHub PRs | Active | Client comms + Agent coordination (`.agent-messages/`) |
| 5 | **Project / Task Tracking** | GitHub / ClickUp / AIOS | GitHub Issues & ClickUp | In-Progress | Sprints, client site deliverables, builder features |
| 6 | **Meeting Intelligence** | Google Drive / Notes | Google Drive | Active | Meeting notes, candidate platform questionnaires |
| 7 | **Knowledge & Data** | Supabase & Google Maps API | REST / Supabase Client (`VITE_SUPABASE_URL`) | Connected | Live `leads` database, business profile discovery |

---

## Service Configuration & Keys
- **Stripe**: `STRIPE_SECRET_KEY` in `.env.local`
- **Supabase**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local`
- **Cloudflare**: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (for 1-click deployments to `pages.dev`)
- **Google Maps Platform**: `VITE_GOOGLE_MAPS_PLATFORM_KEY`
- **Gemini AI**: `GEMINI_API_KEY`
