import {
  applyClears,
  canPlace,
  createBoard,
  findFullLines,
  isBoardEmpty,
  isGameOver,
  monochromeLines,
  placePiece,
} from './board';
import { RNG_CALLS_PER_PIECE, generatePieceSet, generateStarterSet } from './pieces';
import { createRng } from './rng';
import { levelForScore } from './level';
import { computeScore } from './score';
import type { Board, FullLines, Piece, Point } from './types';

import { TEA_BREAK, TRAY } from '@/constants/config';

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
  /**
   * Ardisik temizleme serisi: kac hamledir ust uste cizgi temizleniyor.
   * Temizleme yapmayan bir hamle bunu sifirlar.
   */
  readonly comboStreak: number;
  /** Son hamlede temizlenen TEK RENKLI cizgiler (Cini) — kutlama ipucu. */
  readonly lastCini: FullLines;
  /** Kalan "Cay molasi" (devam) hakki. */
  readonly teaBreaksLeft: number;
}

const NO_LINES: FullLines = { rows: [], cols: [] };

/**
 * Seed ve o ana kadar cekilen parca sayisindan yeni tepsi uretir.
 *
 * Ureteci dongu ile ilerletmek yerine O(1) atlama kullaniliyor: uzun bir
 * oyunda tepsi yenileme O(n^2)'ye cikiyordu ve bu is hamlenin bittigi anda,
 * JS thread'inde yapiliyor.
 */
function drawTray(seed: number, piecesDrawn: number, level: number): Piece[] {
  return generatePieceSet(
    createRng(seed, piecesDrawn * RNG_CALLS_PER_PIECE),
    TRAY.PIECE_COUNT,
    level,
  );
}

/** Tepside kalan (kullanilmamis) parcalar. */
function remainingPieces(tray: readonly (Piece | undefined)[]): Piece[] {
  return tray.filter((piece): piece is Piece => piece !== undefined);
}

export function startGame(seed: number, board: Board = createBoard()): GameState {
  // Ilk tepsi bilerek kolay: rng tuketimi normal tepsiyle ayni oldugundan
  // sonraki tepsiler (piecesDrawn ile sarilan) etkilenmez.
  const tray = generateStarterSet(createRng(seed, 0), TRAY.PIECE_COUNT);

  return {
    board,
    tray,
    score: 0,
    seed,
    piecesDrawn: TRAY.PIECE_COUNT,
    status: isGameOver(board, tray) ? 'gameOver' : 'playing',
    lastClear: NO_LINES,
    lastGain: 0,
    comboStreak: 0,
    lastCini: NO_LINES,
    teaBreaksLeft: TEA_BREAK.PER_GAME,
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
  // Renk bilgisi temizlemeyle kaybolur; Cini temizlemeden ONCE bakilir.
  const cini = monochromeLines(placed, lines);
  const cleared = applyClears(placed, lines);

  const scored = computeScore({
    clearedLines: lines,
    boardEmptyAfterClears: isBoardEmpty(cleared),
    streak: state.comboStreak,
    ciniLines: cini.rows.length + cini.cols.length,
  });
  const gain = scored.total;
  const score = state.score + gain;

  let tray: readonly (Piece | undefined)[] = state.tray.map((slot, index) =>
    index === trayIndex ? undefined : slot,
  );
  let piecesDrawn = state.piecesDrawn;

  // Tepsi tamamen bosaldiginda yenilenir; Block Blast akisi budur.
  // Zorluk guncel seviyeden turetilir: oyun ilerledikce zor parcalar sikleşir.
  if (remainingPieces(tray).length === 0) {
    tray = drawTray(state.seed, piecesDrawn, levelForScore(score));
    piecesDrawn += TRAY.PIECE_COUNT;
  }

  return {
    ...state,
    board: cleared,
    tray,
    score,
    piecesDrawn,
    status: isGameOver(cleared, remainingPieces(tray)) ? 'gameOver' : 'playing',
    lastClear: lines,
    lastGain: gain,
    comboStreak: scored.nextStreak,
    lastCini: cini,
  };
}

/** Dolu hucre sayisina gore en dolu `count` cizginin indeksleri. */
function fullestLines(fillCounts: readonly number[], count: number): number[] {
  return (
    fillCounts
      .map((filled, index) => ({ filled, index }))
      // Esitlikte alt/sag cizgi one gecer: Block Blast'ta yigilma oradan baslar.
      .sort((a, b) => b.filled - a.filled || b.index - a.index)
      .slice(0, count)
      .map((entry) => entry.index)
      .sort((a, b) => a - b)
  );
}

/**
 * "Cay molasi": bitmis oyunda en dolu satir ve sutunlari bosaltip devam
 * ettirir.
 *
 * Rakipler bu "devam" hakkini reklam izletip veriyor; burada oyun basina
 * TEA_BREAK.PER_GAME kadar ucretsiz. Puan vermez, seriyi sifirlar; tepsiye
 * dokunmaz (oyuncu ayni parcalarla, acilan yerle devam eder).
 *
 * Hak yoksa veya oyun surerken cagrilirsa durum DEGISMEZ (ayni referans).
 */
export function takeTeaBreak(state: GameState): GameState {
  if (state.status !== 'gameOver' || state.teaBreaksLeft <= 0) {
    return state;
  }

  const rowFill = state.board.map((row) => row.filter((cell) => cell !== null).length);
  const colFill = Array.from({ length: state.board[0]?.length ?? 0 }, (_, x) =>
    state.board.reduce((total, row) => total + (row[x] !== null ? 1 : 0), 0),
  );
  const lines: FullLines = {
    rows: fullestLines(rowFill, TEA_BREAK.ROWS),
    cols: fullestLines(colFill, TEA_BREAK.COLS),
  };
  const board = applyClears(state.board, lines);

  return {
    ...state,
    board,
    status: isGameOver(board, remainingPieces(state.tray)) ? 'gameOver' : 'playing',
    lastClear: lines,
    lastGain: 0,
    comboStreak: 0,
    lastCini: NO_LINES,
    teaBreaksLeft: state.teaBreaksLeft - 1,
  };
}

/** Guncel seviye (skordan turetilir). */
export function currentLevel(state: GameState): number {
  return levelForScore(state.score);
}

/** Ayni seed ile bastan baslatir (Daily modunda tekrar denemek icin). */
export function restart(state: GameState): GameState {
  return startGame(state.seed);
}
