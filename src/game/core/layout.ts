import type { Point } from './types';

import { BOARD, LAYOUT, PIECES, TRAY } from '@/constants/config';

/**
 * Tahtanin piksel yerlesimi.
 *
 * Neden saf bir modul: hucre boyutu ekran genisliginden TURETILIR, sabit
 * degildir. Sabit 40dp yanlisti; 8 * 40 + 7 * 2 = 334dp, 320dp genisligindeki
 * cihazlarda tasar. Hesabi core'da tutmak, dokunma noktasini hucreye
 * cevirmeyi (Sprint 3) render calistirmadan test edilebilir kiliyor.
 */

export interface BoardLayout {
  /** Tek hucrenin kenari (piksel, tamsayi) */
  readonly cellSize: number;
  /** Tahtanin toplam genisligi */
  readonly width: number;
  /** Tahtanin toplam yuksekligi */
  readonly height: number;
  /** Tahtanin sol kenarinin ekrandaki x konumu (ortalanmis) */
  readonly originX: number;
}

const step = (cellSize: number): number => cellSize + BOARD.CELL_GAP;

export function computeBoardLayout(
  availableWidth: number,
  /**
   * Tahtaya ayrilan dikey alan. Verilmezse yalnizca genislik sinirlar.
   *
   * 10 satirli bir tahtada BAGLAYICI KISIT genelde yuksekliktir: 390dp
   * genislikte hucre 40dp cikar ve tahta 418dp yer kaplar; skor satiri,
   * tepsi, header ve tab bar eklenince tipik bir telefonda tasar. Tasma
   * ScrollView olmadigi icin kirpilir ve kirpilan uclardan biri TEPSI,
   * yani tek etkilesimli ogedir.
   */
  availableHeight: number = Number.POSITIVE_INFINITY,
  cols: number = BOARD.COLS,
  rows: number = BOARD.ROWS,
): BoardLayout {
  const usable = availableWidth - BOARD.SCREEN_MARGIN * 2;
  const totalGap = BOARD.CELL_GAP * (cols - 1);

  // Tamsayiya yuvarlanir: yarim piksel kenarlar Skia'da bulanik cizgi yapar.
  const fromWidth = Math.floor((usable - totalGap) / cols);
  const fromHeight = Math.floor((availableHeight - BOARD.CELL_GAP * (rows - 1)) / rows);

  // Asiri dar/alcak ekranda bile pozitif kalmali; aksi halde tahta hic cizilmez.
  const cellSize = Math.max(1, Math.min(BOARD.MAX_CELL_SIZE, fromWidth, fromHeight));

  const width = cellSize * cols + totalGap;
  const height = cellSize * rows + BOARD.CELL_GAP * (rows - 1);

  return {
    cellSize,
    width,
    height,
    originX: Math.round((availableWidth - width) / 2),
  };
}

/** Bir hucrenin sol ust kosesinin piksel konumu. */
export function cellOrigin(layout: BoardLayout, cellX: number, cellY: number): Point {
  return {
    x: layout.originX + cellX * step(layout.cellSize),
    y: cellY * step(layout.cellSize),
  };
}

/**
 * Piksel noktasini hucre koordinatina cevirir; tahta disinda null.
 *
 * Sprint 3'te surukle-birak bunun uzerine kurulacak.
 */
export function pointToCell(
  layout: BoardLayout,
  point: Point,
  cols: number = BOARD.COLS,
  rows: number = BOARD.ROWS,
): Point | null {
  const localX = point.x - layout.originX;
  if (localX < 0 || localX >= layout.width || point.y < 0 || point.y >= layout.height) {
    return null;
  }

  const x = Math.floor(localX / step(layout.cellSize));
  const y = Math.floor(point.y / step(layout.cellSize));

  return x >= 0 && x < cols && y >= 0 && y < rows ? { x, y } : null;
}

/** Verilen alanda LAYOUT.MIN_PLAYABLE_CELL_SIZE saglaniyor mu? */
export function isPlayableSize(
  availableWidth: number,
  availableHeight: number = Number.POSITIVE_INFINITY,
): boolean {
  return (
    computeBoardLayout(availableWidth, availableHeight).cellSize >= LAYOUT.MIN_PLAYABLE_CELL_SIZE
  );
}

export interface TrayLayout {
  /** Onizleme hucresinin kenari */
  readonly cellSize: number;
  /** Tek bir parca yuvasinin genisligi */
  readonly slotWidth: number;
  /** Tepsinin toplam yuksekligi */
  readonly height: number;
}

/**
 * Tepsi yerlesimi.
 *
 * Her yuva, en genis parcayi (PIECES.MAX_SPAN) tasiyabilecek kadar genis
 * olmali; aksi halde "plus" gibi 3x3 parcalar kirpilirdi. Hucre boyutu
 * tahtadakinden kucuktur, bu bilincli: tepsi onizlemedir, oyun alani degil.
 */
export function computeTrayLayout(
  availableWidth: number,
  slots: number = TRAY.PIECE_COUNT,
  maxSpan: number = PIECES.MAX_SPAN,
): TrayLayout {
  const usable = availableWidth - BOARD.SCREEN_MARGIN * 2 - TRAY.SLOT_GAP * (slots - 1);
  const slotWidth = Math.max(1, Math.floor(usable / slots));

  const innerGap = TRAY.CELL_GAP * (maxSpan - 1);
  const fitted = Math.floor((slotWidth - innerGap) / maxSpan);
  const cellSize = Math.max(1, Math.min(TRAY.MAX_CELL_SIZE, fitted));

  return {
    cellSize,
    slotWidth,
    height: cellSize * maxSpan + innerGap,
  };
}

/** Bir parcanin onizlemedeki piksel olculeri. */
export function pieceSize(
  cellSize: number,
  width: number,
  height: number,
  gap: number = TRAY.CELL_GAP,
): { readonly width: number; readonly height: number } {
  return {
    width: cellSize * width + gap * (width - 1),
    height: cellSize * height + gap * (height - 1),
  };
}

/**
 * Tepsi satirindaki bir x koordinatinin hangi yuvaya dustugunu bulur.
 *
 * PieceTray satiri ortalanmis bir flex row; sol kenari bu yuzden
 * hesaplanarak bulunuyor. Yuvalar arasindaki bosluga denk gelen dokunuslar
 * null doner (yanlis parcayi surukleme kazasi olmasin).
 */
export function traySlotAt(
  tray: TrayLayout,
  availableWidth: number,
  x: number,
  slots: number = TRAY.PIECE_COUNT,
): number | null {
  const rowWidth = tray.slotWidth * slots + TRAY.SLOT_GAP * (slots - 1);
  const local = x - (availableWidth - rowWidth) / 2;

  if (local < 0 || local >= rowWidth) {
    return null;
  }

  const step = tray.slotWidth + TRAY.SLOT_GAP;
  const index = Math.floor(local / step);

  // Yuvanin sonundan sonraki bosluk bandi
  return local - index * step < tray.slotWidth ? index : null;
}
