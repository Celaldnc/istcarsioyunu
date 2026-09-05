import { pickOne } from './events';
import type { Rng } from './rng';
import { OFF_CELL } from './types';
import type { Board, FullLines, Point } from './types';

import { CAT } from '@/constants/config';

/**
 * Tekir: tahtada uyuyan kedi.
 *
 * Istanbul'un simgesi; engel ama dusman degil. Uzerinde oturdugu hucreye
 * parca konamaz. Bitisik bir cizgi temizlenince uyanir ve baska bir bos
 * hucreye tasinir. Oksanirsa (petCat) CAT.REST_TURNS hamle yerinden kalkmaz:
 * oyuncu kediyi stratejik olarak sabitleyebilir.
 */

export interface Cat extends Point {
  /** Kac hamle daha yerinden kalkmaz (oksandi). */
  readonly restTurns: number;
}

/** Tahtadaki bos (null) hucreler. */
export function emptyCells(board: Board, exclude?: Point | null): Point[] {
  const cells: Point[] = [];
  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (
        cell === null &&
        !(exclude !== null && exclude !== undefined && exclude.x === x && exclude.y === y)
      ) {
        cells.push({ x, y });
      }
    }),
  );
  return cells;
}

/** Kediyi rastgele bos bir hucreye koyar; bos hucre yoksa null. */
export function spawnCat(board: Board, rng: Rng): Cat | null {
  const spot = pickOne(rng, emptyCells(board));
  return spot === undefined ? null : { ...spot, restTurns: 0 };
}

/**
 * Kedinin hucresini tahta disi gibi gosteren tahta: canPlace/isGameOver
 * bu tahtayla calisir, boylece kedi kurallara "dokunmadan" engel olur.
 */
export function withCatBlocked(board: Board, cat: Cat | null): Board {
  if (cat === null) {
    return board;
  }
  return board.map((row, y) =>
    y === cat.y ? row.map((cell, x) => (x === cat.x ? OFF_CELL : cell)) : row,
  );
}

/** Temizlenen cizgilerden biri kediye bitisik mi (kendi satir/sutunu dahil)? */
export function isCatDisturbed(cat: Cat, lines: FullLines): boolean {
  return (
    lines.rows.some((y) => Math.abs(y - cat.y) <= 1) ||
    lines.cols.some((x) => Math.abs(x - cat.x) <= 1)
  );
}

export interface CatTick {
  readonly cat: Cat | null;
  readonly moved: boolean;
}

/**
 * Hamle sonrasi kedi: dinleniyorsa sayac duser; rahatsiz edildiyse tasinir.
 * Tasinacak yer yoksa oldugu yerde kalir.
 */
export function tickCat(cat: Cat | null, board: Board, lines: FullLines, rng: Rng): CatTick {
  if (cat === null) {
    return { cat, moved: false };
  }
  if (cat.restTurns > 0) {
    return { cat: { ...cat, restTurns: cat.restTurns - 1 }, moved: false };
  }
  if (!isCatDisturbed(cat, lines)) {
    return { cat, moved: false };
  }
  const spot = pickOne(rng, emptyCells(board, cat));
  return spot === undefined
    ? { cat, moved: false }
    : { cat: { ...spot, restTurns: 0 }, moved: true };
}

/** Oksama: kedi CAT.REST_TURNS hamle boyunca yerinden kalkmaz. */
export function petCat(cat: Cat): Cat {
  return { ...cat, restTurns: CAT.REST_TURNS };
}
