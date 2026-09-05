import { renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { usePersistOnBackground } from '../usePersistOnBackground';

/** AppState aboneligini yakalayip olay tetiklemeyi saglar. */
function captureListener() {
  let listener: ((status: AppStateStatus) => void) | undefined;
  const remove = jest.fn();

  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _type: string,
    handler: (status: AppStateStatus) => void,
  ) => {
    listener = handler;
    return { remove } as ReturnType<typeof AppState.addEventListener>;
  }) as typeof AppState.addEventListener);

  return {
    remove,
    emit: (status: AppStateStatus) => listener?.(status),
  };
}

describe('usePersistOnBackground', () => {
  it('arka plana dusunce kaydeder', async () => {
    const persist = jest.fn();
    const app = captureListener();
    await renderHook(() => usePersistOnBackground(persist));

    app.emit('background');

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('inactive durumunda da kaydeder (iOS uygulama degistirici)', async () => {
    const persist = jest.fn();
    const app = captureListener();
    await renderHook(() => usePersistOnBackground(persist));

    app.emit('inactive');

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('one geri dondugunde kaydetmez', async () => {
    const persist = jest.fn();
    const app = captureListener();
    await renderHook(() => usePersistOnBackground(persist));

    app.emit('active');

    expect(persist).not.toHaveBeenCalled();
  });

  it('cozulunce aboneligi birakir (sizinti onlemi)', async () => {
    const app = captureListener();
    const { unmount } = await renderHook(() => usePersistOnBackground(jest.fn()));

    await unmount();

    expect(app.remove).toHaveBeenCalled();
  });
});
