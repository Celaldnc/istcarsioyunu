import { SOUND_NAMES, SOUND_SOURCES, type SoundName } from './sources';

/**
 * Ses efektleri yoneticisi.
 *
 * Iki tasarim karari:
 *
 * 1. Oynatici FABRIKASI enjekte edilir. Boylece mantik (etkinlik durumu,
 *    bastan sarma, temizleme) expo-audio veya native ses calistirmadan test
 *    edilebiliyor.
 * 2. Her cagri try/catch icinde. Ses oyunun kritik yolu DEGIL; bir efekt
 *    calmazsa hamle yine islenmeli. Sessiz basarisizlik burada dogru tercih.
 */

export interface SoundPlayer {
  play(): void;
  /**
   * Bastan sarar; hizli tekrarlarda sesin kesilmeden calmasi icin gerekli.
   * expo-audio'da ASENKRON (Promise doner) - tip bunu gizlememeli.
   */
  seekTo(seconds: number): Promise<void> | void;
  /** Kaynagi birakir. */
  remove(): void;
}

export type PlayerFactory = (source: unknown) => SoundPlayer;

export interface SoundManager {
  /** Tum sesleri bellege alir. Ilk calmada gecikme olmasin diye. */
  preload(): void;
  play(name: SoundName): void;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  /** Oynaticilari birakir (bellek sizintisi onlemi). */
  dispose(): void;
}

interface Options {
  readonly createPlayer: PlayerFactory;
  readonly enabled?: boolean;
}

export function createSoundManager({ createPlayer, enabled = true }: Options): SoundManager {
  const players = new Map<SoundName, SoundPlayer>();
  let soundEnabled = enabled;

  return {
    preload() {
      for (const name of SOUND_NAMES) {
        if (players.has(name)) {
          continue;
        }
        try {
          players.set(name, createPlayer(SOUND_SOURCES[name]));
        } catch {
          // Bir ses yuklenemezse digerleri yine calissin.
        }
      }
    },

    play(name) {
      if (!soundEnabled) {
        return;
      }
      const player = players.get(name);
      if (player === undefined) {
        return;
      }
      try {
        // seekTo asenkron: try/catch yalnizca senkron firlatmayi yakalar,
        // promise reddi yakalanmazsa unhandled rejection uyarisi cikar.
        void Promise.resolve(player.seekTo(0)).catch(() => {
          // Bastan saramadiysak da sesi calmayi deniyoruz.
        });
        player.play();
      } catch {
        // Ses kritik degil; hamle akisini bozmamali.
      }
    },

    setEnabled(next) {
      soundEnabled = next;
    },

    isEnabled() {
      return soundEnabled;
    },

    dispose() {
      for (const player of players.values()) {
        try {
          player.remove();
        } catch {
          // Zaten birakilmis olabilir.
        }
      }
      players.clear();
    },
  };
}
