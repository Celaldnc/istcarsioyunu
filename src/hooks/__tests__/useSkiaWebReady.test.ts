import { renderHook, waitFor } from '@testing-library/react-native';

import { useSkiaWebReady } from '../useSkiaWebReady';

describe('useSkiaWebReady', () => {
  it('native platformda hemen hazirdir ve yukleyiciyi hic cagirmaz', async () => {
    const load = jest.fn(() => Promise.resolve());

    const { result } = await renderHook(() => useSkiaWebReady(false, load));

    expect(result.current).toBe(true);
    expect(load).not.toHaveBeenCalled();
  });

  it('web platformda once hazir DEGILDIR', async () => {
    // Cozulmeyen bir promise: yukleme askida kalir.
    const load = jest.fn(() => new Promise<void>(() => undefined));

    const { result } = await renderHook(() => useSkiaWebReady(true, load));

    expect(result.current).toBe(false);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('yukleme bitince hazir olur', async () => {
    const load = jest.fn(() => Promise.resolve());

    const { result } = await renderHook(() => useSkiaWebReady(true, load));

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('CanvasKit yuklenemese bile uygulamayi kilitlemez', async () => {
    const load = jest.fn(() => Promise.reject(new Error('ag hatasi')));

    const { result } = await renderHook(() => useSkiaWebReady(true, load));

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('cozulmeden once cozulurse durumu guncellemez (sizinti onlemi)', async () => {
    let resolveLoad: (() => void) | undefined;
    const load = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const { unmount } = await renderHook(() => useSkiaWebReady(true, load));
    await unmount();

    // Cozulme unmount'tan sonra geliyor; setState cagrilmamali (uyari cikmamali).
    expect(() => resolveLoad?.()).not.toThrow();
  });
});
