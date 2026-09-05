import { getSoundManager } from '../index';
import { SOUND_NAMES } from '../sources';

describe('getSoundManager', () => {
  it('ayni ornegi dondurur (ses aygiti bir kez acilir)', () => {
    expect(getSoundManager()).toBe(getSoundManager());
  });

  it('varsayilan olarak ses aciktir', () => {
    expect(getSoundManager().isEnabled()).toBe(true);
  });

  it('preload ve play hata firlatmaz', () => {
    const manager = getSoundManager();

    expect(() => {
      manager.preload();
      for (const name of SOUND_NAMES) {
        manager.play(name);
      }
    }).not.toThrow();
  });
});
