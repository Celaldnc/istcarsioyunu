import type { KeyValueStore } from './storage';

import type { GameState } from '@/game/core/game';
import { DEFAULT_ESNAF_ID } from '@/game/core/rules';
import { EMPTY_STATS, type LifetimeStats } from '@/game/core/titles';
import { deserializeGame, serializeGame } from '@/game/core/save';

/**
 * Kalicilik politikasi.
 *
 * Tum fonksiyonlar depoyu PARAMETRE olarak alir; boylece hem gercek MMKV hem
 * de bellek deposuyla ayni kod calisir ve testler native modul gerektirmez.
 *
 * Genel kural: okuma asla firlatmaz. Bozuk veya eski bir kayit, oyunu
 * cokertmek yerine "kayit yok" olarak degerlendirilir.
 */

const KEYS = {
  game: 'game.current',
  highScore: 'score.high',
  settings: 'settings',
  journey: 'journey',
  stats: 'stats',
  daily: 'daily',
} as const;

export interface Settings {
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
  /** Secili esnaf karakteri. */
  readonly esnafId: string;
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  esnafId: DEFAULT_ESNAF_ID,
};

export function saveGame(store: KeyValueStore, state: GameState): void {
  store.set(KEYS.game, serializeGame(state));
}

export function loadGame(store: KeyValueStore): GameState | null {
  const raw = store.getString(KEYS.game);
  return raw === undefined ? null : deserializeGame(raw);
}

export function clearGame(store: KeyValueStore): void {
  store.delete(KEYS.game);
}

export function loadHighScore(store: KeyValueStore): number {
  const raw = store.getString(KEYS.highScore);
  if (raw === undefined) {
    return 0;
  }
  const value = Number(raw);
  // Bozuk deger yuksek skoru sonsuza kadar erisilmez yapmasin.
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Yuksek skoru yalnizca gercekten asildiysa gunceller.
 * Kaydedilen degeri dondurur, boylece cagiran taraf yeni rekoru gosterebilir.
 */
export function recordScore(store: KeyValueStore, score: number): number {
  const best = loadHighScore(store);
  if (score <= best) {
    return best;
  }
  store.set(KEYS.highScore, String(score));
  return score;
}

export function loadSettings(store: KeyValueStore): Settings {
  const raw = store.getString(KEYS.settings);
  if (raw === undefined) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_SETTINGS;
    }
    // Eksik veya bozuk alan varsayilana duser; eski kayitlar (yalnizca ses
    // alani olan) boylece kayipsiz okunur.
    const { soundEnabled, hapticsEnabled, esnafId } = parsed as Partial<Settings>;
    return {
      soundEnabled: typeof soundEnabled === 'boolean' ? soundEnabled : true,
      hapticsEnabled: typeof hapticsEnabled === 'boolean' ? hapticsEnabled : true,
      esnafId: typeof esnafId === 'string' && esnafId.length > 0 ? esnafId : DEFAULT_ESNAF_ID,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(store: KeyValueStore, settings: Settings): void {
  store.set(KEYS.settings, JSON.stringify(settings));
}

// --- Yolculuk: kazanilan kartpostallar ---------------------------------------

export interface JourneyProgress {
  /** Kazanilan kartpostallarin semt kimlikleri. */
  readonly postcards: readonly string[];
  /** Semt basina en iyi skor. */
  readonly bestScores: Readonly<Record<string, number>>;
}

export const EMPTY_JOURNEY: JourneyProgress = { postcards: [], bestScores: {} };

function parseBestScores(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, n] of Object.entries(value as Record<string, unknown>)) {
    if (typeof n === 'number' && Number.isFinite(n) && n >= 0) {
      out[key] = n;
    }
  }
  return out;
}

export function loadJourney(store: KeyValueStore): JourneyProgress {
  const raw = store.getString(KEYS.journey);
  if (raw === undefined) {
    return EMPTY_JOURNEY;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return EMPTY_JOURNEY;
    }
    const { postcards, bestScores } = parsed as Partial<JourneyProgress>;
    return {
      postcards: Array.isArray(postcards)
        ? postcards.filter((id): id is string => typeof id === 'string')
        : [],
      bestScores: parseBestScores(bestScores),
    };
  } catch {
    return EMPTY_JOURNEY;
  }
}

/** Kartpostali ekler (tekrar vermez), semt rekorunu gunceller. */
export function awardPostcard(store: KeyValueStore, levelId: string, score = 0): JourneyProgress {
  const current = loadJourney(store);
  const best = current.bestScores[levelId] ?? 0;
  const next: JourneyProgress = {
    postcards: current.postcards.includes(levelId)
      ? current.postcards
      : [...current.postcards, levelId],
    bestScores: score > best ? { ...current.bestScores, [levelId]: score } : current.bestScores,
  };
  store.set(KEYS.journey, JSON.stringify(next));
  return next;
}

// --- Gunun Carsisi: bugunun en iyisi ---------------------------------------

export interface DailyRecord {
  /** YYYY-MM-DD (UTC; seed ile ayni takvim). */
  readonly date: string;
  readonly best: number;
}

/** UTC gun anahtari: seedFromDate ile ayni gunu paylasir. */
export function dailyKey(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${m}-${d}`;
}

export function loadDaily(store: KeyValueStore, today: Date): DailyRecord | null {
  const raw = store.getString(KEYS.daily);
  if (raw === undefined) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    const { date, best } = parsed as Partial<DailyRecord>;
    if (typeof date !== 'string' || typeof best !== 'number' || !Number.isFinite(best)) {
      return null;
    }
    // Dunku kayit bugun anlamsiz; sessizce yok sayilir.
    return date === dailyKey(today) ? { date, best } : null;
  } catch {
    return null;
  }
}

/** Bugunun en iyisini yalnizca asildiysa gunceller; guncel kaydi dondurur. */
export function recordDaily(store: KeyValueStore, today: Date, score: number): DailyRecord {
  const current = loadDaily(store, today);
  if (current !== null && score <= current.best) {
    return current;
  }
  const next = { date: dailyKey(today), best: score };
  store.set(KEYS.daily, JSON.stringify(next));
  return next;
}

// --- Omur boyu istatistik ----------------------------------------------------

export function loadStats(store: KeyValueStore): LifetimeStats {
  const raw = store.getString(KEYS.stats);
  if (raw === undefined) {
    return EMPTY_STATS;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return EMPTY_STATS;
    }
    const out: Record<string, number> = {};
    for (const key of Object.keys(EMPTY_STATS) as (keyof LifetimeStats)[]) {
      const n = (parsed as Record<string, unknown>)[key];
      // Eksik/bozuk alan sifira duser; digerleri korunur.
      out[key] = typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : 0;
    }
    return out as unknown as LifetimeStats;
  } catch {
    return EMPTY_STATS;
  }
}

export function saveStats(store: KeyValueStore, stats: LifetimeStats): void {
  store.set(KEYS.stats, JSON.stringify(stats));
}
