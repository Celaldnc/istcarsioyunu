import {
  applyClears,
  canPlace,
  countFilledCells,
  createBoard,
  findFullLines,
  getCell,
  hasAnyValidPlacement,
  isBoardEmpty,
  isInside,
  placePiece,
} from '../board';
import type { Board, Piece, Shape } from '../types';

import { BOARD } from '@/constants/config';

// --- test yardimcilari ---------------------------------------------------

const shape = (id: string, cells: [number, number][]): Shape => ({
  id,
  cells: cells.map(([x, y]) => ({ x, y })),
  width: Math.max(...cells.map(([x]) => x)) + 1,
  height: Math.max(...cells.map(([, y]) => y)) + 1,
});

const SINGLE = shape('single', [[0, 0]]);
const HORIZONTAL_2 = shape('h2', [
  [0, 0],
  [1, 0],
]);
const VERTICAL_2 = shape('v2', [
  [0, 0],
  [0, 1],
]);
const SQUARE_2X2 = shape('sq2', [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
]);

const piece = (s: Shape, colorId = 1): Piece => ({ shape: s, colorId });

/** Metin haritasindan tahta kurar: nokta bos, rakam renk kimligidir. */
const boardFrom = (rows: string[]): Board =>
  rows.map((row) => [...row].map((ch) => (ch === '.' ? null : Number(ch))));

// --- createBoard ---------------------------------------------------------

describe('createBoard', () => {
  it('varsayilan olarak config.ts olculerinde bos tahta uretir', () => {
    const board = createBoard();

    expect(board).toHaveLength(BOARD.ROWS);
    expect(board[0]).toHaveLength(BOARD.COLS);
    expect(isBoardEmpty(board)).toBe(true);
  });

  it('istenen olculerde tahta uretir', () => {
    const board = createBoard(3, 2);

    expect(board).toHaveLength(2);
    expect(board[0]).toHaveLength(3);
  });

  it('satirlari paylasmaz; bir satiri degistirmek digerini etkilemez', () => {
    const board = createBoard(2, 2);

    expect(board[0]).not.toBe(board[1]);
  });
});

// --- isInside / getCell --------------------------------------------------

describe('isInside', () => {
  const board = createBoard(3, 2);

  it.each([
    [0, 0, true],
    [2, 1, true],
    [-1, 0, false],
    [0, -1, false],
    [3, 0, false],
    [0, 2, false],
  ])('(%i,%i) -> %s', (x, y, expected) => {
    expect(isInside(board, x, y)).toBe(expected);
  });
});

describe('getCell', () => {
  const board = boardFrom(['.1.', '..2']);

  it('tahtadaki degeri dondurur', () => {
    expect(getCell(board, 1, 0)).toBe(1);
    expect(getCell(board, 2, 1)).toBe(2);
    expect(getCell(board, 0, 0)).toBeNull();
  });

  it('tahta disinda undefined dondurur (null ile karistirilmamali)', () => {
    expect(getCell(board, -1, 0)).toBeUndefined();
    expect(getCell(board, 3, 0)).toBeUndefined();
    expect(getCell(board, 0, 2)).toBeUndefined();
  });
});

// --- canPlace ------------------------------------------------------------

describe('canPlace', () => {
  it('bos tahtada sol ust koseye yerlestirilebilir', () => {
    expect(canPlace(createBoard(3, 3), piece(SQUARE_2X2), { x: 0, y: 0 })).toBe(true);
  });

  it('tam sigan son konuma yerlestirilebilir (sinir durumu)', () => {
    expect(canPlace(createBoard(3, 3), piece(SQUARE_2X2), { x: 1, y: 1 })).toBe(true);
  });

  it('sag kenardan tasarsa reddeder', () => {
    expect(canPlace(createBoard(3, 3), piece(SQUARE_2X2), { x: 2, y: 0 })).toBe(false);
  });

  it('alt kenardan tasarsa reddeder', () => {
    expect(canPlace(createBoard(3, 3), piece(SQUARE_2X2), { x: 0, y: 2 })).toBe(false);
  });

  it('negatif koordinati reddeder', () => {
    expect(canPlace(createBoard(3, 3), piece(SINGLE), { x: -1, y: 0 })).toBe(false);
    expect(canPlace(createBoard(3, 3), piece(SINGLE), { x: 0, y: -1 })).toBe(false);
  });

  it('dolu hucrenin ustune yerlestirmeyi reddeder', () => {
    const board = boardFrom(['1..', '...', '...']);

    expect(canPlace(board, piece(SINGLE), { x: 0, y: 0 })).toBe(false);
    expect(canPlace(board, piece(SINGLE), { x: 1, y: 0 })).toBe(true);
  });

  it('parcanin yalnizca bir hucresi cakissa bile reddeder', () => {
    const board = boardFrom(['...', '...', '..1']);

    expect(canPlace(board, piece(SQUARE_2X2), { x: 1, y: 1 })).toBe(false);
  });

  it('tamamen dolu tahtada hicbir parcayi kabul etmez', () => {
    const board = boardFrom(['111', '111', '111']);

    expect(canPlace(board, piece(SINGLE), { x: 0, y: 0 })).toBe(false);
  });
});

// --- placePiece ----------------------------------------------------------

describe('placePiece', () => {
  it('parcanin hucrelerini kendi rengiyle doldurur', () => {
    const board = placePiece(createBoard(3, 3), piece(HORIZONTAL_2, 7), { x: 1, y: 2 });

    expect(getCell(board, 1, 2)).toBe(7);
    expect(getCell(board, 2, 2)).toBe(7);
    expect(countFilledCells(board)).toBe(2);
  });

  it('girdi tahtasini degistirmez (saf fonksiyon)', () => {
    const before = createBoard(3, 3);

    placePiece(before, piece(SINGLE), { x: 0, y: 0 });

    expect(isBoardEmpty(before)).toBe(true);
  });

  it('gecersiz yerlestirmede hata firlatir', () => {
    const board = boardFrom(['1..', '...', '...']);

    expect(() => placePiece(board, piece(SINGLE), { x: 0, y: 0 })).toThrow(/yerlestirilemez/i);
  });
});

// --- findFullLines -------------------------------------------------------

describe('findFullLines', () => {
  it('bos tahtada hicbir sey bulmaz', () => {
    expect(findFullLines(createBoard(3, 3))).toEqual({ rows: [], cols: [] });
  });

  it('tam dolu satiri bulur (eksik hucreli sutunu saymadan)', () => {
    // 0. sutunun son hucresi bos, yani yalnizca satir doludur.
    expect(findFullLines(boardFrom(['111', '1..', '...']))).toEqual({ rows: [0], cols: [] });
  });

  it('bos dizi verilirse genislik 0 kabul edilir', () => {
    expect(findFullLines([])).toEqual({ rows: [], cols: [] });
  });

  it('tam dolu sutunu bulur', () => {
    expect(findFullLines(boardFrom(['1..', '1..', '1..']))).toEqual({ rows: [], cols: [0] });
  });

  it('ayni anda birden fazla satir ve sutunu bulur', () => {
    expect(findFullLines(boardFrom(['111', '111', '1..']))).toEqual({ rows: [0, 1], cols: [0] });
  });

  it('bir hucresi eksik satiri saymaz', () => {
    expect(findFullLines(boardFrom(['11.', '...', '...']))).toEqual({ rows: [], cols: [] });
  });
});

// --- applyClears ---------------------------------------------------------

describe('applyClears', () => {
  it('belirtilen satiri temizler', () => {
    const board = applyClears(boardFrom(['111', '1..', '...']), { rows: [0], cols: [] });

    expect(board).toEqual(boardFrom(['...', '1..', '...']));
  });

  it('belirtilen sutunu temizler', () => {
    const board = applyClears(boardFrom(['11.', '1..', '1..']), { rows: [], cols: [0] });

    expect(board).toEqual(boardFrom(['.1.', '...', '...']));
  });

  it('kesisen satir ve sutunu birlikte temizler', () => {
    const board = applyClears(boardFrom(['111', '1.1', '1.1']), { rows: [0], cols: [0] });

    expect(board).toEqual(boardFrom(['...', '..1', '..1']));
  });

  it('bos temizleme listesinde tahtayi degistirmez', () => {
    const before = boardFrom(['1..', '...', '...']);

    expect(applyClears(before, { rows: [], cols: [] })).toEqual(before);
  });

  it('girdi tahtasini degistirmez (saf fonksiyon)', () => {
    const before = boardFrom(['111', '...', '...']);

    applyClears(before, { rows: [0], cols: [] });

    expect(before).toEqual(boardFrom(['111', '...', '...']));
  });
});

// --- hasAnyValidPlacement ------------------------------------------------

describe('hasAnyValidPlacement', () => {
  it('bos tahtada tum parcalar icin dogru', () => {
    expect(hasAnyValidPlacement(createBoard(3, 3), [piece(SQUARE_2X2)])).toBe(true);
  });

  it('tamamen dolu tahtada yanlis', () => {
    expect(hasAnyValidPlacement(boardFrom(['111', '111', '111']), [piece(SINGLE)])).toBe(false);
  });

  it('tek bos hucre kalmissa yalnizca 1x1 sigar', () => {
    const board = boardFrom(['111', '111', '11.']);

    expect(hasAnyValidPlacement(board, [piece(SINGLE)])).toBe(true);
    expect(hasAnyValidPlacement(board, [piece(HORIZONTAL_2)])).toBe(false);
    expect(hasAnyValidPlacement(board, [piece(VERTICAL_2)])).toBe(false);
  });

  it('parcalardan yalnizca biri sigiyorsa dogru', () => {
    const board = boardFrom(['111', '111', '11.']);

    expect(hasAnyValidPlacement(board, [piece(HORIZONTAL_2), piece(SINGLE)])).toBe(true);
  });

  it('bos parca listesinde yanlis', () => {
    expect(hasAnyValidPlacement(createBoard(3, 3), [])).toBe(false);
  });
});

// --- yardimcilar ---------------------------------------------------------

describe('isBoardEmpty / countFilledCells', () => {
  it('bos tahta', () => {
    expect(isBoardEmpty(createBoard(2, 2))).toBe(true);
    expect(countFilledCells(createBoard(2, 2))).toBe(0);
  });

  it('tek dolu hucre', () => {
    const board = boardFrom(['1.', '..']);

    expect(isBoardEmpty(board)).toBe(false);
    expect(countFilledCells(board)).toBe(1);
  });

  it('renk kimligi 0 olan hucre dolu sayilir (falsy tuzagi)', () => {
    const board: Board = [[0, null]];

    expect(isBoardEmpty(board)).toBe(false);
    expect(countFilledCells(board)).toBe(1);
  });
});
