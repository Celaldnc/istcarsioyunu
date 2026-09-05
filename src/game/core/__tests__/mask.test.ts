import {
  applyClears,
  canPlace,
  countFilledCells,
  countPlayableCells,
  createBoardFromMask,
  findFullLines,
  hasAnyValidPlacement,
  monochromeLines,
} from '../board';
import { LEVELS, levelById, nextLevelId } from '../levels';
import { shapeById } from '../pieces';
import { OFF_CELL, isFilledCell, isOffCell } from '../types';
import type { Board, Piece } from '../types';

import { BOARD } from '@/constants/config';

const pieceOf = (id: string, colorId = 1): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId };
};

/** Ortada su seridi olan Bogaz maskesi. */
const BOGAZ = Array.from({ length: BOARD.ROWS }, () => '...##...');

describe('hucre siniflandirmasi', () => {
  it('OFF_CELL dolu sayilmaz, bos da sayilmaz', () => {
    expect(isFilledCell(OFF_CELL)).toBe(false);
    expect(isOffCell(OFF_CELL)).toBe(true);
    expect(isFilledCell(0)).toBe(true);
    expect(isFilledCell(null)).toBe(false);
  });
});

describe('createBoardFromMask', () => {
  it('# tahta disi, digerleri bos hucre olur', () => {
    const board = createBoardFromMask(BOGAZ);

    expect(board[0]?.[3]).toBe(OFF_CELL);
    expect(board[0]?.[0]).toBeNull();
    expect(countPlayableCells(board)).toBe(BOARD.COLS * BOARD.ROWS - 2 * BOARD.ROWS);
  });

  it('yanlis boyutlu maske reddedilir', () => {
    expect(() => createBoardFromMask(['..'])).toThrow();
  });
});

describe('sekilli tahtada mekanik', () => {
  it('tahta disina parca konamaz', () => {
    const board = createBoardFromMask(BOGAZ);

    expect(canPlace(board, pieceOf('line-h3'), { x: 2, y: 0 })).toBe(false);
    expect(canPlace(board, pieceOf('line-h3'), { x: 0, y: 0 })).toBe(true);
  });

  it('iki yakasi dolu satir tam sayilir (kopru)', () => {
    const board: Board = createBoardFromMask(BOGAZ).map((row, y) =>
      y === 2 ? row.map((cell) => (cell === null ? 1 : cell)) : row,
    );

    expect(findFullLines(board).rows).toEqual([2]);
  });

  it('tamamen tahta disi sutun tam sayilmaz', () => {
    const board = createBoardFromMask(BOGAZ);

    expect(findFullLines(board).cols).toEqual([]);
  });

  it('temizleme tahta disi hucreye dokunmaz', () => {
    const board: Board = createBoardFromMask(BOGAZ).map((row, y) =>
      y === 2 ? row.map((cell) => (cell === null ? 1 : cell)) : row,
    );
    const cleared = applyClears(board, { rows: [2], cols: [] });

    expect(cleared[2]?.[3]).toBe(OFF_CELL);
    expect(cleared[2]?.[0]).toBeNull();
    expect(countFilledCells(cleared)).toBe(0);
  });

  it('cini: tahta disi hucreler renk esitligini bozmaz', () => {
    const board: Board = createBoardFromMask(BOGAZ).map((row, y) =>
      y === 2 ? row.map((cell) => (cell === null ? 4 : cell)) : row,
    );

    expect(monochromeLines(board, findFullLines(board)).rows).toEqual([2]);
  });

  it('oyun sonu tespiti tahta disini dolu gibi gorur', () => {
    // Yalnizca 3 genisliginde yakalar; 3x3 plus sigmaz.
    const board = createBoardFromMask(BOGAZ);

    expect(hasAnyValidPlacement(board, [pieceOf('plus')])).toBe(true);
    expect(hasAnyValidPlacement(board, [pieceOf('line-h3')])).toBe(true);
  });
});

describe('seviye katalogu', () => {
  it('kimlikler benzersizdir', () => {
    const ids = LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('her maske tahta boyutundadir ve oynanabilir alan birakir', () => {
    for (const level of LEVELS) {
      if (level.mask === undefined) {
        continue;
      }
      const board = createBoardFromMask(level.mask);
      expect(countPlayableCells(board)).toBeGreaterThan(BOARD.COLS * 3);
    }
  });

  it('nextLevelId zinciri sonuncuda biter', () => {
    const first = LEVELS[0]?.id ?? '';
    expect(nextLevelId(first)).toBe(LEVELS[1]?.id);
    expect(nextLevelId(LEVELS[LEVELS.length - 1]?.id ?? '')).toBeUndefined();
    expect(nextLevelId('yok')).toBeUndefined();
  });

  it('levelById bilinmeyeni undefined dondurur', () => {
    expect(levelById('yok')).toBeUndefined();
    expect(levelById(null)).toBeUndefined();
    expect(levelById('bogaz')?.overrides?.bridge).toBe(true);
  });
});
