#!/usr/bin/env python3
import asyncio
import json
import logging
import mimetypes
import os
import random
import socket
import string
import sys
import threading
import time
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import websockets

# Configuration
HTTP_PORT = 8000
WS_PORT = 8001
HOST = "0.0.0.0"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("ChessServer")

def get_lan_ip():
    """Discover local network IP address"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

# In-memory multiplayer room storage
class ChessRoom:
    def __init__(self, code, creator_color="w", initial_time=600, increment=0):
        self.code = code
        self.initial_time = initial_time
        self.increment = increment
        self.white_time = initial_time
        self.black_time = initial_time
        self.active_turn = "w"
        self.last_clock_tick = time.time()
        self.has_started = False
        self.creator_choice = creator_color # 'w', 'b', or 'random'
        
        self.players = {
            "w": None, # websocket
            "b": None  # websocket
        }
        self.player_names = {
            "w": "White Player",
            "b": "Black Player"
        }
        self.spectators = set()
        self.moves = []
        self.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        self.status = "waiting" # 'waiting', 'playing', 'ended'
        self.winner = None
        self.rematch_requests = set() # set of 'w' or 'b'

    def assign_slots(self, ws, name="Player"):
        if self.creator_choice == "random":
            c = random.choice(["w", "b"])
        else:
            c = self.creator_choice
            
        other = "b" if c == "w" else "w"

        if self.players[c] is None:
            self.players[c] = ws
            self.player_names[c] = name or ("White" if c == "w" else "Black")
            return c
        elif self.players[other] is None:
            self.players[other] = ws
            self.player_names[other] = name or ("White" if other == "w" else "Black")
            return other
        else:
            self.spectators.add(ws)
            return "spectator"

    def get_role(self, ws):
        if self.players["w"] == ws:
            return "w"
        if self.players["b"] == ws:
            return "b"
        return "spectator"

    def update_clock(self):
        if not self.has_started or self.status != "playing" or self.initial_time == 0:
            return
        now = time.time()
        elapsed = now - self.last_clock_tick
        self.last_clock_tick = now

        if self.active_turn == "w":
            self.white_time = max(0, self.white_time - elapsed)
            if self.white_time <= 0:
                self.status = "ended"
                self.winner = "Black"
        else:
            self.black_time = max(0, self.black_time - elapsed)
            if self.black_time <= 0:
                self.status = "ended"
                self.winner = "White"

    def to_state_dict(self):
        self.update_clock()
        return {
            "code": self.code,
            "status": self.status,
            "fen": self.fen,
            "turn": self.active_turn,
            "whiteName": self.player_names["w"],
            "blackName": self.player_names["b"],
            "hasWhite": self.players["w"] is not None,
            "hasBlack": self.players["b"] is not None,
            "whiteTime": round(self.white_time, 1),
            "blackTime": round(self.black_time, 1),
            "initialTime": self.initial_time,
            "increment": self.increment,
            "movesCount": len(self.moves),
            "winner": self.winner
        }

rooms = {}

def generate_room_code():
    chars = string.ascii_uppercase + string.digits
    for _ in range(100):
        code = "".join(random.choices(chars, k=5))
        if code not in rooms:
            return code
    return "CHESS" + str(random.randint(100, 999))

class ChessHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def log_message(self, format, *args):
        # Quiet regular file logging
        pass

async def broadcast_room(room, message_dict, exclude=None):
    payload = json.dumps(message_dict)
    all_ws = [room.players["w"], room.players["b"]] + list(room.spectators)
    tasks = []
    for ws in all_ws:
        if ws and ws != exclude:
            try:
                tasks.append(ws.send(payload))
            except Exception:
                pass
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

async def ws_handler(websocket):
    current_room = None
    player_role = None

    try:
        async for raw_msg in websocket:
            try:
                data = json.loads(raw_msg)
            except json.JSONDecodeError:
                continue

            action = data.get("action")

            # 1. CREATE ROOM
            if action == "create_room":
                code = generate_room_code()
                pref_color = data.get("color", "random")
                initial_time = int(data.get("time", 600))
                increment = int(data.get("increment", 0))
                name = data.get("name", "Player 1")

                room = ChessRoom(code, creator_color=pref_color, initial_time=initial_time, increment=increment)
                rooms[code] = room
                current_room = room

                player_role = room.assign_slots(websocket, name)
                logger.info(f"Room created: {code} by role {player_role}")

                await websocket.send(json.dumps({
                    "type": "room_created",
                    "code": code,
                    "role": player_role,
                    "state": room.to_state_dict()
                }))

            # 2. JOIN ROOM
            elif action == "join_room":
                code = data.get("code", "").strip().upper()
                name = data.get("name", "Player 2")

                if code not in rooms:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": f"Room code '{code}' not found."
                    }))
                    continue

                room = rooms[code]
                current_room = room
                player_role = room.assign_slots(websocket, name)

                if room.players["w"] and room.players["b"] and room.status == "waiting":
                    room.status = "playing"
                    room.has_started = True
                    room.last_clock_tick = time.time()

                logger.info(f"Player joined room {code} as {player_role}")

                # Notify the joining player
                await websocket.send(json.dumps({
                    "type": "room_joined",
                    "code": code,
                    "role": player_role,
                    "state": room.to_state_dict()
                }))

                # Broadcast updated room state to all players
                await broadcast_room(room, {
                    "type": "opponent_joined",
                    "role": player_role,
                    "name": name,
                    "state": room.to_state_dict()
                }, exclude=websocket)

            # 3. PLAYER MOVE
            elif action == "move":
                if not current_room:
                    continue

                role = current_room.get_role(websocket)
                if role != current_room.active_turn:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": "Not your turn."
                    }))
                    continue

                move_data = data.get("move") # { from, to, promotion, san }
                fen = data.get("fen")
                is_game_over = data.get("gameOver", False)
                winner = data.get("winner", None)

                # Add increment
                current_room.update_clock()
                if current_room.increment > 0:
                    if role == "w":
                        current_room.white_time += current_room.increment
                    else:
                        current_room.black_time += current_room.increment

                current_room.fen = fen
                current_room.moves.append(move_data)
                current_room.active_turn = "b" if role == "w" else "w"
                current_room.last_clock_tick = time.time()

                if is_game_over:
                    current_room.status = "ended"
                    current_room.winner = winner

                # Broadcast move to all in room
                await broadcast_room(current_room, {
                    "type": "move_made",
                    "move": move_data,
                    "state": current_room.to_state_dict()
                })

            # 4. CHAT / EMOJI REACTION
            elif action == "reaction":
                if not current_room:
                    continue
                emoji = data.get("emoji", "👋")
                role = current_room.get_role(websocket)
                await broadcast_room(current_room, {
                    "type": "reaction",
                    "fromRole": role,
                    "emoji": emoji
                })

            # 5. OFFER DRAW
            elif action == "offer_draw":
                if not current_room:
                    continue
                role = current_room.get_role(websocket)
                await broadcast_room(current_room, {
                    "type": "draw_offered",
                    "byRole": role
                }, exclude=websocket)

            # 6. DRAW RESPONSE
            elif action == "draw_response":
                if not current_room:
                    continue
                accepted = data.get("accepted", False)
                if accepted:
                    current_room.status = "ended"
                    current_room.winner = "Draw"
                    await broadcast_room(current_room, {
                        "type": "draw_agreed",
                        "state": current_room.to_state_dict()
                    })
                else:
                    await broadcast_room(current_room, {
                        "type": "draw_declined"
                    }, exclude=websocket)

            # 7. RESIGN
            elif action == "resign":
                if not current_room:
                    continue
                role = current_room.get_role(websocket)
                winner = "Black" if role == "w" else "White"
                current_room.status = "ended"
                current_room.winner = winner
                await broadcast_room(current_room, {
                    "type": "player_resigned",
                    "resignedRole": role,
                    "winner": winner,
                    "state": current_room.to_state_dict()
                })

            # 8. REMATCH
            elif action == "rematch_request":
                if not current_room:
                    continue
                role = current_room.get_role(websocket)
                current_room.rematch_requests.add(role)

                if len(current_room.rematch_requests) >= 2:
                    # Both agreed - swap colors and reset board
                    old_w = current_room.players["w"]
                    old_b = current_room.players["b"]
                    old_w_name = current_room.player_names["w"]
                    old_b_name = current_room.player_names["b"]

                    current_room.players["w"] = old_b
                    current_room.players["b"] = old_w
                    current_room.player_names["w"] = old_b_name
                    current_room.player_names["b"] = old_w_name

                    current_room.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                    current_room.moves = []
                    current_room.white_time = current_room.initial_time
                    current_room.black_time = current_room.initial_time
                    current_room.active_turn = "w"
                    current_room.has_started = True
                    current_room.status = "playing"
                    current_room.winner = None
                    current_room.rematch_requests.clear()
                    current_room.last_clock_tick = time.time()

                    # Send role updates
                    if current_room.players["w"]:
                        await current_room.players["w"].send(json.dumps({
                            "type": "rematch_started",
                            "yourRole": "w",
                            "state": current_room.to_state_dict()
                        }))
                    if current_room.players["b"]:
                        await current_room.players["b"].send(json.dumps({
                            "type": "rematch_started",
                            "yourRole": "b",
                            "state": current_room.to_state_dict()
                        }))
                else:
                    await broadcast_room(current_room, {
                        "type": "rematch_requested",
                        "byRole": role
                    }, exclude=websocket)

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if current_room:
            role = current_room.get_role(websocket)
            if role in ["w", "b"]:
                current_room.players[role] = None
                await broadcast_room(current_room, {
                    "type": "opponent_disconnected",
                    "role": role,
                    "state": current_room.to_state_dict()
                })
            elif websocket in current_room.spectators:
                current_room.spectators.remove(websocket)

def start_http_server():
    httpd = ThreadingHTTPServer((HOST, HTTP_PORT), ChessHTTPHandler)
    logger.info(f"HTTP Server serving on http://{HOST}:{HTTP_PORT}")
    httpd.serve_forever()

async def main():
    lan_ip = get_lan_ip()
    
    # Start HTTP in daemon thread
    t = threading.Thread(target=start_http_server, daemon=True)
    t.start()

    logger.info("=" * 50)
    logger.info("♟️  ANTIGRAVITY CHESS MULTIPLAYER SERVER")
    logger.info("=" * 50)
    logger.info(f"👉 Local Access:   http://localhost:{HTTP_PORT}")
    logger.info(f"👉 Network (LAN):  http://{lan_ip}:{HTTP_PORT}")
    logger.info(f"👉 WebSocket Port: {WS_PORT}")
    logger.info("Share the Network link with anyone on your Wi-Fi to play!")
    logger.info("=" * 50)

    # Start WebSocket Server
    async with websockets.serve(ws_handler, HOST, WS_PORT):
        await asyncio.Future() # keep running

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nServer stopped.")
