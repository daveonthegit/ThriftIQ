#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@127.0.0.1:54322/postgres}"
SKIP_SUPABASE_START="${SKIP_SUPABASE_START:-false}"

cd "$ROOT"

if command -v node >/dev/null 2>&1 && node -e "process.exit(0)" >/dev/null 2>&1; then
  NODE_BIN="node"
elif command -v node.exe >/dev/null 2>&1 && node.exe -e "process.exit(0)" >/dev/null 2>&1; then
  NODE_BIN="node.exe"
else
  echo "Node.js was not found for this Bash environment." >&2
  echo "Install Node inside this shell, or use the PowerShell scripts." >&2
  exit 1
fi

ensure_dependencies() {
  if [[ ! -x "node_modules/.bin/drizzle-kit" ]]; then
    echo "Dependencies are missing. Running npm install..."
    npm install
  fi
}

ensure_env() {
  if [[ ! -f ".env.local" ]]; then
    if [[ ! -f ".env.example" ]]; then
      echo ".env.example was not found." >&2
      exit 1
    fi

    cp .env.example .env.local
    echo "Created .env.local from .env.example."
  fi

  if grep -q '^DATABASE_URL=' .env.local; then
    if grep -q '^DATABASE_URL=$' .env.local; then
      sed -i.bak "s|^DATABASE_URL=$|DATABASE_URL=$DEFAULT_DATABASE_URL|" .env.local
      rm -f .env.local.bak
    fi
  else
    printf '\nDATABASE_URL=%s\n' "$DEFAULT_DATABASE_URL" >> .env.local
  fi

  DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | head -n 1 | cut -d '=' -f 2- | sed "s/^['\"]//;s/['\"]$//")"
  export DATABASE_URL
}

check_port() {
  "$NODE_BIN" -e "
    const net = require('net');
    const url = new URL(process.env.DATABASE_URL);
    const socket = net.createConnection({ host: url.hostname, port: Number(url.port || 5432) });
    const timeout = setTimeout(() => {
      socket.destroy();
      console.error('Timed out connecting to ' + url.hostname + ':' + (url.port || 5432));
      process.exit(1);
    }, 2000);
    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.end();
    });
    socket.on('error', error => {
      clearTimeout(timeout);
      console.error(error.message);
      process.exit(1);
    });
  "
}

is_local_supabase_url() {
  "$NODE_BIN" -e "
    const url = new URL(process.env.DATABASE_URL);
    const isLocal = (url.hostname === '127.0.0.1' || url.hostname === 'localhost') && Number(url.port || 5432) === 54322;
    process.exit(isLocal ? 0 : 1);
  "
}

start_supabase_if_available() {
  if [[ "$SKIP_SUPABASE_START" == "true" ]]; then
    return
  fi

  if ! is_local_supabase_url; then
    return
  fi

  if ! command -v supabase >/dev/null 2>&1; then
    return
  fi

  echo "Local Supabase database is not reachable. Starting Supabase..."
  supabase start
}

ensure_dependencies
ensure_env

MASKED_DATABASE_URL="$("$NODE_BIN" scripts/db-url-info.mjs "$DATABASE_URL" --mask)"
echo "Checking database at $MASKED_DATABASE_URL"
if ! check_port; then
  start_supabase_if_available
fi

if ! check_port; then
  echo
  echo "Database is not reachable."
  echo "For local Supabase, start it with: supabase start"
  echo "Or set DATABASE_URL in .env.local to a running Postgres database."
  exit 1
fi

if ! find drizzle -maxdepth 1 -name '*.sql' -print -quit | grep -q .; then
  echo "No Drizzle migrations found. Generating initial migration..."
  npm run db:generate
fi

echo "Applying database migrations..."
npm run db:migrate

echo "Preparing Supabase storage..."
bash scripts/storage-setup.sh

echo
echo "Database setup complete."
