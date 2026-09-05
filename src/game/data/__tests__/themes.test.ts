import { shapeLabel } from '../shapeLabels';
import { CARSI, DEFAULT_THEME, THEMES, colorFor, isPaletteValid, spriteFor } from '../themes';

import { THEME } from '@/constants/config';
import { SHAPES } from '@/game/core/pieces';

describe('temalar', () => {
  it.each(THEMES.map((t) => [t.id, t] as const))(
    '%s: paleti config.THEME.PALETTE_SIZE ile ayni uzunlukta',
    (_id, theme) => {
      // Parca uretici renk kimliklerini 0..PALETTE_SIZE-1 arasindan seciyor;
      // palet kisa kalirsa bazi parcalar renksiz kalirdi.
      expect(theme.palette).toHaveLength(THEME.PALETTE_SIZE);
      expect(isPaletteValid(theme)).toBe(true);
    },
  );

  it.each(THEMES.map((t) => [t.id, t] as const))(
    '%s: tum renkleri gecerli hex bicimindedir',
    (_id, theme) => {
      const colors = [
        theme.boardBackground,
        theme.emptyCell,
        theme.ghostValid,
        theme.ghostInvalid,
        ...theme.palette,
      ];

      for (const color of colors) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    },
  );

  it.each(THEMES.map((t) => [t.id, t] as const))(
    '%s: palet renkleri birbirinden farklidir',
    (_id, theme) => {
      expect(new Set(theme.palette).size).toBe(theme.palette.length);
    },
  );

  it('tema kimlikleri benzersizdir', () => {
    const ids = THEMES.map((t) => t.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('varsayilan tema katalogun icindedir', () => {
    expect(THEMES).toContain(DEFAULT_THEME);
  });
});

describe('colorFor', () => {
  it('gecerli renk kimligi icin palet rengini dondurur', () => {
    expect(colorFor(CARSI, 0)).toBe(CARSI.palette[0]);
  });

  it('palet disi kimlikte bos hucre rengine duser (cokmez)', () => {
    expect(colorFor(CARSI, 999)).toBe(CARSI.emptyCell);
  });
});

describe('shapeLabel', () => {
  it.each(SHAPES.map((s) => [s.id] as const))('%s sekli icin Turkce ad tanimli', (id) => {
    expect(shapeLabel(id)).not.toBe('parça');
  });

  it('bilinmeyen sekilde genel bir ada duser', () => {
    expect(shapeLabel('bilinmeyen')).toBe('parça');
  });
});

describe('sprite eslemesi', () => {
  it.each(THEMES.map((t) => [t.id, t] as const))(
    '%s: her renk kimliginin bir esyasi vardir',
    (_id, theme) => {
      expect(theme.sprites).toHaveLength(THEME.PALETTE_SIZE);
    },
  );

  it('tanimli kimligi cozer', () => {
    expect(spriteFor(CARSI, 0)).toBe('simit');
    expect(spriteFor(CARSI, 2)).toBe('nazar');
  });

  it('tanimsiz kimlikte en yalin esyaya duser', () => {
    expect(spriteFor(CARSI, 99)).toBe('bakir');
  });
});
