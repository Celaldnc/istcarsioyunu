import { createRng, type Rng } from './rng';

/**
 * Olay rastgeleligi (kedi, marti, nazar, pazarlik).
 *
 * Parca uretimiyle AYNI rng akisi kullanilamaz: olaylar hamle basina
 * degisken sayida rng cagrisi yapar ve parca akisinin O(1) ileri sarma
 * garantisini (piecesDrawn * RNG_CALLS_PER_PIECE) bozardi. Bu yuzden her
 * hamle icin seed + hamle numarasindan BAGIMSIZ bir uretec kurulur; kac
 * cagri yapildigi onemsizdir, bir sonraki hamle yeni uretec alir.
 *
 * Sonuc: ayni seed + ayni hamleler -> ayni kedi/marti/nazar. Daily modda
 * herkes ayni olaylari yasar; kayit geri yuklendiginde akis sapmaz.
 */

const EVENT_SALT = 0x5bd1e995;
const HAGGLE_SALT = 0x1b873593;

/** Verilen hamle icin olay ureteci. */
export function eventRng(seed: number, move: number): Rng {
  return createRng((seed ^ EVENT_SALT) >>> 0, move);
}

/** n. pazarlik icin uretec (parca akisindan bagimsiz). */
export function haggleRng(seed: number, haggleIndex: number): Rng {
  return createRng((seed ^ HAGGLE_SALT) >>> 0, haggleIndex);
}

/** Listeden rastgele eleman; bos listede undefined. */
export function pickOne<T>(rng: Rng, items: readonly T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}
