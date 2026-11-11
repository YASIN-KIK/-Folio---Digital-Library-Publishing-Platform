#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKEND_PORT="${BACKEND_PORT:-8080}"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
else
  echo "⚠️  No .env.local found. Copy .env.local.example → .env.local and fill in ALO_API_KEY / ALO_API_BASE_URL / ALO_SPACE_SLUG."
  echo "   Continuing anyway — /api/data shows placeholder data; assistant + connectors stay disabled without a key."
fi

# Resolve sandbox-only skill import paths through local sibling directories.
SKILLS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export PYTHONPATH="$SKILLS_ROOT/alo-api-agents/scripts:$SKILLS_ROOT/alo-api-connectors/scripts:$SKILLS_ROOT/alo-api-mcp/scripts${PYTHONPATH:+:$PYTHONPATH}"

VENV="$SCRIPT_DIR/.venv"
if [[ ! -d "$VENV" ]]; then
  echo "📦 Creating local venv ($VENV)…"
  python3 -m venv "$VENV"
fi
PY="$VENV/bin/python"
if ! "$PY" -c "import uvicorn, fastapi, httpx, multipart" >/dev/null 2>&1; then
  echo "📦 Installing backend deps (fastapi, uvicorn, httpx, python-multipart)…"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q fastapi uvicorn httpx python-multipart
fi

if [[ ! -d node_modules || ! -d node_modules/zustand ]]; then
  echo "📦 Installing frontend deps (npm install)…"
  npm install
fi

cleanup() {
  trap - INT TERM EXIT
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "🚀 Backend  → http://127.0.0.1:$BACKEND_PORT  (uvicorn)"
"$PY" -m uvicorn main:app --host 127.0.0.1 --port "$BACKEND_PORT" &
BACKEND_PID=$!

echo "⚡ Frontend → http://localhost:5173  (vite HMR; open this one)"
npm run dev
