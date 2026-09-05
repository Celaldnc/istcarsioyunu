import { createBoard } from '../board';
import { playPiece, startGame, type GameState } from '../game';
import {
  cellOrigin,
  computeBoardLayout,
  computeTrayLayout,
  isPlayableSize,
  pointToCell,
  traySlotAt,
} from '../layout';
import { generatePieceSet, shapeById } from '../pieces';
import { dragOrigin } from '../placement';
import { createRng, pickWeighted } from '../rng';
import type { Board, Piece } from '../types';

import { BOARD, DRAG, LAYOUT, SCORING, THEME, TRAY } from '@/constants/config';

const layout = computeBoardLayout(390);

const pieceOf = (id: string, colorId = 1): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`sekil yok: ${id}`);
  }
  return { shape, colorId };
};

// --- G1: dragOrigin en YAKIN hucreye yuvarlar (floor degil) ---------------
describe('G1 dragOrigin yuvarlama', () => {
  const step = layout.cellSize + BOARD.CELL_GAP;
  const pointerForOffset = (piece: Piece, cellX: number, cellY: number, dx: number, dy: number) => {
    const o = cellOrigin(layout, cellX, cellY);
    return {
      x: o.x + (piece.shape.width * step - BOARD.CELL_GAP) / 2 + dx,
      y: o.y + DRAG.LIFT * layout.cellSize + layout.cellSize / 2 + dy,
    };
  };

  it('hucrenin yarisindan fazla kayan parmak SONRAKI hucreye oturur', () => {
    const piece = pieceOf('dot');
    const pointer = pointerForOffset(piece, 3, 4, step * 0.6, step * 0.6);

    expect(dragOrigin(layout, pointer, piece)).toEqual({ x: 4, y: 5 });
  });

  it('hucrenin yarisindan azi AYNI hucrede kalir', () => {
    const piece = pieceOf('dot');
    const pointer = pointerForOffset(piece, 3, 4, step * 0.4, step * 0.4);

    expect(dragOrigin(layout, pointer, piece)).toEqual({ x: 3, y: 4 });
  });

  it('geriye dogru yarim hucreden fazla kayma ONCEKI hucreye oturur', () => {
    const piece = pieceOf('dot');
    const pointer = pointerForOffset(piece, 3, 4, -step * 0.6, -step * 0.6);

    expect(dragOrigin(layout, pointer, piece)).toEqual({ x: 2, y: 3 });
  });
});

// --- G2: tahta ekran kenar bosluklarina sigar -----------------------------
describe('G2 computeBoardLayout kenar boslugu', () => {
  it.each([320, 340, 360, 390, 412, 480])('%ipx: tahta + 2x SCREEN_MARGIN ekrana sigar', (w) => {
    expect(computeBoardLayout(w).width + BOARD.SCREEN_MARGIN * 2).toBeLessThanOrEqual(w);
  });

  it('en dar desteklenen ekranda beklenen somut olculer', () => {
    expect(computeBoardLayout(LAYOUT.MIN_SUPPORTED_WIDTH)).toEqual({
      cellSize: 36,
      width: 302,
      height: 378,
      originX: 9,
    });
  });

  it('tek piksellik artikta tahta yatayda YUKARI yuvarlanarak ortalanir', () => {
    const l = computeBoardLayout(321);

    expect(l.width).toBe(302);
    expect(l.originX).toBe(10);
  });

  it.each([320, 340, 360, 390, 412])('%ipx: tepsi satiri da kenar boslugua sigar', (w) => {
    const t = computeTrayLayout(w);
    const rowWidth = t.slotWidth * TRAY.PIECE_COUNT + TRAY.SLOT_GAP * (TRAY.PIECE_COUNT - 1);

    expect(rowWidth + BOARD.SCREEN_MARGIN * 2).toBeLessThanOrEqual(w);
  });
});

// --- G3: isPlayableSize tam sinir ----------------------------------------
describe('G3 isPlayableSize sinir', () => {
  it('hucre tam MIN_PLAYABLE_CELL_SIZE oldugunda oynanabilir sayilir', () => {
    expect(computeBoardLayout(290).cellSize).toBe(LAYOUT.MIN_PLAYABLE_CELL_SIZE);
    expect(isPlayableSize(290)).toBe(true);
  });

  it('bir hucre altinda oynanamaz sayilir', () => {
    expect(computeBoardLayout(285).cellSize).toBeLessThan(LAYOUT.MIN_PLAYABLE_CELL_SIZE);
    expect(isPlayableSize(285)).toBe(false);
  });
});

// --- G4: pointToCell sag/alt kenar dislanir -------------------------------
describe('G4 pointToCell kenar', () => {
  it('tahtanin tam sag kenari disaridadir', () => {
    expect(pointToCell(layout, { x: layout.originX + layout.width, y: 10 })).toBeNull();
  });

  it('tahtanin tam alt kenari disaridadir', () => {
    expect(pointToCell(layout, { x: layout.originX + 5, y: layout.height })).toBeNull();
  });

  it('kenarin bir piksel icerisi son hucredir', () => {
    const point = { x: layout.originX + layout.width - 1, y: layout.height - 1 };

    expect(pointToCell(layout, point)).toEqual({ x: BOARD.COLS - 1, y: BOARD.ROWS - 1 });
  });
});

// --- G5: traySlotAt satirin sagi asla indeks dondurmez --------------------
describe('G5 traySlotAt satir disi', () => {
  const width = 390;
  const tray = computeTrayLayout(width);
  const rowWidth = tray.slotWidth * TRAY.PIECE_COUNT + TRAY.SLOT_GAP * (TRAY.PIECE_COUNT - 1);
  const left = (width - rowWidth) / 2;

  it.each([1, 5, 20, 60, 130])('satirin %ipx sagi null dondurur', (dx) => {
    expect(traySlotAt(tray, width, left + rowWidth + dx)).toBeNull();
  });

  it('dondurulen indeks her zaman gecerli araliktadir', () => {
    for (let x = -50; x < width + 50; x += 1) {
      const index = traySlotAt(tray, width, x);
      if (index !== null) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(TRAY.PIECE_COUNT);
      }
    }
  });
});

// --- G6: tepsi yenilenince uretecin DEVAMI gelir --------------------------
describe('G6 tepsi yenileme dizisi', () => {
  it('yenilenen tepsi uretecin devamindan gelir (ayni parcalar tekrarlanmaz)', () => {
    let state = startGame(20260905);

    for (let i = 0; i < TRAY.PIECE_COUNT; i += 1) {
      const index = state.tray.findIndex((p) => p !== undefined);
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
      expect(placed).toBe(true);
    }

    expect(state.piecesDrawn).toBe(TRAY.PIECE_COUNT * 2);

    const expected = generatePieceSet(createRng(20260905), TRAY.PIECE_COUNT * 2).slice(
      TRAY.PIECE_COUNT,
    );

    expect(state.tray.map((p) => p?.shape.id)).toEqual(expected.map((p) => p.shape.id));
    expect(state.tray.map((p) => p?.colorId)).toEqual(expected.map((p) => p.colorId));
  });
});

// --- G7: playPiece cizgi temizleyince puan ve lastGain --------------------
describe('G7 playPiece skor akisi (deterministik kurulum)', () => {
  const almostFullTopRow = (): Board =>
    Array.from({ length: BOARD.ROWS }, (_, y) =>
      Array.from({ length: BOARD.COLS }, (_, x) => (y === 0 && x < BOARD.COLS - 1 ? 1 : null)),
    );

  const stateWith = (board: Board): GameState => ({
    board,
    tray: [pieceOf('dot'), pieceOf('dot'), pieceOf('dot')],
    score: 0,
    seed: 1,
    piecesDrawn: TRAY.PIECE_COUNT,
    status: 'playing',
    lastClear: { rows: [], cols: [] },
    lastGain: 0,
    comboStreak: 0,
    lastCini: { rows: [], cols: [] },
    teaBreaksLeft: 1,
  });

  it('son bosluga yerlestirme satiri temizler, puan ve lastGain verir', () => {
    const next = playPiece(stateWith(almostFullTopRow()), 0, { x: BOARD.COLS - 1, y: 0 });

    expect(next.lastClear).toEqual({ rows: [0], cols: [] });
    // Satir tek renkli oldugu icin Cini bonusu da gelir.
    expect(next.score).toBe(
      SCORING.POINTS_PER_LINE + SCORING.CINI_BONUS + SCORING.PERFECT_CLEAR_BONUS,
    );
    expect(next.lastGain).toBe(next.score);
  });

  it('puansiz ikinci hamle skoru korur ama lastGain sifirlanir', () => {
    const first = playPiece(stateWith(almostFullTopRow()), 0, { x: BOARD.COLS - 1, y: 0 });
    const second = playPiece(first, 1, { x: 0, y: 5 });

    expect(second.score).toBe(first.score);
    expect(second.lastGain).toBe(0);
  });
});

// --- G8: renk kimlikleri paletin TAMAMINI kullanir ------------------------
describe('G8 renk dagilimi', () => {
  it('yeterince uzun seride tum palet renkleri cikar', () => {
    const seen = new Set(generatePieceSet(createRng(11), 300).map((p) => p.colorId));

    expect(seen.size).toBe(THEME.PALETTE_SIZE);
    expect(Math.max(...seen)).toBe(THEME.PALETTE_SIZE - 1);
  });
});

describe('G9 sanity', () => {
  it('bos tahta olculeri', () => {
    expect(createBoard()).toHaveLength(BOARD.ROWS);
  });
});

// --- G10: agirligi 0 olan eleman rng tam sinira dustugunde de secilmez ----
describe('G10 pickWeighted sinir degeri', () => {
  it('rng tam 0 dondurdugunde bile sifir agirlikli eleman secilmez', () => {
    const items = [
      { value: 'asla', weight: 0 },
      { value: 'hep', weight: 1 },
    ];

    expect(pickWeighted(() => 0, items)).toBe('hep');
  });

  it('rng 1e ok yakinken son eleman secilir', () => {
    const items = [
      { value: 'ilk', weight: 1 },
      { value: 'son', weight: 1 },
    ];

    expect(pickWeighted(() => 0.9999999, items)).toBe('son');
  });
});
