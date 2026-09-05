import { createAudioPlayer } from 'expo-audio';

import { createSoundManager, type SoundManager } from './soundManager';

export type { SoundManager } from './soundManager';
export type { SoundName } from './sources';

let instance: SoundManager | undefined;

/**
 * Uygulamanin ses yoneticisi (expo-audio ile).
 *
 * Tembel olusturulur: modul yuklenir yuklenmez ses aygitini acmak, testlerde
 * ve ses kapaliyken gereksiz yan etki olurdu.
 */
export function getSoundManager(): SoundManager {
  if (instance === undefined) {
    instance = createSoundManager({
      createPlayer: (source) =>
        createAudioPlayer(source as Parameters<typeof createAudioPlayer>[0]),
    });
  }
  return instance;
}
