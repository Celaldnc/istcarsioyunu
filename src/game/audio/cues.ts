import type { SoundName } from './sources';

import type { GameState } from '@/game/core/game';
import { levelForScore } from '@/game/core/level';

/** Bir hamle sonucunda hangi "olay"in yasandigina karar vermek icin baglam. */
export interface MoveContext {
  /** Hamleden ONCEKI rekor. 0 ise henuz rekor yok; ilk oyun rekor sayilmaz. */
  readonly highScore: number;
}

const NO_CONTEXT: MoveContext = { highScore: 0 };

const lineCount = (state: GameState): number =>
  state.lastClear.rows.length + state.lastClear.cols.length;

/** Bu hamleyle rekor ILK KEZ asildi mi? */
export function crossedRecord(before: GameState, after: GameState, ctx: MoveContext): boolean {
  return ctx.highScore > 0 && before.score <= ctx.highScore && after.score > ctx.highScore;
}

/**
 * Bir hamlenin hangi sesi tetikleyecegini belirler.
 *
 * Saf fonksiyon: store'a bagli degil, dolayisiyla ses secim kurali ses
 * aygiti calistirmadan test edilebiliyor.
 *
 * Oncelik sirasi (ustteki alttakini bastirir): gecersiz > oyun sonu > rekor >
 * Cini > combo > seviye > temizleme > yerlestirme. Rekor ve Cini nadir ve
 * buyuk anlardir; ayni hamlede baska bir sey de olsa onlar duyulmali.
 *
 * "Ayni referans" kontrolu reducer'in sozlesmesine dayanir: gecersiz hamlede
 * playPiece durumu degistirmeden ayni nesneyi dondurur.
 */
export function cueForMove(
  before: GameState,
  after: GameState,
  ctx: MoveContext = NO_CONTEXT,
): SoundName {
  if (after === before) {
    return 'invalid';
  }
  if (after.status === 'gameOver') {
    return 'gameOver';
  }
  if (crossedRecord(before, after, ctx)) {
    return 'record';
  }

  const lines = lineCount(after);
  if (after.lastCini.rows.length + after.lastCini.cols.length > 0) {
    return 'cini';
  }
  if (lines >= 2) {
    return 'combo';
  }
  if (levelForScore(after.score) > levelForScore(before.score)) {
    return 'levelUp';
  }
  return lines === 1 ? 'clear' : 'place';
}
