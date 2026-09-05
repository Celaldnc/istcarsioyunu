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
 * Bu dosya src/app/game.tsx tarafindan TEMBEL yuklenir; yukleme ancak
 * CanvasKit hazir olduktan sonra tetiklenir.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { EsnafBubble } from '@/components/EsnafBubble';
import { FloatingGain } from '@/components/FloatingGain';
import { HagglePanel } from '@/components/HagglePanel';
import { LiveHud } from '@/components/LiveHud';
import { PostcardCard } from '@/components/PostcardCard';
import { RecordBar } from '@/components/RecordBar';
import { ScoreBadge } from '@/components/ScoreBadge';
import { Heading, Text, View, useThemeColor } from '@/components/Themed';
import { levelForScore } from '@/game/core/level';
import { nextLevelId } from '@/game/core/levels';
import { streakMultiplier } from '@/game/core/score';
import { titleFor } from '@/game/core/titles';
import type { Point } from '@/game/core/types';
import { dayPhaseAt, themeForPhase, type DayPhase } from '@/game/data/dayCycle';
import { districtById } from '@/game/data/journey';
import { DEFAULT_THEME } from '@/game/data/themes';
import { PlayArea } from '@/game/engine/PlayArea';
import { usePostcardShare } from '@/game/share/usePostcardShare';
import { useGameStore } from '@/game/store/gameStore';
import { usePersistOnBackground } from '@/hooks/usePersistOnBackground';

interface GameScreenProps {
  /** "Carsiya don" — rota katmani verir; testte gerekmez. */
  readonly onExit?: () => void;
}

/** Gunun fazi; dakikada bir tazelenir ki uzun oturumda aksam gelsin. */
function useDayPhase(): DayPhase {
  const [phase, setPhase] = useState<DayPhase>(() => dayPhaseAt(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setPhase(dayPhaseAt(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);
  return phase;
}

export default function GameScreen({ onExit }: GameScreenProps) {
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
  const lastBonuses = useGameStore((state) => state.lastBonuses);
  const piecesDrawn = useGameStore((state) => state.piecesDrawn);
  const teaBreaksLeft = useGameStore((state) => state.teaBreaksLeft);
  const esnaf = useGameStore((state) => state.esnaf);
  const cat = useGameStore((state) => state.cat);
  const gull = useGameStore((state) => state.gull);
  const curses = useGameStore((state) => state.curses);
  const hagglesLeft = useGameStore((state) => state.hagglesLeft);
  const levelId = useGameStore((state) => state.levelId);
  const progress = useGameStore((state) => state.progress);
  const stats = useGameStore((state) => state.stats);
  const persistNow = useGameStore((state) => state.persistNow);
  const play = useGameStore((state) => state.play);
  const playAgain = useGameStore((state) => state.playAgain);
  const teaBreak = useGameStore((state) => state.teaBreak);
  const pet = useGameStore((state) => state.pet);
  const haggle = useGameStore((state) => state.haggle);
  const newGame = useGameStore((state) => state.newGame);

  // Android uygulamayi arka planda haber vermeden oldurebiliyor.
  usePersistOnBackground(persistNow);

  const phase = useDayPhase();
  const theme = useMemo(() => themeForPhase(DEFAULT_THEME, phase), [phase]);

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

  const [haggling, setHaggling] = useState(false);
  const openHaggle = useCallback(() => setHaggling(true), []);
  const closeHaggle = useCallback(() => setHaggling(false), []);
  const handleHaggle = useCallback(
    (trayIndex: number, success: boolean) => {
      haggle(trayIndex, success);
      setHaggling(false);
    },
    [haggle],
  );

  // Hamle kimligi: skor her temizlemede artar, piecesDrawn her tepside,
  // teaBreaksLeft her molada. Ucu birlikte her efektli hamlede degisir.
  const moveToken = `${score}:${piecesDrawn}:${teaBreaksLeft}`;
  const burst = useMemo(() => ({ lines: lastClear, token: moveToken }), [lastClear, moveToken]);

  const lineCount = lastClear.rows.length + lastClear.cols.length;
  const ciniCount = lastCini.rows.length + lastCini.cols.length;
  const bonusLabel =
    lastBonuses.find((b) => b.kind === 'makam') !== undefined
      ? 'Makam!'
      : lastBonuses.find((b) => b.kind === 'bridge') !== undefined
        ? 'Köprü!'
        : lastBonuses.find((b) => b.kind === 'synergy') !== undefined
          ? 'Sinerji!'
          : lastBonuses.find((b) => b.kind === 'gullFed') !== undefined
            ? 'Simit!'
            : lastBonuses.find((b) => b.kind === 'nazar') !== undefined
              ? 'Nazar bozuldu!'
              : ciniCount > 0
                ? 'Çini!'
                : lineCount >= 2
                  ? 'Combo!'
                  : undefined;

  const district = levelId === null ? undefined : districtById(levelId);
  const next = levelId === null ? undefined : nextLevelId(levelId);
  const title = titleFor(stats);
  const finished = status !== 'playing';
  const {
    ref: postcardRef,
    share: sharePostcardNow,
    outcome: shareOutcome,
    busy: shareBusy,
  } = usePostcardShare('İstanbul Çarşı Blok kartpostalı');
  const isRecord = highScore > 0 && score >= highScore;

  return (
    <View style={styles.container}>
      <View style={styles.scores}>
        <View style={styles.scoreSlot}>
          <ScoreBadge score={score} />
          <FloatingGain gain={lastGain} token={moveToken} label={bonusLabel} />
        </View>
        <ScoreBadge score={levelForScore(score)} label="Seviye" />
        {highScore > 0 ? <ScoreBadge score={highScore} label="En iyi" /> : null}
      </View>

      <RecordBar score={score} highScore={highScore} />

      <LiveHud
        levelId={levelId}
        score={score}
        progress={progress}
        gull={gull}
        hagglesLeft={status === 'playing' ? hagglesLeft : 0}
        onHaggle={openHaggle}
      />

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

      {haggling ? (
        <HagglePanel
          tray={tray}
          hagglesLeft={hagglesLeft}
          onResult={handleHaggle}
          onClose={closeHaggle}
        />
      ) : null}

      <View style={styles.playAreaSlot} onLayout={handleAreaLayout}>
        <PlayArea
          board={board}
          tray={tray}
          width={width}
          maxHeight={areaHeight}
          theme={theme}
          burst={burst}
          cat={cat}
          gull={gull}
          curses={curses}
          onDrop={handleDrop}
          onPet={pet}
        />
      </View>

      {finished ? (
        <View style={styles.postcard}>
          <PostcardCard
            ref={postcardRef}
            heading={district?.name ?? (isRecord ? 'Yeni rekor!' : 'Çarşı günü')}
            emoji={district?.emoji ?? (isRecord ? '🏆' : '🧿')}
            score={score}
            title={title.name}
            dateText={new Date().toLocaleDateString('tr-TR')}
            color={district?.color ?? theme.palette[2] ?? '#1E6FA8'}
          />
          <Pressable
            onPress={() => void sharePostcardNow()}
            accessibilityRole="button"
            accessibilityLabel="Kartpostalı paylaş"
            disabled={shareBusy}
            style={styles.action}
          >
            <Text style={[styles.actionText, { color: accent }]}>
              {shareOutcome === 'unavailable'
                ? 'Paylaşım bu cihazda yok'
                : shareOutcome === 'shared'
                  ? '📮 Paylaşıldı'
                  : '📮 Kartpostalı paylaş'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {status === 'gameOver' ? (
        <View accessible accessibilityLabel="Oyun bitti" style={styles.gameOver}>
          <Heading>Oyun bitti</Heading>
          <Text style={styles.gameOverText}>{`Toplam puan: ${score}`}</Text>
          <Text style={styles.summary}>
            {`${progress.lines} çizgi · ${progress.cini} Çini · en uzun seri ${progress.bestStreak}` +
              (progress.gullsFed > 0 ? ` · ${progress.gullsFed} simit` : '') +
              (progress.catMoves > 0 ? ` · Tekir ${progress.catMoves} kez taşındı` : '')}
          </Text>
          <Text style={[styles.summary, { color: accent }]}>{`Unvanın: ${title.name}`}</Text>

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

            {onExit !== undefined ? (
              <Pressable
                onPress={onExit}
                accessibilityRole="button"
                accessibilityLabel="Çarşıya dön"
                style={styles.action}
              >
                <Text style={[styles.actionText, { color: linkColor }]}>Çarşıya dön</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {status === 'won' ? (
        <View accessible accessibilityLabel="Semt tamamlandı" style={styles.gameOver}>
          <Heading>{`${district?.emoji ?? '🎉'} ${district?.name ?? 'Semt'} tamam!`}</Heading>
          <Text style={styles.gameOverText}>Kartpostal koleksiyonuna eklendi.</Text>

          <View style={styles.actions}>
            {next !== undefined ? (
              <Pressable
                onPress={() => newGame(undefined, { mode: 'journey', levelId: next })}
                accessibilityRole="button"
                accessibilityLabel="Sonraki semt"
                style={styles.action}
              >
                <Text style={[styles.actionText, { color: accent }]}>Sonraki semt →</Text>
              </Pressable>
            ) : null}
            {onExit !== undefined ? (
              <Pressable
                onPress={onExit}
                accessibilityRole="button"
                accessibilityLabel="Çarşıya dön"
                style={styles.action}
              >
                <Text style={[styles.actionText, { color: linkColor }]}>Çarşıya dön</Text>
              </Pressable>
            ) : null}
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
    gap: 10,
    paddingVertical: 12,
  },
  scores: { flexDirection: 'row', alignItems: 'flex-end', gap: 24 },
  scoreSlot: { alignItems: 'center' },
  combo: { fontSize: 16, fontWeight: '700' },
  playAreaSlot: { flex: 1, justifyContent: 'center', width: '100%' },
  gameOver: { alignItems: 'center', gap: 4 },
  gameOverText: { fontSize: 14, opacity: 0.7 },
  summary: { fontSize: 13, opacity: 0.8, textAlign: 'center' },
  postcard: { alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  // Material dokunma hedefi 48dp
  action: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
    justifyContent: 'center',
  },
  actionText: { fontSize: 16, fontWeight: '600' },
});
