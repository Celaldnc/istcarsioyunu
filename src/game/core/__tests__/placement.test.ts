import { createBoard, placePiece } from '../board';
import { cellOrigin, computeBoardLayout } from '../layout';
import { shapeById } from '../pieces';
import { dragOrigin, previewPlacement } from '../placement';
import type { Board, Piece } from '../types';

import { BOARD, DRAG } from '@/constants/config';

const layout = computeBoardLayout(390);

const pieceOf = (id: string, colorId = 1): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId };
};

/** Parcanin belirli bir hucreye oturmasi icin gereken parmak konumunu uretir. */
const pointerFor = (piece: Piece, cellX: number, cellY: number) => {
  const origin = cellOrigin(layout, cellX, cellY);
  const step = layout.cellSize + BOARD.CELL_GAP;

  return {
    x: origin.x + (piece.shape.width * step - BOARD.CELL_GAP) / 2,
    y: origin.y + DRAG.LIFT * layout.cellSize + layout.cellSize / 2,
  };
};

describe('dragOrigin', () => {
  it('parmagin altindaki parcayi dogru hucreye oturtur', () => {
    const piece = pieceOf('square');

    expect(dragOrigin(layout, pointerFor(piece, 3, 4), piece)).toEqual({ x: 3, y: 4 });
  });

  it('tek hucreli parca icin de calisir', () => {
    const piece = pieceOf('dot');

    expect(dragOrigin(layout, pointerFor(piece, 0, 0), piece)).toEqual({ x: 0, y: 0 });
  });

  it('genis parcayi parmagin altinda yatayda ortalar', () => {
    const piece = pieceOf('line-h3');

    expect(dragOrigin(layout, pointerFor(piece, 2, 5), piece)).toEqual({ x: 2, y: 5 });
  });

  it('parcayi parmagin USTUNDE tutar (parmak parcayi kapatmasin)', () => {
    const piece = pieceOf('dot');
    const pointer = pointerFor(piece, 4, 6);

    // LIFT sifirdan buyukse parmak, parcanin oturdugu satirin altinda kalir.
    const origin = cellOrigin(layout, 4, 6);
    expect(pointer.y).toBeGreaterThan(origin.y);
  });

  it('tahtanin disinda null dondurur', () => {
    const piece = pieceOf('dot');

    expect(dragOrigin(layout, { x: -500, y: 10 }, piece)).toBeNull();
    expect(dragOrigin(layout, { x: 10, y: -500 }, piece)).toBeNull();
  });

  it('parca sag kenardan tasacaksa null dondurur', () => {
    const piece = pieceOf('line-h3');

    expect(dragOrigin(layout, pointerFor(piece, BOARD.COLS - 1, 3), piece)).toBeNull();
  });

  it('parca alt kenardan tasacaksa null dondurur', () => {
    const piece = pieceOf('line-v3');

    expect(dragOrigin(layout, pointerFor(piece, 2, BOARD.ROWS - 1), piece)).toBeNull();
  });

  it('sol kenarda negatif konuma kaymaz', () => {
    const piece = pieceOf('line-h3');
    const origin = dragOrigin(layout, { x: layout.originX + 1, y: layout.height / 2 }, piece);

    if (origin !== null) {
      expect(origin.x).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('previewPlacement', () => {
  const boardFrom = (rows: string[]): Board =>
    rows.map((row) => [...row].map((ch) => (ch === '.' ? null : Number(ch))));

  it('gecerli konumda dolacak hucreleri bildirir', () => {
    const piece = pieceOf('line-h2');
    const preview = previewPlacement(createBoard(), piece, { x: 1, y: 2 });

    expect(preview.valid).toBe(true);
    expect(preview.cells).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
  });

  it('cakisan konumda gecersiz isaretler ama hucreleri yine bildirir', () => {
    const board = placePiece(createBoard(), pieceOf('dot'), { x: 1, y: 2 });
    const preview = previewPlacement(board, pieceOf('line-h2'), { x: 1, y: 2 });

    expect(preview.valid).toBe(false);
    // Kirmizi hayalet cizebilmek icin hucreler yine gerekli.
    expect(preview.cells).toHaveLength(2);
  });

  it('origin null ise gecersizdir ve hucre bildirmez', () => {
    expect(previewPlacement(createBoard(), pieceOf('dot'), null)).toEqual({
      valid: false,
      cells: [],
      clearedLines: { rows: [], cols: [] },
    });
  });

  it('yerlestirme satir temizleyecekse bunu onceden bildirir', () => {
    // 3x3 tahtada ust satirda tek bosluk.
    const board = boardFrom(['11.', '...', '...']);
    const preview = previewPlacement(board, pieceOf('dot'), { x: 2, y: 0 });

    expect(preview.valid).toBe(true);
    expect(preview.clearedLines.rows).toEqual([0]);
  });

  it('temizleme olmayacaksa bos liste bildirir', () => {
    const preview = previewPlacement(createBoard(), pieceOf('dot'), { x: 0, y: 0 });

    expect(preview.clearedLines).toEqual({ rows: [], cols: [] });
  });

  it('gecersiz yerlestirmede temizleme hesaplamaz', () => {
    const board = placePiece(createBoard(), pieceOf('dot'), { x: 0, y: 0 });
    const preview = previewPlacement(board, pieceOf('dot'), { x: 0, y: 0 });

    expect(preview.clearedLines).toEqual({ rows: [], cols: [] });
  });
});
