import type { SoundName } from './sources';

import type { GameState } from '@/game/core/game';

/**
 * Bir hamlenin hangi sesi tetikleyecegini belirler.
 *
 * Saf fonksiyon: store'a bagli degil, dolayisiyla ses secim kurali ses
 * aygiti calistirmadan test edilebiliyor.
 *
 * "Ayni referans" kontrolu reducer'in sozlesmesine dayanir: gecersiz hamlede
 * playPiece durumu degistirmeden ayni nesneyi dondurur.
 */
export function cueForMove(before: GameState, after: GameState): SoundName {
  if (after === before) {
    return 'invalid';
  }
  if (after.status === 'gameOver') {
    return 'gameOver';
  }

  const lines = after.lastClear.rows.length + after.lastClear.cols.length;
  if (lines >= 2) {
    return 'combo';
  }
  return lines === 1 ? 'clear' : 'place';
}
