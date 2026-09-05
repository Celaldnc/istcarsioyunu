import { createMemoryStore, getAppStore } from '../storage';

describe('createMemoryStore', () => {
  it('yazilan deger okunur', () => {
    const store = createMemoryStore();
    store.set('a', '1');

    expect(store.getString('a')).toBe('1');
  });

  it('baslangic degerleriyle kurulabilir', () => {
    expect(createMemoryStore({ a: '1' }).getString('a')).toBe('1');
  });

  it('silinen deger undefined doner', () => {
    const store = createMemoryStore({ a: '1' });
    store.delete('a');

    expect(store.getString('a')).toBeUndefined();
  });

  it('olmayan anahtar undefined doner', () => {
    expect(createMemoryStore().getString('yok')).toBeUndefined();
  });
});

describe('getAppStore', () => {
  it('yaz-oku-sil dongusunu destekler', () => {
    const store = getAppStore();

    store.set('test.key', 'deger');
    expect(store.getString('test.key')).toBe('deger');

    store.delete('test.key');
    expect(store.getString('test.key')).toBeUndefined();
  });

  it('ayni ornegi dondurur (native depo bir kez acilir)', () => {
    expect(getAppStore()).toBe(getAppStore());
  });
});
