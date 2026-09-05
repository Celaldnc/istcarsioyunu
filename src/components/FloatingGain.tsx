import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColor } from './Themed';

import { FX } from '@/constants/config';

export const FLOATING_GAIN_TEST_ID = 'floating-gain';

interface FloatingGainProps {
  /** Son hamlenin puani. 0 ise hicbir sey gosterilmez. */
  readonly gain: number;
  /** Hamle kimligi; degisince yeni bir ucan yazi baslar. */
  readonly token: string;
  /** Puanin yanina eklenen kisa vurgu ("Çini!", "Combo!"). */
  readonly label?: string;
}

interface Shown {
  readonly token: string;
  readonly text: string;
}

/**
 * "+40" seklinde yukari suzulup solan puan yazisi.
 *
 * Skor rozetindeki sayinin degismesi gozden kacar; ucan yazi kazanci
 * hamlenin oldugu ANDA gorunur kilar. Token ile tetiklenir: ayni puanli
 * iki hamle ust uste gelse de ikisi de gosterilir.
 */
export function FloatingGain({ gain, token, label }: FloatingGainProps) {
  const accent = useThemeColor({}, 'accent');
  const [shown, setShown] = useState<Shown | null>(null);
  const lastToken = useRef<string | null>(null);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (lastToken.current === token || gain <= 0) {
      return undefined;
    }
    lastToken.current = token;

    const text = label === undefined ? `+${gain}` : `+${gain} ${label}`;
    setShown({ token, text });
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: FX.GAIN_FLOAT_MS,
      easing: Easing.out(Easing.cubic),
    });

    const timer = setTimeout(() => setShown(null), FX.GAIN_FLOAT_MS + 50);
    return () => clearTimeout(timer);
  }, [gain, token, label, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateY: -28 * progress.value }, { scale: 1 + 0.15 * (1 - progress.value) }],
  }));

  if (shown === null) {
    return null;
  }

  return (
    <Animated.Text
      testID={FLOATING_GAIN_TEST_ID}
      // Skor rozeti zaten ekran okuyucuya yeni degeri okur; bu yalnizca gorsel.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.text, { color: accent }, animated]}
    >
      {shown.text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '800',
    pointerEvents: 'none',
  },
});
