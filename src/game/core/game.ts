import {
  applyClears,
  canPlace,
  createBoard,
  findFullLines,
  isBoardEmpty,
  isGameOver,
  placePiece,
} from './board';
import { RNG_CALLS_PER_PIECE, generatePieceSet } from './pieces';
import { advance, createRng } from './rng';
import { computeScore } from './score';
import type { Board, FullLines, Piece, Point } from './types';

import { TRAY } from '@/constants/config';

/**
 * Oyunun tum durumu ve gecisleri — SAF bir reducer olarak.
 *
 * Zustand store'u bunun ince bir sarmalayicisidir. Boylece oyun akisinin
 * tamami (hamle, temizleme, skor, oyun sonu, tepsi yenileme) React veya
 * store calistirmadan test edilebiliyor.
 */

export type GameStatus = 'playing' | 'gameOver';

export interface GameState {
  readonly board: Board;
  /** Sabit uzunlukta; kullanilmis yuvalar undefined. */
  readonly tray: readonly (Piece | undefined)[];
  readonly score: number;
  readonly seed: number;
  /** O ana kadar cekilen toplam parca sayisi (kalici depolamadan geri yukleme icin). */
  readonly piecesDrawn: number;
  readonly status: GameStatus;
  /** Son hamlede temizlenen cizgiler — animasyon ve ses ipucu icin. */
  readonly lastClear: FullLines;
  /** Son hamlenin getirdigi puan — skor animasyonu icin. */
  readonly lastGain: number;
}

const NO_LINES: FullLines = { rows: [], cols: [] };

/** Seed ve o ana kadar cekilen parca sayisindan yeni tepsi uretir. */
function drawTray(seed: number, piecesDrawn: number): Piece[] {
  const rng = createRng(seed);
  advance(rng, piecesDrawn * RNG_CALLS_PER_PIECE);
  return generatePieceSet(rng, TRAY.PIECE_COUNT);
}

/** Tepside kalan (kullanilmamis) parcalar. */
function remainingPieces(tray: readonly (Piece | undefined)[]): Piece[] {
  return tray.filter((piece): piece is Piece => piece !== undefined);
}

export function startGame(seed: number, board: Board = createBoard()): GameState {
  const tray = drawTray(seed, 0);

  return {
    board,
    tray,
    score: 0,
    seed,
    piecesDrawn: TRAY.PIECE_COUNT,
    status: isGameOver(board, tray) ? 'gameOver' : 'playing',
    lastClear: NO_LINES,
    lastGain: 0,
  };
}

/**
 * Bir parcayi tahtaya oynar.
 *
 * Gecersiz hamlede durum DEGISMEDEN geri doner (ayni referans); cagiran taraf
 * bunu "kabul edilmedi" olarak yorumlayabilir.
 */
export function playPiece(state: GameState, trayIndex: number, origin: Point): GameState {
  if (state.status !== 'playing') {
    return state;
  }

  const piece = state.tray[trayIndex];
  if (piece === undefined || !canPlace(state.board, piece, origin)) {
    return state;
  }

  const placed = placePiece(state.board, piece, origin);
  const lines = findFullLines(placed);
  const cleared = applyClears(placed, lines);

  const gain = computeScore({
    clearedLines: lines,
    boardEmptyAfterClears: isBoardEmpty(cleared),
  }).total;

  let tray: readonly (Piece | undefined)[] = state.tray.map((slot, index) =>
    index === trayIndex ? undefined : slot,
  );
  let piecesDrawn = state.piecesDrawn;

  // Tepsi tamamen bosaldiginda yenilenir; Block Blast akisi budur.
  if (remainingPieces(tray).length === 0) {
    tray = drawTray(state.seed, piecesDrawn);
    piecesDrawn += TRAY.PIECE_COUNT;
  }

  return {
    ...state,
    board: cleared,
    tray,
    score: state.score + gain,
    piecesDrawn,
    status: isGameOver(cleared, remainingPieces(tray)) ? 'gameOver' : 'playing',
    lastClear: lines,
    lastGain: gain,
  };
}

/** Ayni seed ile bastan baslatir (Daily modunda tekrar denemek icin). */
export function restart(state: GameState): GameState {
  return startGame(state.seed);
}
