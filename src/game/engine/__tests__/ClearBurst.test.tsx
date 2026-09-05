import { act, render, screen } from '@testing-library/react-native';

import { burstParticles } from '../burstParticles';
import { CLEAR_BURST_TEST_ID, ClearBurst } from '../ClearBurst';

import { FX } from '@/constants/config';
import { computeBoardLayout } from '@/game/core/layout';
import { CARSI } from '@/game/data/themes';

const layout = computeBoardLayout(390);
const NONE = { rows: [], cols: [] };

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ClearBurst', () => {
  it('temizleme yoksa hicbir sey cizmez', async () => {
    await render(<ClearBurst lines={NONE} token="a" layout={layout} theme={CARSI} />);

    expect(screen.queryByTestId(CLEAR_BURST_TEST_ID)).toBeNull();
  });

  it('temizlenen her cizgi icin bir parlama dikdortgeni cizer', async () => {
    const lines = { rows: [1, 2], cols: [4] };
    await render(<ClearBurst lines={lines} token="a" layout={layout} theme={CARSI} />);

    expect(screen.getAllByTestId('skia-rect')).toHaveLength(3);
  });

  it('parcacik sayisi saf matematikle uyusur', async () => {
    const lines = { rows: [1], cols: [] };
    await render(<ClearBurst lines={lines} token="a" layout={layout} theme={CARSI} />);

    const expected = burstParticles(lines, layout, 1).length;
    expect(screen.getAllByTestId('skia-circle')).toHaveLength(expected);
  });

  it('animasyon bitince tuvali kaldirir', async () => {
    const lines = { rows: [1], cols: [] };
    await render(<ClearBurst lines={lines} token="a" layout={layout} theme={CARSI} />);
    expect(screen.getByTestId(CLEAR_BURST_TEST_ID)).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(FX.CLEAR_BURST_MS + 100);
    });

    expect(screen.queryByTestId(CLEAR_BURST_TEST_ID)).toBeNull();
  });

  it('ayni hamle kimligiyle yeniden render patlamayi tekrarlamaz', async () => {
    const lines = { rows: [1], cols: [] };
    const view = await render(<ClearBurst lines={lines} token="a" layout={layout} theme={CARSI} />);
    await act(async () => {
      jest.advanceTimersByTime(FX.CLEAR_BURST_MS + 100);
    });

    await view.rerender(
      <ClearBurst lines={{ ...lines }} token="a" layout={layout} theme={CARSI} />,
    );

    expect(screen.queryByTestId(CLEAR_BURST_TEST_ID)).toBeNull();
  });

  it('yeni hamle kimligi yeni patlama tetikler', async () => {
    const lines = { rows: [1], cols: [] };
    const view = await render(<ClearBurst lines={lines} token="a" layout={layout} theme={CARSI} />);
    await act(async () => {
      jest.advanceTimersByTime(FX.CLEAR_BURST_MS + 100);
    });

    await view.rerender(<ClearBurst lines={lines} token="b" layout={layout} theme={CARSI} />);

    expect(screen.getByTestId(CLEAR_BURST_TEST_ID)).toBeOnTheScreen();
  });

  it('dokunuslari yutmaz (altindaki tepsi calismaya devam eder)', async () => {
    await render(
      <ClearBurst lines={{ rows: [0], cols: [] }} token="a" layout={layout} theme={CARSI} />,
    );

    const style = screen.getByTestId(CLEAR_BURST_TEST_ID).props.style as unknown;
    expect(JSON.stringify(style)).toContain('"pointerEvents":"none"');
  });
});
