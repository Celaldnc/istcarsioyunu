import { sharePostcard, type ShareDeps } from '../sharePostcard';

const deps = (overrides: Partial<ShareDeps> = {}): ShareDeps => ({
  capture: () => Promise.resolve('file:///x.png'),
  isAvailable: () => Promise.resolve(true),
  share: () => Promise.resolve(),
  ...overrides,
});

describe('sharePostcard', () => {
  it('yakala -> paylas sirasiyla calisir', async () => {
    const share = jest.fn(() => Promise.resolve());

    await expect(sharePostcard(deps({ share }), 'Kartpostal')).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith('file:///x.png', {
      mimeType: 'image/png',
      dialogTitle: 'Kartpostal',
    });
  });

  it('yakalama basarisizsa paylasmaz', async () => {
    const share = jest.fn(() => Promise.resolve());
    const result = await sharePostcard(
      deps({ capture: () => Promise.reject(new Error('yok')), share }),
      'K',
    );

    expect(result).toBe('captureFailed');
    expect(share).not.toHaveBeenCalled();
  });

  it('paylasim desteklenmiyorsa unavailable', async () => {
    await expect(
      sharePostcard(deps({ isAvailable: () => Promise.resolve(false) }), 'K'),
    ).resolves.toBe('unavailable');
  });

  it('paylasim firlatirsa yutar', async () => {
    await expect(
      sharePostcard(deps({ share: () => Promise.reject(new Error('iptal')) }), 'K'),
    ).resolves.toBe('unavailable');
  });
});
