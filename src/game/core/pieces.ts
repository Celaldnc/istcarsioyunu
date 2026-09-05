import { pickWeighted, type Rng, type WeightedItem } from './rng';
import type { Piece, Shape } from './types';

import { THEME, TRAY } from '@/constants/config';

/**
 * Parca katalogu ve uretici.
 *
 * Sekiller donme (rotation) icermez; Block Blast standardinda oyuncu parcayi
 * dondurmez, gelen parcayla idare eder. Bu yuzden yatay/dikey varyantlar ayri
 * sekil olarak tanimlanir.
 */

interface ShapeSpec {
  readonly id: string;
  /** Dolu hucrelerin [x, y] koordinatlari. (0,0) baz alinir. */
  readonly cells: readonly (readonly [number, number])[];
  /** Goreli cikma sikligi. Kucuk parcalar daha sik gelir ki oyun tikanmasin. */
  readonly weight: number;
}

const SPECS: readonly ShapeSpec[] = [
  { id: 'dot', cells: [[0, 0]], weight: 6 },
  {
    id: 'line-h2',
    cells: [
      [0, 0],
      [1, 0],
    ],
    weight: 8,
  },
  {
    id: 'line-v2',
    cells: [
      [0, 0],
      [0, 1],
    ],
    weight: 8,
  },
  {
    id: 'line-h3',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    weight: 6,
  },
  {
    id: 'line-v3',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    weight: 6,
  },
  {
    id: 'square',
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    weight: 6,
  },
  {
    id: 'corner',
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    weight: 5,
  },
  {
    id: 'l',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
    weight: 4,
  },
  {
    id: 't',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ],
    weight: 4,
  },
  {
    id: 's',
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    weight: 3,
  },
  {
    id: 'z',
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    weight: 3,
  },
  {
    id: 'plus',
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    // Simulasyonda (3000 oyun) olumlerin ~%48'i elde kalan "plus" yuzunden
    // oluyordu; cikma olasiligi %3.4 olmasina ragmen. 3x3 pencerede 5 belirli
    // hucre isteyen tek sekil bu. Agirlik 2 -> 1.
    weight: 1,
  },
];

function toShape(spec: ShapeSpec): Shape {
  const cells = spec.cells.map(([x, y]) => ({ x, y }));

  return {
    id: spec.id,
    cells,
    width: Math.max(...cells.map((c) => c.x)) + 1,
    height: Math.max(...cells.map((c) => c.y)) + 1,
  };
}

// Sekiller bir kez uretilir; hem katalog hem agirlikli liste ayni nesneleri
// paylasir (indeksle eslestirmek tip iddiasi gerektirirdi).
const ENTRIES = SPECS.map((spec) => ({ shape: toShape(spec), weight: spec.weight }));

/** Oyundaki tum parca sekilleri. */
export const SHAPES: readonly Shape[] = ENTRIES.map((entry) => entry.shape);

const WEIGHTED_SHAPES: readonly WeightedItem<Shape>[] = ENTRIES.map((entry) => ({
  value: entry.shape,
  weight: entry.weight,
}));

const SHAPE_INDEX = new Map(SHAPES.map((shape) => [shape.id, shape]));

export function shapeById(id: string): Shape | undefined {
  return SHAPE_INDEX.get(id);
}

/**
 * Bir parca uretmek icin harcanan rng cagrisi sayisi (sekil + renk).
 * rng.advance ile ileri sararken bu sabit gerekiyor.
 */
export const RNG_CALLS_PER_PIECE = 2;

/**
 * Tepsi icin parca uretir.
 *
 * Ayni rng ayni diziyi verdigi icin Daily modunda tum oyuncular ayni
 * parcalari alir.
 */
export function generatePieceSet(rng: Rng, count: number = TRAY.PIECE_COUNT): Piece[] {
  return Array.from({ length: count }, () => ({
    shape: pickWeighted(rng, WEIGHTED_SHAPES),
    colorId: Math.floor(rng() * THEME.PALETTE_SIZE),
  }));
}
