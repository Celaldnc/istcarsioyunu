import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View as PlainView } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Text, useThemeColor } from './Themed';

import { HAGGLE } from '@/constants/config';
import type { Piece } from '@/game/core/types';
import { shapeLabel } from '@/game/data/shapeLabels';

export const HAGGLE_PANEL_TEST_ID = 'haggle-panel';
export const HAGGLE_NEEDLE_TEST_ID = 'haggle-needle';

interface HagglePanelProps {
  readonly tray: readonly (Piece | undefined)[];
  readonly hagglesLeft: number;
  /** Sonuc: hangi yuva, tutturuldu mu. */
  readonly onResult: (trayIndex: number, success: boolean) => void;
  readonly onClose: () => void;
}

/** Ibre konumu (0..1) yesil bolgede mi? Saf; test edilir. */
export function isHit(position: number): boolean {
  return Math.abs(position - 0.5) <= HAGGLE.TARGET_WIDTH / 2;
}

/**
 * Pazarlik mini oyunu: once yuva sec, sonra kayan ibreyi yesil bolgede
 * durdur. Tutturursan parca bedava degisir; kacirirsan puan gider.
 *
 * Ibre UI thread'inde salinir (Reanimated); "Dur!" aninda degeri JS'te
 * okunur. Bu, gecikme yuzunden "tutturdum ama kaybettim" hissini onler.
 */
export function HagglePanel({ tray, hagglesLeft, onResult, onClose }: HagglePanelProps) {
  const surface = useThemeColor({}, 'surface');
  const accent = useThemeColor({}, 'accent');
  const tint = useThemeColor({}, 'tint');
  const [slot, setSlot] = useState<number | null>(null);
  const needle = useSharedValue(0);

  useEffect(() => {
    if (slot === null) {
      return undefined;
    }
    needle.value = 0;
    needle.value = withRepeat(
      withTiming(1, { duration: HAGGLE.SWEEP_MS, easing: Easing.linear }),
      -1,
      true,
    );
    return () => cancelAnimation(needle);
  }, [slot, needle]);

  const needleStyle = useAnimatedStyle(() => ({ left: `${needle.value * 100}%` }));

  const stop = useCallback(() => {
    if (slot === null) {
      return;
    }
    const position = needle.value;
    cancelAnimation(needle);
    onResult(slot, isHit(position));
  }, [slot, needle, onResult]);

  const targetLeft = (0.5 - HAGGLE.TARGET_WIDTH / 2) * 100;

  return (
    <PlainView
      testID={HAGGLE_PANEL_TEST_ID}
      accessible
      accessibilityLabel="Pazarlık"
      style={[styles.panel, { backgroundColor: surface }]}
    >
      <Text style={styles.title}>{`🤝 Pazarlık (${hagglesLeft} hak)`}</Text>

      {slot === null ? (
        <>
          <Text style={styles.hint}>Hangi parçayı değiştirelim?</Text>
          <PlainView style={styles.row}>
            {tray.map((piece, index) =>
              piece === undefined ? null : (
                <Pressable
                  key={index}
                  accessibilityRole="button"
                  accessibilityLabel={`${index + 1}. parçayı pazarlığa koy`}
                  onPress={() => setSlot(index)}
                  style={[styles.choice, { borderColor: tint }]}
                >
                  <Text style={styles.choiceText}>{shapeLabel(piece.shape.id)}</Text>
                </Pressable>
              ),
            )}
          </PlainView>
        </>
      ) : (
        <>
          <Text style={styles.hint}>İbre yeşile gelince dokun!</Text>
          <PlainView style={styles.track}>
            <PlainView
              style={[
                styles.target,
                { left: `${targetLeft}%`, width: `${HAGGLE.TARGET_WIDTH * 100}%` },
              ]}
            />
            <Animated.View
              testID={HAGGLE_NEEDLE_TEST_ID}
              style={[styles.needle, { backgroundColor: accent }, needleStyle]}
            />
          </PlainView>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dur"
            onPress={stop}
            style={[styles.stop, { backgroundColor: tint }]}
          >
            <Text style={styles.stopText}>DUR!</Text>
          </Pressable>
        </>
      )}

      <Pressable accessibilityRole="button" accessibilityLabel="Vazgeç" onPress={onClose}>
        <Text style={styles.cancel}>Vazgeç</Text>
      </Pressable>
    </PlainView>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '92%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 13, opacity: 0.8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  choice: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  choiceText: { fontSize: 14, fontWeight: '600' },
  track: {
    width: '100%',
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(127,127,127,0.25)',
    overflow: 'hidden',
  },
  target: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#4E8A3C', opacity: 0.8 },
  needle: { position: 'absolute', top: -2, width: 4, height: 22, borderRadius: 2, marginLeft: -2 },
  stop: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  stopText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancel: { fontSize: 13, opacity: 0.7, paddingVertical: 8 },
});
