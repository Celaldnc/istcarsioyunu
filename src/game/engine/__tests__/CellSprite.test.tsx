import { render, screen, within } from '@testing-library/react-native';

import { CellSprite } from '../CellSprite';

import { SPRITE } from '@/constants/config';
import { CARSI, type SpriteKind } from '@/game/data/themes';

const BIG = SPRITE.DETAIL_MIN_SIZE + 10;
const SMALL = SPRITE.DETAIL_MIN_SIZE - 4;

const kindIndex = (kind: SpriteKind) => CARSI.sprites.indexOf(kind);

/**
 * Her cagri kendi sorgu setini dondurur. Ayni testte birden fazla render
 * varsa global `screen` yerine bunlar kullanilir; `screen` yalnizca son
 * render'a baglidir ve unmount sonrasi sorgular tutarsizlasir.
 */
const draw = (colorId: number, size = BIG, opacity?: number) =>
  render(<CellSprite x={0} y={0} size={size} colorId={colorId} theme={CARSI} opacity={opacity} />);

const PRIMITIVES = ['skia-circle', 'skia-oval', 'skia-path', 'skia-rect', 'skia-line'] as const;

describe('CellSprite', () => {
  it('tabani palet rengiyle tek bir yuvarlak kare olarak cizer', async () => {
    await draw(3);

    const rects = screen.getAllByTestId('skia-rounded-rect');
    expect(rects).toHaveLength(1);
    expect(rects[0]?.props.color).toBe(CARSI.palette[3]);
  });

  it('opakligi tabana uygular (tepsi soluklastirmasi buna dayanir)', async () => {
    await draw(0, BIG, 0.25);

    expect(screen.getAllByTestId('skia-rounded-rect')[0]?.props.opacity).toBe(0.25);
  });

  it('glif hucrenin icine kirpilir (kose tasmasi olmasin)', async () => {
    await draw(0);

    expect(screen.getAllByTestId('skia-group')[0]?.props.clip).toBeDefined();
  });

  it('her esya farkli bir glif cizer', async () => {
    // Alti esya tek render'da yan yana; her sprite'in tek bir kirpma grubu
    // var, primitifler o grubun icinden sayilir.
    await render(
      <>
        {CARSI.sprites.map((kind, i) => (
          <CellSprite key={kind} x={i * 50} y={0} size={BIG} colorId={i} theme={CARSI} />
        ))}
      </>,
    );

    const groups = screen.getAllByTestId('skia-group');
    const signatures = new Set(
      groups.map((group) =>
        PRIMITIVES.map((id) => within(group).queryAllByTestId(id).length).join(','),
      ),
    );

    expect(groups).toHaveLength(CARSI.sprites.length);
    expect(signatures.size).toBe(CARSI.sprites.length);
  });

  it('simit halka olarak cizilir (stroke)', async () => {
    await draw(kindIndex('simit'));

    expect(screen.getAllByTestId('skia-circle')[0]?.props.style).toBe('stroke');
  });

  it('nazar ic ice uc daire + parlama icerir', async () => {
    await draw(kindIndex('nazar'));

    expect(screen.getAllByTestId('skia-circle')).toHaveLength(4);
  });

  it('fistik oval ile cizilir', async () => {
    await draw(kindIndex('fistik'));

    expect(screen.getAllByTestId('skia-oval')).toHaveLength(1);
  });

  it('cay bardagi yol (path) ile cizilir', async () => {
    await draw(kindIndex('cay'));

    expect(screen.getAllByTestId('skia-path')).toHaveLength(1);
  });

  it('kucuk hucrede ince detaylar atlanir', async () => {
    const simit = kindIndex('simit');
    await render(
      <>
        <CellSprite x={0} y={0} size={BIG} colorId={simit} theme={CARSI} />
        <CellSprite x={60} y={0} size={SMALL} colorId={simit} theme={CARSI} />
      </>,
    );

    const [big, small] = screen.getAllByTestId('skia-group');
    if (big === undefined || small === undefined) {
      throw new Error('Test kurulumu hatali: iki sprite bekleniyordu.');
    }

    expect(within(small).queryAllByTestId('skia-circle').length).toBeLessThan(
      within(big).queryAllByTestId('skia-circle').length,
    );
  });

  it('tanimsiz renk kimliginde cokmez', async () => {
    await expect(draw(99)).resolves.toBeDefined();
  });
});
