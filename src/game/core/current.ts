import type { Cat } from './cat';
import type { Curse } from './nazar';
import { isOffCell } from './types';
import type { Board, Cell } from './types';

/**
 * Bogaz akintisi: satirlar bir hucre saga kayar (sondaki basa doner).
 *
 * Sekilli tahtada yalnizca OYNANABILIR hucreler arasinda doner; su seridi
 * yerinde kalir. Kedinin oturdugu satir kaymaz ("Tekir agirlik yapiyor"):
 * aksi halde dolu bir hucre kedinin altina kayar ve kedi dolu hucrede
 * otururdu.
 */

function rotateRow(row: readonly Cell[]): Cell[] {
  const playable = row.map((cell, x) => (isOffCell(cell) ? -1 : x)).filter((x) => x >= 0);
  if (playable.length < 2) {
    return [...row];
  }
  const values = playable.map((x) => row[x] ?? null);
  const rotated = [values[values.length - 1] ?? null, ...values.slice(0, -1)];
  const next = [...row];
  playable.forEach((x, i) => {
    next[x] = rotated[i] ?? null;
  });
  return next;
}

export function driftBoard(board: Board, cat: Cat | null): Board {
  return board.map((row, y) => (cat !== null && cat.y === y ? [...row] : rotateRow(row)));
}

/** Lanetler hucreleriyle birlikte kayar. */
export function driftCurses(curses: readonly Curse[], board: Board, cat: Cat | null): Curse[] {
  return curses.map((curse) => {
    const row = board[curse.y];
    if (row === undefined || (cat !== null && cat.y === curse.y)) {
      return curse;
    }
    const playable = row.map((cell, x) => (isOffCell(cell) ? -1 : x)).filter((x) => x >= 0);
    const index = playable.indexOf(curse.x);
    if (index === -1 || playable.length < 2) {
      return curse;
    }
    return { ...curse, x: playable[(index + 1) % playable.length] ?? curse.x };
  });
}
