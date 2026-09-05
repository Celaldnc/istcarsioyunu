import {
  DISTRICTS,
  districtById,
  isLevelUnlocked,
  journeyMismatches,
  objectiveText,
} from '../journey';

import { LEVELS } from '@/game/core/levels';

describe('yolculuk verisi', () => {
  it('her seviyenin semti, her semtin seviyesi vardir', () => {
    expect(journeyMismatches()).toEqual([]);
  });

  it('semt kimlikleri benzersizdir', () => {
    const ids = DISTRICTS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ilk seviye her zaman aciktir, sonrakiler bir oncekinin kartpostalini ister', () => {
    const [first, second] = LEVELS;
    expect(isLevelUnlocked(first!, [])).toBe(true);
    expect(isLevelUnlocked(second!, [])).toBe(false);
    expect(isLevelUnlocked(second!, [first!.id])).toBe(true);
  });

  it('hedef metni her tur icin Turkce', () => {
    expect(objectiveText({ kind: 'score', target: 300 })).toContain('300');
    expect(objectiveText({ kind: 'lines', target: 12 })).toContain('çizgi');
    expect(objectiveText({ kind: 'cini', target: 3 })).toContain('Çini');
    expect(objectiveText({ kind: 'synergy', target: 3 })).toContain('sinerji');
    expect(objectiveText({ kind: 'bridge', target: 4 })).toContain('köprü');
  });

  it('districtById', () => {
    expect(districtById('galata')?.name).toBe('Galata');
    expect(districtById('yok')).toBeUndefined();
  });
});
