import { difficultyProgress, levelForScore, pointsToNextLevel } from '../level';

import { LEVEL } from '@/constants/config';

describe('levelForScore', () => {
  it('oyun 1. seviyeden baslar', () => {
    expect(levelForScore(0)).toBe(1);
  });

  it('esik asilinca seviye atlar', () => {
    expect(levelForScore(LEVEL.POINTS_PER_LEVEL - 1)).toBe(1);
    expect(levelForScore(LEVEL.POINTS_PER_LEVEL)).toBe(2);
    expect(levelForScore(LEVEL.POINTS_PER_LEVEL * 2)).toBe(3);
  });

  it('LEVEL.MAX tavaninda durur', () => {
    expect(levelForScore(LEVEL.POINTS_PER_LEVEL * 1000)).toBe(LEVEL.MAX);
  });

  it('skor asla azalmadigi icin seviye de azalmaz (monotonluk)', () => {
    let previous = 0;
    for (let score = 0; score <= LEVEL.POINTS_PER_LEVEL * 12; score += 37) {
      const level = levelForScore(score);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });

  it('bozuk skor degerlerinde 1. seviyeye duser', () => {
    expect(levelForScore(-100)).toBe(1);
    expect(levelForScore(Number.NaN)).toBe(1);
    expect(levelForScore(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe('difficultyProgress', () => {
  it('1. seviyede sifirdir (en kolay)', () => {
    expect(difficultyProgress(1)).toBe(0);
  });

  it('tavan seviyede birdir (en zor)', () => {
    expect(difficultyProgress(LEVEL.MAX)).toBe(1);
  });

  it('araya duser ve monoton artar', () => {
    let previous = -1;
    for (let level = 1; level <= LEVEL.MAX; level += 1) {
      const progress = difficultyProgress(level);
      expect(progress).toBeGreaterThan(previous);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
      previous = progress;
    }
  });

  it('tavanin uzerinde birde kalir', () => {
    expect(difficultyProgress(LEVEL.MAX + 50)).toBe(1);
  });

  it('bozuk degerlerde sifira duser', () => {
    expect(difficultyProgress(0)).toBe(0);
    expect(difficultyProgress(Number.NaN)).toBe(0);
  });
});

describe('pointsToNextLevel', () => {
  it('baslangicta bir seviyelik puan gerekir', () => {
    expect(pointsToNextLevel(0)).toBe(LEVEL.POINTS_PER_LEVEL);
  });

  it('ilerledikce azalir', () => {
    expect(pointsToNextLevel(100)).toBe(LEVEL.POINTS_PER_LEVEL - 100);
  });

  it('tavan seviyede sifirdir', () => {
    expect(pointsToNextLevel(LEVEL.POINTS_PER_LEVEL * LEVEL.MAX)).toBe(0);
  });

  it('negatif skorda tam bir seviye gerekir', () => {
    expect(pointsToNextLevel(-50)).toBe(LEVEL.POINTS_PER_LEVEL);
  });
});
