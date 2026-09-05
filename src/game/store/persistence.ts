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
}

export const EMPTY_JOURNEY: JourneyProgress = { postcards: [] };

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
    const { postcards } = parsed as Partial<JourneyProgress>;
    if (!Array.isArray(postcards)) {
      return EMPTY_JOURNEY;
    }
    return { postcards: postcards.filter((id): id is string => typeof id === 'string') };
  } catch {
    return EMPTY_JOURNEY;
  }
}

/** Kartpostali ekler (tekrar vermez) ve guncel ilerlemeyi dondurur. */
export function awardPostcard(store: KeyValueStore, levelId: string): JourneyProgress {
  const current = loadJourney(store);
  if (current.postcards.includes(levelId)) {
    return current;
  }
  const next = { postcards: [...current.postcards, levelId] };
  store.set(KEYS.journey, JSON.stringify(next));
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
