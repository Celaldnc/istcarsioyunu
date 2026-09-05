import { LEVELS, type LevelSpec, type Objective } from '@/game/core/levels';

/**
 * Istanbul Yolculugu — sunum verisi (ad, aciklama, kartpostal).
 * Kural verisi core/levels.ts'te; ikisi id ile eslesir (test korur).
 */

export interface District {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  /** Kartpostal gorseli (emoji) ve zemin rengi. */
  readonly emoji: string;
  readonly color: string;
}

export const DISTRICTS: readonly District[] = [
  {
    id: 'eminonu',
    name: 'Eminönü',
    subtitle: 'Simitçiler, vapur düdüğü',
    emoji: '⛴️',
    color: '#1E6FA8',
  },
  {
    id: 'misir-carsisi',
    name: 'Mısır Çarşısı',
    subtitle: 'Baharat ve lokum kokusu',
    emoji: '🌶️',
    color: '#C4557F',
  },
  {
    id: 'kapalicarsi',
    name: 'Kapalıçarşı',
    subtitle: 'Çini ve halı ustaları',
    emoji: '🏺',
    color: '#C6803A',
  },
  { id: 'galata', name: 'Galata', subtitle: 'Kulenin gölgesinde', emoji: '🗼', color: '#5F7F3A' },
  { id: 'bogaz', name: 'Boğaz', subtitle: 'İki yaka, bir köprü', emoji: '🌉', color: '#7A5C3E' },
  {
    id: 'kiz-kulesi',
    name: 'Kız Kulesi',
    subtitle: 'Martılar ve deniz',
    emoji: '🕊️',
    color: '#4E8A3C',
  },
  {
    id: 'kadikoy',
    name: 'Kadıköy',
    subtitle: 'Kediler, sokaklar, nazar',
    emoji: '🐈',
    color: '#A83C28',
  },
];

export function districtById(id: string): District | undefined {
  return DISTRICTS.find((d) => d.id === id);
}

/** Hedefin Turkce aciklamasi. */
export function objectiveText(objective: Objective): string {
  switch (objective.kind) {
    case 'score':
      return `${objective.target} puan yap`;
    case 'lines':
      return `${objective.target} çizgi temizle`;
    case 'cini':
      return `${objective.target} Çini yap`;
    case 'synergy':
      return `${objective.target} sinerji kur`;
    case 'bridge':
      return `${objective.target} köprü kur`;
  }
}

/** Seviye acik mi: ilk seviye veya bir oncekinin kartpostali alinmis. */
export function isLevelUnlocked(level: LevelSpec, postcards: readonly string[]): boolean {
  const index = LEVELS.findIndex((l) => l.id === level.id);
  if (index <= 0) {
    return true;
  }
  const previous = LEVELS[index - 1];
  return previous !== undefined && postcards.includes(previous.id);
}

/** Kural verisi olmayan semt / semti olmayan seviye (test kullanir). */
export function journeyMismatches(): string[] {
  const levelIds = new Set(LEVELS.map((l) => l.id));
  const districtIds = new Set(DISTRICTS.map((d) => d.id));
  return [
    ...[...levelIds].filter((id) => !districtIds.has(id)),
    ...[...districtIds].filter((id) => !levelIds.has(id)),
  ];
}
