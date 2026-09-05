import { findFullLines, monochromeLines } from '../board';
import { computeScore } from '../score';
import type { Board } from '../types';

import { SCORING } from '@/constants/config';

const boardFrom = (rows: string[]): Board =>
  rows.map((row) => [...row].map((ch) => (ch === '.' ? null : Number(ch))));

describe('monochromeLines (Cini)', () => {
  it('tek renkli dolu satiri cini sayar', () => {
    const board = boardFrom(['222', '1.1', '...']);
    const lines = findFullLines(board);

    expect(monochromeLines(board, lines)).toEqual({ rows: [0], cols: [] });
  });

  it('karisik renkli dolu satiri cini saymaz', () => {
    const board = boardFrom(['212', '...', '...']);
    const lines = findFullLines(board);

    expect(monochromeLines(board, lines)).toEqual({ rows: [], cols: [] });
  });

  it('sutunlarda da calisir', () => {
    const board = boardFrom(['3.1', '3.2', '3.1']);
    const lines = findFullLines(board);

    expect(monochromeLines(board, lines)).toEqual({ rows: [], cols: [0] });
  });

  it('renk kimligi 0 gecerli bir renktir (falsy tuzagi)', () => {
    const board = boardFrom(['000', '...', '...']);
    const lines = findFullLines(board);

    expect(monochromeLines(board, lines).rows).toEqual([0]);
  });

  it('dolu olmayan cizgiler dikkate alinmaz', () => {
    // 0. sutun tek renkli ama tam dolu degil; findFullLines onu vermez.
    // Dolu olan 0. satir ve 1. sutun ise karisik renkli.
    const board = boardFrom(['12', '.1']);

    expect(monochromeLines(board, findFullLines(board))).toEqual({ rows: [], cols: [] });
  });

  it('yalnizca verilen cizgileri inceler (kendi basina aramaz)', () => {
    const board = boardFrom(['222', '111']);

    expect(monochromeLines(board, { rows: [1], cols: [] })).toEqual({ rows: [1], cols: [] });
  });
});

describe('computeScore cini bonusu', () => {
  const base = { clearedLines: { rows: [0], cols: [] }, boardEmptyAfterClears: false };

  it('cini yoksa bonus sifirdir', () => {
    expect(computeScore(base).ciniBonus).toBe(0);
  });

  it('her cini cizgisi icin sabit bonus ekler', () => {
    const result = computeScore({
      ...base,
      clearedLines: { rows: [0, 1], cols: [] },
      ciniLines: 2,
    });

    expect(result.ciniBonus).toBe(2 * SCORING.CINI_BONUS);
    expect(result.total).toBe(result.linePoints + result.ciniBonus + result.perfectClearBonus);
  });

  it('cini bonusu tek cizgi puanindan belirgin yuksektir (hedef olmaya deger)', () => {
    expect(SCORING.CINI_BONUS).toBeGreaterThanOrEqual(SCORING.POINTS_PER_LINE * 3);
  });

  it('bozuk cini sayisi toplami bozmaz', () => {
    expect(computeScore({ ...base, ciniLines: Number.NaN }).ciniBonus).toBe(0);
    expect(computeScore({ ...base, ciniLines: -2 }).ciniBonus).toBe(0);
  });
});
