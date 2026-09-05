import { noteForStreak, type SoundName } from './sources';

import type { GameEvent, GameState } from '@/game/core/game';
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

/** Canli olaylarin ses onceligi ve karsiliklari. */
const EVENT_SOUNDS: readonly (readonly [GameEvent, SoundName])[] = [
  ['festival', 'festival'],
  ['catGift', 'cat'],
  ['gullFed', 'gull'],
  ['nazarCleared', 'nazar'],
  ['synergy', 'synergy'],
  ['gullDove', 'gull'],
  ['nazarSpread', 'nazar'],
  ['nazarSpawned', 'nazar'],
  ['catMoved', 'cat'],
  ['catPetted', 'cat'],
  ['gullLanded', 'gull'],
  ['gateLit', 'lantern'],
  ['current', 'current'],
  ['haggleWon', 'haggleWin'],
  ['haggleLost', 'haggleLose'],
];

export function soundForEvents(events: readonly GameEvent[]): SoundName | null {
  const hit = EVENT_SOUNDS.find(([event]) => events.includes(event));
  return hit === undefined ? null : hit[1];
}

/**
 * Bir hamlenin hangi sesi tetikleyecegini belirler.
 *
 * Saf fonksiyon: store'a bagli degil, dolayisiyla ses secim kurali ses
 * aygiti calistirmadan test edilebiliyor.
 *
 * Oncelik sirasi (ustteki alttakini bastirir): gecersiz > oyun sonu > rekor >
 * makam tamamlandi > Cini > combo > seviye > canli olay > temizleme (makam
 * acikken serinin notasi) > yerlestirme. Rekor ve Cini nadir ve buyuk
 * anlardir; ayni hamlede baska bir sey de olsa onlar duyulmali.
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
  if (after.status === 'won') {
    return 'record';
  }
  if (crossedRecord(before, after, ctx)) {
    return 'record';
  }
  if (after.events.includes('makamComplete')) {
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
  const live = soundForEvents(after.events);
  if (live !== null) {
    return live;
  }
  if (lines === 1) {
    // Makam: her ardisik temizleme melodinin bir sonraki notasini calar.
    return after.rules.makam ? noteForStreak(after.comboStreak) : 'clear';
  }
  return 'place';
}
