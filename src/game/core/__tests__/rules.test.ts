import { CANLI_RULES, CLASSIC_RULES, DEFAULT_ESNAF_ID, ESNAF_PERKS, rulesFor } from '../rules';

import { TEA_BREAK } from '@/constants/config';

describe('rulesFor', () => {
  it('klasik mod hicbir canli oge acmaz', () => {
    const rules = rulesFor({ mode: 'classic', esnafId: DEFAULT_ESNAF_ID });

    expect(rules).toEqual(CLASSIC_RULES);
    expect(rules.cat).toBe(false);
    expect(rules.gull).toBe(false);
    expect(rules.nazar).toBe(false);
  });

  it('canli mod her seyi acar', () => {
    const rules = rulesFor({ mode: 'canli', esnafId: DEFAULT_ESNAF_ID });

    expect(rules).toEqual(CANLI_RULES);
    expect(rules.cat && rules.gull && rules.nazar && rules.synergies).toBe(true);
    expect(rules.haggles).toBeGreaterThan(0);
  });

  it('varsayilan esnafin perk`i yoktur (klasik davranis degismez)', () => {
    expect(ESNAF_PERKS[DEFAULT_ESNAF_ID]).toBeUndefined();
  });

  it('esnaf perk`i kurala islenir', () => {
    expect(rulesFor({ mode: 'canli', esnafId: 'cayci' }).teaBreaks).toBe(TEA_BREAK.PER_GAME + 1);
    expect(rulesFor({ mode: 'canli', esnafId: 'halici' }).ciniMultiplier).toBe(2);
    expect(rulesFor({ mode: 'canli', esnafId: 'simitci' }).starterTrays).toBe(3);
    expect(rulesFor({ mode: 'canli', esnafId: 'balikci' }).gullEvery).toBeLessThan(
      CANLI_RULES.gullEvery,
    );
  });

  it('gunluk modda perk uygulanmaz (herkes esit)', () => {
    expect(rulesFor({ mode: 'daily', esnafId: 'halici' })).toEqual(CLASSIC_RULES);
  });

  it('bilinmeyen esnaf perk`siz sayilir', () => {
    expect(rulesFor({ mode: 'canli', esnafId: 'yok-boyle-biri' })).toEqual(CANLI_RULES);
  });

  it('seviye ustune yazmalari en son uygulanir', () => {
    const rules = rulesFor({ mode: 'journey', esnafId: 'cayci', overrides: { teaBreaks: 0 } });

    expect(rules.teaBreaks).toBe(0);
  });
});
