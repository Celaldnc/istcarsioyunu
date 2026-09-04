import type { Board, Cell, FullLines, Piece, Point } from './types';

import { BOARD } from '@/constants/config';

/**
 * Tahta mekanigi. Tum fonksiyonlar saftir: girdi tahtasini asla degistirmez,
 * yeni bir tahta dondururler. Bu, Sprint 3'te geri alma/animasyon icin
 * onceki durumu elde tutmayi bedava hale getirir.
 */

/** Bir koordinati Set anahtarina cevirir. */
const key = (x: number, y: number): string => `${x},${y}`;

/**
 * Hucre dolu mu?
 *
 * DIKKAT: truthy kontrolu yapilamaz. Renk kimligi 0 gecerli bir degerdir ve
 * falsy oldugu icin "bos" saniliridi.
 */
const isFilled = (cell: Cell | undefined): boolean => cell !== null && cell !== undefined;

export function createBoard(cols: number = BOARD.COLS, rows: number = BOARD.ROWS): Board {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}

export function boardWidth(board: Board): number {
  return board[0]?.length ?? 0;
}

export function boardHeight(board: Board): number {
  return board.length;
}

export function isInside(board: Board, x: number, y: number): boolean {
  return getCell(board, x, y) !== undefined;
}

/**
 * Hucre degerini dondurur.
 *
 * Donus tipindeki undefined "tahta disi", null ise "bos hucre" demektir.
 * Ikisini ayirmak canPlace'i tek satira indiriyor; karistirmak ise parcanin
 * tahtadan tasmasina izin verir.
 */
export function getCell(board: Board, x: number, y: number): Cell | undefined {
  return board[y]?.[x];
}

/**
 * Parca verilen konuma sigiyor mu?
 *
 * Tek kural: parcanin her hucresi tahtanin ICINDE ve BOS olmali.
 * getCell tahta disi icin undefined, dolu icin sayi dondurdugunden
 * "=== null" her iki ihlali de ayni anda yakalar.
 */
export function canPlace(board: Board, piece: Piece, origin: Point): boolean {
  return piece.shape.cells.every(
    (cell) => getCell(board, origin.x + cell.x, origin.y + cell.y) === null,
  );
}

export function placePiece(board: Board, piece: Piece, origin: Point): Board {
  if (!canPlace(board, piece, origin)) {
    throw new Error(
      `Parca "${piece.shape.id}" (${origin.x},${origin.y}) konumuna yerlestirilemez.`,
    );
  }

  const painted = new Set(piece.shape.cells.map((c) => key(origin.x + c.x, origin.y + c.y)));

  return board.map((row, y) =>
    row.map((cell, x) => (painted.has(key(x, y)) ? piece.colorId : cell)),
  );
}

/** Tam dolu satir ve sutunlarin indekslerini bulur. */
export function findFullLines(board: Board): FullLines {
  const rows = board.flatMap((row, y) => (row.every(isFilled) ? [y] : []));

  const cols = Array.from({ length: boardWidth(board) }, (_, x) => x).filter((x) =>
    board.every((row) => isFilled(row[x])),
  );

  return { rows, cols };
}

/** Verilen satir ve sutunlari bosaltir. Kesisim hucreleri bir kez temizlenir. */
export function applyClears(board: Board, lines: FullLines): Board {
  if (lines.rows.length === 0 && lines.cols.length === 0) {
    return board;
  }

  const clearedRows = new Set(lines.rows);
  const clearedCols = new Set(lines.cols);

  return board.map((row, y) =>
    row.map((cell, x) => (clearedRows.has(y) || clearedCols.has(x) ? null : cell)),
  );
}

export function countFilledCells(board: Board): number {
  return board.reduce((total, row) => total + row.filter(isFilled).length, 0);
}

export function isBoardEmpty(board: Board): boolean {
  return countFilledCells(board) === 0;
}

/**
 * Verilen parcalardan en az biri tahtaya sigiyor mu?
 *
 * Arama alani parcanin kapladigi kutu kadar daraltilir; 8x10 tahtada
 * en kotu durumda ~80 x parca sayisi kontrol demektir, oyun dongusu icin
 * fazlasiyla ucuz.
 */
export function isGameOver(board: Board, pieces: readonly Piece[]): boolean {
  return !hasAnyValidPlacement(board, pieces);
}

export function hasAnyValidPlacement(board: Board, pieces: readonly Piece[]): boolean {
  const width = boardWidth(board);
  const height = boardHeight(board);

  return pieces.some((piece) => {
    for (let y = 0; y <= height - piece.shape.height; y += 1) {
      for (let x = 0; x <= width - piece.shape.width; x += 1) {
        if (canPlace(board, piece, { x, y })) {
          return true;
        }
      }
    }
    return false;
  });
}
