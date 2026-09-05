import { LEVEL } from '@/constants/config';

/**
 * Seviye ve zorluk egrisi.
 *
 * Oyun sonsuz (Classic mod) oldugu icin zorluk skorla birlikte artar.
 * Tek kaldirac parca dagilimidir: seviye yukseldikce kolay parcalar
 * (tek kare, ikili) seyrekleşir, zor parcalar (plus, S/Z) sikleşir.
 *
 * Egri LEVEL.MAX'ta TAVAN YAPAR. Sonsuza kadar artan bir zorluk oyunu
 * oynanamaz kilar; oyuncunun ustalasabilecegi bir tavan olmali.
 */

/** Skora karsilik gelen seviye (1'den baslar). */
export function levelForScore(score: number): number {
  if (!Number.isFinite(score) || score <= 0) {
    return 1;
  }
  return Math.min(LEVEL.MAX, Math.floor(score / LEVEL.POINTS_PER_LEVEL) + 1);
}

/**
 * Zorluk ilerlemesi: 0 (en kolay) .. 1 (tavan).
 * Parca agirliklarinin ara degerlemesinde kullanilir.
 */
export function difficultyProgress(level: number): number {
  if (!Number.isFinite(level) || level <= 1) {
    return 0;
  }
  return Math.min(1, (level - 1) / (LEVEL.MAX - 1));
}

/** Bir sonraki seviyeye kalan puan; tavandaysa 0. */
export function pointsToNextLevel(score: number): number {
  const level = levelForScore(score);
  if (level >= LEVEL.MAX) {
    return 0;
  }
  return level * LEVEL.POINTS_PER_LEVEL - Math.max(0, score);
}
