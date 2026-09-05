import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Heading, Text, View, useThemeColor } from '@/components/Themed';
import { LEVELS } from '@/game/core/levels';
import { seedFromDate } from '@/game/core/rng';
import { districtById, isLevelUnlocked, objectiveText } from '@/game/data/journey';
import { useGameStore } from '@/game/store/gameStore';

/** Istanbul Yolculugu: semt listesi ve kartpostal koleksiyonu. */
export default function JourneyScreen() {
  const router = useRouter();
  const surface = useThemeColor({}, 'surface');
  const accent = useThemeColor({}, 'accent');
  const postcards = useGameStore((state) => state.postcards);
  const newGame = useGameStore((state) => state.newGame);

  const start = useCallback(
    (levelId: string, index: number) => {
      // Semt basina sabit seed: ayni semt her denemede ayni parcalari verir,
      // oyuncu "ogrenerek" gecer. Tarih karistirilir ki gun degisince tazelensin.
      newGame(seedFromDate(new Date()) + index * 7919, { mode: 'journey', levelId });
      router.push('/game');
    },
    [newGame, router],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Heading>İstanbul Yolculuğu</Heading>
      <Text style={styles.sub}>{`${postcards.length}/${LEVELS.length} kartpostal`}</Text>

      {LEVELS.map((level, index) => {
        const district = districtById(level.id);
        const unlocked = isLevelUnlocked(level, postcards);
        const done = postcards.includes(level.id);
        return (
          <Pressable
            key={level.id}
            accessibilityRole="button"
            accessibilityLabel={`${district?.name ?? level.id}${done ? ', tamamlandı' : unlocked ? '' : ', kilitli'}`}
            accessibilityState={{ disabled: !unlocked }}
            disabled={!unlocked}
            onPress={() => start(level.id, index)}
            style={[
              styles.card,
              { backgroundColor: surface, opacity: unlocked ? 1 : 0.45 },
              done ? { borderColor: accent, borderWidth: 1 } : null,
            ]}
          >
            <View style={[styles.stamp, { backgroundColor: district?.color ?? accent }]}>
              <Text style={styles.stampEmoji}>{unlocked ? (district?.emoji ?? '📍') : '🔒'}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{`${index + 1}. ${district?.name ?? level.id}`}</Text>
              <Text style={styles.cardText}>{district?.subtitle ?? ''}</Text>
              <Text style={styles.cardText}>{`🎯 ${objectiveText(level.objective)}`}</Text>
            </View>
            {done ? <Text style={[styles.done, { color: accent }]}>✔</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  sub: { fontSize: 13, opacity: 0.7, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 12,
    minHeight: 72,
  },
  stamp: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampEmoji: { fontSize: 26 },
  cardBody: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardText: { fontSize: 12, opacity: 0.8 },
  done: { fontSize: 20, fontWeight: '800' },
});
