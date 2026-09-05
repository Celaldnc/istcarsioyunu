import { create } from 'zustand';

import { playPiece, restart, startGame, type GameState } from '@/game/core/game';
import { seedFromDate } from '@/game/core/rng';
import type { Point } from '@/game/core/types';

/**
 * Oyun durumunun React'e baglanmasi.
 *
 * Bu dosya BILEREK ince: tum kurallar src/game/core/game.ts icindeki saf
 * reducer'da. Store yalnizca o gecisleri cagirip sonucu yayinliyor. Boylece
 * oyun mantigi store veya React calistirmadan test edilebiliyor ve Sprint 4'te
 * kalici depolama eklendiginde kurallar degismiyor.
 */

export interface GameStore extends GameState {
  /** Yeni oyun baslatir. Seed verilmezse gunun tarihinden turetilir. */
  newGame: (seed?: number) => void;
  /** Parcayi oynar; hamle kabul edilmediyse false doner. */
  play: (trayIndex: number, origin: Point) => boolean;
  /** Ayni seed ile bastan baslar. */
  playAgain: () => void;
}

const initialState = (): GameState => startGame(seedFromDate(new Date()));

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),

  newGame: (seed) => {
    set(startGame(seed ?? seedFromDate(new Date())));
  },

  play: (trayIndex, origin) => {
    const current = get();
    const next = playPiece(current, trayIndex, origin);

    // Saf reducer gecersiz hamlede AYNI referansi dondurur; bu, "kabul
    // edilmedi" sinyalini bedava veriyor.
    if (next === (current as GameState)) {
      return false;
    }

    set(next);
    return true;
  },

  playAgain: () => {
    set(restart(get()));
  },
}));
