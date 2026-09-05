import { ESNAFLAR, esnafById, isEsnafUnlocked, perksWithoutCharacter } from '../esnaflar';

import { DEFAULT_ESNAF_ID } from '@/game/core/rules';

describe('esnaf karakterleri', () => {
  it('kimlikler benzersizdir', () => {
    const ids = ESNAFLAR.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('varsayilan esnaf her zaman aciktir', () => {
    const cirak = esnafById(DEFAULT_ESNAF_ID);
    expect(cirak).toBeDefined();
    expect(isEsnafUnlocked(cirak!, [])).toBe(true);
  });

  it('perk`li esnaflar kartpostalla acilir', () => {
    const cayci = esnafById('cayci')!;
    expect(isEsnafUnlocked(cayci, [])).toBe(false);
    expect(isEsnafUnlocked(cayci, [cayci.unlockLevelId ?? ''])).toBe(true);
  });

  it('her perk`in bir karakteri vardir', () => {
    expect(perksWithoutCharacter()).toEqual([]);
  });

  it('bilinmeyen kimlik undefined', () => {
    expect(esnafById('yok')).toBeUndefined();
  });
});
