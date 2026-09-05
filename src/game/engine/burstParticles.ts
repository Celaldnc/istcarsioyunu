import { BOARD, FX, THEME } from '@/constants/config';
import { cellOrigin, type BoardLayout } from '@/game/core/layout';
import { createRng } from '@/game/core/rng';
import type { FullLines, Point } from '@/game/core/types';

/**
 * Temizleme patlamasinin parcacik matematigi — SAF.
 *
 * Render katmani (ClearBurst) yalnizca bu listeyi cizer ve `progress`
 * (0..1) ile ilerletir. Matematigi ayri tutmak, parcacik sayisi/hiz/boyut
 * kurallarini Skia veya Reanimated calistirmadan test etmeyi saglar.
 */

export interface Particle {
  /** Baslangic konumu (tahta pikseli). */
  readonly x: number;
  readonly y: number;
  /** progress = 1 anindaki toplam yer degistirme (piksel). */
  readonly dx: number;
  readonly dy: number;
  /** Yaricap (piksel). */
  readonly size: number;
  /** Tema paletinden renk kimligi ("cini kiriklari" rengarenk olsun). */
  readonly colorId: number;
}

/** Temizlenen satir ve sutunlarin kapladigi hucreler (kesisim bir kez). */
export function clearedCells(lines: FullLines): Point[] {
  const seen = new Set<string>();
  const cells: Point[] = [];
  const push = (x: number, y: number) => {
    const key = `${x},${y}`;
    if (!seen.has(key)) {
      seen.add(key);
      cells.push({ x, y });
    }
  };

  for (const y of lines.rows) {
    for (let x = 0; x < BOARD.COLS; x += 1) {
      push(x, y);
    }
  }
  for (const x of lines.cols) {
    for (let y = 0; y < BOARD.ROWS; y += 1) {
      push(x, y);
    }
  }
  return cells;
}

/**
 * Parcaciklari uretir. Ayni seed ayni patlamayi verir (testler ve UI'da
 * yeniden render kararliligi icin).
 */
export function burstParticles(lines: FullLines, layout: BoardLayout, seed: number): Particle[] {
  const cells = clearedCells(lines);
  if (cells.length === 0) {
    return [];
  }

  const rng = createRng(seed);
  const wanted = cells.length * FX.PARTICLES_PER_CELL;
  const total = Math.min(wanted, FX.MAX_PARTICLES);
  // Tavan asilirsa hucreler esit aralikla ornekleniyor ki patlama tum
  // cizgiye yayilsin, yalnizca basina yigilmasin.
  const step = wanted / total;
  const half = layout.cellSize / 2;

  return Array.from({ length: total }, (_, i) => {
    const cell = cells[Math.floor((i * step) / FX.PARTICLES_PER_CELL)] ?? cells[0];
    const origin = cellOrigin(layout, cell?.x ?? 0, cell?.y ?? 0);
    const angle = rng() * Math.PI * 2;
    // Hiz hucre boyutuna orantili: kucuk ekranda da buyukte de ayni "his".
    const distance = layout.cellSize * (1.5 + rng() * 2);

    return {
      x: origin.x + half,
      y: origin.y + half,
      dx: Math.cos(angle) * distance,
      // Hafif yukari egilim + yercekimi izlenimi: asagi dusen parcalar
      // yukari ucanlardan biraz daha uzaga gider.
      dy: Math.sin(angle) * distance + layout.cellSize * 0.6,
      size: layout.cellSize * (0.16 + rng() * 0.16),
      colorId: Math.floor(rng() * THEME.PALETTE_SIZE),
    };
  });
}
