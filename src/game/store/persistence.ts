import type { KeyValueStore } from './storage';

import type { GameState } from '@/game/core/game';
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
} as const;

export interface Settings {
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = { soundEnabled: true, hapticsEnabled: true };

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
    const { soundEnabled, hapticsEnabled } = parsed as Partial<Settings>;
    return {
      soundEnabled: typeof soundEnabled === 'boolean' ? soundEnabled : true,
      hapticsEnabled: typeof hapticsEnabled === 'boolean' ? hapticsEnabled : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(store: KeyValueStore, settings: Settings): void {
  store.set(KEYS.settings, JSON.stringify(settings));
}
