import { create } from 'zustand';

import {
  loadGame,
  loadHighScore,
  loadSettings,
  recordScore,
  saveGame,
  saveSettings,
} from './persistence';
import { getAppStore } from './storage';

import { getSoundManager } from '@/game/audio';
import { cueForMove } from '@/game/audio/cues';
import { playPiece, restart, startGame, type GameState } from '@/game/core/game';
import { seedFromDate } from '@/game/core/rng';
import type { Point } from '@/game/core/types';

/**
 * Oyun durumunun React'e baglanmasi.
 *
 * Bu dosya BILEREK ince: tum kurallar src/game/core/game.ts icindeki saf
 * reducer'da, kalicilik politikasi persistence.ts'te, ses secimi cues.ts'te.
 * Store yalnizca bunlari birbirine bagliyor.
 */

export interface GameStore extends GameState {
  readonly highScore: number;
  readonly soundEnabled: boolean;

  /** Yeni oyun baslatir. Seed verilmezse gunun tarihinden turetilir. */
  newGame: (seed?: number) => void;
  /** Parcayi oynar; hamle kabul edilmediyse false doner. */
  play: (trayIndex: number, origin: Point) => boolean;
  /** Ayni seed ile bastan baslar. */
  playAgain: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  /** Durumu hemen diske yazar (uygulama arka plana dusunce). */
  persistNow: () => void;
}

/**
 * Acilista kaydedilmis oyun varsa ondan devam edilir.
 * Bozuk kayit null doner ve sessizce yeni oyun baslar.
 */
function initialGame(): GameState {
  return loadGame(getAppStore()) ?? startGame(seedFromDate(new Date()));
}

export const useGameStore = create<GameStore>((set, get) => {
  const storage = getAppStore();
  const settings = loadSettings(storage);
  const sound = getSoundManager();
  sound.setEnabled(settings.soundEnabled);
  // Ilk hamlede gecikme olmasin diye sesler simdiden bellege alinir.
  sound.preload();

  return {
    ...initialGame(),
    highScore: loadHighScore(storage),
    soundEnabled: settings.soundEnabled,

    newGame: (seed) => {
      const next = startGame(seed ?? seedFromDate(new Date()));
      saveGame(storage, next);
      set(next);
    },

    play: (trayIndex, origin) => {
      const current = get();
      const next = playPiece(current, trayIndex, origin);

      // Oyun zaten bittiyse tahtaya her dokunus "gecersiz hamle" sayilir ve
      // uyari sesi calardi. Bitmis oyunda sessiz kal.
      if (current.status === 'playing') {
        sound.play(cueForMove(current, next));
      }

      // Saf reducer gecersiz hamlede AYNI referansi dondurur.
      if (next === (current as GameState)) {
        return false;
      }

      saveGame(storage, next);

      set({
        ...next,
        highScore:
          next.status === 'gameOver' ? recordScore(storage, next.score) : current.highScore,
      });
      return true;
    },

    playAgain: () => {
      const next = restart(get());
      saveGame(storage, next);
      set(next);
    },

    setSoundEnabled: (enabled) => {
      sound.setEnabled(enabled);
      saveSettings(storage, { soundEnabled: enabled });
      set({ soundEnabled: enabled });
    },

    persistNow: () => {
      saveGame(storage, get());
    },
  };
});
