import { createSoundManager, type SoundPlayer } from '../soundManager';
import { SOUND_NAMES } from '../sources';

interface FakePlayer extends SoundPlayer {
  readonly calls: string[];
}

const fakePlayer = (): FakePlayer => {
  const calls: string[] = [];
  return {
    calls,
    play: () => {
      calls.push('play');
    },
    seekTo: (seconds: number) => {
      calls.push(`seek:${seconds}`);
    },
    remove: () => {
      calls.push('remove');
    },
  };
};

/** Uretilen oynaticilari kaydeden fabrika. */
function trackingFactory() {
  const created: FakePlayer[] = [];
  return {
    created,
    createPlayer: () => {
      const player = fakePlayer();
      created.push(player);
      return player;
    },
  };
}

describe('createSoundManager', () => {
  it('preload tum sesler icin oynatici olusturur', () => {
    const factory = trackingFactory();
    const manager = createSoundManager({ createPlayer: factory.createPlayer });

    manager.preload();

    expect(factory.created).toHaveLength(SOUND_NAMES.length);
  });

  it('preload iki kez cagrilirsa oynaticilari cogaltmaz', () => {
    const factory = trackingFactory();
    const manager = createSoundManager({ createPlayer: factory.createPlayer });

    manager.preload();
    manager.preload();

    expect(factory.created).toHaveLength(SOUND_NAMES.length);
  });

  it('calmadan once bastan sarar (hizli tekrarlar kesilmesin)', () => {
    const factory = trackingFactory();
    const manager = createSoundManager({ createPlayer: factory.createPlayer });
    manager.preload();

    manager.play('place');

    expect(factory.created[0]?.calls).toEqual(['seek:0', 'play']);
  });

  it('ses kapaliyken calmaz', () => {
    const factory = trackingFactory();
    const manager = createSoundManager({ createPlayer: factory.createPlayer, enabled: false });
    manager.preload();

    manager.play('place');

    expect(factory.created[0]?.calls).toEqual([]);
  });

  it('setEnabled ile acilip kapanabilir', () => {
    const factory = trackingFactory();
    const manager = createSoundManager({ createPlayer: factory.createPlayer, enabled: false });
    manager.preload();

    manager.setEnabled(true);
    manager.play('place');
    expect(manager.isEnabled()).toBe(true);
    expect(factory.created[0]?.calls).toContain('play');

    manager.setEnabled(false);
    expect(manager.isEnabled()).toBe(false);
  });

  it('preload edilmemis ses cagrilirsa sessizce gecer', () => {
    const manager = createSoundManager({ createPlayer: () => fakePlayer() });

    expect(() => manager.play('clear')).not.toThrow();
  });

  it('oynatici olusturulamazsa digerleri yine yuklenir', () => {
    let attempt = 0;
    const manager = createSoundManager({
      createPlayer: () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error('kaynak bulunamadi');
        }
        return fakePlayer();
      },
    });

    expect(() => manager.preload()).not.toThrow();
    // Ilk ses yuklenemedi ama sonraki calisiyor.
    expect(() => manager.play(SOUND_NAMES[1])).not.toThrow();
  });

  it('calma hatasi oyunu bozmaz', () => {
    const manager = createSoundManager({
      createPlayer: () => ({
        play: () => {
          throw new Error('ses aygiti mesgul');
        },
        seekTo: () => undefined,
        remove: () => undefined,
      }),
    });
    manager.preload();

    expect(() => manager.play('place')).not.toThrow();
  });

  it('dispose tum oynaticilari birakir', () => {
    const factory = trackingFactory();
    const manager = createSoundManager({ createPlayer: factory.createPlayer });
    manager.preload();

    manager.dispose();

    for (const player of factory.created) {
      expect(player.calls).toContain('remove');
    }
  });

  it('seekTo promise reddi yakalanir (unhandled rejection olmaz)', async () => {
    const played: string[] = [];
    const manager = createSoundManager({
      createPlayer: () => ({
        play: () => {
          played.push('play');
        },
        // expo-audio'da seekTo ASENKRON; reddi try/catch yakalamaz.
        seekTo: () => Promise.reject(new Error('sarma basarisiz')),
        remove: () => undefined,
      }),
    });
    manager.preload();

    expect(() => manager.play('place')).not.toThrow();
    // Reddin islenmesi icin mikrogorev kuyruguna firsat ver.
    await Promise.resolve();

    // Bastan saramasa da ses calinmaya devam etmeli.
    expect(played).toContain('play');
  });

  it('dispose sonrasi calma sessizce gecer', () => {
    const factory = trackingFactory();
    const manager = createSoundManager({ createPlayer: factory.createPlayer });
    manager.preload();
    manager.dispose();

    expect(() => manager.play('place')).not.toThrow();
  });

  it('birakma hatasi dispose akisini kesmez', () => {
    const manager = createSoundManager({
      createPlayer: () => ({
        play: () => undefined,
        seekTo: () => undefined,
        remove: () => {
          throw new Error('zaten birakilmis');
        },
      }),
    });
    manager.preload();

    expect(() => manager.dispose()).not.toThrow();
  });
});
