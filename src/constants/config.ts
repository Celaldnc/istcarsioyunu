/**
 * Oyunun tum sayisal sabitleri.
 *
 * Kural (Definition of Done #6): kod icinde magic number yasak.
 * Bir sayiyi degistirmek isteyen sadece bu dosyayi duzenler.
 */

export const BOARD = {
  /** Yatay hucre sayisi (portre mod) */
  COLS: 8,
  /** Dikey hucre sayisi */
  ROWS: 10,
  /** Tek hucrenin piksel kenari */
  CELL_SIZE: 40,
  /** Hucreler arasi bosluk (piksel) */
  CELL_GAP: 2,
} as const;

export const TRAY = {
  /** Ayni anda oyuncuya sunulan parca sayisi */
  PIECE_COUNT: 3,
} as const;

export const SCORING = {
  /** Temizlenen her satir/sutun icin taban puan */
  POINTS_PER_LINE: 10,
  /** Tray'deki 3 parcanin tamami kullanilinca verilen bonus */
  PERFECT_CLEAR_BONUS: 100,
} as const;

export const TIME_ATTACK = {
  /** Time Attack modunun sure limiti (saniye) */
  DURATION_SECONDS: 90,
} as const;
