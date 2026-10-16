#!/usr/bin/env bash
# Quick launcher for Antigravity Chess (Pass & Play + LAN Multiplayer)

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo "   ♟️  Antigravity Chess - Pass & Play & LAN Multiplayer"
echo "=========================================================="
echo ""
echo "Select mode to launch:"
echo "1) Start Multiplayer LAN Server (Play across devices on Wi-Fi)"
echo "2) Open Offline Pass & Play Game directly in Browser"
echo ""

read -t 5 -p "Enter choice [1 or 2] (Default: 1 in 5s): " CHOICE
echo ""

if [ "$CHOICE" = "2" ]; then
    echo "Opening offline game..."
    if which xdg-open > /dev/null; then
        xdg-open "$DIR/index.html" 2>/dev/null || true
    elif which open > /dev/null; then
        open "$DIR/index.html" 2>/dev/null || true
    fi
    echo "Opened file://$DIR/index.html"
else
    echo "Launching Antigravity Chess Multiplayer Server..."
    python3 "$DIR/server.py"
fi
