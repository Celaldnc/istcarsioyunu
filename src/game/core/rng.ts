/**
 * Seed'lenebilir rastgelelik.
 *
 * Math.random() kullanilamaz: Daily modunda herkesin ayni tahtayi ve ayni
 * parca sirasini gormesi gerekiyor. Ayrica seed'lenebilir uretec, testlerin
 * rastgeleligi mock'lamadan deterministik kalmasini sagliyor.
 */

/** [0,1) araliginda deger ureten fonksiyon. */
export type Rng = () => number;

export interface WeightedItem<T> {
  readonly value: T;
  readonly weight: number;
}

/** mulberry32'nin her adimda duruma ekledigi sabit. */
const STEP = 0x6d2b79f5;

/**
 * mulberry32: 32-bit durumlu, hizli ve dagilimi iyi bir uretec.
 * Kriptografik degildir; oyun icin fazlasiyla yeterli.
 *
 * skip: uretecin kac adim ileriden baslayacagi. mulberry32'nin durumu saf bir
 * sayac oldugu icin (her cagri state += STEP) ileri sarma O(1) hesaplanabilir;
 * dongu ile sarmaya gerek yok. Math.imul kullaniliyor cunku skip buyudugunde
 * duz carpma 2^53'u asip hassasiyet kaybeder.
 */
export function createRng(seed: number, skip = 0): Rng {
  let state = (seed + Math.imul(skip, STEP)) >>> 0;

  return () => {
    state = (state + STEP) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Takvim gununden seed uretir (Daily modu).
 *
 * UTC kullanilir: aksi halde ayni "gunun bulmacasi" saat dilimine gore
 * degisirdi. YYYYMMDD bicimi, gun ve ayin yer degistirmesi durumunda bile
 * farkli deger uretir.
 */
export function seedFromDate(date: Date): number {
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

/** Agirliga orantili secim yapar. Agirligi 0 olan eleman asla secilmez. */
export function pickWeighted<T>(rng: Rng, items: readonly WeightedItem<T>[]): T {
  const first = items[0];
  if (first === undefined) {
    throw new Error('pickWeighted bos liste ile cagrilamaz.');
  }

  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = rng() * total;

  // Baslangic degeri, kayan nokta hatasi yuzunden dongunun secim yapmadan
  // bitmesi durumunda gecerli bir sonuc garantiler.
  let chosen = first;

  for (const item of items) {
    threshold -= item.weight;
    if (threshold < 0) {
      chosen = item;
      break;
    }
  }

  return chosen.value;
}

/**
 * Ureteci verilen adim kadar ileri sarar (O(n)).
 *
 * createRng(seed, skip) ayni sonucu O(1) verir ve sicak yolda o tercih
 * edilmelidir. Bu fonksiyon, iki yolun esdegerligini testte sabitlemek ve
 * mevcut bir uretec ornegini ilerletmek icin duruyor.
 */
export function advance(rng: Rng, steps: number): void {
  for (let i = 0; i < steps; i += 1) {
    rng();
  }
}
