/**
 * expo-audio icin manuel mock.
 *
 * Paket Jest ortaminda yuklenemiyor (native ses modulu yok). Bu mock
 * yalnizca modulun IMPORT EDILEBILMESI icin var; ses mantiginin kendisi
 * soundManager.test.ts'te enjekte edilen sahte oynaticilarla test ediliyor.
 *
 * node_modules paketleri icin kok __mocks__ klasoru Jest tarafindan
 * OTOMATIK kullanilir.
 */

export function createAudioPlayer(_source?: unknown) {
  return {
    play: () => undefined,
    pause: () => undefined,
    seekTo: (_seconds: number) => Promise.resolve(),
    remove: () => undefined,
    volume: 1,
    loop: false,
  };
}

export function setAudioModeAsync(_mode?: unknown) {
  return Promise.resolve();
}
