import type { GameRules } from './rules';

import { BOARD } from '@/constants/config';

/**
 * Yolculuk seviyeleri — KURALA etki eden kisim.
 *
 * Adlar, aciklamalar ve kartpostal gorselleri data/journey.ts'te; burada
 * yalnizca oyun mantiginin ihtiyac duydugu sey var: maske, kural ustune
 * yazmalari, hedef. Kayit geri yuklenirken levelId'den bunlar turetilir.
 */

export type Objective =
  | { readonly kind: 'score'; readonly target: number }
  | { readonly kind: 'lines'; readonly target: number }
  | { readonly kind: 'cini'; readonly target: number }
  | { readonly kind: 'synergy'; readonly target: number }
  | { readonly kind: 'bridge'; readonly target: number };

export interface LevelSpec {
  readonly id: string;
  /** '#' tahta disi. Verilmezse duz 8x10. */
  readonly mask?: readonly string[];
  readonly overrides?: Partial<GameRules>;
  readonly objective: Objective;
}

const R = BOARD.ROWS;
const C = BOARD.COLS;

/** Duz dolgu satiri. */
const open = '.'.repeat(C);

/** Galata Kulesi silueti: tepede dar, asagida genis. */
const GALATA: readonly string[] = [
  '###..###',
  '###..###',
  '##....##',
  '##....##',
  '#......#',
  ...Array.from({ length: R - 5 }, () => open),
];

/** Kiz Kulesi: ortada ada, iki yani deniz; alt kisim rihtim. */
const KIZ_KULESI: readonly string[] = [
  '#..####.',
  '#..####.',
  '#......#',
  '#......#',
  ...Array.from({ length: R - 4 }, () => open),
];

/** Bogaz: ortada su seridi; iki yaka. Satir tamamlamak = kopru. */
const BOGAZ: readonly string[] = Array.from({ length: R }, () => '...##...');

export const LEVELS: readonly LevelSpec[] = [
  { id: 'eminonu', objective: { kind: 'score', target: 300 } },
  {
    id: 'misir-carsisi',
    objective: { kind: 'synergy', target: 3 },
    overrides: { synergies: true },
  },
  { id: 'kapalicarsi', objective: { kind: 'cini', target: 3 }, overrides: { synergies: true } },
  { id: 'galata', mask: GALATA, objective: { kind: 'lines', target: 12 } },
  {
    id: 'bogaz',
    mask: BOGAZ,
    objective: { kind: 'bridge', target: 4 },
    overrides: { bridge: true },
  },
  {
    id: 'kiz-kulesi',
    mask: KIZ_KULESI,
    objective: { kind: 'score', target: 900 },
    overrides: { gull: true, gullEvery: 8 },
  },
  {
    id: 'kadikoy',
    objective: { kind: 'lines', target: 25 },
    overrides: { cat: true, nazar: true, synergies: true },
  },
];

const INDEX = new Map(LEVELS.map((level) => [level.id, level]));

export function levelById(id: string | null | undefined): LevelSpec | undefined {
  return id === null || id === undefined ? undefined : INDEX.get(id);
}

/** Bir sonraki seviye; sonuncudaysa undefined. */
export function nextLevelId(id: string): string | undefined {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index === -1 ? undefined : LEVELS[index + 1]?.id;
}
