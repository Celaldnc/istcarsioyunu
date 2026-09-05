import { burstParticles, clearedCells } from '../burstParticles';

import { BOARD, FX, THEME } from '@/constants/config';
import { computeBoardLayout } from '@/game/core/layout';

const layout = computeBoardLayout(390);

describe('clearedCells', () => {
  it('bir satir sutun sayisi kadar hucre verir', () => {
    expect(clearedCells({ rows: [2], cols: [] })).toHaveLength(BOARD.COLS);
  });

  it('kesisim hucresi bir kez sayilir', () => {
    expect(clearedCells({ rows: [0], cols: [0] })).toHaveLength(BOARD.COLS + BOARD.ROWS - 1);
  });

  it('bos cizgi listesi bos doner', () => {
    expect(clearedCells({ rows: [], cols: [] })).toEqual([]);
  });
});

describe('burstParticles', () => {
  it('temizleme yoksa parcacik yoktur', () => {
    expect(burstParticles({ rows: [], cols: [] }, layout, 1)).toEqual([]);
  });

  it('hucre basina sabit sayida parcacik uretir', () => {
    const particles = burstParticles({ rows: [3], cols: [] }, layout, 1);

    expect(particles).toHaveLength(BOARD.COLS * FX.PARTICLES_PER_CELL);
  });

  it('buyuk combo tavani asmaz', () => {
    const particles = burstParticles({ rows: [0, 1, 2], cols: [0, 1, 2] }, layout, 1);

    expect(particles.length).toBeLessThanOrEqual(FX.MAX_PARTICLES);
    expect(particles.length).toBeGreaterThan(0);
  });

  it('tavan asilinca parcaciklar tum cizgiye yayilir (yalnizca basina yigilmaz)', () => {
    const particles = burstParticles({ rows: [0, 1, 2], cols: [0, 1, 2] }, layout, 1);
    const xs = new Set(particles.map((p) => Math.round(p.x)));

    expect(xs.size).toBeGreaterThan(4);
  });

  it('ayni seed ayni patlamayi verir', () => {
    const a = burstParticles({ rows: [1], cols: [] }, layout, 42);
    const b = burstParticles({ rows: [1], cols: [] }, layout, 42);

    expect(a).toEqual(b);
  });

  it('farkli seed farkli patlama verir', () => {
    const a = burstParticles({ rows: [1], cols: [] }, layout, 1);
    const b = burstParticles({ rows: [1], cols: [] }, layout, 2);

    expect(a).not.toEqual(b);
  });

  it('parcaciklar temizlenen hucrelerin icinden baslar', () => {
    for (const p of burstParticles({ rows: [4], cols: [] }, layout, 3)) {
      expect(p.x).toBeGreaterThanOrEqual(layout.originX);
      expect(p.x).toBeLessThanOrEqual(layout.originX + layout.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(layout.height);
    }
  });

  it('renk kimlikleri palet icindedir ve boyut pozitiftir', () => {
    for (const p of burstParticles({ rows: [0], cols: [5] }, layout, 9)) {
      expect(p.colorId).toBeGreaterThanOrEqual(0);
      expect(p.colorId).toBeLessThan(THEME.PALETTE_SIZE);
      expect(p.size).toBeGreaterThan(0);
    }
  });

  it('hareket mesafesi hucre boyutuyla olceklenir', () => {
    const small = burstParticles({ rows: [0], cols: [] }, computeBoardLayout(320), 5);
    const large = burstParticles({ rows: [0], cols: [] }, computeBoardLayout(600), 5);
    const reach = (ps: typeof small) => Math.max(...ps.map((p) => Math.hypot(p.dx, p.dy)));

    expect(reach(large)).toBeGreaterThan(reach(small));
  });
});
