import { render, screen } from '@testing-library/react-native';

import { ENTITY_OVERLAY_TEST_ID, EntityOverlay } from '../EntityOverlay';

import { computeBoardLayout } from '@/game/core/layout';
import { CARSI } from '@/game/data/themes';

const layout = computeBoardLayout(390);

describe('EntityOverlay', () => {
  it('canli oge yoksa hicbir sey cizmez', async () => {
    await render(
      <EntityOverlay cat={null} gull={null} curses={[]} layout={layout} theme={CARSI} />,
    );

    expect(screen.queryByTestId(ENTITY_OVERLAY_TEST_ID)).toBeNull();
  });

  it('kediyi cizer; oksanmissa kalp ekler', async () => {
    const view = await render(
      <EntityOverlay
        cat={{ x: 1, y: 1, restTurns: 0 }}
        gull={null}
        curses={[]}
        layout={layout}
        theme={CARSI}
      />,
    );
    const plain = screen.getAllByTestId('skia-path').length;

    await view.rerender(
      <EntityOverlay
        cat={{ x: 1, y: 1, restTurns: 2 }}
        gull={null}
        curses={[]}
        layout={layout}
        theme={CARSI}
      />,
    );

    expect(screen.getAllByTestId('skia-path').length).toBe(plain + 1);
  });

  it('martiyi kalan hamle kadar noktayla cizer', async () => {
    await render(
      <EntityOverlay
        cat={null}
        gull={{ col: 3, turnsLeft: 2 }}
        curses={[]}
        layout={layout}
        theme={CARSI}
      />,
    );

    // govde dairesi + goz + 2 nokta
    expect(screen.getAllByTestId('skia-circle').length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByTestId('skia-oval')).toHaveLength(1);
  });

  it('her lanet icin bir goz cizer', async () => {
    await render(
      <EntityOverlay
        cat={null}
        gull={null}
        curses={[
          { x: 0, y: 0, turnsLeft: 3 },
          { x: 2, y: 4, turnsLeft: 1 },
        ]}
        layout={layout}
        theme={CARSI}
      />,
    );

    expect(screen.getAllByTestId('skia-rounded-rect')).toHaveLength(2);
    expect(screen.getAllByTestId('skia-oval')).toHaveLength(2);
  });

  it('dokunuslari yutmaz', async () => {
    await render(
      <EntityOverlay
        cat={{ x: 0, y: 0, restTurns: 0 }}
        gull={null}
        curses={[]}
        layout={layout}
        theme={CARSI}
      />,
    );

    expect(JSON.stringify(screen.getByTestId(ENTITY_OVERLAY_TEST_ID).props.style)).toContain(
      '"pointerEvents":"none"',
    );
  });
});

describe('kapilar ve senlik', () => {
  it('kapi kurali acikken dort fener cizilir', async () => {
    await render(
      <EntityOverlay cat={null} gull={null} curses={[]} gates={0} layout={layout} theme={CARSI} />,
    );

    // fener + parlama = her fener 2 daire; yanan fenerde ek hale
    expect(screen.getAllByTestId('skia-circle')).toHaveLength(8);
  });

  it('yanan fener hale alir', async () => {
    await render(
      <EntityOverlay cat={null} gull={null} curses={[]} gates={1} layout={layout} theme={CARSI} />,
    );

    expect(screen.getAllByTestId('skia-circle')).toHaveLength(9);
  });

  it('senlikte tahta isikla yikanir', async () => {
    await render(
      <EntityOverlay cat={null} gull={null} curses={[]} festival layout={layout} theme={CARSI} />,
    );

    expect(screen.getAllByTestId('skia-rounded-rect')).toHaveLength(1);
  });
});
