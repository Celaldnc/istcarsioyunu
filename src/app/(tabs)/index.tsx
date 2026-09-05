import { useCallback } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { ScoreBadge } from '@/components/ScoreBadge';
import { Heading, Text, View, useThemeColor } from '@/components/Themed';
import type { Point } from '@/game/core/types';
import { DEFAULT_THEME } from '@/game/data/themes';
import { PlayArea } from '@/game/engine/PlayArea';
import { useGameStore } from '@/game/store/gameStore';

export default function PlayScreen() {
  const { width } = useWindowDimensions();
  const linkColor = useThemeColor({}, 'link');

  const board = useGameStore((state) => state.board);
  const tray = useGameStore((state) => state.tray);
  const score = useGameStore((state) => state.score);
  const status = useGameStore((state) => state.status);
  const play = useGameStore((state) => state.play);
  const playAgain = useGameStore((state) => state.playAgain);

  const handleDrop = useCallback(
    (trayIndex: number, origin: Point) => {
      play(trayIndex, origin);
    },
    [play],
  );

  return (
    <View style={styles.container}>
      <ScoreBadge score={score} />

      <PlayArea board={board} tray={tray} width={width} theme={DEFAULT_THEME} onDrop={handleDrop} />

      {status === 'gameOver' ? (
        <View accessible accessibilityLabel="Oyun bitti" style={styles.gameOver}>
          <Heading>Oyun bitti</Heading>
          <Text style={styles.gameOverText}>{`Toplam puan: ${score}`}</Text>

          <Pressable
            onPress={playAgain}
            accessibilityRole="button"
            accessibilityLabel="Tekrar oyna"
            style={styles.action}
          >
            <Text style={[styles.actionText, { color: linkColor }]}>Tekrar oyna</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  gameOver: { alignItems: 'center', gap: 4 },
  gameOverText: { fontSize: 14, opacity: 0.7 },
  // Material dokunma hedefi 48dp
  action: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  actionText: { fontSize: 16, fontWeight: '600' },
});
