# ♟️ Antigravity Chess — Offline & LAN Multiplayer

An attractive, modern, and responsive website built for chess players. Play **offline pass-and-play on the same device** or **multiplayer across devices over local Wi-Fi / LAN / browser tabs**. Designed with sleek glassmorphism, procedural sound effects, customizable themes, and full FIDE chess rules compliance.

---

## ✨ Features

### 🌐 Real-Time Multiplayer (LAN & Web)
- **Play Across Devices on the Same Wi-Fi**:
  - Run `./run.sh` or `python3 server.py` on your computer.
  - Generates a **5-character Room Code** (e.g. `7A9B2`) and a **1-click Invite Link** (`http://<lan-ip>:8000/?room=7A9B2`).
  - Friends on phones, tablets, or laptops can join simply by scanning or clicking the link!
- **Zero-Server Multi-Tab Play**:
  - Open two tabs in your browser; they communicate automatically via `BroadcastChannel` even without starting `server.py`!
- **In-Game Floating Emojis**:
  - React in real-time with animated floating reactions (`👏`, `🔥`, `🤯`, `😅`, `👋`, `🤝`).
- **Turn & Piece Protection**:
  - In multiplayer, players can only move their own pieces and only on their turn.
- **Draw Offers, Resignation & Rematch**:
  - Synchronized dialogs for draw agreements and resignations.
  - Automatic Rematch feature that swaps colors (White ⇄ Black) for game 2!

### 📱 Offline Pass-and-Play
- **Auto-Flip Mode**: Board smoothly spins 180° after each turn so whoever holds the phone/device always faces their own side.
- **Fixed View**: Side-by-side view for desktop.
- **Tabletop Mode**: Clocks and badges face opposite directions for a tablet lying flat on a table.

### 🎨 Visuals & Sound
- **5 Board Themes**:
  - 🌿 **Emerald Masters** (Tournament green and cream)
  - 🪵 **Royal Walnut** (Warm maple and walnut)
  - 🌌 **Midnight Cyber** (Deep carbon navy and icy slate)
  - 🏛️ **Obsidian Slate** (Monochrome graphite and ivory)
  - 🍷 **Crimson Velvet** (Royal burgundy and linen)
- **High-Definition Staunton SVG Pieces**: Razor sharp at any resolution (Retina / 4K).
- **Procedural Web Audio API Sound Effects**: Realistic wooden piece knocks, capture impacts, check chimes, castling double-taps, and victory fanfare.

### ⏱️ Chess Clocks & FIDE Rule Compliance
- Presets: Casual (No clock), 3 min (Blitz), 5 min (Blitz), 10 min (Rapid), and 15|10 (with increment).
- En Passant, Kingside & Queenside Castling, Pawn Promotion modal (Q, R, B, N).
- Check, Checkmate, Stalemate, 50-move rule, and Insufficient Material draws.
- SAN move history notation table, Move Undo, and FEN / PGN Export & Import.

---

## 🚀 How to Play

### 1. Multiplayer Across Devices (Same Wi-Fi / LAN)
Run the server launcher:
```bash
cd /home/vivek/.gemini/antigravity/scratch/chess-game
python3 server.py
```
1. Open the URL shown in the console (e.g. `http://localhost:8000` or `http://192.168.x.x:8000`).
2. Click **"🌐 Multiplayer"** → **"Create Room"**.
3. Copy the invite link or share the 5-character Room Code with your friend on their phone or laptop to join!

### 2. Multi-Tab Testing on Same Machine (No Server Required)
1. Open [`index.html`](file:///home/vivek/.gemini/antigravity/scratch/chess-game/index.html) in two browser windows or tabs.
2. In tab 1, click **"🌐 Multiplayer"** → **"Create Room"**.
3. In tab 2, click **"🌐 Multiplayer"** → **"Join Room"** and enter the code. They connect instantly!

### 3. Offline Pass & Play on Same Device
1. Open [`index.html`](file:///home/vivek/.gemini/antigravity/scratch/chess-game/index.html) directly in any browser.
2. Use **Pass & Play** auto-flip mode or tabletop mode.

---

## 📂 File Structure

```
chess-game/
├── index.html          # Main application page with multiplayer lobby & status
├── server.py           # Unified HTTP and WebSocket server for LAN multiplayer
├── run.sh              # Interactive launcher script
├── test_runner.html    # Standalone FIDE rule verification page
├── css/
│   └── style.css       # Responsive styling, floating reactions, board themes
└── js/
    ├── pieces.js       # SVG vector piece definitions & values
    ├── engine.js       # FIDE chess engine (SAN, FEN, PGN, moves)
    ├── audio.js        # Procedural Web Audio API sound synthesizer
    ├── multiplayer.js  # WebSocket & BroadcastChannel real-time multiplayer coordinator
    └── app.js          # Main UI controller & drag-and-drop
```
