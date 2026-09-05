import { useEffect } from 'react';
import { StyleSheet, View as PlainView } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text, useThemeColor } from './Themed';

export const RECORD_BAR_TEST_ID = 'record-bar';

interface RecordBarProps {
  readonly score: number;
  readonly highScore: number;
}

const FILL_MS = 350;

/** Rekora kalan puan; rekor asildiysa 0. */
export function pointsToRecord(score: number, highScore: number): number {
  return Math.max(0, highScore - score);
}

/**
 * Kisisel rekora ilerleme cubugu.
 *
 * Block Blast'in en etkili tutunma ogesi liderlik tablosu degil, "kendi
 * rekoruna su kadar kaldi" cubugu: oyuncu rakiple degil kendisiyle yarisir.
 * Rekor yoksa (ilk oyun) cizilmez; bos bir cubuk hedef degil gurultu olur.
 */
export function RecordBar({ score, highScore }: RecordBarProps) {
  const accent = useThemeColor({}, 'accent');
  const track = useThemeColor({}, 'accentTrack');
  const tint = useThemeColor({}, 'tint');

  const beaten = highScore > 0 && score > highScore;
  const progress = highScore > 0 ? Math.min(1, score / highScore) : 0;

  const fill = useSharedValue(progress);
  useEffect(() => {
    fill.value = withTiming(progress, { duration: FILL_MS });
  }, [progress, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  if (highScore <= 0) {
    return null;
  }

  const remaining = pointsToRecord(score, highScore);
  const label = beaten ? 'Yeni rekor!' : `Rekora ${remaining.toLocaleString('tr-TR')}`;

  return (
    <PlainView
      testID={RECORD_BAR_TEST_ID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={beaten ? 'Yeni rekor' : `Rekora ${remaining} puan kaldı`}
      accessibilityValue={{ min: 0, max: highScore, now: Math.min(score, highScore) }}
      style={styles.container}
    >
      <PlainView style={[styles.track, { backgroundColor: track }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: beaten ? accent : tint }, fillStyle]}
        />
      </PlainView>
      <Text style={[styles.label, beaten ? { color: accent, fontWeight: '800' } : null]}>
        {label}
      </Text>
    </PlainView>
  );
}

const styles = StyleSheet.create({
  container: { width: '70%', maxWidth: 360, alignItems: 'center', gap: 4 },
  track: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  label: { fontSize: 12, opacity: 0.8 },
});
