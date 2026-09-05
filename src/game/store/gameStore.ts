import { create } from 'zustand';

import {
  loadGame,
  loadHighScore,
  loadSettings,
  recordScore,
  saveGame,
  saveSettings,
  type Settings,
} from './persistence';
import { getAppStore } from './storage';

import { getSoundManager } from '@/game/audio';
import { cueForMove, soundForEvents } from '@/game/audio/cues';
import {
  haggle as haggleMove,
  petCat,
  playPiece,
  restart,
  startGame,
  takeTeaBreak,
  type GameState,
  type StartOptions,
} from '@/game/core/game';
import { seedFromDate } from '@/game/core/rng';
import type { GameMode } from '@/game/core/rules';
import type { Point } from '@/game/core/types';
import {
  esnafEventForEvents,
  esnafEventForMove,
  esnafLine,
  type EsnafEvent,
} from '@/game/data/esnaf';
import { getHaptics } from '@/game/haptics';

/**
 * Oyun durumunun React'e baglanmasi.
 *
 * Bu dosya BILEREK ince: tum kurallar src/game/core/game.ts icindeki saf
 * reducer'da, kalicilik politikasi persistence.ts'te, ses secimi cues.ts'te,
 * esnaf replikleri data/esnaf.ts'te. Store yalnizca bunlari birbirine bagliyor.
 */

/** Ekranda gosterilecek esnaf repligi. `id` her yeni replikte artar ki UI
 *  ayni metin ust uste gelse bile baloncugu yeniden tetikleyebilsin. */
export interface EsnafMessage {
  readonly id: number;
  readonly event: EsnafEvent;
  readonly text: string;
}

export interface NewGameOptions {
  readonly mode?: GameMode;
  readonly levelId?: string | null;
}

export interface GameStore extends GameState {
  readonly highScore: number;
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
  /** Secili esnaf (ayarlardan; yeni oyunda kurala islenir). */
  readonly selectedEsnafId: string;
  readonly esnaf: EsnafMessage | null;

  /** Yeni oyun baslatir. Seed verilmezse gunun tarihinden turetilir. */
  newGame: (seed?: number, options?: NewGameOptions) => void;
  /** Parcayi oynar; hamle kabul edilmediyse false doner. */
  play: (trayIndex: number, origin: Point) => boolean;
  /** Ayni seed ile bastan baslar. */
  playAgain: () => void;
  /** "Cay molasi": bitmis oyunu devam ettirir; hak yoksa false doner. */
  teaBreak: () => boolean;
  /** Tekir'i oksar; kedi yoksa/dinleniyorsa false. */
  pet: () => boolean;
  /** Pazarlik sonucunu isler; hak yoksa false. */
  haggle: (trayIndex: number, success: boolean) => boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setEsnaf: (esnafId: string) => void;
  /** Durumu hemen diske yazar (uygulama arka plana dusunce). */
  persistNow: () => void;
}

/**
 * Acilista kaydedilmis oyun varsa ondan devam edilir.
 * Bozuk kayit null doner ve sessizce yeni oyun baslar.
 */
function initialGame(settings: Settings): GameState {
  return (
    loadGame(getAppStore()) ??
    startGame(seedFromDate(new Date()), { mode: 'canli', esnafId: settings.esnafId })
  );
}

export const useGameStore = create<GameStore>((set, get) => {
  const storage = getAppStore();
  const settings = loadSettings(storage);
  const sound = getSoundManager();
  const haptics = getHaptics();
  sound.setEnabled(settings.soundEnabled);
  haptics.setEnabled(settings.hapticsEnabled);
  // Ilk hamlede gecikme olmasin diye sesler simdiden bellege alinir.
  sound.preload();

  let esnafCounter = 0;
  /** Replik secimi deterministik: ayni olay + ayni tuz -> ayni metin. */
  const speak = (event: EsnafEvent, salt: number): EsnafMessage => {
    esnafCounter += 1;
    return { id: esnafCounter, event, text: esnafLine(event, salt) };
  };

  /** Ses + titresim birlikte; ikisi de ayni ipucundan turetilir. */
  const feedback = (cue: ReturnType<typeof cueForMove>) => {
    sound.play(cue);
    haptics.fire(cue);
  };

  const currentSettings = (): Settings => ({
    soundEnabled: get().soundEnabled,
    hapticsEnabled: get().hapticsEnabled,
    esnafId: get().selectedEsnafId,
  });

  const begin = (next: GameState, salt: number) => {
    saveGame(storage, next);
    set({ ...next, esnaf: speak('start', salt) });
  };

  return {
    ...initialGame(settings),
    highScore: loadHighScore(storage),
    soundEnabled: settings.soundEnabled,
    hapticsEnabled: settings.hapticsEnabled,
    selectedEsnafId: settings.esnafId,
    esnaf: speak('start', Date.now()),

    newGame: (seed, options = {}) => {
      const actualSeed = seed ?? seedFromDate(new Date());
      const start: StartOptions = {
        mode: options.mode ?? 'classic',
        levelId: options.levelId ?? null,
        esnafId: get().selectedEsnafId,
      };
      begin(startGame(actualSeed, start), actualSeed);
    },

    play: (trayIndex, origin) => {
      const current = get();
      const next = playPiece(current, trayIndex, origin);
      const ctx = { highScore: current.highScore };

      // Oyun zaten bittiyse tahtaya her dokunus "gecersiz hamle" sayilir ve
      // uyari sesi calardi. Bitmis oyunda sessiz kal.
      if (current.status === 'playing') {
        feedback(cueForMove(current, next, ctx));
      }

      // Saf reducer gecersiz hamlede AYNI referansi dondurur.
      if (next === (current as GameState)) {
        return false;
      }

      saveGame(storage, next);

      const event = esnafEventForMove(current, next, ctx);
      const finished = next.status !== 'playing';

      set({
        ...next,
        highScore: finished ? recordScore(storage, next.score) : current.highScore,
        // Siradan hamlede mevcut replik korunur; baloncugun kapanmasi UI'daki
        // zamanlayicinin isi.
        esnaf: event === null ? current.esnaf : speak(event, next.score + next.piecesDrawn),
      });
      return true;
    },

    playAgain: () => {
      const next = restart(get());
      begin(next, next.seed + 1);
    },

    teaBreak: () => {
      const current = get();
      const next = takeTeaBreak(current);
      if (next === (current as GameState)) {
        return false;
      }

      feedback('teaBreak');
      saveGame(storage, next);
      set({ ...next, esnaf: speak('teaBreak', next.score) });
      return true;
    },

    pet: () => {
      const current = get();
      const next = petCat(current);
      if (next === (current as GameState)) {
        return false;
      }
      feedback('cat');
      saveGame(storage, next);
      set({ ...next, esnaf: speak('catPetted', next.moves) });
      return true;
    },

    haggle: (trayIndex, success) => {
      const current = get();
      const next = haggleMove(current, trayIndex, success);
      if (next === (current as GameState)) {
        return false;
      }
      const live = esnafEventForEvents(next.events);
      feedback(soundForEvents(next.events) ?? 'place');
      saveGame(storage, next);
      set({
        ...next,
        esnaf: live === null ? current.esnaf : speak(live, next.hagglesLeft + next.score),
      });
      return true;
    },

    setSoundEnabled: (enabled) => {
      sound.setEnabled(enabled);
      set({ soundEnabled: enabled });
      saveSettings(storage, currentSettings());
    },

    setHapticsEnabled: (enabled) => {
      haptics.setEnabled(enabled);
      set({ hapticsEnabled: enabled });
      saveSettings(storage, currentSettings());
    },

    setEsnaf: (esnafId) => {
      set({ selectedEsnafId: esnafId });
      saveSettings(storage, currentSettings());
    },

    persistNow: () => {
      saveGame(storage, get());
    },
  };
});
