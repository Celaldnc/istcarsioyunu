import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Heading, Text, useThemeColor } from '@/components/Themed';
import { seedFromDate } from '@/game/core/rng';
import type { GameMode } from '@/game/core/rules';
import { titleFor } from '@/game/core/titles';
import { activeEvent } from '@/game/data/calendar';
import { dayPhaseAt } from '@/game/data/dayCycle';
import { esnafById } from '@/game/data/esnaflar';
import { useGameStore } from '@/game/store/gameStore';

interface ModeCard {
  readonly mode: GameMode;
  readonly emoji: string;
  readonly title: string;
  readonly text: string;
}

const MODES: readonly ModeCard[] = [
  {
    mode: 'canli',
    emoji: '🐈',
    title: 'Canlı Çarşı',
    text: 'Tekir, martı, nazar, sinerji ve pazarlık. Çarşının tamamı.',
  },
  {
    mode: 'classic',
    emoji: '🧱',
    title: 'Klasik',
    text: 'Saf blok bulmaca. Sadece sen ve tahta.',
  },
  {
    mode: 'daily',
    emoji: '📅',
    title: 'Günün Çarşısı',
    text: 'Herkes bugün aynı parçaları çeker. Skorunu karşılaştır.',
  },
];

const PHASE_TITLE = {
  morning: 'Günaydın',
  day: 'Hoş geldin',
  evening: 'İyi akşamlar',
  night: 'İyi geceler',
} as const;

/** Ana ekran: mod secimi, devam eden oyun, yolculuk ve unvan. */
export default function HomeScreen() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const surface = useThemeColor({}, 'surface');
  const accent = useThemeColor({}, 'accent');

  const status = useGameStore((state) => state.status);
  const mode = useGameStore((state) => state.mode);
  const score = useGameStore((state) => state.score);
  const stats = useGameStore((state) => state.stats);
  const postcards = useGameStore((state) => state.postcards);
  const esnafId = useGameStore((state) => state.selectedEsnafId);
  const daily = useGameStore((state) => state.daily);
  const newGame = useGameStore((state) => state.newGame);

  const start = useCallback(
    (nextMode: GameMode) => {
      // Gunun Carsisi: tarih seed'i, herkes ayni tahta. Digerleri: rastgele.
      const seed = nextMode === 'daily' ? seedFromDate(new Date()) : Date.now() % 1_000_000_007;
      newGame(seed, { mode: nextMode });
      router.push('/game');
    },
    [newGame, router],
  );

  const title = titleFor(stats);
  const esnaf = esnafById(esnafId);
  const event = activeEvent(new Date());

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Heading>{`${PHASE_TITLE[dayPhaseAt(new Date())]}, ${title.name}!`}</Heading>
      <Text style={styles.sub}>
        {`${esnaf?.emoji ?? ''} ${esnaf?.name ?? ''} · ${postcards.length} kartpostal · ${stats.games} oyun`}
      </Text>

      {event !== null ? (
        <Pressable
          accessibilityRole="text"
          accessibilityLabel={`${event.title}: ${event.text}`}
          style={[styles.card, { backgroundColor: accent }]}
        >
          <Text style={[styles.cardTitle, styles.onTint]}>{`${event.emoji} ${event.title}`}</Text>
          <Text style={[styles.cardText, styles.onTint]}>{event.text}</Text>
        </Pressable>
      ) : null}

      {status === 'playing' && score > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Devam et"
          onPress={() => router.push('/game')}
          style={[styles.card, { backgroundColor: tint }]}
        >
          <Text style={[styles.cardTitle, styles.onTint]}>▶ Devam et</Text>
          <Text
            style={[styles.cardText, styles.onTint]}
          >{`${score} puan · ${modeName(mode)}`}</Text>
        </Pressable>
      ) : null}

      {MODES.map((card) => (
        <Pressable
          key={card.mode}
          accessibilityRole="button"
          accessibilityLabel={card.title}
          onPress={() => start(card.mode)}
          style={[styles.card, { backgroundColor: surface }]}
        >
          <Text style={styles.cardTitle}>{`${card.emoji} ${card.title}`}</Text>
          <Text style={styles.cardText}>
            {card.mode === 'daily' && daily !== null
              ? `${card.text} Bugünkü rekorun: ${daily.best}`
              : card.text}
          </Text>
        </Pressable>
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="İstanbul Yolculuğu"
        onPress={() => router.push('/journey')}
        style={[styles.card, { backgroundColor: surface, borderColor: accent, borderWidth: 1 }]}
      >
        <Text style={styles.cardTitle}>🗺️ İstanbul Yolculuğu</Text>
        <Text style={styles.cardText}>Semt semt ilerle, kartpostal topla, esnafları aç.</Text>
      </Pressable>
    </ScrollView>
  );
}

function modeName(mode: GameMode): string {
  switch (mode) {
    case 'canli':
      return 'Canlı Çarşı';
    case 'classic':
      return 'Klasik';
    case 'daily':
      return 'Günün Çarşısı';
    case 'journey':
      return 'Yolculuk';
  }
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, alignItems: 'stretch' },
  sub: { fontSize: 13, opacity: 0.7, marginBottom: 8 },
  card: { borderRadius: 16, padding: 16, gap: 4, minHeight: 64 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardText: { fontSize: 13, opacity: 0.8 },
  onTint: { color: '#fff', opacity: 1 },
});
