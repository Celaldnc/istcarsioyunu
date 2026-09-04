import { useColorScheme as useColorSchemeCore } from 'react-native';

/**
 * react-native'in useColorScheme'ini 'light' | 'dark' ikilisine daraltir.
 *
 * Neden gerekli (bu dosya bir web shim kalintisi DEGIL, silmeyin):
 *  1. Tip: RN 'light' | 'dark' | 'unspecified' doner, Colors.ts'te ise yalnizca
 *     light/dark anahtarlari var. Ham hook'u dogrudan kullanmak
 *     Colors[scheme] erisimlerini derlenemez hale getirir.
 *  2. Runtime: RN'in Appearance modulu native katman hazir degilken tipte
 *     gorunmeyen bir null donebilir. Aksi halde Colors[null] -> undefined ->
 *     TypeError olurdu.
 */
export const useColorScheme = (): 'light' | 'dark' => {
  const coreScheme = useColorSchemeCore();
  return coreScheme === 'dark' ? 'dark' : 'light';
};
