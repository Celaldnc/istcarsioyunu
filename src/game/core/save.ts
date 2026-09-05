import type { GameState, GameStatus } from './game';
import { shapeById } from './pieces';
import type { Board, Cell, Piece } from './types';

import { BOARD, TRAY } from '@/constants/config';

/**
 * Oyun durumunun kalici depolamaya yazilabilir bicimi.
 *
 * Tasarim notlari:
 * - Parcalar SEKIL KIMLIGI olarak saklanir, sekil nesnesi olarak degil.
 *   Sekil tanimi (hucre koordinatlari) kodda yasar; kaydin icine kopyalamak
 *   hem yer israfi olur hem de sekil tanimi degistiginde eski kayitlar yanlis
 *   geometriyle geri gelirdi.
 * - rng FONKSIYONU saklanmaz. seed + o ana kadar cekilen parca sayisi yeterli;
 *   uretec geri yuklerken ayni noktaya sarilir.
 * - Her cozumleme adimi dogrulanir. Bozuk veya eski surumlu bir kayit null
 *   dondurur; cagiran taraf yeni oyun baslatir. Kaydin oyunu cokertmemesi,
 *   kaydi kurtarmaktan onemli.
 */

/** Kayit bicimi surumu. Uyusmayan kayitlar sessizce atilir. */
export const SAVE_VERSION = 1;

interface SavedSlot {
  readonly shapeId: string;
  readonly colorId: number;
}

interface SavedGame {
  readonly version: number;
  readonly board: readonly (readonly Cell[])[];
  readonly tray: readonly (SavedSlot | null)[];
  readonly score: number;
  readonly seed: number;
  readonly piecesDrawn: number;
  readonly status: GameStatus;
}

export function serializeGame(state: GameState): string {
  const payload: SavedGame = {
    version: SAVE_VERSION,
    board: state.board,
    tray: state.tray.map((piece) =>
      piece === undefined ? null : { shapeId: piece.shape.id, colorId: piece.colorId },
    ),
    score: state.score,
    seed: state.seed,
    piecesDrawn: state.piecesDrawn,
    status: state.status,
  };

  return JSON.stringify(payload);
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isStatus = (value: unknown): value is GameStatus =>
  value === 'playing' || value === 'gameOver';

function parseBoard(value: unknown): Board | null {
  if (!Array.isArray(value) || value.length !== BOARD.ROWS) {
    return null;
  }

  const rows: Cell[][] = [];

  for (const row of value) {
    if (!Array.isArray(row) || row.length !== BOARD.COLS) {
      return null;
    }
    const cells: Cell[] = [];
    for (const cell of row) {
      if (cell !== null && !isFiniteNumber(cell)) {
        return null;
      }
      cells.push(cell);
    }
    rows.push(cells);
  }

  return rows;
}

function parseTray(value: unknown): (Piece | undefined)[] | null {
  if (!Array.isArray(value) || value.length !== TRAY.PIECE_COUNT) {
    return null;
  }

  const tray: (Piece | undefined)[] = [];

  for (const slot of value) {
    if (slot === null) {
      tray.push(undefined);
      continue;
    }
    if (typeof slot !== 'object' || slot === null) {
      return null;
    }

    const { shapeId, colorId } = slot as Partial<SavedSlot>;
    if (typeof shapeId !== 'string' || !isFiniteNumber(colorId)) {
      return null;
    }

    // Sekil katalogdan cozulur; kayit sonrasi silinmis bir sekil kaydi gecersiz kilar.
    const shape = shapeById(shapeId);
    if (shape === undefined) {
      return null;
    }

    tray.push({ shape, colorId });
  }

  return tray;
}

export function deserializeGame(json: string): GameState | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const saved = raw as Partial<SavedGame>;
  if (saved.version !== SAVE_VERSION) {
    return null;
  }

  const board = parseBoard(saved.board);
  const tray = parseTray(saved.tray);

  if (
    board === null ||
    tray === null ||
    !isFiniteNumber(saved.score) ||
    !isFiniteNumber(saved.seed) ||
    !isFiniteNumber(saved.piecesDrawn) ||
    !isStatus(saved.status)
  ) {
    return null;
  }

  return {
    board,
    tray,
    score: saved.score,
    seed: saved.seed,
    piecesDrawn: saved.piecesDrawn,
    status: saved.status,
    // Animasyon ipuclari gecicidir; geri yuklerken sifirlanir.
    lastClear: { rows: [], cols: [] },
    lastGain: 0,
  };
}
