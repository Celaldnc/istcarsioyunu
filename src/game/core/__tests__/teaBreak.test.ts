import { countFilledCells, isGameOver } from '../board';
import { playPiece, startGame, takeTeaBreak, type GameState } from '../game';
import { shapeById } from '../pieces';
import type { Board, Piece } from '../types';

import { BOARD, TEA_BREAK } from '@/constants/config';

const pieceOf = (id: string): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId: 1 };
};

/** Verilen hucreler disinda tamamen dolu tahta. */
const boardWithEmpties = (empties: readonly (readonly [number, number])[]): Board =>
  Array.from({ length: BOARD.ROWS }, (_, y) =>
    Array.from({ length: BOARD.COLS }, (_, x) =>
      empties.some(([ex, ey]) => ex === x && ey === y) ? null : 1,
    ),
  );

/** Capraz bosluklu, hicbir "plus" sigmayan, bitmis oyun. */
function deadGame(): GameState {
  const diagonal = Array.from({ length: BOARD.ROWS }, (_, y) => [y % BOARD.COLS, y] as const);
  const board = boardWithEmpties(diagonal);
  const tray = [pieceOf('plus'), pieceOf('plus'), pieceOf('plus')];

  return {
    ...startGame(1),
    board,
    tray,
    score: 500,
    comboStreak: 3,
    status: isGameOver(board, tray) ? 'gameOver' : 'playing',
  };
}

describe('Cay molasi', () => {
  it('yeni oyun tam hakla baslar', () => {
    expect(startGame(1).teaBreaksLeft).toBe(TEA_BREAK.PER_GAME);
  });

  it('bitmis oyunu yeniden oynanabilir hale getirir', () => {
    const dead = deadGame();
    expect(dead.status).toBe('gameOver');

    const revived = takeTeaBreak(dead);

    expect(revived.status).toBe('playing');
    expect(revived.teaBreaksLeft).toBe(dead.teaBreaksLeft - 1);
  });

  it('en dolu satir ve sutunlari bosaltir', () => {
    const revived = takeTeaBreak(deadGame());

    expect(revived.lastClear.rows).toHaveLength(TEA_BREAK.ROWS);
    expect(revived.lastClear.cols).toHaveLength(TEA_BREAK.COLS);
    for (const y of revived.lastClear.rows) {
      expect(revived.board[y]?.every((cell) => cell === null)).toBe(true);
    }
    for (const x of revived.lastClear.cols) {
      expect(revived.board.every((row) => row[x] === null)).toBe(true);
    }
  });

  it('gercekten en DOLU satirlari secer', () => {
    // 0. satir tamamen bos; asla secilmemeli.
    const dead = deadGame();
    const board = dead.board.map((row, y) => (y === 0 ? row.map(() => null) : row));
    const revived = takeTeaBreak({ ...dead, board });

    expect(revived.lastClear.rows).not.toContain(0);
  });

  it('puan vermez ve seriyi sifirlar', () => {
    const revived = takeTeaBreak(deadGame());

    expect(revived.score).toBe(500);
    expect(revived.lastGain).toBe(0);
    expect(revived.comboStreak).toBe(0);
  });

  it('tepsiye dokunmaz', () => {
    const dead = deadGame();

    expect(takeTeaBreak(dead).tray).toBe(dead.tray);
  });

  it('hak kalmadiysa durum DEGISMEZ (ayni referans)', () => {
    const dead = { ...deadGame(), teaBreaksLeft: 0 };

    expect(takeTeaBreak(dead)).toBe(dead);
  });

  it('oyun surerken kullanilamaz', () => {
    const playing = startGame(1);

    expect(takeTeaBreak(playing)).toBe(playing);
  });

  it('girdi durumunu degistirmez (saf gecis)', () => {
    const dead = deadGame();
    const filledBefore = countFilledCells(dead.board);

    takeTeaBreak(dead);

    expect(countFilledCells(dead.board)).toBe(filledBefore);
  });

  it('moladan sonra oyun normal devam eder', () => {
    const revived = takeTeaBreak(deadGame());
    // Bosalan satir/sutun kesisiminde bir plus mutlaka sigar.
    let next = revived;
    outer: for (let y = 0; y < BOARD.ROWS; y += 1) {
      for (let x = 0; x < BOARD.COLS; x += 1) {
        next = playPiece(revived, 0, { x, y });
        if (next !== revived) {
          break outer;
        }
      }
    }

    expect(next).not.toBe(revived);
    expect(next.teaBreaksLeft).toBe(revived.teaBreaksLeft);
  });

  it('config tutarli: temizlenen cizgi sayisi tahtaya sigar', () => {
    expect(TEA_BREAK.ROWS).toBeLessThan(BOARD.ROWS);
    expect(TEA_BREAK.COLS).toBeLessThan(BOARD.COLS);
    expect(TEA_BREAK.PER_GAME).toBeGreaterThan(0);
  });
});
