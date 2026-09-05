import { DEFAULT_ESNAF_ID, ESNAF_PERKS } from '@/game/core/rules';

/**
 * Esnaf karakterleri: oyuncunun "kim olarak" oynadigi.
 *
 * Perk sayilari core/rules.ts'te (kurala etki eder); burada ad, tanitim ve
 * kilit acma sarti var. Kilit: kartpostal koleksiyonundan (Yolculuk).
 */

export interface Esnaf {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  /** Tek cumlelik perk aciklamasi (ayarlar/secim ekrani). */
  readonly perkText: string;
  /** Acilmasi icin kazanilmasi gereken kartpostalin semt kimligi; null = acik. */
  readonly unlockLevelId: string | null;
}

export const ESNAFLAR: readonly Esnaf[] = [
  {
    id: DEFAULT_ESNAF_ID,
    name: 'Çırak',
    emoji: '🧢',
    perkText: 'Perk yok. Çarşıyı öğreniyor.',
    unlockLevelId: null,
  },
  {
    id: 'simitci',
    name: 'Simitçi Hasan',
    emoji: '🥯',
    perkText: 'İlk 3 tepsi kolay gelir.',
    unlockLevelId: 'eminonu',
  },
  {
    id: 'cayci',
    name: 'Çaycı Nuri',
    emoji: '🫖',
    perkText: 'Oyun başına 2 çay molası.',
    unlockLevelId: 'kapalicarsi',
  },
  {
    id: 'halici',
    name: 'Halıcı Sabri',
    emoji: '🧶',
    perkText: 'Çini bonusu iki kat.',
    unlockLevelId: 'galata',
  },
  {
    id: 'balikci',
    name: 'Balıkçı Cemal',
    emoji: '🐟',
    perkText: 'Martı sık gelir, simit bonusu iki kat.',
    unlockLevelId: 'kiz-kulesi',
  },
];

export function esnafById(id: string): Esnaf | undefined {
  return ESNAFLAR.find((esnaf) => esnaf.id === id);
}

/** Verilen kartpostallarla (semt kimlikleri) hangi esnaflar acik? */
export function isEsnafUnlocked(esnaf: Esnaf, postcards: readonly string[]): boolean {
  return esnaf.unlockLevelId === null || postcards.includes(esnaf.unlockLevelId);
}

/** Her perk'li esnafin karakter verisi oldugunu dogrular (test kullanir). */
export function perksWithoutCharacter(): string[] {
  return Object.keys(ESNAF_PERKS).filter((id) => esnafById(id) === undefined);
}
