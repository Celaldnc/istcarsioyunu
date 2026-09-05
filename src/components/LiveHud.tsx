import { Pressable, StyleSheet, View as PlainView } from 'react-native';

import { Text, useThemeColor } from './Themed';

import type { Cat, Gull, Progress } from '@/game/core/game';
import { litGateCount } from '@/game/core/gates';
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
  /** Yanan kapilar; null ise kapi kurali kapali (gosterge yok). */
  readonly gates?: number | null;
  readonly festivalTurns?: number;
  /** Kedi varsa "oksa" dugmesi (ekran okuyucu ve kesfedilebilirlik icin). */
  readonly cat?: Cat | null;
  readonly onPet?: () => void;
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
 * Canli Carsi gostergeleri: yolculuk hedefi, marti geri sayimi, kapilar,
 * senlik, kedi ve pazarlik. Yalnizca gosterecek bir sey varsa cizilir;
 * klasik modda bos kalir.
 */
export function LiveHud({
  levelId,
  score,
  progress,
  gull,
  hagglesLeft,
  onHaggle,
  gates = null,
  festivalTurns = 0,
  cat = null,
  onPet,
}: LiveHudProps) {
  const tint = useThemeColor({}, 'tint');
  const accent = useThemeColor({}, 'accent');
  const level = levelById(levelId);
  const showHaggle = hagglesLeft > 0;
  const showPet = cat !== null && cat.restTurns === 0 && onPet !== undefined;
  const lit = gates === null ? 0 : litGateCount(gates);

  if (
    level === undefined &&
    gull === null &&
    !showHaggle &&
    gates === null &&
    festivalTurns === 0 &&
    !showPet
  ) {
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

      {festivalTurns > 0 ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Çarşı şenliği, ${festivalTurns} hamle puan iki kat`}
          style={[styles.item, { color: accent }]}
        >
          {`🎉 Şenlik ×2 (${festivalTurns})`}
        </Text>
      ) : gates !== null ? (
        <Text accessibilityLabel={`${lit} kapı yandı, 4 olunca şenlik`} style={styles.item}>
          {`🏮 ${lit}/4`}
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

      {showPet ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tekir'i okşa"
          accessibilityHint="Kedi üç hamle yerinden kalkmaz"
          onPress={onPet}
          style={[styles.button, { borderColor: tint }]}
        >
          <Text style={[styles.buttonText, { color: tint }]}>🐈 Okşa</Text>
        </Pressable>
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
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
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
