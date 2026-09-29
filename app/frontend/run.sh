#!/bin/sh
cd "$(dirname "$0")"
[ -d node_modules ] || npm install --no-audit --no-fund
echo "PC Assist is starting at http://localhost:5173"
echo "The backend must be running too (run.sh in the backend folder)."
npm run dev -- --open
