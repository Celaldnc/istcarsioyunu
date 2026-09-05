import {
  cellOrigin,
  computeBoardLayout,
  computeTrayLayout,
  isPlayableWidth,
  pieceSize,
  pointToCell,
  traySlotAt,
} from '../layout';

import { BOARD, LAYOUT, PIECES, TRAY } from '@/constants/config';

describe('computeBoardLayout', () => {
  it('genis ekranda hucreyi MAX_CELL_SIZE ile sinirlar', () => {
    const layout = computeBoardLayout(2000);

    expect(layout.cellSize).toBe(BOARD.MAX_CELL_SIZE);
  });

  it('desteklenen en dar ekranda oynanabilir hucre boyutu birakir', () => {
    const layout = computeBoardLayout(LAYOUT.MIN_SUPPORTED_WIDTH);

    expect(layout.cellSize).toBeGreaterThanOrEqual(LAYOUT.MIN_PLAYABLE_CELL_SIZE);
  });

  it('tahta kullanilabilir genisligi asmaz', () => {
    for (const width of [320, 360, 390, 412, 480]) {
      const layout = computeBoardLayout(width);

      expect(layout.width).toBeLessThanOrEqual(width);
    }
  });

  it('hucre boyutu tamsayidir (yarim piksel kenar olusmasin)', () => {
    for (const width of [320, 355, 361, 399, 431]) {
      expect(Number.isInteger(computeBoardLayout(width).cellSize)).toBe(true);
    }
  });

  it('toplam olculer hucre ve boslugun tutarli toplamidir', () => {
    const layout = computeBoardLayout(390);

    expect(layout.width).toBe(layout.cellSize * BOARD.COLS + BOARD.CELL_GAP * (BOARD.COLS - 1));
    expect(layout.height).toBe(layout.cellSize * BOARD.ROWS + BOARD.CELL_GAP * (BOARD.ROWS - 1));
  });

  it('tahta yatayda ortalanir', () => {
    const layout = computeBoardLayout(400);

    expect(layout.originX).toBe(Math.round((400 - layout.width) / 2));
  });

  it('asiri dar ekranda bile pozitif hucre boyutu dondurur', () => {
    const layout = computeBoardLayout(10);

    expect(layout.cellSize).toBeGreaterThan(0);
  });

  it('genislik arttikca hucre boyutu azalmaz (monotonluk)', () => {
    let previous = 0;

    for (let width = 200; width <= 900; width += 17) {
      const { cellSize } = computeBoardLayout(width);
      expect(cellSize).toBeGreaterThanOrEqual(previous);
      previous = cellSize;
    }
  });
});

describe('cellOrigin', () => {
  const layout = computeBoardLayout(390);

  it('sol ust hucre tahtanin baslangicindadir', () => {
    expect(cellOrigin(layout, 0, 0)).toEqual({ x: layout.originX, y: 0 });
  });

  it('her hucre bir oncekinden hucre+bosluk kadar otededir', () => {
    const first = cellOrigin(layout, 0, 0);
    const second = cellOrigin(layout, 1, 0);

    expect(second.x - first.x).toBe(layout.cellSize + BOARD.CELL_GAP);
  });

  it('dikeyde de ayni adim gecerlidir', () => {
    const first = cellOrigin(layout, 0, 0);
    const below = cellOrigin(layout, 0, 1);

    expect(below.y - first.y).toBe(layout.cellSize + BOARD.CELL_GAP);
  });
});

describe('pointToCell', () => {
  const layout = computeBoardLayout(390);

  it('hucrenin merkezini kendi koordinatina cevirir', () => {
    for (const [cx, cy] of [
      [0, 0],
      [3, 5],
      [BOARD.COLS - 1, BOARD.ROWS - 1],
    ] as const) {
      const origin = cellOrigin(layout, cx, cy);
      const center = { x: origin.x + layout.cellSize / 2, y: origin.y + layout.cellSize / 2 };

      expect(pointToCell(layout, center)).toEqual({ x: cx, y: cy });
    }
  });

  it('tahtanin solundaki noktada null dondurur', () => {
    expect(pointToCell(layout, { x: layout.originX - 20, y: 10 })).toBeNull();
  });

  it('tahtanin sagindaki noktada null dondurur', () => {
    expect(pointToCell(layout, { x: layout.originX + layout.width + 20, y: 10 })).toBeNull();
  });

  it('tahtanin ustundeki ve altindaki noktada null dondurur', () => {
    expect(pointToCell(layout, { x: layout.originX + 5, y: -5 })).toBeNull();
    expect(pointToCell(layout, { x: layout.originX + 5, y: layout.height + 5 })).toBeNull();
  });

  it('layout ile uyusmayan tahta olcusu verilirse null dondurur', () => {
    // Layout 8x10 icin hesaplandi ama sorgu 2x2 diyor: koordinat tahtanin
    // piksel siniri icinde ama mantiksal siniri disinda kaliyor.
    const origin = cellOrigin(layout, 5, 5);

    expect(pointToCell(layout, { x: origin.x + 1, y: origin.y + 1 }, 2, 2)).toBeNull();
  });

  it('cellOrigin ile karsilikli tutarlidir (round-trip)', () => {
    for (let y = 0; y < BOARD.ROWS; y += 1) {
      for (let x = 0; x < BOARD.COLS; x += 1) {
        const origin = cellOrigin(layout, x, y);
        expect(pointToCell(layout, { x: origin.x + 1, y: origin.y + 1 })).toEqual({ x, y });
      }
    }
  });
});

describe('isPlayableWidth', () => {
  it('desteklenen en dar ekran oynanabilir sayilir', () => {
    expect(isPlayableWidth(LAYOUT.MIN_SUPPORTED_WIDTH)).toBe(true);
  });

  it('cok dar ekran oynanabilir sayilmaz', () => {
    expect(isPlayableWidth(120)).toBe(false);
  });
});

describe('computeTrayLayout', () => {
  it('genis ekranda hucreyi TRAY.MAX_CELL_SIZE ile sinirlar', () => {
    expect(computeTrayLayout(2000).cellSize).toBe(TRAY.MAX_CELL_SIZE);
  });

  it('yuvalar kullanilabilir genisligi asmaz', () => {
    for (const width of [320, 360, 390, 412]) {
      const tray = computeTrayLayout(width);
      const total = tray.slotWidth * TRAY.PIECE_COUNT + TRAY.SLOT_GAP * (TRAY.PIECE_COUNT - 1);

      expect(total).toBeLessThanOrEqual(width);
    }
  });

  it('en genis parca yuvaya sigar', () => {
    for (const width of [320, 360, 390]) {
      const tray = computeTrayLayout(width);
      const widest = pieceSize(tray.cellSize, PIECES.MAX_SPAN, PIECES.MAX_SPAN);

      expect(widest.width).toBeLessThanOrEqual(tray.slotWidth);
      expect(widest.height).toBeLessThanOrEqual(tray.height);
    }
  });

  it('hucre boyutu tamsayi ve pozitiftir', () => {
    for (const width of [40, 100, 321, 777]) {
      const { cellSize } = computeTrayLayout(width);

      expect(Number.isInteger(cellSize)).toBe(true);
      expect(cellSize).toBeGreaterThan(0);
    }
  });

  it('tepsi hucresi tahta hucresinden kucuktur (onizleme oldugu icin)', () => {
    expect(computeTrayLayout(390).cellSize).toBeLessThan(computeBoardLayout(390).cellSize);
  });
});

describe('pieceSize', () => {
  it('tek hucrede bosluk eklemez', () => {
    expect(pieceSize(20, 1, 1, 2)).toEqual({ width: 20, height: 20 });
  });

  it('hucreler arasina bosluk ekler', () => {
    expect(pieceSize(20, 3, 2, 2)).toEqual({ width: 64, height: 42 });
  });
});

describe('traySlotAt', () => {
  const width = 390;
  const tray = computeTrayLayout(width);
  const rowWidth = tray.slotWidth * TRAY.PIECE_COUNT + TRAY.SLOT_GAP * (TRAY.PIECE_COUNT - 1);
  const left = (width - rowWidth) / 2;
  const step = tray.slotWidth + TRAY.SLOT_GAP;

  it('her yuvanin merkezini kendi indeksine cevirir', () => {
    for (let i = 0; i < TRAY.PIECE_COUNT; i += 1) {
      const center = left + i * step + tray.slotWidth / 2;

      expect(traySlotAt(tray, width, center)).toBe(i);
    }
  });

  it('satirin solunda ve saginda null dondurur', () => {
    expect(traySlotAt(tray, width, left - 5)).toBeNull();
    expect(traySlotAt(tray, width, left + rowWidth + 5)).toBeNull();
  });

  it('yuvalar arasindaki bosluga dokunuldugunda null dondurur', () => {
    const inGap = left + tray.slotWidth + TRAY.SLOT_GAP / 2;

    expect(traySlotAt(tray, width, inGap)).toBeNull();
  });

  it('ilk yuvanin sol kenari dahildir', () => {
    expect(traySlotAt(tray, width, left)).toBe(0);
  });

  it('son yuvanin sag kenari haric tutulur', () => {
    expect(traySlotAt(tray, width, left + rowWidth)).toBeNull();
  });
});
