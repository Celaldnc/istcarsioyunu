import { createMMKV } from 'react-native-mmkv';

/**
 * Anahtar-deger depolamasi.
 *
 * Neden dogrudan MMKV degil de arayuz: kalicilik mantigi (ne saklanir, bozuk
 * veri ne olur, yuksek skor ne zaman guncellenir) native modul calistirmadan
 * test edilebilsin. MMKV Jest'te kendini otomatik mock'luyor ama bellek
 * uygulamasi testleri birbirinden de yalitiyor.
 */
export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

/** Testler ve gecici kullanim icin bellek ici depolama. */
export function createMemoryStore(initial: Readonly<Record<string, string>> = {}): KeyValueStore {
  const data = new Map<string, string>(Object.entries(initial));

  return {
    getString: (key) => data.get(key),
    set: (key, value) => {
      data.set(key, value);
    },
    delete: (key) => {
      data.delete(key);
    },
  };
}

let cached: KeyValueStore | undefined;

/**
 * Uygulamanin kalici deposu (MMKV).
 *
 * Tembel olusturulur: modul yuklenir yuklenmez native depoyu acmak, testlerde
 * ve Storybook gibi ortamlarda gereksiz yan etki olurdu.
 */
export function getAppStore(): KeyValueStore {
  if (cached === undefined) {
    const mmkv = createMMKV({ id: 'ist-carsi-blok' });
    cached = {
      getString: (key) => mmkv.getString(key),
      set: (key, value) => mmkv.set(key, value),
      // MMKV v4'te metod adi remove; v3'teki delete kaldirildi.
      delete: (key) => {
        mmkv.remove(key);
      },
    };
  }
  return cached;
}
