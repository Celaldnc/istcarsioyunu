import type { FullLines } from './types';

import { SCORING } from '@/constants/config';

/**
 * Skor hesabi.
 *
 * SPEC SAPMASI (bilincli): Spec "perfect clear" bonusunu "tum parcalari
 * kullanirsin" diye tanimliyor. Ama Block Blast akisinda oyuncu tepsideki uc
 * parcayi HER tur zaten kullanir; bonus her turda tetiklenir ve sabit bir
 * eklenti olarak anlamini yitirirdi. Bu yuzden standart tanim uygulandi:
 * bonus, temizleme sonrasi tahta TAMAMEN bosaldiginda verilir. Nadir ve
 * gercekten odullendirici bir olay.
 */

export interface ScoreInput {
  /** Bu hamlede temizlenen satir ve sutunlar. */
  readonly clearedLines: FullLines;
  /** Temizleme uygulandiktan SONRA tahta tamamen bos mu? */
  readonly boardEmptyAfterClears: boolean;
}

export interface ScoreResult {
  /** Temizlenen toplam cizgi sayisi (satir + sutun). */
  readonly lineCount: number;
  readonly comboMultiplier: number;
  readonly linePoints: number;
  readonly perfectClearBonus: number;
  readonly total: number;
}

/**
 * Ayni hamlede temizlenen cizgi sayisina gore combo carpani.
 *
 * Carpan cizgi sayisina esittir: iki cizgi, tek cizginin iki katindan fazla
 * puan getirir (10*2*2 = 40 vs 10*1*1 = 10). Amac, oyuncuyu tek tek
 * temizlemek yerine kurulum yapip coklu patlatmaya tesvik etmek.
 */
export function comboMultiplier(lineCount: number): number {
  return lineCount > 0 ? lineCount : 0;
}

export function computeScore(input: ScoreInput): ScoreResult {
  const lineCount = input.clearedLines.rows.length + input.clearedLines.cols.length;
  const multiplier = comboMultiplier(lineCount);
  const linePoints = SCORING.POINTS_PER_LINE * lineCount * multiplier;

  // Bonus yalnizca bu hamlede bir sey temizlendiyse verilir. Aksi halde
  // oyunun ilk hamlesinden onceki bos tahta da bonus kazandirirdi.
  const perfectClearBonus =
    input.boardEmptyAfterClears && lineCount > 0 ? SCORING.PERFECT_CLEAR_BONUS : 0;

  return {
    lineCount,
    comboMultiplier: multiplier,
    linePoints,
    perfectClearBonus,
    total: linePoints + perfectClearBonus,
  };
}
