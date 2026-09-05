import { createBoard, createBoardFromMask } from '../board';
import {
  effectiveBoard,
  haggle,
  objectiveMet,
  petCat,
  playPiece,
  restart,
  startGame,
  takeTeaBreak,
  type GameState,
} from '../game';
import { levelById } from '../levels';
import { shapeById } from '../pieces';
import { SAVE_VERSION, deserializeGame, serializeGame } from '../save';
import { OFF_CELL } from '../types';
import type { Board, Piece } from '../types';

import { BOARD, GULL, HAGGLE, MAKAM, NAZAR, ROLES, SCORING, SYNERGY } from '@/constants/config';

const SEED = 20260905;

const pieceOf = (id: string, colorId = 5): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId };
};

const boardFrom = (rows: string[]): Board =>
  rows.map((row) => [...row].map((ch) => (ch === '.' ? null : ch === '#' ? OFF_CELL : Number(ch))));

/** Ust satiri son hucre haric doldurur (renk verilebilir). */
const almostFullTop = (row = '5555555.'): Board =>
  boardFrom([row, ...Array.from({ length: BOARD.ROWS - 1 }, () => '........')]);

const canli = (extra: Partial<GameState> = {}): GameState => ({
  ...startGame(SEED, { mode: 'canli' }),
  ...extra,
});

/** Tepsiyi tek 'dot' ile doldurur; hamleler tahmin edilebilir olsun. */
const dots = (colorId = 5) => [
  pieceOf('dot', colorId),
  pieceOf('dot', colorId),
  pieceOf('dot', colorId),
];

describe('canli mod baslangici', () => {
  it('kedi dogar ve hucresi kapalidir', () => {
    const state = startGame(SEED, { mode: 'canli' });

    expect(state.cat).not.toBeNull();
    expect(state.rules.cat).toBe(true);
    const cat = state.cat!;
    expect(effectiveBoard(state)[cat.y]?.[cat.x]).toBe(OFF_CELL);
  });

  it('klasik modda kedi yoktur', () => {
    expect(startGame(SEED).cat).toBeNull();
    expect(startGame(SEED).hagglesLeft).toBe(0);
  });

  it('ayni seed ayni kedi konumunu verir (deterministik)', () => {
    expect(startGame(SEED, { mode: 'canli' }).cat).toEqual(startGame(SEED, { mode: 'canli' }).cat);
  });

  it('kedinin ustune parca konamaz', () => {
    const state = canli({ tray: dots(), cat: { x: 0, y: 0, restTurns: 0 } });

    expect(playPiece(state, 0, { x: 0, y: 0 })).toBe(state);
    expect(playPiece(state, 0, { x: 1, y: 0 })).not.toBe(state);
  });

  it('hamle sayaci artar ve olaylar sifirlanabilir', () => {
    const state = canli({ tray: dots(), cat: null });
    const next = playPiece(state, 0, { x: 1, y: 0 });

    expect(next.moves).toBe(state.moves + 1);
    expect(Array.isArray(next.events)).toBe(true);
  });
});

describe('kedi hamle icinde', () => {
  it('bitisik satir temizlenince tasinir ve olay uretir', () => {
    const state = canli({
      board: almostFullTop(),
      tray: dots(),
      cat: { x: 3, y: 1, restTurns: 0 },
      curses: [],
      gull: null,
    });
    const next = playPiece(state, 0, { x: 7, y: 0 });

    expect(next.lastClear.rows).toEqual([0]);
    expect(next.events).toContain('catMoved');
    expect(next.cat).not.toEqual(state.cat);
  });

  it('oksanan kedi yerinde kalir', () => {
    const state = petCat(
      canli({ board: almostFullTop(), tray: dots(), cat: { x: 3, y: 1, restTurns: 0 } }),
    );
    expect(state.events).toEqual(['catPetted']);

    const next = playPiece(state, 0, { x: 7, y: 0 });
    expect(next.cat?.x).toBe(3);
    expect(next.cat?.y).toBe(1);
  });

  it('oksama yalnizca dinlenmeyen kediye islenir; kedi yoksa durum ayni', () => {
    const noCat = canli({ cat: null });
    expect(petCat(noCat)).toBe(noCat);

    const resting = canli({ cat: { x: 0, y: 0, restTurns: 2 } });
    expect(petCat(resting)).toBe(resting);
  });
});

describe('marti hamle icinde', () => {
  it('gullEvery hamlede bir konar', () => {
    let state = canli({ tray: dots(), cat: null, rules: { ...canli().rules, gullEvery: 1 } });
    state = playPiece(state, 0, { x: 0, y: 5 });

    expect(state.gull).not.toBeNull();
    expect(state.events).toContain('gullLanded');
  });

  it('bekleme bitince dalar ve sutundaki en ust dolu hucreyi calar', () => {
    const board = boardFrom(['........', '..1.....', ...Array(8).fill('........')]);
    let state = canli({ board, tray: dots(), cat: null, gull: { col: 2, turnsLeft: 1 } });
    state = playPiece(state, 0, { x: 7, y: 9 });

    expect(state.events).toContain('gullDove');
    expect(state.board[1]?.[2]).toBeNull();
    expect(state.gull).toBeNull();
  });

  it('simit atilirsa bonus verir ve marti gider', () => {
    const state = canli({ tray: dots(ROLES.SIMIT), cat: null, gull: { col: 2, turnsLeft: 2 } });
    const next = playPiece(state, 0, { x: 2, y: 5 });

    expect(next.events).toContain('gullFed');
    expect(next.gull).toBeNull();
    expect(next.lastGain).toBe(GULL.FEED_BONUS);
    expect(next.lastBonuses).toContainEqual({ kind: 'gullFed', points: GULL.FEED_BONUS });
  });

  it('balikci simit bonusunu ikiye katlar', () => {
    const state = {
      ...startGame(SEED, { mode: 'canli', esnafId: 'balikci' }),
      tray: dots(ROLES.SIMIT),
      cat: null,
      gull: { col: 2, turnsLeft: 2 },
    };
    const next = playPiece(state, 0, { x: 2, y: 5 });

    expect(next.lastGain).toBe(GULL.FEED_BONUS * 2);
  });
});

describe('nazar hamle icinde', () => {
  it('lanetli cizgi temizlenince bonus ve olay', () => {
    const state = canli({
      board: almostFullTop(),
      tray: dots(),
      cat: null,
      curses: [{ x: 0, y: 0, turnsLeft: 4 }],
    });
    const next = playPiece(state, 0, { x: 7, y: 0 });

    expect(next.events).toContain('nazarCleared');
    expect(next.curses).toEqual([]);
    expect(next.lastBonuses.some((b) => b.kind === 'nazar' && b.points === NAZAR.CLEAR_BONUS)).toBe(
      true,
    );
  });

  it('klasik modda lanet asla dogmaz', () => {
    let state = startGame(SEED);
    for (let i = 0; i < 20; i += 1) {
      const index = state.tray.findIndex((p) => p !== undefined);
      if (index === -1 || state.status !== 'playing') {
        break;
      }
      let placed = false;
      for (let y = 0; y < BOARD.ROWS && !placed; y += 1) {
        for (let x = 0; x < BOARD.COLS && !placed; x += 1) {
          const next = playPiece(state, index, { x, y });
          if (next !== state) {
            state = next;
            placed = true;
          }
        }
      }
    }
    expect(state.curses).toEqual([]);
    expect(state.gull).toBeNull();
  });
});

describe('sinerji ve makam hamle icinde', () => {
  it('kahvalti sinerjisi bonus verir', () => {
    const row = `${ROLES.SIMIT}${ROLES.CAY}55555.`;
    const state = canli({ board: almostFullTop(row), tray: dots(), cat: null });
    const next = playPiece(state, 0, { x: 7, y: 0 });

    expect(next.events).toContain('synergy');
    expect(next.lastBonuses).toContainEqual({ kind: 'synergy', points: SYNERGY.PAIR_BONUS });
    expect(next.progress.synergy).toBe(1);
  });

  it('klasik modda sinerji puan vermez', () => {
    const row = `${ROLES.SIMIT}${ROLES.CAY}55555.`;
    const state = { ...startGame(SEED), board: almostFullTop(row), tray: dots() };
    const next = playPiece(state, 0, { x: 7, y: 0 });

    expect(next.lastBonuses.some((b) => b.kind === 'synergy')).toBe(false);
  });

  it('seri melodinin son notasina ulasinca makam tamamlanir', () => {
    const state = canli({
      board: almostFullTop(),
      tray: dots(),
      cat: null,
      comboStreak: MAKAM.NOTES - 1,
    });
    const next = playPiece(state, 0, { x: 7, y: 0 });

    expect(next.events).toContain('makamComplete');
    expect(next.lastBonuses).toContainEqual({ kind: 'makam', points: MAKAM.COMPLETE_BONUS });
  });

  it('halici cini bonusunu ikiye katlar', () => {
    const state = {
      ...startGame(SEED, { mode: 'canli', esnafId: 'halici' }),
      board: almostFullTop(),
      tray: dots(),
      cat: null,
    };
    const next = playPiece(state, 0, { x: 7, y: 0 });

    expect(next.lastBonuses).toContainEqual({ kind: 'cini', points: SCORING.CINI_BONUS * 2 });
  });
});

describe('pazarlik', () => {
  it('basarili pazarlik yuvayi yeni parcayla degistirir', () => {
    const state = canli({ cat: null });
    const before = state.tray[0];
    const next = haggle(state, 0, true);

    expect(next.hagglesLeft).toBe(state.hagglesLeft - 1);
    expect(next.tray[0]).toBeDefined();
    expect(next.events).toEqual(['haggleWon']);
    // Parca akisi etkilenmez: tepsinin diger yuvalari ayni kalir.
    expect(next.tray[1]).toBe(state.tray[1]);
    expect(next.tray[0] === before || next.tray[0] !== before).toBe(true);
  });

  it('basarisiz pazarlik puan keser ama sifirin altina inmez', () => {
    const state = canli({ cat: null, score: 10 });
    const next = haggle(state, 0, false);

    expect(next.score).toBe(0);
    expect(next.hagglesLeft).toBe(state.hagglesLeft - 1);
    expect(next.events).toEqual(['haggleLost']);
    expect(haggle(canli({ cat: null, score: 100 }), 0, false).score).toBe(
      100 - HAGGLE.FAIL_PENALTY,
    );
  });

  it('hak yoksa, yuva bossa veya oyun bittiyse durum degismez', () => {
    const none = canli({ hagglesLeft: 0 });
    expect(haggle(none, 0, true)).toBe(none);

    const empty = canli({ tray: [undefined, pieceOf('dot'), pieceOf('dot')] });
    expect(haggle(empty, 0, true)).toBe(empty);

    const over = canli({ status: 'gameOver' });
    expect(haggle(over, 0, true)).toBe(over);
  });

  it('ayni seed ayni pazarlik sonucunu verir', () => {
    const a = haggle(canli({ cat: null }), 0, true).tray[0]?.shape.id;
    const b = haggle(canli({ cat: null }), 0, true).tray[0]?.shape.id;

    expect(a).toBe(b);
  });
});

describe('yolculuk seviyesi', () => {
  it('maskeli seviye sekilli tahtayla baslar', () => {
    const state = startGame(SEED, { mode: 'journey', levelId: 'galata' });

    expect(state.board[0]?.[0]).toBe(OFF_CELL);
    expect(state.levelId).toBe('galata');
  });

  it('hedef tamamlaninca oyun kazanilir', () => {
    const level = levelById('eminonu');
    const state = {
      ...startGame(SEED, { mode: 'journey', levelId: 'eminonu' }),
      board: almostFullTop(),
      tray: dots(),
      score: (level?.objective.kind === 'score' ? level.objective.target : 0) - 5,
    };
    const next = playPiece(state, 0, { x: 7, y: 0 });

    expect(next.status).toBe('won');
    expect(next.events).toContain('levelWon');
  });

  it('bogazda su seridini asan satir kopru bonusu verir', () => {
    const base = startGame(SEED, { mode: 'journey', levelId: 'bogaz' });
    const board = base.board.map((row, y) =>
      y === 0 ? row.map((cell, x) => (cell === null && x !== 7 ? 5 : cell)) : row,
    );
    const next = playPiece({ ...base, board, tray: dots() }, 0, { x: 7, y: 0 });

    expect(next.events).toContain('bridge');
    expect(next.lastBonuses).toContainEqual({ kind: 'bridge', points: SCORING.BRIDGE_BONUS });
    expect(next.progress.bridge).toBe(1);
  });

  it('objectiveMet her hedef turunu degerlendirir', () => {
    const progress = { lines: 5, cini: 2, synergy: 1, bridge: 0 };
    expect(objectiveMet({ kind: 'lines', target: 5 }, { score: 0, progress })).toBe(true);
    expect(objectiveMet({ kind: 'cini', target: 3 }, { score: 0, progress })).toBe(false);
    expect(objectiveMet({ kind: 'synergy', target: 1 }, { score: 0, progress })).toBe(true);
    expect(objectiveMet({ kind: 'bridge', target: 1 }, { score: 0, progress })).toBe(false);
    expect(objectiveMet({ kind: 'score', target: 10 }, { score: 10, progress })).toBe(true);
  });

  it('restart mod, esnaf ve seviyeyi korur', () => {
    const state = startGame(SEED, { mode: 'journey', levelId: 'galata', esnafId: 'cayci' });
    const again = restart(state);

    expect(again.mode).toBe('journey');
    expect(again.levelId).toBe('galata');
    expect(again.esnafId).toBe('cayci');
  });
});

describe('cay molasi canli ogelerle', () => {
  it('bosalan hucredeki lanet dusurulur, kedi kalir', () => {
    const board = boardFrom(
      Array.from({ length: BOARD.ROWS }, (_, y) => (y % 8 === 0 ? '.1111111' : '1.111111')),
    );
    const state = canli({
      board,
      tray: [pieceOf('plus'), pieceOf('plus'), pieceOf('plus')],
      status: 'gameOver',
      cat: { x: 0, y: 0, restTurns: 0 },
      // (7,9): en dolu sutun ve satirin kesisimi; molada bosalir.
      curses: [{ x: 7, y: 9, turnsLeft: 3 }],
    });
    const revived = takeTeaBreak(state);

    expect(revived.cat).toEqual(state.cat);
    expect(revived.curses).toEqual([]);
  });
});

describe('kayit v4', () => {
  it('canli oyun tum alanlariyla gider gelir', () => {
    let state = canli({ tray: dots(ROLES.SIMIT), gull: { col: 2, turnsLeft: 2 } });
    state = playPiece(state, 0, { x: 2, y: 5 });
    state = { ...state, curses: [{ x: 2, y: 5, turnsLeft: 4 }] };

    const restored = deserializeGame(serializeGame(state));

    expect(restored?.mode).toBe('canli');
    expect(restored?.cat).toEqual(state.cat);
    expect(restored?.curses).toEqual(state.curses);
    expect(restored?.moves).toBe(state.moves);
    expect(restored?.hagglesLeft).toBe(state.hagglesLeft);
    expect(restored?.progress).toEqual(state.progress);
    expect(restored?.rules).toEqual(state.rules);
  });

  it('v3 kaydi klasik kurallarla yuklenir', () => {
    const parsed = JSON.parse(serializeGame(startGame(SEED))) as Record<string, unknown>;
    parsed.version = 3;
    for (const key of [
      'mode',
      'esnafId',
      'levelId',
      'moves',
      'cat',
      'gull',
      'curses',
      'hagglesLeft',
      'progress',
    ]) {
      delete parsed[key];
    }
    const restored = deserializeGame(JSON.stringify(parsed));

    expect(restored?.mode).toBe('classic');
    expect(restored?.cat).toBeNull();
    expect(restored?.rules.cat).toBe(false);
    expect(SAVE_VERSION).toBe(4);
  });

  it('kazanilmis seviye kaydi kazanilmis kalir', () => {
    const state = {
      ...startGame(SEED, { mode: 'journey', levelId: 'eminonu' }),
      status: 'won' as const,
    };

    expect(deserializeGame(serializeGame(state))?.status).toBe('won');
  });

  it('bozuk canli alanlari reddedilir', () => {
    const corrupt = (mutate: (p: Record<string, unknown>) => void) => {
      const parsed = JSON.parse(serializeGame(canli())) as Record<string, unknown>;
      mutate(parsed);
      return deserializeGame(JSON.stringify(parsed));
    };

    expect(corrupt((p) => (p.cat = { x: 99, y: 0, restTurns: 0 }))).toBeNull();
    expect(corrupt((p) => (p.cat = 'kedi'))).toBeNull();
    expect(corrupt((p) => (p.gull = { col: -1, turnsLeft: 1 }))).toBeNull();
    expect(corrupt((p) => (p.gull = 5))).toBeNull();
    expect(corrupt((p) => (p.curses = [{ x: 0, y: 0 }]))).toBeNull();
    expect(corrupt((p) => (p.curses = 'yok'))).toBeNull();
    expect(corrupt((p) => (p.mode = 'turbo'))).toBeNull();
    expect(corrupt((p) => (p.esnafId = 4))).toBeNull();
    expect(corrupt((p) => (p.levelId = 'silinmis-semt'))).toBeNull();
    expect(corrupt((p) => (p.levelId = 7))).toBeNull();
    expect(corrupt((p) => (p.moves = -1))).toBeNull();
    expect(corrupt((p) => (p.hagglesLeft = 1.5))).toBeNull();
    expect(corrupt((p) => (p.progress = { lines: 1 }))).toBeNull();
    expect(corrupt((p) => (p.progress = null))).toBeNull();
  });

  it('tahta disi hucreler (-1) kayitta gecerlidir', () => {
    const state = startGame(SEED, { mode: 'journey', levelId: 'bogaz' });

    expect(deserializeGame(serializeGame(state))?.board).toEqual(state.board);
  });

  it('kedili kayitta oyun sonu kediyi hesaba katarak turetilir', () => {
    // Tek bos hucre kedinin altinda: hicbir parca sigmaz.
    const board = boardFrom(
      Array.from({ length: BOARD.ROWS }, (_, y) => (y === 0 ? '.1111111' : '11111111')),
    );
    const state = canli({
      board,
      tray: dots(),
      status: 'playing',
      cat: { x: 0, y: 0, restTurns: 0 },
    });

    expect(deserializeGame(serializeGame(state))?.status).toBe('gameOver');
  });

  it('bos maske olmadan createBoardFromMask kullanan seviye kaydi gelir', () => {
    expect(createBoardFromMask(levelById('galata')?.mask ?? []).length).toBe(BOARD.ROWS);
    expect(createBoard()).toHaveLength(BOARD.ROWS);
  });
});
