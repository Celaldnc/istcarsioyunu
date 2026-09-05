import { pickOne } from './events';
import type { Rng } from './rng';
import { isFilledCell, isOffCell } from './types';
import type { Board, Piece, Point } from './types';

import { BOARD, GULL, ROLES } from '@/constants/config';

/**
 * Marti: tahta kenarina konar, birkac hamle sonra dalar ve o sutundaki en
 * ustteki dolu hucreyi CALAR (yer acar: kaos ama yardimci). Konmusken o
 * sutuna SIMIT renkli bir parca koyarsan simiti alir gider ve bonus verir.
 */

export interface Gull {
  /** Kondugu sutun (tahtanin ustunde durur). */
  readonly col: number;
  /** Kac hamle sonra dalar. */
  readonly turnsLeft: number;
}

/**
 * Marti bir sutuna konar. Sekilli tahtada tamamen su/tahta disi olan sutuna
 * konmaz (orada calacak bir sey de, simit atacak yer de yoktur).
 */
export function landGull(rng: Rng, board?: Board): Gull {
  const columns = Array.from({ length: BOARD.COLS }, (_, x) => x).filter(
    (x) => board === undefined || board.some((row) => !isOffCell(row[x])),
  );
  const col = pickOne(rng, columns.length > 0 ? columns : [0]) ?? 0;
  return { col, turnsLeft: GULL.PERCH_TURNS };
}

/** Sutundaki en ustteki dolu hucre; yoksa null. */
export function topFilledInColumn(board: Board, col: number): Point | null {
  for (let y = 0; y < board.length; y += 1) {
    if (isFilledCell(board[y]?.[col])) {
      return { x: col, y };
    }
  }
  return null;
}

/** Marti dalisi: hucreyi bosaltir. Bos sutunda tahta degismez. */
export function gullDive(board: Board, gull: Gull): { board: Board; stolen: Point | null } {
  const target = topFilledInColumn(board, gull.col);
  if (target === null) {
    return { board, stolen: null };
  }
  const next = board.map((row, y) =>
    y === target.y ? row.map((cell, x) => (x === target.x ? null : cell)) : row,
  );
  return { board: next, stolen: target };
}

/** Bu yerlestirme martiyi besler mi? (simit rengi + martinin sutunu) */
export function feedsGull(gull: Gull | null, piece: Piece, origin: Point): boolean {
  if (gull === null || piece.colorId !== ROLES.SIMIT) {
    return false;
  }
  return piece.shape.cells.some((cell) => origin.x + cell.x === gull.col);
}
