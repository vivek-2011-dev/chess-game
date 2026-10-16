/**
 * Robust, Complete Chess Rule Engine
 * Full FIDE compliance: En Passant, Castling, Promotion, Pin validation,
 * Check, Checkmate, Stalemate, 50-move rule, Insufficient Material,
 * Threefold Repetition, SAN generator, FEN export/import, and Move Undo.
 */

class ChessEngine {
  constructor(fen) {
    this.reset(fen);
  }

  reset(fen) {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.turn = 'w';
    this.castling = {
      w: { k: true, q: true },
      b: { k: true, q: true }
    };
    this.enPassant = null; // { row, col }
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
    this.history = [];
    this.positionHistory = []; // FEN signatures for repetition
    this.capturedPieces = { w: [], b: [] }; // captured BY white or black

    if (fen) {
      this.loadFEN(fen);
    } else {
      this.loadStartingPosition();
    }
  }

  loadStartingPosition() {
    const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.loadFEN(startFEN);
  }

  /**
   * Clone current engine state
   */
  clone() {
    const copy = new ChessEngine();
    copy.board = this.board.map(row => [...row]);
    copy.turn = this.turn;
    copy.castling = {
      w: { ...this.castling.w },
      b: { ...this.castling.b }
    };
    copy.enPassant = this.enPassant ? { ...this.enPassant } : null;
    copy.halfmoveClock = this.halfmoveClock;
    copy.fullmoveNumber = this.fullmoveNumber;
    copy.capturedPieces = {
      w: [...this.capturedPieces.w],
      b: [...this.capturedPieces.b]
    };
    copy.positionHistory = [...this.positionHistory];
    return copy;
  }

  /**
   * Check if coordinates are inside 8x8 board
   */
  static inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  /**
   * Convert row, col to algebraic square ('e4', 'a1', etc.)
   */
  static coordsToSquare(r, c) {
    const file = String.fromCharCode(97 + c);
    const rank = 8 - r;
    return `${file}${rank}`;
  }

  /**
   * Convert algebraic square ('e4') to { row, col }
   */
  static squareToCoords(square) {
    if (!square || square.length < 2) return null;
    const col = square.charCodeAt(0) - 97;
    const row = 8 - parseInt(square[1], 10);
    return ChessEngine.inBounds(row, col) ? { row, col } : null;
  }

  /**
   * Get piece color ('w' or 'b') or null
   */
  static getColor(piece) {
    return piece ? piece[0] : null;
  }

  /**
   * Get piece type ('P', 'N', 'B', 'R', 'Q', 'K') or null
   */
  static getType(piece) {
    return piece ? piece[1] : null;
  }

  /**
   * Check if a square is attacked by a given color
   */
  isSquareAttacked(r, c, byColor, board = this.board) {
    const oppColor = byColor;
    const pawnDir = oppColor === 'w' ? 1 : -1; // Opponent white pawn attacks from +1 row, black from -1 row

    // 1. Pawn attacks
    for (const dc of [-1, 1]) {
      const pr = r + pawnDir;
      const pc = c + dc;
      if (ChessEngine.inBounds(pr, pc)) {
        const p = board[pr][pc];
        if (p === `${oppColor}P`) return true;
      }
    }

    // 2. Knight attacks
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (ChessEngine.inBounds(nr, nc)) {
        const p = board[nr][nc];
        if (p === `${oppColor}N`) return true;
      }
    }

    // 3. King attacks (adjacent squares)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const kr = r + dr;
        const kc = c + dc;
        if (ChessEngine.inBounds(kr, kc)) {
          const p = board[kr][kc];
          if (p === `${oppColor}K`) return true;
        }
      }
    }

    // 4. Straight rays (Rook or Queen)
    const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of straightDirs) {
      let step = 1;
      while (true) {
        const tr = r + dr * step;
        const tc = c + dc * step;
        if (!ChessEngine.inBounds(tr, tc)) break;
        const p = board[tr][tc];
        if (p) {
          if (p === `${oppColor}R` || p === `${oppColor}Q`) return true;
          break; // Blocked by any other piece
        }
        step++;
      }
    }

    // 5. Diagonal rays (Bishop or Queen)
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diagDirs) {
      let step = 1;
      while (true) {
        const tr = r + dr * step;
        const tc = c + dc * step;
        if (!ChessEngine.inBounds(tr, tc)) break;
        const p = board[tr][tc];
        if (p) {
          if (p === `${oppColor}B` || p === `${oppColor}Q`) return true;
          break; // Blocked
        }
        step++;
      }
    }

    return false;
  }

  /**
   * Find king coords for given color
   */
  findKing(color, board = this.board) {
    const target = `${color}K`;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === target) return { row: r, col: c };
      }
    }
    return null;
  }

  /**
   * Check if the specified player is currently in check
   */
  isCheck(color = this.turn, board = this.board) {
    const king = this.findKing(color, board);
    if (!king) return false;
    const opp = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(king.row, king.col, opp, board);
  }

  /**
   * Generate pseudo-legal moves for a piece at (r, c)
   */
  getPseudoLegalMoves(r, c) {
    const piece = this.board[r][c];
    if (!piece) return [];
    const color = piece[0];
    const type = piece[1];
    const moves = [];

    // --- PAWN ---
    if (type === 'P') {
      const forward = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      const promoRow = color === 'w' ? 0 : 7;

      // Single step forward
      const nextR = r + forward;
      if (ChessEngine.inBounds(nextR, c) && !this.board[nextR][c]) {
        if (nextR === promoRow) {
          for (const promo of ['Q', 'R', 'B', 'N']) {
            moves.push({ from: { row: r, col: c }, to: { row: nextR, col: c }, promotion: promo });
          }
        } else {
          moves.push({ from: { row: r, col: c }, to: { row: nextR, col: c } });
        }

        // Double step forward
        const doubleR = r + forward * 2;
        if (r === startRow && !this.board[doubleR][c]) {
          moves.push({ from: { row: r, col: c }, to: { row: doubleR, col: c } });
        }
      }

      // Diagonal captures & En Passant
      for (const dc of [-1, 1]) {
        const targetC = c + dc;
        if (ChessEngine.inBounds(nextR, targetC)) {
          const targetPiece = this.board[nextR][targetC];
          const isEnPassant = this.enPassant && this.enPassant.row === nextR && this.enPassant.col === targetC;

          if ((targetPiece && targetPiece[0] !== color) || isEnPassant) {
            if (nextR === promoRow) {
              for (const promo of ['Q', 'R', 'B', 'N']) {
                moves.push({
                  from: { row: r, col: c },
                  to: { row: nextR, col: targetC },
                  promotion: promo,
                  isEnPassant
                });
              }
            } else {
              moves.push({
                from: { row: r, col: c },
                to: { row: nextR, col: targetC },
                isEnPassant
              });
            }
          }
        }
      }
    }

    // --- KNIGHT ---
    else if (type === 'N') {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of offsets) {
        const tr = r + dr;
        const tc = c + dc;
        if (ChessEngine.inBounds(tr, tc)) {
          const targetPiece = this.board[tr][tc];
          if (!targetPiece || targetPiece[0] !== color) {
            moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
          }
        }
      }
    }

    // --- BISHOP / ROOK / QUEEN (Rays) ---
    else if (type === 'B' || type === 'R' || type === 'Q') {
      const dirs = [];
      if (type === 'B' || type === 'Q') {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (type === 'R' || type === 'Q') {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }

      for (const [dr, dc] of dirs) {
        let step = 1;
        while (true) {
          const tr = r + dr * step;
          const tc = c + dc * step;
          if (!ChessEngine.inBounds(tr, tc)) break;
          const targetPiece = this.board[tr][tc];
          if (!targetPiece) {
            moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
          } else {
            if (targetPiece[0] !== color) {
              moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
            }
            break; // Stop ray at first piece encountered
          }
          step++;
        }
      }
    }

    // --- KING ---
    else if (type === 'K') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const tr = r + dr;
          const tc = c + dc;
          if (ChessEngine.inBounds(tr, tc)) {
            const targetPiece = this.board[tr][tc];
            if (!targetPiece || targetPiece[0] !== color) {
              moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
            }
          }
        }
      }

      // Castling
      const opp = color === 'w' ? 'b' : 'w';
      const row = color === 'w' ? 7 : 0;
      if (r === row && c === 4 && !this.isSquareAttacked(row, 4, opp)) {
        // Kingside (O-O)
        if (this.castling[color].k) {
          if (
            !this.board[row][5] &&
            !this.board[row][6] &&
            this.board[row][7] === `${color}R` &&
            !this.isSquareAttacked(row, 5, opp) &&
            !this.isSquareAttacked(row, 6, opp)
          ) {
            moves.push({
              from: { row: r, col: c },
              to: { row, col: 6 },
              isCastling: 'k'
            });
          }
        }

        // Queenside (O-O-O)
        if (this.castling[color].q) {
          if (
            !this.board[row][3] &&
            !this.board[row][2] &&
            !this.board[row][1] &&
            this.board[row][0] === `${color}R` &&
            !this.isSquareAttacked(row, 3, opp) &&
            !this.isSquareAttacked(row, 2, opp)
          ) {
            moves.push({
              from: { row: r, col: c },
              to: { row, col: 2 },
              isCastling: 'q'
            });
          }
        }
      }
    }

    return moves;
  }

  /**
   * Simulate a move on a 2D board copy to see if king would be left in check
   */
  isMoveLegal(move) {
    const piece = this.board[move.from.row][move.from.col];
    if (!piece || piece[0] !== this.turn) return false;

    // Fast simulation on cloned 8x8 matrix
    const tempBoard = this.board.map(row => [...row]);
    const { from, to, promotion, isEnPassant, isCastling } = move;

    // Apply movement
    tempBoard[to.row][to.col] = promotion ? `${piece[0]}${promotion}` : piece;
    tempBoard[from.row][from.col] = null;

    // En passant capture removal
    if (isEnPassant) {
      const capturedPawnRow = from.row;
      tempBoard[capturedPawnRow][to.col] = null;
    }

    // Castling rook movement
    if (isCastling === 'k') {
      tempBoard[to.row][5] = tempBoard[to.row][7];
      tempBoard[to.row][7] = null;
    } else if (isCastling === 'q') {
      tempBoard[to.row][3] = tempBoard[to.row][0];
      tempBoard[to.row][0] = null;
    }

    // Check if moving player's king is in check
    const kingPos = this.findKing(piece[0], tempBoard);
    if (!kingPos) return false;
    const opp = piece[0] === 'w' ? 'b' : 'w';
    return !this.isSquareAttacked(kingPos.row, kingPos.col, opp, tempBoard);
  }

  /**
   * Get all legal moves for a piece at (r, c)
   */
  getLegalMoves(r, c) {
    const piece = this.board[r][c];
    if (!piece || piece[0] !== this.turn) return [];
    const pseudoMoves = this.getPseudoLegalMoves(r, c);
    return pseudoMoves.filter(m => this.isMoveLegal(m));
  }

  /**
   * Get all legal moves for current player (or specified color)
   */
  getAllLegalMoves(color = this.turn) {
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece[0] === color) {
          const pseudo = this.getPseudoLegalMoves(r, c);
          for (const m of pseudo) {
            if (this.isMoveLegal(m)) {
              allMoves.push(m);
            }
          }
        }
      }
    }
    return allMoves;
  }

  /**
   * Calculate standard algebraic notation (SAN) for a legal move
   */
  getSAN(move) {
    const { from, to, promotion, isCastling, isEnPassant } = move;
    const piece = this.board[from.row][from.col];
    const type = piece[1];
    const targetSquare = ChessEngine.coordsToSquare(to.row, to.col);
    const isCapture = this.board[to.row][to.col] !== null || isEnPassant;

    let san = '';

    if (isCastling === 'k') {
      san = 'O-O';
    } else if (isCastling === 'q') {
      san = 'O-O-O';
    } else if (type === 'P') {
      if (isCapture) {
        const fromFile = String.fromCharCode(97 + from.col);
        san = `${fromFile}x${targetSquare}`;
      } else {
        san = targetSquare;
      }
      if (promotion) {
        san += `=${promotion}`;
      }
    } else {
      // Piece move - handle disambiguation
      san = type;

      // Find all pieces of same type that could also move to 'to'
      const candMoves = this.getAllLegalMoves(piece[0]).filter(
        m => m.to.row === to.row &&
             m.to.col === to.col &&
             this.board[m.from.row][m.from.col][1] === type &&
             (m.from.row !== from.row || m.from.col !== from.col)
      );

      if (candMoves.length > 0) {
        const sameFile = candMoves.some(m => m.from.col === from.col);
        const sameRank = candMoves.some(m => m.from.row === from.row);
        const fromFile = String.fromCharCode(97 + from.col);
        const fromRank = (8 - from.row).toString();

        if (!sameFile) {
          san += fromFile;
        } else if (!sameRank) {
          san += fromRank;
        } else {
          san += `${fromFile}${fromRank}`;
        }
      }

      if (isCapture) {
        san += `x`;
      }
      san += targetSquare;
    }

    // Check / Checkmate suffix
    // Test what happens after move
    const clone = this.clone();
    clone.makeMoveDirect(move);
    const nextOpp = clone.turn;
    const isNextCheck = clone.isCheck(nextOpp);
    const nextLegalMoves = clone.getAllLegalMoves(nextOpp);

    if (isNextCheck) {
      if (nextLegalMoves.length === 0) {
        san += '#';
      } else {
        san += '+';
      }
    }

    return san;
  }

  /**
   * Apply a move directly without validation
   */
  makeMoveDirect(move) {
    const { from, to, promotion, isCastling, isEnPassant } = move;
    const piece = this.board[from.row][from.col];
    const color = piece[0];
    const opp = color === 'w' ? 'b' : 'w';
    const type = piece[1];

    let captured = this.board[to.row][to.col];

    // Handle en passant capture
    if (isEnPassant) {
      captured = this.board[from.row][to.col];
      this.board[from.row][to.col] = null;
    }

    if (captured) {
      this.capturedPieces[color].push(captured);
    }

    // Move main piece
    this.board[to.row][to.col] = promotion ? `${color}${promotion}` : piece;
    this.board[from.row][from.col] = null;

    // Handle Castling rook move
    if (isCastling === 'k') {
      this.board[to.row][5] = this.board[to.row][7];
      this.board[to.row][7] = null;
    } else if (isCastling === 'q') {
      this.board[to.row][3] = this.board[to.row][0];
      this.board[to.row][0] = null;
    }

    // Update castling rights
    if (type === 'K') {
      this.castling[color].k = false;
      this.castling[color].q = false;
    } else if (type === 'R') {
      if (from.row === (color === 'w' ? 7 : 0)) {
        if (from.col === 0) this.castling[color].q = false;
        if (from.col === 7) this.castling[color].k = false;
      }
    }

    // If opponent rook captured on original square, revoke their right
    if (captured && captured[1] === 'R') {
      const oppRow = opp === 'w' ? 7 : 0;
      if (to.row === oppRow) {
        if (to.col === 0) this.castling[opp].q = false;
        if (to.col === 7) this.castling[opp].k = false;
      }
    }

    // Update en passant availability
    if (type === 'P' && Math.abs(to.row - from.row) === 2) {
      this.enPassant = {
        row: (from.row + to.row) / 2,
        col: from.col
      };
    } else {
      this.enPassant = null;
    }

    // Halfmove clock for 50-move rule
    if (type === 'P' || captured) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }

    // Fullmove counter
    if (color === 'b') {
      this.fullmoveNumber++;
    }

    // Switch turn
    this.turn = opp;

    // Record position for repetition detection
    this.positionHistory.push(this.getPositionSignature());
  }

  /**
   * Make a move by coordinates (or algebraic squares)
   */
  makeMove(from, to, promotion = 'Q') {
    const fCoord = typeof from === 'string' ? ChessEngine.squareToCoords(from) : from;
    const tCoord = typeof to === 'string' ? ChessEngine.squareToCoords(to) : to;

    if (!fCoord || !tCoord) return null;

    const legalMoves = this.getLegalMoves(fCoord.row, fCoord.col);
    const chosenMove = legalMoves.find(
      m => m.to.row === tCoord.row &&
           m.to.col === tCoord.col &&
           (!m.promotion || m.promotion === promotion)
    );

    if (!chosenMove) return null;

    // Generate SAN before state mutations
    const san = this.getSAN(chosenMove);
    const fenBefore = this.getFEN();

    // Save history snapshot for undo
    const snapshot = {
      board: this.board.map(r => [...r]),
      turn: this.turn,
      castling: {
        w: { ...this.castling.w },
        b: { ...this.castling.b }
      },
      enPassant: this.enPassant ? { ...this.enPassant } : null,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber,
      capturedPieces: {
        w: [...this.capturedPieces.w],
        b: [...this.capturedPieces.b]
      },
      move: chosenMove,
      san,
      fenBefore
    };

    this.makeMoveDirect(chosenMove);

    snapshot.fenAfter = this.getFEN();
    this.history.push(snapshot);

    return {
      san,
      move: chosenMove,
      fen: snapshot.fenAfter,
      isCheck: this.isCheck(this.turn),
      isCheckmate: this.isCheckmate(),
      isStalemate: this.isStalemate(),
      isDraw: this.isDraw()
    };
  }

  /**
   * Undo last move
   */
  undo() {
    if (this.history.length === 0) return null;
    const lastSnapshot = this.history.pop();
    this.board = lastSnapshot.board;
    this.turn = lastSnapshot.turn;
    this.castling = lastSnapshot.castling;
    this.enPassant = lastSnapshot.enPassant;
    this.halfmoveClock = lastSnapshot.halfmoveClock;
    this.fullmoveNumber = lastSnapshot.fullmoveNumber;
    this.capturedPieces = lastSnapshot.capturedPieces;
    this.positionHistory.pop();
    return lastSnapshot;
  }

  /**
   * Game termination state queries
   */
  isCheckmate() {
    return this.isCheck(this.turn) && this.getAllLegalMoves().length === 0;
  }

  isStalemate() {
    return !this.isCheck(this.turn) && this.getAllLegalMoves().length === 0;
  }

  isFiftyMoveRule() {
    return this.halfmoveClock >= 100;
  }

  isThreefoldRepetition() {
    const current = this.getPositionSignature();
    let count = 0;
    for (const sig of this.positionHistory) {
      if (sig === current) count++;
      if (count >= 3) return true;
    }
    return false;
  }

  isInsufficientMaterial() {
    let pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p) pieces.push({ piece: p, row: r, col: c });
      }
    }

    // 1. King vs King
    if (pieces.length === 2) return true;

    // 2. King + minor piece vs King
    if (pieces.length === 3) {
      const nonKings = pieces.filter(p => p.piece[1] !== 'K');
      if (nonKings.length === 1) {
        const type = nonKings[0].piece[1];
        if (type === 'B' || type === 'N') return true;
      }
    }

    // 3. King + Bishop vs King + Bishop (same square colors)
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.piece[1] === 'B');
      if (bishops.length === 2 && bishops[0].piece[0] !== bishops[1].piece[0]) {
        const colorSquare1 = (bishops[0].row + bishops[0].col) % 2;
        const colorSquare2 = (bishops[1].row + bishops[1].col) % 2;
        if (colorSquare1 === colorSquare2) return true;
      }
    }

    return false;
  }

  isDraw() {
    return this.isStalemate() ||
           this.isInsufficientMaterial() ||
           this.isFiftyMoveRule() ||
           this.isThreefoldRepetition();
  }

  getGameStatus() {
    if (this.isCheckmate()) {
      const winner = this.turn === 'w' ? 'Black' : 'White';
      return { over: true, result: 'checkmate', winner, message: `Checkmate! ${winner} wins.` };
    }
    if (this.isStalemate()) {
      return { over: true, result: 'stalemate', winner: null, message: 'Draw by Stalemate!' };
    }
    if (this.isInsufficientMaterial()) {
      return { over: true, result: 'insufficient', winner: null, message: 'Draw: Insufficient material.' };
    }
    if (this.isFiftyMoveRule()) {
      return { over: true, result: '50-move', winner: null, message: 'Draw: 50-move rule exceeded.' };
    }
    if (this.isThreefoldRepetition()) {
      return { over: true, result: 'repetition', winner: null, message: 'Draw by Threefold Repetition.' };
    }
    if (this.isCheck(this.turn)) {
      return { over: false, result: 'check', winner: null, message: `${this.turn === 'w' ? 'White' : 'Black'} is in check!` };
    }
    return { over: false, result: 'active', winner: null, message: `${this.turn === 'w' ? 'White' : 'Black'} to move.` };
  }

  /**
   * Material score tally
   */
  getMaterialTally() {
    const values = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
    let whiteScore = 0;
    let blackScore = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p) {
          const val = values[p[1]] || 0;
          if (p[0] === 'w') whiteScore += val;
          else blackScore += val;
        }
      }
    }

    const diff = whiteScore - blackScore;
    return {
      whiteScore,
      blackScore,
      diff, // >0 white leads, <0 black leads
      capturedByWhite: [...this.capturedPieces.w],
      capturedByBlack: [...this.capturedPieces.b]
    };
  }

  /**
   * Position signature for repetition check (board + turn + castling + ep)
   */
  getPositionSignature() {
    let boardStr = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        boardStr += this.board[r][c] || '.';
      }
    }
    const castlingStr = `${this.castling.w.k ? 'K' : ''}${this.castling.w.q ? 'Q' : ''}${this.castling.b.k ? 'k' : ''}${this.castling.b.q ? 'q' : ''}` || '-';
    const epStr = this.enPassant ? ChessEngine.coordsToSquare(this.enPassant.row, this.enPassant.col) : '-';
    return `${boardStr} ${this.turn} ${castlingStr} ${epStr}`;
  }

  /**
   * Generate standard FEN
   */
  getFEN() {
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p) {
          empty++;
        } else {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          const char = p[0] === 'w' ? p[1].toUpperCase() : p[1].toLowerCase();
          fen += char;
        }
      }
      if (empty > 0) fen += empty;
      if (r < 7) fen += '/';
    }

    fen += ` ${this.turn} `;

    let castling = '';
    if (this.castling.w.k) castling += 'K';
    if (this.castling.w.q) castling += 'Q';
    if (this.castling.b.k) castling += 'k';
    if (this.castling.b.q) castling += 'q';
    fen += castling.length > 0 ? castling : '-';

    const ep = this.enPassant ? ChessEngine.coordsToSquare(this.enPassant.row, this.enPassant.col) : '-';
    fen += ` ${ep} ${this.halfmoveClock} ${this.fullmoveNumber}`;

    return fen;
  }

  /**
   * Load standard FEN
   */
  loadFEN(fen) {
    const parts = fen.trim().split(/\s+/);
    if (parts.length < 4) throw new Error('Invalid FEN format');

    const [boardPart, turnPart, castlingPart, epPart, halfPart, fullPart] = parts;

    // Reset board
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    const ranks = boardPart.split('/');
    if (ranks.length !== 8) throw new Error('Invalid rank count in FEN');

    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const ch of ranks[r]) {
        if (ch >= '1' && ch <= '8') {
          c += parseInt(ch, 10);
        } else {
          const color = ch === ch.toUpperCase() ? 'w' : 'b';
          const type = ch.toUpperCase();
          if (c < 8) {
            newBoard[r][c] = `${color}${type}`;
          }
          c++;
        }
      }
    }

    this.board = newBoard;
    this.turn = turnPart === 'b' ? 'b' : 'w';
    this.castling = {
      w: { k: castlingPart.includes('K'), q: castlingPart.includes('Q') },
      b: { k: castlingPart.includes('k'), q: castlingPart.includes('q') }
    };
    this.enPassant = epPart && epPart !== '-' ? ChessEngine.squareToCoords(epPart) : null;
    this.halfmoveClock = halfPart ? parseInt(halfPart, 10) : 0;
    this.fullmoveNumber = fullPart ? parseInt(fullPart, 10) : 1;
    this.positionHistory = [this.getPositionSignature()];
  }

  /**
   * Export PGN string
   */
  getPGN(headers = {}) {
    let pgn = '';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
    const defaultHeaders = {
      Event: 'Casual Offline Game',
      Site: 'Antigravity Chess',
      Date: date,
      Round: '1',
      White: 'Player 1',
      Black: 'Player 2',
      Result: '*'
    };

    const status = this.getGameStatus();
    if (status.result === 'checkmate') {
      defaultHeaders.Result = status.winner === 'White' ? '1-0' : '0-1';
    } else if (this.isDraw()) {
      defaultHeaders.Result = '1/2-1/2';
    }

    const merged = { ...defaultHeaders, ...headers };
    for (const [k, v] of Object.entries(merged)) {
      pgn += `[${k} "${v}"]\n`;
    }
    pgn += '\n';

    let moveText = '';
    for (let i = 0; i < this.history.length; i++) {
      const snap = this.history[i];
      if (i % 2 === 0) {
        const moveNum = Math.floor(i / 2) + 1;
        moveText += `${moveNum}. ${snap.san} `;
      } else {
        moveText += `${snap.san} `;
      }
    }

    moveText += merged.Result;
    pgn += moveText.trim();
    return pgn;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChessEngine;
}
