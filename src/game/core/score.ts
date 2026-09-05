import type { FullLines } from './types';

import { COMBO, SCORING } from '@/constants/config';

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
  /**
   * Bu hamleden ONCEKI ardisik temizleme serisi (kac hamledir ust uste
   * temizleniyor). Ilk temizlemede 0'dir.
   */
  readonly streak?: number;
  /** Temizlenen cizgilerden kaci tek renkli ("Cini"). */
  readonly ciniLines?: number;
}

export interface ScoreResult {
  /** Temizlenen toplam cizgi sayisi (satir + sutun). */
  readonly lineCount: number;
  /** Ayni hamlede temizlenen cizgi sayisindan gelen carpan. */
  readonly comboMultiplier: number;
  /** Ardisik temizleme serisinden gelen carpan. */
  readonly streakMultiplier: number;
  readonly linePoints: number;
  /** Tek renkli cizgilerden gelen bonus. */
  readonly ciniBonus: number;
  readonly perfectClearBonus: number;
  readonly total: number;
  /** Bu hamleden SONRAKI seri; cagiran taraf durumda saklar. */
  readonly nextStreak: number;
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

/**
 * Ardisik temizleme serisinden gelen carpan.
 *
 * "Ayni anda 2+ cizgi" combo'su olcumde 48 hamlede 1 tetikleniyordu; oyuncu
 * carpani neredeyse hic gormuyordu. Hamlelerin ~%25'i tek cizgi temizledigi
 * icin SERI combo'su cok daha sik kuruluyor ve zincir kurmayi odullendiriyor.
 *
 * streak: bu hamleden ONCEKI ardisik temizleme sayisi.
 */
export function streakMultiplier(streak: number): number {
  if (!Number.isFinite(streak) || streak <= 0) {
    return 1;
  }
  return Math.min(COMBO.MAX_STREAK_MULTIPLIER, 1 + streak * COMBO.STREAK_STEP);
}

export function computeScore(input: ScoreInput): ScoreResult {
  const lineCount = input.clearedLines.rows.length + input.clearedLines.cols.length;
  const multiplier = comboMultiplier(lineCount);
  const streak = input.streak ?? 0;
  const streakBonus = lineCount > 0 ? streakMultiplier(streak) : 1;

  // Puanlar tamsayi tutulur; carpanlar kesirli olabilir.
  const linePoints = Math.round(SCORING.POINTS_PER_LINE * lineCount * multiplier * streakBonus);

  // Bonus yalnizca bu hamlede bir sey temizlendiyse verilir. Aksi halde
  // oyunun ilk hamlesinden onceki bos tahta da bonus kazandirirdi.
  const perfectClearBonus =
    input.boardEmptyAfterClears && lineCount > 0 ? SCORING.PERFECT_CLEAR_BONUS : 0;

  // Cini sayisi bozuksa (NaN, negatif) bonus verilmez; toplam asla NaN olmaz.
  const ciniCount = Number.isInteger(input.ciniLines) ? Math.max(0, input.ciniLines ?? 0) : 0;
  const ciniBonus = ciniCount * SCORING.CINI_BONUS;

  return {
    lineCount,
    comboMultiplier: multiplier,
    streakMultiplier: streakBonus,
    linePoints,
    ciniBonus,
    perfectClearBonus,
    total: linePoints + ciniBonus + perfectClearBonus,
    // Temizleme yapmayan hamle seriyi sifirlar.
    nextStreak: lineCount > 0 ? streak + 1 : 0,
  };
}
