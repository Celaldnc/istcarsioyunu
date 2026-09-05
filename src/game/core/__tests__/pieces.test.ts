import { canPlace, createBoard } from '../board';
import { RNG_CALLS_PER_PIECE, SHAPES, generatePieceSet, shapeById } from '../pieces';
import { advance, createRng } from '../rng';

import { PIECES, THEME, TRAY } from '@/constants/config';

describe('SHAPES katalogu', () => {
  it('spec/`Block Blast` standardini karsilayacak kadar sekil icerir', () => {
    expect(SHAPES.length).toBeGreaterThanOrEqual(8);
  });

  it('sekil kimlikleri benzersizdir', () => {
    const ids = SHAPES.map((s) => s.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SHAPES.map((s) => [s.id, s] as const))('%s: en az bir hucresi vardir', (_id, shape) => {
    expect(shape.cells.length).toBeGreaterThan(0);
  });

  it.each(SHAPES.map((s) => [s.id, s] as const))(
    '%s: koordinatlari (0,0) baz alir, negatif yoktur',
    (_id, shape) => {
      expect(Math.min(...shape.cells.map((c) => c.x))).toBe(0);
      expect(Math.min(...shape.cells.map((c) => c.y))).toBe(0);
    },
  );

  it.each(SHAPES.map((s) => [s.id, s] as const))(
    '%s: bildirdigi width/height gercek sinirlariyla ortusur',
    (_id, shape) => {
      expect(shape.width).toBe(Math.max(...shape.cells.map((c) => c.x)) + 1);
      expect(shape.height).toBe(Math.max(...shape.cells.map((c) => c.y)) + 1);
    },
  );

  it.each(SHAPES.map((s) => [s.id, s] as const))('%s: ayni hucreyi tekrarlamaz', (_id, shape) => {
    const keys = shape.cells.map((c) => `${c.x},${c.y}`);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(SHAPES.map((s) => [s.id, s] as const))(
    '%s: config.PIECES.MAX_SPAN sinirini asmaz',
    (_id, shape) => {
      expect(shape.width).toBeLessThanOrEqual(PIECES.MAX_SPAN);
      expect(shape.height).toBeLessThanOrEqual(PIECES.MAX_SPAN);
    },
  );

  it.each(SHAPES.map((s) => [s.id, s] as const))(
    '%s: bos tahtaya yerlestirilebilir',
    (_id, shape) => {
      expect(canPlace(createBoard(), { shape, colorId: 0 }, { x: 0, y: 0 })).toBe(true);
    },
  );
});

describe('shapeById', () => {
  it('bilinen kimligi cozer', () => {
    expect(shapeById('dot')?.id).toBe('dot');
  });

  it('bilinmeyen kimlikte undefined dondurur', () => {
    expect(shapeById('boyle-bir-sekil-yok')).toBeUndefined();
  });
});

describe('generatePieceSet', () => {
  it('varsayilan olarak tepsi kadar parca uretir', () => {
    expect(generatePieceSet(createRng(1))).toHaveLength(TRAY.PIECE_COUNT);
  });

  it('istenen sayida parca uretir', () => {
    expect(generatePieceSet(createRng(1), 5)).toHaveLength(5);
  });

  it('ayni seed ayni parca setini uretir (Daily modu)', () => {
    expect(generatePieceSet(createRng(2026), 10)).toEqual(generatePieceSet(createRng(2026), 10));
  });

  it('farkli seed farkli set uretir', () => {
    expect(generatePieceSet(createRng(1), 10)).not.toEqual(generatePieceSet(createRng(2), 10));
  });

  it('yalnizca kataloktaki sekilleri kullanir', () => {
    const ids = new Set(SHAPES.map((s) => s.id));

    for (const piece of generatePieceSet(createRng(5), 50)) {
      expect(ids.has(piece.shape.id)).toBe(true);
    }
  });

  it('renk kimlikleri palet sinirlari icindedir', () => {
    for (const piece of generatePieceSet(createRng(6), 50)) {
      expect(Number.isInteger(piece.colorId)).toBe(true);
      expect(piece.colorId).toBeGreaterThanOrEqual(0);
      expect(piece.colorId).toBeLessThan(THEME.PALETTE_SIZE);
    }
  });

  it('yeterince uzun bir seride birden fazla sekil cikarir', () => {
    const shapes = new Set(generatePieceSet(createRng(9), 60).map((p) => p.shape.id));

    expect(shapes.size).toBeGreaterThan(1);
  });

  it('sifir parca istenirse bos dizi dondurur', () => {
    expect(generatePieceSet(createRng(1), 0)).toEqual([]);
  });
});

describe('RNG_CALLS_PER_PIECE invarianti', () => {
  it('parca basina harcanan rng cagrisi sayisi sabitle uyusur', () => {
    // Bu test kayit formatinin en kirilgan noktasini korur: generatePieceSet
    // fazladan bir rng() cagrisi eklerse (rotasyon, nadir parca, renk
    // agirligi...) TUM mevcut kayitlar sessizce desenkronize olur ve Daily
    // modunun "herkes ayni bulmaca" garantisi kirilir.
    const full = generatePieceSet(createRng(42), 5);

    const skipped = createRng(42, 3 * RNG_CALLS_PER_PIECE);

    expect(generatePieceSet(skipped, 2)).toEqual(full.slice(3));
  });

  it('advance ile ileri sarma da ayni sonucu verir', () => {
    const full = generatePieceSet(createRng(7), 6);
    const rng = createRng(7);
    advance(rng, 4 * RNG_CALLS_PER_PIECE);

    expect(generatePieceSet(rng, 2)).toEqual(full.slice(4));
  });
});
