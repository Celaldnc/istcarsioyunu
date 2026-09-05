import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text, useThemeColor } from './Themed';

import { FX } from '@/constants/config';
import type { EsnafMessage } from '@/game/store/gameStore';

export const ESNAF_BUBBLE_TEST_ID = 'esnaf-bubble';

interface EsnafBubbleProps {
  readonly message: EsnafMessage | null;
}

/**
 * Carsi esnafinin konusma baloncugu.
 *
 * Yeni bir mesaj (yeni id) geldiginde belirir, FX.ESNAF_SHOW_MS sonra
 * kendiliginden kaybolur. Ayni mesaj yeniden render'da tekrar acilmaz;
 * tetikleyici mesajin KIMLIGI, metni degil.
 *
 * Gorunurluk TURETILIR: "mesaj var ve henuz suresi dolmadi". Effect icinde
 * setState cagirmak yerine zamanlayici yalnizca "suresi dolan id"yi
 * isaretler; boylece ardisik render zinciri olusmaz.
 */
export function EsnafBubble({ message }: EsnafBubbleProps) {
  const surface = useThemeColor({}, 'surface');
  const [expiredId, setExpiredId] = useState<number | null>(null);
  const opacity = useSharedValue(0);
  const lift = useSharedValue(6);

  const visible = message !== null && message.id !== expiredId ? message : null;

  useEffect(() => {
    if (message === null) {
      return undefined;
    }
    const { id } = message;

    opacity.value = withSequence(
      withTiming(1, { duration: FX.ESNAF_FADE_MS }),
      withDelay(FX.ESNAF_SHOW_MS, withTiming(0, { duration: FX.ESNAF_FADE_MS })),
    );
    lift.value = withSequence(withTiming(0, { duration: FX.ESNAF_FADE_MS }));

    // Gorunmez olduktan sonra agactan da kaldirilir; bos baloncuk ekran
    // okuyucuya "bos metin" olarak gitmesin.
    const timer = setTimeout(() => setExpiredId(id), FX.ESNAF_SHOW_MS + FX.ESNAF_FADE_MS * 2);
    return () => clearTimeout(timer);
  }, [message, opacity, lift]);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: lift.value }],
  }));

  if (visible === null) {
    return null;
  }

  return (
    <Animated.View
      testID={ESNAF_BUBBLE_TEST_ID}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Esnaf: ${visible.text}`}
      style={[styles.bubble, { backgroundColor: surface }, animated]}
    >
      <Text style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
        🧔
      </Text>
      <Text style={styles.text} numberOfLines={2}>
        {visible.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    maxWidth: '90%',
  },
  avatar: { fontSize: 20 },
  text: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
});
