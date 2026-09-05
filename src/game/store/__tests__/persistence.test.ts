import {
  DEFAULT_SETTINGS,
  clearGame,
  loadGame,
  loadHighScore,
  loadSettings,
  loadJourney,
  awardPostcard,
  loadStats,
  saveStats,
  recordScore,
  saveGame,
  saveSettings,
} from '../persistence';
import { createMemoryStore } from '../storage';
import { EMPTY_STATS } from '@/game/core/titles';

import { playPiece, startGame } from '@/game/core/game';
import type { Piece } from '@/game/core/types';

const SEED = 20260905;

const firstFilled = (tray: readonly (Piece | undefined)[]): number =>
  tray.findIndex((piece) => piece !== undefined);

describe('oyun kaydi', () => {
  it('kaydedilen oyun geri yuklenir', () => {
    const store = createMemoryStore();
    const state = startGame(SEED);

    saveGame(store, state);

    expect(loadGame(store)).toEqual(state);
  });

  it('kayit yoksa null doner', () => {
    expect(loadGame(createMemoryStore())).toBeNull();
  });

  it('bozuk kayit oyunu cokertmez, null doner', () => {
    const store = createMemoryStore({ 'game.current': 'bu json degil' });

    expect(loadGame(store)).toBeNull();
  });

  it('temizlenen kayit geri gelmez', () => {
    const store = createMemoryStore();
    saveGame(store, startGame(SEED));

    clearGame(store);

    expect(loadGame(store)).toBeNull();
  });

  it('ilerlemis oyun kaydedilip devam ettirilebilir', () => {
    const store = createMemoryStore();
    let state = startGame(SEED);
    const index = firstFilled(state.tray);
    state = playPiece(state, index, { x: 0, y: 0 });

    saveGame(store, state);
    const restored = loadGame(store);

    expect(restored?.tray[index]).toBeUndefined();
    expect(restored?.piecesDrawn).toBe(state.piecesDrawn);
  });
});

describe('yuksek skor', () => {
  it('kayit yokken sifirdir', () => {
    expect(loadHighScore(createMemoryStore())).toBe(0);
  });

  it('ilk skor rekor olarak yazilir', () => {
    const store = createMemoryStore();

    expect(recordScore(store, 250)).toBe(250);
    expect(loadHighScore(store)).toBe(250);
  });

  it('daha yuksek skor rekoru gunceller', () => {
    const store = createMemoryStore();
    recordScore(store, 100);

    expect(recordScore(store, 400)).toBe(400);
    expect(loadHighScore(store)).toBe(400);
  });

  it('daha dusuk skor rekoru DUSURMEZ', () => {
    const store = createMemoryStore();
    recordScore(store, 400);

    expect(recordScore(store, 100)).toBe(400);
    expect(loadHighScore(store)).toBe(400);
  });

  it('esit skor rekoru degistirmez', () => {
    const store = createMemoryStore();
    recordScore(store, 400);

    expect(recordScore(store, 400)).toBe(400);
  });

  it('bozuk rekor degeri sifir kabul edilir (skor erisilmez kalmasin)', () => {
    const store = createMemoryStore({ 'score.high': 'cok yuksek' });

    expect(loadHighScore(store)).toBe(0);
    expect(recordScore(store, 10)).toBe(10);
  });

  it('negatif rekor degeri sifir kabul edilir', () => {
    expect(loadHighScore(createMemoryStore({ 'score.high': '-5' }))).toBe(0);
  });
});

describe('ayarlar', () => {
  it('kayit yokken varsayilanlar doner', () => {
    expect(loadSettings(createMemoryStore())).toEqual(DEFAULT_SETTINGS);
  });

  it('kaydedilen ayar geri yuklenir', () => {
    const store = createMemoryStore();

    saveSettings(store, { soundEnabled: false, hapticsEnabled: true, esnafId: 'cirak' });

    expect(loadSettings(store).soundEnabled).toBe(false);
  });

  it('bozuk ayar kaydi varsayilanlara duser', () => {
    expect(loadSettings(createMemoryStore({ settings: '{bozuk' }))).toEqual(DEFAULT_SETTINGS);
  });

  it('nesne olmayan ayar kaydi varsayilanlara duser', () => {
    expect(loadSettings(createMemoryStore({ settings: '"acik"' }))).toEqual(DEFAULT_SETTINGS);
  });

  it('eksik alanli ayar kaydinda alan varsayilana duser', () => {
    expect(loadSettings(createMemoryStore({ settings: '{}' })).soundEnabled).toBe(true);
  });

  it('yanlis tipli alan varsayilana duser', () => {
    expect(
      loadSettings(createMemoryStore({ settings: '{"soundEnabled":"evet"}' })).soundEnabled,
    ).toBe(true);
  });
});

describe('titresim ayari kaliciligi', () => {
  it('varsayilan olarak aciktir', () => {
    expect(DEFAULT_SETTINGS.hapticsEnabled).toBe(true);
  });

  it('kapatilinca kalici olur, ses ayarina dokunmaz', () => {
    const store = createMemoryStore();
    saveSettings(store, { soundEnabled: true, hapticsEnabled: false, esnafId: 'cirak' });

    expect(loadSettings(store)).toEqual({
      soundEnabled: true,
      hapticsEnabled: false,
      esnafId: 'cirak',
    });
  });

  it('eski kayitta alan yoksa acik kabul edilir', () => {
    expect(loadSettings(createMemoryStore({ settings: '{"soundEnabled":false}' }))).toEqual({
      soundEnabled: false,
      hapticsEnabled: true,
      esnafId: 'cirak',
    });
  });

  it('bozuk deger acik kabul edilir', () => {
    expect(
      loadSettings(createMemoryStore({ settings: '{"hapticsEnabled":"hayir"}' })).hapticsEnabled,
    ).toBe(true);
  });
});

describe('esnaf ayari kaliciligi', () => {
  it('varsayilan cirak', () => {
    expect(DEFAULT_SETTINGS.esnafId).toBe('cirak');
  });

  it('secim kalici olur', () => {
    const store = createMemoryStore();
    saveSettings(store, { soundEnabled: true, hapticsEnabled: true, esnafId: 'cayci' });

    expect(loadSettings(store).esnafId).toBe('cayci');
  });

  it('bozuk veya bos deger varsayilana duser', () => {
    expect(loadSettings(createMemoryStore({ settings: '{"esnafId":""}' })).esnafId).toBe('cirak');
    expect(loadSettings(createMemoryStore({ settings: '{"esnafId":5}' })).esnafId).toBe('cirak');
  });
});

describe('yolculuk ilerlemesi', () => {
  it('kayit yokken bos', () => {
    expect(loadJourney(createMemoryStore())).toEqual({ postcards: [] });
  });

  it('kartpostal bir kez verilir ve kalici olur', () => {
    const store = createMemoryStore();
    awardPostcard(store, 'eminonu');
    awardPostcard(store, 'eminonu');

    expect(loadJourney(store).postcards).toEqual(['eminonu']);
  });

  it('bozuk kayit bos ilerleme sayilir', () => {
    expect(loadJourney(createMemoryStore({ journey: '{bozuk' }))).toEqual({ postcards: [] });
    expect(loadJourney(createMemoryStore({ journey: '{"postcards":"x"}' }))).toEqual({
      postcards: [],
    });
    expect(loadJourney(createMemoryStore({ journey: '{"postcards":["a",5]}' })).postcards).toEqual([
      'a',
    ]);
  });
});

describe('omur boyu istatistik', () => {
  it('kayit yokken sifirlar', () => {
    expect(loadStats(createMemoryStore())).toEqual(EMPTY_STATS);
  });

  it('kaydedilen istatistik geri gelir', () => {
    const store = createMemoryStore();
    saveStats(store, { ...EMPTY_STATS, games: 3, lines: 40 });

    expect(loadStats(store).games).toBe(3);
    expect(loadStats(store).lines).toBe(40);
  });

  it('bozuk alanlar sifira duser, digerleri korunur', () => {
    const stats = loadStats(createMemoryStore({ stats: '{"games":"iki","lines":7}' }));

    expect(stats.games).toBe(0);
    expect(stats.lines).toBe(7);
    expect(loadStats(createMemoryStore({ stats: '[1]' }))).toEqual(EMPTY_STATS);
    expect(loadStats(createMemoryStore({ stats: '{bozuk' }))).toEqual(EMPTY_STATS);
  });
});
