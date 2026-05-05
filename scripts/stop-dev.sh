#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
KEEP_DB="${KEEP_DB:-false}"

if command -v node >/dev/null 2>&1 && node -e "process.exit(0)" >/dev/null 2>&1; then
  NODE_BIN="node"
elif command -v node.exe >/dev/null 2>&1 && node.exe -e "process.exit(0)" >/dev/null 2>&1; then
  NODE_BIN="node.exe"
else
  NODE_BIN=""
fi

for arg in "$@"; do
  case "$arg" in
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

  if [[ -z "$pids" ]]; then
    echo "No process is listening on port $port."
    return
  fi

  for pid in $pids; do
    kill_tree "$pid"
  done
}

stop_port "$PORT"

if [[ "$KEEP_DB" != "true" ]]; then
  if [[ -z "$NODE_BIN" ]]; then
    echo "Node.js was not found; skipped database stop."
  elif ! "$NODE_BIN" scripts/db-url-info.mjs | "$NODE_BIN" -e "let data=''; process.stdin.on('data', c => data += c); process.stdin.on('end', () => process.exit(JSON.parse(data).isLocalSupabase ? 0 : 1));"; then
    echo "Hosted database detected; skipped database stop."
  elif command -v supabase >/dev/null 2>&1; then
    echo "Stopping local Supabase..."
    supabase stop
  else
    echo "Supabase CLI not found; skipped database stop."
  fi
fi
