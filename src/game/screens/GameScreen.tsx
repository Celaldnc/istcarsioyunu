/**
 * Oyun ekrani.
 *
 * NEDEN AYRI MODUL: Skia'nin ana modulu IMPORT ANINDA global CanvasKit'i
 * yakaliyor. Web'de CanvasKit WASM ile sonradan yuklendigi icin, Skia
 * kullanan hicbir modul uygulama giris grafiginde STATIK olarak
 * bulunmamali; aksi halde Skia undefined bir CanvasKit ile kurulur ve
 * ilk cizimde "Cannot read properties of undefined (reading
 * 'PictureRecorder')" ile patlar.
 *
 * Bu dosya src/app/(tabs)/index.tsx tarafindan TEMBEL yuklenir; yukleme
 * ancak CanvasKit hazir olduktan sonra tetiklenir.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { EsnafBubble } from '@/components/EsnafBubble';
import { FloatingGain } from '@/components/FloatingGain';
import { RecordBar } from '@/components/RecordBar';
import { ScoreBadge } from '@/components/ScoreBadge';
import { Heading, Text, View, useThemeColor } from '@/components/Themed';
import { levelForScore } from '@/game/core/level';
import { streakMultiplier } from '@/game/core/score';
import type { Point } from '@/game/core/types';
import { DEFAULT_THEME } from '@/game/data/themes';
import { PlayArea } from '@/game/engine/PlayArea';
import { useGameStore } from '@/game/store/gameStore';
import { usePersistOnBackground } from '@/hooks/usePersistOnBackground';

export default function GameScreen() {
  const { width } = useWindowDimensions();
  const linkColor = useThemeColor({}, 'link');
  const accent = useThemeColor({}, 'accent');

  const board = useGameStore((state) => state.board);
  const tray = useGameStore((state) => state.tray);
  const score = useGameStore((state) => state.score);
  const status = useGameStore((state) => state.status);
  const highScore = useGameStore((state) => state.highScore);
  const comboStreak = useGameStore((state) => state.comboStreak);
  const lastClear = useGameStore((state) => state.lastClear);
  const lastCini = useGameStore((state) => state.lastCini);
  const lastGain = useGameStore((state) => state.lastGain);
  const piecesDrawn = useGameStore((state) => state.piecesDrawn);
  const teaBreaksLeft = useGameStore((state) => state.teaBreaksLeft);
  const esnaf = useGameStore((state) => state.esnaf);
  const persistNow = useGameStore((state) => state.persistNow);
  const play = useGameStore((state) => state.play);
  const playAgain = useGameStore((state) => state.playAgain);
  const teaBreak = useGameStore((state) => state.teaBreak);

  // Android uygulamayi arka planda haber vermeden oldurebiliyor.
  usePersistOnBackground(persistNow);

  // Oyun alanina KALAN yukseklik olculur. Olcum flex:1 bir yuvada yapiliyor;
  // dogrudan PlayArea'yi olcmek icerik <-> yukseklik geri besleme dongusu
  // yaratirdi.
  const [areaHeight, setAreaHeight] = useState<number>();
  const handleAreaLayout = useCallback((event: LayoutChangeEvent) => {
    setAreaHeight(event.nativeEvent.layout.height);
  }, []);

  const handleDrop = useCallback(
    (trayIndex: number, origin: Point) => {
      play(trayIndex, origin);
    },
    [play],
  );

  // Hamle kimligi: skor her temizlemede artar, piecesDrawn her tepside,
  // teaBreaksLeft her molada. Ucu birlikte her efektli hamlede degisir.
  const moveToken = `${score}:${piecesDrawn}:${teaBreaksLeft}`;
  const burst = useMemo(() => ({ lines: lastClear, token: moveToken }), [lastClear, moveToken]);

  const lineCount = lastClear.rows.length + lastClear.cols.length;
  const ciniCount = lastCini.rows.length + lastCini.cols.length;
  const gainLabel = ciniCount > 0 ? 'Çini!' : lineCount >= 2 ? 'Combo!' : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.scores}>
        <View style={styles.scoreSlot}>
          <ScoreBadge score={score} />
          <FloatingGain gain={lastGain} token={moveToken} label={gainLabel} />
        </View>
        <ScoreBadge score={levelForScore(score)} label="Seviye" />
        {highScore > 0 ? <ScoreBadge score={highScore} label="En iyi" /> : null}
      </View>

      <RecordBar score={score} highScore={highScore} />

      {/* Seri ancak gercekten zincir kurulunca gosterilir; tek temizlemede
          carpan 1 oldugu icin gurultu yapmaz. */}
      {comboStreak > 1 ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${comboStreak} hamledir üst üste temizliyorsun`}
          style={[styles.combo, { color: linkColor }]}
        >
          {`Combo ×${streakMultiplier(comboStreak - 1).toFixed(1)}`}
        </Text>
      ) : null}

      <EsnafBubble message={esnaf} />

      <View style={styles.playAreaSlot} onLayout={handleAreaLayout}>
        <PlayArea
          board={board}
          tray={tray}
          width={width}
          maxHeight={areaHeight}
          theme={DEFAULT_THEME}
          burst={burst}
          onDrop={handleDrop}
        />
      </View>

      {status === 'gameOver' ? (
        <View accessible accessibilityLabel="Oyun bitti" style={styles.gameOver}>
          <Heading>Oyun bitti</Heading>
          <Text style={styles.gameOverText}>{`Toplam puan: ${score}`}</Text>

          <View style={styles.actions}>
            {teaBreaksLeft > 0 ? (
              <Pressable
                onPress={teaBreak}
                accessibilityRole="button"
                accessibilityLabel="Çay molası"
                accessibilityHint="En dolu satır ve sütunları boşaltıp oyuna devam eder"
                style={styles.action}
              >
                <Text style={[styles.actionText, { color: accent }]}>☕ Çay molası</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={playAgain}
              accessibilityRole="button"
              accessibilityLabel="Tekrar oyna"
              style={styles.action}
            >
              <Text style={[styles.actionText, { color: linkColor }]}>Tekrar oyna</Text>
            </Pressable>
          </View>
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
    gap: 12,
    paddingVertical: 12,
  },
  scores: { flexDirection: 'row', alignItems: 'flex-end', gap: 24 },
  scoreSlot: { alignItems: 'center' },
  combo: { fontSize: 16, fontWeight: '700' },
  playAreaSlot: { flex: 1, justifyContent: 'center', width: '100%' },
  gameOver: { alignItems: 'center', gap: 4 },
  gameOverText: { fontSize: 14, opacity: 0.7 },
  actions: { flexDirection: 'row', gap: 8 },
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
