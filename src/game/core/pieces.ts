import { difficultyProgress } from './level';
import { pickWeighted, type Rng, type WeightedItem } from './rng';
import type { Piece, Shape } from './types';

import { PIECES, THEME, TRAY } from '@/constants/config';

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
  /** 1. seviyedeki cikma sikligi. Kolay parcalar burada agir basar. */
  readonly weight: number;
  /**
   * Tavan seviyedeki cikma sikligi. Aradaki degerler seviyeye gore
   * ara degerlenir; boylece zorluk oyun ilerledikce artar.
   */
  readonly hardWeight: number;
}

const SPECS: readonly ShapeSpec[] = [
  { id: 'dot', cells: [[0, 0]], weight: 6, hardWeight: 2 },
  {
    id: 'line-h2',
    cells: [
      [0, 0],
      [1, 0],
    ],
    weight: 8,
    hardWeight: 4,
  },
  {
    id: 'line-v2',
    cells: [
      [0, 0],
      [0, 1],
    ],
    weight: 8,
    hardWeight: 4,
  },
  {
    id: 'line-h3',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    weight: 6,
    hardWeight: 5,
  },
  {
    id: 'line-v3',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    weight: 6,
    hardWeight: 5,
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
    hardWeight: 5,
  },
  {
    id: 'corner',
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    weight: 5,
    hardWeight: 5,
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
    hardWeight: 5,
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
    hardWeight: 5,
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
    hardWeight: 5,
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
    hardWeight: 5,
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
    hardWeight: 4,
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
const ENTRIES = SPECS.map((spec) => ({
  shape: toShape(spec),
  weight: spec.weight,
  hardWeight: spec.hardWeight,
}));

/** Oyundaki tum parca sekilleri. */
export const SHAPES: readonly Shape[] = ENTRIES.map((entry) => entry.shape);

/**
 * Verilen seviyedeki agirlikli sekil listesi.
 *
 * Agirliklar kolay (1. seviye) ve zor (tavan) degerler arasinda ara
 * degerlenir; boylece zorluk kademeli artar, birden siçramaz.
 */
export function weightedShapesForLevel(level: number): readonly WeightedItem<Shape>[] {
  const t = difficultyProgress(level);

  return ENTRIES.map((entry) => ({
    value: entry.shape,
    weight: entry.weight + (entry.hardWeight - entry.weight) * t,
  }));
}

/**
 * Ilk tepside cikabilecek sekiller ("engineered luck").
 *
 * Block Blast oyunun ilk saniyelerinde bilerek rahat oturan parcalar verir;
 * oyuncu daha kurallari ogrenmeden "beceremiyorum" hissine kapilmasin. 5
 * hucreli "plus" ve kivrimli S/Z/L/T disarida; bos tahtada bile ilk izlenim
 * "kolay" olmali.
 */
export const STARTER_SHAPE_IDS: readonly string[] = [
  'dot',
  'line-h2',
  'line-v2',
  'line-h3',
  'line-v3',
  'square',
  'corner',
];

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
export function generatePieceSet(
  rng: Rng,
  count: number = TRAY.PIECE_COUNT,
  /**
   * Zorluk seviyesi. Agirliklar buna gore ara degerlenir.
   *
   * Daily modunda sabit bir seviye verilerek dizinin oyuncular arasinda
   * ayrismasi onlenebilir; Classic'te skordan turetilir.
   */
  level = 1,
): Piece[] {
  return generateFrom(rng, count, weightedShapesForLevel(level));
}

/** Ilk tepsi: yalnizca STARTER_SHAPE_IDS, 1. seviye agirliklariyla. */
export function generateStarterSet(rng: Rng, count: number = TRAY.PIECE_COUNT): Piece[] {
  const starters = weightedShapesForLevel(1).filter((item) =>
    STARTER_SHAPE_IDS.includes(item.value.id),
  );
  return generateFrom(rng, count, starters);
}

/**
 * Renk secimi: tek bir rng cagrisiyla hem "yapis" karari hem de renk.
 *
 * roll < STICKINESS ise onceki parcanin rengi alinir; degilse kalan aralik
 * [STICKINESS, 1) tum palete esit yayilir. Ayri bir rng cagrisi kullanmak
 * RNG_CALLS_PER_PIECE'i bozar ve tum kayitlari desenkronize ederdi.
 *
 * "Onceki" yalnizca AYNI tepsi icindeki parcadir; tepsinin ilk parcasi her
 * zaman bagimsizdir. Boylece tepsiler tek tek de toplu da uretilse ayni
 * sonuc cikar (kayit geri yukleme buna dayanir).
 */
function pickColor(roll: number, index: number, previous: number | undefined): number {
  const sticky = index % TRAY.PIECE_COUNT !== 0 && previous !== undefined;

  if (sticky && roll < PIECES.COLOR_STICKINESS) {
    return previous;
  }
  const uniform = sticky ? (roll - PIECES.COLOR_STICKINESS) / (1 - PIECES.COLOR_STICKINESS) : roll;
  return Math.min(THEME.PALETTE_SIZE - 1, Math.floor(uniform * THEME.PALETTE_SIZE));
}

function generateFrom(rng: Rng, count: number, weighted: readonly WeightedItem<Shape>[]): Piece[] {
  const pieces: Piece[] = [];

  for (let index = 0; index < count; index += 1) {
    const shape = pickWeighted(rng, weighted);
    const colorId = pickColor(rng(), index, pieces[index - 1]?.colorId);
    pieces.push({ shape, colorId });
  }

  return pieces;
}
