# ThriftIQ PRD — v2 (Web Prototype)

## Product Name
ThriftIQ

## Product Type
AI-assisted resale sourcing and inventory platform for fashion-focused resellers.

**v2 scope:** Web prototype, deployed on Vercel. Mobile-responsive, designed to validate the core BUY/SKIP loop and listing generation before investing in a native React Native app.

---

# 1. Product Overview

ThriftIQ helps resellers quickly determine whether an item is worth purchasing for resale.

The application provides:
- real marketplace comparables
- estimated profit calculations
- BUY/SKIP recommendations
- AI-generated listing drafts
- inventory tracking
- resale workflow management

The initial prototype focuses on fashion and streetwear reselling workflows across marketplaces such as eBay, Depop, Mercari, and Grailed.

The product begins as a sourcing intelligence tool and evolves into a complete reseller operating system.

## Why Web First

The web prototype exists to:
- validate the core sourcing loop (search → comp → profit → recommendation) with real users in 4–6 weeks
- avoid app store review cycles during rapid iteration
- enable easier sharing for early user testing and demos
- defer mobile-native complexity (camera, barcode scanning, push notifications) until product–market fit signals are clear

The native React Native app remains the long-term target. The web prototype is built with stack choices that allow significant code reuse when the mobile app is built (Tamagui, shared Supabase backend, shared Drizzle schema).

---

# 2. Problem Statement

Resellers currently waste significant time manually:
- searching marketplaces
- comparing sold listings
- estimating fees
- calculating profit margins
- creating listings
- tracking inventory

Existing workflows are fragmented across:
- marketplace apps
- calculator apps
- spreadsheets
- notes apps
- inventory tools

This creates:
- slow sourcing decisions
- inconsistent pricing
- missed opportunities
- poor inventory organization

Fashion and streetwear resellers particularly rely on speed and trend awareness while sourcing items in physical locations such as thrift stores, flea markets, bins, and garage sales.

The web prototype acknowledges that mobile-while-sourcing is the eventual target, but the **decision logic and pricing intelligence** can be validated on a responsive web app first — resellers also do significant pre-sourcing research at home (auctions, online thrift, restocks).

---

# 3. Vision Statement

ThriftIQ begins as a sourcing assistant and evolves into the operating system for modern resellers.

Long-term vision:
- AI-powered item recognition
- real-time pricing intelligence
- cross-market inventory management
- automated listing workflows
- resale analytics
- trend prediction
- sourcing intelligence

---

# 4. Target Audience

## Primary Audience
Fashion-focused resellers:
- vintage clothing resellers
- streetwear sellers
- sneaker resellers
- casual side-hustle thrifters

## Secondary Audience
General resellers using:
- eBay
- Depop
- Mercari
- Grailed

## Prototype Audience
For the web prototype specifically, we target:
- existing power resellers willing to test on desktop/tablet
- resellers who do online sourcing (eBay auctions, online estate sales, marketplace flips)
- design partners who will provide structured feedback

---

# 5. Marketplace Priority

Priority order:
1. eBay
2. Depop
3. Mercari
4. Grailed
5. Whatnot
6. Facebook Marketplace
7. Poshmark

**Prototype scope:** eBay only (sold listings via official API). Other marketplaces are progressively added post-validation.

---

# 6. Prototype Goals

The web prototype should allow users to:

1. Sign in with email or social auth
2. Search an item manually
3. View real eBay sold comps
4. Calculate estimated resale profit
5. Receive BUY/SKIP recommendations
6. Save items to inventory
7. Generate marketplace-ready listings
8. Track profits and basic inventory state

---

# 7. Non-Goals (Prototype)

The following are intentionally excluded from prototype scope:

- native iOS/Android app
- AI camera recognition
- automatic image scanning
- barcode scanning (deferred until native app — relies on mobile camera)
- automated marketplace posting
- inventory synchronization across marketplaces
- advanced analytics dashboards
- seller accounting/tax systems
- shipping label integrations
- offline mode

---

# 8. Core User Flow

```text
Sign In (Clerk)
→ Search Item
→ View Comparable Listings
→ Enter Item Cost
→ Receive Profit Estimate
→ Receive BUY/SKIP Recommendation
→ Save To Inventory (Supabase)
→ Generate Listing Draft (AI)
```

---

# 9. Core Features

## 9.1 Marketplace Item Search

### Description
Users manually search for an item using keywords.

### Example Searches
- Carhartt Detroit Jacket J97
- Chrome Hearts Hoodie
- Vintage Harley Tee
- Nike SB Dunk Low

### Requirements
- eBay sold listings via Browse API + Marketplace Insights API
- normalized pricing
- fast search response (<2s perceived)
- Redis-cached frequent searches (24h TTL)

### Prototype Scope
- eBay sold listings only
- additional marketplaces post-prototype

---

## 9.2 Comparable Listings Engine

### Description
The app retrieves and normalizes marketplace comps.

### Features
- sold price aggregation
- average sale price
- median sale price
- recent sales display (last 90 days)
- comp relevance filtering
- outlier removal (1.5x IQR)

### Future Scope
- trend analysis
- sell-through rate
- demand scoring
- pricing confidence scores

---

## 9.3 Profit Calculator

### Description
Users enter:
- purchase price
- estimated shipping
- target marketplace (defaults to eBay)

The app calculates:
- estimated marketplace fees
- estimated payout
- estimated net profit
- profit margin percentage

### Recommendation Engine
The app generates one of:
- **BUY** (margin ≥ configurable threshold, default 50%)
- **SKIP** (margin below threshold)
- **LOW CONFIDENCE** (insufficient comps, high variance)

Thresholds are user-configurable in settings.

---

## 9.4 Saved Inventory

### Description
Users can save sourced items into inventory.

### Inventory Fields
- title
- category
- target marketplace
- purchase price
- estimated value
- status
- receipt image (uploaded to Supabase Storage)
- notes
- date acquired

### Statuses
- sourced
- listed
- sold
- shipped
- archived

---

## 9.5 Listing Generator

### Description
AI-assisted marketplace listing generation.

### Generated Content
- optimized title (≤80 chars for eBay)
- item description
- keywords/tags
- suggested pricing (anchored to comp median)

### Style Goals
Listings should feel:
- marketplace-native
- SEO optimized
- concise
- mobile friendly

### AI Provider Strategy
Routed via Vercel AI SDK so providers can be swapped or A/B tested:
- Claude (primary — strong tone control for resale copy)
- OpenAI GPT-4 class (fallback)
- Gemini (fallback)

### Future Scope
- platform-specific formatting (Depop tone vs eBay tone vs Grailed tone)
- hashtag optimization
- bulk generation

---

## 9.6 Saved Searches and History

### Description
Users can:
- revisit previous searches
- view prior comps
- track sourcing history

### Goals
Reduce repetitive searches and improve sourcing speed.

---

## 9.7 Receipt and Profit Tracking

### Description
Users can track:
- total inventory spend
- estimated inventory value
- realized profit
- pending profit

Receipt images are uploaded via the web app to Supabase Storage.

### Future Scope
- monthly analytics
- sourcing trends
- ROI dashboards
- OCR receipt parsing

---

# 10. Technical Architecture (Web Prototype)

## Frontend

### Stack
- **Next.js 15** (App Router) — deployed on Vercel
- **TypeScript**
- **Tamagui** — design system, runs on web now and React Native later
- **Zustand** — client UI state
- **TanStack Query** — server state, caching, optimistic updates
- **React Hook Form + Zod** — form handling and validation
- **Lucide React** — icons

### Why Tamagui (vs. shadcn or plain Tailwind)
- single component library that compiles to web (DOM) and React Native
- when the native app is built later, ~70% of UI code transfers directly
- compile-time optimizer produces clean CSS for web
- token-based theming supports the dark-mode streetwear aesthetic out of the box

### Design Direction
Streetwear and sneaker culture inspired UI:
- dark mode default
- bold typography (Inter or similar variable font; consider a display face for headers)
- card-based layouts
- fast, tactile interactions
- BUY/SKIP indicators prominent and color-coded

Inspired by:
- StockX
- Grailed
- SNKRS
- Alias

### Responsive Targets
- mobile web (375px and up) — primary, since resellers may pull the site up on a phone in the field
- tablet
- desktop (sourcing-from-home use case)

---

## Backend

### Stack
- **Next.js Route Handlers** (serverless functions on Vercel)
- **TypeScript**
- **Zod** — request/response validation

### Why Next.js Route Handlers (this time)
For the web prototype, the frontend and API live in the same Vercel deployment. This is genuinely the best path for a web-first product — single repo, single deploy, shared types end-to-end. The earlier critique against Next.js applied to a mobile-only architecture; for a web prototype, Next.js earns its keep.

### Responsibilities
- eBay API integration
- pricing calculations and recommendation logic
- AI listing generation (via Vercel AI SDK)
- inventory CRUD
- webhook receivers (Clerk user sync)

### Long-Running / Scraping Work
For anything beyond eBay's official API (later phases), use **Vercel background functions** or offload to a separate worker service (e.g., Railway-hosted Node worker) with a job queue. Do not run scraping in the request path.

---

## Database

### Stack
- **Supabase Postgres**
- **Drizzle ORM** — type-safe queries, schema-as-code

### Why Supabase
- Postgres with reasonable pricing and a strong free tier
- bundles Storage (for receipt images) so we don't need separate S3
- Row Level Security for tenant isolation when needed
- realtime channel available later for live inventory sync
- Drizzle works cleanly against Supabase Postgres

### Core Tables
- `users` (synced from Clerk via webhook; stores Clerk user_id as foreign key)
- `inventory_items`
- `searches`
- `comps`
- `generated_listings`
- `receipts`
- `marketplace_results`

### Schema-First Approach
Drizzle migrations live in the repo. Supabase is treated as a Postgres host — we do not couple to Supabase-specific schema features beyond Storage and Auth helpers.

---

## Authentication

### Stack
- **Clerk**

### Why Clerk
- drop-in Next.js integration with `@clerk/nextjs`
- email/password, Google, Apple, GitHub social auth out of the box
- pre-built UI components (`<SignIn />`, `<UserButton />`) accelerate prototype delivery
- handles session management, password reset, MFA without custom code
- webhook to sync user records into Supabase Postgres on signup

### Auth Flow
```text
User signs up via Clerk
→ Clerk webhook fires to /api/webhooks/clerk
→ Creates corresponding row in Supabase users table
→ Clerk session token used to authorize Next.js Route Handlers
→ Drizzle queries scoped to user_id from Clerk session
```

### Future Scope
Migration to Clerk + Supabase JWT integration for direct RLS-protected queries from the client when realtime is added.

---

## File Storage

### Stack
- **Supabase Storage** — receipt images, future item photos

### Why
- avoids a separate S3/CloudFront setup for the prototype
- public-read buckets for item photos, private buckets for receipts
- signed URL generation built in

---

## Caching

### Stack
- **Upstash Redis** (Vercel marketplace integration)

### Usage
- eBay query result caching (24h TTL on sold comp searches)
- rate limit eBay API consumption
- session-level pricing cache
- trending search optimization

---

## AI Stack

### Stack
- **Vercel AI SDK** — provider-agnostic abstraction
- **Claude** (primary) — listing generation, tone control
- **OpenAI** (fallback) — listing generation
- **Gemini** (fallback)

### Why Vercel AI SDK
- streaming responses out of the box (better perceived performance for listing generation)
- swap providers without rewriting prompts
- structured outputs via Zod schemas

### Prompt-Level Caching
Hash the input feature set (title, category, comps median) and cache generated listings in Redis. Many listings are near-duplicates (10 Carhartt jackets in a week share most of the prompt) — this saves significant cost and latency.

### Deferred AI Features
- image recognition (requires native camera in mobile app)
- OCR receipt parsing
- condition grading
- similarity search

---

## Observability

### Stack
- **Sentry** — error tracking, frontend + backend
- **PostHog** — product analytics, feature flags, session replay
- **Vercel Analytics** — web vitals, traffic

### Why Now (Not Later)
The prototype's whole point is learning from users. Without analytics from day one, we can't measure the success metrics in section 14. PostHog feature flags also enable progressive rollout of risky changes (new pricing thresholds, new prompts).

---

## Email

### Stack
- **Resend** — transactional email (welcome, password reset reminders Clerk doesn't cover, weekly summary in later phases)

---

# 11. System Architecture

```text
Browser (Next.js + Tamagui + TanStack Query)
    ↓
Vercel Edge / Serverless (Next.js Route Handlers)
    ↓
Services Layer
    ├── eBay Service (Browse API + Marketplace Insights)
    ├── Pricing Engine
    ├── Listing Generator (Vercel AI SDK → Claude/OpenAI/Gemini)
    ├── Inventory Service (Drizzle → Supabase Postgres)
    └── Auth Middleware (Clerk)
    ↓
Data Layer
    ├── Supabase Postgres (Drizzle ORM)
    ├── Supabase Storage (receipt images)
    └── Upstash Redis (cache, rate limit)

Cross-cutting:
    ├── Sentry (errors)
    ├── PostHog (analytics, flags)
    └── Resend (email)
```

---

# 12. API Service Breakdown

## eBay Service
Handles:
- Browse API queries for active listings
- Marketplace Insights API for sold comps (last 90 days)
- response normalization
- duplicate filtering
- Redis caching layer

## Pricing Engine
Handles:
- eBay fee calculations (final value fee, payment processing)
- shipping estimate logic
- median/mean/IQR calculation over comps
- BUY/SKIP/LOW CONFIDENCE recommendation

## Listing Generator
Handles:
- title generation (≤80 chars)
- description generation
- keyword/tag suggestion
- prompt-level caching via Redis

## Inventory Service
Handles:
- saved item CRUD
- status transitions
- receipt image upload (signed URLs to Supabase Storage)
- profit aggregation queries

## Auth Middleware
Handles:
- Clerk session verification on Route Handlers
- user_id extraction for scoped queries
- Clerk webhook receiver for user sync

---

# 13. Monetization Strategy

## Primary Model
Freemium usage-based.

### Free Tier
- 10 searches/day
- 3 listing generations/day
- 25 inventory items max

### Premium Tier (post-prototype)
- unlimited searches
- unlimited listing generations
- expanded inventory
- priority eBay query queue
- enhanced AI generation (better models, longer context)

### Billing
Stripe via Clerk's billing integration or direct Stripe — decision deferred until prototype validates demand.

---

# 14. Success Metrics

## Prototype Success Metrics
- weekly active users (WAU)
- searches per session
- inventory saves per WAU
- listing generations per WAU
- 7-day and 30-day retention
- BUY recommendation → save conversion rate
- listing generation → copy-to-clipboard rate (proxy for "would publish")
- qualitative: design partner interview signal

## Validation Threshold
We continue investing in the native mobile app if:
- 30-day retention exceeds 25%
- average user generates ≥5 listings per active week
- design partners report the BUY/SKIP signal as "trustworthy"

---

# 15. Risks and Challenges

## eBay API Rate Limits
The Marketplace Insights API has tight quotas. Mitigation: aggressive Redis caching, request coalescing, gradual user onboarding.

## Pricing Accuracy
Users must trust recommendations. Mitigation: surface confidence levels, show comp distribution, never claim certainty when variance is high.

## Web Prototype Adoption
Resellers in the field use phones, not laptops. Mitigation: aggressive mobile-web responsiveness; recruit design partners who do online sourcing.

## Stack Lock-In
Supabase + Clerk + Vercel creates platform dependency. Mitigation: Drizzle keeps the database portable; Clerk-to-other-auth migration is documented but realistic; AI SDK abstracts model providers.

## Future Scraping Risk
Marketplaces beyond eBay may require scraping. Out of prototype scope, but flagged as a Phase 2+ legal/operational risk requiring its own evaluation.

---

# 16. Future Roadmap

## Phase 1 — Web Prototype (current)
- Clerk auth
- eBay sold-comp search
- profit calculator + BUY/SKIP
- AI listing generation (Claude primary)
- inventory CRUD
- Supabase Storage for receipts

## Phase 2 — Web Polish + Validation
- Stripe billing
- analytics dashboards (built on PostHog data)
- saved searches + alerts
- additional marketplaces (Depop, Mercari) via official APIs where available

## Phase 3 — React Native App
- Expo + Expo Router
- Tamagui components shared from web
- shared Supabase backend, shared Drizzle schema
- camera-based features begin (barcode, photo capture)

## Phase 4 — AI Vision
- image recognition
- OCR receipt parsing
- condition grading

## Phase 5 — Reseller OS
- automated listing posting
- cross-marketplace inventory sync
- trend prediction
- full analytics platform

---

# 17. Product Positioning

## Positioning Statement
ThriftIQ helps fashion-focused resellers make faster and smarter sourcing decisions with real-time market intelligence and AI-assisted resale workflows.

## Core Differentiators
- sourcing-focused UX
- resale-specific pricing intelligence
- streetwear-focused experience
- fast BUY/SKIP decision engine
- AI-native listing workflow

---

# 18. Design Principles

## UX Goals
- ultra-fast interactions
- minimal friction
- confidence-oriented UI (show variance, not just averages)
- mobile-first responsive web
- visually aligned with resale culture

## UI Characteristics
- dark mode first
- bold pricing indicators (large, color-coded BUY/SKIP)
- strong typography
- tactile inventory cards
- keyboard shortcuts on desktop (power-user oriented)
- prepared for native port via Tamagui

---

# 19. Stack Summary (Decision Log)

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | Vercel-native, full-stack in one repo |
| UI library | Tamagui | Web now, RN later, shared codebase |
| State (UI) | Zustand | Minimal, ergonomic |
| State (server) | TanStack Query | Caching, optimistic updates |
| Forms | React Hook Form + Zod | Type-safe validation |
| Auth | Clerk | Drop-in, social auth included, fast to ship |
| Database | Supabase Postgres | Managed, bundles Storage |
| ORM | Drizzle | Type-safe, schema-as-code, portable |
| File storage | Supabase Storage | Bundled with DB |
| Cache | Upstash Redis | Vercel marketplace, serverless-friendly |
| AI | Vercel AI SDK + Claude/OpenAI/Gemini | Streaming, provider-agnostic |
| Email | Resend | Modern, simple, Vercel-friendly |
| Observability | Sentry + PostHog + Vercel Analytics | Errors, product analytics, web vitals |
| Hosting | Vercel | Native Next.js, edge runtime |

---
