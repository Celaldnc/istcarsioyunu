import { Pressable, StyleSheet, View as PlainView } from 'react-native';

import { Text, useThemeColor } from './Themed';

import type { Gull, Progress } from '@/game/core/game';
import { levelById } from '@/game/core/levels';
import { objectiveText } from '@/game/data/journey';

export const LIVE_HUD_TEST_ID = 'live-hud';

interface LiveHudProps {
  readonly levelId: string | null;
  readonly score: number;
  readonly progress: Progress;
  readonly gull: Gull | null;
  readonly hagglesLeft: number;
  readonly onHaggle: () => void;
}

/** Hedefe dogru ilerleme metni ("3/12"). */
export function objectiveProgress(
  objective: { readonly kind: string; readonly target: number },
  score: number,
  progress: Progress,
): string {
  const done =
    objective.kind === 'score'
      ? score
      : objective.kind === 'lines'
        ? progress.lines
        : objective.kind === 'cini'
          ? progress.cini
          : objective.kind === 'synergy'
            ? progress.synergy
            : progress.bridge;
  return `${Math.min(done, objective.target)}/${objective.target}`;
}

/**
 * Canli Carsi gostergeleri: yolculuk hedefi, marti geri sayimi, pazarlik.
 * Yalnizca gosterecek bir sey varsa cizilir; klasik modda bos kalir.
 */
export function LiveHud({ levelId, score, progress, gull, hagglesLeft, onHaggle }: LiveHudProps) {
  const tint = useThemeColor({}, 'tint');
  const level = levelById(levelId);
  const showHaggle = hagglesLeft > 0;

  if (level === undefined && gull === null && !showHaggle) {
    return null;
  }

  return (
    <PlainView testID={LIVE_HUD_TEST_ID} style={styles.row}>
      {level !== undefined ? (
        <Text
          accessibilityLabel={`Hedef: ${objectiveText(level.objective)}, ${objectiveProgress(level.objective, score, progress)}`}
          style={styles.item}
        >
          {`🎯 ${objectiveText(level.objective)} · ${objectiveProgress(level.objective, score, progress)}`}
        </Text>
      ) : null}

      {gull !== null ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Martı ${gull.col + 1}. sütunda, ${gull.turnsLeft} hamle sonra dalacak`}
          style={styles.item}
        >
          {`🕊️ ${gull.turnsLeft}`}
        </Text>
      ) : null}

      {showHaggle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pazarlık, ${hagglesLeft} hak`}
          onPress={onHaggle}
          style={[styles.button, { borderColor: tint }]}
        >
          <Text style={[styles.buttonText, { color: tint }]}>{`🤝 Pazarlık ×${hagglesLeft}`}</Text>
        </Pressable>
      ) : null}
    </PlainView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  item: { fontSize: 13, fontWeight: '600' },
  button: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 36,
  },
  buttonText: { fontSize: 13, fontWeight: '700' },
});
