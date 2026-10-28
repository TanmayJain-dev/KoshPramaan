#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [ -f "$BACKEND_DIR/.venv/bin/uvicorn" ]; then
    UVICORN_BIN="$BACKEND_DIR/.venv/bin/uvicorn"
elif [ -f "$BACKEND_DIR/.venv/Scripts/uvicorn.exe" ]; then
    UVICORN_BIN="$BACKEND_DIR/.venv/Scripts/uvicorn.exe"
else
    echo "Backend virtualenv not found. Please run 'make install' first."
    exit 1
fi

echo "=========================================================="
echo " Starting KoshPramaan (कोष-प्रमाण) Full Stack Portal"
echo " AICTE Security Deposit & FDR Portal"
echo "=========================================================="

cleanup() {
    echo ""
    echo "Stopping servers..."
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup INT TERM EXIT

echo ""
echo "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..."
cd "$BACKEND_DIR"
"$UVICORN_BIN" app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

sleep 2

echo "[2/2] Starting Vite Frontend on http://127.0.0.1:5173..."
cd "$FRONTEND_DIR"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

wait
