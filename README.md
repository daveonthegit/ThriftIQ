# ThriftIQ

ThriftIQ is an AI-assisted resale sourcing and inventory platform for fashion-focused resellers.

This repository is moving from a polished web prototype toward a design-partner beta. The current app validates the core sourcing loop:

- Search marketplace comparables
- Estimate resale value and profit
- Generate BUY/SKIP recommendations
- Draft resale listings
- Track inventory and resale workflow

## Product Requirements

The current PRD lives at [docs/thriftiq_prd_v2_web_prototype.md](docs/thriftiq_prd_v2_web_prototype.md).

The productization roadmap lives at [docs/productization-roadmap.md](docs/productization-roadmap.md).

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tamagui
- TanStack Query
- React Hook Form + Zod
- Supabase Auth
- Supabase Postgres and Storage
- Drizzle ORM
- Upstash Redis
- Vercel AI SDK
- Vercel Analytics

## Getting Started

Set up local development:

```powershell
npm run dev:setup
```

Run the development server:

```powershell
npm run dev:local
```

Open `http://localhost:3000`.

The start script clears the target port, installs dependencies if needed, checks the database, applies migrations, starts the app, and keeps the terminal interactive. Type `:q` and press Enter to stop the dev server and clear the port. Hosted Supabase projects are left running automatically; local Supabase is stopped only when `DATABASE_URL` points at `127.0.0.1:54322`.

The local scripts resolve environment variables the same way production does. They prefer the Vercel/Supabase integration database URL names (`POSTGRES_URL`, then `POSTGRES_PRISMA_URL`) before `DATABASE_URL`, and they map Supabase key aliases into the `NEXT_PUBLIC_*`/server names the app uses.

Use another port in PowerShell:

```powershell
npm run dev:local -- -Port 3001
```

Stop without starting:

```powershell
npm run dev:stop:ps
```

Keep the database running when stopping:

```powershell
npm run dev:stop:ps -- -KeepDb
```

Keep a local database running when quitting from the start script:

```powershell
npm run dev:start:ps -- -KeepDb
```

## Bash Dev Scripts

These require Node.js to be installed in the Bash environment you are using. If you are in WSL, install Node inside WSL; Windows `node.exe` is not enough for WSL Bash.

Start local development from Bash:

```bash
npm run dev:start:bash
```

Use another port:

```bash
npm run dev:start:bash -- 3001
```

Skip DB startup/migrations:

```bash
npm run dev:start:bash -- 3001 --skip-db
```

Stop without starting:

```bash
npm run dev:stop:bash
```

Keep the database running when stopping:

```bash
npm run dev:stop:bash -- 3000 --keep-db
```

Keep the database running when quitting from the start script:

```bash
npm run dev:start:bash -- 3000 --keep-db
```

Check the local health endpoint:

```powershell
npm run dev:health
```

## Product Gates

Run these before shipping changes:

```powershell
npm run verify
```

Build locally using the same env resolution as the startup scripts:

```powershell
npm run build:local
```

Check deployment readiness:

```powershell
curl http://localhost:3000/api/health
```

`productionReady` is only expected to be `true` when all production environment variables are configured.

## Database

The Drizzle schema lives in [src/lib/db/schema.ts](src/lib/db/schema.ts).

For a hosted Supabase project:

1. Open [database.new](https://database.new).
2. Create a project named `thriftiq-dev`.
3. In `Project Settings` -> `API Keys`, create/copy:
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the `sb_publishable_...` key
   - `SUPABASE_SECRET_KEY`: the `sb_secret_...` key
4. In `Project Settings` -> `Data API`, copy the Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
5. In `Project Settings` -> `Database`, copy a Postgres connection string into `DATABASE_URL`.
6. In `Storage`, create a private bucket named `receipts`.

Do not put `SUPABASE_SECRET_KEY` in browser code or paste it into chat.

Authentication uses Supabase Auth. In the Supabase dashboard, enable email/password auth under `Authentication` -> `Providers` -> `Email`. OAuth buttons require enabling the matching Supabase provider first.

For Vercel production, use the Supabase connection pooler URL for `DATABASE_URL`, not the direct `db.<project-ref>.supabase.co` URL. In Supabase, open `Project Settings` -> `Database` -> `Connection string` and choose the pooler connection string. Vercel/serverless deployments should use the transaction pooler host, usually on port `6543`, because direct database hosts can fail DNS/network resolution from serverless runtimes.

The production `DATABASE_URL` should look similar to:

```text
postgresql://postgres.<project-ref>:<encoded-password>@aws-...pooler.supabase.com:6543/postgres?sslmode=require
```

If username login fails but email login starts working, check `DATABASE_URL` first. Username login resolves `users.username` through Postgres, while plain email login can reach Supabase Auth before app account data is loaded.

If you connected Supabase through the Vercel integration, Vercel may provide the database URL as `POSTGRES_URL` or `POSTGRES_PRISMA_URL` instead of `DATABASE_URL`. The app supports those names too and prefers `POSTGRES_URL` when present because the integration uses pooled URLs. If a stale `DATABASE_URL` is still present and points to `db.<project-ref>.supabase.co`, delete it or replace it with the pooler URL to avoid confusion.

The integration may also provide public and server Supabase keys under its default names:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The app supports those names as fallbacks for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.

You can check which variable the deployed app is using from:

```text
/api/health
```

The response includes `environment.databaseUrlSource` without exposing the secret value.

You can also create or verify the private `receipts` bucket from the repo:

```powershell
npm run storage:setup
```

```bash
npm run storage:setup:bash
```

The database setup scripts also run storage setup after migrations.

For local development, use a running Postgres database. The startup scripts run database setup automatically. They default to the local Supabase Postgres URL:

```text
postgres://postgres:postgres@127.0.0.1:54322/postgres
```

If you use Supabase CLI, start Supabase first:

```powershell
supabase start
```

Set up and migrate the database from PowerShell:

```powershell
npm run db:setup
```

Or from Bash:

```bash
npm run db:setup:bash
```

Check database reachability:

```powershell
npm run db:check:ps
```

```bash
npm run db:check:bash
```

Generate migrations:

```powershell
npm run db:generate
```

Apply migrations:

```powershell
npm run db:migrate
```

## Search Limits

New users start on the `Free` plan with `10` searches. Search entitlement is stored on the `users` table:

- `plan`
- `search_limit`
- `unlimited_searches`

To give yourself unlimited searches, sign in once so your profile row exists, then run:

```powershell
npm run user:grant-unlimited -- your@email.com
```

You can also use your username:

```powershell
npm run user:grant-unlimited -- your_username
```

To return a user to the free limit:

```powershell
npm run user:revoke-unlimited -- your@email.com
```

## Sold Comps

Searches use the Apify `caffein.dev/ebay-sold-listings` actor when `APIFY_TOKEN` is configured. Without `APIFY_TOKEN`, the app falls back to seeded demo comps so local UI work still runs.

Add this locally and in Vercel:

```text
APIFY_TOKEN=your_apify_token
```

The Codex MCP server for Apify uses the same `APIFY_TOKEN` environment variable.
