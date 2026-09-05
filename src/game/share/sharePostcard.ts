/**
 * Kartpostal paylasimi — saf akis, enjekte edilen yeteneklerle.
 *
 * Gorunum yakalama (view-shot) ve paylasim sayfasi (expo-sharing) platforma
 * bagli; burada yalnizca sira ve hata politikasi var: yakalama basarisizsa
 * 'captureFailed', paylasim yoksa 'unavailable', iptal/başari 'shared'.
 * Hicbir durumda firlatmaz: paylasim oyunun kritik yolu degil.
 */

export type ShareOutcome = 'shared' | 'unavailable' | 'captureFailed';

export interface ShareDeps {
  /** Gorunumu PNG olarak yakalar; dosya yolu veya data URL doner. */
  readonly capture: () => Promise<string>;
  readonly isAvailable: () => Promise<boolean>;
  readonly share: (
    uri: string,
    options: { mimeType: string; dialogTitle: string },
  ) => Promise<void>;
}

export async function sharePostcard(deps: ShareDeps, dialogTitle: string): Promise<ShareOutcome> {
  let uri: string;
  try {
    uri = await deps.capture();
  } catch {
    return 'captureFailed';
  }

  try {
    if (!(await deps.isAvailable())) {
      return 'unavailable';
    }
    await deps.share(uri, { mimeType: 'image/png', dialogTitle });
    return 'shared';
  } catch {
    return 'unavailable';
  }
}
