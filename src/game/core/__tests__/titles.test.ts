import { EMPTY_STATS, TITLES, addGameToStats, linesToNextTitle, titleFor } from '../titles';

describe('unvanlar', () => {
  it('esikler artan siradadir ve ilki sifirdir', () => {
    expect(TITLES[0]?.minLines).toBe(0);
    for (let i = 1; i < TITLES.length; i += 1) {
      expect(TITLES[i]?.minLines).toBeGreaterThan(TITLES[i - 1]?.minLines ?? 0);
    }
  });

  it('cizgi sayisina gore unvan verir', () => {
    expect(titleFor({ lines: 0 }).id).toBe('cirak');
    expect(titleFor({ lines: 150 }).id).toBe('kalfa');
    expect(titleFor({ lines: 99_999 }).id).toBe(TITLES[TITLES.length - 1]?.id);
  });

  it('bir sonraki unvana kalani hesaplar; sonuncuda null', () => {
    expect(linesToNextTitle({ lines: 40 })).toBe(60);
    expect(linesToNextTitle({ lines: 99_999 })).toBeNull();
  });

  it('oyun sayaclari istatistige eklenir, rekorlar max alir', () => {
    const game = {
      score: 700,
      lines: 12,
      cini: 1,
      synergy: 2,
      gullsFed: 1,
      catMoves: 3,
      makams: 0,
      nazarCleared: 1,
      bestStreak: 4,
    };
    const once = addGameToStats(EMPTY_STATS, game);
    const twice = addGameToStats(once, { ...game, score: 300, bestStreak: 2 });

    expect(once.games).toBe(1);
    expect(twice.lines).toBe(24);
    expect(twice.bestStreak).toBe(4);
    expect(twice.bestScore).toBe(700);
  });
});
