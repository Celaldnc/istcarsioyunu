import { shade } from '../color';

describe('shade', () => {
  it('pozitif miktar rengi acar', () => {
    expect(shade('#000000', 0.5)).toBe('#808080');
  });

  it('negatif miktar rengi koyultur', () => {
    expect(shade('#ffffff', -0.5)).toBe('#808080');
  });

  it('sifir rengi degistirmez', () => {
    expect(shade('#C6803A', 0)).toBe('#c6803a');
  });

  it('1 tam beyaz, -1 tam siyah verir', () => {
    expect(shade('#123456', 1)).toBe('#ffffff');
    expect(shade('#123456', -1)).toBe('#000000');
  });

  it('araligi asan miktari kirpar', () => {
    expect(shade('#123456', 5)).toBe('#ffffff');
  });

  it('taninmayan bicimi oldugu gibi dondurur (cizim patlamasin)', () => {
    expect(shade('rgba(0,0,0,0.5)', 0.3)).toBe('rgba(0,0,0,0.5)');
    expect(shade('#fff', 0.3)).toBe('#fff');
  });

  it('bozuk miktarda rengi oldugu gibi dondurur', () => {
    expect(shade('#123456', Number.NaN)).toBe('#123456');
  });
});
