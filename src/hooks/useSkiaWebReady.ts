import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** CanvasKit'i yukleyen islev. Testte sahte bir yukleyici enjekte edilir. */
export type SkiaWebLoader = () => Promise<void>;

/**
 * Varsayilan yukleyici: Skia'nin web giris noktasindan CanvasKit'i getirir.
 *
 * WASM dosyasi public/canvaskit.wasm konumundadir (npx setup-skia-web public)
 * ve Expo web'de kok dizinden servis edilir.
 */
/* istanbul ignore next -- dinamik import Jest'te cozulmuyor (Skia mock'u alt
   yolu kapsamiyor). Bu yol tarayicida dogrulandi: web bundle derleniyor ve
   canvaskit.wasm servis ediliyor. Kancanin durum makinesi ayrica testli. */
const loadCanvasKit: SkiaWebLoader = async () => {
  const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
  await LoadSkiaWeb({ locateFile: (file) => `/${file}` });
};

/**
 * Web'de Skia'nin CanvasKit (WASM) motorunun yuklenmesini bekler.
 *
 * Native'de Skia dogrudan derlenmis gelir, bu yuzden hemen hazir sayilir.
 * Web'de ise CanvasKit yuklenmeden herhangi bir Skia bileseni cizilemez;
 * beklemeden render edilirse "CanvasKit is not defined" ile patlar.
 *
 * Hem platform kontrolu hem yukleyici PARAMETRE olarak alinir:
 * - Platform.OS testte guvenilir sekilde degistirilemiyor.
 * - Dinamik import Jest'te cozulmuyor (Skia mock'u alt yolu kapsamiyor).
 * Enjeksiyon, kancanin durum makinesini mock akrobasisi olmadan test
 * edilebilir kiliyor. Gercek yukleme yolu tarayicida dogrulandi.
 */
export function useSkiaWebReady(
  isWeb: boolean = Platform.OS === 'web',
  load: SkiaWebLoader = loadCanvasKit,
): boolean {
  const [ready, setReady] = useState(!isWeb);

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        await load();
      } catch (error) {
        if (__DEV__) {
          console.warn('[skia-web] CanvasKit yuklenemedi', error);
        }
      } finally {
        // Hata olsa da uygulamayi kilitleme; Skia disi ekranlar calismali.
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isWeb, load]);

  return ready;
}
