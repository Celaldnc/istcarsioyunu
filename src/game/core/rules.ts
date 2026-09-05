import { CURRENT, HAGGLE, ROLES, TEA_BREAK } from '@/constants/config';

/**
 * Oyun kurallari — hangi "canli" ogelerin acik oldugu ve esnaf perk'leri.
 *
 * Kurallar DURUMUN parcasidir ama KAYDA yazilmaz: mode + esnafId'den yeniden
 * turetilir (rulesFor). Boylece bir perk degeri ayarlandiginda eski kayitlar
 * eski degerle kalmaz.
 */

export type GameMode = 'classic' | 'canli' | 'daily' | 'journey';

export interface GameRules {
  /** Tahtada uyuyan kedi (Tekir) var mi? */
  readonly cat: boolean;
  /** Marti gelir mi? */
  readonly gull: boolean;
  /** Marti kac hamlede bir gelir (Balikci perk'i sikligi artirir). */
  readonly gullEvery: number;
  /** Nazar laneti var mi? */
  readonly nazar: boolean;
  /** Esya sinerjileri (kahvalti, fistikli lokum) puan verir mi? */
  readonly synergies: boolean;
  /** Ilk kac tepsi "kolay" gelir (Simitci perk'i). */
  readonly starterTrays: number;
  /** Oyun basina cay molasi hakki (Cayci perk'i). */
  readonly teaBreaks: number;
  /** Cini bonusu carpani (Halici perk'i). */
  readonly ciniMultiplier: number;
  /** Martiya simit atma bonusu carpani (Balikci perk'i). */
  readonly simitBonusMultiplier: number;
  /** Oyun basina pazarlik hakki. */
  readonly haggles: number;
  /** Makam serisi (ardisik temizlemede melodi) acik mi? */
  readonly makam: boolean;
  /** Bogaz tahtasi: su seridini asan satir "Kopru" bonusu verir. */
  readonly bridge: boolean;
  /**
   * Kapalicarsi kapilari: kenar cizgileri (ust/alt/sol/sag) temizlenince
   * o kapinin feneri yanar; dordu de yaninca "Carsi Senligi" (puan x2).
   */
  readonly gates: boolean;
  /** Bogaz akintisi: satirlar duzenli olarak bir hucre kayar. */
  readonly current: boolean;
  readonly currentEvery: number;
}

/** Saf Block Blast: hicbir canli oge yok. */
export const CLASSIC_RULES: GameRules = {
  cat: false,
  gull: false,
  gullEvery: 12,
  nazar: false,
  synergies: false,
  starterTrays: 1,
  teaBreaks: TEA_BREAK.PER_GAME,
  ciniMultiplier: 1,
  simitBonusMultiplier: 1,
  haggles: 0,
  makam: true,
  bridge: false,
  gates: false,
  current: false,
  currentEvery: CURRENT.EVERY,
};

/** "Canli Carsi": her sey acik. */
export const CANLI_RULES: GameRules = {
  ...CLASSIC_RULES,
  cat: true,
  gull: true,
  nazar: true,
  synergies: true,
  haggles: HAGGLE.PER_GAME,
  gates: true,
};

/**
 * Esnaf perk'leri. Adlar/replikler data katmaninda (data/esnaflar.ts);
 * burada yalnizca kurala etki eden sayilar var.
 */
export const ESNAF_PERKS: Readonly<Record<string, Partial<GameRules>>> = {
  simitci: { starterTrays: 3 },
  cayci: { teaBreaks: TEA_BREAK.PER_GAME + 1 },
  halici: { ciniMultiplier: 2 },
  balikci: { gullEvery: 6, simitBonusMultiplier: 2 },
};

/** Varsayilan: perk'siz cirak. Perk'li esnaflar kartpostallarla acilir. */
export const DEFAULT_ESNAF_ID = 'cirak';

export interface RuleSource {
  readonly mode: GameMode;
  readonly esnafId: string;
  /** Yolculuk seviyesinin kural ustune yazmalari. */
  readonly overrides?: Partial<GameRules>;
}

/** mode + esnaf (+ seviye) -> kurallar. Bilinmeyen esnaf perk'siz sayilir. */
export function rulesFor({ mode, esnafId, overrides }: RuleSource): GameRules {
  const base = mode === 'classic' || mode === 'daily' ? CLASSIC_RULES : CANLI_RULES;
  // Daily herkes icin ayni olmali: perk'ler gunluk modda uygulanmaz.
  const perks = mode === 'daily' ? {} : (ESNAF_PERKS[esnafId] ?? {});
  return { ...base, ...perks, ...overrides };
}

/** Tema esya rolleri: sinerji ve marti kurallari bu renk kimliklerine bakar. */
export const ROLE_COLORS = ROLES;
