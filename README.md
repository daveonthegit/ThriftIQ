# ThriftIQ Web Prototype

ThriftIQ is an AI-assisted resale sourcing and inventory platform for fashion-focused resellers.

This repository is initialized for the v2 web prototype, focused on validating the core sourcing loop:

- Search marketplace comparables
- Estimate resale value and profit
- Generate BUY/SKIP recommendations
- Draft resale listings
- Track inventory and resale workflow

## Product Requirements

The current PRD lives at [docs/thriftiq_prd_v2_web_prototype.md](docs/thriftiq_prd_v2_web_prototype.md).

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tamagui
- TanStack Query
- React Hook Form + Zod
- Clerk
- Supabase Postgres and Storage
- Drizzle ORM
- Upstash Redis
- Vercel AI SDK
- Vercel Analytics

## Getting Started

Install dependencies:

```bash
npm install
```

Copy environment variables:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database

The Drizzle schema lives in [src/lib/db/schema.ts](src/lib/db/schema.ts).

Generate migrations:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```
