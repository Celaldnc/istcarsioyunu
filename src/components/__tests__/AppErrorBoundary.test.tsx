import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppErrorBoundary } from '../AppErrorBoundary';

const props = () => ({
  error: new Error('board init failed'),
  retry: jest.fn(() => Promise.resolve()),
});

describe('AppErrorBoundary', () => {
  it('kullaniciya Turkce, stack trace icermeyen bir mesaj gosterir', async () => {
    await render(<AppErrorBoundary {...props()} />);

    expect(screen.getByText('Bir şeyler ters gitti')).toBeOnTheScreen();
    expect(screen.getByText(/beklenmedik bir hatayla karşılaştı/)).toBeOnTheScreen();
  });

  it('tekrar dene butonu retry cagirir', async () => {
    const p = props();
    await render(<AppErrorBoundary {...p} />);

    fireEvent.press(screen.getByLabelText('Tekrar dene'));

    expect(p.retry).toHaveBeenCalledTimes(1);
  });

  it('gelistirme derlemesinde teknik detayi gosterir', async () => {
    await render(<AppErrorBoundary {...props()} />);

    expect(screen.getByText('board init failed')).toBeOnTheScreen();
  });

  it('production derlemesinde teknik detayi gizler', async () => {
    const originalDev = __DEV__;
    // @ts-expect-error __DEV__ global'i testte bilincli olarak degistiriliyor
    global.__DEV__ = false;

    try {
      await render(<AppErrorBoundary {...props()} />);

      expect(screen.queryByText('board init failed')).toBeNull();
    } finally {
      // @ts-expect-error geri yukleniyor
      global.__DEV__ = originalDev;
    }
  });
});
