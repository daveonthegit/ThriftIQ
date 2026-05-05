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

"$NODE_BIN" scripts/storage-setup.mjs "${1:-}"
