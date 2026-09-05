import { createBoardFromMask } from '../board';
import { driftBoard, driftCurses } from '../current';
import { ALL_GATES, GATE, gatesLitBy, isGateLit, litGateCount } from '../gates';
import { landGull } from '../gull';
import { petCat, playPiece, startGame, type GameState } from '../game';
import { shapeById } from '../pieces';
import { createRng } from '../rng';
import { OFF_CELL } from '../types';
import type { Board, Piece } from '../types';

import { BOARD, CAT, GATES } from '@/constants/config';

const SEED = 20260905;

const pieceOf = (id: string, colorId = 5): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId };
};

const boardFrom = (rows: string[]): Board =>
  rows.map((row) => [...row].map((ch) => (ch === '.' ? null : ch === '#' ? OFF_CELL : Number(ch))));

const dots = () => [pieceOf('dot'), pieceOf('dot'), pieceOf('dot')];

const canli = (extra: Partial<GameState> = {}): GameState => ({
  ...startGame(SEED, { mode: 'canli' }),
  cat: null,
  ...extra,
});

/** Verilen satir son hucre haric dolu; diger satirlar bos. */
const rowAlmostFull = (y: number): Board =>
  Array.from({ length: BOARD.ROWS }, (_, r) =>
    Array.from({ length: BOARD.COLS }, (_, x) => (r === y && x < BOARD.COLS - 1 ? 5 : null)),
  );

describe('kapilar', () => {
  it('kenar cizgileri kapilari yakar', () => {
    expect(gatesLitBy({ rows: [0], cols: [] })).toBe(GATE.TOP);
    expect(gatesLitBy({ rows: [BOARD.ROWS - 1], cols: [BOARD.COLS - 1] })).toBe(
      GATE.BOTTOM | GATE.RIGHT,
    );
    expect(gatesLitBy({ rows: [3], cols: [2] })).toBe(0);
    expect(gatesLitBy({ rows: [0, BOARD.ROWS - 1], cols: [0, BOARD.COLS - 1] })).toBe(ALL_GATES);
  });

  it('bit yardimcilari', () => {
    expect(isGateLit(GATE.TOP | GATE.LEFT, GATE.LEFT)).toBe(true);
    expect(isGateLit(GATE.TOP, GATE.LEFT)).toBe(false);
    expect(litGateCount(ALL_GATES)).toBe(4);
    expect(litGateCount(0)).toBe(0);
  });

  it('ust satir temizlenince ust kapi yanar', () => {
    const state = canli({ board: rowAlmostFull(0), tray: dots() });
    const next = playPiece(state, 0, { x: BOARD.COLS - 1, y: 0 });

    expect(next.events).toContain('gateLit');
    expect(isGateLit(next.gates, GATE.TOP)).toBe(true);
  });

  it('klasik modda kapi yanmaz', () => {
    const state = { ...startGame(SEED), board: rowAlmostFull(0), tray: dots() };

    expect(playPiece(state, 0, { x: BOARD.COLS - 1, y: 0 }).gates).toBe(0);
  });

  it('dorduncu kapi yaninca senlik baslar ve kapilar soner', () => {
    const state = canli({
      board: rowAlmostFull(0),
      tray: dots(),
      gates: GATE.BOTTOM | GATE.LEFT | GATE.RIGHT,
    });
    const next = playPiece(state, 0, { x: BOARD.COLS - 1, y: 0 });

    expect(next.events).toContain('festival');
    expect(next.gates).toBe(0);
    expect(next.festivalTurns).toBe(GATES.FESTIVAL_TURNS);
  });

  it('senlikte kazanc katlanir ve sayac duser', () => {
    const state = canli({ board: rowAlmostFull(3), tray: dots(), festivalTurns: 2 });
    const next = playPiece(state, 0, { x: BOARD.COLS - 1, y: 3 });
    const plain = playPiece({ ...state, festivalTurns: 0 }, 0, { x: BOARD.COLS - 1, y: 3 });

    expect(next.lastGain).toBe(plain.lastGain * GATES.FESTIVAL_MULTIPLIER);
    expect(next.lastBonuses.some((b) => b.kind === 'festival')).toBe(true);
    expect(next.festivalTurns).toBe(1);
  });

  it('senlik temizlemesiz hamlede de sayar', () => {
    const state = canli({ tray: dots(), festivalTurns: 1 });
    const next = playPiece(state, 0, { x: 3, y: 3 });

    expect(next.festivalTurns).toBe(0);
    expect(next.lastBonuses).toEqual([]);
  });
});

describe('Bogaz akintisi', () => {
  it('satir bir hucre saga kayar, sondaki basa doner', () => {
    const board = boardFrom(['12345678', ...Array(9).fill('........')]);
    const drifted = driftBoard(board, null);

    expect(drifted[0]).toEqual([8, 1, 2, 3, 4, 5, 6, 7]);
    expect(drifted[1]?.every((c) => c === null)).toBe(true);
  });

  it('su seridi yerinde kalir, yalnizca oynanabilir hucreler doner', () => {
    const base = createBoardFromMask(Array.from({ length: BOARD.ROWS }, () => '...##...'));
    const board = base.map((row, y) =>
      y === 0 ? row.map((cell, x) => (cell === null ? x : cell)) : row,
    );
    const drifted = driftBoard(board, null);

    expect(drifted[0]).toEqual([7, 0, 1, OFF_CELL, OFF_CELL, 2, 5, 6]);
  });

  it('kedinin satiri kaymaz', () => {
    const board = boardFrom(['12345678', ...Array(9).fill('........')]);

    expect(driftBoard(board, { x: 2, y: 0, restTurns: 0 })[0]).toEqual(board[0]);
  });

  it('lanetler hucreleriyle birlikte kayar', () => {
    const board = boardFrom(['12345678', ...Array(9).fill('........')]);
    const moved = driftCurses([{ x: 7, y: 0, turnsLeft: 3 }], board, null);

    expect(moved[0]?.x).toBe(0);
    expect(
      driftCurses([{ x: 1, y: 0, turnsLeft: 3 }], board, { x: 0, y: 0, restTurns: 0 })[0]?.x,
    ).toBe(1);
  });

  it('Uskudar seviyesinde her N hamlede akinti olur', () => {
    let state: GameState = {
      ...startGame(SEED, { mode: 'journey', levelId: 'uskudar' }),
      tray: dots(),
    };
    expect(state.rules.current).toBe(true);
    const every = state.rules.currentEvery;

    for (let i = 1; i <= every; i += 1) {
      state = { ...state, tray: dots() };
      // Her hamle farkli bir hucreye: reddedilen hamle olayi tasimaz.
      const next = playPiece(state, 0, { x: i % BOARD.COLS, y: 8 });
      expect(next).not.toBe(state);
      state = next;
      expect(state.events.includes('current')).toBe(i === every);
    }
  });
});

describe('Tekir hediyesi', () => {
  const filledBoard = (): Board =>
    Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) => (y === 0 && x !== 7 ? 5 : y < 3 ? 1 : null)),
    );

  it('her GIFT_EVERY oksamada dolu hucreler bosalir', () => {
    let state = canli({
      board: filledBoard(),
      tray: dots(),
      cat: { x: 7, y: 0, restTurns: 0 },
      catPets: CAT.GIFT_EVERY - 1,
    });
    const filledBefore = state.board.flat().filter((c) => c !== null).length;

    state = petCat(state);

    expect(state.events).toEqual(['catPetted', 'catGift']);
    expect(state.board.flat().filter((c) => c !== null).length).toBe(filledBefore - CAT.GIFT_CELLS);
    expect(state.catPets).toBe(CAT.GIFT_EVERY);
  });

  it('siradan oksamada tahta degismez', () => {
    const state = canli({ board: filledBoard(), cat: { x: 7, y: 0, restTurns: 0 }, catPets: 0 });
    const next = petCat(state);

    expect(next.board).toBe(state.board);
    expect(next.events).toEqual(['catPetted']);
  });

  it('hediye deterministiktir', () => {
    const make = () =>
      petCat(
        canli({
          board: filledBoard(),
          cat: { x: 7, y: 0, restTurns: 0 },
          catPets: CAT.GIFT_EVERY - 1,
        }),
      ).board;

    expect(make()).toEqual(make());
  });
});

describe('marti sekilli tahtada', () => {
  it('tamamen su olan sutuna konmaz', () => {
    const board = createBoardFromMask(Array.from({ length: BOARD.ROWS }, () => '...##...'));
    for (let seed = 1; seed < 40; seed += 1) {
      const gull = landGull(createRng(seed), board);
      expect([3, 4]).not.toContain(gull.col);
    }
  });
});
