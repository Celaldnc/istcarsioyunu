import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { sharePostcard, type ShareOutcome } from './sharePostcard';

/** data URL -> File (web paylasimi dosya ister). */
async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: 'image/png' });
}

/** Web: tarayici dosya paylasabiliyorsa gorseli, yoksa yalnizca metni paylasir. */
async function shareOnWeb(uri: string, title: string): Promise<void> {
  const file = await dataUrlToFile(uri, 'kartpostal.png');
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] }) === true) {
    await nav.share({ title, files: [file] });
    return;
  }
  await nav.share({ title, text: title });
}

/**
 * Kartpostal paylasim kancasi: ref'i karta ver, `share()` cagir.
 *
 * Web'de expo-sharing yok; view-shot data URL uretir ve tarayicinin
 * navigator.share'i varsa o kullanilir (dosyayla, destekliyorsa), yoksa
 * 'unavailable'.
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
            ? shareOnWeb(uri, options.dialogTitle)
            : Sharing.shareAsync(uri, options),
      },
      dialogTitle,
    );
    setOutcome(result);
    setBusy(false);
  }, [busy, dialogTitle]);

  return { ref, share, outcome, busy };
}
