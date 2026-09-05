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

/**
 * Esya rolleri: hangi renk kimligi hangi esya. Sinerji (simit+cay),
 * marti (simit) ve nazar korumasi bu indekslere bakar; her temanin
 * `sprites` listesi bu sirayi izlemek ZORUNDA (test korur).
 */
export const ROLES = {
  SIMIT: 0,
  CAY: 1,
  NAZAR: 2,
  LOKUM: 3,
  FISTIK: 4,
  BAKIR: 5,
} as const;

export const CAT = {
  /** Oksanan kedi kac hamle yerinden kalkmaz. */
  REST_TURNS: 3,
  /** Her kacinci oksamada Tekir hediye getirir (fare!). */
  GIFT_EVERY: 3,
  /** Hediye: kac dolu hucre bosalir. */
  GIFT_CELLS: 3,
} as const;

export const GATES = {
  /** Dort kapi da yandiginda senlik kac hamle surer. */
  FESTIVAL_TURNS: 3,
  /** Senlikte puan carpani. */
  FESTIVAL_MULTIPLIER: 2,
} as const;

export const CURRENT = {
  /** Bogaz akintisi: kac hamlede bir satirlar bir hucre kayar. */
  EVERY: 5,
} as const;

export const GULL = {
  /** Konduktan kac hamle sonra dalar. */
  PERCH_TURNS: 2,
  /** Simit atma bonusu. */
  FEED_BONUS: 30,
} as const;

export const NAZAR = {
  /** Lanetli hucre kac hamle sonra yayilir. */
  SPREAD_TURNS: 6,
  /** Lanetli hucre temizlenince bonus. */
  CLEAR_BONUS: 60,
  /** Her hamlede yeni nazar dogma olasiligi (dolu hucre varsa). */
  SPAWN_CHANCE: 0.06,
  /** Tahtada ayni anda en fazla kac lanet olabilir. */
  MAX_ACTIVE: 2,
} as const;

export const SYNERGY = {
  /** Sinerji cifti basina bonus (kahvalti, fistikli lokum). */
  PAIR_BONUS: 40,
} as const;

export const MAKAM = {
  /** Melodinin nota sayisi; seri bu sayiya ulasinca "makam tamamlandi". */
  NOTES: 8,
  /** Makam tamamlama bonusu. */
  COMPLETE_BONUS: 100,
} as const;

export const HAGGLE = {
  /** Oyun basina pazarlik hakki. */
  PER_GAME: 3,
  /** Basarisiz pazarligin bedeli (puan). */
  FAIL_PENALTY: 30,
  /** Ibrenin bir tur salinim suresi (ms). */
  SWEEP_MS: 900,
  /** Yesil bolgenin ibre yolundaki payi (0-1). */
  TARGET_WIDTH: 0.22,
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
  /**
   * Tepsideki onizleme hucrelerinin ust siniri (dp).
   * 22'de esya glifleri secilemiyordu; 26 = SPRITE.DETAIL_MIN_SIZE, yani
   * tepside de detay cizilir.
   */
  MAX_CELL_SIZE: 26,
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
  /**
   * Bogaz tahtasinda (ortada su seridi) iki yakayi birden tamamlayan satir
   * "Kopru" kurar; satir basina bonus.
   */
  BRIDGE_BONUS: 50,
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

export const SPRITE = {
  /**
   * Hucre kenari bunun altindaysa ince detaylar (susam, pudra, cekic izi)
   * cizilmez: 22px'lik tepsi onizlemesinde 1px'lik nokta gurultu olur.
   */
  DETAIL_MIN_SIZE: 26,
  /** Ust parlaklik seridi (blok "kabarik" dursun) */
  GLOSS_OPACITY: 0.1,
  /** Alt golge seridi */
  SHADOW_OPACITY: 0.12,
} as const;

export const FX = {
  /** Esnaf baloncugunun ekranda kalma suresi (ms). */
  ESNAF_SHOW_MS: 2600,
  /** Baloncugun acilis/kapanis gecis suresi (ms). */
  ESNAF_FADE_MS: 220,
  /** "+40" ucan puan yazisinin omru (ms). */
  GAIN_FLOAT_MS: 900,
  /** Temizleme patlamasinin (parcacik + cizgi parlamasi) suresi (ms). */
  CLEAR_BURST_MS: 650,
  /** Temizlenen her hucre icin ucan parcacik sayisi. */
  PARTICLES_PER_CELL: 2,
  /**
   * Tek patlamadaki parcacik tavani. Her parcacik Skia'da ayri bir cizim ve
   * Reanimated'da ayri turetilmis deger; 3 cizgilik combo'da bile 60 FPS
   * korunsun diye sinirli.
   */
  MAX_PARTICLES: 64,
} as const;

export const TIME_ATTACK = {
  /** Time Attack modunun sure limiti (saniye) */
  DURATION_SECONDS: 90,
} as const;
