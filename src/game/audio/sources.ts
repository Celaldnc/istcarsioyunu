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

import { MAKAM } from '@/constants/config';

/** Makam serisinin notalari: note1..noteN. */
export const NOTE_NAMES = Array.from({ length: MAKAM.NOTES }, (_, i) => `note${i + 1}` as const);

export const SOUND_NAMES = [
  'place',
  'clear',
  'combo',
  'invalid',
  'gameOver',
  'cini',
  'levelUp',
  'record',
  'teaBreak',
  'cat',
  'gull',
  'nazar',
  'synergy',
  'haggleWin',
  'haggleLose',
  'lantern',
  'festival',
  'current',
  ...NOTE_NAMES,
] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

/** Seri uzunlugu icin makam notasi (1 tabanli; tavani asinca son nota). */
export function noteForStreak(streak: number): SoundName {
  const index = Math.max(1, Math.min(MAKAM.NOTES, Math.trunc(streak)));
  return `note${index}` as SoundName;
}

// Metro asset kaydi require() ile yapilir; import ile calismaz ve dinamik
// yol da kabul etmez; bu yuzden notalar tek tek yazilir.
export const SOUND_SOURCES: Readonly<Record<SoundName, unknown>> = {
  place: require('../../../assets/sounds/place.wav'),
  clear: require('../../../assets/sounds/clear.wav'),
  combo: require('../../../assets/sounds/combo.wav'),
  invalid: require('../../../assets/sounds/invalid.wav'),
  gameOver: require('../../../assets/sounds/gameOver.wav'),
  cini: require('../../../assets/sounds/cini.wav'),
  levelUp: require('../../../assets/sounds/levelUp.wav'),
  record: require('../../../assets/sounds/record.wav'),
  teaBreak: require('../../../assets/sounds/teaBreak.wav'),
  cat: require('../../../assets/sounds/cat.wav'),
  gull: require('../../../assets/sounds/gull.wav'),
  nazar: require('../../../assets/sounds/nazar.wav'),
  synergy: require('../../../assets/sounds/synergy.wav'),
  haggleWin: require('../../../assets/sounds/haggleWin.wav'),
  haggleLose: require('../../../assets/sounds/haggleLose.wav'),
  lantern: require('../../../assets/sounds/lantern.wav'),
  festival: require('../../../assets/sounds/festival.wav'),
  current: require('../../../assets/sounds/current.wav'),
  note1: require('../../../assets/sounds/note1.wav'),
  note2: require('../../../assets/sounds/note2.wav'),
  note3: require('../../../assets/sounds/note3.wav'),
  note4: require('../../../assets/sounds/note4.wav'),
  note5: require('../../../assets/sounds/note5.wav'),
  note6: require('../../../assets/sounds/note6.wav'),
  note7: require('../../../assets/sounds/note7.wav'),
  note8: require('../../../assets/sounds/note8.wav'),
};
