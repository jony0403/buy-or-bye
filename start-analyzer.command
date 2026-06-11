#!/bin/bash
set -u

cd "$(dirname "$0")"

ANALYZER_URL="http://127.0.0.1:3920/"

pause_on_error() {
  echo
  read -r -p "Press Enter to close this window..."
}

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found."
  echo "Install Node.js LTS first, then run this file again."
  pause_on_error
  exit 1
fi

if lsof -nP -iTCP:3920 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Buy or Bye server is already running."
  open "$ANALYZER_URL" >/dev/null 2>&1 || true
  exit 0
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  if ! npm install; then
    echo "npm install failed."
    pause_on_error
    exit 1
  fi
fi

echo "Starting Buy or Bye server..."
echo "Close this window or press Ctrl+C to stop."
echo

(sleep 2; open "$ANALYZER_URL" >/dev/null 2>&1 || true) &
exec npm start
