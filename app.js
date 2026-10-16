/**
 * Antigravity Chess - Interactive Application Controller
 * Offline Two-Player Pass & Play, Clocks, History Navigation,
 * Animations, Procedural Audio, and Diagnostic Test Suite.
 */

class ChessApp {
  constructor() {
    this.engine = new ChessEngine();
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.lastMove = null;
    this.boardFlipped = false;
    this.playMode = 'autoflip'; // 'autoflip' | 'fixed' | 'table'
    this.theme = 'emerald';
    this.viewingHistoryIndex = null; // null = live game

    // Time Control state
    this.timeControl = {
      initialSeconds: 600, // 10 minutes default
      increment: 0,
      whiteTime: 600,
      blackTime: 600,
      timerId: null,
      isPaused: false,
      hasStarted: false
    };

    // Promotion pending state
    this.pendingMove = null;

    // Drag and drop state
    this.dragState = {
      isDragging: false,
      from: null,
      pieceCode: null,
      ghostEl: document.getElementById('drag-ghost')
    };

    // Multiplayer Coordinator
    this.multiplayer = new ChessMultiplayer(this);

    this.cacheDom();
    this.initEvents();
    this.startNewGame(600, 0, 'autoflip');

    // Auto-detect room parameter in URL (?room=XYZ)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setTimeout(() => this.openJoinMultiplayer(roomParam), 350);
    }
  }

  cacheDom() {
    this.dom = {
      board: document.getElementById('chess-board'),
      boardWrapper: document.getElementById('board-wrapper'),
      themeSelect: document.getElementById('theme-select'),
      btnModeToggle: document.getElementById('btn-mode-toggle'),
      modeIcon: document.getElementById('mode-icon'),
      modeText: document.getElementById('mode-text'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      soundIcon: document.getElementById('sound-icon'),
      btnNewGame: document.getElementById('btn-new-game'),

      // Players
      playerBarTop: document.getElementById('player-bar-top'),
      playerBarBottom: document.getElementById('player-bar-bottom'),
      playerNameTop: document.getElementById('player-name-top'),
      playerNameBottom: document.getElementById('player-name-bottom'),
      avatarTop: document.getElementById('avatar-top'),
      avatarBottom: document.getElementById('avatar-bottom'),
      avatarSymbolTop: document.getElementById('avatar-symbol-top'),
      avatarSymbolBottom: document.getElementById('avatar-symbol-bottom'),
      capturedTop: document.getElementById('captured-top'),
      capturedBottom: document.getElementById('captured-bottom'),
      diffTop: document.getElementById('diff-top'),
      diffBottom: document.getElementById('diff-bottom'),
      clockTop: document.getElementById('clock-top'),
      clockBottom: document.getElementById('clock-bottom'),

      // Board Toolbar
      btnManualFlip: document.getElementById('btn-manual-flip'),
      btnUndoMove: document.getElementById('btn-undo-move'),
      btnPauseClock: document.getElementById('btn-pause-clock'),
      pauseIcon: document.getElementById('pause-icon'),
      btnOfferDraw: document.getElementById('btn-offer-draw'),
      btnResign: document.getElementById('btn-resign'),

      // Status & History
      statusIndicator: document.getElementById('status-indicator'),
      statusText: document.getElementById('status-text'),
      historyTbody: document.getElementById('history-tbody'),
      historyContainer: document.getElementById('history-container'),
      moveCountBadge: document.getElementById('move-count-badge'),
      btnHistStart: document.getElementById('btn-hist-start'),
      btnHistPrev: document.getElementById('btn-hist-prev'),
      btnHistNext: document.getElementById('btn-hist-next'),
      btnHistEnd: document.getElementById('btn-hist-end'),
      btnHistLive: document.getElementById('btn-hist-live'),

      // Modals
      modalPromotion: document.getElementById('modal-promotion'),
      promoChoices: document.getElementById('promo-choices'),
      modalNewGame: document.getElementById('modal-new-game'),
      timerPresets: document.getElementById('timer-presets'),
      selectPlayMode: document.getElementById('select-play-mode'),
      btnCancelNewGame: document.getElementById('btn-cancel-new-game'),
      btnConfirmNewGame: document.getElementById('btn-confirm-new-game'),
      modalResign: document.getElementById('modal-resign'),
      resignPromptText: document.getElementById('resign-prompt-text'),
      btnCancelResign: document.getElementById('btn-cancel-resign'),
      btnConfirmResign: document.getElementById('btn-confirm-resign'),
      modalDraw: document.getElementById('modal-draw'),
      drawPromptText: document.getElementById('draw-prompt-text'),
      btnDeclineDraw: document.getElementById('btn-decline-draw'),
      btnAcceptDraw: document.getElementById('btn-accept-draw'),
      modalGameOver: document.getElementById('modal-gameover'),
      gameoverEmoji: document.getElementById('gameover-emoji'),
      gameoverTitle: document.getElementById('gameover-title'),
      gameoverReason: document.getElementById('gameover-reason'),
      btnGameoverReview: document.getElementById('btn-gameover-review'),
      btnGameoverRematch: document.getElementById('btn-gameover-rematch'),
      btnExportFenPgn: document.getElementById('btn-export-fen-pgn'),
      modalExport: document.getElementById('modal-export'),
      exportFenInput: document.getElementById('export-fen-input'),
      exportPgnTextarea: document.getElementById('export-pgn-textarea'),
      btnCopyFen: document.getElementById('btn-copy-fen'),
      btnCopyPgn: document.getElementById('btn-copy-pgn'),
      importFenInput: document.getElementById('import-fen-input'),
      btnLoadFen: document.getElementById('btn-load-fen'),
      btnCloseExport: document.getElementById('btn-close-export'),
      btnRunTests: document.getElementById('btn-run-tests'),
      modalTests: document.getElementById('modal-tests'),
      testResultsContainer: document.getElementById('test-results-container'),
      testSummary: document.getElementById('test-summary'),
      btnStartTests: document.getElementById('btn-start-tests'),
      btnCloseTests: document.getElementById('btn-close-tests'),

      // Multiplayer Elements
      btnMultiplayerMenu: document.getElementById('btn-multiplayer-menu'),
      multiplayerStatusBar: document.getElementById('multiplayer-status-bar'),
      mpConnectionDot: document.getElementById('mp-connection-dot'),
      mpStatusText: document.getElementById('mp-status-text'),
      mpRoomCodeTag: document.getElementById('mp-room-code-tag'),
      btnCopyInviteLink: document.getElementById('btn-copy-invite-link'),
      btnLeaveMp: document.getElementById('btn-leave-mp'),
      reactionsTray: document.getElementById('reactions-tray'),

      // Multiplayer Lobby Modal
      modalMultiplayer: document.getElementById('modal-multiplayer'),
      mpCreateName: document.getElementById('mp-create-name'),
      mpColorPresets: document.getElementById('mp-color-presets'),
      mpTimePresets: document.getElementById('mp-time-presets'),
      btnCloseMpModal: document.getElementById('btn-close-mp-modal'),
      btnSubmitCreateMp: document.getElementById('btn-submit-create-mp'),
      mpJoinName: document.getElementById('mp-join-name'),
      mpJoinCode: document.getElementById('mp-join-code'),
      btnCancelJoinMp: document.getElementById('btn-cancel-join-mp'),
      btnSubmitJoinMp: document.getElementById('btn-submit-join-mp'),

      // Rematch Modal
      modalRematch: document.getElementById('modal-rematch'),
      btnDeclineRematch: document.getElementById('btn-decline-rematch'),
      btnAcceptRematch: document.getElementById('btn-accept-rematch')
    };
  }

  initEvents() {
    // Theme selector
    this.dom.themeSelect.addEventListener('change', (e) => {
      this.setTheme(e.target.value);
    });

    // Pass & Play Mode Toggle
    this.dom.btnModeToggle.addEventListener('click', () => {
      if (this.playMode === 'autoflip') {
        this.setPlayMode('fixed');
      } else if (this.playMode === 'fixed') {
        this.setPlayMode('table');
      } else {
        this.setPlayMode('autoflip');
      }
    });

    // Sound Toggle
    this.dom.btnSoundToggle.addEventListener('click', () => {
      const isMuted = chessAudio.toggleMute();
      this.dom.soundIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    // Manual Flip Board
    this.dom.btnManualFlip.addEventListener('click', () => {
      this.flipBoard(!this.boardFlipped);
    });

    // Undo Move
    this.dom.btnUndoMove.addEventListener('click', () => {
      this.undoLastMove();
    });

    // Pause Timer
    this.dom.btnPauseClock.addEventListener('click', () => {
      this.toggleClockPause();
    });

    // Offer Draw
    this.dom.btnOfferDraw.addEventListener('click', () => {
      this.openDrawModal();
    });

    // Resign
    this.dom.btnResign.addEventListener('click', () => {
      this.openResignModal();
    });

    // New Game Modals
    this.dom.btnNewGame.addEventListener('click', () => {
      this.dom.modalNewGame.classList.add('active');
    });

    this.dom.btnCancelNewGame.addEventListener('click', () => {
      this.dom.modalNewGame.classList.remove('active');
    });

    // Timer presets selector in New Game modal
    this.dom.timerPresets.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill-option');
      if (pill) {
        this.dom.timerPresets.querySelectorAll('.pill-option').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      }
    });

    this.dom.btnConfirmNewGame.addEventListener('click', () => {
      const activePill = this.dom.timerPresets.querySelector('.pill-option.active');
      const time = activePill ? parseInt(activePill.getAttribute('data-time'), 10) : 600;
      const inc = activePill && activePill.hasAttribute('data-inc') ? parseInt(activePill.getAttribute('data-inc'), 10) : 0;
      const mode = this.dom.selectPlayMode.value;

      this.dom.modalNewGame.classList.remove('active');
      this.startNewGame(time, inc, mode);
    });

    // Resign modal actions
    this.dom.btnCancelResign.addEventListener('click', () => {
      this.dom.modalResign.classList.remove('active');
    });

    this.dom.btnConfirmResign.addEventListener('click', () => {
      this.dom.modalResign.classList.remove('active');
      this.handleResignation();
    });

    // Draw modal actions
    this.dom.btnDeclineDraw.addEventListener('click', () => {
      this.dom.modalDraw.classList.remove('active');
    });

    this.dom.btnAcceptDraw.addEventListener('click', () => {
      this.dom.modalDraw.classList.remove('active');
      this.handleDrawAgreed();
    });

    // Game Over modal actions
    this.dom.btnGameoverReview.addEventListener('click', () => {
      this.dom.modalGameOver.classList.remove('active');
    });

    this.dom.btnGameoverRematch.addEventListener('click', () => {
      this.dom.modalGameOver.classList.remove('active');
      this.startNewGame(this.timeControl.initialSeconds, this.timeControl.increment, this.playMode);
    });

    // Export modal actions
    this.dom.btnExportFenPgn.addEventListener('click', () => {
      this.openExportModal();
    });

    this.dom.btnCloseExport.addEventListener('click', () => {
      this.dom.modalExport.classList.remove('active');
    });

    this.dom.btnCopyFen.addEventListener('click', () => {
      navigator.clipboard.writeText(this.dom.exportFenInput.value);
      this.dom.btnCopyFen.textContent = 'Copied!';
      setTimeout(() => { this.dom.btnCopyFen.textContent = 'Copy'; }, 1500);
    });

    this.dom.btnCopyPgn.addEventListener('click', () => {
      navigator.clipboard.writeText(this.dom.exportPgnTextarea.value);
      this.dom.btnCopyPgn.textContent = 'Copied!';
      setTimeout(() => { this.dom.btnCopyPgn.textContent = 'Copy PGN'; }, 1500);
    });

    this.dom.btnLoadFen.addEventListener('click', () => {
      const fen = this.dom.importFenInput.value.trim();
      if (fen) {
        try {
          this.engine.loadFEN(fen);
          this.lastMove = null;
          this.viewingHistoryIndex = null;
          this.dom.modalExport.classList.remove('active');
          this.render();
          chessAudio.playMove();
        } catch (err) {
          alert('Invalid FEN position string. Please verify.');
        }
      }
    });

    // History controls
    this.dom.btnHistStart.addEventListener('click', () => this.navigateHistory(0));
    this.dom.btnHistPrev.addEventListener('click', () => this.navigateHistory((this.viewingHistoryIndex ?? this.engine.history.length) - 1));
    this.dom.btnHistNext.addEventListener('click', () => this.navigateHistory((this.viewingHistoryIndex ?? this.engine.history.length) + 1));
    this.dom.btnHistEnd.addEventListener('click', () => this.navigateHistory(this.engine.history.length));
    this.dom.btnHistLive.addEventListener('click', () => this.navigateHistory(this.engine.history.length));

    // Diagnostic tests
    this.dom.btnRunTests.addEventListener('click', () => {
      this.dom.modalTests.classList.add('active');
      this.runDiagnostics();
    });

    this.dom.btnStartTests.addEventListener('click', () => {
      this.runDiagnostics();
    });

    this.dom.btnCloseTests.addEventListener('click', () => {
      this.dom.modalTests.classList.remove('active');
    });

    // Multiplayer Menu Button
    this.dom.btnMultiplayerMenu.addEventListener('click', () => {
      this.openMultiplayerModal();
    });

    // Close Multiplayer Modal
    this.dom.btnCloseMpModal.addEventListener('click', () => {
      this.dom.modalMultiplayer.classList.remove('active');
    });
    this.dom.btnCancelJoinMp.addEventListener('click', () => {
      this.dom.modalMultiplayer.classList.remove('active');
    });

    // Modal Tabs Switching (Create vs Join)
    const mpTabs = this.dom.modalMultiplayer.querySelectorAll('.modal-tab');
    mpTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        mpTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const targetTab = tab.getAttribute('data-tab');
        document.getElementById('tab-pane-create').classList.toggle('active', targetTab === 'create');
        document.getElementById('tab-pane-join').classList.toggle('active', targetTab === 'join');
      });
    });

    // Color Presets Pills (Multiplayer)
    this.dom.mpColorPresets.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill-option');
      if (pill) {
        this.dom.mpColorPresets.querySelectorAll('.pill-option').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      }
    });

    // Time Presets Pills (Multiplayer)
    this.dom.mpTimePresets.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill-option');
      if (pill) {
        this.dom.mpTimePresets.querySelectorAll('.pill-option').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      }
    });

    // Submit Create Match Room
    this.dom.btnSubmitCreateMp.addEventListener('click', () => {
      this.handleCreateMp();
    });

    // Submit Join Match Room
    this.dom.btnSubmitJoinMp.addEventListener('click', () => {
      this.handleJoinMp();
    });

    // Copy Invite Link
    this.dom.btnCopyInviteLink.addEventListener('click', () => {
      this.copyInviteLink();
    });

    // Leave Multiplayer
    this.dom.btnLeaveMp.addEventListener('click', () => {
      this.leaveMultiplayer();
    });

    // Emoji Reactions
    this.dom.reactionsTray.querySelectorAll('.btn-reaction').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-emoji');
        this.multiplayer.sendReaction(emoji);
        this.showFloatingEmoji(emoji, this.multiplayer.myRole);
      });
    });

    // Rematch Modal Actions
    this.dom.btnDeclineRematch.addEventListener('click', () => {
      this.dom.modalRematch.classList.remove('active');
    });
    this.dom.btnAcceptRematch.addEventListener('click', () => {
      this.dom.modalRematch.classList.remove('active');
      this.multiplayer.sendRematchRequest();
    });

    // Global drag tracking
    document.addEventListener('mousemove', (e) => this.handleDragMove(e));
    document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  }

  setTheme(themeName) {
    this.theme = themeName;
    document.body.setAttribute('data-theme', themeName);
  }

  setPlayMode(mode) {
    this.playMode = mode;
    document.body.classList.remove('mode-table');

    if (mode === 'autoflip') {
      this.dom.modeIcon.textContent = '🔄';
      this.dom.modeText.textContent = 'Pass & Play';
      this.dom.btnModeToggle.title = 'Pass & Play: Auto-flips board each turn';
    } else if (mode === 'fixed') {
      this.dom.modeIcon.textContent = '🔒';
      this.dom.modeText.textContent = 'Fixed View';
      this.dom.btnModeToggle.title = 'Fixed: Side-by-side view (no flip)';
      this.flipBoard(false);
    } else if (mode === 'table') {
      this.dom.modeIcon.textContent = '📱';
      this.dom.modeText.textContent = 'Tabletop';
      this.dom.btnModeToggle.title = 'Tabletop: Clocks face opposite players';
      document.body.classList.add('mode-table');
      this.flipBoard(false);
    }
  }

  flipBoard(flipped) {
    this.boardFlipped = flipped;
    if (flipped) {
      this.dom.boardWrapper.classList.add('flipped');
    } else {
      this.dom.boardWrapper.classList.remove('flipped');
    }
    this.updatePlayerBars();
  }

  startNewGame(seconds = 600, increment = 0, playMode = 'autoflip') {
    this.engine.reset();
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.lastMove = null;
    this.viewingHistoryIndex = null;
    this.boardFlipped = false;
    this.dom.boardWrapper.classList.remove('flipped');

    this.setPlayMode(playMode);

    // Reset clocks
    this.clearIntervalClock();
    this.timeControl.initialSeconds = seconds;
    this.timeControl.increment = increment;
    this.timeControl.whiteTime = seconds;
    this.timeControl.blackTime = seconds;
    this.timeControl.isPaused = false;
    this.timeControl.hasStarted = false;
    this.dom.pauseIcon.textContent = '⏸️ Pause';

    if (seconds === 0) {
      this.dom.clockTop.textContent = '∞';
      this.dom.clockBottom.textContent = '∞';
      this.dom.btnPauseClock.style.display = 'none';
    } else {
      this.dom.btnPauseClock.style.display = 'inline-flex';
      this.updateClockDisplay();
    }

    this.render();
  }

  /* ---------------- CLOCK LOGIC ---------------- */

  startClock() {
    if (this.timeControl.initialSeconds === 0) return;
    this.clearIntervalClock();
    this.timeControl.hasStarted = true;

    this.timeControl.timerId = setInterval(() => {
      if (this.timeControl.isPaused) return;

      const activeColor = this.engine.turn;
      if (activeColor === 'w') {
        this.timeControl.whiteTime--;
        if (this.timeControl.whiteTime <= 0) {
          this.timeControl.whiteTime = 0;
          this.handleTimeout('w');
        }
      } else {
        this.timeControl.blackTime--;
        if (this.timeControl.blackTime <= 0) {
          this.timeControl.blackTime = 0;
          this.handleTimeout('b');
        }
      }

      this.updateClockDisplay();
    }, 1000);
  }

  clearIntervalClock() {
    if (this.timeControl.timerId) {
      clearInterval(this.timeControl.timerId);
      this.timeControl.timerId = null;
    }
  }

  toggleClockPause() {
    if (this.timeControl.initialSeconds === 0) return;
    this.timeControl.isPaused = !this.timeControl.isPaused;
    this.dom.pauseIcon.textContent = this.timeControl.isPaused ? '▶️ Resume' : '⏸️ Pause';
  }

  handleTimeout(colorTimeout) {
    this.clearIntervalClock();
    const winner = colorTimeout === 'w' ? 'Black' : 'White';
    chessAudio.playGameOver();
    this.showGameOverModal('⏰', `Time Out! ${winner} Wins`, `${colorTimeout === 'w' ? 'White' : 'Black'} ran out of time.`);
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  updateClockDisplay() {
    if (this.timeControl.initialSeconds === 0) return;

    // Which clock is at the top vs bottom depends on board flip
    const topColor = this.boardFlipped ? 'w' : 'b';
    const bottomColor = this.boardFlipped ? 'b' : 'w';

    const topTime = topColor === 'w' ? this.timeControl.whiteTime : this.timeControl.blackTime;
    const bottomTime = bottomColor === 'w' ? this.timeControl.whiteTime : this.timeControl.blackTime;

    this.dom.clockTop.textContent = this.formatTime(topTime);
    this.dom.clockBottom.textContent = this.formatTime(bottomTime);

    // Urgent low time warning (< 30s)
    this.dom.clockTop.classList.toggle('low-time', topTime < 30 && topTime > 0);
    this.dom.clockBottom.classList.toggle('low-time', bottomTime < 30 && bottomTime > 0);
  }

  /* ---------------- RENDERING ---------------- */

  render() {
    this.renderBoard();
    this.updateStatusBanner();
    this.updatePlayerBars();
    this.renderHistory();
    this.updateClockDisplay();
  }

  renderBoard() {
    this.dom.board.innerHTML = '';

    // Determine current board representation (live or viewing history)
    let displayBoard = this.engine.board;
    let turnToMove = this.engine.turn;
    let kingInCheck = this.engine.isCheck(turnToMove);

    if (this.viewingHistoryIndex !== null && this.engine.history[this.viewingHistoryIndex - 1]) {
      const snap = this.engine.history[this.viewingHistoryIndex - 1];
      // Board after move
      const tempEng = new ChessEngine(snap.fenAfter);
      displayBoard = tempEng.board;
      turnToMove = tempEng.turn;
      kingInCheck = tempEng.isCheck(turnToMove);
    } else if (this.viewingHistoryIndex === 0) {
      const startEng = new ChessEngine();
      displayBoard = startEng.board;
      turnToMove = 'w';
      kingInCheck = false;
    }

    const kingPos = kingInCheck ? this.engine.findKing(turnToMove, displayBoard) : null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const squareEl = document.createElement('div');
        squareEl.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        squareEl.dataset.row = r;
        squareEl.dataset.col = c;

        // Selected square highlight
        if (this.selectedSquare && this.selectedSquare.row === r && this.selectedSquare.col === c) {
          squareEl.classList.add('selected');
        }

        // Last move highlight
        if (this.lastMove) {
          if ((this.lastMove.from.row === r && this.lastMove.from.col === c) ||
              (this.lastMove.to.row === r && this.lastMove.to.col === c)) {
            squareEl.classList.add('last-move');
          }
        }

        // King check alert
        if (kingPos && kingPos.row === r && kingPos.col === c) {
          squareEl.classList.add('in-check');
        }

        // Legal move indicators
        const legalMove = this.legalMovesForSelected.find(m => m.to.row === r && m.to.col === c);
        if (legalMove) {
          const isCapture = displayBoard[r][c] || legalMove.isEnPassant;
          const indicator = document.createElement('div');
          indicator.className = isCapture ? 'capture-ring' : 'move-dot';
          squareEl.appendChild(indicator);
        }

        // Piece
        const piece = displayBoard[r][c];
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          pieceEl.innerHTML = getPieceSvg(piece);

          // Drag listeners
          pieceEl.addEventListener('mousedown', (e) => this.handleDragStart(e, r, c, piece));
          pieceEl.addEventListener('touchstart', (e) => this.handleTouchStart(e, r, c, piece), { passive: true });

          squareEl.appendChild(pieceEl);
        }

        // Click to move listener
        squareEl.addEventListener('click', () => this.handleSquareClick(r, c));

        this.dom.board.appendChild(squareEl);
      }
    }
  }

  updatePlayerBars() {
    const isWhiteTurn = this.engine.turn === 'w';
    const topColor = this.boardFlipped ? 'w' : 'b';
    const bottomColor = this.boardFlipped ? 'b' : 'w';

    this.dom.playerNameTop.textContent = topColor === 'w' ? 'White' : 'Black';
    this.dom.playerNameBottom.textContent = bottomColor === 'w' ? 'White' : 'Black';

    this.dom.avatarTop.className = `player-avatar ${topColor === 'w' ? 'white' : 'black'}`;
    this.dom.avatarBottom.className = `player-avatar ${bottomColor === 'w' ? 'white' : 'black'}`;

    this.dom.avatarSymbolTop.textContent = topColor === 'w' ? '♔' : '♚';
    this.dom.avatarSymbolBottom.textContent = bottomColor === 'w' ? '♔' : '♚';

    // Active turn pulses
    const isTopTurn = (topColor === 'w' && isWhiteTurn) || (topColor === 'b' && !isWhiteTurn);
    this.dom.playerBarTop.classList.toggle('active-turn', isTopTurn);
    this.dom.playerBarBottom.classList.toggle('active-turn', !isTopTurn);

    // Captured pieces & material advantage tally
    const tally = this.engine.getMaterialTally();
    const capturedByWhite = tally.capturedByWhite;
    const capturedByBlack = tally.capturedByBlack;

    this.renderCapturedTray(
      this.dom.capturedTop,
      this.dom.diffTop,
      topColor === 'w' ? capturedByWhite : capturedByBlack,
      topColor === 'w' ? tally.diff : -tally.diff
    );

    this.renderCapturedTray(
      this.dom.capturedBottom,
      this.dom.diffBottom,
      bottomColor === 'w' ? capturedByWhite : capturedByBlack,
      bottomColor === 'w' ? tally.diff : -tally.diff
    );
  }

  renderCapturedTray(container, diffBadge, capturedList, leadScore) {
    container.innerHTML = '';
    // Group and order pieces (P, N, B, R, Q)
    const order = ['P', 'N', 'B', 'R', 'Q'];
    const sorted = [...capturedList].sort((a, b) => order.indexOf(a[1]) - order.indexOf(b[1]));

    sorted.forEach(pieceCode => {
      const span = document.createElement('span');
      span.className = 'captured-piece-mini';
      span.innerHTML = getPieceSvg(pieceCode);
      container.appendChild(span);
    });

    if (leadScore > 0) {
      diffBadge.style.display = 'inline-block';
      diffBadge.textContent = `+${leadScore}`;
    } else {
      diffBadge.style.display = 'none';
    }
  }

  updateStatusBanner() {
    const status = this.engine.getGameStatus();

    this.dom.statusIndicator.className = 'status-indicator';
    if (status.over) {
      this.dom.statusIndicator.classList.add('gameover');
      this.dom.statusText.textContent = status.message;
    } else if (status.result === 'check') {
      this.dom.statusIndicator.classList.add('check');
      this.dom.statusText.textContent = status.message;
    } else {
      this.dom.statusText.textContent = status.message;
    }
  }

  renderHistory() {
    this.dom.historyTbody.innerHTML = '';
    const moves = this.engine.history;
    this.dom.moveCountBadge.textContent = `${moves.length} move${moves.length === 1 ? '' : 's'}`;

    for (let i = 0; i < moves.length; i += 2) {
      const tr = document.createElement('tr');
      tr.className = 'history-row';

      const moveNum = Math.floor(i / 2) + 1;
      const tdNum = document.createElement('td');
      tdNum.className = 'move-num';
      tdNum.textContent = `${moveNum}.`;
      tr.appendChild(tdNum);

      // White move
      const tdWhite = document.createElement('td');
      const spanWhite = document.createElement('span');
      spanWhite.className = `move-cell ${this.viewingHistoryIndex === i + 1 ? 'current-step' : ''}`;
      spanWhite.textContent = moves[i].san;
      spanWhite.addEventListener('click', () => this.navigateHistory(i + 1));
      tdWhite.appendChild(spanWhite);
      tr.appendChild(tdWhite);

      // Black move (if played)
      const tdBlack = document.createElement('td');
      if (moves[i + 1]) {
        const spanBlack = document.createElement('span');
        spanBlack.className = `move-cell ${this.viewingHistoryIndex === i + 2 ? 'current-step' : ''}`;
        spanBlack.textContent = moves[i + 1].san;
        spanBlack.addEventListener('click', () => this.navigateHistory(i + 2));
        tdBlack.appendChild(spanBlack);
      }
      tr.appendChild(tdBlack);

      this.dom.historyTbody.appendChild(tr);
    }

    // Auto-scroll to latest move
    if (this.viewingHistoryIndex === null) {
      this.dom.historyContainer.scrollTop = this.dom.historyContainer.scrollHeight;
    }

    // Toggle Back to Live button
    this.dom.btnHistLive.style.display = this.viewingHistoryIndex !== null ? 'inline-block' : 'none';
  }

  navigateHistory(index) {
    if (this.engine.history.length === 0) return;
    const clamped = Math.max(0, Math.min(this.engine.history.length, index));

    if (clamped === this.engine.history.length) {
      this.viewingHistoryIndex = null; // live view
    } else {
      this.viewingHistoryIndex = clamped;
    }

    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.render();
  }

  /* ---------------- INTERACTION / MOVES ---------------- */

  handleSquareClick(r, c) {
    // If viewing historical position, click jumps back to live
    if (this.viewingHistoryIndex !== null) {
      this.navigateHistory(this.engine.history.length);
      return;
    }

    // Check if game is already over
    if (this.engine.getGameStatus().over) return;

    // In multiplayer: only allowed to move on your turn
    if (this.multiplayer && this.multiplayer.isMultiplayer) {
      if (this.engine.turn !== this.multiplayer.myRole) return;
    }

    const clickedPiece = this.engine.board[r][c];

    // Case 1: Selecting own piece
    if (clickedPiece && clickedPiece[0] === this.engine.turn) {
      if (this.multiplayer && this.multiplayer.isMultiplayer && clickedPiece[0] !== this.multiplayer.myRole) {
        return;
      }
      if (this.selectedSquare && this.selectedSquare.row === r && this.selectedSquare.col === c) {
        // Deselect
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
      } else {
        this.selectedSquare = { row: r, col: c };
        this.legalMovesForSelected = this.engine.getLegalMoves(r, c);
      }
      this.render();
      return;
    }

    // Case 2: Destination clicked with a piece already selected
    if (this.selectedSquare) {
      const matchingMove = this.legalMovesForSelected.find(m => m.to.row === r && m.to.col === c);
      if (matchingMove) {
        this.executeMove(this.selectedSquare, { row: r, col: c });
      } else {
        // Clicked invalid empty or enemy square - deselect
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.render();
      }
    }
  }

  executeMove(from, to, chosenPromo = null, isRemote = false) {
    const piece = this.engine.board[from.row][from.col];
    if (!piece) return;

    // Check if promotion is needed
    const isPawn = piece[1] === 'P';
    const promoRow = piece[0] === 'w' ? 0 : 7;
    if (isPawn && to.row === promoRow && !chosenPromo) {
      this.openPromotionModal(from, to, piece[0]);
      return;
    }

    const isCapture = this.engine.board[to.row][to.col] || (isPawn && this.engine.enPassant && this.engine.enPassant.row === to.row && this.engine.enPassant.col === to.col);
    const isCastle = piece[1] === 'K' && Math.abs(to.col - from.col) === 2;

    const moveResult = this.engine.makeMove(from, to, chosenPromo || 'Q');
    if (!moveResult) return;

    // Transmit to multiplayer opponent
    if (!isRemote && this.multiplayer && this.multiplayer.isMultiplayer) {
      const statusNow = this.engine.getGameStatus();
      this.multiplayer.sendMove(moveResult.move, this.engine.getFEN(), statusNow.over, statusNow.winner);
    }

    // Start timer on first move
    if (!this.timeControl.hasStarted) {
      this.startClock();
    } else {
      // Add increment
      const movedColor = piece[0];
      if (movedColor === 'w') {
        this.timeControl.whiteTime += this.timeControl.increment;
      } else {
        this.timeControl.blackTime += this.timeControl.increment;
      }
    }

    this.lastMove = { from, to };
    this.selectedSquare = null;
    this.legalMovesForSelected = [];

    // Play appropriate procedural sound
    if (moveResult.isCheckmate) {
      chessAudio.playGameOver();
    } else if (moveResult.isCheck) {
      chessAudio.playCheck();
    } else if (isCastle) {
      chessAudio.playCastle();
    } else if (isCapture) {
      chessAudio.playCapture();
    } else {
      chessAudio.playMove();
    }

    this.render();

    // Check game termination
    const status = this.engine.getGameStatus();
    if (status.over) {
      this.clearIntervalClock();
      setTimeout(() => {
        this.showGameOverModal(
          status.result === 'checkmate' ? '🏆' : '🤝',
          status.winner ? `${status.winner} Wins!` : 'Draw',
          status.message
        );
      }, 400);
      return;
    }

    // Orientation management
    if (this.multiplayer && this.multiplayer.isMultiplayer) {
      // Stay on player's assigned color perspective
      this.flipBoard(this.multiplayer.myRole === 'b');
    } else if (this.playMode === 'autoflip') {
      setTimeout(() => {
        this.flipBoard(this.engine.turn === 'b');
      }, 350);
    }
  }

  openPromotionModal(from, to, color) {
    this.pendingMove = { from, to };
    this.dom.promoChoices.innerHTML = '';

    const promoPieces = ['Q', 'R', 'B', 'N'];
    promoPieces.forEach(type => {
      const div = document.createElement('div');
      div.className = 'promo-option';
      div.innerHTML = getPieceSvg(`${color}${type}`);
      div.title = `Promote to ${PIECE_NAMES[type]}`;

      div.addEventListener('click', () => {
        this.dom.modalPromotion.classList.remove('active');
        const pending = this.pendingMove;
        this.pendingMove = null;
        this.executeMove(pending.from, pending.to, type);
      });

      this.dom.promoChoices.appendChild(div);
    });

    this.dom.modalPromotion.classList.add('active');
  }

  undoLastMove() {
    if (this.multiplayer && this.multiplayer.isMultiplayer) {
      alert('Undo is not available during live multiplayer games.');
      return;
    }
    if (this.engine.history.length === 0) return;
    this.engine.undo();

    // Restore last move indicator
    if (this.engine.history.length > 0) {
      const prev = this.engine.history[this.engine.history.length - 1].move;
      this.lastMove = { from: prev.from, to: prev.to };
    } else {
      this.lastMove = null;
    }

    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.viewingHistoryIndex = null;

    if (this.playMode === 'autoflip') {
      this.flipBoard(this.engine.turn === 'b');
    }

    chessAudio.playMove();
    this.render();
  }

  /* ---------------- DRAG AND DROP ---------------- */

  handleDragStart(e, r, c, piece) {
    if (this.engine.getGameStatus().over) return;
    if (piece[0] !== this.engine.turn) return;

    // In multiplayer: only drag your own pieces when it is your turn
    if (this.multiplayer && this.multiplayer.isMultiplayer) {
      if (this.multiplayer.myRole !== piece[0] || this.engine.turn !== this.multiplayer.myRole) {
        return;
      }
    }

    this.dragState.isDragging = true;
    this.dragState.from = { row: r, col: c };
    this.dragState.pieceCode = piece;

    this.selectedSquare = { row: r, col: c };
    this.legalMovesForSelected = this.engine.getLegalMoves(r, c);
    this.renderBoard();

    // Show ghost
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    this.dragState.ghostEl.innerHTML = getPieceSvg(piece);
    this.dragState.ghostEl.style.display = 'block';
    this.dragState.ghostEl.style.left = `${clientX}px`;
    this.dragState.ghostEl.style.top = `${clientY}px`;
  }

  handleDragMove(e) {
    if (!this.dragState.isDragging) return;
    this.dragState.ghostEl.style.left = `${e.clientX}px`;
    this.dragState.ghostEl.style.top = `${e.clientY}px`;
  }

  handleTouchMove(e) {
    if (!this.dragState.isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.dragState.ghostEl.style.left = `${touch.clientX}px`;
    this.dragState.ghostEl.style.top = `${touch.clientY}px`;
  }

  handleDragEnd(e) {
    if (!this.dragState.isDragging) return;
    this.dragState.isDragging = false;
    this.dragState.ghostEl.style.display = 'none';

    // Find destination square under cursor
    const clientX = e.clientX;
    const clientY = e.clientY;
    const squareEl = document.elementFromPoint(clientX, clientY)?.closest('.square');

    if (squareEl && squareEl.dataset.row !== undefined) {
      const toRow = parseInt(squareEl.dataset.row, 10);
      const toCol = parseInt(squareEl.dataset.col, 10);
      const matchingMove = this.legalMovesForSelected.find(m => m.to.row === toRow && m.to.col === toCol);
      if (matchingMove) {
        this.executeMove(this.dragState.from, { row: toRow, col: toCol });
        return;
      }
    }

    this.render();
  }

  handleTouchEnd(e) {
    if (!this.dragState.isDragging) return;
    this.dragState.isDragging = false;
    this.dragState.ghostEl.style.display = 'none';

    const touch = e.changedTouches[0];
    const squareEl = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.square');

    if (squareEl && squareEl.dataset.row !== undefined) {
      const toRow = parseInt(squareEl.dataset.row, 10);
      const toCol = parseInt(squareEl.dataset.col, 10);
      const matchingMove = this.legalMovesForSelected.find(m => m.to.row === toRow && m.to.col === toCol);
      if (matchingMove) {
        this.executeMove(this.dragState.from, { row: toRow, col: toCol });
        return;
      }
    }

    this.render();
  }

  /* ---------------- RESIGN / DRAW / GAMEOVER ---------------- */

  openResignModal() {
    if (this.engine.getGameStatus().over) return;
    if (this.multiplayer && this.multiplayer.isMultiplayer) {
      this.dom.resignPromptText.textContent = 'Are you sure you want to resign the multiplayer match? Opponent will win.';
    } else {
      const resigningPlayer = this.engine.turn === 'w' ? 'White' : 'Black';
      this.dom.resignPromptText.textContent = `${resigningPlayer}: Are you sure you want to resign the game?`;
    }
    this.dom.modalResign.classList.add('active');
  }

  handleResignation() {
    this.clearIntervalClock();
    if (this.multiplayer && this.multiplayer.isMultiplayer) {
      this.multiplayer.sendResign();
      const winner = this.multiplayer.myRole === 'w' ? 'Black' : 'White';
      chessAudio.playGameOver();
      this.showGameOverModal('🏳️', `${winner} Wins!`, `You resigned the match.`);
    } else {
      const winner = this.engine.turn === 'w' ? 'Black' : 'White';
      chessAudio.playGameOver();
      this.showGameOverModal('🏳️', `${winner} Wins!`, `${this.engine.turn === 'w' ? 'White' : 'Black'} resigned.`);
    }
  }

  openDrawModal() {
    if (this.engine.getGameStatus().over) return;
    if (this.multiplayer && this.multiplayer.isMultiplayer) {
      this.multiplayer.sendDrawOffer();
      this.dom.statusText.textContent = 'Draw offer sent to opponent...';
    } else {
      const offeringPlayer = this.engine.turn === 'w' ? 'White' : 'Black';
      const acceptingPlayer = this.engine.turn === 'w' ? 'Black' : 'White';
      this.dom.drawPromptText.textContent = `${offeringPlayer} has offered a draw. Does ${acceptingPlayer} accept?`;
      this.dom.modalDraw.classList.add('active');
    }
  }

  handleDrawAgreed() {
    if (this.multiplayer && this.multiplayer.isMultiplayer) {
      this.multiplayer.sendDrawResponse(true);
    } else {
      this.clearIntervalClock();
      chessAudio.playGameOver();
      this.showGameOverModal('🤝', 'Draw Agreed', 'Both players agreed to a peaceful draw.');
    }
  }

  showGameOverModal(emoji, title, reason) {
    this.dom.gameoverEmoji.textContent = emoji;
    this.dom.gameoverTitle.textContent = title;
    this.dom.gameoverReason.textContent = reason;
    this.dom.modalGameOver.classList.add('active');
  }

  /* ---------------- MULTIPLAYER COORDINATION ---------------- */

  openMultiplayerModal() {
    this.dom.modalMultiplayer.classList.add('active');
  }

  openJoinMultiplayer(code) {
    this.dom.modalMultiplayer.classList.add('active');
    const mpTabs = this.dom.modalMultiplayer.querySelectorAll('.modal-tab');
    mpTabs.forEach(t => t.classList.remove('active'));
    const joinTab = this.dom.modalMultiplayer.querySelector('.modal-tab[data-tab="join"]');
    if (joinTab) joinTab.classList.add('active');
    document.getElementById('tab-pane-create').classList.remove('active');
    document.getElementById('tab-pane-join').classList.add('active');

    this.dom.mpJoinCode.value = code;
  }

  async handleCreateMp() {
    const name = this.dom.mpCreateName.value.trim() || 'Player 1';
    const activeColorPill = this.dom.mpColorPresets.querySelector('.pill-option.active');
    const color = activeColorPill ? activeColorPill.getAttribute('data-color') : 'random';

    const activeTimePill = this.dom.mpTimePresets.querySelector('.pill-option.active');
    const time = activeTimePill ? parseInt(activeTimePill.getAttribute('data-time'), 10) : 600;
    const inc = activeTimePill && activeTimePill.hasAttribute('data-inc') ? parseInt(activeTimePill.getAttribute('data-inc'), 10) : 0;

    this.dom.modalMultiplayer.classList.remove('active');
    await this.multiplayer.createRoom(color, time, inc, name);
  }

  async handleJoinMp() {
    const code = this.dom.mpJoinCode.value.trim().toUpperCase();
    if (!code) {
      alert('Please enter a room code.');
      return;
    }
    const name = this.dom.mpJoinName.value.trim() || 'Player 2';
    this.dom.modalMultiplayer.classList.remove('active');
    await this.multiplayer.joinRoom(code, name);
  }

  onMultiplayerRoomCreated(code, role, state) {
    this.startNewGame(state.initialTime, state.increment, 'fixed');
    this.multiplayer.roomCode = code;
    this.multiplayer.myRole = role;

    this.dom.multiplayerStatusBar.classList.add('active');
    this.dom.reactionsTray.classList.add('active');
    this.dom.mpConnectionDot.className = 'connection-dot';
    this.dom.mpRoomCodeTag.textContent = `Room: ${code}`;
    this.dom.mpRoomCodeTag.style.display = 'inline-block';
    this.dom.mpStatusText.textContent = `Waiting for opponent... (You play ${role === 'w' ? 'White' : 'Black'})`;

    this.flipBoard(role === 'b');
    chessAudio.playMove();
  }

  onMultiplayerRoomJoined(code, role, state) {
    this.startNewGame(state.initialTime, state.increment, 'fixed');
    this.multiplayer.roomCode = code;
    this.multiplayer.myRole = role;

    this.dom.multiplayerStatusBar.classList.add('active');
    this.dom.reactionsTray.classList.add('active');
    this.dom.mpConnectionDot.className = 'connection-dot connected';
    this.dom.mpRoomCodeTag.textContent = `Room: ${code}`;
    this.dom.mpRoomCodeTag.style.display = 'inline-block';
    this.dom.mpStatusText.textContent = `Connected! You play ${role === 'w' ? 'White' : 'Black'}`;

    this.flipBoard(role === 'b');
    chessAudio.playMove();
  }

  onMultiplayerOpponentJoined(name, role, state) {
    this.dom.mpConnectionDot.className = 'connection-dot connected';
    this.dom.mpStatusText.textContent = `In Match vs ${name} (Playing ${this.multiplayer.myRole === 'w' ? 'White' : 'Black'})`;
    chessAudio.playMove();
    this.startClock();
  }

  onRemoteMoveReceived(move, state) {
    const chosenPromo = move.promotion || 'Q';
    this.executeMove(move.from, move.to, chosenPromo, true);

    // Sync clocks
    if (state) {
      this.timeControl.whiteTime = state.whiteTime;
      this.timeControl.blackTime = state.blackTime;
      this.updateClockDisplay();
    }
  }

  showFloatingEmoji(emoji, fromRole) {
    const el = document.createElement('div');
    el.className = 'floating-reaction';
    el.textContent = emoji;

    const isTop = (fromRole === 'b' && !this.boardFlipped) || (fromRole === 'w' && this.boardFlipped);
    el.style.left = `${40 + Math.random() * 20}%`;
    el.style.top = isTop ? '15%' : '75%';

    this.dom.boardWrapper.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2200);
  }

  onRemoteDrawOffered(byRole) {
    this.dom.drawPromptText.textContent = 'Your opponent has offered a draw. Do you accept?';
    this.dom.modalDraw.classList.add('active');
  }

  onRemoteDrawAgreed(state) {
    this.clearIntervalClock();
    chessAudio.playGameOver();
    this.showGameOverModal('🤝', 'Draw Agreed', 'Both players agreed to a peaceful draw.');
  }

  onRemoteDrawDeclined() {
    this.dom.statusText.textContent = 'Opponent declined the draw offer.';
  }

  onRemotePlayerResigned(role, winner, state) {
    this.clearIntervalClock();
    chessAudio.playGameOver();
    this.showGameOverModal('🏳️', `${winner} Wins!`, `Opponent resigned the match.`);
  }

  onRemoteRematchRequested(byRole) {
    this.dom.rematchPromptText.textContent = 'Your opponent requested a rematch with reversed colors! Accept?';
    this.dom.modalRematch.classList.add('active');
  }

  onRemoteRematchStarted(yourRole, state) {
    this.dom.modalGameOver.classList.remove('active');
    this.dom.modalRematch.classList.remove('active');
    this.startNewGame(state.initialTime, state.increment, 'fixed');
    this.multiplayer.myRole = yourRole;
    this.flipBoard(yourRole === 'b');
    this.dom.mpStatusText.textContent = `Rematch Started! (Playing ${yourRole === 'w' ? 'White' : 'Black'})`;
    chessAudio.playMove();
  }

  onOpponentDisconnected(role) {
    this.dom.mpConnectionDot.className = 'connection-dot';
    this.dom.mpStatusText.textContent = 'Opponent disconnected. Waiting to reconnect...';
  }

  copyInviteLink() {
    if (!this.multiplayer.roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${this.multiplayer.roomCode}`;
    navigator.clipboard.writeText(url);
    this.dom.btnCopyInviteLink.textContent = '✓ Copied!';
    setTimeout(() => {
      this.dom.btnCopyInviteLink.textContent = '🔗 Copy Link';
    }, 1500);
  }

  leaveMultiplayer() {
    this.multiplayer.leaveRoom();
    this.dom.multiplayerStatusBar.classList.remove('active');
    this.dom.reactionsTray.classList.remove('active');
    this.startNewGame(600, 0, 'autoflip');
  }

  /* ---------------- EXPORT / FEN / PGN ---------------- */

  openExportModal() {
    this.dom.exportFenInput.value = this.engine.getFEN();
    this.dom.exportPgnTextarea.value = this.engine.getPGN();
    this.dom.modalExport.classList.add('active');
  }

  /* ---------------- DIAGNOSTIC TEST SUITE ---------------- */

  runDiagnostics() {
    const container = this.dom.testResultsContainer;
    container.innerHTML = 'Running automated verification tests...\n';
    let passed = 0;
    let failed = 0;

    const assert = (desc, cond) => {
      const line = document.createElement('div');
      if (cond) {
        passed++;
        line.innerHTML = `<span style="color:#10b981;">✓ PASS:</span> ${desc}`;
      } else {
        failed++;
        line.innerHTML = `<span style="color:#ef4444;">✗ FAIL:</span> ${desc}`;
      }
      container.appendChild(line);
    };

    try {
      // Test 1: Starting FEN
      const t1 = new ChessEngine();
      assert('Initial FEN matches standard starting position', t1.getFEN() === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      // Test 2: 20 legal moves for White in opening
      assert('Initial position offers exactly 20 legal moves', t1.getAllLegalMoves('w').length === 20);

      // Test 3: Pawn double step
      t1.makeMove('e2', 'e4');
      assert('Pawn double step records en passant target e3', t1.enPassant && t1.enPassant.row === 5 && t1.enPassant.col === 4);

      // Test 4: Knight jump
      t1.makeMove('g8', 'f6');
      assert('Knight successfully leaped to f6', t1.board[2][5] === 'bN');

      // Test 5: Scholar\'s Mate checkmate
      const sm = new ChessEngine();
      sm.makeMove('e2', 'e4');
      sm.makeMove('e7', 'e5');
      sm.makeMove('d1', 'h5');
      sm.makeMove('b8', 'c6');
      sm.makeMove('f1', 'c4');
      sm.makeMove('g8', 'f6');
      const mateRes = sm.makeMove('h5', 'f7');
      assert('Scholar\'s mate results in Checkmate (White wins)', mateRes.isCheckmate && mateRes.san === 'Qxf7#');

      // Test 6: Fool\'s Mate (Fastest Checkmate)
      const fm = new ChessEngine();
      fm.makeMove('f2', 'f3');
      fm.makeMove('e7', 'e5');
      fm.makeMove('g2', 'g4');
      const fmRes = fm.makeMove('d8', 'h4');
      assert('Fool\'s mate results in Checkmate (Black wins Qh4#)', fmRes.isCheckmate && fmRes.san === 'Qh4#');

      // Test 7: Kingside Castling
      const castlingEng = new ChessEngine('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5');
      const whiteCastle = castlingEng.makeMove('e1', 'g1');
      assert('White Kingside Castling (O-O) succeeds', whiteCastle && whiteCastle.san === 'O-O');
      assert('White Rook is placed on f1 after castling', castlingEng.board[7][5] === 'wR');

      // Test 8: En Passant capture execution
      const epEng = new ChessEngine('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
      const epRes = epEng.makeMove('e5', 'd6');
      assert('En Passant capture executes exd6', epRes && epRes.san === 'exd6');
      assert('Captured Black pawn on d5 is removed from board', epEng.board[3][3] === null);

      // Test 9: Pawn Promotion to Queen
      const promoEng = new ChessEngine('8/4P3/8/8/8/8/8/k1K5 w - - 0 1');
      const promoRes = promoEng.makeMove('e7', 'e8', 'Q');
      assert('Pawn promotion produces Queen on e8', promoRes && promoEng.board[0][4] === 'wQ');

      // Test 10: Stalemate detection
      const staleEng = new ChessEngine('k7/8/1Q6/8/8/8/8/2K5 b - - 0 1');
      assert('Stalemate position recognized as Draw', staleEng.isStalemate() && staleEng.isDraw());

      // Test 11: Insufficient material (K vs K)
      const matEng = new ChessEngine('8/8/8/4k3/8/8/4K3/8 w - - 0 1');
      assert('King vs King detected as insufficient material draw', matEng.isInsufficientMaterial() && matEng.isDraw());

      // Test 12: Undo move restores previous state
      const undoEng = new ChessEngine();
      undoEng.makeMove('e2', 'e4');
      undoEng.undo();
      assert('Undo successfully restores original board position', undoEng.board[6][4] === 'wP' && undoEng.turn === 'w');

    } catch (err) {
      failed++;
      assert(`Exception during diagnostic run: ${err.message}`, false);
    }

    this.dom.testSummary.textContent = `${passed} Passed, ${failed} Failed`;
    this.dom.testSummary.style.color = failed === 0 ? '#10b981' : '#ef4444';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ChessApp();
});
