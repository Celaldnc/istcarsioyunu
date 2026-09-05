import { loadGame } from '../persistence';
import { getAppStore } from '../storage';

import { canPlace } from '@/game/core/board';
import { shapeById } from '@/game/core/pieces';
import type { Piece, Point } from '@/game/core/types';

import { BOARD } from '@/constants/config';
import { useGameStore } from '@/game/store/gameStore';

const SEED = 20260905;

/** Tepsideki ilk dolu yuvanin indeksi. */
const firstFilled = (tray: readonly (Piece | undefined)[]): number =>
  tray.findIndex((piece) => piece !== undefined);

/** Parcanin sigdigi ilk konum. */
function firstFit(index: number): Point {
  const { board, tray } = useGameStore.getState();
  const piece = tray[index];
  if (piece === undefined) {
    throw new Error('Test kurulumu hatali: yuva bos.');
  }

  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < (board[0]?.length ?? 0); x += 1) {
      if (canPlace(board, piece, { x, y })) {
        return { x, y };
      }
    }
  }
  throw new Error('Test kurulumu hatali: parca hicbir yere sigmadi.');
}

beforeEach(() => {
  useGameStore.getState().newGame(SEED);
});

describe('useGameStore', () => {
  it('newGame verilen seed ile deterministik baslar', () => {
    const first = useGameStore.getState().tray.map((p) => p?.shape.id);

    useGameStore.getState().newGame(SEED);

    expect(useGameStore.getState().tray.map((p) => p?.shape.id)).toEqual(first);
  });

  it('seed verilmezse gunun tarihinden turetir', () => {
    useGameStore.getState().newGame();

    expect(useGameStore.getState().seed).toBeGreaterThan(0);
    expect(useGameStore.getState().status).toBe('playing');
  });

  it('gecerli hamlede true doner ve durumu ilerletir', () => {
    const index = firstFilled(useGameStore.getState().tray);

    const accepted = useGameStore.getState().play(index, firstFit(index));

    expect(accepted).toBe(true);
    expect(useGameStore.getState().tray[index]).toBeUndefined();
  });

  it('gecersiz hamlede false doner ve durumu degistirmez', () => {
    const before = useGameStore.getState().board;

    const accepted = useGameStore.getState().play(0, { x: 99, y: 99 });

    expect(accepted).toBe(false);
    expect(useGameStore.getState().board).toBe(before);
  });

  it('bos yuvayi oynamak reddedilir', () => {
    const index = firstFilled(useGameStore.getState().tray);
    useGameStore.getState().play(index, firstFit(index));

    expect(useGameStore.getState().play(index, { x: 0, y: 0 })).toBe(false);
  });

  it('playAgain ayni seed ile bastan baslatir', () => {
    const startTray = useGameStore.getState().tray.map((p) => p?.shape.id);
    const index = firstFilled(useGameStore.getState().tray);
    useGameStore.getState().play(index, firstFit(index));

    useGameStore.getState().playAgain();

    expect(useGameStore.getState().score).toBe(0);
    expect(useGameStore.getState().tray.map((p) => p?.shape.id)).toEqual(startTray);
  });

  it('skor hamlelerle birikir (asla azalmaz)', () => {
    let previous = useGameStore.getState().score;

    for (let i = 0; i < 6; i += 1) {
      const state = useGameStore.getState();
      if (state.status !== 'playing') {
        break;
      }
      const index = firstFilled(state.tray);
      state.play(index, firstFit(index));

      expect(useGameStore.getState().score).toBeGreaterThanOrEqual(previous);
      previous = useGameStore.getState().score;
    }
  });
});

describe('kalicilik ve ayarlar', () => {
  it('yuksek skor baslangicta yuklenir', () => {
    expect(useGameStore.getState().highScore).toBeGreaterThanOrEqual(0);
  });

  it('oyun surerken skor rekoru assa bile yuksek skor guncellenmez', () => {
    // ONCEKI HALI HICBIR SEY OLCMUYORDU: skor zaten rekorun altindaydi, yani
    // gameOver kosulu tamamen silinse bile test gecerdi. Simdi skor bilincli
    // olarak rekorun uzerine cikariliyor.
    useGameStore.setState({ score: 999_999, status: 'playing' });
    const before = useGameStore.getState().highScore;
    const index = firstFilled(useGameStore.getState().tray);

    useGameStore.getState().play(index, firstFit(index));

    expect(useGameStore.getState().score).toBeGreaterThan(before);
    expect(useGameStore.getState().highScore).toBe(before);
  });

  it('ses ayari acilip kapatilabilir ve durumda yansir', () => {
    useGameStore.getState().setSoundEnabled(false);
    expect(useGameStore.getState().soundEnabled).toBe(false);

    useGameStore.getState().setSoundEnabled(true);
    expect(useGameStore.getState().soundEnabled).toBe(true);
  });

  it('persistNow hata firlatmaz', () => {
    expect(() => useGameStore.getState().persistNow()).not.toThrow();
  });

  it('kaydedilen oyun sonraki yuklemede geri gelir', () => {
    const index = firstFilled(useGameStore.getState().tray);
    useGameStore.getState().play(index, firstFit(index));
    const expected = useGameStore.getState().board;

    // Store'un kullandigi ayni depodan okuyoruz.
    const restored = loadGame(getAppStore());

    expect(restored?.board).toEqual(expected);
  });
});

describe('oyun sonunda yuksek skor', () => {
  it('oyun bitince skor rekor olarak kaydedilir', () => {
    // Capraz desen: hicbir cizgi dolu degil, bosluklar izole.
    // Tek kare disindaki parcalar hicbir yere sigmaz.
    const diagonal = Array.from({ length: BOARD.ROWS }, (_, y) => [y % BOARD.COLS, y] as const);
    const empties = [...diagonal, [5, 0] as const];
    const board = Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) =>
        empties.some(([ex, ey]) => ex === x && ey === y) ? null : 1,
      ),
    );

    const dot = shapeById('dot');
    const plus = shapeById('plus');
    if (dot === undefined || plus === undefined) {
      throw new Error('Test kurulumu hatali.');
    }

    useGameStore.setState({
      board,
      tray: [
        { shape: dot, colorId: 1 },
        { shape: plus, colorId: 1 },
        { shape: plus, colorId: 1 },
      ],
      score: 12345,
      status: 'playing',
      lastClear: { rows: [], cols: [] },
      lastGain: 0,
      comboStreak: 0,
    });

    const accepted = useGameStore.getState().play(0, { x: 5, y: 0 });

    expect(accepted).toBe(true);
    expect(useGameStore.getState().status).toBe('gameOver');
    expect(useGameStore.getState().highScore).toBeGreaterThanOrEqual(12345);
  });
});
