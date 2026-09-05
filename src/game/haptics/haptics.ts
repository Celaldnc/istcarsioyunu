import type { SoundName } from '@/game/audio/sources';

/**
 * Titresim (haptik) geri bildirimi.
 *
 * Woodoku'nun "ASMR" hissinin yarisi sestir, diger yarisi parmak ucundaki
 * kucuk tik. Tasarim ses yoneticisiyle ayni: tetikleyici ENJEKTE edilir,
 * boylece secim kurali native modul olmadan test edilir; her cagri
 * try/catch icindedir cunku titresim oyunun kritik yolu degildir.
 */

export type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'error';

/** Fiziksel titresimi tetikleyen fonksiyon (expo-haptics ya da sahte). */
export type HapticTrigger = (kind: HapticKind) => Promise<void> | void;

export interface Haptics {
  /** Ses ipucuna karsilik gelen titresimi calar. */
  fire(cue: SoundName): void;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
}

/**
 * Hangi olay ne kadar hissedilmeli?
 *
 * Yerlestirme en hafif dokunus; temizleme belirgin; combo/Cini/rekor agir.
 * Gecersiz hamlede "hata" deseni: oyuncu bakmadan da reddedildigini anlar.
 * Oyun sonu titresmez; zaten kotu bir an, uzerine vurmanin anlami yok.
 */
const PATTERN: Readonly<Partial<Record<SoundName, HapticKind | null>>> = {
  place: 'light',
  clear: 'medium',
  combo: 'heavy',
  cini: 'heavy',
  levelUp: 'success',
  record: 'success',
  teaBreak: 'medium',
  invalid: 'error',
  gameOver: null,
  cat: 'light',
  gull: 'medium',
  nazar: 'medium',
  synergy: 'heavy',
  haggleWin: 'success',
  haggleLose: 'error',
  lantern: 'light',
  festival: 'success',
  current: 'medium',
};

export function hapticFor(cue: SoundName): HapticKind | null {
  const known = PATTERN[cue];
  if (known !== undefined) {
    return known;
  }
  // Makam notalari (note1..N): temizleme kadar hissedilir.
  return cue.startsWith('note') ? 'medium' : null;
}

interface Options {
  readonly trigger: HapticTrigger;
  readonly enabled?: boolean;
  /** Platform titresimi destekliyor mu? Web'de false; hicbir sey cagrilmaz. */
  readonly supported?: boolean;
}

export function createHaptics({ trigger, enabled = true, supported = true }: Options): Haptics {
  let hapticsEnabled = enabled;

  return {
    fire(cue) {
      const kind = hapticFor(cue);
      if (!hapticsEnabled || !supported || kind === null) {
        return;
      }
      try {
        // Reddedilen bir Promise yakalanmazsa uygulama seviyesinde uyari
        // uretir; titresim basarisizligi sessizce yutulur.
        void Promise.resolve(trigger(kind)).catch(() => undefined);
      } catch {
        // Senkron firlatma da ayni sekilde yutulur.
      }
    },
    setEnabled(next) {
      hapticsEnabled = next;
    },
    isEnabled() {
      return hapticsEnabled;
    },
  };
}
