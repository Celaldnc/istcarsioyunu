/**
 * Ses dosyalarinin kaynak tanimlari.
 *
 * DIKKAT: Bu dosyalar `scripts/generate-placeholder-sounds.mjs` ile uretilen
 * SENTETIK yer tutuculardir. Spec'in istedigi Turkce sesli efektler
 * (simitci "Gunaydiiin!", caydanlik, vapur duduğu, "Afiyet olsun!") KAYIT
 * gerektirir ve kod tarafindan uretilemez.
 *
 * Gercek kayitlar geldiginde assets/sounds/ icindeki dosyalari degistirmek
 * yeterli; burada veya cagri yerlerinde degisiklik gerekmez.
 */

export const SOUND_NAMES = ['place', 'clear', 'combo', 'invalid', 'gameOver'] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

// Metro asset kaydi require() ile yapilir; import ile calismaz.
export const SOUND_SOURCES: Readonly<Record<SoundName, unknown>> = {
  place: require('../../../assets/sounds/place.wav'),
  clear: require('../../../assets/sounds/clear.wav'),
  combo: require('../../../assets/sounds/combo.wav'),
  invalid: require('../../../assets/sounds/invalid.wav'),
  gameOver: require('../../../assets/sounds/gameOver.wav'),
};
