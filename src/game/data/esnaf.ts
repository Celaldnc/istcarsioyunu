import { crossedRecord, type MoveContext } from '@/game/audio/cues';
import { countFilledCells, isBoardEmpty } from '@/game/core/board';
import type { GameState } from '@/game/core/game';
import { levelForScore } from '@/game/core/level';

import { BOARD } from '@/constants/config';

/**
 * Carsi esnafi: oyuncunun hamlelerine tepki veren karakter.
 *
 * Blok bulmaca turunde karakter yok; bu, oyunun en ucuz ve en akilda kalici
 * farkidir. Replikler VERI olarak burada yasar; secim kurali saf fonksiyon
 * (esnafEventForMove) oldugu icin React olmadan test edilir.
 *
 * Tasarim kurali: esnaf her hamlede konusmaz. Siradan yerlestirme ve tek
 * temizleme SESSIZ; aksi halde replikler gurultuye doner ve oyuncu okumayi
 * birakir. Yalnizca "an" olan olaylarda konusur.
 */

export const ESNAF_EVENTS = [
  'start',
  'streak',
  'combo',
  'cini',
  'perfectClear',
  'levelUp',
  'record',
  'nearDeath',
  'gameOver',
  'teaBreak',
] as const;

export type EsnafEvent = (typeof ESNAF_EVENTS)[number];

export const ESNAF_LINES: Readonly<Record<EsnafEvent, readonly string[]>> = {
  start: [
    'Hoş geldin! Tezgâh senin.',
    'Hadi bakalım, çarşı açıldı!',
    'Buyur gel, en güzeli bizde.',
    'Çayını al, başlıyoruz.',
  ],
  streak: [
    'Bu ne güzel dizilim!',
    'Devam, elin alıştı!',
    'Seri kurdun, bozma!',
    'Maşallah, akıyor!',
  ],
  combo: [
    'Çarşı ayağa kalktı!',
    'İki dolu tezgâh birden!',
    'Vay be, ne temizlik!',
    'Böyle işte, böyle!',
  ],
  cini: [
    'Çini gibi! Tek renk, tam iş!',
    'İznik çinisi gibi dizmişsin!',
    'Bak sen, hepsi aynı renk!',
    'Usta işi bu, çini bonusu!',
  ],
  perfectClear: [
    'Tezgâh tertemiz! Kapatıyoruz!',
    'Tahtayı sildin süpürdün!',
    'Bomboş! Kapalıçarşı seninle gurur duyuyor.',
  ],
  levelUp: [
    'Bir üst sokağa geçtin!',
    'Seviye atladın, çay benden!',
    'Vapur kalktı, yeni semt!',
    'Zorlaşıyor, dikkat!',
  ],
  record: [
    'YENİ REKOR! Çarşı konuşuyor!',
    'Rekor kırdın, herkes duysun!',
    'Bu tezgâh tarih yazdı!',
  ],
  nearDeath: ['Sıkıştın mı? Çay hazır.', 'Yer daralıyor, dikkat.', 'Ufak parça bekle, sabır.'],
  gameOver: [
    'Kepenk kapandı. Yarın yine gel!',
    'Olur öyle, çarşı yarın da açık.',
    'İyi oynadın, bir çay iç.',
    'Tezgâh doldu; yeni gün, yeni tezgâh.',
  ],
  teaBreak: [
    'Çay molası! Biraz yer açtım.',
    'Al bir nefes, tezgâhı topladım.',
    'Çay içtik, devam!',
  ],
};

/**
 * Olay icin replik secer. Ayni tuz ayni repligi verir; boylece UI'da
 * yeniden render replik degistirmez ve testler deterministik kalir.
 */
export function esnafLine(event: EsnafEvent, salt: number): string {
  const lines = ESNAF_LINES[event];
  const safeSalt = Number.isFinite(salt) ? Math.abs(Math.trunc(salt)) : 0;
  // lines her olay icin en az iki eleman icerir (test bunu korur).
  return lines[safeSalt % lines.length] ?? lines[0] ?? '';
}

/** Tahtada bu kadar veya daha az bosluk kalinca esnaf uyarir. */
const NEAR_DEATH_EMPTY_CELLS = 12;

/**
 * Bir hamlenin esnafi konusturup konusturmayacagina karar verir.
 *
 * Oncelik: oyun sonu > cay molasi > rekor > perfect clear > Cini > combo >
 * seviye > seri > sikisma. Siradan yerlestirme ve tek temizlemede null.
 */
export function esnafEventForMove(
  before: GameState,
  after: GameState,
  ctx: MoveContext,
): EsnafEvent | null {
  if (after === before) {
    return null;
  }
  if (after.status === 'gameOver') {
    return 'gameOver';
  }
  if (before.status === 'gameOver') {
    return 'teaBreak';
  }
  if (crossedRecord(before, after, ctx)) {
    return 'record';
  }

  const lines = after.lastClear.rows.length + after.lastClear.cols.length;
  if (lines > 0 && isBoardEmpty(after.board)) {
    return 'perfectClear';
  }
  if (after.lastCini.rows.length + after.lastCini.cols.length > 0) {
    return 'cini';
  }
  if (lines >= 2) {
    return 'combo';
  }
  if (levelForScore(after.score) > levelForScore(before.score)) {
    return 'levelUp';
  }
  if (lines === 1 && after.comboStreak >= 2) {
    return 'streak';
  }

  const emptyCells = BOARD.COLS * BOARD.ROWS - countFilledCells(after.board);
  if (lines === 0 && emptyCells <= NEAR_DEATH_EMPTY_CELLS) {
    return 'nearDeath';
  }

  return null;
}
