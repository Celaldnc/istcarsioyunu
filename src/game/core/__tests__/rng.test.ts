import { createRng, pickWeighted, seedFromDate } from '../rng';

describe('createRng', () => {
  it('ayni seed ayni diziyi uretir (Daily modunun temeli)', () => {
    const a = createRng(12345);
    const b = createRng(12345);

    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());

    expect(seqA).toEqual(seqB);
  });

  it('farkli seed farkli dizi uretir', () => {
    const a = createRng(1);
    const b = createRng(2);

    expect(Array.from({ length: 10 }, () => a())).not.toEqual(
      Array.from({ length: 10 }, () => b()),
    );
  });

  it('degerler [0,1) araligindadir', () => {
    const rng = createRng(99);

    for (let i = 0; i < 500; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('ardisik cagrilar sabit deger dondurmez', () => {
    const rng = createRng(7);
    const values = new Set(Array.from({ length: 50 }, () => rng()));

    expect(values.size).toBeGreaterThan(1);
  });

  it('seed 0 ile de calisir (falsy seed tuzagi)', () => {
    const a = createRng(0);
    const b = createRng(0);

    expect(a()).toBe(b());
  });
});

describe('seedFromDate', () => {
  it('ayni takvim gunu ayni seed verir', () => {
    const morning = new Date(Date.UTC(2026, 8, 5, 6, 0, 0));
    const evening = new Date(Date.UTC(2026, 8, 5, 23, 59, 59));

    expect(seedFromDate(morning)).toBe(seedFromDate(evening));
  });

  it('farkli gunler farkli seed verir', () => {
    const day1 = new Date(Date.UTC(2026, 8, 5));
    const day2 = new Date(Date.UTC(2026, 8, 6));

    expect(seedFromDate(day1)).not.toBe(seedFromDate(day2));
  });

  it('ay ve gun yer degistirince ayni seed uretilmez (05-06 vs 06-05)', () => {
    expect(seedFromDate(new Date(Date.UTC(2026, 4, 6)))).not.toBe(
      seedFromDate(new Date(Date.UTC(2026, 5, 5))),
    );
  });

  it('pozitif tamsayi dondurur', () => {
    const seed = seedFromDate(new Date(Date.UTC(2026, 0, 1)));

    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThan(0);
  });
});

describe('pickWeighted', () => {
  const items = [
    { value: 'a', weight: 1 },
    { value: 'b', weight: 3 },
  ];

  it('agirliga gore secim yapar', () => {
    const rng = createRng(42);
    const counts = { a: 0, b: 0 };

    for (let i = 0; i < 4000; i += 1) {
      counts[pickWeighted(rng, items) as 'a' | 'b'] += 1;
    }

    // b, a'dan yaklasik 3 kat sik cikmali; genis tolerans ile flake onlenir.
    const ratio = counts.b / counts.a;
    expect(ratio).toBeGreaterThan(2);
    expect(ratio).toBeLessThan(4.5);
  });

  it('tek elemanli listede o elemani dondurur', () => {
    expect(pickWeighted(createRng(1), [{ value: 'tek', weight: 1 }])).toBe('tek');
  });

  it('agirligi sifir olan eleman secilmez', () => {
    const rng = createRng(3);
    const withZero = [
      { value: 'asla', weight: 0 },
      { value: 'hep', weight: 1 },
    ];

    for (let i = 0; i < 200; i += 1) {
      expect(pickWeighted(rng, withZero)).toBe('hep');
    }
  });

  it('bos listede hata firlatir', () => {
    expect(() => pickWeighted(createRng(1), [])).toThrow(/bos/i);
  });
});
