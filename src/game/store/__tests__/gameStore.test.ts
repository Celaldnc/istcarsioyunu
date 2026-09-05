import { loadGame } from '../persistence';
import { getAppStore } from '../storage';

import { canPlace } from '@/game/core/board';
import { shapeById } from '@/game/core/pieces';
import { CLASSIC_RULES } from '@/game/core/rules';
import type { Piece, Point } from '@/game/core/types';

import { BOARD } from '@/constants/config';
import { NO_PROGRESS, takeTeaBreak } from '@/game/core/game';
import { useGameStore } from '@/game/store/gameStore';

/** Canli Carsi alanlarinin klasik (kapali) varsayilanlari; literal kurulumlar icin. */
const LIVE_DEFAULTS = {
  mode: 'classic' as const,
  esnafId: 'cirak',
  rules: CLASSIC_RULES,
  levelId: null,
  moves: 0,
  cat: null,
  gull: null,
  curses: [],
  hagglesLeft: 0,
  progress: NO_PROGRESS,
  gates: 0,
  festivalTurns: 0,
  catPets: 0,
  events: [],
  lastBonuses: [],
};

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
      lastCini: { rows: [], cols: [] },
      teaBreaksLeft: 1,
      ...LIVE_DEFAULTS,
    });

    const accepted = useGameStore.getState().play(0, { x: 5, y: 0 });

    expect(accepted).toBe(true);
    expect(useGameStore.getState().status).toBe('gameOver');
    expect(useGameStore.getState().highScore).toBeGreaterThanOrEqual(12345);
  });
});

describe('esnaf replikleri', () => {
  it('yeni oyunda esnaf gunun saatine gore karsilar', () => {
    expect(['start', 'morning', 'evening', 'night']).toContain(
      useGameStore.getState().esnaf?.event,
    );
  });

  it('siradan hamle mevcut repligi degistirmez', () => {
    const before = useGameStore.getState().esnaf;
    const index = firstFilled(useGameStore.getState().tray);

    useGameStore.getState().play(index, firstFit(index));

    expect(useGameStore.getState().esnaf).toBe(before);
  });

  it('her yeni replik farkli bir kimlik tasir (UI yeniden tetiklenir)', () => {
    const first = useGameStore.getState().esnaf?.id;
    useGameStore.getState().newGame(SEED);

    expect(useGameStore.getState().esnaf?.id).not.toBe(first);
  });
});

describe('cay molasi', () => {
  const deadBoard = () => {
    const diagonal = Array.from({ length: BOARD.ROWS }, (_, y) => [y % BOARD.COLS, y] as const);
    return Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) =>
        diagonal.some(([ex, ey]) => ex === x && ey === y) ? null : 1,
      ),
    );
  };

  it('oyun surerken reddedilir', () => {
    expect(useGameStore.getState().teaBreak()).toBe(false);
  });

  it('bitmis oyunu devam ettirir, hakki duser ve esnaf konusur', () => {
    useGameStore.setState({ board: deadBoard(), status: 'gameOver', teaBreaksLeft: 1 });

    expect(useGameStore.getState().teaBreak()).toBe(true);
    expect(useGameStore.getState().status).toBe('playing');
    expect(useGameStore.getState().teaBreaksLeft).toBe(0);
    expect(useGameStore.getState().esnaf?.event).toBe('teaBreak');
  });

  it('hak yoksa reddedilir', () => {
    useGameStore.setState({ board: deadBoard(), status: 'gameOver', teaBreaksLeft: 0 });

    expect(useGameStore.getState().teaBreak()).toBe(false);
    expect(useGameStore.getState().status).toBe('gameOver');
  });

  it('saf reducer ile ayni tahtayi uretir', () => {
    useGameStore.setState({ board: deadBoard(), status: 'gameOver', teaBreaksLeft: 1 });
    const expected = takeTeaBreak(useGameStore.getState()).board;

    useGameStore.getState().teaBreak();

    expect(useGameStore.getState().board).toEqual(expected);
  });

  it('mola sonrasi durum diske yazilir', () => {
    useGameStore.setState({ board: deadBoard(), status: 'gameOver', teaBreaksLeft: 1 });
    useGameStore.getState().teaBreak();

    expect(loadGame(getAppStore())?.teaBreaksLeft).toBe(0);
  });
});

describe('titresim ayari', () => {
  it('acilip kapatilabilir ve durumda yansir', () => {
    useGameStore.getState().setHapticsEnabled(false);
    expect(useGameStore.getState().hapticsEnabled).toBe(false);

    useGameStore.getState().setHapticsEnabled(true);
    expect(useGameStore.getState().hapticsEnabled).toBe(true);
  });
});

describe('canli carsi aksiyonlari', () => {
  it('newGame mod secenegi alir', () => {
    useGameStore.getState().newGame(SEED, { mode: 'canli' });

    expect(useGameStore.getState().mode).toBe('canli');
    expect(useGameStore.getState().cat).not.toBeNull();
  });

  it('pet kediyi oksar ve esnaf konusur', () => {
    useGameStore.getState().newGame(SEED, { mode: 'canli' });

    expect(useGameStore.getState().pet()).toBe(true);
    expect(useGameStore.getState().cat?.restTurns).toBeGreaterThan(0);
    expect(useGameStore.getState().esnaf?.event).toBe('catPetted');
    // Dinlenen kedi tekrar oksanmaz.
    expect(useGameStore.getState().pet()).toBe(false);
  });

  it('klasik oyunda pet false doner', () => {
    expect(useGameStore.getState().pet()).toBe(false);
  });

  it('haggle hakki dusurur ve sonucu isler', () => {
    useGameStore.getState().newGame(SEED, { mode: 'canli' });
    const before = useGameStore.getState().hagglesLeft;

    expect(useGameStore.getState().haggle(0, false)).toBe(true);
    expect(useGameStore.getState().hagglesLeft).toBe(before - 1);
    expect(useGameStore.getState().esnaf?.event).toBe('haggleLost');
  });

  it('klasik oyunda haggle false doner', () => {
    expect(useGameStore.getState().haggle(0, true)).toBe(false);
  });

  it('esnaf secimi kalici ve yeni oyunda kurala islenir', () => {
    useGameStore.getState().setEsnaf('halici');
    useGameStore.getState().newGame(SEED, { mode: 'canli' });

    expect(useGameStore.getState().selectedEsnafId).toBe('halici');
    expect(useGameStore.getState().rules.ciniMultiplier).toBe(2);
    useGameStore.getState().setEsnaf('cirak');
  });
});

describe('oyun sonu istatistik ve kartpostal', () => {
  const deadBoardWithGap = () => {
    const diagonal = Array.from({ length: BOARD.ROWS }, (_, y) => [y % BOARD.COLS, y] as const);
    const empties = [...diagonal, [5, 0] as const];
    return Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) =>
        empties.some(([ex, ey]) => ex === x && ey === y) ? null : 1,
      ),
    );
  };

  it('oyun bitince omur boyu istatistik guncellenir', () => {
    const dot = shapeById('dot')!;
    const plus = shapeById('plus')!;
    const before = useGameStore.getState().stats.games;
    useGameStore.setState({
      board: deadBoardWithGap(),
      tray: [
        { shape: dot, colorId: 1 },
        { shape: plus, colorId: 1 },
        { shape: plus, colorId: 1 },
      ],
      status: 'playing',
    });

    useGameStore.getState().play(0, { x: 5, y: 0 });

    expect(useGameStore.getState().status).toBe('gameOver');
    expect(useGameStore.getState().stats.games).toBe(before + 1);
  });

  it('semt kazanilinca kartpostal verilir', () => {
    useGameStore.getState().newGame(SEED, { mode: 'journey', levelId: 'eminonu' });
    const dot = shapeById('dot')!;
    const board = Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) => (y === 0 && x < BOARD.COLS - 1 ? 1 : null)),
    );
    useGameStore.setState({
      board,
      tray: [
        { shape: dot, colorId: 1 },
        { shape: dot, colorId: 1 },
        { shape: dot, colorId: 1 },
      ],
      score: 295,
    });

    useGameStore.getState().play(0, { x: BOARD.COLS - 1, y: 0 });

    expect(useGameStore.getState().status).toBe('won');
    expect(useGameStore.getState().postcards).toContain('eminonu');
    expect(useGameStore.getState().esnaf?.event).toBe('levelWon');
  });
});

describe('mod basina rekor', () => {
  const deadWithGap = () => {
    const diagonal = Array.from({ length: BOARD.ROWS }, (_, y) => [y % BOARD.COLS, y] as const);
    const empties = [...diagonal, [5, 0] as const];
    return Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) =>
        empties.some(([ex, ey]) => ex === x && ey === y) ? null : 1,
      ),
    );
  };
  const finishWith = (score: number) => {
    const dot = shapeById('dot')!;
    const plus = shapeById('plus')!;
    useGameStore.setState({
      board: deadWithGap(),
      tray: [
        { shape: dot, colorId: 1 },
        { shape: plus, colorId: 1 },
        { shape: plus, colorId: 1 },
      ],
      score,
      status: 'playing',
    });
    useGameStore.getState().play(0, { x: 5, y: 0 });
  };

  it('gunluk mod genel rekoru degil bugunun rekorunu gunceller', () => {
    useGameStore.getState().newGame(SEED, { mode: 'daily' });
    const before = useGameStore.getState().highScore;

    finishWith(before + 5000);

    expect(useGameStore.getState().status).toBe('gameOver');
    expect(useGameStore.getState().highScore).toBe(before);
    expect(useGameStore.getState().daily?.best).toBe(before + 5000);
  });

  it('yolculuk kaybi genel rekora dokunmaz', () => {
    useGameStore.getState().newGame(SEED, { mode: 'journey', levelId: 'galata' });
    const before = useGameStore.getState().highScore;

    finishWith(before + 5000);

    expect(useGameStore.getState().highScore).toBe(before);
  });
});
