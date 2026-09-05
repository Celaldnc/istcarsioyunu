import { pickOne } from './events';
import type { Rng } from './rng';
import { isFilledCell } from './types';
import type { Board, FullLines, Point } from './types';

import { NAZAR, ROLES } from '@/constants/config';

/**
 * Nazar laneti: bir dolu hucre kararir. NAZAR.SPREAD_TURNS hamle icinde
 * temizlenmezse komsu bir dolu hucreye yayilir. Temizlenirse bonus.
 *
 * Koruma: nazar boncugu rengindeki bir hucreye bitisik hucrelere lanet
 * bulasmaz — boncuk isini yapar.
 */

export interface Curse extends Point {
  readonly turnsLeft: number;
}

const NEIGHBOURS: readonly Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const same = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;

/** Hucre nazar boncuguna bitisik mi (korunuyor mu)? */
export function isProtected(board: Board, cell: Point): boolean {
  return NEIGHBOURS.some((d) => board[cell.y + d.y]?.[cell.x + d.x] === ROLES.NAZAR);
}

/** Lanet bulasabilecek hucreler: dolu, lanetsiz, korunmasiz, boncuk degil. */
function cursable(board: Board, curses: readonly Curse[], candidates: readonly Point[]): Point[] {
  return candidates.filter((p) => {
    const cell = board[p.y]?.[p.x];
    return (
      isFilledCell(cell) &&
      cell !== ROLES.NAZAR &&
      !curses.some((c) => same(c, p)) &&
      !isProtected(board, p)
    );
  });
}

function allCells(board: Board): Point[] {
  return board.flatMap((row, y) => row.map((_, x) => ({ x, y })));
}

export interface NazarTick {
  readonly curses: readonly Curse[];
  readonly spread: number;
  readonly spawned: boolean;
}

/**
 * Hamle sonrasi lanetler: sayac duser, sifira inen yayilir (komsu yoksa
 * bekler), sonra kucuk bir olasilikla yeni lanet dogar.
 */
export function tickNazar(curses: readonly Curse[], board: Board, rng: Rng): NazarTick {
  let next: Curse[] = [];
  let spread = 0;

  for (const curse of curses) {
    if (curse.turnsLeft > 1) {
      next.push({ ...curse, turnsLeft: curse.turnsLeft - 1 });
      continue;
    }
    const targets = cursable(
      board,
      [...curses, ...next],
      NEIGHBOURS.map((d) => ({ x: curse.x + d.x, y: curse.y + d.y })),
    );
    const target = pickOne(rng, targets);
    next.push({ ...curse, turnsLeft: NAZAR.SPREAD_TURNS });
    if (target !== undefined) {
      next.push({ ...target, turnsLeft: NAZAR.SPREAD_TURNS });
      spread += 1;
    }
  }

  let spawned = false;
  if (next.length < NAZAR.MAX_ACTIVE && rng() < NAZAR.SPAWN_CHANCE) {
    const target = pickOne(rng, cursable(board, next, allCells(board)));
    if (target !== undefined) {
      next = [...next, { ...target, turnsLeft: NAZAR.SPREAD_TURNS }];
      spawned = true;
    }
  }

  return { curses: next, spread, spawned };
}

/** Temizlenen cizgilerdeki lanetleri ayirir: kalanlar ve temizlenen sayisi. */
export function clearCurses(
  curses: readonly Curse[],
  lines: FullLines,
): { remaining: Curse[]; cleared: number } {
  const remaining = curses.filter((c) => !lines.rows.includes(c.y) && !lines.cols.includes(c.x));
  return { remaining, cleared: curses.length - remaining.length };
}

/** Hucresi bosalmis (marti, cay molasi) lanetleri dusurur. */
export function pruneCurses(curses: readonly Curse[], board: Board): Curse[] {
  return curses.filter((c) => isFilledCell(board[c.y]?.[c.x]));
}
