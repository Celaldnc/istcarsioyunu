import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Uygulama arka plana dustugunde verilen kaydetme islevini cagirir.
 *
 * Neden gerekli: Android uygulamayi arka planda haber vermeden oldurebiliyor.
 * Her hamlede zaten kaydediyoruz, ama bu kanca son durumu (or. ayar
 * degisikligi) garantiye alir ve ileride kaydetme siklıgi dusurulurse
 * guvenlik agi olarak kalir.
 *
 * 'inactive' da dinlenir: iOS'ta uygulama degistirici acildiginda once bu
 * durum gelir ve arka plana hic dusmeden oldurulme ihtimali vardir.
 */
export function usePersistOnBackground(persist: () => void): void {
  useEffect(() => {
    const handleChange = (status: AppStateStatus) => {
      if (status === 'background' || status === 'inactive') {
        persist();
      }
    };

    const subscription = AppState.addEventListener('change', handleChange);
    return () => {
      subscription.remove();
    };
  }, [persist]);
}
