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

echo "🏗️  Building production bundle (vite build → dist/)…"
npm run build

echo ""
echo "🚀 Production app → http://127.0.0.1:$BACKEND_PORT  (uvicorn serving dist/)"
echo "   This is the SAME build the deployed sandbox app runs. Open this URL."
echo "   (Re-run this script after editing src/** — prod mode has no HMR.)"
echo ""
exec "$PY" -m uvicorn main:app --host 127.0.0.1 --port "$BACKEND_PORT"
