#!/usr/bin/env bash
# Start Nucleus Pulse locally. Do NOT open index.html as file:// — use this server.
cd "$(dirname "$0")"
PORT="${1:-8080}"
echo ""
echo "  Nucleus Pulse"
echo "  Open: http://localhost:${PORT}"
echo "  Press Ctrl+C to stop"
echo ""
exec python3 -m http.server "$PORT"
