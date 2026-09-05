import { OFF_CELL, isFilledCell, isOffCell } from './types';
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
 * falsy oldugu icin "bos" saniliridi. Tahta disi (OFF_CELL) dolu SAYILMAZ.
 */
const isFilled = isFilledCell;

export function createBoard(cols: number = BOARD.COLS, rows: number = BOARD.ROWS): Board {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
}

/**
 * Metin maskesinden sekilli tahta: '#' tahta disi, diger her karakter bos
 * hucre. Satir sayisi ve genislik BOARD ile ayni olmak zorunda; aksi halde
 * layout/placement hesaplari sapar.
 */
export function createBoardFromMask(mask: readonly string[]): Board {
  if (mask.length !== BOARD.ROWS || mask.some((row) => row.length !== BOARD.COLS)) {
    throw new Error(`Maske ${BOARD.COLS}x${BOARD.ROWS} olmali.`);
  }
  return mask.map((row) => [...row].map((ch) => (ch === '#' ? OFF_CELL : null)));
}

/** Oynanabilir (tahta ici) hucre sayisi. */
export function countPlayableCells(board: Board): number {
  return board.reduce((total, row) => total + row.filter((cell) => !isOffCell(cell)).length, 0);
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

/**
 * Cizgi "tam" mi: bos hucre yok VE en az bir dolu hucre var.
 * Tamamen tahta disi bir cizgi (sekilli tahtada su seridi) tam sayilmaz;
 * aksi halde her hamlede "temizlenir" ve puan verirdi.
 */
const isLineFull = (cells: readonly (Cell | undefined)[]): boolean =>
  cells.every((cell) => cell !== null && cell !== undefined) && cells.some(isFilled);

/** Tam dolu satir ve sutunlarin indekslerini bulur. */
export function findFullLines(board: Board): FullLines {
  const rows = board.flatMap((row, y) => (isLineFull(row) ? [y] : []));

  const cols = Array.from({ length: boardWidth(board) }, (_, x) => x).filter((x) =>
    isLineFull(board.map((row) => row[x])),
  );

  return { rows, cols };
}

/** Dizideki tum DOLU hucreler ayni renkte mi? (tahta disi hucreler sayilmaz) */
const isMonochrome = (cells: readonly (Cell | undefined)[]): boolean => {
  const filled = cells.filter(isFilled);
  const first = filled[0];
  return first !== undefined && filled.every((cell) => cell === first);
};

/**
 * Verilen dolu cizgilerden TEK RENKLI olanlari ("Cini") suzer.
 *
 * Temizlemeden ONCEKI tahta uzerinde cagrilmali; temizleme sonrasi
 * hucreler bosalir ve renk bilgisi kaybolur. Kendi basina dolu cizgi
 * aramaz: findFullLines'in sonucunu alir ki ayni is iki kez yapilmasin.
 */
export function monochromeLines(board: Board, lines: FullLines): FullLines {
  return {
    rows: lines.rows.filter((y) => isMonochrome(board[y] ?? [])),
    cols: lines.cols.filter((x) => isMonochrome(board.map((row) => row[x]))),
  };
}

/** Verilen satir ve sutunlari bosaltir. Kesisim hucreleri bir kez temizlenir. */
export function applyClears(board: Board, lines: FullLines): Board {
  if (lines.rows.length === 0 && lines.cols.length === 0) {
    return board;
  }

  const clearedRows = new Set(lines.rows);
  const clearedCols = new Set(lines.cols);

  // Tahta disi hucreler temizlemeden etkilenmez; yalnizca dolu hucre bosalir.
  return board.map((row, y) =>
    row.map((cell, x) =>
      (clearedRows.has(y) || clearedCols.has(x)) && isFilled(cell) ? null : cell,
    ),
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
