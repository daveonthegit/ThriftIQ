#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3000}"
SKIP_DB="${SKIP_DB:-false}"
KEEP_DB="${KEEP_DB:-false}"
SERVER_PID=""
CLEANED_UP="false"

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

for arg in "$@"; do
  case "$arg" in
    --skip-db)
      SKIP_DB="true"
      ;;
    --keep-db)
      KEEP_DB="true"
      ;;
    *)
      PORT="$arg"
      ;;
  esac
done

kill_tree() {
  local pid="$1"
  local children
  children="$(trap - EXIT; pgrep -P "$pid" 2>/dev/null || true)"

  for child in $children; do
    kill_tree "$child"
  done

  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping process $pid..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    kill -9 "$pid" 2>/dev/null || true
  fi
}

stop_port() {
  local port="$1"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(trap - EXIT; lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pids="$(trap - EXIT; fuser "$port"/tcp 2>/dev/null || true)"
  fi

  for pid in $pids; do
    kill_tree "$pid"
  done
}

cleanup() {
  if [[ "$CLEANED_UP" == "true" ]]; then
    return
  fi

  CLEANED_UP="true"

  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill_tree "$SERVER_PID"
  fi
  stop_port "$PORT"
  echo "Dev server stopped and port $PORT is clear."

  if [[ "$KEEP_DB" == "true" ]]; then
    echo "Keeping database running."
  elif ! "$NODE_BIN" scripts/db-url-info.mjs | "$NODE_BIN" -e "let data=''; process.stdin.on('data', c => data += c); process.stdin.on('end', () => process.exit(JSON.parse(data).isLocalSupabase ? 0 : 1));"; then
    echo "Hosted database detected; skipped database stop."
  elif command -v supabase >/dev/null 2>&1; then
    echo "Stopping local Supabase..."
    supabase stop
  else
    echo "Supabase CLI not found; skipped database stop."
  fi
}

trap 'cleanup; exit 130' INT TERM

if [[ ! -f ".env.local" && -f ".env.example" ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example."
fi

if [[ ! -x "node_modules/.bin/next" ]]; then
  echo "Dependencies are missing. Running npm install..."
  npm install
fi

if [[ "$SKIP_DB" != "true" ]]; then
  echo "Preparing database..."
  bash scripts/db-setup.sh
fi

echo "Clearing port $PORT..."
stop_port "$PORT"

echo "Starting ThriftIQ at http://localhost:$PORT"
echo "Type :q then press Enter to stop the dev server."
npm run dev -- -p "$PORT" &
SERVER_PID="$!"

while IFS= read -r line; do
  if [[ "$line" == ":q" ]]; then
    break
  fi

  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    wait "$SERVER_PID"
    exit $?
  fi
done

cleanup
exit 0
