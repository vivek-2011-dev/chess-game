/**
 * Antigravity Chess - Multiplayer Coordinator
 * Supports WebSocket (LAN / Online) and BroadcastChannel (Multi-tab local).
 */

class ChessMultiplayer {
  constructor(app) {
    this.app = app;
    this.ws = null;
    this.broadcastChannel = null;
    this.isMultiplayer = false;
    this.mode = 'none'; // 'websocket' | 'broadcast' | 'none'
    this.roomCode = null;
    this.myRole = null; // 'w' | 'b' | 'spectator'
    this.opponentName = 'Opponent';
    this.isConnected = false;
    this.pendingDrawOffer = false;

    this.initBroadcastChannel();
  }

  initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('antigravity_chess_mp');
        this.broadcastChannel.onmessage = (e) => this.handleMessage(e.data);
      } catch (err) {
        console.warn('BroadcastChannel not supported in this environment');
      }
    }
  }

  getWsUrl() {
    const loc = window.location;
    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = loc.hostname || '127.0.0.1';
    // By default server.py runs WS on port 8001
    return `${proto}//${host}:8001`;
  }

  connectWebSocket() {
    return new Promise((resolve, reject) => {
      const url = this.getWsUrl();
      console.log('Connecting to WebSocket:', url);

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.mode = 'websocket';
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (err) {
            console.error('Failed to parse WS message:', err);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('WebSocket connection error, falling back if needed:', err);
          reject(err);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          if (this.isMultiplayer && this.mode === 'websocket') {
            this.app.notifyMultiplayerStatus('Disconnected from server. Check server.py status.', 'disconnected');
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  async createRoom(color = 'random', time = 600, increment = 0, name = 'Player 1') {
    try {
      if (!this.isConnected || this.mode !== 'websocket') {
        await this.connectWebSocket();
      }

      this.isMultiplayer = true;
      this.ws.send(jsonStr({
        action: 'create_room',
        color,
        time,
        increment,
        name
      }));
    } catch (err) {
      // Fallback to local multi-tab broadcast
      console.log('Using BroadcastChannel for multi-tab multiplayer');
      this.createBroadcastRoom(color, time, increment, name);
    }
  }

  async joinRoom(code, name = 'Player 2') {
    code = code.trim().toUpperCase();
    try {
      if (!this.isConnected || this.mode !== 'websocket') {
        await this.connectWebSocket();
      }

      this.isMultiplayer = true;
      this.ws.send(jsonStr({
        action: 'join_room',
        code,
        name
      }));
    } catch (err) {
      this.joinBroadcastRoom(code, name);
    }
  }

  /* ---------------- MESSAGE DISPATCH ---------------- */

  sendMessage(payload) {
    if (this.mode === 'websocket' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(jsonStr(payload));
    } else if (this.mode === 'broadcast' && this.broadcastChannel) {
      this.broadcastChannel.postMessage(payload);
    }
  }

  handleMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'room_created':
        this.roomCode = msg.code;
        this.myRole = msg.role;
        this.app.onMultiplayerRoomCreated(msg.code, msg.role, msg.state);
        break;

      case 'room_joined':
        this.roomCode = msg.code;
        this.myRole = msg.role;
        this.app.onMultiplayerRoomJoined(msg.code, msg.role, msg.state);
        break;

      case 'opponent_joined':
        this.app.onMultiplayerOpponentJoined(msg.name, msg.role, msg.state);
        break;

      case 'move_made':
        this.app.onRemoteMoveReceived(msg.move, msg.state);
        break;

      case 'reaction':
        this.app.showFloatingEmoji(msg.emoji, msg.fromRole);
        break;

      case 'draw_offered':
        this.app.onRemoteDrawOffered(msg.byRole);
        break;

      case 'draw_agreed':
        this.app.onRemoteDrawAgreed(msg.state);
        break;

      case 'draw_declined':
        this.app.onRemoteDrawDeclined();
        break;

      case 'player_resigned':
        this.app.onRemotePlayerResigned(msg.resignedRole, msg.winner, msg.state);
        break;

      case 'rematch_requested':
        this.app.onRemoteRematchRequested(msg.byRole);
        break;

      case 'rematch_started':
        this.myRole = msg.yourRole;
        this.app.onRemoteRematchStarted(msg.yourRole, msg.state);
        break;

      case 'opponent_disconnected':
        this.app.onOpponentDisconnected(msg.role);
        break;

      case 'error':
        alert(`Multiplayer Notice: ${msg.message}`);
        break;
    }
  }

  /* ---------------- ACTIONS FROM APP ---------------- */

  sendMove(move, fen, isGameOver, winner) {
    if (!this.isMultiplayer) return;
    this.sendMessage({
      action: 'move',
      move,
      fen,
      gameOver: isGameOver,
      winner
    });
  }

  sendReaction(emoji) {
    if (!this.isMultiplayer) return;
    this.sendMessage({
      action: 'reaction',
      emoji
    });
  }

  sendDrawOffer() {
    if (!this.isMultiplayer) return;
    this.sendMessage({
      action: 'offer_draw'
    });
  }

  sendDrawResponse(accepted) {
    if (!this.isMultiplayer) return;
    this.sendMessage({
      action: 'draw_response',
      accepted
    });
  }

  sendResign() {
    if (!this.isMultiplayer) return;
    this.sendMessage({
      action: 'resign'
    });
  }

  sendRematchRequest() {
    if (!this.isMultiplayer) return;
    this.sendMessage({
      action: 'rematch_request'
    });
  }

  leaveRoom() {
    this.isMultiplayer = false;
    this.roomCode = null;
    this.myRole = null;
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    this.mode = 'none';
  }

  /* ---------------- BROADCASTCHANNEL MULTI-TAB FALLBACK ---------------- */

  createBroadcastRoom(color, time, increment, name) {
    this.mode = 'broadcast';
    this.isMultiplayer = true;
    this.roomCode = 'TAB-' + Math.floor(1000 + Math.random() * 9000);
    this.myRole = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;

    const state = {
      code: this.roomCode,
      status: 'waiting',
      whiteName: this.myRole === 'w' ? name : 'Player 2',
      blackName: this.myRole === 'b' ? name : 'Player 2',
      initialTime: time,
      increment: increment,
      whiteTime: time,
      blackTime: time,
      turn: 'w'
    };

    this.app.onMultiplayerRoomCreated(this.roomCode, this.myRole, state);

    // Broadcast room announcement
    this.broadcastChannel.postMessage({
      type: 'broadcast_room_available',
      code: this.roomCode,
      creatorRole: this.myRole,
      state
    });
  }

  joinBroadcastRoom(code, name) {
    this.mode = 'broadcast';
    this.isMultiplayer = true;
    this.roomCode = code;

    // Ask creator for room info
    this.broadcastChannel.postMessage({
      type: 'broadcast_request_join',
      code,
      name
    });
  }
}

function jsonStr(obj) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return '{}';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChessMultiplayer;
}
