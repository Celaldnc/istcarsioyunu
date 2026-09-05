import { act, render, screen } from '@testing-library/react-native';

import { FLOATING_GAIN_TEST_ID, FloatingGain } from '../FloatingGain';

import { FX } from '@/constants/config';

// Yazi ekran okuyucudan bilerek gizli; RTL varsayilan olarak gizlileri atlar.
const HIDDEN = { includeHiddenElements: true };

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('FloatingGain', () => {
  it('puan yoksa cizilmez', async () => {
    await render(<FloatingGain gain={0} token="a" />);

    expect(screen.queryByTestId(FLOATING_GAIN_TEST_ID, HIDDEN)).toBeNull();
  });

  it('kazanci arti isaretiyle gosterir', async () => {
    await render(<FloatingGain gain={40} token="a" />);

    expect(screen.getByText('+40', HIDDEN)).toBeOnTheScreen();
  });

  it('etiketi puanin yanina ekler', async () => {
    await render(<FloatingGain gain={160} token="a" label="Çini!" />);

    expect(screen.getByText('+160 Çini!', HIDDEN)).toBeOnTheScreen();
  });

  it('sure dolunca kaybolur', async () => {
    await render(<FloatingGain gain={40} token="a" />);

    await act(async () => {
      jest.advanceTimersByTime(FX.GAIN_FLOAT_MS + 100);
    });

    expect(screen.queryByTestId(FLOATING_GAIN_TEST_ID, HIDDEN)).toBeNull();
  });

  it('ayni puanli yeni hamle (yeni token) yeniden gosterir', async () => {
    const view = await render(<FloatingGain gain={40} token="a" />);
    await act(async () => {
      jest.advanceTimersByTime(FX.GAIN_FLOAT_MS + 100);
    });

    await view.rerender(<FloatingGain gain={40} token="b" />);

    expect(screen.getByText('+40', HIDDEN)).toBeOnTheScreen();
  });

  it('ayni token ile yeniden render tekrar gostermez', async () => {
    const view = await render(<FloatingGain gain={40} token="a" />);
    await act(async () => {
      jest.advanceTimersByTime(FX.GAIN_FLOAT_MS + 100);
    });

    await view.rerender(<FloatingGain gain={40} token="a" />);

    expect(screen.queryByTestId(FLOATING_GAIN_TEST_ID, HIDDEN)).toBeNull();
  });
});
