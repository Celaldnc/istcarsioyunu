import { countFilledCells, isBoardEmpty } from '../board';
import { playPiece, restart, startGame, type GameState } from '../game';
import { shapeById } from '../pieces';
import type { Board, Piece } from '../types';

import { BOARD, SCORING, TRAY } from '@/constants/config';

const SEED = 20260905;

const boardFrom = (rows: string[]): Board =>
  rows.map((row) => [...row].map((ch) => (ch === '.' ? null : Number(ch))));

/** Tepsideki ilk dolu yuvanin indeksi. */
const firstFilled = (tray: readonly (Piece | undefined)[]): number =>
  tray.findIndex((piece) => piece !== undefined);

/** Parcanin sigdigi ilk konumu bulur (tahtanin ustunden tarar). */
function firstFit(state: ReturnType<typeof startGame>, index: number) {
  const piece = state.tray[index];
  if (piece === undefined) {
    throw new Error('Test kurulumu hatali: yuva bos.');
  }
  for (let y = 0; y < state.board.length; y += 1) {
    for (let x = 0; x < (state.board[0]?.length ?? 0); x += 1) {
      const next = playPiece(state, index, { x, y });
      if (next !== state) {
        return { x, y };
      }
    }
  }
  throw new Error('Test kurulumu hatali: parca hicbir yere sigmadi.');
}

describe('startGame', () => {
  it('bos tahta ve dolu tepsiyle baslar', () => {
    const state = startGame(SEED);

    expect(isBoardEmpty(state.board)).toBe(true);
    expect(state.tray).toHaveLength(TRAY.PIECE_COUNT);
    expect(state.tray.every((p) => p !== undefined)).toBe(true);
    expect(state.score).toBe(0);
    expect(state.status).toBe('playing');
  });

  it('ayni seed ayni baslangici verir (Daily modu)', () => {
    expect(startGame(SEED)).toEqual(startGame(SEED));
  });

  it('farkli seed farkli tepsi verir', () => {
    const a = startGame(1).tray.map((p) => p?.shape.id);
    const b = startGame(999).tray.map((p) => p?.shape.id);

    expect(a).not.toEqual(b);
  });

  it('cekilen parca sayisini kaydeder (geri yukleme icin)', () => {
    expect(startGame(SEED).piecesDrawn).toBe(TRAY.PIECE_COUNT);
  });

  it('baslangic tahtasi doluysa dogrudan oyun sonu olur', () => {
    const full = boardFrom(Array.from({ length: 10 }, () => '1'.repeat(8)));

    expect(startGame(SEED, full).status).toBe('gameOver');
  });
});

describe('playPiece', () => {
  it('gecerli hamle tahtayi doldurur ve yuvayi bosaltir', () => {
    const state = startGame(SEED);
    const index = firstFilled(state.tray);
    const next = playPiece(state, index, firstFit(state, index));

    expect(countFilledCells(next.board)).toBeGreaterThan(0);
    expect(next.tray[index]).toBeUndefined();
  });

  it('gecersiz hamlede durum DEGISMEZ (ayni referans)', () => {
    const state = startGame(SEED);

    // Tahtanin cok disinda bir konum
    expect(playPiece(state, 0, { x: 99, y: 99 })).toBe(state);
  });

  it('bos yuvayi oynamaya calismak durumu degistirmez', () => {
    const state = startGame(SEED);
    const index = firstFilled(state.tray);
    const afterFirst = playPiece(state, index, firstFit(state, index));

    expect(playPiece(afterFirst, index, { x: 0, y: 0 })).toBe(afterFirst);
  });

  it('gecersiz tepsi indeksinde durumu degistirmez', () => {
    const state = startGame(SEED);

    expect(playPiece(state, 99, { x: 0, y: 0 })).toBe(state);
  });

  it('tepsi tamamen bosalinca yenilenir', () => {
    let state = startGame(SEED);

    for (let i = 0; i < TRAY.PIECE_COUNT; i += 1) {
      const index = firstFilled(state.tray);
      state = playPiece(state, index, firstFit(state, index));
    }

    expect(state.tray.every((p) => p !== undefined)).toBe(true);
    expect(state.piecesDrawn).toBe(TRAY.PIECE_COUNT * 2);
  });

  it('tepsi bitmeden yenilenmez', () => {
    const state = startGame(SEED);
    const index = firstFilled(state.tray);
    const next = playPiece(state, index, firstFit(state, index));

    expect(next.piecesDrawn).toBe(TRAY.PIECE_COUNT);
    expect(next.tray.filter((p) => p !== undefined)).toHaveLength(TRAY.PIECE_COUNT - 1);
  });

  it('satir temizleyen hamle puan ve temizleme bilgisi uretir', () => {
    // ONCEKI HALI SESSIZCE ATLANIYORDU: tepside 'dot' yoksa test hicbir
    // assertion calistirmadan return ediyordu ve bu seed'de 'dot' yok.
    // Durum artik elle kuruluyor, tepsi seed'e birakilmiyor.
    const board: Board = Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) => (y === 0 && x < BOARD.COLS - 1 ? 1 : null)),
    );
    const dot = shapeById('dot');
    if (dot === undefined) {
      throw new Error('Test kurulumu hatali: dot sekli yok.');
    }
    const state: GameState = {
      board,
      tray: [
        { shape: dot, colorId: 1 },
        { shape: dot, colorId: 1 },
        { shape: dot, colorId: 1 },
      ],
      score: 0,
      seed: 1,
      piecesDrawn: TRAY.PIECE_COUNT,
      status: 'playing',
      lastClear: { rows: [], cols: [] },
      lastGain: 0,
    };

    const next = playPiece(state, 0, { x: BOARD.COLS - 1, y: 0 });

    expect(next.lastClear).toEqual({ rows: [0], cols: [] });
    // Tek satir + tahta tamamen bosaldi -> perfect clear bonusu
    expect(next.score).toBe(SCORING.POINTS_PER_LINE + SCORING.PERFECT_CLEAR_BONUS);
    expect(next.lastGain).toBe(next.score);
  });

  it('temizleme olmayan hamlede lastClear bostur', () => {
    const state = startGame(SEED);
    const index = firstFilled(state.tray);
    const next = playPiece(state, index, firstFit(state, index));

    expect(next.lastClear).toEqual({ rows: [], cols: [] });
    expect(next.lastGain).toBe(0);
  });

  it('oyun bittikten sonra hamle kabul edilmez', () => {
    const full = boardFrom(Array.from({ length: 10 }, () => '1'.repeat(8)));
    const over = startGame(SEED, full);

    expect(playPiece(over, 0, { x: 0, y: 0 })).toBe(over);
  });

  it('girdi durumunu degistirmez (saf gecis)', () => {
    const state = startGame(SEED);
    const snapshot = JSON.stringify(state);
    const index = firstFilled(state.tray);

    playPiece(state, index, firstFit(state, index));

    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe('hamlenin oyunu bitirmesi', () => {
  const pieceOf = (id: string): Piece => {
    const shape = shapeById(id);
    if (shape === undefined) {
      throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
    }
    return { shape, colorId: 1 };
  };

  /** Verilen hucreler disinda tamamen dolu tahta. */
  const boardWithEmpties = (empties: readonly (readonly [number, number])[]): Board =>
    Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) =>
        empties.some(([ex, ey]) => ex === x && ey === y) ? null : 1,
      ),
    );

  it('son sigan parca oynandiginda oyun sonu isaretlenir', () => {
    // Capraz desen: her satirda ve her sutunda en az bir bosluk var, yani
    // tahtada hicbir cizgi dolu DEGIL. Bosluklar birbirine ortogonal komsu
    // olmadigi icin 3x3 "plus" hicbir yere sigmaz.
    const diagonal = Array.from({ length: BOARD.ROWS }, (_, y) => [y % BOARD.COLS, y] as const);
    // 0. satira ikinci bir bosluk: dolduruldugunda satir yine tamamlanmasin.
    const extra = [5, 0] as const;

    const state: GameState = {
      board: boardWithEmpties([...diagonal, extra]),
      tray: [pieceOf('dot'), pieceOf('plus'), pieceOf('plus')],
      score: 0,
      seed: 1,
      piecesDrawn: TRAY.PIECE_COUNT,
      status: 'playing',
      lastClear: { rows: [], cols: [] },
      lastGain: 0,
    };

    const next = playPiece(state, 0, { x: 5, y: 0 });

    expect(next).not.toBe(state);
    expect(next.lastClear).toEqual({ rows: [], cols: [] });
    expect(next.status).toBe('gameOver');
  });
});

describe('restart', () => {
  it('ayni seed ile bastan baslatir', () => {
    const state = startGame(SEED);
    const index = firstFilled(state.tray);
    const played = playPiece(state, index, firstFit(state, index));

    expect(restart(played)).toEqual(startGame(SEED));
  });
});
