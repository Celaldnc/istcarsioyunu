import { createHaptics, hapticFor, type HapticKind } from '../haptics';
import { getHaptics } from '../index';

import { SOUND_NAMES } from '@/game/audio/sources';

describe('hapticFor', () => {
  it.each(SOUND_NAMES)('%s icin bir karar vardir (null olabilir)', (cue) => {
    expect(hapticFor(cue)).not.toBeUndefined();
  });

  it('gecersiz hamle hata deseniyle hissedilir', () => {
    expect(hapticFor('invalid')).toBe('error');
  });

  it('oyun sonu titresmez', () => {
    expect(hapticFor('gameOver')).toBeNull();
  });

  it('combo yerlestirmeden daha guclu hissedilir', () => {
    const strength: Record<HapticKind, number> = {
      light: 1,
      medium: 2,
      heavy: 3,
      success: 3,
      error: 2,
    };
    expect(strength[hapticFor('combo') ?? 'light']).toBeGreaterThan(
      strength[hapticFor('place') ?? 'light'],
    );
  });
});

describe('createHaptics', () => {
  it('etkinken ses ipucuna karsilik gelen titresimi tetikler', () => {
    const trigger = jest.fn();
    const haptics = createHaptics({ trigger });

    haptics.fire('place');

    expect(trigger).toHaveBeenCalledWith('light');
  });

  it('kapaliyken hicbir sey tetiklemez', () => {
    const trigger = jest.fn();
    const haptics = createHaptics({ trigger, enabled: false });

    haptics.fire('combo');

    expect(trigger).not.toHaveBeenCalled();
  });

  it('desteklenmeyen platformda hicbir sey tetiklemez', () => {
    const trigger = jest.fn();
    const haptics = createHaptics({ trigger, supported: false });

    haptics.fire('combo');

    expect(trigger).not.toHaveBeenCalled();
  });

  it('deseni olmayan olayda (oyun sonu) tetiklemez', () => {
    const trigger = jest.fn();
    createHaptics({ trigger }).fire('gameOver');

    expect(trigger).not.toHaveBeenCalled();
  });

  it('acilip kapatilabilir', () => {
    const haptics = createHaptics({ trigger: jest.fn() });

    haptics.setEnabled(false);
    expect(haptics.isEnabled()).toBe(false);
    haptics.setEnabled(true);
    expect(haptics.isEnabled()).toBe(true);
  });

  it('tetikleyici senkron firlatirsa yutar', () => {
    const haptics = createHaptics({
      trigger: () => {
        throw new Error('native yok');
      },
    });

    expect(() => haptics.fire('clear')).not.toThrow();
  });

  it('tetikleyici reddedilen Promise dondururse yutar', async () => {
    const haptics = createHaptics({ trigger: () => Promise.reject(new Error('native yok')) });

    expect(() => haptics.fire('clear')).not.toThrow();
    // Reddin islenmesi icin mikro-gorev kuyrugu bosaltilir.
    await Promise.resolve();
  });
});

describe('getHaptics', () => {
  it('tek ornek dondurur ve expo-haptics uzerinden calisir', () => {
    const haptics = getHaptics();

    expect(getHaptics()).toBe(haptics);
    for (const cue of SOUND_NAMES) {
      expect(() => haptics.fire(cue)).not.toThrow();
    }
  });
});
