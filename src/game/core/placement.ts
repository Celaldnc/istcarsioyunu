import { canPlace, findFullLines, placePiece } from './board';
import type { BoardLayout } from './layout';
import type { Board, FullLines, Piece, Point } from './types';

import { BOARD, DRAG } from '@/constants/config';

/**
 * Surukle-birak matematigi.
 *
 * Render katmanindan ayri tutuluyor: gesture olaylarini simule etmeden,
 * saf sayilarla test edilebiliyor. Sprint 3'teki DragLayer yalnizca bu
 * fonksiyonlarin ciktisini cizecek.
 */

const NO_LINES: FullLines = { rows: [], cols: [] };

export interface PlacementPreview {
  /** Parca buraya birakilirsa kabul edilir mi? */
  readonly valid: boolean;
  /** Parcanin kaplayacagi hucreler. Gecersiz konumda da doludur ki
   *  kirmizi hayalet cizilebilsin. */
  readonly cells: readonly Point[];
  /** Bu yerlestirme sonrasi temizlenecek satir/sutunlar (onizleme icin). */
  readonly clearedLines: FullLines;
}

/**
 * Parmagin ekran konumundan parcanin oturacagi hucreyi bulur.
 *
 * Parca yatayda parmagin ortasina hizalanir ve DRAG.LIFT kadar YUKARI
 * kaydirilir; aksi halde parmak tam da birakilacak alani kapatirdi.
 * En yakin hucreye yuvarlanir (floor degil), boylece hafif kaymalar
 * oyuncunun niyet ettigi hucreye oturur.
 */
export function dragOrigin(layout: BoardLayout, pointer: Point, piece: Piece): Point | null {
  const step = layout.cellSize + BOARD.CELL_GAP;
  const shapeWidth = piece.shape.width * step - BOARD.CELL_GAP;

  const pixelX = pointer.x - shapeWidth / 2;
  const pixelY = pointer.y - DRAG.LIFT * layout.cellSize - layout.cellSize / 2;

  const x = Math.round((pixelX - layout.originX) / step);
  const y = Math.round(pixelY / step);

  const fitsHorizontally = x >= 0 && x + piece.shape.width <= BOARD.COLS;
  const fitsVertically = y >= 0 && y + piece.shape.height <= BOARD.ROWS;

  return fitsHorizontally && fitsVertically ? { x, y } : null;
}

export function previewPlacement(
  board: Board,
  piece: Piece,
  origin: Point | null,
): PlacementPreview {
  if (origin === null) {
    return { valid: false, cells: [], clearedLines: NO_LINES };
  }

  const cells = piece.shape.cells.map((cell) => ({
    x: origin.x + cell.x,
    y: origin.y + cell.y,
  }));

  if (!canPlace(board, piece, origin)) {
    return { valid: false, cells, clearedLines: NO_LINES };
  }

  return {
    valid: true,
    cells,
    clearedLines: findFullLines(placePiece(board, piece, origin)),
  };
}
