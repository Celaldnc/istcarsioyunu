import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { sharePostcard, type ShareOutcome } from './sharePostcard';

/**
 * Kartpostal paylasim kancasi: ref'i karta ver, `share()` cagir.
 *
 * Web'de expo-sharing yok; view-shot data URL uretir ve tarayicinin
 * navigator.share'i varsa o kullanilir, yoksa 'unavailable'.
 */
export function usePostcardShare(dialogTitle: string) {
  const ref = useRef<View>(null);
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const [busy, setBusy] = useState(false);

  const share = useCallback(async () => {
    if (ref.current === null || busy) {
      return;
    }
    setBusy(true);
    const result = await sharePostcard(
      {
        capture: () =>
          captureRef(ref, {
            format: 'png',
            quality: 1,
            result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
          }),
        isAvailable: () =>
          Platform.OS === 'web'
            ? Promise.resolve(typeof navigator !== 'undefined' && 'share' in navigator)
            : Sharing.isAvailableAsync(),
        share: (uri, options) =>
          Platform.OS === 'web'
            ? navigator.share({ title: options.dialogTitle, text: options.dialogTitle })
            : Sharing.shareAsync(uri, options),
      },
      dialogTitle,
    );
    setOutcome(result);
    setBusy(false);
  }, [busy, dialogTitle]);

  return { ref, share, outcome, busy };
}
