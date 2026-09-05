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
  /** Tahta ile parca tepsisi arasindaki dikey bosluk (dp) */
  BOARD_TRAY_GAP: 24,
} as const;

export const PIECES = {
  /**
   * En genis parcanin kapladigi hucre sayisi (bir kenarda).
   * Spec'teki sekiller: 1x1, 1x2, 2x2, L, T, S, Z, + -> en genisi 3.
   * Sekillerin kendisi Sprint 1'de pieces.ts'te tanimlanacak.
   */
  MAX_SPAN: 3,
  /**
   * Tepside bir parcanin bir onceki parcanin RENGINI alma olasiligi.
   *
   * Renk bagimsiz secilseydi tek renkli bir satir kurmak (Cini bonusu)
   * pratikte imkansiz olurdu: 6 renkte 8 hucrelik satir icin oyuncunun
   * elinde ayni renkten parca neredeyse hic birikmezdi. Yapiskan renk,
   * rengi bir STRATEJI boyutu yapar; kalan olasilik tum paletten esit secilir.
   */
  COLOR_STICKINESS: 0.45,
} as const;

export const TEA_BREAK = {
  /**
   * Oyun basina "Cay molasi" (devam) hakki. Rakiplerde bu hak reklam
   * karsiligi verilir; burada ucretsiz ve sinirli.
   */
  PER_GAME: 1,
  /** Molada bosaltilan en dolu satir sayisi */
  ROWS: 2,
  /** Molada bosaltilan en dolu sutun sayisi */
  COLS: 2,
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

export const DRAG = {
  /**
   * Parcanin parmagin kac HUCRE ustunde durdugu.
   * 0 olsaydi parmak tam da birakilacak alani kapatirdi.
   */
  LIFT: 1.5,
} as const;

export const LEVEL = {
  /** Bir seviye atlamak icin gereken puan. */
  POINTS_PER_LEVEL: 400,
  /**
   * En yuksek seviye. Zorluk burada tavan yapar; sonsuza kadar artmasi
   * oyunu oynanamaz kilardi.
   */
  MAX: 10,
} as const;

export const SCORING = {
  /** Temizlenen her satir/sutun icin taban puan */
  POINTS_PER_LINE: 10,
  /** Tray'deki tum parcalar kullanilinca verilen bonus */
  PERFECT_CLEAR_BONUS: 100,
  /**
   * Tek renkli bir cizgi ("Cini") temizlendiginde cizgi basina bonus.
   *
   * Block Blast'ta renk sustur; burada rengi dusunmek puan getirir. Bonus,
   * tek cizgi puaninin (10) belirgin ustunde ki hedeflemeye deger olsun.
   */
  CINI_BONUS: 50,
} as const;

export const COMBO = {
  /**
   * Ardisik temizleme serisinde her adimda carpana eklenen deger.
   *
   * "Ayni anda 2+ cizgi" combo'su olcumde 48 hamlede 1 tetikleniyordu.
   * Hamlelerin ~%25'i tek cizgi temizledigi icin SERI combo'su cok daha sik
   * kuruluyor ve zincir kurmayi odullendiriyor.
   *
   * Carpan degerleri kesirli olabilir; bu yuzden SCORING'den ayri duruyor
   * (orada tum degerlerin tamsayi olmasi bir invariant).
   */
  STREAK_STEP: 0.5,
  /** Seri carpaninin tavani. */
  MAX_STREAK_MULTIPLIER: 4,
} as const;

export const TIME_ATTACK = {
  /** Time Attack modunun sure limiti (saniye) */
  DURATION_SECONDS: 90,
} as const;
