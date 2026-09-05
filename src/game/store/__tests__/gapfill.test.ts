import { loadSettings, recordScore } from '../persistence';
import { useGameStore } from '../gameStore';
import { createMemoryStore, getAppStore, type KeyValueStore } from '../storage';

import { startGame } from '@/game/core/game';
import { shapeById } from '@/game/core/pieces';
import type { Piece } from '@/game/core/types';

import { BOARD } from '@/constants/config';

/**
 * Ses yoneticisi sahtelenir.
 *
 * Fabrika, gameStore import edilirken calisir; bu yuzden sahte nesne
 * fabrikanin ICINDE kurulup globalThis uzerinden disari veriliyor. Modul
 * kapsamindaki bir const, import hoisting yuzunden o anda henuz TDZ'de olurdu.
 */
jest.mock('@/game/audio', () => {
  const calls: string[] = [];
  const manager = {
    preload: jest.fn(() => calls.push('preload')),
    play: jest.fn((name: string) => calls.push(`play:${name}`)),
    setEnabled: jest.fn((value: boolean) => calls.push(`setEnabled:${String(value)}`)),
    isEnabled: jest.fn(() => true),
    dispose: jest.fn(),
  };
  (globalThis as Record<string, unknown>).__soundCalls = calls;
  (globalThis as Record<string, unknown>).__soundManager = manager;
  return { getSoundManager: () => manager };
});

const soundCalls = (globalThis as Record<string, unknown>).__soundCalls as string[];
const soundManager = (globalThis as Record<string, unknown>).__soundManager as {
  preload: jest.Mock;
};

const SEED = 20260905;

const pieceOf = (id: string): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`sekil yok: ${id}`);
  }
  return { shape, colorId: 1 };
};

/** set cagrilarini kaydeden depo sarmalayicisi. */
const spyStore = () => {
  const inner = createMemoryStore();
  const writes: [string, string][] = [];
  const store: KeyValueStore = {
    getString: (k) => inner.getString(k),
    set: (k, v) => {
      writes.push([k, v]);
      inner.set(k, v);
    },
    delete: (k) => inner.delete(k),
  };
  return { store, writes };
};

describe('S1 recordScore esit/dusuk skorda DISKE YAZMAZ', () => {
  it('esit skor yeni bir yazma tetiklemez', () => {
    const { store, writes } = spyStore();
    recordScore(store, 400);
    writes.length = 0;

    expect(recordScore(store, 400)).toBe(400);
    expect(writes).toEqual([]);
  });

  it('daha dusuk skor yazma tetiklemez', () => {
    const { store, writes } = spyStore();
    recordScore(store, 400);
    writes.length = 0;

    recordScore(store, 399);

    expect(writes).toEqual([]);
  });
});

describe('S2 loadHighScore sifir sinir degeri', () => {
  it('kayitli 0 gecerli bir rekordur', () => {
    const store = createMemoryStore({ 'score.high': '0' });

    expect(recordScore(store, 1)).toBe(1);
  });
});

describe('S3 store ses yonetimini gercekten suruyor', () => {
  beforeEach(() => {
    useGameStore.getState().newGame(SEED);
    soundCalls.length = 0;
  });

  it('gecersiz hamlede uyari sesi calar', () => {
    useGameStore.getState().play(0, { x: 99, y: 99 });

    expect(soundCalls).toEqual(['play:invalid']);
  });

  it('gecerli hamlede yerlestirme sesi calar', () => {
    const index = useGameStore.getState().tray.findIndex((p) => p !== undefined);

    useGameStore.getState().play(index, { x: 0, y: 0 });

    expect(soundCalls).toEqual(['play:place']);
  });

  it('cizgi temizleyen hamlede temizleme sesi calar', () => {
    // Satir KARISIK renkli: tek renk olsaydi Cini sesi one gecerdi.
    const board = Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) => (y === 0 && x < BOARD.COLS - 1 ? x % 2 : null)),
    );
    useGameStore.setState({
      board,
      tray: [pieceOf('dot'), pieceOf('dot'), pieceOf('dot')],
      status: 'playing',
    });
    soundCalls.length = 0;

    useGameStore.getState().play(0, { x: BOARD.COLS - 1, y: 0 });

    expect(soundCalls).toEqual(['play:clear']);
  });

  it('tek renkli cizgi temizleyen hamlede Cini sesi calar', () => {
    const board = Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) => (y === 0 && x < BOARD.COLS - 1 ? 1 : null)),
    );
    useGameStore.setState({
      board,
      tray: [pieceOf('dot'), pieceOf('dot'), pieceOf('dot')],
      status: 'playing',
    });
    soundCalls.length = 0;

    useGameStore.getState().play(0, { x: BOARD.COLS - 1, y: 0 });

    expect(soundCalls).toEqual(['play:cini']);
  });

  it('setSoundEnabled hem ses yoneticisine hem diske gecer', () => {
    useGameStore.getState().setSoundEnabled(false);

    expect(soundCalls).toEqual(['setEnabled:false']);
    expect(loadSettings(getAppStore()).soundEnabled).toBe(false);

    useGameStore.getState().setSoundEnabled(true);

    expect(loadSettings(getAppStore()).soundEnabled).toBe(true);
  });
});

/*
 * require() kullanimi bilincli: jest.isolateModules modul kayit defterini
 * sifirlayip modulu YENIDEN degerlendirmek icin var. Statik import hoisting
 * yuzunden izolasyondan once calisirdi ve store'un acilis yan etkileri
 * (kayittan devam etme, ses on yukleme) test edilemezdi.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
describe('S4 acilis yan etkileri', () => {
  it('kaydedilmis oyun store baslangicini belirler', () => {
    jest.isolateModules(() => {
      const storage = require('../storage') as typeof import('../storage');
      const persistence = require('../persistence') as typeof import('../persistence');

      const saved = startGame(4242);
      persistence.saveGame(storage.getAppStore(), saved);

      const mod = require('../gameStore') as typeof import('../gameStore');

      expect(mod.useGameStore.getState().seed).toBe(4242);
      expect(mod.useGameStore.getState().tray.map((p) => p?.shape.id)).toEqual(
        saved.tray.map((p) => p?.shape.id),
      );
    });
  });

  it('acilista sesler onceden yuklenir', () => {
    jest.isolateModules(() => {
      soundManager.preload.mockClear();

      require('../gameStore');

      expect(soundManager.preload).toHaveBeenCalled();
    });
  });
});

describe('S5 yuksek skor yalnizca oyun sonunda yazilir', () => {
  it('oyun surerken skor rekoru gecse bile highScore degismez', () => {
    useGameStore.getState().newGame(SEED);
    const before = useGameStore.getState().highScore;
    useGameStore.setState({ score: before + 100000 });

    const index = useGameStore.getState().tray.findIndex((p) => p !== undefined);
    expect(useGameStore.getState().play(index, { x: 0, y: 0 })).toBe(true);

    expect(useGameStore.getState().highScore).toBe(before);
  });
});
/* eslint-enable @typescript-eslint/no-require-imports */

describe('S5 oyun bittikten sonra sessizlik', () => {
  it('bitmis oyunda tahtaya dokunmak uyari sesi CALMAZ', () => {
    // Overlay'in altindaki tahta hala dokunulabilir; her dokunus gecersiz
    // hamle sayilip "invalid" sesi calardi.
    useGameStore.setState({ status: 'gameOver' });
    soundCalls.length = 0;

    const accepted = useGameStore.getState().play(0, { x: 0, y: 0 });

    expect(accepted).toBe(false);
    expect(soundCalls).toEqual([]);
  });
});
