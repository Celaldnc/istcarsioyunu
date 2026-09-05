import { act, render, screen } from '@testing-library/react-native';

import { ESNAF_BUBBLE_TEST_ID, EsnafBubble } from '../EsnafBubble';

import { FX } from '@/constants/config';

const message = (id: number, text = 'Hoş geldin!') => ({ id, event: 'start' as const, text });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('EsnafBubble', () => {
  it('mesaj yokken cizilmez', async () => {
    await render(<EsnafBubble message={null} />);

    expect(screen.queryByTestId(ESNAF_BUBBLE_TEST_ID)).toBeNull();
  });

  it('mesaji gosterir ve ekran okuyucuya duyurur', async () => {
    await render(<EsnafBubble message={message(1, 'Çarşı açıldı!')} />);

    expect(screen.getByText('Çarşı açıldı!')).toBeOnTheScreen();
    expect(screen.getByLabelText('Esnaf: Çarşı açıldı!')).toBeOnTheScreen();
  });

  it('sure dolunca kendiliginden kaybolur', async () => {
    await render(<EsnafBubble message={message(1)} />);

    await act(async () => {
      jest.advanceTimersByTime(FX.ESNAF_SHOW_MS + FX.ESNAF_FADE_MS * 2 + 50);
    });

    expect(screen.queryByTestId(ESNAF_BUBBLE_TEST_ID)).toBeNull();
  });

  it('yeni kimlikli mesaj kaybolduktan sonra yeniden acar', async () => {
    const view = await render(<EsnafBubble message={message(1)} />);
    await act(async () => {
      jest.advanceTimersByTime(FX.ESNAF_SHOW_MS + FX.ESNAF_FADE_MS * 2 + 50);
    });

    await view.rerender(<EsnafBubble message={message(2, 'Yine buradayız')} />);

    expect(screen.getByText('Yine buradayız')).toBeOnTheScreen();
  });

  it('ayni mesajla yeniden render kapanmis baloncugu acmaz', async () => {
    const same = message(1);
    const view = await render(<EsnafBubble message={same} />);
    await act(async () => {
      jest.advanceTimersByTime(FX.ESNAF_SHOW_MS + FX.ESNAF_FADE_MS * 2 + 50);
    });

    await view.rerender(<EsnafBubble message={same} />);

    expect(screen.queryByTestId(ESNAF_BUBBLE_TEST_ID)).toBeNull();
  });

  it('acilista gorunur hale gelir (opaklik 1)', async () => {
    await render(<EsnafBubble message={message(1)} />);

    await act(async () => {
      jest.advanceTimersByTime(FX.ESNAF_FADE_MS + 20);
    });

    expect(screen.getByTestId(ESNAF_BUBBLE_TEST_ID)).toHaveAnimatedStyle({ opacity: 1 });
  });
});
