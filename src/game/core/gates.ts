import type { FullLines } from './types';

import { BOARD } from '@/constants/config';

/**
 * Kapalicarsi kapilari: tahtanin dort kenari birer kapidir. Kenar cizgisi
 * temizlenince o kapinin feneri yanar. Dordu birden yandiginda "Carsi
 * Senligi": birkac hamle boyunca puan katlanir, fenerler soner.
 *
 * Orta vadeli bir hedef: oyuncu yalnizca "en yakin cizgiyi" degil, kenarlari
 * da planlamaya baslar.
 */

export const GATE = {
  TOP: 1,
  BOTTOM: 2,
  LEFT: 4,
  RIGHT: 8,
} as const;

export const ALL_GATES = GATE.TOP | GATE.BOTTOM | GATE.LEFT | GATE.RIGHT;

/** Temizlenen cizgilerin yaktigi kapilar (bit maskesi). */
export function gatesLitBy(lines: FullLines): number {
  let mask = 0;
  for (const y of lines.rows) {
    if (y === 0) {
      mask |= GATE.TOP;
    }
    if (y === BOARD.ROWS - 1) {
      mask |= GATE.BOTTOM;
    }
  }
  for (const x of lines.cols) {
    if (x === 0) {
      mask |= GATE.LEFT;
    }
    if (x === BOARD.COLS - 1) {
      mask |= GATE.RIGHT;
    }
  }
  return mask;
}

export function isGateLit(gates: number, gate: number): boolean {
  return (gates & gate) !== 0;
}

export function litGateCount(gates: number): number {
  return [GATE.TOP, GATE.BOTTOM, GATE.LEFT, GATE.RIGHT].filter((g) => isGateLit(gates, g)).length;
}
