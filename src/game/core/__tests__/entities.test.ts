import { createBoard } from '../board';
import { emptyCells, isCatDisturbed, petCat, spawnCat, tickCat, withCatBlocked } from '../cat';
import { eventRng, haggleRng, pickOne } from '../events';
import { feedsGull, gullDive, landGull, topFilledInColumn } from '../gull';
import { clearCurses, isProtected, pruneCurses, tickNazar } from '../nazar';
import { shapeById } from '../pieces';
import { createRng } from '../rng';
import { countSynergies } from '../synergy';
import { OFF_CELL } from '../types';
import type { Board, Piece } from '../types';

import { BOARD, CAT, GULL, NAZAR, ROLES } from '@/constants/config';

const boardFrom = (rows: string[]): Board =>
  rows.map((row) => [...row].map((ch) => (ch === '.' ? null : Number(ch))));

const pieceOf = (id: string, colorId: number): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId };
};

describe('olay ureteci', () => {
  it('ayni seed + hamle ayni diziyi verir', () => {
    expect(eventRng(7, 3)()).toBe(eventRng(7, 3)());
  });

  it('farkli hamle farkli dizi verir', () => {
    expect(eventRng(7, 3)()).not.toBe(eventRng(7, 4)());
  });

  it('parca akisindan bagimsizdir', () => {
    expect(eventRng(7, 0)()).not.toBe(createRng(7, 0)());
  });

  it('pazarlik ureteci ayri akistir', () => {
    expect(haggleRng(7, 0)()).not.toBe(eventRng(7, 0)());
  });

  it('pickOne bos listede undefined, aksi halde listeden eleman', () => {
    expect(pickOne(createRng(1), [])).toBeUndefined();
    expect([1, 2, 3]).toContain(pickOne(createRng(1), [1, 2, 3]));
    // rng 1'e cok yakinken bile tasmaz
    expect(pickOne(() => 0.999999, ['a', 'b'])).toBe('b');
  });
});

describe('Tekir (kedi)', () => {
  it('bos tahtada rastgele bir hucreye dogar', () => {
    const cat = spawnCat(createBoard(), createRng(3));

    expect(cat).not.toBeNull();
    expect(cat?.restTurns).toBe(0);
  });

  it('bos hucre yoksa dogmaz', () => {
    const full = boardFrom(Array.from({ length: BOARD.ROWS }, () => '1'.repeat(BOARD.COLS)));

    expect(spawnCat(full, createRng(3))).toBeNull();
  });

  it('hucresi tahta disi gibi kapatilir', () => {
    const board = withCatBlocked(createBoard(), { x: 2, y: 3, restTurns: 0 });

    expect(board[3]?.[2]).toBe(OFF_CELL);
    expect(board[3]?.[1]).toBeNull();
    expect(withCatBlocked(createBoard(), null)).toEqual(createBoard());
  });

  it('bitisik cizgi temizlenince rahatsiz olur', () => {
    const cat = { x: 2, y: 3, restTurns: 0 };

    expect(isCatDisturbed(cat, { rows: [4], cols: [] })).toBe(true);
    expect(isCatDisturbed(cat, { rows: [], cols: [1] })).toBe(true);
    expect(isCatDisturbed(cat, { rows: [7], cols: [6] })).toBe(false);
  });

  it('rahatsiz edilince bos bir hucreye tasinir', () => {
    const cat = { x: 2, y: 3, restTurns: 0 };
    const tick = tickCat(cat, createBoard(), { rows: [4], cols: [] }, createRng(5));

    expect(tick.moved).toBe(true);
    expect(tick.cat).not.toEqual(cat);
  });

  it('rahatsiz edilmezse yerinde kalir', () => {
    const cat = { x: 2, y: 3, restTurns: 0 };

    expect(tickCat(cat, createBoard(), { rows: [], cols: [] }, createRng(5))).toEqual({
      cat,
      moved: false,
    });
  });

  it('oksanmis kedi tasinmaz, sayaci duser', () => {
    const cat = petCat({ x: 2, y: 3, restTurns: 0 });
    expect(cat.restTurns).toBe(CAT.REST_TURNS);

    const tick = tickCat(cat, createBoard(), { rows: [3], cols: [] }, createRng(5));
    expect(tick.moved).toBe(false);
    expect(tick.cat?.restTurns).toBe(CAT.REST_TURNS - 1);
  });

  it('kedi yoksa hicbir sey olmaz', () => {
    expect(tickCat(null, createBoard(), { rows: [1], cols: [] }, createRng(1)).cat).toBeNull();
  });

  it('emptyCells verilen hucreyi haric tutar', () => {
    const cells = emptyCells(createBoard(), { x: 0, y: 0 });

    expect(cells).toHaveLength(BOARD.COLS * BOARD.ROWS - 1);
    expect(cells.some((c) => c.x === 0 && c.y === 0)).toBe(false);
  });
});

describe('Marti', () => {
  it('bir sutuna konar ve bekleme sayaci alir', () => {
    const gull = landGull(createRng(2));

    expect(gull.col).toBeGreaterThanOrEqual(0);
    expect(gull.col).toBeLessThan(BOARD.COLS);
    expect(gull.turnsLeft).toBe(GULL.PERCH_TURNS);
  });

  it('dalis sutundaki en ustteki dolu hucreyi calar', () => {
    const board = boardFrom(['........', '..1.....', '..2.....', ...Array(7).fill('........')]);
    const { board: after, stolen } = gullDive(board, { col: 2, turnsLeft: 0 });

    expect(stolen).toEqual({ x: 2, y: 1 });
    expect(after[1]?.[2]).toBeNull();
    expect(after[2]?.[2]).toBe(2);
  });

  it('bos sutunda dalis bir sey degistirmez', () => {
    const board = createBoard();

    expect(gullDive(board, { col: 0, turnsLeft: 0 })).toEqual({ board, stolen: null });
    expect(topFilledInColumn(board, 0)).toBeNull();
  });

  it('simit rengi parca martinin sutununa gelirse besler', () => {
    const gull = { col: 3, turnsLeft: 1 };

    expect(feedsGull(gull, pieceOf('line-h3', ROLES.SIMIT), { x: 1, y: 0 })).toBe(true);
    expect(feedsGull(gull, pieceOf('line-h3', ROLES.SIMIT), { x: 4, y: 0 })).toBe(false);
    expect(feedsGull(gull, pieceOf('line-h3', ROLES.CAY), { x: 1, y: 0 })).toBe(false);
    expect(feedsGull(null, pieceOf('dot', ROLES.SIMIT), { x: 3, y: 0 })).toBe(false);
  });
});

describe('Nazar laneti', () => {
  const filledRows = (n: number): Board =>
    boardFrom([
      ...Array.from({ length: n }, () => '1'.repeat(BOARD.COLS)),
      ...Array.from({ length: BOARD.ROWS - n }, () => '.'.repeat(BOARD.COLS)),
    ]);

  it('sayac her hamle duser', () => {
    const tick = tickNazar([{ x: 0, y: 0, turnsLeft: 3 }], filledRows(2), () => 0.99);

    expect(tick.curses[0]?.turnsLeft).toBe(2);
    expect(tick.spread).toBe(0);
  });

  it('sayac bitince komsuya yayilir ve kendi sayaci yenilenir', () => {
    const tick = tickNazar([{ x: 0, y: 0, turnsLeft: 1 }], filledRows(2), () => 0.99);

    expect(tick.spread).toBe(1);
    expect(tick.curses).toHaveLength(2);
    expect(tick.curses.every((c) => c.turnsLeft === NAZAR.SPREAD_TURNS)).toBe(true);
  });

  it('bos komsuya yayilmaz (bekler)', () => {
    const board = boardFrom(['1.......', ...Array(9).fill('........')]);
    const tick = tickNazar([{ x: 0, y: 0, turnsLeft: 1 }], board, () => 0.99);

    expect(tick.spread).toBe(0);
    expect(tick.curses).toHaveLength(1);
  });

  it('nazar boncuguna bitisik hucre korunur', () => {
    const board = boardFrom([`1${ROLES.NAZAR}......`, ...Array(9).fill('........')]);

    expect(isProtected(board, { x: 0, y: 0 })).toBe(true);
    expect(isProtected(board, { x: 5, y: 5 })).toBe(false);
  });

  it('kucuk olasilikla yeni lanet dogar', () => {
    const tick = tickNazar([], filledRows(3), () => 0);

    expect(tick.spawned).toBe(true);
    expect(tick.curses).toHaveLength(1);
  });

  it('tavan doluyken yeni lanet dogmaz', () => {
    const existing = Array.from({ length: NAZAR.MAX_ACTIVE }, (_, i) => ({
      x: i,
      y: 0,
      turnsLeft: 5,
    }));
    const tick = tickNazar(existing, filledRows(3), () => 0);

    expect(tick.spawned).toBe(false);
  });

  it('temizlenen cizgideki lanet kalkar ve sayilir', () => {
    const result = clearCurses(
      [
        { x: 0, y: 0, turnsLeft: 2 },
        { x: 5, y: 5, turnsLeft: 2 },
      ],
      { rows: [0], cols: [] },
    );

    expect(result.cleared).toBe(1);
    expect(result.remaining).toEqual([{ x: 5, y: 5, turnsLeft: 2 }]);
  });

  it('hucresi bosalan lanet dusurulur', () => {
    expect(pruneCurses([{ x: 0, y: 0, turnsLeft: 2 }], createBoard())).toEqual([]);
  });
});

describe('sinerjiler', () => {
  it('temizlenen satirda yan yana simit + cay kahvalti sayilir', () => {
    const row = `${ROLES.SIMIT}${ROLES.CAY}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}`;
    const board = boardFrom([row, ...Array(9).fill('........')]);

    expect(countSynergies(board, { rows: [0], cols: [] }).kahvalti).toBe(1);
  });

  it('lokum + fistik sayilir, sira onemsiz', () => {
    const row = `${ROLES.FISTIK}${ROLES.LOKUM}${ROLES.LOKUM}${ROLES.FISTIK}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}`;
    const board = boardFrom([row, ...Array(9).fill('........')]);

    expect(countSynergies(board, { rows: [0], cols: [] }).fistikliLokum).toBe(2);
  });

  it('temizlenmeyen komsu sayilmaz', () => {
    const board = boardFrom([
      `${ROLES.SIMIT}.......`,
      `${ROLES.CAY}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}${ROLES.BAKIR}`,
      ...Array(8).fill('........'),
    ]);

    expect(countSynergies(board, { rows: [1], cols: [] }).kahvalti).toBe(0);
  });

  it('satir ve sutun kesisiminde cift bir kez sayilir', () => {
    const board = boardFrom([
      `${ROLES.SIMIT}${ROLES.CAY}......`,
      `${ROLES.CAY}.......`,
      ...Array(8).fill('........'),
    ]);
    // 0. satir ve 0. sutun temizleniyor gibi verilir (test amacli).
    const counts = countSynergies(board, { rows: [0], cols: [0] });

    expect(counts.kahvalti).toBe(2);
  });
});
