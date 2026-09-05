import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Web'de Skia'nin CanvasKit (WASM) motorunun yuklenmesini bekler.
 *
 * Native'de Skia dogrudan derlenmis gelir, bu yuzden hemen hazir sayilir.
 * Web'de ise CanvasKit yuklenmeden herhangi bir Skia bileseni cizilemez;
 * beklemeden render edilirse "CanvasKit is not defined" ile patlar.
 *
 * WASM dosyasi public/canvaskit.wasm konumunda (npx setup-skia-web public);
 * Expo web'de public/ kok dizinden servis edilir.
 */
export function useSkiaWebReady(): boolean {
  const [ready, setReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
        await LoadSkiaWeb({ locateFile: (file) => `/${file}` });
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

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
