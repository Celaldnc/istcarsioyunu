import { applyClears, createBoard, findFullLines, isBoardEmpty, placePiece } from '../board';
import { shapeById } from '../pieces';
import { comboMultiplier, computeScore } from '../score';
import type { Board, Piece } from '../types';

import { COMBO, SCORING } from '@/constants/config';

const boardFrom = (rows: string[]): Board =>
  rows.map((row) => [...row].map((ch) => (ch === '.' ? null : Number(ch))));

describe('comboMultiplier', () => {
  it('hicbir satir temizlenmediyse 0', () => {
    expect(comboMultiplier(0)).toBe(0);
  });

  it('tek satirda 1 (combo yok)', () => {
    expect(comboMultiplier(1)).toBe(1);
  });

  it('ayni anda temizlenen satir sayisiyla birlikte artar', () => {
    expect(comboMultiplier(2)).toBeGreaterThan(comboMultiplier(1));
    expect(comboMultiplier(3)).toBeGreaterThan(comboMultiplier(2));
  });

  it('negatif girdiyi 0 kabul eder (savunmaci)', () => {
    expect(comboMultiplier(-1)).toBe(0);
  });
});

describe('computeScore', () => {
  it('hicbir satir temizlenmediyse puan yoktur', () => {
    const result = computeScore({
      clearedLines: { rows: [], cols: [] },
      boardEmptyAfterClears: false,
    });

    expect(result.total).toBe(0);
    expect(result.lineCount).toBe(0);
    expect(result.perfectClearBonus).toBe(0);
  });

  it('tek satir taban puani verir', () => {
    const result = computeScore({
      clearedLines: { rows: [3], cols: [] },
      boardEmptyAfterClears: false,
    });

    expect(result.lineCount).toBe(1);
    expect(result.comboMultiplier).toBe(1);
    expect(result.total).toBe(SCORING.POINTS_PER_LINE);
  });

  it('satir ve sutunlari birlikte sayar', () => {
    const result = computeScore({
      clearedLines: { rows: [0, 1], cols: [4] },
      boardEmptyAfterClears: false,
    });

    expect(result.lineCount).toBe(3);
  });

  it('coklu temizlemede combo carpani uygulanir', () => {
    const single = computeScore({
      clearedLines: { rows: [0], cols: [] },
      boardEmptyAfterClears: false,
    });
    const double = computeScore({
      clearedLines: { rows: [0, 1], cols: [] },
      boardEmptyAfterClears: false,
    });

    // Iki satir, tek satirin iki katindan DAHA fazla puan getirmeli.
    expect(double.total).toBeGreaterThan(single.total * 2);
  });

  it('tahta tamamen bosaldiysa perfect clear bonusu ekler', () => {
    const result = computeScore({
      clearedLines: { rows: [0], cols: [] },
      boardEmptyAfterClears: true,
    });

    expect(result.perfectClearBonus).toBe(SCORING.PERFECT_CLEAR_BONUS);
    expect(result.total).toBe(result.linePoints + SCORING.PERFECT_CLEAR_BONUS);
  });

  it('hicbir satir temizlenmeden bos tahta bonus vermez', () => {
    // Oyunun ilk hamlesinden once tahta zaten bostur; bonus hak edilmis olmaz.
    const result = computeScore({
      clearedLines: { rows: [], cols: [] },
      boardEmptyAfterClears: true,
    });

    expect(result.perfectClearBonus).toBe(0);
    expect(result.total).toBe(0);
  });

  it('toplam, bilesenlerinin toplamina esittir', () => {
    const result = computeScore({
      clearedLines: { rows: [0, 1], cols: [2] },
      boardEmptyAfterClears: true,
    });

    expect(result.total).toBe(result.linePoints + result.perfectClearBonus);
  });
});

// --- entegrasyon: tahta + parca + skor birlikte ---------------------------

describe('bir hamlenin ucu uca akisi', () => {
  const pieceOf = (id: string, colorId = 1): Piece => {
    const shape = shapeById(id);
    if (shape === undefined) {
      throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
    }
    return { shape, colorId };
  };

  it('son bosluga yerlestirme satiri temizler ve puan getirir', () => {
    // 3x3 tahta, ust satirda tek bosluk var.
    const board = boardFrom(['11.', '...', '...']);

    const afterPlace = placePiece(board, pieceOf('dot'), { x: 2, y: 0 });
    const lines = findFullLines(afterPlace);
    const afterClear = applyClears(afterPlace, lines);
    const score = computeScore({
      clearedLines: lines,
      boardEmptyAfterClears: isBoardEmpty(afterClear),
    });

    expect(lines.rows).toEqual([0]);
    expect(isBoardEmpty(afterClear)).toBe(true);
    expect(score.total).toBe(SCORING.POINTS_PER_LINE + SCORING.PERFECT_CLEAR_BONUS);
  });

  it('temizleme olmayan hamle puan getirmez ve tahtayi doldurur', () => {
    const board = createBoard(3, 3);

    const afterPlace = placePiece(board, pieceOf('dot'), { x: 0, y: 0 });
    const lines = findFullLines(afterPlace);
    const score = computeScore({
      clearedLines: lines,
      boardEmptyAfterClears: isBoardEmpty(applyClears(afterPlace, lines)),
    });

    expect(score.total).toBe(0);
    expect(isBoardEmpty(afterPlace)).toBe(false);
  });
});

describe('ardisik temizleme serisi', () => {
  const clearOnce = (streak: number) =>
    computeScore({ clearedLines: { rows: [0], cols: [] }, boardEmptyAfterClears: false, streak });

  it('ilk temizlemede carpan yoktur', () => {
    expect(clearOnce(0).streakMultiplier).toBe(1);
  });

  it('seri uzadikca carpan artar', () => {
    expect(clearOnce(1).streakMultiplier).toBeGreaterThan(clearOnce(0).streakMultiplier);
    expect(clearOnce(3).streakMultiplier).toBeGreaterThan(clearOnce(1).streakMultiplier);
  });

  it('carpan tavani asilmaz', () => {
    expect(clearOnce(1000).streakMultiplier).toBe(COMBO.MAX_STREAK_MULTIPLIER);
  });

  it('temizleyen hamle seriyi bir artirir', () => {
    expect(clearOnce(2).nextStreak).toBe(3);
  });

  it('temizlemeyen hamle seriyi SIFIRLAR', () => {
    const result = computeScore({
      clearedLines: { rows: [], cols: [] },
      boardEmptyAfterClears: false,
      streak: 5,
    });

    expect(result.nextStreak).toBe(0);
    expect(result.streakMultiplier).toBe(1);
  });

  it('seri puani gercekten artirir', () => {
    expect(clearOnce(3).total).toBeGreaterThan(clearOnce(0).total);
  });

  it('puanlar tamsayi kalir (carpanlar kesirli olsa da)', () => {
    for (let streak = 0; streak <= 8; streak += 1) {
      expect(Number.isInteger(clearOnce(streak).total)).toBe(true);
    }
  });

  it('seri verilmezse sifir kabul edilir', () => {
    const withoutStreak = computeScore({
      clearedLines: { rows: [0], cols: [] },
      boardEmptyAfterClears: false,
    });

    expect(withoutStreak.streakMultiplier).toBe(1);
    expect(withoutStreak.nextStreak).toBe(1);
  });

  it('bozuk seri degeri carpani bozmaz', () => {
    expect(clearOnce(Number.NaN).streakMultiplier).toBe(1);
    expect(clearOnce(-5).streakMultiplier).toBe(1);
  });
});
