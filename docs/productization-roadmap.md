# ThriftIQ Productization Roadmap

This plan turns the current web prototype into a usable beta product without losing the fast sourcing loop that makes the prototype valuable.

## Current State

- Polished Next.js and Tamagui web prototype with Source, Item, Inventory, History, and Profit screens.
- Mock sign-in and localStorage persistence for auth, inventory, and search history.
- Deterministic mock comparable data and simulated listing generation.
- Drizzle schema, Supabase Auth, Supabase Postgres/Storage, Redis, OpenAI, and eBay environment scaffolding already exist.
- `npm run typecheck`, `npm run lint`, and `npm run build` are expected product gates.

## Product Readiness Milestones

### Milestone 1: Beta Foundation

Goal: authenticated users can use the product without losing their data.

- Replace mock sign-in with Supabase Auth sign-in, sign-up, and user menu.
- Sync Supabase Auth users into the `users` table.
- Add authenticated API route handlers for inventory create, list, update status, and delete/archive.
- Move inventory and search history from localStorage to Supabase Postgres through Drizzle.
- Add loading, empty, and error states for every server-backed view.
- Keep localStorage only for harmless UI preferences.

### Milestone 2: Real Sourcing Loop

Goal: users can search real eBay sold comps and trust the recommendation.

- Add an eBay service for OAuth token management, sold-comps search, normalization, and error mapping.
- Cache normalized eBay search results in Upstash Redis for 24 hours.
- Move `stats` and `calcProfit` into shared server-safe pricing modules with unit tests.
- Return median, mean, IQR, confidence, fee estimate, payout, projected profit, and BUY/SKIP/WATCH verdict from `/api/searches`.
- Persist search runs and normalized comps to Postgres.
- Surface low-confidence explanations in the item detail view.

### Milestone 3: Listing Generation

Goal: users can generate and reuse marketplace-ready listing drafts.

- Add `/api/listings/generate` with Zod request and response schemas.
- Use Vercel AI SDK structured output for title, description, tags, suggested price, and confidence notes.
- Cache prompt-level listing results when inputs are materially identical.
- Persist generated listing drafts against inventory items.
- Track copy actions so listing usefulness can be measured.

### Milestone 4: Beta Operations

Goal: the product is observable, deployable, and safe enough for design partners.

- Add Sentry for frontend and route-handler errors.
- Add PostHog events for search started, search completed, item saved, listing generated, and listing copied.
- Add daily free-tier limits for searches and listing generations.
- Add a deploy checklist covering env vars, migrations, smoke tests, and rollback.
- Add basic Playwright smoke tests for auth gate, search, save-to-inventory, and listing generation.

## First Beta API Surface

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | `GET` | Deployment and environment readiness check |
| `/api/searches` | `POST` | Run a real comp search |
| `/api/searches` | `GET` | List prior searches |
| `/api/inventory` | `GET` | List inventory |
| `/api/inventory` | `POST` | Save sourced item |
| `/api/inventory/:id` | `PATCH` | Update status, notes, or pricing |
| `/api/listings/generate` | `POST` | Generate a listing draft |

## Acceptance Bar

A build is beta-ready when:

- A new user can sign up, run a real eBay search, save one item, refresh, and still see it.
- The search response explains the comp count and confidence, not only the verdict.
- Listing generation returns a copyable title and description in under 10 seconds for cached or uncached requests.
- All product gates pass: `npm run typecheck`, `npm run lint`, and `npm run build`.
- `/api/health` reports no missing production environment variables in the deployed environment.
