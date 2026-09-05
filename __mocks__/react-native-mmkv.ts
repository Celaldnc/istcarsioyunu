/**
 * react-native-mmkv icin manuel mock.
 *
 * Paketin kendi isTest() otomatik mock'u yetmiyor: import zinciri
 * react-native-nitro-modules'a ulasiyor ve o modul, native TurboModule
 * bulunamadigi icin YUKLENIRKEN hata firlatiyor. Yani sorun calisma
 * aninda degil, import aninda.
 *
 * Bu mock bellek ici bir MMKV taklidi verir. Kalicilik POLITIKASI zaten
 * enjekte edilen KeyValueStore uzerinden ayrica test ediliyor; buradaki
 * amac yalnizca modulun yuklenebilmesi.
 *
 * node_modules paketleri icin kok __mocks__ klasoru Jest tarafindan
 * OTOMATIK kullanilir.
 */

type Value = boolean | string | number | ArrayBuffer;

export function createMMKV(_config?: { id?: string }) {
  const data = new Map<string, Value>();

  return {
    set: (key: string, value: Value) => {
      data.set(key, value);
    },
    getString: (key: string) => {
      const value = data.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    getNumber: (key: string) => {
      const value = data.get(key);
      return typeof value === 'number' ? value : undefined;
    },
    getBoolean: (key: string) => {
      const value = data.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    contains: (key: string) => data.has(key),
    remove: (key: string) => data.delete(key),
    getAllKeys: () => [...data.keys()],
    clearAll: () => {
      data.clear();
    },
  };
}
