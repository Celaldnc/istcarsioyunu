import { ESNAF_EVENTS, ESNAF_LINES, esnafEventForMove, esnafLine, type EsnafEvent } from '../esnaf';

import { BOARD, LEVEL } from '@/constants/config';
import { playPiece, startGame, takeTeaBreak, type GameState } from '@/game/core/game';
import type { Board } from '@/game/core/types';

const SEED = 20260905;
const before = startGame(SEED);

const withClear = (base: GameState, rows: number[], cols: number[]): GameState => ({
  ...base,
  lastClear: { rows, cols },
});

describe('ESNAF_LINES', () => {
  it.each(ESNAF_EVENTS)('%s olayi icin en az iki replik vardir', (event) => {
    expect(ESNAF_LINES[event].length).toBeGreaterThanOrEqual(2);
  });

  it('replikler kisa ve bos degildir (baloncuga sigmali)', () => {
    for (const lines of Object.values(ESNAF_LINES)) {
      for (const line of lines) {
        expect(line.trim().length).toBeGreaterThan(0);
        expect(line.length).toBeLessThanOrEqual(48);
      }
    }
  });
});

describe('esnafLine', () => {
  it('ayni olay ve tuz her zaman ayni repligi verir (deterministik)', () => {
    expect(esnafLine('streak', 7)).toBe(esnafLine('streak', 7));
  });

  it('tuz degisince farkli replikler doner', () => {
    const seen = new Set(Array.from({ length: 20 }, (_, i) => esnafLine('gameOver', i)));

    expect(seen.size).toBeGreaterThan(1);
  });

  it('her replik listeden gelir', () => {
    for (let salt = 0; salt < 30; salt += 1) {
      expect(ESNAF_LINES.combo).toContain(esnafLine('combo', salt));
    }
  });

  it('negatif veya bozuk tuz cokertmez', () => {
    expect(ESNAF_LINES.start).toContain(esnafLine('start', -3));
    expect(ESNAF_LINES.start).toContain(esnafLine('start', Number.NaN));
  });
});

describe('esnafEventForMove', () => {
  const ctx = { highScore: 0 };

  it('reddedilen hamlede susar', () => {
    expect(esnafEventForMove(before, before, ctx)).toBeNull();
  });

  it('siradan yerlestirmede susar (gurultu yapmaz)', () => {
    const after = playPiece(before, 0, { x: 0, y: 0 });

    expect(esnafEventForMove(before, after, ctx)).toBeNull();
  });

  it('tek temizlemede de susar; seri baslayinca konusur', () => {
    const single = withClear({ ...before, board: fullish(), comboStreak: 1 }, [0], []);
    const streakStart = withClear({ ...before, board: fullish(), comboStreak: 2 }, [0], []);

    expect(esnafEventForMove(before, single, ctx)).toBeNull();
    expect(esnafEventForMove(before, streakStart, ctx)).toBe('streak');
  });

  it('coklu temizlemede combo', () => {
    const after = withClear({ ...before, board: fullish() }, [0, 1], []);

    expect(esnafEventForMove(before, after, ctx)).toBe('combo');
  });

  it('Cini combo’nun onune gecer', () => {
    const after: GameState = {
      ...withClear({ ...before, board: fullish() }, [0, 1], []),
      lastCini: { rows: [0], cols: [] },
    };

    expect(esnafEventForMove(before, after, ctx)).toBe('cini');
  });

  it('tahta tamamen bosalirsa perfect clear', () => {
    const after = withClear({ ...before, board: before.board }, [0], []);

    expect(esnafEventForMove(before, after, ctx)).toBe('perfectClear');
  });

  it('seviye atlaninca levelUp', () => {
    const after = withClear(
      { ...before, score: LEVEL.POINTS_PER_LEVEL, board: fullish() },
      [0],
      [],
    );

    expect(esnafEventForMove(before, after, ctx)).toBe('levelUp');
  });

  it('rekor kirilinca record (her seyin onunde)', () => {
    const after: GameState = {
      ...withClear({ ...before, score: 150, board: fullish() }, [0, 1], []),
      lastCini: { rows: [0], cols: [] },
    };

    expect(esnafEventForMove({ ...before, score: 90 }, after, { highScore: 100 })).toBe('record');
  });

  it('tahta sikisinca (az bosluk, temizleme yok) uyarir', () => {
    const after: GameState = { ...before, board: nearlyFull(), lastClear: { rows: [], cols: [] } };

    expect(esnafEventForMove(before, after, ctx)).toBe('nearDeath');
  });

  it('oyun bitince gameOver', () => {
    const after: GameState = { ...before, status: 'gameOver' };

    expect(esnafEventForMove(before, after, ctx)).toBe('gameOver');
  });

  it('cay molasi sonrasi teaBreak', () => {
    const dead: GameState = { ...before, status: 'gameOver', board: nearlyFull() };
    const revived = takeTeaBreak(dead);

    expect(esnafEventForMove(dead, revived, ctx)).toBe('teaBreak');
  });

  it('tum olaylar listede tanimlidir', () => {
    const events: EsnafEvent[] = [...ESNAF_EVENTS];
    expect(events).toEqual(expect.arrayContaining(['start', 'gameOver', 'teaBreak', 'record']));
  });
});

/** Dolu ama az bosluklu olmayan tahta: perfect clear tetiklenmesin diye. */
function fullish(): Board {
  return Array.from({ length: BOARD.ROWS }, (_, y) =>
    Array.from({ length: BOARD.COLS }, () => (y < 3 ? 1 : null)),
  );
}

/** Capraz bosluklu, sikismis tahta. */
function nearlyFull(): Board {
  return Array.from({ length: BOARD.ROWS }, (_, y) =>
    Array.from({ length: BOARD.COLS }, (_, x) => (x === y % BOARD.COLS ? null : 1)),
  );
}
