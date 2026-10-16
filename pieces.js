/**
 * Vector SVG representations of Standard Chess Pieces
 * Optimized, sharp at any scale, fully offline self-contained.
 */

const PIECE_SVGS = {
  // White Pieces
  wP: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#ffffff" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  
  wR: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" fill-rule="evenodd" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5l1.5-16.5h14l1.5 16.5H14z" stroke-linecap="butt"/><path d="M14 15h17v-4H14v4zm-3-4h23v-5h-4v2h-3v-2h-5v2h-3v-2h-5v2h-3v-2h-4v5z" stroke-linecap="butt"/><path d="M12 35.5h21m-20-4h19m-18-16.5h17" stroke="#1c1c1c" stroke-linejoin="miter"/></g></svg>`,
  
  wN: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="none" fill-rule="evenodd" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#ffffff"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-4.04 0-5-1-1-.42-3.13 1-4.5 1.76-1.71 1.76-2.6 1.76-2.6S13.5 16 14 15c.5-1 3.5-2 3.5-2s-1.5-1.5 0-3c1.5-1.5 3-1.5 3-1.5s.5-2 2-2c1.5 0 2.5 1 2.5 1s2.5 0 3 1.5c.5 1.5-1 3.5-1 3.5s2.5.5 2 2.5c-.5 2-2 2.5-2 2.5" fill="#ffffff"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-7.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill="#1c1c1c"/><path d="M24.55 10.4s-.45 1.45-1.55 1.6m5.2 2s-1.2 1.3-2.2 1m3.65 3.3s-1.75.9-2.65.3" stroke="#1c1c1c"/></g></svg>`,
  
  wB: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="none" fill-rule="evenodd" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g fill="#ffffff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-3-2.5h6" stroke-linejoin="miter"/></g></svg>`,
  
  wQ: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" fill-rule="evenodd" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10.5-3.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10.5 3.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM22.5 6.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-15-2.5 14.5-2.5-14.5-6 15-7-11 2 12z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/><path d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 3.5c3.5-1 18.5-1 22 0m-21.5 3.5c3.5-1 18.5-1 22 0"/></g></svg>`,
  
  wK: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="none" fill-rule="evenodd" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#ffffff" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#ffffff"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>`,

  // Black Pieces
  bP: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#2c2c2c" stroke="#111111" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  
  bR: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#2c2c2c" fill-rule="evenodd" stroke="#111111" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5l1.5-16.5h14l1.5 16.5H14z" stroke-linecap="butt"/><path d="M14 15h17v-4H14v4zm-3-4h23v-5h-4v2h-3v-2h-5v2h-3v-2h-5v2h-3v-2h-4v5z" stroke-linecap="butt"/><path d="M12 35.5h21m-20-4h19m-18-16.5h17" stroke="#f2f2f2" stroke-linejoin="miter"/></g></svg>`,
  
  bN: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="none" fill-rule="evenodd" stroke="#111111" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#2c2c2c"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-4.04 0-5-1-1-.42-3.13 1-4.5 1.76-1.71 1.76-2.6 1.76-2.6S13.5 16 14 15c.5-1 3.5-2 3.5-2s-1.5-1.5 0-3c1.5-1.5 3-1.5 3-1.5s.5-2 2-2c1.5 0 2.5 1 2.5 1s2.5 0 3 1.5c.5 1.5-1 3.5-1 3.5s2.5.5 2 2.5c-.5 2-2 2.5-2 2.5" fill="#2c2c2c"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-7.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill="#f2f2f2"/><path d="M24.55 10.4s-.45 1.45-1.55 1.6m5.2 2s-1.2 1.3-2.2 1m3.65 3.3s-1.75.9-2.65.3" stroke="#f2f2f2"/></g></svg>`,
  
  bB: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="none" fill-rule="evenodd" stroke="#111111" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g fill="#2c2c2c" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-3-2.5h6" stroke="#f2f2f2" stroke-linejoin="miter"/></g></svg>`,
  
  bQ: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#2c2c2c" fill-rule="evenodd" stroke="#111111" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10.5-3.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm10.5 3.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM22.5 6.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-15-2.5 14.5-2.5-14.5-6 15-7-11 2 12z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/><path d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 3.5c3.5-1 18.5-1 22 0m-21.5 3.5c3.5-1 18.5-1 22 0" stroke="#f2f2f2"/></g></svg>`,
  
  bK: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="none" fill-rule="evenodd" stroke="#111111" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke="#f2f2f2" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#2c2c2c" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#2c2c2c"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#f2f2f2"/></g></svg>`
};

const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

const PIECE_NAMES = {
  P: 'Pawn',
  N: 'Knight',
  B: 'Bishop',
  R: 'Rook',
  Q: 'Queen',
  K: 'King'
};

function getPieceSvg(pieceCode) {
  return PIECE_SVGS[pieceCode] || '';
}

// Export for ES modules or global window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PIECE_SVGS, PIECE_VALUES, PIECE_NAMES, getPieceSvg };
}
