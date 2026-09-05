import { isFilledCell } from './types';
import type { Board, FullLines, Point } from './types';

import { BOARD, ROLES } from '@/constants/config';

/**
 * Esya sinerjileri: temizlenen cizgilerde YAN YANA duran esya ciftleri bonus
 * verir. Simit + cay = "Kahvalti", lokum + fistik = "Fistikli lokum".
 * Renk boylece yalnizca Cini icin degil, kombinasyon icin de onemli olur.
 */

export type SynergyKind = 'kahvalti' | 'fistikliLokum';

interface SynergyDef {
  readonly kind: SynergyKind;
  readonly a: number;
  readonly b: number;
}

const SYNERGIES: readonly SynergyDef[] = [
  { kind: 'kahvalti', a: ROLES.SIMIT, b: ROLES.CAY },
  { kind: 'fistikliLokum', a: ROLES.LOKUM, b: ROLES.FISTIK },
];

function clearedSet(lines: FullLines): Set<string> {
  const set = new Set<string>();
  for (const y of lines.rows) {
    for (let x = 0; x < BOARD.COLS; x += 1) {
      set.add(`${x},${y}`);
    }
  }
  for (const x of lines.cols) {
    for (let y = 0; y < BOARD.ROWS; y += 1) {
      set.add(`${x},${y}`);
    }
  }
  return set;
}

function pairKind(a: number, b: number): SynergyKind | null {
  const def = SYNERGIES.find((s) => (s.a === a && s.b === b) || (s.a === b && s.b === a));
  return def?.kind ?? null;
}

/**
 * Temizlenen hucreler arasindaki sinerji ciftlerini sayar (yatay + dikey
 * komsuluk; her cift bir kez). Temizlemeden ONCEKI tahta verilmeli.
 */
export function countSynergies(board: Board, lines: FullLines): Record<SynergyKind, number> {
  const cleared = clearedSet(lines);
  const counts: Record<SynergyKind, number> = { kahvalti: 0, fistikliLokum: 0 };
  const steps: readonly Point[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];

  for (const key of cleared) {
    const [xs, ys] = key.split(',');
    const x = Number(xs);
    const y = Number(ys);
    const cell = board[y]?.[x];
    if (!isFilledCell(cell)) {
      continue;
    }
    for (const step of steps) {
      const nx = x + step.x;
      const ny = y + step.y;
      if (!cleared.has(`${nx},${ny}`)) {
        continue;
      }
      const other = board[ny]?.[nx];
      if (!isFilledCell(other)) {
        continue;
      }
      const kind = pairKind(cell, other);
      if (kind !== null) {
        counts[kind] += 1;
      }
    }
  }
  return counts;
}
