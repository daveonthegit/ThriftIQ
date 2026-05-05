#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

if [[ -z "${DATABASE_URL:-}" && -f ".env.local" ]]; then
  DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | head -n 1 | cut -d '=' -f 2- | sed "s/^['\"]//;s/['\"]$//")"
fi

DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@127.0.0.1:54322/postgres}"
export DATABASE_URL

"$NODE_BIN" -e "
  const net = require('net');
  const url = new URL(process.env.DATABASE_URL);
  const port = Number(url.port || 5432);
  console.log('Checking database port ' + url.hostname + ':' + port + '...');
  const socket = net.createConnection({ host: url.hostname, port });
  const timeout = setTimeout(() => {
    socket.destroy();
    console.error('Timed out connecting to ' + url.hostname + ':' + port);
    process.exit(1);
  }, 2000);
  socket.on('connect', () => {
    clearTimeout(timeout);
    socket.end();
    console.log('Database port is reachable.');
  });
  socket.on('error', error => {
    clearTimeout(timeout);
    console.error(error.message);
    process.exit(1);
  });
"
