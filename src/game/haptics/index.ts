import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

import { createHaptics, type HapticKind, type Haptics } from './haptics';

export type { Haptics, HapticKind } from './haptics';
export { hapticFor } from './haptics';

/** expo-haptics cagrilarina esleme. */
function trigger(kind: HapticKind): Promise<void> {
  switch (kind) {
    case 'light':
      return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    case 'medium':
      return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
    case 'heavy':
      return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
    case 'success':
      return ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
    case 'error':
      return ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
  }
}

let instance: Haptics | undefined;

/** Uygulamanin titresim yoneticisi; tembel olusturulur. */
export function getHaptics(): Haptics {
  if (instance === undefined) {
    // Web'de titresim API'si masaustunde yok, mobil tarayicida tutarsiz;
    // hic denememek en temizi.
    instance = createHaptics({ trigger, supported: Platform.OS !== 'web' });
  }
  return instance;
}
