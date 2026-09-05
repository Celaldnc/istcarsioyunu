/**
 * Oyunun tum sayisal sabitleri.
 *
 * Kural (Definition of Done #6): kod icinde magic number yasak.
 * Bir sayiyi degistirmek isteyen sadece bu dosyayi duzenler.
 * Renk sabitleri icin bkz. constants/Colors.ts
 */

export const BOARD = {
  /** Yatay hucre sayisi (portre mod) */
  COLS: 8,
  /** Dikey hucre sayisi */
  ROWS: 10,
  /**
   * Hucre kenarinin UST SINIRI (dp).
   *
   * Sabit 40dp kullanilamaz: 8 * 40 + 7 * 2 = 334dp, dar cihazlarda
   * (320dp genislik) tasar. Gercek hucre boyutu Sprint 2'de kullanilabilir
   * ekran genisliginden turetilecek, bu deger yalnizca tavandir.
   */
  MAX_CELL_SIZE: 40,
  /** Hucreler arasi bosluk (dp) */
  CELL_GAP: 2,
  /** Tahtanin ekran kenarina birakacagi bosluk (dp, tek taraf) */
  SCREEN_MARGIN: 8,
  /** Hucre kosesinin yuvarlaklik yaricapi (dp) */
  CELL_RADIUS: 6,
} as const;

export const LAYOUT = {
  /** Desteklenen en dar ekran (dp). Tahta bu genislikte tasmadan sigmali. */
  MIN_SUPPORTED_WIDTH: 320,
  /** Hucrenin dokunulabilir/oynanabilir kaldigi alt sinir (dp) */
  MIN_PLAYABLE_CELL_SIZE: 32,
} as const;

export const PIECES = {
  /**
   * En genis parcanin kapladigi hucre sayisi (bir kenarda).
   * Spec'teki sekiller: 1x1, 1x2, 2x2, L, T, S, Z, + -> en genisi 3.
   * Sekillerin kendisi Sprint 1'de pieces.ts'te tanimlanacak.
   */
  MAX_SPAN: 3,
} as const;

export const THEME = {
  /**
   * Bir temadaki farkli blok gorseli sayisi (simit, caydanlik, nazar...).
   * Parca renk kimlikleri 0..PALETTE_SIZE-1 araligindadir.
   * Temalarin kendisi Sprint 5'te game/data/themes.ts icinde tanimlanacak.
   */
  PALETTE_SIZE: 6,
} as const;

export const TRAY = {
  /** Ayni anda oyuncuya sunulan parca sayisi */
  PIECE_COUNT: 3,
  /** Tepsideki onizleme hucrelerinin ust siniri (dp) */
  MAX_CELL_SIZE: 22,
  /** Tepsi hucreleri arasi bosluk (dp) */
  CELL_GAP: 2,
  /** Iki parca yuvasi arasindaki bosluk (dp) */
  SLOT_GAP: 12,
} as const;

export const SCORING = {
  /** Temizlenen her satir/sutun icin taban puan */
  POINTS_PER_LINE: 10,
  /** Tray'deki tum parcalar kullanilinca verilen bonus */
  PERFECT_CLEAR_BONUS: 100,
} as const;

export const TIME_ATTACK = {
  /** Time Attack modunun sure limiti (saniye) */
  DURATION_SECONDS: 90,
} as const;
